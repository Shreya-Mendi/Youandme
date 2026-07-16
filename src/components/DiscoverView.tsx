import { useMemo, useState } from "react";
import {
  Flower2,
  Snowflake,
  Sun,
  Leaf,
  Plus,
  Search,
  ShoppingCart,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import type { Season, WeekDay } from "../types";
import { useStore } from "../store";
import {
  buildContext,
  buildTfIdf,
  moreLikeThis,
  personLikeState,
  rankRecipes,
  seasonalPicks,
} from "../lib/recommender";
import { healthGrade } from "../lib/nutrition";
import { mealEmoji } from "../lib/emoji";
import { COMMON_STAPLES, rankByPantry } from "../lib/pantry";
import {
  Card,
  EmojiSticker,
  GhostButton,
  HealthBadge,
  Input,
  Pill,
  SectionLabel,
} from "./ui";
import { MacroRow, RecipeCard } from "./RecipeCard";

const SEASON_ICON: Record<Season, React.ReactNode> = {
  spring: <Flower2 className="h-4 w-4" />,
  summer: <Sun className="h-4 w-4" />,
  fall: <Leaf className="h-4 w-4" />,
  winter: <Snowflake className="h-4 w-4" />,
};

export function DiscoverView() {
  const { state, recipes, assignRecipeToDay } = useStore();
  const [mealFilter, setMealFilter] = useState<"all" | "breakfast" | "lunch" | "dinner">(
    "all"
  );
  const [similarTo, setSimilarTo] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);

  const ctx = useMemo(
    () => buildContext(recipes, state.profile, state.preferences),
    [recipes, state.profile, state.preferences]
  );

  const model = useMemo(() => buildTfIdf(recipes), [recipes]);

  const ranked = useMemo(() => {
    const candidates =
      mealFilter === "all"
        ? recipes
        : recipes.filter((r) => r.mealType === mealFilter);
    return rankRecipes(ctx, candidates).slice(0, 9);
  }, [ctx, recipes, mealFilter]);

  const seasonal = useMemo(() => seasonalPicks(ctx, 6), [ctx]);

  const scoreById = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of rankRecipes(ctx)) map.set(s.recipe.id, s.score);
    return map;
  }, [ctx]);

  const pantryMatches = useMemo(
    () => rankByPantry(recipes, state.pantry, scoreById, 9),
    [recipes, state.pantry, scoreById]
  );

  const similar = useMemo(() => {
    if (!similarTo) return [];
    return moreLikeThis(model, recipes, similarTo, 4);
  }, [model, recipes, similarTo]);

  const similarRecipe = similarTo
    ? recipes.find((r) => r.id === similarTo)
    : null;

  return (
    <div className="space-y-8">
      <PantrySection matches={pantryMatches} onPlan={setAssigning} />

      <section>
        <div className="mb-3 flex items-center gap-2">
          {SEASON_ICON[ctx.season]}
          <SectionLabel>Seasonal picks · {ctx.season}</SectionLabel>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {seasonal.map((s) => (
            <div key={s.recipe.id} className="w-64 shrink-0">
              <RecipeCard
                recipe={s.recipe}
                why={s.why}
                onSelect={() => setSimilarTo(s.recipe.id)}
                footer={
                  <GhostButton
                    onClick={() => setAssigning(s.recipe.id)}
                    className="!px-2.5 !py-1 text-xs"
                  >
                    <span className="inline-flex items-center gap-1">
                      <Plus className="h-3 w-3" /> Plan
                    </span>
                  </GhostButton>
                }
              />
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <EmojiSticker emoji="✨" size="sm" />
            <SectionLabel>Recommended for your household</SectionLabel>
          </div>
          <div className="flex gap-1.5">
            {(["all", "breakfast", "lunch", "dinner"] as const).map((m) => (
              <Pill
                key={m}
                active={mealFilter === m}
                onClick={() => setMealFilter(m)}
                className="capitalize"
              >
                {m}
              </Pill>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ranked.map((s) => (
            <RecipeCard
              key={s.recipe.id}
              recipe={s.recipe}
              why={s.why}
              onSelect={() => setSimilarTo(s.recipe.id)}
              footer={
                <GhostButton
                  onClick={() => setAssigning(s.recipe.id)}
                  className="!px-2.5 !py-1 text-xs"
                >
                  <span className="inline-flex items-center gap-1">
                    <Plus className="h-3 w-3" /> Plan
                  </span>
                </GhostButton>
              }
            />
          ))}
        </div>
        <p className="mt-3 text-xs font-medium text-ink/40">
          Ranked by a blend of macro fit, your learned preferences, health grade
          and season. Tap a title for “more like this”.
        </p>
      </section>

      {similarRecipe && (
        <section>
          <div className="mb-3">
            <SectionLabel>More like {similarRecipe.title}</SectionLabel>
          </div>
          {similar.length === 0 ? (
            <Card className="p-4 text-sm font-semibold text-ink/40">
              No similar recipes found.
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {similar.map((s) => (
                <RecipeCard
                  key={s.recipe.id}
                  recipe={s.recipe}
                  why={`${Math.round(s.similarity * 100)}% ingredient match`}
                  onSelect={() => setSimilarTo(s.recipe.id)}
                  footer={
                    <GhostButton
                      onClick={() => setAssigning(s.recipe.id)}
                      className="!px-2.5 !py-1 text-xs"
                    >
                      <span className="inline-flex items-center gap-1">
                        <Plus className="h-3 w-3" /> Plan
                      </span>
                    </GhostButton>
                  }
                />
              ))}
            </div>
          )}
        </section>
      )}

      {assigning && (
        <DayAssignPicker
          onPick={(day) => {
            assignRecipeToDay(day, assigning);
            setAssigning(null);
          }}
          onClose={() => setAssigning(null)}
        />
      )}
    </div>
  );
}

function PantrySection({
  matches,
  onPlan,
}: {
  matches: import("../lib/pantry").PantryMatch[];
  onPlan: (recipeId: string) => void;
}) {
  const { state, addPantryItem, removePantryItem } = useStore();
  const [draft, setDraft] = useState("");

  const pantry = state.pantry;
  const inPantry = new Set(pantry.map((p) => p.toLowerCase()));
  const staples = COMMON_STAPLES.filter((s) => !inPantry.has(s.toLowerCase()));

  const add = () => {
    if (!draft.trim()) return;
    addPantryItem(draft);
    setDraft("");
  };

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <EmojiSticker emoji="🧑‍🍳" size="sm" />
        <SectionLabel>What can I make?</SectionLabel>
      </div>

      <Card rotate={-1} className="p-4">
        <p className="mb-2 text-sm font-semibold text-ink/60">
          Tell u-n-me what's in your kitchen and we'll find recipes you can
          cook right now.
        </p>
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-ink/40" />
          <Input
            value={draft}
            onChange={setDraft}
            placeholder="Add an ingredient you have…"
            className="w-full rounded-2xl py-2.5 pl-9"
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
        </div>

        {pantry.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {pantry.map((item) => (
              <button
                key={item}
                onClick={() => removePantryItem(item)}
                className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-1 text-xs font-bold capitalize text-teal-700 transition hover:bg-teal-200"
              >
                {item}
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}

        {staples.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-ink/35">
              Quick add
            </span>
            {staples.map((s) => (
              <button
                key={s}
                onClick={() => addPantryItem(s)}
                className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs font-bold capitalize text-ink/55 transition hover:border-teal-300 hover:text-teal-600"
              >
                <Plus className="h-3 w-3" /> {s}
              </button>
            ))}
          </div>
        )}
      </Card>

      {pantry.length > 0 && (
        <div className="mt-4">
          {matches.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-sm font-semibold text-ink/50">
                No recipes overlap with your pantry yet.
              </p>
              <p className="mt-1 font-hand text-lg text-teal-600">
                add a few more staples!
              </p>
            </Card>
          ) : (
            <>
              <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-ink/45">
                You can make ({matches.length})
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {matches.map((m) => (
                  <PantryMatchCard
                    key={m.recipe.id}
                    match={m}
                    onPlan={() => onPlan(m.recipe.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function PantryMatchCard({
  match,
  onPlan,
}: {
  match: import("../lib/pantry").PantryMatch;
  onPlan: () => void;
}) {
  const { state, toggleLike, toggleDislike, addIngredientsToGrocery } =
    useStore();
  const { recipe, have, total, missing } = match;
  const ready = missing.length === 0;
  const like = personLikeState(
    state.preferences,
    state.currentPerson,
    recipe.id
  );

  return (
    <Card hover className="flex h-full flex-col gap-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <EmojiSticker emoji={mealEmoji(recipe)} size="sm" />
          <div>
            <p className="font-display text-base font-extrabold tracking-tight text-ink">
              {recipe.title}
            </p>
            <p className="text-xs font-semibold capitalize text-ink/45">
              {recipe.cuisine} · {recipe.mealType}
            </p>
          </div>
        </div>
        <HealthBadge grade={healthGrade(recipe)} />
      </div>

      <MacroRow recipe={recipe} />

      {ready ? (
        <span className="w-fit rounded-full bg-mint px-2.5 py-0.5 font-hand text-base font-bold text-ink">
          ready to cook!
        </span>
      ) : (
        <p className="rounded-xl bg-butter-soft px-2.5 py-1.5 text-xs font-bold text-amber-800">
          you have {have} / {total} ingredients
        </p>
      )}

      {missing.length > 0 && (
        <div className="text-xs">
          <p className="font-bold text-ink/55">Missing:</p>
          <p className="capitalize text-ink/50">{missing.join(", ")}</p>
          <button
            onClick={() => addIngredientsToGrocery(missing)}
            className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-2.5 py-1 font-bold text-ink/60 transition hover:border-teal-300 hover:text-teal-600"
          >
            <ShoppingCart className="h-3 w-3" /> Add missing to grocery
          </button>
        </div>
      )}

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
        </div>
        <GhostButton onClick={onPlan} className="!px-2.5 !py-1 text-xs">
          <span className="inline-flex items-center gap-1">
            <Plus className="h-3 w-3" /> Plan
          </span>
        </GhostButton>
      </div>
    </Card>
  );
}

function DayAssignPicker({
  onPick,
  onClose,
}: {
  onPick: (day: WeekDay) => void;
  onClose: () => void;
}) {
  const { plan, recipes } = useStore();
  // Reuse the RecipePicker shell would be overkill; use a simple day chooser.
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-sticker-lg border border-black/5 bg-white p-5 shadow-sticker-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-3 font-display text-lg font-extrabold tracking-tight text-ink">
          Add to which day?
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {plan.map((d) => {
            const current = d.recipeId
              ? recipes.find((r) => r.id === d.recipeId)?.title
              : d.freeText;
            return (
              <button
                key={d.day}
                onClick={() => onPick(d.day)}
                className="rounded-2xl border border-black/10 p-3 text-left transition hover:border-teal-400 hover:bg-teal-50/40"
              >
                <p className="font-display text-sm font-extrabold text-ink">
                  {d.day}
                </p>
                <p className="truncate text-xs font-semibold text-ink/40">
                  {current || "empty"}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
