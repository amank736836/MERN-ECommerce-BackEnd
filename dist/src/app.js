import express from "express";
import userRoutes from "./routes/user.js";
import dotenv from "dotenv";
import { connectDB } from "./utils/features.js";
dotenv.config({
    path: "../config.env",
});
const port = 4000;
connectDB();
const app = express();
app.get("/", (req, res) => {
    res.send("API is running....");
});
// USing Routes
app.use("/api/v1/user", userRoutes);
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
