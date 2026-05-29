require("dotenv").config();

const express = require("express");
const multer = require("multer");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { pool, initDB } = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

/*
 INITIALIZE DB
*/
initDB();

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
 JWT MIDDLEWARE
*/
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

/*
 AUTHENTICATION ROUTES
*/
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    // Check if user exists
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ message: "Username already taken" });
    }

    // Hash password and insert
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);

    // Generate token
    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '2h' });

    res.status(201).json({ message: "User registered successfully", token, username });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: '2h' });

    res.json({ message: "Login successful", token, username: user.username });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/*
 SINGLE FILE UPLOAD
*/
app.post("/upload", authenticateToken, upload.single("document"), (req, res) => {
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
app.post("/upload-multiple", authenticateToken, upload.array("documents", 10), (req, res) => {
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
