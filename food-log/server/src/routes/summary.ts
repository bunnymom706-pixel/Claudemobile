import { Router } from "express";
import { db } from "../db.js";
import type { Exercise, HealthSyncMode, LogEntry, MealType, Macros } from "../types.js";

export interface BurnBreakdown {
  /** Total added to the day's calorie goal. */
  burned: number;
  manual: number;
  health: number;
  /** What the health total contributed on top of hand-logged workouts. */
  adjustment: number;
  mode: HealthSyncMode;
}

/**
 * A phone's active-energy figure already includes the workout you typed in,
 * so in `reconcile` mode the day's burn is the larger of the two rather than
 * the sum — the same adjustment model MyFitnessPal uses.
 */
export function computeBurn(exercises: Exercise[], mode: HealthSyncMode): BurnBreakdown {
  const manual = exercises
    .filter((e) => e.source !== "health")
    .reduce((sum, e) => sum + e.caloriesBurned, 0);
  // One row per day is written by the sync, but tolerate more than one.
  const health = exercises
    .filter((e) => e.source === "health")
    .reduce((max, e) => Math.max(max, e.caloriesBurned), 0);

  const burned = mode === "add" ? manual + health : Math.max(manual, health);
  return { burned, manual, health, adjustment: burned - manual, mode };
}

function emptyMacros(): Macros {
  return { calories: 0, protein: 0, carbs: 0, fat: 0 };
}

function addInto(target: Macros, entry: LogEntry): void {
  target.calories += entry.calories;
  target.protein += entry.protein;
  target.carbs += entry.carbs;
  target.fat += entry.fat;
}

export const summaryRouter = Router();

summaryRouter.get("/", (req, res) => {
  const date = typeof req.query.date === "string" ? req.query.date : new Date().toISOString().slice(0, 10);
  const { logs, goals, exercises } = db.get();
  const dayLogs = logs.filter((l) => l.loggedDate === date);
  const dayExercise = exercises
    .filter((e) => e.loggedDate === date)
    .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));

  const totals = emptyMacros();
  const byMeal: Record<MealType, Macros & { entries: LogEntry[] }> = {
    breakfast: { ...emptyMacros(), entries: [] },
    lunch: { ...emptyMacros(), entries: [] },
    dinner: { ...emptyMacros(), entries: [] },
    snack: { ...emptyMacros(), entries: [] },
  };

  for (const entry of dayLogs) {
    addInto(totals, entry);
    addInto(byMeal[entry.mealType], entry);
    byMeal[entry.mealType].entries.push(entry);
  }

  for (const meal of Object.values(byMeal)) {
    meal.entries.sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
  }

  const burn = computeBurn(dayExercise, db.get().settings.healthSyncMode);
  const adjustedGoals = { ...goals, calories: goals.calories + burn.burned };

  res.json({
    date,
    totals,
    goals,
    adjustedGoals,
    burned: burn.burned,
    burnBreakdown: burn,
    exercises: dayExercise,
    byMeal,
  });
});

export const trendsRouter = Router();

trendsRouter.get("/", (req, res) => {
  const days = Math.min(90, Math.max(1, Number(req.query.days) || 7));
  const { logs, goals, exercises, settings } = db.get();

  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }

  const points = dates.map((date) => {
    const totals = emptyMacros();
    for (const entry of logs) {
      if (entry.loggedDate === date) addInto(totals, entry);
    }
    const burned = computeBurn(
      exercises.filter((e) => e.loggedDate === date),
      settings.healthSyncMode
    ).burned;
    return { date, ...totals, burned };
  });

  res.json({ points, goals });
});
