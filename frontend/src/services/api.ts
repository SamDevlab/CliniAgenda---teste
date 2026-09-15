import type { Appointment, AppointmentInput, AppointmentStatus, Availability } from "../types/appointment";

const API_URL = import.meta.env.VITE_API_URL || "/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  const body = (await response.json().catch(() => null)) as { error?: string; message?: string } | T | null;
  if (!response.ok) {
    const errorBody = body as { error?: string; message?: string } | null;
    throw new ApiError(
      errorBody?.message || "Não foi possível concluir a operação.",
      errorBody?.error || "REQUEST_FAILED",
      response.status,
    );
  }
  return body as T;
}

export function getAvailability(date: string): Promise<Availability> {
  return request<Availability>(`/available?date=${encodeURIComponent(date)}`);
}

export function createAppointment(input: AppointmentInput): Promise<Appointment> {
  return request<Appointment>("/appointments", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export interface AppointmentFilters {
  date?: string;
  status?: AppointmentStatus | "";
  search?: string;
}

export function getAppointments(filters: AppointmentFilters = {}): Promise<Appointment[]> {
  const params = new URLSearchParams();
  if (filters.date) params.set("date", filters.date);
  if (filters.status) params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  const query = params.toString();
  return request<Appointment[]>(`/appointments${query ? `?${query}` : ""}`);
}

export function cancelAppointment(id: number): Promise<Appointment> {
  return request<Appointment>(`/appointments/${id}/cancel`, { method: "PATCH" });
}

