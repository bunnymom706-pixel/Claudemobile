import { Router } from "express";
import { LookupError, lookupBarcode, searchNutrition } from "../nutrition.js";

export const lookupRouter = Router();

function handleError(err: unknown, res: import("express").Response): void {
  if (err instanceof LookupError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  res.status(500).json({ error: "Lookup failed" });
}

lookupRouter.get("/search", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (!q) {
    res.status(400).json({ error: "Query is required" });
    return;
  }
  try {
    res.json({ results: await searchNutrition(q) });
  } catch (err) {
    handleError(err, res);
  }
});

lookupRouter.get("/barcode/:code", async (req, res) => {
  const code = req.params.code.replace(/\D/g, "");
  if (!code) {
    res.status(400).json({ error: "Barcode must be numeric" });
    return;
  }
  try {
    const food = await lookupBarcode(code);
    if (!food) {
      res.status(404).json({ error: "No product found for that barcode" });
      return;
    }
    res.json({ result: food });
  } catch (err) {
    handleError(err, res);
  }
});
