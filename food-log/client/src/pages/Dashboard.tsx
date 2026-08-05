import { useCallback, useEffect, useState } from "react";
import type { DaySummary, Food, MealType } from "../types";
import { MEAL_TYPES } from "../types";
import { api } from "../api";
import DateNav from "../components/DateNav";
import MacroRing from "../components/MacroRing";
import MealSection from "../components/MealSection";
import QuickAddBar from "../components/QuickAddBar";
import EntryModal from "../components/EntryModal";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function Dashboard() {
  const [date, setDate] = useState(todayStr());
  const [summary, setSummary] = useState<DaySummary | null>(null);
  const [foods, setFoods] = useState<Food[]>([]);
  const [modalMeal, setModalMeal] = useState<MealType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, f] = await Promise.all([api.summary(date), api.foods.list()]);
      setSummary(s);
      setFoods(f);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleQuickAdd(food: Food, mealType: MealType) {
    await api.logs.create({ foodId: food.id, servings: 1, mealType, loggedDate: date });
    refresh();
  }

  async function handleDelete(id: string) {
    await api.logs.remove(id);
    refresh();
  }

  const favorites = foods.filter((f) => f.isFavorite);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <div className="flex items-center justify-between">
        <DateNav date={date} onChange={setDate} />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {loading && !summary ? (
        <p className="text-slate-500">Loading...</p>
      ) : summary ? (
        <>
          <div className="flex flex-wrap justify-around gap-4 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            <MacroRing label="Calories" value={summary.totals.calories} goal={summary.goals.calories} unit="" color="#f59e0b" />
            <MacroRing label="Protein" value={summary.totals.protein} goal={summary.goals.protein} unit="g" color="#ef4444" />
            <MacroRing label="Carbs" value={summary.totals.carbs} goal={summary.goals.carbs} unit="g" color="#3b82f6" />
            <MacroRing label="Fat" value={summary.totals.fat} goal={summary.goals.fat} unit="g" color="#10b981" />
          </div>

          <QuickAddBar favorites={favorites} onQuickAdd={handleQuickAdd} />

          <div className="space-y-4">
            {MEAL_TYPES.map((mt) => (
              <MealSection
                key={mt}
                mealType={mt}
                bucket={summary.byMeal[mt]}
                onAdd={setModalMeal}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </>
      ) : null}

      {modalMeal && (
        <EntryModal
          date={date}
          initialMealType={modalMeal}
          foods={foods}
          onClose={() => setModalMeal(null)}
          onLogged={() => {
            setModalMeal(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
