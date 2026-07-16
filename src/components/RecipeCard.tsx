import { Flame, ThumbsDown, ThumbsUp } from "lucide-react";
import type { Recipe } from "../types";
import { healthGrade } from "../lib/nutrition";
import { personLikeState } from "../lib/recommender";
import { useStore } from "../store";
import { Card, HealthBadge, PersonChip } from "./ui";

const TAG_PASTELS = [
  "bg-mint-soft text-emerald-700",
  "bg-lavender-soft text-violet-700",
  "bg-pink-soft text-pink-700",
  "bg-peach-soft text-orange-700",
  "bg-sky-soft text-sky-700",
  "bg-butter-soft text-amber-700",
];

export function tagPastel(tag: string): string {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) >>> 0;
  return TAG_PASTELS[h % TAG_PASTELS.length];
}

export function MacroRow({ recipe }: { recipe: Recipe }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-ink/50">
      <span className="inline-flex items-center gap-1 font-bold text-ink/75">
        <Flame className="h-3.5 w-3.5 text-teal-500" />
        {recipe.calories} kcal
      </span>
      <span>P {recipe.protein}g</span>
      <span>C {recipe.carbs}g</span>
      <span>F {recipe.fat}g</span>
    </div>
  );
}

export function RecipeCard({
  recipe,
  why,
  footer,
  onSelect,
}: {
  recipe: Recipe;
  why?: string;
  footer?: React.ReactNode;
  onSelect?: () => void;
}) {
  const { state, toggleLike, toggleDislike } = useStore();
  const like = personLikeState(state.preferences, state.currentPerson, recipe.id);
  const grade = healthGrade(recipe);

  return (
    <Card hover className="flex h-full flex-col gap-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <button
            onClick={onSelect}
            className="text-left font-display text-base font-extrabold tracking-tight text-ink hover:text-teal-600"
          >
            {recipe.title}
          </button>
          <p className="text-xs font-semibold capitalize text-ink/45">
            {recipe.cuisine} · {recipe.mealType}
          </p>
        </div>
        <HealthBadge grade={grade} />
      </div>

      <MacroRow recipe={recipe} />

      {why && (
        <p className="rounded-xl bg-mint-soft px-2.5 py-1.5 text-xs font-semibold text-emerald-800">
          {why}
        </p>
      )}

      <div className="flex flex-wrap gap-1">
        {recipe.tags.slice(0, 4).map((t) => (
          <span
            key={t}
            className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${tagPastel(
              t
            )}`}
          >
            {t}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => toggleLike(recipe.id)}
            title="Like"
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs transition ${
              like === "like"
                ? "border-teal-200 bg-teal-500 text-white"
                : "border-black/10 bg-white text-ink/50 hover:border-ink/30"
            }`}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => toggleDislike(recipe.id)}
            title="Not for me"
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs transition ${
              like === "dislike"
                ? "border-pink-200 bg-pink text-white"
                : "border-black/10 bg-white text-ink/50 hover:border-ink/30"
            }`}
          >
            <ThumbsDown className="h-3.5 w-3.5" />
          </button>
          {recipe.authorId && <PersonChip person={recipe.authorId} />}
        </div>
        {footer}
      </div>
    </Card>
  );
}
