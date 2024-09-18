import express from "express";
import {
  cancelOrder,
  deleteOrder,
  getAllOrders,
  getSingleOrder,
  myOrders,
  newOrder,
  processOrder
} from "../controllers/order.js";
import { adminOnly } from "../middlewares/auth.js";

const app = express.Router();

// Create New Order - /api/v1/order/new
app.post("/new", newOrder);

// Get Logged in User Orders - /api/v1/orders/my
app.get("/my", myOrders);

// Get All Orders - /api/v1/orders
app.get("/all", adminOnly, getAllOrders);

// Get Single Order - /api/v1/order/:id
app
  .route("/:id")
  .get(getSingleOrder)
  .put(adminOnly, processOrder)
  .delete(adminOnly, deleteOrder)
  .post(cancelOrder);

export default app;
