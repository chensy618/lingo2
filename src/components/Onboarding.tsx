"use client";

import { useState } from "react";
import type { Lang, Level, Preferences } from "@/lib/types";
import { LANGUAGES, LANG_CODES, LEVELS, LEVEL_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CheckCircleIcon, CloseIcon } from "./icons";
import { LangBadge } from "./ui";

export function Onboarding({
  preferences,
  onComplete,
  onSkip,
}: {
  preferences: Preferences;
  onComplete: (target: Lang, level: Level) => void;
  onSkip: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [target, setTarget] = useState<Lang>(preferences.target);
  const [level, setLevel] = useState<Level>(preferences.level);
  const source: Lang = target === "zh" ? "en" : "zh";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/25 p-4 backdrop-blur-sm">
      <div className="surface w-full max-w-md p-5 shadow-xl sm:p-6">
        <div className="flex items-center justify-between">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-ink-faint">
            快速开始 · {step}/2
          </p>
          <button type="button" onClick={onSkip} className="btn-ghost -mr-2 h-8 w-8 p-0" aria-label="跳过引导">
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {step === 1 ? (
          <>
            <h2 className="mt-4 font-display text-[1.5rem] leading-tight text-ink">你想先学哪种语言？</h2>
            <p className="mt-1.5 text-[0.74rem] text-ink-faint">之后可以随时在设置中修改。</p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {LANG_CODES.map((lang) => {
                const active = target === lang;
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setTarget(lang)}
                    className={cn(
                      "rounded-xl border px-3 py-3 text-left transition",
                      active ? "border-moss bg-moss text-paper-light" : "border-line bg-white/50 hover:border-moss/35",
                    )}
                  >
                    <LangBadge lang={lang} size="sm" />
                    <span className={cn("mt-2 block text-[0.78rem] font-semibold", active ? "text-paper-light" : "text-ink")}>
                      {LANGUAGES[lang].label}
                    </span>
                  </button>
                );
              })}
            </div>
            <button type="button" onClick={() => setStep(2)} className="btn-primary mt-5 w-full">
              下一步
            </button>
          </>
        ) : (
          <>
            <h2 className="mt-4 font-display text-[1.5rem] leading-tight text-ink">
              {LANGUAGES[target].label}从哪个等级开始？
            </h2>
            <p className="mt-1.5 text-[0.74rem] text-ink-faint">
              提示语言：{LANGUAGES[source].label}。等级之后可调整。
            </p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {LEVELS.map((item) => {
                const active = level === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setLevel(item)}
                    className={cn(
                      "rounded-xl border px-2 py-2.5 text-center transition",
                      active ? "border-moss bg-moss text-paper-light" : "border-line bg-white/50 hover:border-moss/35",
                    )}
                  >
                    <span className="block text-[0.8rem] font-bold">{item}</span>
                    <span className={cn("mt-0.5 block text-[0.58rem]", active ? "text-paper-light/70" : "text-ink-faint")}>
                      {LEVEL_LABELS[item]}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">
                返回
              </button>
              <button type="button" onClick={() => onComplete(target, level)} className="btn-primary flex-1">
                <CheckCircleIcon className="h-4 w-4" />
                开始学习
              </button>
            </div>
          </>
        )}

        <button type="button" onClick={onSkip} className="mt-3 w-full text-center text-[0.66rem] text-ink-faint hover:text-ink">
          先随便看看
        </button>
      </div>
    </div>
  );
}
