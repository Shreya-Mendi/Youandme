import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type {
  AppState,
  DayPlan,
  GroceryCategory,
  PersonId,
  Profile,
  ProposalStatus,
  ReactionType,
  Recipe,
  WeekDay,
} from "./types";
import { allRecipes, loadState, saveState } from "./lib/storage";
import { aggregateGroceries, categorizeIngredient } from "./lib/grocery";
import { ingredientCoreName } from "./lib/text";
import { addWeeks, emptyWeek } from "./lib/week";
import { uid } from "./lib/format";
import { useSync } from "./lib/sync";
import type { SyncStatus } from "./lib/sync";

interface Store {
  state: AppState;
  recipes: Recipe[];
  me: PersonId;
  /** Live cloud-sync status for the connection chip. */
  syncStatus: SyncStatus;
  /** Plan for the currently selected week. */
  plan: DayPlan[];
  selectedWeekKey: string;
  setName: (p: PersonId, name: string) => void;
  setProfile: (profile: Profile) => void;
  // weeks
  goToWeek: (offset: number) => void;
  copyLastWeek: () => void;
  // planner
  assignRecipeToDay: (day: WeekDay, recipeId: string) => void;
  setDayFreeText: (day: WeekDay, text: string) => void;
  setDayTag: (day: WeekDay, tag: string) => void;
  // grocery
  toggleGroceryCheck: (id: string) => void;
  addGroceryItem: (text: string, category: GroceryCategory) => void;
  addIngredientsToGrocery: (ingredients: string[]) => void;
  removeGroceryItem: (id: string) => void;
  addGroceryComment: (id: string, text: string) => void;
  suggestSwap: (id: string, text: string) => void;
  acceptSwap: (id: string) => void;
  dismissSwap: (id: string) => void;
  regenerateGroceries: () => void;
  // pantry
  addPantryItem: (text: string) => void;
  removePantryItem: (text: string) => void;
  // feed
  postMessage: (
    text: string,
    attachedDay?: WeekDay,
    attachedRecipeId?: string
  ) => void;
  reactToMessage: (id: string, type: ReactionType) => void;
  replyToMessage: (id: string, text: string) => void;
  // recipes
  saveRecipe: (recipe: Recipe) => void;
  deleteRecipe: (id: string) => void;
  // preferences
  toggleLike: (recipeId: string) => void;
  toggleDislike: (recipeId: string) => void;
  // gym
  setWorkoutForDay: (day: WeekDay, workoutId: string | null) => void;
  toggleWorkoutDone: (day: WeekDay, person: PersonId) => void;
  // date night
  proposeDate: (input: {
    title: string;
    idea: string;
    when?: string;
    location?: string;
    notes?: string;
    linkedIdeaId?: string;
  }) => void;
  respondToProposal: (
    id: string,
    status: ProposalStatus,
    counterText?: string
  ) => void;
  reactToProposal: (id: string, type: ReactionType) => void;
  replyToProposal: (id: string, text: string) => void;
  setDateCity: (city: string) => void;
}

const StoreContext = createContext<Store | null>(null);

/** Apply a transform to the plan of the currently selected week. */
function updateSelectedPlan(
  s: AppState,
  fn: (plan: DayPlan[]) => DayPlan[]
): AppState {
  const key = s.selectedWeekKey;
  const current = s.weekPlans[key] ?? emptyWeek();
  return { ...s, weekPlans: { ...s.weekPlans, [key]: fn(current) } };
}

export function StoreProvider({
  children,
  token,
  me,
  userName,
  onAuthError,
}: {
  children: ReactNode;
  token: string;
  me: PersonId;
  userName: string;
  onAuthError: () => void;
}) {
  const [state, setState] = useState<AppState>(() => ({
    ...loadState(),
    currentPerson: me,
  }));

  useEffect(() => {
    saveState(state);
  }, [state]);

  // Login determines identity: keep currentPerson pinned to the logged-in
  // person and reflect their account name locally (this syncs to the partner).
  useEffect(() => {
    setState((s) =>
      s.currentPerson === me && s.names[me] === userName
        ? s
        : { ...s, currentPerson: me, names: { ...s.names, [me]: userName } }
    );
  }, [me, userName]);

  const applyRemote = useCallback((next: AppState) => setState(next), []);
  const syncStatus = useSync({
    token,
    me,
    state,
    applyRemote,
    onAuthError,
  });

  const recipes = useMemo(() => allRecipes(state), [state]);
  const plan = useMemo(
    () => state.weekPlans[state.selectedWeekKey] ?? emptyWeek(),
    [state.weekPlans, state.selectedWeekKey]
  );

  const goToWeek = useCallback(
    (offset: number) =>
      setState((s) => {
        const key = addWeeks(s.selectedWeekKey, offset);
        return {
          ...s,
          selectedWeekKey: key,
          weekPlans: s.weekPlans[key]
            ? s.weekPlans
            : { ...s.weekPlans, [key]: emptyWeek() },
        };
      }),
    []
  );

  const copyLastWeek = useCallback(
    () =>
      setState((s) => {
        const prevKey = addWeeks(s.selectedWeekKey, -1);
        const prev = s.weekPlans[prevKey];
        if (!prev) return s;
        const cloned = prev.map((d) => ({ ...d }));
        return {
          ...s,
          weekPlans: { ...s.weekPlans, [s.selectedWeekKey]: cloned },
        };
      }),
    []
  );

  const setName = useCallback(
    (p: PersonId, name: string) =>
      setState((s) => ({ ...s, names: { ...s.names, [p]: name } })),
    []
  );

  const setProfile = useCallback(
    (profile: Profile) => setState((s) => ({ ...s, profile })),
    []
  );

  const assignRecipeToDay = useCallback(
    (day: WeekDay, recipeId: string) =>
      setState((s) =>
        updateSelectedPlan(s, (plan) =>
          plan.map((d) =>
            d.day === day ? { ...d, recipeId, freeText: undefined } : d
          )
        )
      ),
    []
  );

  const setDayFreeText = useCallback(
    (day: WeekDay, text: string) =>
      setState((s) =>
        updateSelectedPlan(s, (plan) =>
          plan.map((d) =>
            d.day === day
              ? {
                  ...d,
                  freeText: text,
                  recipeId: undefined,
                  leftoverFrom: undefined,
                }
              : d
          )
        )
      ),
    []
  );

  const setDayTag = useCallback(
    (day: WeekDay, tag: string) =>
      setState((s) =>
        updateSelectedPlan(s, (plan) =>
          plan.map((d) =>
            d.day === day ? { ...d, tag: tag || undefined } : d
          )
        )
      ),
    []
  );

  const toggleGroceryCheck = useCallback(
    (id: string) =>
      setState((s) => ({
        ...s,
        groceries: s.groceries.map((g) =>
          g.id === id
            ? {
                ...g,
                checked: !g.checked,
                checkedBy: !g.checked ? me : undefined,
              }
            : g
        ),
      })),
    []
  );

  const addGroceryItem = useCallback(
    (text: string, category: GroceryCategory) =>
      setState((s) => ({
        ...s,
        groceries: [
          ...s.groceries,
          {
            id: uid("groc"),
            text: text.trim(),
            category,
            checked: false,
            authorId: me,
            createdAt: Date.now(),
            auto: false,
            comments: [],
          },
        ],
      })),
    []
  );

  const removeGroceryItem = useCallback(
    (id: string) =>
      setState((s) => ({
        ...s,
        groceries: s.groceries.filter((g) => g.id !== id),
      })),
    []
  );

  const addGroceryComment = useCallback(
    (id: string, text: string) =>
      setState((s) => ({
        ...s,
        groceries: s.groceries.map((g) =>
          g.id === id
            ? {
                ...g,
                comments: [
                  ...g.comments,
                  {
                    id: uid("cmt"),
                    authorId: me,
                    text: text.trim(),
                    createdAt: Date.now(),
                  },
                ],
              }
            : g
        ),
      })),
    []
  );

  const suggestSwap = useCallback(
    (id: string, text: string) =>
      setState((s) => ({
        ...s,
        groceries: s.groceries.map((g) =>
          g.id === id
            ? {
                ...g,
                swap: {
                  id: uid("swap"),
                  authorId: me,
                  suggestedText: text.trim(),
                  createdAt: Date.now(),
                },
              }
            : g
        ),
      })),
    []
  );

  const acceptSwap = useCallback(
    (id: string) =>
      setState((s) => ({
        ...s,
        groceries: s.groceries.map((g) =>
          g.id === id && g.swap
            ? { ...g, text: g.swap.suggestedText, swap: undefined }
            : g
        ),
      })),
    []
  );

  const dismissSwap = useCallback(
    (id: string) =>
      setState((s) => ({
        ...s,
        groceries: s.groceries.map((g) =>
          g.id === id ? { ...g, swap: undefined } : g
        ),
      })),
    []
  );

  const addIngredientsToGrocery = useCallback(
    (ingredients: string[]) =>
      setState((s) => {
        const existing = new Set(
          s.groceries.map((g) => g.text.toLowerCase())
        );
        const now = Date.now();
        const additions = [];
        let i = 0;
        for (const line of ingredients) {
          const name = ingredientCoreName(line);
          if (!name || existing.has(name.toLowerCase())) continue;
          existing.add(name.toLowerCase());
          additions.push({
            id: uid("groc"),
            text: name,
            category: categorizeIngredient(line),
            checked: false,
            authorId: me,
            createdAt: now + i,
            auto: false,
            comments: [],
          });
          i += 1;
        }
        if (additions.length === 0) return s;
        return { ...s, groceries: [...s.groceries, ...additions] };
      }),
    []
  );

  const addPantryItem = useCallback(
    (text: string) =>
      setState((s) => {
        const clean = text.trim();
        if (!clean) return s;
        const exists = s.pantry.some(
          (p) => p.toLowerCase() === clean.toLowerCase()
        );
        if (exists) return s;
        return { ...s, pantry: [...s.pantry, clean] };
      }),
    []
  );

  const removePantryItem = useCallback(
    (text: string) =>
      setState((s) => ({
        ...s,
        pantry: s.pantry.filter(
          (p) => p.toLowerCase() !== text.toLowerCase()
        ),
      })),
    []
  );

  const regenerateGroceries = useCallback(
    () =>
      setState((s) => {
        const selectedPlan = s.weekPlans[s.selectedWeekKey] ?? emptyWeek();
        const aggregated = aggregateGroceries(selectedPlan, allRecipes(s));
        const manual = s.groceries.filter((g) => !g.auto);
        const existingAuto = s.groceries.filter((g) => g.auto);
        const now = Date.now();
        const regenerated = aggregated.map((a, i) => {
          const prev = existingAuto.find((g) => g.text === a.name);
          return {
            id: prev?.id ?? uid("groc"),
            text: a.name,
            category: a.category,
            quantity: a.quantity || undefined,
            checked: prev?.checked ?? false,
            checkedBy: prev?.checkedBy,
            authorId: prev?.authorId ?? me,
            createdAt: prev?.createdAt ?? now + i,
            auto: true,
            comments: prev?.comments ?? [],
            swap: prev?.swap,
          };
        });
        return { ...s, groceries: [...regenerated, ...manual] };
      }),
    []
  );

  const postMessage = useCallback(
    (text: string, attachedDay?: WeekDay, attachedRecipeId?: string) =>
      setState((s) => ({
        ...s,
        feed: [
          {
            id: uid("feed"),
            authorId: me,
            text: text.trim(),
            createdAt: Date.now(),
            attachedDay,
            attachedRecipeId,
            reactions: [],
            replies: [],
          },
          ...s.feed,
        ],
      })),
    []
  );

  const reactToMessage = useCallback(
    (id: string, type: ReactionType) =>
      setState((s) => ({
        ...s,
        feed: s.feed.map((m) => {
          if (m.id !== id) return m;
          const existing = m.reactions.find(
            (r) => r.authorId === me && r.type === type
          );
          return {
            ...m,
            reactions: existing
              ? m.reactions.filter(
                  (r) =>
                    !(r.authorId === me && r.type === type)
                )
              : [...m.reactions, { authorId: me, type }],
          };
        }),
      })),
    []
  );

  const replyToMessage = useCallback(
    (id: string, text: string) =>
      setState((s) => ({
        ...s,
        feed: s.feed.map((m) =>
          m.id === id
            ? {
                ...m,
                replies: [
                  ...m.replies,
                  {
                    id: uid("reply"),
                    authorId: me,
                    text: text.trim(),
                    createdAt: Date.now(),
                  },
                ],
              }
            : m
        ),
      })),
    []
  );

  const saveRecipe = useCallback(
    (recipe: Recipe) =>
      setState((s) => {
        const exists = s.userRecipes.some((r) => r.id === recipe.id);
        return {
          ...s,
          userRecipes: exists
            ? s.userRecipes.map((r) => (r.id === recipe.id ? recipe : r))
            : [...s.userRecipes, recipe],
        };
      }),
    []
  );

  const deleteRecipe = useCallback(
    (id: string) =>
      setState((s) => {
        const weekPlans: Record<string, DayPlan[]> = {};
        for (const [key, plan] of Object.entries(s.weekPlans)) {
          weekPlans[key] = plan.map((d) =>
            d.recipeId === id ? { ...d, recipeId: undefined } : d
          );
        }
        return {
          ...s,
          userRecipes: s.userRecipes.filter((r) => r.id !== id),
          weekPlans,
        };
      }),
    []
  );

  const toggleLike = useCallback(
    (recipeId: string) =>
      setState((s) => {
        const p = me;
        const liked = s.preferences.likes[p].includes(recipeId);
        return {
          ...s,
          preferences: {
            likes: {
              ...s.preferences.likes,
              [p]: liked
                ? s.preferences.likes[p].filter((x) => x !== recipeId)
                : [...s.preferences.likes[p], recipeId],
            },
            dislikes: {
              ...s.preferences.dislikes,
              [p]: s.preferences.dislikes[p].filter((x) => x !== recipeId),
            },
          },
        };
      }),
    []
  );

  const toggleDislike = useCallback(
    (recipeId: string) =>
      setState((s) => {
        const p = me;
        const disliked = s.preferences.dislikes[p].includes(recipeId);
        return {
          ...s,
          preferences: {
            dislikes: {
              ...s.preferences.dislikes,
              [p]: disliked
                ? s.preferences.dislikes[p].filter((x) => x !== recipeId)
                : [...s.preferences.dislikes[p], recipeId],
            },
            likes: {
              ...s.preferences.likes,
              [p]: s.preferences.likes[p].filter((x) => x !== recipeId),
            },
          },
        };
      }),
    []
  );

  const setWorkoutForDay = useCallback(
    (day: WeekDay, workoutId: string | null) =>
      setState((s) => ({
        ...s,
        workoutSchedule: s.workoutSchedule.map((d) =>
          d.day === day
            ? { ...d, workoutId, done: { you: false, partner: false } }
            : d
        ),
      })),
    []
  );

  const toggleWorkoutDone = useCallback(
    (day: WeekDay, person: PersonId) =>
      setState((s) => ({
        ...s,
        workoutSchedule: s.workoutSchedule.map((d) =>
          d.day === day
            ? { ...d, done: { ...d.done, [person]: !d.done[person] } }
            : d
        ),
      })),
    []
  );

  const proposeDate = useCallback(
    (input: {
      title: string;
      idea: string;
      when?: string;
      location?: string;
      notes?: string;
      linkedIdeaId?: string;
    }) =>
      setState((s) => ({
        ...s,
        dateProposals: [
          {
            id: uid("date"),
            authorId: me,
            title: input.title.trim(),
            idea: input.idea.trim(),
            when: input.when?.trim() || undefined,
            location: input.location?.trim() || undefined,
            notes: input.notes?.trim() || undefined,
            status: "proposed" as ProposalStatus,
            reactions: [],
            replies: [],
            createdAt: Date.now(),
            linkedIdeaId: input.linkedIdeaId,
          },
          ...s.dateProposals,
        ],
      })),
    []
  );

  const respondToProposal = useCallback(
    (id: string, status: ProposalStatus, counterText?: string) =>
      setState((s) => ({
        ...s,
        dateProposals: s.dateProposals.map((p) =>
          p.id === id
            ? {
                ...p,
                status,
                respondedBy: me,
                counterText:
                  status === "counter"
                    ? counterText?.trim() || p.counterText
                    : p.counterText,
              }
            : p
        ),
      })),
    []
  );

  const reactToProposal = useCallback(
    (id: string, type: ReactionType) =>
      setState((s) => ({
        ...s,
        dateProposals: s.dateProposals.map((p) => {
          if (p.id !== id) return p;
          const existing = p.reactions.find(
            (r) => r.authorId === me && r.type === type
          );
          return {
            ...p,
            reactions: existing
              ? p.reactions.filter(
                  (r) =>
                    !(r.authorId === me && r.type === type)
                )
              : [...p.reactions, { authorId: me, type }],
          };
        }),
      })),
    []
  );

  const replyToProposal = useCallback(
    (id: string, text: string) =>
      setState((s) => ({
        ...s,
        dateProposals: s.dateProposals.map((p) =>
          p.id === id
            ? {
                ...p,
                replies: [
                  ...p.replies,
                  {
                    id: uid("reply"),
                    authorId: me,
                    text: text.trim(),
                    createdAt: Date.now(),
                  },
                ],
              }
            : p
        ),
      })),
    []
  );

  const setDateCity = useCallback(
    (city: string) => setState((s) => ({ ...s, dateCity: city })),
    []
  );

  const value: Store = {
    state,
    recipes,
    me,
    syncStatus,
    plan,
    selectedWeekKey: state.selectedWeekKey,
    setName,
    setProfile,
    goToWeek,
    copyLastWeek,
    assignRecipeToDay,
    setDayFreeText,
    setDayTag,
    toggleGroceryCheck,
    addGroceryItem,
    addIngredientsToGrocery,
    removeGroceryItem,
    addGroceryComment,
    suggestSwap,
    acceptSwap,
    dismissSwap,
    regenerateGroceries,
    addPantryItem,
    removePantryItem,
    postMessage,
    reactToMessage,
    replyToMessage,
    saveRecipe,
    deleteRecipe,
    toggleLike,
    toggleDislike,
    setWorkoutForDay,
    toggleWorkoutDone,
    proposeDate,
    respondToProposal,
    reactToProposal,
    replyToProposal,
    setDateCity,
  };

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
