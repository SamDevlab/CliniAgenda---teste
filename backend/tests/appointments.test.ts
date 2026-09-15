import request from "supertest";
import { DateTime } from "luxon";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { TIMEZONE } from "../src/config.js";
import { HolidayServiceError } from "../src/errors.js";
import type { Holiday, HolidayProvider } from "../src/services/holidayService.js";

const WEEKDAY = "2026-09-16";
const SATURDAY = "2026-09-19";
const SUNDAY = "2026-09-20";
const HOLIDAY = "2026-09-07";

function createHolidayProvider(holidays: Record<string, Holiday> = {}): HolidayProvider {
  return {
    getHoliday: vi.fn(async (date: string) => holidays[date] || null),
  };
}

function validAppointment(time = "10:00") {
  return {
    patientName: "Paciente Exemplo",
    patientPhone: "00000000000",
    date: WEEKDAY,
    time,
  };
}

describe("API de agendamentos", () => {
  let app: Awaited<ReturnType<typeof createApp>>;
  let now: DateTime;

  beforeEach(async () => {
    now = DateTime.fromISO("2026-09-14T07:30:00", { zone: TIMEZONE });
    app = await createApp({ databasePath: ":memory:", holidayService: createHolidayProvider({
      [HOLIDAY]: { date: HOLIDAY, name: "Independência do Brasil" },
    }), nowProvider: () => now });
  });

  afterEach(() => {
    app.locals.close();
  });

  it("retorna os horários em um dia útil", async () => {
    const response = await request(app).get(`/available?date=${WEEKDAY}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      date: WEEKDAY,
      timezone: "America/Bahia",
      businessDay: true,
      holiday: null,
    });
    expect(response.body.availableSlots).toHaveLength(10);
    expect(response.body.availableSlots).toContain("08:00");
    expect(response.body.availableSlots).toContain("17:00");
  });

  it("não oferece horários que já começaram hoje", async () => {
    now = DateTime.fromISO("2026-09-14T08:01:00", { zone: TIMEZONE });

    const response = await request(app).get("/available?date=2026-09-14");

    expect(response.status).toBe(200);
    expect(response.body.availableSlots).not.toContain("08:00");
    expect(response.body.availableSlots).toContain("09:00");
  });

  it("não oferece horários para uma data passada", async () => {
    const response = await request(app).get("/available?date=2026-09-11");

    expect(response.status).toBe(200);
    expect(response.body.availableSlots).toEqual([]);
    expect(response.body.unavailableMessage).toBe("Esta data já passou. Escolha outra data.");
  });

  it.each([
    ["sábado", SATURDAY],
    ["domingo", SUNDAY],
  ])("não retorna horários no %s", async (_label, date) => {
    const response = await request(app).get(`/available?date=${date}`);

    expect(response.status).toBe(200);
    expect(response.body.businessDay).toBe(false);
    expect(response.body.availableSlots).toEqual([]);
  });

  it("não retorna horários em feriado", async () => {
    const response = await request(app).get(`/available?date=${HOLIDAY}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ businessDay: false, holiday: "Independência do Brasil", availableSlots: [] });
  });

  it("cria um agendamento válido com status confirmado", async () => {
    const response = await request(app).post("/appointments").send(validAppointment());

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ ...validAppointment(), status: "CONFIRMED" });
    expect(response.body.id).toEqual(expect.any(Number));
    expect(response.body.createdAt).toEqual(expect.any(String));
  });

  it("rejeita uma consulta em um horário que já passou hoje", async () => {
    now = DateTime.fromISO("2026-09-14T08:01:00", { zone: TIMEZONE });

    const response = await request(app).post("/appointments").send({
      ...validAppointment("08:00"),
      date: "2026-09-14",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("APPOINTMENT_IN_PAST");
  });

  it("rejeita uma consulta em uma data passada", async () => {
    const response = await request(app).post("/appointments").send({
      ...validAppointment("10:00"),
      date: "2026-09-11",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("APPOINTMENT_IN_PAST");
  });

  it("retorna conflito quando o horário está ocupado", async () => {
    await request(app).post("/appointments").send(validAppointment("11:00"));
    const response = await request(app).post("/appointments").send(validAppointment("11:00"));

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: "APPOINTMENT_CONFLICT", message: "Este horário já está ocupado." });
  });

  it("aceita apenas uma reserva quando duas requisições disputam o mesmo slot", async () => {
    const responses = await Promise.all([
      request(app).post("/appointments").send(validAppointment("15:00")),
      request(app).post("/appointments").send(validAppointment("15:00")),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
  });

  it.each([
    ["data inválida", { date: "2026-02-30", time: "10:00" }, "INVALID_DATE"],
    ["horário inválido", { date: WEEKDAY, time: "10h" }, "INVALID_TIME"],
    ["horário fora de funcionamento", { date: WEEKDAY, time: "18:00" }, "OUTSIDE_BUSINESS_HOURS"],
  ])("rejeita %s", async (_label, input, code) => {
    const response = await request(app).post("/appointments").send({ ...validAppointment(), ...input });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(code);
  });

  it("rejeita agendamento em final de semana e feriado", async () => {
    const weekend = await request(app).post("/appointments").send({ ...validAppointment(), date: SATURDAY });
    const holiday = await request(app).post("/appointments").send({ ...validAppointment(), date: HOLIDAY });

    expect(weekend.status).toBe(400);
    expect(weekend.body.error).toBe("NON_BUSINESS_DAY");
    expect(holiday.status).toBe(400);
    expect(holiday.body.error).toBe("HOLIDAY");
  });

  it("lista os agendamentos persistidos e aceita filtros", async () => {
    await request(app).post("/appointments").send(validAppointment("08:00"));
    await request(app).post("/appointments").send({ ...validAppointment("09:00"), patientName: "Maria Souza" });

    const all = await request(app).get("/appointments");
    const filtered = await request(app).get(`/appointments?date=${WEEKDAY}&search=Maria&status=CONFIRMED`);

    expect(all.status).toBe(200);
    expect(all.body).toHaveLength(2);
    expect(filtered.status).toBe(200);
    expect(filtered.body).toHaveLength(1);
    expect(filtered.body[0].patientName).toBe("Maria Souza");
  });

  it("cancela sem apagar o registro e libera o horário", async () => {
    const created = await request(app).post("/appointments").send(validAppointment("13:00"));
    const canceled = await request(app).patch(`/appointments/${created.body.id}/cancel`);
    const available = await request(app).get(`/available?date=${WEEKDAY}`);
    const history = await request(app).get(`/appointments?status=CANCELLED`);

    expect(canceled.status).toBe(200);
    expect(canceled.body.status).toBe("CANCELLED");
    expect(available.body.availableSlots).toContain("13:00");
    expect(history.body).toHaveLength(1);
  });

  it("torna o cancelamento idempotente", async () => {
    const created = await request(app).post("/appointments").send(validAppointment("14:00"));
    const first = await request(app).patch(`/appointments/${created.body.id}/cancel`);
    const second = await request(app).patch(`/appointments/${created.body.id}/cancel`);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body.status).toBe("CANCELLED");
  });

  it("retorna 404 ao cancelar um ID inexistente", async () => {
    const response = await request(app).patch("/appointments/999/cancel");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("APPOINTMENT_NOT_FOUND");
  });

  it("trata falha da API de feriados com 502", async () => {
    app.locals.close();
    app = await createApp({
      databasePath: ":memory:",
      holidayService: { getHoliday: vi.fn(async () => { throw new HolidayServiceError(); }) },
    });

    const response = await request(app).get(`/available?date=${WEEKDAY}`);

    expect(response.status).toBe(502);
    expect(response.body.error).toBe("HOLIDAY_SERVICE_UNAVAILABLE");
  });
});
