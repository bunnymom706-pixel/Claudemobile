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
- **Food library** — save any food once (name, brand, serving, macros),
  mark favorites, reuse or edit/delete later.
- **Ad-hoc entries** — log something without saving it to the library, or
  save it to the library at the same time.
- **Trends** — 7/14/30-day charts of calories and macros vs. goal line.
- **Goals** — editable daily calorie/protein/carb/fat targets.

The app seeds itself on first run with today's actual log (2x Barebells
banana caramel bar, 1x Chobani Flip key lime crumble, 2x Built Bar mint,
1x Starbucks venti protein matcha custom order) so it opens with real data
already in place.

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
| GET | `/api/summary?date=` | totals + per-meal breakdown for a day |
| GET | `/api/trends?days=` | daily totals for the last N days |

## Not included (yet)

- No auth — this is a single-user local tool, matching how it's run today.
- No barcode scanning or nutrition-database lookup — foods are entered by
  hand or estimated (the Starbucks custom drink in the seed data is a
  build-your-own estimate, not an official nutrition figure).
