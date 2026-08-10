export type MessageDimension = {
  name: string;
  score: number;
  note: string;
};

export type MessageScore = {
  total: number;
  categories: MessageDimension[];
  strongestArea: string;
  priorityArea: string;
  opportunityTitle: string;
  opportunity: string;
};

const includesAny = (text: string, terms: string[]) =>
  terms.reduce((count, term) => count + (text.includes(term) ? 1 : 0), 0);

const clamp = (score: number) => Math.max(1, Math.min(20, Math.round(score)));

export function scoreMessage(message: string): MessageScore {
  const text = message.toLowerCase().replace(/[’]/g, "'");
  const words = message.trim().split(/\s+/).filter(Boolean);
  const sentences = message.split(/[.!?]+/).filter((sentence) => sentence.trim().length > 0);

  const audienceNouns = ["coach", "consultant", "entrepreneur", "founder", "leader", "therapist", "healer", "creative", "practitioner", "professional", "parent", "team", "business owner", "client"];
  const audienceStages = ["new", "starting", "growing", "established", "first", "early-stage", "six-figure", "transitioning", "burned out", "overwhelmed"];
  const genericAudiences = ["everyone", "anyone", "people who want", "all businesses"];
  const problemTerms = ["struggle", "stuck", "overwhelm", "unclear", "inconsistent", "frustrat", "exhaust", "burnout", "confus", "fear", "doubt", "pressure", "challenge"];
  const outcomeTerms = ["clarity", "confidence", "revenue", "freedom", "connection", "clients", "sales", "focus", "energy", "impact", "growth", "calm", "consistent"];
  const pathTerms = ["through", "using", "with my", "method", "framework", "approach", "system", "process", "practice", "model", "principle"];
  const jargonTerms = ["unlock", "activate", "quantum", "next level", "empower", "authentic self", "transformational journey", "holistic solution", "leverage synergies"];

  let audience = 5;
  audience += Math.min(6, includesAny(text, audienceNouns) * 2);
  audience += Math.min(5, includesAny(text, audienceStages) * 2.5);
  if (/\b(i help|i support|i work with|for)\b/.test(text)) audience += 3;
  audience -= includesAny(text, genericAudiences) * 4;

  let problem = 5;
  problem += Math.min(8, includesAny(text, problemTerms) * 2.5);
  if (/\b(struggling with|tired of|stuck in|without|despite|even though|who (?:are|feel|want))\b/.test(text)) problem += 4;
  if (/\b(when|because|so that)\b/.test(text)) problem += 2;

  let transformation = 5;
  transformation += Math.min(7, includesAny(text, outcomeTerms) * 2);
  if (/\b(from .{2,45} to|so (?:you|they) can|help\w* .{2,60} (?:create|build|grow|become|feel|achieve|get))\b/.test(text)) transformation += 5;
  if (/\b\d+(?:%|k| days?| weeks?| months?| clients?)\b/.test(text)) transformation += 3;

  let distinction = 4;
  distinction += Math.min(8, includesAny(text, pathTerms) * 3);
  if (/\b(my|our) (?:[a-z-]+ ){1,4}(?:method|framework|system|process|approach|model)\b/.test(text)) distinction += 5;
  if (/\b(without|instead of|unlike)\b/.test(text)) distinction += 3;

  let simplicity = 20;
  if (words.length < 8) simplicity -= 7;
  else if (words.length > 75) simplicity -= 8;
  else if (words.length > 55) simplicity -= 4;
  if (sentences.length > 3) simplicity -= 3;
  if (words.length / Math.max(1, sentences.length) > 32) simplicity -= 3;
  simplicity -= Math.min(6, includesAny(text, jargonTerms) * 2);
  if (!/[,:;—-]/.test(message) && words.length > 35) simplicity -= 2;

  const audienceScore = clamp(audience);
  const problemScore = clamp(problem);
  const transformationScore = clamp(transformation);
  const distinctionScore = clamp(distinction);
  const simplicityScore = clamp(simplicity);

  const categories: MessageDimension[] = [
    {
      name: "Right-Person Clarity",
      score: audienceScore,
      note: audienceScore >= 15 ? "The right person can recognise themselves quickly." : "Name one specific person and the stage or situation they are in.",
    },
    {
      name: "Real-Problem Relevance",
      score: problemScore,
      note: problemScore >= 15 ? "The message reflects a problem that feels real and immediate." : "Describe the problem in words a client would naturally use.",
    },
    {
      name: "Transformation Clarity",
      score: transformationScore,
      note: transformationScore >= 15 ? "The change you help create is easy to picture." : "Show what becomes meaningfully different after working with you.",
    },
    {
      name: "Distinctive Path",
      score: distinctionScore,
      note: distinctionScore >= 15 ? "Your way of creating the result feels identifiable." : "Name the method, principle or perspective that makes your approach yours.",
    },
    {
      name: "Simplicity & Resonance",
      score: simplicityScore,
      note: simplicityScore >= 15 ? "The message is concise enough to absorb in one pass." : "Remove extra ideas and keep one person, problem, result and path.",
    },
  ];

  const ranked = [...categories].sort((a, b) => b.score - a.score);
  const priority = ranked[ranked.length - 1];
  const opportunities: Record<string, { title: string; copy: string }> = {
    "Right-Person Clarity": { title: "Let the right person recognise themselves.", copy: "Lead with one specific kind of client and the moment they are navigating now. Specificity creates recognition; it does not make your work smaller." },
    "Real-Problem Relevance": { title: "Bring the real problem closer.", copy: "Use the language clients say privately about what is difficult now. A recognisable problem gives the rest of your message emotional relevance." },
    "Transformation Clarity": { title: "Make the change easier to picture.", copy: "Describe the meaningful difference your work creates in concrete human terms. Let the reader see where they could move from and towards." },
    "Distinctive Path": { title: "Make your way of helping visible.", copy: "Name the method, lived perspective or guiding principle behind your work. This gives people a reason to choose your path rather than only the promised result." },
    "Simplicity & Resonance": { title: "Give the message one clear job.", copy: "Keep one right person, one pressing problem, one desired change and one distinctive path. Remove anything that competes with that sequence." },
  };
  const opportunity = opportunities[priority.name];

  return {
    total: categories.reduce((sum, item) => sum + item.score, 0),
    categories,
    strongestArea: ranked[0].name,
    priorityArea: priority.name,
    opportunityTitle: opportunity.title,
    opportunity: opportunity.copy,
  };
}
