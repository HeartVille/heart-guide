import { Resend } from "resend";

let client: Resend | null = null;

/** Lazily constructed so a missing key fails at send time, not at import/build time. */
export function getResend() {
  if (!client) {
    if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured.");
    client = new Resend(process.env.RESEND_API_KEY);
  }
  return client;
}

export const RESEND_FROM = process.env.RESEND_FROM_EMAIL ?? "hello@heartville.org";
