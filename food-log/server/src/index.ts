import express from "express";
import cors from "cors";
import { foodsRouter } from "./routes/foods.js";
import { logsRouter } from "./routes/logs.js";
import { goalsRouter } from "./routes/goals.js";
import { summaryRouter, trendsRouter } from "./routes/summary.js";

const app = express();
const PORT = Number(process.env.PORT) || 4001;

app.use(cors());
app.use(express.json());

app.use("/api/foods", foodsRouter);
app.use("/api/logs", logsRouter);
app.use("/api/goals", goalsRouter);
app.use("/api/summary", summaryRouter);
app.use("/api/trends", trendsRouter);

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`food-log server listening on http://localhost:${PORT}`);
});
