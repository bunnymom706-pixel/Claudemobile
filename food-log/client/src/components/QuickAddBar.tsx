import type { Food, MealType } from "../types";

interface QuickAddBarProps {
  favorites: Food[];
  onQuickAdd: (food: Food, mealType: MealType) => void;
}

export default function QuickAddBar({ favorites, onQuickAdd }: QuickAddBarProps) {
  if (favorites.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-300">Quick add (1 serving, snack)</h3>
      <div className="flex flex-wrap gap-2">
        {favorites.map((f) => (
          <button
            key={f.id}
            onClick={() => onQuickAdd(f, "snack")}
            className="rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium hover:border-amber-500 hover:text-amber-300"
            title={`${Math.round(f.calories)} kcal · P ${f.protein}g · C ${f.carbs}g · F ${f.fat}g`}
          >
            + {f.name}
          </button>
        ))}
      </div>
    </div>
  );
}
