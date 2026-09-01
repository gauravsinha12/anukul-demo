// Server-only helpers: imported only from route handlers, so the API keys
// read here never reach the browser bundle.

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const TAVILY_URL = "https://api.tavily.com/search";
const DEFAULT_MODEL = "openai/gpt-oss-120b";

export const hasGroq = () => Boolean(process.env.GROQ_API_KEY);
export const hasTavily = () => Boolean(process.env.TAVILY_API_KEY);

function withTimeout(ms: number) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  return { signal: c.signal, done: () => clearTimeout(t) };
}

/* ------------------------------------------------------------------ */
/* Tavily - the SENSE layer's eyes on the live market                  */
/* ------------------------------------------------------------------ */

export interface TavilyResult {
  title: string;
  url: string;
  content: string;
}

export async function tavilySearch(query: string, maxResults = 8): Promise<TavilyResult[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) throw new Error("TAVILY_API_KEY is not set");

  const { signal, done } = withTimeout(15000);
  try {
    const res = await fetch(TAVILY_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        query,
        max_results: maxResults,
        search_depth: "basic",
        topic: "general",
        include_answer: false,
      }),
      signal,
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Tavily ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }
    const data = (await res.json()) as { results?: TavilyResult[] };
    return (data.results ?? []).map((r) => ({
      title: r.title ?? "",
      url: r.url ?? "",
      content: (r.content ?? "").slice(0, 900),
    }));
  } finally {
    done();
  }
}

/* ------------------------------------------------------------------ */
/* Groq - structured JSON out of a fast model                          */
/* ------------------------------------------------------------------ */

type Msg = { role: "system" | "user"; content: string };

async function callGroq(body: Record<string, unknown>) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is not set");

  const { signal, done } = withTimeout(30000);
  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
      signal,
      cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Groq ${res.status}: ${text.slice(0, 300)}`);
    return JSON.parse(text) as {
      choices: { message: { content: string } }[];
    };
  } finally {
    done();
  }
}

/**
 * Ask Groq for JSON matching `schema`.
 * Tries strict json_schema first (gpt-oss models support it), and falls back to
 * plain json_object mode so a different GROQ_MODEL still works.
 */
export async function groqJson<T>(
  messages: Msg[],
  schema: Record<string, unknown>,
  schemaName: string
): Promise<T> {
  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;
  const base = { model, messages, temperature: 0.4, max_completion_tokens: 2600 };

  let content: string;
  try {
    const out = await callGroq({
      ...base,
      response_format: {
        type: "json_schema",
        json_schema: { name: schemaName, strict: true, schema },
      },
    });
    content = out.choices[0]?.message?.content ?? "";
  } catch (err) {
    // Model does not do strict schemas, or the schema was rejected. Ask again
    // in plain JSON mode with the shape spelled out in the prompt.
    const withShape: Msg[] = [
      ...messages,
      {
        role: "user",
        content:
          "Reply with JSON only, matching exactly this JSON Schema:\n" +
          JSON.stringify(schema),
      },
    ];
    const out = await callGroq({
      ...base,
      messages: withShape,
      response_format: { type: "json_object" },
    });
    content = out.choices[0]?.message?.content ?? "";
  }

  if (!content.trim()) throw new Error("Groq returned an empty response");
  try {
    return JSON.parse(content) as T;
  } catch {
    // Last resort: pull the outermost {...} out of a chatty reply.
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    if (start === -1 || end <= start) throw new Error("Groq did not return JSON");
    return JSON.parse(content.slice(start, end + 1)) as T;
  }
}

/** Keeps a hallucinated or relative link from becoming a dead link on stage. */
export function safeUrl(raw: string, fallbackQuery: string): string {
  try {
    const u = new URL(raw);
    if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
  } catch {
    /* fall through */
  }
  return `https://duckduckgo.com/?q=${encodeURIComponent(fallbackQuery)}`;
}
