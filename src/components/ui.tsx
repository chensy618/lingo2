import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LANGUAGES, LEVELS } from "@/lib/types";
import type { Lang, Level, Track } from "@/lib/types";
import { TRACKS } from "@/lib/types";
import { ArrowRightIcon } from "./icons";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="font-display text-[2.1rem] leading-[1.05] tracking-[-0.035em] text-ink sm:text-[2.5rem]">
          {title}
        </h1>
        {description && <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-ink-soft">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h2 className="font-display text-[1.35rem] leading-tight tracking-[-0.02em] text-ink">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function LangBadge({ lang, size = "md" }: { lang: Lang; size?: "sm" | "md" | "lg" }) {
  const meta = LANGUAGES[lang];
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-semibold tracking-wide",
        size === "sm" && "h-5 min-w-5 px-1 text-[0.58rem]",
        size === "md" && "h-7 min-w-7 px-1.5 text-[0.65rem]",
        size === "lg" && "h-9 min-w-9 px-2 text-[0.75rem]",
      )}
      style={{ backgroundColor: meta.soft, color: meta.accent }}
      title={meta.label}
    >
      {meta.short}
    </span>
  );
}

export function LangLabel({ lang }: { lang: Lang }) {
  const meta = LANGUAGES[lang];
  return (
    <span className="inline-flex items-center gap-2">
      <LangBadge lang={lang} />
      <span className="text-sm font-semibold text-ink">{meta.label}</span>
    </span>
  );
}

export function LevelPill({ level, muted = false }: { level: Level; muted?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[0.66rem] font-semibold tracking-[0.06em]",
        muted ? "border-line bg-paper text-ink-faint" : "border-line-strong bg-white/70 text-ink-soft",
      )}
    >
      {level}
    </span>
  );
}

export function TrackPill({ track }: { track: Track }) {
  const meta = TRACKS[track];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper-light px-2.5 py-0.5 text-[0.66rem] font-medium text-ink-soft">
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          track === "everyday" ? "bg-moss" : track === "academic" ? "bg-coral" : "bg-gold",
        )}
      />
      {meta.label}
    </span>
  );
}

export function LevelTrack({ level }: { level: Level }) {
  const index = LEVELS.indexOf(level) + 1;
  return (
    <div className="flex items-center gap-1" aria-label={`${level} 水平`}>
      {LEVELS.map((item, i) => (
        <span
          key={item}
          className={cn("h-1.5 w-3 rounded-full", i < index ? "bg-moss" : "bg-line")}
        />
      ))}
    </div>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-line/80", className)}>
      <div
        className="h-full rounded-full bg-moss transition-all duration-700"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function ProgressRing({
  value,
  size = 96,
  stroke = 7,
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-line)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-moss)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (clamped / 100) * circumference}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  href,
  action,
}: {
  title: string;
  description: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="surface flex flex-col items-center px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-moss-soft text-moss">
        <span className="font-display text-xl">2</span>
      </span>
      <p className="mt-4 font-display text-xl text-ink">{title}</p>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-faint">{description}</p>
      {href && action && (
        <Link href={href} className="btn-primary mt-5">
          {action}
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="surface-flat flex items-start gap-3 px-4 py-4">
      {icon && <span className="mt-0.5 text-moss/80">{icon}</span>}
      <div>
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ink-faint">{label}</p>
        <p className="mt-1 font-display text-[1.65rem] leading-none tracking-[-0.02em] text-ink">{value}</p>
        {hint && <p className="mt-1.5 text-[0.7rem] text-ink-faint">{hint}</p>}
      </div>
    </div>
  );
}

export function InfoNote({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-gold/25 bg-gold-soft/60 px-4 py-3 text-[0.78rem] leading-relaxed text-[#7a5c26]">
      {children}
    </div>
  );
}
