export const APPOINTMENT_STATUSES = ["CONFIRMED", "CANCELLED"] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

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

