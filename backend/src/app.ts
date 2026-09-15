import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import type { DateTime } from "luxon";
import { ZodError } from "zod";
import { DATABASE_PATH } from "./config.js";
import { createDatabase } from "./database/database.js";
import { AppError, HolidayServiceError } from "./errors.js";
import { AppointmentRepository } from "./repositories/appointmentRepository.js";
import { createAppointmentRouter } from "./routes/appointments.js";
import { AvailabilityService } from "./services/availabilityService.js";
import { HolidayService, type HolidayProvider } from "./services/holidayService.js";

export interface AppOptions {
  databasePath?: string;
  holidayService?: HolidayProvider;
  nowProvider?: () => DateTime;
}

export async function createApp(options: AppOptions = {}) {
  const database = await createDatabase(options.databasePath || DATABASE_PATH);
  const repository = new AppointmentRepository(database);
  const holidayService = options.holidayService || new HolidayService();
  const availabilityService = new AvailabilityService(repository, holidayService, options.nowProvider);
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "100kb" }));
  app.get("/health", (_request, response) => response.json({ status: "ok" }));
  app.use(createAppointmentRouter(repository, availabilityService));

  app.use((_request, response) => {
    response.status(404).json({ error: "NOT_FOUND", message: "Rota não encontrada." });
  });

  const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
    void next;
    if (error instanceof AppError) {
      response.status(error.statusCode).json({ error: error.code, message: error.message });
      return;
    }
    if (error instanceof ZodError) {
      response.status(400).json({ error: "VALIDATION_ERROR", message: error.issues[0]?.message || "Dados inválidos." });
      return;
    }
    if (error instanceof HolidayServiceError) {
      response.status(502).json({ error: "HOLIDAY_SERVICE_UNAVAILABLE", message: error.message });
      return;
    }
    if (error instanceof SyntaxError) {
      response.status(400).json({ error: "INVALID_JSON", message: "O corpo da requisição não é um JSON válido." });
      return;
    }
    console.error(error);
    response.status(500).json({ error: "INTERNAL_ERROR", message: "Ocorreu um erro inesperado." });
  };
  app.use(errorHandler);

  app.locals.close = () => repository.close();
  return app;
}
