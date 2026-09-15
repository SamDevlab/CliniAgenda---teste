import type { SqliteDatabase } from "../database/database.js";
import type { Appointment, AppointmentStatus } from "../types.js";

interface AppointmentRow {
  id: number;
  patient_name: string;
  patient_phone: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  created_at: string;
  updated_at: string;
}

export interface AppointmentFilters {
  date?: string;
  status?: AppointmentStatus;
  search?: string;
}

function toAppointment(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    patientName: row.patient_name,
    patientPhone: row.patient_phone,
    date: row.date,
    time: row.time,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class AppointmentRepository {
  constructor(private readonly database: SqliteDatabase) {}

  list(filters: AppointmentFilters = {}): Appointment[] {
    const conditions: string[] = [];
    const parameters: string[] = [];

    if (filters.date) {
      conditions.push("date = ?");
      parameters.push(filters.date);
    }
    if (filters.status) {
      conditions.push("status = ?");
      parameters.push(filters.status);
    }
    if (filters.search) {
      conditions.push("patient_name LIKE ? COLLATE NOCASE");
      parameters.push(`%${filters.search}%`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const rows = this.database
      .prepare(
        `SELECT id, patient_name, patient_phone, date, time, status, created_at, updated_at
         FROM appointments ${where}
         ORDER BY date ASC, time ASC, id ASC`,
      )
      .all(parameters) as unknown as AppointmentRow[];

    return rows.map(toAppointment);
  }

  listConfirmedTimes(date: string): string[] {
    const rows = this.database
      .prepare("SELECT time FROM appointments WHERE date = ? AND status = 'CONFIRMED'")
      .all([date]) as unknown as Array<{ time: string }>;
    return rows.map((row) => row.time);
  }

  findById(id: number): Appointment | null {
    const row = this.database
      .prepare(
        "SELECT id, patient_name, patient_phone, date, time, status, created_at, updated_at FROM appointments WHERE id = ?",
      )
      .get([id]) as AppointmentRow | undefined;
    return row ? toAppointment(row) : null;
  }

  create(input: Omit<Appointment, "id" | "status" | "createdAt" | "updatedAt">): Appointment {
    const now = new Date().toISOString();
    const insert = this.database.prepare(
      `INSERT INTO appointments
       (patient_name, patient_phone, date, time, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'CONFIRMED', ?, ?)`,
    );

    const transaction = this.database.transaction(() => {
      const result = insert.run([input.patientName, input.patientPhone, input.date, input.time, now, now]);
      return this.findById(Number(result.lastInsertRowid));
    });

    const appointment = transaction;
    if (!appointment) {
      throw new Error("O agendamento não pôde ser recuperado após a criação.");
    }
    return appointment;
  }

  cancel(id: number): Appointment | null {
    const transaction = this.database.transaction(() => {
      const current = this.findById(id);
      if (!current || current.status === "CANCELLED") return current;

      this.database
        .prepare("UPDATE appointments SET status = 'CANCELLED', updated_at = ? WHERE id = ?")
        .run([new Date().toISOString(), id]);
      return this.findById(id);
    });

    return transaction;
  }

  close(): void {
    this.database.close();
  }
}
