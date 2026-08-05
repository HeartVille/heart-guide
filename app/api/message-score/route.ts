import { NextResponse } from "next/server";
import { notifyMessageScoreLead } from "@/lib/notify";

type LeadPayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
  consent?: boolean;
  message?: string;
  totalScore?: number;
  categoryScores?: Record<string, number>;
  strongestArea?: string;
  priorityArea?: string;
  stage?: string;
  source?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as LeadPayload;
  if (!body.consent || !body.firstName || !body.email?.includes("@") || !body.message) {
    return NextResponse.json({ error: "Valid consented contact details are required." }, { status: 400 });
  }

  if (body.stage === "Message Score Completed") {
    await notifyMessageScoreLead(body.email, body.firstName, body.totalScore);
  }

  const webhookUrl = process.env.GHL_MESSAGE_SCORE_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json({ delivered: false, configured: false });
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      event: "message_score_completed",
      source: body.source ?? "Heart Guide — Soul-Aligned Message Score",
      first_name: body.firstName.trim(),
      last_name: body.lastName?.trim() ?? "",
      email: body.email.trim(),
      consent: "True",
      consent_timestamp: new Date().toISOString(),
      original_message: body.message.trim(),
      overall_score: body.totalScore,
      right_person_clarity: body.categoryScores?.["Right-Person Clarity"],
      real_problem_relevance: body.categoryScores?.["Real-Problem Relevance"],
      transformation_clarity: body.categoryScores?.["Transformation Clarity"],
      distinctive_path: body.categoryScores?.["Distinctive Path"],
      simplicity_resonance: body.categoryScores?.["Simplicity & Resonance"],
      greatest_strength: body.strongestArea,
      priority_improvement: body.priorityArea,
      suggested_message: "I help [specific right person] move from [recognisable problem] to [meaningful result] through [my distinctive path], without [important sacrifice].",
      journey_stage: "Message Score Completed",
      completed_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: "The nurture connection did not accept this result." }, { status: 502 });
  }

  return NextResponse.json({ delivered: true, configured: true });
}
