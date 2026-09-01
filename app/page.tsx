"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CITIES,
  ROLES,
  afterSixMonths,
  computeApq,
  effectiveLevel,
  findGaps,
  seedSkills,
  type Plan,
  type Proof,
  type Skill,
  type Weather,
} from "@/lib/core";
import { ApqPanel, MirrorPanel, PassportPanel, PlanPanel, SensePanel } from "@/components/panels";
import { DojoPanel } from "@/components/dojo";

const STEPS = [
  "Reading live job postings",
  "Breaking the role into tasks",
  "Tagging each task by AI exposure",
  "Comparing against your Skill Mirror",
  "Writing this Sunday's plan",
];

export default function Page() {
  const [studentName, setStudentName] = useState("Riya");
  const [role, setRole] = useState(ROLES[0]);
  const [city, setCity] = useState(CITIES[0]);

  const [skills, setSkills] = useState<Skill[]>(seedSkills);
  const [proofs, setProofs] = useState<Proof[]>([]);

  const [weather, setWeather] = useState<Weather | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [step, setStep] = useState(-1);
  const [running, setRunning] = useState(false);
  const [logged, setLogged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keys, setKeys] = useState<{ groq: boolean; tavily: boolean; model: string } | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setKeys)
      .catch(() => setKeys(null));
  }, []);

  const apq = useMemo(() => computeApq(skills, proofs), [skills, proofs]);
  const gaps = useMemo(
    () => (weather ? findGaps(skills, weather.rising) : []),
    [skills, weather]
  );

  async function runLoop() {
    setRunning(true);
    setError(null);
    setLogged(false);
    setPlan(null);
    setStep(0);

    try {
      const senseTicker = window.setInterval(() => setStep((s) => (s < 2 ? s + 1 : s)), 1400);
      const wRes = await fetch("/api/sense", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role, city }),
      });
      window.clearInterval(senseTicker);
      if (!wRes.ok) throw new Error(`sense returned ${wRes.status}`);
      const w: Weather = await wRes.json();
      setWeather(w);

      setStep(3);
      const freshGaps = findGaps(skills, w.rising);

      setStep(4);
      const pRes = await fetch("/api/plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          role,
          studentName,
          headline: w.headline,
          gaps: freshGaps,
          skills: skills.map((s) => ({
            name: s.name,
            effective: Math.round(effectiveLevel(s)),
            lastUsedMonths: s.lastUsedMonths,
          })),
        }),
      });
      if (!pRes.ok) throw new Error(`plan returned ${pRes.status}`);
      setPlan(await pRes.json());
      setStep(STEPS.length);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  function markWeekDone() {
    if (!plan) return;
    const focus = plan.focusSkill;
    const key = focus.toLowerCase();

    setSkills((prev) => {
      const hit = prev.find(
        (s) => s.name.toLowerCase().includes(key) || key.includes(s.name.toLowerCase().split(" ")[0])
      );
      if (hit) {
        return prev.map((s) =>
          s.id === hit.id
            ? { ...s, level: Math.min(100, s.level + 18), lastUsedMonths: 0 }
            : s
        );
      }
      return [
        ...prev,
        { id: `new-${prev.length}`, name: focus, category: "ai", level: 34, lastUsedMonths: 0 },
      ];
    });

    setProofs((prev) => [
      ...prev,
      {
        id: `p-${prev.length + 1}`,
        title: plan.build.deliverable,
        skills: [focus],
        rubric: 82,
        reviewer: "Pod of five + mentor",
        date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      },
    ]);
    setLogged(true);
  }

  function simulateSemester() {
    const after = afterSixMonths();
    setSkills(after.skills);
    setProofs(after.proofs);
    setLogged(true);
  }

  function reset() {
    setSkills(seedSkills());
    setProofs([]);
    setWeather(null);
    setPlan(null);
    setStep(-1);
    setLogged(false);
    setError(null);
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="wordmark">
          <b>ANUKUL</b>
          <span className="deva">अनुकूल</span>
          <span className="tag">live demo</span>
        </div>
        <div className="spacer" />
        <span className="label" style={{ textAlign: "right" }}>
          CEO for the Day · Patna Women&apos;s College
        </span>
      </header>

      {keys && !keys.groq && (
        <div className="banner" style={{ marginTop: 20 }}>
          <b>Running on demo data.</b> No <code>GROQ_API_KEY</code> found, so nothing below is a
          live reading. Add the key in Vercel under Settings, Environment Variables, then redeploy.
        </div>
      )}
      {keys && keys.groq && !keys.tavily && (
        <div className="banner" style={{ marginTop: 20 }}>
          <b>Half live.</b> Groq is connected, but without <code>TAVILY_API_KEY</code> the market
          reading comes from the model&apos;s own knowledge instead of live postings.
        </div>
      )}

      <section className="panel" style={{ marginTop: keys && (!keys.groq || !keys.tavily) ? 16 : 22 }}>
        <span className="label">Set up the student</span>
        <h2 style={{ margin: "5px 0 4px" }}>One loop, start to finish, in about twenty seconds</h2>
        <p className="sub" style={{ marginBottom: 18 }}>
          Sense the market, see the gap, take one step, show the proof. Everything below is computed
          live from the choices here.
        </p>

        <div className="setup">
          <label className="field">
            <span className="label">Student</span>
            <input value={studentName} onChange={(e) => setStudentName(e.target.value)} maxLength={40} />
          </label>
          <label className="field">
            <span className="label">Target role</span>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="label">Market</span>
            <select value={city} onChange={(e) => setCity(e.target.value)}>
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <button className="btn primary" onClick={runLoop} disabled={running}>
            {running ? "Running the loop…" : weather ? "Run the loop again" : "Run this week's loop"}
          </button>
          <button className="btn ghost" onClick={reset} disabled={running}>
            Reset
          </button>
        </div>

        {step >= 0 && step < STEPS.length && (
          <div className="steps" style={{ marginTop: 18 }}>
            {STEPS.map((s, i) => (
              <div key={s} className={`step ${i === step ? "on" : i < step ? "done" : ""}`}>
                <span className="ic" />
                {s}
                {i === 0 && ` for ${role} in ${city}`}
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="banner" style={{ marginTop: 16, marginBottom: 0 }}>
            <b>Could not reach the API.</b> {error}. The panels below fall back to demo data so the
            walkthrough still works.
          </div>
        )}
      </section>

      <div className="grid" style={{ marginTop: 16 }}>
        {weather ? (
          <SensePanel w={weather} />
        ) : (
          <section className="panel p1 idle">
            <div className="phead">
              <span className="pnum">1</span>
              <div>
                <span className="label">Pillar 1 · Sense</span>
                <h2>What the market is actually asking for</h2>
                <p className="sub">Press Run and this reads live postings, then tags the role task by task.</p>
              </div>
            </div>
          </section>
        )}

        <MirrorPanel skills={skills} gaps={gaps} studentName={studentName} />

        <ApqPanel apq={apq} />

        {plan ? (
          <PlanPanel plan={plan} studentName={studentName} onDone={markWeekDone} logged={logged} />
        ) : (
          <section className="panel p3 idle">
            <div className="phead">
              <span className="pnum">3</span>
              <div>
                <span className="label">Pillar 3 · Step</span>
                <h2>The Three-Hour Sunday</h2>
                <p className="sub">Sixty minutes learning, ninety building, thirty proving. Generated from the gap above.</p>
              </div>
            </div>
          </section>
        )}

        <PassportPanel proofs={proofs} />

        <section className="panel">
          <span className="label">Close the loop</span>
          <h2 style={{ margin: "5px 0 4px" }}>Now run it for a semester</h2>
          <p className="sub" style={{ marginBottom: 16 }}>
            One Sunday moves the APQ a little. Twenty-four of them is the whole argument: this is
            Riya on slide 13, week 1 to week 24.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn primary" onClick={simulateSemester}>
              Fast-forward six months
            </button>
            <button className="btn ghost" onClick={reset}>
              Back to week 1
            </button>
          </div>
        </section>

        <DojoPanel role={role} />
      </div>

      <p className="footnote">
        Built for the CEO for the Day challenge · Prachi, Akriti, Kali, Manali · BCA Semester I
        <br />
        Market reading via Tavily · task tagging and planning via Groq
        {keys?.groq ? ` (${keys.model})` : ""} · APQ computed in your browser
      </p>
    </main>
  );
}
