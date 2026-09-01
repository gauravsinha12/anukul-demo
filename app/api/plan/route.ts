// PILLAR 3 - STEP
// Turns the gap between the Skill Mirror and the market into one three-hour
// Sunday: 60 minutes learn, 90 minutes build, 30 minutes prove.

import { NextResponse } from "next/server";
import { groqJson, hasGroq, safeUrl } from "@/lib/ai";
import { demoPlan } from "@/lib/demo";
import type { Plan } from "@/lib/core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["focusSkill", "why", "learn", "build", "prove", "whatsapp"],
  properties: {
    focusSkill: { type: "string", description: "The single skill this week is about." },
    why: { type: "string", description: "Max 30 words. Why this skill, this week, for this student." },
    learn: {
      type: "array",
      minItems: 2,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "source", "url", "minutes"],
        properties: {
          title: { type: "string" },
          source: { type: "string", description: "NPTEL, SWAYAM, official documentation, or a well-known free site." },
          url: { type: "string", description: "A real, stable https URL. Prefer a documentation root over a deep link." },
          minutes: { type: "integer", minimum: 10, maximum: 40 },
        },
      },
    },
    build: {
      type: "object",
      additionalProperties: false,
      required: ["brief", "deliverable", "rubric", "minutes"],
      properties: {
        brief: {
          type: "string",
          description:
            "A real 90-minute task for a small Indian business or campus problem. Concrete, specific, achievable by a first-year student. Max 60 words.",
        },
        deliverable: { type: "string", description: "Exactly what they hand in. Max 20 words." },
        rubric: {
          type: "array",
          minItems: 3,
          maxItems: 4,
          items: { type: "string", description: "One checkable criterion, max 14 words." },
        },
        minutes: { type: "integer" },
      },
    },
    prove: {
      type: "object",
      additionalProperties: false,
      required: ["instruction", "minutes"],
      properties: {
        instruction: { type: "string", description: "How the Pod of five reviews it. Max 35 words." },
        minutes: { type: "integer" },
      },
    },
    whatsapp: {
      type: "string",
      description:
        "The nudge that lands on WhatsApp at 7am Sunday. Under 30 words, uses the student's name and a real number from their Mirror, ends with a question.",
    },
  },
};

const SYSTEM = `You are the planning engine inside Anukul, a career platform for Indian undergraduates.

You produce exactly one week of work: 60 minutes of learning, 90 minutes of building, 30 minutes of peer review. Never more.

Hard rules:
- You CURATE free material. Never invent a course, and never suggest anything a student has to pay for.
- Prefer NPTEL, SWAYAM, official product documentation, MDN, and other well-known free sources.
- The build task must be real work for a real small business or campus problem, not a tutorial exercise. It must be finishable in 90 minutes by a first-year BCA student.
- Pick ONE focus skill: the biggest gap between what this student has and what their market is asking for.
- Write plainly. No hype, no buzzwords, no em dashes. Indian context throughout.`;

export async function POST(req: Request) {
  let role = "Data Analyst";
  let studentName = "Prachi";
  let gapsText = "";
  let weatherText = "";
  let mirrorText = "";

  try {
    const b = await req.json();
    if (typeof b.role === "string") role = b.role.slice(0, 60);
    if (typeof b.studentName === "string" && b.studentName.trim()) {
      studentName = b.studentName.trim().slice(0, 40);
    }
    if (Array.isArray(b.gaps)) {
      gapsText = b.gaps
        .map((g: { skill: string; have: number; note: string }) => `- ${g.skill}: student is at ${g.have}/100. Market: ${g.note}`)
        .join("\n");
    }
    if (Array.isArray(b.skills)) {
      mirrorText = b.skills
        .map((s: { name: string; effective: number; lastUsedMonths: number }) =>
          `- ${s.name}: ${s.effective}/100 after decay, last used ${s.lastUsedMonths} months ago`
        )
        .join("\n");
    }
    if (typeof b.headline === "string") weatherText = b.headline;
  } catch {
    /* use the defaults */
  }

  if (!hasGroq()) {
    return NextResponse.json({
      ...demoPlan("", studentName),
      note: "Demo data. Set GROQ_API_KEY to generate a live plan.",
    });
  }

  try {
    const out = await groqJson<Omit<Plan, "live">>(
      [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content:
            `Student: ${studentName}, BCA Semester 1, Patna.\n` +
            `Target role: ${role}\n\n` +
            `What the market is doing:\n${weatherText}\n\n` +
            `Their Skill Mirror (decay-adjusted):\n${mirrorText}\n\n` +
            `Gaps against rising demand:\n${gapsText}\n\n` +
            `Build this Sunday's plan.`,
        },
      ],
      schema,
      "sunday_plan"
    );

    const plan: Plan = {
      ...out,
      learn: out.learn.map((l) => ({
        ...l,
        url: safeUrl(l.url, `${l.title} ${l.source}`),
      })),
      live: true,
    };
    return NextResponse.json(plan);
  } catch (err) {
    return NextResponse.json({
      ...demoPlan("", studentName),
      note: `Live call failed, showing demo data. (${(err as Error).message.slice(0, 120)})`,
    });
  }
}
