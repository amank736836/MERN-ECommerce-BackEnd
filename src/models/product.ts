import mongoose from "mongoose";
import { trim } from "validator";

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter product name"],
    },
    photo: {
      type: String,
      required: [true, "Please upload product photo"],
    },
    price: {
      type: Number,
      required: [true, "Please enter product price"],
    },
    stock: {
      type: Number,
      required: [true, "Please enter product stock"],
    },
    category: {
      type: String,
      required: [true, "Please enter product category"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Product = mongoose.model("Product", schema);
