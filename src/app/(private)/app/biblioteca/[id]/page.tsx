import { notFound } from "next/navigation";
import { learningRepository } from "@/server/dal/learning";
import { requireSessionActor } from "@/server/dal/session";
import { MaterialReader } from "./reader";

export default async function MaterialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireSessionActor();
  const material = await learningRepository.getMaterial(
    actor,
    (await params).id,
  );
  if (!material) notFound();
  return (
    <MaterialReader
      material={{
        id: material.id,
        title: material.title,
        summary: material.summary,
        content: material.versions[0]?.content ?? "",
        estimatedMinutes: material.estimatedMinutes,
        progress: material.progress[0] ?? null,
        sources: material.sources.map((s) => ({
          ...s,
          publicationDate: s.publicationDate?.toISOString() ?? null,
        })),
      }}
    />
  );
}
