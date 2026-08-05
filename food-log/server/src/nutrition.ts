/**
 * Nutrition database providers.
 *
 * Exact label values come from barcode lookups; text search is a best-effort
 * match and should always be confirmed against the package. Every result
 * carries the basis it was derived from so the UI can say how trustworthy
 * the numbers are.
 */

export type NutritionSource = "openfoodfacts" | "usda";

/** How the per-serving numbers were arrived at, weakest last. */
export type Basis = "label-serving" | "scaled-from-100g" | "per-100g";

export interface NormalizedFood {
  source: NutritionSource;
  sourceId: string;
  name: string;
  brand?: string;
  servingLabel: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar?: number;
  fiber?: number;
  basis: Basis;
  /** True when the numbers came straight off the product's label serving. */
  exact: boolean;
}

const USER_AGENT = "food-log/1.0 (personal food tracker)";
/** Overridable so tests can point at a fixture server. */
const OFF_BASE = process.env.OFF_BASE_URL ?? "https://world.openfoodfacts.org";
const TIMEOUT_MS = 10_000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const cache = new Map<string, { at: number; value: NormalizedFood[] }>();

function cacheGet(key: string): NormalizedFood[] | undefined {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return undefined;
  }
  return hit.value;
}

function cacheSet(key: string, value: NormalizedFood[]): void {
  cache.set(key, { at: Date.now(), value });
}

export class LookupError extends Error {
  constructor(message: string, readonly status = 502) {
    super(message);
    this.name = "LookupError";
  }
}

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: controller.signal,
    });
    if (!res.ok) {
      const detail =
        res.status === 429
          ? "Rate limited — wait a moment and try again."
          : "It may be down, or blocked by your network.";
      throw new LookupError(`Nutrition database returned ${res.status}. ${detail}`, 502);
    }
    return await res.json();
  } catch (err) {
    if (err instanceof LookupError) throw err;
    const reason = err instanceof Error && err.name === "AbortError" ? "timed out" : "is unreachable";
    throw new LookupError(
      `Nutrition database ${reason}. Check your internet connection, or enter the food by hand.`,
      503
    );
  } finally {
    clearTimeout(timer);
  }
}

function num(value: unknown): number | undefined {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : undefined;
}

function round(value: number, decimals = 1): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

// --- Open Food Facts -------------------------------------------------------
// Branded/packaged foods, worldwide, no API key. Best source for the bars and
// yogurts that make up most of a day's log.

const OFF_FIELDS = [
  "code",
  "product_name",
  "brands",
  "serving_size",
  "serving_quantity",
  "nutriments",
].join(",");

interface OffProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  serving_size?: string;
  serving_quantity?: number | string;
  nutriments?: Record<string, unknown>;
}

function normalizeOff(product: OffProduct): NormalizedFood | null {
  const n = product.nutriments ?? {};
  const code = product.code;
  const name = product.product_name?.trim();
  if (!code || !name) return null;

  const perServing = {
    calories: num(n["energy-kcal_serving"]),
    protein: num(n["proteins_serving"]),
    carbs: num(n["carbohydrates_serving"]),
    fat: num(n["fat_serving"]),
    sugar: num(n["sugars_serving"]),
    fiber: num(n["fiber_serving"]),
  };

  const per100 = {
    calories: num(n["energy-kcal_100g"]),
    protein: num(n["proteins_100g"]),
    carbs: num(n["carbohydrates_100g"]),
    fat: num(n["fat_100g"]),
    sugar: num(n["sugars_100g"]),
    fiber: num(n["fiber_100g"]),
  };

  const servingGrams = num(product.serving_quantity);
  const servingText = product.serving_size?.trim();

  let basis: Basis;
  let macros: typeof perServing;
  let servingLabel: string;

  if (perServing.calories !== undefined && perServing.protein !== undefined) {
    basis = "label-serving";
    macros = perServing;
    servingLabel = servingText || "1 serving";
  } else if (per100.calories !== undefined && servingGrams) {
    const factor = servingGrams / 100;
    basis = "scaled-from-100g";
    macros = {
      calories: per100.calories * factor,
      protein: (per100.protein ?? 0) * factor,
      carbs: (per100.carbs ?? 0) * factor,
      fat: (per100.fat ?? 0) * factor,
      sugar: per100.sugar === undefined ? undefined : per100.sugar * factor,
      fiber: per100.fiber === undefined ? undefined : per100.fiber * factor,
    };
    servingLabel = servingText || `${round(servingGrams)} g`;
  } else if (per100.calories !== undefined) {
    basis = "per-100g";
    macros = per100;
    servingLabel = "100 g";
  } else {
    return null;
  }

  return {
    source: "openfoodfacts",
    sourceId: code,
    name,
    brand: product.brands?.split(",")[0]?.trim() || undefined,
    servingLabel,
    calories: round(macros.calories ?? 0),
    protein: round(macros.protein ?? 0),
    carbs: round(macros.carbs ?? 0),
    fat: round(macros.fat ?? 0),
    sugar: macros.sugar === undefined ? undefined : round(macros.sugar),
    fiber: macros.fiber === undefined ? undefined : round(macros.fiber),
    basis,
    exact: basis === "label-serving",
  };
}

export async function lookupBarcode(barcode: string): Promise<NormalizedFood | null> {
  const key = `off:barcode:${barcode}`;
  const cached = cacheGet(key);
  if (cached) return cached[0] ?? null;

  const url = `${OFF_BASE}/api/v2/product/${encodeURIComponent(barcode)}?fields=${OFF_FIELDS}`;
  const body = (await fetchJson(url)) as { status?: number; product?: OffProduct };

  if (body.status !== 1 || !body.product) return null;
  const food = normalizeOff(body.product);
  if (food) cacheSet(key, [food]);
  return food;
}

async function searchOff(query: string): Promise<NormalizedFood[]> {
  const url =
    `${OFF_BASE}/api/v2/search?search_terms=${encodeURIComponent(query)}` +
    `&fields=${OFF_FIELDS}&page_size=20&sort_by=popularity_key`;
  const body = (await fetchJson(url)) as { products?: OffProduct[] };
  return (body.products ?? [])
    .map(normalizeOff)
    .filter((f): f is NormalizedFood => f !== null);
}

// --- USDA FoodData Central -------------------------------------------------
// Better than OFF for generic whole foods ("chicken breast", "banana").
// Needs a free key from https://fdc.nal.usda.gov/api-key-signup.html set as
// FDC_API_KEY; silently skipped when absent.

const FDC_NUTRIENTS: Record<string, keyof Pick<NormalizedFood, "calories" | "protein" | "carbs" | "fat" | "sugar" | "fiber">> = {
  "1008": "calories",
  "1003": "protein",
  "1005": "carbs",
  "1004": "fat",
  "2000": "sugar",
  "1079": "fiber",
};

interface FdcFood {
  fdcId?: number;
  description?: string;
  brandOwner?: string;
  brandName?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
  foodNutrients?: Array<{ nutrientNumber?: string; value?: number }>;
}

function normalizeFdc(food: FdcFood): NormalizedFood | null {
  if (!food.fdcId || !food.description) return null;

  // FDC reports per 100 g/ml; scale to the label serving when one is given.
  const per100: Record<string, number> = {};
  for (const n of food.foodNutrients ?? []) {
    const field = n.nutrientNumber ? FDC_NUTRIENTS[n.nutrientNumber] : undefined;
    if (field && typeof n.value === "number") per100[field] = n.value;
  }
  if (per100.calories === undefined) return null;

  const grams = food.servingSize && food.servingSizeUnit?.toLowerCase() === "g" ? food.servingSize : undefined;
  const factor = grams ? grams / 100 : 1;
  const basis: Basis = grams ? "scaled-from-100g" : "per-100g";
  const servingLabel = grams
    ? food.householdServingFullText?.trim() || `${round(grams)} g`
    : "100 g";

  return {
    source: "usda",
    sourceId: String(food.fdcId),
    name: food.description,
    brand: food.brandName?.trim() || food.brandOwner?.trim() || undefined,
    servingLabel,
    calories: round(per100.calories * factor),
    protein: round((per100.protein ?? 0) * factor),
    carbs: round((per100.carbs ?? 0) * factor),
    fat: round((per100.fat ?? 0) * factor),
    sugar: per100.sugar === undefined ? undefined : round(per100.sugar * factor),
    fiber: per100.fiber === undefined ? undefined : round(per100.fiber * factor),
    basis,
    exact: false,
  };
}

async function searchFdc(query: string): Promise<NormalizedFood[]> {
  const key = process.env.FDC_API_KEY;
  if (!key) return [];
  const url =
    `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}` +
    `&pageSize=15&api_key=${encodeURIComponent(key)}`;
  const body = (await fetchJson(url)) as { foods?: FdcFood[] };
  return (body.foods ?? []).map(normalizeFdc).filter((f): f is NormalizedFood => f !== null);
}

/**
 * Search both providers. A provider that fails is dropped rather than failing
 * the whole search; only a total wipeout surfaces as an error.
 */
export async function searchNutrition(query: string): Promise<NormalizedFood[]> {
  const key = `search:${query.toLowerCase()}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const settled = await Promise.allSettled([searchOff(query), searchFdc(query)]);
  const results = settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

  if (results.length === 0) {
    const firstFailure = settled.find((r) => r.status === "rejected") as
      | PromiseRejectedResult
      | undefined;
    if (firstFailure) throw firstFailure.reason;
  }

  // Label-serving numbers first — those are the ones worth trusting.
  results.sort((a, b) => Number(b.exact) - Number(a.exact));
  cacheSet(key, results);
  return results;
}
