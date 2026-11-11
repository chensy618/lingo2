"use client";

import Link from "next/link";
import { useMemo } from "react";
import { EXERCISES, EXERCISE_MAP } from "@/lib/exercises";
import { LANGUAGES, LANG_CODES, LEVEL_LABELS } from "@/lib/types";
import {
  attemptsToday,
  dueReview,
  streakFromAttempts,
  useAttempts,
  useHydrated,
  usePreferences,
} from "@/lib/storage";
import { greeting, sessionHref } from "@/lib/utils";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  RotateIcon,
  SparkIcon,
  TargetIcon,
  TranslateIcon,
} from "@/components/icons";
import { LangBadge, ProgressRing, SectionHeading, TrackPill } from "@/components/ui";

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
  const mounted = useHydrated();

  const dateLabel = mounted
    ? new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "long" }).format(new Date())
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
  const goalPercent = Math.min(100, Math.round((today / preferences.dailyGoal) * 100));
  const recommendations = recommendedFor(preferences);

  const continueTarget = latest?.target ?? preferences.target;
  const continueSource = latest?.source ?? preferences.source;
  const continueLevel = latest?.level ?? preferences.level;
  const continueTrack = latest?.track ?? (preferences.track === "mixed" ? "everyday" : preferences.track);
  const featuredExercise = latestExercise ?? recommendations[0];
  const prompt = featuredExercise?.variants[continueSource][0] ?? "你好！我叫安娜，来自挪威。";

  return (
    <div className="animate-fade">
      <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-[0.68rem] font-medium text-ink-faint">{dateLabel}</p>
          <h1 className="font-display text-[2.1rem] leading-[1.05] tracking-[-0.035em] text-ink sm:text-[2.5rem]">
            {mounted ? greeting() : "你好"}<span className="text-coral">.</span>
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            {today > 0 ? `今天已完成 ${today} 题，继续保持。` : "从一个简短句子开始。"}
          </p>
        </div>
        <Link href={sessionHref({ ...preferences, start: true })} className="btn-primary w-fit">
          <TranslateIcon className="h-4 w-4" />
          开始练习
        </Link>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className="surface flex flex-col justify-between p-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-[0.68rem] text-ink-faint">
              <span className="font-semibold uppercase tracking-[0.14em]">
                {latest ? "继续上次练习" : "第一道练习"}
              </span>
              <span className="h-0.5 w-0.5 rounded-full bg-line-strong" />
              <span>
                {LANGUAGES[continueTarget].label} · {continueLevel}
              </span>
              <TrackPill track={continueTrack} />
            </div>
            <p className="mt-4 font-display text-[1.45rem] leading-snug tracking-[-0.02em] text-ink sm:text-[1.65rem]">
              “{prompt}”
            </p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-[0.7rem] text-ink-faint">
            <LangBadge lang={continueSource} size="sm" />
            译为
            <LangBadge lang={continueTarget} size="sm" />
            <Link
              href={sessionHref({
                target: continueTarget,
                source: continueSource,
                level: continueLevel,
                track: continueTrack,
                start: true,
              })}
              className="btn-primary ml-auto"
            >
              {latest ? "继续" : "开始"}
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="surface p-6">
          <div className="flex items-center gap-5">
            <ProgressRing value={mounted ? goalPercent : 0} size={84} stroke={6}>
              <span className="font-display text-[1.35rem] leading-none text-ink">{mounted ? today : 0}</span>
              <span className="mt-0.5 text-[0.58rem] font-medium text-ink-faint">/ {preferences.dailyGoal}</span>
            </ProgressRing>
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ink-faint">今日目标</p>
              <p className="mt-1 font-display text-[1.15rem] text-ink">
                {goalPercent >= 100 ? "已完成" : `还差 ${Math.max(0, preferences.dailyGoal - today)} 题`}
              </p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 divide-x divide-line border-t border-line pt-4 text-center">
            <div>
              <p className="font-display text-lg text-ink">{streak}</p>
              <p className="mt-0.5 text-[0.6rem] text-ink-faint">连续天数</p>
            </div>
            <div>
              <p className="font-display text-lg text-ink">{attempts.length}</p>
              <p className="mt-0.5 text-[0.6rem] text-ink-faint">累计题数</p>
            </div>
            <div>
              <p className="font-display text-lg text-ink">{review.length}</p>
              <p className="mt-0.5 text-[0.6rem] text-ink-faint">待复习</p>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-9">
        <SectionHeading
          title="语言进度"
          action={
            <Link href="/settings" className="text-[0.7rem] font-medium text-ink-faint hover:text-moss">
              调整等级
            </Link>
          }
        />
        <div className="grid gap-3 sm:grid-cols-3">
          {LANG_CODES.map((lang) => {
            const meta = LANGUAGES[lang];
            const count = attempts.filter((attempt) => attempt.target === lang).length;
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
                className="surface-flat group flex items-center gap-3 px-4 py-3.5 transition hover:border-moss/30 hover:bg-white/60"
              >
                <LangBadge lang={lang} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="text-[0.82rem] font-semibold text-ink">{meta.label}</p>
                  <p className="mt-0.5 text-[0.65rem] text-ink-faint">
                    {preferences.profileLevels[lang]} · {LEVEL_LABELS[preferences.profileLevels[lang]]} · {count} 题
                  </p>
                </div>
                <ArrowUpRightIcon className="h-3.5 w-3.5 text-ink-faint transition group-hover:text-moss" />
              </Link>
            );
          })}
        </div>
      </section>

      <div className="mt-9 grid gap-4 lg:grid-cols-2">
        <section>
          <SectionHeading
            title="今日推荐"
            action={<SparkIcon className="h-4 w-4 text-gold" />}
          />
          <div className="surface divide-y divide-line/70 px-5 py-1">
            {recommendations.map((exercise) => (
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
                className="group flex items-center gap-3 py-3.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.8rem] font-medium text-ink group-hover:text-moss">
                    {exercise.variants[preferences.source][0]}
                  </p>
                  <p className="mt-0.5 text-[0.62rem] text-ink-faint">
                    {LANGUAGES[preferences.target].label} · {exercise.levels[preferences.target]}
                  </p>
                </div>
                <ArrowRightIcon className="h-3.5 w-3.5 shrink-0 text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-moss" />
              </Link>
            ))}
          </div>
        </section>

        <section>
          <SectionHeading
            title="待复习"
            action={
              <Link href="/progress" className="text-[0.7rem] font-medium text-ink-faint hover:text-moss">
                全部
              </Link>
            }
          />
          <div className="surface px-5 py-1">
            {review.length ? (
              <div className="divide-y divide-line/70">
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
                      className="flex items-center gap-3 py-3.5"
                    >
                      <LangBadge lang={attempt.target} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[0.8rem] text-ink-soft">{exercise.variants[attempt.source][0]}</p>
                        <p className="mt-0.5 text-[0.62rem] text-ink-faint">
                          {attempt.level} · {attempt.selfRating === "again" ? "需要重练" : "不太熟练"}
                        </p>
                      </div>
                      <RotateIcon className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-3 py-8">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-moss-soft text-moss">
                  <TargetIcon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[0.8rem] font-medium text-ink">暂无待复习</p>
                  <p className="mt-0.5 text-[0.65rem] text-ink-faint">不熟悉的题目会自动进入这里。</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

    </div>
  );
}
