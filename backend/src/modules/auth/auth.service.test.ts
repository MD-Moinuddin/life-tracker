import { describe, expect, it, vi } from "vitest";
import * as password from "../../lib/password";
import * as repository from "./auth.repository";
import { EmailAlreadyRegisteredError, signup } from "./auth.service";

vi.mock("./auth.repository", () => ({
  findUserByEmail: vi.fn(),
  createUser: vi.fn(),
}));
vi.mock("../../lib/password", () => ({
  hashPassword: vi.fn(),
  comparePassword: vi.fn(),
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
