import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import {
  getAllCoupons,
  applyDiscount,
  newCoupon,
  deleteCoupon,
  createStripePaymentIntent,
  createRazorpayPaymentIntent,
  razorpayPaymentVerification,
  razorpayApiKey,
} from "../controllers/payment.js";

const app = express.Router();

// Create payment intent - /api/v1/payment/create
app.post("/createStripe", createStripePaymentIntent);

// Create payment intent - /api/v1/payment/createRazorpay
app.post("/createRazorpay", createRazorpayPaymentIntent);

// Verify payment - /api/v1/payment/razorpayPaymentVerification
app.get("/razorpayPaymentVerification", razorpayPaymentVerification);

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
