import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  LayoutDashboard,
  Ticket,
  Monitor,
  CalendarDays,
  BookOpen,
  BarChart3,
  LogOut,
  Plus,
  ArrowUpRight,
  Search,
  ChevronRight,
  X,
  Check,
  Clock,
  AlertTriangle,
  Download,
  Leaf,
  Menu,
  ShieldCheck,
  MessageSquare,
  QrCode,
  RefreshCw,
  CheckCircle2,
  Wrench,
} from "lucide-react";
import { api } from "./api";
import "./styles.css";
const categories = [
  "Hardware",
  "Software",
  "Network",
  "Email",
  "Access",
  "Other",
];
const priorities = ["Low", "Medium", "High", "Critical"];
const states = ["Open", "In progress", "Waiting", "Resolved", "Closed"];
const departments = [
  "ICT",
  "Finance",
  "Administration",
  "Operations",
  "Human Resources",
  "Other",
];
const icons = {
  Overview: LayoutDashboard,
  Requests: Ticket,
  Assets: Monitor,
  Maintenance: CalendarDays,
  "Knowledge base": BookOpen,
  Reports: BarChart3,
};
const date = (v) =>
  v
    ? new Date(v).toLocaleDateString("en-KE", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";
const time = (v) =>
  v
    ? new Date(v).toLocaleString("en-KE", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
function Badge({ value }) {
  return (
    <span
      className={"badge " + String(value).toLowerCase().replaceAll(" ", "-")}
    >
      {value}
    </span>
  );
}
function Field({ label, children }) {
  const id = React.useId();
  return (
    <label className="field" htmlFor={id}>
      <span id={id + "-label"}>{label}</span>
      {React.cloneElement(children, { id, "aria-labelledby": id + "-label" })}
    </label>
  );
}
function Select({ values, ...props }) {
  return (
    <select {...props}>
      {values.map((v) => (
        <option
          key={typeof v === "string" ? v : v.value}
          value={typeof v === "string" ? v : v.value}
        >
          {typeof v === "string" ? v : v.label}
        </option>
      ))}
    </select>
  );
}
function Empty({ text = "Nothing here yet." }) {
  return (
    <div className="empty">
      <CheckCircle2 size={30} />
      <p>{text}</p>
    </div>
  );
}
function Modal({ title, children, onClose, wide = false }) {
  useEffect(() => {
    const escape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", escape);
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", escape);
      document.body.style.overflow = old;
    };
  }, [onClose]);
  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className={"modal " + (wide ? "wide" : "")}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header>
          <div>
            <span className="eyebrow">ICT SERVICE DESK</span>
            <h2>{title}</h2>
          </div>
          <button
            className="icon-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
function Login({ onLogin }) {
  const [username, setUsername] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const d = await api("login/", {
        method: "POST",
        body: { username, password },
      });
      onLogin(d.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <section className="login-story">
        <div className="brand">
          <div className="brand-icon">
            <Leaf />
          </div>
          <div>
            <strong>NKPCU</strong>
            <small>ICT SERVICE DESK</small>
          </div>
        </div>
        <div className="story-main">
          <span className="eyebrow">CONNECTED PEOPLE. RELIABLE SYSTEMS.</span>
          <h1>
            Better support.
            <br />
            Stronger operations.
          </h1>
          <p>
            A shared space to solve ICT problems, care for equipment, and keep
            useful knowledge within reach.
          </p>
          <div className="story-pills">
            <span>
              <ShieldCheck size={17} /> Accountable support
            </span>
            <span>
              <Wrench size={17} /> Preventive maintenance
            </span>
          </div>
        </div>
        <small>
          Attachment project · Prototype for departmental evaluation
        </small>
        <div className="orbit one" />
        <div className="orbit two" />
      </section>
      <section className="login-form">
        <form onSubmit={submit}>
          <span className="eyebrow">WELCOME BACK</span>
          <h2>Sign in to your workspace</h2>
          <p className="muted">
            Use the account provided by your ICT administrator.
          </p>
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          <Field label="Username">
            <input
              autoFocus
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <button className="button primary full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
            <ArrowUpRight size={18} />
          </button>
          <p className="login-help">
            Need access or a password reset? Contact your ICT administrator.
          </p>
        </form>
      </section>
    </main>
  );
}
function TicketTable({ items, onOpen }) {
  return (
    <div className="table-scroll">
      <table className="tickets-table">
        <thead>
          <tr>
            <th>Request</th>
            <th>Requester / department</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Assigned to</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((t) => (
            <tr key={t.id}>
              <td>
                <button className="table-link" onClick={() => onOpen(t.id)}>
                  <small>{t.reference}</small>
                  <strong>{t.title}</strong>
                </button>
                {t.overdue && (
                  <span className="overdue-label">
                    <Clock size={12} /> Overdue
                  </span>
                )}
              </td>
              <td>
                {t.requester}
                <small>{t.department}</small>
              </td>
              <td>
                <Badge value={t.priority} />
              </td>
              <td>
                <Badge value={t.status} />
              </td>
              <td>{t.assignee || <span className="muted">Unassigned</span>}</td>
              <td>
                <button
                  className="icon-btn"
                  onClick={() => onOpen(t.id)}
                  aria-label={"Open " + t.reference}
                >
                  <ChevronRight size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!items.length && <Empty text="No requests match this view." />}
    </div>
  );
}
function App() {
  const [user, setUser] = useState(null),
    [ready, setReady] = useState(false),
    [page, setPage] = useState("Overview"),
    [boot, setBoot] = useState({ assets: [], technicians: [] }),
    [dash, setDash] = useState(null),
    [tickets, setTickets] = useState([]),
    [assets, setAssets] = useState([]),
    [maintenance, setMaintenance] = useState([]),
    [articles, setArticles] = useState([]),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("All"),
    [modal, setModal] = useState(null),
    [detail, setDetail] = useState(null),
    [toast, setToast] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false),
    [menu, setMenu] = useState(false);
  const technical = user && user.role !== "Staff";
  useEffect(() => {
    api("session/")
      .then((d) => setUser(d.user))
      .catch((e) => setError(e.message))
      .finally(() => setReady(true));
  }, []);
  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const [b, d, t, k] = await Promise.all([
        api("bootstrap/"),
        api("dashboard/"),
        api("tickets/"),
        api("articles/"),
      ]);
      setBoot(b);
      setDash(d);
      setTickets(t.items);
      setArticles(k.items);
      if (b.user.role !== "Staff") {
        const [a, m] = await Promise.all([api("assets/"), api("maintenance/")]);
        setAssets(a.items);
        setMaintenance(m.items);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (user) refresh();
  }, [user?.id]);
  useEffect(() => {
    setQuery("");
    setFilter("All");
    setMenu(false);
  }, [page]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const [assetFromQR] = useState(
    new URLSearchParams(window.location.search).get("asset"),
  );
  useEffect(() => {
    if (user && boot.assets.length && assetFromQR)
      setModal({ type: "ticket", asset: assetFromQR });
  }, [user?.id, boot.assets.length]);
  function notify(text) {
    setToast(text);
  }
  async function openTicket(id) {
    try {
      setDetail(await api(`tickets/${id}/`));
      setModal({ type: "detail" });
    } catch (e) {
      setError(e.message);
    }
  }
  async function openAsset(id) {
    try {
      setDetail(await api(`assets/${id}/`));
      setModal({ type: "assetDetail" });
    } catch (e) {
      setError(e.message);
    }
  }
  function close() {
    setModal(null);
    setDetail(null);
  }
  async function saved(message) {
    close();
    notify(message);
    await refresh();
  }
  const ticketItems = tickets.filter(
    (t) =>
      (filter === "All" ||
        (filter === "Overdue" ? t.overdue : t.status === filter)) &&
      [t.title, t.reference, t.requester, t.department, t.asset || ""]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const assetItems = assets.filter(
    (a) =>
      [a.name, a.tag, a.department, a.location]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filter === "All" || a.status === filter),
  );
  const articleItems = articles.filter((a) =>
    [a.title, a.body, a.category]
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  if (!ready) return <div className="loading">Opening your workspace…</div>;
  if (!user)
    return (
      <>
        {error && <div className="error top-error">{error}</div>}
        <Login
          onLogin={(u) => {
            setUser(u);
            setError("");
          }}
        />
      </>
    );
  const nav = technical
    ? Object.keys(icons)
    : ["Overview", "Requests", "Knowledge base", "Reports"];
  return (
    <div className="app-shell">
      <aside className={"sidebar " + (menu ? "visible" : "")}>
        <div className="brand">
          <div className="brand-icon">
            <Leaf size={25} />
          </div>
          <div>
            <strong>NKPCU</strong>
            <small>ICT SERVICE DESK</small>
          </div>
        </div>
        <span className="nav-label">WORKSPACE</span>
        <nav>
          {nav.map((n) => {
            const Icon = icons[n];
            return (
              <button
                key={n}
                className={page === n ? "active" : ""}
                onClick={() => setPage(n)}
              >
                <Icon size={19} />
                {n}
                {n === "Requests" && dash?.open > 0 && (
                  <span className="nav-count">{dash.open}</span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="support-tip">
            <ShieldCheck size={23} />
            <strong>Every request matters.</strong>
            <p>
              Clear records today.
              <br />
              Reliable operations tomorrow.
            </p>
          </div>
          <div className="user-card">
            <span className="avatar">{user.name[0]}</span>
            <div>
              <strong>{user.name}</strong>
              <small>{user.role}</small>
            </div>
            <button
              aria-label="Sign out"
              className="icon-btn"
              onClick={async () => {
                try {
                  await api("logout/", { method: "POST" });
                  setUser(null);
                  setPage("Overview");
                  setTickets([]);
                  setAssets([]);
                  setMaintenance([]);
                  setArticles([]);
                  setBoot({ assets: [], technicians: [] });
                  setModal(null);
                  setDash(null);
                } catch (e) {
                  setError(e.message);
                }
              }}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-btn mobile-menu"
              onClick={() => setMenu(!menu)}
              aria-label="Toggle navigation"
            >
              <Menu />
            </button>
            <span>ICT workspace</span>
            <ChevronRight size={15} />
            <strong>{page}</strong>
          </div>
          <div className="topbar-right">
            <span className="prototype">
              <span /> Demonstration workspace
            </span>
            <button
              className="icon-btn"
              aria-label="Refresh workspace"
              onClick={refresh}
              disabled={loading}
            >
              <RefreshCw size={17} className={loading ? "spin" : ""} />
            </button>
          </div>
        </header>
        <main className="main">
          <div className="page-heading">
            <div>
              <span className="eyebrow">
                {technical ? "DEPARTMENT OPERATIONS" : "YOUR SUPPORT WORKSPACE"}
              </span>
              <h1>
                {page === "Overview" ? "A clear view of ICT support." : page}
              </h1>
              <p>
                {
                  {
                    Overview:
                      "Track the work, spot the priorities, and keep everyone moving.",
                    Requests: technical
                      ? "One queue for every issue. Follow each request from report to resolution."
                      : "Report an issue and follow your requests through to resolution.",
                    Assets:
                      "Know your equipment, its condition, and the story behind every repair.",
                    Maintenance:
                      "Plan ahead. Give equipment the attention it needs.",
                    "Knowledge base":
                      "Practical answers, reviewed by ICT, ready when you need them.",
                    Reports:
                      "Turn support records into evidence for better decisions.",
                  }[page]
                }
              </p>
            </div>
            <button
              className="button primary"
              onClick={() => setModal({ type: "ticket" })}
            >
              <Plus size={18} />
              New request
            </button>
          </div>
          {error && (
            <div className="error" role="alert">
              {error}
              <button
                className="icon-btn"
                aria-label="Dismiss error"
                onClick={() => setError("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {loading && !dash && <div className="loading">Loading records…</div>}
          {page === "Overview" && dash && (
            <>
              <section className="hero">
                <div>
                  <span className="eyebrow">SERVICE DESK AT A GLANCE</span>
                  <h2>
                    Good support starts
                    <br />
                    with a clear picture.
                  </h2>
                  <p>
                    {technical
                      ? "Keep requests moving and maintenance on track."
                      : "A simple way to ask for help and stay informed."}
                  </p>
                  <button
                    className="hero-link"
                    onClick={() => setPage("Requests")}
                  >
                    View {technical ? "the work queue" : "your requests"}
                    <ArrowUpRight size={17} />
                  </button>
                </div>
                <div className="hero-visual">
                  <div className="visual-ring" />
                  <div className="hero-tile tile-one">
                    <CheckCircle2 />
                    <span>Support, organised.</span>
                  </div>
                  <div className="hero-tile tile-two">
                    <Monitor />
                    <span>Equipment, cared for.</span>
                  </div>
                  <div className="hero-leaf">
                    <Leaf size={64} />
                  </div>
                </div>
              </section>
              <section className="stats-grid">
                {[
                  {
                    label: "Active requests",
                    value: dash.open,
                    icon: Ticket,
                    help: technical
                      ? "Across the ICT work queue"
                      : "Awaiting resolution",
                  },
                  {
                    label: "Overdue requests",
                    value: dash.overdue,
                    icon: AlertTriangle,
                    help: "Past the target resolution time",
                    warning: true,
                  },
                  {
                    label: "Resolved requests",
                    value: dash.resolved,
                    icon: CheckCircle2,
                    help: "Includes confirmed closures",
                  },
                  {
                    label: "Avg. resolution",
                    value:
                      dash.average_resolution_hours === null
                        ? "—"
                        : dash.average_resolution_hours + "h",
                    icon: Clock,
                    help: "All resolved records",
                  },
                ].map((s) => (
                  <div
                    className={
                      "stat-card " + (s.warning && s.value ? "warning" : "")
                    }
                    key={s.label}
                  >
                    <div>
                      <span>{s.label}</span>
                      <s.icon size={19} />
                    </div>
                    <strong>{s.value}</strong>
                    <small>{s.help}</small>
                  </div>
                ))}
              </section>
              <div className="overview-grid">
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Recent requests</h2>
                      <p>The latest work coming into the desk.</p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => setPage("Requests")}
                    >
                      View all <ChevronRight size={16} />
                    </button>
                  </div>
                  <TicketTable
                    items={dash.recent_tickets}
                    onOpen={openTicket}
                  />
                </section>
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>{technical ? "Keep an eye on" : "Quick help"}</h2>
                      <p>
                        {technical
                          ? "A little planning goes a long way."
                          : "Start with a practical guide."}
                      </p>
                    </div>
                  </div>
                  {technical ? (
                    <div className="attention">
                      <button
                        onClick={() => {
                          setPage("Requests");
                          setTimeout(() => setFilter("Overdue"), 0);
                        }}
                      >
                        <span className="attention-icon amber">
                          <Clock />
                        </span>
                        <div>
                          <strong>{dash.overdue} overdue requests</strong>
                          <small>Review the queue and next steps</small>
                        </div>
                        <ChevronRight size={17} />
                      </button>
                      <button onClick={() => setPage("Maintenance")}>
                        <span className="attention-icon green">
                          <CalendarDays />
                        </span>
                        <div>
                          <strong>
                            {dash.maintenance_due} maintenance tasks due
                          </strong>
                          <small>Overdue or due in the next 7 days</small>
                        </div>
                        <ChevronRight size={17} />
                      </button>
                      <button onClick={() => setPage("Assets")}>
                        <span className="attention-icon blue">
                          <Monitor />
                        </span>
                        <div>
                          <strong>{dash.assets} registered assets</strong>
                          <small>View condition and repair history</small>
                        </div>
                        <ChevronRight size={17} />
                      </button>
                    </div>
                  ) : (
                    <div className="attention">
                      {articles.slice(0, 3).map((a) => (
                        <button
                          key={a.id}
                          onClick={() =>
                            setModal({ type: "articleRead", article: a })
                          }
                        >
                          <BookOpen size={20} />
                          <div>
                            <strong>{a.title}</strong>
                            <small>{a.category}</small>
                          </div>
                          <ChevronRight size={17} />
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="panel-foot">
                    <Leaf size={17} />
                    <span>Small improvements. Lasting value.</span>
                  </div>
                </section>
              </div>
              {technical && (
                <section className="panel activity-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Latest activity</h2>
                      <p>A traceable record of what changed.</p>
                    </div>
                    <ShieldCheck size={20} />
                  </div>
                  <div className="activity-list">
                    {dash.activity.map((e) => (
                      <div key={e.id}>
                        <span className="activity-dot" />
                        <p>
                          <strong>{e.action}</strong>
                          <small>
                            {e.actor} · {time(e.created_at)}
                          </small>
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
          {page === "Requests" && (
            <section className="panel">
              <div className="toolbar">
                <div className="search">
                  <Search size={18} />
                  <input
                    placeholder="Search requests, people, device tags…"
                    aria-label="Search requests"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <Select
                  aria-label="Filter requests"
                  values={["All", ...states, "Overdue"]}
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
                <span className="muted">{ticketItems.length} requests</span>
              </div>
              <TicketTable items={ticketItems} onOpen={openTicket} />
            </section>
          )}
          {page === "Assets" && technical && (
            <>
              <div className="section-actions">
                <div className="search">
                  <Search size={18} />
                  <input
                    aria-label="Search assets"
                    placeholder="Search equipment, tags, locations…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <Select
                  values={["All", "Operational", "Under repair", "Retired"]}
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  aria-label="Filter assets"
                />
                <button
                  className="button secondary"
                  onClick={() => setModal({ type: "asset" })}
                >
                  <Plus size={17} />
                  Register asset
                </button>
              </div>
              <div className="asset-grid">
                {assetItems.map((a) => (
                  <button
                    className="asset-card"
                    key={a.id}
                    onClick={() => openAsset(a.id)}
                  >
                    <div className="asset-card-top">
                      <span className="asset-icon">
                        <Monitor size={25} />
                      </span>
                      <Badge value={a.status} />
                    </div>
                    <span className="eyebrow">{a.tag}</span>
                    <h3>{a.name}</h3>
                    <p>
                      {a.kind} · {a.department}
                    </p>
                    <div className="asset-card-foot">
                      <span>{a.location}</span>
                      <ArrowUpRight size={18} />
                    </div>
                  </button>
                ))}
              </div>
              {!assetItems.length && (
                <Empty text="No assets match this view." />
              )}
            </>
          )}
          {page === "Maintenance" && technical && (
            <>
              <div className="section-actions">
                <div className="tab-group">
                  {["All", "Pending", "Completed"].map((f) => (
                    <button
                      key={f}
                      className={filter === f ? "selected" : ""}
                      onClick={() => setFilter(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <button
                  className="button secondary"
                  onClick={() => setModal({ type: "maintenance" })}
                >
                  <Plus size={17} />
                  Schedule maintenance
                </button>
              </div>
              <section className="panel">
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Maintenance task</th>
                        <th>Equipment</th>
                        <th>Due date</th>
                        <th>Assigned to</th>
                        <th>Status</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {maintenance
                        .filter(
                          (m) =>
                            filter === "All" ||
                            (filter === "Completed"
                              ? m.completed_at
                              : !m.completed_at),
                        )
                        .map((m) => (
                          <tr key={m.id}>
                            <td>
                              <strong>{m.title}</strong>
                              {m.notes && (
                                <small className="wrap">{m.notes}</small>
                              )}
                            </td>
                            <td>{m.asset}</td>
                            <td>{date(m.due_date + "T12:00:00")}</td>
                            <td>{m.assignee}</td>
                            <td>
                              <Badge
                                value={
                                  m.completed_at
                                    ? "Completed"
                                    : m.overdue
                                      ? "Overdue"
                                      : "Scheduled"
                                }
                              />
                            </td>
                            <td>
                              {!m.completed_at && (
                                <button
                                  className="text-button"
                                  onClick={() =>
                                    setModal({ type: "complete", item: m })
                                  }
                                >
                                  Complete <Check size={15} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {!maintenance.length && (
                    <Empty text="Schedule your first maintenance task." />
                  )}
                </div>
              </section>
            </>
          )}
          {page === "Knowledge base" && (
            <>
              <div className="section-actions">
                <div className="search">
                  <Search size={18} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search troubleshooting guides…"
                    aria-label="Search knowledge base"
                  />
                </div>
                {user.role === "Supervisor" && (
                  <button
                    className="button secondary"
                    onClick={() => setModal({ type: "article" })}
                  >
                    <Plus size={17} />
                    Write a guide
                  </button>
                )}
              </div>
              <div className="knowledge-grid">
                {articleItems.map((a) => (
                  <article className="knowledge-card" key={a.id}>
                    <div>
                      <span className="knowledge-icon">
                        <BookOpen />
                      </span>
                      <span className="eyebrow">{a.category}</span>
                      {!a.published && <Badge value="Draft" />}
                    </div>
                    <h3>{a.title}</h3>
                    <p>{a.body.slice(0, 130)}…</p>
                    <div className="knowledge-foot">
                      <small>Updated {date(a.updated_at)}</small>
                      <button
                        className="text-button"
                        onClick={() =>
                          setModal({ type: "articleRead", article: a })
                        }
                      >
                        Read guide <ArrowUpRight size={16} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              {!articleItems.length && (
                <Empty text="No guides match your search." />
              )}
            </>
          )}
          {page === "Reports" && dash && (
            <>
              <div className="report-banner">
                <div>
                  <BarChart3 size={30} />
                  <h2>Support performance, made visible.</h2>
                  <p>
                    Calculated from {technical ? "all" : "your"} stored
                    requests. Targets are configurable through ticket
                    priorities.
                  </p>
                </div>
                <a href="/api/reports/tickets.csv" className="button primary">
                  <Download size={18} />
                  Export requests CSV
                </a>
              </div>
              <div className="report-grid">
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Requests by category</h2>
                      <p>Where support is needed most.</p>
                    </div>
                  </div>
                  <div className="bars">
                    {dash.by_category.map((c) => (
                      <div key={c.label}>
                        <span>{c.label}</span>
                        <div>
                          <i
                            style={{
                              width:
                                (dash.total
                                  ? (c.value / dash.total) * 100
                                  : 0) + "%",
                            }}
                          />
                        </div>
                        <strong>{c.value}</strong>
                      </div>
                    ))}
                  </div>
                </section>
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Requests by status</h2>
                      <p>A snapshot of the current workflow.</p>
                    </div>
                  </div>
                  <div className="status-list">
                    {dash.by_status.map((s) => (
                      <div key={s.label}>
                        <Badge value={s.label} />
                        <strong>{s.value}</strong>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
              <section className="panel report-notes">
                <h2>How to read these numbers</h2>
                <p>
                  Resolution time runs from submission to the most recent
                  resolution. Reopening a request clears its resolution time
                  until it is resolved again. Overdue requests are active
                  requests past their target time. All figures cover the stored
                  records, with no date filter.
                </p>
                <p>
                  Prototype resolution targets: Critical 4 hours · High 8 hours
                  · Medium 24 hours · Low 72 hours. These are elapsed hours and
                  should be agreed with the ICT team before a pilot.
                </p>
              </section>
            </>
          )}
          <footer className="workspace-footer">
            <span>NKPCU ICT Service Desk</span>
            <span>Attachment prototype · Fictional demo records</span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
      {modal?.type === "ticket" && (
        <Modal title="Report an ICT issue" onClose={close}>
          <TicketForm
            boot={boot}
            initialAsset={modal.asset}
            onSaved={() => saved("Request submitted successfully.")}
          />
        </Modal>
      )}
      {modal?.type === "detail" && detail && (
        <Modal
          title={detail.reference + " · Request details"}
          onClose={close}
          wide
        >
          <TicketDetail
            ticket={detail}
            user={user}
            boot={boot}
            onUpdate={async () => {
              setDetail(await api(`tickets/${detail.id}/`));
              await refresh();
            }}
            notify={notify}
          />
        </Modal>
      )}
      {modal?.type === "asset" && (
        <Modal
          title={modal.asset ? "Edit equipment" : "Register equipment"}
          onClose={close}
        >
          <AssetForm
            asset={modal.asset}
            onSaved={() => saved("Asset saved.")}
          />
        </Modal>
      )}
      {modal?.type === "assetDetail" && detail && (
        <Modal title={detail.tag + " · Equipment history"} onClose={close} wide>
          <AssetDetail
            asset={detail}
            onTicket={openTicket}
            onEdit={() => setModal({ type: "asset", asset: detail })}
          />
        </Modal>
      )}
      {modal?.type === "maintenance" && (
        <Modal title="Schedule maintenance" onClose={close}>
          <MaintenanceForm
            boot={boot}
            onSaved={() => saved("Maintenance scheduled.")}
          />
        </Modal>
      )}
      {modal?.type === "complete" && (
        <Modal title="Complete maintenance" onClose={close}>
          <CompleteMaintenance
            item={modal.item}
            onSaved={() => saved("Maintenance completed and recorded.")}
          />
        </Modal>
      )}
      {modal?.type === "article" && (
        <Modal
          title={modal.article ? "Edit guide" : "Write a knowledge guide"}
          onClose={close}
          wide
        >
          <ArticleForm
            article={modal.article}
            onSaved={() => saved("Knowledge guide saved.")}
          />
        </Modal>
      )}
      {modal?.type === "articleRead" && (
        <Modal title={modal.article.title} onClose={close} wide>
          <div className="article-read">
            <Badge value={modal.article.category} />
            <p className="muted">
              Reviewed by {modal.article.author} · Updated{" "}
              {date(modal.article.updated_at)}
            </p>
            <div className="article-body">{modal.article.body}</div>
            {user.role === "Supervisor" && (
              <button
                className="button secondary"
                onClick={() =>
                  setModal({ type: "article", article: modal.article })
                }
              >
                Edit guide
              </button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
function useSubmit() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function run(fn) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, run };
}
function FormError({ error }) {
  return error ? (
    <div className="error" role="alert">
      {error}
    </div>
  ) : null;
}
function TicketForm({ boot, initialAsset, onSaved }) {
  const [data, setData] = useState({
      title: "",
      description: "",
      category: "Hardware",
      department: "ICT",
      location: "Head office",
      priority: "Medium",
      asset: initialAsset || "",
    }),
    { busy, error, run } = useSubmit();
  const change = (k) => (e) => setData({ ...data, [k]: e.target.value });
  return (
    <form
      className="form-body"
      onSubmit={(e) => {
        e.preventDefault();
        run(async () => {
          await api("tickets/", {
            method: "POST",
            body: { ...data, asset: data.asset || null },
          });
          onSaved();
        });
      }}
    >
      <FormError error={error} />
      <Field label="Issue title">
        <input
          required
          maxLength={160}
          placeholder="e.g. Shared printer keeps disconnecting"
          value={data.title}
          onChange={change("title")}
        />
      </Field>
      <Field label="Describe the problem">
        <textarea
          required
          maxLength={8000}
          rows={4}
          placeholder="What were you trying to do? What happened? Who is affected?"
          value={data.description}
          onChange={change("description")}
        />
      </Field>
      <div className="form-grid">
        <Field label="Category">
          <Select
            values={categories}
            value={data.category}
            onChange={change("category")}
          />
        </Field>
        <Field label="Priority">
          <Select
            values={priorities}
            value={data.priority}
            onChange={change("priority")}
          />
        </Field>
        <Field label="Department">
          <Select
            values={departments}
            value={data.department}
            onChange={change("department")}
          />
        </Field>
        <Field label="Location">
          <input
            required
            maxLength={100}
            value={data.location}
            onChange={change("location")}
          />
        </Field>
      </div>
      <Field label="Affected equipment (optional)">
        <Select
          values={[
            { value: "", label: "No equipment selected" },
            ...boot.assets.map((a) => ({
              value: a.id,
              label: a.tag + " · " + a.name,
            })),
          ]}
          value={data.asset}
          onChange={change("asset")}
        />
      </Field>
      <p className="form-hint">
        Keep passwords and confidential records out of your request. ICT can
        adjust the priority after review.
      </p>
      <button className="button primary full" disabled={busy}>
        {busy ? "Submitting…" : "Submit request"}
        <ArrowUpRight size={17} />
      </button>
    </form>
  );
}
function TicketDetail({ ticket: t, user, boot, onUpdate, notify }) {
  const [status, setStatus] = useState(t.status),
    [assignee, setAssignee] = useState(t.assignee_id || ""),
    [priority, setPriority] = useState(t.priority),
    [resolution, setResolution] = useState(t.resolution),
    [note, setNote] = useState(""),
    { busy, error, run } = useSubmit();
  useEffect(() => {
    setStatus(t.status);
    setAssignee(t.assignee_id || "");
    setPriority(t.priority);
    setResolution(t.resolution);
  }, [t]);
  const technical = user.role !== "Staff";
  async function mutate(body) {
    await api(`tickets/${t.id}/`, { method: "PATCH", body });
    await onUpdate();
    notify("Request updated.");
  }
  return (
    <div className="detail-body">
      <FormError error={error} />
      <div className="detail-title">
        <div>
          <Badge value={t.status} />
          <Badge value={t.priority} />
          {t.overdue && <Badge value="Overdue" />}
          <h2>{t.title}</h2>
        </div>
      </div>
      <div className="detail-columns">
        <section>
          <p className="description">{t.description}</p>
          <dl className="metadata">
            <div>
              <dt>Reported by</dt>
              <dd>{t.requester}</dd>
            </div>
            <div>
              <dt>Department</dt>
              <dd>{t.department}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{t.location}</dd>
            </div>
            <div>
              <dt>Equipment</dt>
              <dd>{t.asset || "Not linked"}</dd>
            </div>
            <div>
              <dt>Submitted</dt>
              <dd>{time(t.created_at)}</dd>
            </div>
            <div>
              <dt>Resolution target</dt>
              <dd>{time(t.due_at)}</dd>
            </div>
          </dl>
          {t.resolution && (
            <div className="resolution-box">
              <strong>
                <CheckCircle2 size={17} />
                Resolution recorded
              </strong>
              <p>{t.resolution}</p>
              {t.status === "Resolved" && t.requester_id === user.id && (
                <button
                  className="button primary"
                  disabled={busy}
                  onClick={() => run(() => mutate({ action: "confirm" }))}
                >
                  Confirm issue is fixed
                </button>
              )}
            </div>
          )}
          {["Resolved", "Closed"].includes(t.status) && (
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => run(() => mutate({ action: "reopen" }))}
            >
              Reopen request
            </button>
          )}
          <h3 className="detail-subheading">Discussion</h3>
          <div className="notes">
            {t.notes.length ? (
              t.notes.map((n) => (
                <div className="note" key={n.id}>
                  <strong>
                    {n.author}
                    <small>{time(n.created_at)}</small>
                  </strong>
                  <p>{n.body}</p>
                </div>
              ))
            ) : (
              <p className="muted">No discussion notes yet.</p>
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(async () => {
                await api(`tickets/${t.id}/notes/`, {
                  method: "POST",
                  body: { body: note },
                });
                setNote("");
                await onUpdate();
                notify("Note added.");
              });
            }}
          >
            <textarea
              required
              maxLength={4000}
              rows={3}
              aria-label="Discussion note"
              placeholder="Add a progress update or more information…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button className="button secondary" disabled={busy}>
              <MessageSquare size={16} />
              Add note
            </button>
          </form>
        </section>
        <aside className="detail-aside">
          {technical && t.status !== "Closed" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                run(() =>
                  mutate({
                    action: "update",
                    assignee_id: assignee || null,
                    priority,
                    status,
                    resolution,
                  }),
                );
              }}
            >
              <h3>Manage request</h3>
              <Field label="Assigned to">
                <Select
                  values={[
                    { value: "", label: "Unassigned" },
                    ...boot.technicians.map((u) => ({
                      value: u.id,
                      label: u.name,
                    })),
                  ]}
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                />
              </Field>
              <Field label="Priority">
                <Select
                  values={priorities}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                />
              </Field>
              <Field label="Status">
                <Select
                  values={["Open", "In progress", "Waiting", "Resolved"]}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                />
              </Field>
              {status === "Resolved" && (
                <Field label="Resolution notes">
                  <textarea
                    required
                    rows={3}
                    maxLength={8000}
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                  />
                </Field>
              )}
              <button className="button primary full" disabled={busy}>
                {busy ? "Saving…" : "Save changes"}
              </button>
            </form>
          )}
          <h3>Activity trail</h3>
          <div className="timeline">
            {t.events.map((e) => (
              <div key={e.id}>
                <span />
                <strong>{e.action}</strong>
                <small>
                  {e.actor}
                  <br />
                  {time(e.created_at)}
                </small>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
function AssetForm({ asset, onSaved }) {
  const [data, setData] = useState(
      asset || {
        tag: "",
        name: "",
        kind: "Laptop",
        serial_number: "",
        location: "Head office",
        department: "ICT",
        custodian: "",
        status: "Operational",
        warranty_until: "",
      },
    ),
    { busy, error, run } = useSubmit();
  const change = (k) => (e) => setData({ ...data, [k]: e.target.value });
  return (
    <form
      className="form-body"
      onSubmit={(e) => {
        e.preventDefault();
        run(async () => {
          await api(asset ? `assets/${asset.id}/` : "assets/", {
            method: asset ? "PATCH" : "POST",
            body: { ...data, warranty_until: data.warranty_until || null },
          });
          onSaved();
        });
      }}
    >
      <FormError error={error} />
      <div className="form-grid">
        <Field label="Asset tag">
          <input
            required
            maxLength={40}
            value={data.tag}
            onChange={change("tag")}
          />
        </Field>
        <Field label="Equipment type">
          <Select
            values={[
              "Laptop",
              "Desktop",
              "Printer",
              "Network",
              "Server",
              "Other",
            ]}
            value={data.kind}
            onChange={change("kind")}
          />
        </Field>
      </div>
      <Field label="Equipment name">
        <input
          required
          maxLength={120}
          value={data.name}
          onChange={change("name")}
        />
      </Field>
      <div className="form-grid">
        {["serial_number", "location", "department", "custodian"].map((k) => (
          <Field
            key={k}
            label={k.replace("_", " ").replace(/^./, (c) => c.toUpperCase())}
          >
            <input
              required={["location", "department"].includes(k)}
              maxLength={100}
              value={data[k]}
              onChange={change(k)}
            />
          </Field>
        ))}
        <Field label="Condition">
          <Select
            values={["Operational", "Under repair", "Retired"]}
            value={data.status}
            onChange={change("status")}
          />
        </Field>
        <Field label="Warranty expiry">
          <input
            type="date"
            value={data.warranty_until || ""}
            onChange={change("warranty_until")}
          />
        </Field>
      </div>
      <button className="button primary full" disabled={busy}>
        {busy ? "Saving…" : "Save equipment"}
      </button>
    </form>
  );
}
function AssetDetail({ asset: a, onTicket, onEdit }) {
  return (
    <div className="detail-body">
      <div className="asset-detail-top">
        <div>
          <Badge value={a.status} />
          <h2>{a.name}</h2>
          <p className="muted">
            {a.kind} · {a.department} · {a.location}
          </p>
          <p>
            Custodian: {a.custodian || "Not recorded"}
            <br />
            Serial: {a.serial_number || "Not recorded"}
            <br />
            Warranty:{" "}
            {date(a.warranty_until ? a.warranty_until + "T12:00:00" : null)}
          </p>
          <button className="button secondary" onClick={onEdit}>
            Edit equipment
          </button>
        </div>
        <div className="qr-card">
          <img
            src={`/api/assets/${a.id}/qr/`}
            alt={"QR fault reporting code for " + a.tag}
          />
          <small>{a.tag} · Scan to report a fault</small>
          <a
            className="text-button"
            href={`/api/assets/${a.id}/qr/`}
            download={`${a.tag}-qr.png`}
          >
            <QrCode size={15} />
            Download QR label
          </a>
        </div>
      </div>
      <h3>Linked support requests</h3>
      <TicketTable items={a.tickets} onOpen={onTicket} />
      <h3 className="detail-subheading">Maintenance history</h3>
      {a.maintenance.length ? (
        a.maintenance.map((m) => (
          <div className="history-row" key={m.id}>
            <div>
              <strong>{m.title}</strong>
              <small>
                {date(m.due_date + "T12:00:00")} · {m.assignee}
              </small>
              {m.notes && <p>{m.notes}</p>}
            </div>
            <Badge value={m.completed_at ? "Completed" : "Scheduled"} />
          </div>
        ))
      ) : (
        <p className="muted">No maintenance tasks recorded.</p>
      )}
      <h3 className="detail-subheading">Equipment activity</h3>
      {a.events.map((e) => (
        <div className="history-row" key={e.id}>
          <div>
            <strong>{e.action}</strong>
            <small>
              {e.actor} · {time(e.created_at)}
            </small>
          </div>
        </div>
      ))}
    </div>
  );
}
function MaintenanceForm({ boot, onSaved }) {
  const [data, setData] = useState({
      title: "",
      asset: boot.assets[0]?.id || "",
      assignee: boot.technicians[0]?.id || "",
      due_date: "",
    }),
    { busy, error, run } = useSubmit();
  const change = (k) => (e) => setData({ ...data, [k]: e.target.value });
  return (
    <form
      className="form-body"
      onSubmit={(e) => {
        e.preventDefault();
        run(async () => {
          await api("maintenance/", { method: "POST", body: data });
          onSaved();
        });
      }}
    >
      <FormError error={error} />
      <Field label="Task title">
        <input
          required
          maxLength={160}
          value={data.title}
          onChange={change("title")}
        />
      </Field>
      <Field label="Equipment">
        <Select
          required
          values={[
            { value: "", label: "Select equipment" },
            ...boot.assets.map((a) => ({
              value: a.id,
              label: a.tag + " · " + a.name,
            })),
          ]}
          value={data.asset}
          onChange={change("asset")}
        />
      </Field>
      <Field label="Assigned to">
        <Select
          required
          values={[
            { value: "", label: "Select technician" },
            ...boot.technicians.map((u) => ({ value: u.id, label: u.name })),
          ]}
          value={data.assignee}
          onChange={change("assignee")}
        />
      </Field>
      <Field label="Due date">
        <input
          required
          type="date"
          value={data.due_date}
          onChange={change("due_date")}
        />
      </Field>
      <button className="button primary full" disabled={busy}>
        {busy ? "Scheduling…" : "Schedule task"}
      </button>
    </form>
  );
}
function CompleteMaintenance({ item, onSaved }) {
  const [notes, setNotes] = useState(""),
    { busy, error, run } = useSubmit();
  return (
    <form
      className="form-body"
      onSubmit={(e) => {
        e.preventDefault();
        run(async () => {
          await api(`maintenance/${item.id}/`, {
            method: "PATCH",
            body: { notes },
          });
          onSaved();
        });
      }}
    >
      <FormError error={error} />
      <h3>{item.title}</h3>
      <p className="muted">{item.asset}</p>
      <Field label="Work completed and findings">
        <textarea
          required
          maxLength={4000}
          rows={5}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Field>
      <button className="button primary full" disabled={busy}>
        {busy ? "Saving…" : "Record completion"}
      </button>
    </form>
  );
}
function ArticleForm({ article, onSaved }) {
  const [data, setData] = useState(
      article || {
        title: "",
        category: "Hardware",
        body: "",
        published: false,
      },
    ),
    { busy, error, run } = useSubmit();
  const change = (k) => (e) => setData({ ...data, [k]: e.target.value });
  return (
    <form
      className="form-body"
      onSubmit={(e) => {
        e.preventDefault();
        run(async () => {
          await api(article ? `articles/${article.id}/` : "articles/", {
            method: article ? "PATCH" : "POST",
            body: data,
          });
          onSaved();
        });
      }}
    >
      <FormError error={error} />
      <Field label="Guide title">
        <input
          required
          maxLength={160}
          value={data.title}
          onChange={change("title")}
        />
      </Field>
      <Field label="Category">
        <input
          required
          maxLength={40}
          value={data.category}
          onChange={change("category")}
        />
      </Field>
      <Field label="Instructions (plain text)">
        <textarea
          required
          rows={9}
          maxLength={16000}
          value={data.body}
          onChange={change("body")}
        />
      </Field>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={data.published}
          onChange={(e) => setData({ ...data, published: e.target.checked })}
        />
        Reviewed and ready to publish
      </label>
      <button className="button primary full" disabled={busy}>
        {busy ? "Saving…" : "Save guide"}
      </button>
    </form>
  );
}
createRoot(document.getElementById("root")).render(<App />);
