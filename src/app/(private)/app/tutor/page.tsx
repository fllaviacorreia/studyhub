import { requireSessionActor } from "@/server/dal/session";
import { aiRepository } from "@/server/dal/ai";
import { TutorClient } from "./tutor-client";

export default async function TutorPage() {
  const actor = await requireSessionActor();
  const conversations = await aiRepository.listConversations(actor.id, {
    status: "ACTIVE",
    limit: 30,
  });
  return <TutorClient initialConversations={conversations.data} />;
}
