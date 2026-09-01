// Tells the UI which keys actually landed. Reports presence only, never a value.
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    groq: Boolean(process.env.GROQ_API_KEY),
    tavily: Boolean(process.env.TAVILY_API_KEY),
    model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
  });
}
