// Importing Dependencies
import { v2 as cloudinary } from "cloudinary";
import cors from "cors";
import { config } from "dotenv";
import express from "express";
import morgan from "morgan";

// Importing Middlewares

// Importing Utils
import { connectDB, connectRedis } from "./utils/features.js";
import ErrorHandler from "./utils/utility-class.js";

// Importing Routes
import NotFound from "./routes/notFound.js";
import orderRoutes from "./routes/order.js";
import paymentRoutes from "./routes/payment.js";
import productRoutes from "./routes/product.js";
import dashboardRoute from "./routes/stats.js";
import userRoutes from "./routes/user.js";

// Importing Payment Gateways
import Razorpay from "razorpay";
import { errorMiddleware } from "./middlewares/error.js";

config({
  path: "./.env",
});

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

const port = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "";
const REDIS_URI = process.env.REDIS_URI || "";

connectDB(MONGO_URI);
export const redis = connectRedis(REDIS_URI);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();

app.use(express.json());
app.use(morgan("dev"));

const allowedOrigins = [
  process.env.FRONTEND_URL_1,
  process.env.FRONTEND_URL_2,
  process.env.FRONTEND_URL_3,
  process.env.FRONTEND_URL_4,
  process.env.FRONTEND_URL_5,
  process.env.FRONTEND_URL_6,
  process.env.FRONTEND_URL_7,
  process.env.FRONTEND_URL_8,
  process.env.FRONTEND_URL_9,
];

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

// Using Routes
app.use("/api/v1/user", userRoutes);

app.use("/api/v1/product", productRoutes);

app.use("/api/v1/order", orderRoutes);

app.use("/api/v1/payment", paymentRoutes);

app.use("/api/v1/dashboard", dashboardRoute);

app.use("*", NotFound);

app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
