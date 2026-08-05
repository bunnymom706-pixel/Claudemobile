import type {
  DaySummary,
  DbFood,
  Exercise,
  Food,
  Goals,
  GoalType,
  HealthSyncMode,
  MacroSplitId,
  LogEntry,
  MealType,
  Plan,
  Profile,
  Settings,
  Trends,
} from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (typeof body.error === "string") throw new Error(body.error);
    throw new Error(body.error ? JSON.stringify(body.error) : `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  foods: {
    list: (q?: string) => request<Food[]>(`/foods${q ? `?q=${encodeURIComponent(q)}` : ""}`),
    create: (input: Omit<Food, "id" | "createdAt" | "isFavorite"> & { isFavorite?: boolean }) =>
      request<Food>("/foods", { method: "POST", body: JSON.stringify(input) }),
    update: (id: string, input: Partial<Food>) =>
      request<Food>(`/foods/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    remove: (id: string) => request<void>(`/foods/${id}`, { method: "DELETE" }),
  },
  logs: {
    list: (date?: string) => request<LogEntry[]>(`/logs${date ? `?date=${date}` : ""}`),
    create: (input: {
      foodId?: string | null;
      foodName?: string;
      brand?: string;
      servings: number;
      mealType: MealType;
      loggedDate: string;
      notes?: string;
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
    }) => request<LogEntry>("/logs", { method: "POST", body: JSON.stringify(input) }),
    update: (id: string, input: Partial<LogEntry>) =>
      request<LogEntry>(`/logs/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    remove: (id: string) => request<void>(`/logs/${id}`, { method: "DELETE" }),
  },
  goals: {
    get: () => request<Goals>("/goals"),
    update: (input: { calories: number; protein: number; carbs: number; fat: number }) =>
      request<Goals>("/goals", { method: "PUT", body: JSON.stringify(input) }),
  },
  exercises: {
    list: (date?: string) => request<Exercise[]>(`/exercises${date ? `?date=${date}` : ""}`),
    create: (input: { name: string; caloriesBurned: number; loggedDate: string }) =>
      request<Exercise>("/exercises", { method: "POST", body: JSON.stringify(input) }),
    remove: (id: string) => request<void>(`/exercises/${id}`, { method: "DELETE" }),
  },
  profile: {
    get: () => request<Profile | null>("/profile"),
    update: (input: Omit<Profile, "updatedAt">) =>
      request<Profile>("/profile", { method: "PUT", body: JSON.stringify(input) }),
    plan: (goalType: GoalType, macroSplit: MacroSplitId) =>
      request<Plan>(`/profile/plan?goalType=${goalType}&macroSplit=${macroSplit}`),
    preview: (input: Omit<Profile, "updatedAt">, goalType: GoalType, macroSplit: MacroSplitId) =>
      request<Plan>("/profile/plan/preview", {
        method: "POST",
        body: JSON.stringify({ ...input, goalType, macroSplit }),
      }),
  },
  settings: {
    get: () => request<Settings>("/settings"),
    update: (healthSyncMode: HealthSyncMode) =>
      request<Settings>("/settings", { method: "PUT", body: JSON.stringify({ healthSyncMode }) }),
  },
  lookup: {
    search: (q: string) =>
      request<{ results: DbFood[] }>(`/lookup/search?q=${encodeURIComponent(q)}`).then((r) => r.results),
    barcode: (code: string) =>
      request<{ result: DbFood }>(`/lookup/barcode/${encodeURIComponent(code)}`).then((r) => r.result),
  },
  summary: (date: string) => request<DaySummary>(`/summary?date=${date}`),
  trends: (days: number) => request<Trends>(`/trends?days=${days}`),
};
