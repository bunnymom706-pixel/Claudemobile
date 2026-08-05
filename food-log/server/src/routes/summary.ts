import { Router } from "express";
import { db } from "../db.js";
import type { LogEntry, MealType, Macros } from "../types.js";

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

  const burned = dayExercise.reduce((sum, e) => sum + e.caloriesBurned, 0);
  const adjustedGoals = { ...goals, calories: goals.calories + burned };

  res.json({ date, totals, goals, adjustedGoals, burned, exercises: dayExercise, byMeal });
});

export const trendsRouter = Router();

trendsRouter.get("/", (req, res) => {
  const days = Math.min(90, Math.max(1, Number(req.query.days) || 7));
  const { logs, goals, exercises } = db.get();

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
    const burned = exercises
      .filter((e) => e.loggedDate === date)
      .reduce((sum, e) => sum + e.caloriesBurned, 0);
    return { date, ...totals, burned };
  });

  res.json({ points, goals });
});
