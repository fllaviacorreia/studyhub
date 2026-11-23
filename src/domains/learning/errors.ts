export type LearningErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "CONFLICT"
  | "INVALID_DEPENDENCY"
  | "INVALID_ANSWER";

export class LearningError extends Error {
  constructor(
    public readonly code: LearningErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "LearningError";
  }
}
