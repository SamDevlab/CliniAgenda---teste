import { CalendarX2, LoaderCircle, X } from "lucide-react";
import type { Appointment } from "../types/appointment";
import { formatDate } from "../utils/date";
import { StatusBadge } from "./StatusBadge";

interface AppointmentTableProps {
  appointments: Appointment[];
  loading: boolean;
  onCancel: (id: number) => void;
}

export function AppointmentTable({ appointments, loading, onCancel }: AppointmentTableProps) {
  if (loading) {
    return <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-muted"><LoaderCircle size={19} className="animate-spin text-sage" /> Carregando agenda...</div>;
  }
  if (!appointments.length) {
    return <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center text-sm text-muted"><CalendarX2 size={28} className="text-sage/70" /><p>Nenhum agendamento encontrado.</p></div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead className="border-b border-line text-xs uppercase tracking-[0.08em] text-muted">
          <tr>
            <th className="px-5 py-4 font-bold">Horário</th>
            <th className="px-5 py-4 font-bold">Paciente</th>
            <th className="px-5 py-4 font-bold">Telefone</th>
            <th className="px-5 py-4 font-bold">Data</th>
            <th className="px-5 py-4 font-bold">Status</th>
            <th className="px-5 py-4 text-right font-bold">Ação</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {appointments.map((appointment) => (
            <tr key={appointment.id} className="text-ink transition hover:bg-paper">
              <td className="px-5 py-4 font-display font-extrabold">{appointment.time}</td>
              <td className="px-5 py-4 font-semibold">{appointment.patientName}</td>
              <td className="px-5 py-4 text-muted">{appointment.patientPhone}</td>
              <td className="px-5 py-4 text-muted">{formatDate(appointment.date)}</td>
              <td className="px-5 py-4"><StatusBadge status={appointment.status} /></td>
              <td className="px-5 py-4 text-right">
                {appointment.status === "CONFIRMED" ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold text-coral transition hover:bg-orange-50 focus:outline-none focus:ring-4 focus:ring-orange-100"
                    onClick={() => onCancel(appointment.id)}
                    aria-label={`Cancelar agendamento de ${appointment.patientName}`}
                  >
                    <X size={14} aria-hidden="true" /> Cancelar
                  </button>
                ) : <span className="text-xs text-muted">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

