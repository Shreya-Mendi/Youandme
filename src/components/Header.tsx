import { useState } from "react";
import { LogOut, Settings2, X } from "lucide-react";
import type { Goal } from "../types";
import { useStore } from "../store";
import { useAuth } from "../auth";
import type { SyncStatus } from "../lib/sync";
import {
  Card,
  EmojiSticker,
  Highlight,
  Input,
  PERSON_STYLES,
  SectionLabel,
  TealButton,
} from "./ui";

function SyncChip({ status }: { status: SyncStatus }) {
  const style =
    status === "synced"
      ? "bg-mint-soft text-teal-700"
      : status === "connecting"
        ? "bg-butter-soft text-ink/60"
        : "bg-black/5 text-ink/45";
  const label =
    status === "synced"
      ? "synced ✓"
      : status === "connecting"
        ? "syncing…"
        : "offline";
  return (
    <span
      title={
        status === "offline"
          ? "Can't reach the cloud — changes are saved on this device."
          : "Shared privately between the two of you."
      }
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${style}`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          status === "synced"
            ? "bg-teal-500"
            : status === "connecting"
              ? "bg-butter"
              : "bg-ink/30"
        }`}
      />
      {label}
    </span>
  );
}

export function Header() {
  const { state, me, syncStatus } = useStore();
  const { logout } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const meStyle = PERSON_STYLES[me];

  return (
    <header className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <EmojiSticker emoji="🫶" size="lg" />
          <div>
            <h1 className="font-display text-3xl font-extrabold lowercase tracking-tight text-ink">
              u-n-me
            </h1>
            <p className="text-sm font-semibold text-ink/55">
              Meals, workouts &amp; dates — <Highlight>together.</Highlight>
            </p>
          </div>

          <div className="relative ml-1 hidden shrink-0 sm:block">
            <img
              src="/couple-sticker.png"
              alt="A couple cooking together"
              className="h-28 w-auto rotate-3 drop-shadow-[0_12px_20px_rgba(20,20,20,0.22)] md:h-36 lg:h-40"
            />
            <EmojiSticker
              emoji="🍛"
              size="sm"
              className="absolute -left-3 top-1"
            />
            <EmojiSticker
              emoji="🥑"
              size="sm"
              className="absolute -bottom-2 left-8 !rotate-6"
            />
            <EmojiSticker
              emoji="🫙"
              size="sm"
              className="absolute -right-3 top-6 !-rotate-6"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <SyncChip status={syncStatus} />
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold shadow-sm ${meStyle.chip}`}
            title="You're logged in — the app authors your changes."
          >
            <span className={`h-2 w-2 rounded-full ${meStyle.dot}`} />
            {state.names[me]}
          </span>
          <button
            onClick={() => setShowSettings(true)}
            title="Settings"
            className="rounded-full border border-black/10 bg-white p-2.5 text-ink/50 transition hover:border-ink/30 hover:text-ink"
          >
            <Settings2 className="h-4 w-4" />
          </button>
          <button
            onClick={logout}
            title="Log out"
            className="rounded-full border border-black/10 bg-white p-2.5 text-ink/50 transition hover:border-ink/30 hover:text-ink"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </header>
  );
}

function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { state, setName, setProfile } = useStore();
  const { profile } = state;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <SectionLabel>Settings</SectionLabel>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-ink/40 hover:bg-black/5"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-bold text-ink/55">Names</p>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={state.names.you}
                  onChange={(v) => setName("you", v)}
                  className="w-full"
                />
                <Input
                  value={state.names.partner}
                  onChange={(v) => setName("partner", v)}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold text-ink/55">
                Household goal
              </p>
              <div className="flex gap-2">
                {(["cut", "maintain", "bulk"] as Goal[]).map((g) => (
                  <button
                    key={g}
                    onClick={() => setProfile({ ...profile, goal: g })}
                    className={`flex-1 rounded-full px-3 py-1.5 text-sm font-bold capitalize transition ${
                      profile.goal === g
                        ? "bg-ink text-white shadow-md"
                        : "border border-black/10 bg-white text-ink/60 hover:border-ink/30"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-ink/55">
                  Base kcal/day
                </span>
                <Input
                  value={String(profile.baseCalories)}
                  onChange={(v) =>
                    setProfile({
                      ...profile,
                      baseCalories: Number(v) || 0,
                    })
                  }
                  className="w-full"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-ink/55">
                  Meals/day
                </span>
                <Input
                  value={String(profile.mealsPerDay)}
                  onChange={(v) =>
                    setProfile({
                      ...profile,
                      mealsPerDay: Math.max(Number(v) || 1, 1),
                    })
                  }
                  className="w-full"
                />
              </label>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <TealButton onClick={onClose}>Done</TealButton>
          </div>
        </Card>
      </div>
    </div>
  );
}
