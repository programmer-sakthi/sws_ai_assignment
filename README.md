# SWS AI Assignment — Document Upload & Management App

A full-stack web application that enables users to securely register, authenticate, and manage PDF documents. Files are stored in the cloud via Cloudinary, with real-time upload progress and in-app notifications powered by Server-Sent Events (SSE).

---

## Deplyment URLS 

- **Frontend:** [https://sws-ai-assignment.vercel.app](https://sws-ai-assignment-git-master-sakthis-projects-at-vercel.vercel.app/)
- **Backend:** [https://sws-ai-assignment.onrender.com](https://swsaiassignment-production.up.railway.app)


## 🗂️ Project Structure

```
sws_ai_assignment/
├── backend/         # Node.js + Express REST API
└── frontend/        # React (Vite) single-page application
```

---

## ✨ Features

- **User Authentication** — Register and log in with JWT-based auth (passwords hashed with bcrypt)
- **PDF Upload** — Upload single or multiple PDF files with real-time progress tracking
- **Cloud Storage** — Documents stored and served via Cloudinary
- **Document Management** — View and manage your uploaded documents
- **Real-Time Notifications** — Server-Sent Events (SSE) push upload and batch-complete notifications instantly to the UI
- **Secure API** — All document routes protected by JWT middleware

---

## 🛠️ Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Frontend  | React 19, Vite, CSS                             |
| Backend   | Node.js, Express 5                              |
| Database  | MySQL (via `mysql2`)                            |
| Storage   | Cloudinary                                      |
| Auth      | JWT (`jsonwebtoken`), bcrypt                    |
| Upload    | Multer + `multer-storage-cloudinary`            |
| Real-time | Server-Sent Events (SSE)                        |

---

## 📋 Prerequisites

- **Node.js** v18+
- **MySQL** database
- **Cloudinary** account (free tier works)

---

## ⚙️ Setup & Installation

### 1. Clone the repository

```bash
git clone https://github.com/programmer-sakthi/sws_ai_assignment.git
cd sws_ai_assignment
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASS=your_mysql_password
DB_NAME=your_database_name

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

JWT_SECRET=your_jwt_secret_key
```

Start the backend server:

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The API will run on **http://localhost:3000**.

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at **http://localhost:5173** (Vite default).

---

## 🗄️ Database Schema

The backend auto-initialises the following tables on startup:

| Table           | Description                                           |
|-----------------|-------------------------------------------------------|
| `users`         | Stores registered users with hashed passwords         |
| `files`         | Stores uploaded document metadata (URL, size, etc.)   |
| `notifications` | Stores per-user notification messages and read status |

---

## 📡 API Endpoints

| Method | Endpoint                       | Auth Required | Description                          |
|--------|--------------------------------|:-------------:|--------------------------------------|
| POST   | `/register`                    | ❌            | Register a new user                  |
| POST   | `/login`                       | ❌            | Log in and receive a JWT             |
| GET    | `/files`                       | ✅            | List all files for the current user  |
| POST   | `/upload`                      | ✅            | Upload a single PDF                  |
| POST   | `/uploads/batch-complete`      | ✅            | Mark a batch upload as complete      |
| GET    | `/notifications`               | ✅            | Fetch all notifications              |
| PUT    | `/notifications/read-all`      | ✅            | Mark all notifications as read       |
| PUT    | `/notifications/:id/read`      | ✅            | Mark a single notification as read   |
| GET    | `/events`                      | ✅            | SSE stream for real-time events      |

---

## 🖥️ Frontend Components

- **`AuthForm`** — Login / registration form
- **`UploadZone`** — Drag-and-drop or click-to-select PDF uploader
- **`FileProgressList`** — Shows live upload progress per file
- **`DocumentList`** — Displays all uploaded documents
- **`NotificationCenter`** — Real-time notification bell and panel

---
