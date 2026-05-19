import { Link, NavLink, Outlet } from "react-router-dom";
import { Moon, Search, ShoppingBag, Sun, User } from "lucide-react";
import { useTheme } from "../lib/theme";
import { useCart } from "../lib/cart";
import { useSession } from "../lib/session";
import { promotions } from "../mockdata";
import AiAssistant from "./AiAssistant";
import { cn } from "../lib/cn";

const navItems = [
  { to: "/", label: "Home", end: true },
  { to: "/shop", label: "Shop" },
  { to: "/about", label: "About" },
];

export default function StorefrontShell() {
  const { theme, toggle } = useTheme();
  const { count } = useCart();
  const { user } = useSession();
  const sitePromo = promotions.find(
    (p) => p.status === "active" && (p.audience === "all" || p.audience === "web")
  );

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
      {sitePromo && (
        <div
          className="text-white text-[12.5px] font-medium text-center px-4 py-2"
          style={{ background: "var(--color-text)" }}
        >
          <span className="opacity-90">{sitePromo.title}</span>
          {sitePromo.ctaUrl && (
            <Link
              to={sitePromo.ctaUrl}
              className="ml-2 underline underline-offset-2 hover:opacity-100 opacity-80"
            >
              {sitePromo.ctaText ?? "Learn more"}
            </Link>
          )}
        </div>
      )}

      <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_85%,transparent)] backdrop-blur-md">
        <div className="max-w-[1280px] mx-auto h-16 px-4 md:px-8 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span
              className="w-8 h-8 rounded-[10px] flex items-center justify-center text-white text-sm font-bold shadow-sm"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-brand-500), var(--color-accent-violet))",
              }}
            >
              A
            </span>
            <span className="font-semibold tracking-tight">IntelliCart</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 ml-2">
            {navItems.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  cn(
                    "px-3 py-2 text-[13.5px] font-medium rounded-[10px] transition-colors",
                    isActive
                      ? "bg-[var(--color-surface-2)] text-[var(--color-text)]"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"
                  )
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <NavLink
              to="/shop"
              className="btn btn-icon btn-sm btn-ghost"
              aria-label="Search"
            >
              <Search size={15} />
            </NavLink>
            <button
              type="button"
              onClick={toggle}
              className="btn btn-icon btn-sm btn-ghost"
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
            </button>
            <NavLink
              to={user ? "/account" : "/sign-in"}
              className="btn btn-icon btn-sm btn-ghost"
              aria-label="Account"
            >
              <User size={15} />
            </NavLink>
            <NavLink
              to="/cart"
              className="btn btn-icon btn-sm btn-ghost relative"
              aria-label="Cart"
            >
              <ShoppingBag size={15} />
              {count > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-semibold text-white inline-flex items-center justify-center"
                  style={{ background: "var(--color-brand-500)" }}
                >
                  {count}
                </span>
              )}
            </NavLink>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 md:px-8 py-8">
        <Outlet />
      </main>

      <AiAssistant />

      <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <span
                className="w-8 h-8 rounded-[10px] flex items-center justify-center text-white text-sm font-bold shadow-sm"
                style={{
                  background:
                    "linear-gradient(135deg, var(--color-brand-500), var(--color-accent-violet))",
                }}
              >
                A
              </span>
              <span className="font-semibold tracking-tight">IntelliCart</span>
            </div>
            <p className="text-[13px] text-muted max-w-sm">
              Quiet essentials, made well. Designed in Mumbai, shipped worldwide.
            </p>
          </div>
          <div>
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-subtle mb-3">
              Shop
            </p>
            <ul className="space-y-2 text-[13px]">
              <li>
                <Link to="/shop" className="text-muted hover:text-[var(--color-text)]">
                  All products
                </Link>
              </li>
              <li>
                <Link to="/shop?cat=fashion" className="text-muted hover:text-[var(--color-text)]">
                  Fashion
                </Link>
              </li>
              <li>
                <Link to="/shop?cat=electronics" className="text-muted hover:text-[var(--color-text)]">
                  Electronics
                </Link>
              </li>
              <li>
                <Link to="/shop?cat=home" className="text-muted hover:text-[var(--color-text)]">
                  Home
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-subtle mb-3">
              Help
            </p>
            <ul className="space-y-2 text-[13px]">
              <li>
                <Link to="/account" className="text-muted hover:text-[var(--color-text)]">
                  Account
                </Link>
              </li>
              <li>
                <Link to="/account/orders" className="text-muted hover:text-[var(--color-text)]">
                  Orders
                </Link>
              </li>
              <li>
                <a className="text-muted hover:text-[var(--color-text)]" href="#">
                  Returns
                </a>
              </li>
              <li>
                <a className="text-muted hover:text-[var(--color-text)]" href="#">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[var(--color-border)] py-4 text-center text-[11.5px] text-subtle">
          © {new Date().getFullYear()} IntelliCart Retail Pvt. Ltd.
        </div>
      </footer>
    </div>
  );
}
