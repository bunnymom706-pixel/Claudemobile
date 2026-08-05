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

export interface Settings {
  healthSyncMode: HealthSyncMode;
}

export interface BurnBreakdown {
  burned: number;
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
