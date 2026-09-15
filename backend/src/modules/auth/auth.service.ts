import { hashPassword } from "../../lib/password";
import { createUser, findUserByEmail } from "./auth.repository";
import type { SignupInput } from "./auth.schema";

export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super("Email already registered");
    this.name = "EmailAlreadyRegisteredError";
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
