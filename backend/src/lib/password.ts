import bcrypt from "bcryptjs";
import { env } from "../config/env";

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, env.BCRYPT_COST);
}

export function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
