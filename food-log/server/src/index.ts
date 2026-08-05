import express from "express";
import cors from "cors";
import { foodsRouter } from "./routes/foods.js";
import { logsRouter } from "./routes/logs.js";
import { goalsRouter } from "./routes/goals.js";
import { exercisesRouter } from "./routes/exercises.js";
import { lookupRouter } from "./routes/lookup.js";
import { healthRouter, settingsRouter } from "./routes/health.js";
import { profileRouter } from "./routes/profile.js";
import { summaryRouter, trendsRouter } from "./routes/summary.js";

const app = express();
const PORT = Number(process.env.PORT) || 4001;

app.use(cors());
// Health Auto Export can post sizeable batches when catching up on missed days.
app.use(express.json({ limit: "5mb" }));

app.use("/api/foods", foodsRouter);
app.use("/api/logs", logsRouter);
app.use("/api/goals", goalsRouter);
app.use("/api/exercises", exercisesRouter);
app.use("/api/lookup", lookupRouter);
app.use("/api/health", healthRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/profile", profileRouter);
app.use("/api/summary", summaryRouter);
app.use("/api/trends", trendsRouter);

// Liveness check. Named /api/status so /api/health/* is unambiguously health data.
app.get("/api/status", (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`food-log server listening on http://localhost:${PORT}`);
});
