import { comparePassword, hashPassword } from "../../lib/password";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../lib/jwt";
import { createUser, findUserByEmail } from "./auth.repository";
import type { LoginInput, SignupInput } from "./auth.schema";

export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super("Email already registered");
    this.name = "EmailAlreadyRegisteredError";
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid credentials");
    this.name = "InvalidCredentialsError";
  }
}

export class InvalidRefreshTokenError extends Error {
  constructor() {
    super("Invalid refresh token");
    this.name = "InvalidRefreshTokenError";
  }
}

export async function signup(input: SignupInput) {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new EmailAlreadyRegisteredError();
  }

  const passwordHash = await hashPassword(input.password);
  const user = await createUser({ email: input.email, passwordHash });

  return { id: user.id, email: user.email, createdAt: user.createdAt };
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
    user: { id: user.id, email: user.email, createdAt: user.createdAt },
  };
}

export function refresh(refreshToken: string) {
  try {
    const payload = verifyRefreshToken(refreshToken);
    return { accessToken: signAccessToken(payload.sub) };
  } catch {
    throw new InvalidRefreshTokenError();
  }
}
