import { Request } from "express";
import { redis } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Coupon } from "../models/coupon.js";
import { Order } from "../models/order.js";
import { Payment } from "../models/payment.js";
import { Product } from "../models/product.js";
import { User } from "../models/user.js";
import { NewOrderRequestBody } from "../types/types.js";
import { invalidateCache, reduceStock } from "../utils/features.js";
import ErrorHandler from "../utils/utility-class.js";

export const getAllOrders = TryCatch(async (req, res, next) => {
  const key = `all-orders`;

  let orders = [];

  const cachedData = await redis.get(key);

  if (cachedData) {
    orders = JSON.parse(cachedData);
  } else {
    orders = await Order.find().populate("user", "name");
    await redis.set(key, JSON.stringify(orders));
  }

  return res.status(200).json({
    success: true,
    message: "All Orders",
    orders,
  });
});

export const myOrders = TryCatch(async (req, res, next) => {
  const { id: user } = req.query;

  if (!user) {
    return next(new ErrorHandler("Please enter a user id", 400));
  }

  const key = `my-orders-${user}`;

  let orders = [];

  const cachedData = await redis.get(key);

  if (cachedData) {
    orders = JSON.parse(cachedData);
  } else {
    orders = await Order.find({ user }).populate("user", "name");
    await redis.set(key, JSON.stringify(orders));
  }

  return res.status(200).json({
    success: true,
    message: "My Orders",
    orders,
  });
});

export const getSingleOrder = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(new ErrorHandler("Please enter an order id", 400));
  }

  const key = `order-${id}`;

  let order;

  const cachedData = await redis.get(key);

  if (cachedData) {
    order = JSON.parse(cachedData);
  } else {
    order = await Order.findById(req.params.id).populate("user", "name");
    if (!order) {
      return next(new ErrorHandler("Order not found", 404));
    }
    await redis.set(key, JSON.stringify(order));
  }

  return res.status(200).json({
    success: true,
    message: "Order Details",
    order,
  });
});

export const newOrder = TryCatch(
  async (req: Request<{}, {}, NewOrderRequestBody>, res, next) => {
    const { shippingInfo, orderItems, user, coupon } = req.body;

    const productIds = orderItems.map((item) => item.productId);

    const products = await Product.find({ _id: { $in: productIds } });

    if (products.length !== productIds.length) {
      return next(new ErrorHandler("Product not found", 404));
    }

    const subtotal = products.reduce((acc, item) => {
      const cartItem = orderItems.find(
        (Item) => Item.productId === item._id.toString()
      );
      if (!cartItem) return acc;
      return acc + item.price * cartItem.quantity;
    }, 0);

    const tax = Math.round(subtotal * 0.18);
    const shippingCharges = subtotal > 1000 ? 0 : subtotal === 0 ? 0 : 100;

    let discount = 0;

    if (coupon) {
      const couponData = await Coupon.findOne({ code: coupon });
      discount = couponData ? couponData.amount : 0;
    }

    const total = subtotal + tax + shippingCharges - discount;

    if (!shippingInfo || !orderItems || !user) {
      return next(new ErrorHandler("Please fill all fields", 400));
    }

    await reduceStock(orderItems);

    // create new order
    const order = await Order.create({
      shippingInfo,
      orderItems,
      user,
      subtotal,
      tax,
      shippingCharges,
      discount,
      total,
    });

    invalidateCache({
      admin: true,
      order: true,
      userId: user,
      product: true,
      productId: orderItems.map((item) => item.productId),
    });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      orderId: order._id,
    });
  }
);

export const processOrder = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  const order = await Order.findById(id);

  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }

  switch (order.status) {
    case "Processing":
      order.status = "Shipped";
      break;
    case "Shipped":
      order.status = "Delivered";
      break;
    default:
      order.status = "Delivered";
      break;
  }

  await order.save();

  invalidateCache({
    admin: true,
    review: true,
    userId: order.user,
    productId: order.orderItems.map((item) => item.productId.toString()),
    order: true,
    orderId: String(order._id),
  });

  return res.status(200).json({
    success: true,
    message: "Order processed successfully",
  });
});

export const cancelOrder = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.query.id;

  const order = await Order.findById(id);

  const user = await User.findById(userId);

  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  if (userId !== order.user && user.role !== "admin") {
    return next(
      new ErrorHandler("You are not authorized to cancel this order", 401)
    );
  }

  if (order.status === "Delivered" || order.status === "Cancelled") {
    return next(new ErrorHandler("You cannot cancel this order", 400));
  }

  order.status = "Cancelled";

  await order.save();

  for (let i = 0; i < order.orderItems.length; i++) {
    const item = order.orderItems[i];
    const product = await Product.findById(item.productId);
    if (!product) {
      return next(new ErrorHandler("Product not found", 404));
    }
    product.stock = product.stock + item.quantity;
    await product.save();
  }

  invalidateCache({
    admin: true,
    review: true,
    userId: order.user,
    order: true,
    orderId: String(order._id),
    product: true,
    productId: order.orderItems.map((item) => item.productId.toString()),
  });

  return res.status(200).json({
    success: true,
    message: "Order cancelled successfully",
  });
});

export const deleteOrder = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const order = await Order.findById(id);

  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }

  if (order.status === "Shipped" || order.status === "Processing") {
    return next(new ErrorHandler("You cannot delete this order", 400));
  }

  const payment = await Payment.findOne({ order: order._id });

  if (!payment) {
    return next(new ErrorHandler("Payment not found", 404));
  }

  await payment.deleteOne();
  await order.deleteOne();

  if (order.status !== "Cancelled" && order.status !== "Delivered") {
    for (let i = 0; i < order.orderItems.length; i++) {
      const item = order.orderItems[i];
      const product = await Product.findById(item.productId);
      if (!product) {
        return next(new ErrorHandler("Product not found", 404));
      }
      product.stock = product.stock + item.quantity;
      await product.save();
    }
  }

  invalidateCache({
    admin: true,
    userId: order.user,
    order: true,
    orderId: String(order._id),
  });

  return res.status(200).json({
    success: true,
    message: "Order Deleted Successfully",
  });
});
