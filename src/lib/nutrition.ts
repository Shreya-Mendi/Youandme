import type { Goal, Profile, Recipe } from "../types";
import { tokenizeIngredient } from "./text";

export type HealthGrade = "A" | "B" | "C" | "D" | "E";

// Rough per-item macro table (per typical portion) used only to estimate
// macros when a user leaves them blank. Keyed by a token in the ingredient.
const MACRO_TABLE: Record<
  string,
  { cal: number; p: number; c: number; f: number }
> = {
  chicken: { cal: 165, p: 31, c: 0, f: 4 },
  beef: { cal: 250, p: 26, c: 0, f: 17 },
  turkey: { cal: 150, p: 29, c: 0, f: 3 },
  salmon: { cal: 208, p: 20, c: 0, f: 13 },
  tuna: { cal: 130, p: 28, c: 0, f: 1 },
  cod: { cal: 90, p: 20, c: 0, f: 1 },
  shrimp: { cal: 99, p: 24, c: 0, f: 1 },
  egg: { cal: 78, p: 6, c: 1, f: 5 },
  eggs: { cal: 156, p: 12, c: 1, f: 10 },
  tofu: { cal: 144, p: 15, c: 3, f: 9 },
  paneer: { cal: 265, p: 18, c: 4, f: 20 },
  lentils: { cal: 230, p: 18, c: 40, f: 1 },
  chickpeas: { cal: 269, p: 15, c: 45, f: 4 },
  rice: { cal: 205, p: 4, c: 45, f: 0 },
  oats: { cal: 150, p: 5, c: 27, f: 3 },
  pasta: { cal: 220, p: 8, c: 43, f: 1 },
  bread: { cal: 80, p: 3, c: 15, f: 1 },
  tortillas: { cal: 140, p: 4, c: 24, f: 4 },
  yogurt: { cal: 100, p: 10, c: 6, f: 4 },
  milk: { cal: 120, p: 8, c: 12, f: 5 },
  cheese: { cal: 110, p: 7, c: 1, f: 9 },
  feta: { cal: 75, p: 4, c: 1, f: 6 },
  parmesan: { cal: 110, p: 10, c: 1, f: 7 },
  cream: { cal: 100, p: 1, c: 2, f: 10 },
  butter: { cal: 100, p: 0, c: 0, f: 11 },
  oil: { cal: 120, p: 0, c: 0, f: 14 },
  avocado: { cal: 160, p: 2, c: 9, f: 15 },
  almonds: { cal: 160, p: 6, c: 6, f: 14 },
  peanut: { cal: 95, p: 4, c: 3, f: 8 },
  banana: { cal: 105, p: 1, c: 27, f: 0 },
  berries: { cal: 50, p: 1, c: 12, f: 0 },
  blueberries: { cal: 40, p: 0, c: 10, f: 0 },
  potato: { cal: 110, p: 3, c: 26, f: 0 },
  potatoes: { cal: 220, p: 6, c: 52, f: 0 },
  broccoli: { cal: 35, p: 3, c: 7, f: 0 },
  spinach: { cal: 20, p: 2, c: 3, f: 0 },
  tomato: { cal: 22, p: 1, c: 5, f: 0 },
  tomatoes: { cal: 44, p: 2, c: 10, f: 0 },
  onion: { cal: 40, p: 1, c: 9, f: 0 },
  pepper: { cal: 30, p: 1, c: 6, f: 0 },
  protein: { cal: 120, p: 24, c: 3, f: 1 },
};

export function estimateMacrosFromIngredients(ingredients: string[]): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  for (const line of ingredients) {
    const tokens = tokenizeIngredient(line);
    for (const token of tokens) {
      const hit = MACRO_TABLE[token];
      if (hit) {
        calories += hit.cal;
        protein += hit.p;
        carbs += hit.c;
        fat += hit.f;
        break; // one match per line is enough for an estimate
      }
    }
  }
  // Assume the estimate covers ~2 servings of a home recipe.
  const servings = 2;
  return {
    calories: Math.round(calories / servings),
    protein: Math.round(protein / servings),
    carbs: Math.round(carbs / servings),
    fat: Math.round(fat / servings),
  };
}

/**
 * Nutri-Score-inspired grade. We reward protein and vegetable/fiber tags and
 * penalize high calories and fat. Output mapped to an A-E letter grade.
 */
export function healthGrade(recipe: Recipe): HealthGrade {
  let score = 0;
  // Protein density is good (protein per 100 kcal).
  const proteinDensity = recipe.protein / Math.max(recipe.calories, 1);
  score += proteinDensity * 100; // ~0-10 range

  // Penalize calorie-dense meals.
  if (recipe.calories > 600) score -= 3;
  else if (recipe.calories > 500) score -= 1.5;
  else if (recipe.calories < 400) score += 1.5;

  // Penalize very high fat share.
  const fatShare = (recipe.fat * 9) / Math.max(recipe.calories, 1);
  if (fatShare > 0.5) score -= 3;
  else if (fatShare > 0.4) score -= 1.5;

  // Reward veg / fiber / fresh signals.
  const goodTags = [
    "fiber",
    "vegetarian",
    "salad",
    "fresh",
    "light",
    "low-carb",
  ];
  score += recipe.tags.filter((t) => goodTags.includes(t)).length * 0.8;

  if (score >= 8) return "A";
  if (score >= 6) return "B";
  if (score >= 4) return "C";
  if (score >= 2) return "D";
  return "E";
}

const GRADE_VALUE: Record<HealthGrade, number> = {
  A: 1,
  B: 0.75,
  C: 0.5,
  D: 0.25,
  E: 0,
};

/** Normalized 0-1 value of a grade, used inside the ranking blend. */
export function healthGradeValue(grade: HealthGrade): number {
  return GRADE_VALUE[grade];
}

const GRADE_COLORS: Record<HealthGrade, string> = {
  A: "bg-mint text-ink",
  B: "bg-butter text-ink",
  C: "bg-peach text-ink",
  D: "bg-pink text-white",
  E: "bg-lavender text-white",
};

export function gradeColor(grade: HealthGrade): string {
  return GRADE_COLORS[grade];
}

export function averageGrade(grades: HealthGrade[]): HealthGrade | null {
  if (grades.length === 0) return null;
  const avg =
    grades.reduce((sum, g) => sum + healthGradeValue(g), 0) / grades.length;
  if (avg >= 0.875) return "A";
  if (avg >= 0.625) return "B";
  if (avg >= 0.375) return "C";
  if (avg >= 0.125) return "D";
  return "E";
}

/**
 * Per-meal calorie & macro targets derived from a simple profile.
 * Base daily calories adjusted by goal, protein emphasized, then split into
 * the configured number of meals.
 */
export function mealTargets(profile: Profile): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  const goalAdjust: Record<Goal, number> = {
    maintain: 0,
    cut: -400,
    bulk: 350,
  };
  const dailyCalories = profile.baseCalories + goalAdjust[profile.goal];
  // Protein emphasized: ~1.8x bodyweight-ish heuristic expressed as % of cals.
  const proteinCals = dailyCalories * 0.32;
  const fatCals = dailyCalories * 0.28;
  const carbCals = dailyCalories - proteinCals - fatCals;
  const meals = Math.max(profile.mealsPerDay, 1);
  return {
    calories: Math.round(dailyCalories / meals),
    protein: Math.round(proteinCals / 4 / meals),
    carbs: Math.round(carbCals / 4 / meals),
    fat: Math.round(fatCals / 9 / meals),
  };
}
