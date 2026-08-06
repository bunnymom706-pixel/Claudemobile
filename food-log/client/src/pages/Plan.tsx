import { useCallback, useEffect, useState } from "react";
import type {
  ActivityLevel,
  GoalType,
  MacroSplitId,
  Plan as PlanData,
  PlanOption,
  Profile,
} from "../types";
import type { TdeeSource } from "../types";
import { ACTIVITY_LABELS, GOAL_TYPE_LABELS, MACRO_SPLIT_LABELS } from "../types";
import { api } from "../api";
import WeightCard from "../components/WeightCard";

const ACTIVITY_LEVELS: ActivityLevel[] = ["sedentary", "light", "moderate", "very"];
const GOAL_TYPES: GoalType[] = ["lose", "maintain", "gain"];
const MACRO_SPLITS: MacroSplitId[] = ["balanced", "high-protein", "lower-carb", "keto"];

type Form = Omit<Profile, "updatedAt">;

const DEFAULT_FORM: Form = {
  sex: "female",
  age: 30,
  heightCm: 165,
  currentWeightLbs: 160,
  goalWeightLbs: 135,
  activityLevel: "sedentary",
};

function cmToFtIn(cm: number): string {
  const totalIn = cm / 2.54;
  return `${Math.floor(totalIn / 12)}'${Math.round(totalIn % 12)}"`;
}

function OptionCard({
  option,
  onApply,
  applied,
}: {
  option: PlanOption;
  onApply: (o: PlanOption) => void;
  applied: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{option.label}</h3>
          <p className="text-xs text-slate-400">
            {option.actualLbsPerWeek} lb/week
            {option.weeksToGoal !== null && ` · ~${option.weeksToGoal} weeks`}
            {option.projectedDate && ` · around ${option.projectedDate}`}
          </p>
        </div>
        <button
          onClick={() => onApply(option)}
          className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium ${
            applied ? "bg-emerald-500 text-slate-950" : "bg-amber-500 text-slate-950 hover:bg-amber-400"
          }`}
        >
          {applied ? "Applied ✓" : "Use this"}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        <span>
          <span className="text-2xl font-bold text-amber-400">{option.baseCalories}</span>
          <span className="text-xs text-slate-400"> kcal base</span>
        </span>
        <span className="self-end text-xs text-slate-400">
          P {option.proteinTarget}g · C {option.carbTarget}g · F {option.fatTarget}g
        </span>
        <span className="self-end text-xs text-slate-500">−{option.dailyDeficit}/day deficit</span>
      </div>

      {option.note && (
        <p
          className={`mt-3 rounded-md p-2 text-xs ${
            option.belowFloor || option.belowBmr
              ? "bg-amber-500/10 text-amber-300"
              : "bg-slate-800/50 text-slate-400"
          }`}
        >
          {option.note}
        </p>
      )}
      {option.macroWarning && (
        <p className="mt-2 rounded-md bg-amber-500/10 p-2 text-xs text-amber-300">
          {option.macroWarning}
        </p>
      )}
    </div>
  );
}

export default function Plan() {
  const [form, setForm] = useState<Form>(DEFAULT_FORM);
  const [goalType, setGoalType] = useState<GoalType>("lose");
  const [macroSplit, setMacroSplit] = useState<MacroSplitId>("balanced");
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [appliedId, setAppliedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tdeeSource, setTdeeSource] = useState<TdeeSource>("formula");

  useEffect(() => {
    api.profile.get().then((p) => {
      if (p) {
        const { updatedAt: _updatedAt, ...rest } = p;
        setForm(rest);
      }
    });
    api.settings.get().then((s) => setTdeeSource(s.tdeeSource));
  }, []);

  const calculate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Save first, then read back through /plan so the adaptive maintenance
      // figure and any eat-back conflict come from the same code path the
      // rest of the app uses.
      await api.profile.update(form);
      setPlan(await api.profile.plan(goalType, macroSplit));
      setAppliedId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not build a plan");
    } finally {
      setLoading(false);
    }
  }, [form, goalType, macroSplit]);

  async function changeSource(source: TdeeSource) {
    await api.settings.update({ tdeeSource: source });
    if (plan) calculate();
  }

  // Once a plan is on screen, changing goal or split refreshes it in place
  // rather than making you hit calculate again.
  useEffect(() => {
    if (plan) calculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalType, macroSplit]);

  async function applyOption(option: PlanOption) {
    await api.goals.update({
      calories: option.baseCalories,
      protein: option.proteinTarget,
      carbs: option.carbTarget,
      fat: option.fatTarget,
    });
    setAppliedId(option.id);
  }

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <WeightCard
        source={tdeeSource}
        onSourceChange={(s) => {
          setTdeeSource(s);
          changeSource(s);
        }}
        onLogged={() => {
          api.profile.get().then((p) => {
            if (p) {
              const { updatedAt: _updatedAt, ...rest } = p;
              setForm(rest);
            }
          });
          if (plan) calculate();
        }}
      />

      <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
        <h2 className="font-semibold">Your details</h2>

        <div>
          <p className="mb-1 text-xs text-slate-400">Goal</p>
          <div className="flex gap-1">
            {GOAL_TYPES.map((g) => (
              <button
                key={g}
                onClick={() => setGoalType(g)}
                className={`flex-1 rounded-md py-1.5 text-xs font-medium ${
                  goalType === g ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-300"
                }`}
              >
                {GOAL_TYPE_LABELS[g]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-slate-400">
            Sex
            <select
              value={form.sex}
              onChange={(e) => set("sex", e.target.value as Form["sex"])}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </label>
          <label className="text-xs text-slate-400">
            Age
            <input
              type="number"
              value={form.age}
              onChange={(e) => set("age", Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs text-slate-400">
            Height (cm) — {cmToFtIn(form.heightCm)}
            <input
              type="number"
              value={form.heightCm}
              onChange={(e) => set("heightCm", Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm"
            />
          </label>
          <div />
          <label className="text-xs text-slate-400">
            Current weight (lbs)
            <input
              type="number"
              value={form.currentWeightLbs}
              onChange={(e) => set("currentWeightLbs", Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs text-slate-400">
            Goal weight (lbs)
            <input
              type="number"
              value={form.goalWeightLbs}
              onChange={(e) => set("goalWeightLbs", Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm"
            />
          </label>
        </div>

        <div>
          <p className="mb-1 text-xs text-slate-400">
            Baseline activity — <span className="text-slate-500">not counting workouts you log</span>
          </p>
          <div className="space-y-1">
            {ACTIVITY_LEVELS.map((level) => (
              <button
                key={level}
                onClick={() => set("activityLevel", level)}
                className={`w-full rounded-md px-3 py-2 text-left text-xs ${
                  form.activityLevel === level
                    ? "bg-amber-500/20 ring-1 ring-amber-500"
                    : "bg-slate-800/50 hover:bg-slate-800"
                }`}
              >
                {ACTIVITY_LABELS[level]}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          onClick={calculate}
          disabled={loading}
          className="w-full rounded-md bg-amber-500 py-2 font-medium text-slate-950 disabled:opacity-40"
        >
          {loading ? "Calculating..." : "Calculate my options"}
        </button>
      </div>

      {plan && (
        <>
          {plan.goalWarning && (
            <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
              {plan.goalWarning}
            </p>
          )}

          {plan.eatBackConflict && (
            <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
              {plan.eatBackConflict}
            </p>
          )}

          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 text-sm">
            <p>
              Resting burn <span className="font-semibold">{plan.bmr}</span> kcal · maintenance{" "}
              <span className="font-semibold">{plan.tdee}</span> kcal{" "}
              <span className="text-xs text-slate-400">
                ({plan.tdeeSource === "adaptive" ? "measured from your results" : "formula estimate"})
              </span>
              {plan.goalType !== "maintain" && plan.lbsToLose > 0 && (
                <>
                  {" "}
                  · <span className="font-semibold">{plan.lbsToLose}</span> lbs to{" "}
                  {plan.goalType === "lose" ? "lose" : "gain"}
                </>
              )}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Anything you log as exercise gets added on top of the base below, so the deficit stays
              the same whether you work out or not.
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            <p className="mb-2 text-xs text-slate-400">
              Macro split — <span className="text-slate-500">protein stays anchored to your goal
              weight; the rest shifts between carbs and fat</span>
            </p>
            <div className="flex flex-wrap gap-1">
              {MACRO_SPLITS.map((s) => (
                <button
                  key={s}
                  onClick={() => setMacroSplit(s)}
                  className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium ${
                    macroSplit === s ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {MACRO_SPLIT_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {plan.options.map((o) => (
              <OptionCard
                key={o.id}
                option={o}
                onApply={applyOption}
                applied={appliedId === o.id}
              />
            ))}
          </div>

          <p className="pb-4 text-xs text-slate-500">
            These are estimates from a standard formula, not medical advice. Real results vary —
            adjust after a few weeks based on what the scale actually does, and talk to a doctor
            before a large or fast loss.
          </p>
        </>
      )}
    </div>
  );
}
