import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/utility-class.js";
import { ControllerType } from "../types/types.js";

export const errorMiddleware = (
  err: ErrorHandler,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };

  error.message = err.message;

  if (err.name === "CastError") {
    const message = `Resource not found. Invalid Id`;
    error = new ErrorHandler(message, 404);
  }

  // Handle JWT Errors
  if (err.name === "JsonWebTokenError") {
    error = new ErrorHandler("Invalid token. Please log in again.", 401);
  }

  if (err.name === "TokenExpiredError") {
    error = new ErrorHandler("Token has expired. Please log in again.", 401);
  }

  res.status(400).json({
    success: false,
    message: err.message || "Internal Server Error",
    statusCode: err.statusCode || 500,
  });
};

export const TryCatch = (func: ControllerType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(func(req, res, next)).catch(next);
  };
};

// export const TryCatch = (func: ControllerType) => {
//   return async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       await func(req, res, next);
//     } catch (error) {
//       next(error);
//     }
//   };
// };
