import express from "express";
import { adminOnly } from "../middlewares/auth.js";

const app = express.Router();

// Get the stats - /api/v1/dashboard/stats
app.get("/stats", adminOnly);

// Get the pie chart data - /api/v1/dashboard/pie
app.get("/pie", adminOnly);

// Get the bar chart data - /api/v1/dashboard/bar
app.get("/bar", adminOnly);

// Get the line chart data - /api/v1/dashboard/line
app.get("/line", adminOnly);

export default app;
