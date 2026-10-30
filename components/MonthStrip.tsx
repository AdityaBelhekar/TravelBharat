import { MONTHS, MONTH_NAMES } from "@/lib/format.ts";

// Twelve month cells with the best months to visit filled in.
export function MonthStrip({ best }: { best: number[] }) {
  const label = `Best months: ${best.map((m) => MONTH_NAMES[m - 1]).join(", ")}`;
  return (
    <div role="img" aria-label={label} className="grid grid-cols-12 gap-0.5">
      {MONTHS.map((m, i) => {
        const good = best.includes(i + 1);
        return (
          <span
            key={m}
            className={`grid h-9 place-items-center rounded-sm text-xs ${good ? "bg-foreground font-semibold text-background" : "bg-surface text-muted"}`}
          >
            {m.charAt(0)}
          </span>
        );
      })}
    </div>
  );
}
