import { getResend, RESEND_FROM } from "@/lib/resend";

const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL ?? "hello@heartville.org";

async function notifyAdmin(subject: string, text: string) {
  try {
    await getResend().emails.send({ from: RESEND_FROM, to: ADMIN_EMAIL, subject, text });
  } catch {
    // A failed notification should never break the user-facing flow.
  }
}

export async function notifyNewSignup(email: string | null | undefined, fullName: string | null | undefined) {
  const name = fullName?.trim() || "(no name given)";
  await notifyAdmin(
    "New Heart Guide signup",
    `${name} just confirmed their account.\n\nEmail: ${email ?? "unknown"}`,
  );
}

export async function notifyNewCreator(email: string | null | undefined, displayName: string) {
  await notifyAdmin(
    "New Heart Guide creator",
    `${displayName} just set up a creator profile.\n\nAccount email: ${email ?? "unknown"}`,
  );
}
