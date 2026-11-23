import { MockExamRunner } from "./runner";
export default async function MockExamRunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <MockExamRunner examId={(await params).id} />;
}
