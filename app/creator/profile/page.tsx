import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
    .select("display_name, bio, website_url, consultation_url, resource_url, resource_links")
    .eq("user_id", user.id)
    .maybeSingle();

  const resourceLinks = (profile?.resource_links as { label: string; url: string }[] | null) ?? [];
  const resourceSlots = [0, 1, 2, 3].map((index) => resourceLinks[index] ?? { label: "", url: "" });

  return (
    <main className="auth-page">
      <div className="auth-card creator-form-card">
        <span className="guide-icon" style={{ margin: "0 auto" }}>✦</span>
        <h1>Your creator profile</h1>
        <p>This appears at the end of every Heart Guide you publish, so people who resonate with your guide can find you.</p>
        <form className="auth-form" action={saveProfile}>
          <label>
            Display name
            <input name="displayName" defaultValue={profile?.display_name ?? ""} placeholder="Your name or business name" required autoFocus />
          </label>
          <label>
            Short bio
            <textarea name="bio" defaultValue={profile?.bio ?? ""} placeholder="A sentence or two about who you help and how." rows={3} />
          </label>
          <label>
            Website
            <input name="websiteUrl" type="url" defaultValue={profile?.website_url ?? ""} placeholder="https://yourwebsite.com" />
          </label>
          <label>
            Consultation booking link
            <input name="consultationUrl" type="url" defaultValue={profile?.consultation_url ?? ""} placeholder="https://calendly.com/you" />
          </label>
          <label>
            Free resource link
            <input name="resourceUrl" type="url" defaultValue={profile?.resource_url ?? ""} placeholder="https://yourwebsite.com/free-guide" />
          </label>

          <h2 className="guide-form-heading">Extra resources</h2>
          <p className="guide-form-hint">Anything else worth sharing — a book, masterclass, calendar, newsletter. Give each one a short label.</p>
          {resourceSlots.map((slot, index) => (
            <div className="field-grid" key={index}>
              <label>
                Label
                <input name={`resourceLabel${index}`} defaultValue={slot.label} placeholder="My book" />
              </label>
              <label>
                Link
                <input name={`resourceLinkUrl${index}`} type="url" defaultValue={slot.url} placeholder="https://…" />
              </label>
            </div>
          ))}

          <button className="button primary full-button" type="submit">Save profile <span>→</span></button>
        </form>
        {error && <p className="auth-error">{error}</p>}
      </div>
    </main>
  );
}
