"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Festival } from "@/types/festival";
import { FestivalCard } from "@/components/FestivalCard";
import { FestivalCalendar } from "@/components/FestivalCalendar";
import { FestivalFilters } from "@/components/FestivalFilters";
import { getAllTargets, filterFestivals } from "@/lib/festivalUtils";
import { useFavorites } from "@/hooks/useFavorites";

const DATA_BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function FestivalList() {
  const [years, setYears] = useState<number[]>([]);
  const [year, setYear] = useState<number | null>(null);
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [view, setView] = useState<"cards" | "calendar">("cards");
  const [showEnded, setShowEnded] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [searchText, setSearchText] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const { favoriteIds, toggleFavorite } = useFavorites();

  useEffect(() => {
    let cancelled = false;
    fetch(`${DATA_BASE}/data/years.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`年一覧の取得に失敗しました (${response.status})`);
        return response.json() as Promise<number[]>;
      })
      .then((data) => {
        if (cancelled) return;
        const sorted = [...data].sort((a, b) => a - b);
        setYears(sorted);
        setYear(sorted.includes(new Date().getFullYear()) ? new Date().getFullYear() : sorted[0] ?? new Date().getFullYear());
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : "データを読み込めませんでした。");
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (year === null) return;
    let cancelled = false;
    setLoading(true);
    setLoadError("");
    fetch(`${DATA_BASE}/data/festivals-${year}.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`${year}年の投稿祭データを取得できませんでした (${response.status})`);
        return response.json() as Promise<Festival[]>;
      })
      .then((data) => { if (!cancelled) setFestivals(data); })
      .catch((error: unknown) => {
        if (!cancelled) {
          setFestivals([]);
          setLoadError(error instanceof Error ? error.message : "投稿祭データを読み込めませんでした。");
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [year]);

  const targets = useMemo(() => getAllTargets(festivals), [festivals]);
  const filtered = useMemo(() => filterFestivals(festivals, {
    year: year ?? 0,
    showEnded,
    favoritesOnly,
    favoriteIds,
    selectedTargets
  }), [festivals, year, showEnded, favoritesOnly, favoriteIds, selectedTargets]);
  const cardFiltered = useMemo(() => {
    const query = searchText.trim().toLocaleLowerCase();
    return filtered
    .filter((festival) => {
      if (!query) return true;
      return [
        festival.name,
        festival.organizer ?? ""
      ].some((value) => value.toLocaleLowerCase().includes(query));
    })
    .sort((a, b) => {
      const aTime = new Date(a.eventStart ?? a.postingStart).getTime();
      const bTime = new Date(b.eventStart ?? b.postingStart).getTime();
      return (sortOrder === "asc" ? 1 : -1) * (aTime - bTime);
    });
  }, [filtered, searchText, sortOrder]);

  const monthGroups = useMemo(() => {
    const groups = new Map<string, Festival[]>();
    cardFiltered.forEach((festival) => {
      const date = new Date(festival.eventStart ?? festival.postingStart);
      const key = Number.isNaN(date.getTime())
        ? "日程未設定"
        : new Intl.DateTimeFormat("ja-JP", {
            timeZone: "Asia/Tokyo",
            year: "numeric",
            month: "numeric"
          }).format(date).replace(" ", "");
      groups.set(key, [...(groups.get(key) ?? []), festival]);
    });
    return [...groups.entries()];
  }, [cardFiltered]);

  return (
    <div className="space-y-5">
      <div className="page-heading">
        <p className="page-eyebrow">EXPLORE FESTIVALS</p>
        <h1>投稿祭を探す</h1>
        <p className="page-heading-description">
          ニコニコ動画などで開催される、ボカロ・歌ってみたなどの音楽系投稿祭の情報をまとめた非公式サイトです。
          投稿祭を探したり、開催日程を確認したりする際に、ぜひご活用ください。
        </p>
        <p className="page-heading-description">
          まだ掲載されていない投稿祭がありましたら、
          <Link href="/register" className="text-blue-600 underline hover:text-blue-800">
            投稿祭登録
          </Link>
          からぜひ情報をお寄せください。
        </p>
      </div>
      <section className="view-toolbar rounded-3xl border border-white/80 bg-white/75 p-3 shadow-lg shadow-indigo-100/50 backdrop-blur sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="view-toolbar-label">表示形式</div>
          <div className="flex gap-2 rounded-xl bg-slate-100 p-1">
            <button type="button" onClick={() => setView("cards")} className={`rounded-lg px-4 py-2 text-sm font-bold transition ${view === "cards" ? "bg-white text-indigo-800 shadow" : "text-slate-500 hover:text-slate-800"}`}>▦ カード</button>
            <button type="button" onClick={() => setView("calendar")} className={`rounded-lg px-4 py-2 text-sm font-bold transition ${view === "calendar" ? "bg-white text-indigo-800 shadow" : "text-slate-500 hover:text-slate-800"}`}>▦ カレンダー</button>
          </div>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-extrabold text-indigo-700">{loading ? "読み込み中…" : `${filtered.length}件`}</span>
        </div>
      </section>

      {view === "cards" && <div className="flex flex-wrap items-center gap-2"><span className="mr-1 text-xs font-bold tracking-wide text-slate-500">YEAR</span>{years.map((item) => <button key={item} type="button" onClick={() => setYear(item)} className={`rounded-full border px-4 py-2 text-sm font-extrabold transition ${year === item ? "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-200" : "border-white bg-white/80 text-slate-600 hover:border-indigo-200 hover:text-indigo-700"}`}>{item}</button>)}</div>}

      {!loading && festivals.length > 0 && <FestivalFilters showEnded={showEnded} setShowEnded={setShowEnded} favoritesOnly={favoritesOnly} setFavoritesOnly={setFavoritesOnly} targets={targets} selectedTargets={selectedTargets} setSelectedTargets={setSelectedTargets} />}
      {loadError && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">{loadError}</div>}
      {loading ? <div className="rounded-3xl border border-indigo-100 bg-white/80 p-12 text-center shadow-sm"><div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" /><p className="text-sm font-semibold text-slate-600">{year ?? "投稿祭"}年のデータを読み込んでいます…</p></div>
      : view === "cards" ? <>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <label className="rounded-2xl border border-white bg-white/85 p-3 shadow-sm"><span className="mb-1 block text-xs font-extrabold text-slate-600">投稿祭名・主催者名で検索</span><input type="search" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="投稿祭名や主催者名を入力..." className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" /></label>
          <div className="flex items-center gap-2 rounded-2xl border border-white bg-white/85 p-3 shadow-sm"><span className="text-xs font-bold text-slate-600">開催日</span><button type="button" onClick={() => setSortOrder("asc")} aria-pressed={sortOrder === "asc"} className={`rounded-lg px-3 py-2 text-xs font-extrabold ${sortOrder === "asc" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}>早い順 ↑</button><button type="button" onClick={() => setSortOrder("desc")} aria-pressed={sortOrder === "desc"} className={`rounded-lg px-3 py-2 text-xs font-extrabold ${sortOrder === "desc" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}>遅い順 ↓</button></div>
        </div>
        {cardFiltered.length ? <div className="space-y-8">{monthGroups.map(([monthLabel, monthFestivals]) => <section key={monthLabel} className="space-y-3"><h2 className="flex items-center gap-3 text-lg font-black text-slate-900"><span className="h-6 w-1.5 rounded-full bg-gradient-to-b from-indigo-500 to-sky-400" />{monthLabel}<span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">{monthFestivals.length}件</span></h2><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{monthFestivals.map((festival) => <FestivalCard key={festival.id} festival={festival} favorite={favoriteIds.includes(festival.id)} onToggleFavorite={() => toggleFavorite(festival.id)} />)}</div></section>)}</div> : <p className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-12 text-center text-sm text-slate-500">条件に一致する投稿祭はありません。</p>}
      </> : <FestivalCalendar festivals={filtered} favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite} initialYear={year ?? undefined} onYearChange={(nextYear) => { if (years.includes(nextYear)) setYear(nextYear); }} />}
    </div>
  );
}
