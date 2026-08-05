import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { buildPlan } from "../planning.js";

const profileInput = z.object({
  sex: z.enum(["female", "male"]),
  age: z.number().int().min(13).max(100),
  heightCm: z.number().min(120).max(230),
  currentWeightLbs: z.number().min(70).max(700),
  goalWeightLbs: z.number().min(70).max(700),
  activityLevel: z.enum(["sedentary", "light", "moderate", "very"]),
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
  const profile = db.get().profile;
  if (!profile) {
    res.status(404).json({ error: "Set up your profile first" });
    return;
  }
  res.json(buildPlan(profile));
});

profileRouter.post("/plan/preview", (req, res) => {
  const parsed = profileInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  res.json(buildPlan({ ...parsed.data, updatedAt: new Date().toISOString() }));
});
