import type { PersonId, Preferences, Profile, Recipe, Season } from "../types";
import { tokenizeIngredients } from "./text";
import {
  healthGrade,
  healthGradeValue,
  mealTargets,
} from "./nutrition";

// ---------------------------------------------------------------------------
// Ranking blend weights. These are exposed as constants so the scoring recipe
// is transparent and tunable.
// ---------------------------------------------------------------------------
export const WEIGHTS = {
  macro: 0.4, // KNN closeness to per-meal macro/calorie targets
  preference: 0.25, // ingredient similarity to liked (minus disliked) recipes
  health: 0.2, // Nutri-Score-style health grade
  seasonal: 0.15, // whether the recipe is in season right now
};

export type SparseVector = Map<string, number>;

// ---------------------------------------------------------------------------
// TF-IDF over ingredient tokens
// ---------------------------------------------------------------------------

interface TfIdfModel {
  idf: Map<string, number>;
  vectors: Map<string, SparseVector>; // recipeId -> tf-idf vector
}

export function buildTfIdf(recipes: Recipe[]): TfIdfModel {
  const docTokens = new Map<string, string[]>();
  const df = new Map<string, number>();

  for (const r of recipes) {
    const tokens = tokenizeIngredients(r.ingredients);
    docTokens.set(r.id, tokens);
    for (const term of new Set(tokens)) {
      df.set(term, (df.get(term) ?? 0) + 1);
    }
  }

  const n = recipes.length;
  const idf = new Map<string, number>();
  for (const [term, freq] of df) {
    idf.set(term, Math.log((n + 1) / (freq + 1)) + 1);
  }

  const vectors = new Map<string, SparseVector>();
  for (const [id, tokens] of docTokens) {
    const tf = new Map<string, number>();
    for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
    const vec: SparseVector = new Map();
    for (const [term, count] of tf) {
      const tfWeight = count / tokens.length;
      vec.set(term, tfWeight * (idf.get(term) ?? 0));
    }
    vectors.set(id, vec);
  }

  return { idf, vectors };
}

export function tfIdfVectorFor(
  model: TfIdfModel,
  ingredients: string[]
): SparseVector {
  const tokens = tokenizeIngredients(ingredients);
  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  const vec: SparseVector = new Map();
  for (const [term, count] of tf) {
    const tfWeight = count / Math.max(tokens.length, 1);
    vec.set(term, tfWeight * (model.idf.get(term) ?? 0));
  }
  return vec;
}

export function cosineSimilarity(a: SparseVector, b: SparseVector): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const v of a.values()) normA += v * v;
  for (const v of b.values()) normB += v * v;
  const [small, large] = a.size < b.size ? [a, b] : [b, a];
  for (const [term, val] of small) {
    const other = large.get(term);
    if (other) dot += val * other;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function addScaled(target: SparseVector, source: SparseVector, scale: number) {
  for (const [term, val] of source) {
    target.set(term, (target.get(term) ?? 0) + val * scale);
  }
}

// ---------------------------------------------------------------------------
// Macro KNN: standardize [calories, protein, carbs, fat] across the dataset,
// then use Euclidean distance to per-meal targets -> similarity in [0,1].
// ---------------------------------------------------------------------------

interface MacroStats {
  mean: [number, number, number, number];
  std: [number, number, number, number];
}

export function computeMacroStats(recipes: Recipe[]): MacroStats {
  const dims: [number, number, number, number][] = recipes.map((r) => [
    r.calories,
    r.protein,
    r.carbs,
    r.fat,
  ]);
  const mean: [number, number, number, number] = [0, 0, 0, 0];
  for (const d of dims)
    for (let i = 0; i < 4; i++) mean[i] += d[i] / dims.length;
  const std: [number, number, number, number] = [0, 0, 0, 0];
  for (const d of dims)
    for (let i = 0; i < 4; i++) std[i] += (d[i] - mean[i]) ** 2 / dims.length;
  for (let i = 0; i < 4; i++) std[i] = Math.sqrt(std[i]) || 1;
  return { mean, std };
}

function standardize(
  v: [number, number, number, number],
  stats: MacroStats
): [number, number, number, number] {
  return [
    (v[0] - stats.mean[0]) / stats.std[0],
    (v[1] - stats.mean[1]) / stats.std[1],
    (v[2] - stats.mean[2]) / stats.std[2],
    (v[3] - stats.mean[3]) / stats.std[3],
  ];
}

export function macroCloseness(
  recipe: Recipe,
  target: { calories: number; protein: number; carbs: number; fat: number },
  stats: MacroStats
): number {
  const r = standardize(
    [recipe.calories, recipe.protein, recipe.carbs, recipe.fat],
    stats
  );
  const t = standardize(
    [target.calories, target.protein, target.carbs, target.fat],
    stats
  );
  const dist = Math.sqrt(
    (r[0] - t[0]) ** 2 +
      (r[1] - t[1]) ** 2 +
      (r[2] - t[2]) ** 2 +
      (r[3] - t[3]) ** 2
  );
  // Convert distance to a bounded similarity.
  return 1 / (1 + dist);
}

// ---------------------------------------------------------------------------
// Preference learning: preference vector = mean(liked tf-idf) - mean(disliked)
// ---------------------------------------------------------------------------

export function buildPreferenceVector(
  model: TfIdfModel,
  likedIds: string[],
  dislikedIds: string[]
): SparseVector {
  const pref: SparseVector = new Map();
  const liked = likedIds.filter((id) => model.vectors.has(id));
  const disliked = dislikedIds.filter((id) => model.vectors.has(id));
  for (const id of liked) {
    addScaled(pref, model.vectors.get(id)!, 1 / liked.length);
  }
  for (const id of disliked) {
    addScaled(pref, model.vectors.get(id)!, -1 / disliked.length);
  }
  return pref;
}

/** Combine both people's likes/dislikes into one household set. */
export function householdPreferenceIds(prefs: Preferences): {
  liked: string[];
  disliked: string[];
} {
  const liked = new Set([...prefs.likes.you, ...prefs.likes.partner]);
  const disliked = new Set([...prefs.dislikes.you, ...prefs.dislikes.partner]);
  // A dislike from either person removes it from the liked set.
  for (const id of disliked) liked.delete(id);
  return { liked: [...liked], disliked: [...disliked] };
}

// ---------------------------------------------------------------------------
// Seasons
// ---------------------------------------------------------------------------

export function currentSeason(date = new Date()): Season {
  const m = date.getMonth(); // 0-11, Northern hemisphere
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "fall";
  return "winter";
}

// ---------------------------------------------------------------------------
// Final ranking
// ---------------------------------------------------------------------------

export interface ScoredRecipe {
  recipe: Recipe;
  score: number;
  macroScore: number;
  prefScore: number;
  healthScore: number;
  seasonScore: number;
  why: string;
}

export interface RecommendContext {
  recipes: Recipe[];
  model: TfIdfModel;
  macroStats: MacroStats;
  prefVector: SparseVector;
  target: { calories: number; protein: number; carbs: number; fat: number };
  season: Season;
  likedIds: string[];
}

export function buildContext(
  recipes: Recipe[],
  profile: Profile,
  prefs: Preferences
): RecommendContext {
  const model = buildTfIdf(recipes);
  const macroStats = computeMacroStats(recipes);
  const { liked, disliked } = householdPreferenceIds(prefs);
  const prefVector = buildPreferenceVector(model, liked, disliked);
  const target = mealTargets(profile);
  return {
    recipes,
    model,
    macroStats,
    prefVector,
    target,
    season: currentSeason(),
    likedIds: liked,
  };
}

function likedCuisineHint(ctx: RecommendContext): string | null {
  if (ctx.likedIds.length === 0) return null;
  const counts = new Map<string, number>();
  for (const id of ctx.likedIds) {
    const r = ctx.recipes.find((x) => x.id === id);
    if (r) counts.set(r.cuisine, (counts.get(r.cuisine) ?? 0) + 1);
  }
  let best: string | null = null;
  let max = 0;
  for (const [cuisine, c] of counts) {
    if (c > max) {
      max = c;
      best = cuisine;
    }
  }
  return best;
}

function buildWhy(
  recipe: Recipe,
  parts: { macro: number; pref: number; health: number; season: boolean },
  cuisineHint: string | null
): string {
  const reasons: string[] = [];
  if (recipe.protein >= 35) reasons.push("high protein");
  if (parts.macro > 0.6) reasons.push("fits your macro targets");
  if (parts.pref > 0.15) {
    if (cuisineHint && recipe.cuisine === cuisineHint) {
      reasons.push(`matches your love of ${cuisineHint} food`);
    } else {
      reasons.push("similar to meals you liked");
    }
  }
  if (parts.health >= 0.75) reasons.push("healthy pick");
  if (parts.season) reasons.push("in season now");
  if (reasons.length === 0) reasons.push("a solid everyday option");
  const text = reasons.slice(0, 3).join(", ");
  return text.charAt(0).toUpperCase() + text.slice(1) + ".";
}

export function rankRecipes(
  ctx: RecommendContext,
  candidates: Recipe[] = ctx.recipes
): ScoredRecipe[] {
  const cuisineHint = likedCuisineHint(ctx);
  const scored = candidates.map((recipe) => {
    const macroScore = macroCloseness(recipe, ctx.target, ctx.macroStats);
    const recipeVec = ctx.model.vectors.get(recipe.id);
    const prefScore = recipeVec
      ? Math.max(0, cosineSimilarity(recipeVec, ctx.prefVector))
      : 0;
    const grade = healthGrade(recipe);
    const healthScore = healthGradeValue(grade);
    const inSeason = recipe.seasons.includes(ctx.season);
    const seasonScore = inSeason ? 1 : 0.3;

    const score =
      WEIGHTS.macro * macroScore +
      WEIGHTS.preference * prefScore +
      WEIGHTS.health * healthScore +
      WEIGHTS.seasonal * seasonScore;

    return {
      recipe,
      score,
      macroScore,
      prefScore,
      healthScore,
      seasonScore,
      why: buildWhy(
        recipe,
        {
          macro: macroScore,
          pref: prefScore,
          health: healthScore,
          season: inSeason,
        },
        cuisineHint
      ),
    };
  });
  return scored.sort((a, b) => b.score - a.score);
}

/** "More like this" using pure ingredient cosine similarity. */
export function moreLikeThis(
  model: TfIdfModel,
  recipes: Recipe[],
  recipeId: string,
  limit = 4
): { recipe: Recipe; similarity: number }[] {
  const base = model.vectors.get(recipeId);
  if (!base) return [];
  return recipes
    .filter((r) => r.id !== recipeId)
    .map((r) => ({
      recipe: r,
      similarity: cosineSimilarity(base, model.vectors.get(r.id) ?? new Map()),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

export function seasonalPicks(
  ctx: RecommendContext,
  limit = 6
): ScoredRecipe[] {
  const inSeason = ctx.recipes.filter((r) => r.seasons.includes(ctx.season));
  return rankRecipes(ctx, inSeason).slice(0, limit);
}

export function personLikeState(
  prefs: Preferences,
  person: PersonId,
  recipeId: string
): "like" | "dislike" | null {
  if (prefs.likes[person].includes(recipeId)) return "like";
  if (prefs.dislikes[person].includes(recipeId)) return "dislike";
  return null;
}
