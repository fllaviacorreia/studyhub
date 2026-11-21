export class OrganizationError extends Error {
  constructor(
    public readonly code: "NOT_FOUND" | "CONFLICT" | "INVALID_DEPENDENCY",
    message: string,
  ) {
    super(message);
  }
}
