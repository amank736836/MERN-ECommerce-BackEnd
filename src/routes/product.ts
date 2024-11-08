import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import {
  deleteProduct,
  getAllProducts,
  getAllCategories,
  getLatestProducts,
  getSingleProduct,
  newProduct,
  updateProduct,
  getSearchProducts,
} from "../controllers/product.js";
import { singleUpload } from "../middlewares/multer.js";

const app = express.Router();

// Create New Product - /api/v1/product/new
app.post("/new", adminOnly, singleUpload, newProduct);

// Get Search Products with filters - /api/v1/product/search?keyword=apple&category=Electronics
app.get("/search", getSearchProducts);

// Get Latest Products - /api/v1/product/latest
app.get("/latest", getLatestProducts);

// Get All Categories - /api/v1/product/categories
app.get("/categories", getAllCategories);

// Get All Products - /api/v1/product/admin-products
app.get("/admin-products", adminOnly, getAllProducts);

// Get Single Product - /api/v1/product/:id
app
  .route("/:id")
  .get(getSingleProduct)
  .put(adminOnly, singleUpload, updateProduct)
  .delete(adminOnly, deleteProduct);

export default app;
