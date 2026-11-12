"use client";

import Link from "next/link";
import { useNotifications } from "@/hooks/useNotifications";
import { NOTIFICATION_KIND_OPTIONS } from "@/lib/notificationStorage";

export default function NotificationSettingsPage() {
  const { settings, ready, setEnabled, setNotificationKindEnabled } = useNotifications();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <p className="text-xs font-extrabold tracking-widest text-indigo-600">SETTINGS</p>
        <h1 className="mt-1 text-2xl font-black text-slate-900">通知設定</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          お気に入りに登録した投稿祭の日程について、サイト内のお知らせを表示するか設定できます。
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-sm font-extrabold text-slate-900">サイト内のお知らせを表示する</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              OFFにしても、お気に入り登録は解除されません。
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.enabled}
            disabled={!ready}
            onClick={() => setEnabled(!settings.enabled)}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${settings.enabled ? "bg-indigo-600" : "bg-slate-300"} disabled:opacity-50`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${settings.enabled ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
        <p className="mt-3 text-xs font-semibold text-slate-500">
          {ready ? (settings.enabled ? "現在、サイト内のお知らせは有効です。" : "現在、サイト内のお知らせは停止中です。") : "設定を読み込んでいます…"}
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-extrabold text-slate-900">お知らせのタイミング</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          以下の日程に該当したとき、サイトを開くとお知らせが生成されます。
        </p>
        <div className="mt-4 space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-xs font-bold text-indigo-700">投稿期間に関するお知らせ</legend>
            {NOTIFICATION_KIND_OPTIONS.filter((option) => option.category === "posting").map((option) => (
              <label key={option.kind} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={settings.enabledKinds.includes(option.kind)}
                  disabled={!ready}
                  onChange={(event) => setNotificationKindEnabled(option.kind, event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="text-xs font-bold text-sky-700">開催期間に関するお知らせ</legend>
            {NOTIFICATION_KIND_OPTIONS.filter((option) => option.category === "event").map((option) => (
              <label key={option.kind} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={settings.enabledKinds.includes(option.kind)}
                  disabled={!ready}
                  onChange={(event) => setNotificationKindEnabled(option.kind, event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </fieldset>
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-500">
          チェックを外した種類のお知らせは、今後生成されません。既に届いているお知らせは履歴として残ります。
          日程当日にサイトを開けなかった場合も、7日以内であれば次回訪問時にお知らせを表示します。時刻ではなく日本時間の日付を基準に判定します。
        </p>
        <p className="mt-3 text-xs font-semibold text-slate-600">
          現在のお気に入り：{ready ? `${settings.notificationIds.length}件が通知対象` : "確認中…"}
        </p>
      </section>

      <div className="flex flex-wrap gap-4 text-xs">
        <Link href="/" className="font-semibold text-indigo-700 underline underline-offset-4">投稿祭一覧へ戻る</Link>
        <Link href="/notifications/" className="font-semibold text-indigo-700 underline underline-offset-4">お知らせを見る</Link>
      </div>
    </div>
  );
}
