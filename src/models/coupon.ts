import mongoose from "mongoose";

const schema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, "Please enter a coupon code"],
    unique: [true, "Coupon code must be unique"],
  },
  amount: {
    type: Number,
    required: [true, "Please enter a discount amount"],
  },
  size: {
    type: Number,
    default: 8,
    minimum: [8, "Coupon code must be at least 8 characters long"],
    maximum: [25, "Coupon code must be at most 25 characters long"],
  },
  prefix: {
    type: String,
    default: "",
  },
  postfix: {
    type: String,
    default: "",
  },
  includeNumbers: {
    type: Boolean,
    default: false,
  },
  includeCharacters: {
    type: Boolean,
    default: false,
  },
  includeSymbols: {
    type: Boolean,
    default: false,
  },
});

export const Coupon = mongoose.model("Coupon", schema);
