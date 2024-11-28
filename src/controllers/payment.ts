import crypto from "crypto";
import { razorpay, redis } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Coupon } from "../models/coupon.js";
import { Payment } from "../models/payment.js";
import { invalidateCache } from "../utils/features.js";
import ErrorHandler from "../utils/utility-class.js";

export const razorpayApiKey = TryCatch(async (req, res, next) => {
  return res.status(200).json({
    success: true,
    message: "Razorpay API key fetched successfully",
    key_id: process.env.RAZORPAY_KEY_ID,
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
      message: "Razorpay order created successfully",
      id: order.id,
      currency: order.currency,
      amount: order.amount,
    });
  });
});

export const razorpayPaymentVerification = TryCatch(async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET
    ? process.env.RAZORPAY_KEY_SECRET
    : "";

  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  const isAuthentic = expectedSignature === razorpay_signature;

  if (isAuthentic) {
    res.status(200).json({
      success: true,
      message: "Payment verification successful",
      signatureIsValid: true,
    });
  } else {
    res.status(400).json({
      success: false,
      message: "Payment verification failed",
      signatureIsValid: false,
    });
  }
});

export const createPayment = TryCatch(async (req, res, next) => {
  const {
    order,
    user,
    paymentStatus,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  if (
    !order ||
    !user ||
    !paymentStatus ||
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature
  ) {
    return next(new ErrorHandler("Please enter all fields", 400));
  }

  await Payment.create({
    order,
    user,
    paymentStatus,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  });

  return res.status(201).json({
    success: true,
    message: "Payment created successfully",
  });
});

export const getAllCoupons = TryCatch(async (req, res, next) => {
  const key = "all-coupons";

  let coupons;

  const cachedData = await redis.get(key);

  if (cachedData) {
    coupons = JSON.parse(cachedData);
  } else {
    coupons = await Coupon.find();
    await redis.set(key, JSON.stringify(coupons));
  }

  return res.status(200).json({
    success: true,
    message: "All coupons fetched successfully",
    count: coupons.length,
    coupons,
  });
});

export const getCoupon = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(new ErrorHandler("Please enter a coupon id", 400));
  }

  const key = `coupon-${id}`;

  let coupon;

  const cachedData = await redis.get(key);

  if (cachedData) {
    coupon = JSON.parse(cachedData);
  } else {
    coupon = await Coupon.findById(id);

    if (!coupon) {
      return next(new ErrorHandler("Coupon not found", 404));
    }

    await redis.set(key, JSON.stringify(coupon));
  }

  return res.status(200).json({
    success: true,
    message: `Coupon ${coupon.code} fetched successfully`,
    coupon,
  });
});

export const applyDiscount = TryCatch(async (req, res, next) => {
  const { coupon } = req.query;

  if (!coupon) {
    return next(new ErrorHandler("Please enter a coupon code", 400));
  }

  const key = `coupon-${coupon}`;

  let discount;

  const cachedData = await redis.get(key);

  if (cachedData) {
    discount = JSON.parse(cachedData);
  } else {
    discount = await Coupon.findOne({ code: coupon });

    if (!discount) {
      return next(new ErrorHandler("Invalid coupon code", 400));
    }

    await redis.set(key, discount.amount);
  }

  return res.status(200).json({
    success: true,
    discount: discount.amount,
    message: "Coupon applied successfully",
  });
});

export const newCoupon = TryCatch(async (req, res, next) => {
  const {
    code,
    amount,
    size,
    prefix,
    postfix,
    includeNumbers,
    includeCharacters,
    includeSymbols,
  } = req.body;

  if (!code || !amount) {
    return next(new ErrorHandler("Please enter both coupon and amount", 400));
  }

  await Coupon.create({
    code,
    amount,
    size,
    prefix,
    postfix,
    includeNumbers,
    includeCharacters,
    includeSymbols,
  });

  invalidateCache({ coupon: true });

  return res.status(201).json({
    success: true,
    message: `Coupon ${code} created successfully`,
  });
});

export const updateCoupon = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  const coupon = await Coupon.findById(id);

  if (!coupon) {
    return next(new ErrorHandler("Coupon not found", 404));
  }

  const {
    code,
    amount,
    size,
    prefix,
    postfix,
    includeNumbers,
    includeCharacters,
    includeSymbols,
  } = req.body;

  if (!code || !amount) {
    return next(new ErrorHandler("Please enter both coupon and amount", 400));
  }

  if (coupon.code !== code) coupon.code = code;
  if (coupon.amount !== amount) coupon.amount = amount;
  if (coupon.size !== size) coupon.size = size;
  if (coupon.prefix !== prefix) coupon.prefix = prefix;
  if (coupon.postfix !== postfix) coupon.postfix = postfix;
  if (coupon.includeNumbers !== includeNumbers)
    coupon.includeNumbers = includeNumbers;
  if (coupon.includeCharacters !== includeCharacters)
    coupon.includeCharacters = includeCharacters;
  if (coupon.includeSymbols !== includeSymbols)
    coupon.includeSymbols = includeSymbols;

  await coupon.save();

  invalidateCache({ coupon: true, couponId: id });

  return res.status(200).json({
    success: true,
    message: `Coupon ${coupon.code} updated successfully`,
  });
});

export const deleteCoupon = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  const coupon = await Coupon.findById(id);

  if (!coupon) {
    return next(new ErrorHandler("Coupon not found", 404));
  }

  await coupon.deleteOne();

  invalidateCache({ coupon: true, couponId: id });

  return res.status(200).json({
    success: true,
    message: `Coupon ${coupon.code} deleted successfully`,
  });
});
