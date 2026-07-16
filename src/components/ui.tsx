import type { ReactNode } from "react";
import type { PersonId } from "../types";
import type { HealthGrade } from "../lib/nutrition";
import { gradeColor } from "../lib/nutrition";
import { useStore } from "../store";

export function Card({
  children,
  className = "",
  highlighted = false,
  rotate = 0,
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  highlighted?: boolean;
  /** -1 / 0 / 1 → subtle sticker tilt. */
  rotate?: -1 | 0 | 1;
  hover?: boolean;
}) {
  const base = highlighted
    ? "border border-teal-200 bg-teal-50/50"
    : "border border-black/5 bg-white";
  const tilt =
    rotate === -1 ? "-rotate-1" : rotate === 1 ? "rotate-1" : "rotate-0";
  const hoverCls = hover
    ? "transition duration-200 hover:-translate-y-1 hover:shadow-sticker-lg"
    : "transition duration-200";
  return (
    <div
      className={`rounded-sticker ${base} shadow-sticker ${tilt} ${hoverCls} ${className}`}
    >
      {children}
    </div>
  );
}

/** Butter-yellow hand-drawn highlighter swipe behind text. */
export function Highlight({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={`highlight-mark ${className}`}>{children}</span>;
}

const DOT_COLORS = ["bg-pink", "bg-butter", "bg-mint", "bg-sky"];

/** Little cluster of colored dots for the corner of feature cards. */
export function StickerDots({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {DOT_COLORS.map((c) => (
        <span key={c} className={`h-2 w-2 rounded-full ${c}`} />
      ))}
    </span>
  );
}

/** Big emoji presented as a sticker: white circle, thin ring, soft shadow. */
export function EmojiSticker({
  emoji,
  size = "md",
  tilt = true,
  className = "",
}: {
  emoji: string;
  size?: "sm" | "md" | "lg";
  tilt?: boolean;
  className?: string;
}) {
  const dims =
    size === "lg"
      ? "h-12 w-12 text-2xl"
      : size === "sm"
        ? "h-7 w-7 text-base"
        : "h-9 w-9 text-lg";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-white leading-none ring-1 ring-black/5 shadow-[0_4px_10px_-3px_rgba(20,20,20,0.25)] ${dims} ${
        tilt ? "-rotate-3" : ""
      } ${className}`}
    >
      {emoji}
    </span>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-extrabold uppercase tracking-wider text-ink/45">
      {children}
    </p>
  );
}

export function Pill({
  active,
  onClick,
  children,
  className = "",
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${
        active
          ? "scale-[1.04] bg-ink text-white shadow-sticker"
          : "border border-black/10 bg-white text-ink/60 hover:border-ink/30 hover:text-ink"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function TealButton({
  onClick,
  children,
  className = "",
  type = "button",
  disabled = false,
}: {
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full bg-teal-500 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  onClick,
  children,
  className = "",
}: {
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm font-bold text-ink/60 transition hover:border-ink/30 hover:text-ink ${className}`}
    >
      {children}
    </button>
  );
}

export function HealthBadge({
  grade,
  className = "",
}: {
  grade: HealthGrade;
  className?: string;
}) {
  return (
    <span
      title={`Health grade ${grade}`}
      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-extrabold ring-1 ring-black/5 ${gradeColor(
        grade
      )} ${className}`}
    >
      {grade}
    </span>
  );
}

export const PERSON_STYLES: Record<
  PersonId,
  { chip: string; dot: string; text: string }
> = {
  you: {
    chip: "bg-teal-100 text-teal-700",
    dot: "bg-teal-500",
    text: "text-teal-600",
  },
  partner: {
    chip: "bg-pink-soft text-pink-700",
    dot: "bg-pink",
    text: "text-pink-600",
  },
};

export function PersonChip({
  person,
  showName = true,
}: {
  person: PersonId;
  showName?: boolean;
}) {
  const { state } = useStore();
  const s = PERSON_STYLES[person];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-bold ${s.chip}`}
    >
      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
      {showName && state.names[person]}
    </span>
  );
}

export function Input({
  value,
  onChange,
  placeholder,
  className = "",
  onKeyDown,
  type = "text",
  autoFocus = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  type?: "text" | "password";
  autoFocus?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      onKeyDown={onKeyDown}
      type={type}
      autoFocus={autoFocus}
      className={`rounded-2xl border border-black/10 bg-cream px-3 py-2 text-sm font-medium text-ink outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 ${className}`}
    />
  );
}
