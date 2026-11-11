"use client";

import { useState } from "react";
import { LANGUAGES, LANG_CODES, LEVELS, LEVEL_LABELS, TRACKS } from "@/lib/types";
import type { Lang, Level, Track } from "@/lib/types";
import {
  STORAGE_KEYS,
  useAttempts,
  useBookmarks,
  usePreferences,
  useVocabState,
} from "@/lib/storage";
import { cn } from "@/lib/utils";
import {
  CheckCircleIcon,
  ChevronDownIcon,
  GlobeIcon,
  SparkIcon,
  TargetIcon,
  TranslateIcon,
} from "@/components/icons";
import { LangBadge, PageHeader, SectionHeading } from "@/components/ui";

function fallbackSource(target: Lang, current: Lang) {
  if (current !== target) return current;
  return target === "zh" ? "en" : "zh";
}

export default function SettingsPage() {
  const [preferences, setPreferences, hydrated] = usePreferences();
  const [attempts] = useAttempts();
  const [bookmarks] = useBookmarks();
  const [vocabState] = useVocabState();
  const [saved, setSaved] = useState(false);

  const update = (patch: Partial<typeof preferences>) => {
    setPreferences((prev) => ({ ...prev, ...patch }));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  };

  const exportData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      preferences,
      attempts,
      bookmarks,
      vocabulary: vocabState,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lingo2-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearData = () => {
    if (!window.confirm("确定要清除所有本地学习数据吗？练习记录、自评、收藏和词汇状态都会被删除。")) {
      return;
    }
    for (const key of Object.values(STORAGE_KEYS)) {
      window.localStorage.removeItem(key);
    }
    window.location.reload();
  };

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Settings"
        title="设置"
        description="设置只影响默认练习配置，不会锁定学习方向。每次开始练习时仍可单独调整。"
        action={
          saved ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-moss-soft px-3 py-1.5 text-[0.68rem] font-semibold text-moss animate-fade">
              <CheckCircleIcon className="h-3.5 w-3.5" />
              已保存到本地
            </span>
          ) : (
            <span className="text-[0.66rem] text-ink-faint">{hydrated ? "自动保存" : "加载中…"}</span>
          )
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-5">
          <section className="surface p-5 sm:p-6">
            <SectionHeading eyebrow="Defaults" title="默认练习配置" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="label">默认目标语言</span>
                <div className="grid grid-cols-3 gap-2">
                  {LANG_CODES.map((lang) => {
                    const active = preferences.target === lang;
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => update({ target: lang, source: fallbackSource(lang, preferences.source) })}
                        className={cn(
                          "rounded-xl border px-2 py-2.5 text-center transition",
                          active ? "border-moss bg-moss text-paper-light" : "border-line bg-white/50 text-ink-soft hover:border-moss/35",
                        )}
                      >
                        <LangBadge lang={lang} size="sm" />
                        <span className="mt-1 block text-[0.66rem] font-semibold">{LANGUAGES[lang].label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="label">默认提示语言</span>
                <div className="grid grid-cols-2 gap-2">
                  {LANG_CODES.filter((lang) => lang !== preferences.target).map((lang) => {
                    const active = preferences.source === lang;
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => update({ source: lang })}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-[0.68rem] font-semibold transition",
                          active ? "border-moss bg-moss-soft/55 text-ink" : "border-line bg-white/50 text-ink-soft hover:border-moss/35",
                        )}
                      >
                        <LangBadge lang={lang} size="sm" />
                        {LANGUAGES[lang].label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="block">
                <span className="label">默认等级</span>
                <span className="relative block">
                  <select
                    className="field appearance-none pr-9"
                    value={preferences.level}
                    onChange={(event) => update({ level: event.target.value as Level })}
                  >
                    {LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level} · {LEVEL_LABELS[level]}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="pointer-events-none absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
                </span>
              </label>

              <label className="block">
                <span className="label">默认场景</span>
                <span className="relative block">
                  <select
                    className="field appearance-none pr-9"
                    value={preferences.track}
                    onChange={(event) => update({ track: event.target.value as Track })}
                  >
                    {(Object.keys(TRACKS) as Track[]).map((track) => (
                      <option key={track} value={track}>
                        {TRACKS[track].label}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="pointer-events-none absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
                </span>
              </label>

              <label className="block">
                <span className="label">每轮题数</span>
                <span className="relative block">
                  <select
                    className="field appearance-none pr-9"
                    value={preferences.sessionSize}
                    onChange={(event) => update({ sessionSize: Number(event.target.value) })}
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

              <label className="block">
                <span className="label">每日目标</span>
                <span className="relative block">
                  <select
                    className="field appearance-none pr-9"
                    value={preferences.dailyGoal}
                    onChange={(event) => update({ dailyGoal: Number(event.target.value) })}
                  >
                    {[5, 10, 15, 20, 30].map((size) => (
                      <option key={size} value={size}>
                        {size} 题 / 天
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="pointer-events-none absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
                </span>
              </label>
            </div>

            <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-line bg-white/40 px-4 py-3">
              <div>
                <p className="text-[0.78rem] font-semibold text-ink">提交后显示第三语言</p>
                <p className="mt-0.5 text-[0.66rem] text-ink-faint">
                  关闭后，反馈区只显示目标语言与提示语言。
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={preferences.showThird}
                onClick={() => update({ showThird: !preferences.showThird })}
                className={cn(
                  "relative h-6 w-11 shrink-0 rounded-full border transition",
                  preferences.showThird ? "border-moss bg-moss" : "border-line-strong bg-paper",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white shadow transition-all",
                    preferences.showThird ? "left-[1.35rem]" : "left-0.5",
                  )}
                  style={{ height: "1.1rem", width: "1.1rem" }}
                />
              </button>
            </div>
          </section>

          <section className="surface p-5 sm:p-6">
            <SectionHeading eyebrow="Language profiles" title="各语言档案等级" />
            <p className="-mt-2 mb-4 text-[0.7rem] leading-relaxed text-ink-faint">
              这是你为自己设定的当前水平。它与题目难度分开标记，用于首页的进度展示。
            </p>
            <div className="space-y-3">
              {LANG_CODES.map((lang) => {
                const meta = LANGUAGES[lang];
                return (
                  <div key={lang} className="flex flex-col gap-3 rounded-2xl border border-line bg-white/40 px-4 py-3 sm:flex-row sm:items-center">
                    <div className="flex flex-1 items-center gap-2.5">
                      <LangBadge lang={lang} size="lg" />
                      <div>
                        <p className="text-[0.82rem] font-semibold text-ink">{meta.label}</p>
                        <p className="text-[0.64rem] text-ink-faint">{meta.native}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {LEVELS.map((level) => {
                        const active = preferences.profileLevels[lang] === level;
                        return (
                          <button
                            key={level}
                            type="button"
                            onClick={() =>
                              update({
                                profileLevels: { ...preferences.profileLevels, [lang]: level },
                              })
                            }
                            className={cn(
                              "h-7 w-9 rounded-lg border text-[0.64rem] font-semibold transition",
                              active
                                ? "border-moss bg-moss text-paper-light"
                                : "border-line bg-paper-light text-ink-faint hover:border-moss/35 hover:text-ink",
                            )}
                          >
                            {level}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section className="surface p-5 sm:p-6">
            <SectionHeading eyebrow="Data" title="数据管理" />
            <div className="space-y-2.5">
              <button type="button" onClick={exportData} className="btn-secondary w-full text-[0.76rem]">
                导出本地数据（JSON）
              </button>
              <button
                type="button"
                onClick={clearData}
                className="btn w-full rounded-full border border-coral/30 bg-coral-soft/50 px-5 py-2.5 text-[0.76rem] text-[#8c452e] transition hover:border-coral/60"
              >
                清除所有学习数据
              </button>
            </div>
            <div className="mt-4 space-y-2 text-[0.68rem] text-ink-faint">
              <div className="flex justify-between">
                <span>练习记录</span>
                <span className="font-medium text-ink-soft">{attempts.length} 条</span>
              </div>
              <div className="flex justify-between">
                <span>收藏句子</span>
                <span className="font-medium text-ink-soft">{bookmarks.length} 条</span>
              </div>
              <div className="flex justify-between">
                <span>词汇状态</span>
                <span className="font-medium text-ink-soft">{Object.keys(vocabState).length} 条</span>
              </div>
            </div>
          </section>

          <section className="surface p-5 sm:p-6">
            <SectionHeading eyebrow="Interface" title="界面与规范" />
            <div className="space-y-3">
              {[
                { icon: GlobeIcon, label: "界面语言", value: "简体中文" },
                { icon: TranslateIcon, label: "挪威语规范", value: "Bokmål" },
                { icon: GateIcon, label: "中文形式", value: "简体中文" },
                { icon: TargetIcon, label: "英语拼写", value: "统一拼写（后续可切换）" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-paper text-ink-faint">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="flex-1 text-[0.72rem] text-ink-soft">{item.label}</span>
                    <span className="text-[0.68rem] font-medium text-ink">{item.value}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl border border-moss/20 bg-moss p-5 text-paper-light">
            <SparkIcon className="h-5 w-5 text-gold" />
            <p className="mt-3 font-display text-[1.1rem] leading-snug">
              当前为 MVP：参考译文与自评优先，AI 反馈将在下一阶段接入。
            </p>
            <p className="mt-2 text-[0.68rem] leading-relaxed text-paper-light/60">
              自动比对只衡量与参考译文的结构相似度，不代表你的表达不自然。真正的判断标准是语义准确、语法正确、表达自然和语域合适。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function GateIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M5 4.5h14v15H5z" />
      <path d="M8.5 8h7M8.5 12h7M8.5 16h4" />
    </svg>
  );
}
