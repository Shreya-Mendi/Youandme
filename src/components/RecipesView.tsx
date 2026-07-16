import { useMemo, useState } from "react";
import { ChefHat, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import type { MealType, Recipe, Season } from "../types";
import { useStore } from "../store";
import { RECIPES } from "../data/recipes";
import {
  estimateMacrosFromIngredients,
  healthGrade,
} from "../lib/nutrition";
import { uid } from "../lib/format";
import { mealEmoji } from "../lib/emoji";
import {
  Card,
  EmojiSticker,
  GhostButton,
  HealthBadge,
  Input,
  PersonChip,
  SectionLabel,
  TealButton,
} from "./ui";
import { MacroRow } from "./RecipeCard";

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
const SEASONS: Season[] = ["spring", "summer", "fall", "winter"];

function matchesQuery(r: Recipe, q: string): boolean {
  if (!q) return true;
  return (
    r.title.toLowerCase().includes(q) ||
    r.cuisine.toLowerCase().includes(q) ||
    r.tags.some((t) => t.includes(q)) ||
    r.ingredients.some((i) => i.toLowerCase().includes(q))
  );
}

export function RecipesView() {
  const { state, recipes, deleteRecipe } = useStore();
  const [editing, setEditing] = useState<Recipe | null>(null);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const userRecipes = useMemo(
    () => state.userRecipes.filter((r) => matchesQuery(r, q)),
    [state.userRecipes, q]
  );
  const curated = useMemo(() => RECIPES.filter((r) => matchesQuery(r, q)), [q]);
  const noMatches = q !== "" && userRecipes.length === 0 && curated.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionLabel>Recipe library</SectionLabel>
        <TealButton onClick={() => setCreating(true)}>
          <span className="inline-flex items-center gap-1">
            <Plus className="h-4 w-4" /> New recipe
          </span>
        </TealButton>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-ink/40" />
        <Input
          value={query}
          onChange={setQuery}
          placeholder="Search recipes by name or ingredient…"
          className="w-full rounded-2xl py-2.5 pl-9"
        />
      </div>

      {noMatches ? (
        <Card className="p-8 text-center">
          <p className="text-sm font-semibold text-ink/50">
            No recipes match “{query}”.
          </p>
          <p className="mt-1 font-hand text-xl text-teal-600">
            try another ingredient!
          </p>
        </Card>
      ) : (
        <>
          {userRecipes.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-ink/45">
                Your recipes
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {userRecipes.map((r) => (
                  <RecipeListCard
                    key={r.id}
                    recipe={r}
                    onEdit={() => setEditing(r)}
                    onDelete={() => deleteRecipe(r.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {curated.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-ink/45">
                Curated ({curated.length})
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {curated.map((r) => (
                  <RecipeListCard key={r.id} recipe={r} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {(creating || editing) && (
        <RecipeEditor
          initial={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      {recipes.length === 0 && (
        <Card className="p-8 text-center text-sm font-semibold text-ink/40">
          No recipes yet.
        </Card>
      )}
    </div>
  );
}

function RecipeListCard({
  recipe,
  onEdit,
  onDelete,
}: {
  recipe: Recipe;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [open, setOpen] = useState(false);
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
      {recipe.authorId && <PersonChip person={recipe.authorId} />}

      <button
        onClick={() => setOpen((v) => !v)}
        className="w-fit text-xs font-bold text-teal-600 hover:underline"
      >
        {open ? "Hide" : "View"} recipe
      </button>

      {open && (
        <div className="space-y-2 text-xs text-ink/65">
          <div>
            <p className="font-bold text-ink/75">Ingredients</p>
            <ul className="list-disc pl-4">
              {recipe.ingredients.map((i, idx) => (
                <li key={idx}>{i}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-bold text-ink/75">Steps</p>
            <ol className="list-decimal space-y-0.5 pl-4">
              {recipe.steps.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {(onEdit || onDelete) && (
        <div className="mt-auto flex gap-2 pt-1">
          {onEdit && (
            <GhostButton onClick={onEdit} className="!px-2.5 !py-1 text-xs">
              <span className="inline-flex items-center gap-1">
                <Pencil className="h-3 w-3" /> Edit
              </span>
            </GhostButton>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1 rounded-full border border-black/10 px-2.5 py-1 text-xs font-bold text-ink/50 hover:border-red-300 hover:text-red-500"
            >
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          )}
        </div>
      )}
    </Card>
  );
}

function RecipeEditor({
  initial,
  onClose,
}: {
  initial: Recipe | null;
  onClose: () => void;
}) {
  const { me, saveRecipe } = useStore();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [cuisine, setCuisine] = useState(initial?.cuisine ?? "");
  const [mealType, setMealType] = useState<MealType>(
    initial?.mealType ?? "dinner"
  );
  const [servings, setServings] = useState(String(initial?.servings ?? 2));
  const [ingredients, setIngredients] = useState(
    initial?.ingredients.join("\n") ?? ""
  );
  const [steps, setSteps] = useState(initial?.steps.join("\n") ?? "");
  const [calories, setCalories] = useState(
    initial?.calories ? String(initial.calories) : ""
  );
  const [protein, setProtein] = useState(
    initial?.protein ? String(initial.protein) : ""
  );
  const [carbs, setCarbs] = useState(
    initial?.carbs ? String(initial.carbs) : ""
  );
  const [fat, setFat] = useState(initial?.fat ? String(initial.fat) : "");
  const [seasons, setSeasons] = useState<Season[]>(
    initial?.seasons ?? ["spring", "summer", "fall", "winter"]
  );
  const [tags, setTags] = useState(initial?.tags.join(", ") ?? "");

  const ingredientList = ingredients
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const save = () => {
    if (!title.trim() || ingredientList.length === 0) return;
    let macros = {
      calories: Number(calories),
      protein: Number(protein),
      carbs: Number(carbs),
      fat: Number(fat),
    };
    if (!calories || !protein) {
      macros = estimateMacrosFromIngredients(ingredientList);
    }
    const recipe: Recipe = {
      id: initial?.id ?? uid("user"),
      title: title.trim(),
      cuisine: cuisine.trim() || "Home",
      mealType,
      servings: Number(servings) || 1,
      ingredients: ingredientList,
      steps: steps
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
      calories: macros.calories,
      protein: macros.protein,
      carbs: macros.carbs,
      fat: macros.fat,
      seasons: seasons.length ? seasons : ["spring", "summer", "fall", "winter"],
      tags: tags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
      authorId: initial?.authorId ?? me,
    };
    saveRecipe(recipe);
    onClose();
  };

  const toggleSeason = (s: Season) =>
    setSeasons((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="my-4 w-full max-w-2xl rounded-sticker-lg border border-black/5 bg-white shadow-sticker-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-black/5 p-4">
          <h3 className="inline-flex items-center gap-2 font-display text-lg font-extrabold tracking-tight text-ink">
            <ChefHat className="h-5 w-5 text-teal-500" />
            {initial ? "Edit recipe" : "New recipe"}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-ink/40 hover:bg-black/5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Title">
              <Input value={title} onChange={setTitle} placeholder="Recipe name" className="w-full" />
            </Field>
            <Field label="Cuisine">
              <Input value={cuisine} onChange={setCuisine} placeholder="e.g. Indian" className="w-full" />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Meal type">
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value as MealType)}
                className="w-full rounded-2xl border border-black/10 bg-cream px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-teal-400 focus:bg-white"
              >
                {MEAL_TYPES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Servings">
              <Input value={servings} onChange={setServings} className="w-full" />
            </Field>
          </div>

          <Field label="Ingredients (one per line)">
            <textarea
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              rows={5}
              placeholder={"500 g chicken\n1 onion\n2 tbsp curry powder"}
              className="w-full rounded-2xl border border-black/10 bg-cream px-3 py-2 text-sm font-medium text-ink outline-none focus:border-teal-400 focus:bg-white"
            />
          </Field>

          <Field label="Steps (one per line)">
            <textarea
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              rows={4}
              placeholder={"Saute the onion.\nAdd chicken and brown."}
              className="w-full rounded-2xl border border-black/10 bg-cream px-3 py-2 text-sm font-medium text-ink outline-none focus:border-teal-400 focus:bg-white"
            />
          </Field>

          <div>
            <p className="mb-1 text-xs font-bold text-ink/55">
              Macros (leave calories/protein blank to auto-estimate)
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Input value={calories} onChange={setCalories} placeholder="kcal" className="w-full" />
              <Input value={protein} onChange={setProtein} placeholder="protein g" className="w-full" />
              <Input value={carbs} onChange={setCarbs} placeholder="carbs g" className="w-full" />
              <Input value={fat} onChange={setFat} placeholder="fat g" className="w-full" />
            </div>
          </div>

          <Field label="Seasons">
            <div className="flex flex-wrap gap-2">
              {SEASONS.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSeason(s)}
                  className={`rounded-full px-3 py-1 text-xs font-bold capitalize transition ${
                    seasons.includes(s)
                      ? "bg-teal-500 text-white"
                      : "border border-black/10 bg-white text-ink/55 hover:border-ink/30"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Tags (comma separated)">
            <Input
              value={tags}
              onChange={setTags}
              placeholder="high-protein, curry, gym"
              className="w-full"
            />
          </Field>
        </div>

        <div className="flex justify-end gap-2 border-t border-black/5 p-4">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <TealButton onClick={save} disabled={!title.trim() || ingredientList.length === 0}>
            Save recipe
          </TealButton>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-ink/55">{label}</span>
      {children}
    </label>
  );
}
