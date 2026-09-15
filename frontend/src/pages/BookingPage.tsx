import { AlertCircle, ArrowRight, Check, CircleHelp, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { AppointmentForm } from "../components/AppointmentForm";
import { DatePicker } from "../components/DatePicker";
import { TimeSlotGrid } from "../components/TimeSlotGrid";
import { ApiError, createAppointment, getAvailability } from "../services/api";
import type { Appointment, AppointmentInput, Availability } from "../types/appointment";
import { formatDateLong, getToday } from "../utils/date";

function AvailabilityMessage({ availability }: { availability: Availability }) {
  if (availability.businessDay) return null;
  return (
    <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="status">
      <CircleHelp size={19} className="mt-0.5 shrink-0" aria-hidden="true" />
      <p>
        {availability.holiday
          ? <><strong>{availability.holiday}</strong> é feriado. Não há atendimento nesta data.</>
          : <>Não há atendimento aos sábados e domingos. Escolha um dia útil.</>}
      </p>
    </div>
  );
}

function Confirmation({ appointment, onNewAppointment }: { appointment: Appointment; onNewAppointment: () => void }) {
  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-sage/20 bg-white p-7 text-center shadow-card sm:p-12">
      <span className="mx-auto grid size-16 place-items-center rounded-full bg-sage-soft text-sage"><Check size={32} strokeWidth={2.5} aria-hidden="true" /></span>
      <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-sage">Agendamento confirmado</p>
      <h1 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.05em] text-ink sm:text-4xl">Até breve, {appointment.patientName.split(" ")[0]}.</h1>
      <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted">Sua consulta foi registrada. Anote os detalhes abaixo para não esquecer.</p>
      <div className="mx-auto mt-8 grid max-w-md grid-cols-2 divide-x divide-line rounded-2xl border border-line bg-paper p-5 text-left">
        <div className="pr-4"><p className="text-xs font-semibold text-muted">Data</p><p className="mt-1 font-display text-lg font-extrabold text-ink">{formatDateLong(appointment.date)}</p></div>
        <div className="pl-4"><p className="text-xs font-semibold text-muted">Horário</p><p className="mt-1 font-display text-lg font-extrabold text-ink">{appointment.time}</p></div>
      </div>
      <button type="button" onClick={onNewAppointment} className="mt-8 inline-flex items-center gap-2 rounded-xl border border-line px-5 py-3 text-sm font-bold text-ink transition hover:border-sage hover:text-sage focus:outline-none focus:ring-4 focus:ring-sage/10">Agendar outra consulta <ArrowRight size={16} /></button>
    </div>
  );
}

export function BookingPage() {
  const [date, setDate] = useState(getToday);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoadingAvailability(true);
    setSelectedTime("");
    setError("");
    getAvailability(date)
      .then((result) => { if (active) setAvailability(result); })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Não foi possível consultar os horários.");
      })
      .finally(() => { if (active) setLoadingAvailability(false); });
    return () => { active = false; };
  }, [date]);

  async function handleSubmit(input: AppointmentInput) {
    setSubmitting(true);
    setError("");
    try {
      setAppointment(await createAppointment(input));
    } catch (reason: unknown) {
      const message = reason instanceof ApiError && reason.code === "APPOINTMENT_CONFLICT"
        ? "Este horário acabou de ser reservado. Escolha outro horário."
        : reason instanceof Error ? reason.message : "Não foi possível confirmar o agendamento.";
      setError(message);
      if (reason instanceof ApiError && reason.code === "APPOINTMENT_CONFLICT") {
        const refreshed = await getAvailability(date);
        setAvailability(refreshed);
        setSelectedTime("");
      }
      throw reason;
    } finally {
      setSubmitting(false);
    }
  }

  function startOver() {
    setAppointment(null);
    setSelectedTime("");
    setError("");
  }

  if (appointment) return <Confirmation appointment={appointment} onNewAppointment={startOver} />;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:items-start">
      <section className="pt-2 lg:pt-8">
        <h1 className="max-w-xl font-display text-4xl font-extrabold leading-[1.08] tracking-[-0.06em] text-ink sm:text-5xl lg:text-6xl">Sua saúde merece um horário reservado para você.</h1>
        <p className="mt-6 max-w-lg text-base leading-7 text-muted">Escolha o melhor dia e horário para sua consulta.</p>
      </section>

      <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-7" aria-labelledby="booking-title">
        <div className="flex items-start justify-between gap-4">
          <div><h2 id="booking-title" className="mt-2 font-display text-2xl font-extrabold tracking-[-0.05em] text-ink">Agende sua consulta</h2></div>
        </div>
        <div className="mt-7"><DatePicker value={date} min={getToday()} onChange={setDate} /></div>
        {loadingAvailability ? (
          <div className="flex items-center gap-2 py-10 text-sm text-muted" role="status"><LoaderCircle size={18} className="animate-spin text-sage" /> Consultando horários...</div>
        ) : error && !availability ? (
          <div className="mt-5 flex items-start gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700" role="alert"><AlertCircle size={18} className="mt-0.5 shrink-0" />{error}</div>
        ) : availability ? (
          <>
            <AvailabilityMessage availability={availability} />
            {availability.businessDay && <div className="mt-7"><TimeSlotGrid slots={availability.availableSlots} selectedSlot={selectedTime} onSelect={setSelectedTime} emptyMessage={availability.unavailableMessage} /></div>}
            {availability.businessDay && availability.availableSlots.length > 0 && <AppointmentForm date={date} time={selectedTime} loading={submitting} onSubmit={handleSubmit} />}
            {error && availability && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">{error}</p>}
          </>
        ) : null}
      </section>
    </div>
  );
}
