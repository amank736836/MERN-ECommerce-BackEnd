import express from "express";
import {
  deleteUser,
  getAllUsers,
  getUserById,
  newUser,
} from "../controllers/user.js";
import { adminOnly } from "../middlewares/auth.js";

const app = express.Router();

// Create New User - /api/v1/user/new
app.post("/new", newUser);

// Get All Users - /api/v1/user/all
app.get("/all", adminOnly, getAllUsers);

// Get User By ID - /api/v1/user/:id
// Delete User By ID - /api/v1/user/:id
app.route("/:id").get(getUserById).delete(adminOnly, deleteUser);

export default app;
