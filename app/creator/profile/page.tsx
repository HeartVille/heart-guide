import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SiteHeader from "@/components/site-header";
import { saveProfile } from "../actions";

export const dynamic = "force-dynamic";

export default async function CreatorProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/creator/profile");

  const { data: profile } = await supabase
    .from("creator_profiles")
    .select("display_name, avatar_url, bio, resource_title, resource_description, resource_url, cta_label")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <>
    <SiteHeader />
    <main className="auth-page">
      <div className="auth-card creator-form-card">
        <span className="guide-icon" style={{ margin: "0 auto" }}>✦</span>
        <h1>Your creator profile</h1>
        <p>This appears at the end of every Heart Guide you publish, so people who resonate with your guide can find you.</p>
        <form className="auth-form" action={saveProfile}>
          <label>
            Creator name
            <input name="displayName" defaultValue={profile?.display_name ?? ""} placeholder="Your name or business name" required autoFocus />
          </label>
          <label>
            Headshot or logo URL
            <input name="avatarUrl" type="url" defaultValue={profile?.avatar_url ?? ""} placeholder="https://yoursite.com/photo.jpg" />
          </label>
          <label>
            Short bio <small>(max 50 words)</small>
            <textarea name="bio" defaultValue={profile?.bio ?? ""} placeholder="A sentence or two about who you help and how." rows={3} maxLength={400} />
          </label>
          <label>
            Resource title
            <input name="resourceTitle" defaultValue={profile?.resource_title ?? ""} placeholder="Free 5-Minute Clarity Workbook" />
          </label>
          <label>
            Resource description <small>(max 30 words)</small>
            <textarea name="resourceDescription" defaultValue={profile?.resource_description ?? ""} placeholder="What someone gets when they click through." rows={2} maxLength={250} />
          </label>
          <label>
            Resource or booking URL
            <input name="resourceUrl" type="url" defaultValue={profile?.resource_url ?? ""} placeholder="https://yourwebsite.com/free-guide" />
          </label>
          <label>
            CTA button text
            <input name="ctaLabel" defaultValue={profile?.cta_label ?? ""} placeholder="Get the workbook" />
          </label>
          <button className="button primary full-button" type="submit">Save profile <span>→</span></button>
        </form>
        {error && <p className="auth-error">{error}</p>}
      </div>
    </main>
    </>
  );
}
