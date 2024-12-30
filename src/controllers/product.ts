import { NextFunction, Request, Response } from "express";
import { redis } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Order } from "../models/order.js";
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
// import { faker } from "@faker-js/faker";

// Revalidate on New, Update, Delete Product and New Order
export const getLatestProducts = TryCatch(async (req, res, next) => {
  const key = "latest-products";

  let products;

  const cachedData = await redis.get(key);

  if (cachedData) {
    products = JSON.parse(cachedData);
  } else {
    products = await Product.find().sort({ createdAt: -1 }).limit(5);
    await redis.set(key, JSON.stringify(products));
  }

  res.status(200).json({
    success: true,
    message: "Latest products",
    products,
  });
});

// Revalidate on New, Update, Delete Product and New Order
export const getAllCategories = TryCatch(async (req, res, next) => {
  const key = "categories";

  let categories;

  const cachedData = await redis.get(key);

  if (cachedData) {
    categories = JSON.parse(cachedData);
  } else {
    categories = await Product.distinct("category");
    await redis.set("categories", JSON.stringify(categories));
  }

  res.status(200).json({
    success: true,
    message: "All categories",
    categories,
  });
});

// Revalidate on New, Update, Delete Product and New Order
export const getAllProducts = TryCatch(async (req, res, next) => {
  const key = "all-products";

  let products;

  const cachedData = await redis.get(key);

  if (cachedData) {
    products = JSON.parse(cachedData);
  } else {
    products = await Product.find();
    await redis.set("all-products", JSON.stringify(products));
  }

  res.status(200).json({
    success: true,
    message: "All products",
    products,
  });
});

export const getSingleProduct = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(new ErrorHandler("Please enter a product id", 400));
  }

  const key = `product-${id}`;

  let product;

  const cachedData = await redis.get(key);

  if (cachedData) {
    product = JSON.parse(cachedData);
  } else {
    product = await Product.findById(id);
    if (!product) {
      return next(new ErrorHandler("Product not found", 404));
    }
    await redis.set(`product-${id}`, JSON.stringify(product));
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

    const key = `search-${search}-${sort}-${category}-${price}-${page}`;

    let products;
    let totalPage;
    let minAmount;
    let maxAmount;
    let categories;

    const cachedData = await redis.get(key);

    if (cachedData) {
      const {
        products: dataProducts,
        totalPage: dataTotalPage,
        minAmount: dataMinAmount,
        maxAmount: dataMaxAmount,
        categories: dataCategories,
      } = JSON.parse(cachedData);
      products = dataProducts;
      totalPage = dataTotalPage;
      minAmount = dataMinAmount;
      maxAmount = dataMaxAmount;
      categories = dataCategories;
    } else {
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

      const [productsData, filteredOnlyProducts, categoriesData] =
        await Promise.all([
          productsPromise,
          Product.find({ ...baseQuery }),
          Product.find({ ...baseQuery }).distinct("category"),
        ]);

      products = productsData;
      categories = categoriesData;
      totalPage = Math.ceil(filteredOnlyProducts.length / limit);
      minAmount = Math.min(...filteredOnlyProducts.map((p) => p.price));
      maxAmount = Math.max(...filteredOnlyProducts.map((p) => p.price));

      await redis.setex(
        key,
        3600,
        JSON.stringify({
          products,
          totalPage,
          minAmount,
          maxAmount,
          categories,
        })
      );
    }

    res.status(200).json({
      success: true,
      message: "Filtered products",
      products,
      totalPage,
      minAmount,
      maxAmount,
      categories,
    });
  }
);

export const allReviewsOfProduct = TryCatch(async (req, res, next) => {
  const productId = req.params.id;
  const { id: userId } = req.query;

  const key = `reviews-${productId}`;

  let reviews;
  let reviewButton;

  const cachedData = await redis.get(key);

  if (cachedData) {
    const { reviews: dataReviews, reviewButton: dataReviewButton } =
      JSON.parse(cachedData);
    reviews = dataReviews;
    reviewButton = dataReviewButton;
  } else {
    reviews = await Review.find({ product: productId })
      .populate({ path: "user", select: "name photo" })
      .sort({ updatedAt: -1 })
      .sort({ createdAt: -1 });
    const order = await Order.find({
      user: userId,
      orderItems: { $elemMatch: { productId: productId } },
      status: "Delivered",
    });
    reviewButton = order.length > 0 ? true : false;
    await redis.set(key, JSON.stringify({ reviews, reviewButton }));
  }

  return res.status(201).json({
    success: true,
    message: "All reviews fetched successfully",
    reviews,
    reviewButton,
  });
});

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

    invalidateCache({
      admin: true,
      product: true,
    });

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

  invalidateCache({
    admin: true,
    product: true,
    productId: id,
  });

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

  invalidateCache({
    admin: true,
    review: true,
    product: true,
    productId: id,
  });

  return res.status(200).json({
    success: true,
    message: "Product deleted successfully",
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

  if (!rating) {
    return next(new ErrorHandler("Please provide a rating", 400));
  }

  if (!comment) {
    return next(new ErrorHandler("Please provide a comment", 400));
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

  invalidateCache({
    admin: true,
    review: true,
    product: true,
    productId: productId,
  });

  return res.status(201).json({
    success: true,
    message: "Review posted successfully",
  });
});

export const deleteReview = TryCatch(async (req, res, next) => {
  const userId = req.query.id;
  const isAuthentic = await User.findById(userId);

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
    review.user.toString() !== userId
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

  invalidateCache({
    admin: true,
    review: true,
    product: true,
    productId: productId,
  });

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
