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
- **Food library** — save any food once (name, brand, serving, macros),
  mark favorites, reuse or edit/delete later.
- **Ad-hoc entries** — log something without saving it to the library, or
  save it to the library at the same time.
- **Trends** — 7/14/30-day charts of calories and macros vs. goal line.
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
| GET | `/api/lookup/search?q=` | search the nutrition databases |
| GET | `/api/lookup/barcode/:code` | exact product by UPC |
| GET | `/api/summary?date=` | totals, per-meal breakdown, burned + adjusted goal |
| GET | `/api/trends?days=` | daily totals (incl. burned) for the last N days |

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
- No sync with Apple Health, Google Fit, or other tracking apps. Exercise
  calories are entered by hand.
