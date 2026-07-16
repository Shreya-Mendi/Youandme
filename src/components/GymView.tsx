import { useMemo, useState } from "react";
import { Check, Dumbbell, Moon, RefreshCw, Users, X } from "lucide-react";
import type { PersonId, WeekDay, Workout, WorkoutDay } from "../types";
import { useStore } from "../store";
import { WORKOUTS, findWorkout } from "../data/workouts";
import { workoutEmoji } from "../lib/emoji";
import { Card, EmojiSticker, PERSON_STYLES, SectionLabel } from "./ui";

function shortLabel(workout: Workout): string {
  const first = workout.name.split(/[(—]/)[0].trim();
  return first.startsWith("Swimming") ? "Swim" : first;
}

export function GymView() {
  const { state, setWorkoutForDay } = useStore();
  const [pickerDay, setPickerDay] = useState<WeekDay | null>(null);

  const { trainingCount, summary } = useMemo(() => {
    const trained = state.workoutSchedule
      .filter((d) => d.workoutId)
      .map((d) => findWorkout(d.workoutId))
      .filter((w): w is Workout => !!w);
    return {
      trainingCount: trained.length,
      summary: trained.map(shortLabel).join("/"),
    };
  }, [state.workoutSchedule]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <EmojiSticker emoji="💪" size="lg" />
          <div>
            <SectionLabel>This week's training</SectionLabel>
            <p className="text-sm font-semibold text-ink/55">
              One shared plan — you train together
            </p>
          </div>
        </div>
        {trainingCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-xs font-bold text-white">
            <Dumbbell className="h-3.5 w-3.5" />
            {trainingCount} training day{trainingCount === 1 ? "" : "s"} ·{" "}
            {summary}
          </span>
        )}
      </div>

      <Card highlighted className="flex items-start gap-3 p-4">
        <EmojiSticker emoji="🔥" size="md" />
        <div>
          <p className="font-display text-sm font-extrabold text-ink">
            Intensity check
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-ink/55">
            Last set of every exercise should feel like 1–2 reps left in the tank
            (RIR 1–2). If you fly past your rep targets, bump the weight 5–10%.
          </p>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {state.workoutSchedule.map((day, i) => (
          <DayCard
            key={day.day}
            day={day}
            rotate={(i % 3 === 0 ? -1 : i % 3 === 1 ? 1 : 0) as -1 | 0 | 1}
            onChange={() => setPickerDay(day.day)}
          />
        ))}
      </div>

      {pickerDay && (
        <WorkoutPicker
          title={`Workout for ${pickerDay}`}
          onPick={(id) => {
            setWorkoutForDay(pickerDay, id);
            setPickerDay(null);
          }}
          onClose={() => setPickerDay(null)}
        />
      )}
    </div>
  );
}

function DayCard({
  day,
  rotate = 0,
  onChange,
}: {
  day: WorkoutDay;
  rotate?: -1 | 0 | 1;
  onChange: () => void;
}) {
  const { toggleWorkoutDone } = useStore();
  const workout = findWorkout(day.workoutId);
  const isRest = !workout;

  return (
    <Card
      hover
      rotate={rotate}
      className={`flex flex-col gap-3 p-4 ${isRest ? "bg-cream" : ""}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <EmojiSticker
            emoji={isRest ? "😴" : workoutEmoji(workout.name)}
            size="sm"
          />
          <span className="font-display text-sm font-extrabold tracking-tight text-ink">
            {day.day}
          </span>
        </div>
        {isRest ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-bold text-ink/45">
            <Moon className="h-3 w-3" />
            Rest
          </span>
        ) : (
          <TogetherBadge />
        )}
      </div>

      {isRest ? (
        <p className="font-hand text-lg text-ink/45">rest & recovery day</p>
      ) : (
        <>
          <div>
            <p className="font-display text-sm font-extrabold text-ink">
              {workout.name}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-ink/55">
              {workout.focus}
            </p>
          </div>

          <div className="space-y-3">
            {workout.groups
              ? workout.groups.map((g) => (
                  <div key={g.title}>
                    <p className="text-xs font-extrabold uppercase tracking-wider text-ink/45">
                      {g.title}
                    </p>
                    {g.note && (
                      <p className="mb-1 text-[11px] italic leading-relaxed text-ink/40">
                        {g.note}
                      </p>
                    )}
                    <ul className="space-y-1.5">
                      {g.exercises.map((ex) => (
                        <ExerciseRow key={ex.name} exercise={ex} />
                      ))}
                    </ul>
                  </div>
                ))
              : (
                  <ul className="space-y-1.5">
                    {workout.exercises?.map((ex) => (
                      <ExerciseRow key={ex.name} exercise={ex} />
                    ))}
                  </ul>
                )}
          </div>

          <div className="mt-auto border-t border-black/5 pt-3">
            <p className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-ink/45">
              Done today
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(["you", "partner"] as PersonId[]).map((p) => (
                <DoneChip
                  key={p}
                  person={p}
                  done={day.done[p]}
                  onToggle={() => toggleWorkoutDone(day.day, p)}
                />
              ))}
            </div>
          </div>
        </>
      )}

      <button
        onClick={onChange}
        className="mt-1 inline-flex w-fit items-center gap-1 rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs font-bold text-ink/60 transition hover:border-ink/30 hover:text-ink"
      >
        <RefreshCw className="h-3 w-3" /> Change
      </button>
    </Card>
  );
}

function ExerciseRow({
  exercise,
}: {
  exercise: { name: string; setsReps: string; note?: string; weight?: string };
}) {
  return (
    <li className="text-sm">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-bold text-ink/85">{exercise.name}</span>
        {exercise.setsReps && (
          <span className="text-xs font-semibold text-ink/50">
            {exercise.setsReps}
          </span>
        )}
        {exercise.weight && (
          <span className="rounded-full bg-teal-50 px-1.5 py-0.5 text-[10px] font-bold text-teal-600">
            {exercise.weight}
          </span>
        )}
      </div>
      {exercise.note && (
        <p className="text-[11px] leading-relaxed text-ink/40">
          {exercise.note}
        </p>
      )}
    </li>
  );
}

function TogetherBadge() {
  const { state } = useStore();
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold text-white">
      <Users className="h-3 w-3" />
      Together
      <span className="ml-0.5 flex items-center gap-1">
        {(["you", "partner"] as PersonId[]).map((p) => (
          <span
            key={p}
            title={state.names[p]}
            className={`h-2.5 w-2.5 rounded-full ${PERSON_STYLES[p].dot} ring-1 ring-white/70`}
          />
        ))}
      </span>
    </span>
  );
}

function DoneChip({
  person,
  done,
  onToggle,
}: {
  person: PersonId;
  done: boolean;
  onToggle: () => void;
}) {
  const { state } = useStore();
  const s = PERSON_STYLES[person];
  return (
    <button
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition ${
        done
          ? `${s.chip}`
          : "border border-black/10 bg-white text-ink/55 hover:border-ink/30"
      }`}
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full ${
          done ? s.dot : "border border-ink/25"
        }`}
      >
        {done && <Check className="h-3 w-3 text-white" />}
      </span>
      {state.names[person]}
    </button>
  );
}

function WorkoutPicker({
  title,
  onPick,
  onClose,
}: {
  title: string;
  onPick: (workoutId: string | null) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-sticker-lg border border-black/5 bg-white shadow-sticker-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-black/5 p-4">
          <h3 className="font-display text-lg font-extrabold tracking-tight text-ink">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-ink/40 hover:bg-black/5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-2">
            <button
              onClick={() => onPick(null)}
              className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-3 text-left transition hover:border-teal-300 hover:bg-teal-50/40"
            >
              <EmojiSticker emoji="😴" size="sm" tilt={false} />
              <div>
                <p className="font-display text-sm font-extrabold text-ink">
                  Rest
                </p>
                <p className="text-xs font-semibold text-ink/40">Recovery day</p>
              </div>
            </button>

            {WORKOUTS.map((w) => (
              <button
                key={w.id}
                onClick={() => onPick(w.id)}
                className="flex items-start gap-3 rounded-2xl border border-black/5 bg-white p-3 text-left transition hover:border-teal-300 hover:bg-teal-50/40"
              >
                <EmojiSticker emoji={workoutEmoji(w.name)} size="sm" tilt={false} />
                <div>
                  <p className="font-display text-sm font-extrabold text-ink">
                    {w.name}
                  </p>
                  <p className="text-xs leading-relaxed text-ink/45">
                    {w.focus}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
