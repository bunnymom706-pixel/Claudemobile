import type { LogEntry, WeightEntry } from "./types.js";

/**
 * Adaptive maintenance calories, derived from what actually happened rather
 * than from a formula.
 *
 * Energy balance: if you ate an average of X per day and your weight trend
 * moved by W pounds over D days, then
 *
 *     maintenance = X - (W × 3500) / D
 *
 * Lose weight and the term is added back, because the missing tissue supplied
 * the difference. Unlike Mifflin-St Jeor this needs no assumptions about your
 * metabolism — it measures yours. The cost is that it needs a couple of weeks
 * of honest logging before it says anything trustworthy.
 */

const KCAL_PER_LB = 3500;
const MIN_DAYS = 14;
const MIN_WEIGHT_SPAN_DAYS = 10;
const MIN_COVERAGE = 0.7;

/**
 * Daily weight is mostly water noise, so the rate comes from a least-squares
 * fit over every weigh-in rather than from comparing two of them.
 *
 * An exponential moving average was the obvious choice here and is wrong: it
 * lags, and seeding it at the first reading compresses the measured change.
 * On a known 3.0 lb loss it reported 2.6 and undershot maintenance by ~70
 * kcal. Regression recovers a linear trend exactly and still averages out
 * day-to-day noise.
 */

export interface AdaptiveResult {
  available: boolean;
  reason?: string;
  tdee?: number;
  confidence?: "low" | "medium" | "high";
  daysSpanned?: number;
  loggedDays?: number;
  /** Share of days in the window that have any food logged. */
  coverage?: number;
  avgIntake?: number;
  trendStartLbs?: number;
  trendEndLbs?: number;
  weightChangeLbs?: number;
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / 86_400_000
  );
}

/** Least-squares fit of weight against day offset. Slope is lbs per day. */
function weightTrendSlope(
  entries: WeightEntry[],
  baseDate: string
): { slope: number; intercept: number } {
  const points = entries.map((e) => ({ x: daysBetween(baseDate, e.date), y: e.weightLbs }));
  const n = points.length;
  const meanX = points.reduce((s, p) => s + p.x, 0) / n;
  const meanY = points.reduce((s, p) => s + p.y, 0) / n;

  let num = 0;
  let den = 0;
  for (const p of points) {
    num += (p.x - meanX) * (p.y - meanY);
    den += (p.x - meanX) ** 2;
  }

  const slope = den === 0 ? 0 : num / den;
  return { slope, intercept: meanY - slope * meanX };
}

export function computeAdaptiveTdee(
  weights: WeightEntry[],
  logs: LogEntry[],
  windowDays = 28
): AdaptiveResult {
  if (weights.length < 2) {
    return {
      available: false,
      reason: "Needs at least two weigh-ins. Log your weight every few days.",
    };
  }

  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - windowDays);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const inWindow = sorted.filter((w) => w.date >= cutoffStr);
  const used = inWindow.length >= 2 ? inWindow : sorted.slice(-2);

  const first = used[0];
  const last = used[used.length - 1];
  const daysSpanned = daysBetween(first.date, last.date);

  if (daysSpanned < MIN_WEIGHT_SPAN_DAYS) {
    return {
      available: false,
      reason: `Weigh-ins only span ${daysSpanned} day${daysSpanned === 1 ? "" : "s"}. Needs at least ${MIN_WEIGHT_SPAN_DAYS} to separate a real trend from water weight.`,
    };
  }

  // Intake over exactly the span between the two weigh-ins.
  const windowLogs = logs.filter((l) => l.loggedDate >= first.date && l.loggedDate <= last.date);
  const byDay = new Map<string, number>();
  for (const l of windowLogs) {
    byDay.set(l.loggedDate, (byDay.get(l.loggedDate) ?? 0) + l.calories);
  }

  const loggedDays = byDay.size;
  const totalDays = daysSpanned + 1;
  const coverage = loggedDays / totalDays;

  if (loggedDays < MIN_DAYS) {
    return {
      available: false,
      reason: `Only ${loggedDays} of the last ${totalDays} days have food logged. Needs ${MIN_DAYS}.`,
    };
  }

  if (coverage < MIN_COVERAGE) {
    return {
      available: false,
      reason: `Only ${Math.round(coverage * 100)}% of days in the window have food logged. Missing days make the average unreliable — log more consistently first.`,
    };
  }

  const avgIntake = [...byDay.values()].reduce((a, b) => a + b, 0) / loggedDays;

  const { slope, intercept } = weightTrendSlope(used, first.date);
  const trendStartLbs = intercept;
  const trendEndLbs = intercept + slope * daysSpanned;
  const weightChangeLbs = slope * daysSpanned;

  // Per day: maintenance = intake minus the energy the weight change supplied.
  const tdee = Math.round(avgIntake - slope * KCAL_PER_LB);

  // Longer windows and fuller logs make the estimate steadier.
  const confidence: AdaptiveResult["confidence"] =
    daysSpanned >= 21 && coverage >= 0.9 ? "high" : daysSpanned >= 14 && coverage >= 0.8 ? "medium" : "low";

  return {
    available: true,
    tdee,
    confidence,
    daysSpanned,
    loggedDays,
    coverage: Math.round(coverage * 100) / 100,
    avgIntake: Math.round(avgIntake),
    trendStartLbs: Math.round(trendStartLbs * 10) / 10,
    trendEndLbs: Math.round(trendEndLbs * 10) / 10,
    weightChangeLbs: Math.round(weightChangeLbs * 10) / 10,
  };
}
