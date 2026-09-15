import "dotenv/config";

export const TIMEZONE = process.env.TIMEZONE || "America/Bahia";
export const PORT = Number(process.env.PORT || 3333);
export const DATABASE_PATH = process.env.DATABASE_PATH || "./data/cliniagenda.db";
export const NAGER_HOLIDAYS_URL =
  process.env.NAGER_HOLIDAYS_URL || "https://date.nager.at/api/v3/PublicHolidays";

