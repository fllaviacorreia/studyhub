export class MockExamError extends Error {
  constructor(
    public readonly code:
      | "NOT_FOUND"
      | "FORBIDDEN"
      | "CONFLICT"
      | "INVALID_STATE"
      | "INSUFFICIENT_QUESTIONS"
      | "EXPIRED",
    message: string,
  ) {
    super(message);
  }
}
