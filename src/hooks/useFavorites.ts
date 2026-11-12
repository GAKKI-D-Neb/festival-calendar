"use client";

import { useEffect, useState } from "react";
import { syncNotificationTargets } from "@/lib/notificationStorage";

const STORAGE_KEY = "festival-calendar-favorites";

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
          setFavoriteIds(parsed);
        }
      }
    } catch {
      // Ignore invalid local storage data and start with an empty list.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteIds));
    // お気に入り登録を通知対象にも自動反映する。通知全体のON/OFFは維持する。
    syncNotificationTargets(favoriteIds);
  }, [favoriteIds, ready]);

  function toggleFavorite(id: string) {
    setFavoriteIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  return { favoriteIds, toggleFavorite, ready };
}
