import type { Festival, FestivalStatus } from "@/types/festival";

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

function validDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function nowInJst(): Date {
  return new Date();
}

export function formatDateTime(value: string | null): string {
  const date = validDate(value);
  if (!date) return value ?? "";
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}/${get("month")}/${get("day")} ${get("hour")}:${get("minute")}`;
}

export function formatDateRange(start: string | null, end: string | null): string {
  const s = validDate(start);
  const e = validDate(end);

  if (!s && !e) return "未設定";
  if (!s) return `〜 ${formatDateTime(end)}`;
  if (!e) return `${formatDateTime(start)} 〜`;

  const sameDay =
    s.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" }) ===
    e.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" });

  if (sameDay) {
    const date = new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit"
    }).format(s);
    const startTime = new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).format(s);
    const endTime = new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).format(e);
    return `${date} ${startTime}〜${endTime}`;
  }
  return `${formatDateTime(start)} 〜 ${formatDateTime(end)}`;
}

export function getFestivalStatus(festival: Festival, now = Date.now()): FestivalStatus {
  const postingStart = validDate(festival.postingStart)?.getTime();
  const postingEnd = validDate(festival.postingEnd)?.getTime();
  const eventStart = validDate(festival.eventStart)?.getTime() ?? null;
  const eventEnd = validDate(festival.eventEnd)?.getTime() ?? null;

  // Defensive fallback for old or manually edited JSON data.
  if (postingStart === undefined || postingEnd === undefined) return "upcoming";

  if (eventStart !== null && eventEnd !== null && now >= eventStart && now <= eventEnd) {
    return "event-active";
  }
  if (now < postingStart) return "upcoming";
  if (now <= postingEnd) return "accepting";

  const finalEnd = eventEnd ?? postingEnd;
  if (now > finalEnd) return "ended";
  return "posting-ended";
}

export function getFestivalFinalEnd(festival: Festival): number {
  return validDate(festival.eventEnd ?? festival.postingEnd)?.getTime()
    ?? validDate(festival.postingEnd)?.getTime()
    ?? 0;
}

export function isFestivalEnded(festival: Festival, now = Date.now()): boolean {
  return now > getFestivalFinalEnd(festival);
}

export function getJstDateParts(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(date);
  return {
    year: Number(parts.find((p) => p.type === "year")?.value),
    month: Number(parts.find((p) => p.type === "month")?.value),
    day: Number(parts.find((p) => p.type === "day")?.value)
  };
}

export function jstDateKey(date: Date): string {
  const { year, month, day } = getJstDateParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function dateKeyFromInstant(iso: string): string {
  const date = validDate(iso);
  return date ? jstDateKey(date) : "";
}

export function calendarDateKey(year: number, monthIndex: number, day: number): string {
  const utc = new Date(Date.UTC(year, monthIndex, day));
  return jstDateKey(new Date(utc.getTime() - JST_OFFSET_MS));
}
