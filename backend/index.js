require("dotenv").config();

const express = require("express");
const multer = require("multer");
const cors = require("cors");

const { v2: cloudinary } = require("cloudinary");

const { CloudinaryStorage } = require("multer-storage-cloudinary");

const app = express();

app.use(cors());
app.use(express.json());

/*
 CLOUDINARY CONFIG
*/
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/*
 STORAGE CONFIG
*/
const storage = new CloudinaryStorage({
  cloudinary,

  params: async (req, file) => ({
    folder: "documents",

    resource_type: "raw",

    public_id: Date.now() + "-" + file.originalname.split(".")[0],
  }),
});

/*
 FILE FILTER
*/
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDFs allowed"), false);
  }
};

/*
 MULTER
*/
const upload = multer({
  storage,
  fileFilter,
});

/*
 SINGLE FILE UPLOAD
*/
app.post("/upload", upload.single("document"), (req, res) => {
  res.json({
    message: "Upload successful",

    file: {
      originalName: req.file.originalname,

      url: req.file.path,

      public_id: req.file.filename,
    },
  });
});

/*
 MULTIPLE FILE UPLOAD
*/
app.post("/upload-multiple", upload.array("documents", 10), (req, res) => {
  const files = req.files.map((file) => ({
    originalName: file.originalname,

    url: file.path,

    public_id: file.filename,
  }));

  res.json({
    message: "Files uploaded",

    files,
  });
});

app.listen(3000, () => {
  console.log("Server running on 3000");
});
