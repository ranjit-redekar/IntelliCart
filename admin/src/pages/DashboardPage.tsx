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
  Download,
  Plus,
  ShoppingBag,
  TrendingDown,
  Users,
  Wallet,
} from "lucide-react";
import { customers, metrics, orders, products } from "../mockdata";
import { Card, CardHeader } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { Sparkline } from "../components/ui/Sparkline";
import { StatusChip } from "../components/ui/StatusChip";
import { Avatar } from "../components/ui/Avatar";

const metricIcons = [CircleDollarSign, ShoppingBag, Users, TrendingDown, Wallet, Activity] as const;
const metricSeries = [
  [22, 28, 24, 31, 36, 33, 39, 42, 40, 47, 52, 58],
  [40, 42, 38, 45, 48, 44, 50, 56, 60, 58, 64, 70],
  [12, 16, 14, 18, 22, 26, 24, 28, 30, 27, 33, 36],
  [8, 7, 9, 7, 8, 6, 7, 5, 6, 5, 4, 3],
  [86, 92, 90, 98, 104, 100, 108, 112, 116, 121, 119, 124],
  [2.6, 2.8, 2.7, 3.0, 3.1, 2.9, 3.2, 3.3, 3.4, 3.3, 3.5, 3.6],
];
const metricColors = [
  "var(--color-brand-500)",
  "var(--color-accent-violet)",
  "var(--color-accent-sky)",
  "var(--color-accent-mint)",
  "var(--color-accent-amber)",
  "var(--color-accent-rose)",
];

const revenueSeries = [
  { d: "Mon", revenue: 4200, orders: 22 },
  { d: "Tue", revenue: 5100, orders: 28 },
  { d: "Wed", revenue: 4800, orders: 26 },
  { d: "Thu", revenue: 6100, orders: 34 },
  { d: "Fri", revenue: 7400, orders: 41 },
  { d: "Sat", revenue: 8200, orders: 48 },
  { d: "Sun", revenue: 7600, orders: 45 },
];

const topProducts = [
  { name: "Smart Watch", sold: 184, revenue: 36616, share: 92 },
  { name: "Minimal Backpack", sold: 142, revenue: 18318, share: 71 },
  { name: "Oversized Tee", sold: 96, revenue: 3648, share: 48 },
  { name: "Ceramic Lamp", sold: 64, revenue: 4096, share: 32 },
];

const categoryShare = [
  { name: "Fashion", value: 48, color: "var(--color-brand-500)" },
  { name: "Electronics", value: 32, color: "var(--color-accent-violet)" },
  { name: "Home", value: 14, color: "var(--color-accent-mint)" },
  { name: "Other", value: 6, color: "var(--color-accent-amber)" },
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

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Welcome back, Ranjit"
        description="Here is what's happening across your store today. Live metrics update with every order."
        actions={
          <>
            <button type="button" className="btn btn-ghost btn-sm">
              <Download size={14} /> Export
            </button>
            <button type="button" className="btn btn-primary btn-sm">
              <Plus size={14} /> New product
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 fade-up-stagger">
        {metrics.map((metric, idx) => {
          const Icon = metricIcons[idx];
          const isNegative = metric.trend.trim().startsWith("-");
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
                      : "text-[var(--color-accent-mint)] bg-[color-mix(in_oklab,var(--color-accent-mint)_12%,transparent)]"
                  }`}
                >
                  {isNegative ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                  {metric.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <p className="mt-3 text-[28px] font-semibold tracking-[-0.02em] leading-none">{metric.value}</p>
              <p className="mt-1 text-[12px] text-subtle">vs last 7 days</p>
              <div className="mt-3 -mx-1">
                <Sparkline data={metricSeries[idx]} color={metricColors[idx]} />
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 fade-up">
          <CardHeader
            title="Revenue performance"
            subtitle="Last 7 days"
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
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--color-text-subtle)", fontSize: 12 }} width={40} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--color-border-strong)", strokeDasharray: "2 4" }} />
                <Area type="monotone" dataKey="revenue" stroke="var(--color-brand-500)" strokeWidth={2} fill="url(#grad-rev)" />
                <Area type="monotone" dataKey="orders" stroke="var(--color-accent-violet)" strokeWidth={2} fill="url(#grad-ord)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="fade-up">
          <CardHeader title="Top products" subtitle="By revenue this week" eyebrow="Catalog" />
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
              subtitle="Latest fulfillment activity"
              eyebrow="Pipeline"
              action={
                <a href="/orders" className="btn btn-ghost btn-sm">
                  View all
                </a>
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
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)] transition-colors"
                  >
                    <td className="px-5 py-3 font-semibold tabular-nums">{order.id}</td>
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
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="fade-up">
          <CardHeader title="Category mix" subtitle="Revenue share this month" eyebrow="Breakdown" />
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
              <p className="text-[11px] text-subtle uppercase tracking-[0.08em]">Catalog size</p>
              <p className="text-[20px] font-semibold tracking-tight mt-0.5">{products.length}</p>
            </div>
            <div>
              <p className="text-[11px] text-subtle uppercase tracking-[0.08em]">Active customers</p>
              <p className="text-[20px] font-semibold tracking-tight mt-0.5">{customers.length}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
