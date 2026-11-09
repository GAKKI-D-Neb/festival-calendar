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

  const allFestivals = [];

  for (const yearText of years) {
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

      const postingStart = parseDate(get(row, "投稿期間開始日時"));
      const postingEnd = parseDate(get(row, "投稿期間終了日時"));
      if (!postingStart || !postingEnd) {
        console.warn(`投稿期間が未設定のためスキップ: ${name}`);
        continue;
      }

      const eventStart = parseDate(get(row, "開催期間開始日時"));
      const eventEnd = parseDate(get(row, "開催期間終了日時"));
      const targets = get(row, "対象").split(",").map((item) => item.trim()).filter(Boolean);

      const id = get(row, "ID") || `${yearText}_${name}`.normalize("NFKC");

      allFestivals.push({
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
        deleted: truthy(get(row, "削除フラグ"))
      });
    }
  }

  allFestivals.sort(
    (a, b) => new Date(a.eventStart ?? a.postingStart).getTime() - new Date(b.eventStart ?? b.postingStart).getTime()
  );

  const outputPath = path.join(process.cwd(), "public", "data", "festivals.json");
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(allFestivals, null, 2) + "\n", "utf8");
  console.log(`${allFestivals.length}件の投稿祭データを書き出しました: ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
