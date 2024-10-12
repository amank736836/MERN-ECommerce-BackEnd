import express from "express";
const app = express.Router();
app
    .route("*")
    .get((req, res) => {
    res.status(404).json({
        success: false,
        message: "Resource not found",
    });
})
    .post((req, res) => {
})
    .delete((req, res) => {
    res.status(404).json({
        success: false,
        message: "Resource not found",
    });
})
    .put((req, res) => {
    res.status(404).json({
        success: false,
        message: "Resource not found",
    });
})
    .patch((req, res) => {
    res.status(404).json({
        success: false,
        message: "Resource not found",
    });
})
    .options((req, res) => {
    res.status(404).json({
        success: false,
        message: "Resource not found",
    });
})
    .head((req, res) => {
    res.status(404).json({
        success: false,
        message: "Resource not found",
    });
});
export default app;
