import type {
  DayPlan,
  GroceryCategory,
  GroceryItem,
  Recipe,
} from "../types";
import { ingredientCoreName } from "./text";

const CATEGORY_KEYWORDS: Record<GroceryCategory, string[]> = {
  Produce: [
    "onion",
    "tomato",
    "tomatoes",
    "garlic",
    "ginger",
    "pepper",
    "broccoli",
    "spinach",
    "lettuce",
    "romaine",
    "cucumber",
    "carrot",
    "carrots",
    "avocado",
    "banana",
    "berries",
    "blueberries",
    "lemon",
    "lime",
    "cilantro",
    "parsley",
    "zucchini",
    "celery",
    "sprouts",
    "asparagus",
    "peas",
    "snap",
    "coleslaw",
    "cabbage",
    "greens",
    "edamame",
    "potato",
    "potatoes",
    "olives",
    "chili",
    "rosemary",
    "mixed",
    "spring",
  ],
  Meat: [
    "chicken",
    "beef",
    "turkey",
    "steak",
    "sirloin",
    "salmon",
    "tuna",
    "cod",
    "shrimp",
    "keema",
  ],
  Dairy: [
    "milk",
    "yogurt",
    "cheese",
    "feta",
    "parmesan",
    "cheddar",
    "mozzarella",
    "cream",
    "butter",
    "paneer",
    "cottage",
    "ghee",
    "egg",
    "eggs",
    "tofu",
  ],
  Pantry: [
    "rice",
    "flour",
    "oats",
    "pasta",
    "bread",
    "sourdough",
    "tortillas",
    "flatbreads",
    "lentils",
    "chickpeas",
    "beans",
    "kidney",
    "quinoa",
    "granola",
    "oil",
    "sauce",
    "soy",
    "sesame",
    "vinegar",
    "honey",
    "sugar",
    "salt",
    "curry",
    "powder",
    "turmeric",
    "cumin",
    "garam",
    "masala",
    "paprika",
    "coriander",
    "cinnamon",
    "seasoning",
    "spice",
    "paste",
    "pesto",
    "marinara",
    "teriyaki",
    "tahini",
    "mustard",
    "coconut",
    "broth",
    "breadcrumbs",
    "almonds",
    "peanut",
    "chia",
    "seeds",
    "protein",
    "scoop",
  ],
  Household: [],
  Other: [],
};

// Household / non-food shopping items, matched as substrings against the raw
// text so multi-word phrases (e.g. "paper towels", "light bulb") also match.
const HOUSEHOLD_KEYWORDS: string[] = [
  "detergent",
  "laundry",
  "dish soap",
  "dishwasher",
  "soap",
  "shampoo",
  "conditioner",
  "toothpaste",
  "toothbrush",
  "toilet paper",
  "paper towel",
  "tissue",
  "trash bag",
  "garbage bag",
  "cleaner",
  "cleaning",
  "sponge",
  "bleach",
  "foil",
  "ziploc",
  "plastic wrap",
  "cling wrap",
  "saran",
  "napkin",
  "deodorant",
  "razor",
  "batteries",
  "battery",
  "light bulb",
  "lightbulb",
  "dryer sheet",
  "fabric softener",
  "air freshener",
  "hand sanitizer",
  "floss",
  "q-tip",
  "cotton swab",
];

export function categorizeIngredient(line: string): GroceryCategory {
  const name = ingredientCoreName(line);
  const tokens = name.split(" ");
  for (const cat of ["Meat", "Dairy", "Produce", "Pantry"] as GroceryCategory[]) {
    if (tokens.some((t) => CATEGORY_KEYWORDS[cat].includes(t))) return cat;
  }
  return "Other";
}

/**
 * Categorize a manually-typed grocery line. Household (non-food) items take
 * priority so a full shopping list can include things like detergent, then it
 * falls back to the food-ingredient categorization.
 */
export function categorizeManualItem(line: string): GroceryCategory {
  const lower = line.toLowerCase();
  if (HOUSEHOLD_KEYWORDS.some((k) => lower.includes(k))) return "Household";
  return categorizeIngredient(line);
}

const QTY_RE = /^([\d./]+)\s*([a-zA-Z]*)/;

function splitQuantity(line: string): { qty: string; rest: string } {
  const m = line.trim().match(QTY_RE);
  if (m && /\d/.test(m[1])) {
    return { qty: m[0].trim(), rest: line.slice(m[0].length).trim() };
  }
  return { qty: "", rest: line.trim() };
}

/**
 * Aggregate ingredients from the week's planned recipes into deduped grocery
 * lines. Same core ingredient across recipes is merged and its quantities are
 * concatenated (a rough combine, not unit-aware).
 */
export function aggregateGroceries(
  plan: DayPlan[],
  recipes: Recipe[]
): { name: string; category: GroceryCategory; quantity: string }[] {
  const byName = new Map<
    string,
    { name: string; category: GroceryCategory; quantities: string[] }
  >();

  for (const day of plan) {
    if (!day.recipeId) continue;
    const recipe = recipes.find((r) => r.id === day.recipeId);
    if (!recipe) continue;
    for (const line of recipe.ingredients) {
      const core = ingredientCoreName(line);
      if (!core) continue;
      const { qty } = splitQuantity(line);
      const existing = byName.get(core);
      if (existing) {
        if (qty) existing.quantities.push(qty);
      } else {
        byName.set(core, {
          name: core,
          category: categorizeIngredient(line),
          quantities: qty ? [qty] : [],
        });
      }
    }
  }

  return [...byName.values()]
    .map((e) => ({
      name: e.name,
      category: e.category,
      quantity: e.quantities.join(" + "),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const CATEGORY_ORDER: GroceryCategory[] = [
  "Produce",
  "Meat",
  "Dairy",
  "Pantry",
  "Household",
  "Other",
];

export function groupByCategory(
  items: GroceryItem[]
): Record<GroceryCategory, GroceryItem[]> {
  const groups = {
    Produce: [],
    Meat: [],
    Dairy: [],
    Pantry: [],
    Household: [],
    Other: [],
  } as Record<GroceryCategory, GroceryItem[]>;
  for (const item of items) groups[item.category ?? "Other"].push(item);
  return groups;
}
