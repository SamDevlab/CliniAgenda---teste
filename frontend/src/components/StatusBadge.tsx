import type { AppointmentStatus } from "../types/appointment";

const labels: Record<AppointmentStatus, string> = {
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${status === "CONFIRMED" ? "bg-sage-soft text-sage-dark" : "bg-slate-100 text-slate-500"}`}>
      {labels[status]}
    </span>
  );
}

