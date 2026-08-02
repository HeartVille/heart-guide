import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_GUIDES = new Set(["connection", "pause", "boundaries", "visibility", "weekly"]);

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { data, error } = await supabase
    .from("guide_journey_entries")
    .select("id, guide_id, answers, current_step, completed, created_at, updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Unable to load journeys." }, { status: 500 });
  }

  return NextResponse.json({
    journeys: data.map((row) => ({
      id: row.id,
      guideId: row.guide_id,
      answers: row.answers ?? [],
      currentStep: row.current_step,
      completed: row.completed,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = (await request.json()) as {
    guideId?: string;
    journeyId?: string;
    answers?: unknown;
    currentStep?: number;
    completed?: boolean;
  };

  if (!body.guideId || !ALLOWED_GUIDES.has(body.guideId) || !Array.isArray(body.answers)) {
    return NextResponse.json({ error: "Invalid journey." }, { status: 400 });
  }

  const answers = body.answers.slice(0, 4).map((answer) => String(answer).slice(0, 5000));
  while (answers.length < 4) answers.push("");
  const currentStep = Math.max(0, Math.min(3, Number(body.currentStep) || 0));
  const completed = Boolean(body.completed);
  const updatedAt = new Date().toISOString();

  if (body.journeyId) {
    const { data, error } = await supabase
      .from("guide_journey_entries")
      .update({ answers, current_step: currentStep, completed, updated_at: updatedAt })
      .eq("id", body.journeyId)
      .select("id, created_at, updated_at")
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: "Unable to save." }, { status: 500 });
    }

    return NextResponse.json({ journeyId: data.id, createdAt: data.created_at, updatedAt: data.updated_at });
  }

  const { data, error } = await supabase
    .from("guide_journey_entries")
    .insert({
      user_id: user.id,
      guide_id: body.guideId,
      answers,
      current_step: currentStep,
      completed,
      updated_at: updatedAt,
    })
    .select("id, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "Unable to save." }, { status: 500 });
  }

  return NextResponse.json({ journeyId: data.id, createdAt: data.created_at, updatedAt: data.updated_at });
}
