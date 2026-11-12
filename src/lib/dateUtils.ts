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

  const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric"
  });
  const sameDay =
    s.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" }) ===
    e.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" });

  // 1日間の終日イベントは、日付だけを表示する。
  if (sameDay && isWholeDayRange) {
    return dateFormatter.format(s);
  }

  if (isWholeDayRange) {
    return `${dateFormatter.format(s)}〜${dateFormatter.format(e)}`;
  }

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
  const postingStart = festival.postingStart
    ? new Date(festival.postingStart).getTime()
    : null;
  const postingEnd = festival.postingEnd
    ? new Date(festival.postingEnd).getTime()
    : null;
  const eventStart = festival.eventStart
    ? new Date(festival.eventStart).getTime()
    : null;
  const eventEnd = festival.eventEnd
    ? new Date(festival.eventEnd).getTime()
    : null;

  const validPostingStart =
    postingStart !== null && Number.isFinite(postingStart) ? postingStart : null;
  const validPostingEnd =
    postingEnd !== null && Number.isFinite(postingEnd) ? postingEnd : null;
  const validEventStart =
    eventStart !== null && Number.isFinite(eventStart) ? eventStart : null;
  const validEventEnd =
    eventEnd !== null && Number.isFinite(eventEnd) ? eventEnd : null;

  if (
    validEventStart !== null &&
    validEventEnd !== null &&
    now >= validEventStart &&
    now <= validEventEnd
  ) {
    return "event-active";
  }

  // 投稿期間がないイベントは、開催期間を基準に状態を判定する。
  if (validPostingStart === null && validPostingEnd === null) {
    if (validEventStart !== null && now < validEventStart) return "upcoming";
    if (validEventEnd !== null && now > validEventEnd) return "ended";
    if (validEventStart !== null || validEventEnd !== null) return "event-active";
    return "ended";
  }

  if (validPostingStart !== null && now < validPostingStart) return "upcoming";
  if (validPostingEnd !== null && now <= validPostingEnd) return "accepting";

  const finalEnd = validEventEnd ?? validPostingEnd;
  if (finalEnd !== null && now > finalEnd) return "ended";
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
