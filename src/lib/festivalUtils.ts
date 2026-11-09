import type { Festival } from "@/types/festival";
import { isFestivalEnded } from "@/lib/dateUtils";

export function filterFestivals(
  festivals: Festival[],
  options: {
    year: number;
    showEnded: boolean;
    favoritesOnly: boolean;
    favoriteIds: string[];
    selectedTargets: string[];
  }
): Festival[] {
  return festivals.filter((festival) => {
    if (festival.deleted || festival.year !== options.year) return false;
    if (!options.showEnded && isFestivalEnded(festival)) return false;
    if (options.favoritesOnly && !options.favoriteIds.includes(festival.id)) return false;
    if (
      options.selectedTargets.length > 0 &&
      !options.selectedTargets.some((target) => festival.targets.includes(target))
    ) return false;
    return true;
  }).sort((a, b) => new Date(a.eventStart ?? a.postingStart).getTime() - new Date(b.eventStart ?? b.postingStart).getTime());
}

export function getAllTargets(festivals: Festival[]): string[] {
  return [...new Set(festivals.flatMap((festival) => festival.targets))].sort((a, b) =>
    a.localeCompare(b, "ja")
  );
}
