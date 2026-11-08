"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { Festival } from "@/types/festival";
import { FestivalCard } from "@/components/FestivalCard";
import { getJstDateParts } from "@/lib/dateUtils";

type CalendarItem = {
  festival: Festival;
  type: "対象期間";
  start: string;
  end: string;
  color: string;
};
type Segment = CalendarItem & {
  startColumn: number;
  endColumn: number;
  startFraction: number;
  endFraction: number;
  lane: number;
};

const PALETTE = [
  "#dbeafe", "#ede9fe", "#fce7f3", "#cffafe", "#ffedd5",
  "#d1fae5", "#e0e7ff", "#ffe4e6", "#ecfccb", "#f3e8ff",
  "#e0f2fe", "#fef3c7"
];

function hashColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function partsInJst(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23"
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return {
    year: get("year"), month: get("month"), day: get("day"),
    hour: get("hour"), minute: get("minute"), second: get("second")
  };
}

function keyFromParts(p: {year:number;month:number;day:number}) {
  return `${p.year}-${String(p.month).padStart(2,"0")}-${String(p.day).padStart(2,"0")}`;
}
function keyToUtcDate(key: string): Date {
  const [y,m,d] = key.split("-").map(Number);
  return new Date(Date.UTC(y,m-1,d,12));
}
function addDays(date: Date, amount: number): Date {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + amount);
  return copy;
}
function keyFromUtc(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,"0")}-${String(date.getUTCDate()).padStart(2,"0")}`;
}
function fractionOfDay(p: {hour:number;minute:number;second:number}) {
  return (p.hour * 3600 + p.minute * 60 + p.second) / 86400;
}

function makeSegments(items: CalendarItem[], weekKeys: string[]): Segment[] {
  const candidates = items.flatMap((item) => {
    const startParts = partsInJst(item.start);
    const endParts = partsInJst(item.end);
    if (!startParts || !endParts) return [];
    const startKey = keyFromParts(startParts);
    const endKey = keyFromParts(endParts);
    if (endKey < weekKeys[0] || startKey > weekKeys[6]) return [];

    const clippedStartKey = startKey < weekKeys[0] ? weekKeys[0] : startKey;
    const clippedEndKey = endKey > weekKeys[6] ? weekKeys[6] : endKey;
    const startColumn = weekKeys.indexOf(clippedStartKey);
    const endColumn = weekKeys.indexOf(clippedEndKey);
    const startFraction = startKey < weekKeys[0] ? 0 : fractionOfDay(startParts);
    // End timestamps are inclusive; 23:59 reaches almost the end of its day.
    const endFraction = endKey > weekKeys[6] ? 1 : Math.max(0.025, fractionOfDay(endParts));
    return [{ ...item, startColumn, endColumn, startFraction, endFraction, lane: 0 }];
  }).sort((a,b) =>
    a.startColumn + a.startFraction - (b.startColumn + b.startFraction)
    || a.endColumn + a.endFraction - (b.endColumn + b.endFraction)
  );

  const laneEnds: number[] = [];
  return candidates.map((segment) => {
    const start = segment.startColumn + segment.startFraction;
    const end = segment.endColumn + segment.endFraction;
    let lane = laneEnds.findIndex((laneEnd) => laneEnd <= start);
    if (lane < 0) lane = laneEnds.length;
    laneEnds[lane] = end;
    return { ...segment, lane };
  });
}

export function FestivalCalendar({
  festivals,
  favoriteIds,
  onToggleFavorite,
  onYearChange,
  initialYear
}: {
  festivals: Festival[];
  favoriteIds: string[];
  onToggleFavorite: (id: string) => void;
  onYearChange?: (year: number) => void;
  initialYear?: number;
}) {
  const now = getJstDateParts(new Date());
  const [monthDate, setMonthDate] = useState(() => new Date(Date.UTC(initialYear ?? now.year, now.month - 1, 1, 12)));
  const [selected, setSelected] = useState<Festival | null>(null);

  const year = monthDate.getUTCFullYear();
  const month = monthDate.getUTCMonth();
  const monthLabel = `${year}年${month + 1}月`;

  const weeks = useMemo(() => {
    const first = new Date(Date.UTC(year, month, 1, 12));
    const start = addDays(first, -first.getUTCDay());
    return Array.from({ length: 6 }, (_, week) =>
      Array.from({ length: 7 }, (_, day) => keyFromUtc(addDays(start, week * 7 + day)))
    );
  }, [year, month]);

  const items = useMemo<CalendarItem[]>(() => {
    // 同名・同年の重複行をまとめ、投稿期間と開催期間の和集合を描画する。
    const groups = new Map<string, { festival: Festival; intervals: Array<{ start: string; end: string }> }>();
    festivals.forEach((festival) => {
      const identity = `${festival.year}|${festival.name.trim().normalize("NFKC").toLocaleLowerCase()}`;
      const group = groups.get(identity) ?? { festival, intervals: [] };
      group.intervals.push(
        { start: festival.postingStart, end: festival.postingEnd },
        { start: festival.eventStart ?? festival.postingStart, end: festival.eventEnd ?? festival.postingEnd }
      );
      groups.set(identity, group);
    });

    const result: CalendarItem[] = [];
    groups.forEach(({ festival, intervals }) => {
      const valid = intervals
        .map((interval) => ({ ...interval, startMs: new Date(interval.start).getTime(), endMs: new Date(interval.end).getTime() }))
        .filter((interval) => Number.isFinite(interval.startMs) && Number.isFinite(interval.endMs))
        .sort((a, b) => a.startMs - b.startMs);
      const merged = valid.reduce<Array<{ start: string; end: string; startMs: number; endMs: number }>>((acc, current) => {
        const previous = acc[acc.length - 1];
        if (previous && current.startMs <= previous.endMs + 86400000) {
          if (current.endMs > previous.endMs) {
            previous.end = current.end;
            previous.endMs = current.endMs;
          }
        } else {
          acc.push({ ...current });
        }
        return acc;
      }, []);
      merged.forEach((interval) => result.push({
        festival, type: "対象期間", start: interval.start, end: interval.end, color: hashColor(festival.id)
      }));
    });
    return result;
  }, [festivals]);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
      <section className="min-w-0 rounded-2xl border-2 border-slate-300 bg-white p-2 shadow-lg sm:p-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <button type="button"
            onClick={() => { const next = new Date(Date.UTC(year, month - 1, 1, 12)); setMonthDate(next); setSelected(null); onYearChange?.(next.getUTCFullYear()); }}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            ← 前月
          </button>
          <h2 className="text-base font-extrabold tracking-wide text-slate-800">{monthLabel}</h2>
          <button type="button"
            onClick={() => { const next = new Date(Date.UTC(year, month + 1, 1, 12)); setMonthDate(next); setSelected(null); onYearChange?.(next.getUTCFullYear()); }}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            翌月 →
          </button>
        </div>

        <div className="grid grid-cols-7 overflow-hidden rounded-t-lg border border-slate-300">
          {["日","月","火","水","木","金","土"].map((day,i) => (
            <div key={day} className={`border-r border-slate-300 bg-slate-100 py-1.5 text-center text-[11px] font-bold last:border-r-0 ${i===0?"text-rose-600":i===6?"text-blue-700":"text-slate-600"}`}>
              {day}
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-b-lg border-x border-b-2 border-slate-300">
          {weeks.map((weekKeys, weekIndex) => {
            const segments = makeSegments(items, weekKeys);
            const laneCount = 4;
            return (
              <div key={weekIndex} className="border-b-2 border-slate-300 last:border-b-0">
                <div className="grid grid-cols-7">
                  {weekKeys.map((key, dayIndex) => {
                    const date = keyToUtcDate(key);
                    const inMonth = date.getUTCMonth() === month;
                    const isToday = key === keyFromParts(now);
                    return (
                      <div key={key} className={`h-8 border-r border-slate-300 px-1 pt-1 text-[11px] last:border-r-0 ${inMonth?"bg-white":"bg-slate-50 text-slate-300"} ${dayIndex===0&&inMonth?"text-rose-600":dayIndex===6&&inMonth?"text-blue-700":""}`}>
                        <span className={isToday?"inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-700 px-1 font-bold text-white":""}>
                          {date.getUTCDate()}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="relative bg-white" style={{ height: "120px", minHeight: "120px", maxHeight: "120px", overflow: "hidden", backgroundImage: "linear-gradient(to right, #cbd5e1 1px, transparent 1px)", backgroundSize: "14.285714% 100%", backgroundPosition: "left top" }}>
                  {segments.filter((segment) => segment.lane < laneCount).map((segment, index) => {
                    const left = ((segment.startColumn + segment.startFraction) / 7) * 100;
                    const right = ((6 - segment.endColumn + (1 - segment.endFraction)) / 7) * 100;
                    const style: CSSProperties = {
                      position: "absolute",
                      left: `${left}%`,
                      right: `${right}%`,
                      top: `${Math.min(segment.lane, laneCount - 1) * 27 + 3}px`,
                      height: "24px",
                      backgroundColor: segment.color
                    };
                    const isSelected = selected?.id === segment.festival.id;
                    return (
                      <button key={`${segment.festival.id}-${weekIndex}-${index}`}
                        type="button"
                        onClick={() => setSelected(segment.festival)}
                        title={`${segment.festival.name}（${segment.type}）`}
                        style={style}
                        className={`z-10 overflow-hidden rounded-md border border-slate-300/80 px-1.5 text-left text-[11px] font-bold leading-6 text-slate-700 shadow-sm transition hover:brightness-95 ${isSelected?"ring-2 ring-slate-700 ring-offset-1":""}`}
                      >
                        {segment.festival.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-500">
          <span>投稿期間と開催期間を合わせた期間を表示しています。</span>
          <span>色は投稿祭ごとに異なります</span>
        </div>
      </section>

      <aside className="min-w-0 xl:sticky xl:top-4 xl:self-start">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-800">選択した投稿祭</h3>
          {selected && <button type="button" onClick={() => setSelected(null)} className="text-xs text-slate-500 hover:text-slate-800">選択解除</button>}
        </div>
        {selected ? (
          <FestivalCard
            festival={selected}
            favorite={favoriteIds.includes(selected.id)}
            onToggleFavorite={() => onToggleFavorite(selected.id)}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-xs leading-6 text-slate-500">
            カレンダー内の投稿祭を選択すると、ここに詳細が表示されます。
          </div>
        )}
      </aside>
    </div>
  );
}
