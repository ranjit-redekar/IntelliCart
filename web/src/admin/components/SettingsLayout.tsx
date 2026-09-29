import type { LucideIcon } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tone?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export default function SettingsLayout({
  title,
  subtitle,
  icon: Icon,
  tone = "var(--color-brand-500)",
  actions,
  children,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 fade-up">
        <Link
          to="/settings"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted hover:text-[var(--color-text)] transition-colors w-fit"
        >
          <ArrowLeft size={14} /> Back to settings
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <span
              className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0"
              style={{ background: `color-mix(in oklab, ${tone} 14%, transparent)`, color: tone }}
            >
              <Icon size={20} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">
                Settings
              </p>
              <h2 className="text-[24px] md:text-[28px] font-semibold tracking-[-0.02em] leading-tight">{title}</h2>
              <p className="text-[13.5px] text-muted mt-1 max-w-2xl">{subtitle}</p>
            </div>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
        </div>
      </div>
      <div className="space-y-4 fade-up-stagger">{children}</div>
    </div>
  );
}
