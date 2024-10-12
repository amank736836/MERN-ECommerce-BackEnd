import mongoose from "mongoose";
const schema = new mongoose.Schema({
    shippingInfo: {
        address: {
            type: String,
            required: true,
        },
        city: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        country: {
            type: String,
            required: true,
        },
        pinCode: {
            type: String,
            required: true,
        },
    },
    user: {
        type: String,
        ref: "User",
        required: true,
    },
    subtotal: {
        type: Number,
        required: true,
    },
    tax: {
        type: Number,
        required: true,
    },
    shippingCharges: {
        type: Number,
        required: true,
        default: 0,
    },
    discount: {
        type: Number,
        required: true,
    },
    total: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ["Processing", "Shipped", "Delivered", "Cancelled"],
        default: "Processing",
    },
    orderItems: [
        {
            name: {
                type: String,
                required: true,
            },
            photo: {
                type: String,
                required: true,
            },
            price: {
                type: Number,
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
                min: 1,
            },
            productId: {
                type: mongoose.Types.ObjectId,
                ref: "Product",
                required: true,
            },
        },
    ],
}, { timestamps: true });
export const Order = mongoose.model("Order", schema);
