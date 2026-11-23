export class ReviewError extends Error {
  constructor(
    public readonly code:
      "NOT_FOUND" | "FORBIDDEN" | "CONFLICT" | "INVALID_STATE",
    message: string,
  ) {
    super(message);
  }
}
