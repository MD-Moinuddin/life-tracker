import { AppError, ConflictError, UnauthorizedError } from "../../lib/errors";
import { sendMail } from "../../lib/mail/send-mail";
import { buildResetPasswordEmail } from "../../lib/mail/reset-password-email";
import { comparePassword, hashPassword } from "../../lib/password";
import { hasPrismaCode } from "../../lib/prisma-errors";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../lib/jwt";
import {
  createUser,
  findLatestResetTokenCreatedAt,
  findUserByEmail,
  findUserById,
  replaceResetToken,
  resetPasswordWithToken,
} from "./auth.repository";
import type {
  LoginInput,
  ResetPasswordInput,
  SignupInput,
} from "./auth.schema";
import {
  createResetToken,
  hashResetToken,
  PASSWORD_RESET_COOLDOWN_MS,
  PASSWORD_RESET_TTL_MS,
} from "./reset-token";

export class EmailAlreadyRegisteredError extends ConflictError {
  constructor() {
    super("Email already registered");
  }
}

export class InvalidCredentialsError extends UnauthorizedError {
  constructor() {
    super("Invalid credentials");
  }
}

export class InvalidRefreshTokenError extends UnauthorizedError {
  constructor() {
    super("Invalid refresh token");
  }
}

export class InvalidResetTokenError extends AppError {
  constructor() {
    super(400, "This reset link is invalid or has expired.");
  }
}

export async function signup(input: SignupInput) {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new EmailAlreadyRegisteredError();
  }

  const passwordHash = await hashPassword(input.password);
  // The check above can race with a concurrent signup, so the unique index on
  // email is the real guard.
  const user = await createUser({
    name: input.name,
    email: input.email,
    passwordHash,
  }).catch((error: unknown) => {
    if (hasPrismaCode(error, "P2002")) {
      throw new EmailAlreadyRegisteredError();
    }
    throw error;
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

export async function login(input: LoginInput) {
  const user = await findUserByEmail(input.email);
  if (!user) {
    throw new InvalidCredentialsError();
  }

  const isValid = await comparePassword(input.password, user.passwordHash);
  if (!isValid) {
    throw new InvalidCredentialsError();
  }

  return {
    accessToken: signAccessToken(user.id),
    refreshToken: signRefreshToken(user.id),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
  };
}

// A refresh token issued before the last password change must stop working,
// so a reset ends every other session. `iat` is in seconds.
function wasIssuedBeforePasswordChange(
  issuedAt: number,
  passwordChangedAt: Date | null,
): boolean {
  return (
    passwordChangedAt !== null &&
    issuedAt < Math.floor(passwordChangedAt.getTime() / 1000)
  );
}

export async function refresh(refreshToken: string) {
  let claims: { sub: string; iat: number };
  try {
    claims = verifyRefreshToken(refreshToken);
  } catch {
    throw new InvalidRefreshTokenError();
  }

  const user = await findUserById(claims.sub);
  if (
    !user ||
    wasIssuedBeforePasswordChange(claims.iat, user.passwordChangedAt)
  ) {
    throw new InvalidRefreshTokenError();
  }

  return {
    accessToken: signAccessToken(user.id),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
  };
}

// Never reveals whether the email is registered: it returns the same way for
// every outcome, and the email is sent in the background so the response time
// does not depend on the mail provider.
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await findUserByEmail(email);
  if (!user) {
    return;
  }

  const now = new Date();
  const lastRequestAt = await findLatestResetTokenCreatedAt(user.id);
  if (
    lastRequestAt &&
    now.getTime() - lastRequestAt.getTime() < PASSWORD_RESET_COOLDOWN_MS
  ) {
    return;
  }

  const { token, tokenHash } = createResetToken();
  await replaceResetToken(
    {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(now.getTime() + PASSWORD_RESET_TTL_MS),
    },
    now,
  );

  void sendMail({
    to: user.email,
    ...buildResetPasswordEmail({
      token,
      expiresInMinutes: PASSWORD_RESET_TTL_MS / 60_000,
    }),
  }).catch((error: unknown) => {
    console.error("Failed to send the password reset email", error);
  });
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  const passwordHash = await hashPassword(input.password);
  const done = await resetPasswordWithToken({
    tokenHash: hashResetToken(input.token),
    passwordHash,
    now: new Date(),
  });
  if (!done) {
    throw new InvalidResetTokenError();
  }
}
