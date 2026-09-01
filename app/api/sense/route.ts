// PILLAR 1 - SENSE
// Reads the live market with Tavily, then uses Groq to break the role into
// tasks and tag each task by how exposed it is to AI.

import { NextResponse } from "next/server";
import { groqJson, tavilySearch, hasGroq, hasTavily, type TavilyResult } from "@/lib/ai";
import { demoWeather } from "@/lib/demo";
import type { Weather } from "@/lib/core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["headline", "tasks", "rising", "decaying"],
  properties: {
    headline: {
      type: "string",
      description: "One sentence, max 30 words, on how this role is splitting under AI.",
    },
    tasks: {
      type: "array",
      minItems: 6,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["task", "exposure", "why"],
        properties: {
          task: { type: "string", description: "A concrete task, max 12 words." },
          exposure: { type: "string", enum: ["automate", "augment", "human"] },
          why: { type: "string", description: "One short sentence, max 20 words." },
        },
      },
    },
    rising: {
      type: "array",
      minItems: 3,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["skill", "note"],
        properties: {
          skill: { type: "string" },
          note: { type: "string", description: "Max 15 words on why it is rising." },
        },
      },
    },
    decaying: {
      type: "array",
      minItems: 2,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["skill", "note"],
        properties: {
          skill: { type: "string" },
          note: { type: "string", description: "Max 15 words on why it is fading." },
        },
      },
    },
  },
};

const SYSTEM = `You are the market-sensing engine inside Anukul, a career platform for Indian undergraduates.

Your job is to read real job postings and describe the role at the level of TASKS, never job titles.

Tag every task with exactly one exposure:
- "automate": AI can already do this end to end. A student should stop investing here.
- "augment": AI makes a human several times faster, but a human still drives. Learn the tool.
- "human": judgement, context, trust, accountability. Only a person can do it. Invest hardest here.

Give a realistic mix: roughly two automate, two augment, two human.
Write plainly for a first-year BCA student in Bihar. No hype, no buzzwords, no em dashes.
Never invent a statistic. Describe only what the sources support.`;

export async function POST(req: Request) {
  let role = "Data Analyst";
  let city = "Patna";
  try {
    const body = await req.json();
    if (typeof body.role === "string" && body.role.trim()) role = body.role.trim().slice(0, 60);
    if (typeof body.city === "string" && body.city.trim()) city = body.city.trim().slice(0, 60);
  } catch {
    /* use the defaults */
  }

  if (!hasGroq()) {
    return NextResponse.json({
      ...demoWeather(role, city),
      note: "Demo data. Set GROQ_API_KEY to read the market live.",
    });
  }

  let results: TavilyResult[] = [];
  let searchFailed = false;
  if (hasTavily()) {
    try {
      results = await tavilySearch(
        `"${role}" job openings ${city} India required skills responsibilities 2026`,
        8
      );
    } catch {
      searchFailed = true;
    }
  }

  const evidence = results.length
    ? results
        .map((r, i) => `[${i + 1}] ${r.title}\n${r.url}\n${r.content}`)
        .join("\n\n")
    : "(No live postings retrieved. Use your general knowledge of the Indian job market, and keep claims conservative.)";

  try {
    const out = await groqJson<Omit<Weather, "role" | "city" | "sources" | "live">>(
      [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content:
            `Role: ${role}\nCity: ${city}\nToday: ${new Date().toISOString().slice(0, 10)}\n\n` +
            `Live search results:\n\n${evidence}`,
        },
      ],
      schema,
      "skill_weather"
    );

    const weather: Weather = {
      role,
      city,
      headline: out.headline,
      tasks: out.tasks,
      rising: out.rising,
      decaying: out.decaying,
      sources: results.map((r) => ({ title: r.title, url: r.url })),
      live: true,
      note: results.length
        ? undefined
        : searchFailed
          ? "Live search did not respond. Tagging came from the model alone."
          : "No TAVILY_API_KEY set, so this run used the model's own knowledge rather than live postings.",
    };
    return NextResponse.json(weather);
  } catch (err) {
    return NextResponse.json({
      ...demoWeather(role, city),
      note: `Live call failed, showing demo data. (${(err as Error).message.slice(0, 120)})`,
    });
  }
}
