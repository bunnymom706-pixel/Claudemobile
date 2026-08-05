import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { makeId } from "../utils/id.js";

const exerciseInput = z.object({
  name: z.string().min(1),
  caloriesBurned: z.number().positive(),
  loggedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const exercisesRouter = Router();

exercisesRouter.get("/", (req, res) => {
  const { exercises } = db.get();
  const date = typeof req.query.date === "string" ? req.query.date : undefined;
  const results = date ? exercises.filter((e) => e.loggedDate === date) : exercises;
  res.json(results.slice().sort((a, b) => a.loggedAt.localeCompare(b.loggedAt)));
});

exercisesRouter.post("/", (req, res) => {
  const parsed = exerciseInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const state = db.get();
  const entry = {
    id: makeId(),
    name: parsed.data.name,
    caloriesBurned: parsed.data.caloriesBurned,
    loggedDate: parsed.data.loggedDate,
    loggedAt: new Date().toISOString(),
  };
  state.exercises.push(entry);
  db.save();
  res.status(201).json(entry);
});

exercisesRouter.delete("/:id", (req, res) => {
  const state = db.get();
  const idx = state.exercises.findIndex((e) => e.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: "Exercise entry not found" });
    return;
  }
  state.exercises.splice(idx, 1);
  db.save();
  res.status(204).end();
});
