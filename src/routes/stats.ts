import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import {
  getBarCharts,
  getDashboardStats,
  getLineCharts,
  getPieCharts,
} from "../controllers/stats.js";

const app = express.Router();

// Get the stats - /api/v1/dashboard/stats
app.get("/stats", adminOnly, getDashboardStats);

// Get the pie chart data - /api/v1/dashboard/pie
app.get("/pie", adminOnly, getPieCharts);

// Get the bar chart data - /api/v1/dashboard/bar
app.get("/bar", adminOnly, getBarCharts);

// Get the line chart data - /api/v1/dashboard/line
app.get("/line", adminOnly, getLineCharts);

export default app;
