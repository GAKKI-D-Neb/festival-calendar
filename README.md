# 投稿祭カレンダー

Next.js + Tailwind CSSで構築した、投稿祭一覧・月間カレンダーの静的サイトです。

## 必要環境

- Node.js 20以上
- npm
- Google Sheets APIを利用できるGoogle Cloudサービスアカウント

## ローカル起動

```bash
npm install
cp .env.example .env.local
```

`.env.local` に以下を設定します。

- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `FESTIVAL_YEARS`
- `NEXT_PUBLIC_GOOGLE_FORM_EMBED_URL`

Googleサービスアカウントは不要です。スプレッドシートの共有設定を「リンクを知っている全員：閲覧者」にしてください。

```bash
npm run fetch-data
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

## スプレッドシート

年ごとに `2026`、`2027` のようなシートを作成し、1行目に次の見出しを設定してください。

- ID（例: 2026-001）
- 投稿祭名
- 対象
- 投稿期間開始日時
- 投稿期間終了日時
- 開催期間開始日時
- 開催期間終了日時
- 詳細URL
- 公式サイトURL
- 主催
- 主催アカウントURL
- 削除フラグ

「ID」は `2026-001` のような一意の値を設定してください。列の位置は問いません。
「対象」は `ボカロP, 歌い手` のように半角カンマ区切りで入力します。
日付は `2026/01/04 0:00:00` の形式を想定しています。
開催期間は空欄でも構いません。

## GitHub Pagesへの公開

1. GitHubに新しいリポジトリを作成し、このプロジェクトをpushします。
2. リポジトリの Settings > Pages で Source を「GitHub Actions」にします。
3. Settings > Secrets and variables > Actions に以下を登録します。

### Repository secrets

- `GOOGLE_SHEETS_SPREADSHEET_ID`

### Repository variables

- `FESTIVAL_YEARS`（例: `2026,2027,2028`）
- `NEXT_PUBLIC_GOOGLE_FORM_EMBED_URL`（Googleフォームの埋め込みURL）

4. ActionsタブからDeploy to GitHub Pagesを実行します。

mainブランチへのpush時と、毎日JST 03:17ごろにデータ取得・ビルド・デプロイが行われます。

## 注意事項

- GitHub Pagesはサーバーを実行しないため、Google SheetsのCSV取得はGitHub Actionsで行います。
- サービスアカウントやAPIキーによる認証は使用しません。
- 「リンクを知っている全員：閲覧者」の共有設定では、リンクを知る第三者もシートを閲覧できます。公開してよい情報だけをシートに置いてください。
- フォームの埋め込みURLは公開情報として扱われます。
- 投稿祭のIDは現在「年_投稿祭名」から生成しています。お気に入りを長期間安定して維持するには、シートにID列を追加して固定IDを管理する方式を推奨します。


## 表示デザイン更新

カレンダーは週単位の連続バー表示に変更し、投稿祭ごとに色分けしています。開催期間が投稿期間と一致する場合はバーを重複表示しません。選択した投稿祭の詳細はデスクトップではカレンダー横に表示されます。

## 「このサイトについて」ページのリンク設定

`.env.local` に次の環境変数を設定すると、関連する投稿祭まとめページと作成者の問い合わせ先を掲載できます。

```env
NEXT_PUBLIC_RELATED_CALENDAR_URL=https://example.com/other-festival-calendar
NEXT_PUBLIC_CONTACT_X_URL=https://x.com/GAKKI_D_Neb
```

`NEXT_PUBLIC_RELATED_CALENDAR_URL` は実際に紹介したい投稿祭まとめのURLに置き換えてください。未設定の場合はリンク欄に「未設定」と表示されます。問い合わせ先は初期値として `@GAKKI_D_Neb` のXプロフィールを設定しています。別のアカウントを使う場合はURLを変更してください。

## 今回の表示変更

- カレンダーの各週のバー表示領域を固定高にし、投稿祭の件数で日付枠の高さが変わらないように変更
- 日付枠・週の境界線を強調し、投稿祭バーは淡い色に変更
- 投稿期間と開催期間の両方を含む期間を、カレンダー上では1本のバーとして表示
- カード表示を投稿開始月ごとに分類し、投稿祭名検索を追加
- 年選択はカード表示時のみ表示
- 上部ナビゲーションに「このサイトについて」を追加
- 非公式サイトであること、情報の誤りや更新遅れの可能性、公式案内の確認を促す注意書きを追加


### 関連リンクを複数登録する場合

`.env.local` に `NEXT_PUBLIC_RELATED_CALENDAR_LINKS` をJSON配列で設定します。

```env
NEXT_PUBLIC_RELATED_CALENDAR_LINKS='[{"label":"投稿祭まとめA","url":"https://example.com"},{"label":"投稿祭まとめB","url":"https://example.org"}]'
```

各要素の `label` がリンク名、`url` がリンク先です。従来の `NEXT_PUBLIC_RELATED_CALENDAR_URL` による単一リンク設定も利用できます。

カード表示の並び替えは「開催開始日」を基準にしています。


## 年ごとのJSON分割・遅延読み込み

`npm run fetch-data` は、Googleスプレッドシートの `FESTIVAL_YEARS` に指定された各年のシートを読み込み、次のファイルを生成します。

- `public/data/years.json`：年一覧のみ
- `public/data/festivals-2026.json`：2026年のデータ
- `public/data/festivals-2027.json`：2027年のデータ

ブラウザでは最初に `years.json` だけを取得し、選択中の年のJSONだけを取得します。別の年に切り替えたときに、その年のJSONを取得します。

## ページ構成

- `/`：投稿祭一覧（`src/app/page.tsx`）
- `/register/`：投稿祭登録（`src/app/register/page.tsx`）
- `/links/`：リンク集・このサイトについて（`src/app/links/page.tsx`）

共通の最上部ナビゲーションは `src/components/SiteHeader.tsx`、共通レイアウトは `src/app/layout.tsx` です。

## データ取得タイミング

GitHub Actions の `deploy.yml` により、データ取得は次のタイミングで実行されます。

- `main` ブランチへのpush時
- 毎日 03:17（日本時間）の定期実行
- GitHub Actions の `workflow_dispatch` による手動実行

取得後にJSONを生成し、そのJSONを含めてNext.jsをビルドしてGitHub Pagesへデプロイします。サイトを閲覧するたびにGoogle Sheetsへアクセスするわけではありません。


### ローカルでの更新手順

スプレッドシートの内容を反映する場合は、ビルド前に次の順で実行してください。

```bash
npm run fetch-data
npm run build
```

`fetch-data` はGoogle Sheetsから各年のデータを取得して、年別JSONと `years.json` を生成します。`build` は生成済みJSONを静的サイトに含めます。


## 関連リンクの追加・編集

関連リンクは環境変数ではなく、`src/app/links/page.tsx` の `relatedLinks` 配列で管理します。

```tsx
const relatedLinks: RelatedLink[] = [
  {
    name: "投稿祭まとめの名前",
    description: "リンク先の内容を簡単に紹介します。",
    url: "https://example.com"
  },
  {
    name: "別の投稿祭まとめ",
    description: "こちらも投稿祭情報をまとめているサイトです。",
    url: "https://example.org"
  }
];
```

リンクを増やす場合は、配列に同じ形式の項目を追加してください。各項目の `name` は表示名、`description` は紹介文、`url` はリンク先です。関連リンクの設定に環境変数は不要です。


### 表示の調整（v6）

- カード内の投稿期間・開催期間を、どちらも目立つ「期間・日程」パネルにまとめました。
- 対象の並び順を「ボカロP → 歌い手 → 絵師 → ボイロP → その他」に調整しました。
- カレンダーと選択カードの横幅をほぼ同じ比率に調整しました。
- カレンダーのバーを少し高くし、文字が切れにくいサイズ・行高に調整しました。
- リンク集ページの `getRelatedLinks is not defined` を修正し、ページ内の `relatedLinks` 配列を直接参照するようにしました。


## ナビゲーションとダークモード（v7）

- 最上部のナビゲーションをボタン風からテキストリンク中心の横並びに変更しました。
- 現在のページは淡い背景色で示します。
- 「投稿祭を探す」はページ全体のタイトルとして独立させ、カード／カレンダーの切替は「表示形式」として別枠にしました。
- OS・ブラウザの外観設定がダークモードの場合、ページ全体を暗色配色に切り替えます。ライト／ダークの切り替えはOS側の外観設定に連動します。


## カード表示の検索・ラベル調整（v8）

- カード上部のステータス表示と対象ラベルの間に余白・区切り線を追加しました。
- カード表示の検索対象を投稿祭名に加え、主催者名にも拡張しました。
