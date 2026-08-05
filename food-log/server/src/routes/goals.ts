import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";

const goalsInput = z.object({
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
});

export const goalsRouter = Router();

goalsRouter.get("/", (req, res) => {
  res.json(db.get().goals);
});

goalsRouter.put("/", (req, res) => {
  const parsed = goalsInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const state = db.get();
  state.goals = { ...parsed.data, updatedAt: new Date().toISOString() };
  db.save();
  res.json(state.goals);
});
