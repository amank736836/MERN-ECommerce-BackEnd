import fs from "fs";
import multer from "multer";
import path from "path";
import { v4 as uuid } from "uuid";

const uploadsDir = path.join(__dirname, "uploads");
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

export const singleUpload = multer({ storage }).single("photo");
