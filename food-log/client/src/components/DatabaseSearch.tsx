import { useState } from "react";
import type { DbFood } from "../types";
import { BASIS_LABELS } from "../types";
import { api } from "../api";

interface DatabaseSearchProps {
  selected: DbFood | null;
  onSelect: (food: DbFood | null) => void;
}

type Mode = "barcode" | "name";

function BasisBadge({ food }: { food: DbFood }) {
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
        food.exact ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-700 text-slate-300"
      }`}
      title={BASIS_LABELS[food.basis]}
    >
      {food.exact ? "exact label" : BASIS_LABELS[food.basis]}
    </span>
  );
}

export default function DatabaseSearch({ selected, onSelect }: DatabaseSearchProps) {
  const [mode, setMode] = useState<Mode>("barcode");
  const [barcode, setBarcode] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DbFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function runBarcode() {
    const code = barcode.replace(/\D/g, "");
    if (!code) {
      setError("Enter the barcode digits from the package");
      return;
    }
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const food = await api.lookup.barcode(code);
      setResults([food]);
      onSelect(food);
    } catch (e) {
      setResults([]);
      onSelect(null);
      setError(e instanceof Error ? e.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  }

  async function runSearch() {
    if (!query.trim()) {
      setError("Enter something to search for");
      return;
    }
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const found = await api.lookup.search(query.trim());
      setResults(found);
      onSelect(null);
    } catch (e) {
      setResults([]);
      onSelect(null);
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        <button
          onClick={() => setMode("barcode")}
          className={`flex-1 rounded-md py-1.5 text-xs font-medium ${
            mode === "barcode" ? "bg-slate-700 text-white" : "bg-slate-800/60 text-slate-400"
          }`}
        >
          Barcode (most exact)
        </button>
        <button
          onClick={() => setMode("name")}
          className={`flex-1 rounded-md py-1.5 text-xs font-medium ${
            mode === "name" ? "bg-slate-700 text-white" : "bg-slate-800/60 text-slate-400"
          }`}
        >
          Search by name
        </button>
      </div>

      {mode === "barcode" ? (
        <div className="flex gap-2">
          <input
            autoFocus
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runBarcode()}
            inputMode="numeric"
            placeholder="Type or scan the UPC digits"
            className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          <button
            onClick={runBarcode}
            disabled={loading}
            className="rounded-md bg-slate-700 px-3 py-2 text-sm font-medium disabled:opacity-40"
          >
            {loading ? "..." : "Look up"}
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
            placeholder="e.g. Barebells banana caramel"
            className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          <button
            onClick={runSearch}
            disabled={loading}
            className="rounded-md bg-slate-700 px-3 py-2 text-sm font-medium disabled:opacity-40"
          >
            {loading ? "..." : "Search"}
          </button>
        </div>
      )}

      {error && <p className="rounded-md bg-red-500/10 p-2 text-sm text-red-400">{error}</p>}

      <div className="max-h-56 space-y-1 overflow-y-auto">
        {results.map((f) => {
          const isSelected = selected?.sourceId === f.sourceId && selected?.source === f.source;
          return (
            <button
              key={`${f.source}:${f.sourceId}`}
              onClick={() => onSelect(f)}
              className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                isSelected ? "bg-amber-500/20 ring-1 ring-amber-500" : "bg-slate-800/50 hover:bg-slate-800"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium">{f.name}</span>
                <BasisBadge food={f} />
              </div>
              <div className="text-xs text-slate-400">
                {f.brand ? `${f.brand} · ` : ""}
                {f.servingLabel} · {Math.round(f.calories)} kcal · P {f.protein}g · C {f.carbs}g · F{" "}
                {f.fat}g
              </div>
            </button>
          );
        })}
        {searched && !loading && !error && results.length === 0 && (
          <p className="py-4 text-center text-sm text-slate-500">
            Nothing found. Try the barcode, or enter it by hand under "Custom".
          </p>
        )}
      </div>

      {selected && !selected.exact && (
        <p className="rounded-md bg-amber-500/10 p-2 text-xs text-amber-300">
          These numbers are {BASIS_LABELS[selected.basis].toLowerCase()} — check them against the
          package before saving.
        </p>
      )}
    </div>
  );
}
