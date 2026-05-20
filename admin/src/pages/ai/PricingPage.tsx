import { ArrowDownRight, ArrowUpRight, CircleDollarSign } from "lucide-react";
import AiFeatureLayout from "../../components/AiFeatureLayout";
import { Card, CardHeader } from "../../components/ui/Card";
import { Chip } from "../../components/ui/StatusChip";
import { aiPricing } from "../../mock-ai";

export default function PricingPage() {
  return (
    <AiFeatureLayout
      title="Pricing Agent"
      subtitle="Per-SKU price recommendations from elasticity signals — with margin guardrails and rollback windows."
      icon={CircleDollarSign}
      tone="var(--color-brand-600)"
    >
      <Card padded={false}>
        <div className="p-5 pb-3">
          <CardHeader
            title="Recommended price moves"
            subtitle="Ranked by projected monthly revenue delta"
            eyebrow="Pricing AI"
            className="mb-0"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[11.5px] uppercase tracking-[0.08em] text-subtle">
                <th className="text-left px-5 py-2 font-semibold">SKU</th>
                <th className="text-left px-5 py-2 font-semibold">Product</th>
                <th className="text-right px-5 py-2 font-semibold">Current</th>
                <th className="text-right px-5 py-2 font-semibold">Recommended</th>
                <th className="text-right px-5 py-2 font-semibold">Δ Revenue</th>
                <th className="text-left px-5 py-2 font-semibold">Confidence</th>
                <th className="text-right px-5 py-2 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {aiPricing.map((p) => {
                const up = p.action === "increase";
                return (
                  <tr key={p.sku} className="border-t border-[var(--color-border)]">
                    <td className="px-5 py-3 tabular-nums text-subtle">{p.sku}</td>
                    <td className="px-5 py-3 font-medium">{p.name}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{p.current}</td>
                    <td className="px-5 py-3 text-right tabular-nums font-semibold">
                      <span className="inline-flex items-center gap-1" style={{ color: up ? "var(--color-accent-mint)" : "var(--color-accent-amber)" }}>
                        {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                        {p.recommended}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-[var(--color-accent-mint)]">{p.deltaRev}</td>
                    <td className="px-5 py-3"><Chip tone={p.confidence === "High" ? "success" : "info"}>{p.confidence}</Chip></td>
                    <td className="px-5 py-3 text-right">
                      <button type="button" className="btn btn-soft btn-sm">Apply</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </AiFeatureLayout>
  );
}
