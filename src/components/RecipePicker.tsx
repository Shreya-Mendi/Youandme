import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import type { Recipe } from "../types";
import { healthGrade } from "../lib/nutrition";
import { HealthBadge, Input } from "./ui";

export function RecipePicker({
  recipes,
  title = "Pick a meal",
  onPick,
  onClose,
  onFreeText,
}: {
  recipes: Recipe[];
  title?: string;
  onPick: (recipe: Recipe) => void;
  onClose: () => void;
  onFreeText?: (text: string) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.cuisine.toLowerCase().includes(q) ||
        r.tags.some((t) => t.includes(q)) ||
        r.ingredients.some((i) => i.toLowerCase().includes(q))
    );
  }, [recipes, query]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-sticker-lg border border-black/5 bg-white shadow-sticker-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-black/5 p-4">
          <h3 className="font-display text-lg font-extrabold tracking-tight text-ink">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-ink/40 hover:bg-black/5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-ink/40" />
            <Input
              value={query}
              onChange={setQuery}
              placeholder="Search recipes…"
              className="w-full pl-9"
            />
          </div>
          {onFreeText && query.trim() && (
            <button
              onClick={() => onFreeText(query.trim())}
              className="mt-2 w-full rounded-2xl border border-dashed border-ink/25 px-3 py-2 text-left text-sm font-semibold text-ink/60 hover:border-teal-400 hover:text-ink"
            >
              Use “{query.trim()}” as free-text meal
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="flex flex-col gap-2">
            {filtered.map((r) => (
              <button
                key={r.id}
                onClick={() => onPick(r)}
                className="flex items-center justify-between gap-3 rounded-2xl border border-black/5 bg-white p-3 text-left transition hover:border-teal-300 hover:bg-teal-50/40"
              >
                <div>
                  <p className="font-display text-sm font-extrabold text-ink">
                    {r.title}
                  </p>
                  <p className="text-xs font-semibold text-ink/45">
                    {r.cuisine} · {r.calories} kcal · P {r.protein}g
                  </p>
                </div>
                <HealthBadge grade={healthGrade(r)} />
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="py-6 text-center text-sm font-semibold text-ink/40">
                No recipes match “{query}”.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
