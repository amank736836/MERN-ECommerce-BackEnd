import cors from "cors";
import { config } from "dotenv";
import express from "express";
import morgan from "morgan";
import NodeCache from "node-cache";
import { errorMiddleware } from "./middlewares/error.js";
import NotFound from "./routes/notFound.js";
import orderRoutes from "./routes/order.js";
import paymentRoutes from "./routes/payment.js";
import productRoutes from "./routes/product.js";
import dashboardRoute from "./routes/stats.js";
import userRoutes from "./routes/user.js";
import { connectDB } from "./utils/features.js";

config({
  path: "./.env",
});

import Stripe from "stripe";
const stripeKey = process.env.STRIPE_KEY || "";
export const stripe = new Stripe(stripeKey);

import Razorpay from "razorpay";
import ErrorHandler from "./utils/utility-class.js";
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

const port = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "";

connectDB(MONGO_URI);

export const myCache = new NodeCache();

const app = express();
app.use(express.json());
app.use(morgan("dev"));

const allowedOrigins = ["http://localhost:5173"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new ErrorHandler(msg, 403), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.send("API is running....");
});

// USing Routes
app.use("/api/v1/user", userRoutes);

app.use("/api/v1/product", productRoutes);

app.use("/api/v1/order", orderRoutes);

app.use("/api/v1/payment", paymentRoutes);

app.use("/api/v1/dashboard", dashboardRoute);

app.use("/uploads", express.static("uploads"));
app.use(errorMiddleware);

app.use("*", NotFound);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
