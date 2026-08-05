import type { ActivityLevel, PlanOption, PlanPaceId, Profile } from "./types.js";

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

const PACES: Array<{ id: PlanPaceId; label: string; lbsPerWeek: number }> = [
  { id: "gentle", label: "Gentle", lbsPerWeek: 0.5 },
  { id: "steady", label: "Steady", lbsPerWeek: 1 },
  { id: "aggressive", label: "Aggressive", lbsPerWeek: 1.5 },
  { id: "max", label: "Fastest advisable", lbsPerWeek: 2 },
];

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

/**
 * Protein high enough to protect muscle while in a deficit: ~1g per pound of
 * goal weight. Under-eating protein in a deficit costs lean mass, which
 * lowers maintenance and makes the weight easier to regain.
 */
function proteinTarget(profile: Profile): number {
  return Math.round(profile.goalWeightLbs);
}

export interface Plan {
  bmr: number;
  tdee: number;
  floor: number;
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

export function buildPlan(profile: Profile): Plan {
  const bmr = calcBmr(profile);
  const tdee = calcTdee(profile);
  const floor = CALORIE_FLOOR[profile.sex];
  const lbsToLose = Math.max(0, profile.currentWeightLbs - profile.goalWeightLbs);
  const protein = proteinTarget(profile);

  const options: PlanOption[] = PACES.map((pace) => {
    const requestedDeficit = (pace.lbsPerWeek * KCAL_PER_LB) / 7;
    const uncappedCalories = Math.round(tdee - requestedDeficit);

    // Clamping to the floor makes the pace slower than requested. Report the
    // rate that actually results rather than the one that was asked for.
    const belowFloor = uncappedCalories < floor;
    const baseCalories = Math.max(floor, uncappedCalories);
    const actualDeficit = tdee - baseCalories;
    const actualLbsPerWeek = (actualDeficit * 7) / KCAL_PER_LB;

    const weeksToGoal = actualLbsPerWeek > 0 ? lbsToLose / actualLbsPerWeek : Infinity;

    let note: string | undefined;
    if (belowFloor) {
      note =
        `${pace.lbsPerWeek} lb/week would mean eating under ${floor} kcal. ` +
        `Held at ${floor}, which gives about ${actualLbsPerWeek.toFixed(1)} lb/week. ` +
        `Cutting food further isn't the lever — exercise is, and only if you bank ` +
        `part of it instead of eating it all back.`;
    } else if (baseCalories < bmr) {
      note = `Below your estimated resting burn (${bmr} kcal). Sustainable briefly, not for months.`;
    }

    // Protein fixed to protect lean mass, fat at 25% of intake for hormone
    // health, carbs take whatever is left.
    const fatTarget = Math.round((baseCalories * 0.25) / 9);
    const carbTarget = Math.max(
      0,
      Math.round((baseCalories - protein * 4 - fatTarget * 9) / 4)
    );

    return {
      id: pace.id,
      label: pace.label,
      requestedLbsPerWeek: pace.lbsPerWeek,
      fatTarget,
      carbTarget,
      actualLbsPerWeek: Math.round(actualLbsPerWeek * 100) / 100,
      dailyDeficit: Math.round(actualDeficit),
      baseCalories,
      weeksToGoal: Number.isFinite(weeksToGoal) ? Math.ceil(weeksToGoal) : null,
      projectedDate: Number.isFinite(weeksToGoal) ? addWeeks(weeksToGoal) : null,
      proteinTarget: protein,
      belowFloor,
      belowBmr: baseCalories < bmr,
      note,
    };
  });

  const goalBmi = bmi(profile.goalWeightLbs, profile.heightCm);

  return {
    bmr,
    tdee,
    floor,
    lbsToLose,
    proteinTarget: protein,
    goalBmi,
    goalWarning: goalWarningFor(goalBmi),
    options,
  };
}
