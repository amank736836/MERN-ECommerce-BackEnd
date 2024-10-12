import { TryCatch } from "../middlewares/error.js";
import { Order } from "../models/order.js";
import { invalidateCache, reduceStock } from "../utils/features.js";
import ErrorHandler from "../utils/utility-class.js";
import { myCache } from "../app.js";
import { Product } from "../models/product.js";
import { User } from "../models/user.js";
export const myOrders = TryCatch(async (req, res, next) => {
    const { id: user } = req.query;
    const key = `my-orders-${user}`;
    let orders = [];
    if (myCache.has(key)) {
        orders = JSON.parse(myCache.get(key));
    }
    else {
        orders = await Order.find({ user }).populate("user", "name");
        myCache.set(key, JSON.stringify(orders));
    }
    return res.status(200).json({
        success: true,
        message: "My Orders",
        orders,
    });
});
export const getAllOrders = TryCatch(async (req, res, next) => {
    const key = `all-orders`;
    let orders = [];
    if (myCache.has(key)) {
        orders = JSON.parse(myCache.get(key));
    }
    else {
        orders = await Order.find().populate("user", "name");
        myCache.set(key, JSON.stringify(orders));
    }
    return res.status(200).json({
        success: true,
        message: "All Orders",
        orders,
    });
});
export const getSingleOrder = TryCatch(async (req, res, next) => {
    const { id } = req.params;
    const key = `order-${id}`;
    let order;
    if (myCache.has(key)) {
        order = JSON.parse(myCache.get(key));
    }
    else {
        order = await Order.findById(req.params.id).populate("user", "name");
        if (!order) {
            return next(new ErrorHandler("Order not found", 404));
        }
        myCache.set(key, JSON.stringify(order));
    }
    return res.status(200).json({
        success: true,
        message: "Order Details",
        order,
    });
});
export const newOrder = TryCatch(async (req, res, next) => {
    const { shippingInfo, orderItems, user, subtotal, tax, shippingCharges, discount, total, } = req.body;
    if (!shippingInfo || !orderItems || !user) {
        return next(new ErrorHandler("Please fill all fields", 400));
    }
    await reduceStock(orderItems);
    // create new order
    await Order.create({
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
        product: true,
        order: true,
        admin: true,
        userId: user,
        productId: orderItems.map((item) => item.productId),
    });
    return res.status(201).json({
        success: true,
        message: "Order placed successfully",
    });
});
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
        product: false,
        order: true,
        admin: true,
        userId: order.user,
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
        return next(new ErrorHandler("You are not authorized to cancel this order", 401));
    }
    if (order.status === "Delivered" || order.status === "Cancelled") {
        return next(new ErrorHandler("You cannot cancel this order", 400));
    }
    order.status = "Cancelled";
    await order.save();
    invalidateCache({
        product: true,
        order: true,
        admin: true,
        userId: order.user,
        orderId: String(order._id),
        productId: order.orderItems.map((item) => item.productId.toString()),
    });
    for (let i = 0; i < order.orderItems.length; i++) {
        const item = order.orderItems[i];
        const product = await Product.findById(item.productId);
        if (!product) {
            return next(new ErrorHandler("Product not found", 404));
        }
        product.stock = product.stock + item.quantity;
        await product.save();
    }
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
    if (order.status === "Shipped") {
        return next(new ErrorHandler("You cannot delete this order", 400));
    }
    await order.deleteOne();
    invalidateCache({
        product: false,
        order: true,
        admin: true,
        userId: order.user,
        orderId: String(order._id),
    });
    return res.status(200).json({
        success: true,
        message: "Order Deleted Successfully",
    });
});
