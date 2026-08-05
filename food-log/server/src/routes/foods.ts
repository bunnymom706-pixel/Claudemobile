import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { makeId } from "../utils/id.js";

const foodInput = z.object({
  name: z.string().min(1),
  brand: z.string().optional(),
  servingLabel: z.string().min(1),
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  sugar: z.number().nonnegative().optional(),
  fiber: z.number().nonnegative().optional(),
  isFavorite: z.boolean().optional(),
});

export const foodsRouter = Router();

foodsRouter.get("/", (req, res) => {
  const { foods } = db.get();
  const q = typeof req.query.q === "string" ? req.query.q.toLowerCase() : undefined;
  const favoritesOnly = req.query.favorite === "true";
  let results = foods;
  if (q) {
    results = results.filter(
      (f) => f.name.toLowerCase().includes(q) || f.brand?.toLowerCase().includes(q)
    );
  }
  if (favoritesOnly) {
    results = results.filter((f) => f.isFavorite);
  }
  res.json(results.slice().sort((a, b) => a.name.localeCompare(b.name)));
});

foodsRouter.post("/", (req, res) => {
  const parsed = foodInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const state = db.get();
  const food = {
    id: makeId(),
    createdAt: new Date().toISOString(),
    isFavorite: false,
    ...parsed.data,
  };
  state.foods.push(food);
  db.save();
  res.status(201).json(food);
});

foodsRouter.put("/:id", (req, res) => {
  const parsed = foodInput.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const state = db.get();
  const food = state.foods.find((f) => f.id === req.params.id);
  if (!food) {
    res.status(404).json({ error: "Food not found" });
    return;
  }
  Object.assign(food, parsed.data);
  db.save();
  res.json(food);
});

foodsRouter.delete("/:id", (req, res) => {
  const state = db.get();
  const idx = state.foods.findIndex((f) => f.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: "Food not found" });
    return;
  }
  state.foods.splice(idx, 1);
  db.save();
  res.status(204).end();
});
