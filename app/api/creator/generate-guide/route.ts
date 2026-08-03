import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const CATEGORIES = ["Relationships", "Business", "Wellbeing"];
const COLOURS = ["jade", "violet", "aqua", "gold", "rose", "sage"];

const SYSTEM_PROMPT = `You write short, warm Heart Guides: a four-step reflective journey that helps someone think through a situation in their relationships, business or wellbeing, and leave with one honest next step.

Tone: gentle, second person ("you"), concrete, no jargon or hype. Never clinical or corporate.

Each guide has exactly four steps, always following this arc:
1. Arrive — a short grounding question that invites the person to name the situation.
2. Notice / Soften / Honour (pick whichever fits) — surfaces what is difficult, felt, or at stake.
3. Listen / Align / Recognise (pick whichever fits) — uncovers the deeper need, truth or longing beneath it.
4. Choose / Express / Orient (pick whichever fits) — lands on one small, concrete action the person could take.

Each step needs: a one-word label, a single reflective question (one sentence, warm, specific), and a short placeholder showing the kind of answer expected (a few words or examples, ending in an ellipsis).

Also produce: a short evocative title (2-4 words, title case), a one-sentence description of who this helps and with what, a category (Relationships, Business, or Wellbeing), a colour (jade, violet, aqua, gold, rose, or sage), and a single simple line-art unicode symbol character (like ♡ ⌁ ◌ ◇ ☼ ✦ ✧ ☾) — not a colour emoji.

Respond only with the guide, shaped by the topic the creator gives you.`;

const GUIDE_SCHEMA = {
  name: "heart_guide",
  strict: true,
  schema: {
    type: "object",
    properties: {
      title: { type: "string" },
      category: { type: "string", enum: CATEGORIES },
      description: { type: "string" },
      colour: { type: "string", enum: COLOURS },
      symbol: { type: "string" },
      questions: {
        type: "array",
        minItems: 4,
        maxItems: 4,
        items: {
          type: "object",
          properties: {
            label: { type: "string" },
            question: { type: "string" },
            placeholder: { type: "string" },
          },
          required: ["label", "question", "placeholder"],
          additionalProperties: false,
        },
      },
    },
    required: ["title", "category", "description", "colour", "symbol", "questions"],
    additionalProperties: false,
  },
} as const;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "AI generation is not configured yet." }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as { topic?: string } | null;
  const topic = body?.topic?.trim().slice(0, 500);
  if (!topic || topic.length < 5) {
    return NextResponse.json({ error: "Describe what this guide should help with." }, { status: 400 });
  }

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: topic },
        ],
        response_format: { type: "json_schema", json_schema: GUIDE_SCHEMA },
        temperature: 0.8,
      }),
    });
  } catch {
    return NextResponse.json({ error: "Unable to reach the AI writer right now." }, { status: 502 });
  }

  if (!response.ok) {
    return NextResponse.json({ error: "Unable to generate a guide right now." }, { status: 502 });
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;

  let parsed: {
    title?: string;
    category?: string;
    description?: string;
    colour?: string;
    symbol?: string;
    questions?: { label: string; question: string; placeholder: string }[];
  } | null = null;

  try {
    parsed = content ? JSON.parse(content) : null;
  } catch {
    parsed = null;
  }

  if (!parsed || !Array.isArray(parsed.questions) || parsed.questions.length !== 4) {
    return NextResponse.json({ error: "Unable to generate a guide right now." }, { status: 502 });
  }

  return NextResponse.json({
    guide: {
      title: parsed.title ?? "",
      category: CATEGORIES.includes(parsed.category ?? "") ? parsed.category : "Wellbeing",
      description: parsed.description ?? "",
      colour: COLOURS.includes(parsed.colour ?? "") ? parsed.colour : "jade",
      symbol: (parsed.symbol ?? "✦").trim().slice(0, 2) || "✦",
      questions: parsed.questions.map((question) => ({
        label: question.label ?? "",
        question: question.question ?? "",
        placeholder: question.placeholder ?? "",
      })),
    },
  });
}
