"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function siteOrigin(requestHeaders: Headers) {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    `https://${requestHeaders.get("host")}`
  );
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("name") ?? "").trim();
  const requestHeaders = await headers();

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteOrigin(requestHeaders)}/auth/confirm`,
      data: fullName ? { full_name: fullName } : undefined,
    },
  });

  if (error) {
    redirect(`/sign-up?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/sign-up?checkEmail=1");
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
