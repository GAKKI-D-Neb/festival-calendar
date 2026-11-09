"use client";

import { targetStyle } from "@/components/FestivalCard";

export function FestivalFilters({
  showEnded,
  setShowEnded,
  favoritesOnly,
  setFavoritesOnly,
  targets,
  selectedTargets,
  setSelectedTargets
}: {
  showEnded: boolean;
  setShowEnded: (value: boolean) => void;
  favoritesOnly: boolean;
  setFavoritesOnly: (value: boolean) => void;
  targets: string[];
  selectedTargets: string[];
  setSelectedTargets: (value: string[]) => void;
}) {
  function toggleTarget(target: string) {
    setSelectedTargets(
      selectedTargets.includes(target)
        ? selectedTargets.filter((item) => item !== target)
        : [...selectedTargets, target]
    );
  }

  return (
    <section className="festival-filters rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-3 shadow-sm">
      <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
        <label className="festival-filters__option flex cursor-pointer items-center gap-2">
          <input className="festival-filters__checkbox" type="checkbox" checked={showEnded} onChange={(e) => setShowEnded(e.target.checked)} />
          終了した投稿祭も表示
        </label>
        <label className="festival-filters__option flex cursor-pointer items-center gap-2">
          <input className="festival-filters__checkbox" type="checkbox" checked={favoritesOnly} onChange={(e) => setFavoritesOnly(e.target.checked)} />
          お気に入りのみ表示
        </label>
      </div>
      {targets.length > 0 && (
        <div className="festival-filters__targets mt-3 border-t border-slate-200 pt-3">
          <div className="festival-filters__heading mb-2 text-sm font-semibold text-slate-700">対象で絞り込む</div>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {targets.map((target) => (
              <label key={target} className={`festival-filters__target inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${targetStyle(target)} ${selectedTargets.includes(target) ? "ring-2 ring-indigo-300 ring-offset-1" : "opacity-80 hover:opacity-100"}`}>
                <input
                  className="festival-filters__checkbox"
                  type="checkbox"
                  checked={selectedTargets.includes(target)}
                  onChange={() => toggleTarget(target)}
                />
                {target}
              </label>
            ))}
          </div>
          {selectedTargets.length > 0 && (
            <button type="button" onClick={() => setSelectedTargets([])}
              className="festival-filters__clear mt-3 text-xs text-blue-700 underline">
              対象の絞り込みを解除
            </button>
          )}
        </div>
      )}
    </section>
  );
}
