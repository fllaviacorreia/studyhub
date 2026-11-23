import { describe, expect, it } from "vitest";
import { examinationInputSchema, objectiveCatalogLinkSchema, syllabusInputSchema } from "./schemas";

describe("catalog schemas", () => {
  it("rejects inverted registration dates", () => { expect(examinationInputSchema.safeParse({ organizationId: "10000000-0000-4000-8000-000000000001", title: "Concurso", registrationStartAt: "2027-02-01T00:00:00.000Z", registrationEndAt: "2027-01-01T00:00:00.000Z" }).success).toBe(false); });
  it("keeps unclassified hierarchical syllabus items", () => { const result = syllabusInputSchema.parse({ title: "Conteúdo", items: [{ title: "Bloco original", order: 0, children: [{ title: "Item sem classificação", order: 0 }] }] }); expect(result.items[0].children[0].topicId).toBeUndefined(); });
  it("does not accept positions without an examination", () => { expect(objectiveCatalogLinkSchema.safeParse({ examinationId: null, selections: [{ positionId: "40000000-0000-4000-8000-000000000001" }] }).success).toBe(false); });
});
