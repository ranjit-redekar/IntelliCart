import { Navigate, NavLink, Outlet, useLocation } from "react-router-dom";
import { Heart, KeyRound, LogOut, MapPin, MessageSquare, Package, User } from "lucide-react";
import { Avatar } from "../components/ui/Avatar";
import { useSession } from "../lib/session";
import { cn } from "../lib/cn";

const tabs = [
  { to: "/account", label: "Overview", icon: User, end: true },
  { to: "/account/orders", label: "Orders", icon: Package },
  { to: "/account/wishlist", label: "Wishlist", icon: Heart },
  { to: "/account/addresses", label: "Addresses", icon: MapPin },
  { to: "/account/reviews", label: "Reviews", icon: MessageSquare },
  { to: "/account/security", label: "Security", icon: KeyRound },
];

export default function AccountLayout() {
  const { user, signOut } = useSession();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/sign-in" state={{ from: location.pathname }} replace />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} size={64} />
          <div>
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-subtle">
              Welcome back
            </p>
            <h1 className="font-display text-[28px] md:text-[32px] tracking-tight font-semibold mt-0.5">
              {user.name}
            </h1>
            <p className="text-[13px] text-muted">{user.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="btn btn-ghost btn-sm self-start md:self-end"
        >
          <LogOut size={14} /> Sign out
        </button>
      </div>

      <nav className="flex items-center gap-1 overflow-x-auto border-b border-[var(--color-border)]">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                cn(
                  "inline-flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-medium border-b-2 transition-colors -mb-px whitespace-nowrap",
                  isActive
                    ? "border-[var(--color-text)] text-[var(--color-text)]"
                    : "border-transparent text-muted hover:text-[var(--color-text)]"
                )
              }
            >
              <Icon size={14} /> {t.label}
            </NavLink>
          );
        })}
      </nav>

      <Outlet />
    </div>
  );
}
