import { getResend, RESEND_FROM } from "@/lib/resend";

const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL ?? "hello@heartville.org";

async function notifyAdmin(subject: string, text: string) {
  try {
    await getResend().emails.send({ from: RESEND_FROM, to: ADMIN_EMAIL, subject, text });
  } catch {
    // A failed notification should never break the user-facing flow.
  }
}

async function notifyGHL(payload: Record<string, unknown>) {
  const webhookUrl = process.env.GHL_SIGNUP_WEBHOOK_URL;
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // A failed webhook should never break the user-facing flow.
  }
}

export async function notifyNewSignup(email: string | null | undefined, fullName: string | null | undefined) {
  const trimmedName = fullName?.trim() ?? "";
  const [firstName = "", ...rest] = trimmedName ? trimmedName.split(" ") : [];

  await Promise.all([
    notifyAdmin(
      "New Heart Guide signup",
      `${trimmedName || "(no name given)"} just confirmed their account.\n\nEmail: ${email ?? "unknown"}`,
    ),
    notifyGHL({
      event: "new_signup",
      source: "Heart Guide",
      first_name: firstName,
      last_name: rest.join(" "),
      email: email ?? "",
      signed_up_at: new Date().toISOString(),
    }),
  ]);
}

export async function notifyNewCreator(email: string | null | undefined, displayName: string) {
  await Promise.all([
    notifyAdmin(
      "New Heart Guide creator",
      `${displayName} just set up a creator profile.\n\nAccount email: ${email ?? "unknown"}`,
    ),
    notifyGHL({
      event: "new_creator",
      source: "Heart Guide",
      display_name: displayName,
      email: email ?? "",
      signed_up_at: new Date().toISOString(),
    }),
  ]);
}
