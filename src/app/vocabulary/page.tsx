"use client";

import { useMemo, useState } from "react";
import type { Lang, Level, Track } from "@/lib/types";
import { LANGUAGES, LANG_CODES, LEVELS } from "@/lib/types";
import { VOCABULARY } from "@/lib/vocabulary";
import { TOPICS } from "@/lib/topics";
import { usePreferences, useVocabState } from "@/lib/storage";
import { cn } from "@/lib/utils";
import {
  BookmarkIcon,
  CheckCircleIcon,
  RotateIcon,
  SparkIcon,
} from "@/components/icons";
import { LangBadge, LevelPill, PageHeader, TrackPill } from "@/components/ui";
import { SpeakButton } from "@/components/SpeakButton";
import type { VocabStatus } from "@/lib/types";

type StatusFilter = "all" | "new" | "learning" | "known";

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: "全部",
  new: "未学习",
  learning: "学习中",
  known: "已掌握",
};

const STATUS_ACTIONS: { status: VocabStatus["status"]; label: string; icon: typeof CheckCircleIcon }[] = [
  { status: "new", label: "未学习", icon: RotateIcon },
  { status: "learning", label: "学习中", icon: SparkIcon },
  { status: "known", label: "已掌握", icon: CheckCircleIcon },
];

export default function VocabularyPage() {
  const [preferences] = usePreferences();
  const [vocabState, setVocabState] = useVocabState();

  const [userFocus, setUserFocus] = useState<Lang | null>(null);
  const focusLang = userFocus ?? preferences.target;
  const [level, setLevel] = useState<Level | "all">("all");
  const [track, setTrack] = useState<Track>("mixed");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hideMeanings, setHideMeanings] = useState(false);


  const filtered = useMemo(() => {
    return VOCABULARY.filter((entry) => {
      if (level !== "all" && entry.levels[focusLang] !== level) return false;
      if (track !== "mixed" && entry.track !== track) return false;
      const entryStatus = vocabState[entry.id]?.status ?? "new";
      if (status !== "all" && entryStatus !== status) return false;
      if (query.trim()) {
        const needle = query.trim().toLowerCase();
        const haystack = [
          ...LANG_CODES.map((lang) => entry.translations[lang]),
          ...LANG_CODES.map((lang) => entry.definitions[lang]),
          entry.id,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [focusLang, level, track, status, query, vocabState]);


  const selected = filtered.find((entry) => entry.id === selectedId) ?? filtered[0];
  const knownCount = Object.values(vocabState).filter((entry) => entry.status === "known").length;
  const learningCount = Object.values(vocabState).filter((entry) => entry.status === "learning").length;

  const setStatusFor = (id: string, next: VocabStatus["status"]) => {
    setVocabState((prev) => ({
      ...prev,
      [id]: { status: next, updatedAt: new Date().toISOString() },
    }));
  };

  return (
    <div className="animate-fade">
      <PageHeader
        title="词汇学习"
        description={`围绕概念学习三语言释义、搭配与例句。${knownCount} 个已掌握，${learningCount} 个学习中。`}
      />

      <div className="surface mb-5 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[0.7rem] font-semibold text-ink-faint">学习语言</span>
          {LANG_CODES.map((lang) => {
            const active = focusLang === lang;
            return (
              <button
                key={lang}
                type="button"
                onClick={() => setUserFocus(lang)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.74rem] font-semibold transition",
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

          <span className="mx-1 hidden h-5 w-px bg-line sm:block" />

          <select
            className="rounded-full border border-line bg-paper-light px-3 py-1.5 text-[0.72rem] font-medium text-ink-soft outline-none focus:border-moss"
            value={level}
            onChange={(event) => setLevel(event.target.value as Level | "all")}
            aria-label="按等级筛选"
          >
            <option value="all">全部等级</option>
            {LEVELS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            className="rounded-full border border-line bg-paper-light px-3 py-1.5 text-[0.72rem] font-medium text-ink-soft outline-none focus:border-moss"
            value={track}
            onChange={(event) => setTrack(event.target.value as Track)}
            aria-label="按场景筛选"
          >
            <option value="mixed">全部场景</option>
            <option value="everyday">日常生活</option>
            <option value="academic">学术与专业</option>
          </select>

          <select
            className="rounded-full border border-line bg-paper-light px-3 py-1.5 text-[0.72rem] font-medium text-ink-soft outline-none focus:border-moss"
            value={status}
            onChange={(event) => setStatus(event.target.value as StatusFilter)}
            aria-label="按掌握状态筛选"
          >
            {(Object.keys(STATUS_LABELS) as StatusFilter[]).map((key) => (
              <option key={key} value={key}>
                {STATUS_LABELS[key]}
              </option>
            ))}
          </select>

          <div className="relative ml-auto min-w-[10rem] flex-1 sm:max-w-[15rem]">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索词义…"
              className="w-full rounded-full border border-line bg-white/70 px-4 py-1.5 text-[0.72rem] text-ink outline-none placeholder:text-ink-faint focus:border-moss"
            />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="surface flex flex-col items-center px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-moss-soft text-moss">
            <BookmarkIcon className="h-5 w-5" />
          </span>
          <p className="mt-4 font-display text-xl text-ink">没有匹配的词条</p>
          <p className="mt-1.5 text-sm text-ink-faint">试试放宽等级、场景或掌握状态。</p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[22rem_1fr]">
          <section className="space-y-2.5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                {filtered.length} 个词条
              </p>
              <p className="text-[0.64rem] text-ink-faint">
                按 {LANGUAGES[focusLang].label} 等级与释义
              </p>
            </div>
            <div className="max-h-[calc(100dvh-15rem)] space-y-2 overflow-y-auto pr-1 lg:sticky lg:top-8">
              {filtered.map((entry) => {
                const active = selected?.id === entry.id;
                const entryStatus = vocabState[entry.id]?.status ?? "new";
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setSelectedId(entry.id)}
                    className={cn(
                      "w-full rounded-2xl border px-4 py-3 text-left transition",
                      active
                        ? "border-moss bg-moss-soft/45 shadow-[0_12px_28px_-24px_rgba(47,93,80,0.8)]"
                        : "border-line bg-paper-light/55 hover:border-moss/30 hover:bg-white/70",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <LangBadge lang={focusLang} size="sm" />
                      <span className="text-[1rem] font-semibold leading-none text-ink">
                        {entry.translations[focusLang].split(" / ")[0]}
                      </span>
                      <span className="ml-auto flex items-center gap-1.5">
                        <LevelPill level={entry.levels[focusLang]} muted />
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            entryStatus === "known"
                              ? "bg-moss"
                              : entryStatus === "learning"
                                ? "bg-gold"
                                : "bg-line-strong",
                          )}
                          title={STATUS_LABELS[entryStatus]}
                        />
                      </span>
                    </div>
                    <p className={cn("mt-1.5 line-clamp-2 text-[0.72rem] leading-relaxed text-ink-faint", hideMeanings && "blur-[3px]")}>
                      {entry.definitions[focusLang]}
                    </p>
                    <p className="mt-1.5 text-[0.58rem] uppercase tracking-[0.1em] text-ink-faint">{entry.pos}</p>
                  </button>
                );
              })}
            </div>
          </section>

          {selected && (
            <section className="surface overflow-hidden">
              <div className="border-b border-line px-5 py-5 sm:px-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="chip">{selected.pos}</span>
                  <LevelPill level={selected.levels[focusLang]} />
                  <TrackPill track={selected.track} />
                  <span className="chip">{TOPICS.find((topic) => topic.id === selected.topic)?.label}</span>
                  {vocabState[selected.id]?.status && (
                    <span className="ml-auto text-[0.62rem] text-ink-faint">
                      {STATUS_LABELS[vocabState[selected.id].status]}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="eyebrow mb-1">{LANGUAGES[focusLang].label}</p>
                    <div className="flex items-center gap-2">
                      <h2 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] text-ink">
                        {selected.translations[focusLang]}
                      </h2>
                      <SpeakButton
                        text={selected.translations[focusLang].split(" / ")[0]}
                        lang={focusLang}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHideMeanings((value) => !value)}
                    className={cn("btn-ghost text-[0.7rem]", hideMeanings && "text-gold")}
                  >
                    {hideMeanings ? "揭示释义" : "隐藏释义"}
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {LANG_CODES.map((lang) => (
                    <span
                      key={lang}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.68rem]",
                        lang === focusLang ? "border-moss/30 bg-moss-soft/50 text-ink" : "border-line bg-white/50 text-ink-soft",
                      )}
                    >
                      <LangBadge lang={lang} size="sm" />
                      {selected.translations[lang]}
                    </span>
                  ))}
                </div>
              </div>

              <div className={cn("transition", hideMeanings && "select-none")}>
                <div className="grid gap-5 px-5 py-5 sm:px-6 lg:grid-cols-2">
                  <div>
                    <p className="eyebrow">Meaning</p>
                    <p
                      className={cn(
                        "mt-2 text-[0.92rem] leading-relaxed text-ink transition",
                        hideMeanings && "blur-[6px]",
                      )}
                    >
                      {selected.definitions[focusLang]}
                    </p>
                    <div className="mt-4 space-y-1.5">
                      {LANG_CODES.filter((lang) => lang !== focusLang).map((lang) => (
                        <p key={lang} className={cn("text-[0.72rem] leading-relaxed text-ink-faint transition", hideMeanings && "blur-[5px]")}>
                          <LangBadge lang={lang} size="sm" />
                          <span className="ml-1.5">{selected.definitions[lang]}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="eyebrow">Forms</p>
                    <div className="mt-2 space-y-2">
                      {LANG_CODES.map((lang) => (
                        <div key={lang} className="flex gap-2 text-[0.72rem] leading-relaxed">
                          <LangBadge lang={lang} size="sm" />
                          <span className={cn("text-ink-soft transition", hideMeanings && "blur-[5px]")}>
                            {selected.forms[lang]}
                          </span>
                        </div>
                      ))}
                    </div>
                    {selected.note && (
                      <div className={cn("mt-4 rounded-xl border border-gold/25 bg-gold-soft/45 px-3 py-2.5 transition", hideMeanings && "blur-[5px]")}>
                        <p className="text-[0.66rem] font-semibold text-[#7a5c26]">用法提示</p>
                        <p className="mt-1 text-[0.7rem] leading-relaxed text-[#7a5c26]/85">{selected.note}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-line px-5 py-5 sm:px-6">
                  <p className="eyebrow">In context</p>
                  <div className="mt-3 space-y-2.5">
                    {LANG_CODES.map((lang) => (
                      <div
                        key={lang}
                        className={cn(
                          "rounded-2xl border px-4 py-3",
                          lang === focusLang ? "border-moss/20 bg-moss-soft/30" : "border-line bg-white/40",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <LangBadge lang={lang} size="sm" />
                          <span className="text-[0.64rem] font-semibold text-ink-soft">{LANGUAGES[lang].label}</span>
                          <SpeakButton text={selected.example[lang]} lang={lang} className="ml-auto h-6 w-6" />
                        </div>
                        <p
                          className={cn(
                            "mt-1.5 text-[0.9rem] leading-relaxed text-ink transition",
                            lang !== focusLang && hideMeanings && "blur-[5px]",
                          )}
                        >
                          {selected.example[lang]}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-line px-5 py-5 sm:px-6">
                  <p className="eyebrow">Collocations</p>
                  <p className={cn("mt-1 text-[0.66rem] text-ink-faint", hideMeanings && "opacity-40")}>
                    按语言查看常见搭配，不要孤立记单词。
                  </p>
                  <div className="mt-3 space-y-3">
                    {LANG_CODES.map((lang) => (
                      <div key={lang} className="flex flex-wrap items-center gap-1.5">
                        <LangBadge lang={lang} size="sm" />
                        {selected.collocations[lang].map((collocation) => (
                          <span
                            key={collocation}
                            className={cn(
                              "rounded-full border border-line bg-paper-light px-2.5 py-1 text-[0.68rem] text-ink-soft transition",
                              hideMeanings && "blur-[4px]",
                            )}
                          >
                            {collocation}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-line bg-paper/50 px-5 py-4 sm:px-6">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="mr-auto text-[0.68rem] font-semibold text-ink">掌握程度</p>
                  {STATUS_ACTIONS.map((action) => {
                    const Icon = action.icon;
                    const active = (vocabState[selected.id]?.status ?? "new") === action.status;
                    return (
                      <button
                        key={action.status}
                        type="button"
                        onClick={() => setStatusFor(selected.id, action.status)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.68rem] font-semibold transition",
                          active
                            ? action.status === "known"
                              ? "border-moss bg-moss text-paper-light"
                              : action.status === "learning"
                                ? "border-gold bg-gold-soft text-[#7a5c26]"
                                : "border-line-strong bg-paper text-ink-soft"
                            : "border-line bg-paper-light text-ink-faint hover:border-moss/30 hover:text-ink",
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        {action.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          )}
        </div>
      )}

    </div>
  );
}
