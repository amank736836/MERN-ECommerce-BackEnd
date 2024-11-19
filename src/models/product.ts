import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter product name"],
    },
    photos: [
      {
        public_id: {
          type: String,
          required: [true, "Please upload product photo"],
        },
        url: {
          type: String,
          required: [true, "Please upload product url"],
        },
      },
    ],
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
