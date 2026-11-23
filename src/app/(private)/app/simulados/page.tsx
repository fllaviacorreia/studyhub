import { requireSessionActor } from "@/server/dal/session";
import { mockExamRepository } from "@/server/dal/mock-exams";
import { catalogRepository } from "@/server/dal/catalog";
import { MockExamCenter } from "./mock-exam-center";
export default async function MockExamsPage() {
  const actor = await requireSessionActor();
  const [exams, subjects] = await Promise.all([
    mockExamRepository.list(actor.id, { limit: 100 }),
    catalogRepository.listSubjects({ limit: 100 }, actor.role !== "USER"),
  ]);
  return (
    <MockExamCenter
      exams={exams.items}
      subjects={
        (subjects as { items: Array<{ id: string; name: string }> }).items
      }
    />
  );
}
