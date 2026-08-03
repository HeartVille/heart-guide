"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

function buildResourceLinks(formData: FormData) {
  return [0, 1, 2, 3]
    .map((index) => ({
      label: String(formData.get(`resourceLabel${index}`) ?? "").trim(),
      url: String(formData.get(`resourceLinkUrl${index}`) ?? "").trim(),
    }))
    .filter((link) => link.label && link.url);
}

export async function saveProfile(formData: FormData) {
  const { supabase, user } = await requireUser();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const websiteUrl = String(formData.get("websiteUrl") ?? "").trim();
  const consultationUrl = String(formData.get("consultationUrl") ?? "").trim();
  const resourceUrl = String(formData.get("resourceUrl") ?? "").trim();
  const resourceLinks = buildResourceLinks(formData);

  if (!displayName) {
    redirect(`/creator/profile?error=${encodeURIComponent("Please enter a display name.")}`);
  }

  const { error } = await supabase.from("creator_profiles").upsert({
    user_id: user.id,
    display_name: displayName,
    bio: bio || null,
    website_url: websiteUrl || null,
    consultation_url: consultationUrl || null,
    resource_url: resourceUrl || null,
    resource_links: resourceLinks,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    redirect(`/creator/profile?error=${encodeURIComponent("Unable to save your profile.")}`);
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
  const { supabase } = await requireUser();
  await supabase
    .from("guides")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", guideId);
  redirect("/creator");
}

export async function deleteGuide(guideId: string) {
  const { supabase } = await requireUser();
  await supabase.from("guides").delete().eq("id", guideId);
  redirect("/creator");
}
