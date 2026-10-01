import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CircleDollarSign,
  ShoppingBag,
  TrendingDown,
  Users,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { Sparkline } from "../components/ui/Sparkline";
import { StatusChip } from "../components/ui/StatusChip";
import { Avatar } from "../components/ui/Avatar";
import AiInsights from "../components/AiInsights";
import {
  DateRangePicker,
  getPresetRange,
  type DateRange,
} from "../components/DateRangePicker";
import { api, qs, type Page } from "../../lib/api";
import { useApi } from "../../lib/useApi";
import { ErrorState } from "../../lib/AsyncBoundary";
import type { Order } from "../types";

interface MetricOut {
  id: string;
  label: string;
  value: number;
  unit: "currency" | "count";
  trendPct: number | null;
}
interface RevenuePoint { d: string; revenue: number; orders: number }
interface TopProduct { productId: string | null; name: string; sold: number; revenue: number; sharePct: number }
interface CategorySlice { categoryId: string; name: string; revenue: number; sharePct: number }

const RECENT_ORDERS_LIMIT = 5;

const metricIcons = [CircleDollarSign, ShoppingBag, Users, TrendingDown, Wallet, Activity] as const;
const metricColors = [
  "var(--color-brand-500)",
  "var(--color-accent-violet)",
  "var(--color-accent-sky)",
  "var(--color-accent-mint)",
  "var(--color-accent-amber)",
  "var(--color-accent-rose)",
];

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-pop)] px-3 py-2 text-[12px]">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-[var(--color-text-muted)]">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="capitalize">{p.dataKey}</span>
          <span className="ml-auto font-medium text-[var(--color-text)]">
            {p.dataKey === "revenue" ? `$${p.value.toLocaleString()}` : p.value}
          </span>
        </p>
      ))}
    </div>
  );
}

const CATEGORY_COLORS = [
  "var(--color-brand-500)",
  "var(--color-accent-violet)",
  "var(--color-accent-mint)",
  "var(--color-accent-amber)",
];

/** Map the picker's date span onto the ranges the API aggregates. */
function rangeKey(range: DateRange): "7d" | "30d" | "90d" | "365d" {
  const days = Math.round((range.to.getTime() - range.from.getTime()) / 86_400_000);
  if (days <= 7) return "7d";
  if (days <= 30) return "30d";
  if (days <= 90) return "90d";
  return "365d";
}

export default function DashboardPage() {
  const [range, setRange] = useState<DateRange>(() => getPresetRange("last7"));
  const key = rangeKey(range);
  // The API buckets to 7/30/90/365 days, so labels follow the bucket, not the raw picker span.
  const days = Number.parseInt(key, 10);

  // Six hardcoded const arrays used to live here, and "today" was pinned to
  // 2026-05-19 so the picker lined up with the fixtures. These are queries now,
  // which is what makes the date range mean anything.
  const metricState = useApi(
    () => api.get<{ metrics: MetricOut[] }>(`/admin/analytics/metrics${qs({ range: key })}`),
    [key],
  );
  const revenueState = useApi(
    () => api.get<{ points: RevenuePoint[] }>(`/admin/analytics/revenue-series${qs({ range: key })}`),
    [key],
  );
  const topState = useApi(
    () => api.get<{ items: TopProduct[] }>(`/admin/analytics/top-products${qs({ range: key })}`),
    [key],
  );
  const shareState = useApi(
    () => api.get<{ items: CategorySlice[] }>(`/admin/analytics/category-share${qs({ range: key })}`),
    [key],
  );
  const ordersState = useApi(
    () => api.get<Page<Order>>(`/admin/orders${qs({ pageSize: RECENT_ORDERS_LIMIT })}`),
    [key],
  );
  const countsState = useApi(
    () => api.get<{ lowStock: number; pendingOrders: number; newFeedback: number }>(
      "/admin/analytics/counts",
    ),
    [],
  );

  const metrics = metricState.data?.metrics ?? [];
  const revenueSeries = revenueState.data?.points ?? [];
  const topProducts = (topState.data?.items ?? []).map((t) => ({
    name: t.name, sold: t.sold, revenue: t.revenue, share: Math.round(t.sharePct),
  }));
  const categoryShare = (shareState.data?.items ?? []).map((c, i) => ({
    name: c.name,
    value: Math.round(c.sharePct),
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));
  const recentOrders = ordersState.data?.items ?? [];

  if (metricState.error) {
    return <ErrorState error={metricState.error} onRetry={metricState.reload} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI-first commerce"
        title="Welcome back"
        description="Your store, with AI on every screen. Press ⌘K anywhere to ask, navigate, or act."
        actions={<DateRangePicker value={range} onChange={setRange} />}
      />

      <AiInsights />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 fade-up-stagger">
        {metrics.map((metric, idx) => {
          const Icon = metricIcons[idx];
          // Numbers now, formatted here. The fixtures carried strings like
          // "$48,290" and "+12.4%", which cannot be charted or compared.
          const isNegative = (metric.trendPct ?? 0) < 0;
          const formatted =
            metric.unit === "currency"
              ? `$${metric.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
              : metric.value.toLocaleString();
          const trendLabel =
            metric.trendPct == null ? "—" : `${Math.abs(metric.trendPct).toFixed(1)}%`;
          return (
            <Card key={metric.id} interactive className="!p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-9 h-9 rounded-[10px] flex items-center justify-center"
                    style={{
                      background: `color-mix(in oklab, ${metricColors[idx]} 14%, transparent)`,
                      color: metricColors[idx],
                    }}
                  >
                    <Icon size={16} />
                  </span>
                  <span className="text-[13px] text-muted">{metric.label}</span>
                </div>
                <span
                  className={`inline-flex items-center gap-0.5 text-[11.5px] font-semibold px-1.5 py-0.5 rounded-md ${
                    isNegative
                      ? "text-[var(--color-accent-rose)] bg-[color-mix(in_oklab,var(--color-accent-rose)_12%,transparent)]"
                      : "text-[var(--color-success-text)] bg-[color-mix(in_oklab,var(--color-accent-mint)_12%,transparent)]"
                  }`}
                >
                  {isNegative ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                  {trendLabel}
                </span>
              </div>
              <p className="mt-3 text-[28px] font-semibold tracking-[-0.02em] leading-none">{formatted}</p>
              <p className="mt-1 text-[12px] text-subtle">vs previous {days} days</p>
              <div className="mt-3 -mx-1">
                <Sparkline
                  data={revenueSeries.map((pt) => (metric.unit === "currency" ? pt.revenue : pt.orders))}
                  color={metricColors[idx]}
                />
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 fade-up">
          <CardHeader
            title="Revenue performance"
            subtitle={`Last ${days} days`}
            eyebrow="Trends"
            action={
              <div className="flex items-center gap-2 text-[12px]">
                <span className="flex items-center gap-1.5 text-muted">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-brand-500)]" /> Revenue
                </span>
                <span className="flex items-center gap-1.5 text-muted">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-accent-violet)]" /> Orders
                </span>
              </div>
            }
          />
          <div className="h-[280px] -mx-2">
            <ResponsiveContainer>
              <AreaChart data={revenueSeries} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad-rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="grad-ord" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-accent-violet)" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="var(--color-accent-violet)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="d" tickLine={false} axisLine={false} tick={{ fill: "var(--color-text-subtle)", fontSize: 12 }} />
                <YAxis
                  yAxisId="revenue"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--color-text-subtle)", fontSize: 12 }}
                  width={56}
                  tickFormatter={(v: number) => `$${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
                />
                {/* Orders get their own scale; on the revenue axis they'd flatline near zero. */}
                <YAxis
                  yAxisId="orders"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  tick={{ fill: "var(--color-text-subtle)", fontSize: 12 }}
                  width={32}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--color-border-strong)", strokeDasharray: "2 4" }} />
                <Area yAxisId="revenue" type="monotone" dataKey="revenue" stroke="var(--color-brand-500)" strokeWidth={2} fill="url(#grad-rev)" />
                <Area yAxisId="orders" type="monotone" dataKey="orders" stroke="var(--color-accent-violet)" strokeWidth={2} fill="url(#grad-ord)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="fade-up">
          <CardHeader title="Top products" subtitle={`By revenue · last ${days} days`} eyebrow="Catalog" />
          <ul className="space-y-3">
            {topProducts.map((p, i) => (
              <li key={p.name} className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-md soft-surface flex items-center justify-center text-[12px] font-semibold text-muted shrink-0">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[13px] font-medium truncate">{p.name}</p>
                    <p className="text-[12.5px] font-semibold tabular-nums">${p.revenue.toLocaleString()}</p>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-[var(--color-surface-3)] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${p.share}%`,
                          background: "linear-gradient(90deg, var(--color-brand-500), var(--color-accent-violet))",
                        }}
                      />
                    </div>
                    <span className="text-[11px] text-subtle tabular-nums w-12 text-right">{p.sold} sold</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 !p-0 fade-up">
          <div className="p-5 pb-3">
            <CardHeader
              title="Recent orders"
              subtitle={
                recentOrders.length === 0
                  ? "No orders yet"
                  : `Latest ${recentOrders.length} order${recentOrders.length === 1 ? "" : "s"}`
              }
              eyebrow="Pipeline"
              action={
                <Link to="/orders" className="btn btn-ghost btn-sm">
                  View all
                </Link>
              }
              className="mb-0"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="text-left text-[11.5px] uppercase tracking-[0.08em] text-subtle border-y border-[var(--color-border)]">
                  <th className="px-5 py-2.5 font-semibold">Order</th>
                  <th className="px-5 py-2.5 font-semibold">Customer</th>
                  <th className="px-5 py-2.5 font-semibold">Placed</th>
                  <th className="px-5 py-2.5 font-semibold">Status</th>
                  <th className="px-5 py-2.5 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)] transition-colors"
                  >
                    <td className="px-5 py-3 font-semibold tabular-nums">
                      <Link
                        to={`/orders/${order.id}`}
                        className="hover:text-[var(--color-brand-600)]"
                      >
                        {order.id}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={order.customerName} size={28} />
                        <span className="truncate">{order.customerName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted">{order.placedAt}</td>
                    <td className="px-5 py-3">
                      <StatusChip status={order.status} />
                    </td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums">${order.total}</td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-muted text-[13px]">
                      No orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="fade-up">
          <CardHeader title="Category mix" subtitle={`Revenue share · last ${days} days`} eyebrow="Breakdown" />
          <div className="h-[160px] -mx-2">
            <ResponsiveContainer>
              <BarChart data={categoryShare} layout="vertical" margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
                  width={88}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-surface-2)" }} />
                <Bar dataKey="value" radius={[6, 6, 6, 6]} barSize={14}>
                  {categoryShare.map((c) => (
                    <Cell key={c.name} fill={c.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 pt-3 border-t border-[var(--color-border)] grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] text-subtle uppercase tracking-[0.08em]">Low stock</p>
              <p className="text-[20px] font-semibold tracking-tight mt-0.5">
                {countsState.data ? countsState.data.lowStock : "—"}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-subtle uppercase tracking-[0.08em]">Pending orders</p>
              <p className="text-[20px] font-semibold tracking-tight mt-0.5">
                {countsState.data ? countsState.data.pendingOrders : "—"}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
