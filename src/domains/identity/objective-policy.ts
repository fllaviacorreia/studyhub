export type ObjectiveMemberRole = "OWNER" | "EDITOR" | "VIEWER";
export type ObjectiveAction = "read" | "update" | "archive" | "manageMembers";

export interface ObjectiveAccess {
  ownerId: string;
  members: ReadonlyArray<{
    userId: string;
    role: Exclude<ObjectiveMemberRole, "OWNER">;
  }>;
}

const permissions: Record<ObjectiveMemberRole, ReadonlySet<ObjectiveAction>> = {
  OWNER: new Set(["read", "update", "archive", "manageMembers"]),
  EDITOR: new Set(["read", "update", "archive"]),
  VIEWER: new Set(["read"]),
};

/**
 * Domain policy only. Callers must still scope the database query by actor.
 */
export function canAccessObjective(
  actorId: string,
  objective: ObjectiveAccess,
  action: ObjectiveAction,
): boolean {
  if (actorId === objective.ownerId) {
    return permissions.OWNER.has(action);
  }

  const membership = objective.members.find((member) => member.userId === actorId);

  return membership ? permissions[membership.role].has(action) : false;
}
