import { TryCatch } from "../middlewares/error.js";

const notFound = TryCatch(async (req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Resource not found",
  });
});

export default notFound;