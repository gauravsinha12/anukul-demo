"use client";

import { useEffect, useRef, useState } from "react";
import {
  effectiveLevel,
  freshnessOf,
  type ApqBreakdown,
  type Plan,
  type Proof,
  type Skill,
  type Weather,
} from "@/lib/core";

const COLOR: Record<string, string> = {
  human: "var(--teal)",
  ai: "var(--indigo)",
  technical: "var(--amber)",
};

export function LiveTag({ live, className = "" }: { live: boolean; className?: string }) {
  return (
    <span className={`pill ${live ? "live" : "demo"} ${className}`}>
      {live ? "live" : "demo data"}
    </span>
  );
}

export function PanelHead({
  n,
  kicker,
  title,
  sub,
  right,
}: {
  n: string;
  kicker: string;
  title: string;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="phead">
      <span className="pnum">{n}</span>
      <div style={{ flex: "1 1 auto", minWidth: 200 }}>
        <span className="label">{kicker}</span>
        <h2>{title}</h2>
        {sub ? <p className="sub">{sub}</p> : null}
      </div>
      {right}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1 - SENSE                                                           */
/* ------------------------------------------------------------------ */

export function SensePanel({ w }: { w: Weather }) {
  return (
    <section className="panel p1">
      <PanelHead
        n="1"
        kicker="Pillar 1 · Sense"
        title="What the market is actually asking for"
        sub={`${w.role} · ${w.city}`}
        right={<LiveTag live={w.live} />}
      />

      <p style={{ fontFamily: "var(--serif)", fontSize: "1.05rem", margin: "0 0 16px" }}>
        {w.headline}
      </p>

      <span className="label">The role, broken into tasks</span>
      <div className="tasks" style={{ marginTop: 9 }}>
        {w.tasks.map((t, i) => (
          <div className="task" key={i}>
            <span className={`ex ex-${t.exposure}`}>
              {t.exposure === "human" ? "human only" : t.exposure}
            </span>
            <div>
              <div className="tt">{t.task}</div>
              <div className="tw">{t.why}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 20, marginTop: 20 }}>
        <div>
          <span className="label">Rising</span>
          <div className="trend up" style={{ marginTop: 8 }}>
            {w.rising.map((r, i) => (
              <div className="row" key={i}>
                <span className="s">{r.skill}</span>
                <span className="n">{r.note}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <span className="label">Decaying</span>
          <div className="trend down" style={{ marginTop: 8 }}>
            {w.decaying.map((r, i) => (
              <div className="row" key={i}>
                <span className="s">{r.skill}</span>
                <span className="n">{r.note}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {w.sources.length > 0 && (
        <>
          <div className="sources">
            {w.sources.slice(0, 8).map((s, i) => (
              <a key={i} href={s.url} target="_blank" rel="noreferrer noopener" title={s.title}>
                {hostOf(s.url)}
              </a>
            ))}
          </div>
          <p className="note">
            {w.sources.length} live sources read just now. The production system reads about 50,000
            postings a week; this demo reads a sample so it returns while you are still on stage.
          </p>
        </>
      )}
      {w.note ? <p className="note">{w.note}</p> : null}
    </section>
  );
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.slice(0, 30);
  }
}

/* ------------------------------------------------------------------ */
/* 2 - SEE                                                             */
/* ------------------------------------------------------------------ */

export function MirrorPanel({
  skills,
  gaps,
  studentName,
}: {
  skills: Skill[];
  gaps: { skill: string; note: string; have: number; known: boolean }[];
  studentName: string;
}) {
  return (
    <section className="panel p2">
      <PanelHead
        n="2"
        kicker="Pillar 2 · See"
        title="Your Skill Mirror"
        sub="Solid bar is what the skill is worth today. The faded part is what decay has already taken."
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 24 }}>
        <div>
          {skills.map((s) => {
            const eff = Math.round(effectiveLevel(s));
            const lost = s.level - eff;
            return (
              <div className="skill" key={s.id}>
                <div className="top">
                  <span className="nm">{s.name}</span>
                  <span className="val" style={{ color: COLOR[s.category] }}>
                    {eff}
                    {lost >= 3 && (
                      <span style={{ color: "var(--faint)", fontWeight: 400 }}> / {s.level}</span>
                    )}
                  </span>
                </div>
                <div className="track">
                  <div style={{ display: "flex", height: "100%", width: "100%" }}>
                    <div className="fill" style={{ width: `${eff}%`, background: COLOR[s.category] }} />
                    <div className="ghostfill" style={{ width: `${lost}%`, background: COLOR[s.category] }} />
                  </div>
                </div>
                <div className="meta">
                  {s.lastUsedMonths === 0
                    ? "used this month"
                    : `last used ${s.lastUsedMonths} month${s.lastUsedMonths === 1 ? "" : "s"} ago · ${Math.round(freshnessOf(s) * 100)}% strength retained`}
                </div>
              </div>
            );
          })}
        </div>

        <div>
          <span className="label">Where {studentName} is short against rising demand</span>
          <div style={{ marginTop: 10 }}>
            {gaps.map((g, i) => (
              <div className="skill" key={i}>
                <div className="top">
                  <span className="nm">{g.skill}</span>
                  <span className="val" style={{ color: g.have < 40 ? "var(--coral)" : "var(--teal)" }}>
                    {g.have}
                  </span>
                </div>
                <div className="track">
                  <div
                    className="fill"
                    style={{ width: `${g.have}%`, background: g.have < 40 ? "var(--coral)" : "var(--teal)" }}
                  />
                </div>
                <div className="meta">{g.known ? g.note : `not on the Mirror yet · ${g.note}`}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* APQ                                                                 */
/* ------------------------------------------------------------------ */

function useCountUp(target: number, ms = 900) {
  const [v, setV] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = from.current;
    if (start === target) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(start + (target - start) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

export function ApqPanel({ apq }: { apq: ApqBreakdown }) {
  const shown = useCountUp(apq.score);
  const R = 64;
  const C = 2 * Math.PI * R;
  const hue = apq.score >= 65 ? "var(--teal)" : apq.score >= 45 ? "var(--amber)" : "var(--coral)";

  return (
    <section className="panel">
      <PanelHead
        n="◎"
        kicker="The score"
        title="AI-Proof Quotient"
        sub="How resilient this skill portfolio is to AI over the next 24 months."
      />
      <div className="apqwrap">
        <div className="ring">
          <svg width="148" height="148" viewBox="0 0 148 148" aria-hidden="true">
            <circle cx="74" cy="74" r={R} fill="none" stroke="var(--panel-2)" strokeWidth="11" />
            <circle
              cx="74"
              cy="74"
              r={R}
              fill="none"
              stroke={hue}
              strokeWidth="11"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - shown / 100)}
              style={{ transition: "stroke-dashoffset .12s linear" }}
            />
          </svg>
          <div className="mid">
            <div>
              <b style={{ color: hue }}>{shown}</b>
              <span>APQ / 100</span>
            </div>
          </div>
        </div>

        <div className="parts">
          {apq.parts.map((p) => (
            <div className="part" key={p.key}>
              <div className="top">
                <span>{p.label}</span>
                <span className="w">
                  {Math.round(p.weight * 100)}% weight · {p.value}
                </span>
              </div>
              <div className="track">
                <div className="fill" style={{ width: `${p.value}%`, background: hue }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="note">
        Nothing here is a black box: the four weights are fixed and published, and the score is
        computed in the browser from the Mirror and the Passport. APQ is a compass, never a verdict,
        and it is private until the student shares it.
      </p>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 3 - STEP                                                            */
/* ------------------------------------------------------------------ */

export function PlanPanel({
  plan,
  studentName,
  onDone,
  logged,
}: {
  plan: Plan;
  studentName: string;
  onDone: () => void;
  logged: boolean;
}) {
  return (
    <section className="panel p3">
      <PanelHead
        n="3"
        kicker="Pillar 3 · Step"
        title="The Three-Hour Sunday"
        sub={`This week: ${plan.focusSkill}`}
        right={<LiveTag live={plan.live} />}
      />

      <p style={{ fontFamily: "var(--serif)", fontSize: "1rem", margin: "0 0 16px", color: "var(--muted)" }}>
        {plan.why}
      </p>

      <div className="blocks">
        <div className="block">
          <div className="mins" style={{ color: "var(--teal)" }}>60 MIN</div>
          <h3>Learn</h3>
          {plan.learn.map((l, i) => (
            <a key={i} href={l.url} target="_blank" rel="noreferrer noopener">
              {l.title}
              <small>
                {l.source} · {l.minutes} min
              </small>
            </a>
          ))}
          <p style={{ marginTop: 6, fontSize: ".78rem", color: "var(--faint)" }}>
            Free sources only. We curate, we never produce content.
          </p>
        </div>

        <div className="block">
          <div className="mins" style={{ color: "var(--indigo)" }}>{plan.build.minutes || 90} MIN</div>
          <h3>Build</h3>
          <p>{plan.build.brief}</p>
          <p style={{ marginTop: 8, color: "var(--text)", fontWeight: 600, fontSize: ".84rem" }}>
            Hand in: {plan.build.deliverable}
          </p>
          <ul>
            {plan.build.rubric.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>

        <div className="block">
          <div className="mins" style={{ color: "var(--coral)" }}>{plan.prove.minutes || 30} MIN</div>
          <h3>Prove</h3>
          <p>{plan.prove.instruction}</p>
          <button
            className="btn primary sm"
            style={{ marginTop: 14 }}
            onClick={onDone}
            disabled={logged}
          >
            {logged ? "Logged to Passport" : "Mark this week done"}
          </button>
        </div>
      </div>

      <div className="wa">
        <span className="av">W</span>
        <div>
          <div className="when">Sunday 7:02 am · Anukul on WhatsApp</div>
          <div className="msg">{plan.whatsapp}</div>
        </div>
      </div>

      <p className="note">
        {studentName} never opens an app to get this. It arrives on WhatsApp, works on 2G, and asks
        for three hours. {plan.note ? ` ${plan.note}` : ""}
      </p>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 4 - SHOW                                                            */
/* ------------------------------------------------------------------ */

export function PassportPanel({ proofs }: { proofs: Proof[] }) {
  return (
    <section className="panel p4">
      <PanelHead
        n="4"
        kicker="Pillar 4 · Show"
        title="Proof Passport"
        sub="No badge for watching a video. A badge for finishing real work that somebody checked."
        right={
          <span className="pill live">
            {proofs.length} verified
          </span>
        }
      />
      {proofs.length === 0 ? (
        <p className="empty">
          Nothing yet. Finish a Sunday and the first entry appears here, signed by whoever reviewed it.
        </p>
      ) : (
        <div>
          {proofs.map((p) => (
            <div className="proof" key={p.id}>
              <span className="dot" />
              <div>
                <div className="t">{p.title}</div>
                <div className="m">
                  {p.skills.join(", ")} · rubric {p.rubric}/100 · {p.reviewer} · {p.date}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="note">
        One shareable link, tamper-evident, rebuilt every time she ships. Designed to map onto UGC's
        National Credit Framework, which already allows half a degree's credits to come from
        micro-credentials.
      </p>
    </section>
  );
}
