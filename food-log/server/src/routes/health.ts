import { Router } from "express";
import { db } from "../db.js";
import { makeId } from "../utils/id.js";

/**
 * Receives active-energy data pushed from a phone.
 *
 * Apple Health has no cloud API, so nothing here can pull. The phone pushes:
 * an Apple Shortcuts automation, Health Auto Export, or anything else that
 * can POST JSON. Payload shapes differ wildly between those, so parsing is
 * deliberately forgiving — see normalize().
 */

const HEALTH_ENTRY_NAME = "Active energy (Health)";

interface DayEnergy {
  date: string;
  activeEnergy: number;
}

function isDateStr(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function toNumber(v: unknown): number | undefined {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) && n >= 0 ? n : undefined;
}

/** Health Auto Export dates look like "2026-08-05 00:00:00 -0500". */
function toDateStr(v: unknown, fallback: string): string {
  if (isDateStr(v)) return v;
  if (typeof v === "string") {
    const match = v.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
  }
  return fallback;
}

/**
 * Accepts, in order of preference:
 *   Health Auto Export  {data:{metrics:[{name:"active_energy",data:[{date,qty}]}]}}
 *   batch               {entries:[{date,activeEnergy}]}
 *   single              {date,activeEnergy}
 *   bare Shortcuts      {activeEnergy: 512}  -> today
 */
function normalize(body: unknown, today: string): DayEnergy[] {
  if (!body || typeof body !== "object") return [];
  const b = body as Record<string, unknown>;

  // Health Auto Export
  const data = b.data as Record<string, unknown> | undefined;
  const metrics = data?.metrics;
  if (Array.isArray(metrics)) {
    const out: DayEnergy[] = [];
    for (const metric of metrics) {
      const m = metric as Record<string, unknown>;
      const name = typeof m.name === "string" ? m.name.toLowerCase() : "";
      if (!name.includes("active_energy") && !name.includes("active energy")) continue;
      for (const point of Array.isArray(m.data) ? m.data : []) {
        const p = point as Record<string, unknown>;
        const qty = toNumber(p.qty ?? p.value);
        if (qty === undefined) continue;
        out.push({ date: toDateStr(p.date, today), activeEnergy: qty });
      }
    }
    if (out.length > 0) return out;
  }

  // Batch
  if (Array.isArray(b.entries)) {
    const out: DayEnergy[] = [];
    for (const entry of b.entries) {
      const e = entry as Record<string, unknown>;
      const qty = toNumber(e.activeEnergy ?? e.activeEnergyBurned ?? e.caloriesBurned ?? e.qty);
      if (qty === undefined) continue;
      out.push({ date: toDateStr(e.date ?? e.loggedDate, today), activeEnergy: qty });
    }
    return out;
  }

  // Single / bare
  const qty = toNumber(b.activeEnergy ?? b.activeEnergyBurned ?? b.caloriesBurned ?? b.qty);
  if (qty !== undefined) {
    return [{ date: toDateStr(b.date ?? b.loggedDate, today), activeEnergy: qty }];
  }

  return [];
}

export const healthRouter = Router();

/**
 * Optional shared secret. Set HEALTH_SYNC_TOKEN and send it as
 * `Authorization: Bearer <token>`. Worth setting if the server is reachable
 * from outside localhost, since this endpoint writes.
 */
function authorized(req: import("express").Request): boolean {
  const expected = process.env.HEALTH_SYNC_TOKEN;
  if (!expected) return true;
  const header = req.get("authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  return token === expected;
}

healthRouter.post("/sync", (req, res) => {
  if (!authorized(req)) {
    res.status(401).json({ error: "Invalid or missing sync token" });
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const days = normalize(req.body, today);

  if (days.length === 0) {
    res.status(400).json({
      error:
        "No active energy found in payload. Send {\"date\":\"YYYY-MM-DD\",\"activeEnergy\":500}, " +
        "a batch under \"entries\", or a Health Auto Export payload.",
    });
    return;
  }

  const state = db.get();
  const now = new Date().toISOString();
  const synced: Array<{ date: string; activeEnergy: number }> = [];

  // One health row per day, replaced on each sync — re-syncing the same day
  // corrects it rather than stacking duplicates.
  for (const day of days) {
    const existing = state.exercises.find(
      (e) => e.source === "health" && e.loggedDate === day.date
    );
    if (existing) {
      existing.caloriesBurned = day.activeEnergy;
      existing.loggedAt = now;
    } else {
      state.exercises.push({
        id: makeId(),
        name: HEALTH_ENTRY_NAME,
        caloriesBurned: day.activeEnergy,
        loggedDate: day.date,
        loggedAt: now,
        source: "health",
      });
    }
    synced.push({ date: day.date, activeEnergy: day.activeEnergy });
  }

  db.save();
  res.json({ synced, mode: state.settings.healthSyncMode });
});

export const settingsRouter = Router();

settingsRouter.get("/", (req, res) => {
  res.json(db.get().settings);
});

settingsRouter.put("/", (req, res) => {
  const body = (req.body ?? {}) as { healthSyncMode?: unknown; exerciseEatBackPercent?: unknown };
  const state = db.get();

  if (body.healthSyncMode !== undefined) {
    if (body.healthSyncMode !== "reconcile" && body.healthSyncMode !== "add") {
      res.status(400).json({ error: "healthSyncMode must be 'reconcile' or 'add'" });
      return;
    }
    state.settings.healthSyncMode = body.healthSyncMode;
  }

  const source = (req.body as { tdeeSource?: unknown })?.tdeeSource;
  if (source !== undefined) {
    if (source !== "formula" && source !== "adaptive") {
      res.status(400).json({ error: "tdeeSource must be 'formula' or 'adaptive'" });
      return;
    }
    state.settings.tdeeSource = source;
  }

  if (body.exerciseEatBackPercent !== undefined) {
    const pct = Number(body.exerciseEatBackPercent);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      res.status(400).json({ error: "exerciseEatBackPercent must be between 0 and 100" });
      return;
    }
    state.settings.exerciseEatBackPercent = Math.round(pct);
  }

  db.save();
  res.json(state.settings);
});
