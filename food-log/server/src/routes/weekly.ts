import { Router } from "express";
import { db } from "../db.js";
import { calcTdee } from "../planning.js";
import { computeBurn } from "./summary.js";

/**
 * Weekly deficit budget with daily rebalancing.
 *
 * A fixed daily target punishes one heavy meal for the rest of the week. This
 * spreads the *remaining* weekly deficit across the *remaining* days instead,
 * so going over on Tuesday quietly trims Wednesday through Sunday rather than
 * blowing the week.
 */

const KCAL_PER_LB = 3500;
const CALORIE_FLOOR = { female: 1200, male: 1500 } as const;

/** Monday-start week containing `date`. */
function weekBounds(date: string): { start: string; end: string } {
  const d = new Date(`${date}T00:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7; // Mon = 0
  const start = new Date(d);
  start.setUTCDate(d.getUTCDate() - dow);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

function eachDay(start: string, end: string): string[] {
  const out: string[] = [];
  const d = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  while (d <= last) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

export const weeklyRouter = Router();

weeklyRouter.get("/", (req, res) => {
  const state = db.get();
  const profile = state.profile;
  if (!profile) {
    res.status(404).json({ error: "Set up your profile first" });
    return;
  }

  const today = typeof req.query.date === "string" ? req.query.date : new Date().toISOString().slice(0, 10);
  const targetLossLbs = Number(req.query.lbsPerWeek) || state.settings.weeklyLossTargetLbs || 0.5;
  const { start, end } = weekBounds(today);
  const floor = CALORIE_FLOOR[profile.sex];
  const baseExpenditure = calcTdee(profile);

  const days = eachDay(start, end).map((date) => {
    const intake = state.logs
      .filter((l) => l.loggedDate === date)
      .reduce((sum, l) => sum + l.calories, 0);
    const burn = computeBurn(
      state.exercises.filter((e) => e.loggedDate === date),
      state.settings.healthSyncMode,
      state.settings.exerciseEatBackPercent
    );
    const expenditure = baseExpenditure + burn.credited;
    return {
      date,
      intake: Math.round(intake),
      expenditure,
      logged: intake > 0,
      deficit: intake > 0 ? Math.round(expenditure - intake) : 0,
      isPast: date < today,
      isToday: date === today,
    };
  });

  const targetWeeklyDeficit = Math.round(targetLossLbs * KCAL_PER_LB);

  // Only closed days count toward the bank; today is still in progress.
  const bankedDeficit = days
    .filter((d) => d.isPast && d.logged)
    .reduce((sum, d) => sum + d.deficit, 0);
  const unloggedPastDays = days.filter((d) => d.isPast && !d.logged).length;

  const remainingDays = days.filter((d) => !d.isPast).length;
  const remainingDeficit = targetWeeklyDeficit - bankedDeficit;
  const perDayNeeded = remainingDays > 0 ? remainingDeficit / remainingDays : 0;

  const todayDay = days.find((d) => d.isToday);
  const todayExpenditure = todayDay?.expenditure ?? baseExpenditure;
  const rawTarget = Math.round(todayExpenditure - perDayNeeded);
  const todayTarget = Math.max(floor, rawTarget);
  const floorHit = rawTarget < floor;

  const parts: string[] = [];

  if (floorHit) {
    parts.push(
      `Staying exactly on ${targetLossLbs} lb would mean eating under ${floor} kcal today. Held at ${floor} — the week lands short of target, which is the right trade.`
    );
  } else if (remainingDeficit <= 0) {
    parts.push(
      `You've already banked this week's ${targetLossLbs} lb. Eating to maintenance for the rest of the week still hits the target.`
    );
  } else if (bankedDeficit < 0) {
    parts.push(
      `You're ${Math.abs(Math.round(bankedDeficit))} kcal over so far this week. The remaining ${remainingDays} day${remainingDays === 1 ? "" : "s"} absorb it, which trims today to ${todayTarget}.`
    );
  } else if (bankedDeficit > 0) {
    parts.push(
      `${Math.round(bankedDeficit)} of ${targetWeeklyDeficit} kcal banked. Spreading the remaining ${Math.round(remainingDeficit)} over ${remainingDays} day${remainingDays === 1 ? "" : "s"}.`
    );
  } else {
    parts.push(
      `Week just started — ${Math.round(perDayNeeded)} kcal deficit per day hits ${targetLossLbs} lb.`
    );
  }

  // Missing days aren't a zero-intake day; they're an unknown, so say so
  // rather than letting the running total imply a deficit that wasn't earned.
  if (unloggedPastDays > 0) {
    parts.push(
      `${unloggedPastDays} earlier day${unloggedPastDays === 1 ? "" : "s"} this week ${unloggedPastDays === 1 ? "has" : "have"} no food logged, so this only reflects the days you tracked.`
    );
  }

  const message = parts.join(" ");

  res.json({
    weekStart: start,
    weekEnd: end,
    targetLossLbs,
    targetWeeklyDeficit,
    bankedDeficit: Math.round(bankedDeficit),
    remainingDeficit: Math.round(remainingDeficit),
    remainingDays,
    unloggedPastDays,
    todayExpenditure,
    todayTarget,
    floorHit,
    projectedLossLbs: Math.round(((bankedDeficit + perDayNeeded * remainingDays) / KCAL_PER_LB) * 100) / 100,
    message,
    days,
  });
});
