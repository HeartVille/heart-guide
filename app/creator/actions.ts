"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { notifyNewCreator, notifyGuidePublished } from "@/lib/notify";
import { siteOrigin } from "@/lib/site";

const CATEGORIES = ["Relationships", "Business", "Wellbeing"] as const;
const COLOURS = ["jade", "violet", "aqua", "gold", "rose", "sage"] as const;

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/creator");
  return { supabase, user };
}

export async function saveProfile(formData: FormData) {
  const { supabase, user } = await requireUser();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const avatarUrl = String(formData.get("avatarUrl") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const resourceTitle = String(formData.get("resourceTitle") ?? "").trim();
  const resourceDescription = String(formData.get("resourceDescription") ?? "").trim();
  const resourceUrl = String(formData.get("resourceUrl") ?? "").trim();
  const ctaLabel = String(formData.get("ctaLabel") ?? "").trim();

  if (!displayName) {
    redirect(`/creator/profile?error=${encodeURIComponent("Please enter a display name.")}`);
  }

  const { data: existingProfile } = await supabase
    .from("creator_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = await supabase.from("creator_profiles").upsert({
    user_id: user.id,
    display_name: displayName,
    avatar_url: avatarUrl || null,
    bio: bio || null,
    resource_title: resourceTitle || null,
    resource_description: resourceDescription || null,
    resource_url: resourceUrl || null,
    cta_label: ctaLabel || null,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    redirect(`/creator/profile?error=${encodeURIComponent("Unable to save your profile.")}`);
  }

  if (!existingProfile) {
    await notifyNewCreator(user.email, displayName);
  }

  redirect("/creator");
}

function buildQuestions(formData: FormData) {
  return [0, 1, 2, 3].map((index) => ({
    label: String(formData.get(`q${index}Label`) ?? "").trim(),
    question: String(formData.get(`q${index}Question`) ?? "").trim(),
    placeholder: String(formData.get(`q${index}Placeholder`) ?? "").trim(),
  }));
}

function validGuideFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const colour = String(formData.get("colour") ?? "jade");
  const symbol = String(formData.get("symbol") ?? "✦").trim() || "✦";
  const questions = buildQuestions(formData);

  if (
    !title ||
    !description ||
    !(CATEGORIES as readonly string[]).includes(category) ||
    !(COLOURS as readonly string[]).includes(colour)
  ) {
    return null;
  }
  if (questions.some((question) => !question.label || !question.question)) {
    return null;
  }

  return { title, category, description, colour, symbol, questions };
}

export async function createGuide(formData: FormData) {
  const { supabase, user } = await requireUser();
  const fields = validGuideFields(formData);
  if (!fields) {
    redirect(`/creator/guides/new?error=${encodeURIComponent("Please complete all required fields.")}`);
  }

  const { error } = await supabase.from("guides").insert({
    creator_id: user.id,
    ...fields,
    status: "draft",
  });

  if (error) {
    redirect(`/creator/guides/new?error=${encodeURIComponent("Unable to create your guide.")}`);
  }

  redirect("/creator");
}

export async function updateGuide(guideId: string, formData: FormData) {
  const { supabase } = await requireUser();
  const fields = validGuideFields(formData);
  if (!fields) {
    redirect(`/creator/guides/${guideId}?error=${encodeURIComponent("Please complete all required fields.")}`);
  }

  const { error } = await supabase
    .from("guides")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", guideId);

  if (error) {
    redirect(`/creator/guides/${guideId}?error=${encodeURIComponent("Unable to save your guide.")}`);
  }

  redirect("/creator");
}

export async function setGuideStatus(guideId: string, status: "draft" | "published") {
  const { supabase, user } = await requireUser();

  await supabase
    .from("guides")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", guideId);

  if (status === "published") {
    const [{ data: guide }, { data: profile }] = await Promise.all([
      supabase.from("guides").select("title").eq("id", guideId).maybeSingle(),
      supabase.from("creator_profiles").select("display_name").eq("user_id", user.id).maybeSingle(),
    ]);
    if (guide) {
      const origin = await siteOrigin();
      await notifyGuidePublished(user.email, profile?.display_name, guide.title, `${origin}/guides/${guideId}`);
    }
  }

  redirect("/creator");
}

export async function deleteGuide(guideId: string) {
  const { supabase } = await requireUser();
  await supabase.from("guides").delete().eq("id", guideId);
  redirect("/creator");
}
