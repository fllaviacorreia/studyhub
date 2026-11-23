import { describe, expect, it, vi } from "vitest";
import { createCatalogService, type CatalogRepository } from "./service";

function repository(
  overrides: Partial<CatalogRepository> = {},
): CatalogRepository {
  return {
    listOrganizations: vi.fn(),
    getOrganization: vi.fn(),
    createOrganization: vi.fn(),
    updateOrganization: vi.fn(),
    listExamBoards: vi.fn(),
    createExamBoard: vi.fn(),
    listExaminations: vi.fn(),
    getExamination: vi.fn(),
    createExamination: vi.fn(),
    updateExamination: vi.fn(),
    createPosition: vi.fn(),
    createNotice: vi.fn(),
    createNoticeVersion: vi.fn(),
    listSubjects: vi.fn(),
    getSubjectTopics: vi.fn(),
    createSubject: vi.fn(),
    createTopic: vi.fn(),
    createSyllabus: vi.fn(),
    linkObjective: vi.fn(),
    ...overrides,
  };
}
const user = { id: "user", role: "USER" as const };
const curator = { id: "curator", role: "CURATOR" as const };

describe("catalog service", () => {
  it("allows authenticated users to read only through the published view", async () => {
    const listExaminations = vi.fn().mockResolvedValue({ data: [] });
    await createCatalogService(
      repository({ listExaminations }),
    ).listExaminations(user, { limit: 20 });
    expect(listExaminations).toHaveBeenCalledWith({ limit: 20 }, false);
  });
  it("lets curators see review records", async () => {
    const listExaminations = vi.fn().mockResolvedValue({ data: [] });
    await createCatalogService(
      repository({ listExaminations }),
    ).listExaminations(curator, { limit: 20 });
    expect(listExaminations).toHaveBeenCalledWith({ limit: 20 }, true);
  });
  it("blocks common users from changing the global catalog", () => {
    expect(() =>
      createCatalogService(repository()).createOrganization(user, {
        name: "Instituição",
        country: "BR",
      }),
    ).toThrow(expect.objectContaining({ code: "FORBIDDEN" }));
  });
  it("allows an editor to create catalog records", async () => {
    const createOrganization = vi.fn().mockResolvedValue({ id: "org" });
    await createCatalogService(
      repository({ createOrganization }),
    ).createOrganization(curator, { name: "Instituição", country: "BR" });
    expect(createOrganization).toHaveBeenCalledOnce();
  });
  it("always scopes objective links with the session actor", async () => {
    const linkObjective = vi.fn().mockResolvedValue("updated");
    await createCatalogService(repository({ linkObjective })).linkObjective(
      user,
      "goal",
      { examinationId: null, selections: [] },
    );
    expect(linkObjective).toHaveBeenCalledWith("user", "goal", {
      examinationId: null,
      selections: [],
    });
  });
  it("rejects incompatible objective associations", async () => {
    const linkObjective = vi.fn().mockResolvedValue("invalid");
    await expect(
      createCatalogService(repository({ linkObjective })).linkObjective(
        user,
        "goal",
        {
          examinationId: "10000000-0000-4000-8000-000000000001",
          selections: [],
        },
      ),
    ).rejects.toMatchObject({ code: "INVALID_DEPENDENCY" });
  });
});
