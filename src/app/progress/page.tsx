"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EXERCISE_MAP } from "@/lib/exercises";
import { VOCABULARY } from "@/lib/vocabulary";
import {
  attemptsToday,
  dueReview,
  streakFromAttempts,
  useAttempts,
  useBookmarks,
  usePreferences,
  useVocabState,
} from "@/lib/storage";
import { LANGUAGES, LANG_CODES, LEVEL_LABELS } from "@/lib/types";
import type { Lang } from "@/lib/types";
import {
  cn,
  displayDate,
  formatPercent,
  last7Days,
  sessionHref,
  similarityLabel,
} from "@/lib/utils";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  BookmarkIcon,
  ChartIcon,
  CheckCircleIcon,
  ClockIcon,
  FlameIcon,
  RotateIcon,
  SparkIcon,
  TranslateIcon,
} from "@/components/icons";
import {
  EmptyState,
  LangBadge,
  LevelPill,
  PageHeader,
  ProgressBar,
  SectionHeading,
  StatCard,
} from "@/components/ui";

type Tab = "recent" | "review" | "bookmarks";

const RATING_LABELS = {
  again: { label: "需要重练", className: "bg-coral-soft text-[#8c452e]" },
  hard: { label: "有点难", className: "bg-gold-soft text-[#7a5c26]" },
  good: { label: "掌握了", className: "bg-moss-soft text-moss" },
} as const;

export default function ProgressPage() {
  const [attempts] = useAttempts();
  const [preferences] = usePreferences();
  const [bookmarks, setBookmarks] = useBookmarks();
  const [vocabState] = useVocabState();
  const [tab, setTab] = useState<Tab>("recent");

  const sorted = useMemo(
    () => [...attempts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [attempts],
  );
  const review = useMemo(() => dueReview(attempts), [attempts]);
  const today = attemptsToday(attempts);
  const streak = streakFromAttempts(attempts);
  const knownWords = Object.values(vocabState).filter((entry) => entry.status === "known").length;
  const averageSimilarity = attempts.length
    ? attempts.reduce((sum, attempt) => sum + attempt.similarity, 0) / attempts.length
    : 0;

  const week = last7Days();
  const weekCounts = week.map((day) => ({
    ...day,
    count: attempts.filter((attempt) => {
      const date = new Date(attempt.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      return key === day.key;
    }).length,
  }));
  const weekMax = Math.max(1, ...weekCounts.map((day) => day.count));

  const bookmarkExercises = bookmarks
    .map((id) => EXERCISE_MAP[id])
    .filter((exercise): exercise is NonNullable<typeof exercise> => Boolean(exercise));

  return (
    <div className="animate-fade">
      <PageHeader
        title="学习记录"
        description="每种语言独立记录等级与练习情况。这里也保存你的错题、收藏和自评结果。"
        action={
          <Link href={sessionHref({ ...preferences, start: true })} className="btn-primary">
            <TranslateIcon className="h-4 w-4" />
            继续练习
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="累计练习"
          value={`${attempts.length}`}
          hint={`今天 ${today} 题`}
          icon={<TranslateIcon className="h-4 w-4" />}
        />
        <StatCard
          label="连续学习"
          value={`${streak} 天`}
          hint={streak >= 3 ? "节奏很稳" : "每天一题也好"}
          icon={<FlameIcon className="h-4 w-4" />}
        />
        <StatCard
          label="参考匹配均值"
          value={attempts.length ? formatPercent(averageSimilarity) : "—"}
          hint="仅作辅助，不等于成绩"
          icon={<ChartIcon className="h-4 w-4" />}
        />
        <StatCard
          label="待复习"
          value={`${review.length}`}
          hint={`${knownWords}/${VOCABULARY.length} 词汇已掌握`}
          icon={<RotateIcon className="h-4 w-4" />}
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <section className="surface p-5 sm:p-6">
          <SectionHeading
            title="最近一周"
            action={<span className="text-[0.66rem] text-ink-faint">{weekCounts.reduce((sum, day) => sum + day.count, 0)} 题</span>}
          />
          <div className="flex h-[10rem] items-end gap-2 sm:gap-3">
            {weekCounts.map((day) => (
              <div key={day.key} className="group flex flex-1 flex-col items-center gap-2">
                <div className="relative flex w-full flex-1 items-end">
                  <div
                    className={cn(
                      "w-full rounded-t-lg transition-all duration-500",
                      day.count > 0 ? "bg-moss/85 group-hover:bg-moss" : "bg-line/70",
                    )}
                    style={{ height: `${Math.max(day.count > 0 ? 12 : 4, (day.count / weekMax) * 100)}%` }}
                  />
                  {day.count > 0 && (
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[0.58rem] font-semibold text-ink-faint">
                      {day.count}
                    </span>
                  )}
                </div>
                <span className="text-[0.6rem] font-medium text-ink-faint">{day.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="surface p-5 sm:p-6">
          <SectionHeading title="分语言进度" />
          <div className="space-y-4">
            {LANG_CODES.map((lang) => {
              const languageAttempts = attempts.filter((attempt) => attempt.target === lang);
              const good = languageAttempts.filter((attempt) => attempt.selfRating === "good").length;
              const percent = languageAttempts.length ? Math.round((good / languageAttempts.length) * 100) : 0;
              const meta = LANGUAGES[lang];
              return (
                <div key={lang}>
                  <div className="flex items-center gap-2">
                    <LangBadge lang={lang} size="sm" />
                    <span className="text-[0.78rem] font-semibold text-ink">{meta.label}</span>
                    <span className="ml-auto text-[0.64rem] text-ink-faint">
                      {preferences.profileLevels[lang]} · {LEVEL_LABELS[preferences.profileLevels[lang]]}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <ProgressBar value={percent} className="flex-1" />
                    <span className="w-10 text-right text-[0.64rem] text-ink-faint">{percent}%</span>
                  </div>
                  <p className="mt-1 text-[0.6rem] text-ink-faint">
                    {languageAttempts.length} 题 · 自评掌握 {good}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="mt-8">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {(
            [
              { key: "recent", label: "最近练习", count: attempts.length, icon: ClockIcon },
              { key: "review", label: "待复习 / 错题", count: review.length, icon: RotateIcon },
              { key: "bookmarks", label: "收藏句子", count: bookmarkExercises.length, icon: BookmarkIcon },
            ] as { key: Tab; label: string; count: number; icon: typeof ClockIcon }[]
          ).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[0.76rem] font-semibold transition",
                  tab === item.key
                    ? "border-moss bg-moss text-paper-light"
                    : "border-line bg-paper-light text-ink-soft hover:border-moss/35",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[0.56rem]",
                    tab === item.key ? "bg-paper-light/15 text-paper-light/80" : "bg-paper text-ink-faint",
                  )}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>

        {tab === "recent" &&
          (sorted.length ? (
            <div className="surface divide-y divide-line overflow-hidden">
              {sorted.slice(0, 30).map((attempt) => {
                const exercise = EXERCISE_MAP[attempt.exerciseId];
                if (!exercise) return null;
                const rating = RATING_LABELS[attempt.selfRating];
                return (
                  <div key={attempt.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <LangBadge lang={attempt.target} />
                      <div className="min-w-0">
                        <p className="truncate text-[0.82rem] font-medium text-ink">
                          {exercise.variants[attempt.source][0]}
                        </p>
                        <div className="mt-1 flex items-center gap-1.5 text-[0.62rem] text-ink-faint">
                          <LevelPill level={attempt.level} muted />
                          <span>{displayDate(attempt.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:shrink-0">
                      <span className={cn("rounded-full px-2.5 py-1 text-[0.6rem] font-semibold", rating.className)}>
                        {rating.label}
                      </span>
                      <span className="w-9 text-right text-[0.66rem] text-ink-faint">
                        {formatPercent(attempt.similarity)}
                      </span>
                      <Link
                        href={sessionHref({
                          target: attempt.target,
                          source: attempt.source,
                          level: attempt.level,
                          track: attempt.track,
                          start: true,
                        })}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink-faint transition hover:border-moss/40 hover:text-moss"
                        aria-label="再练一次"
                      >
                        <ArrowUpRightIcon className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="还没有练习记录"
              description="完成第一道翻译练习后，这里会显示你的自评、参考匹配和复习队列。"
              href="/translation"
              action="开始第一题"
            />
          ))}

        {tab === "review" &&
          (review.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {review.map((attempt) => {
                const exercise = EXERCISE_MAP[attempt.exerciseId];
                if (!exercise) return null;
                const meta = similarityLabel(attempt.similarity);
                return (
                  <article key={attempt.id} className="surface flex flex-col p-5">
                    <div className="flex items-center gap-2">
                      <LangBadge lang={attempt.target} size="sm" />
                      <LevelPill level={attempt.level} muted />
                      <span className="ml-auto text-[0.62rem] text-ink-faint">{displayDate(attempt.createdAt)}</span>
                    </div>
                    <p className="mt-3 text-[0.95rem] font-medium leading-snug text-ink">
                      {exercise.variants[attempt.source][0]}
                    </p>
                    <p className="mt-2 line-clamp-2 text-[0.72rem] leading-relaxed text-ink-faint">
                      参考：{exercise.variants[attempt.target][0]}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-[0.62rem] text-ink-faint">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 font-semibold",
                          attempt.selfRating === "again" ? "bg-coral-soft text-[#8c452e]" : "bg-gold-soft text-[#7a5c26]",
                        )}
                      >
                        {RATING_LABELS[attempt.selfRating].label}
                      </span>
                      <span>参考匹配 {formatPercent(attempt.similarity)} · {meta.label}</span>
                    </div>
                    <Link
                      href={sessionHref({
                        target: attempt.target,
                        source: attempt.source,
                        level: attempt.level,
                        track: attempt.track,
                        start: true,
                      })}
                      className="btn-secondary mt-4 w-full text-[0.72rem]"
                    >
                      <RotateIcon className="h-3.5 w-3.5" />
                      重练这道题
                    </Link>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="surface flex flex-col items-center px-6 py-14 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-moss-soft text-moss">
                <CheckCircleIcon className="h-5 w-5" />
              </span>
              <p className="mt-4 font-display text-xl text-ink">复习队列是空的</p>
              <p className="mt-1.5 max-w-sm text-sm text-ink-faint">
                把练习中不熟悉的题目标记为“需要重练”或“有点难”，它们会自动进入这里。
              </p>
            </div>
          ))}

        {tab === "bookmarks" &&
          (bookmarkExercises.length ? (
            <div className="surface divide-y divide-line overflow-hidden">
              {bookmarkExercises.map((exercise) => {
                const targetLang: Lang = preferences.target;
                return (
                  <div key={exercise.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <LangBadge lang={targetLang} />
                      <div className="min-w-0">
                        <p className="truncate text-[0.82rem] font-medium text-ink">
                          {exercise.variants[preferences.source][0]}
                        </p>
                        <p className="mt-1 truncate text-[0.68rem] text-ink-faint">
                          {exercise.variants[targetLang][0]}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <LevelPill level={exercise.levels[targetLang]} muted />
                      <button
                        type="button"
                        onClick={() => setBookmarks((prev) => prev.filter((id) => id !== exercise.id))}
                        className="btn-ghost text-[0.66rem]"
                      >
                        移除
                      </button>
                      <Link
                        href={sessionHref({
                          target: targetLang,
                          source: preferences.source,
                          level: exercise.levels[targetLang],
                          track: exercise.track,
                          start: true,
                        })}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink-faint transition hover:border-moss/40 hover:text-moss"
                        aria-label="练习"
                      >
                        <ArrowRightIcon className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="surface flex flex-col items-center px-6 py-14 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-soft text-gold">
                <BookmarkIcon className="h-5 w-5" />
              </span>
              <p className="mt-4 font-display text-xl text-ink">还没有收藏句子</p>
              <p className="mt-1.5 max-w-sm text-sm text-ink-faint">
                在翻译练习的反馈区点击“收藏句子”，它就会出现在这里，方便以后重看或重练。
              </p>
              <Link href="/translation" className="btn-primary mt-5">
                <SparkIcon className="h-4 w-4" />
                去练习
              </Link>
            </div>
          ))}
      </div>

    </div>
  );
}
