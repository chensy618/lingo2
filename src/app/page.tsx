"use client";

import Link from "next/link";
import { useMemo } from "react";
import { EXERCISES, EXERCISE_MAP } from "@/lib/exercises";
import { VOCABULARY } from "@/lib/vocabulary";
import { LANGUAGES, LANG_CODES, LEVEL_LABELS } from "@/lib/types";
import {
  attemptsToday,
  dueReview,
  streakFromAttempts,
  useAttempts,
  useHydrated,
  usePreferences,
  useVocabState,
} from "@/lib/storage";
import { formatPercent, greeting, sessionHref, similarityLabel } from "@/lib/utils";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  BookmarkIcon,
  ClockIcon,
  FlameIcon,
  QuoteIcon,
  RotateIcon,
  SparkIcon,
  TargetIcon,
  TranslateIcon,
} from "@/components/icons";
import {
  LangBadge,
  LevelPill,
  ProgressRing,
  SectionHeading,
  StatCard,
  TrackPill,
} from "@/components/ui";

function recommendedFor(preferences: ReturnType<typeof usePreferences>[0]) {
  const exact = EXERCISES.filter(
    (exercise) =>
      exercise.levels[preferences.target] === preferences.level &&
      (preferences.track === "mixed" || exercise.track === preferences.track),
  );
  const pool = exact.length ? exact : EXERCISES.filter((exercise) => exercise.track === preferences.track);
  return pool.slice(0, 3);
}

export default function DashboardPage() {
  const [preferences] = usePreferences();
  const [attempts] = useAttempts();
  const [vocabState] = useVocabState();
  const mounted = useHydrated();
  const dateLabel = mounted
    ? new Intl.DateTimeFormat("zh-CN", {
        month: "long",
        day: "numeric",
        weekday: "long",
      }).format(new Date())
    : "今天";

  const sortedAttempts = useMemo(
    () => [...attempts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [attempts],
  );
  const latest = sortedAttempts[0];
  const latestExercise = latest ? EXERCISE_MAP[latest.exerciseId] : undefined;
  const today = attemptsToday(attempts);
  const streak = streakFromAttempts(attempts);
  const review = dueReview(attempts);
  const knownWords = Object.values(vocabState).filter((entry) => entry.status === "known").length;

  const goalPercent = Math.min(100, Math.round((today / preferences.dailyGoal) * 100));
  const recommendations = recommendedFor(preferences);

  const continueTarget = latest?.target ?? preferences.target;
  const continueSource = latest?.source ?? preferences.source;
  const continueLevel = latest?.level ?? preferences.level;
  const continueTrack = latest?.track ?? (preferences.track === "mixed" ? "everyday" : preferences.track);

  const prompt =
    latestExercise?.variants[continueSource][0] ??
    "虽然今天很冷，但我还是打算出去散步。";

  return (
    <div className="animate-fade">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-2">{dateLabel}</p>
          <h1 className="font-display text-[2.2rem] leading-[1.05] tracking-[-0.035em] text-ink sm:text-[2.7rem]">
            {mounted ? greeting() : "你好"}<span className="text-coral">.</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
            {today > 0
              ? `今天已经完成 ${today} 题。保持输出，让三种语言在真实语境里连起来。`
              : "从一个简短句子开始。今天的目标是主动输出，而不是被动浏览。"}
          </p>
        </div>
        <Link href={sessionHref({ ...preferences, start: true })} className="btn-primary w-fit">
          <TranslateIcon className="h-4 w-4" />
          开始今日练习
        </Link>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className="surface relative overflow-hidden p-6 sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-moss-soft/70 blur-2xl" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow">{latest ? "继续上次练习" : "第一道练习"}</span>
              <span className="h-1 w-1 rounded-full bg-line-strong" />
              <TrackPill track={continueTrack} />
              <LevelPill level={continueLevel} />
            </div>

            <div className="mt-5 flex items-center gap-2 text-[0.7rem] font-medium text-ink-faint">
              <LangBadge lang={continueSource} size="sm" />
              提示语言
              <span className="text-line-strong">→</span>
              <LangBadge lang={continueTarget} size="sm" />
              目标语言
            </div>

            <p className="mt-3 max-w-xl font-display text-[1.45rem] leading-snug tracking-[-0.02em] text-ink sm:text-[1.7rem]">
              “{prompt}”
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href={sessionHref({
                  target: continueTarget,
                  source: continueSource,
                  level: continueLevel,
                  track: continueTrack,
                  start: true,
                })}
                className="btn-primary"
              >
                {latest ? "继续练习" : "开始练习"}
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link href="/situations" className="btn-secondary">
                按情境选择
                <ArrowUpRightIcon className="h-4 w-4" />
              </Link>
              {latestExercise && (
                <span className="ml-auto hidden text-[0.7rem] text-ink-faint sm:inline">
                  {latestExercise.tags.slice(0, 2).join(" · ")}
                </span>
              )}
            </div>
          </div>
        </section>

        <section className="surface flex items-center gap-6 p-6 sm:p-7">
          <ProgressRing value={mounted ? goalPercent : 0} size={108} stroke={8}>
            <span className="font-display text-[1.55rem] leading-none text-ink">{mounted ? today : 0}</span>
            <span className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink-faint">
              / {preferences.dailyGoal}
            </span>
          </ProgressRing>
          <div className="min-w-0">
            <p className="eyebrow">今日目标</p>
            <p className="mt-1.5 font-display text-[1.25rem] leading-tight text-ink">
              {goalPercent >= 100 ? "目标已完成" : goalPercent > 0 ? "进度不错" : "从一题开始"}
            </p>
            <p className="mt-1 text-[0.72rem] leading-relaxed text-ink-faint">
              还差 {Math.max(0, preferences.dailyGoal - today)} 题完成今日目标。
            </p>
            <div className="mt-4 flex items-center gap-4 text-[0.72rem] text-ink-soft">
              <span className="inline-flex items-center gap-1.5">
                <FlameIcon className="h-3.5 w-3.5 text-coral" />
                {streak} 天连续
              </span>
              <span className="inline-flex items-center gap-1.5">
                <RotateIcon className="h-3.5 w-3.5 text-gold" />
                {review.length} 待复习
              </span>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="连续学习"
          value={`${streak} 天`}
          hint={streak > 0 ? "保持节奏" : "今天开始"}
          icon={<FlameIcon className="h-4 w-4" />}
        />
        <StatCard
          label="累计练习"
          value={`${attempts.length} 题`}
          hint={latest ? `最近 ${similarityLabel(latest.similarity).label}` : "还没有记录"}
          icon={<TranslateIcon className="h-4 w-4" />}
        />
        <StatCard
          label="掌握词汇"
          value={`${knownWords}/${VOCABULARY.length}`}
          hint="标记为“已掌握”"
          icon={<BookmarkIcon className="h-4 w-4" />}
        />
        <StatCard
          label="待复习"
          value={`${review.length} 题`}
          hint={review.length ? "来自错题与生疏题" : "暂无积压"}
          icon={<RotateIcon className="h-4 w-4" />}
        />
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        <section>
          <SectionHeading
            eyebrow="Language profiles"
            title="三种语言的独立进度"
            action={
              <Link href="/settings" className="text-[0.72rem] font-semibold text-ink-soft hover:text-moss">
                调整等级
              </Link>
            }
          />
          <div className="grid gap-3 sm:grid-cols-3">
            {LANG_CODES.map((lang) => {
              const meta = LANGUAGES[lang];
              const languageAttempts = attempts.filter((attempt) => attempt.target === lang);
              const good = languageAttempts.filter((attempt) => attempt.selfRating === "good").length;
              const accuracy = languageAttempts.length ? good / languageAttempts.length : 0;
              return (
                <Link
                  key={lang}
                  href={sessionHref({
                    target: lang,
                    source: lang === "zh" ? "en" : "zh",
                    level: preferences.profileLevels[lang],
                    track: preferences.track,
                    start: true,
                  })}
                  className="surface-flat group flex flex-col p-4 transition hover:-translate-y-0.5 hover:border-moss/35 hover:bg-white"
                >
                  <div className="flex items-center justify-between">
                    <LangBadge lang={lang} size="lg" />
                    <ArrowUpRightIcon className="h-3.5 w-3.5 text-ink-faint transition group-hover:text-moss" />
                  </div>
                  <p className="mt-4 font-display text-lg text-ink">{meta.label}</p>
                  <p className="mt-0.5 text-[0.66rem] text-ink-faint">{meta.native}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[0.7rem] font-semibold text-ink-soft">
                      {preferences.profileLevels[lang]} · {LEVEL_LABELS[preferences.profileLevels[lang]]}
                    </span>
                    <span className="text-[0.66rem] text-ink-faint">{languageAttempts.length} 题</span>
                  </div>
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${languageAttempts.length ? Math.max(8, accuracy * 100) : 0}%`,
                        backgroundColor: meta.accent,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-[0.62rem] text-ink-faint">
                    {languageAttempts.length ? `自评掌握 ${formatPercent(accuracy)}` : "尚未练习"}
                  </p>
                </Link>
              );
            })}
          </div>

          <div className="mt-4 surface p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <SparkIcon className="h-4 w-4 text-gold" />
                <p className="text-sm font-semibold text-ink">为你推荐</p>
              </div>
              <span className="text-[0.66rem] text-ink-faint">
                {preferences.target.toUpperCase()} · {preferences.level}
              </span>
            </div>
            <div className="mt-4 divide-y divide-line/70">
              {recommendations.map((exercise, index) => (
                <Link
                  key={exercise.id}
                  href={sessionHref({
                    target: preferences.target,
                    source: preferences.source,
                    level: exercise.levels[preferences.target],
                    track: exercise.track,
                    topic: exercise.topic,
                    start: true,
                  })}
                  className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <span className="font-display text-[0.8rem] text-ink-faint">0{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.82rem] font-medium text-ink group-hover:text-moss">
                      {exercise.variants[preferences.source][0]}
                    </p>
                    <p className="mt-0.5 text-[0.64rem] text-ink-faint">
                      译为 {LANGUAGES[preferences.target].zhLabel} · {LEVEL_LABELS[exercise.levels[preferences.target]]}
                    </p>
                  </div>
                  <ArrowRightIcon className="h-3.5 w-3.5 shrink-0 text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-moss" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section>
          <SectionHeading
            eyebrow="Review"
            title="待复习"
            action={
              <Link href="/progress" className="text-[0.72rem] font-semibold text-ink-soft hover:text-moss">
                全部
              </Link>
            }
          />
          <div className="surface p-5">
            {review.length ? (
              <div className="space-y-4">
                {review.slice(0, 3).map((attempt) => {
                  const exercise = EXERCISE_MAP[attempt.exerciseId];
                  if (!exercise) return null;
                  return (
                    <Link
                      key={attempt.id}
                      href={sessionHref({
                        target: attempt.target,
                        source: attempt.source,
                        level: attempt.level,
                        track: attempt.track,
                        start: true,
                      })}
                      className="block border-b border-line/70 pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center gap-2">
                        <LangBadge lang={attempt.target} size="sm" />
                        <LevelPill level={attempt.level} muted />
                        <span className="ml-auto text-[0.62rem] text-ink-faint">
                          {attempt.selfRating === "again" ? "需要重练" : "不太熟练"}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-[0.8rem] leading-relaxed text-ink-soft">
                        {exercise.variants[attempt.source][0]}
                      </p>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center py-7 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-moss-soft text-moss">
                  <TargetIcon className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-semibold text-ink">复习队列是空的</p>
                <p className="mt-1 max-w-[15rem] text-[0.7rem] leading-relaxed text-ink-faint">
                  完成练习后，把不熟悉的题目标记为需要复习，它们会出现在这里。
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 rounded-3xl border border-moss/20 bg-moss p-5 text-paper-light">
            <QuoteIcon className="h-5 w-5 text-gold" />
            <p className="mt-3 font-display text-[1.2rem] leading-snug tracking-[-0.01em]">
              翻译不是把词一一搬过去，而是在另一种语言里重新选择语气、词序和搭配。
            </p>
            <p className="mt-3 text-[0.66rem] uppercase tracking-[0.16em] text-paper-light/55">
              Today&apos;s note
            </p>
          </div>
        </section>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          {
            href: "/translation",
            title: "翻译练习",
            description: "按等级与语域完成三语言对照训练。",
            icon: <TranslateIcon className="h-4 w-4" />,
          },
          {
            href: "/vocabulary",
            title: "词汇学习",
            description: "在搭配与例句里记住词，而不是背表。",
            icon: <BookmarkIcon className="h-4 w-4" />,
          },
          {
            href: "/situations",
            title: "情境练习",
            description: "从咖啡馆到同行评审，按真实场景进入。",
            icon: <ClockIcon className="h-4 w-4" />,
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-center gap-3 rounded-2xl border border-line bg-white/35 px-4 py-3.5 transition hover:border-moss/30 hover:bg-white/70"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-moss-soft text-moss">
              {item.icon}
            </span>
            <div className="min-w-0">
              <p className="text-[0.82rem] font-semibold text-ink">{item.title}</p>
              <p className="mt-0.5 truncate text-[0.66rem] text-ink-faint">{item.description}</p>
            </div>
            <ArrowRightIcon className="ml-auto h-3.5 w-3.5 shrink-0 text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-moss" />
          </Link>
        ))}
      </div>
    </div>
  );
}
