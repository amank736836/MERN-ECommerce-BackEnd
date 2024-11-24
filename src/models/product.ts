import mongoose from "mongoose";

export const photosSchema = new mongoose.Schema({
  public_id: {
    type: String,
    required: [true, "Please upload product photo"],
  },
  url: {
    type: String,
    required: [true, "Please upload product url"],
  },
});

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter product name"],
    },
    photos: [photosSchema],
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
    description: {
      type: String,
      required: [true, "Please enter product description"],
    },
    ratings: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    review: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
    },
    numOfReviews: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Product = mongoose.model("Product", schema);
