import { describe, expect, it } from "vitest";

import { loginSchema, registrationSchema } from "./auth-schemas";

describe("authentication schemas", () => {
  it("normalizes an e-mail before authentication", () => {
    const result = loginSchema.parse({
      email: " Pessoa@Example.COM ",
      password: "secret",
    });
    expect(result.email).toBe("pessoa@example.com");
  });

  it("rejects weak registration passwords", () => {
    const result = registrationSchema.safeParse({
      name: "Pessoa",
      email: "pessoa@example.com",
      password: "somenteletras",
    });
    expect(result.success).toBe(false);
  });
});
