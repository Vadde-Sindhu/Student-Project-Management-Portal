const express = require("express");
const cors = require("cors");
const { body, param, validationResult } = require("express-validator");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());
app.use(express.json());

// ─── In-Memory Fallback Store ────────────────────────────────────────────────
let tasks = [
  { _id: uuidv4(), title: "Design ER Diagram", description: "Create entity-relationship diagram for the database schema", status: "completed", createdAt: new Date("2025-01-10T08:00:00Z") },
  { _id: uuidv4(), title: "Setup React Project", description: "Initialize Vite + React + Tailwind CSS project structure", status: "completed", createdAt: new Date("2025-01-12T09:30:00Z") },
  { _id: uuidv4(), title: "Build REST API", description: "Develop Express.js REST API with full CRUD operations", status: "in-progress", createdAt: new Date("2025-01-15T10:00:00Z") },
  { _id: uuidv4(), title: "Implement Authentication", description: "Add JWT-based user authentication and authorization", status: "in-progress", createdAt: new Date("2025-01-18T11:00:00Z") },
  { _id: uuidv4(), title: "Write Unit Tests", description: "Write unit and integration tests for all API endpoints", status: "pending", createdAt: new Date("2025-01-20T14:00:00Z") },
  { _id: uuidv4(), title: "Deploy to Production", description: "Configure CI/CD pipeline and deploy application to cloud", status: "pending", createdAt: new Date("2025-01-22T16:00:00Z") },
];

// ─── DB Connection (MongoDB → MySQL → PostgreSQL → In-Memory) ────────────────
let db = null;
let dbType = "memory";

async function connectDB() {
  // Try MongoDB
  try {
    const mongoose = require("mongoose");
    const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/student_projects";
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 3000 });
    db = mongoose;
    dbType = "mongo";
    console.log("✅ Connected to MongoDB");

    const TaskSchema = new mongoose.Schema({
      title: { type: String, required: true, trim: true },
      description: { type: String, default: "" },
      status: { type: String, enum: ["pending", "in-progress", "completed"], default: "pending" },
      createdAt: { type: Date, default: Date.now },
    });
    app.locals.Task = mongoose.models.Task || mongoose.model("Task", TaskSchema);
    return;
  } catch (e) {
    console.log("⚠️  MongoDB unavailable:", e.message);
  }

  // Try MySQL
  try {
    const { Sequelize, DataTypes } = require("sequelize");
    const sequelize = new Sequelize(
      process.env.MYSQL_DB || "student_projects",
      process.env.MYSQL_USER || "root",
      process.env.MYSQL_PASS || "",
      { host: process.env.MYSQL_HOST || "localhost", dialect: "mysql", logging: false, dialectOptions: { connectTimeout: 3000 } }
    );
    await sequelize.authenticate();
    const Task = sequelize.define("Task", {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      title: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, defaultValue: "" },
      status: { type: DataTypes.ENUM("pending", "in-progress", "completed"), defaultValue: "pending" },
      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    });
    await sequelize.sync();
    db = sequelize;
    dbType = "mysql";
    app.locals.Task = Task;
    console.log("✅ Connected to MySQL");
    return;
  } catch (e) {
    console.log("⚠️  MySQL unavailable:", e.message);
  }

  // Try PostgreSQL
  try {
    const { Sequelize, DataTypes } = require("sequelize");
    const sequelize = new Sequelize(
      process.env.PG_DB || "student_projects",
      process.env.PG_USER || "postgres",
      process.env.PG_PASS || "",
      { host: process.env.PG_HOST || "localhost", dialect: "postgres", logging: false, dialectOptions: { connectionTimeoutMillis: 3000 } }
    );
    await sequelize.authenticate();
    const Task = sequelize.define("Task", {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      title: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, defaultValue: "" },
      status: { type: DataTypes.ENUM("pending", "in-progress", "completed"), defaultValue: "pending" },
      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    });
    await sequelize.sync();
    db = sequelize;
    dbType = "postgres";
    app.locals.Task = Task;
    console.log("✅ Connected to PostgreSQL");
    return;
  } catch (e) {
    console.log("⚠️  PostgreSQL unavailable:", e.message);
  }

  console.log("📦 Using In-Memory database (no persistence)");
}

// ─── DB Adapter ──────────────────────────────────────────────────────────────
const DB = {
  async getAll() {
    if (dbType === "mongo") return app.locals.Task.find().sort({ createdAt: -1 });
    if (dbType === "mysql" || dbType === "postgres") return app.locals.Task.findAll({ order: [["createdAt", "DESC"]] });
    return [...tasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  async getById(id) {
    if (dbType === "mongo") return app.locals.Task.findById(id);
    if (dbType === "mysql" || dbType === "postgres") return app.locals.Task.findByPk(id);
    return tasks.find((t) => t._id === id) || null;
  },
  async create(data) {
    if (dbType === "mongo") return app.locals.Task.create(data);
    if (dbType === "mysql" || dbType === "postgres") return app.locals.Task.create(data);
    const task = { _id: uuidv4(), ...data, createdAt: new Date() };
    tasks.unshift(task);
    return task;
  },
  async update(id, data) {
    if (dbType === "mongo") return app.locals.Task.findByIdAndUpdate(id, data, { new: true });
    if (dbType === "mysql" || dbType === "postgres") {
      const task = await app.locals.Task.findByPk(id);
      if (!task) return null;
      return task.update(data);
    }
    const idx = tasks.findIndex((t) => t._id === id);
    if (idx === -1) return null;
    tasks[idx] = { ...tasks[idx], ...data };
    return tasks[idx];
  },
  async delete(id) {
    if (dbType === "mongo") return app.locals.Task.findByIdAndDelete(id);
    if (dbType === "mysql" || dbType === "postgres") {
      const task = await app.locals.Task.findByPk(id);
      if (!task) return null;
      await task.destroy();
      return task;
    }
    const idx = tasks.findIndex((t) => t._id === id);
    if (idx === -1) return null;
    return tasks.splice(idx, 1)[0];
  },
};

// ─── Validation Rules ────────────────────────────────────────────────────────
const taskValidation = [
  body("title").trim().notEmpty().withMessage("Title is required").isLength({ max: 100 }).withMessage("Title must be under 100 characters"),
  body("description").optional().trim().isLength({ max: 500 }).withMessage("Description must be under 500 characters"),
  body("status").optional().isIn(["pending", "in-progress", "completed"]).withMessage("Status must be pending, in-progress, or completed"),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array().map((e) => e.msg) });
  next();
};

// ─── Routes ──────────────────────────────────────────────────────────────────

// Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, dbType, message: `Running with ${dbType} database` });
});

// GET all tasks (with optional search, filter, sort)
app.get("/api/tasks", async (req, res) => {
  try {
    let result = await DB.getAll();

    // Convert to plain objects for uniform handling
    if (dbType === "mongo") result = result.map((t) => ({ _id: t._id.toString(), title: t.title, description: t.description, status: t.status, createdAt: t.createdAt }));
    else if (dbType === "mysql" || dbType === "postgres") result = result.map((t) => ({ _id: t.id, title: t.title, description: t.description, status: t.status, createdAt: t.createdAt }));

    const { search, status, sort } = req.query;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q));
    }
    if (status && status !== "all") result = result.filter((t) => t.status === status);
    if (sort === "oldest") result = result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    else result = result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const stats = {
      total: result.length,
      pending: result.filter((t) => t.status === "pending").length,
      inProgress: result.filter((t) => t.status === "in-progress").length,
      completed: result.filter((t) => t.status === "completed").length,
    };

    res.json({ success: true, data: result, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch tasks", error: err.message });
  }
});

// GET single task
app.get("/api/tasks/:id", async (req, res) => {
  try {
    const task = await DB.getById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch task", error: err.message });
  }
});

// POST create task
app.post("/api/tasks", taskValidation, validate, async (req, res) => {
  try {
    const { title, description = "", status = "pending" } = req.body;
    const task = await DB.create({ title, description, status });
    res.status(201).json({ success: true, data: task, message: "Task created successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to create task", error: err.message });
  }
});

// PUT update task
app.put("/api/tasks/:id", taskValidation, validate, async (req, res) => {
  try {
    const { title, description, status } = req.body;
    const task = await DB.update(req.params.id, { title, description, status });
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });
    res.json({ success: true, data: task, message: "Task updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update task", error: err.message });
  }
});

// DELETE task
app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const task = await DB.delete(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });
    res.json({ success: true, message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete task", error: err.message });
  }
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Internal server error", error: err.message });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT} [DB: ${dbType}]`));
});
