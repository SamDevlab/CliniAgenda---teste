import { CalendarDays, ClipboardList, Filter, LoaderCircle, Search, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppointmentTable } from "../components/AppointmentTable";
import { DatePicker } from "../components/DatePicker";
import { SummaryCard } from "../components/SummaryCard";
import { ApiError, cancelAppointment, getAppointments } from "../services/api";
import type { Appointment, AppointmentStatus } from "../types/appointment";

export function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<AppointmentStatus | "">("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelingId, setCancelingId] = useState<number | null>(null);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setAppointments(await getAppointments({ date, status, search }));
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Não foi possível carregar os agendamentos.");
    } finally {
      setLoading(false);
    }
  }, [date, status, search]);

  useEffect(() => { void loadAppointments(); }, [loadAppointments]);

  async function handleCancel(id: number) {
    if (!window.confirm("Deseja realmente cancelar este agendamento? O registro será preservado no histórico.")) return;
    setCancelingId(id);
    setError("");
    try {
      const canceled = await cancelAppointment(id);
      setAppointments((current) => current.map((item) => item.id === id ? canceled : item));
    } catch (reason: unknown) {
      const message = reason instanceof ApiError ? reason.message : "Não foi possível cancelar o agendamento.";
      setError(message);
    } finally {
      setCancelingId(null);
    }
  }

  const summary = useMemo(() => ({
    total: appointments.length,
    confirmed: appointments.filter((item) => item.status === "CONFIRMED").length,
    canceled: appointments.filter((item) => item.status === "CANCELLED").length,
  }), [appointments]);

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-sage">Visão da clínica</p><h1 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.06em] text-ink sm:text-4xl">Gestão de agendamentos</h1><p className="mt-3 text-sm text-muted">Acompanhe a agenda e mantenha tudo sob controle.</p></div>
        <div className="flex items-center gap-2 text-xs font-semibold text-muted"><TrendingUp size={16} className="text-sage" /> Dados em tempo real</div>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-3" aria-label="Resumo dos agendamentos">
        <SummaryCard label="Total no filtro" value={summary.total} icon={ClipboardList} tone="ink" />
        <SummaryCard label="Confirmados" value={summary.confirmed} icon={CalendarDays} tone="sage" />
        <SummaryCard label="Cancelados" value={summary.canceled} icon={Filter} tone="coral" />
      </section>

      <section className="mt-8 overflow-hidden rounded-3xl border border-line bg-white shadow-card">
        <div className="border-b border-line p-5 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-bold text-ink"><Filter size={17} className="text-sage" /> Filtros da agenda</div>
          <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px_auto] md:items-end">
            <label className="grid gap-2 text-xs font-bold text-muted" htmlFor="search-patient">Paciente
              <span className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input id="search-patient" className="h-11 w-full rounded-xl border border-line bg-paper pl-9 pr-3 text-sm font-medium text-ink outline-none focus:border-sage focus:ring-4 focus:ring-sage/10" placeholder="Buscar por nome" value={search} onChange={(event) => setSearch(event.target.value)} /></span>
            </label>
            <DatePicker label="Data" value={date} onChange={setDate} />
            <label className="grid gap-2 text-xs font-bold text-muted" htmlFor="status-filter">Status
              <select id="status-filter" className="h-11 rounded-xl border border-line bg-paper px-3 text-sm font-medium text-ink outline-none focus:border-sage focus:ring-4 focus:ring-sage/10" value={status} onChange={(event) => setStatus(event.target.value as AppointmentStatus | "")}><option value="">Todos</option><option value="CONFIRMED">Confirmados</option><option value="CANCELLED">Cancelados</option></select>
            </label>
            <button type="button" className="h-11 rounded-xl bg-ink px-4 text-sm font-bold text-white transition hover:bg-sage-dark focus:outline-none focus:ring-4 focus:ring-sage/20" onClick={() => void loadAppointments()}>Filtrar</button>
          </div>
        </div>
        {error && <p className="m-5 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert"><LoaderCircle size={16} />{error}</p>}
        <div className={cancelingId ? "opacity-70" : ""}><AppointmentTable appointments={appointments} loading={loading} onCancel={(id) => void handleCancel(id)} /></div>
        {cancelingId && <p className="border-t border-line px-5 py-3 text-xs font-semibold text-muted">Salvando cancelamento...</p>}
      </section>
      <p className="mt-5 text-xs leading-5 text-muted">Exibindo datas no fuso America/Bahia. Registros cancelados permanecem no histórico.</p>
    </div>
  );
}
