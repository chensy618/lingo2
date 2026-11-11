import type { BaseTrack, Exercise, Lang, Level, Track } from "./types";
import { LANG_CODES, LEVELS } from "./types";
import { EXERCISES } from "./exercises";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function levelIndex(level: Level) {
  return LEVELS.indexOf(level);
}

export function levelDistance(a: Level, b: Level) {
  return Math.abs(levelIndex(a) - levelIndex(b));
}

export function otherLanguages(lang: Lang): Lang[] {
  return LANG_CODES.filter((code) => code !== lang);
}

export function displayDate(iso: string) {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric" }).format(date);
}

export function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function todayKey() {
  return dateKey(new Date());
}

export function greeting() {
  const hour = new Date().getHours();
  if (hour < 6) return "夜深了";
  if (hour < 11) return "早上好";
  if (hour < 14) return "中午好";
  if (hour < 18) return "下午好";
  return "晚上好";
}

export function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export interface SessionOptions {
  target: Lang;
  source: Lang;
  level: Level;
  track: Track;
  topic?: string;
  ids?: string[];
  size: number;
}

export interface SessionResult {
  exercises: Exercise[];
  exactCount: number;
  usedNeighbourLevels: Level[];
  usedOtherTopics: boolean;
}

export function buildSession(options: SessionOptions): SessionResult {
  if (options.ids?.length) {
    const chosen = options.ids
      .map((id) => EXERCISES.find((exercise) => exercise.id === id))
      .filter((exercise): exercise is Exercise => Boolean(exercise))
      .slice(0, options.size);
    if (chosen.length) {
      return {
        exercises: chosen,
        exactCount: chosen.length,
        usedNeighbourLevels: [],
        usedOtherTopics: false,
      };
    }
  }

  const candidates = EXERCISES.filter(
    (exercise) => options.track === "mixed" || exercise.track === options.track,
  );
  const topicMatches = options.topic
    ? candidates.filter((exercise) => exercise.topic === options.topic)
    : candidates;

  const picked = shuffle(
    topicMatches.filter((exercise) => exercise.levels[options.target] === options.level),
  );
  const exactCount = picked.length;
  const usedNeighbourLevels: Level[] = [];
  let usedOtherTopics = false;

  const append = (list: Exercise[], allowOtherTopics: boolean) => {
    const sorted = [...list].sort(
      (a, b) =>
        levelDistance(a.levels[options.target], options.level) -
        levelDistance(b.levels[options.target], options.level),
    );
    for (const exercise of sorted) {
      if (picked.length >= options.size) break;
      if (picked.some((item) => item.id === exercise.id)) continue;
      picked.push(exercise);
      if (exercise.levels[options.target] !== options.level) {
        if (!usedNeighbourLevels.includes(exercise.levels[options.target])) {
          usedNeighbourLevels.push(exercise.levels[options.target]);
        }
      }
      if (allowOtherTopics) usedOtherTopics = true;
    }
  };

  if (picked.length < options.size) {
    append(topicMatches.filter((exercise) => exercise.levels[options.target] !== options.level), false);
  }
  if (picked.length < options.size) {
    append(candidates, true);
  }

  return {
    exercises: picked.slice(0, options.size),
    exactCount: Math.min(exactCount, options.size),
    usedNeighbourLevels,
    usedOtherTopics,
  };
}

export function exercisesForTrack(track: BaseTrack) {
  return EXERCISES.filter((exercise) => exercise.track === track);
}

const CJK = /[\u3400-\u9fff]/;

function normalize(text: string, lang: Lang) {
  const lower = text.toLowerCase().trim();
  if (lang === "zh" || CJK.test(lower)) {
    return lower.replace(/[\s，。！？；：、“”‘’（）《》,.!?;:'"()[\]{}\-—…]/g, "");
  }
  return lower
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function bigrams(value: string) {
  const chars = Array.from(value);
  if (chars.length < 2) return chars;
  const result: string[] = [];
  for (let i = 0; i < chars.length - 1; i += 1) {
    result.push(chars[i] + chars[i + 1]);
  }
  return result;
}

function diceCoefficient(a: string, b: string) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const setA = new Map<string, number>();
  for (const gram of bigrams(a)) setA.set(gram, (setA.get(gram) ?? 0) + 1);
  const setB = new Map<string, number>();
  for (const gram of bigrams(b)) setB.set(gram, (setB.get(gram) ?? 0) + 1);
  let overlap = 0;
  for (const [gram, count] of setA) {
    overlap += Math.min(count, setB.get(gram) ?? 0);
  }
  return (2 * overlap) / (Array.from(bigrams(a)).length + Array.from(bigrams(b)).length);
}

function tokenScore(answer: string, reference: string, lang: Lang) {
  const normalizedAnswer = normalize(answer, lang);
  const normalizedReference = normalize(reference, lang);

  if (!normalizedAnswer) return 0;
  if (normalizedAnswer === normalizedReference) return 1;
  if (normalizedReference.includes(normalizedAnswer) && normalizedAnswer.length > 8) {
    return Math.max(0.72, normalizedAnswer.length / normalizedReference.length);
  }

  if (lang === "zh") {
    return diceCoefficient(normalizedAnswer, normalizedReference);
  }

  const answerTokens = new Set(normalizedAnswer.split(" ").filter((token) => token.length > 1));
  const referenceTokens = new Set(normalizedReference.split(" ").filter((token) => token.length > 1));
  if (!answerTokens.size || !referenceTokens.size) {
    return diceCoefficient(normalizedAnswer, normalizedReference);
  }

  let shared = 0;
  for (const token of answerTokens) {
    if (referenceTokens.has(token)) {
      shared += 1;
    } else {
      for (const ref of referenceTokens) {
        if (ref.startsWith(token.slice(0, Math.max(4, token.length - 2))) && Math.abs(ref.length - token.length) <= 2) {
          shared += 0.5;
          break;
        }
      }
    }
  }

  const precision = shared / answerTokens.size;
  const recall = shared / referenceTokens.size;
  if (precision + recall === 0) return diceCoefficient(normalizedAnswer, normalizedReference);
  return (2 * precision * recall) / (precision + recall);
}

export function similarity(answer: string, references: string[], lang: Lang) {
  return references.reduce((best, reference) => Math.max(best, tokenScore(answer, reference, lang)), 0);
}

export interface AnswerAnalysis {
  coverage: number;
  missing: string[];
  extra: string[];
  bestReference: string;
}

function tokensFor(text: string, lang: Lang) {
  const normalized = normalize(text, lang);
  if (lang === "zh" || CJK.test(normalized)) return Array.from(normalized);
  return normalized.split(" ").filter(Boolean);
}

function lcsParts(reference: string[], answer: string[]) {
  const rows = reference.length + 1;
  const cols = answer.length + 1;
  const table: number[][] = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      table[i][j] =
        reference[i - 1] === answer[j - 1]
          ? table[i - 1][j - 1] + 1
          : Math.max(table[i - 1][j], table[i][j - 1]);
    }
  }

  const missing: string[] = [];
  const extra: string[] = [];
  let matched = 0;
  let i = reference.length;
  let j = answer.length;
  while (i > 0 && j > 0) {
    if (reference[i - 1] === answer[j - 1]) {
      matched += 1;
      i -= 1;
      j -= 1;
    } else if (table[i - 1][j] >= table[i][j - 1]) {
      missing.push(reference[i - 1]);
      i -= 1;
    } else {
      extra.push(answer[j - 1]);
      j -= 1;
    }
  }
  while (i > 0) {
    missing.push(reference[i - 1]);
    i -= 1;
  }
  while (j > 0) {
    extra.push(answer[j - 1]);
    j -= 1;
  }
  return { matched, missing: missing.reverse(), extra: extra.reverse() };
}

function uniqueTokens(tokens: string[], lang: Lang) {
  const filtered = lang === "zh" ? tokens.filter(Boolean) : tokens.filter((token) => token.length > 2);
  const seen = new Set<string>();
  return filtered.filter((token) => {
    if (seen.has(token)) return false;
    seen.add(token);
    return true;
  });
}

export function analyzeAnswer(answer: string, references: string[], lang: Lang): AnswerAnalysis {
  let best: AnswerAnalysis = { coverage: 0, missing: [], extra: [], bestReference: references[0] ?? "" };

  for (const reference of references) {
    const refTokens = tokensFor(reference, lang);
    const answerTokens = tokensFor(answer, lang);
    if (!refTokens.length) continue;
    const { matched, missing, extra } = lcsParts(refTokens, answerTokens);
    const coverage = matched / refTokens.length;
    if (coverage >= best.coverage) {
      const missingUnique = uniqueTokens(missing, lang);
      const extraUnique = uniqueTokens(extra, lang);
      best = {
        coverage,
        missing:
          lang === "zh"
            ? missingUnique.length
              ? [missingUnique.join("").slice(0, 12)]
              : []
            : missingUnique,
        extra:
          lang === "zh"
            ? extraUnique.length
              ? [extraUnique.join("").slice(0, 12)]
              : []
            : extraUnique.slice(0, 5),
        bestReference: reference,
      };
    }
  }

  return best;
}

export function similarityLabel(value: number) {
  if (value >= 0.85) return { label: "非常接近", tone: "good" as const };
  if (value >= 0.65) return { label: "基本吻合", tone: "ok" as const };
  if (value >= 0.4) return { label: "部分吻合", tone: "warn" as const };
  return { label: "差异较大", tone: "low" as const };
}

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function last7Days() {
  const days: { key: string; label: string; date: Date }[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push({
      key: dateKey(date),
      label: new Intl.DateTimeFormat("zh-CN", { weekday: "short" }).format(date),
      date,
    });
  }
  return days;
}

export function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function sessionHref(options: {
  target?: Lang;
  source?: Lang;
  level?: Level;
  track?: Track;
  topic?: string;
  scenario?: string;
  start?: boolean;
  resume?: boolean;
}) {
  const params = new URLSearchParams();
  if (options.target) params.set("target", options.target);
  if (options.source) params.set("source", options.source);
  if (options.level) params.set("level", options.level);
  if (options.track) params.set("track", options.track);
  if (options.topic) params.set("topic", options.topic);
  if (options.scenario) params.set("scenario", options.scenario);
  if (options.start) params.set("start", "1");
  if (options.resume) params.set("resume", "1");
  const query = params.toString();
  return query ? `/translation?${query}` : "/translation";
}
