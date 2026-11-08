import type { Festival } from "@/types/festival";
import { isFestivalEnded } from "@/lib/dateUtils";

export function filterFestivals(
  festivals: Festival[],
  options: {
    year?: number;
    showEnded: boolean;
    favoritesOnly: boolean;
    favoriteIds: string[];
    selectedTargets: string[];
  }
): Festival[] {
  return festivals.filter((festival) => {
    if (festival.deleted || (options.year !== undefined && festival.year !== options.year)) return false;
    if (!options.showEnded && isFestivalEnded(festival)) return false;
    if (options.favoritesOnly && !options.favoriteIds.includes(festival.id)) return false;
    if (
      options.selectedTargets.length > 0 &&
      !options.selectedTargets.some((target) => festival.targets.includes(target))
    ) return false;
    return true;
  }).sort((a, b) => {
    const aTime = new Date(a.postingStart).getTime();
    const bTime = new Date(b.postingStart).getTime();
    if (!Number.isFinite(aTime)) return 1;
    if (!Number.isFinite(bTime)) return -1;
    return aTime - bTime;
  });
}

export function getAllTargets(festivals: Festival[]): string[] {
  const priority = (target: string): number => {
    if (/ボカロP|VOCALOID.*P|ボーカロイドP/i.test(target)) return 0;
    if (/歌い手|シンガー|人間.*歌唱/.test(target)) return 1;
    if (/絵師|イラスト|絵描き/.test(target)) return 2;
    if (/ボイロP|VOICEROID|VOICEVOX|ソフトウェアトーク/i.test(target)) return 3;
    return 4;
  };
  return [...new Set(festivals.flatMap((festival) => festival.targets))].sort((a, b) =>
    priority(a) - priority(b) || a.localeCompare(b, "ja")
  );
}
