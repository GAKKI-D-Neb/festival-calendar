"use client";

export const NOTIFICATION_SETTINGS_KEY = "festival-calendar-notification-settings";
export const NOTIFICATIONS_KEY = "festival-calendar-notifications";
export const NOTIFICATION_CHANGE_EVENT = "festival-calendar-notifications-updated";

export type FestivalNotificationKind =
  | "posting-start-30"
  | "posting-start-3"
  | "posting-start"
  | "posting-end"
  | "event-start"
  | "event-end";

export const NOTIFICATION_KIND_OPTIONS: Array<{ kind: FestivalNotificationKind; label: string; category: "posting" | "event" }> = [
  { kind: "posting-start-30", label: "投稿開始30日前", category: "posting" },
  { kind: "posting-start-3", label: "投稿開始3日前", category: "posting" },
  { kind: "posting-start", label: "投稿開始日", category: "posting" },
  { kind: "posting-end", label: "投稿終了日", category: "posting" },
  { kind: "event-start", label: "開催開始日", category: "event" },
  { kind: "event-end", label: "開催終了日", category: "event" }
];

export const DEFAULT_NOTIFICATION_KINDS: FestivalNotificationKind[] =
  NOTIFICATION_KIND_OPTIONS.map((option) => option.kind);

export type NotificationSettings = {
  enabled: boolean;
  notificationIds: string[];
  enabledKinds: FestivalNotificationKind[];
};

export type FestivalNotification = {
  id: string;
  festivalId: string;
  festivalName: string;
  kind: FestivalNotificationKind;
  title: string;
  message: string;
  triggerDate: string;
  createdAt: string;
  url: string;
  read: boolean;
};

function normalizeEnabledKinds(value: unknown): FestivalNotificationKind[] {
  if (!Array.isArray(value)) return [...DEFAULT_NOTIFICATION_KINDS];
  return DEFAULT_NOTIFICATION_KINDS.filter((kind) => value.includes(kind));
}

function dispatchChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NOTIFICATION_CHANGE_EVENT));
  }
}

export function readNotificationSettings(): NotificationSettings {
  if (typeof window === "undefined") {
    return { enabled: true, notificationIds: [], enabledKinds: [...DEFAULT_NOTIFICATION_KINDS] };
  }

  try {
    const saved = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (saved) {
      const parsed: unknown = JSON.parse(saved);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "enabled" in parsed &&
        typeof parsed.enabled === "boolean" &&
        "notificationIds" in parsed &&
        Array.isArray(parsed.notificationIds) &&
        parsed.notificationIds.every((item) => typeof item === "string")
      ) {
        return {
          enabled: parsed.enabled,
          notificationIds: [...new Set(parsed.notificationIds)],
          // 旧バージョンの設定には enabledKinds がないため、全種類ONとして引き継ぐ。
          enabledKinds: normalizeEnabledKinds(
            "enabledKinds" in parsed ? parsed.enabledKinds : undefined
          )
        };
      }
    }
  } catch {
    // Invalid settings are replaced with safe defaults.
  }

  // 初回は既存のお気に入りを通知対象として引き継ぐ。
  try {
    const favorites = localStorage.getItem("festival-calendar-favorites");
    if (favorites) {
      const parsed: unknown = JSON.parse(favorites);
      if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
        return { enabled: true, notificationIds: [...new Set(parsed)], enabledKinds: [...DEFAULT_NOTIFICATION_KINDS] };
      }
    }
  } catch {
    // Ignore invalid favorite data.
  }

  return { enabled: true, notificationIds: [], enabledKinds: [...DEFAULT_NOTIFICATION_KINDS] };
}

export function saveNotificationSettings(settings: NotificationSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    NOTIFICATION_SETTINGS_KEY,
    JSON.stringify({
      enabled: settings.enabled,
      notificationIds: [...new Set(settings.notificationIds)],
      enabledKinds: DEFAULT_NOTIFICATION_KINDS.filter((kind) => settings.enabledKinds.includes(kind))
    })
  );
  dispatchChange();
}

export function syncNotificationTargets(favoriteIds: string[]) {
  if (typeof window === "undefined") return;
  const current = readNotificationSettings();
  saveNotificationSettings({
    ...current,
    notificationIds: [...new Set(favoriteIds)]
  });
}

export function readNotifications(): FestivalNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(NOTIFICATIONS_KEY);
    if (!saved) return [];
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is FestivalNotification =>
      typeof item === "object" &&
      item !== null &&
      "id" in item && typeof item.id === "string" &&
      "festivalId" in item && typeof item.festivalId === "string" &&
      "festivalName" in item && typeof item.festivalName === "string" &&
      "kind" in item && typeof item.kind === "string" &&
      "title" in item && typeof item.title === "string" &&
      "message" in item && typeof item.message === "string" &&
      "triggerDate" in item && typeof item.triggerDate === "string" &&
      "createdAt" in item && typeof item.createdAt === "string" &&
      "url" in item && typeof item.url === "string" &&
      "read" in item && typeof item.read === "boolean"
    );
  } catch {
    return [];
  }
}

export function saveNotifications(notifications: FestivalNotification[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  dispatchChange();
}
