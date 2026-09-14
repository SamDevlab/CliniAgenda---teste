import { CalendarHeart } from "lucide-react";

export function Brand() {
  return (
    <span className="flex items-center gap-2.5 font-display text-lg font-extrabold tracking-[-0.04em] text-ink">
      <span className="grid size-9 place-items-center rounded-xl bg-sage text-white shadow-sm">
        <CalendarHeart size={19} strokeWidth={2.2} aria-hidden="true" />
      </span>
      CliniAgenda
    </span>
  );
}

