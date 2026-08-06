export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar?: number;
  fiber?: number;
}

export interface Food extends Macros {
  id: string;
  name: string;
  brand?: string;
  servingLabel: string;
  isFavorite: boolean;
  createdAt: string;
}

export interface LogEntry extends Macros {
  id: string;
  foodId: string | null;
  foodName: string;
  brand?: string;
  servings: number;
  mealType: MealType;
  loggedDate: string;
  loggedAt: string;
  notes?: string;
}

export interface Goals extends Macros {
  updatedAt: string;
}

export type ExerciseSource = "manual" | "health";

export interface Exercise {
  id: string;
  name: string;
  caloriesBurned: number;
  loggedDate: string;
  loggedAt: string;
  source: ExerciseSource;
}

export type HealthSyncMode = "reconcile" | "add";

export type TdeeSource = "formula" | "adaptive";

export interface Settings {
  healthSyncMode: HealthSyncMode;
  exerciseEatBackPercent: number;
  tdeeSource: TdeeSource;
}

export interface WeightEntry {
  date: string;
  weightLbs: number;
}

export interface AdaptiveResult {
  available: boolean;
  reason?: string;
  tdee?: number;
  confidence?: "low" | "medium" | "high";
  daysSpanned?: number;
  loggedDays?: number;
  coverage?: number;
  avgIntake?: number;
  trendStartLbs?: number;
  trendEndLbs?: number;
  weightChangeLbs?: number;
}

export type ActivityLevel = "health-tracked" | "sedentary" | "light" | "moderate" | "very";

export interface Profile {
  sex: "female" | "male";
  age: number;
  heightCm: number;
  currentWeightLbs: number;
  goalWeightLbs: number;
  activityLevel: ActivityLevel;
  updatedAt: string;
}

export type GoalType = "lose" | "maintain" | "gain";
export type MacroSplitId = "balanced" | "high-protein" | "lower-carb" | "keto";

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  lose: "Lose weight",
  maintain: "Maintain",
  gain: "Gain",
};

export const MACRO_SPLIT_LABELS: Record<MacroSplitId, string> = {
  balanced: "Balanced",
  "high-protein": "High protein",
  "lower-carb": "Lower carb",
  keto: "Keto",
};

export interface PlanOption {
  id: string;
  label: string;
  requestedLbsPerWeek: number;
  actualLbsPerWeek: number;
  dailyDeficit: number;
  baseCalories: number;
  weeksToGoal: number | null;
  projectedDate: string | null;
  proteinTarget: number;
  fatTarget: number;
  carbTarget: number;
  belowFloor: boolean;
  belowBmr: boolean;
  note?: string;
  macroWarning?: string;
}

export interface Plan {
  bmr: number;
  tdee: number;
  floor: number;
  goalType: GoalType;
  macroSplit: MacroSplitId;
  tdeeSource: TdeeSource;
  adaptive?: AdaptiveResult;
  eatBackConflict?: string | null;
  lbsToLose: number;
  proteinTarget: number;
  goalBmi: number;
  goalWarning: string | null;
  options: PlanOption[];
}

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  "health-tracked": "My phone/watch tracks it — use resting burn only",
  sedentary: "Sedentary — desk job, little movement",
  light: "Lightly active — on your feet some days",
  moderate: "Moderately active — active job or daily walking",
  very: "Very active — physical job",
};

export interface BurnBreakdown {
  burned: number;
  credited: number;
  eatBackPercent: number;
  manual: number;
  health: number;
  adjustment: number;
  mode: HealthSyncMode;
}

export type Basis = "label-serving" | "scaled-from-100g" | "per-100g";

export interface DbFood {
  source: "openfoodfacts" | "usda";
  sourceId: string;
  name: string;
  brand?: string;
  servingLabel: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar?: number;
  fiber?: number;
  basis: Basis;
  exact: boolean;
}

export const BASIS_LABELS: Record<Basis, string> = {
  "label-serving": "Label serving — exact",
  "scaled-from-100g": "Scaled from per-100g",
  "per-100g": "Per 100 g — set servings accordingly",
};

export interface MealBucket extends Macros {
  entries: LogEntry[];
}

export interface DaySummary {
  date: string;
  totals: Macros;
  goals: Goals;
  adjustedGoals: Goals;
  burned: number;
  burnBreakdown: BurnBreakdown;
  exercises: Exercise[];
  byMeal: Record<MealType, MealBucket>;
}

export interface TrendPoint extends Macros {
  date: string;
  burned: number;
}

export interface Trends {
  points: TrendPoint[];
  goals: Goals;
}

export const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks",
};
