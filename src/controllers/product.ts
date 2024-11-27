import { NextFunction, Request, Response } from "express";
import { myCache } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Product } from "../models/product.js";
import { Review } from "../models/review.js";
import { User } from "../models/user.js";
import {
  BaseQuery,
  NewProductRequestBody,
  SearchRequestQuery,
} from "../types/types.js";
import {
  deleteFromCloudinary,
  invalidateCache,
  uploadToCloudinary,
} from "../utils/features.js";
import ErrorHandler from "../utils/utility-class.js";
import { Order } from "../models/order.js";
// import { faker } from "@faker-js/faker";

// Revalidate on New, Update, Delete Product and New Order
export const getLatestProducts = TryCatch(async (req, res, next) => {
  let products;

  if (myCache.has("latest-products")) {
    products = JSON.parse(myCache.get("latest-products") as string);
  } else {
    products = await Product.find().sort({ createdAt: -1 }).limit(5);
    myCache.set("latest-products", JSON.stringify(products));
  }

  res.status(200).json({
    success: true,
    message: "Latest products",
    products,
  });
});

// Revalidate on New, Update, Delete Product and New Order
export const getAllCategories = TryCatch(async (req, res, next) => {
  let categories;

  if (myCache.has("categories")) {
    categories = JSON.parse(myCache.get("categories") as string);
  } else {
    categories = await Product.distinct("category");
    myCache.set("categories", JSON.stringify(categories));
  }

  res.status(200).json({
    success: true,
    message: "All categories",
    categories,
  });
});

// Revalidate on New, Update, Delete Product and New Order
export const getAllProducts = TryCatch(async (req, res, next) => {
  let products;

  if (myCache.has("all-products")) {
    products = JSON.parse(myCache.get("all-products") as string);
  } else {
    products = await Product.find();
    myCache.set("all-products", JSON.stringify(products));
  }

  res.status(200).json({
    success: true,
    message: "All products",
    products,
  });
});

export const getSingleProduct = TryCatch(async (req, res, next) => {
  let product;
  const { id } = req.params;

  if (myCache.has(`product-${id}`)) {
    product = JSON.parse(myCache.get(`product-${id}`) as string);
  } else {
    product = await Product.findById(id);
    if (!product) {
      return next(new ErrorHandler("Product not found", 404));
    }
    myCache.set(`product-${id}`, JSON.stringify(product));
  }

  res.status(200).json({
    success: true,
    message: "Product found",
    product,
  });
});

export const getSearchProducts = TryCatch(
  async (req: Request<{}, {}, {}, SearchRequestQuery>, res, next) => {
    const { search, sort, category, price } = req.query;

    const page = Number(req.query.page) || 1;
    const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;
    const skip = limit * (page - 1);

    const baseQuery: BaseQuery = {};

    if (search) {
      baseQuery.name = {
        $regex: search,
        $options: "i",
      };
    }
    if (price) {
      baseQuery.price = {
        $lte: Number(price),
      };
    }
    if (category) {
      baseQuery.category = category;
    }

    const productsPromise = Product.find({ ...baseQuery })
      .sort(sort ? { price: sort === "asc" ? 1 : -1 } : undefined)
      .limit(limit)
      .skip(skip);

    const [products, filteredOnlyProducts, filteredOnlyProductsCategories] =
      await Promise.all([
        productsPromise,
        Product.find({ ...baseQuery }),
        Product.find({ ...baseQuery }).distinct("category"),
      ]);

    const totalPage = Math.ceil(filteredOnlyProducts.length / limit);

    const minAmount = Math.min(...filteredOnlyProducts.map((p) => p.price));
    const maxAmount = Math.max(...filteredOnlyProducts.map((p) => p.price));

    res.status(200).json({
      success: true,
      message: "Filtered products",
      products,
      totalPage,
      minAmount,
      maxAmount,
      categories: filteredOnlyProductsCategories,
    });
  }
);

export const newProduct = TryCatch(
  async (
    req: Request<{}, {}, NewProductRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    const { name, price, category, stock, description } = req.body;
    const photos = req.files as Express.Multer.File[];
    if (!photos) {
      return next(new ErrorHandler("Please upload product photos", 400));
    }

    if (photos.length < 1 || photos.length > 7) {
      return next(
        new ErrorHandler("Please upload atleast 1 and atmost 7 photos", 400)
      );
    }

    if (!name || !price || !category || !stock || !description) {
      return next(new ErrorHandler("Please fill all the fields", 400));
    }

    // Upload on cloudinary
    const photosUrl = await uploadToCloudinary(photos);

    await Product.create({
      name,
      price,
      description,
      category: category.toLowerCase(),
      stock,
      photos: photosUrl,
    });

    invalidateCache({ product: true, admin: true });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
    });
  }
);

export const updateProduct = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const { name, price, category, stock, description } = req.body;
  const photos = req.files as Express.Multer.File[];

  const product = await Product.findById(id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  if (name) product.name = name;
  if (price) product.price = price;
  if (category) product.category = category;
  if (stock) product.stock = stock;
  if (description) product.description = description;

  if (photos && photos.length > 0) {
    if (photos.length > 7) {
      return next(new ErrorHandler("Please upload atmost 7 photos", 400));
    }
    const photosUrl = await uploadToCloudinary(photos);
    const public_ids = product.photos.map((photo) => photo.public_id);
    await deleteFromCloudinary(public_ids);
    product.photos = photosUrl as any;
  }

  await product.save();

  invalidateCache({ product: true, productId: id, admin: true });

  return res.status(200).json({
    success: true,
    message: "Product updated successfully",
  });
});

export const deleteProduct = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  const product = await Product.findById(id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  const public_ids = product.photos.map((photo) => photo.public_id);

  await deleteFromCloudinary(public_ids);

  await product.deleteOne();

  invalidateCache({ product: true, productId: id, admin: true });

  return res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});

export const allReviewsOfProduct = TryCatch(async (req, res, next) => {
  const productId = req.params.id;

  const { id: userId } = req.query;

  const order = await Order.find({
    user: userId,
    orderItems: { $elemMatch: { productId: productId } },
  });

  const reviews = await Review.find({ product: productId })
    .populate({ path: "user", select: "name photo" })
    .sort({ updatedAt: -1 })
    .sort({ createdAt: -1 });

  return res.status(201).json({
    success: true,
    message: "All reviews fetched successfully",
    reviews,
    reviewButton: order.length > 0 ? false : true,
  });
});

export const newReview = TryCatch(async (req, res, next) => {
  const user = await User.findById(req.query.id);
  if (!user) {
    return next(new ErrorHandler("Please login to review the product", 401));
  }

  const productId = req.params.id;
  const product = await Product.findById(productId);
  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  const { rating, comment } = req.body;
  if (!rating || !comment) {
    return next(new ErrorHandler("Please fill all the fields", 400));
  }
  if (rating < 1 || rating > 5) {
    return next(new ErrorHandler("Rating must be between 1 and 5", 400));
  }

  let review = await Review.findOne({
    user: user._id,
    product: product._id,
  });

  if (review) {
    product.ratings = product.ratings - review.rating + rating;
    product.averageRating = Math.floor(product.ratings / product.numOfReviews);
    review.rating = rating;
    review.comment = comment;
    await review.save();
  } else {
    review = await Review.create({
      user: user._id,
      product: product._id,
      rating,
      comment,
    });
    product.ratings = product.ratings + rating;
    product.numOfReviews = product.numOfReviews + 1;
    product.averageRating = Math.floor(product.ratings / product.numOfReviews);
  }

  await product.save();

  invalidateCache({ product: true, productId: productId, admin: true });

  return res.status(201).json({
    success: true,
    message: "Review posted successfully",
  });
});

export const deleteReview = TryCatch(async (req, res, next) => {
  const user = req.query.id;
  const isAuthentic = await User.findById(user);

  if (!isAuthentic) {
    return next(new ErrorHandler("Please login to delete the review", 401));
  }

  const productId = req.params.id;

  const product = await Product.findById(productId);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  const review = await Review.findOne({
    user: isAuthentic._id,
    product: product._id,
  });

  if (!review) {
    return next(new ErrorHandler("Review not found", 404));
  }

  if (
    isAuthentic &&
    isAuthentic.role !== "admin" &&
    review.user.toString() !== user
  ) {
    return next(
      new ErrorHandler("You are not authorised to delete this review", 401)
    );
  }

  await review.deleteOne();

  // await setRatingInProduct(productId);

  product.ratings = product.ratings - review.rating;
  product.numOfReviews = product.numOfReviews - 1;
  if (product.numOfReviews === 0) {
    product.averageRating = 0;
    product.ratings = 0;
  } else {
    product.averageRating = Math.floor(product.ratings / product.numOfReviews);
  }

  await product.save();

  invalidateCache({ product: true, productId: productId, admin: true });

  return res.status(200).json({
    success: true,
    message: "Review deleted successfully",
  });
});

// const generateRandomProducts = async (count: number = 10) => {
//   const products = [];
//   for (let i = 0; i < count; i++) {
//     products.push({
//       name: faker.commerce.productName(),
//       photo: "uploads\\841a2efd-2831-445b-8ca7-4bb21ff873ec.jpg",
//       price: faker.commerce.price({
//         min: 1500,
//         max: 80000,
//         dec: 0,
//       }),
//       stock: faker.commerce.price({
//         min: 1,
//         max: 100,
//         dec: 0,
//       }),
//       category: faker.commerce.department(),
//       createdAt: new Date(faker.date.past()),
//       updatedAt: new Date(faker.date.recent()),
//       __v: 0,
//     });
//   }
//   await Product.create(products);
//   console.log({
//     success: true,
//     message: "Random products created successfully",
//   });
// };

// generateRandomProducts(40);

// const deleteRandomProducts = async (count: number = 10) => {
//   const products = await Product.find().skip(1);

//   for (let i = 0; i < count; i++) {
//     await products[i].deleteOne();
//   }

//   console.log({
//     success: true,
//     message: "Random products deleted successfully",
//   });
// };

// deleteRandomProducts(39);
