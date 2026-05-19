import type { OrderStatus } from "../../types";
import { cn } from "../../lib/cn";

const map: Record<OrderStatus, string> = {
  pending: "chip-pending",
  processing: "chip-processing",
  shipped: "chip-shipped",
  delivered: "chip-delivered",
};

export function StatusChip({ status, className }: { status: OrderStatus; className?: string }) {
  return <span className={cn("chip", map[status], "capitalize", className)}>{status}</span>;
}

export function Chip({
  tone = "neutral",
  children,
  className,
}: {
  tone?: "neutral" | "success" | "danger" | "info" | "pending" | "processing" | "shipped" | "delivered";
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={cn("chip", `chip-${tone}`, className)}>{children}</span>;
}
