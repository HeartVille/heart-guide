"use client";

import { useEffect, useMemo, useState } from "react";

type View = "home" | "library" | "journey" | "my-journey" | "message-score" | "membership";
type Category = "All" | "Relationships" | "Business" | "Wellbeing";
type SignedInUser = { email: string; name: string };
type JourneyStep = { label: string; question: string; placeholder: string };
type Creator = {
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  resourceTitle: string | null;
  resourceDescription: string | null;
  resourceUrl: string | null;
  ctaLabel: string | null;
};
type Guide = {
  id: string;
  title: string;
  category: string;
  description: string;
  colour: string;
  symbol: string;
  questions: JourneyStep[];
  creator: Creator | null;
};
type SavedJourney = {
  id: string;
  guideId: string;
  answers: string[];
  currentStep: number;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

const FOUNDER_CHECKOUT_URL = "https://links.heartville.org/payment-link/6a622ebe7b99151a54040194";

function Mark({ small = false }: { small?: boolean }) {
  return (
    <span className={small ? "mark small" : "mark"} aria-hidden="true">
      <span>✦</span>
    </span>
  );
}

export default function HeartGuideClient({
  user,
  founderAccess,
  guides,
}: {
  user: SignedInUser | null;
  founderAccess: boolean;
  guides: Guide[];
}) {
  const [view, setView] = useState<View>("home");
  const [category, setCategory] = useState<Category>("All");
  const [search, setSearch] = useState("");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(["", "", "", ""]);
  const [finished, setFinished] = useState(false);
  const [notice, setNotice] = useState("");
  const [messageStage, setMessageStage] = useState<"intro" | "message" | "details" | "report">("intro");
  const [currentMessage, setCurrentMessage] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [submissionState, setSubmissionState] = useState<"idle" | "sending" | "saved" | "offline">("idle");
  const [activeGuideId, setActiveGuideId] = useState<string | null>(guides[0]?.id ?? null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [savedJourneys, setSavedJourneys] = useState<SavedJourney[]>([]);
  const [activeJourneyId, setActiveJourneyId] = useState<string | null>(null);
  const [journeysLoading, setJourneysLoading] = useState(Boolean(user));
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const activeGuide = guides.find((guide) => guide.id === activeGuideId) ?? null;
  const journeySteps = activeGuide?.questions ?? [];

  useEffect(() => {
    if (!user) return;
    void fetch("/api/journeys")
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load journeys");
        return response.json() as Promise<{ journeys: SavedJourney[] }>;
      })
      .then((data) => setSavedJourneys(data.journeys))
      .catch(() => setNotice("Your saved journeys could not be loaded just now."))
      .finally(() => setJourneysLoading(false));
  }, [user]);

  const filtered = useMemo(
    () => guides.filter((guide) => {
      const matchesCategory = category === "All" || guide.category === category;
      const matchesSearch = `${guide.title} ${guide.description}`.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    }),
    [category, search],
  );

  function navigate(next: View) {
    setView(next);
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openMyJourney() {
    if (!user) {
      window.location.assign("/sign-in?next=/");
      return;
    }
    navigate("my-journey");
  }

  function canOpenGuide(id: string) {
    if (!user) {
      window.location.assign("/sign-in?next=/");
      return false;
    }
    return guides.some((guide) => guide.id === id);
  }

  function startGuide(id: string) {
    if (!guides.some((guide) => guide.id === id)) {
      setNotice("This guide is being lovingly prepared.");
      return;
    }
    if (!canOpenGuide(id)) return;
    setActiveGuideId(id);
    const saved = savedJourneys.find((journey) => journey.guideId === id && !journey.completed);
    setActiveJourneyId(saved?.id ?? null);
    setStep(saved?.currentStep ?? 0);
    setAnswers(saved?.answers?.length === 4 ? saved.answers : ["", "", "", ""]);
    setFinished(saved?.completed ?? false);
    setSaveState(saved ? "saved" : "idle");
    navigate("journey");
  }

  function openSavedJourney(journey: SavedJourney) {
    if (!canOpenGuide(journey.guideId)) return;
    setActiveGuideId(journey.guideId);
    setActiveJourneyId(journey.id);
    setStep(journey.currentStep);
    setAnswers(journey.answers?.length === 4 ? journey.answers : ["", "", "", ""]);
    setFinished(journey.completed);
    setSaveState("saved");
    navigate("journey");
  }

  function startNewJourney(id: string) {
    if (!canOpenGuide(id)) return;
    setActiveGuideId(id);
    setActiveJourneyId(null);
    setStep(0);
    setAnswers(["", "", "", ""]);
    setFinished(false);
    setSaveState("idle");
    navigate("journey");
  }

  function startMessageScore() {
    setMessageStage("intro");
    setCurrentMessage("");
    setFirstName("");
    setEmail("");
    setConsent(false);
    navigate("message-score");
  }

  function scoreMessage(message: string) {
    const text = message.toLowerCase();
    const words = message.trim().split(/\s+/).filter(Boolean).length;
    const audienceTerms = ["coach", "consultant", "entrepreneur", "founder", "leader", "therapist", "healer", "business", "women", "men", "people", "clients"];
    const problemTerms = ["struggle", "tired", "overwhelm", "stuck", "because", "without", "inconsistent", "challenge", "frustrat", "pain"];
    const outcomeTerms = ["help", "create", "build", "grow", "scale", "transform", "achieve", "clarity", "revenue", "freedom", "impact"];
    const distinctTerms = ["through", "using", "method", "framework", "approach", "system", "embodied", "heart", "mindful", "unlike", "without"];
    const hits = (terms: string[]) => terms.filter((term) => text.includes(term)).length;
    const audience = Math.min(20, 8 + hits(audienceTerms) * 3);
    const problem = Math.min(20, 7 + hits(problemTerms) * 3);
    const transformation = Math.min(20, 8 + hits(outcomeTerms) * 2);
    const distinction = Math.min(20, 6 + hits(distinctTerms) * 3);
    const simplicity = words >= 12 && words <= 55 ? 18 : words <= 85 ? 14 : words <= 120 ? 10 : 7;
    const categories = [
      { name: "Right-Person Clarity", score: audience, note: audience >= 15 ? "Your audience can begin to recognise themselves." : "Name one specific kind of client, at a recognisable stage." },
      { name: "Real-Problem Relevance", score: problem, note: problem >= 15 ? "You connect your work to a problem that matters." : "Use the words clients use when describing what is difficult now." },
      { name: "Transformation Clarity", score: transformation, note: transformation >= 15 ? "The direction of change is visible." : "Make the result concrete enough for someone to picture it." },
      { name: "Distinctive Path", score: distinction, note: distinction >= 15 ? "There are signs of a distinctive way of working." : "Name the method, perspective or principle that makes your path yours." },
      { name: "Simplicity & Resonance", score: simplicity, note: simplicity >= 15 ? "Your message is easy to absorb." : "Choose one audience, one problem and one meaningful outcome." },
    ];
    return { total: categories.reduce((sum, item) => sum + item.score, 0), categories };
  }

  const messageReport = useMemo(() => scoreMessage(currentMessage), [currentMessage]);

  async function sendLead(stage: "Message Score Completed" | "Validation Booking Clicked") {
    const response = await fetch("/api/message-score", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        firstName: firstName.trim(),
        email: email.trim(),
        consent,
        message: currentMessage.trim(),
        totalScore: messageReport.total,
        categoryScores: Object.fromEntries(messageReport.categories.map((item) => [item.name, item.score])),
        strongestArea: [...messageReport.categories].sort((a, b) => b.score - a.score)[0]?.name,
        priorityArea: [...messageReport.categories].sort((a, b) => a.score - b.score)[0]?.name,
        stage,
        source: "Heart Guide — Soul-Aligned Message Score",
      }),
    });
    if (!response.ok) throw new Error("Lead delivery failed");
    return response.json() as Promise<{ delivered: boolean }>;
  }

  async function revealMessageScore() {
    setSubmissionState("sending");
    setMessageStage("report");
    window.scrollTo({ top: 0, behavior: "smooth" });
    try {
      const result = await sendLead("Message Score Completed");
      setSubmissionState(result.delivered ? "saved" : "offline");
    } catch {
      setSubmissionState("offline");
    }
  }

  async function saveJourney(nextStep: number, isCompleted: boolean) {
    if (!user) return;
    setSaveState("saving");
    try {
      const response = await fetch("/api/journeys", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ journeyId: activeJourneyId, guideId: activeGuideId, answers, currentStep: nextStep, completed: isCompleted }),
      });
      if (!response.ok) throw new Error("Unable to save");
      const result = (await response.json()) as { journeyId: string; createdAt: string; updatedAt: string };
      setActiveJourneyId(result.journeyId);
      setSavedJourneys((current) => [
        { id: result.journeyId, guideId: activeGuideId!, answers, currentStep: nextStep, completed: isCompleted, createdAt: current.find((journey) => journey.id === result.journeyId)?.createdAt ?? result.createdAt, updatedAt: result.updatedAt },
        ...current.filter((journey) => journey.id !== result.journeyId),
      ]);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  function continueJourney() {
    if (!answers[step].trim()) return;
    if (step === journeySteps.length - 1) {
      setFinished(true);
      void saveJourney(step, true);
    } else {
      const nextStep = step + 1;
      setStep(nextStep);
      void saveJourney(nextStep, false);
    }
  }

  return (
    <div className="site-shell">
      <header className="header">
        <button className="brand" onClick={() => navigate("home")} aria-label="Heart Guide home">
          <Mark />
          <span>Heart Guide</span>
        </button>
        <nav aria-label="Main navigation">
          <button className={view === "library" ? "active" : ""} onClick={() => navigate("library")}>Explore Guides</button>
          <button className={view === "my-journey" ? "active" : ""} onClick={openMyJourney}>My Journey</button>
          <button className={view === "membership" ? "active" : ""} onClick={() => navigate("membership")}>Founder Access</button>
          <a href="/creator">For Creators</a>
        </nav>
        <button className={`profile ${user ? "signed-in" : ""}`} onClick={() => user ? setProfileOpen((open) => !open) : window.location.assign("/sign-in?next=/")} aria-label={user ? "Open member profile" : "Sign in"}>
          <span className="profile-head" />
          <span className="profile-body" />
          <i>✦</i>
        </button>
        {profileOpen && user && (
          <div className="profile-menu">
            <strong>{user.name}</strong>
            <span>{user.email}</span>
            <button onClick={openMyJourney}>My Journey</button>
            <a href="/auth/sign-out">Sign out</a>
          </div>
        )}
      </header>

      {notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Close">×</button></div>}

      {view === "home" && (
        <main>
          <section className="hero">
            <div className="hero-copy">
              <p className="eyebrow">AI guidance, rooted in human wisdom</p>
              <h1>A wiser next step starts within.</h1>
              <p className="lede">Personalised Heart Guides help you find clarity, deepen connection and turn insight into meaningful action.</p>
              <div className="actions">
                <button className="button primary" onClick={() => navigate("library")}>Explore Heart Guides <span>→</span></button>
                <button className="button secondary" onClick={startMessageScore}>Score my message <span>→</span></button>
              </div>
              <p className="trust"><span>✦</span> Private by design &nbsp;·&nbsp; Move at your own pace</p>
            </div>
            <div className="hero-art" aria-hidden="true">
              <img src="/luminous-heart.png" alt="" />
            </div>
          </section>
          <section className="featured" aria-label="Featured Heart Guides">
            {guides.slice(0, 3).map((guide) => (
              <button className={`feature-card ${guide.colour}`} key={guide.id} onClick={() => startGuide(guide.id)}>
                <span className="guide-icon">{guide.symbol}</span>
                <span><small>{guide.category}</small><strong>{guide.title}</strong></span>
                <b>→</b>
                <i className="wave" />
              </button>
            ))}
          </section>
          <section className="home-intro">
            <p className="eyebrow">A thoughtful conversation, shaped around you</p>
            <h2>Not another endless chatbot.</h2>
            <p>Each Heart Guide follows a purposeful journey towards a clear outcome—bringing together reflective questions, your lived wisdom and gentle AI support.</p>
            <div className="principles">
              <article><span>01</span><h3>Pause and listen</h3><p>Make space for what is already asking for your attention.</p></article>
              <article><span>02</span><h3>Explore with care</h3><p>Receive thoughtful prompts shaped by your unique answers.</p></article>
              <article><span>03</span><h3>Leave with clarity</h3><p>Complete each journey with an insight and meaningful next step.</p></article>
            </div>
          </section>
        </main>
      )}

      {view === "library" && (
        <main className="inner-page">
          <section className="page-heading">
            <p className="eyebrow">Explore the library</p>
            <h1>What would you like guidance with?</h1>
            <p>Choose a Heart Guide for the place in your life that wants attention today.</p>
          </section>
          <section className="library-tools">
            <label className="search"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Heart Guides" /></label>
            <div className="filters" aria-label="Guide categories">
              {(["All", "Relationships", "Business", "Wellbeing"] as Category[]).map((item) => <button key={item} className={category === item ? "selected" : ""} onClick={() => setCategory(item)}>{item}</button>)}
            </div>
          </section>
          <section className="guide-grid">
            {filtered.map((guide) => (
              <article className="guide-card" key={guide.id}>
                <div className={`guide-art ${guide.colour}`}><span>{guide.symbol}</span><i /><b /></div>
                <div className="guide-content">
                  <div className="guide-meta"><span>{guide.category}</span><span>Free</span></div>
                  <h2>{guide.title}</h2>
                  <p>{guide.description}</p>
                  <div className="guide-footer"><small>1–3 min</small><button onClick={() => startGuide(guide.id)}>Begin guide →</button></div>
                </div>
              </article>
            ))}
            {filtered.length === 0 && (
              <p className="journey-empty">No guides match your search yet.</p>
            )}
          </section>
        </main>
      )}

      {view === "my-journey" && user && (
        <main className="inner-page">
          <section className="page-heading">
            <p className="eyebrow">Your private space</p>
            <h1>My Journey</h1>
            <p>Return to an unfinished reflection or revisit a completed one whenever you need it.</p>
          </section>
          {journeysLoading ? (
            <p className="journey-empty">Gathering your saved journeys…</p>
          ) : savedJourneys.length === 0 ? (
            <section className="journey-empty">
              <span className="guide-icon">✦</span>
              <h2>Your first reflection begins here.</h2>
              <p>Choose a Heart Guide and your progress will be saved privately to this account.</p>
              <button className="button primary" onClick={() => navigate("library")}>Explore Heart Guides <span>→</span></button>
            </section>
          ) : (
            <section className="saved-grid">
              {savedJourneys.map((journey) => {
                const detail = guides.find((guide) => guide.id === journey.guideId);
                if (!detail) return null;
                return (
                  <article className="saved-card" key={journey.id}>
                    <span className="guide-icon">{detail.symbol}</span>
                    <div>
                      <small>{detail.category}</small>
                      <h2>{detail.title}</h2>
                      <p>{journey.completed ? `Completed ${new Date(journey.updatedAt).toLocaleDateString()}` : `Step ${journey.currentStep + 1} of 4`}</p>
                    </div>
                    <button className="button secondary" onClick={() => openSavedJourney(journey)}>
                      {journey.completed ? "Revisit" : "Continue"} <span>→</span>
                    </button>
                    {journey.completed && (
                      <button className="text-button" onClick={() => startNewJourney(journey.guideId)}>
                        Start a new journey
                      </button>
                    )}
                  </article>
                );
              })}
            </section>
          )}
        </main>
      )}

      {view === "journey" && activeGuide && (
        <main className="journey-page">
          <aside className="journey-side">
            <button className="back" onClick={() => navigate("library")}>← Back to guides</button>
            <div className="journey-title"><span className="guide-icon">{activeGuide.symbol}</span><p>{activeGuide.category}</p><h1>{activeGuide.title}</h1></div>
            <ol>
              {journeySteps.map((item, index) => <li className={index === step ? "current" : index < step || finished ? "done" : ""} key={item.label}><span>{index < step || finished ? "✓" : index + 1}</span>{item.label}</li>)}
            </ol>
            <p className="privacy-note">Your reflections belong to you. Share only what feels right.</p>
          </aside>
          <section className="conversation">
            {!finished ? (
              <div className="conversation-card">
                <div className="guide-avatar"><Mark small /></div>
                <p className="step-label">Step {step + 1} of {journeySteps.length} · {journeySteps[step].label}</p>
                <h2>{journeySteps[step].question}</h2>
                <textarea autoFocus value={answers[step]} onChange={(e) => setAnswers((current) => current.map((answer, index) => index === step ? e.target.value : answer))} placeholder={journeySteps[step].placeholder} />
                <div className="conversation-actions">
                  <button className="text-button" disabled={step === 0} onClick={() => setStep((current) => current - 1)}>← Previous</button>
                  <button className="button primary" disabled={!answers[step].trim()} onClick={continueJourney}>{step === journeySteps.length - 1 ? "Complete my reflection" : "Continue"} <span>→</span></button>
                </div>
                <p className="prompt-hint">There is no perfect answer. A few honest words are enough.</p>
                {user && <p className={`save-status ${saveState}`}>{saveState === "saving" ? "Saving privately…" : saveState === "saved" ? "✓ Saved to My Journey" : saveState === "error" ? "Could not save just now. Your words remain on this page." : "Your progress will be saved privately."}</p>}
              </div>
            ) : (
              <div className="result-card">
                <div className="result-mark">✦</div>
                <p className="eyebrow">Your {activeGuide.title} reflection</p>
                <h2>A gentle next step has emerged.</h2>
                <p>You began by listening to what is difficult, then named the deeper longing beneath it. The action you chose is:</p>
                <blockquote>“{answers[3]}”</blockquote>
                <p className="result-note">Carry this as an invitation rather than another task. Notice what support, timing or boundary would help you approach it with care.</p>
                <div className="actions"><button className="button primary" onClick={() => window.print()}>Print my reflection</button><button className="button secondary" onClick={openMyJourney}>My Journey</button><button className="text-button" onClick={() => startNewJourney(activeGuide.id)}>Start this guide again</button></div>
                {user && <p className={`save-status ${saveState}`}>{saveState === "saving" ? "Saving privately…" : saveState === "error" ? "Could not save just now." : "✓ Saved privately to My Journey"}</p>}
                {activeGuide.creator && (
                  <div className="creator-cta">
                    <p className="eyebrow">Continue your journey</p>
                    <div className="creator-cta-head">
                      {activeGuide.creator.avatarUrl && <img className="profile-avatar" src={activeGuide.creator.avatarUrl} alt={activeGuide.creator.displayName} />}
                      <div>
                        <h3>{activeGuide.creator.displayName}</h3>
                        {activeGuide.creator.bio && <p>{activeGuide.creator.bio}</p>}
                      </div>
                    </div>
                    {activeGuide.creator.resourceTitle && (
                      <div className="creator-resource">
                        <strong>{activeGuide.creator.resourceTitle}</strong>
                        {activeGuide.creator.resourceDescription && <p>{activeGuide.creator.resourceDescription}</p>}
                      </div>
                    )}
                    {activeGuide.creator.resourceUrl && (
                      <div className="actions">
                        <a className="button primary" href={activeGuide.creator.resourceUrl} target="_blank" rel="noreferrer">
                          {activeGuide.creator.ctaLabel || "Learn more"} <span>→</span>
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        </main>
      )}

      {view === "message-score" && (
        <main className="score-page">
          <div className="score-orb orb-one" aria-hidden="true" />
          <div className="score-orb orb-two" aria-hidden="true" />
          {messageStage === "intro" && (
            <section className="score-intro">
              <div className="score-badge">Free 3-minute Heart Guide</div>
              <p className="eyebrow">Soul-Aligned Message Score</p>
              <h1>Is your message clear enough to attract the right clients?</h1>
              <p className="score-lede">Paste the message you currently use to explain your work. You’ll receive a score across five essential areas, practical guidance and a seven-day path to strengthen it.</p>
              <div className="score-promises">
                <span><b>100</b><small>point clarity score</small></span>
                <span><b>5</b><small>message dimensions</small></span>
                <span><b>7</b><small>days of clear action</small></span>
              </div>
              <button className="button primary score-start" onClick={() => setMessageStage("message")}>Score my message <span>→</span></button>
              <p className="trust"><span>✦</span> Supportive, confidential and free</p>
            </section>
          )}

          {messageStage === "message" && (
            <section className="score-card score-input-card">
              <button className="back" onClick={() => setMessageStage("intro")}>← Back</button>
              <div className="progress-line"><i style={{ width: "45%" }} /></div>
              <p className="step-label">Step 1 of 2</p>
              <h1>What message are you using now?</h1>
              <p>Paste your introduction, positioning statement, LinkedIn headline or the words you use when someone asks, “What do you do?”</p>
              <textarea value={currentMessage} onChange={(event) => setCurrentMessage(event.target.value)} placeholder="For example: I help heart-centred coaches…" autoFocus />
              <div className="word-count"><span>{currentMessage.trim().split(/\s+/).filter(Boolean).length} words</span><span>A rough draft is completely welcome.</span></div>
              <button className="button primary full-button" disabled={currentMessage.trim().length < 25} onClick={() => setMessageStage("details")}>Continue <span>→</span></button>
            </section>
          )}

          {messageStage === "details" && (
            <section className="score-card details-card">
              <button className="back" onClick={() => setMessageStage("message")}>← Back</button>
              <div className="progress-line"><i style={{ width: "90%" }} /></div>
              <p className="step-label">Step 2 of 2</p>
              <h1>Where should we send your report?</h1>
              <p>Your details also allow us to send the seven-day Message Clarity Blueprint and supportive follow-up.</p>
              <div className="field-grid">
                <label>First name<input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Your first name" /></label>
                <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
              </div>
              <label className="consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>I’d like to receive my report, blueprint and helpful guidance from Lotus. I can unsubscribe at any time.</span></label>
              <button className="button primary full-button" disabled={!firstName.trim() || !email.includes("@") || !consent || submissionState === "sending"} onClick={revealMessageScore}>{submissionState === "sending" ? "Preparing your report…" : "Reveal my Message Score"} <span>→</span></button>
              <p className="preview-note">Your details are used to deliver this report and the guidance you requested. You can unsubscribe at any time.</p>
            </section>
          )}

          {messageStage === "report" && (
            <section className="message-report">
              <header className="report-hero">
                <div><p className="eyebrow">Your results are ready, {firstName}</p><h1>Your Soul-Aligned Message Score</h1><p>Your message has a meaningful foundation. Here is where it already connects and where greater clarity can help the right clients recognise themselves.</p></div>
                <div className="score-ring" style={{ background: `conic-gradient(var(--jade) ${messageReport.total}%, #e8ece8 0)` }}><span>{messageReport.total}<small>/100</small></span></div>
              </header>
              <div className="score-status">{messageReport.total >= 80 ? "Compelling" : messageReport.total >= 60 ? "Resonant" : messageReport.total >= 40 ? "Emerging" : "Ready to clarify"}</div>
              {submissionState === "saved" && <p className="delivery-status success">✓ Your result has been added to your Heart Guide journey.</p>}
              {submissionState === "offline" && <p className="delivery-status">Your report is ready here. Email delivery will begin when the secure nurture connection is activated.</p>}
              <blockquote className="original-message">“{currentMessage}”</blockquote>
              <section className="category-results">
                <div className="section-heading"><p className="eyebrow">Your five dimensions</p><h2>Where your message is working</h2></div>
                {messageReport.categories.map((item) => <article key={item.name}><div className="category-top"><h3>{item.name}</h3><b>{item.score}<small>/20</small></b></div><div className="category-bar"><i style={{ width: `${item.score * 5}%` }} /></div><p>{item.note}</p></article>)}
              </section>
              <section className="report-insight">
                <p className="eyebrow">Your clearest opportunity</p>
                <h2>Make your value easier to recognise.</h2>
                <p>Your work already has depth. Now bring the message into one simple sequence: <strong>the right person, the problem they recognise, the transformation they want and the distinctive path you provide.</strong></p>
                <div className="message-formula"><span>Who</span><b>＋</b><span>Problem</span><b>＋</b><span>Transformation</span><b>＋</b><span>Your path</span></div>
              </section>
              <section className="blueprint-section">
                <div className="section-heading"><p className="eyebrow">Your seven-day blueprint</p><h2>One focused step each day</h2><p>This is the first foundation week from the wider Soul-Aligned Growth Blueprint.</p></div>
                <div className="day-grid">
                  {[['1','Right person','Choose one specific client and business stage.'],['2','Real problem','Name what feels urgent in their own words.'],['3','Transformation','Describe the result they can clearly picture.'],['4','Distinctive path','Name your method, perspective or principle.'],['5','Clear language','Remove vague terms and unnecessary promises.'],['6','One message','Write one concise, natural core statement.'],['7','Real-world test','Share it, listen for resonance and refine.']].map(([day,title,copy]) => <article key={day}><span>Day {day}</span><h3>{title}</h3><p>{copy}</p></article>)}
                </div>
              </section>
              <section className="validation-invite">
                <div><p className="eyebrow">Help shape the wider program</p><h2>Would you share your perspective?</h2><p>Your message is one foundation of a scalable heart-led business. Lotus is refining the <strong>Seven Figure Heart-Led Business Program™</strong> and inviting a small number of coaches to hear its five-stage outline and give honest feedback in a structured 20-minute conversation.</p><ul><li>This is not a sales call.</li><li>Lotus will mainly listen and take notes.</li><li>Your insight will help shape the program.</li></ul></div>
                <div className="invite-action"><span className="guide-icon">✦</span><h3>20-minute Validation Call</h3><p>Explore the program vision and answer eleven focused feedback questions.</p><a className="button primary" href="https://tidycal.com/lotus/feedback" target="_blank" rel="noreferrer" onClick={() => void sendLead("Validation Booking Clicked").catch(() => undefined)}>Book my feedback call <span>→</span></a><small>If the program is validated and relevant, a separate strategy session may be offered afterwards.</small></div>
              </section>
              <div className="report-actions"><button className="button secondary" onClick={() => window.print()}>Save my report</button><button className="text-button" onClick={startMessageScore}>Score another message</button></div>
            </section>
          )}
        </main>
      )}

      {view === "membership" && (
        <main className="membership-page">
          <section className="membership-hero">
            <div className="score-badge">{founderAccess ? "Founder Access active" : "Founding member invitation"}</div>
            <p className="eyebrow">Continue your Heart Guide journey</p>
            <h1>Return whenever you need a wiser next step.</h1>
            <p className="membership-lede">Every Heart Guide is free to use. Founder Access is for people who want to support Heart Guide from the start and lock in founder pricing for whatever comes next.</p>
            <div className="founder-price">
              <div><strong>$19</strong><span>/month</span></div>
              <i>or</i>
              <div><strong>$190</strong><span>/year</span><small>Save $38</small></div>
            </div>
            <ul className="membership-benefits">
              <li>Support Heart Guide as a founding member</li>
              <li>Founder pricing locked in for any future member-only offerings</li>
            </ul>
            {founderAccess ? (
              <button className="button primary membership-cta" onClick={() => navigate("library")}>Explore Heart Guides <span>→</span></button>
            ) : (
              <>
                <a className="button primary membership-cta" href={FOUNDER_CHECKOUT_URL}>Choose my Founder Access <span>→</span></a>
                <p className="membership-note">Secure checkout. Choose monthly or annual payment on the next page.</p>
              </>
            )}
          </section>
        </main>
      )}

      <footer><button className="brand footer-brand" onClick={() => navigate("home")}><Mark small /><span>Heart Guide</span></button><p>Guidance for a more connected life and soul-aligned business.</p><span>© 2026 Heart Guide</span></footer>
    </div>
  );
}
