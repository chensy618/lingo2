"use client";

import { cn } from "@/lib/utils";
import type { Lang } from "@/lib/types";
import { SpeakerIcon } from "./icons";

const SPEECH_LANG: Record<Lang, string> = {
  en: "en-US",
  no: "nb-NO",
  zh: "zh-CN",
};

export function SpeakButton({
  text,
  lang,
  className,
  label = "播放发音",
}: {
  text: string;
  lang: Lang;
  className?: string;
  label?: string;
}) {
  const speak = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !text.trim()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = SPEECH_LANG[lang];
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <button
      type="button"
      onClick={speak}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-paper-light text-ink-faint transition hover:border-moss/40 hover:text-moss",
        className,
      )}
    >
      <SpeakerIcon className="h-3.5 w-3.5" />
    </button>
  );
}
