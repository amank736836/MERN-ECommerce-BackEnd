import { redis } from "../app.js";
import { User } from "../models/user.js";
import ErrorHandler from "../utils/utility-class.js";
import { TryCatch } from "./error.js";

export const adminOnly = TryCatch(async (req, res, next) => {
  const { id } = req.query;

  if (!id) {
    return next(new ErrorHandler("Please provide admin id", 401));
  }

  const key = `admin-${id}`;

  let user;

  const cachedData = await redis.get(key);

  if (cachedData) {
    user = JSON.parse(cachedData);
    if (user) {
      return next();
    }
  }

  user = await User.findById(id);

  if (!user) {
    return next(new ErrorHandler("User not found", 401));
  }

  if (user.role !== "admin") {
    return next(new ErrorHandler("You are not authorized", 403));
  }

  redis.set(key, "true", "EX", 60 * 60);

  next();
});
