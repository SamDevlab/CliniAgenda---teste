import { DateTime } from "luxon";
import { TIMEZONE } from "../config.js";
import { AppError } from "../errors.js";
import type { AppointmentRepository } from "../repositories/appointmentRepository.js";
import type { HolidayProvider } from "./holidayService.js";

export const BUSINESS_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
] as const;

export interface Availability {
  date: string;
  timezone: string;
  businessDay: boolean;
  holiday: string | null;
  availableSlots: string[];
}

export function parseBusinessDate(date: string): DateTime {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new AppError("INVALID_DATE", "A data deve estar no formato AAAA-MM-DD.");
  }

  const parsed = DateTime.fromISO(date, { zone: TIMEZONE });
  if (!parsed.isValid || parsed.toFormat("yyyy-MM-dd") !== date) {
    throw new AppError("INVALID_DATE", "A data informada é inválida.");
  }
  return parsed;
}

export class AvailabilityService {
  constructor(
    private readonly repository: AppointmentRepository,
    private readonly holidayService: HolidayProvider,
  ) {}

  async getAvailability(date: string): Promise<Availability> {
    const parsedDate = parseBusinessDate(date);
    if (parsedDate.weekday === 6 || parsedDate.weekday === 7) {
      return {
        date,
        timezone: TIMEZONE,
        businessDay: false,
        holiday: null,
        availableSlots: [],
      };
    }

    const holiday = await this.holidayService.getHoliday(date);
    if (holiday) {
      return {
        date,
        timezone: TIMEZONE,
        businessDay: false,
        holiday: holiday.name,
        availableSlots: [],
      };
    }

    const occupiedSlots = new Set(this.repository.listConfirmedTimes(date));
    return {
      date,
      timezone: TIMEZONE,
      businessDay: true,
      holiday: null,
      availableSlots: BUSINESS_SLOTS.filter((slot) => !occupiedSlots.has(slot)),
    };
  }

  async validateBusinessDay(date: string): Promise<void> {
    const parsedDate = parseBusinessDate(date);
    if (parsedDate.weekday === 6 || parsedDate.weekday === 7) {
      throw new AppError("NON_BUSINESS_DAY", "Não é possível agendar aos finais de semana.");
    }

    const holiday = await this.holidayService.getHoliday(date);
    if (holiday) {
      throw new AppError("HOLIDAY", `Não é possível agendar em feriado: ${holiday.name}.`);
    }
  }

  validateSlot(time: string): void {
    if (!/^\d{2}:\d{2}$/.test(time)) {
      throw new AppError("INVALID_TIME", "O horário deve estar no formato HH:MM.");
    }
    if (!BUSINESS_SLOTS.includes(time as (typeof BUSINESS_SLOTS)[number])) {
      throw new AppError(
        "OUTSIDE_BUSINESS_HOURS",
        "Escolha um horário entre 08:00 e 17:00, em intervalos de uma hora.",
      );
    }
  }
}

