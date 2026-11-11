import fs from "node:fs";
import path from "node:path";
import { CHECKLIST_KEYS } from "./lib/content-schema.mjs";

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.replace(/^--/, "").split("=");
    return [key, value ?? "true"];
  }),
);

const file = path.resolve(args.get("file") ?? "src/content/generated-exercises.json");
const minScore = Number(args.get("min-score") ?? process.env.AUTO_APPROVE_MIN_SCORE ?? 15);
const dryRun = args.get("dry-run") === "true";
const apiUrl = process.env.AI_API_URL || "http://springfield.uit.no:30800/v1/chat/completions";
const apiKey = process.env.MAGGIE_API_KEY || process.env.AI_API_KEY;
const model = process.env.AI_MODEL || "maggie";

if (!fs.existsSync(file)) {
  console.error(`Content file not found: ${file}`);
  process.exit(1);
}
const items = JSON.parse(fs.readFileSync(file, "utf8"));
const pending = items.filter((item) => item.review?.status === "pending");
if (!pending.length) {
  console.log("No pending items to review.");
  process.exit(0);
}
if (!apiKey) {
  console.log("MAGGIE_API_KEY is not configured; leaving candidates pending.");
  process.exit(0);
}

const checklistSpec = CHECKLIST_KEYS.map((key) => `- ${key}`).join("\n");
const prompt = `You are a strict senior reviewer for a trilingual (English / Norwegian Bokmål / Simplified Chinese) language-learning exercise bank.

Score each candidate from 0 to 2 on each of these 8 criteria, total 0-16:
- semanticAlignment: all three languages preserve meaning, detail and tone exactly
- naturalness: native-like phrasing; variants are genuinely acceptable
- levelFit: vocabulary, grammar and sentence length match every language's labeled CEFR level
- registerFit: everyday vs academic register is consistent and appropriate
- grammar: spelling, morphology, word order and punctuation are correct
- notesAccuracy: explanations are correct, specific and useful
- originality: original, no personal data, no harmful content, no copied text
- technical: complete fields, sensible tags, no near-duplicates

Be conservative. If any criterion is doubtful, score 1 and do not approve.

Candidates:
${JSON.stringify(
  pending.map((item) => ({
    id: item.id,
    track: item.track,
    topic: item.topic,
    levels: item.levels,
    variants: item.variants,
    tags: item.tags,
    notes: item.notes,
  })),
  null,
  2,
)}

Return ONLY JSON with this shape:
{
  "reviews": [
    {
      "id": "candidate id",
      "score": 0,
      "checklist": {
${checklistSpec}
      },
      "verdict": "approve | needs_changes | reject",
      "issues": ["specific issue, empty if none"],
      "notes": "short reviewer note"
    }
  ]
}`;

let reviews = [];
try {
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      messages: [
        { role: "system", content: "You are a conservative content reviewer. Follow the JSON schema exactly." },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!response.ok) throw new Error(`Review request failed: ${response.status} ${await response.text()}`);
  const payload = await response.json();
  const text = payload.choices?.[0]?.message?.content;
  if (typeof text !== "string") throw new Error("Review response contained no message content.");
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Review response did not contain JSON.");
  const parsed = JSON.parse(text.slice(start, end + 1));
  reviews = Array.isArray(parsed.reviews) ? parsed.reviews : [];
} catch (error) {
  console.log(`Auto review unavailable: ${error.message}. Candidates remain pending.`);
  process.exit(0);
}

const reviewById = new Map(reviews.map((review) => [review.id, review]));
const reviewedAt = new Date().toISOString();
let approvedCount = 0;
let changesCount = 0;
let pendingCount = 0;

for (const item of pending) {
  const review = reviewById.get(item.id);
  if (!review) {
    pendingCount += 1;
    console.log(`PENDING ${item.id}: no review returned.`);
    continue;
  }

  const score = Number(review.score);
  const checklist = review.checklist ?? {};
  const checklistOk = CHECKLIST_KEYS.every((key) => checklist[key] === true);
  const issues = Array.isArray(review.issues) ? review.issues.filter(Boolean) : [];
  const approved =
    review.verdict === "approve" &&
    checklistOk &&
    Number.isFinite(score) &&
    score >= minScore &&
    score <= 16 &&
    issues.length === 0;

  item.review = {
    status: approved ? "approved" : "needs_changes",
    reviewer: "maggie-auto-review",
    reviewedAt,
    score: Number.isFinite(score) ? score : 0,
    checklist: Object.fromEntries(CHECKLIST_KEYS.map((key) => [key, checklist[key] === true])),
    notes: approved
      ? review.notes || `Auto-approved: ${score}/16, all checklist items passed.`
      : issues.length
        ? issues.join("; ")
        : review.notes || "Auto review did not meet the approval threshold.",
  };

  if (approved) {
    approvedCount += 1;
    console.log(`APPROVED ${item.id}: ${score}/16`);
  } else {
    changesCount += 1;
    console.log(`CHANGES ${item.id}: ${score}/16 — ${item.review.notes}`);
  }
}

if (!dryRun) {
  fs.writeFileSync(file, `${JSON.stringify(items, null, 2)}\n`);
}

console.log(`Auto review: ${approvedCount} approved, ${changesCount} needs_changes, ${pendingCount} pending (threshold ${minScore}/16).`);
