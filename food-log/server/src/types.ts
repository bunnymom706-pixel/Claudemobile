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

export interface DbShape {
  foods: Food[];
  logs: LogEntry[];
  exercises: Exercise[];
  goals: Goals;
  settings: Settings;
}
