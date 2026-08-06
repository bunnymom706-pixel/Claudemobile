import type {
  ActivityLevel,
  GoalType,
  MacroSplitId,
  PlanOption,
  PlanPaceId,
  Profile,
} from "./types.js";

/**
 * Calorie planning math.
 *
 * Every number here is an estimate. Mifflin-St Jeor predicts BMR within
 * roughly ±10% for most people, and the "3500 kcal per pound" rule is a
 * simplification that overstates loss over long stretches. Treat the output
 * as a starting point to adjust from real-world results, not a promise.
 */

const LBS_TO_KG = 0.453_592;
const KCAL_PER_LB = 3500;

/**
 * Multipliers deliberately exclude logged workouts: exercise is added back
 * separately when you log it. Picking a level that already counts your
 * training AND eating back exercise calories double-counts the same burn.
 */
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  // Resting burn only. Pairs with 100% eat-back of Health active energy,
  // which already covers the whole day's movement.
  "health-tracked": 1.0,
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
};

/**
 * Common clinical guidance for the lowest intake that can still cover
 * micronutrient needs without supervision.
 */
const CALORIE_FLOOR = { female: 1200, male: 1500 } as const;

/** Positive lbsPerWeek means losing; negative means gaining. */
const PACES_BY_GOAL: Record<GoalType, Array<{ id: PlanPaceId; label: string; lbsPerWeek: number }>> = {
  lose: [
    { id: "gentle", label: "Gentle", lbsPerWeek: 0.5 },
    { id: "steady", label: "Steady", lbsPerWeek: 1 },
    { id: "aggressive", label: "Aggressive", lbsPerWeek: 1.5 },
    { id: "max", label: "Fastest advisable", lbsPerWeek: 2 },
  ],
  maintain: [{ id: "maintain", label: "Maintain", lbsPerWeek: 0 }],
  gain: [
    { id: "lean-gain", label: "Lean gain", lbsPerWeek: -0.25 },
    { id: "steady-gain", label: "Steady gain", lbsPerWeek: -0.5 },
  ],
};

interface MacroSplit {
  label: string;
  proteinPerLb: number;
  /** Share of non-protein calories going to carbs. Ignored when carbCapG set. */
  carbShare: number;
  carbCapG?: number;
}

export const MACRO_SPLITS: Record<MacroSplitId, MacroSplit> = {
  balanced: { label: "Balanced", proteinPerLb: 0.8, carbShare: 0.55 },
  "high-protein": { label: "High protein", proteinPerLb: 1.0, carbShare: 0.5 },
  "lower-carb": { label: "Lower carb", proteinPerLb: 1.0, carbShare: 0.25 },
  keto: { label: "Keto", proteinPerLb: 0.85, carbShare: 0, carbCapG: 25 },
};

/** Below this, fat intake starts interfering with hormone and vitamin uptake. */
const FAT_FLOOR_PER_LB = 0.3;

function macrosFor(
  calories: number,
  goalWeightLbs: number,
  splitId: MacroSplitId
): { protein: number; carbs: number; fat: number; warning?: string } {
  const split = MACRO_SPLITS[splitId];
  const protein = Math.round(goalWeightLbs * split.proteinPerLb);
  const remaining = calories - protein * 4;

  if (remaining <= 0) {
    return {
      protein,
      carbs: 0,
      fat: 0,
      warning: `${protein}g of protein alone accounts for this option's whole calorie budget. Pick a lower-protein split or a higher calorie target.`,
    };
  }

  let carbs: number;
  let fat: number;
  if (split.carbCapG !== undefined) {
    carbs = Math.min(split.carbCapG, Math.floor(remaining / 4));
    fat = Math.round((remaining - carbs * 4) / 9);
  } else {
    carbs = Math.round((remaining * split.carbShare) / 4);
    fat = Math.round((remaining * (1 - split.carbShare)) / 9);
  }

  const warning =
    fat / goalWeightLbs < FAT_FLOOR_PER_LB
      ? `Only ${fat}g of fat — on the low side. Fine briefly, worth raising if it drags on.`
      : undefined;

  return { protein, carbs: Math.max(0, carbs), fat: Math.max(0, fat), warning };
}

/** Mifflin-St Jeor, the most accurate of the common BMR predictors. */
export function calcBmr(profile: Profile): number {
  const kg = profile.currentWeightLbs * LBS_TO_KG;
  const base = 10 * kg + 6.25 * profile.heightCm - 5 * profile.age;
  return Math.round(base + (profile.sex === "male" ? 5 : -161));
}

export function calcTdee(profile: Profile): number {
  return Math.round(calcBmr(profile) * ACTIVITY_MULTIPLIERS[profile.activityLevel]);
}

function addWeeks(weeks: number): string {
  const d = new Date();
  d.setDate(d.getDate() + Math.ceil(weeks * 7));
  return d.toISOString().slice(0, 10);
}

export interface Plan {
  bmr: number;
  tdee: number;
  floor: number;
  goalType: GoalType;
  macroSplit: MacroSplitId;
  tdeeSource: "formula" | "adaptive";
  lbsToLose: number;
  proteinTarget: number;
  goalBmi: number;
  /** Non-null when the goal weight itself is worth a second look. */
  goalWarning: string | null;
  options: PlanOption[];
}

function bmi(weightLbs: number, heightCm: number): number {
  const kg = weightLbs * LBS_TO_KG;
  const m = heightCm / 100;
  return Math.round((kg / (m * m)) * 10) / 10;
}

function goalWarningFor(goalBmi: number): string | null {
  if (goalBmi < 17) {
    return `That goal weight puts you at a BMI of ${goalBmi}, which is significantly underweight. Please talk to a doctor before targeting it.`;
  }
  if (goalBmi < 18.5) {
    return `That goal weight puts you at a BMI of ${goalBmi}, below the healthy range (18.5+). Worth checking with a doctor.`;
  }
  return null;
}

export function buildPlan(
  profile: Profile,
  goalType: GoalType = "lose",
  splitId: MacroSplitId = "balanced",
  /** Overrides the formula estimate when adaptive TDEE is in use. */
  tdeeOverride?: number
): Plan {
  const bmr = calcBmr(profile);
  const tdee = tdeeOverride ?? calcTdee(profile);
  const floor = CALORIE_FLOOR[profile.sex];
  const lbsToChange = Math.abs(profile.currentWeightLbs - profile.goalWeightLbs);

  const options: PlanOption[] = PACES_BY_GOAL[goalType].map((pace) => {
    const requestedChange = (pace.lbsPerWeek * KCAL_PER_LB) / 7;
    const uncappedCalories = Math.round(tdee - requestedChange);

    // Clamping to the floor makes the pace slower than requested. Report the
    // rate that actually results rather than the one that was asked for.
    const belowFloor = uncappedCalories < floor;
    const baseCalories = Math.max(floor, uncappedCalories);
    const actualDeficit = tdee - baseCalories;
    const actualLbsPerWeek = (actualDeficit * 7) / KCAL_PER_LB;

    // Only project a date when the plan actually moves toward the goal.
    const movingTowardGoal =
      (goalType === "lose" && actualLbsPerWeek > 0 && profile.goalWeightLbs < profile.currentWeightLbs) ||
      (goalType === "gain" && actualLbsPerWeek < 0 && profile.goalWeightLbs > profile.currentWeightLbs);
    const weeksToGoal = movingTowardGoal ? lbsToChange / Math.abs(actualLbsPerWeek) : null;

    let note: string | undefined;
    if (belowFloor) {
      note =
        `${pace.lbsPerWeek} lb/week would mean eating under ${floor} kcal. ` +
        `Held at ${floor}, which gives about ${actualLbsPerWeek.toFixed(1)} lb/week. ` +
        `Cutting food further isn't the lever — exercise is, and only if you bank ` +
        `part of it instead of eating it all back.`;
    } else if (goalType === "maintain") {
      note = "No deficit — this is roughly what holds your current weight.";
    } else if (baseCalories < bmr) {
      note = `Below your estimated resting burn (${bmr} kcal). Sustainable briefly, not for months.`;
    }

    const macros = macrosFor(baseCalories, profile.goalWeightLbs, splitId);

    return {
      id: pace.id,
      label: pace.label,
      requestedLbsPerWeek: pace.lbsPerWeek,
      actualLbsPerWeek: Math.round(actualLbsPerWeek * 100) / 100,
      dailyDeficit: Math.round(actualDeficit),
      baseCalories,
      weeksToGoal: weeksToGoal === null ? null : Math.ceil(weeksToGoal),
      projectedDate: weeksToGoal === null ? null : addWeeks(weeksToGoal),
      proteinTarget: macros.protein,
      carbTarget: macros.carbs,
      fatTarget: macros.fat,
      belowFloor,
      belowBmr: baseCalories < bmr,
      note,
      macroWarning: macros.warning,
    };
  });

  const goalBmi = bmi(profile.goalWeightLbs, profile.heightCm);

  return {
    bmr,
    tdee,
    floor,
    goalType,
    macroSplit: splitId,
    tdeeSource: tdeeOverride === undefined ? "formula" : "adaptive",
    lbsToLose: lbsToChange,
    proteinTarget: options[0]?.proteinTarget ?? 0,
    goalBmi,
    goalWarning: goalWarningFor(goalBmi),
    options,
  };
}
