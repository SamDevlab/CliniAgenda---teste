export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class HolidayServiceError extends Error {
  constructor(message = "Não foi possível consultar os feriados no momento.") {
    super(message);
    this.name = "HolidayServiceError";
  }
}

