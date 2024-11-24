import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import mongoose, { Document } from "mongoose";
import { myCache } from "../app.js";
import { Product } from "../models/product.js";
import { InvalidateCacheProps, orderItemType } from "../types/types.js";
import ErrorHandler from "./utility-class.js";
import { Review } from "../models/review.js";

export const setRatingInProduct = async (productId: string) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw new ErrorHandler("Product not found", 404);
  }

  const reviews = await Review.find({ product: productId });
  if (reviews.length === 0) {
    product.ratings = 0;
    product.numOfReviews = 0;
    product.averageRating = 0;
  } else {
    const total = reviews.reduce((acc, item) => item.rating + acc, 0);
    product.ratings = total;
    product.numOfReviews = reviews.length;
    product.averageRating = total / reviews.length;
  }

  await product.save();
};

const getBase64 = (file: Express.Multer.File): string =>
  `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

export const uploadToCloudinary = async (
  files: Express.Multer.File[]
): Promise<{ public_id: string; url: string }[]> => {
  try {
    const uploadPromises = files.map(async (file) => {
      const base64File = getBase64(file);
      const result: UploadApiResponse = await cloudinary.uploader.upload(
        base64File
      );
      return {
        public_id: result.public_id,
        url: result.secure_url,
      };
    });

    const uploadedFiles = await Promise.all(uploadPromises);
    return uploadedFiles;
  } catch (error) {
    throw new ErrorHandler(
      `Cloudinary upload failed: ${(error as Error).message}`,
      500
    );
  }
};

export const deleteFromCloudinary = async (publicIds: string[]) => {
  try {
    const deletePromises = publicIds.map(async (id) => {
      await cloudinary.uploader.destroy(id);
    });

    await Promise.all(deletePromises);
  } catch (error) {
    throw new ErrorHandler(
      `Cloudinary delete failed: ${(error as Error).message}`,
      500
    );
  }
};

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

export const invalidateCache = ({
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
    myCache.del([
      "admin-stats",
      "admin-pie-charts",
      "admin-bar-charts",
      "admin-line-charts",
    ]);
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

export const calculatePercentage = (thisMonth: number, lastMonth: number) => {
  if (lastMonth === 0) return thisMonth * 100;
  const percent = (thisMonth / lastMonth) * 100;
  return Number(percent.toFixed(2));
};

export const getCategoriesCount = async ({
  categories,
  productCount,
}: {
  categories: string[];
  productCount: number;
}) => {
  const categoriesCountPromise = categories.map((category) =>
    Product.countDocuments({ category })
  );

  const categoriesCount = await Promise.all(categoriesCountPromise);

  const categoryCount: Record<string, number>[] = [];
  categories.forEach((category, index) => {
    categoryCount.push({
      [category]: Math.round((categoriesCount[index] / productCount) * 100),
    });
  });

  return categoryCount;
};

export interface MyDocument extends Document {
  createdAt: Date;
  discount?: number;
  total?: number;
  status?: string;
}

type FuncProps = {
  length: number;
  docArr: MyDocument[];
  today: Date;
  property?: "discount" | "total" | "count";
};

export const getChartData = ({
  length,
  docArr,
  today,
  property = "count",
}: FuncProps) => {
  const data: number[] = new Array(length).fill(0);

  docArr.forEach((i) => {
    const creationDate = i.createdAt;
    let monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;
    if (monthDiff < length) {
      if (property == "count") {
        data[length - 1 - monthDiff]++;
      } else {
        if (i.status === "Delivered") {
          data[length - 1 - monthDiff] += i[property]!;
        }
      }
    }
  });

  return data;
};
