"use client";

import { useCallback, useEffect, useState } from "react";
import type { Festival } from "@/types/festival";
import {
  NOTIFICATION_CHANGE_EVENT,
  readNotificationSettings,
  DEFAULT_NOTIFICATION_KINDS,
  readNotifications,
  saveNotificationSettings,
  saveNotifications,
  type FestivalNotification,
  type NotificationSettings
} from "@/lib/notificationStorage";
import { addEligibleNotifications } from "@/lib/notificationUtils";

const DATA_BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function useNotifications() {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    notificationIds: [],
    enabledKinds: [...DEFAULT_NOTIFICATION_KINDS]
  });
  const [notifications, setNotifications] = useState<FestivalNotification[]>([]);
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSettings(readNotificationSettings());
    setNotifications(readNotifications());
    setReady(true);

    const syncFromStorage = () => {
      setSettings(readNotificationSettings());
      setNotifications(readNotifications());
    };

    window.addEventListener(NOTIFICATION_CHANGE_EVENT, syncFromStorage);
    window.addEventListener("storage", syncFromStorage);
    return () => {
      window.removeEventListener(NOTIFICATION_CHANGE_EVENT, syncFromStorage);
      window.removeEventListener("storage", syncFromStorage);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadFestivals() {
      try {
        const yearsResponse = await fetch(`${DATA_BASE}/data/years.json`, { cache: "no-store" });
        if (!yearsResponse.ok) return;
        const years = await yearsResponse.json() as number[];
        const datasets = await Promise.all(
          years.map(async (year) => {
            try {
              const response = await fetch(`${DATA_BASE}/data/festivals-${year}.json`, { cache: "no-store" });
              if (!response.ok) return [];
              return await response.json() as Festival[];
            } catch {
              return [];
            }
          })
        );
        if (!cancelled) setFestivals(datasets.flat());
      } catch {
        // お知らせ機能のデータ取得失敗で、サイト本体の表示を妨げない。
      }
    }

    loadFestivals();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || festivals.length === 0 || !settings.enabled) return;

    const current = readNotifications();
    const updated = addEligibleNotifications(festivals, settings, current);
    if (updated !== current) {
      saveNotifications(updated);
      setNotifications(updated);
    }
  }, [festivals, ready, settings]);

  const setEnabled = useCallback((enabled: boolean) => {
    const current = readNotificationSettings();
    saveNotificationSettings({ ...current, enabled });
  }, []);

  const setNotificationKindEnabled = useCallback((kind: NotificationSettings["enabledKinds"][number], enabled: boolean) => {
    const current = readNotificationSettings();
    const enabledKinds = enabled
      ? [...new Set([...current.enabledKinds, kind])]
      : current.enabledKinds.filter((item) => item !== kind);
    saveNotificationSettings({ ...current, enabledKinds });
  }, []);

  const markAsRead = useCallback((id: string) => {
    const updated = readNotifications().map((item) =>
      item.id === id ? { ...item, read: true } : item
    );
    saveNotifications(updated);
    setNotifications(updated);
  }, []);

  const markAllAsRead = useCallback(() => {
    const updated = readNotifications().map((item) => ({ ...item, read: true }));
    saveNotifications(updated);
    setNotifications(updated);
  }, []);

  const unreadCount = notifications.filter((item) => !item.read).length;

  return {
    settings,
    notifications,
    unreadCount,
    ready,
    setEnabled,
    setNotificationKindEnabled,
    markAsRead,
    markAllAsRead
  };
}
