import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";

const API = axios.create({ baseURL: "/api" });

// ─── Axios Interceptors (Centralized Error Handling) ─────────────────────────
API.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message || err.response?.data?.errors?.[0] || err.message || "Something went wrong";
    return Promise.reject(new Error(msg));
  }
);

// ─── Utility ─────────────────────────────────────────────────────────────────
const formatDate = (d) => new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

const STATUS_CONFIG = {
  pending:     { label: "Pending",     badge: "badge-pending",     icon: "⏳", dot: "bg-yellow-400" },
  "in-progress": { label: "In Progress", badge: "badge-in-progress", icon: "🔄", dot: "bg-blue-400"   },
  completed:   { label: "Completed",   badge: "badge-completed",   icon: "✅", dot: "bg-green-400"  },
};

// ─── Toast ────────────────────────────────────────────────────────────────────
function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((t) => (
        <div key={t.id} className={`animate-slide-up flex items-start gap-3 p-4 rounded-xl shadow-lg border text-sm font-medium
          ${t.type === "success" ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/40 dark:border-green-800 dark:text-green-300"
          : t.type === "error"   ? "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/40 dark:border-red-800 dark:text-red-300"
          : "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/40 dark:border-blue-800 dark:text-blue-300"}`}>
          <span className="text-base">{t.type === "success" ? "✅" : t.type === "error" ? "❌" : "ℹ️"}</span>
          <span className="flex-1">{t.message}</span>
          <button onClick={() => onRemove(t.id)} className="text-current opacity-60 hover:opacity-100 transition-opacity">✕</button>
        </div>
      ))}
    </div>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, loading }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative card p-6 max-w-sm w-full animate-slide-up">
        <div className="text-center">
          <div className="text-4xl mb-3">🗑️</div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{message}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading} className="btn-ghost flex-1 justify-center border border-gray-300 dark:border-gray-700">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className="btn-danger flex-1 justify-center">
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Task Form Modal ──────────────────────────────────────────────────────────
function TaskModal({ isOpen, task, onClose, onSave, loading }) {
  const [form, setForm] = useState({ title: "", description: "", status: "pending" });
  const [errors, setErrors] = useState({});
  const titleRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setForm(task ? { title: task.title, description: task.description || "", status: task.status } : { title: "", description: "", status: "pending" });
      setErrors({});
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [isOpen, task]);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    else if (form.title.length > 100) e.title = "Title must be under 100 characters";
    if (form.description.length > 500) e.description = "Description must be under 500 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onSave(form);
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card p-6 max-w-lg w-full animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold">{task ? "✏️ Edit Task" : "➕ New Task"}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Title <span className="text-red-500">*</span></label>
            <input ref={titleRef} className={`input ${errors.title ? "border-red-400 focus:ring-red-400" : ""}`}
              placeholder="Enter task title..." value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} maxLength={100} />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            <p className="text-xs text-gray-400 mt-1 text-right">{form.title.length}/100</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea className={`input resize-none h-24 ${errors.description ? "border-red-400 focus:ring-red-400" : ""}`}
              placeholder="Describe the task..." value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} maxLength={500} />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            <p className="text-xs text-gray-400 mt-1 text-right">{form.description.length}/500</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Status</label>
            <select className="input" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
              {Object.entries(STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.icon} {c.label}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center border border-gray-300 dark:border-gray-700">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (task ? "Update Task" : "Create Task")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color }) {
  return (
    <div className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold">{value ?? "—"}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────
function TaskCard({ task, onEdit, onDelete }) {
  const cfg = STATUS_CONFIG[task.status];
  return (
    <div className="card p-5 hover:shadow-md transition-all duration-200 animate-fade-in group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 leading-snug flex-1 line-clamp-2">{task.title}</h3>
        <span className={cfg.badge}><span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}</span>
      </div>
      {task.description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-3">{task.description}</p>}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 dark:border-gray-800">
        <span className="text-xs text-gray-400 dark:text-gray-500">📅 {formatDate(task.createdAt)}</span>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(task)} className="btn-ghost text-xs px-2.5 py-1.5">✏️ Edit</button>
          <button onClick={() => onDelete(task)} className="btn text-xs px-2.5 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">🗑️ Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ isFiltered, onAdd }) {
  return (
    <div className="card p-12 text-center col-span-full animate-fade-in">
      <div className="text-6xl mb-4">{isFiltered ? "🔍" : "📋"}</div>
      <h3 className="text-xl font-bold mb-2">{isFiltered ? "No tasks found" : "No tasks yet"}</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
        {isFiltered ? "Try adjusting your search or filters to find what you're looking for." : "Create your first task to get started with your project management."}
      </p>
      {!isFiltered && <button onClick={onAdd} className="btn-primary">➕ Create First Task</button>}
    </div>
  );
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
        <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      </div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800" />
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tasks, setTasks]           = useState([]);
  const [stats, setStats]           = useState({ total: 0, pending: 0, inProgress: 0, completed: 0 });
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState("all");
  const [sort, setSort]             = useState("newest");
  const [toasts, setToasts]         = useState([]);
  const [modal, setModal]           = useState({ open: false, task: null });
  const [confirm, setConfirm]       = useState({ open: false, task: null });
  const [darkMode, setDarkMode]     = useState(() => {
    const stored = localStorage.getItem("darkMode");
    return stored ? JSON.parse(stored) : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [dbInfo, setDbInfo]         = useState("");
  const searchTimer                 = useRef(null);

  // Dark mode effect
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  // Toast helpers
  const toast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id) => setToasts((p) => p.filter((t) => t.id !== id)), []);

  // Fetch tasks
  const fetchTasks = useCallback(async (s = search, st = statusFilter, so = sort) => {
    try {
      setLoading(true);
      const params = {};
      if (s)        params.search = s;
      if (st !== "all") params.status = st;
      params.sort = so === "newest" ? "newest" : "oldest";
      const res = await API.get("/tasks", { params });
      setTasks(res.data.data);
      setStats(res.data.stats);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sort, toast]);

  // Health check for DB info
  useEffect(() => {
    API.get("/health").then((r) => setDbInfo(r.data.dbType)).catch(() => setDbInfo("offline"));
  }, []);

  useEffect(() => { fetchTasks(); }, []);

  // Debounced search
  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchTasks(val, statusFilter, sort), 400);
  };

  const handleFilterChange = (st) => { setStatus(st); fetchTasks(search, st, sort); };
  const handleSortChange   = (so) => { setSort(so);   fetchTasks(search, statusFilter, so); };

  // CRUD
  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (modal.task) {
        await API.put(`/tasks/${modal.task._id}`, form);
        toast("Task updated successfully!", "success");
      } else {
        await API.post("/tasks", form);
        toast("Task created successfully!", "success");
      }
      setModal({ open: false, task: null });
      fetchTasks();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await API.delete(`/tasks/${confirm.task._id}`);
      toast("Task deleted.", "success");
      setConfirm({ open: false, task: null });
      fetchTasks();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setDeleting(false);
    }
  };

  const isFiltered = search || statusFilter !== "all";
  const DB_BADGE = { mongo: "🍃 MongoDB", mysql: "🐬 MySQL", postgres: "🐘 PostgreSQL", memory: "💾 In-Memory", offline: "⚠️ Offline" };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmModal isOpen={confirm.open} title="Delete Task" loading={deleting}
        message={`Are you sure you want to delete "${confirm.task?.title}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm} onCancel={() => setConfirm({ open: false, task: null })} />
      <TaskModal isOpen={modal.open} task={modal.task} loading={saving}
        onClose={() => setModal({ open: false, task: null })} onSave={handleSave} />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎓</span>
            <div>
              <h1 className="text-lg font-bold leading-tight">Student Project Portal</h1>
              <span className="text-xs text-gray-400 dark:text-gray-500">{DB_BADGE[dbInfo] || "🔄 Connecting..."}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setDarkMode((d) => !d)} className="btn-ghost p-2 rounded-xl text-lg" title="Toggle dark mode">
              {darkMode ? "☀️" : "🌙"}
            </button>
            <button onClick={() => setModal({ open: true, task: null })} className="btn-primary">
              <span>➕</span><span className="hidden sm:inline">New Task</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Tasks"   value={stats.total}      icon="📋" color="bg-indigo-100 dark:bg-indigo-900/30" />
          <StatCard label="Pending"       value={stats.pending}    icon="⏳" color="bg-yellow-100 dark:bg-yellow-900/30" />
          <StatCard label="In Progress"   value={stats.inProgress} icon="🔄" color="bg-blue-100 dark:bg-blue-900/30" />
          <StatCard label="Completed"     value={stats.completed}  icon="✅" color="bg-green-100 dark:bg-green-900/30" />
        </div>

        {/* Search, Filter, Sort */}
        <div className="card p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input className="input pl-9" placeholder="Search by title or description..."
              value={search} onChange={(e) => handleSearch(e.target.value)} />
          </div>
          <select className="input sm:w-44" value={statusFilter} onChange={(e) => handleFilterChange(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="pending">⏳ Pending</option>
            <option value="in-progress">🔄 In Progress</option>
            <option value="completed">✅ Completed</option>
          </select>
          <select className="input sm:w-44" value={sort} onChange={(e) => handleSortChange(e.target.value)}>
            <option value="newest">🆕 Newest First</option>
            <option value="oldest">🕰️ Oldest First</option>
          </select>
        </div>

        {/* Task Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700 dark:text-gray-300">
              {loading ? "Loading tasks..." : `${tasks.length} task${tasks.length !== 1 ? "s" : ""}${isFiltered ? " found" : ""}`}
            </h2>
            {loading && <span className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
              : tasks.length === 0
                ? <EmptyState isFiltered={!!isFiltered} onAdd={() => setModal({ open: true, task: null })} />
                : tasks.map((t) => (
                    <TaskCard key={t._id} task={t}
                      onEdit={(task) => setModal({ open: true, task })}
                      onDelete={(task) => setConfirm({ open: true, task })} />
                  ))
            }
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 mt-12 py-6 text-center text-sm text-gray-400 dark:text-gray-600">
        Student Mini Project Management Portal &copy; {new Date().getFullYear()} — Built with React, Vite &amp; Tailwind CSS
      </footer>
    </div>
  );
}
