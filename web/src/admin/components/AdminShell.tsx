import { Suspense, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronsLeft,
  ChevronsRight,
  Menu,
  LayoutDashboard,
  LogOut,
  Images,
  Megaphone,
  MessageSquare,
  Moon,
  Package,
  Settings,
  ShoppingBag,
  Store,
  Sparkles,
  Sun,
  Users,
  ExternalLink,
} from "lucide-react";
import { usePromotions } from "../lib/promotionsStore";
import { useSlides } from "../lib/slidesStore";
import { useSession } from "../lib/session";
import { cn } from "../lib/cn";
import { useTheme } from "../lib/theme";
import { Avatar } from "./ui/Avatar";
import AiCommandBar from "./AiCommandBar";
import { api } from "../../lib/api";
import { useApi } from "../../lib/useApi";
import { DemoBadge } from "../../lib/DemoBadge";
import { Skeleton } from "../../lib/AsyncBoundary";
import { useDocumentTitle } from "../../lib/useDocumentTitle";
import NotificationsMenu from "./NotificationsMenu";


const aiCategories = [
  { id: "analytics", label: "Analytics & Insights" },
  { id: "operations", label: "Operations" },
  { id: "customer", label: "Customer & Growth" },
  { id: "catalog", label: "Catalog & Content" },
] as const;

const routeTitles: Record<string, { title: string; eyebrow: string }> = {
  "/dashboard": { title: "Dashboard", eyebrow: "Overview" },
  "/products": { title: "Products", eyebrow: "Catalog" },
  "/orders": { title: "Orders", eyebrow: "Fulfillment" },
  "/customers": { title: "Customers", eyebrow: "CRM" },
  "/feedback": { title: "Feedback", eyebrow: "Voice of customer" },
  "/promotions": { title: "Promotions", eyebrow: "Marketing" },
  "/slides": { title: "Hero slides", eyebrow: "Marketing" },
  "/settings": { title: "Settings", eyebrow: "Configuration" },
  "/ai-hub": { title: "AI Hub", eyebrow: "Intelligence" },
};

export default function AdminShell() {
  const { theme, toggle } = useTheme();
  const { pathname, hash } = useLocation();
  // Maintained incrementally in Redis, so this is a counter read rather than
  // a scan over every review.
  const counts = useApi(
    () => api.get<{ lowStock: number; pendingOrders: number; newFeedback: number }>(
      "/admin/analytics/counts",
    ),
    // Re-read on navigation so the bell and badges catch up after bulk edits.
    [pathname, hash],
  );
  const awaitingFeedback = counts.data?.newFeedback ?? 0;
  const navigate = useNavigate();
  const { user, signOut } = useSession();
  const displayName = user?.name ?? "IntelliCart";
  const displayRole = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Guest";

  function handleSignOut() {
    signOut();
    navigate("/sign-in", { replace: true });
  }
  const [collapsedPref, setCollapsed] = useState<boolean>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("admin_sidebar") : null;
    return saved === "1";
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  // The mobile drawer always shows labels; the icon rail is a desktop-only preference.
  const collapsed = collapsedPref && !mobileOpen;

  // Cmd/Ctrl-K opens the AI command bar from anywhere.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    localStorage.setItem("admin_sidebar", collapsedPref ? "1" : "0");
  }, [collapsedPref]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const promotions = usePromotions();
  const livePromotions = promotions.filter((p) => p.status === "active").length;
  const slides = useSlides();
  const liveSlides = slides.filter((s) => s.status === "active").length;

  const navGroups = [
    {
      label: "Workspace",
      items: [
        { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { to: "/products", icon: Package, label: "Products" },
        { to: "/orders", icon: ShoppingBag, label: "Orders" },
        { to: "/customers", icon: Users, label: "Customers" },
        {
          to: "/feedback",
          icon: MessageSquare,
          label: "Feedback",
          badge: awaitingFeedback > 0 ? String(awaitingFeedback) : undefined,
        },
        {
          to: "/promotions",
          icon: Megaphone,
          label: "Promotions",
          badge: livePromotions > 0 ? String(livePromotions) : undefined,
        },
        {
          to: "/slides",
          icon: Images,
          label: "Hero slides",
          badge: liveSlides > 0 ? String(liveSlides) : undefined,
        },
      ],
    },
    {
      label: "Intelligence",
      items: [{ to: "/ai-hub", icon: Sparkles, label: "AI Hub" }],
    },
    {
      label: "System",
      items: [{ to: "/settings", icon: Settings, label: "Settings" }],
    },
  ];

  const ctx = (() => {
    if (pathname.startsWith("/ai-hub/")) return { title: "AI Hub", eyebrow: "Intelligence" };
    if (pathname.startsWith("/settings/")) return { title: "Settings", eyebrow: "Configuration" };
    // Detail pages (/orders/ORD-1, /products/P-1/edit…) take their section's title.
    const section = pathname.match(/^\/(feedback|products|orders|customers)\//)?.[1];
    if (section) return routeTitles[`/${section}`];
    return routeTitles[pathname] ?? { title: "IntelliCart", eyebrow: "Workspace" };
  })();
  useDocumentTitle(`${ctx.title} · IntelliCart Admin`);

  return (
    <div className="min-h-screen flex bg-[var(--color-bg)] text-[var(--color-text)]">
      <a
        href="#main"
        onClick={(e) => {
          // HashRouter owns the URL hash, so move focus by hand instead of navigating.
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-3 focus:py-2 focus:rounded-[10px] focus:bg-[var(--color-surface)] focus:text-[var(--color-text)] focus:border focus:border-[var(--color-border-strong)] focus:shadow-lg text-[13px] font-medium"
      >
        Skip to content
      </a>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed md:sticky top-0 z-50 md:z-auto h-screen shrink-0 transition-[width,transform] duration-300 ease-out",
          "bg-[var(--color-surface)] border-r border-[var(--color-border)]",
          collapsed ? "md:w-[72px]" : "md:w-[248px]",
          "w-[248px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          <div className={cn("flex items-center gap-2 px-4 h-16 border-b border-[var(--color-border)]", collapsed && "md:px-3 md:justify-center")}>
            <Link to="/dashboard" className="flex items-center gap-2.5 min-w-0">
              <span
                className="w-8 h-8 rounded-[10px] flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm"
                style={{ background: "linear-gradient(135deg, var(--color-brand-500), var(--color-accent-violet))" }}
              >
                A
              </span>
              {!collapsed && (
                <div className="min-w-0 leading-tight">
                  <p className="text-[14px] font-semibold tracking-tight truncate">IntelliCart</p>
                  <p className="text-[11px] text-[var(--color-text-subtle)] truncate">Commerce Admin</p>
                </div>
              )}
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
            {navGroups.map((group) => (
              <div key={group.label}>
                {!collapsed && (
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-subtle)] px-2 mb-2">
                    {group.label}
                  </p>
                )}
                <ul className="space-y-1">
                  {group.items.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.to === "/ai-hub" ? false : false}
                        className={({ isActive }) =>
                          cn(
                            "group relative flex items-center gap-3 rounded-[10px] px-2.5 py-2 text-[13.5px] font-medium",
                            "transition-colors duration-150",
                            isActive
                              ? "bg-[var(--color-surface-2)] text-[var(--color-text)]"
                              : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]",
                            collapsed && "md:justify-center md:px-2"
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && (
                              <span
                                aria-hidden
                                className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-[var(--color-brand-500)]"
                              />
                            )}
                            <item.icon
                              size={18}
                              className={cn(
                                "shrink-0 transition-transform duration-200",
                                isActive ? "text-[var(--color-brand-600)]" : "text-[var(--color-text-subtle)] group-hover:text-[var(--color-text)]"
                              )}
                            />
                            {!collapsed && <span className="truncate">{item.label}</span>}
                            {!collapsed && "badge" in item && item.badge && (
                              <span className="ml-auto text-[10.5px] font-semibold px-1.5 py-0.5 rounded-md bg-[var(--color-brand-50)] text-[var(--color-brand-700)] dark:bg-[color-mix(in_oklab,var(--color-brand-500)_22%,transparent)] dark:text-[var(--color-brand-200)]">
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                      {item.to === "/ai-hub" && !collapsed && (
                        <ul className="mt-1 ml-4 pl-3 border-l border-[var(--color-border)] space-y-0.5">
                          {aiCategories.map((cat) => {
                            const active = pathname === "/ai-hub" && hash === `#${cat.id}`;
                            return (
                              <li key={cat.id}>
                                <Link
                                  to={`/ai-hub#${cat.id}`}
                                  className={cn(
                                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-[12.5px] transition-colors duration-150",
                                    active
                                      ? "text-[var(--color-text)] bg-[var(--color-surface-2)]"
                                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"
                                  )}
                                >
                                  <span
                                    aria-hidden
                                    className={cn(
                                      "w-1.5 h-1.5 rounded-full shrink-0",
                                      active ? "bg-[var(--color-brand-500)]" : "bg-[var(--color-text-subtle)]"
                                    )}
                                  />
                                  <span className="truncate">{cat.label}</span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <div className="border-t border-[var(--color-border)] p-3">
            <div
              className={cn(
                "flex items-center gap-3 rounded-[10px] p-2 hover:bg-[var(--color-surface-2)] transition-colors",
                collapsed && "md:justify-center"
              )}
            >
              <Avatar name={displayName} size={32} />
              {!collapsed && (
                <div className="min-w-0 leading-tight flex-1">
                  <p className="text-[12.5px] font-semibold truncate">{displayName}</p>
                  <p className="text-[11px] text-[var(--color-text-subtle)] truncate">{displayRole}</p>
                </div>
              )}
              {!collapsed && (
                <button
                  className="btn btn-icon btn-sm btn-ghost tip"
                  data-tip="Sign out"
                  type="button"
                  onClick={handleSignOut}
                  aria-label="Sign out"
                >
                  <LogOut size={14} />
                </button>
              )}
            </div>
            {/* The storefront is a separate app, so this is a full page load.
                Opening a tab keeps whatever the operator was doing here. */}
            <a
              href={import.meta.env.BASE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Customer portal (opens in a new tab)"
              className={cn(
                "mt-2 flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2 text-[12px] text-[var(--color-text-subtle)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] transition-colors",
                collapsed && "justify-center"
              )}
            >
              <Store size={16} />
              {!collapsed && <span>Customer portal</span>}
              {!collapsed && <ExternalLink size={12} className="ml-auto opacity-60" aria-hidden />}
            </a>
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className={cn(
                "mt-2 hidden md:flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2 text-[12px] text-[var(--color-text-subtle)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] transition-colors",
                collapsed && "justify-center"
              )}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
              {!collapsed && <span>Collapse</span>}
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 h-16 overflow-x-clip border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_85%,transparent)] backdrop-blur-md">
          <div className="h-full px-4 md:px-8 flex items-center gap-3 md:gap-5">
            <button
              type="button"
              className="md:hidden btn btn-icon btn-sm btn-ghost"
              onClick={() => setMobileOpen((m) => !m)}
              aria-label="Open menu"
            >
              <Menu size={16} />
            </button>

            <div className="min-w-0 flex-1 flex items-center gap-4">
              <div className="hidden lg:block min-w-0">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-subtle)]">
                  {ctx.eyebrow}
                </p>
                <h1 className="text-[15px] font-semibold tracking-tight truncate">{ctx.title}</h1>
              </div>

              <button
                type="button"
                onClick={() => setCommandOpen(true)}
                aria-label="Open AI command bar"
                className="relative flex-1 min-w-0 max-w-md ml-auto lg:ml-0 h-9 px-3 pr-14 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)] transition-colors text-left inline-flex items-center gap-2.5 group"
              >
                <Sparkles size={13} className="text-[var(--color-accent-violet)] shrink-0" />
                <span className="text-[12.5px] text-[var(--color-text-subtle)] truncate group-hover:text-[var(--color-text-muted)]">
                  Ask AI · "show low stock", "draft replies", "open orders"…
                </span>
                <kbd className="hidden md:inline-flex absolute right-2 top-1/2 -translate-y-1/2 items-center gap-1 px-1.5 py-0.5 rounded-md text-[10.5px] font-medium text-[var(--color-text-subtle)] bg-[var(--color-surface-2)] border border-[var(--color-border)]">
                  ⌘K
                </kbd>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <a
                href={import.meta.env.BASE_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Customer portal (opens in a new tab)"
                className="btn btn-sm btn-ghost hidden md:inline-flex"
              >
                <Store size={14} /> Customer portal
                <ExternalLink size={12} className="opacity-60" aria-hidden />
              </a>
              <button
                type="button"
                onClick={toggle}
                className="btn btn-icon btn-sm btn-ghost tip"
                data-tip={theme === "light" ? "Dark mode" : "Light mode"}
                aria-label="Toggle theme"
              >
                {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
              </button>
              <NotificationsMenu counts={counts.data} />
              <div className="hidden sm:flex items-center pl-2 ml-1 border-l border-[var(--color-border)]">
                <Avatar name={displayName} size={30} />
              </div>
            </div>
          </div>
        </header>

        <main id="main" tabIndex={-1} className="flex-1 px-4 md:px-8 py-6 md:py-8 max-w-[1440px] w-full mx-auto outline-none">
          <Suspense fallback={<Skeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <AiCommandBar open={commandOpen} onClose={() => setCommandOpen(false)} />
      <DemoBadge />
    </div>
  );
}
