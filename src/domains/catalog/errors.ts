export type CatalogErrorCode =
  "NOT_FOUND" | "FORBIDDEN" | "CONFLICT" | "INVALID_DEPENDENCY";

export class CatalogError extends Error {
  constructor(
    public readonly code: CatalogErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "CatalogError";
  }
}
