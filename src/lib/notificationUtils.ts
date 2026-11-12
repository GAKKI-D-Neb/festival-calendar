import type { Festival } from "@/types/festival";
import { jstDateKey } from "@/lib/dateUtils";
import type {
  FestivalNotification,
  FestivalNotificationKind,
  NotificationSettings
} from "@/lib/notificationStorage";

const DAY_MS = 24 * 60 * 60 * 1000;
const CATCH_UP_DAYS = 7;
const MAX_NOTIFICATIONS = 200;

function dateKey(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return jstDateKey(date);
}

function addDaysToKey(key: string, amount: number): string {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + amount, 12));
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0")
  ].join("-");
}

function daysBetween(fromKey: string, toKey: string): number {
  const [fromYear, fromMonth, fromDay] = fromKey.split("-").map(Number);
  const [toYear, toMonth, toDay] = toKey.split("-").map(Number);
  const from = Date.UTC(fromYear, fromMonth - 1, fromDay);
  const to = Date.UTC(toYear, toMonth - 1, toDay);
  return Math.round((to - from) / DAY_MS);
}

type TriggerDefinition = {
  kind: FestivalNotificationKind;
  date: string | null;
  title: string;
  message: (name: string, daysLate: number) => string;
};

function getTriggers(festival: Festival): TriggerDefinition[] {
  const postingStart = dateKey(festival.postingStart);
  const postingEnd = dateKey(festival.postingEnd);
  const eventStart = dateKey(festival.eventStart);
  const eventEnd = dateKey(festival.eventEnd);

  return [
    {
      kind: "posting-start-30",
      date: postingStart ? addDaysToKey(postingStart, -30) : null,
      title: "投稿期間がまもなく始まります",
      message: (name, daysLate) => daysLate === 0
        ? `「${name}」の投稿期間が30日後に始まります。`
        : `「${name}」の投稿期間開始まで、あと${Math.max(0, 30 - daysLate)}日です。`
    },
    {
      kind: "posting-start-3",
      date: postingStart ? addDaysToKey(postingStart, -3) : null,
      title: "投稿期間がまもなく始まります",
      message: (name, daysLate) => daysLate === 0
        ? `「${name}」の投稿期間が3日後に始まります。`
        : daysLate < 3
          ? `「${name}」の投稿期間開始まで、あと${3 - daysLate}日です。`
          : `「${name}」の投稿期間は既に始まっています。`
    },
    {
      kind: "posting-start",
      date: postingStart,
      title: "投稿期間が始まりました",
      message: (name, daysLate) => daysLate === 0
        ? `「${name}」の投稿期間が本日から始まりました。`
        : `「${name}」の投稿期間は${daysLate}日前に始まりました。`
    },
    {
      kind: "posting-end",
      date: postingEnd,
      title: "本日が投稿最終日です",
      message: (name, daysLate) => daysLate === 0
        ? `「${name}」の投稿期間は本日が最終日です。`
        : `「${name}」の投稿期間は${daysLate}日前に終了しました。`
    },
    {
      kind: "event-start",
      date: eventStart,
      title: "開催期間が始まりました",
      message: (name, daysLate) => daysLate === 0
        ? `「${name}」の開催期間が本日から始まりました。`
        : `「${name}」の開催期間は${daysLate}日前に始まりました。`
    },
    {
      kind: "event-end",
      date: eventEnd,
      title: "本日が開催最終日です",
      message: (name, daysLate) => daysLate === 0
        ? `「${name}」の開催期間は本日が最終日です。`
        : `「${name}」の開催期間は${daysLate}日前に終了しました。`
    }
  ];
}

/**
 * サイトを開いた日を基準に、直近7日以内に到来した通知日を生成する。
 * 通知日はJSTの日付単位で比較し、同じ通知を二重生成しない。
 */
export function addEligibleNotifications(
  festivals: Festival[],
  settings: NotificationSettings,
  existing: FestivalNotification[],
  now = new Date()
): FestivalNotification[] {
  if (!settings.enabled || settings.notificationIds.length === 0) return existing;

  const today = jstDateKey(now);
  const existingIds = new Set(existing.map((item) => item.id));
  const targetIds = new Set(settings.notificationIds);
  const added: FestivalNotification[] = [];

  festivals.forEach((festival) => {
    if (festival.deleted || !targetIds.has(festival.id)) return;

    getTriggers(festival).forEach((trigger) => {
      if (!trigger.date) return;
      const daysLate = daysBetween(trigger.date, today);
      if (daysLate < 0 || daysLate > CATCH_UP_DAYS) return;

      const id = `${festival.id}:${trigger.kind}:${trigger.date}`;
      if (existingIds.has(id)) return;

      added.push({
        id,
        festivalId: festival.id,
        festivalName: festival.name,
        kind: trigger.kind,
        title: trigger.title,
        message: trigger.message(festival.name, daysLate),
        triggerDate: trigger.date,
        createdAt: now.toISOString(),
        url: festival.detailUrl || festival.officialUrl || `/#festival-${encodeURIComponent(festival.id)}`,
        read: false
      });
      existingIds.add(id);
    });
  });

  if (added.length === 0) return existing;

  return [...existing, ...added]
    .sort((a, b) =>
      b.triggerDate.localeCompare(a.triggerDate) ||
      b.createdAt.localeCompare(a.createdAt)
    )
    .slice(0, MAX_NOTIFICATIONS);
}
