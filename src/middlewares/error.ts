import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/utility-class.js";
import { ControllerType } from "../types/types.js";

export const errorMiddleware = (
  err: ErrorHandler,
  req: Request,
  res: Response,
  next: NextFunction
) => {

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

export const TryCatch = (func: ControllerType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    return Promise.resolve(func(req, res, next)).catch(next);
  };
};
