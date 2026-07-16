import type {
  AppState,
  DayPlan,
  GroceryItem,
  Recipe,
  WeekDay,
  WorkoutDay,
} from "../types";
import { RECIPES } from "../data/recipes";
import { aggregateGroceries } from "./grocery";
import { uid } from "./format";
import { currentWeekKey, emptyWeek } from "./week";

const STORAGE_KEY = "foodsie:v1";
const STATE_VERSION = 1;

const SEED_PLAN: DayPlan[] = [
  { day: "Mon", freeText: "Takeout" },
  { day: "Tue", recipeId: "seed-chicken-curry", note: "with Roti" },
  {
    day: "Wed",
    tag: "Gym",
    recipeId: "seed-egg-scramble",
    note: "with Roti",
  },
  {
    day: "Thu",
    tag: "Gym",
    recipeId: "seed-chicken-curry",
    note: "with Roti",
    leftoverFrom: "Tue",
  },
  { day: "Fri", tag: "Gym", recipeId: "seed-beef-stirfry" },
  {
    day: "Sat",
    tag: "Gym",
    recipeId: "seed-beef-egg-wraps",
    leftoverFrom: "Fri",
  },
  {
    day: "Sun",
    recipeId: "seed-chicken-curry",
    note: "Groceries + batch cook",
  },
];

const WEEK_DAYS: WeekDay[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Default schedule aligns to the meal planner's Gym days (Wed/Thu/Fri/Sat).
const DEFAULT_WORKOUT_BY_DAY: Record<WeekDay, string | null> = {
  Mon: null,
  Tue: null,
  Wed: "wk-push",
  Thu: "wk-pull",
  Fri: "wk-legs",
  Sat: "wk-swim",
  Sun: null,
};

function defaultWorkoutSchedule(): WorkoutDay[] {
  return WEEK_DAYS.map((day) => ({
    day,
    workoutId: DEFAULT_WORKOUT_BY_DAY[day],
    done: { you: false, partner: false },
  }));
}

function seedGroceries(plan: DayPlan[], recipes: Recipe[]): GroceryItem[] {
  const aggregated = aggregateGroceries(plan, recipes);
  const now = Date.now();
  return aggregated.map((a, i) => ({
    id: uid("groc"),
    text: a.name,
    category: a.category,
    quantity: a.quantity || undefined,
    checked: false,
    authorId: "you",
    createdAt: now - (aggregated.length - i) * 1000,
    auto: true,
    comments: [],
  }));
}

export function defaultState(): AppState {
  const weekKey = currentWeekKey();
  return {
    version: STATE_VERSION,
    names: { you: "You", partner: "Partner" },
    currentPerson: "you",
    weekPlans: { [weekKey]: SEED_PLAN },
    selectedWeekKey: weekKey,
    pantry: [],
    groceries: seedGroceries(SEED_PLAN, RECIPES),
    feed: [
      {
        id: uid("feed"),
        authorId: "you",
        text: "This is what I wanna eat this week — we cool? 🍛",
        createdAt: Date.now() - 1000 * 60 * 60 * 3,
        attachedDay: "Tue",
        attachedRecipeId: "seed-chicken-curry",
        reactions: [{ authorId: "partner", type: "thumbsup" }],
        replies: [
          {
            id: uid("reply"),
            authorId: "partner",
            text: "cool ✅ but can we swap Friday to chicken?",
            createdAt: Date.now() - 1000 * 60 * 60 * 2,
          },
        ],
      },
    ],
    userRecipes: [],
    preferences: {
      likes: { you: ["seed-chicken-curry"], partner: [] },
      dislikes: { you: [], partner: [] },
    },
    profile: { goal: "maintain", baseCalories: 2000, mealsPerDay: 3 },
    workoutSchedule: defaultWorkoutSchedule(),
    dateProposals: [
      {
        id: uid("date"),
        authorId: "you",
        title: "Rooftop sunset drinks 🌇",
        idea: "Let's find a rooftop spot Friday, grab a drink and watch the sunset.",
        when: "Friday, 7pm",
        location: "somewhere with a view",
        status: "proposed",
        reactions: [],
        replies: [],
        createdAt: Date.now() - 1000 * 60 * 60 * 5,
        linkedIdeaId: "rooftop-sunset",
      },
    ],
    dateCity: "",
  };
}

/** Fill in fields added after a saved state was written so old data keeps working. */
function migrateState(parsed: AppState): AppState {
  const next: AppState = { ...parsed };

  if (!next.workoutSchedule || next.workoutSchedule.length === 0) {
    next.workoutSchedule = defaultWorkoutSchedule();
  }

  // Migrate the legacy single `plan` field into per-week plans.
  const legacyPlan = (parsed as unknown as { plan?: DayPlan[] }).plan;
  if (!next.weekPlans || Object.keys(next.weekPlans).length === 0) {
    const weekKey = currentWeekKey();
    next.weekPlans = {
      [weekKey]:
        legacyPlan && legacyPlan.length > 0 ? legacyPlan : emptyWeek(),
    };
    next.selectedWeekKey = weekKey;
  }
  if (!next.selectedWeekKey || !next.weekPlans[next.selectedWeekKey]) {
    next.selectedWeekKey =
      Object.keys(next.weekPlans)[0] ?? currentWeekKey();
    if (!next.weekPlans[next.selectedWeekKey]) {
      next.weekPlans[next.selectedWeekKey] = emptyWeek();
    }
  }
  delete (next as unknown as { plan?: DayPlan[] }).plan;

  if (!Array.isArray(next.pantry)) next.pantry = [];
  if (!Array.isArray(next.dateProposals)) next.dateProposals = [];
  if (typeof next.dateCity !== "string") next.dateCity = "";

  return next;
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as AppState;
    if (parsed.version !== STATE_VERSION) return defaultState();
    return migrateState(parsed);
  } catch {
    return defaultState();
  }
}

/**
 * Run a state object received from the server through the same migration used
 * for local storage so its shape is always safe to hydrate the store with.
 * Returns null when the payload isn't a usable object.
 */
export function hydrateRemoteState(raw: unknown): AppState | null {
  if (!raw || typeof raw !== "object") return null;
  try {
    return migrateState(raw as AppState);
  } catch {
    return null;
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota / serialization errors; app stays usable in-memory.
  }
}

/** All recipes = curated dataset + user-created recipes. */
export function allRecipes(state: AppState): Recipe[] {
  return [...RECIPES, ...state.userRecipes];
}
