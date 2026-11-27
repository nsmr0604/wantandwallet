---
title: wantandwallet 技術スタック
version: 0.1
status: draft
updated: 2026-11-27
---

# 1. 結論

| 領域 | 採用 |
| --- | --- |
| 言語 | TypeScript 5.x（strict） |
| UI | Svelte 5（Runes） |
| ビルド | Vite 7 + `@sveltejs/vite-plugin-svelte`（SPA / SSR なし） |
| ルーティング | 自前の軽量ハッシュルーター（30 行程度）。複雑化したら `@tanstack/svelte-router` |
| スタイル | Tailwind CSS 4（`@tailwindcss/vite`） |
| 永続化 | IndexedDB + Dexie 4 |
| バックアップ | `dexie-export-import`（JSON） |
| PWA | `vite-plugin-pwa`（Workbox、precache + 更新プロンプト） |
| アイコン | `lucide-svelte` |
| グラフ | まず CSS バー。必要になったら `layerchart` |
| テスト | Vitest + `@testing-library/svelte` / Playwright（Chromium + WebKit） |
| Lint/Format | ESLint 9（flat config） + Prettier |
| 配信 | Cloudflare Pages（第一候補）/ GitHub Pages（代替） |
| CI | GitHub Actions（型検査・テスト・ビルド） |

# 2. なぜこの構成か

## Svelte 5 + Vite（SSR なし SPA）

- ローカル DB（IndexedDB）が唯一の真実なので、**サーバーサイドレンダリングは不要**。静的ファイルだけで完結する。
- Svelte 5 はランタイムが小さく、中位 Android での起動・操作が軽い。個人用アプリでバンドルサイズは正義。
- Vite の素の SPA 構成にすると、SvelteKit のアダプタ設定・ルーティング規約を覚えるコストがなく、`base` パスだけ気にすれば GitHub Pages / Cloudflare Pages の両方に出せる。

## ハッシュルーティング

- GitHub Pages は SPA の深いパスで 404 を返す。ハッシュ（`/#/wish`）なら追加設定ゼロで動く。
- Cloudflare Pages に移す場合も `_redirects` 不要。URL の見栄えより運用の単純さを優先。
- 画面が 9 つ・ネストなしなので、ルーターライブラリは入れず `hashchange` を見る 30 行程度の実装にする（依存の互換性リスクを避ける）。ルートが増えて複雑になったら `@tanstack/svelte-router` を検討。

## Dexie 4

- IndexedDB の薄いラッパーで、スキーマのバージョン管理（`stores({...}).version(n).upgrade()`）が明快。
- 複合インデックス（`[cardPrintId+storeId+observedAt]` など）と範囲クエリが素直に書ける。
- `dexie-export-import` で JSON のエクスポート/インポートがほぼ 1 関数。要件 R-70 を最短で満たせる。
- 将来の同期（Supabase 等）に備え、**Dexie を直接コンポーネントから触らず Repository 層を挟む**。

## Tailwind 4

- 画面数が 9 程度の小規模アプリ。デザインシステムを作るより、ユーティリティで速度を優先。
- 片手操作・下部タブ・大きめタップ領域をクラスで統一できる。

## PWA（インストール型）

- iOS/Android 両対応を、ストア審査・ビルド証明書・TestFlight なしで達成できる。
- オフラインを Workbox の precache で担保。店内の弱電波でも動く。
- 制約は「§5 iOS の制約」に明記。

# 3. レイヤ構成

```
src/
  routes/            画面（Svelte コンポーネント）
  lib/
    components/      UI 部品（Card, Sheet, NumberPad, TabBar...）
    stores/          Svelte 5 runes ベースの画面状態
    domain/          型・不変条件・計算（予算、残枚数、最安値）
    db/              Dexie スキーマ・マイグレーション
    repositories/    cards / prints / stores / prices / purchases / budget / releases
    services/        import-export, search-index, releases
    utils/           日付・通貨フォーマット
public/
  data/
    cards-index.json    日本語名検索用の軽量索引（ビルド生成）
    cards/<chunk>.json  型番・カード詳細（遅延ロード）
    releases.json       新弾スケジュール（生成 or 手動更新）
scripts/
  build-card-index.ts   yaml-yugi → cards-index.json + 詳細チャンク
  fetch-releases.ts     公式商品ページ → releases.json（手動実行）
```

**依存方向**: routes → stores → repositories → db。`domain/` はどこからも依存されない純粋関数。画面から `db` を直接 import しない。

# 4. カードデータの取り込み

## 入力

- `https://dawnbrandbots.github.io/yaml-yugi/cards.json`（OCG/TCG 全カード、`name.ja` / `text.ja` / `sets.ja` を含む）
- 実データを取得して `name.ja` の存在を確認済み（例: 46986414 → 「ブラック・マジシャン」）

## 変換（`scripts/build-card-index.ts`）

1. 全件取得し、`sets` に `ja` を持つ（＝OCG 収録がある）カードに絞る
2. 索引レコード: `{ i: konami_id, p: password, n: nameJa, e: nameEn, t: cardType }`
3. 詳細レコード: 型番候補（`set_number` / `set_name` / `rarities`）＋カードテキスト
4. 日本語名の正規化（全角英数→半角、カタカナ→ひらがな、記号除去）を**索引側に持たせる**ことで、入力のたびの正規化コストを避ける

## サイズ方針

- 索引は 1 ファイル（数 MB 以内）で precache 対象。詳細は 500〜1000 件ずつのチャンクに分割し、必要なときだけ fetch（Cache Storage に残す）。
- 画像を持たないため、合計は数十 MB に収まる見込み。

## 新弾データ（`scripts/fetch-releases.ts`）

- `https://www.yugioh-card.com/japan/products/` を取得し、商品名・発売日・種別・URL を抽出（取得可能なことを確認済み）
- 出力は `releases.json`。**アプリ実行時に外部サイトへアクセスしない**（CORS・規約・負荷の回避）
- 実行は月 1 回の手動 or GitHub Actions のスケジュール。取得失敗時は前回 JSON を保持
- ToS・robots を確認し、過度なアクセス（1 日 1 回以上）はしない

# 5. iOS PWA の制約と対策

| 制約 | 対策 |
| --- | --- |
| ホーム画面追加は Safari の共有メニューから手動 | 初回起動時に追加手順を 1 画面で案内 |
| プッシュ通知は iOS 16.4+ かつ「追加済み」のみ | 通知は C（将来）。まずアプリ内表示 |
| 7 日間未使用でストレージが退避され得る | 起動時に最終エクスポート日を確認し、エクスポートを促す（R-71） |
| バックグラウンド同期なし | 同期は起動時のみ。将来同期を入れる場合もフォアグラウンド同期 |
| インストール時にストレージの永続化を保証できない | `navigator.storage.persist()` を要求し、結果を設定画面に表示 |

# 6. テスト方針

- **domain**: 予算計算・残枚数・最安値判定・月境界（タイムゾーン）を純関数で単体テスト
- **repositories**: `fake-indexeddb` で CRUD とマイグレーションを検証
- **E2E（Playwright）**: 「検索→欲しい→巡回→比較→購入→予算反映」の 1 本の通しシナリオを WebKit と Chromium で実行
- **実機**: Xperia（Android）でインストール・機内モード・入力速度を確認。iOS は可能な範囲で Safari 実機確認

# 7. 配信

- **Cloudflare Pages**（第一候補）: 無料・HTTPS・プレビュー URL・`_headers` でキャッシュ制御。独自ドメイン任意
- **GitHub Pages**（代替）: ハッシュルーティングなので設定は `base` のみ
- ビルド成果物は `dist/`。`npm run build` 一発でデプロイ可能に保つ

# 8. 採用しなかった案

| 案 | 却下理由 |
| --- | --- |
| Flutter | ネイティブの利点（通知・ストア）は魅力だが、配布が PWA で足りるためビルド環境（iOS は Mac 必須）を持ち込む理由が弱い |
| React + Vite | 有力。ただし個人用の小規模画面数では Svelte の記述量・バンドルサイズの利が大きい |
| SvelteKit | SSR・ルーティング規約が不要。静的 SPA で十分 |
| Supabase 直結 | 同期は C。まずローカル完結させ、必要になった時点で Repository 層の裏に差し込む |
| localStorage | 容量・同期・トランザクションに不安。IndexedDB 一択 |
| YGOPRODeck | TCG/英語中心。OCG 日本語要件を満たさない（英語名の参考表示にのみ将来利用可） |
