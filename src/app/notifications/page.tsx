"use client";

import Link from "next/link";
import { useNotifications } from "@/hooks/useNotifications";

export default function NotificationsPage() {
  const { notifications, unreadCount, ready, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold tracking-widest text-indigo-600">NOTIFICATIONS</p>
          <h1 className="mt-1 text-2xl font-black text-slate-900">お知らせ</h1>
          <p className="mt-2 text-sm text-slate-600">お気に入りに登録した投稿祭の日程に関するお知らせです。</p>
        </div>
        <button
          type="button"
          onClick={markAllAsRead}
          disabled={!ready || unreadCount === 0}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-indigo-700 shadow-sm hover:bg-indigo-50 disabled:cursor-default disabled:text-slate-400"
        >
          すべて既読にする
        </button>
      </div>

      {!ready ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          お知らせを読み込んでいます…
        </div>
      ) : notifications.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {notifications.map((item) => {
            const content = (
              <>
                <div className="flex items-start gap-3">
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${item.read ? "bg-slate-200" : "bg-indigo-600"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-extrabold text-slate-900">{item.title}</h2>
                      {!item.read && <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-extrabold text-indigo-700">未読</span>}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.message}</p>
                    <p className="mt-2 text-xs text-slate-400">{item.triggerDate.replace(/-/g, "/")} ・ {item.festivalName}</p>
                  </div>
                </div>
              </>
            );

            return (
              <div key={item.id} className="border-b border-slate-100 last:border-b-0">
                {item.url.startsWith("http://") || item.url.startsWith("https://") ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => markAsRead(item.id)}
                    className="block px-4 py-4 transition hover:bg-slate-50 sm:px-5"
                  >
                    {content}
                  </a>
                ) : (
                  <Link
                    href={item.url}
                    onClick={() => markAsRead(item.id)}
                    className="block px-4 py-4 transition hover:bg-slate-50 sm:px-5"
                  >
                    {content}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-12 text-center">
          <p className="text-sm font-bold text-slate-700">お知らせはありません。</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            投稿祭をお気に入りに登録すると、投稿開始日や開催日などのお知らせが届きます。
          </p>
          <Link href="/" className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700">
            投稿祭を探す
          </Link>
        </div>
      )}

      <div className="text-right">
        <Link href="/settings/notifications/" className="text-xs font-semibold text-indigo-700 underline underline-offset-4 hover:text-indigo-900">
          通知設定を変更する
        </Link>
      </div>
    </div>
  );
}
