import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../env.js";

const FROM = env.MAIL_FROM;

let transport: Transporter | undefined;

export type Mail = { to: string; subject: string; text: string; html: string };

/** Sends via SMTP_URL. Unset => logs and returns, so dev without SMTP still works. */
export async function sendMail(mail: Mail) {
  if (!env.SMTP_URL) {
    console.log(JSON.stringify({ at: new Date().toISOString(), msg: "email.skipped", reason: "SMTP_URL unset", to: mail.to, subject: mail.subject }));
    return;
  }
  transport ??= nodemailer.createTransport(env.SMTP_URL);
  return transport.sendMail({ from: FROM, ...mail });
}

export function closeMail() {
  transport?.close();
  transport = undefined;
}
