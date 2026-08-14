# u-n-me 🫶

🔗 **Live app:** [youandme-xi.vercel.app](https://youandme-xi.vercel.app)

**Meals, workouts & dates — together.**

`u-n-me` is a **private, two-person** shared life app for a couple: a weekly
meal plan, a collaborative grocery note, a workout planner, a date-night
planner, a lightweight nudge feed, a recipe editor, and real recommenders that
learn what the household likes. It has a tiny serverless backend (Vercel
Functions + Upstash Redis) so both partners see the **same shared data from
their own devices**, with `localStorage` kept as an offline cache.

## The shared-couple concept

There are exactly **two accounts**. Logging in determines your identity — the
first account is **teal** ("you") and the second is **coral** ("partner"), a
stable mapping both people see the same way. Your login authors your changes
(grocery items, comments, nudges, likes, date proposals), shown everywhere via
colored chips, so you can see who checked off the milk, suggested swapping beef
for chicken, or proposed Friday's rooftop date.

A subtle chip near the header shows the live sync status (`synced ✓` /
`syncing…` / `offline`). Names and the household nutrition goal are editable in
Settings; your account name is set from your login and syncs to your partner.

## Features

- **This Week** — multi-week planner (navigate weeks; "copy last week"), 7 day
  cards with tags (e.g. Gym), assigned recipe or free-text meal, leftover-aware
  badges, tap-a-meal recipe detail + swap, and a week **Health Index** summary.
- **Grocery** — auto-generated from the week's recipes plus manual items; each
  line can be checked off, commented on, or have a **swap suggested** that anyone
  can Accept/Dismiss. Grouped by aisle (Produce / Meat / Dairy / Pantry /
  **Household** / Other) — so it doubles as a full shopping list (detergent,
  paper towels, etc.).
- **Discover** — a pantry **"What can I make?"** ranker (pick what you have → get
  recipes by ingredient coverage), plus recommendations, seasonal picks, and
  "more like this".
- **Recipes** — searchable shared library (curated + user-created) with a full
  editor; blank macros auto-estimate from ingredients.
- **Gym** — a shared weekly workout plan (Push / Pull / Legs / Swimming + a
  giant-set Pull circuit), "Together" training days with per-person done checks,
  editable schedule, and an RIR intensity tip.
- **💕 Date Night** — propose a date (title, plan, when, where, notes) and the
  other person can **accept ("I'm up for it!") / counter-offer / decline**, with
  reactions and replies. Plus a **mood + location date-idea suggester**.
- **Feed** — a cute nudge feed with reactions/replies.

## How the recommenders work

Both recommenders are implemented for real, client-side (no external API/server).

### Meals (`src/lib/recommender.ts`, `src/lib/nutrition.ts`)

Final ranking is a transparent weighted blend (`WEIGHTS`):

```
score = 0.40 * macro closeness    (KNN on standardized macros)
      + 0.25 * preference/ingredient similarity  (TF-IDF + cosine)
      + 0.20 * health index        (Nutri-Score-style A–E)
      + 0.15 * seasonal match
```

Ingredient lines are tokenized (quantities/units/stopwords stripped) into TF-IDF
vectors compared with cosine similarity; macro targets come from a simple goal
profile; thumbs up/down build a learned household preference. Inspired by the
approach of **NutriGenius AI** and **macrochefai**, reimplemented from scratch.

### Date ideas (`src/lib/dateRecommender.ts`, `src/data/dateIdeas.ts`)

A curated set of ~30 date ideas tagged with vibes, category, budget, duration,
setting and season. Ideas are ranked by a weighted blend of **vibe overlap**,
**free-text keyword match** (your mood/idea), and **seasonality**:

```
score = 0.55 * vibe overlap + 0.30 * keyword match + 0.15 * season
```

Location awareness is done without a backend or API key: set your city and each
out-of-home idea gets an **"Open in Maps"** deep-link
(`google.com/maps/search`) built from the idea's search term + your city. This
mirrors how open-source date planners work (e.g. **lovetism**, **date-yelper**,
**datespark**, and apps like **Connected**, **PlanMyDate.ai** and **Dates**),
which combine a mood/vibe library with a Google Places / Yelp location layer —
here the location layer is a lightweight Maps link instead of a paid API.

## Run it

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build
npm run preview  # preview the production build
```

Then open the printed local URL. Running `vite dev` with no backend still works:
the app detects there's no `/api` and falls back to pure-`localStorage` mode
(you'll see the `offline` chip). Real login + sync happens once deployed.

## Deploy to Vercel

The app is a Vite SPA with serverless functions in `/api`. Data is stored in
Upstash Redis and shared between the two accounts.

1. **Push this repo** to GitHub/GitLab and import it into Vercel (framework is
   auto-detected as Vite; `vercel.json` wires the SPA fallback and keeps `/api/*`
   routed to the functions).
2. **Provision Upstash Redis via the Vercel Marketplace**: in your Vercel
   project → **Storage** → **Marketplace** → **Upstash for Redis** → create a
   database and connect it. This auto-injects the REST credentials
   (`KV_REST_API_URL` + `KV_REST_API_TOKEN`, or the `UPSTASH_REDIS_REST_*`
   equivalents — both are supported).
3. **Set the remaining environment variables** (Project → Settings →
   Environment Variables) — see below.
4. **Redeploy.** Open the app, log in as one of your two accounts on each
   device, and you're sharing one synced space.

### Required environment variables

| Variable | What it is |
| --- | --- |
| `UNME_SECRET` | HMAC secret used to sign session tokens. Use a long random string (`openssl rand -hex 32`). |
| `UNME_USERS` | JSON array of the two accounts, e.g. `[{"id":"a","name":"Shreya","pass":"changeme1"},{"id":"b","name":"Partner","pass":"changeme2"}]`. Names match case-insensitively; the first is teal ("you"), the second coral ("partner"). |
| `KV_REST_API_URL` | Upstash Redis REST URL (auto-set by the Marketplace integration). |
| `KV_REST_API_TOKEN` | Upstash Redis REST token (auto-set by the Marketplace integration). |

Fallback Redis naming `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` is
also accepted. If `UNME_USERS` is left unset the API falls back to demo accounts
so builds don't crash — **always set `UNME_USERS` in production** so only your
two credentials work. See `.env.example`.

### API endpoints

- `POST /api/login` → `{ token, user }` for a valid `{ name, pass }`.
- `GET /api/state` → `{ state, version }` (requires `Authorization: Bearer`).
- `PUT /api/state` → optimistic-concurrency write `{ state, version }`; returns
  `409` with the current server snapshot on a version mismatch.

## Tech stack

- Vite + React + TypeScript
- Tailwind CSS v3 (`tailwind.config.js` + `postcss.config.js`)
- lucide-react icons
- Backend: Vercel Serverless Functions (`/api/*.ts`, `@vercel/node`)
- Storage: Upstash Redis via `@upstash/redis` (REST); `localStorage` offline cache
- Auth: two accounts + HMAC-SHA256 session tokens (Node `crypto`, no JWT lib)

## Notes

- Data is shared between the two accounts through the backend; each device keeps
  a `localStorage` cache so the app stays usable offline and never white-screens.
- The playful "sticker-scrapbook" design — cream dotted-grid canvas, Bricolage
  Grotesque / Nunito / Caveat type, highlighter accents, tilted white sticker
  cards and a pastel palette — is derived from the user's **portfoliobyshruti.com**
  aesthetic.
