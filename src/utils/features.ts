import mongoose from "mongoose";
import { InvalidateCacheProps } from "../types/types.js";
import { myCache } from "../app.js";
import { Product } from "../models/product.js";

export const connectDB = () => {
  mongoose
    .connect(
      "mongodb+srv://aman:4n1i43zhssTGimyD@e-commerce.z9v1cge.mongodb.net/",
      {
        dbName: "Ecommerce_24",
      }
    )
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
}: InvalidateCacheProps) => {
  if (product) {
    const productKeys: string[] = [
      "latest-products",
      "categories",
      "all-products",
    ];
    // myCache.keys().forEach((key) => {
    //   productKeys.push(key);
    // });
    const products = await Product.find({}).select("_id");

    products.forEach((product) => {
      productKeys.push(`product-${product._id}`);
    });

    myCache.del(productKeys);
  }
  if (order) {
  }
  if (admin) {
  }
};
