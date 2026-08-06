import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { computeAdaptiveTdee } from "../adaptive.js";

const weightInput = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weightLbs: z.number().min(50).max(800),
});

export const weightsRouter = Router();

weightsRouter.get("/", (req, res) => {
  const { weights } = db.get();
  res.json([...weights].sort((a, b) => a.date.localeCompare(b.date)));
});

/** One weigh-in per day — logging again replaces that day's number. */
weightsRouter.post("/", (req, res) => {
  const parsed = weightInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const state = db.get();
  const existing = state.weights.find((w) => w.date === parsed.data.date);
  if (existing) {
    existing.weightLbs = parsed.data.weightLbs;
  } else {
    state.weights.push(parsed.data);
  }

  // Keep the profile's current weight in step with the latest weigh-in.
  const latest = [...state.weights].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
  if (state.profile && latest) {
    state.profile.currentWeightLbs = latest.weightLbs;
  }

  db.save();
  res.status(201).json(parsed.data);
});

weightsRouter.delete("/:date", (req, res) => {
  const state = db.get();
  const idx = state.weights.findIndex((w) => w.date === req.params.date);
  if (idx === -1) {
    res.status(404).json({ error: "No weigh-in on that date" });
    return;
  }
  state.weights.splice(idx, 1);
  db.save();
  res.status(204).end();
});

weightsRouter.get("/adaptive", (req, res) => {
  const state = db.get();
  res.json(computeAdaptiveTdee(state.weights, state.logs));
});
