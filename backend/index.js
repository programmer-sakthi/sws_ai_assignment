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

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDFs allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
});

/*
 JWT MIDDLEWARE
*/
const authenticateToken = (req, res, next) => {
  let token;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token) {
    // Fallback for SSE EventSource which doesn't support custom headers easily
    token = req.query.token;
  }

  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

/*
 SSE CLIENTS
*/
let sseClients = {};

const sendSSEEvent = (userId, data) => {
  if (sseClients[userId]) {
    sseClients[userId].forEach(res => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    });
  }
};

/*
 SSE ENDPOINT
*/
app.get("/events", authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  if (!sseClients[userId]) {
    sseClients[userId] = [];
  }
  sseClients[userId].push(res);

  req.on('close', () => {
    sseClients[userId] = sseClients[userId].filter(client => client !== res);
  });
});

/*
 AUTHENTICATION ROUTES
*/
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: "Username and password required" });

    const [existingUsers] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (existingUsers.length > 0) return res.status(409).json({ message: "Username already taken" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);

    const token = jwt.sign({ id: result.insertId, username }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ message: "User registered successfully", token, username });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: "Username and password required" });

    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length === 0) return res.status(401).json({ message: "Invalid credentials" });

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ message: "Login successful", token, username: user.username });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/*
 FILE API
*/
app.get("/files", authenticateToken, async (req, res) => {
  try {
    const [files] = await pool.query('SELECT * FROM files WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(files);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch files" });
  }
});

app.post("/upload", authenticateToken, upload.single("document"), async (req, res) => {
  try {
    const userId = req.user.id;
    const { originalname, path: url, filename: public_id, size } = req.file;

    const [result] = await pool.query(
      'INSERT INTO files (user_id, original_name, url, public_id, size) VALUES (?, ?, ?, ?, ?)',
      [userId, originalname, url, public_id, size]
    );

    res.json({
      message: "Upload successful",
      file: { id: result.insertId, name: originalname, url, public_id, size, uploadDate: new Date() }
    });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ message: "Failed to process upload" });
  }
});

app.post("/uploads/batch-complete", authenticateToken, async (req, res) => {
  try {
    const { count } = req.body;
    const userId = req.user.id;
    const message = `${count} files uploaded successfully`;
    
    // Save notification
    const [result] = await pool.query(
      'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
      [userId, message, 'success']
    );

    const notification = {
      id: result.insertId,
      message,
      type: 'success',
      is_read: 0,
      created_at: new Date()
    };

    // Broadcast SSE
    sendSSEEvent(userId, { type: 'NOTIFICATION', payload: notification });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/*
 NOTIFICATIONS API
*/
app.get("/notifications", authenticateToken, async (req, res) => {
  try {
    const [notifications] = await pool.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

app.put("/notifications/read-all", authenticateToken, async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [req.user.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Failed to update notifications" });
  }
});

app.put("/notifications/:id/read", authenticateToken, async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Failed to update notification" });
  }
});

app.listen(3000, () => {
  console.log("Server running on 3000");
});
