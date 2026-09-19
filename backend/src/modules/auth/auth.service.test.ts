import { describe, expect, it, vi } from "vitest";
import * as jwt from "../../lib/jwt";
import * as password from "../../lib/password";
import * as repository from "./auth.repository";
import {
  EmailAlreadyRegisteredError,
  InvalidRefreshTokenError,
  refresh,
  signup,
} from "./auth.service";

vi.mock("./auth.repository", () => ({
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
  createUser: vi.fn(),
}));
vi.mock("../../lib/password", () => ({
  hashPassword: vi.fn(),
  comparePassword: vi.fn(),
}));
vi.mock("../../lib/jwt", () => ({
  signAccessToken: vi.fn(),
  signRefreshToken: vi.fn(),
  verifyRefreshToken: vi.fn(),
}));

const existingUser = {
  id: "1",
  email: "a@b.com",
  passwordHash: "existing-hash",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("signup", () => {
  it("rejects a duplicate email", async () => {
    vi.mocked(repository.findUserByEmail).mockResolvedValue(existingUser);

    await expect(
      signup({ email: "a@b.com", password: "GoodPassword1" }),
    ).rejects.toThrow(EmailAlreadyRegisteredError);

    expect(repository.createUser).not.toHaveBeenCalled();
  });

  it("hashes the password before storing it", async () => {
    vi.mocked(repository.findUserByEmail).mockResolvedValue(null);
    vi.mocked(password.hashPassword).mockResolvedValue("hashed-value");
    vi.mocked(repository.createUser).mockResolvedValue({
      ...existingUser,
      passwordHash: "hashed-value",
    });

    await signup({ email: "new@example.com", password: "GoodPassword1" });

    expect(password.hashPassword).toHaveBeenCalledWith("GoodPassword1");
    expect(repository.createUser).toHaveBeenCalledWith({
      email: "new@example.com",
      passwordHash: "hashed-value",
    });
  });

  it("never returns the password hash", async () => {
    vi.mocked(repository.findUserByEmail).mockResolvedValue(null);
    vi.mocked(password.hashPassword).mockResolvedValue("hashed-value");
    vi.mocked(repository.createUser).mockResolvedValue({
      ...existingUser,
      passwordHash: "hashed-value",
    });

    const result = await signup({
      email: "new@example.com",
      password: "GoodPassword1",
    });

    expect(result).not.toHaveProperty("passwordHash");
  });
});

describe("refresh", () => {
  it("rejects an invalid or expired token", async () => {
    vi.mocked(jwt.verifyRefreshToken).mockImplementation(() => {
      throw new Error("invalid token");
    });

    await expect(refresh("bad-token")).rejects.toThrow(
      InvalidRefreshTokenError,
    );
  });

  it("rejects a valid token whose user no longer exists", async () => {
    vi.mocked(jwt.verifyRefreshToken).mockReturnValue({ sub: "1" });
    vi.mocked(repository.findUserById).mockResolvedValue(null);

    await expect(refresh("valid-token")).rejects.toThrow(
      InvalidRefreshTokenError,
    );
  });

  it("returns a new access token and the user on success", async () => {
    vi.mocked(jwt.verifyRefreshToken).mockReturnValue({ sub: "1" });
    vi.mocked(repository.findUserById).mockResolvedValue(existingUser);
    vi.mocked(jwt.signAccessToken).mockReturnValue("new-access-token");

    const result = await refresh("valid-token");

    expect(result).toEqual({
      accessToken: "new-access-token",
      user: {
        id: existingUser.id,
        email: existingUser.email,
        createdAt: existingUser.createdAt,
      },
    });
  });
});
