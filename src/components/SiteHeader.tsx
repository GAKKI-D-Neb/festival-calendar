
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";

const navItems = [
  { href: "/", label: "投稿祭一覧" },
  { href: "/register/", label: "投稿祭登録" },
  { href: "/links/", label: "関連情報" }
];

export function SiteHeader() {
  const pathname = usePathname();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const recentNotifications = notifications.slice(0, 5);

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-brand" aria-label="投稿祭カレンダー トップ">
          <Image
            src="/festival-calendar/icon.png"
            alt=""
            width={44}
            height={44}
            className="site-brand-mark"
          />
          <span>
            <span className="site-brand-kicker">MUSIC & CREATIVE EVENTS</span>
            <span className="site-brand-title">投稿祭カレンダー</span>
            <span className="block text-[10px]">音楽系投稿祭・イベント情報まとめ</span>
          </span>
        </Link>

        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <nav className="site-nav" aria-label="メインメニュー">
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`site-nav-link${active ? " is-active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
          </nav>

          <div className="relative ml-1 shrink-0 border-l border-slate-200 pl-3">
          <button
            type="button"
            onClick={() => setNotificationsOpen((open) => !open)}
            aria-label={`お知らせ${unreadCount > 0 ? `、未読${unreadCount}件` : ""}`}
            aria-expanded={notificationsOpen}
            aria-haspopup="dialog"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-indigo-100 bg-white/90 text-slate-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
              <path d="M10 21h4" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-extrabold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div
              role="dialog"
              aria-label="お知らせ"
              className="absolute right-0 z-50 mt-2 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
            >
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
                <h2 className="text-sm font-extrabold text-slate-900">お知らせ</h2>
                <button
                  type="button"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 disabled:cursor-default disabled:text-slate-400"
                >
                  すべて既読にする
                </button>
              </div>

              {recentNotifications.length > 0 ? (
                <ul className="max-h-[min(65vh,420px)] overflow-y-auto divide-y divide-slate-100">
                  {recentNotifications.map((item) => {
                    const content = (
                      <span className="block min-w-0">
                        <span className="flex items-start gap-2">
                          {!item.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />}
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs font-extrabold text-slate-900">{item.title}</span>
                            <span className="mt-1 block text-xs leading-5 text-slate-600">{item.message}</span>
                            <span className="mt-1 block text-[10px] text-slate-400">{item.triggerDate.replace(/-/g, "/")}</span>
                          </span>
                        </span>
                      </span>
                    );

                    return (
                      <li key={item.id}>
                        {item.url.startsWith("http://") || item.url.startsWith("https://") ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => {
                              markAsRead(item.id);
                              setNotificationsOpen(false);
                            }}
                            className="block px-4 py-3 transition hover:bg-slate-50"
                          >
                            {content}
                          </a>
                        ) : (
                          <Link
                            href={item.url}
                            onClick={() => {
                              markAsRead(item.id);
                              setNotificationsOpen(false);
                            }}
                            className="block px-4 py-3 transition hover:bg-slate-50"
                          >
                            {content}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="px-4 py-8 text-center text-xs text-slate-500">
                  現在お知らせはありません。
                </p>
              )}

              <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs">
                <Link
                  href="/notifications/"
                  onClick={() => setNotificationsOpen(false)}
                  className="font-bold text-indigo-700 hover:text-indigo-900"
                >
                  すべてのお知らせを見る
                </Link>
                <Link
                  href="/settings/notifications/"
                  onClick={() => setNotificationsOpen(false)}
                  className="font-semibold text-slate-500 hover:text-slate-800"
                >
                  通知設定
                </Link>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </header>
  );
}
