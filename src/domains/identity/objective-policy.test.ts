import { describe, expect, it } from "vitest";

import { canAccessObjective, type ObjectiveAccess } from "./objective-policy";

const objective: ObjectiveAccess = {
  ownerId: "owner",
  members: [
    { userId: "editor", role: "EDITOR" },
    { userId: "viewer", role: "VIEWER" },
  ],
};

describe("objective authorization policy", () => {
  it("allows the owner to manage members", () => {
    expect(canAccessObjective("owner", objective, "manageMembers")).toBe(true);
  });

  it("allows an editor to update but not manage members", () => {
    expect(canAccessObjective("editor", objective, "update")).toBe(true);
    expect(canAccessObjective("editor", objective, "manageMembers")).toBe(false);
  });

  it("restricts a viewer to reading", () => {
    expect(canAccessObjective("viewer", objective, "read")).toBe(true);
    expect(canAccessObjective("viewer", objective, "archive")).toBe(false);
  });

  it("denies an unrelated user", () => {
    expect(canAccessObjective("other-user", objective, "read")).toBe(false);
  });
});
