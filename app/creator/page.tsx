import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SiteHeader from "@/components/site-header";
import { deleteGuide, setGuideStatus } from "./actions";

export const dynamic = "force-dynamic";

export default async function CreatorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/creator");

  const [{ data: profile }, { data: guides }] = await Promise.all([
    supabase
      .from("creator_profiles")
      .select("display_name, avatar_url, bio, resource_title, resource_description, resource_url, cta_label")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("guides")
      .select("id, title, category, colour, symbol, status, created_at")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const guideIds = (guides ?? []).map((guide) => guide.id);
  const { data: events } = guideIds.length
    ? await supabase.from("guide_events").select("guide_id, event_type").in("guide_id", guideIds)
    : { data: [] as { guide_id: string; event_type: string }[] };

  const countsByGuide = new Map<string, { started: number; completed: number }>();
  for (const event of events ?? []) {
    const current = countsByGuide.get(event.guide_id) ?? { started: 0, completed: 0 };
    if (event.event_type === "started") current.started += 1;
    if (event.event_type === "completed") current.completed += 1;
    countsByGuide.set(event.guide_id, current);
  }

  return (
    <>
    <SiteHeader />
    <main className="creator-page single-column">
      <section className="dashboard">
        <div className="dashboard-head">
          <div>
            <p className="eyebrow">Creator Studio</p>
            <h1>{profile ? `Welcome back, ${profile.display_name}.` : "Become a Heart Guide creator"}</h1>
            <p>
              {profile
                ? "Manage your profile and your published Heart Guides."
                : "Set up your creator profile, then build a free Heart Guide of your own. Your name, bio and resource link appear at the end of every guide you publish."}
            </p>
          </div>
          <Link className="button primary" href="/creator/profile">
            {profile ? "Edit profile" : "Set up my profile"}
          </Link>
        </div>

        {profile && (
          <section className="panel profile-summary">
            <div className="profile-summary-head">
              {profile.avatar_url && <img className="profile-avatar" src={profile.avatar_url} alt={profile.display_name} />}
              <div>
                <h2>{profile.display_name}</h2>
                {profile.bio && <p>{profile.bio}</p>}
              </div>
            </div>
            {profile.resource_url && (
              <div className="profile-links">
                <a href={profile.resource_url} target="_blank" rel="noreferrer">
                  {profile.resource_title || "Resource"} ↗
                </a>
              </div>
            )}
          </section>
        )}

        <div className="panel-title" style={{ marginTop: 40 }}>
          <div>
            <h2>Your Heart Guides</h2>
            <p>Create, edit and publish the guides you offer.</p>
          </div>
          {profile ? (
            <Link className="button secondary" href="/creator/guides/new">＋ Create a Heart Guide</Link>
          ) : (
            <span className="text-button" style={{ cursor: "default", color: "#9aa5a1" }}>Set up your profile first</span>
          )}
        </div>

        {!guides || guides.length === 0 ? (
          <section className="journey-empty">
            <span className="guide-icon">✦</span>
            <h2>No Heart Guides yet.</h2>
            <p>Once you set up your profile, you can build your first free reflective guide.</p>
          </section>
        ) : (
          <section className="panel">
            {guides.map((guide) => {
              const counts = countsByGuide.get(guide.id) ?? { started: 0, completed: 0 };
              return (
              <div className="guide-row" key={guide.id}>
                <span className={`mini-icon ${guide.colour}`}>{guide.symbol}</span>
                <div>
                  <strong>{guide.title}</strong>
                  <small>{guide.category} · {guide.status === "published" ? "Published" : "Draft"} · {counts.started} started, {counts.completed} completed</small>
                </div>
                <Link className="text-button" href={`/creator/guides/${guide.id}`}>Edit</Link>
                <form action={setGuideStatus.bind(null, guide.id, guide.status === "published" ? "draft" : "published")}>
                  <button className="text-button" type="submit">{guide.status === "published" ? "Unpublish" : "Publish"}</button>
                </form>
                <form action={deleteGuide.bind(null, guide.id)}>
                  <button className="text-button" type="submit">Delete</button>
                </form>
              </div>
              );
            })}
          </section>
        )}
      </section>
    </main>
    </>
  );
}
