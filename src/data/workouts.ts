import type { Workout } from "../types";

// Shared workout library for the couple's weekly training plan.
// Seed workouts referenced by the default schedule use stable ids (wk-*).
export const WORKOUTS: Workout[] = [
  {
    id: "wk-push",
    name: "Push (Chest, Shoulders, Triceps)",
    focus: "Progressive overload on compounds; track heavy working weights.",
    exercises: [
      {
        name: "Incline Dumbbell Press",
        setsReps: "3–4 sets × 6–8 reps (Heavy)",
        note: "Approach failure by the final rep (baseline ~40–50 lb per dumbbell).",
      },
      {
        name: "Seated Overhead Press (Barbell or Machine)",
        setsReps: "3 sets × 8–10 reps",
        note: "Moderately heavy; prioritize overhead stability.",
      },
      {
        name: "Cable Flyes / Pec Dec",
        setsReps: "3 sets × 12–15 reps",
        note: "High volume; squeeze at the peak.",
      },
      {
        name: "Tricep Overhead Extensions (Cable or Rope)",
        setsReps: "3 sets × 10–12 reps",
      },
    ],
  },
  {
    id: "wk-pull",
    name: "Pull (Back & Biceps)",
    focus: "Vertical & horizontal pulling; high intensity, spare the lower back.",
    exercises: [
      {
        name: "Weighted or Assisted Pull-Ups",
        setsReps: "3 sets × 6–8 reps",
        note: "If assisted, minimize counterweight; if weighted, add a challenging 5–10 lb.",
      },
      {
        name: "Heavy T-Bar Row or Chest-Supported Row",
        setsReps: "3 sets × 8 reps",
        note: "Heavy compound.",
      },
      {
        name: "Lat Pulldown (Giant Set / Circuit)",
        setsReps: "3 sets × 10–12 reps",
      },
      {
        name: "Incline Dumbbell Bicep Curls",
        setsReps: "3 sets × 10–12 reps",
        note: "Focus on the full stretch.",
      },
    ],
  },
  {
    id: "wk-legs",
    name: "Legs (Quads, Hamstrings, Glutes)",
    focus: "Heavy machine-based work to safely hit failure.",
    exercises: [
      {
        name: "Leg Press",
        setsReps: "4 sets × 8–10 reps",
        note: "Heavy compound; full range of motion.",
      },
      {
        name: "Romanian Deadlifts (Dumbbell or Barbell)",
        setsReps: "3 sets × 8–10 reps",
        note: "Focus on hamstring/glute stretch.",
      },
      {
        name: "Leg Extensions super-set Seated Leg Curls",
        setsReps: "3 sets × 12–15 reps each",
        note: "Machine circuit finisher.",
      },
    ],
  },
  {
    id: "wk-swim",
    name: "Swimming (Endurance & Active Recovery)",
    focus: "Steady-state pacing; flush soreness. No heavy resistance.",
    exercises: [
      {
        name: "Warm-up",
        setsReps: "200m",
        note: "Easy freestyle/breaststroke mix.",
      },
      {
        name: "Main Set",
        setsReps: "4–6 × 100m",
        note: "Steady moderate pace (RPE 6–7), rest 30s between.",
      },
      {
        name: "Cool-down",
        setsReps: "100m",
        note: "Very slow, relaxed backstroke or breaststroke.",
      },
    ],
  },
  {
    id: "wk-pull-giant",
    name: "Pull — Giant Set Circuit",
    focus: "4 rounds back-to-back, minimal rest within a round; full rest after each round.",
    groups: [
      {
        title: "Giant Set Circuit (4 Rounds)",
        note: "Perform back-to-back with minimal rest; full rest only after a whole round.",
        exercises: [
          {
            name: "Assisted Pull-Ups",
            setsReps: "4 sets × 6–7 reps",
            weight: "110 lb counterweight",
          },
          {
            name: "Lat Pulldowns",
            setsReps: "4 sets × 6–7 reps",
            weight: "55 lb",
          },
          {
            name: "Seated Cable Rows (standard)",
            setsReps: "4 sets × 6–7 reps",
            weight: "40 lb",
          },
        ],
      },
      {
        title: "Isolated Back Finisher",
        exercises: [
          {
            name: "Seated Cable Rows (V-Bar)",
            setsReps: "4 sets × 10 reps",
            note: "Squeeze hard at peak; target mid-back & lats.",
          },
        ],
      },
      {
        title: "Arms & Accessory",
        exercises: [
          {
            name: "Dumbbell Bicep Curls",
            setsReps: "3–4 sets × 10–12 reps",
          },
          {
            name: "Rear Delt Flyes (Machine or Dumbbell)",
            setsReps: "3–4 sets × 12–15 reps",
          },
        ],
      },
      {
        title: "Cardio Burnout",
        exercises: [
          {
            name: "Finisher — Incline Treadmill Walking or Rowing Machine",
            setsReps: "",
            note: "Cap off the calorie burn.",
          },
        ],
      },
    ],
  },
];

export function findWorkout(id: string | null | undefined): Workout | undefined {
  if (!id) return undefined;
  return WORKOUTS.find((w) => w.id === id);
}
