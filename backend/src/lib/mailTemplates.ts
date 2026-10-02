/**
 * Pure renderers: data in, { subject, text, html } out. No DB, no env, so the
 * selfcheck can import them. Every interpolated value in HTML goes through esc().
 */
import { formatUnits } from "./money.js";

export function escapeHtml(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
const esc = escapeHtml;

export type MailOrder = {
  id: string;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  shipName: string;
  shipLine1: string;
  shipCity: string;
  shipPostal: string;
  shipCountry: string;
  items: { name: string; qty: number; unitPriceCents: number }[];
};
export type Rendered = { subject: string; text: string; html: string };

const layout = (name: string, body: string) =>
  `<!doctype html><html><body style="font-family:system-ui,sans-serif;color:#111;max-width:560px;margin:auto">` +
  `<p>Hi ${esc(name)},</p>${body}<p style="color:#666;font-size:12px">IntelliCart</p></body></html>`;

const itemsText = (o: MailOrder) =>
  o.items.map((i) => `  ${i.qty} x ${i.name} — ${formatUnits(i.qty * i.unitPriceCents)}`).join("\n");

const itemsHtml = (o: MailOrder) =>
  `<table cellpadding="4" style="border-collapse:collapse;width:100%">` +
  o.items.map((i) =>
    `<tr><td>${esc(i.qty)} &times; ${esc(i.name)}</td><td align="right">${esc(formatUnits(i.qty * i.unitPriceCents))}</td></tr>`,
  ).join("") +
  `</table>`;

const address = (o: MailOrder) => [o.shipName, o.shipLine1, `${o.shipCity} ${o.shipPostal}`, o.shipCountry];

export function orderConfirmation(name: string, o: MailOrder): Rendered {
  const totals: [string, number][] = [
    ["Subtotal", o.subtotalCents], ["Shipping", o.shippingCents], ["Tax", o.taxCents], ["Total", o.totalCents],
  ];
  return {
    subject: `Order ${o.id} confirmed`,
    text:
      `Hi ${name},\n\nThanks for your order ${o.id}.\n\n${itemsText(o)}\n\n` +
      totals.map(([k, v]) => `${k}: ${formatUnits(v)}`).join("\n") +
      `\n\nShipping to:\n${address(o).join("\n")}\n`,
    html: layout(name,
      `<p>Thanks for your order <strong>${esc(o.id)}</strong>.</p>${itemsHtml(o)}` +
      `<table cellpadding="2" style="margin-left:auto">` +
      totals.map(([k, v]) => `<tr><td>${esc(k)}</td><td align="right">${esc(formatUnits(v))}</td></tr>`).join("") +
      `</table><p><strong>Shipping to</strong><br>${address(o).map(esc).join("<br>")}</p>`),
  };
}

export function orderShipped(name: string, o: MailOrder): Rendered {
  return {
    subject: `Order ${o.id} is on its way`,
    text: `Hi ${name},\n\nGood news: order ${o.id} is on its way.\n\n${itemsText(o)}\n\nShipping to:\n${address(o).join("\n")}\n`,
    html: layout(name,
      `<p>Good news: order <strong>${esc(o.id)}</strong> is on its way.</p>${itemsHtml(o)}` +
      `<p><strong>Shipping to</strong><br>${address(o).map(esc).join("<br>")}</p>`),
  };
}

export function customerMessage(name: string, subject: string, body: string, orderId?: string): Rendered {
  const ref = orderId ? `Re: order ${orderId}` : "";
  return {
    subject: orderId ? `${subject} [${orderId}]` : subject,
    text: `Hi ${name},\n\n${body}\n${ref ? `\n${ref}\n` : ""}`,
    // Admin-written plain text: escaped, newlines kept via pre-wrap. Never HTML.
    html: layout(name,
      `<div style="white-space:pre-wrap">${esc(body)}</div>` +
      (ref ? `<p style="color:#666">${esc(ref)}</p>` : "")),
  };
}
