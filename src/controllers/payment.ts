import { stripe, razorpay } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Coupon } from "../models/coupon.js";
import ErrorHandler from "../utils/utility-class.js";

export const createStripePaymentIntent = TryCatch(async (req, res, next) => {
  const { amount } = req.body;

  if (!amount) {
    return next(new ErrorHandler("Please enter an amount", 400));
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Number(amount) * 100,
    currency: "inr",
  });

  return res.status(201).json({
    success: true,
    client_secret: paymentIntent.client_secret,
  });
});

export const createRazorpayPaymentIntent = TryCatch(async (req, res, next) => {
  const { amount } = req.body;

  if (!amount) {
    return next(new ErrorHandler("Please enter an amount", 400));
  }

  const options = {
    amount: Number(amount) * 100,
    currency: "INR",
  };

  razorpay.orders.create(options, (err, order) => {
    if (err) {
      return next(new ErrorHandler("Error creating Razorpay order", 400));
    }

    return res.status(201).json({
      success: true,
      id: order.id,
      currency: order.currency,
      amount: order.amount,
    });
  });
});

export const razorpayPaymentVerification = TryCatch(async (req, res, next) => {
  console.log(req.body + "aman");
  res.status(200).json({
    success: true,
    message: "Payment successful",
    body: JSON.stringify(req.body),
  });
});

export const razorpayApiKey = TryCatch(async (req, res, next) => {
  return res.status(200).json({
    success: true,
    key_id: process.env.RAZORPAY_KEY_ID,
  });
});

export const newCoupon = TryCatch(async (req, res, next) => {
  const { code, amount } = req.body;

  if (!code || !amount) {
    return next(new ErrorHandler("Please enter both coupon and amount", 400));
  }

  await Coupon.create({ code, amount });

  return res.status(201).json({
    success: true,
    message: `Coupon ${code} created successfully`,
  });
});

export const applyDiscount = TryCatch(async (req, res, next) => {
  const { coupon } = req.query;

  if (!coupon) {
    return next(new ErrorHandler("Please enter a coupon code", 400));
  }

  const discount = await Coupon.findOne({ code: coupon });

  if (!discount) {
    return next(new ErrorHandler("Invalid coupon code", 400));
  }

  return res.status(200).json({
    success: true,
    discount: discount.amount,
    message: "Coupon applied successfully",
  });
});

export const getAllCoupons = TryCatch(async (req, res, next) => {
  const coupons = await Coupon.find();

  return res.status(200).json({
    success: true,
    count: coupons.length,
    coupons,
  });
});

export const deleteCoupon = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  const coupon = await Coupon.findById(id);

  if (!coupon) {
    return next(new ErrorHandler("Coupon not found", 404));
  }

  await coupon.deleteOne();

  return res.status(200).json({
    success: true,
    message: `Coupon ${coupon.code} deleted successfully`,
  });
});
