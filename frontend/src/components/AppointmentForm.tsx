import { LoaderCircle, UserRound } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import type { AppointmentInput } from "../types/appointment";

interface AppointmentFormProps {
  date: string;
  time: string;
  loading: boolean;
  onSubmit: (input: AppointmentInput) => Promise<void>;
}

export function AppointmentForm({ date, time, loading, onSubmit }: AppointmentFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  useEffect(() => setError(""), [date, time]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim().length < 2) {
      setError("Informe o nome do paciente.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      setError("Informe um telefone válido.");
      return;
    }
    setError("");
    try {
      await onSubmit({ patientName: name.trim(), patientPhone: phone.trim(), date, time });
    } catch {
      // A mensagem de erro é exibida pela tela, mantendo o formulário preenchido.
    }
  }

  return (
    <form className="mt-7 grid gap-4 border-t border-line pt-6" onSubmit={handleSubmit} noValidate>
      <div className="flex items-center gap-2 text-sm font-bold text-ink">
        <UserRound size={17} className="text-sage" aria-hidden="true" />
        Seus dados
      </div>
      <label className="grid gap-2 text-sm font-semibold text-ink" htmlFor="patient-name">
        Nome completo
        <input
          id="patient-name"
          className="h-12 rounded-xl border border-line bg-white px-4 text-sm font-medium outline-none transition placeholder:text-muted/70 focus:border-sage focus:ring-4 focus:ring-sage/10"
          value={name}
          onChange={(event) => setName(event.target.value)}
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
          onChange={(event) => setPhone(event.target.value)}
          placeholder="(71) 99999-9999"
          type="tel"
          autoComplete="tel"
          required
        />
      </label>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">{error}</p>}
      <button
        className="mt-1 flex h-12 items-center justify-center gap-2 rounded-xl bg-ink px-5 text-sm font-bold text-white transition hover:bg-sage-dark focus:outline-none focus:ring-4 focus:ring-sage/20 disabled:cursor-not-allowed disabled:opacity-50"
        type="submit"
        disabled={loading || !time}
      >
        {loading && <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />}
        {loading ? "Confirmando..." : "Confirmar agendamento"}
      </button>
    </form>
  );
}
