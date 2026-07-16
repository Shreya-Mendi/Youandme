export type PersonId = "you" | "partner";

export type Season = "spring" | "summer" | "fall" | "winter";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type GroceryCategory =
  | "Produce"
  | "Meat"
  | "Dairy"
  | "Pantry"
  | "Household"
  | "Other";

export interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  steps: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  cuisine: string;
  mealType: MealType;
  seasons: Season[];
  tags: string[];
  servings?: number;
  /** Author person id if this is a user-created recipe. */
  authorId?: PersonId;
}

export type WeekDay =
  | "Mon"
  | "Tue"
  | "Wed"
  | "Thu"
  | "Fri"
  | "Sat"
  | "Sun";

export interface DayPlan {
  day: WeekDay;
  tag?: string;
  /** Assigned recipe id, if the meal maps to a recipe. */
  recipeId?: string;
  /** Free-text meal (e.g. "Takeout") when no recipe is assigned. */
  freeText?: string;
  note?: string;
  /** Day this meal reuses leftovers from. */
  leftoverFrom?: WeekDay;
}

export interface ItemComment {
  id: string;
  authorId: PersonId;
  text: string;
  createdAt: number;
}

export interface SwapSuggestion {
  id: string;
  authorId: PersonId;
  suggestedText: string;
  createdAt: number;
}

export interface GroceryItem {
  id: string;
  text: string;
  category: GroceryCategory;
  quantity?: string;
  checked: boolean;
  checkedBy?: PersonId;
  authorId: PersonId;
  createdAt: number;
  /** True when auto-generated from the weekly plan. */
  auto: boolean;
  comments: ItemComment[];
  swap?: SwapSuggestion;
}

export type ReactionType = "thumbsup" | "heart";

export interface FeedReaction {
  authorId: PersonId;
  type: ReactionType;
}

export interface FeedReply {
  id: string;
  authorId: PersonId;
  text: string;
  createdAt: number;
}

export interface FeedMessage {
  id: string;
  authorId: PersonId;
  text: string;
  createdAt: number;
  attachedDay?: WeekDay;
  attachedRecipeId?: string;
  reactions: FeedReaction[];
  replies: FeedReply[];
}

export type DateVibe =
  | "cozy"
  | "adventurous"
  | "romantic"
  | "foodie"
  | "artsy"
  | "active"
  | "chill"
  | "cultural"
  | "playful"
  | "budget";

export type DateBudget = "free" | "$" | "$$" | "$$$";

export interface DateIdea {
  id: string;
  title: string;
  description: string;
  vibes: DateVibe[];
  category: string;
  setting: "indoor" | "outdoor" | "either";
  budget: DateBudget;
  duration: string;
  seasons: Season[];
  /** Search term for a maps deep-link (e.g. "rooftop bar"). Omitted for at-home ideas. */
  mapQuery?: string;
  atHome?: boolean;
}

export type ProposalStatus = "proposed" | "accepted" | "declined" | "counter";

export interface DateProposal {
  id: string;
  authorId: PersonId;
  title: string;
  idea: string;
  when?: string;
  location?: string;
  notes?: string;
  status: ProposalStatus;
  respondedBy?: PersonId;
  counterText?: string;
  reactions: FeedReaction[];
  replies: FeedReply[];
  createdAt: number;
  linkedIdeaId?: string;
}

export type Goal = "maintain" | "cut" | "bulk";

export interface Profile {
  goal: Goal;
  baseCalories: number;
  mealsPerDay: number;
}

export interface Preferences {
  /** Recipe ids liked / disliked, per person. */
  likes: Record<PersonId, string[]>;
  dislikes: Record<PersonId, string[]>;
}

export interface Exercise {
  name: string;
  setsReps: string;
  note?: string;
  weight?: string;
}

export interface WorkoutGroup {
  title: string;
  note?: string;
  exercises: Exercise[];
}

export interface Workout {
  id: string;
  name: string;
  focus: string;
  description?: string;
  /** Grouped sections (e.g. giant sets). */
  groups?: WorkoutGroup[];
  /** Flat exercise list when there are no grouped sections. */
  exercises?: Exercise[];
}

/** One day of the shared weekly workout schedule. */
export interface WorkoutDay {
  day: WeekDay;
  /** Assigned workout id, or null for a rest day. */
  workoutId: string | null;
  /** Per-person completion for the day (both train together). */
  done: Record<PersonId, boolean>;
}

export interface AppState {
  version: number;
  names: Record<PersonId, string>;
  currentPerson: PersonId;
  /** Per-week plans keyed by the Monday date ("YYYY-MM-DD"). */
  weekPlans: Record<string, DayPlan[]>;
  /** The week key currently being viewed / edited. */
  selectedWeekKey: string;
  /** Ingredients the household has on hand ("what can I make?"). */
  pantry: string[];
  groceries: GroceryItem[];
  feed: FeedMessage[];
  userRecipes: Recipe[];
  preferences: Preferences;
  profile: Profile;
  workoutSchedule: WorkoutDay[];
  /** Date-night proposals between the two people. */
  dateProposals: DateProposal[];
  /** City/area used to make date-idea suggestions location-aware. */
  dateCity: string;
}
