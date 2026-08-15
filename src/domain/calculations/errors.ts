export class DomainCalculationError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "DomainCalculationError";
  }
}
