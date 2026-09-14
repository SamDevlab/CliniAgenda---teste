import { Router, type RequestHandler } from "express";
import { z } from "zod";
import { AppError } from "../errors.js";
import { appointmentInputSchema, appointmentQuerySchema } from "../schemas/appointmentSchemas.js";
import type { AppointmentRepository } from "../repositories/appointmentRepository.js";
import { parseBusinessDate, type AvailabilityService } from "../services/availabilityService.js";

const asyncRoute = (handler: RequestHandler): RequestHandler => (request, response, next) => {
  Promise.resolve(handler(request, response, next)).catch(next);
};

export function createAppointmentRouter(
  repository: AppointmentRepository,
  availabilityService: AvailabilityService,
): Router {
  const router = Router();

  router.get("/available", asyncRoute(async (request, response) => {
    const date = z.object({ date: z.string().min(1) }).safeParse(request.query);
    if (!date.success) {
      throw new AppError("INVALID_DATE", "Informe uma data no formato AAAA-MM-DD.");
    }
    response.json(await availabilityService.getAvailability(date.data.date));
  }));

  router.post("/appointments", asyncRoute(async (request, response) => {
    const parsed = appointmentInputSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Os dados informados são inválidos.");
    }

    const input = parsed.data;
    await availabilityService.validateBusinessDay(input.date);
    availabilityService.validateSlot(input.time);

    try {
      const appointment = repository.create({
        patientName: input.patientName,
        patientPhone: input.patientPhone,
        date: input.date,
        time: input.time,
      });
      response.status(201).json(appointment);
    } catch (error) {
      if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
        throw new AppError("APPOINTMENT_CONFLICT", "Este horário já está ocupado.", 409);
      }
      throw error;
    }
  }));

  router.get("/appointments", asyncRoute(async (request, response) => {
    const parsed = appointmentQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Os filtros são inválidos.");
    }
    if (parsed.data.date) {
      // A listagem também valida a data para evitar filtros silenciosamente inválidos.
      parseBusinessDate(parsed.data.date);
    }
    response.json(repository.list(parsed.data));
  }));

  router.patch("/appointments/:id/cancel", asyncRoute(async (request, response) => {
    const id = Number(request.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError("INVALID_APPOINTMENT_ID", "O identificador do agendamento é inválido.");
    }

    const appointment = repository.cancel(id);
    if (!appointment) {
      throw new AppError("APPOINTMENT_NOT_FOUND", "Agendamento não encontrado.", 404);
    }
    response.json(appointment);
  }));

  return router;
}
