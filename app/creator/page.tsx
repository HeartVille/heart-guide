import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { analyticsByGuide, summariseGuideAnalytics, type GuideAnalyticsEvent } from "@/lib/guide-analytics";
import { siteOrigin } from "@/lib/site";
import SiteHeader from "@/components/site-header";
import ShareGuideLink from "@/components/share-guide-link";
import { deleteGuide, setGuideStatus } from "./actions";

export const dynamic = "force-dynamic";

function CreatorLanding() {
  return (
    <>
      <SiteHeader />
      <main className="creator-landing">
        <section className="creator-hero">
          <p className="eyebrow">Heart Guide for creators</p>
          <h1>Let people experience your wisdom—not just read about it.</h1>
          <p>Turn one part of your expertise into a short reflective guide that helps someone find clarity and introduces the next step with you.</p>
          <div className="actions">
            <Link className="button primary" href="/sign-up?next=/creator">Create my first guide <span>→</span></Link>
            <Link className="button secondary" href="/sign-in?next=/creator">Sign in</Link>
          </div>
          <small>No technical setup. Start with one focused outcome.</small>
        </section>

        <section className="creator-value">
          <article><span>01</span><h2>Share a useful experience</h2><p>Guide people through four thoughtful questions instead of asking them to consume more content.</p></article>
          <article><span>02</span><h2>Build trust naturally</h2><p>Let your approach become visible through the quality of the reflection you create.</p></article>
          <article><span>03</span><h2>Offer a relevant next step</h2><p>Add one resource or invitation after the result, when someone already understands its value.</p></article>
        </section>

        <section className="creator-how">
          <div><p className="eyebrow">From expertise to live guide</p><h2>Your first guide in three steps.</h2></div>
          <ol>
            <li><b>1</b><span><strong>Create your profile</strong><small>Introduce your work and choose one useful next step.</small></span></li>
            <li><b>2</b><span><strong>Shape one focused guide</strong><small>Start from your idea or use AI to draft four editable questions.</small></span></li>
            <li><b>3</b><span><strong>Publish and share</strong><small>Use your direct link and see starts, completions and CTA clicks.</small></span></li>
          </ol>
          <Link className="button primary" href="/sign-up?next=/creator">Begin as a creator <span>→</span></Link>
        </section>
      </main>
    </>
  );
}

export default async function CreatorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return <CreatorLanding />;
  const ownerEmail = (process.env.ADMIN_NOTIFICATION_EMAIL ?? "hello@heartville.org").trim().toLowerCase();
  const isOwner = user.email?.toLowerCase() === ownerEmail;
  const origin = await siteOrigin();

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
    ? await supabase.from("guide_events").select("id, guide_id, event_type, visitor_key").in("guide_id", guideIds)
    : { data: [] as GuideAnalyticsEvent[] };
  const creatorEvents = (events ?? []) as GuideAnalyticsEvent[];
  const analyticsPerGuide = analyticsByGuide(creatorEvents);
  const totals = summariseGuideAnalytics(creatorEvents);
  const hasGuide = Boolean(guides?.length);
  const hasPublishedGuide = Boolean(guides?.some((guide) => guide.status === "published"));
  const completedSteps = Number(Boolean(profile)) + Number(hasGuide) + Number(hasPublishedGuide);
  const nextStep = !profile
    ? { href: "/creator/profile", label: "Create my profile" }
    : !hasGuide
      ? { href: "/creator/guides/new", label: "Build my first guide" }
      : !hasPublishedGuide
        ? { href: `/creator/guides/${guides![0].id}`, label: "Review and publish" }
        : null;

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
            <p className="creator-limit-note">Free creators can keep drafts, with one guide live at a time.</p>
          </div>
          <div className="dashboard-actions">
            {isOwner && <Link className="button secondary" href="/analytics">Heart Guide insights</Link>}
            <Link className="button primary" href="/creator/profile">
              {profile ? "Edit profile" : "Set up my profile"}
            </Link>
          </div>
        </div>

        <section className="creator-onboarding panel">
          <div className="onboarding-head">
            <div><p className="eyebrow">Your creator path</p><h2>{completedSteps === 3 ? "Your guide is live." : "Publish your first guide."}</h2></div>
            <span>{completedSteps}/3 complete</span>
          </div>
          <ol>
            <li className={profile ? "complete" : "current"}><b>{profile ? "✓" : "1"}</b><span><strong>Introduce your work</strong><small>Create the profile and next step shown after your guide.</small></span></li>
            <li className={hasGuide ? "complete" : profile ? "current" : ""}><b>{hasGuide ? "✓" : "2"}</b><span><strong>Build one focused guide</strong><small>Help someone reach one clear, useful outcome.</small></span></li>
            <li className={hasPublishedGuide ? "complete" : hasGuide ? "current" : ""}><b>{hasPublishedGuide ? "✓" : "3"}</b><span><strong>Publish and share</strong><small>Use your link and learn from real participant activity.</small></span></li>
          </ol>
          {nextStep ? <Link className="button primary" href={nextStep.href}>{nextStep.label} <span>→</span></Link> : <p className="onboarding-live">✓ Share your guide and watch its results below.</p>}
        </section>
        {error && <p className="auth-error creator-page-error">{error}</p>}

        {profile && (
          <section className="metrics" aria-label="Your guide analytics">
            <article><small>Unique participants</small><strong>{totals.participants}</strong><span>Started one of your guides</span></article>
            <article><small>Completion rate</small><strong>{totals.completionRate}%</strong><span>{totals.completed} people completed</span></article>
            <article><small>CTA clicks</small><strong>{totals.ctaClicks}</strong><span>After a completed guide</span></article>
            <article><small>CTA conversion</small><strong>{totals.ctaRate}%</strong><span>Of completed journeys</span></article>
          </section>
        )}

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
                <small style={{ display: "block", marginTop: 6, color: "var(--muted)" }}>
                  {totals.ctaClicks} unique CTA click{totals.ctaClicks === 1 ? "" : "s"} across all guides
                </small>
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
              const analytics = analyticsPerGuide.get(guide.id) ?? { participants: 0, completed: 0, ctaClicks: 0, completionRate: 0, ctaRate: 0 };
              return (
              <div className="guide-row" key={guide.id}>
                <span className={`mini-icon ${guide.colour}`}>{guide.symbol}</span>
                <div>
                  <strong>{guide.title}</strong>
                  <small>{guide.category} · {guide.status === "published" ? "Published" : "Draft"} · {analytics.participants} participants · {analytics.completionRate}% completed · {analytics.ctaRate}% CTA conversion</small>
                  {guide.status === "published" && <ShareGuideLink url={`${origin}/guides/${guide.id}`} />}
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
