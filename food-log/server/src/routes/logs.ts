import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { makeId } from "../utils/id.js";
import type { Food } from "../types.js";

const mealTypeSchema = z.enum(["breakfast", "lunch", "dinner", "snack"]);

const logInput = z.object({
  foodId: z.string().nullable().optional(),
  foodName: z.string().min(1).optional(),
  brand: z.string().optional(),
  servings: z.number().positive().default(1),
  mealType: mealTypeSchema,
  loggedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional(),
  calories: z.number().nonnegative().optional(),
  protein: z.number().nonnegative().optional(),
  carbs: z.number().nonnegative().optional(),
  fat: z.number().nonnegative().optional(),
});

function resolveMacros(
  input: z.infer<typeof logInput>,
  food: Food | undefined
): { foodName: string; brand?: string; calories: number; protein: number; carbs: number; fat: number } {
  const base = food ?? {
    name: input.foodName ?? "Custom entry",
    brand: input.brand,
    calories: input.calories ?? 0,
    protein: input.protein ?? 0,
    carbs: input.carbs ?? 0,
    fat: input.fat ?? 0,
  };
  return {
    foodName: food ? food.name : input.foodName ?? base.name,
    brand: food ? food.brand : input.brand,
    calories: base.calories * input.servings,
    protein: base.protein * input.servings,
    carbs: base.carbs * input.servings,
    fat: base.fat * input.servings,
  };
}

export const logsRouter = Router();

logsRouter.get("/", (req, res) => {
  const { logs } = db.get();
  const date = typeof req.query.date === "string" ? req.query.date : undefined;
  const results = date ? logs.filter((l) => l.loggedDate === date) : logs;
  res.json(
    results.slice().sort((a, b) => a.loggedAt.localeCompare(b.loggedAt))
  );
});

logsRouter.post("/", (req, res) => {
  const parsed = logInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const state = db.get();
  const food = parsed.data.foodId
    ? state.foods.find((f) => f.id === parsed.data.foodId)
    : undefined;

  if (parsed.data.foodId && !food) {
    res.status(404).json({ error: "Food not found" });
    return;
  }
  if (!food && !parsed.data.foodName) {
    res.status(400).json({ error: "foodName is required for ad-hoc entries" });
    return;
  }

  const macros = resolveMacros(parsed.data, food);
  const entry = {
    id: makeId(),
    foodId: food?.id ?? null,
    servings: parsed.data.servings,
    mealType: parsed.data.mealType,
    loggedDate: parsed.data.loggedDate,
    loggedAt: new Date().toISOString(),
    notes: parsed.data.notes,
    ...macros,
  };
  state.logs.push(entry);
  db.save();
  res.status(201).json(entry);
});

logsRouter.put("/:id", (req, res) => {
  const parsed = logInput.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const state = db.get();
  const entry = state.logs.find((l) => l.id === req.params.id);
  if (!entry) {
    res.status(404).json({ error: "Log entry not found" });
    return;
  }

  const servings = parsed.data.servings ?? entry.servings;
  const mealType = parsed.data.mealType ?? entry.mealType;
  const loggedDate = parsed.data.loggedDate ?? entry.loggedDate;
  const food = entry.foodId ? state.foods.find((f) => f.id === entry.foodId) : undefined;

  Object.assign(entry, {
    servings,
    mealType,
    loggedDate,
    notes: parsed.data.notes ?? entry.notes,
  });

  if (food) {
    entry.calories = food.calories * servings;
    entry.protein = food.protein * servings;
    entry.carbs = food.carbs * servings;
    entry.fat = food.fat * servings;
  } else if (
    parsed.data.calories !== undefined ||
    parsed.data.protein !== undefined ||
    parsed.data.carbs !== undefined ||
    parsed.data.fat !== undefined
  ) {
    entry.calories = parsed.data.calories ?? entry.calories;
    entry.protein = parsed.data.protein ?? entry.protein;
    entry.carbs = parsed.data.carbs ?? entry.carbs;
    entry.fat = parsed.data.fat ?? entry.fat;
  }

  db.save();
  res.json(entry);
});

logsRouter.delete("/:id", (req, res) => {
  const state = db.get();
  const idx = state.logs.findIndex((l) => l.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: "Log entry not found" });
    return;
  }
  state.logs.splice(idx, 1);
  db.save();
  res.status(204).end();
});
