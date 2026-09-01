// Stage insurance.
// If the venue wifi dies, a key hits its rate limit, or an API is slow, every
// route falls back to this and the demo keeps running. Anything served from
// here is flagged live:false and the UI says so out loud - we never pass
// canned data off as a live reading.

import type { Weather, Plan, DojoQuestion, DojoGrade } from "./core";

export function demoWeather(role: string, city: string): Weather {
  return {
    role,
    city,
    headline: `${role} postings in ${city} are splitting in two: the reporting half is being automated, and the judgement half is paying more.`,
    tasks: [
      { task: "Pull and clean raw data from spreadsheets and exports", exposure: "automate", why: "A model does this in seconds and does not get bored on row 4,000." },
      { task: "Write routine SQL for standard reports", exposure: "automate", why: "Text-to-SQL already handles the shapes that repeat every week." },
      { task: "Build dashboards and recurring reporting", exposure: "augment", why: "Still yours to design, but drafted 5x faster with AI in the loop." },
      { task: "Explore a dataset for the question nobody asked yet", exposure: "augment", why: "AI proposes; you decide which lead is worth an afternoon." },
      { task: "Decide which metric the business should actually be moving", exposure: "human", why: "Needs context, politics and consequences a model cannot see." },
      { task: "Tell a room of non-analysts what the number means", exposure: "human", why: "Trust is earned by a person, in a room, answering follow-ups." },
    ],
    rising: [
      { skill: "Prompt engineering", note: "Now appearing in mainstream analyst postings, not just AI roles." },
      { skill: "LLM app development", note: "Small internal tools are the fastest-growing ask from Indian SMEs." },
      { skill: "Data storytelling", note: "Named explicitly where 'reporting' used to be." },
      { skill: "SQL", note: "Still table stakes - but expected alongside, not instead of, AI fluency." },
    ],
    decaying: [
      { skill: "Manual QA scripting", note: "Being folded into generated test suites." },
      { skill: "HTML-only front-end", note: "Rarely a standalone hire any more." },
      { skill: "Routine data entry", note: "Almost entirely automated in postings from the last year." },
    ],
    sources: [],
    live: false,
    note: "Demo data - no API key set, or the live call did not come back in time.",
  };
}

export function demoPlan(focus: string, studentName = "Prachi"): Plan {
  return {
    focusSkill: focus || "Prompt engineering",
    why: `It is the fastest-rising skill in your market that you have almost no evidence for, and it lifts everything else you already know how to do.`,
    learn: [
      { title: "Prompt engineering basics - structure, examples, constraints", source: "OpenAI docs", url: "https://platform.openai.com/docs/guides/prompt-engineering", minutes: 25 },
      { title: "Getting structured output out of a language model", source: "Groq docs", url: "https://console.groq.com/docs/structured-outputs", minutes: 20 },
      { title: "Python for data - the 15 functions you will actually use", source: "NPTEL", url: "https://nptel.ac.in/courses", minutes: 15 },
    ],
    build: {
      brief:
        "A Patna coaching institute gets the same 40 questions on WhatsApp every week. Build a prompt that turns their FAQ sheet into correct, short, polite Hindi-or-English replies - and that says 'let me check' instead of inventing an answer it does not have.",
      deliverable: "One prompt file, five test questions, and the five replies it produced.",
      rubric: [
        "Handles a question the FAQ does not cover, without making something up",
        "Replies in the language the question was asked in",
        "Stays under 60 words",
        "Same input gives a stable answer on a second run",
      ],
      minutes: 90,
    },
    prove: {
      instruction:
        "Post your prompt and its five replies to your Pod. Review two others against the same four rubric points. Nothing counts until someone else has checked it.",
      minutes: 30,
    },
    whatsapp:
      `${studentName}, prompt engineering just jumped in Patna analyst postings and you are at 12. Three hours this Sunday puts a verified proof on your Passport. Start?`,
    live: false,
    note: "Demo data - no API key set, or the live call did not come back in time.",
  };
}

export function demoDojoQuestion(role: string): DojoQuestion {
  return {
    question: `You built a dashboard for a client and they say the numbers "look wrong" - but they cannot say which ones. Walk me through what you do in the next thirty minutes.`,
    focus: `Problem framing under pressure - the human-premium half of a ${role} role`,
    live: false,
  };
}

export function demoDojoGrade(): DojoGrade {
  return {
    overall: 68,
    scores: [
      { criterion: "Structure", score: 7, max: 10, comment: "There is an order to your answer, but say the order out loud first - 'three things, then I would report back'." },
      { criterion: "Specifics", score: 6, max: 10, comment: "Name the actual check. 'Reconcile one number against the source table' beats 'verify the data'." },
      { criterion: "Client sense", score: 8, max: 10, comment: "Good instinct to go back to the client rather than guess. Put that first, not last." },
      { criterion: "Brevity", score: 6, max: 10, comment: "You reached the point around sentence four. Reach it in sentence one." },
    ],
    strength: "You did not panic or promise a fix you could not deliver. Interviewers notice that.",
    fix: "Open with your conclusion, then support it. Say the headline in the first ten seconds.",
    live: false,
  };
}
