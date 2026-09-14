interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function DatePicker({ value, onChange, label = "Data da consulta" }: DatePickerProps) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-ink" htmlFor="appointment-date">
      {label}
      <input
        id="appointment-date"
        className="h-12 rounded-xl border border-line bg-white px-4 text-sm font-medium text-ink outline-none transition focus:border-sage focus:ring-4 focus:ring-sage/10"
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
      />
    </label>
  );
}

