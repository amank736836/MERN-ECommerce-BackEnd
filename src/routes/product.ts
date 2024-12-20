import express from "express";
import {
  allReviewsOfProduct,
  deleteProduct,
  deleteReview,
  getAllCategories,
  getAllProducts,
  getLatestProducts,
  getSearchProducts,
  getSingleProduct,
  newProduct,
  newReview,
  updateProduct,
} from "../controllers/product.js";
import { adminOnly } from "../middlewares/auth.js";
import { multiUpload } from "../middlewares/multer.js";

const app = express.Router();

// Get Search Products with filters - /api/v1/product/search?keyword=apple&category=Electronics
app.get("/search", getSearchProducts);

// Get Latest Products - /api/v1/product/latest
app.get("/latest", getLatestProducts);

// Get All Categories - /api/v1/product/categories
app.get("/categories", getAllCategories);

// Get All Products - /api/v1/product/admin-products
app.get("/admin-products", adminOnly, getAllProducts);

// Create New Product - /api/v1/product/new
app.post("/new", adminOnly, multiUpload(), newProduct);

// Get, Update, and Delete Product - /api/v1/product/:id
app
  .route("/:id")
  .get(getSingleProduct)
  .delete(adminOnly, deleteProduct)
  .put(adminOnly, multiUpload(), updateProduct);

// Get All Reviews of a Product, Create New Review, and Delete Review - /api/v1/product/review/:id
app
  .route("/review/:id")
  .get(allReviewsOfProduct)
  .post(newReview)
  .delete(deleteReview);

export default app;
