import mongoose from "mongoose";
import { myCache } from "../app.js";
import { Product } from "../models/product.js";
import { InvalidateCacheProps, orderItemType } from "../types/types.js";
import ErrorHandler from "./utility-class.js";

export const connectDB = (uri: string) => {
  mongoose
    .connect(uri, {
      dbName: process.env.MONGO_DB,
    })
    .then((c) => {
      console.log(`DB Connected to ${c.connection.name}`);
    })
    .catch((err) => {
      console.log(`DB Connection Error: ${err.message}`);
    });
};

export const invalidateCache = async ({
  product,
  order,
  admin,
  userId,
  orderId,
  productId,
}: InvalidateCacheProps) => {
  if (product) {
    const productKeys: string[] = [
      "latest-products",
      "categories",
      "all-products",
    ];

    if (typeof productId === "string") {
      productKeys.push(`product-${productId}`);
    }
    if (
      Array.isArray(productId) &&
      productId !== null &&
      productId.length > 0
    ) {
      productId.forEach((id) => {
        productKeys.push(`product-${id}`);
      });
    }

    myCache.del(productKeys);
  }
  if (order) {
    const orderKeys: string[] = [
      "all-orders",
      `my-orders-${userId}`,
      `order-${orderId}`,
    ];
    myCache.del(orderKeys);
  }
  if (admin) {
  }
};

export const reduceStock = async (orderItems: orderItemType[]) => {
  for (let i = 0; i < orderItems.length; i++) {
    const order = orderItems[i];
    const product = await Product.findById(order.productId);
    if (!product) {
      throw new ErrorHandler("Product not found", 404);
    }
    if (product.stock < order.quantity) {
      throw new ErrorHandler(`${product.name} is out of stock`, 400);
    }
    product.stock = product.stock - order.quantity;
    await product.save();
  }
};
