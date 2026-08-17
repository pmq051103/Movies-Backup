import { useState, useEffect, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import {
  FaSignOutAlt,
  FaEye,
  FaEyeSlash,
  FaChartBar,
  FaTools,
  FaUsers,
  FaSave,
  FaPlus,
  FaHome,
  FaUserPlus,
  FaChevronLeft,
  FaChevronRight,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import Logo from "@/components/common/Logo";
import { StatsDashboard } from "@/pages/StatsPage";
import {
  adminLogin,
  adminMe,
  adminLogout,
  saveMaintenance,
  listAdminUsers,
  createAdminUser,
  fetchMaintenance,
  type AdminUser,
  type MaintenanceContent,
} from "@/api/adminService";
import { useMaintenance, clearMaintenanceCache } from "@/hooks/useMaintenance";

/* ------------------------------------------------------------------ */
/* Admin dashboard — login with a DB-backed admin account, then three  */
/* tabs: Thống kê (visit/movie stats), Bảo trì (rich-text content for  */
/* the public maintenance page), Tài khoản (list + create admins).     */
/* ------------------------------------------------------------------ */

const TOKEN_KEY = "admin-token";
const USER_KEY = "admin-user";

type Tab = "stats" | "maintenance" | "accounts";

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function getStoredUser(): AdminUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AdminUser) : null;
  } catch {
    return null;
  }
}

function storeAuth(token: string, user: AdminUser): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* ignore */
  }
}

function clearAuth(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------------ */
/* Login screen                                                        */
/* ------------------------------------------------------------------ */

function LoginScreen({ onSuccess }: { onSuccess: (token: string, user: AdminUser) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await adminLogin(username.trim(), password);
      if (res.ok && res.token && res.user) {
        onSuccess(res.token, res.user);
      } else {
        setError("Tên đăng nhập hoặc mật khẩu không đúng.");
      }
    } catch {
      setError("Không kết nối được máy chủ. Kiểm tra lại hoặc thử lại sau.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4 py-16 text-white">
      <div className="w-full max-w-sm rounded-3xl border border-gray-800 bg-gradient-to-b from-gray-900/80 to-gray-900/40 p-8 backdrop-blur-sm shadow-2xl shadow-black/40">
        {/* Logo + title inside the card */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-5 flex h-20 items-center justify-center rounded-2xl bg-gradient-to-b from-gray-900/80 to-gray-900/40 px-6 ring-1 ring-gray-800">
            <Logo size="sm" withLink={false} animated={false} />
          </div>
          <h1 className="text-lg font-bold tracking-wide">QUẢN TRỊ HỆ THỐNG</h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Đăng nhập bằng tài khoản quản trị
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">
              Tên đăng nhập
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên đăng nhập"
              autoFocus
              autoComplete="username"
              className="w-full rounded-xl border border-gray-800 bg-gray-900/70 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all focus:border-red-500/60 focus:ring-2 focus:ring-red-500/20"
            />
          </div>

          <div className="relative">
            <label className="mb-1.5 block text-xs font-medium text-gray-400">
              Mật khẩu
            </label>
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              autoComplete="current-password"
              className="w-full rounded-xl border border-gray-800 bg-gray-900/70 px-4 py-3 pr-11 text-sm text-white placeholder-gray-500 outline-none transition-all focus:border-red-500/60 focus:ring-2 focus:ring-red-500/20"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-3 top-[2.35rem] -translate-y-1/2 text-gray-500 transition-colors hover:text-white"
              aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {show ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
            </button>
          </div>

          {error && (
            <p className="rounded-lg bg-red-950/50 px-3 py-2 text-center text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 py-3 text-sm font-semibold text-white transition-all hover:from-red-500 hover:to-red-400 disabled:opacity-60"
          >
            {busy ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <Link
          to="/"
          className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500 transition-colors hover:text-white"
        >
          <FaHome className="h-3.5 w-3.5" />
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Maintenance tab — rich-text editor + enable toggle                  */
/* ------------------------------------------------------------------ */

const QUILT_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["link", "image"],
    [{ color: [] }, { background: [] }],
    ["clean"],
  ],
};

const QUILT_FORMATS = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  // Bulleted/numbered lists are both the single "list" format (its value
  // is "ordered" or "bullet" — see the toolbar config above). "bullet" is
  // not a format name on its own; listing it here made Quill try to
  // register a nonexistent format and throw on every load.
  "list",
  "align",
  "link",
  "image",
  "color",
  "background",
];

function MaintenanceTab({
  token,
  initial,
}: {
  token: string;
  initial: MaintenanceContent | null;
}) {
  const { refresh } = useMaintenance();
  const [enabled, setEnabled] = useState(initial?.enabled ?? false);
  const [title, setTitle] = useState(initial?.title ?? "Hệ thống đang bảo trì");
  const [content, setContent] = useState(initial?.content_html ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setMessage("");
    try {
      await saveMaintenance(token, { enabled, title, content_html: content });
      clearMaintenanceCache();
      refresh();
      setMessage("Đã lưu. Trang bảo trì công khai sẽ cập nhật ngay lập tức.");
    } catch {
      setMessage("Lưu thất bại. Kiểm tra kết nối và thử lại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900/80 to-gray-900/40 p-5">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-200">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-800 text-red-400">
              <FaTools className="h-3 w-3" />
            </span>
            Chế độ bảo trì
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            Khi bật, toàn bộ khách truy cập sẽ thấy trang bảo trì (trừ /admin).
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled((v) => !v)}
          className={`relative h-8 w-14 rounded-full transition-colors ${
            enabled ? "bg-red-600" : "bg-gray-700"
          }`}
        >
          <span
            className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${
              enabled ? "left-7" : "left-1"
            }`}
          />
        </button>
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900/80 to-gray-900/40 p-5">
        <label className="mb-2 block text-sm font-medium text-gray-300">Tiêu đề</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          className="w-full rounded-xl border border-gray-800 bg-gray-900/70 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all focus:border-red-500/60 focus:ring-2 focus:ring-red-500/20"
        />
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900/80 to-gray-900/40 p-5">
        <label className="mb-2 block text-sm font-medium text-gray-300">Nội dung thông báo</label>
        <div className="admin-quill">
          <ReactQuill
            theme="snow"
            value={content}
            onChange={setContent}
            modules={QUILT_MODULES}
            formats={QUILT_FORMATS}
            placeholder="Soạn nội dung thông báo bảo trì..."
          />
        </div>
      </div>

      {message && (
        <p
          className={`rounded-xl px-4 py-3 text-sm ${
            message.includes("thất bại")
              ? "bg-red-950/50 text-red-400"
              : "bg-emerald-950/50 text-emerald-400"
          }`}
        >
          {message}
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:from-red-500 hover:to-red-400 disabled:opacity-60"
      >
        <FaSave className="h-3.5 w-3.5" />
        {saving ? "Đang lưu..." : "Lưu thay đổi"}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Accounts tab — list admins + create a new account                   */
/* ------------------------------------------------------------------ */

function AccountsTab({ token }: { token: string }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newDisplay, setNewDisplay] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    listAdminUsers(token)
      .then(setUsers)
      .catch(() => setError("Không tải được danh sách tài khoản."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [token]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (newUsername.trim().length < 3 || newPassword.length < 6) {
      setMessage("Tên đăng nhập tối thiểu 3 ký tự, mật khẩu tối thiểu 6 ký tự.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await createAdminUser(token, {
        username: newUsername.trim(),
        password: newPassword,
        display_name: newDisplay.trim() || undefined,
      });
      setMessage("Đã tạo tài khoản mới.");
      setNewUsername("");
      setNewPassword("");
      setNewDisplay("");
      load();
    } catch {
      setMessage("Tạo tài khoản thất bại. Tên đăng nhập có thể đã tồn tại.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900/80 to-gray-900/40 p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-200">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-800 text-red-400">
            <FaUserPlus className="h-3 w-3" />
          </span>
          Tạo tài khoản quản trị mới
        </h3>

        <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-3">
          <input
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="Tên đăng nhập"
            className="w-full rounded-xl border border-gray-800 bg-gray-900/70 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all focus:border-red-500/60 focus:ring-2 focus:ring-red-500/20"
          />
          <input
            type="text"
            value={newDisplay}
            onChange={(e) => setNewDisplay(e.target.value)}
            placeholder="Tên hiển thị (tùy chọn)"
            className="w-full rounded-xl border border-gray-800 bg-gray-900/70 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all focus:border-red-500/60 focus:ring-2 focus:ring-red-500/20"
          />
          <input
            type="text"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Mật khẩu (tối thiểu 6 ký tự)"
            className="w-full rounded-xl border border-gray-800 bg-gray-900/70 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all focus:border-red-500/60 focus:ring-2 focus:ring-red-500/20"
          />
          <button
            type="submit"
            disabled={busy}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:from-red-500 hover:to-red-400 disabled:opacity-60 md:col-span-3"
          >
            <FaPlus className="h-3.5 w-3.5" />
            {busy ? "Đang tạo..." : "Tạo tài khoản"}
          </button>
        </form>

        {message && (
          <p
            className={`mt-4 rounded-xl px-4 py-3 text-sm ${
              message.includes("thất bại") || message.includes("tối thiểu")
                ? "bg-red-950/50 text-red-400"
                : "bg-emerald-950/50 text-emerald-400"
            }`}
          >
            {message}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900/80 to-gray-900/40 p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-200">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-800 text-red-400">
            <FaUsers className="h-3 w-3" />
          </span>
          Danh sách tài khoản
        </h3>

        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-900" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-gray-500">Chưa có tài khoản nào.</p>
        ) : (
          <ul className="space-y-2">
            {users.map((u) => (
              <li
                key={u.id}
                className="flex items-center gap-3 rounded-xl bg-gray-900/50 px-4 py-3"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-800 text-red-400">
                  <FaUsers className="h-3.5 w-3.5" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">
                    {u.display_name || u.username}
                  </p>
                  <p className="text-xs text-gray-500">
                    @{u.username} ·{" "}
                    {u.role === "owner" ? "Chủ sở hữu" : u.role === "admin" ? "Quản trị" : u.role}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* AdminPage — main screen                                             */
/* ------------------------------------------------------------------ */

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<AdminUser | null>(() => getStoredUser());
  const [verifying, setVerifying] = useState(() => Boolean(getStoredToken()));
  const [tab, setTab] = useState<Tab>("stats");
  const [maintenance, setMaintenance] = useState<MaintenanceContent | null>(null);
  // Sidebar: `collapsed` shrinks it to icon-only on desktop (persists across
  // reloads); `mobileOpen` is the off-canvas drawer toggle on small screens
  // (always starts closed — there's no sensible "restore open" on mobile).
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("admin-sidebar-collapsed") === "1";
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("admin-sidebar-collapsed", next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  /* Verify the stored session against the server on first load. */
  useEffect(() => {
    const stored = getStoredToken();
    if (!stored) return;
    let active = true;
    adminMe(stored)
      .then((u) => {
        if (!active) return;
        if (u) {
          setToken(stored);
          setUser(u);
          storeAuth(stored, u);
        } else {
          clearAuth();
          setToken(null);
          setUser(null);
        }
      })
      .catch(() => {
        /* Keep the optimistic session on network errors; the server will
           reject writes with a 401 if the token really is dead. */
      })
      .finally(() => {
        if (active) setVerifying(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!token) return;
    let active = true;
    fetchMaintenance()
      .then((data) => {
        if (active) setMaintenance(data);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [token]);

  const handleLogin = (newToken: string, newUser: AdminUser) => {
    storeAuth(newToken, newUser);
    setToken(newToken);
    setUser(newUser);
    setVerifying(false);
  };

  const handleLogout = async () => {
    const t = token;
    clearAuth();
    setToken(null);
    setUser(null);
    if (t) {
      adminLogout(t).catch(() => undefined);
    }
  };

  const TABS: Array<{ id: Tab; label: string; icon: ReactNode }> = [
    { id: "stats", label: "Thống kê", icon: <FaChartBar className="h-3.5 w-3.5" /> },
    { id: "maintenance", label: "Bảo trì", icon: <FaTools className="h-3.5 w-3.5" /> },
    { id: "accounts", label: "Tài khoản", icon: <FaUsers className="h-3.5 w-3.5" /> },
  ];

  if (verifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-red-500" />
      </div>
    );
  }

  if (!token || !user) {
    return (
      <>
        <Helmet>
          <meta name="robots" content="noindex" />
        </Helmet>
        <LoginScreen onSuccess={handleLogin} />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="min-h-screen bg-gray-950 text-white">
        {/* ── Sidebar ──────────────────────────────────────────────────
            Fixed on the left. On desktop (lg+) it's always visible and
            just toggles between full (w-64) and icon-only (w-[76px]).
            On mobile it's an off-canvas drawer — translated out of view
            until `mobileOpen`, with a backdrop to close it. */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-gray-800 bg-gray-950/95 backdrop-blur-sm transition-all duration-200 ease-in-out ${
            collapsed ? "w-[76px]" : "w-64"
          } ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
        >
          <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-gray-800 px-4">
            {collapsed ? (
              // The Logo component always renders its full wordmark text
              // (no prop to hide it), which doesn't fit in a 76px-wide
              // collapsed rail — so collapsed state uses just the raw
              // mark image instead of <Logo/>, sized to actually fit.
              <Link
                to="/"
                className="mx-auto flex h-8 w-8 shrink-0 items-center justify-center"
                aria-label="Không Gian Phim — Trang chủ"
              >
                <img
                  src="/logo.png"
                  alt="Không Gian Phim"
                  className="h-8 w-8 object-contain"
                  draggable={false}
                />
              </Link>
            ) : (
              <Link to="/" className="flex min-w-0 items-center overflow-hidden focus:outline-none">
                <Logo size="sm" withLink={false} animated={false} />
              </Link>
            )}
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-gray-800 text-gray-400 hover:text-white lg:hidden"
              aria-label="Đóng menu"
            >
              <FaTimes className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Collapse toggle — floats on the sidebar's edge instead of
              sharing the header row with the logo, so it never gets
              squeezed out or overlapped regardless of collapsed state. */}
          <button
            type="button"
            onClick={toggleCollapsed}
            className="absolute -right-3 top-[52px] z-50 hidden h-6 w-6 items-center justify-center rounded-full border border-gray-700 bg-gray-900 text-gray-400 shadow-md transition-colors hover:border-gray-600 hover:text-white lg:flex"
            aria-label={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
            title={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
          >
            {collapsed ? (
              <FaChevronRight className="h-3 w-3" />
            ) : (
              <FaChevronLeft className="h-3 w-3" />
            )}
          </button>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTab(t.id);
                  setMobileOpen(false);
                }}
                title={collapsed ? t.label : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  collapsed ? "justify-center" : ""
                } ${
                  tab === t.id
                    ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-600/20"
                    : "text-gray-400 hover:bg-gray-900 hover:text-white"
                }`}
              >
                {t.icon}
                {!collapsed && <span className="truncate">{t.label}</span>}
              </button>
            ))}
          </nav>

          <div className="shrink-0 space-y-1 border-t border-gray-800 p-3">
            <div className={`flex items-center gap-3 rounded-xl px-3 py-2 ${collapsed ? "justify-center" : ""}`}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-700 text-xs font-bold text-white">
                {(user.display_name || user.username).slice(0, 1).toUpperCase()}
              </span>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {user.display_name || user.username}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {user.role === "owner" ? "Chủ sở hữu" : "Quản trị"}
                  </p>
                </div>
              )}
            </div>
            <Link
              to="/"
              title={collapsed ? "Trang chủ" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-400 transition-colors hover:bg-gray-900 hover:text-white ${
                collapsed ? "justify-center" : ""
              }`}
            >
              <FaHome className="h-4 w-4 shrink-0" />
              {!collapsed && "Trang chủ"}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              title={collapsed ? "Đăng xuất" : undefined}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-300 transition-colors hover:bg-red-950/40 hover:text-red-200 ${
                collapsed ? "justify-center" : ""
              }`}
            >
              <FaSignOutAlt className="h-4 w-4 shrink-0" />
              {!collapsed && "Đăng xuất"}
            </button>
          </div>
        </aside>

        {/* Mobile backdrop — closes the drawer on tap-outside */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* ── Main content, offset by the sidebar's current width ────── */}
        <div className={`transition-all duration-200 ease-in-out ${collapsed ? "lg:pl-[76px]" : "lg:pl-64"}`}>
          {/* Mobile top bar — hamburger to open the drawer, since the
              sidebar itself is off-screen by default on small screens. */}
          <div className="flex h-14 items-center gap-3 border-b border-gray-800 bg-gray-950/80 px-4 backdrop-blur-sm lg:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-800 text-gray-300 hover:text-white"
              aria-label="Mở menu"
            >
              <FaBars className="h-3.5 w-3.5" />
            </button>
            <span className="text-sm font-semibold text-white">
              {TABS.find((t) => t.id === tab)?.label}
            </span>
          </div>

          <main className="w-full px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
            {tab === "stats" && <StatsDashboard />}
            {tab === "maintenance" && (
              <div className="mx-auto max-w-4xl">
                <MaintenanceTab token={token} initial={maintenance} />
              </div>
            )}
            {tab === "accounts" && (
              <div className="mx-auto max-w-4xl">
                <AccountsTab token={token} />
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
