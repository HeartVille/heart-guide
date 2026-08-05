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

function splitName(fullName: string | null | undefined) {
  const trimmedName = fullName?.trim() ?? "";
  const [firstName = "", ...rest] = trimmedName ? trimmedName.split(" ") : [];
  return { trimmedName, firstName, lastName: rest.join(" ") };
}

export async function notifyNewSignup(email: string | null | undefined, fullName: string | null | undefined) {
  const { trimmedName, firstName, lastName } = splitName(fullName);

  await Promise.all([
    notifyAdmin(
      "New Heart Guide signup",
      `${trimmedName || "(no name given)"} just confirmed their account.\n\nEmail: ${email ?? "unknown"}`,
    ),
    notifyGHL({
      event: "new_signup",
      source: "Heart Guide",
      first_name: firstName,
      last_name: lastName,
      email: email ?? "",
      signed_up_at: new Date().toISOString(),
    }),
  ]);
}

export async function notifyMessageScoreLead(
  email: string | null | undefined,
  firstName: string | null | undefined,
  totalScore: number | null | undefined,
) {
  await notifyAdmin(
    "New Soul-Aligned Message Score lead",
    `${firstName?.trim() || "(no name given)"} just completed the Message Score.\n\nEmail: ${email ?? "unknown"}\nScore: ${totalScore ?? "unknown"}/100`,
  );
}

export async function notifyGuideCompleted(
  email: string | null | undefined,
  fullName: string | null | undefined,
  guideTitle: string,
  guideCategory: string,
  qa: { question: string; answer: string }[],
) {
  const { trimmedName, firstName, lastName } = splitName(fullName);

  await Promise.all([
    notifyAdmin(
      `New Heart Guide completed: ${guideTitle}`,
      `${trimmedName || "(no name given)"} just completed "${guideTitle}".\n\nEmail: ${email ?? "unknown"}\nCategory: ${guideCategory}`,
    ),
    notifyGHL({
      event: "guide_completed",
      source: "Heart Guide",
      first_name: firstName,
      last_name: lastName,
      email: email ?? "",
      guide_title: guideTitle,
      guide_category: guideCategory,
      answers: qa,
      completed_at: new Date().toISOString(),
    }),
  ]);
}

export async function notifyNewCreator(email: string | null | undefined, displayName: string) {
  const { firstName, lastName } = splitName(displayName);

  await Promise.all([
    notifyAdmin(
      "New Heart Guide creator",
      `${displayName} just set up a creator profile.\n\nAccount email: ${email ?? "unknown"}`,
    ),
    notifyGHL({
      event: "new_creator",
      source: "Heart Guide",
      display_name: displayName,
      first_name: firstName,
      last_name: lastName,
      email: email ?? "",
      signed_up_at: new Date().toISOString(),
    }),
  ]);
}
