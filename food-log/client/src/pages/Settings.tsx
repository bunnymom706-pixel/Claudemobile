import { useEffect, useState } from "react";
import type { Goals, HealthSyncMode } from "../types";
import { api } from "../api";

export default function Settings() {
  const [goals, setGoals] = useState<Goals | null>(null);
  const [saved, setSaved] = useState(false);
  const [syncMode, setSyncMode] = useState<HealthSyncMode | null>(null);

  useEffect(() => {
    api.goals.get().then(setGoals);
    api.settings.get().then((s) => setSyncMode(s.healthSyncMode));
  }, []);

  async function changeSyncMode(mode: HealthSyncMode) {
    setSyncMode(mode);
    const updated = await api.settings.update(mode);
    setSyncMode(updated.healthSyncMode);
  }

  async function save() {
    if (!goals) return;
    const updated = await api.goals.update({
      calories: goals.calories,
      protein: goals.protein,
      carbs: goals.carbs,
      fat: goals.fat,
    });
    setGoals(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  if (!goals) return <div className="p-4 text-slate-500">Loading...</div>;

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <h2 className="text-lg font-semibold">Daily goals</h2>
      <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
        {(
          [
            ["calories", "Calories (kcal)"],
            ["protein", "Protein (g)"],
            ["carbs", "Carbs (g)"],
            ["fat", "Fat (g)"],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="flex items-center justify-between gap-3">
            <label className="text-sm text-slate-300">{label}</label>
            <input
              type="number"
              value={goals[key]}
              onChange={(e) => setGoals({ ...goals, [key]: Number(e.target.value) })}
              className="w-28 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
            />
          </div>
        ))}
        <button onClick={save} className="w-full rounded-md bg-amber-500 py-2 font-medium text-slate-950">
          {saved ? "Saved ✓" : "Save goals"}
        </button>
      </div>

      <h2 className="pt-2 text-lg font-semibold">Health sync</h2>
      <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
        <p className="text-xs text-slate-400">
          When your phone pushes active energy to this app, how should it combine with workouts
          you type in yourself?
        </p>
        {(
          [
            [
              "reconcile",
              "Reconcile (recommended)",
              "Your phone already counted that workout — take the larger number, don't add them.",
            ],
            [
              "add",
              "Add both",
              "Sum them. Only correct if your phone excludes what you log by hand.",
            ],
          ] as const
        ).map(([mode, label, help]) => (
          <button
            key={mode}
            onClick={() => changeSyncMode(mode)}
            className={`w-full rounded-md p-3 text-left ${
              syncMode === mode ? "bg-amber-500/20 ring-1 ring-amber-500" : "bg-slate-800/50 hover:bg-slate-800"
            }`}
          >
            <div className="text-sm font-medium">{label}</div>
            <div className="text-xs text-slate-400">{help}</div>
          </button>
        ))}
        <p className="text-xs text-slate-500">
          Setup instructions for pushing from your phone are in the README.
        </p>
      </div>
    </div>
  );
}
