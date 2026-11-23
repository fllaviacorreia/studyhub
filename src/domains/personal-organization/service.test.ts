import { describe, expect, it, vi } from "vitest";

import { OrganizationError } from "./errors";
import {
  createOrganizationService,
  type OrganizationRepository,
} from "./service";

function repository(
  overrides: Partial<OrganizationRepository> = {},
): OrganizationRepository {
  return {
    listAreas: vi.fn().mockResolvedValue({ data: [] }),
    getArea: vi.fn().mockResolvedValue(null),
    createArea: vi.fn().mockResolvedValue({ id: "area" }),
    updateArea: vi.fn().mockResolvedValue(null),
    deleteArea: vi.fn().mockResolvedValue("not_found"),
    listObjectives: vi.fn().mockResolvedValue({ data: [] }),
    getObjective: vi.fn().mockResolvedValue(null),
    createObjective: vi.fn().mockResolvedValue(null),
    updateObjective: vi.fn().mockResolvedValue(null),
    deleteObjective: vi.fn().mockResolvedValue("not_found"),
    dashboard: vi.fn().mockResolvedValue({}),
    ...overrides,
  };
}

describe("personal organization service", () => {
  it("always forwards the authenticated actor to CRUD operations", async () => {
    const createArea = vi.fn().mockResolvedValue({ id: "area" });
    const repo = repository({ createArea });
    await createOrganizationService(repo).createArea("session-user", {
      name: "Área",
    });
    expect(createArea).toHaveBeenCalledWith("session-user", { name: "Área" });
  });

  it("completes the area CRUD without accepting an owner from input", async () => {
    const repo = repository({
      getArea: vi.fn().mockResolvedValue({ id: "area" }),
      updateArea: vi.fn().mockResolvedValue({ id: "area", name: "Nova" }),
      deleteArea: vi.fn().mockResolvedValue("deleted"),
    });
    const service = createOrganizationService(repo);
    await expect(service.getArea("actor", "area")).resolves.toEqual({
      id: "area",
    });
    await expect(
      service.updateArea("actor", "area", { name: "Nova" }),
    ).resolves.toMatchObject({ name: "Nova" });
    await expect(service.deleteArea("actor", "area")).resolves.toBeUndefined();
  });

  it("completes the goal CRUD in the actor scope", async () => {
    const repo = repository({
      createObjective: vi.fn().mockResolvedValue({ id: "goal" }),
      getObjective: vi.fn().mockResolvedValue({ id: "goal" }),
      updateObjective: vi
        .fn()
        .mockResolvedValue({ id: "goal", title: "Nova meta" }),
      deleteObjective: vi.fn().mockResolvedValue("deleted"),
    });
    const service = createOrganizationService(repo);
    const input = {
      studyAreaId: "c7c10b6a-8c51-4af2-b72a-96757cebe9ee",
      title: "Meta",
      type: "PERSONAL" as const,
      priority: 3,
    };
    await expect(service.createObjective("actor", input)).resolves.toEqual({
      id: "goal",
    });
    await expect(service.getObjective("actor", "goal")).resolves.toEqual({
      id: "goal",
    });
    await expect(
      service.updateObjective("actor", "goal", { title: "Nova meta" }),
    ).resolves.toMatchObject({ title: "Nova meta" });
    await expect(
      service.deleteObjective("actor", "goal"),
    ).resolves.toBeUndefined();
  });

  it("does not disclose another user's area or goal", async () => {
    const service = createOrganizationService(repository());
    await expect(
      service.getArea("other-user", "private-area"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      service.getObjective("other-user", "private-goal"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("rejects a goal associated with an area outside the actor scope", async () => {
    const service = createOrganizationService(repository());
    await expect(
      service.createObjective("actor", {
        studyAreaId: "c7c10b6a-8c51-4af2-b72a-96757cebe9ee",
        title: "Meta",
        type: "PERSONAL",
        priority: 3,
      }),
    ).rejects.toMatchObject({ code: "INVALID_DEPENDENCY" });
  });

  it("supports archive and restore through the same scoped update", async () => {
    const updateArea = vi.fn().mockResolvedValue({ id: "area" });
    const service = createOrganizationService(repository({ updateArea }));
    await service.updateArea("actor", "area", { status: "ARCHIVED" });
    await service.updateArea("actor", "area", { status: "ACTIVE" });
    expect(updateArea).toHaveBeenNthCalledWith(1, "actor", "area", {
      status: "ARCHIVED",
    });
    expect(updateArea).toHaveBeenNthCalledWith(2, "actor", "area", {
      status: "ACTIVE",
    });
  });

  it("blocks physical deletion of an area with linked goals", async () => {
    const service = createOrganizationService(
      repository({ deleteArea: vi.fn().mockResolvedValue("has_objectives") }),
    );
    await expect(service.deleteArea("actor", "area")).rejects.toEqual(
      expect.objectContaining<Partial<OrganizationError>>({ code: "CONFLICT" }),
    );
  });

  it("blocks physical deletion of a goal with historical records", async () => {
    const service = createOrganizationService(
      repository({ deleteObjective: vi.fn().mockResolvedValue("has_history") }),
    );
    await expect(
      service.deleteObjective("actor", "goal"),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("moves a goal only when the scoped repository accepts the destination", async () => {
    const updateObjective = vi
      .fn()
      .mockResolvedValue({ id: "goal", studyAreaId: "destination" });
    const service = createOrganizationService(repository({ updateObjective }));
    await service.updateObjective("actor", "goal", {
      studyAreaId: "c7c10b6a-8c51-4af2-b72a-96757cebe9ee",
    });
    expect(updateObjective).toHaveBeenCalledWith("actor", "goal", {
      studyAreaId: "c7c10b6a-8c51-4af2-b72a-96757cebe9ee",
    });
  });

  it("forwards filters and cursor pagination without identity input", async () => {
    const listObjectives = vi
      .fn()
      .mockResolvedValue({ data: [], page: { hasMore: false } });
    const service = createOrganizationService(repository({ listObjectives }));
    await service.listObjectives("actor", {
      limit: 10,
      status: "ACTIVE",
      priority: 5,
    });
    expect(listObjectives).toHaveBeenCalledWith("actor", {
      limit: 10,
      status: "ACTIVE",
      priority: 5,
    });
  });
});
