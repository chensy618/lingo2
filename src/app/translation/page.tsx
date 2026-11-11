"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TOPICS } from "@/lib/topics";
import {
  buildAttempt,
  useAttempts,
  useBookmarks,
  usePreferences,
} from "@/lib/storage";
import type { Exercise, Lang, Level, SelfRating, Track } from "@/lib/types";
import { LANGUAGES, LANG_CODES, LEVELS, TRACKS } from "@/lib/types";
import {
  buildSession,
  cn,
  formatPercent,
  similarity,
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
  const [currentSimilarity, setCurrentSimilarity] = useState(0);
  const [similarities, setSimilarities] = useState<Record<string, number>>({});
  const [ratings, setRatings] = useState<Record<string, SelfRating>>({});
  const [error, setError] = useState("");
  const feedbackRef = useRef<HTMLDivElement>(null);
  const booted = useRef(false);


  const current = session[index];
  const targetMeta = LANGUAGES[config.target];
  const sourceMeta = LANGUAGES[config.source];
  const thirdLang = LANG_CODES.find((lang) => lang !== config.target && lang !== config.source) ?? "en";

  const startSession = useCallback(
    (nextConfig: Config) => {
      const result = buildSession({
        target: nextConfig.target,
        source: nextConfig.source,
        level: nextConfig.level,
        track: nextConfig.track,
        topic: nextConfig.topic,
        size: nextConfig.size,
      });

      if (!result.exercises.length) {
        setError("这个组合暂时没有题目。可以换成 Everyday 或 Mixed，或调整等级。");
        return;
      }

      setError("");
      setSession(result.exercises);
      setSessionNote(result);
      setIndex(0);
      setAnswer("");
      setSubmitted(false);
      setCurrentSimilarity(0);
      setSimilarities({});
      setRatings({});
      setStage("session");
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
    const level = isLevel(searchParams.get("level")) ? (searchParams.get("level") as Level) : preferences.level;
    const track = isTrack(searchParams.get("track")) ? (searchParams.get("track") as Track) : preferences.track;
    const topic = searchParams.get("topic") ?? undefined;

    const nextConfig: Config = {
      target,
      source,
      level,
      track,
      topic,
      size: preferences.sessionSize,
    };
    // The URL can prefill and auto-start a session; this is an external navigation input.
    setConfig(nextConfig);

    if (searchParams.get("start") === "1") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      startSession(nextConfig);
    }
  }, [preferencesHydrated, preferences, searchParams, startSession]);

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
    setPreferences((prev) => ({
      ...prev,
      target: config.target,
      source: config.source,
      level: config.level,
      track: config.track,
      sessionSize: config.size,
    }));
    startSession(config);
  };

  const submit = () => {
    if (!current || submitted) return;
    const refs = current.variants[config.target];
    const score = similarity(answer, refs, config.target);
    setCurrentSimilarity(score);
    setSimilarities((prev) => ({ ...prev, [current.id]: score }));
    setSubmitted(true);
    window.setTimeout(() => {
      feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const revealOnly = () => {
    if (!current) return;
    setCurrentSimilarity(0);
    setSimilarities((prev) => ({ ...prev, [current.id]: 0 }));
    setSubmitted(true);
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
      similarity: similarities[current.id] ?? currentSimilarity,
    });
    setAttempts((prev) => [attempt, ...prev]);
    setRatings((prev) => ({ ...prev, [current.id]: rating }));

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
      setStage("summary");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setIndex((value) => value + 1);
      setAnswer("");
      setSubmitted(false);
      setCurrentSimilarity(0);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const skip = () => {
    if (index + 1 >= session.length) {
      setStage("summary");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setIndex((value) => value + 1);
    setAnswer("");
    setSubmitted(false);
    setCurrentSimilarity(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleBookmark = () => {
    if (!current) return;
    setBookmarks((prev) =>
      prev.includes(current.id) ? prev.filter((id) => id !== current.id) : [current.id, ...prev],
    );
  };

  const resetToSetup = () => {
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
                自评掌握 {good}/{rated.length || session.length} · 平均参考匹配 {formatPercent(average)}
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
  const scoreMeta = similarityLabel(currentSimilarity);
  const rating = ratings[current.id];

  return (
    <div className="animate-fade pb-4">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={resetToSetup} className="btn-ghost -ml-2 text-[0.74rem]">
          <CloseIcon className="h-3.5 w-3.5" />
          调整设置
        </button>
        <p className="text-[0.7rem] text-ink-faint">
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

            <p className="mt-5 text-[1.35rem] font-medium leading-[1.5] text-ink sm:text-[1.55rem]">
              {current.variants[config.source][0]}
            </p>

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
              onChange={(event) => setAnswer(event.target.value)}
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
                  <div className="flex items-center gap-3 rounded-2xl border border-line bg-paper px-4 py-2.5">
                    <div className="text-right">
                      <p className="text-[0.6rem] uppercase tracking-[0.12em] text-ink-faint">参考匹配</p>
                      <p className="font-display text-lg leading-none text-ink">{formatPercent(currentSimilarity)}</p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2 py-1 text-[0.6rem] font-semibold",
                        scoreMeta.tone === "good"
                          ? "bg-moss-soft text-moss"
                          : scoreMeta.tone === "ok"
                            ? "bg-gold-soft text-[#7a5c26]"
                            : "bg-coral-soft text-[#8c452e]",
                      )}
                    >
                      {scoreMeta.label}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <InfoNote>
                    这是与参考译文的结构化比对，不是唯一评分。翻译允许多种自然表达，请结合下方解析自评。
                  </InfoNote>
                </div>

                <div className="mt-5 rounded-2xl border border-moss/20 bg-moss-soft/35 p-4 sm:p-5">
                  <div className="flex items-center gap-2">
                    <LangBadge lang={config.target} />
                    <p className="text-[0.74rem] font-semibold text-ink">
                      {targetMeta.label} · 目标语言
                    </p>
                  </div>
                  <p className="mt-3 text-[1.05rem] font-medium leading-relaxed text-ink">
                    {current.variants[config.target][0]}
                  </p>
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
