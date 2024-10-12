import mongoose from "mongoose";
export const connectDB = () => {
    console.log(process.env.MONGO_URI);
    mongoose
        .connect(process.env.MONGO_URI, {
        dbName: process.env.DB_NAME,
    })
        .then((c) => {
        console.log(`DB Connected to ${c.connection.name}`);
    })
        .catch((err) => {
        console.log(`DB Connection Error: ${err.message}`);
    });
};
