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
  loggedDate: string; // YYYY-MM-DD
  loggedAt: string; // ISO timestamp
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
  loggedDate: string; // YYYY-MM-DD
  loggedAt: string; // ISO timestamp
  source: ExerciseSource;
}

/**
 * How a day's health-reported active energy combines with hand-logged workouts.
 *
 * `reconcile` (the default, and what MyFitnessPal does): the phone already
 * counted the workout you typed in, so the day's burn is the larger of the
 * two, not the sum. The difference shows up as an adjustment.
 *
 * `add`: trust both independently and sum them. Only right if your health
 * source genuinely excludes the workouts you log by hand.
 */
export type HealthSyncMode = "reconcile" | "add";

export interface Settings {
  healthSyncMode: HealthSyncMode;
}

/** Excludes logged workouts — those are added back separately when logged. */
export type ActivityLevel = "sedentary" | "light" | "moderate" | "very";

export interface Profile {
  sex: "female" | "male";
  age: number;
  heightCm: number;
  currentWeightLbs: number;
  goalWeightLbs: number;
  activityLevel: ActivityLevel;
  updatedAt: string;
}

export type PlanPaceId = "gentle" | "steady" | "aggressive" | "max";

export interface PlanOption {
  id: PlanPaceId;
  label: string;
  requestedLbsPerWeek: number;
  /** What the pace works out to after the calorie floor is applied. */
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
}

export interface DbShape {
  foods: Food[];
  logs: LogEntry[];
  exercises: Exercise[];
  goals: Goals;
  settings: Settings;
  profile: Profile | null;
}
