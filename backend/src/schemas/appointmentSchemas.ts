import { z } from "zod";

export const appointmentInputSchema = z.object({
  patientName: z.string().trim().min(2, "Informe o nome do paciente.").max(120),
  patientPhone: z
    .string()
    .trim()
    .min(10, "Informe um telefone válido.")
    .max(20, "Informe um telefone válido.")
    .regex(/^[\d\s()+-]+$/, "Informe um telefone válido."),
  date: z.string(),
  time: z.string(),
});

export const appointmentQuerySchema = z.object({
  date: z.string().optional(),
  status: z.enum(["CONFIRMED", "CANCELLED"]).optional(),
  search: z.string().trim().max(120).optional(),
});

