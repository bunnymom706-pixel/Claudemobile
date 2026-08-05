import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { makeId } from "./utils/id.js";
import type { DbShape, Food } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "foodlog.json");

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

interface SeedFood extends Omit<Food, "id" | "createdAt"> {
  loggedServings: number;
}

const SEED_FOODS: SeedFood[] = [
  {
    name: "Protein Bar - Banana Caramel",
    brand: "Barebells",
    servingLabel: "1 bar (55g)",
    calories: 200,
    protein: 20,
    carbs: 17,
    fat: 8,
    sugar: 1,
    isFavorite: true,
    loggedServings: 2,
  },
  {
    name: "Flip - Key Lime Crumble",
    brand: "Chobani",
    servingLabel: "1 cup (145g)",
    calories: 160,
    protein: 11,
    carbs: 21,
    fat: 5,
    sugar: 15,
    isFavorite: true,
    loggedServings: 1,
  },
  {
    name: "Puff Bar - Mint Chocolate",
    brand: "Built Bar",
    servingLabel: "1 bar (49g)",
    calories: 135,
    protein: 17,
    carbs: 14,
    fat: 4.5,
    fiber: 7,
    isFavorite: true,
    loggedServings: 2,
  },
  {
    name: "Venti Protein Matcha Latte + 4 scoops Legendary + orange protein cold foam",
    brand: "Starbucks (custom order)",
    servingLabel: "1 venti (custom build)",
    calories: 390,
    protein: 50,
    carbs: 29,
    fat: 9.5,
    isFavorite: true,
    loggedServings: 1,
  },
];

function defaultDb(): DbShape {
  const now = new Date().toISOString();
  const date = todayStr();

  const foods: Food[] = SEED_FOODS.map(({ loggedServings: _loggedServings, ...f }) => ({
    ...f,
    id: makeId(),
    createdAt: now,
  }));

  const logs = foods.map((f, i) => {
    const servings = SEED_FOODS[i].loggedServings;
    return {
      id: makeId(),
      foodId: f.id,
      foodName: f.name,
      brand: f.brand,
      servings,
      mealType: "snack" as const,
      calories: f.calories * servings,
      protein: f.protein * servings,
      carbs: f.carbs * servings,
      fat: f.fat * servings,
      loggedDate: date,
      loggedAt: now,
    };
  });

  return {
    foods,
    logs,
    exercises: [],
    goals: {
      calories: 2000,
      protein: 150,
      carbs: 200,
      fat: 65,
      updatedAt: now,
    },
    settings: { healthSyncMode: "reconcile" },
  };
}

let cache: DbShape | null = null;

function load(): DbShape {
  if (cache) return cache;
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(DATA_FILE)) {
    cache = defaultDb();
    persist();
    return cache;
  }
  cache = JSON.parse(readFileSync(DATA_FILE, "utf-8")) as DbShape;
  // Forward-migrate files written by earlier versions.
  if (!cache.exercises) cache.exercises = [];
  for (const e of cache.exercises) {
    if (!e.source) e.source = "manual";
  }
  if (!cache.settings) cache.settings = { healthSyncMode: "reconcile" };
  return cache;
}

function persist(): void {
  if (!cache) return;
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify(cache, null, 2), "utf-8");
}

export const db = {
  get(): DbShape {
    return load();
  },
  save(): void {
    persist();
  },
};
