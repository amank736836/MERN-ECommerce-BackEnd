import { NextFunction, Request, Response } from "express";
import { TryCatch } from "../middlewares/error.js";
import { NewProductRequestBody } from "../types/types.js";
import ErrorHandler from "../utils/utility-class.js";
import { Product } from "../models/product.js";
import { rm } from "fs";

export const newProduct = TryCatch(
  async (
    req: Request<{}, {}, NewProductRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    const { name, price, category, stock } = req.body;
    const photo = req.file;
    if (!photo) {
      return next(new ErrorHandler("Please upload product photo", 400));
    }

    if (!name || !price || !category || !stock) {
      rm(photo.path, (err) => {
        console.log("Deleted file", err);
      });

      return next(new ErrorHandler("Please fill all the fields", 400));
    }

    await Product.create({
      name,
      price,
      category: category.toLowerCase(),
      stock,
      photo: photo?.path,
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
    });
  }
);

export const getLatestProducts = TryCatch(async (req, res, next) => {
  const products = await Product.find().sort({ createdAt: -1 }).limit(5);

  return res.status(200).json({
    success: true,
    message: "Latest products",
    products,
  });
});

export const getAllCategories = TryCatch(async (req, res, next) => {
  const categories = await Product.distinct("category");

  return res.status(200).json({
    success: true,
    message: "All categories",
    categories,
  });
});

export const getAdminProducts = TryCatch(async (req, res, next) => {
  const products = await Product.find();

  return res.status(200).json({
    success: true,
    message: "All products",
    products,
  });
});

export const getSingleProduct = TryCatch(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  return res.status(200).json({
    success: true,
    message: "Product found",
    product,
  });
});

export const updateProduct = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const { name, price, category, stock } = req.body;
  const photo = req.file;

  const product = await Product.findById(id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  if (photo) {
    rm(product.photo, (err) => {
      console.log("Old Photo Deleted", err);
    });
  }
  if (name) product.name = name;
  if (price) product.price = price;
  if (category) product.category = category;
  if (stock) product.stock = stock;
  if (photo) product.photo = photo.path;

  await product.save();

  return res.status(200).json({
    success: true,
    message: "Product updated successfully",
  });
});

export const deleteProduct = TryCatch(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  rm(product.photo, (err) => {
    console.log("Product photo Deleted", err);
  });

  await product.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});
