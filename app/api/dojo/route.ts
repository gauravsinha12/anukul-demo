// AI INTERVIEW DOJO
// mode "ask"   -> one interview question aimed at the human-premium half of the role
// mode "grade" -> rubric feedback on the student's answer
//
// This is the one place in the demo a judge can type into. It should feel fair,
// specific, and never cruel.

import { NextResponse } from "next/server";
import { groqJson, hasGroq } from "@/lib/ai";
import { demoDojoQuestion, demoDojoGrade } from "@/lib/demo";
import type { DojoQuestion, DojoGrade } from "@/lib/core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const askSchema = {
  type: "object",
  additionalProperties: false,
  required: ["question", "focus"],
  properties: {
    question: {
      type: "string",
      description:
        "One interview question, max 45 words, about judgement rather than syntax. Set a concrete situation.",
    },
    focus: { type: "string", description: "Max 12 words on what this question is really testing." },
  },
};

const gradeSchema = {
  type: "object",
  additionalProperties: false,
  required: ["overall", "scores", "strength", "fix"],
  properties: {
    overall: { type: "integer", minimum: 0, maximum: 100 },
    scores: {
      type: "array",
      minItems: 4,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["criterion", "score", "max", "comment"],
        properties: {
          criterion: { type: "string", enum: ["Structure", "Specifics", "Client sense", "Brevity"] },
          score: { type: "integer", minimum: 0, maximum: 10 },
          max: { type: "integer", enum: [10] },
          comment: { type: "string", description: "One actionable sentence, max 25 words." },
        },
      },
    },
    strength: { type: "string", description: "The single best thing they did. Max 25 words." },
    fix: { type: "string", description: "The one change that would help most next time. Max 25 words." },
  },
};

const ASK_SYSTEM = `You are the interview coach inside Anukul, preparing Indian undergraduates for their first real interview.

Ask about judgement, not syntax. Put the student in a concrete situation with a real client, a real deadline or a real ambiguity. Never ask a definition question, and never ask them to write code.

Plain English, no jargon, no em dashes.`;

const GRADE_SYSTEM = `You are the interview coach inside Anukul, giving a first-year Indian undergraduate feedback on a practice answer.

Score four criteria out of 10: Structure, Specifics, Client sense, Brevity.

Be honest and be kind. This student may be interviewing for the first time and may not be a native English speaker. Never mark down grammar or accent. Mark the thinking.

Every comment must say what to do differently, not just what was wrong. If the answer is very short or empty, say so plainly and score it low, but still show what a good answer would have opened with.

Plain English, no em dashes.`;

export async function POST(req: Request) {
  let mode = "ask";
  let role = "Data Analyst";
  let question = "";
  let answer = "";

  try {
    const b = await req.json();
    if (b.mode === "grade") mode = "grade";
    if (typeof b.role === "string") role = b.role.slice(0, 60);
    if (typeof b.question === "string") question = b.question.slice(0, 800);
    if (typeof b.answer === "string") answer = b.answer.slice(0, 4000);
  } catch {
    /* use the defaults */
  }

  if (!hasGroq()) {
    return NextResponse.json(
      mode === "grade"
        ? { ...demoDojoGrade(), note: "Demo data. Set GROQ_API_KEY for live coaching." }
        : { ...demoDojoQuestion(role), note: "Demo data. Set GROQ_API_KEY for live questions." }
    );
  }

  try {
    if (mode === "ask") {
      const out = await groqJson<Omit<DojoQuestion, "live">>(
        [
          { role: "system", content: ASK_SYSTEM },
          { role: "user", content: `Target role: ${role}. Ask one question.` },
        ],
        askSchema,
        "dojo_question"
      );
      return NextResponse.json({ ...out, live: true } satisfies DojoQuestion);
    }

    const out = await groqJson<Omit<DojoGrade, "live">>(
      [
        { role: "system", content: GRADE_SYSTEM },
        {
          role: "user",
          content:
            `Target role: ${role}\n\nQuestion asked:\n${question}\n\n` +
            `The student's answer:\n${answer || "(the student did not answer)"}`,
        },
      ],
      gradeSchema,
      "dojo_grade"
    );
    return NextResponse.json({ ...out, live: true } satisfies DojoGrade);
  } catch (err) {
    const note = `Live call failed, showing demo data. (${(err as Error).message.slice(0, 120)})`;
    return NextResponse.json(
      mode === "grade" ? { ...demoDojoGrade(), note } : { ...demoDojoQuestion(role), note }
    );
  }
}
