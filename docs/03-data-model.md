---
title: wantandwallet データモデル
version: 0.1
status: draft
updated: 2026-11-27
---

# 1. 設計方針

1. **型番（CardPrint）が価格・在庫・購入の単位**。カード名（Card）は検索・表示のための親。
2. マスタ（Card / CardPrint）は取り込みデータ由来。**ユーザーが編集できるのはメモ・別名などの付加情報のみ**（再取り込みで壊れないように）。
3. トランザクション系（PriceObservation / Purchase）は**追記型＋論理削除**。履歴を消さない。
4. 将来同期に備え、全テーブルに `id`（UUID v7）、`updatedAt`、`deletedAt` を持たせる。同期は「最終更新が新しい方」＋削除は tombstone で解決できる形にする。
5. 金額は **整数の円** で保存（浮動小数点を使わない）。通貨は JPY 固定。

# 2. ER 概要

```
Card 1 ──< CardPrint 1 ──< PriceObservation >── 1 Store
                 │
                 ├──< Purchase >── 1 Store
                 │
                 └──< WishItem

Budget (月次) ──< BudgetCategory
SetRelease（独立）
Setting（単一レコード）
```

# 3. テーブル定義

## 3.1 `cards`（カード名マスタ）

| 列 | 型 | 制約 | 説明 |
| --- | --- | --- | --- |
| id | string | PK | UUID v7 |
| konamiId | string? | index | yaml-yugi の konami_id |
| passcode | string? | index | 8 桁パスコード |
| nameJa | string | index | 日本語名（例: ブラック・マジシャン） |
| nameNorm | string | index | 検索用正規化名（かな化・記号除去） |
| nameEn | string? | | 英語名 |
| cardType | string? | | モンスター/魔法/罠 等 |
| text | string? | | 効果テキスト（詳細画面用、必要時のみ） |
| source | string | | `yaml-yugi` / `manual` |
| updatedAt | number | index | epoch ms |
| deletedAt | number? | index | 論理削除 |

**索引**: `nameNorm`, `passcode`, `[deletedAt+nameNorm]`

## 3.2 `cardPrints`（型番）

| 列 | 型 | 制約 | 説明 |
| --- | --- | --- | --- |
| id | string | PK | UUID v7 |
| cardId | string | FK cards.id, index | |
| setCode | string | index | 例 `QCCU-JP001`（無い場合あり） |
| setName | string | | 例 `Quarter Century Chronicle side:Unity` |
| rarity | string | | 例 `Ultra Rare` |
| rarityCode | string? | | 例 `UR` |
| uniqueKey | string | **unique** | `setCode|rarity`（setCode 空なら `cardId|setName|rarity`） |
| updatedAt | number | | |
| deletedAt | number? | | |

**不変条件**: `uniqueKey` は一意。同一型番の重複登録は upsert で吸収する。

## 3.3 `stores`（店舗）

| 列 | 型 | 制約 | 説明 |
| --- | --- | --- | --- |
| id | string | PK | |
| name | string | index | 店舗名 |
| kind | `store` \| `online` | index | 実店舗 / 通販 |
| area | string? | | エリア・地域 |
| url | string? | | 通販 URL |
| favorite | number | index | 0/1。並び順上位に固定 |
| sortOrder | number | | 手動並び順 |
| memo | string? | | |
| archivedAt | number? | | 使わなくなった店舗 |
| updatedAt | number | | |
| deletedAt | number? | | |

## 3.4 `wishItems`（欲しい項目）

| 列 | 型 | 制約 | 説明 |
| --- | --- | --- | --- |
| id | string | PK | |
| printId | string | FK cardPrints.id, index | |
| qtyWanted | number | | 欲しい枚数（1 以上） |
| priority | 1 \| 2 \| 3 | index | 1=高, 2=中, 3=低 |
| targetPrice | number? | | 目標単価（円） |
| memo | string? | | |
| createdAt | number | index | |
| updatedAt | number | | |
| deletedAt | number? | | |

**導出値（保存しない）**: `qtyPurchased`（purchases 合計）、`qtyRemaining = max(0, qtyWanted - qtyPurchased)`、`done = qtyRemaining === 0`

**不変条件**: 同一 `printId` の有効な wishItem は 1 件（追加時はマージ）。

## 3.5 `priceObservations`（価格観測）

| 列 | 型 | 制約 | 説明 |
| --- | --- | --- | --- |
| id | string | PK | |
| printId | string | FK, index | |
| storeId | string | FK, index | |
| price | number | | 単価（円、税込） |
| stock | 0 \| 1 \| 2 | | 0=なし, 1=あり, 2=不明 |
| observedAt | number | index | 観測日時（epoch ms、日付精度で十分） |
| source | `visit` \| `online` \| `manual` | | 記録経路 |
| memo | string? | | |
| updatedAt | number | | |
| deletedAt | number? | | |

**索引**: `[printId+storeId+observedAt]`, `[storeId+observedAt]`
**「最新価格」** = 同一 `printId × storeId` の `observedAt` 最大のレコード（deletedAt 除外）。

## 3.6 `purchases`（購入）

| 列 | 型 | 制約 | 説明 |
| --- | --- | --- | --- |
| id | string | PK | |
| printId | string | FK, index | |
| storeId | string? | FK, index | 店舗不明なら null |
| qty | number | | 数量（1 以上） |
| unitPrice | number | | 単価（円） |
| shipping | number | | 送料（円、既定 0） |
| total | number | | `qty * unitPrice + shipping`（保存して集計を高速化） |
| purchasedAt | number | index | 購入日時 |
| category | `newset` \| `single` \| `goods` \| `other` | index | 予算内訳の区分 |
| sourcePriceId | string? | | 価格観測から変換した場合の元レコード |
| memo | string? | | |
| updatedAt | number | | |
| deletedAt | number? | | |

**索引**: `[purchasedAt+category]`, `printId`, `storeId`

## 3.7 `budgets`（月次予算）

| 列 | 型 | 制約 | 説明 |
| --- | --- | --- | --- |
| id | string | PK | |
| month | string | **unique** | `YYYY-MM` |
| limit | number | | 上限額（円） |
| note | string? | | |
| updatedAt | number | | |
| deletedAt | number? | | |

**導出値（保存しない）**: `spent`（当月 purchases 合計）、`remaining = limit - spent`、`rate = spent / limit`

## 3.8 `budgetCategories`（カテゴリ配分）

| 列 | 型 | 制約 | 説明 |
| --- | --- | --- | --- |
| id | string | PK | |
| month | string | index | `YYYY-MM` |
| category | `newset` \| `single` \| `goods` \| `other` | | |
| allocation | number | | 配分額（円）。合計 = limit を推奨（超過は警告のみ） |

**索引**: `[month+category]`（unique）

## 3.9 `setReleases`（新弾）

| 列 | 型 | 制約 | 説明 |
| --- | --- | --- | --- |
| id | string | PK | |
| name | string | index | 商品名 |
| releaseDate | string | index | `YYYY-MM-DD`（日本時間の日付） |
| kind | string? | | ブースター / 構造デッキ / スターターデッキ 等 |
| url | string? | | 公式ページ |
| source | `official` \| `manual` | | |
| importedAt | number? | | 取り込み時刻 |
| memo | string? | | |
| updatedAt | number | | |
| deletedAt | number? | | |

**マージ規則**: `name + releaseDate` をキーに upsert。`source = manual` のレコードは取り込みで上書きしない。

## 3.10 `settings`（単一レコード）

| 列 | 型 | 説明 |
| --- | --- | --- |
| id | `app` | 固定 |
| defaultMonthlyLimit | number | 既定の月次予算 |
| categoryDefaults | Record<Category, number> | 既定配分比率 |
| lastExportAt | number? | 最終エクスポート日時（R-71） |
| installHintDismissed | boolean | ホーム画面追加案内の再表示制御 |
| updatedAt | number | |

# 4. Dexie スキーマ（v1 案）

```ts
db.version(1).stores({
  cards:            'id, konamiId, passcode, nameNorm, [deletedAt+nameNorm]',
  cardPrints:       'id, cardId, setCode, uniqueKey, deletedAt',
  stores:           'id, kind, favorite, archivedAt, [deletedAt+name]',
  wishItems:        'id, printId, priority, createdAt, deletedAt',
  priceObservations:'id, printId, storeId, observedAt, [printId+storeId+observedAt], [storeId+observedAt]',
  purchases:        'id, printId, storeId, purchasedAt, category, [purchasedAt+category]',
  budgets:          'id, &month',
  budgetCategories: 'id, &[month+category]',
  setReleases:      'id, releaseDate, name, deletedAt',
  settings:         'id',
});
```

# 5. 主要な計算（domain 層の純関数）

| 関数 | 仕様 |
| --- | --- |
| `monthRange(month)` | 月初 00:00〜翌月初 00:00（**Asia/Tokyo 固定**、端末 TZ に依存させない） |
| `remainingQty(wish, purchases)` | `max(0, qtyWanted - Σ qty)` |
| `latestPrice(observations)` | `printId × storeId` ごとの最新値のマップ |
| `bestStore(latestPrices)` | 最安の店舗と価格。同額なら `favorite` 優先 |
| `budgetSummary(limit, purchases, categories)` | 支出・残額・消化率・カテゴリ別支出と配分比 |
| `daysLeftInMonth(today)` | 残日数（Asia/Tokyo） |

# 6. データ保全

- エクスポート: 全テーブルを 1 つの JSON（`{ schemaVersion, exportedAt, tables }`）に。`dexie-export-import` の形式をそのまま利用
- インポート: スキーマバージョンを検査し、未知の新しいバージョンは拒否。確認ダイアログ 2 段階
- 削除: 物理削除は「データ全削除」のみ。通常操作は `deletedAt` セット

# 7. 将来の同期（C）

- `id` は UUID v7（時刻順）なので、そのままサーバーの主キーにできる
- 同期単位: テーブルごとに `updatedAt > lastSyncedAt` を push、リモートの新しい行を pull
- 競合: `updatedAt` の新しい方。削除は tombstone を 30 日保持してから物理削除
- 実装先の候補: Supabase（Postgres + RLS、無料枠）。ただし**要件が固まってから**
