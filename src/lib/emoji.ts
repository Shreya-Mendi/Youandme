import type { Recipe } from "../types";

const KEYWORD_EMOJI: [RegExp, string][] = [
  [/curry|masala|tikka|dal|paneer|biryani/i, "🍛"],
  [/egg|omelet|scramble|frittata/i, "🥚"],
  [/beef|steak|burger|mince/i, "🥩"],
  [/chicken|poultry|turkey/i, "🍗"],
  [/salmon|tuna|cod|shrimp|fish|seafood/i, "🐟"],
  [/salad|greens|slaw/i, "🥗"],
  [/wrap|burrito|taco|tortilla/i, "🥬"],
  [/pasta|noodle|spaghetti|ramen/i, "🍝"],
  [/rice|bowl|stir/i, "🍚"],
  [/soup|stew|broth/i, "🍲"],
  [/oat|porridge|granola|smoothie/i, "🥣"],
  [/pizza/i, "🍕"],
  [/tofu|vegan|veggie|vegetable/i, "🥦"],
  [/pancake|waffle|toast|breakfast/i, "🥞"],
  [/sandwich/i, "🥪"],
];

export function mealEmoji(recipe: Recipe): string {
  const hay = `${recipe.title} ${recipe.cuisine} ${recipe.tags.join(" ")}`;
  for (const [re, emoji] of KEYWORD_EMOJI) {
    if (re.test(hay)) return emoji;
  }
  switch (recipe.mealType) {
    case "breakfast":
      return "🥣";
    case "snack":
      return "🍎";
    case "lunch":
      return "🥗";
    default:
      return "🍽️";
  }
}

export function workoutEmoji(name: string): string {
  const n = name.toLowerCase();
  if (/swim/.test(n)) return "🏊";
  if (/push|chest|press/.test(n)) return "🔥";
  if (/pull|back|row/.test(n)) return "🎒";
  if (/leg|squat|lower/.test(n)) return "🦵";
  if (/core|abs/.test(n)) return "🌀";
  if (/cardio|run|hiit/.test(n)) return "🏃";
  return "💪";
}
