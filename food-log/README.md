# Food Log

A daily food and macro tracker: log meals, build a reusable food library, watch
calories/protein/carbs/fat against daily goals, and see trends over time.

## Stack

- **Server**: Node + Express + TypeScript. Persists to a local JSON file
  (`server/data/foodlog.json`, gitignored) — no native modules, no external
  database to provision.
- **Client**: React + TypeScript + Vite + Tailwind + Recharts.

## Features

- **Dashboard** — macro rings (calories/protein/carbs/fat) against daily
  goals, meals grouped into breakfast/lunch/dinner/snacks, date navigation.
- **Quick add** — one-tap re-logging of favorite foods.
- **Food database lookup** — search by name or look a product up by
  barcode to pull its real label macros instead of guessing. Results are
  labeled with where the numbers came from (see "How exact are the
  numbers" below). One tap saves the product to your library and logs it.
- **Exercise / eat-back** — log calories burned and they're added to the
  day's calorie goal (goal + burned), so the ring shows what's actually
  left to eat.
- **Health sync** — your phone can push its active-energy total to the app
  automatically, no typing. See "Getting burned calories from your phone".
- **Food library** — save any food once (name, brand, serving, macros),
  mark favorites, reuse or edit/delete later.
- **Ad-hoc entries** — log something without saving it to the library, or
  save it to the library at the same time.
- **Trends** — 7/14/30-day charts of calories and macros vs. goal line.
- **Plan** — enter your stats and goal weight to get calorie options at
  several rates of loss, with honest timelines. One tap sets your targets.
- **Goals** — editable daily calorie/protein/carb/fat targets.

The app seeds itself on first run with a starting log (2x Barebells banana
caramel bar, 1x Chobani Flip key lime crumble, 2x Built Bar mint, 1x
Starbucks venti protein matcha custom order) so it opens with data already
in place. **Those seeded macros are estimates, not looked-up values** —
re-add them via barcode lookup to replace them with real label numbers.

## How exact are the numbers

Every database result is tagged with the basis it was derived from:

| Tag | Meaning |
| --- | --- |
| `exact label` | Straight off the product's label serving. Trust it. |
| `Scaled from per-100g` | Per-100g values multiplied by the serving weight. Right for uniform foods, off for anything where the serving isn't a clean weight. |
| `Per 100 g` | No serving size on record — values are per 100 g, so set servings accordingly. |

Barcode lookup is the most exact path: it identifies one specific product
rather than guessing from a name. Anything not `exact label` is worth a
glance at the package before saving.

Some things can never come from a database — a custom Starbucks build, a
homemade meal — and are estimates no matter what. The seeded matcha drink
is one of those.

## Running it

One command, from `food-log/`:

```bash
cd food-log
npm install
npm run install:all
npm run dev       # runs server (:4001) and client (:5173) together
```

Open http://localhost:5173.

Or run the two processes yourself in separate terminals:

```bash
cd food-log/server && npm install && npm run dev      # http://localhost:4001
cd food-log/client && npm install && npm run dev      # http://localhost:5173, proxies /api to the server
```

### Production build

```bash
cd food-log/server && npm install && npm run build && npm start
cd food-log/client && npm install && npm run build && npm run preview
```

## Data

All data lives in `food-log/server/data/foodlog.json`, created on first run
and gitignored — it's personal food-log data, not something that belongs in
a public repo. Back it up yourself if you want history preserved across
container rebuilds.

## API

| Method | Path | Purpose |
|---|---|---|
| GET/POST | `/api/foods` | list (supports `?q=` search, `?favorite=true`) / create |
| PUT/DELETE | `/api/foods/:id` | update / delete a food |
| GET/POST | `/api/logs` | list for a date (`?date=YYYY-MM-DD`) / create an entry |
| PUT/DELETE | `/api/logs/:id` | update / delete a log entry |
| GET/PUT | `/api/goals` | read / set daily macro targets |
| GET/POST | `/api/exercises` | list for a date / log calories burned |
| DELETE | `/api/exercises/:id` | delete an exercise entry |
| POST | `/api/health/sync` | receive active energy pushed from a phone |
| GET/PUT | `/api/settings` | read / set `healthSyncMode`, `exerciseEatBackPercent` |
| GET/PUT | `/api/profile` | read / save your stats and goal weight |
| GET | `/api/profile/plan` | calorie options for the saved profile |
| POST | `/api/profile/plan/preview` | options for stats passed inline |
| GET | `/api/status` | liveness check |
| GET | `/api/lookup/search?q=` | search the nutrition databases |
| GET | `/api/lookup/barcode/:code` | exact product by UPC |
| GET | `/api/summary?date=` | totals, per-meal breakdown, burned + adjusted goal |
| GET | `/api/trends?days=` | daily totals (incl. burned) for the last N days |

## Setting a calorie target (the Plan tab)

Pick a goal (**lose / maintain / gain**), enter your stats, and choose a
macro split. The app estimates:

- **Resting burn (BMR)** via Mifflin-St Jeor
- **Maintenance (TDEE)** = BMR × an activity multiplier
- **Base calories** = maintenance − a deficit, at four rates of loss

**Base already contains the deficit.** That's why exercise calories get
added on top without breaking anything: eat back everything you burn and
the deficit stays exactly where you set it. It also means exercise alone
won't speed up loss if you eat all of it back — bank part of it to go
faster.

### Macro splits

Four presets, switchable without recalculating everything:

| Split | Protein | Rest of the calories |
| --- | --- | --- |
| Balanced | 0.8 g/lb goal weight | 55% carbs / 45% fat |
| High protein | 1.0 g/lb | 50/50 |
| Lower carb | 1.0 g/lb | 25% carbs / 75% fat |
| Keto | 0.85 g/lb | carbs capped at 25 g, rest fat |

**Protein is set per pound of goal weight, not as a percentage of
calories.** A percentage quietly under-delivers protein exactly when
calories are lowest — which is when lean mass is most at risk. Anchoring it
avoids that. If a split drives fat below ~0.3 g/lb, the option says so.

### Pick your activity level excluding workouts

The multipliers assume your baseline day *without* the exercise you log.
Choosing "very active" because you train hard, and then also logging those
workouts, counts the same burn twice and inflates your budget. When in
doubt pick the lower level and let logged exercise do the rest.

### The floor

Targets are held at 1200 kcal (female) / 1500 (male) — below that it's hard
to hit micronutrient needs without supervision. If a pace would require
going under, the app clamps it and tells you the rate that actually
results, rather than quietly promising a number it can't deliver.

Smaller and less active means the floor binds sooner: an aggressive pace
and the fastest pace can collapse to the same real-world rate. That's
information, not a bug.

### Not medical advice

These are population-average formulas, accurate to roughly ±10% for any
individual, and the "3500 kcal per pound" rule overstates loss over long
stretches. Use the numbers as a starting point and adjust from what the
scale actually does over a few weeks. For a large or fast loss, talk to a
doctor or dietitian.

## Getting burned calories from your phone

**Apple Health has no cloud API.** Its data lives on your device, and only a
native iOS app with HealthKit permission can read it — that's how
MyFitnessPal does it. A web app can't pull from Health no matter what.

So the phone pushes instead. The app exposes `POST /api/health/sync`, and
anything that can send JSON on a schedule can drive it.

### Option A — Apple Shortcuts (free, no extra app)

1. Shortcuts app → **Automation** → **+** → **Time of Day**, set ~11:30pm,
   Run Immediately.
2. Add action **Find Health Samples**: type `Active Energy`, sort by Start
   Date, and set the date range to Today. Add **Calculate Statistics** → Sum.
3. Add action **Get Contents of URL**:
   - URL: `http://<your-computer>:4001/api/health/sync`
   - Method: `POST`, Request Body: `JSON`
   - Field `activeEnergy` (Number) → the Sum from step 2
4. Your phone and the computer running the server must be on the same
   network. If you set `HEALTH_SYNC_TOKEN`, add a header
   `Authorization: Bearer <token>`.

Omitting the date means "today", which is what you want for a nightly run.

### Option B — Health Auto Export (paid app, most automatic)

Point its REST API export at `http://<your-computer>:4001/api/health/sync`
and select the **Active Energy** metric. Its native payload shape is parsed
as-is; no field mapping needed.

### Option C — anything else

Any of these work:

```bash
curl -X POST http://localhost:4001/api/health/sync \
  -H 'Content-Type: application/json' \
  -d '{"activeEnergy": 512}'                          # today

curl ... -d '{"date":"2026-08-05","activeEnergy":512}' # specific day
curl ... -d '{"entries":[{"date":"2026-08-05","activeEnergy":512}]}'  # backfill
```

Syncing the same day again **corrects** that day rather than adding a second
entry, so running it hourly is safe.

### How much of your burn gets added back

Settings → Exercise calories controls the share of burned calories credited
to the day's goal: **0 / 50 / 75 / 100%**, defaulting to 50.

100% is not the safe default. Wearables overestimate calorie burn by around
30% on average across studies, with individual devices off by considerably
more — so crediting everything the tracker claims is the most common way a
deficit quietly disappears. Half is the usual recommendation.

Set it to **0%** to treat exercise as bonus deficit: your target stays flat
regardless of training, and anything you burn makes you lose faster than the
plan says. That's the setting for "I want to eat under."

The dashboard always shows both numbers — what you burned, and what was
credited — so the difference is never hidden.

### Avoiding double-counted calories

If your phone says you burned 512 kcal and you also hand-logged a 300 kcal
run, the honest total is **512, not 812** — your phone already counted the
run. That's the default (`reconcile`) and it matches MyFitnessPal's
"adjustment" behavior. The dashboard shows the reconciliation when both
sources are present.

Switch to `add` in Settings only if your health source genuinely excludes
what you log by hand.

### A note on security

The sync endpoint accepts writes. On a home network that's fine. If the
server is reachable from anywhere else, set a shared secret:

```bash
HEALTH_SYNC_TOKEN=some-long-random-string npm run dev
```

Then send `Authorization: Bearer some-long-random-string` with each sync.

### What this does not do

- No Apple Watch/iPhone step or heart-rate data — active energy only.
- No pull-based sync. If your phone doesn't push, nothing arrives.
- Not connected to Strava, Fitbit, Garmin, or Whoop. Those have real cloud
  APIs and could be added; Apple Health can't be.

## Nutrition data sources

- **Open Food Facts** — packaged/branded foods worldwide. No API key, used
  automatically for both search and barcode lookup.
- **USDA FoodData Central** — better for generic whole foods ("chicken
  breast", "banana"). Optional: get a free key at
  <https://fdc.nal.usda.gov/api-key-signup.html> and start the server with
  `FDC_API_KEY=yourkey npm run dev`. Skipped silently when unset.

Results are cached for 24 hours. If a lookup fails, the app says so and
falls back to manual entry rather than inventing numbers.

## Not included (yet)

- No auth — this is a single-user local tool, matching how it's run today.
- Barcode entry is by typing the digits; there's no camera scanner yet.
- Health sync is push-only and covers active energy; see the section above.
