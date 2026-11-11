"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SCENARIOS } from "@/lib/scenarios";
import { TOPICS } from "@/lib/topics";
import { usePreferences } from "@/lib/storage";
import { LANGUAGES, LANG_CODES } from "@/lib/types";
import type { BaseTrack, Lang } from "@/lib/types";
import { cn, sessionHref } from "@/lib/utils";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  CompassIcon,
} from "@/components/icons";
import { LangBadge, LevelPill, PageHeader, TrackPill } from "@/components/ui";

export default function SituationsPage() {
  const [preferences] = usePreferences();
  const [track, setTrack] = useState<BaseTrack>("everyday");
  const [target, setTarget] = useState<Lang>(preferences.target);
  const [source, setSource] = useState<Lang>(preferences.source === preferences.target ? "zh" : preferences.source);

  const scenarios = useMemo(() => SCENARIOS.filter((scenario) => scenario.track === track), [track]);
  const activeTarget = target === source ? (target === "zh" ? "en" : "zh") : target;

  return (
    <div className="animate-fade">
      <PageHeader
        title="情境练习"
        description="按真实交际场景进入对应等级的翻译练习。"
        action={
          <Link href="/translation" className="btn-secondary text-[0.76rem]">
            自由翻译练习
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        }
      />

      <section className="surface relative mb-5 overflow-hidden p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-gold-soft/70 blur-2xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <div className="flex items-center gap-2">
              <CompassIcon className="h-4 w-4 text-moss" />
              <h2 className="font-display text-lg text-ink">目标语言</h2>
            </div>
            <p className="mt-1 text-[0.72rem] text-ink-faint">选择后进入对应等级的情境练习。</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {LANG_CODES.map((lang) => {
              const active = activeTarget === lang;
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => {
                    setTarget(lang);
                    if (source === lang) setSource(lang === "zh" ? "en" : "zh");
                  }}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[0.76rem] font-semibold transition",
                    active
                      ? "border-moss bg-moss text-paper-light"
                      : "border-line bg-paper-light text-ink-soft hover:border-moss/35",
                  )}
                >
                  <LangBadge lang={lang} size="sm" />
                  {LANGUAGES[lang].label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <span className="text-[0.66rem] font-semibold text-ink-faint">题目语言</span>
          {LANG_CODES.filter((lang) => lang !== activeTarget).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setSource(lang)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.68rem] font-medium transition",
                source === lang
                  ? "border-moss/40 bg-moss-soft/60 text-ink"
                  : "border-line bg-white/45 text-ink-faint hover:border-moss/30",
              )}
            >
              <LangBadge lang={lang} size="sm" />
              {LANGUAGES[lang].label}
            </button>
          ))}
          <span className="ml-auto text-[0.64rem] text-ink-faint">
            第三语言 · {LANGUAGES[LANG_CODES.find((lang) => lang !== activeTarget && lang !== source)!].zhLabel} · 提交后显示
          </span>
        </div>
      </section>

      <div className="mb-5 flex items-center gap-2">
        {(
          [
            { key: "everyday", label: "日常场景", count: SCENARIOS.filter((item) => item.track === "everyday").length },
            { key: "academic", label: "学术场景", count: SCENARIOS.filter((item) => item.track === "academic").length },
          ] as { key: BaseTrack; label: string; count: number }[]
        ).map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTrack(item.key)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[0.78rem] font-semibold transition",
              track === item.key
                ? "border-moss bg-moss text-paper-light"
                : "border-line bg-paper-light text-ink-soft hover:border-moss/35",
            )}
          >
            {item.label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[0.58rem]",
                track === item.key ? "bg-paper-light/15 text-paper-light/80" : "bg-paper text-ink-faint",
              )}
            >
              {item.count}
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {scenarios.map((scenario, index) => {
          const level = scenario.level;
          return (
            <article
              key={scenario.id}
              className={cn(
                "surface group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:border-moss/30",
                index === 0 && "md:col-span-2 xl:col-span-1",
              )}
            >
              <div className="relative flex-1 p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <LevelPill level={level} />
                    <TrackPill track={scenario.track} />
                  </div>
                  <span className="font-display text-[0.85rem] text-ink-faint">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h2 className="mt-4 font-display text-[1.35rem] leading-tight tracking-[-0.02em] text-ink">
                  {scenario.title}
                </h2>
                <p className="mt-0.5 text-[0.64rem] uppercase tracking-[0.12em] text-ink-faint">
                  {scenario.titleEn}
                </p>
                <p className="mt-2.5 text-[0.74rem] leading-relaxed text-ink-soft">{scenario.description}</p>

                <p className="mt-4 text-[0.64rem] text-ink-faint">
                  {TOPICS.find((topic) => topic.id === scenario.topic)?.label}
                </p>
              </div>

              <div className="border-t border-line bg-paper/45 px-5 py-3.5">
                <Link
                  href={sessionHref({
                    target: activeTarget,
                    source,
                    scenario: scenario.id,
                    start: true,
                  })}
                  className="flex items-center justify-between text-[0.76rem] font-semibold text-ink transition group-hover:text-moss"
                >
                  进入情境练习 · {scenario.exerciseIds.length} 句
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-line-strong bg-white/60 transition group-hover:border-moss/40 group-hover:bg-moss group-hover:text-paper-light">
                    <ArrowUpRightIcon className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </div>
            </article>
          );
        })}
      </div>

    </div>
  );
}
