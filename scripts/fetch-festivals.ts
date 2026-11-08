import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";

type Row = Record<string, string>;

function normalizeHeader(value: string): string {
  return value.replace(/\s/g, "").replace(/[「」『』]/g, "");
}

function parseDate(value: string | undefined): string | null {
  if (!value?.trim()) return null;

  // Spreadsheet formatted value: 2026/01/04 0:00:00
  const normalized = value.trim().replace(/\//g, "-");
  const match = normalized.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );

  if (match) {
    const [, y, mo, d, h = "0", mi = "0", s = "0"] = match;
    const year = Number(y);
    const month = Number(mo);
    const day = Number(d);
    const hour = Number(h);
    const minute = Number(mi);
    const second = Number(s);

    // Reject impossible dates/times instead of allowing Intl.DateTimeFormat
    // to fail later while rendering the page.
    const check = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    if (
      check.getUTCFullYear() !== year ||
      check.getUTCMonth() !== month - 1 ||
      check.getUTCDate() !== day ||
      hour > 23 || minute > 59 || second > 59
    ) {
      throw new Error(`日付を解釈できません: ${value}`);
    }

    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}T${h.padStart(2, "0")}:${mi}:${s}+09:00`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`日付を解釈できません: ${value}`);
  }
  return date.toISOString();
}

function truthy(value: string | undefined): boolean {
  return ["1", "true", "yes", "有", "削除"].includes((value ?? "").trim().toLowerCase());
}

function get(row: Row, ...names: string[]): string {
  for (const name of names) {
    const value = row[normalizeHeader(name)];
    if (value !== undefined) return value.trim();
  }
  return "";
}

async function fetchSheetCsv(spreadsheetId: string, sheetName: string): Promise<string> {
  const url = new URL(
    `https://docs.google.com/spreadsheets/d/${encodeURIComponent(spreadsheetId)}/gviz/tq`
  );
  url.searchParams.set("tqx", "out:csv");
  url.searchParams.set("sheet", sheetName);

  const response = await fetch(url, { redirect: "follow" });
  const body = await response.text();

  if (!response.ok || body.trimStart().startsWith("<!DOCTYPE html") || body.includes("accounts.google.com")) {
    throw new Error(
      `シート「${sheetName}」のCSVを取得できませんでした。\n` +
      `共有設定が「リンクを知っている全員：閲覧者」になっているか確認してください。\n` +
      `HTTP ${response.status}`
    );
  }

  return body;
}

async function main() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const years = (process.env.FESTIVAL_YEARS ?? "2026,2027,2028")
    .split(",").map((year) => year.trim()).filter(Boolean);

  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID が設定されていません。");
  }

  const outputDir = path.join(process.cwd(), "public", "data");
  await mkdir(outputDir, { recursive: true });
  const availableYears: number[] = [];

  for (const yearText of years) {
    const yearFestivals = [];
    const csv = await fetchSheetCsv(spreadsheetId, yearText);
    const records = parse(csv, {
      bom: true,
      skip_empty_lines: true,
      relax_quotes: true,
      columns: (headers: string[]) => headers.map(normalizeHeader)
    }) as Row[];

    for (const row of records) {
      const name = get(row, "投稿祭名");
      if (!name) continue;

      // 削除フラグが立っている行は、日時解析も含めて完全にスキップする。
      if (truthy(get(row, "削除フラグ"))) continue;

      const postingStart = parseDate(get(row, "投稿期間開始日時"));
      const postingEnd = parseDate(get(row, "投稿期間終了日時"));
      if (!postingStart || !postingEnd) {
        console.warn(`投稿期間が未設定のためスキップ: ${name}`);
        continue;
      }

      // 開催期間が空欄なら、投稿期間と同じ期間として扱う。
      // 片方だけ入力されている場合も、未入力側を投稿期間の日付で補完する。
      const eventStart = parseDate(get(row, "開催期間開始日時")) ?? postingStart;
      const eventEnd = parseDate(get(row, "開催期間終了日時")) ?? postingEnd;
      const targets = get(row, "対象").split(",").map((item) => item.trim()).filter(Boolean);

      const id = get(row, "ID") || `${yearText}_${name}`.normalize("NFKC");

      yearFestivals.push({
        id,
        year: Number(yearText),
        name,
        targets,
        postingStart,
        postingEnd,
        eventStart,
        eventEnd,
        detailUrl: get(row, "詳細URL") || null,
        officialUrl: get(row, "公式サイトURL") || null,
        organizer: get(row, "主催") || null,
        organizerUrl: get(row, "主催アカウントURL") || null,
        deleted: false
      });
    }

    yearFestivals.sort(
      (a, b) => new Date(a.postingStart).getTime() - new Date(b.postingStart).getTime()
    );
    const year = Number(yearText);
    availableYears.push(year);
    const outputPath = path.join(outputDir, `festivals-${year}.json`);
    await writeFile(outputPath, JSON.stringify(yearFestivals, null, 2) + "\n", "utf8");
    console.log(`${year}年: ${yearFestivals.length}件を書き出しました: ${outputPath}`);
  }

  const yearsPath = path.join(outputDir, "years.json");
  await writeFile(yearsPath, JSON.stringify(availableYears.sort((a, b) => a - b), null, 2) + "\n", "utf8");
  console.log(`${availableYears.length}年分のインデックスを書き出しました: ${yearsPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
