import type { LucideIcon } from "lucide-react";

interface SummaryCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: "sage" | "coral" | "ink";
}

const toneClasses = {
  sage: "bg-sage-soft text-sage",
  coral: "bg-orange-50 text-coral",
  ink: "bg-slate-100 text-ink",
};

export function SummaryCard({ label, value, icon: Icon, tone }: SummaryCardProps) {
  return (
    <article className="rounded-2xl border border-line bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-muted">{label}</p>
        <span className={`grid size-9 place-items-center rounded-xl ${toneClasses[tone]}`}><Icon size={17} aria-hidden="true" /></span>
      </div>
      <p className="mt-4 font-display text-3xl font-extrabold tracking-[-0.05em] text-ink">{value}</p>
    </article>
  );
}

