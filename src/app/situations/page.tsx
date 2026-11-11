"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EXERCISES } from "@/lib/exercises";
import { SCENARIOS } from "@/lib/scenarios";
import { TOPICS } from "@/lib/topics";
import { usePreferences } from "@/lib/storage";
import { LANGUAGES, LANG_CODES } from "@/lib/types";
import type { BaseTrack, Lang } from "@/lib/types";
import { cn, sessionHref } from "@/lib/utils";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  CheckCircleIcon,
  CompassIcon,
  SparkIcon,
} from "@/components/icons";
import { LangBadge, LevelPill, PageHeader, SectionHeading, TrackPill } from "@/components/ui";

function exerciseFor(topic: string, track: BaseTrack) {
  return (
    EXERCISES.find((exercise) => exercise.topic === topic && exercise.track === track) ??
    EXERCISES.find((exercise) => exercise.track === track)
  );
}

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
        eyebrow="Situational practice"
        title="情境练习"
        description="从真实场景进入语言。每个情境都围绕一个交际目标组织：先做什么、怎么说、遇到变化如何回应。"
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
              <p className="eyebrow">Choose your output</p>
            </div>
            <h2 className="mt-2 font-display text-xl text-ink">这次你想用哪种语言表达？</h2>
            <p className="mt-1 text-[0.74rem] leading-relaxed text-ink-faint">
              情境本身不绑定学习方向。选择目标语言后，每个场景会带你进入对应等级的翻译练习。
            </p>
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
          const exercise = exerciseFor(scenario.topic, scenario.track);
          const level = exercise?.levels[activeTarget] ?? scenario.level;
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

                <div className="mt-4 space-y-2">
                  {scenario.steps.map((step, stepIndex) => (
                    <div key={step} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-moss-soft text-[0.52rem] font-bold text-moss">
                        {stepIndex + 1}
                      </span>
                      <span className="text-[0.7rem] leading-relaxed text-ink-soft">{step}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  <span className="chip">{TOPICS.find((topic) => topic.id === scenario.topic)?.label}</span>
                  <span className="chip">目标：{LANGUAGES[activeTarget].zhLabel}</span>
                  <span className="chip">提示：{LANGUAGES[source].zhLabel}</span>
                </div>
              </div>

              <div className="border-t border-line bg-paper/45 px-5 py-3.5">
                <Link
                  href={
                    exercise
                      ? sessionHref({
                          target: activeTarget,
                          source,
                          level,
                          track: scenario.track,
                          topic: scenario.topic,
                          start: true,
                        })
                      : "/translation"
                  }
                  className="flex items-center justify-between text-[0.76rem] font-semibold text-ink transition group-hover:text-moss"
                >
                  进入情境练习
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-line-strong bg-white/60 transition group-hover:border-moss/40 group-hover:bg-moss group-hover:text-paper-light">
                    <ArrowUpRightIcon className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <section className="surface p-5 sm:p-6">
          <SectionHeading eyebrow="Coming next" title="后续会加入的练习形式" />
          <div className="space-y-2.5">
            {[
              "对话补全与角色扮演",
              "口语 ↔ 正式表达的句子改写",
              "多句与段落级翻译",
              "同一词语在不同情境中的用法比较",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <CheckCircleIcon className="h-4 w-4 shrink-0 text-moss/70" />
                <span className="text-[0.76rem] text-ink-soft">{item}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="flex flex-col justify-between rounded-[1.75rem] border border-moss/20 bg-moss p-5 text-paper-light sm:p-6">
          <div>
            <SparkIcon className="h-5 w-5 text-gold" />
            <p className="mt-3 font-display text-[1.25rem] leading-snug">
              情境不是为了背“标准对话”，而是训练你在真实互动中做选择。
            </p>
          </div>
          <div className="mt-4 flex items-center gap-4 text-[0.64rem] text-paper-light/60">
            <span>{SCENARIOS.length} 个情境</span>
            <span className="h-0.5 w-0.5 rounded-full bg-paper-light/40" />
            <span>日常与学术并行</span>
            <span className="h-0.5 w-0.5 rounded-full bg-paper-light/40" />
            <span>三语言自由切换</span>
          </div>
        </section>
      </div>
    </div>
  );
}
