import type { DateIdea, DateVibe, Season } from "../types";

/** Simple word tokenizer for free-text mood/idea matching. */
function tokenizeText(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

export function currentSeason(date = new Date()): Season {
  const m = date.getMonth();
  if (m <= 1 || m === 11) return "winter";
  if (m <= 4) return "spring";
  if (m <= 7) return "summer";
  return "fall";
}

export interface DateQuery {
  vibes: DateVibe[];
  text: string;
  season: Season;
}

export interface ScoredIdea {
  idea: DateIdea;
  score: number;
  why: string;
}

// Weighted blend of vibe overlap, free-text keyword match, and seasonality —
// mirrors how the recipe recommender blends multiple signals into one score.
const W_VIBE = 0.55;
const W_TEXT = 0.3;
const W_SEASON = 0.15;

export function rankDateIdeas(
  ideas: DateIdea[],
  q: DateQuery
): ScoredIdea[] {
  const qTokens = new Set(tokenizeText(q.text));
  const hasFilter = q.vibes.length > 0 || qTokens.size > 0;

  const scored = ideas.map((idea) => {
    const matchedVibes = idea.vibes.filter((v) => q.vibes.includes(v));
    const vibeOverlap = q.vibes.length
      ? matchedVibes.length / q.vibes.length
      : 0;

    const hay = new Set(
      tokenizeText(
        `${idea.title} ${idea.description} ${idea.vibes.join(" ")} ${idea.category} ${idea.setting}`
      )
    );
    let hits = 0;
    qTokens.forEach((t) => {
      if (hay.has(t)) hits += 1;
    });
    const textMatch = qTokens.size ? hits / qTokens.size : 0;

    const seasonal = idea.seasons.includes(q.season) ? 1 : 0;

    const score = hasFilter
      ? W_VIBE * vibeOverlap + W_TEXT * textMatch + W_SEASON * seasonal
      : 0.5 + 0.5 * seasonal;

    const parts: string[] = [];
    if (matchedVibes.length) parts.push(`${matchedVibes.slice(0, 2).join(" & ")} vibe`);
    if (textMatch > 0) parts.push("matches your idea");
    if (seasonal) parts.push("lovely this season");
    if (idea.budget === "free") parts.push("free");
    const why = parts.length
      ? capitalize(parts.join(", ")) + "."
      : "A sweet little date.";

    return { idea, score, why };
  });

  return scored.sort((a, b) => b.score - a.score);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Build a Google Maps search link for a location-based idea. */
export function mapUrl(idea: DateIdea, city: string): string | null {
  if (idea.atHome || !idea.mapQuery) return null;
  const query = city.trim()
    ? `${idea.mapQuery} near ${city.trim()}`
    : idea.mapQuery;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export const ALL_VIBES: DateVibe[] = [
  "cozy",
  "romantic",
  "foodie",
  "adventurous",
  "chill",
  "playful",
  "artsy",
  "active",
  "cultural",
  "budget",
];

/** Pastel chip styling per vibe, matching the app palette. */
export const VIBE_STYLE: Record<DateVibe, string> = {
  cozy: "bg-peach-soft text-ink/70",
  romantic: "bg-pink-soft text-ink/70",
  foodie: "bg-butter-soft text-ink/70",
  adventurous: "bg-sky-soft text-ink/70",
  chill: "bg-mint-soft text-ink/70",
  playful: "bg-lavender-soft text-ink/70",
  artsy: "bg-lavender-soft text-ink/70",
  active: "bg-sky-soft text-ink/70",
  cultural: "bg-mint-soft text-ink/70",
  budget: "bg-butter-soft text-ink/70",
};
