interface MacroRingProps {
  label: string;
  value: number;
  goal: number;
  unit: string;
  color: string;
}

export default function MacroRing({ label, value, goal, unit, color }: MacroRingProps) {
  const pct = goal > 0 ? Math.min(1, value / goal) : 0;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);
  const over = value > goal;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={96} height={96} viewBox="0 0 96 96" className="-rotate-90">
        <circle cx={48} cy={48} r={radius} stroke="#1e293b" strokeWidth={10} fill="none" />
        <circle
          cx={48}
          cy={48}
          r={radius}
          stroke={over ? "#f87171" : color}
          strokeWidth={10}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="-mt-16 flex h-24 flex-col items-center justify-center">
        <span className="text-lg font-semibold">{Math.round(value)}</span>
        <span className="text-xs text-slate-400">/ {Math.round(goal)}{unit}</span>
      </div>
      <span className="text-sm text-slate-300">{label}</span>
    </div>
  );
}
