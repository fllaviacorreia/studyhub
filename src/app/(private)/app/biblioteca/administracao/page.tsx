import { redirect } from "next/navigation";
import { requireSessionActor } from "@/server/dal/session";
import { EditorialAdmin } from "./editorial-admin";
export default async function EditorialPage() {
  const actor = await requireSessionActor();
  if (actor.role === "USER") redirect("/app/biblioteca");
  return <EditorialAdmin />;
}
