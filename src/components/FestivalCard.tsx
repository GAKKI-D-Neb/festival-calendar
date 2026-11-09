"use client";

import { useEffect, useRef, useState } from "react";
import type { Festival } from "@/types/festival";
import { formatDateRange, getFestivalStatus } from "@/lib/dateUtils";
import { FavoriteButton } from "@/components/FavoriteButton";

const statusLabels = {
  upcoming: "投稿開始前",
  accepting: "投稿受付中",
  "posting-ended": "投稿終了",
  "event-active": "開催中",
  ended: "終了"
} as const;

export function targetStyle(target: string): string {
  if (/ボカロ/.test(target)) return "border-violet-200 bg-violet-50 text-violet-800";
  if (/ボイロ|VOICEVOX|ソフトウェアトーク/.test(target)) return "border-sky-200 bg-sky-50 text-sky-800";
  if (/歌い手|シンガー|人間/.test(target)) return "border-rose-200 bg-rose-50 text-rose-800";
  if (/絵師|イラスト|絵描き/.test(target)) return "border-amber-200 bg-amber-50 text-amber-800";
  if (/作曲|音楽/.test(target)) return "border-emerald-200 bg-emerald-50 text-emerald-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function isSameRange(festival: Festival): boolean {
  if (!festival.eventStart || !festival.eventEnd) return true;
  return new Date(festival.postingStart).getTime() === new Date(festival.eventStart).getTime()
    && new Date(festival.postingEnd).getTime() === new Date(festival.eventEnd).getTime();
}

function daysUntil(value: string): number | null {
  const targetDate = new Date(value);

  // 日付が不正ならカウントダウンを表示しない
  if (!Number.isFinite(targetDate.getTime())) {
    return null;
  }

  const nowParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric"
  }).formatToParts(new Date());

  const targetParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric"
  }).formatToParts(targetDate);

  const get = (parts: Intl.DateTimeFormatPart[], type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  const today = Date.UTC(
    get(nowParts, "year"),
    get(nowParts, "month") - 1,
    get(nowParts, "day")
  );

  const target = Date.UTC(
    get(targetParts, "year"),
    get(targetParts, "month") - 1,
    get(targetParts, "day")
  );

  return Math.max(0, Math.ceil((target - today) / 86400000));
}

function FestivalTitle({ name }: { name: string }) {
  const containerRef = useRef<HTMLHeadingElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [distance, setDistance] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const text = textRef.current;
    if (!container || !text) return;

    const measure = () => {
      const overflow = text.scrollWidth > container.clientWidth + 1;
      setOverflows(overflow);
      setDistance(Math.max(0, text.scrollWidth - container.clientWidth));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    observer.observe(text);
    return () => observer.disconnect();
  }, [name]);

  return (
    <h3
      ref={containerRef}
      className="festival-card-title mt-0 min-w-0 w-full overflow-hidden whitespace-nowrap text-base font-extrabold leading-snug text-slate-900"
      title={name}
      onClick={() => {
        if (overflows) setIsScrolling((current) => !current);
      }}
      role={overflows ? "button" : undefined}
      tabIndex={overflows ? 0 : undefined}
      aria-label={overflows ? `タップしてタイトルをスクロール：${name}` : undefined}
      onKeyDown={(event) => {
        if (overflows && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          setIsScrolling((current) => !current);
        }
      }}
    >
      <span
        ref={textRef}
        className={`festival-card-title__text${overflows ? " is-overflowing" : ""}${isScrolling ? " is-scrolling" : ""}`}
        style={
          overflows
            ? ({
                "--festival-title-distance": `${distance}px`,
                "--festival-title-duration": `${Math.max(1, distance / 80)}s`
              } as React.CSSProperties)
            : undefined
        }
      >
        {name}
      </span>
    </h3>
  );
}

export function FestivalCard({
  festival,
  favorite,
  onToggleFavorite
}: {
  festival: Festival;
  favorite: boolean;
  onToggleFavorite: () => void;
}) {
  const status = getFestivalStatus(festival);
  const countdown = status === "upcoming" ? daysUntil(festival.postingStart) : null;
  const statusClass =
    status === "accepting" || status === "event-active"
      ? "bg-emerald-100 text-emerald-800 ring-emerald-200"
      : status === "ended"
        ? "bg-slate-100 text-slate-600 ring-slate-200"
        : status === "posting-ended"
          ? "bg-amber-100 text-amber-800 ring-amber-200"
          : "bg-blue-100 text-blue-800 ring-blue-200";

  const samePeriod = isSameRange(festival);

  return (
    <article className="flex h-full min-w-0 w-full flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-extrabold tracking-wide ring-1 ring-inset ${statusClass}`}>
              {countdown !== null ? `あと${countdown}日` : statusLabels[status]}
            </span>
            <div className="flex flex-wrap items-center gap-1.5 border-l border-slate-200 pl-3">
              <span className="mr-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">対象</span>
              {festival.targets.map((target) => (
                <span key={target} className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${targetStyle(target)}`}>
                  {target}
                </span>
              ))}
            </div>
          </div>
          <FestivalTitle name={festival.name} />
        </div>
        <FavoriteButton active={favorite} onClick={onToggleFavorite} />
      </div>

      <div className="mt-3 grid grid-rows-2 gap-2">
          {samePeriod ? (
            <div className="row-span-2 flex min-h-[88px] flex-col justify-center rounded-lg border border-indigo-100 bg-white/85 px-3 py-2">
              <div className="text-[10px] font-bold text-indigo-700">投稿・開催期間</div>
              <div className="mt-0.5 text-sm font-extrabold leading-relaxed text-slate-900">
                {formatDateRange(festival.postingStart, festival.postingEnd)}
              </div>
            </div>
          ) : (
            <>
              <div className="flex min-h-[40px] flex-col justify-center rounded-lg border border-indigo-100 bg-white/85 px-3 py-2">
                <div className="text-[10px] font-bold text-indigo-700">投稿期間</div>
                <div className="mt-0.5 text-sm font-extrabold leading-relaxed text-slate-900">
                  {formatDateRange(festival.postingStart, festival.postingEnd)}
                </div>
              </div>
              <div className="flex min-h-[40px] flex-col justify-center rounded-lg border border-sky-100 bg-white/85 px-3 py-2">
                <div className="text-[10px] font-bold text-sky-700">開催期間</div>
                <div className="mt-0.5 text-sm font-extrabold leading-relaxed text-slate-900">
                  {formatDateRange(festival.eventStart, festival.eventEnd)}
                </div>
              </div>
            </>
          )}
      </div>
      {(festival.organizer || festival.organizerUrl) && (
        <div className="mt-2 flex gap-2 text-xs">
          <span className="w-16 shrink-0 font-bold text-slate-500">主催</span>
          <span className="font-medium text-slate-700">
            {festival.organizerUrl && festival.organizer ? (
              <a className="text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-900" href={festival.organizerUrl} target="_blank" rel="noreferrer">
                {festival.organizer} ↗
              </a>
            ) : festival.organizer ? festival.organizer : (
              <a className="text-blue-700 underline" href={festival.organizerUrl!} target="_blank" rel="noreferrer">主催アカウント ↗</a>
            )}
          </span>
        </div>
      )}

      {(festival.detailUrl || festival.officialUrl) && (
        <div className="mt-auto pt-3 flex flex-wrap gap-1.5">
          {festival.detailUrl && (
            <a href={festival.detailUrl} target="_blank" rel="noreferrer"
              className="rounded-lg bg-blue-700 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm hover:bg-blue-800">
              詳細を見る ↗
            </a>
          )}
          {festival.officialUrl && (
            <a href={festival.officialUrl} target="_blank" rel="noreferrer"
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-100">
              公式サイト ↗
            </a>
          )}
        </div>
      )}
    </article>
  );
}
