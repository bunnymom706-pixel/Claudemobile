import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { buildPlan } from "../planning.js";
import { computeAdaptiveTdee } from "../adaptive.js";
import type { GoalType, MacroSplitId } from "../types.js";

const goalTypes = ["lose", "maintain", "gain"] as const;
const macroSplits = ["balanced", "high-protein", "lower-carb", "keto"] as const;

function readGoalType(v: unknown): GoalType {
  return goalTypes.includes(v as GoalType) ? (v as GoalType) : "lose";
}

function readSplit(v: unknown): MacroSplitId {
  return macroSplits.includes(v as MacroSplitId) ? (v as MacroSplitId) : "balanced";
}

const profileInput = z.object({
  sex: z.enum(["female", "male"]),
  age: z.number().int().min(13).max(100),
  heightCm: z.number().min(120).max(230),
  currentWeightLbs: z.number().min(70).max(700),
  goalWeightLbs: z.number().min(70).max(700),
  activityLevel: z.enum(["health-tracked", "sedentary", "light", "moderate", "very"]),
});

export const profileRouter = Router();

profileRouter.get("/", (req, res) => {
  res.json(db.get().profile);
});

profileRouter.put("/", (req, res) => {
  const parsed = profileInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const state = db.get();
  state.profile = { ...parsed.data, updatedAt: new Date().toISOString() };
  db.save();
  res.json(state.profile);
});

/** Calorie options for the saved profile, or for one passed inline. */
profileRouter.get("/plan", (req, res) => {
  const state = db.get();
  const profile = state.profile;
  if (!profile) {
    res.status(404).json({ error: "Set up your profile first" });
    return;
  }

  // Adaptive maintenance replaces the formula only when there's enough data
  // to trust it; otherwise fall back rather than reporting a shaky number.
  const adaptive =
    state.settings.tdeeSource === "adaptive"
      ? computeAdaptiveTdee(state.weights, state.logs)
      : undefined;
  const override = adaptive?.available ? adaptive.tdee : undefined;

  const plan = buildPlan(
    profile,
    readGoalType(req.query.goalType),
    readSplit(req.query.macroSplit),
    override
  );

  // Adaptive maintenance is measured from real weight change, so it already
  // contains however much you typically train. Crediting logged workouts on
  // top counts that training twice.
  const eatBackConflict =
    override !== undefined && state.settings.exerciseEatBackPercent > 0
      ? `Your maintenance figure is measured from real weight change, so it already includes your usual training. Adding back ${state.settings.exerciseEatBackPercent}% of logged exercise counts that twice. With adaptive maintenance, 0% is the consistent setting — unusually hard days aside.`
      : null;

  res.json({ ...plan, adaptive, eatBackConflict });
});

profileRouter.post("/plan/preview", (req, res) => {
  const parsed = profileInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const body = req.body as { goalType?: unknown; macroSplit?: unknown };
  res.json(
    buildPlan(
      { ...parsed.data, updatedAt: new Date().toISOString() },
      readGoalType(body.goalType),
      readSplit(body.macroSplit)
    )
  );
});
