
import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";

const siteUrl = "https://gakki-d-neb.github.io/festival-calendar";

export const metadata: Metadata = {
  metadataBase: new URL(`${siteUrl}/`),

  title: {
    default: "投稿祭カレンダー",
    template: "%s | 投稿祭カレンダー",
  },

  description:
    "ボカロ・歌ってみたなど、音楽に関する投稿祭・イベントの開催情報をまとめた非公式サイトです。",

  icons: {
    icon: `${siteUrl}/icon.png`,
    apple: `${siteUrl}/icon.png`,
  },

  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: "投稿祭カレンダー",
    title: "投稿祭カレンダー",
    description:
      "ボカロ・歌ってみたなど、音楽に関する投稿祭・イベントの開催情報をまとめた非公式サイトです。",
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "投稿祭カレンダー",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "投稿祭カレンダー",
    description:
      "ボカロ・歌ってみたなど、音楽に関する投稿祭・イベントの開催情報をまとめた非公式サイトです。",
    images: [`${siteUrl}/og-image.png`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>
        <SiteHeader />
        <main className="mx-auto min-h-[65vh] max-w-7xl px-4 py-6 sm:px-6 sm:py-9">
          {children}
        </main>
        <footer className="mt-10 border-t border-indigo-100 bg-white/60 px-4 py-7 text-center text-xs leading-6 text-slate-500">
          <p>
            本サイトは非公式のまとめです。掲載情報の正確性・最新性を保証するものではありません。
          </p>
          <p>
            最新・正確な情報は、必ず各投稿祭の公式案内をご確認ください。
          </p>
        </footer>
      </body>
    </html>
  );
}
