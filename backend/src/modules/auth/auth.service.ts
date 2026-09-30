import { ConflictError, UnauthorizedError } from "../../lib/errors";
import { comparePassword, hashPassword } from "../../lib/password";
import { hasPrismaCode } from "../../lib/prisma-errors";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../lib/jwt";
import { createUser, findUserByEmail, findUserById } from "./auth.repository";
import type { LoginInput, SignupInput } from "./auth.schema";

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

export async function refresh(refreshToken: string) {
  let userId: string;
  try {
    userId = verifyRefreshToken(refreshToken).sub;
  } catch {
    throw new InvalidRefreshTokenError();
  }

  const user = await findUserById(userId);
  if (!user) {
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
