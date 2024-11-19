import express from "express";
import {
  applyDiscount,
  createPayment,
  createRazorpayPaymentIntent,
  deleteCoupon,
  getAllCoupons,
  newCoupon,
  razorpayApiKey,
  razorpayPaymentVerification,
} from "../controllers/payment.js";
import { adminOnly } from "../middlewares/auth.js";

const app = express.Router();

// Create payment intent - /api/v1/payment/createRazorpay
app.post("/createRazorpay", createRazorpayPaymentIntent);

// Verify payment - /api/v1/payment/razorpayPaymentVerification
app.post("/razorpayPaymentVerification", razorpayPaymentVerification);

// Create payment - /api/v1/payment/createPayment
app.post("/createPayment", createPayment);

// Get Razorpay API key - /api/v1/payment/razorpayApiKey
app.get("/razorpayApiKey", razorpayApiKey);

// Apply discount - /api/v1/payment/discount
app.post("/discount", applyDiscount);

// Create a new coupon - /api/v1/payment/coupon/new
app.post("/coupon/new", adminOnly, newCoupon);

// Get all coupons - /api/v1/payment/coupon/all
app.get("/coupon/all", adminOnly, getAllCoupons);

// Delete a coupon - /api/v1/payment/coupon/:id
app.delete("/coupon/:id", adminOnly, deleteCoupon);

export default app;
