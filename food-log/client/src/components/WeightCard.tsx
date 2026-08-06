import { useEffect, useState } from "react";
import type { AdaptiveResult, TdeeSource, WeightEntry } from "../types";
import { api } from "../api";

interface WeightCardProps {
  source: TdeeSource;
  onSourceChange: (s: TdeeSource) => void;
  onLogged: () => void;
}

export default function WeightCard({ source, onSourceChange, onLogged }: WeightCardProps) {
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [adaptive, setAdaptive] = useState<AdaptiveResult | null>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const [w, a] = await Promise.all([api.weights.list(), api.weights.adaptive()]);
    setWeights(w);
    setAdaptive(a);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function submit() {
    const lbs = Number(value);
    if (!lbs || lbs <= 0) {
      setError("Enter your weight");
      return;
    }
    setError(null);
    await api.weights.log(new Date().toISOString().slice(0, 10), lbs);
    setValue("");
    await refresh();
    onLogged();
  }

  const recent = weights.slice(-5).reverse();

  return (
    <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
      <h2 className="font-semibold">Weight</h2>

      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          type="number"
          step="0.1"
          placeholder="Today's weight (lbs)"
          className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        />
        <button
          onClick={submit}
          className="rounded-md bg-amber-500 px-3 py-2 text-sm font-medium text-slate-950"
        >
          Log
        </button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}

      {recent.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs text-slate-400">
          {recent.map((w) => (
            <span key={w.date} className="rounded bg-slate-800/60 px-2 py-1">
              {w.date.slice(5)} · {w.weightLbs}
            </span>
          ))}
        </div>
      )}

      <div>
        <p className="mb-1 text-xs text-slate-400">Where maintenance calories come from</p>
        <div className="flex gap-1">
          <button
            onClick={() => onSourceChange("formula")}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium ${
              source === "formula" ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-300"
            }`}
          >
            Formula
          </button>
          <button
            onClick={() => onSourceChange("adaptive")}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium ${
              source === "adaptive" ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-300"
            }`}
          >
            Adaptive (from real results)
          </button>
        </div>
      </div>

      {adaptive &&
        (adaptive.available ? (
          <div className="rounded-md bg-emerald-500/10 p-3 text-xs text-emerald-200">
            <p className="font-medium">
              Measured maintenance: {adaptive.tdee} kcal
              <span className="ml-2 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px]">
                {adaptive.confidence} confidence
              </span>
            </p>
            <p className="mt-1 text-emerald-300/80">
              Averaged {adaptive.avgIntake} kcal/day over {adaptive.daysSpanned} days while your
              weight trend moved {adaptive.weightChangeLbs} lb ({adaptive.trendStartLbs} →{" "}
              {adaptive.trendEndLbs}).
            </p>
          </div>
        ) : (
          <p className="rounded-md bg-slate-800/50 p-3 text-xs text-slate-400">
            <span className="font-medium text-slate-300">Adaptive not ready.</span>{" "}
            {adaptive.reason} Until then the formula estimate is used.
          </p>
        ))}
    </div>
  );
}
