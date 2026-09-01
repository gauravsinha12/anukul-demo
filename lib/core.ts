// Shared types, the seed student, and the APQ formula.
// Everything here is pure and runs on both server and client.

export type Exposure = "automate" | "augment" | "human";
export type SkillCategory = "human" | "ai" | "technical";

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  level: number; // 0-100, from the diagnostic and from proofs
  lastUsedMonths: number;
}

export interface Proof {
  id: string;
  title: string;
  skills: string[];
  rubric: number; // 0-100
  reviewer: string;
  date: string;
}

export interface TaskTag {
  task: string;
  exposure: Exposure;
  why: string;
}

export interface Weather {
  role: string;
  city: string;
  headline: string;
  tasks: TaskTag[];
  rising: { skill: string; note: string }[];
  decaying: { skill: string; note: string }[];
  sources: { title: string; url: string }[];
  live: boolean;
  note?: string;
}

export interface LearnItem {
  title: string;
  source: string;
  url: string;
  minutes: number;
}

export interface Plan {
  focusSkill: string;
  why: string;
  learn: LearnItem[];
  build: { brief: string; deliverable: string; rubric: string[]; minutes: number };
  prove: { instruction: string; minutes: number };
  whatsapp: string;
  live: boolean;
  note?: string;
}

export interface DojoQuestion {
  question: string;
  focus: string;
  live: boolean;
}

export interface DojoGrade {
  overall: number;
  scores: { criterion: string; score: number; max: number; comment: string }[];
  strength: string;
  fix: string;
  live: boolean;
}

/* ------------------------------------------------------------------ */
/* Skill decay                                                         */
/* ------------------------------------------------------------------ */

// Half-life in months, by kind of skill. These are the numbers from the deck:
// technical skills 2-5 years, AI skills ~2 years. Human-premium skills hold
// their value far longer, which is exactly why they carry the most weight.
export const HALF_LIFE: Record<SkillCategory, number> = {
  technical: 30,
  ai: 24,
  human: 48,
};

/** 1.0 = just used, 0.5 = one half-life ago. */
export function freshnessOf(skill: Skill): number {
  const hl = HALF_LIFE[skill.category];
  return Math.pow(0.5, Math.max(0, skill.lastUsedMonths) / hl);
}

/** What the skill is actually worth today, after decay. */
export function effectiveLevel(skill: Skill): number {
  return skill.level * freshnessOf(skill);
}

/* ------------------------------------------------------------------ */
/* APQ - the AI-Proof Quotient                                         */
/* ------------------------------------------------------------------ */

export const APQ_WEIGHTS = [
  { key: "human", label: "Human-premium skill depth", weight: 0.35 },
  { key: "ai", label: "AI-augmentation fluency", weight: 0.3 },
  { key: "fresh", label: "Freshness, decay-adjusted", weight: 0.2 },
  { key: "proof", label: "Verified proof volume", weight: 0.15 },
] as const;

// Six verified proofs in a semester is the target on slide 18, so six = full marks.
export const PROOF_TARGET = 6;

export interface ApqBreakdown {
  score: number;
  parts: { key: string; label: string; weight: number; value: number }[];
}

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function computeApq(skills: Skill[], proofs: Proof[]): ApqBreakdown {
  const human = mean(skills.filter((s) => s.category === "human").map(effectiveLevel));
  const ai = mean(skills.filter((s) => s.category === "ai").map(effectiveLevel));
  const fresh = mean(skills.map(freshnessOf)) * 100;
  const proof = Math.min(100, (proofs.length / PROOF_TARGET) * 100);

  const values: Record<string, number> = { human, ai, fresh, proof };
  const parts = APQ_WEIGHTS.map((w) => ({
    key: w.key,
    label: w.label,
    weight: w.weight,
    value: Math.round(values[w.key]),
  }));

  const score = APQ_WEIGHTS.reduce((sum, w) => sum + w.weight * values[w.key], 0);
  return { score: Math.round(score), parts };
}

/* ------------------------------------------------------------------ */
/* Seed data                                                           */
/* ------------------------------------------------------------------ */

export const ROLES = [
  "Data Analyst",
  "Full-Stack Developer",
  "AI / ML Engineer",
  "Business Analyst",
  "Cloud & DevOps Engineer",
  "Product Manager",
];

export const CITIES = ["Patna", "Bengaluru", "Hyderabad", "Pune", "Remote (India)"];

/** Riya at week 1 - the student on slide 13. */
export function seedSkills(): Skill[] {
  return [
    { id: "problem", name: "Problem framing & logic", category: "human", level: 78, lastUsedMonths: 1 },
    { id: "comm", name: "Communication & client sense", category: "human", level: 60, lastUsedMonths: 6 },
    { id: "python", name: "Python", category: "technical", level: 61, lastUsedMonths: 7 },
    { id: "sql", name: "DBMS & SQL", category: "technical", level: 31, lastUsedMonths: 4 },
    { id: "web", name: "Web fundamentals", category: "technical", level: 48, lastUsedMonths: 3 },
    { id: "prompt", name: "Prompt engineering", category: "ai", level: 12, lastUsedMonths: 12 },
    { id: "llmapp", name: "LLM app development", category: "ai", level: 5, lastUsedMonths: 18 },
  ];
}

/** Riya at week 24 - what one semester of three-hour Sundays actually does. */
export function afterSixMonths(): { skills: Skill[]; proofs: Proof[] } {
  return {
    skills: [
      { id: "problem", name: "Problem framing & logic", category: "human", level: 79, lastUsedMonths: 0 },
      { id: "comm", name: "Communication & client sense", category: "human", level: 66, lastUsedMonths: 0 },
      { id: "python", name: "Python", category: "technical", level: 78, lastUsedMonths: 0 },
      { id: "sql", name: "DBMS & SQL", category: "technical", level: 74, lastUsedMonths: 0 },
      { id: "web", name: "Web fundamentals", category: "technical", level: 57, lastUsedMonths: 2 },
      { id: "prompt", name: "Prompt engineering", category: "ai", level: 68, lastUsedMonths: 0 },
      { id: "llmapp", name: "LLM app development", category: "ai", level: 54, lastUsedMonths: 0 },
    ],
    proofs: [
      { id: "p1", title: "Cleaned and modelled a 3,000-row sales dataset", skills: ["DBMS & SQL", "Data cleaning"], rubric: 82, reviewer: "Pod + mentor", date: "14 Feb 2026" },
      { id: "p2", title: "Built a WhatsApp FAQ bot for a Patna D2C brand", skills: ["Python", "LLM app development"], rubric: 88, reviewer: "Pod + employer", date: "03 Mar 2026" },
      { id: "p3", title: "Recorded a 12-minute client walkthrough", skills: ["Communication"], rubric: 76, reviewer: "Mentor", date: "21 Mar 2026" },
      { id: "p4", title: "Shipped a retention dashboard with 4 cohort views", skills: ["DBMS & SQL", "Data storytelling"], rubric: 84, reviewer: "Pod + employer", date: "09 Apr 2026" },
      { id: "p5", title: "Wrote an evaluation harness for a support chatbot", skills: ["Prompt engineering"], rubric: 79, reviewer: "Pod + mentor", date: "27 Apr 2026" },
      { id: "p6", title: "Led a 20-minute requirements call with a real client", skills: ["Communication", "Problem framing"], rubric: 81, reviewer: "Employer", date: "18 May 2026" },
    ],
  };
}

/** Which of the market's rising skills this student is short on. */
export function findGaps(skills: Skill[], rising: { skill: string; note: string }[]) {
  return rising.map((r) => {
    const match = skills.find(
      (s) =>
        s.name.toLowerCase().includes(r.skill.toLowerCase()) ||
        r.skill.toLowerCase().includes(s.name.toLowerCase().split(" ")[0])
    );
    const have = match ? Math.round(effectiveLevel(match)) : 0;
    return { skill: r.skill, note: r.note, have, known: Boolean(match) };
  });
}
