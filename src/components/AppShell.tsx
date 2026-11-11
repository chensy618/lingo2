"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  CardsIcon,
  ChartIcon,
  CompassIcon,
  HomeIcon,
  SettingsIcon,
  TranslateIcon,
} from "./icons";

const NAV = [
  { href: "/", label: "首页", en: "Dashboard", icon: HomeIcon, match: "/" },
  { href: "/translation", label: "翻译练习", en: "Translation", icon: TranslateIcon, match: "/translation" },
  { href: "/vocabulary", label: "词汇学习", en: "Vocabulary", icon: CardsIcon, match: "/vocabulary" },
  { href: "/situations", label: "情境练习", en: "Situations", icon: CompassIcon, match: "/situations" },
  { href: "/progress", label: "学习记录", en: "Progress", icon: ChartIcon, match: "/progress" },
];

const MOBILE_NAV = [...NAV, { href: "/settings", label: "设置", en: "Settings", icon: SettingsIcon, match: "/settings" }];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-[0.85rem] bg-ink shadow-[0_8px_18px_-12px_rgba(31,42,38,0.9)]">
        <span className="flex gap-[3px]">
          <span className="h-1.5 w-1.5 rounded-full bg-paper-light" />
          <span className="h-1.5 w-1.5 rounded-full bg-coral" />
          <span className="h-1.5 w-1.5 rounded-full bg-gold" />
        </span>
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[1.35rem] tracking-[-0.03em] text-ink">
            lingo<sup className="ml-0.5 text-[0.62rem] text-coral">2</sup>
          </span>
          <span className="mt-1 text-[0.58rem] font-medium uppercase tracking-[0.18em] text-ink-faint">
            en · no · 中文
          </span>
        </span>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-line bg-paper-light/70 px-5 py-7 backdrop-blur-md lg:flex">
        <Link href="/" className="px-2" aria-label="lingo2 首页">
          <Logo />
        </Link>

        <nav className="mt-10 flex flex-col gap-1.5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl px-3.5 py-3 transition-all duration-200",
                  active
                    ? "bg-moss text-paper-light shadow-[0_12px_24px_-18px_rgba(47,93,80,0.9)]"
                    : "text-ink-soft hover:bg-moss-soft/60 hover:text-ink",
                )}
              >
                <Icon className={cn("h-[1.15rem] w-[1.15rem]", active ? "opacity-90" : "opacity-70")} />
                <span className="flex-1 text-[0.9rem] font-semibold">{item.label}</span>
                <span
                  className={cn(
                    "text-[0.6rem] font-medium uppercase tracking-[0.12em]",
                    active ? "text-paper-light/55" : "text-ink-faint/70",
                  )}
                >
                  {item.en}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 border-t border-line pt-4">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 rounded-2xl px-3.5 py-3 transition",
              isActive(pathname, "/settings")
                ? "bg-moss-soft text-ink"
                : "text-ink-soft hover:bg-moss-soft/60 hover:text-ink",
            )}
          >
            <SettingsIcon className="h-[1.15rem] w-[1.15rem] opacity-70" />
            <span className="flex-1 text-[0.9rem] font-semibold">设置</span>
            <span className="text-[0.6rem] font-medium uppercase tracking-[0.12em] text-ink-faint/70">
              Settings
            </span>
          </Link>
        </div>

        <div className="mt-auto rounded-2xl border border-line bg-white/55 p-4">
          <p className="font-display text-[1.05rem] leading-snug text-ink">三种语言，自由切换。</p>
          <p className="mt-1.5 text-[0.72rem] leading-relaxed text-ink-faint">
            任意语言都可以成为你的目标语言。练习以语义和真实语境为中心。
          </p>
          <div className="mt-3 flex items-center gap-1.5">
            {[
              { code: "EN", color: "bg-english" },
              { code: "NO", color: "bg-norwegian" },
              { code: "中", color: "bg-chinese" },
            ].map((lang) => (
              <span
                key={lang.code}
                className={cn(
                  "flex h-7 min-w-7 items-center justify-center rounded-lg px-2 text-[0.64rem] font-semibold text-paper-light",
                  lang.color,
                )}
              >
                {lang.code}
              </span>
            ))}
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-paper/85 px-4 py-3 backdrop-blur-md lg:hidden">
        <Link href="/" aria-label="lingo2 首页">
          <Logo />
        </Link>
        <Link
          href="/settings"
          aria-label="设置"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-soft"
        >
          <SettingsIcon className="h-4 w-4" />
        </Link>
      </header>

      <div className="lg:pl-[264px]">
        <main className="mx-auto w-full max-w-[1180px] px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper-light/92 pb-[calc(0.4rem+env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-between px-1.5">
          {MOBILE_NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[0.6rem] font-semibold transition",
                  active ? "text-moss" : "text-ink-faint",
                )}
              >
                <span className={cn("flex h-7 w-9 items-center justify-center rounded-lg", active && "bg-moss-soft")}>
                  <Icon className="h-[1.1rem] w-[1.1rem]" />
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
