import express from "express";
import NodeCache from "node-cache";
import { errorMiddleware } from "./middlewares/error.js";
import orderRoutes from "./routes/order.js";
import productRoutes from "./routes/product.js";
import userRoutes from "./routes/user.js";
import paymentRoutes from "./routes/payment.js";
import dashboardRoute from "./routes/stats.js";
import { connectDB } from "./utils/features.js";
import { config } from "dotenv";
import morgan from "morgan";

config({
  path: "./.env",
});

const port = process.env.PORT || 3000;

connectDB(process.env.MONGO_URI as string);

export const myCache = new NodeCache();

const app = express();
app.use(express.json());
app.use(morgan("dev"));

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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
