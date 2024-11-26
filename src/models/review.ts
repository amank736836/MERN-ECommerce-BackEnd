import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    comment: {
      type: String,
      maxLength: [750, "Comment can not be more than 750 characters"],
    },
    rating: {
      type: Number,
      required: [true, "Please enter product rating"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating must can not be more than 5"],
    },
    user: {
      type: String,
      ref: "User",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Review = mongoose.model("Review", schema);
