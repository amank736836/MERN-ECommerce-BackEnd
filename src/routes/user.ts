import express from "express";
import {
  deleteUser,
  getAllUsers,
  getUserById,
  newUser,
  updateUser,
} from "../controllers/user.js";
import { adminOnly } from "../middlewares/auth.js";

const app = express.Router();

// Create New User - /api/v1/user/new
app.post("/new", newUser);

// Get All Users - /api/v1/user/all
app.get("/all", adminOnly, getAllUsers);

// Get and Delete User - /api/v1/user/:id
app
  .route("/:id")
  .get(getUserById)
  .delete(adminOnly, deleteUser)
  .patch(adminOnly, updateUser);

export default app;
