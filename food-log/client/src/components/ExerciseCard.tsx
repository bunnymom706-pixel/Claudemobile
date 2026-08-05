import { useState } from "react";
import type { BurnBreakdown, Exercise } from "../types";

interface ExerciseCardProps {
  exercises: Exercise[];
  burned: number;
  breakdown?: BurnBreakdown;
  onAdd: (name: string, caloriesBurned: number) => Promise<void>;
  onDelete: (id: string) => void;
}

export default function ExerciseCard({
  exercises,
  burned,
  breakdown,
  onAdd,
  onDelete,
}: ExerciseCardProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const cal = Number(calories);
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!cal || cal <= 0) {
      setError("Enter calories burned");
      return;
    }
    setError(null);
    await onAdd(name.trim(), cal);
    setName("");
    setCalories("");
    setShowForm(false);
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Exercise</h3>
          <p className="text-xs text-slate-400">
            {burned > 0 && breakdown ? (
              breakdown.credited < breakdown.burned ? (
                <>
                  {Math.round(breakdown.burned)} kcal burned ·{" "}
                  <span className="text-emerald-400">
                    +{Math.round(breakdown.credited)} added back
                  </span>{" "}
                  ({breakdown.eatBackPercent}%)
                </>
              ) : (
                <span className="text-emerald-400">
                  +{Math.round(breakdown.credited)} kcal added to today's budget
                </span>
              )
            ) : (
              "Burned calories get added back to your goal"
            )}
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-emerald-500 px-3 py-1 text-sm font-medium text-slate-950 hover:bg-emerald-400"
        >
          {showForm ? "Cancel" : "+ Add"}
        </button>
      </div>

      {showForm && (
        <div className="mb-3 space-y-2 rounded-md bg-slate-800/50 p-3">
          <div className="flex gap-2">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Run, lifting, walk"
              className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm"
            />
            <input
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="kcal burned"
              type="number"
              className="w-32 rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            onClick={submit}
            className="w-full rounded-md bg-emerald-500 py-1.5 text-sm font-medium text-slate-950"
          >
            Log burn
          </button>
        </div>
      )}

      {exercises.length === 0 ? (
        <p className="text-sm text-slate-500">No exercise logged yet today.</p>
      ) : (
        <ul className="divide-y divide-slate-800">
          {exercises.map((e) => (
            <li key={e.id} className="flex items-center justify-between py-2">
              <span className="flex items-center gap-2 text-sm font-medium">
                {e.name}
                {e.source === "health" && (
                  <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-medium text-sky-300">
                    from phone
                  </span>
                )}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-emerald-400">+{Math.round(e.caloriesBurned)} kcal</span>
                <button
                  onClick={() => onDelete(e.id)}
                  className="text-xs text-slate-500 hover:text-red-400"
                  aria-label={`Delete ${e.name}`}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {breakdown && breakdown.health > 0 && breakdown.manual > 0 && (
        <p className="mt-3 rounded-md bg-slate-800/50 p-2 text-xs text-slate-400">
          {breakdown.mode === "reconcile" ? (
            <>
              Your phone reported {Math.round(breakdown.health)} kcal, which already includes the{" "}
              {Math.round(breakdown.manual)} kcal you logged by hand — counting{" "}
              {Math.round(breakdown.burned)} kcal, not the sum.
            </>
          ) : (
            <>
              Adding both: {Math.round(breakdown.manual)} kcal logged by hand +{" "}
              {Math.round(breakdown.health)} kcal from your phone.
            </>
          )}
        </p>
      )}
    </div>
  );
}
