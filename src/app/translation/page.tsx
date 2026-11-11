"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EXERCISE_MAP } from "@/lib/exercises";
import { relatedVocabulary } from "@/lib/vocabLinks";
import { AI_FEEDBACK_URL, requestAiFeedback } from "@/lib/ai";
import { TOPICS } from "@/lib/topics";
import { SCENARIOS } from "@/lib/scenarios";
import {
  buildAttempt,
  clearSessionSnapshot,
  readSessionSnapshot,
  useAttempts,
  useBookmarks,
  usePreferences,
  useVocabState,
  writeSessionSnapshot,
  type SessionSnapshot,
} from "@/lib/storage";
import type { Exercise, Lang, Level, SelfRating, Track } from "@/lib/types";
import { LANGUAGES, LANG_CODES, LEVELS, TRACKS } from "@/lib/types";
import {
  analyzeAnswer,
  buildSession,
  cn,
  formatPercent,
  similarityLabel,
  type SessionResult,
} from "@/lib/utils";
import {
  ArrowRightIcon,
  BookmarkIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  CloseIcon,
  PenIcon,
  RotateIcon,
  TranslateIcon,
} from "@/components/icons";
import { InfoNote, LangBadge, PageHeader, ProgressBar } from "@/components/ui";
import { SpeakButton } from "@/components/SpeakButton";

const PLACEHOLDERS: Record<Lang, string> = {
  en: "Write your translation here ...",
  no: "Skriv oversettelsen din her ...",
  zh: "在这里写下你的译文……",
};

const RATING_META: Record<SelfRating, { label: string; hint: string; className: string }> = {
  again: {
    label: "需要重练",
    hint: "不太确定，之后再看",
    className: "border-coral/30 bg-coral-soft/60 text-[#8c452e] hover:border-coral/60",
  },
  hard: {
    label: "有点难",
    hint: "基本理解，但不熟练",
    className: "border-gold/30 bg-gold-soft/60 text-[#7a5c26] hover:border-gold/60",
  },
  good: {
    label: "掌握了",
    hint: "表达自然，可以继续",
    className: "border-moss/25 bg-moss-soft/70 text-moss hover:border-moss/60",
  },
};

interface Config {
  target: Lang;
  source: Lang;
  level: Level;
  track: Track;
  topic?: string;
  size: number;
  ids?: string[];
  label?: string;
}

function isLang(value: string | null): value is Lang {
  return value === "en" || value === "no" || value === "zh";
}

function isLevel(value: string | null): value is Level {
  return !!value && (LEVELS as string[]).includes(value);
}

function isTrack(value: string | null): value is Track {
  return value === "everyday" || value === "academic" || value === "mixed";
}

function fallbackSource(target: Lang, current: Lang) {
  if (current !== target) return current;
  return target === "zh" ? "en" : "zh";
}

function TranslationLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex items-center gap-3 text-sm text-ink-faint">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-moss" />
        正在准备练习…
      </div>
    </div>
  );
}

export default function TranslationPage() {
  return (
    <Suspense fallback={<TranslationLoading />}>
      <TranslationClient />
    </Suspense>
  );
}

function TranslationClient() {
  const searchParams = useSearchParams();
  const [preferences, setPreferences, preferencesHydrated] = usePreferences();
  const [, setAttempts] = useAttempts();
  const [bookmarks, setBookmarks] = useBookmarks();
  const [vocabState, setVocabState] = useVocabState();

  const [config, setConfig] = useState<Config>({
    target: preferences.target,
    source: preferences.source,
    level: preferences.level,
    track: preferences.track,
    size: preferences.sessionSize,
  });
  const [stage, setStage] = useState<"setup" | "session" | "summary">("setup");
  const [session, setSession] = useState<Exercise[]>([]);
  const [sessionNote, setSessionNote] = useState<SessionResult | null>(null);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [similarities, setSimilarities] = useState<Record<string, number>>({});
  const [ratings, setRatings] = useState<Record<string, SelfRating>>({});
  const [error, setError] = useState("");
  const [aiFeedback, setAiFeedback] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const feedbackRef = useRef<HTMLDivElement>(null);
  const booted = useRef(false);


  const current = session[index];
  const targetMeta = LANGUAGES[config.target];
  const sourceMeta = LANGUAGES[config.source];
  const thirdLang = LANG_CODES.find((lang) => lang !== config.target && lang !== config.source) ?? "en";
  const currentAnalysis = useMemo(
    () => (current ? analyzeAnswer(answer, current.variants[config.target], config.target) : null),
    [current, answer, config.target],
  );
  const relatedVocab = useMemo(
    () => (current ? relatedVocabulary(current, config.target) : []),
    [current, config.target],
  );

  const saveSnapshot = (
    overrides: Partial<Pick<SessionSnapshot, "index" | "answer" | "submitted" | "similarities" | "ratings">> = {},
  ) => {
    if (!session.length) return;
    writeSessionSnapshot({
      version: 1,
      config,
      exerciseIds: session.map((exercise) => exercise.id),
      index,
      answer,
      submitted,
      similarities,
      ratings,
      savedAt: new Date().toISOString(),
      ...overrides,
    });
  };

  const restoreSession = useCallback((snapshot: SessionSnapshot) => {
    const exercises = snapshot.exerciseIds
      .map((id) => EXERCISE_MAP[id])
      .filter((exercise): exercise is Exercise => Boolean(exercise));
    if (!exercises.length) {
      clearSessionSnapshot();
      return false;
    }
    const safeIndex = Math.min(Math.max(snapshot.index, 0), exercises.length - 1);
    setConfig(snapshot.config);
    setSession(exercises);
    setSessionNote({ exercises, exactCount: exercises.length, usedNeighbourLevels: [], usedOtherTopics: false });
    setIndex(safeIndex);
    setAnswer(snapshot.answer);
    setSubmitted(snapshot.submitted);
    setSimilarities(snapshot.similarities);
    setRatings(snapshot.ratings);
    setStage("session");
    return true;
  }, []);

  const startSession = useCallback(
    (nextConfig: Config) => {
      const result = buildSession({
        target: nextConfig.target,
        source: nextConfig.source,
        level: nextConfig.level,
        track: nextConfig.track,
        topic: nextConfig.topic,
        ids: nextConfig.ids,
        size: nextConfig.size,
      });

      if (!result.exercises.length) {
        setError("这个组合暂时没有题目。可以换成 Everyday 或 Mixed，或调整等级。");
        return;
      }

      setError("");
      setConfig(nextConfig);
      setSession(result.exercises);
      setSessionNote(result);
      setIndex(0);
      setAnswer("");
      setSubmitted(false);
      setSimilarities({});
      setRatings({});
      setStage("session");
      writeSessionSnapshot({
        version: 1,
        config: nextConfig,
        exerciseIds: result.exercises.map((exercise) => exercise.id),
        index: 0,
        answer: "",
        submitted: false,
        similarities: {},
        ratings: {},
        savedAt: new Date().toISOString(),
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [],
  );

  useEffect(() => {
    if (!preferencesHydrated || booted.current) return;
    booted.current = true;

    const target = isLang(searchParams.get("target")) ? (searchParams.get("target") as Lang) : preferences.target;
    let source = isLang(searchParams.get("source")) ? (searchParams.get("source") as Lang) : preferences.source;
    source = fallbackSource(target, source);
    let level = isLevel(searchParams.get("level")) ? (searchParams.get("level") as Level) : preferences.level;
    let track = isTrack(searchParams.get("track")) ? (searchParams.get("track") as Track) : preferences.track;
    const topic = searchParams.get("topic") ?? undefined;
    const scenario = SCENARIOS.find((item) => item.id === searchParams.get("scenario"));

    if (scenario) {
      level = scenario.level;
      track = scenario.track;
    }

    const nextConfig: Config = {
      target,
      source,
      level,
      track,
      topic: scenario ? undefined : topic,
      size: scenario ? scenario.exerciseIds.length : preferences.sessionSize,
      ids: scenario?.exerciseIds,
      label: scenario?.title,
    };
    // The URL can prefill and auto-start a session; this is an external navigation input.
    setConfig(nextConfig);

    if (searchParams.get("resume") === "1") {
      const snapshot = readSessionSnapshot();
      if (snapshot && restoreSession(snapshot)) return;
    }

    if (searchParams.get("start") === "1" || searchParams.get("resume") === "1") {
      startSession(nextConfig);
    }
  }, [preferencesHydrated, preferences, searchParams, startSession, restoreSession]);

  const availableTopics = useMemo(() => {
    if (config.track === "mixed") return TOPICS;
    return TOPICS.filter((topic) => topic.track === config.track);
  }, [config.track]);

  const updateTarget = (target: Lang) => {
    setConfig((prev) => ({
      ...prev,
      target,
      source: fallbackSource(target, prev.source),
    }));
  };

  const updateTrack = (track: Track) => {
    setConfig((prev) => {
      const topic = TOPICS.find((item) => item.id === prev.topic);
      return {
        ...prev,
        track,
        topic: topic && track !== "mixed" && topic.track !== track ? undefined : prev.topic,
      };
    });
  };

  const begin = () => {
    const nextConfig: Config = { ...config, ids: undefined, label: undefined, topic: config.topic };
    setPreferences((prev) => ({
      ...prev,
      target: nextConfig.target,
      source: nextConfig.source,
      level: nextConfig.level,
      track: nextConfig.track,
      sessionSize: nextConfig.size,
    }));
    startSession(nextConfig);
  };

  const submit = () => {
    if (!current || submitted) return;
    const analysis = analyzeAnswer(answer, current.variants[config.target], config.target);
    const nextSimilarities = { ...similarities, [current.id]: analysis.coverage };
    setSimilarities(nextSimilarities);
    setSubmitted(true);
    saveSnapshot({ submitted: true, similarities: nextSimilarities });
    window.setTimeout(() => {
      feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const revealOnly = () => {
    if (!current) return;
    const nextSimilarities = { ...similarities, [current.id]: 0 };
    setSimilarities(nextSimilarities);
    setSubmitted(true);
    saveSnapshot({ submitted: true, similarities: nextSimilarities });
    window.setTimeout(() => {
      feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const rate = (rating: SelfRating) => {
    if (!current || ratings[current.id]) return;
    const attempt = buildAttempt({
      exerciseId: current.id,
      target: config.target,
      source: config.source,
      level: current.levels[config.target],
      track: current.track,
      answer,
      selfRating: rating,
      similarity: similarities[current.id] ?? currentAnalysis?.coverage ?? 0,
    });
    const nextRatings = { ...ratings, [current.id]: rating };
    setAttempts((prev) => [attempt, ...prev]);
    setRatings(nextRatings);

    try {
      window.localStorage.setItem(
        "lingo2.last-session.v1",
        JSON.stringify({
          target: config.target,
          source: config.source,
          level: current.levels[config.target],
          track: current.track,
          exerciseId: current.id,
          at: new Date().toISOString(),
        }),
      );
    } catch {
      // ignore
    }

    if (index + 1 >= session.length) {
      clearSessionSnapshot();
      setStage("summary");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const nextIndex = index + 1;
      saveSnapshot({ index: nextIndex, answer: "", submitted: false, ratings: nextRatings });
      setIndex(nextIndex);
      setAnswer("");
      setSubmitted(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const skip = () => {
    if (index + 1 >= session.length) {
      clearSessionSnapshot();
      setStage("summary");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const nextIndex = index + 1;
    saveSnapshot({ index: nextIndex, answer: "", submitted: false });
    setIndex(nextIndex);
    setAnswer("");
    setSubmitted(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleBookmark = () => {
    if (!current) return;
    setBookmarks((prev) =>
      prev.includes(current.id) ? prev.filter((id) => id !== current.id) : [current.id, ...prev],
    );
  };

  const askAi = async () => {
    if (!current || !AI_FEEDBACK_URL) return;
    setAiLoading(true);
    setAiError("");
    try {
      const feedback = await requestAiFeedback({
        sourceLanguage: config.source,
        targetLanguage: config.target,
        level: current.levels[config.target],
        prompt: current.variants[config.source][0],
        answer,
        references: current.variants[config.target],
        explanationTerms: current.notes.map((note) => note.term),
      });
      setAiFeedback(feedback);
    } catch {
      setAiError("AI 反馈暂时不可用，请稍后再试。");
    } finally {
      setAiLoading(false);
    }
  };

  const cycleVocab = (id: string) => {
    setVocabState((prev) => {
      const status = prev[id]?.status ?? "new";
      const next = status === "new" ? "learning" : status === "learning" ? "known" : "new";
      return { ...prev, [id]: { status: next, updatedAt: new Date().toISOString() } };
    });
  };

  const resetToSetup = () => {
    clearSessionSnapshot();
    setStage("setup");
    setSession([]);
    setIndex(0);
    setAnswer("");
    setSubmitted(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (stage === "setup") {
    return (
      <div className="animate-fade">
        <PageHeader
          title="翻译练习"
          description="选择目标语言、提示语言、等级与语域。提交后查看三语言对照与解析。"
        />

        <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-5">
            <section className="surface space-y-5 p-5 sm:p-6">
              <div>
                <p className="label">目标语言</p>
                <div className="grid grid-cols-3 gap-2">
                  {LANG_CODES.map((lang) => {
                    const meta = LANGUAGES[lang];
                    const active = config.target === lang;
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => updateTarget(lang)}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition",
                          active
                            ? "border-moss bg-moss text-paper-light"
                            : "border-line bg-white/50 hover:border-moss/35",
                        )}
                      >
                        <LangBadge lang={lang} size="sm" />
                        <span className="text-[0.78rem] font-semibold">{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="label">提示语言</p>
                <div className="grid grid-cols-2 gap-2">
                  {LANG_CODES.filter((lang) => lang !== config.target).map((lang) => {
                    const meta = LANGUAGES[lang];
                    const active = config.source === lang;
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setConfig((prev) => ({ ...prev, source: lang }))}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition",
                          active
                            ? "border-moss bg-moss-soft/55"
                            : "border-line bg-white/50 hover:border-moss/35",
                        )}
                      >
                        <LangBadge lang={lang} size="sm" />
                        <span className="text-[0.78rem] font-semibold text-ink">{meta.label}</span>
                        {active && <CheckCircleIcon className="ml-auto h-3.5 w-3.5 text-moss" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-line pt-5">
                <p className="label">等级</p>
                <div className="grid grid-cols-6 gap-1.5">
                  {LEVELS.map((level) => {
                    const active = config.level === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setConfig((prev) => ({ ...prev, level }))}
                        className={cn(
                          "rounded-lg border py-2 text-[0.72rem] font-semibold transition",
                          active
                            ? "border-moss bg-moss text-paper-light"
                            : "border-line bg-white/50 text-ink-soft hover:border-moss/35",
                        )}
                      >
                        {level}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="label">场景</p>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(TRACKS) as Track[]).map((track) => {
                    const active = config.track === track;
                    return (
                      <button
                        key={track}
                        type="button"
                        onClick={() => updateTrack(track)}
                        className={cn(
                          "rounded-xl border px-3 py-2.5 text-[0.76rem] font-semibold transition",
                          active
                            ? "border-moss bg-moss-soft/55 text-ink"
                            : "border-line bg-white/50 text-ink-soft hover:border-moss/35",
                        )}
                      >
                        {TRACKS[track].label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-3 border-t border-line pt-5 sm:grid-cols-2">
                <label className="block">
                  <span className="label">主题</span>
                  <span className="relative block">
                    <select
                      className="field appearance-none pr-9"
                      value={config.topic ?? ""}
                      onChange={(event) =>
                        setConfig((prev) => ({ ...prev, topic: event.target.value || undefined }))
                      }
                    >
                      <option value="">全部主题</option>
                      {availableTopics.map((topic) => (
                        <option key={topic.id} value={topic.id}>
                          {topic.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="pointer-events-none absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
                  </span>
                </label>
                <label className="block">
                  <span className="label">本轮题数</span>
                  <span className="relative block">
                    <select
                      className="field appearance-none pr-9"
                      value={config.size}
                      onChange={(event) =>
                        setConfig((prev) => ({ ...prev, size: Number(event.target.value) }))
                      }
                    >
                      {[5, 10, 15, 20].map((size) => (
                        <option key={size} value={size}>
                          {size} 题
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="pointer-events-none absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
                  </span>
                </label>
              </div>
            </section>

            {error && <InfoNote>{error}</InfoNote>}
          </div>

          <aside className="lg:sticky lg:top-8 lg:self-start">
            <div className="surface p-5">
              <p className="font-display text-[1.2rem] text-ink">
                {targetMeta.label} · {config.level}
              </p>
              <p className="mt-1 text-[0.7rem] text-ink-faint">
                {TRACKS[config.track].label} · {config.size} 题 · 提示语言 {sourceMeta.label}
              </p>
              <button type="button" onClick={begin} className="btn-primary mt-5 w-full">
                <TranslateIcon className="h-4 w-4" />
                开始 {config.size} 题
              </button>
              <p className="mt-3 text-[0.64rem] leading-relaxed text-ink-faint">
                提交后可查看三语言答案与解析。
              </p>
              <Link
                href="/translation?resume=1"
                className="mt-3 block text-center text-[0.66rem] font-medium text-ink-faint hover:text-moss"
              >
                继续未完成的练习
              </Link>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  if (stage === "summary") {
    const rated = Object.values(ratings);
    const good = rated.filter((rating) => rating === "good").length;
    const scored = session.map((exercise) => similarities[exercise.id] ?? 0);
    const average = scored.length ? scored.reduce((sum, value) => sum + value, 0) / scored.length : 0;

    return (
      <div className="animate-fade">
        <PageHeader title="这一轮完成了。" description="记录已保存在本地。" />
        <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <section className="surface overflow-hidden">
            <div className="bg-moss px-6 py-7 text-paper-light sm:px-8">
              <p className="font-display text-[1.9rem] leading-tight tracking-[-0.03em]">
                {session.length} 题 · {targetMeta.label}
              </p>
              <p className="mt-1.5 text-[0.78rem] text-paper-light/70">
                自评掌握 {good}/{rated.length || session.length} · 平均参考覆盖 {formatPercent(average)}
              </p>
            </div>
            <div className="grid grid-cols-3 divide-x divide-line">
              <div className="px-4 py-5 text-center">
                <p className="font-display text-2xl text-ink">{ratings ? Object.keys(ratings).length : 0}</p>
                <p className="mt-1 text-[0.62rem] uppercase tracking-[0.12em] text-ink-faint">已自评</p>
              </div>
              <div className="px-4 py-5 text-center">
                <p className="font-display text-2xl text-moss">{good}</p>
                <p className="mt-1 text-[0.62rem] uppercase tracking-[0.12em] text-ink-faint">掌握</p>
              </div>
              <div className="px-4 py-5 text-center">
                <p className="font-display text-2xl text-coral">{rated.length - good}</p>
                <p className="mt-1 text-[0.62rem] uppercase tracking-[0.12em] text-ink-faint">待复习</p>
              </div>
            </div>
            <div className="border-t border-line p-5 sm:p-6">
              <div className="space-y-3">
                {session.map((exercise) => {
                  const rating = ratings[exercise.id];
                  return (
                    <div key={exercise.id} className="flex items-center gap-3">
                      <LangBadge lang={config.target} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[0.78rem] font-medium text-ink">
                          {exercise.variants[config.source][0]}
                        </p>
                        <p className="text-[0.62rem] text-ink-faint">{exercise.levels[config.target]}</p>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[0.6rem] font-semibold",
                          rating === "good"
                            ? "bg-moss-soft text-moss"
                            : rating === "hard"
                              ? "bg-gold-soft text-[#7a5c26]"
                              : rating === "again"
                                ? "bg-coral-soft text-[#8c452e]"
                                : "bg-paper text-ink-faint",
                        )}
                      >
                        {rating ? RATING_META[rating].label : "未自评"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="surface p-6">
              <p className="eyebrow">Next</p>
              <h2 className="mt-1 font-display text-xl text-ink">接下来做什么？</h2>
              <div className="mt-4 space-y-2.5">
                <button type="button" onClick={() => startSession(config)} className="btn-primary w-full">
                  <RotateIcon className="h-4 w-4" />
                  再来一轮
                </button>
                <button type="button" onClick={resetToSetup} className="btn-secondary w-full">
                  调整语言与等级
                </button>
                <Link href="/progress" className="btn-secondary w-full">
                  查看学习记录
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (!current) return <TranslationLoading />;

  const currentIndex = index + 1;
  const progress = (currentIndex / session.length) * 100;
  const isBookmarked = bookmarks.includes(current.id);
  const coverage = currentAnalysis?.coverage ?? 0;
  const scoreMeta = similarityLabel(coverage);
  const rating = ratings[current.id];

  return (
    <div className="animate-fade pb-4">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={resetToSetup} className="btn-ghost -ml-2 text-[0.74rem]">
          <CloseIcon className="h-3.5 w-3.5" />
          调整设置
        </button>
        <p className="text-[0.7rem] text-ink-faint">
          {config.label ? `${config.label} · ` : ""}
          {targetMeta.label} · {current.levels[config.target]} · {TRACKS[current.track].label}
        </p>
      </div>

      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-[0.68rem] font-medium text-ink-faint">
          <span>
            {String(currentIndex).padStart(2, "0")} / {String(session.length).padStart(2, "0")}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <ProgressBar value={progress} />
      </div>

      {sessionNote && (sessionNote.usedNeighbourLevels.length > 0 || sessionNote.usedOtherTopics) && (
        <div className="mb-4">
          <InfoNote>
            {sessionNote.usedNeighbourLevels.length > 0 &&
              `该等级的题目数量有限，本轮补充了相邻等级（${sessionNote.usedNeighbourLevels.join("、")}）的题目。`}
            {sessionNote.usedNeighbourLevels.length > 0 && sessionNote.usedOtherTopics && " "}
            {sessionNote.usedOtherTopics &&
              "所选情境的题目也有限，本轮补充了同一语域下其他主题的练习。题库会继续扩充。"}
          </InfoNote>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <section className="space-y-4">
          <div className="surface p-6 sm:p-7">
            <div className="flex items-center gap-2 text-[0.7rem] text-ink-faint">
              <LangBadge lang={config.source} size="sm" />
              译为 {targetMeta.zhLabel}
            </div>

            <div className="mt-5 flex items-start gap-3">
              <p className="flex-1 text-[1.35rem] font-medium leading-[1.5] text-ink sm:text-[1.55rem]">
                {current.variants[config.source][0]}
              </p>
              <SpeakButton text={current.variants[config.source][0]} lang={config.source} />
            </div>

            {current.context?.[config.source] && (
              <p className="mt-3 text-[0.76rem] leading-relaxed text-ink-faint">{current.context[config.source]}</p>
            )}

          </div>

          <div className="surface p-5 sm:p-6">
            <p className="text-[0.78rem] font-semibold text-ink">
              你的{targetMeta.zhLabel}译文
            </p>
            <textarea
              value={answer}
              onChange={(event) => {
                const value = event.target.value;
                setAnswer(value);
                if (!submitted) saveSnapshot({ answer: value });
              }}
              disabled={submitted}
              rows={5}
              placeholder={PLACEHOLDERS[config.target]}
              className="field mt-3 min-h-[8.5rem] resize-y text-[0.95rem] leading-relaxed disabled:bg-paper/60 disabled:text-ink-soft"
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  if (!submitted) submit();
                }
              }}
            />
            {!submitted ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={submit}
                  disabled={!answer.trim()}
                  className="btn-primary"
                >
                  <PenIcon className="h-4 w-4" />
                  提交译文
                </button>
                <button type="button" onClick={revealOnly} className="btn-secondary">
                  直接看答案
                </button>
                <span className="ml-auto hidden text-[0.62rem] text-ink-faint sm:block">⌘ / Ctrl + Enter 提交</span>
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-moss-soft px-3 py-1.5 text-[0.68rem] font-semibold text-moss">
                  <CheckCircleIcon className="h-3.5 w-3.5" />
                  已提交
                </span>
                <button type="button" onClick={toggleBookmark} className={cn("btn-ghost text-[0.72rem]", isBookmarked && "text-moss")}>
                  <BookmarkIcon className="h-3.5 w-3.5" filled={isBookmarked} />
                  {isBookmarked ? "已收藏" : "收藏句子"}
                </button>
                <button type="button" onClick={skip} className="btn-ghost ml-auto text-[0.72rem]">
                  跳过
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {submitted && (
            <div ref={feedbackRef} className="scroll-mt-24">
              <div className="surface p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="eyebrow">Reference</p>
                    <h2 className="mt-1 font-display text-xl text-ink">参考译文与解析</h2>
                  </div>
                  <div className="w-full max-w-[13rem] rounded-xl border border-line bg-paper px-3 py-2.5">
                    <div className="flex items-center justify-between text-[0.62rem] text-ink-faint">
                      <span>参考覆盖</span>
                      <span className="font-semibold text-ink">{formatPercent(coverage)} · {scoreMeta.label}</span>
                    </div>
                    <ProgressBar value={coverage * 100} className="mt-2" />
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-[0.68rem] leading-relaxed text-ink-faint">
                    覆盖率只衡量词级重合，不代表表达好坏；请结合解析与自评判断。
                  </p>
                  {(currentAnalysis?.missing.length ?? 0) > 0 && (
                    <p className="flex flex-wrap items-center gap-1.5 text-[0.64rem] text-ink-faint">
                      参考中还包含：
                      {currentAnalysis?.missing.slice(0, 6).map((token) => (
                        <span key={token} className="rounded-full bg-paper px-2 py-0.5 text-ink-soft">
                          {token}
                        </span>
                      ))}
                    </p>
                  )}
                  {(currentAnalysis?.extra.length ?? 0) > 0 && (
                    <p className="flex flex-wrap items-center gap-1.5 text-[0.64rem] text-ink-faint">
                      你的答案多出：
                      {currentAnalysis?.extra.slice(0, 4).map((token) => (
                        <span key={token} className="rounded-full bg-coral-soft/60 px-2 py-0.5 text-[#8c452e]">
                          {token}
                        </span>
                      ))}
                    </p>
                  )}
                </div>

                <div className="mt-5 rounded-2xl border border-moss/20 bg-moss-soft/35 p-4 sm:p-5">
                  <div className="flex items-center gap-2">
                    <LangBadge lang={config.target} />
                    <p className="text-[0.74rem] font-semibold text-ink">
                      {targetMeta.label} · 目标语言
                    </p>
                  </div>
                  <div className="mt-3 flex items-start gap-3">
                    <p className="flex-1 text-[1.05rem] font-medium leading-relaxed text-ink">
                      {current.variants[config.target][0]}
                    </p>
                    <SpeakButton text={current.variants[config.target][0]} lang={config.target} />
                  </div>
                  {current.variants[config.target].length > 1 && (
                    <div className="mt-3 border-t border-moss/15 pt-3">
                      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink-faint">也可以说</p>
                      <ul className="mt-1.5 space-y-1">
                        {current.variants[config.target].slice(1).map((variant) => (
                          <li key={variant} className="text-[0.78rem] leading-relaxed text-ink-soft">
                            {variant}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-2.5">
                  {[config.source, ...(preferences.showThird ? [thirdLang] : [])].map((lang) => (
                    <div key={lang} className="rounded-2xl border border-line bg-white/45 p-4">
                      <div className="flex items-center gap-2">
                        <LangBadge lang={lang} size="sm" />
                        <span className="text-[0.68rem] font-semibold text-ink-soft">{LANGUAGES[lang].label}</span>
                        <span className="ml-auto text-[0.6rem] text-ink-faint">
                          {lang === config.source ? "题目语言" : "第三语言"}
                        </span>
                      </div>
                      <p className="mt-2 text-[0.85rem] leading-relaxed text-ink-soft">
                        {current.variants[lang][0]}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 border-t border-line pt-5">
                  <p className="eyebrow">Language notes</p>
                  <h3 className="mt-1 font-display text-lg text-ink">语言解析</h3>
                  <div className="mt-3 space-y-3">
                    {current.notes.map((note, noteIndex) => (
                      <div key={`${note.term}-${noteIndex}`} className="flex gap-3">
                        <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-paper text-[0.58rem] font-semibold text-ink-faint">
                          {noteIndex + 1}
                        </span>
                        <p className="text-[0.8rem] leading-relaxed text-ink-soft">
                          <span className="font-semibold text-ink">{note.term}</span>
                          <span className="mx-1.5 text-line-strong">—</span>
                          {note.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                {relatedVocab.length > 0 && (
                  <div className="mt-5 border-t border-line pt-5">
                    <p className="text-[0.64rem] font-semibold uppercase tracking-[0.12em] text-ink-faint">相关词汇</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {relatedVocab.map((entry) => {
                        const status = vocabState[entry.id]?.status ?? "new";
                        return (
                          <button
                            key={entry.id}
                            type="button"
                            onClick={() => cycleVocab(entry.id)}
                            className="inline-flex items-center gap-2 rounded-full border border-line bg-paper-light px-3 py-1.5 text-[0.7rem] text-ink-soft transition hover:border-moss/40 hover:text-ink"
                          >
                            <span className="font-semibold text-ink">{entry.translations[config.target]}</span>
                            <span className="text-[0.6rem] text-ink-faint">
                              {status === "new" ? "+ 词表" : status === "learning" ? "学习中" : "已掌握"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {AI_FEEDBACK_URL && (
                  <div className="mt-5 border-t border-line pt-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[0.64rem] font-semibold uppercase tracking-[0.12em] text-ink-faint">AI 反馈</p>
                      <button type="button" onClick={askAi} disabled={aiLoading} className="btn-secondary text-[0.68rem]">
                        {aiLoading ? "分析中…" : "分析我的译文"}
                      </button>
                    </div>
                    <p className="mt-1.5 text-[0.62rem] text-ink-faint">
                      会把题目与译文发送到你配置的 AI 服务；结果仅供参考。
                    </p>
                    {aiError && <p className="mt-2 text-[0.7rem] text-coral">{aiError}</p>}
                    {aiFeedback && (
                      <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-paper px-4 py-3 text-[0.8rem] leading-relaxed text-ink-soft">
                        {aiFeedback}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
          <div className="surface p-5">
            <h3 className="font-display text-lg text-ink">
              {submitted ? "掌握程度" : "先完成译文"}
            </h3>
            <p className="mt-1 text-[0.68rem] text-ink-faint">自评决定这道题是否进入复习。</p>
            <div className="mt-4 space-y-2">
              {(Object.keys(RATING_META) as SelfRating[]).map((key) => {
                const meta = RATING_META[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => rate(key)}
                    disabled={!submitted || !!rating}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-45",
                      meta.className,
                    )}
                  >
                    <span className="flex-1">
                      <span className="block text-[0.8rem] font-semibold">{meta.label}</span>
                      <span className="mt-0.5 block text-[0.62rem] opacity-70">{meta.hint}</span>
                    </span>
                    {rating === key && <CheckCircleIcon className="h-4 w-4" />}
                  </button>
                );
              })}
            </div>
            {rating && (
              <p className="mt-3 text-center text-[0.64rem] text-ink-faint">
                已记录，正在进入下一题…
              </p>
            )}
          </div>

        </aside>
      </div>
    </div>
  );
}
