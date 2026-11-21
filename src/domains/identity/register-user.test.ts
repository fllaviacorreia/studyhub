import { describe, expect, it, vi } from "vitest";

import { createRegisterUser } from "./register-user";

describe("register user", () => {
  it("stores only the password hash and normalizes the e-mail", async () => {
    const create = vi.fn().mockResolvedValue({ id: "user-id" });
    const register = createRegisterUser({
      findByEmail: vi.fn().mockResolvedValue(null),
      create,
      hashPassword: vi.fn().mockResolvedValue("safe-hash"),
    });

    const result = await register({ name: "Pessoa", email: " PESSOA@example.com ", password: "senha123" });

    expect(result).toEqual({ ok: true, email: "pessoa@example.com" });
    expect(create).toHaveBeenCalledWith({ name: "Pessoa", email: "pessoa@example.com", passwordHash: "safe-hash" });
    expect(create.mock.calls[0][0]).not.toHaveProperty("password");
  });

  it("does not create a duplicate identity", async () => {
    const create = vi.fn();
    const register = createRegisterUser({
      findByEmail: vi.fn().mockResolvedValue({ id: "existing", email: "pessoa@example.com", name: null, passwordHash: "hash" }),
      create,
      hashPassword: vi.fn(),
    });

    const result = await register({ name: "Pessoa", email: "pessoa@example.com", password: "senha123" });

    expect(result.ok).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });
});
