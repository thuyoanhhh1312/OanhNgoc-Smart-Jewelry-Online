// src/routes/upload.routes.js
import express from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js"; // ⬅️ dùng bản đã config

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "blog-images",
    resource_type: "image",
  },
});

const upload = multer({ storage });

router.post("/uploads/blog-image", upload.single("upload"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  return res.status(201).json({
    url: req.file.path, // CKEditor simpleUpload cần field "url"
  });
});

export default router;
