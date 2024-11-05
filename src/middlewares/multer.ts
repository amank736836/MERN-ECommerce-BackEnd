import fs from "fs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuid } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join("./uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir); // Use the folder path
  },
  filename: (req, file, cb) => {
    const id = uuid();
    const extName = file.originalname.split(".").pop();
    const fileName = `${id}.${extName}`;
    cb(null, fileName);
  },
});

export const singleUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  // fileFilter: (req, file, cb) => {
  //   const ext = path.extname(file.originalname);
  //   if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png") {
  //     return cb(new ErrorHandler("Only images are allowed", 400));
  //   }
  //   cb(null, true);
  // },
}).single("photo");
