import multer from "multer";
import path from "path";
import ErrorHandler from "../utils/utility-class.js";

export const singleUpload = multer({
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (
      ext !== ".jpg" &&
      ext !== ".jpeg" &&
      ext !== ".png" &&
      ext !== ".JPG" &&
      ext !== ".JPEG" &&
      ext !== ".PNG" &&
      ext !== ".webp" &&
      ext !== ".WEBP" &&
      ext !== ".svg" &&
      ext !== ".SVG"
    ) {
      return cb(new ErrorHandler("Only images are allowed", 400));
    }
    cb(null, true);
  },
}).single("photo");

export const multiUpload = (count: number = 5) =>
  multer({
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter(req, file, callback) {
      const ext = path.extname(file.originalname);
      if (
        ext !== ".jpg" &&
        ext !== ".jpeg" &&
        ext !== ".png" &&
        ext !== ".JPG" &&
        ext !== ".JPEG" &&
        ext !== ".PNG" &&
        ext !== ".webp" &&
        ext !== ".WEBP" &&
        ext !== ".svg" &&
        ext !== ".SVG"
      ) {
        return callback(new ErrorHandler("Only images are allowed", 400));
      }
      callback(null, true);
    },
  }).array("photos", count);
