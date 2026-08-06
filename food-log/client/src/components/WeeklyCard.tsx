import { useEffect, useState } from "react";
import type { WeeklyBudget } from "../types";
import { api } from "../api";

export default function WeeklyCard({ date, eaten }: { date: string; eaten: number }) {
  const [week, setWeek] = useState<WeeklyBudget | null>(null);

  useEffect(() => {
    api
      .weekly(date)
      .then(setWeek)
      .catch(() => setWeek(null)); // no profile yet — the Plan tab covers that
  }, [date, eaten]);

  if (!week) return null;

  const left = week.todayTarget - eaten;
  const progress = Math.max(
    0,
    Math.min(1, week.bankedDeficit / Math.max(1, week.targetWeeklyDeficit))
  );

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="font-semibold">
          This week · {week.targetLossLbs} lb target
        </h3>
        <span className="text-xs text-slate-400">
          {week.remainingDays} day{week.remainingDays === 1 ? "" : "s"} left
        </span>
      </div>

      <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span>
          <span className={`text-2xl font-bold ${left < 0 ? "text-red-400" : "text-amber-400"}`}>
            {Math.round(left)}
          </span>
          <span className="text-xs text-slate-400"> kcal left today</span>
        </span>
        <span className="text-xs text-slate-400">
          target {week.todayTarget} · burning {week.todayExpenditure}
        </span>
      </div>

      <p
        className={`mt-3 rounded-md p-2 text-xs ${
          week.floorHit ? "bg-amber-500/10 text-amber-300" : "bg-slate-800/50 text-slate-400"
        }`}
      >
        {week.message}
      </p>
    </div>
  );
}
