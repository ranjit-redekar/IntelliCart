import { Globe2 } from "lucide-react";
import AiFeatureLayout from "../../components/AiFeatureLayout";
import { Card, CardHeader } from "../../components/ui/Card";
import { Chip } from "../../components/ui/StatusChip";
import { useCopilot } from "../../lib/useCopilot";
import { CopilotState } from "../../components/CopilotState";

const langs = ["en", "es", "fr", "de", "ja"] as const;
type Lang = (typeof langs)[number];

const toneFor = (status: string): "success" | "pending" | "danger" =>
  status === "done" ? "success" : status === "pending" ? "pending" : "danger";

export default function LocalizationAgentPage() {
  const { data: aiLocalization, source, generatedAt, loading, error, reload } =
    useCopilot("localization-agent");


  if (!aiLocalization) return <CopilotState loading={loading} error={error} onRetry={reload} />;

  return (
    <AiFeatureLayout
      title="Localization Agent"
      subtitle="Bulk-translate listings and adapt unit / currency formatting per region."
      icon={Globe2}
      tone="var(--color-accent-sky)"
    >
      <CopilotState.Badge source={source} generatedAt={generatedAt} />
      <Card padded={false}>
        <div className="p-5 pb-3">
          <CardHeader
            title="Translation coverage"
            subtitle="Per-SKU language status"
            eyebrow="Localization AI"
            className="mb-0"
            action={<button type="button" className="btn btn-primary btn-sm">Translate missing</button>}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[11.5px] uppercase tracking-[0.08em] text-subtle">
                <th className="text-left px-5 py-2 font-semibold">SKU</th>
                <th className="text-left px-5 py-2 font-semibold">Product</th>
                {langs.map((l) => (
                  <th key={l} className="text-center px-3 py-2 font-semibold">{l.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {aiLocalization.map((r) => (
                <tr key={r.sku} className="border-t border-[var(--color-border)]">
                  <td className="px-5 py-3 tabular-nums text-subtle">{r.sku}</td>
                  <td className="px-5 py-3 font-medium">{r.name}</td>
                  {langs.map((l) => {
                    const status = (r.langs as Record<Lang, string>)[l];
                    return (
                      <td key={l} className="px-3 py-3 text-center">
                        <Chip tone={toneFor(status)} className="capitalize">{status}</Chip>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AiFeatureLayout>
  );
}
