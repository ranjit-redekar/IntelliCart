import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Mail, Search, Sparkles, Users } from "lucide-react";
import { customers } from "../mockdata";
import { Card } from "../components/ui/Card";
import { Chip } from "../components/ui/StatusChip";
import { PageHeader } from "../components/ui/PageHeader";
import { Avatar } from "../components/ui/Avatar";
import { Pagination } from "../components/ui/Pagination";
import { cn } from "../lib/cn";

function tierFor(orders: number) {
  if (orders >= 12) return { label: "VIP", tone: "info" as const };
  if (orders >= 6) return { label: "Loyal", tone: "shipped" as const };
  return { label: "New", tone: "neutral" as const };
}

const segments = ["All", "VIP", "Loyal", "New"] as const;
type Segment = (typeof segments)[number];

export default function CustomersPage() {
  const navigate = useNavigate();
  const [seg, setSeg] = useState<Segment>("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(
    () =>
      customers.filter((c) => {
        const t = tierFor(c.orders).label;
        const m = seg === "All" || t === seg;
        const q =
          !query ||
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.email.toLowerCase().includes(query.toLowerCase());
        return m && q;
      }),
    [seg, query]
  );

  useEffect(() => {
    setPage(1);
  }, [seg, query, pageSize]);

  const paginated = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize]
  );

  const total = customers.length;
  const vip = customers.filter((c) => c.orders >= 12).length;
  const avgOrders = (customers.reduce((s, c) => s + c.orders, 0) / customers.length).toFixed(1);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CRM"
        title="Customers"
        description="See who is loyal, who is at risk, and who needs a nudge."
        actions={
          <button type="button" className="btn btn-primary btn-sm">
            <Sparkles size={14} /> AI segment builder
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 fade-up-stagger">
        <Card interactive>
          <div className="flex items-center gap-3">
            <span
              className="w-10 h-10 rounded-[12px] flex items-center justify-center"
              style={{ background: "color-mix(in oklab, var(--color-brand-500) 14%, transparent)", color: "var(--color-brand-600)" }}
            >
              <Users size={18} />
            </span>
            <div>
              <p className="text-[12px] text-muted">Total customers</p>
              <p className="text-[22px] font-semibold tabular-nums">{total}</p>
            </div>
          </div>
        </Card>
        <Card interactive>
          <p className="text-[12px] text-muted">VIPs</p>
          <p className="text-[22px] font-semibold tabular-nums mt-1">{vip}</p>
          <div className="mt-2 h-1.5 rounded-full bg-[var(--color-surface-3)] overflow-hidden">
            <div className="h-full rounded-full bg-[var(--color-accent-violet)]" style={{ width: `${(vip / total) * 100}%` }} />
          </div>
        </Card>
        <Card interactive>
          <p className="text-[12px] text-muted">Avg. orders per customer</p>
          <p className="text-[22px] font-semibold tabular-nums mt-1">{avgOrders}</p>
          <p className="text-[12px] text-subtle mt-1">Across active accounts</p>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3 fade-up">
        <div className="relative flex-1 max-w-xl">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none" />
          <input
            className="input pl-9 h-10"
            placeholder="Search by name or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          {segments.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSeg(s)}
              className={cn(
                "px-3 h-9 rounded-[10px] text-[13px] font-medium border whitespace-nowrap transition-colors",
                seg === s
                  ? "bg-[var(--color-text)] text-[var(--color-surface)] border-transparent"
                  : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-text)] hover:border-[var(--color-border-strong)]"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <Card padded={false} className="overflow-hidden fade-up">
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="text-left text-[11.5px] uppercase tracking-[0.08em] text-subtle border-b border-[var(--color-border)]">
                <th className="px-5 py-3 font-semibold">Customer</th>
                <th className="px-5 py-3 font-semibold">Contact</th>
                <th className="px-5 py-3 font-semibold">Orders</th>
                <th className="px-5 py-3 font-semibold">Tier</th>
                <th className="px-5 py-3 font-semibold w-12" />
              </tr>
            </thead>
            <tbody>
              {paginated.map((c) => {
                const tier = tierFor(c.orders);
                const loyalty = Math.min(100, (c.orders / 15) * 100);
                return (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/customers/${c.id}`)}
                    className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.name} size={38} />
                        <div className="min-w-0">
                          <Link
                            to={`/customers/${c.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-semibold truncate hover:text-[var(--color-brand-600)]"
                          >
                            {c.name}
                          </Link>
                          <p className="text-[11.5px] text-subtle">{c.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 text-muted">
                        <Mail size={13} />
                        <span className="truncate">{c.email}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 w-44">
                        <span className="tabular-nums font-semibold w-6">{c.orders}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-[var(--color-surface-3)] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${loyalty}%`,
                              background: "linear-gradient(90deg, var(--color-brand-500), var(--color-accent-violet))",
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Chip tone={tier.tone}>{tier.label}</Chip>
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        to={`/customers/${c.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="btn btn-icon btn-sm btn-ghost"
                        aria-label="View customer"
                      >
                        <ArrowRight size={14} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-muted">
                    No customers in this segment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="border-t border-[var(--color-border)]">
            <Pagination
              page={page}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
