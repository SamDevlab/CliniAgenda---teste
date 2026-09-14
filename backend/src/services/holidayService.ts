import { DateTime } from "luxon";
import { NAGER_HOLIDAYS_URL, TIMEZONE } from "../config.js";
import { HolidayServiceError } from "../errors.js";

interface NagerHoliday {
  date?: string;
  localName?: string;
  name?: string;
}

export interface Holiday {
  date: string;
  name: string;
}

export interface HolidayProvider {
  getHoliday(date: string): Promise<Holiday | null>;
}

export class HolidayService implements HolidayProvider {
  private readonly cache = new Map<number, Holiday[]>();

  constructor(
    private readonly baseUrl = NAGER_HOLIDAYS_URL,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  async getHoliday(date: string): Promise<Holiday | null> {
    const year = DateTime.fromISO(date, { zone: TIMEZONE }).year;
    const holidays = await this.getHolidays(year);
    return holidays.find((holiday) => holiday.date === date) || null;
  }

  private async getHolidays(year: number): Promise<Holiday[]> {
    const cached = this.cache.get(year);
    if (cached) return cached;

    try {
      const response = await this.fetcher(`${this.baseUrl.replace(/\/$/, "")}/${year}/BR`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`Nager.Date respondeu com HTTP ${response.status}.`);
      }

      const data = (await response.json()) as NagerHoliday[];
      if (!Array.isArray(data)) throw new Error("Resposta de feriados inválida.");

      const holidays = data
        .filter((holiday) => typeof holiday.date === "string")
        .map((holiday) => ({
          date: holiday.date as string,
          name: holiday.localName || holiday.name || "Feriado",
        }));
      this.cache.set(year, holidays);
      return holidays;
    } catch (error) {
      if (error instanceof HolidayServiceError) throw error;
      throw new HolidayServiceError(
        error instanceof Error ? `Não foi possível consultar os feriados: ${error.message}` : undefined,
      );
    }
  }
}

