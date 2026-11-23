export type AIErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "INVALID_STATE"
  | "RATE_LIMITED"
  | "PROVIDER_UNAVAILABLE"
  | "OUTPUT_INVALID";

export class AIError extends Error {
  constructor(
    public readonly code: AIErrorCode,
    message: string,
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
  }
}
