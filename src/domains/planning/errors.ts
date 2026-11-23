export class PlanningError extends Error {
  constructor(
    public readonly code:
      "NOT_FOUND" | "CONFLICT" | "INVALID_DEPENDENCY" | "STALE_PREVIEW",
    message: string,
  ) {
    super(message);
  }
}
