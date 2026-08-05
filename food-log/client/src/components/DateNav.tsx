interface DateNavProps {
  date: string;
  onChange: (date: string) => void;
}

function shift(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function isToday(date: string): boolean {
  return date === new Date().toISOString().slice(0, 10);
}

export default function DateNav({ date, onChange }: DateNavProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(shift(date, -1))}
        className="rounded-md border border-slate-700 px-2 py-1 text-slate-300 hover:bg-slate-800"
        aria-label="Previous day"
      >
        ←
      </button>
      <input
        type="date"
        value={date}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
      />
      <button
        onClick={() => onChange(shift(date, 1))}
        className="rounded-md border border-slate-700 px-2 py-1 text-slate-300 hover:bg-slate-800"
        aria-label="Next day"
      >
        →
      </button>
      {!isToday(date) && (
        <button
          onClick={() => onChange(new Date().toISOString().slice(0, 10))}
          className="rounded-md bg-amber-500/20 px-2 py-1 text-xs font-medium text-amber-300 hover:bg-amber-500/30"
        >
          Today
        </button>
      )}
    </div>
  );
}
