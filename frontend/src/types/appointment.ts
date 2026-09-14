export type AppointmentStatus = "CONFIRMED" | "CANCELLED";

export interface Appointment {
  id: number;
  patientName: string;
  patientPhone: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Availability {
  date: string;
  timezone: string;
  businessDay: boolean;
  holiday: string | null;
  availableSlots: string[];
}

export interface AppointmentInput {
  patientName: string;
  patientPhone: string;
  date: string;
  time: string;
}

