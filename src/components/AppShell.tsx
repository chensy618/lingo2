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
  { href: "/", label: "首页", icon: HomeIcon },
  { href: "/translation", label: "翻译练习", icon: TranslateIcon },
  { href: "/vocabulary", label: "词汇学习", icon: CardsIcon },
  { href: "/situations", label: "情境练习", icon: CompassIcon },
  { href: "/progress", label: "学习记录", icon: ChartIcon },
];

const MOBILE_NAV = [...NAV, { href: "/settings", label: "设置", icon: SettingsIcon }];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-[0.7rem] bg-ink">
        <span className="flex gap-[3px]">
          <span className="h-1.5 w-1.5 rounded-full bg-paper-light" />
          <span className="h-1.5 w-1.5 rounded-full bg-coral" />
          <span className="h-1.5 w-1.5 rounded-full bg-gold" />
        </span>
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[1.3rem] tracking-[-0.03em] text-ink">
            lingo<sup className="ml-0.5 text-[0.6rem] text-coral">2</sup>
          </span>
          <span className="mt-1 text-[0.55rem] font-medium uppercase tracking-[0.16em] text-ink-faint">
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
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[240px] flex-col border-r border-line bg-paper-light/55 px-4 py-6 lg:flex">
        <Link href="/" className="px-3" aria-label="lingo2 首页">
          <Logo />
        </Link>

        <nav className="mt-9 flex flex-col gap-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.88rem] font-medium transition-colors",
                  active
                    ? "bg-moss-soft/75 text-moss"
                    : "text-ink-soft hover:bg-white/50 hover:text-ink",
                )}
              >
                <Icon className="h-[1.05rem] w-[1.05rem]" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-line pt-3">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.88rem] font-medium transition-colors",
              isActive(pathname, "/settings")
                ? "bg-moss-soft/75 text-moss"
                : "text-ink-soft hover:bg-white/50 hover:text-ink",
            )}
          >
            <SettingsIcon className="h-[1.05rem] w-[1.05rem]" />
            设置
          </Link>
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

      <div className="lg:pl-[240px]">
        <main className="mx-auto w-full max-w-[1080px] px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10">
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
