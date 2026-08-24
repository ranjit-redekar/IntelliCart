import { AlertTriangle, ArchiveX, Boxes, Package, ShoppingCart } from "lucide-react";
import AiFeatureLayout from "../../components/AiFeatureLayout";
import { Card, CardHeader } from "../../components/ui/Card";
import { Chip } from "../../components/ui/StatusChip";
import { aiInventoryReorder } from "../../mock-ai";

export default function InventoryAgentPage() {
  return (
    <AiFeatureLayout
      title="Inventory & Reorder Agent"
      subtitle="Per-SKU stockout risk and dead-stock detection — with one-tap PO drafts and markdown suggestions."
      icon={Boxes}
      tone="var(--color-accent-amber)"
    >
      <Card padded={false}>
        <div className="p-5 pb-3">
          <CardHeader
            title="Reorder now"
            subtitle="Days-of-cover under 14 · sorted by severity"
            eyebrow={<span className="inline-flex items-center gap-1"><AlertTriangle size={11} className="text-[var(--color-accent-amber)]" /> Action</span>}
            className="mb-0"
            action={<button type="button" className="btn btn-primary btn-sm">Draft all POs</button>}
          />
        </div>
        <div className="px-5 pb-5 space-y-3">
          {aiInventoryReorder.reorder.map((r) => (
            <div key={r.sku} className="soft-surface p-4 flex flex-wrap items-center gap-4">
              <span
                className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
                style={{ background: "color-mix(in oklab, var(--color-accent-amber) 14%, transparent)", color: "var(--color-accent-amber)" }}
              >
                <Package size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11.5px] text-subtle font-semibold tabular-nums">{r.sku}</p>
                <p className="text-[14.5px] font-semibold tracking-tight truncate">{r.name}</p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-[10.5px] text-subtle uppercase tracking-[0.08em]">Stock</p>
                  <p className="text-[14px] font-semibold tabular-nums">{r.stock}</p>
                </div>
                <div>
                  <p className="text-[10.5px] text-subtle uppercase tracking-[0.08em]">Cover</p>
                  <p className="text-[14px] font-semibold tabular-nums">{r.daysCover}d</p>
                </div>
                <div>
                  <p className="text-[10.5px] text-subtle uppercase tracking-[0.08em]">Reorder</p>
                  <p className="text-[14px] font-semibold tabular-nums">{r.suggestQty}</p>
                </div>
              </div>
              <Chip tone={r.severity === "critical" ? "danger" : "pending"}>{r.severity}</Chip>
              <button type="button" className="btn btn-soft btn-sm">
                <ShoppingCart size={13} /> Draft PO
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card padded={false}>
        <div className="p-5 pb-3">
          <CardHeader
            title="Slow-movers"
            subtitle="Tying up cash · consider markdown or bundle"
            eyebrow={<span className="inline-flex items-center gap-1"><ArchiveX size={11} className="text-subtle" /> Optimize</span>}
            className="mb-0"
          />
        </div>
        <div className="px-5 pb-5 space-y-3">
          {aiInventoryReorder.slowMovers.map((s) => (
            <div key={s.sku} className="soft-surface p-4 flex flex-wrap items-center gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-[11.5px] text-subtle font-semibold tabular-nums">{s.sku}</p>
                <p className="text-[14.5px] font-semibold tracking-tight truncate">{s.name}</p>
                <p className="text-[12.5px] text-muted mt-1">{s.suggestion}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <p className="text-[10.5px] text-subtle uppercase tracking-[0.08em]">Stock</p>
                  <p className="text-[14px] font-semibold tabular-nums">{s.stock}</p>
                </div>
                <div>
                  <p className="text-[10.5px] text-subtle uppercase tracking-[0.08em]">Cover</p>
                  <p className="text-[14px] font-semibold tabular-nums">{s.daysCover}d</p>
                </div>
              </div>
              <button type="button" className="btn btn-soft btn-sm">Apply</button>
            </div>
          ))}
        </div>
      </Card>
    </AiFeatureLayout>
  );
}
