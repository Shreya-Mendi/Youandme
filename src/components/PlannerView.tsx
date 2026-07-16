import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardCopy,
  Dumbbell,
  RefreshCw,
  Repeat,
  UtensilsCrossed,
} from "lucide-react";
import type { DayPlan, WeekDay } from "../types";
import { useStore } from "../store";
import { healthGrade } from "../lib/nutrition";
import { mealEmoji } from "../lib/emoji";
import { addWeeks, weekLabel, weekRangeLabel } from "../lib/week";
import {
  Card,
  EmojiSticker,
  GhostButton,
  HealthBadge,
  SectionLabel,
} from "./ui";
import { HealthSummary } from "./HealthSummary";
import { RecipePicker } from "./RecipePicker";
import { RecipeDetailModal } from "./RecipeDetailModal";

export function PlannerView() {
  const {
    state,
    plan,
    selectedWeekKey,
    recipes,
    goToWeek,
    copyLastWeek,
    assignRecipeToDay,
    setDayFreeText,
    setDayTag,
    addIngredientsToGrocery,
  } = useStore();
  const [pickerDay, setPickerDay] = useState<WeekDay | null>(null);
  const [detailDay, setDetailDay] = useState<WeekDay | null>(null);

  const isEmptyWeek = plan.every((d) => !d.recipeId && !d.freeText);
  const prevWeekHasMeals = (
    state.weekPlans[addWeeks(selectedWeekKey, -1)] ?? []
  ).some((d) => d.recipeId || d.freeText);

  const detail = detailDay ? plan.find((d) => d.day === detailDay) : null;
  const detailRecipe = detail?.recipeId
    ? recipes.find((r) => r.id === detail.recipeId)
    : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="mb-4 flex items-center justify-between gap-2 rounded-sticker border border-black/5 bg-white p-2 shadow-sticker">
          <button
            onClick={() => goToWeek(-1)}
            title="Previous week"
            className="rounded-full p-2 text-ink/50 transition hover:bg-black/5 hover:text-ink"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <p className="font-display text-lg font-extrabold tracking-tight text-ink">
              {weekLabel(selectedWeekKey)}
            </p>
            <p className="font-hand text-base leading-none text-teal-600">
              {weekRangeLabel(selectedWeekKey)}
            </p>
          </div>
          <button
            onClick={() => goToWeek(1)}
            title="Next week"
            className="rounded-full p-2 text-ink/50 transition hover:bg-black/5 hover:text-ink"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <SectionLabel>{weekLabel(selectedWeekKey)}'s plan</SectionLabel>
          <span className="font-hand text-base text-ink/50">
            tap a meal to see the recipe
          </span>
        </div>

        {isEmptyWeek && prevWeekHasMeals && (
          <Card className="mb-3 flex flex-wrap items-center justify-between gap-2 p-3">
            <p className="text-sm font-semibold text-ink/55">
              This week is empty. Start from last week?
            </p>
            <GhostButton onClick={copyLastWeek}>
              <span className="inline-flex items-center gap-1.5">
                <ClipboardCopy className="h-3.5 w-3.5" /> Copy last week
              </span>
            </GhostButton>
          </Card>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {plan.map((day, i) => (
            <DayCard
              key={day.day}
              day={day}
              rotate={(i % 3 === 0 ? -1 : i % 3 === 1 ? 1 : 0) as -1 | 0 | 1}
              onOpenMeal={() =>
                day.recipeId ? setDetailDay(day.day) : setPickerDay(day.day)
              }
              onChangeMeal={() => setPickerDay(day.day)}
              onTag={(tag) => setDayTag(day.day, tag)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <HealthSummary />
        <Card className="p-4 text-sm text-ink/70">
          <div className="mb-2 flex items-center gap-2">
            <EmojiSticker emoji="🥡" size="sm" />
            <p className="font-display font-extrabold text-ink">Leftover-aware</p>
          </div>
          <p className="text-xs leading-relaxed text-ink/55">
            Friday's beef stir-fry is cooked in bulk so Saturday reuses the
            leftover beef. Days that reuse leftovers show a badge.
          </p>
          <p className="mt-2 font-hand text-base text-teal-600">
            waste not, want not!
          </p>
        </Card>
      </div>

      {detailRecipe && detailDay && (
        <RecipeDetailModal
          recipe={detailRecipe}
          onClose={() => setDetailDay(null)}
          onSwap={() => {
            setDetailDay(null);
            setPickerDay(detailDay);
          }}
          onAddToGrocery={() => addIngredientsToGrocery(detailRecipe.ingredients)}
        />
      )}

      {pickerDay && (
        <RecipePicker
          recipes={recipes}
          title={`Meal for ${pickerDay}`}
          onPick={(r) => {
            assignRecipeToDay(pickerDay, r.id);
            setPickerDay(null);
          }}
          onFreeText={(text) => {
            setDayFreeText(pickerDay, text);
            setPickerDay(null);
          }}
          onClose={() => setPickerDay(null)}
        />
      )}
    </div>
  );
}

function DayCard({
  day,
  rotate = 0,
  onOpenMeal,
  onChangeMeal,
  onTag,
}: {
  day: DayPlan;
  rotate?: -1 | 0 | 1;
  onOpenMeal: () => void;
  onChangeMeal: () => void;
  onTag: (tag: string) => void;
}) {
  const { recipes } = useStore();
  const recipe = day.recipeId
    ? recipes.find((r) => r.id === day.recipeId)
    : null;

  return (
    <Card
      hover
      rotate={rotate}
      className="flex flex-col gap-2 p-4"
      highlighted={!!day.leftoverFrom}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-extrabold tracking-tight text-ink">
            {day.day}
          </span>
          {day.tag && (
            <span className="inline-flex items-center gap-1 rounded-full bg-lavender-soft px-2 py-0.5 text-[11px] font-bold text-violet-700">
              {day.tag === "Gym" ? <Dumbbell className="h-3 w-3" /> : null}
              {day.tag}
            </span>
          )}
        </div>
        {recipe && <HealthBadge grade={healthGrade(recipe)} />}
      </div>

      <button
        onClick={onOpenMeal}
        className="-mx-1 rounded-2xl px-1 py-1 text-left transition hover:bg-teal-50/50"
      >
        {recipe ? (
          <div className="flex items-start gap-2.5">
            <EmojiSticker emoji={mealEmoji(recipe)} size="sm" />
            <div className="min-w-0">
              <p className="font-display text-sm font-extrabold text-ink">
                {recipe.title}
              </p>
              {day.note && (
                <p className="text-xs font-medium text-ink/50">{day.note}</p>
              )}
              <p className="mt-0.5 text-xs font-semibold text-ink/40">
                {recipe.calories} kcal · P {recipe.protein}g
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm font-medium text-ink/55">
            <UtensilsCrossed className="h-4 w-4 text-ink/35" />
            {day.freeText || "No meal planned"}
          </div>
        )}
      </button>

      {day.leftoverFrom && (
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-teal-500 px-2 py-0.5 font-hand text-sm font-bold text-white">
          <Repeat className="h-3 w-3" />
          uses leftovers from {day.leftoverFrom}
        </span>
      )}

      <div className="mt-1 flex items-center gap-2">
        <GhostButton onClick={onChangeMeal} className="!px-2.5 !py-1 text-xs">
          <span className="inline-flex items-center gap-1">
            <RefreshCw className="h-3 w-3" /> Change
          </span>
        </GhostButton>
        <button
          onClick={() => onTag(day.tag === "Gym" ? "" : "Gym")}
          className="text-xs font-bold text-ink/40 hover:text-ink"
        >
          {day.tag === "Gym" ? "Remove Gym" : "+ Gym"}
        </button>
      </div>
    </Card>
  );
}
