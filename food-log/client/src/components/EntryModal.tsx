import { useEffect, useMemo, useState } from "react";
import type { DbFood, Food, MealType } from "../types";
import { MEAL_LABELS, MEAL_TYPES } from "../types";
import { api } from "../api";
import DatabaseSearch from "./DatabaseSearch";

interface EntryModalProps {
  date: string;
  initialMealType: MealType;
  foods: Food[];
  onClose: () => void;
  onLogged: () => void;
}

type Mode = "search" | "database" | "custom";

export default function EntryModal({ date, initialMealType, foods, onClose, onLogged }: EntryModalProps) {
  const [mode, setMode] = useState<Mode>("search");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Food | null>(null);
  const [dbSelected, setDbSelected] = useState<DbFood | null>(null);
  const [servings, setServings] = useState(1);
  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [saveAsFood, setSaveAsFood] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customName, setCustomName] = useState("");
  const [customBrand, setCustomBrand] = useState("");
  const [customServingLabel, setCustomServingLabel] = useState("1 serving");
  const [customCalories, setCustomCalories] = useState("");
  const [customProtein, setCustomProtein] = useState("");
  const [customCarbs, setCustomCarbs] = useState("");
  const [customFat, setCustomFat] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return foods.filter((f) => f.isFavorite);
    return foods.filter(
      (f) => f.name.toLowerCase().includes(q) || f.brand?.toLowerCase().includes(q)
    );
  }, [foods, query]);

  async function submitFromFood() {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.logs.create({
        foodId: selected.id,
        servings,
        mealType,
        loggedDate: date,
      });
      onLogged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to log entry");
    } finally {
      setSubmitting(false);
    }
  }

  /** Import a database hit into the food library, then log it. */
  async function submitFromDatabase() {
    if (!dbSelected) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await api.foods.create({
        name: dbSelected.name,
        brand: dbSelected.brand,
        servingLabel: dbSelected.servingLabel,
        calories: dbSelected.calories,
        protein: dbSelected.protein,
        carbs: dbSelected.carbs,
        fat: dbSelected.fat,
        sugar: dbSelected.sugar,
        fiber: dbSelected.fiber,
      });
      await api.logs.create({
        foodId: created.id,
        servings,
        mealType,
        loggedDate: date,
      });
      onLogged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to log entry");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitCustom() {
    const calories = Number(customCalories) || 0;
    const protein = Number(customProtein) || 0;
    const carbs = Number(customCarbs) || 0;
    const fat = Number(customFat) || 0;

    if (!customName.trim()) {
      setError("Name is required");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      let foodId: string | null = null;
      if (saveAsFood) {
        const created = await api.foods.create({
          name: customName.trim(),
          brand: customBrand.trim() || undefined,
          servingLabel: customServingLabel.trim() || "1 serving",
          calories,
          protein,
          carbs,
          fat,
        });
        foodId = created.id;
      }
      await api.logs.create({
        foodId,
        foodName: customName.trim(),
        brand: customBrand.trim() || undefined,
        servings,
        mealType,
        loggedDate: date,
        calories,
        protein,
        carbs,
        fat,
      });
      onLogged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to log entry");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-800 bg-slate-900 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add entry</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setMode("search")}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium ${
              mode === "search" ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-300"
            }`}
          >
            My library
          </button>
          <button
            onClick={() => setMode("database")}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium ${
              mode === "database" ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-300"
            }`}
          >
            Food database
          </button>
          <button
            onClick={() => setMode("custom")}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium ${
              mode === "custom" ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-300"
            }`}
          >
            Custom
          </button>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-xs text-slate-400">Meal</label>
          <div className="flex gap-1">
            {MEAL_TYPES.map((mt) => (
              <button
                key={mt}
                onClick={() => setMealType(mt)}
                className={`flex-1 rounded-md py-1.5 text-xs font-medium ${
                  mealType === mt ? "bg-slate-700 text-white" : "bg-slate-800/60 text-slate-400"
                }`}
              >
                {MEAL_LABELS[mt]}
              </button>
            ))}
          </div>
        </div>

        {mode === "search" ? (
          <div className="space-y-3">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search foods..."
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {filtered.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelected(f)}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                    selected?.id === f.id ? "bg-amber-500/20 ring-1 ring-amber-500" : "bg-slate-800/50 hover:bg-slate-800"
                  }`}
                >
                  <div className="font-medium">{f.name}</div>
                  <div className="text-xs text-slate-400">
                    {f.brand ? `${f.brand} · ` : ""}
                    {f.servingLabel} · {Math.round(f.calories)} kcal · P {f.protein}g
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="py-4 text-center text-sm text-slate-500">
                  No matches. Try the food database tab.
                </p>
              )}
            </div>

            {selected && (
              <div className="flex items-center gap-3 rounded-md bg-slate-800/50 p-3">
                <label className="text-sm text-slate-300">Servings</label>
                <input
                  type="number"
                  min={0.25}
                  step={0.25}
                  value={servings}
                  onChange={(e) => setServings(Number(e.target.value))}
                  className="w-20 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                />
                <span className="ml-auto text-xs text-slate-400">
                  = {Math.round(selected.calories * servings)} kcal · P{" "}
                  {Math.round(selected.protein * servings)}g
                </span>
              </div>
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              disabled={!selected || submitting}
              onClick={submitFromFood}
              className="w-full rounded-md bg-amber-500 py-2 font-medium text-slate-950 disabled:opacity-40"
            >
              {submitting ? "Logging..." : "Log entry"}
            </button>
          </div>
        ) : mode === "database" ? (
          <div className="space-y-3">
            <DatabaseSearch selected={dbSelected} onSelect={setDbSelected} />

            {dbSelected && (
              <div className="flex items-center gap-3 rounded-md bg-slate-800/50 p-3">
                <label className="text-sm text-slate-300">Servings</label>
                <input
                  type="number"
                  min={0.25}
                  step={0.25}
                  value={servings}
                  onChange={(e) => setServings(Number(e.target.value))}
                  className="w-20 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                />
                <span className="ml-auto text-xs text-slate-400">
                  = {Math.round(dbSelected.calories * servings)} kcal · P{" "}
                  {Math.round(dbSelected.protein * servings)}g
                </span>
              </div>
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              disabled={!dbSelected || submitting}
              onClick={submitFromDatabase}
              className="w-full rounded-md bg-amber-500 py-2 font-medium text-slate-950 disabled:opacity-40"
            >
              {submitting ? "Logging..." : "Save to library & log"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Food name *"
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <input
              value={customBrand}
              onChange={(e) => setCustomBrand(e.target.value)}
              placeholder="Brand (optional)"
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <input
              value={customServingLabel}
              onChange={(e) => setCustomServingLabel(e.target.value)}
              placeholder="Serving label, e.g. 1 bar (55g)"
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-4 gap-2">
              <input
                value={customCalories}
                onChange={(e) => setCustomCalories(e.target.value)}
                placeholder="kcal"
                type="number"
                className="rounded-md border border-slate-700 bg-slate-950 px-2 py-2 text-sm"
              />
              <input
                value={customProtein}
                onChange={(e) => setCustomProtein(e.target.value)}
                placeholder="Protein g"
                type="number"
                className="rounded-md border border-slate-700 bg-slate-950 px-2 py-2 text-sm"
              />
              <input
                value={customCarbs}
                onChange={(e) => setCustomCarbs(e.target.value)}
                placeholder="Carbs g"
                type="number"
                className="rounded-md border border-slate-700 bg-slate-950 px-2 py-2 text-sm"
              />
              <input
                value={customFat}
                onChange={(e) => setCustomFat(e.target.value)}
                placeholder="Fat g"
                type="number"
                className="rounded-md border border-slate-700 bg-slate-950 px-2 py-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-300">Servings</label>
              <input
                type="number"
                min={0.25}
                step={0.25}
                value={servings}
                onChange={(e) => setServings(Number(e.target.value))}
                className="w-20 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={saveAsFood}
                onChange={(e) => setSaveAsFood(e.target.checked)}
              />
              Save to my food library for quick-add next time
            </label>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              disabled={submitting}
              onClick={submitCustom}
              className="w-full rounded-md bg-amber-500 py-2 font-medium text-slate-950 disabled:opacity-40"
            >
              {submitting ? "Logging..." : "Log entry"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
