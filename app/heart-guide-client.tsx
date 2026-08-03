"use client";

import { useEffect, useMemo, useState } from "react";

type View = "home" | "library" | "journey" | "my-journey" | "message-score" | "membership" | "creator";
type Category = "All" | "Relationships" | "Business" | "Wellbeing";
type SignedInUser = { email: string; name: string };
type SavedJourney = {
  id: string;
  guideId: keyof typeof guideJourneys;
  answers: string[];
  currentStep: number;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

const guides = [
  {
    id: "connection",
    title: "Connection Clarity",
    category: "Relationships",
    description: "Understand what is creating distance and discover one honest next step towards deeper connection.",
    duration: "1–3 min",
    colour: "jade",
    symbol: "♡",
    access: "Free",
  },
  {
    id: "business",
    title: "Soul-Aligned Message Score",
    category: "Business",
    description: "Discover how clearly your message speaks to the right clients and receive a personalised path to strengthen it.",
    duration: "1–3 min",
    colour: "violet",
    symbol: "✦",
    access: "Free",
  },
  {
    id: "pause",
    title: "Heart-Mindful Pause",
    category: "Wellbeing",
    description: "Pause, listen inwardly and return to your day with greater presence, softness and choice.",
    duration: "1–3 min",
    colour: "aqua",
    symbol: "⌁",
    access: "Free",
  },
  {
    id: "boundaries",
    title: "Loving Boundaries",
    category: "Relationships",
    description: "Find language for a clear boundary that honours both your needs and the relationship.",
    duration: "1–3 min",
    colour: "gold",
    symbol: "◌",
    access: "Free",
  },
  {
    id: "visibility",
    title: "Aligned Visibility",
    category: "Business",
    description: "Find a way to be seen that feels natural, useful and true to the work you are here to share.",
    duration: "1–3 min",
    colour: "rose",
    symbol: "◇",
    access: "Free",
  },
  {
    id: "weekly",
    title: "Weekly Heart Compass",
    category: "Wellbeing",
    description: "Reflect on the week, recognise what matters and choose a grounded intention for what comes next.",
    duration: "1–3 min",
    colour: "sage",
    symbol: "☼",
    access: "Free",
  },
] as const;

const guideJourneys = {
  connection: [
  {
    label: "Arrive",
    question: "Before we explore the situation, take one gentle breath. What relationship would you like clarity about today?",
    placeholder: "For example, my partner, a family member, a colleague…",
  },
  {
    label: "Notice",
    question: "When you think about this relationship now, what feels most difficult or unresolved?",
    placeholder: "Share only what feels comfortable…",
  },
  {
    label: "Listen",
    question: "Beneath the difficulty, what are you longing to feel, receive or express?",
    placeholder: "Perhaps understanding, safety, honesty, closeness…",
  },
  {
    label: "Choose",
    question: "What is one small, loving and honest action you could take within the next seven days?",
    placeholder: "A conversation, a boundary, a moment of care…",
  },
  ],
  pause: [
    {
      label: "Arrive",
      question: "Before doing anything else, what do you notice in your body and breath right now?",
      placeholder: "There is no need to change it—simply notice…",
    },
    {
      label: "Soften",
      question: "What are you carrying today that could be held with a little more kindness?",
      placeholder: "A feeling, pressure, decision or unfinished moment…",
    },
    {
      label: "Listen",
      question: "If your heart could offer one quiet piece of wisdom, what might it say?",
      placeholder: "Let the answer be simple…",
    },
    {
      label: "Return",
      question: "What small choice would help you return to your day with greater presence?",
      placeholder: "One breath, boundary, conversation or act of care…",
    },
  ],
  boundaries: [
    { label: "Arrive", question: "Where in your life is a boundary asking to be heard?", placeholder: "A relationship, request or recurring situation…" },
    { label: "Notice", question: "What happens inside you when this boundary is crossed or left unspoken?", placeholder: "Notice feelings, sensations and familiar patterns…" },
    { label: "Honour", question: "What need or value would this boundary protect?", placeholder: "Rest, respect, time, safety, honesty…" },
    { label: "Express", question: "How could you express this boundary clearly, warmly and without over-explaining?", placeholder: "Try: I care about… and I need…" },
  ],
  visibility: [
    { label: "Arrive", question: "Where are you longing to be more visible in your work?", placeholder: "A conversation, platform, offer or audience…" },
    { label: "Notice", question: "What feels uncomfortable or unsafe about being seen there?", placeholder: "Name the fear without judging it…" },
    { label: "Align", question: "What useful truth or lived wisdom are you ready to share?", placeholder: "Something your right people genuinely need…" },
    { label: "Choose", question: "What is one natural, generous visibility action you can take this week?", placeholder: "A post, invitation, conversation or collaboration…" },
  ],
  weekly: [
    { label: "Arrive", question: "As you arrive at the end of this week, what feels most alive in you?", placeholder: "A feeling, image, word or moment…" },
    { label: "Recognise", question: "What are you proud of, grateful for or learning from?", placeholder: "Include small moments as well as milestones…" },
    { label: "Release", question: "What are you ready to stop carrying into the next week?", placeholder: "A pressure, expectation, task or old story…" },
    { label: "Orient", question: "What heart-led intention will guide your next seven days?", placeholder: "Choose one clear and grounded intention…" },
  ],
} as const;

const journeyDetails = {
  connection: { symbol: "♡", category: "Relationship Guide", title: "Connection Clarity" },
  pause: { symbol: "⌁", category: "Wellbeing Guide", title: "Heart-Mindful Pause" },
  boundaries: { symbol: "◌", category: "Relationship Guide", title: "Loving Boundaries" },
  visibility: { symbol: "◇", category: "Business Guide", title: "Aligned Visibility" },
  weekly: { symbol: "☼", category: "Wellbeing Guide", title: "Weekly Heart Compass" },
} as const;

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
}: {
  user: SignedInUser | null;
  founderAccess: boolean;
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
  const [activeGuide, setActiveGuide] = useState<keyof typeof guideJourneys>("connection");
  const [profileOpen, setProfileOpen] = useState(false);
  const [savedJourneys, setSavedJourneys] = useState<SavedJourney[]>([]);
  const [activeJourneyId, setActiveJourneyId] = useState<string | null>(null);
  const [journeysLoading, setJourneysLoading] = useState(Boolean(user));
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const journeySteps = guideJourneys[activeGuide];
  const journeyDetail = journeyDetails[activeGuide];

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

  function canOpenGuide(id: string, access: string) {
    if (!user) {
      window.location.assign("/sign-in?next=/");
      return false;
    }
    if (access === "Member" && !founderAccess) {
      navigate("membership");
      return false;
    }
    return id in guideJourneys;
  }

  function startGuide(id: string, access: string = "Free") {
    if (id === "business") {
      startMessageScore();
      return;
    }
    if (!(id in guideJourneys)) {
      setNotice("This guide is being lovingly prepared.");
      return;
    }
    if (!canOpenGuide(id, access)) return;
    setActiveGuide(id as keyof typeof guideJourneys);
    const saved = savedJourneys.find((journey) => journey.guideId === id && !journey.completed);
    setActiveJourneyId(saved?.id ?? null);
    setStep(saved?.currentStep ?? 0);
    setAnswers(saved?.answers?.length === 4 ? saved.answers : ["", "", "", ""]);
    setFinished(saved?.completed ?? false);
    setSaveState(saved ? "saved" : "idle");
    navigate("journey");
  }

  function openSavedJourney(journey: SavedJourney) {
    const guide = guides.find((item) => item.id === journey.guideId);
    if (!canOpenGuide(journey.guideId, guide?.access ?? "Free")) return;
    setActiveGuide(journey.guideId);
    setActiveJourneyId(journey.id);
    setStep(journey.currentStep);
    setAnswers(journey.answers?.length === 4 ? journey.answers : ["", "", "", ""]);
    setFinished(journey.completed);
    setSaveState("saved");
    navigate("journey");
  }

  function startNewJourney(id: keyof typeof guideJourneys) {
    const guide = guides.find((item) => item.id === id);
    if (!canOpenGuide(id, guide?.access ?? "Free")) return;
    setActiveGuide(id);
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
        body: JSON.stringify({ journeyId: activeJourneyId, guideId: activeGuide, answers, currentStep: nextStep, completed: isCompleted }),
      });
      if (!response.ok) throw new Error("Unable to save");
      const result = (await response.json()) as { journeyId: string; createdAt: string; updatedAt: string };
      setActiveJourneyId(result.journeyId);
      setSavedJourneys((current) => [
        { id: result.journeyId, guideId: activeGuide, answers, currentStep: nextStep, completed: isCompleted, createdAt: current.find((journey) => journey.id === result.journeyId)?.createdAt ?? result.createdAt, updatedAt: result.updatedAt },
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
          <button className={view === "creator" ? "active" : ""} onClick={() => navigate("creator")}>For Creators</button>
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
              <button className={`feature-card ${guide.colour}`} key={guide.id} onClick={() => guide.id === "business" ? startMessageScore() : startGuide(guide.id, guide.access)}>
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
                  <div className="guide-meta"><span>{guide.category}</span><span>{guide.access}</span></div>
                  <h2>{guide.title}</h2>
                  <p>{guide.description}</p>
                  <div className="guide-footer"><small>{guide.duration}</small><button onClick={() => startGuide(guide.id, guide.access)}>Begin guide →</button></div>
                </div>
              </article>
            ))}
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
                const detail = journeyDetails[journey.guideId];
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

      {view === "journey" && (
        <main className="journey-page">
          <aside className="journey-side">
            <button className="back" onClick={() => navigate("library")}>← Back to guides</button>
            <div className="journey-title"><span className="guide-icon">{journeyDetail.symbol}</span><p>{journeyDetail.category}</p><h1>{journeyDetail.title}</h1></div>
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
                <p className="eyebrow">Your {journeyDetail.title} reflection</p>
                <h2>A gentle next step has emerged.</h2>
                <p>You began by listening to what is difficult, then named the deeper longing beneath it. The action you chose is:</p>
                <blockquote>“{answers[3]}”</blockquote>
                <p className="result-note">Carry this as an invitation rather than another task. Notice what support, timing or boundary would help you approach it with care.</p>
                <div className="actions"><button className="button primary" onClick={() => window.print()}>Print my reflection</button><button className="button secondary" onClick={openMyJourney}>My Journey</button><button className="text-button" onClick={() => startNewJourney(activeGuide)}>Start this guide again</button></div>
                {user && <p className={`save-status ${saveState}`}>{saveState === "saving" ? "Saving privately…" : saveState === "error" ? "Could not save just now." : "✓ Saved privately to My Journey"}</p>}
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

      {view === "creator" && (
        <main className="creator-page">
          <aside className="creator-nav">
            <div><Mark small /><strong>Creator Studio</strong></div>
            <button className="active">⌂ &nbsp; Overview</button><button>◇ &nbsp; Heart Guides</button><button>♙ &nbsp; Members</button><button>⌁ &nbsp; Insights</button><button>⚙ &nbsp; Settings</button>
          </aside>
          <section className="dashboard">
            <div className="dashboard-head"><div><p className="eyebrow">Heart Guide Studio</p><h1>Good afternoon, Lotus.</h1><p>Here is how your Guides are supporting people.</p></div><button className="button primary" onClick={() => setNotice("The Guide Builder will be activated in the next stage.")}>＋ Create a Heart Guide</button></div>
            <div className="metrics"><article><small>Published Guides</small><strong>6</strong><span>3 free · 3 member</span></article><article><small>Message Scores</small><strong>128</strong><span className="positive">↑ 18% this month</span></article><article><small>Validation invites</small><strong>91</strong><span>GHL nurture ready</span></article><article><small>Calls booked</small><strong>24</strong><span>Validation before strategy</span></article></div>
            <div className="dashboard-grid">
              <section className="panel"><div className="panel-title"><div><h2>Your Heart Guides</h2><p>Manage and understand each journey.</p></div><button onClick={() => navigate("library")}>View library →</button></div>{guides.slice(0, 4).map((guide, index) => <div className="guide-row" key={guide.id}><span className={`mini-icon ${guide.colour}`}>{guide.symbol}</span><div><strong>{guide.title}</strong><small>{index === 0 ? "Published · Free" : index < 3 ? "Published" : "Draft"}</small></div><b>{[56, 32, 27, 0][index]} journeys</b><button aria-label={`Edit ${guide.title}`}>•••</button></div>)}</section>
              <section className="panel insight-panel"><div className="panel-title"><div><h2>Recent insight</h2><p>Last 30 days</p></div></div><div className="completion-ring"><span>71<small>%</small></span></div><h3>People are completing the journey.</h3><p>Connection Clarity has your strongest completion rate this month.</p><button className="button secondary" onClick={() => setNotice("Detailed analytics will be connected in the next stage.")}>View insights</button></section>
            </div>
          </section>
        </main>
      )}

      <footer><button className="brand footer-brand" onClick={() => navigate("home")}><Mark small /><span>Heart Guide</span></button><p>Guidance for a more connected life and soul-aligned business.</p><span>© 2026 Heart Guide</span></footer>
    </div>
  );
}
