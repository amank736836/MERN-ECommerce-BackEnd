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

    if (!_id) {
      return next(new ErrorHandler("Please enter a user id", 400));
    }

    let user = await User.findById(_id);

    if (user) {
      return res.status(201).json({
        success: true,
        message: `Welcome, ${user.name}`,
      });
    }

    if (!name) {
      return next(new ErrorHandler("Please enter a name", 400));
    }

    if (!email) {
      return next(new ErrorHandler("Please enter an email", 400));
    }

    if (!photo) {
      return next(new ErrorHandler("Please enter a photo", 400));
    }

    if (!gender) {
      return next(new ErrorHandler("Please enter a gender", 400));
    }

    if (!dob) {
      return next(new ErrorHandler("Please enter a date of birth", 400));
    }

    const users = await User.find();

    user = await User.create({
      name,
      email,
      photo,
      gender,
      role: users.length === 0 ? "admin" : "user",
      _id,
      dob,
    });

    invalidateCache({
      admin: true,
      user: true,
    });

    return res.status(201).json({
      success: true,
      message: `Welcome, ${user.name}`,
    });
  }
);

export const updateUser = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new ErrorHandler("User not found", 400));
    }

    if (user.role === "admin") {
      const AllAdmins = await User.find({ role: "admin" });
      if (AllAdmins.length === 1) {
        return next(new ErrorHandler("There should be atleast one admin", 400));
      }
    }

    user.role = req.body.role;

    await user.save();

    invalidateCache({
      admin: true,
      user: true,
      userId: req.params.id,
    });

    return res.status(200).json({
      success: true,
      message: "User Updated Successfully",
    });
  }
);

export const deleteUser = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new ErrorHandler("User not found", 400));
    }

    if (user.role === "admin") {
      const AllAdmins = await User.find({ role: "admin" });
      if (AllAdmins.length === 1) {
        return next(new ErrorHandler("There should be atleast one admin", 400));
      }
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
