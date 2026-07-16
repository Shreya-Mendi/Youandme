import { Activity, Flame, Leaf } from "lucide-react";
import { useStore } from "../store";
import { averageGrade, healthGrade } from "../lib/nutrition";
import { Card, HealthBadge, SectionLabel, StickerDots } from "./ui";

export function HealthSummary() {
  const { plan, recipes } = useStore();

  const planned = plan
    .map((d) => (d.recipeId ? recipes.find((r) => r.id === d.recipeId) : null))
    .filter((r): r is NonNullable<typeof r> => Boolean(r));

  const grades = planned.map(healthGrade);
  const avg = averageGrade(grades);
  const totalCalories = planned.reduce((s, r) => s + r.calories, 0);
  const totalProtein = planned.reduce((s, r) => s + r.protein, 0);
  const days = plan.length;
  const avgCalories = days ? Math.round(totalCalories / days) : 0;
  const avgProtein = days ? Math.round(totalProtein / days) : 0;

  return (
    <Card highlighted className="p-5">
      <StickerDots className="mb-3" />
      <div className="mb-4 flex items-center justify-between">
        <SectionLabel>Week health index</SectionLabel>
        {avg ? (
          <HealthBadge grade={avg} className="h-7 w-7 text-sm" />
        ) : (
          <span className="text-xs font-semibold text-ink/40">no meals yet</span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Metric
          icon={<Leaf className="h-4 w-4 text-teal-500" />}
          label="Avg grade"
          value={avg ?? "—"}
        />
        <Metric
          icon={<Flame className="h-4 w-4 text-teal-500" />}
          label="Avg kcal/day"
          value={avgCalories ? String(avgCalories) : "—"}
        />
        <Metric
          icon={<Activity className="h-4 w-4 text-teal-500" />}
          label="Avg protein/day"
          value={avgProtein ? `${avgProtein}g` : "—"}
        />
      </div>
    </Card>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white/80 p-3 ring-1 ring-black/5">
      <div className="mb-1 flex items-center gap-1.5">
        {icon}
        <span className="text-[11px] font-bold text-ink/50">{label}</span>
      </div>
      <p className="font-display text-xl font-extrabold tracking-tight text-ink">
        {value}
      </p>
    </div>
  );
}
