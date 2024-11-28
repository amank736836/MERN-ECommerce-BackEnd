import { NextFunction, Request, Response } from "express";
import { redis } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { User } from "../models/user.js";
import { NewUserRequestBody } from "../types/types.js";
import { invalidateCache } from "../utils/features.js";
import ErrorHandler from "../utils/utility-class.js";

export const getAllUsers = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    let key = `all-users`;

    let users = [];

    const cachedData = await redis.get(key);

    if (cachedData) {
      users = JSON.parse(cachedData);
    } else {
      users = await User.find();
      await redis.set(key, JSON.stringify(users));
    }

    return res.status(200).json({
      success: true,
      message: "All users",
      users,
    });
  }
);

export const getUserById = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    let id = req.params.id;

    if (!id) {
      return next(new ErrorHandler("Please enter a user id", 400));
    }

    let key = `user-${id}`;

    let user;

    const cachedData = await redis.get(key);

    if (cachedData) {
      user = JSON.parse(cachedData);
    } else {
      user = await User.findById(id);
      if (!user) {
        return next(new ErrorHandler("User not found", 400));
      }
      await redis.set(key, JSON.stringify(user));
    }

    return res.status(200).json({
      success: true,
      message: "User found successfully",
      user,
    });
  }
);

export const newUser = TryCatch(
  async (
    req: Request<{}, {}, NewUserRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    const { name, email, photo, gender, _id, dob } = req.body;

    let user = await User.findById(_id);

    if (user) {
      return res.status(201).json({
        success: true,
        message: `Welcome, ${user.name}`,
      });
    }

    if (!_id || !name || !email || !photo || !gender || !dob) {
      return next(new ErrorHandler("Please fill all the fields", 400));
    }

    user = await User.create({
      name,
      email,
      photo,
      gender,
      _id,
      dob,
    });

    invalidateCache({
      user: true,
      admin: true,
    });

    return res.status(201).json({
      success: true,
      message: `Welcome, ${user.name}`,
    });
  }
);

export const deleteUser = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new ErrorHandler("User not found", 400));
    }

    await user.deleteOne();

    invalidateCache({
      admin: true,
      user: true,
      userId: req.params.id,
    });

    return res.status(200).json({
      success: true,
      message: "User Deleted Successfully",
    });
  }
);
