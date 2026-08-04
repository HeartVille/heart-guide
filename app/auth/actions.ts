"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { notifyNewSignup } from "@/lib/notify";

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("name") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: fullName ? { full_name: fullName } : undefined,
    },
  });

  if (error) {
    redirect(`/sign-up?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/sign-up/verify?email=${encodeURIComponent(email)}`);
}

export async function verifySignupOtp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const token = String(formData.get("token") ?? "").trim();

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "signup" });

  if (error) {
    redirect(`/sign-up/verify?email=${encodeURIComponent(email)}&error=${encodeURIComponent(error.message)}`);
  }

  await notifyNewSignup(data.user?.email, data.user?.user_metadata?.full_name as string | undefined);
  redirect("/");
}

export async function resendSignupOtp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  const supabase = await createClient();
  await supabase.auth.resend({ type: "signup", email });

  redirect(`/sign-up/verify?email=${encodeURIComponent(email)}&sent=1`);
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");
  const safeNext = next.startsWith("/") ? next : "/";

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/sign-in?next=${encodeURIComponent(safeNext)}&error=${encodeURIComponent(error.message)}`);
  }

  redirect(safeNext);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
