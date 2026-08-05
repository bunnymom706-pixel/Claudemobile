import type { MealBucket, MealType } from "../types";
import { MEAL_LABELS } from "../types";

interface MealSectionProps {
  mealType: MealType;
  bucket: MealBucket;
  onAdd: (mealType: MealType) => void;
  onDelete: (id: string) => void;
}

export default function MealSection({ mealType, bucket, onAdd, onDelete }: MealSectionProps) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{MEAL_LABELS[mealType]}</h3>
          <p className="text-xs text-slate-400">
            {Math.round(bucket.calories)} kcal · P {Math.round(bucket.protein)}g · C{" "}
            {Math.round(bucket.carbs)}g · F {Math.round(bucket.fat)}g
          </p>
        </div>
        <button
          onClick={() => onAdd(mealType)}
          className="rounded-md bg-amber-500 px-3 py-1 text-sm font-medium text-slate-950 hover:bg-amber-400"
        >
          + Add
        </button>
      </div>

      {bucket.entries.length === 0 ? (
        <p className="text-sm text-slate-500">No entries yet.</p>
      ) : (
        <ul className="divide-y divide-slate-800">
          {bucket.entries.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">{entry.foodName}</p>
                <p className="text-xs text-slate-400">
                  {entry.servings}× · {Math.round(entry.calories)} kcal · P{" "}
                  {Math.round(entry.protein)}g · C {Math.round(entry.carbs)}g · F{" "}
                  {Math.round(entry.fat)}g
                </p>
              </div>
              <button
                onClick={() => onDelete(entry.id)}
                className="text-xs text-slate-500 hover:text-red-400"
                aria-label={`Delete ${entry.foodName}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
