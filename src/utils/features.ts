import mongoose from "mongoose";

export const connectDB = () => {
  mongoose
    .connect("mongodb+srv://aman:4n1i43zhssTGimyD@e-commerce.z9v1cge.mongodb.net/", {
      dbName: "Ecommerce_24",
    })
    .then((c) => {
      console.log(`DB Connected to ${c.connection.name}`);
    })
    .catch((err) => {
      console.log(`DB Connection Error: ${err.message}`);
    });
};