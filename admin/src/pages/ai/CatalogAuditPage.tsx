import { ClipboardCheck, FileWarning } from "lucide-react";
import AiFeatureLayout from "../../components/AiFeatureLayout";
import { Card, CardHeader } from "../../components/ui/Card";
import { aiCatalogAudit } from "../../mock-ai";

export default function CatalogAuditPage() {
  return (
    <AiFeatureLayout
      title="Catalog Auditor"
      subtitle="Scan listings for missing fields, weak titles, duplicates, broken images, and missing translations."
      icon={ClipboardCheck}
      tone="var(--color-accent-sky)"
    >
      <Card padded={false}>
        <div className="p-5 pb-3">
          <CardHeader
            title="Catalog issues"
            subtitle="Ranked punch list · auto-discovered"
            eyebrow="Catalog AI"
            className="mb-0"
            action={<button type="button" className="btn btn-primary btn-sm">Fix with AI</button>}
          />
        </div>
        <div className="px-5 pb-5 space-y-3">
          {aiCatalogAudit.map((c) => (
            <div key={c.sku} className="soft-surface p-4 flex flex-col md:flex-row md:items-start gap-4">
              <span
                className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
                style={{ background: "color-mix(in oklab, var(--color-accent-sky) 14%, transparent)", color: "var(--color-accent-sky)" }}
              >
                <FileWarning size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[11.5px] text-subtle font-semibold tabular-nums">{c.sku}</p>
                  <p className="text-[14.5px] font-semibold tracking-tight">{c.name}</p>
                </div>
                <ul className="mt-2 space-y-1 text-[12.5px]">
                  {c.issues.map((i) => (
                    <li key={i} className="text-muted">• {i}</li>
                  ))}
                </ul>
              </div>
              <button type="button" className="btn btn-soft btn-sm shrink-0">Open</button>
            </div>
          ))}
        </div>
      </Card>
    </AiFeatureLayout>
  );
}
