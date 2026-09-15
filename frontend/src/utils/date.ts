export function getToday(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bahia",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function formatDate(date: string): string {
  const [year, month, day] = date.split("-");
  return day && month && year ? `${day}/${month}/${year}` : date;
}

export function formatDateLong(date: string): string {
  const parsed = new Date(`${date}T12:00:00`);
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(parsed);
}
