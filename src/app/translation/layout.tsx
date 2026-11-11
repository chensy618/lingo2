import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "翻译练习",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
