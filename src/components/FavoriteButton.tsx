"use client";

export function FavoriteButton({
  active,
  onClick
}: {
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={active ? "お気に入りを解除" : "お気に入りに登録"}
      aria-pressed={active}
      className={`rounded-lg border px-3 py-2 text-lg transition hover:bg-amber-50 ${
        active ? "border-amber-300 bg-amber-50 text-amber-600" : "border-slate-200 text-slate-500"
      }`}
    >
      {active ? "★" : "☆"}
    </button>
  );
}
