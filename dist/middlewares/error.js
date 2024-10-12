import ErrorHandler from "../utils/utility-class.js";
export const errorMiddleware = (err, req, res, next) => {
    if (err.name === "CastError") {
        const message = `Resource not found. Invalid Id`;
        err = new ErrorHandler(message, 404);
    }
    return res.status(400).json({
        success: false,
        message: err.message || "Internal Server Error",
        statusCode: err.statusCode || 500,
    });
};
export const TryCatch = (func) => {
    return (req, res, next) => {
        return Promise.resolve(func(req, res, next)).catch(next);
    };
};
