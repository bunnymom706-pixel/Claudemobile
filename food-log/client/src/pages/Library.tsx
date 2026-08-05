import { useEffect, useState } from "react";
import type { Food } from "../types";
import { api } from "../api";

const emptyForm = {
  name: "",
  brand: "",
  servingLabel: "1 serving",
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
};

export default function Library() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setFoods(await api.foods.list(query || undefined));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function toggleFavorite(food: Food) {
    await api.foods.update(food.id, { isFavorite: !food.isFavorite });
    refresh();
  }

  async function remove(food: Food) {
    if (!confirm(`Delete "${food.name}" from your library? Existing logged entries stay intact.`)) return;
    await api.foods.remove(food.id);
    refresh();
  }

  async function createFood() {
    setError(null);
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    try {
      await api.foods.create({
        name: form.name.trim(),
        brand: form.brand.trim() || undefined,
        servingLabel: form.servingLabel.trim() || "1 serving",
        calories: Number(form.calories) || 0,
        protein: Number(form.protein) || 0,
        carbs: Number(form.carbs) || 0,
        fat: Number(form.fat) || 0,
      });
      setForm(emptyForm);
      setShowForm(false);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <div className="flex items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your food library..."
          className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        />
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-amber-500 px-3 py-2 text-sm font-medium text-slate-950"
        >
          {showForm ? "Cancel" : "+ New food"}
        </button>
      </div>

      {showForm && (
        <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Name *"
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          <input
            value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
            placeholder="Brand (optional)"
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          <input
            value={form.servingLabel}
            onChange={(e) => setForm({ ...form, servingLabel: e.target.value })}
            placeholder="Serving label"
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-4 gap-2">
            <input value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} placeholder="kcal" type="number" className="rounded-md border border-slate-700 bg-slate-950 px-2 py-2 text-sm" />
            <input value={form.protein} onChange={(e) => setForm({ ...form, protein: e.target.value })} placeholder="Protein g" type="number" className="rounded-md border border-slate-700 bg-slate-950 px-2 py-2 text-sm" />
            <input value={form.carbs} onChange={(e) => setForm({ ...form, carbs: e.target.value })} placeholder="Carbs g" type="number" className="rounded-md border border-slate-700 bg-slate-950 px-2 py-2 text-sm" />
            <input value={form.fat} onChange={(e) => setForm({ ...form, fat: e.target.value })} placeholder="Fat g" type="number" className="rounded-md border border-slate-700 bg-slate-950 px-2 py-2 text-sm" />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button onClick={createFood} className="w-full rounded-md bg-amber-500 py-2 font-medium text-slate-950">
            Save food
          </button>
        </div>
      )}

      <ul className="divide-y divide-slate-800 rounded-lg border border-slate-800 bg-slate-900/50">
        {foods.map((f) => (
          <li key={f.id} className="flex items-center justify-between p-3">
            <div>
              <p className="font-medium">
                {f.name} {f.brand && <span className="text-slate-400">· {f.brand}</span>}
              </p>
              <p className="text-xs text-slate-400">
                {f.servingLabel} · {Math.round(f.calories)} kcal · P {f.protein}g · C {f.carbs}g · F {f.fat}g
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleFavorite(f)}
                className={`text-lg ${f.isFavorite ? "text-amber-400" : "text-slate-600"}`}
                aria-label="Toggle favorite"
              >
                ★
              </button>
              <button onClick={() => remove(f)} className="text-xs text-slate-500 hover:text-red-400">
                Delete
              </button>
            </div>
          </li>
        ))}
        {foods.length === 0 && <li className="p-4 text-center text-sm text-slate-500">No foods yet.</li>}
      </ul>
    </div>
  );
}
