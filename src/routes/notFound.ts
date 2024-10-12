import express from "express";
import notFound from "../controllers/notFound.js";

const app = express.Router();

app
  .route("*")
  .get(notFound)
  .post(notFound)
  .delete(notFound)
  .put(notFound)
  .patch(notFound)
  .options(notFound)
  .head(notFound);

export default app;
