import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { LEVELS, TOPICS_BY_TRACK, validateContent } from "./lib/content-schema.mjs";

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.replace(/^--/, "").split("=");
    return [key, value ?? "true"];
  }),
);

const count = Number(args.get("count") ?? 1);
const fixedLevel = args.get("level");
const fixedTrack = args.get("track");
const fixture = args.get("fixture") === "true";
const output = path.resolve(args.get("output") ?? "src/content/generated-exercises.json");
const today = args.get("date") ?? new Date().toISOString().slice(0, 10);
const dateCompact = today.replace(/-/g, "");
const existing = fs.existsSync(output) ? JSON.parse(fs.readFileSync(output, "utf8")) : [];
const MODEL = process.env.AI_MODEL || "gpt-4.1-mini";
const existingSentences = existing
  .flatMap((item) => Object.values(item.variants ?? {}).flat())
  .slice(-80);

const topicsText = Object.entries(TOPICS_BY_TRACK)
  .map(([track, topics]) => `${track}: ${topics.join(", ")}`)
  .join("\n");

const schemaExample = {
  track: "everyday",
  topic: "daily",
  levels: { en: "A1", no: "A1", zh: "A1" },
  variants: {
    en: ["I like to read before I sleep."],
    no: ["Jeg liker å lese før jeg sover."],
    zh: ["我喜欢睡前看书。"],
  },
  tags: ["daily_routine", "habits"],
  notes: [
    { term: "før jeg sover", text: "“在我睡觉之前”；før 引导从句时使用正常陈述词序。" },
    { term: "liker å lese", text: "“喜欢读书”；liker 后接 å + 不定式。" },
  ],
};

function rotation() {
  const day = Math.floor(Date.parse(`${today}T00:00:00Z`) / 86400000);
  return Array.from({ length: count }, (_, index) => {
    const track = fixedTrack && fixedTrack !== "mixed" ? fixedTrack : index % 2 === 0 ? "everyday" : "academic";
    const level = fixedLevel && fixedLevel !== "auto" ? fixedLevel : LEVELS[(day + index) % LEVELS.length];
    const topics = TOPICS_BY_TRACK[track];
    const topic = topics[(day + index) % topics.length];
    return { track, level, topic };
  });
}

function buildPrompt(items) {
  return `You generate high-quality trilingual language-learning exercises for a website supporting English (en), Norwegian Bokmål (no), and Simplified Chinese (zh).

Generate ${items.length} sentence translation exercises with this assignment:
${items.map((item, index) => `${index + 1}. track=${item.track}, topic=${item.topic}, level=${item.level}`).join("\n")}

Content requirements:
- Every language version must express the same meaning and tone. Do not add or omit details.
- Norwegian must be natural Bokmål. Chinese must be Simplified Chinese. English must use one consistent spelling convention.
- Respect the requested CEFR level for the target language; sentence complexity should match it.
- Everyday track: realistic daily communication. Academic track: research, methods, data, academic writing or conferencing.
- Provide 1-2 natural variants per language. Variants must be genuinely acceptable, not trivial punctuation changes.
- Provide 2-4 notes explaining vocabulary, grammar, word order, collocation or register. Notes are written in Simplified Chinese; keep terms in the target language where useful.
- Tags must be lowercase snake_case and describe grammar, skills or topics.
- No personal data, no harmful content, no copied copyrighted text, no placeholders.
- Avoid near-duplicates of these existing sentences:
${existingSentences.map((sentence) => `- ${sentence}`).join("\n") || "- none"}

Allowed topics:
${topicsText}

Return ONLY a JSON array (no markdown fences, no commentary). Each item must follow this shape:
${JSON.stringify(schemaExample, null, 2)}

Do not include id, origin, generatedAt, model or review fields; the pipeline will add them.`;
}

async function generateWithModel(items) {
  const apiUrl = process.env.AI_API_URL || "https://api.openai.com/v1/chat/completions";
  const apiKey = process.env.AI_API_KEY;
  const model = MODEL;
  if (!apiKey) throw new Error("AI_API_KEY is required unless --fixture is used.");

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      temperature: process.env.AI_TEMPERATURE ? Number(process.env.AI_TEMPERATURE) : 0.7,
      messages: [
        {
          role: "system",
          content:
            "You are a senior trilingual lexicographer and CEFR content editor. Follow the requested JSON schema exactly.",
        },
        { role: "user", content: buildPrompt(items) },
      ],
    }),
  });
  if (!response.ok) throw new Error(`AI request failed: ${response.status} ${await response.text()}`);

  const payload = await response.json();
  const text = payload.choices?.[0]?.message?.content;
  if (typeof text !== "string") throw new Error("AI response contained no message content.");
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("AI response did not contain a JSON array.");
  return { items: JSON.parse(text.slice(start, end + 1)), model };
}

function fixtureItems(items) {
  return items.map((item, index) => ({
    track: item.track,
    topic: item.topic,
    levels: { en: item.level, no: item.level, zh: item.level },
    variants: {
      en: ["I like to read before I sleep."],
      no: ["Jeg liker å lese før jeg sover."],
      zh: ["我喜欢睡前看书。"],
    },
    tags: ["daily_routine", "habits"],
    notes: [
      { term: "før jeg sover", text: "“在我睡觉之前”；før 引导从句时使用正常陈述词序。" },
      { term: "liker å lese", text: "“喜欢读书”；liker 后接 å + 不定式。" },
    ],
    ...(index > 0 ? { variants: { en: [`I like to read before I sleep (${index + 1}).`], no: [`Jeg liker å lese før jeg sover (${index + 1}).`], zh: [`我喜欢睡前看书（${index + 1}）。`] } } : {}),
  }));
}

function decorate(raw, assignment, index) {
  const track = TOPICS_BY_TRACK[raw.track] ? raw.track : assignment.track;
  const topic = TOPICS_BY_TRACK[track].includes(raw.topic) ? raw.topic : assignment.topic;
  const suffix = crypto.randomBytes(3).toString("hex");
  return {
    id: `ai_${dateCompact}_${track}_${String(index + 1).padStart(2, "0")}_${suffix}`,
    type: "sentence_translation",
    track,
    topic,
    levels: raw.levels,
    variants: raw.variants,
    tags: raw.tags,
    notes: raw.notes,
    ...(raw.context ? { context: raw.context } : {}),
    origin: "ai",
    generatedAt: `${today}T00:00:00.000Z`,
    model: fixture ? "fixture" : MODEL,
    review: { status: "pending" },
  };
}

const assignments = rotation();
const generated = fixture ? fixtureItems(assignments) : (await generateWithModel(assignments)).items;
if (!Array.isArray(generated) || generated.length === 0) throw new Error("No candidates were generated.");

const decorated = generated.slice(0, count).map((item, index) => decorate(item, assignments[index] ?? assignments[0], index));
const combined = [...existing, ...decorated];

const seedSource = fs.existsSync("src/lib/exercises.ts") ? fs.readFileSync("src/lib/exercises.ts", "utf8") : "";
const seedIds = [...seedSource.matchAll(/id:\s*"(tr_[^"]+)"/g)].map((match) => match[1]);
const { errors, warnings } = validateContent(combined, { seedIds });
for (const warning of warnings) console.warn(`WARN ${warning}`);
for (const error of errors) console.error(`ERROR ${error}`);
if (errors.length) throw new Error("Generated content failed validation; nothing was written.");

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(combined, null, 2)}\n`);
console.log(`Wrote ${decorated.length} pending candidate(s) to ${path.relative(process.cwd(), output)}.`);
