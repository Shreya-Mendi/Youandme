import { Plus, Repeat, ThumbsDown, ThumbsUp, X } from "lucide-react";
import type { Recipe } from "../types";
import { healthGrade } from "../lib/nutrition";
import { mealEmoji } from "../lib/emoji";
import { personLikeState } from "../lib/recommender";
import { useStore } from "../store";
import {
  EmojiSticker,
  GhostButton,
  HealthBadge,
  TealButton,
} from "./ui";
import { MacroRow, tagPastel } from "./RecipeCard";

export function RecipeDetailModal({
  recipe,
  why,
  onClose,
  onSwap,
  onAddToGrocery,
}: {
  recipe: Recipe;
  why?: string;
  onClose: () => void;
  onSwap?: () => void;
  onAddToGrocery?: () => void;
}) {
  const { state, toggleLike, toggleDislike } = useStore();
  const like = personLikeState(state.preferences, state.currentPerson, recipe.id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="my-4 flex max-h-[88vh] w-full max-w-2xl flex-col rounded-sticker-lg border border-black/5 bg-white shadow-sticker-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-black/5 p-4">
          <div className="flex items-start gap-3">
            <EmojiSticker emoji={mealEmoji(recipe)} size="lg" />
            <div>
              <h3 className="font-display text-xl font-extrabold tracking-tight text-ink">
                {recipe.title}
              </h3>
              <p className="text-xs font-semibold capitalize text-ink/45">
                {recipe.cuisine} · {recipe.mealType}
                {recipe.servings ? ` · serves ${recipe.servings}` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-ink/40 hover:bg-black/5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div className="flex flex-wrap items-center gap-3">
            <HealthBadge grade={healthGrade(recipe)} className="h-7 w-7 text-sm" />
            <MacroRow recipe={recipe} />
          </div>

          {why && (
            <p className="rounded-xl bg-mint-soft px-3 py-2 text-xs font-semibold text-emerald-800">
              {why}
            </p>
          )}

          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {recipe.tags.map((t) => (
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
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-xs font-extrabold uppercase tracking-wider text-ink/45">
                Ingredients
              </p>
              <ul className="space-y-1 text-sm font-medium text-ink/70">
                {recipe.ingredients.map((i, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
                    {i}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-extrabold uppercase tracking-wider text-ink/45">
                Steps
              </p>
              <ol className="space-y-2 text-sm font-medium text-ink/70">
                {recipe.steps.map((s, idx) => (
                  <li key={idx} className="flex gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-extrabold text-white">
                      {idx + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-2xl bg-cream p-3">
            <span className="text-xs font-bold text-ink/55">
              How do you feel about this?
            </span>
            <div className="ml-auto flex items-center gap-1.5">
              <button
                onClick={() => toggleLike(recipe.id)}
                title="Like"
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs transition ${
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
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs transition ${
                  like === "dislike"
                    ? "border-pink-200 bg-pink text-white"
                    : "border-black/10 bg-white text-ink/50 hover:border-ink/30"
                }`}
              >
                <ThumbsDown className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-black/5 p-4">
          {onAddToGrocery && (
            <GhostButton onClick={onAddToGrocery}>
              <span className="inline-flex items-center gap-1.5">
                <Plus className="h-4 w-4" /> Add ingredients to grocery
              </span>
            </GhostButton>
          )}
          {onSwap && (
            <TealButton onClick={onSwap}>
              <span className="inline-flex items-center gap-1.5">
                <Repeat className="h-4 w-4" /> Swap meal
              </span>
            </TealButton>
          )}
        </div>
      </div>
    </div>
  );
}
