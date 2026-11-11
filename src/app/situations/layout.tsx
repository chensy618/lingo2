import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "情境练习",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
