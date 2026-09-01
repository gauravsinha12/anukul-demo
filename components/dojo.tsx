"use client";

import { useState } from "react";
import type { DojoGrade, DojoQuestion } from "@/lib/core";
import { LiveTag, PanelHead } from "./panels";

export function DojoPanel({ role }: { role: string }) {
  const [q, setQ] = useState<DojoQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const [grade, setGrade] = useState<DojoGrade | null>(null);
  const [busy, setBusy] = useState<"ask" | "grade" | null>(null);

  async function ask() {
    setBusy("ask");
    setGrade(null);
    setAnswer("");
    try {
      const res = await fetch("/api/dojo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "ask", role }),
      });
      setQ(await res.json());
    } finally {
      setBusy(null);
    }
  }

  async function submit() {
    if (!q) return;
    setBusy("grade");
    try {
      const res = await fetch("/api/dojo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "grade", role, question: q.question, answer }),
      });
      setGrade(await res.json());
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="panel dojo">
      <PanelHead
        n="◇"
        kicker="Bonus · AI Interview Dojo"
        title="Practise the part that actually decides it"
        sub="For most students here, the interview is the barrier, not the skill. Type an answer and see the rubric."
        right={q ? <LiveTag live={q.live} /> : null}
      />

      {!q ? (
        <button className="btn primary" onClick={ask} disabled={busy === "ask"}>
          {busy === "ask" ? "Thinking of a question…" : "Ask me an interview question"}
        </button>
      ) : (
        <>
          <div className="qbox">
            <span className="label">Question · {q.focus}</span>
            <p className="q" style={{ margin: "7px 0 0" }}>
              {q.question}
            </p>
          </div>

          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Answer in your own words. Two or three sentences is enough — brevity is one of the four things scored."
            aria-label="Your answer"
          />

          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <button className="btn primary" onClick={submit} disabled={busy === "grade" || !answer.trim()}>
              {busy === "grade" ? "Marking…" : "Get feedback"}
            </button>
            <button className="btn ghost" onClick={ask} disabled={busy !== null}>
              Another question
            </button>
          </div>

          {grade && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 10 }}>
                <span className="label">Rubric</span>
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontWeight: 600,
                    color: grade.overall >= 70 ? "var(--teal)" : grade.overall >= 50 ? "var(--amber)" : "var(--coral)",
                  }}
                >
                  {grade.overall}/100
                </span>
                <LiveTag live={grade.live} />
              </div>
              {grade.scores.map((s, i) => (
                <div className="crit" key={i}>
                  <span className="c">{s.criterion}</span>
                  <span
                    className="s"
                    style={{ color: s.score >= 7 ? "var(--teal)" : s.score >= 5 ? "var(--amber)" : "var(--coral)" }}
                  >
                    {s.score} / {s.max}
                  </span>
                  <span className="cm">{s.comment}</span>
                </div>
              ))}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12, marginTop: 14 }}>
                <div className="block">
                  <div className="mins" style={{ color: "var(--teal)" }}>KEEP DOING</div>
                  <p style={{ marginTop: 6 }}>{grade.strength}</p>
                </div>
                <div className="block">
                  <div className="mins" style={{ color: "var(--coral)" }}>CHANGE ONE THING</div>
                  <p style={{ marginTop: 6 }}>{grade.fix}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
