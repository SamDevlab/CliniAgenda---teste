import { Clock3, Info } from "lucide-react";

interface TimeSlotGridProps {
  slots: string[];
  selectedSlot: string;
  onSelect: (slot: string) => void;
  disabled?: boolean;
  emptyMessage?: string;
}

export function TimeSlotGrid({ slots, selectedSlot, onSelect, disabled = false, emptyMessage }: TimeSlotGridProps) {
  return (
    <section aria-labelledby="available-times-title">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="available-times-title" className="flex items-center gap-2 text-sm font-bold text-ink">
          <Clock3 size={17} className="text-sage" aria-hidden="true" />
          Horários disponíveis
        </h2>
        <span className="text-xs text-muted">Duração: 1 hora</span>
      </div>
      {slots.length ? (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3" role="group" aria-label="Horários disponíveis">
          {slots.map((slot) => {
            const isSelected = selectedSlot === slot;
            return (
              <button
                key={slot}
                type="button"
                className={`h-12 rounded-xl border text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-sage/15 ${
                  isSelected
                    ? "border-sage bg-sage text-white shadow-sm"
                    : "border-line bg-white text-ink hover:border-sage/60 hover:bg-sage-soft"
                }`}
                aria-pressed={isSelected}
                disabled={disabled}
                onClick={() => onSelect(slot)}
              >
                {slot}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-xl border border-dashed border-line bg-paper p-4 text-sm text-muted">
          <Info size={18} className="mt-0.5 shrink-0 text-sage" aria-hidden="true" />
          <span>{emptyMessage || "Nenhum horário está disponível para esta data."}</span>
        </div>
      )}
    </section>
  );
}
