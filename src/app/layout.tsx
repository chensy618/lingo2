import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "WONK"],
});

export const metadata: Metadata = {
  title: {
    default: "lingo² · 英语 · 挪威语 · 汉语",
    template: "%s · lingo²",
  },
  description:
    "在英语、挪威语和汉语之间自由切换，通过分级翻译练习、三语言对照和真实语境词汇卡提升日常与学术表达。",
  applicationName: "lingo²",
  keywords: ["语言学习", "挪威语", "英语", "汉语", "翻译练习", "Norsk", "Bokmål"],
};

export const viewport: Viewport = {
  themeColor: "#f4f0e6",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
