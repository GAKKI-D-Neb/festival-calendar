import type { Festival, FestivalStatus } from "@/types/festival";

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function nowInJst(): Date {
  // A Date stores an absolute instant. This helper is useful for obtaining
  // the current instant; date comparisons should use timestamps directly.
  return new Date();
}

export function formatDateTime(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
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
  if (!start && !end) return "未設定";
  if (!start) return `〜 ${formatDateTime(end)}`;
  if (!end) return `${formatDateTime(start)} 〜`;
  const s = new Date(start);
  const e = new Date(end);
  const getJstTime = (date: Date) => {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Tokyo",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).formatToParts(date);
    return {
      hour: Number(parts.find((part) => part.type === "hour")?.value ?? -1),
      minute: Number(parts.find((part) => part.type === "minute")?.value ?? -1)
    };
  };

  const startTime = getJstTime(s);
  const endTime = getJstTime(e);
  const isWholeDayRange =
    startTime.hour === 0 && startTime.minute === 0 &&
    endTime.hour === 23 && endTime.minute === 59;

  if (isWholeDayRange) {
    const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "numeric",
      day: "numeric"
    });
    return `${dateFormatter.format(s)}〜${dateFormatter.format(e)}`;
  }

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
  const postingStart = new Date(festival.postingStart).getTime();
  const postingEnd = new Date(festival.postingEnd).getTime();
  const eventStart = festival.eventStart ? new Date(festival.eventStart).getTime() : null;
  const eventEnd = festival.eventEnd ? new Date(festival.eventEnd).getTime() : null;

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
  return new Date(festival.eventEnd ?? festival.postingEnd).getTime();
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
  return jstDateKey(new Date(iso));
}

export function calendarDateKey(year: number, monthIndex: number, day: number): string {
  // monthIndex is 0-based. UTC construction avoids the browser's local timezone.
  const utc = new Date(Date.UTC(year, monthIndex, day));
  return jstDateKey(new Date(utc.getTime() - JST_OFFSET_MS));
}
