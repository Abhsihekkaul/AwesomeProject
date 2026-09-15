import nodemailer from "nodemailer";
import { env } from "../config/env";

/**
 * Outbound email for auth codes (password reset, email-code sign-in).
 *
 * Fully env-driven: with SMTP_* set (see .env.example — Gmail App Password works
 * great for dev), real emails go out. Without it, sendMail() is a no-op returning
 * false — callers then fall back to console-logging the code and, outside
 * production, returning it to the app as `devCode` so flows stay testable.
 */
const transport =
  env.smtp.host && env.smtp.user && env.smtp.pass
    ? nodemailer.createTransport({
        host: env.smtp.host,
        port: env.smtp.port,
        secure: env.smtp.port === 465,
        auth: { user: env.smtp.user, pass: env.smtp.pass },
      })
    : null;

export const isMailerConfigured = () => transport !== null;

/** True when the email was handed to the SMTP server; false when unconfigured. */
export const sendMail = async (to: string, subject: string, text: string): Promise<boolean> => {
  if (!transport) return false;
  await transport.sendMail({ from: env.smtp.from, to, subject, text });
  return true;
};

/** Shared template for the two auth-code emails. */
export const sendAuthCode = (to: string, purpose: "reset your password" | "sign in", code: string) =>
  sendMail(
    to,
    `${code} is your HealingSathi code`,
    `Your code to ${purpose} is: ${code}\n\nIt expires in 10 minutes. If you didn't request this, you can safely ignore this email.`,
  );

  