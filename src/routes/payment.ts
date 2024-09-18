import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import {
  getAllCoupons,
  applyDiscount,
  newCoupon,
  deleteCoupon,
} from "../controllers/payment.js";

const app = express.Router();

// Apply discount - /api/v1/payment/discount
app.post("/discount", applyDiscount);

// Create a new coupon - /api/v1/payment/coupon/new
app.post("/coupon/new", adminOnly, newCoupon);

// Get all coupons - /api/v1/payment/coupon/all
app.get("/coupon/all", adminOnly, getAllCoupons);

app.delete("/coupon/:id", adminOnly, deleteCoupon);

export default app;
