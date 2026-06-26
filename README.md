# 🎓 Student Mini Project Management Portal

A full-stack task management portal built with **React + Vite + Tailwind CSS** (frontend) and **Node.js + Express** (backend), featuring automatic database fallback.

## Features

- ✅ Task CRUD (Create, Read, Update, Delete)
- 📊 Dashboard Statistics (Total, Pending, In Progress, Completed)
- 🔍 Search by Title & Description
- 🔽 Filter by Status
- 🔃 Sort by Date (Newest / Oldest)
- 🌙 Dark Mode with Local Storage persistence
- 💾 MongoDB → MySQL → PostgreSQL → In-Memory auto fallback
- 🔔 Toast notifications & Confirmation modals
- ⚡ Loading skeletons & Empty states
- 📱 Fully responsive UI

## Project Structure

```
├── backend/
│   ├── server.js        # Express API + DB logic
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx      # All UI components
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
├── .gitignore
└── README.md
```

## Getting Started

### 1. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Run the backend

```bash
cd backend
npm run dev
# Server starts on http://localhost:5000
```

### 3. Run the frontend

```bash
cd frontend
npm run dev
# App opens on http://localhost:3000
```

## Database Configuration (optional)

Set environment variables to use a real database. If none are set, the app runs with an in-memory store.

| Variable     | Default             | Description           |
|-------------|---------------------|-----------------------|
| MONGO_URI    | mongodb://localhost:27017/student_projects | MongoDB connection |
| MYSQL_HOST   | localhost           | MySQL host            |
| MYSQL_DB     | student_projects    | MySQL database        |
| MYSQL_USER   | root                | MySQL username        |
| MYSQL_PASS   |                     | MySQL password        |
| PG_HOST      | localhost           | PostgreSQL host       |
| PG_DB        | student_projects    | PostgreSQL database   |
| PG_USER      | postgres            | PostgreSQL username   |
| PG_PASS      |                     | PostgreSQL password   |

## API Endpoints

| Method | Endpoint        | Description                          |
|--------|-----------------|--------------------------------------|
| GET    | /api/health     | Health check + DB info               |
| GET    | /api/tasks      | Get tasks (search, filter, sort)     |
| GET    | /api/tasks/:id  | Get single task                      |
| POST   | /api/tasks      | Create task                          |
| PUT    | /api/tasks/:id  | Update task                          |
| DELETE | /api/tasks/:id  | Delete task                          |

## Tech Stack

- **Frontend:** React 18, Vite 5, Tailwind CSS 3, Axios
- **Backend:** Node.js, Express 4, express-validator
- **Database:** MongoDB (Mongoose) / MySQL / PostgreSQL (Sequelize) / In-Memory fallback
