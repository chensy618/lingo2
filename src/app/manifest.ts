import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return {
    name: "lingo² · 英语 · 挪威语 · 汉语",
    short_name: "lingo²",
    description: "通过分级翻译、三语言对照和真实语境词汇卡学习英语、挪威语与汉语。",
    start_url: `${base}/`,
    scope: `${base}/`,
    display: "standalone",
    background_color: "#f4f0e6",
    theme_color: "#2f5d50",
    icons: [
      { src: `${base}/icon-192.png`, sizes: "192x192", type: "image/png" },
      { src: `${base}/icon-512.png`, sizes: "512x512", type: "image/png" },
      { src: `${base}/icon.svg`, sizes: "any", type: "image/svg+xml" },
    ],
  };
}
