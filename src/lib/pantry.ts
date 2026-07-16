import type { Recipe } from "../types";
import { ingredientCoreName, tokenizeIngredient } from "./text";

export interface PantryMatch {
  recipe: Recipe;
  /** How many of the recipe's ingredient lines the pantry covers. */
  have: number;
  /** Total ingredient lines in the recipe. */
  total: number;
  /** have / total in [0,1]. */
  coverage: number;
  /** Readable core names of the ingredients still missing. */
  missing: string[];
}

/** Normalize a list of pantry entries into a set of head-noun tokens. */
export function pantryTokenSet(items: string[]): Set<string> {
  const set = new Set<string>();
  for (const item of items) {
    for (const token of tokenizeIngredient(item)) set.add(token);
  }
  return set;
}

/** Score one recipe against the pantry token set by ingredient overlap. */
export function matchRecipe(
  recipe: Recipe,
  pantry: Set<string>
): PantryMatch {
  let have = 0;
  const missing: string[] = [];
  for (const line of recipe.ingredients) {
    const tokens = tokenizeIngredient(line);
    const covered = tokens.length > 0 && tokens.some((t) => pantry.has(t));
    if (covered) {
      have += 1;
    } else {
      missing.push(ingredientCoreName(line));
    }
  }
  const total = recipe.ingredients.length;
  return {
    recipe,
    have,
    total,
    coverage: total > 0 ? have / total : 0,
    missing,
  };
}

/**
 * Rank recipes you can (mostly) make from the pantry. Coverage is the primary
 * signal; an optional recommender score map breaks ties as a secondary blend.
 */
export function rankByPantry(
  recipes: Recipe[],
  pantryItems: string[],
  scoreById?: Map<string, number>,
  limit = 12
): PantryMatch[] {
  const pantry = pantryTokenSet(pantryItems);
  if (pantry.size === 0) return [];
  return recipes
    .map((r) => matchRecipe(r, pantry))
    .filter((m) => m.have > 0)
    .sort((a, b) => {
      const sa = 0.75 * a.coverage + 0.25 * (scoreById?.get(a.recipe.id) ?? 0);
      const sb = 0.75 * b.coverage + 0.25 * (scoreById?.get(b.recipe.id) ?? 0);
      return sb - sa;
    })
    .slice(0, limit);
}

/** ~12 common staple ingredients inferred from the dataset, for quick-add. */
export const COMMON_STAPLES: string[] = [
  "eggs",
  "chicken",
  "beef",
  "onion",
  "garlic",
  "ginger",
  "rice",
  "roti",
  "bell pepper",
  "broccoli",
  "spinach",
  "greek yogurt",
  "cabbage",
  "tomato",
];
