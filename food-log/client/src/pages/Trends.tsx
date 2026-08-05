import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Trends as TrendsData } from "../types";
import { api } from "../api";

export default function Trends() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<TrendsData | null>(null);

  useEffect(() => {
    api.trends(days).then(setData);
  }, [days]);

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <div className="flex gap-2">
        {[7, 14, 30].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              days === d ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-300"
            }`}
          >
            {d}d
          </button>
        ))}
      </div>

      {data && (
        <>
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-300">Calories</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.points}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
                <ReferenceLine y={data.goals.calories} stroke="#f59e0b" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="calories" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-300">Macros (g)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.points}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
                <Legend />
                <Line type="monotone" dataKey="protein" stroke="#ef4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="carbs" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="fat" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
