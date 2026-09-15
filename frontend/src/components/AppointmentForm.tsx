import { LoaderCircle, UserRound } from "lucide-react";
import type { ChangeEvent } from "react";

interface AppointmentFormProps {
  name: string;
  phone: string;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
}

export function AppointmentForm({ name, phone, onNameChange, onPhoneChange }: AppointmentFormProps) {
  return (
    <section className="grid gap-4 border-b border-line pb-6" aria-labelledby="patient-data-title">
      <div className="flex items-center gap-2 text-sm font-bold text-ink">
        <UserRound size={17} className="text-sage" aria-hidden="true" />
        <h3 id="patient-data-title">Seus dados</h3>
      </div>
      <label className="grid gap-2 text-sm font-semibold text-ink" htmlFor="patient-name">
        Nome completo
        <input
          id="patient-name"
          className="h-12 rounded-xl border border-line bg-white px-4 text-sm font-medium outline-none transition placeholder:text-muted/70 focus:border-sage focus:ring-4 focus:ring-sage/10"
          value={name}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onNameChange(event.target.value)}
          placeholder="Ex.: Maria Silva"
          autoComplete="name"
          required
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-ink" htmlFor="patient-phone">
        Telefone
        <input
          id="patient-phone"
          className="h-12 rounded-xl border border-line bg-white px-4 text-sm font-medium outline-none transition placeholder:text-muted/70 focus:border-sage focus:ring-4 focus:ring-sage/10"
          value={phone}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onPhoneChange(event.target.value)}
          placeholder="(71) 99999-9999"
          type="tel"
          autoComplete="tel"
          required
        />
      </label>
    </section>
  );
}

export function AppointmentSubmitButton({ loading, disabled }: { loading: boolean; disabled: boolean }) {
  return (
    <button
      className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink px-5 text-sm font-bold text-white transition hover:bg-sage-dark focus:outline-none focus:ring-4 focus:ring-sage/20 disabled:cursor-not-allowed disabled:opacity-50"
      type="submit"
      disabled={loading || disabled}
    >
      {loading && <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />}
      {loading ? "Confirmando..." : "Confirmar agendamento"}
    </button>
  );
}
