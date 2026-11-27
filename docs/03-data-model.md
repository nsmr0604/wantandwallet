---
title: wantandwallet データモデル
version: 0.2
status: draft
updated: 2026-11-27
---

# 1. 設計方針

1. **カード名が唯一の単位**。型番・セット・再録では分割しない。`cards.nameNorm`（正規化名）で一意にする。
2. **レアリティは「価格・購入の任意ラベル」**。カードの同一性には影響しない（イラスト違いの区別用）。
3. シール品（パック/BOX）は**商品マスタ（setReleases）＋購入レコード**で扱い、店舗別の価格比較はしない（定価管理）。
4. トランザクション系（PriceObservation / Purchase）は**追記型＋論理削除**。履歴を消さない。
5. 将来同期に備え、全テーブルに `id`（UUID v7）、`updatedAt`、`deletedAt` を持たせる。
6. 金額は **整数の円**（浮動小数点を使わない）。通貨は JPY 固定。

# 2. ER 概要

```
Card 1 ──< WishItem
  │
  ├──< PriceObservation >── 1 Store
  └──< Purchase >────────── 1 Store

SetRelease 1 ──< Purchase（シール品: パック/BOX）
     │
     └──< Reminder

Budget ──< BudgetCategory
Setting（単一レコード）
```

# 3. テーブル定義

## 3.1 `cards`（カード名マスタ）

| 列 | 型 | 制約 | 説明 |
| --- | --- | --- | --- |
| id | string | PK | UUID v7 |
| konamiId | string? | index | 取り込み元の ID |
| passcode | string? | index | 8 桁パスコード（任意） |
| nameJa | string | index | 日本語名（例: 灰流うらら） |
| nameNorm | string | **unique** | 検索・一意性用の正規化名（かな化・全半角統一・記号除去） |
| nameKana | string? | index | 読み（任意）。五十音ソートに使う。無ければ `nameJa` を `Intl.Collator('ja')` で比較 |
| nameEn | string? | | 英語名（参考） |
| cardType | string? | | モンスター/魔法/罠 等 |
| text | string? | | 効果テキスト（詳細表示用、必要時のみ） |
| source | string | | `yaml-yugi` / `manual` |
| updatedAt | number | index | epoch ms |
| deletedAt | number? | index | 論理削除 |

**索引**: `&nameNorm`, `passcode`, `[deletedAt+nameNorm]`

**不変条件**: 有効な `nameNorm` は一意。取り込み時は upsert（既存のメモ等を壊さない）。

## 3.2 `stores`（店舗）

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

## 3.3 `wishItems`（欲しい項目）

| 列 | 型 | 制約 | 説明 |
| --- | --- | --- | --- |
| id | string | PK | |
| cardId | string | FK cards.id, **unique（deletedAt null 時）** | カードごとに 1 件 |
| qtyWanted | number | | 欲しい枚数（1 以上） |
| priority | 1 \| 2 \| 3 | index | 1=高, 2=中, 3=低 |
| targetPrice | number? | | 目標単価（円） |
| rarity | string? | | 希望レアリティ（表示用） |
| memo | string? | | |
| createdAt | number | index | |
| updatedAt | number | | |
| deletedAt | number? | | |

**導出値（保存しない）**: `qtyPurchased`（単品購入＋開封加算）、`qtyRemaining = max(0, qtyWanted - qtyPurchased)`、`done = qtyRemaining === 0`

## 3.4 `priceObservations`（価格観測・シングルのみ）

| 列 | 型 | 制約 | 説明 |
| --- | --- | --- | --- |
| id | string | PK | |
| cardId | string | FK, index | |
| storeId | string | FK, index | |
| price | number | | 単品価格（円、税込） |
| rarity | string? | | 記録時のレアリティ（任意） |
| stock | 0 \| 1 \| 2 | | 0=なし, 1=あり, 2=不明 |
| observedAt | number | index | 観測日時（日付精度で十分） |
| source | `visit` \| `online` \| `manual` | | 記録経路 |
| memo | string? | | |
| updatedAt | number | | |
| deletedAt | number? | | |

**索引**: `[cardId+storeId+observedAt]`, `[storeId+observedAt]`
**「最新価格」** = 同一 `cardId × storeId` の `observedAt` 最大（deletedAt 除外）。

## 3.5 `purchases`（購入・予約）

| 列 | 型 | 制約 | 説明 |
| --- | --- | --- | --- |
| id | string | PK | |
| itemType | `card` \| `sealed` | index | 単品 / シール品 |
| cardId | string? | FK, index | 単品のとき必須 |
| releaseId | string? | FK setReleases.id, index | シール品のとき必須 |
| unit | `single` \| `pack` \| `box` | | 購入単位 |
| qty | number | | 数量（1 以上） |
| unitPrice | number | | 単価（円） |
| shipping | number | | 送料（円、既定 0） |
| total | number | | `qty * unitPrice + shipping`（集計用に保存） |
| rarity | string? | | 単品の任意ラベル |
| status | `reserved` \| `bought` | index | 予約中 / 購入済み |
| reservedAt | number? | | 予約日 |
| purchasedAt | number? | index | 購入日（予約中は null） |
| expectedAt | number? | | 発売日・入荷予定日 |
| storeId | string? | FK, index | 予約店・購入店 |
| category | `newset` \| `single` \| `goods` \| `other` | index | 予算内訳の区分 |
| sourcePriceId | string? | | 価格観測から変換した場合の元レコード |
| memo | string? | | |
| updatedAt | number | | |
| deletedAt | number? | | |

**索引**: `[purchasedAt+category]`, `[status+expectedAt]`, `cardId`, `releaseId`, `storeId`

**集計規則**

- 支出に計上するのは `status = bought` のみ（`purchasedAt` 基準）
- `reserved` は「予約枠」として別表示（R-57）
- 実効単価（比較用）: `unit === 'box' ? unitPrice / packsPerBox : unit === 'pack' ? unitPrice : unitPrice`

## 3.6 `budgets`（月次予算）

| 列 | 型 | 制約 | 説明 |
| --- | --- | --- | --- |
| id | string | PK | |
| month | string | **unique** | `YYYY-MM` |
| limit | number | | 上限額（円） |
| note | string? | | |
| updatedAt | number | | |
| deletedAt | number? | | |

**導出値**: `spent`（当月の bought 合計）、`reserved`（当月発売予定の reserved 合計）、`remaining = limit - spent`、`rate = spent / limit`

## 3.7 `budgetCategories`（カテゴリ配分）

| 列 | 型 | 制約 | 説明 |
| --- | --- | --- | --- |
| id | string | PK | |
| month | string | index | `YYYY-MM` |
| category | `newset` \| `single` \| `goods` \| `other` | | |
| allocation | number | | 配分額（円） |

**索引**: `&[month+category]`

## 3.8 `setReleases`（新弾・シール商品）

| 列 | 型 | 制約 | 説明 |
| --- | --- | --- | --- |
| id | string | PK | |
| name | string | index | 商品名 |
| releaseDate | string | index | `YYYY-MM-DD`（日本時間） |
| kind | string? | | ブースター / 構造デッキ / スペシャルパック 等 |
| url | string? | | 公式ページ |
| msrpPack | number? | | 希望小売価格・1 パック（税込） |
| msrpBox | number? | | 希望小売価格・1 BOX（税込） |
| packsPerBox | number? | | 1BOX のパック数（商品値。無ければ設定の既定値） |
| cardsPerPack | number? | | 1 パックの枚数（例 5） |
| preorderAt | string? | | 予約開始日（`YYYY-MM-DD`） |
| source | `official` \| `manual` | | |
| importedAt | number? | | 取り込み時刻 |
| memo | string? | | |
| updatedAt | number | | |
| deletedAt | number? | | |

**導出値**: `effectivePacksPerBox = packsPerBox ?? settings.defaultPacksPerBox`、`packEquivalent = msrpBox != null ? msrpBox / effectivePacksPerBox : msrpPack`

**マージ規則**: `name + releaseDate` をキーに upsert。`source = manual` および手動修正フラグの立つ項目は取り込みで上書きしない。

## 3.9 `reminders`（リマインダー）

| 列 | 型 | 制約 | 説明 |
| --- | --- | --- | --- |
| id | string | PK | |
| releaseId | string | FK setReleases.id, index | |
| kind | `preorder` \| `release` \| `custom` | | 予約開始 / 発売日 / 任意 |
| remindAt | string | index | `YYYY-MM-DD` |
| note | string? | | |
| doneAt | number? | | 完了・既読 |
| updatedAt | number | | |

**生成規則**: 商品の `preorderAt` / `releaseDate` から、設定の `reminderLeadDays` を引いた日を既定の `remindAt` とする。通知は C（アプリ内表示のみ）。

## 3.10 `settings`（単一レコード）

| 列 | 型 | 説明 |
| --- | --- | --- |
| id | `app` | 固定 |
| defaultMonthlyLimit | number | 既定の月次予算 |
| defaultPacksPerBox | number | 1BOX のパック数 既定値（既定 30） |
| patrolSort | `priority` \| `typeName` | 巡回モードの並び順（最後に選んだもの・既定 `priority`） |
| reminderLeadDays | number | リマインダーを何日前に出すか（既定 7） |
| categoryDefaults | Record<Category, number> | 既定配分比率 |
| lastExportAt | number? | 最終エクスポート日時 |
| installHintDismissed | boolean | ホーム画面追加案内の再表示制御 |
| updatedAt | number | |

# 4. Dexie スキーマ（v1 案）

```ts
db.version(1).stores({
  cards:            'id, &nameNorm, passcode, konamiId, deletedAt',
  stores:           'id, kind, favorite, archivedAt, [deletedAt+name]',
  wishItems:        'id, &cardId, priority, createdAt, deletedAt',
  priceObservations:'id, cardId, storeId, observedAt, [cardId+storeId+observedAt], [storeId+observedAt]',
  purchases:        'id, itemType, cardId, releaseId, storeId, status, purchasedAt, category, [purchasedAt+category], [status+expectedAt]',
  budgets:          'id, &month',
  budgetCategories: 'id, &[month+category]',
  setReleases:      'id, releaseDate, name, preorderAt, deletedAt',
  reminders:        'id, releaseId, remindAt',
  settings:         'id',
});
```

# 5. 主要な計算（domain 層の純関数）

| 関数 | 仕様 |
| --- | --- |
| `monthRange(month)` | 月初 00:00〜翌月初 00:00（**Asia/Tokyo 固定**） |
| `remainingQty(wish, purchases)` | `max(0, qtyWanted - Σ(単品 qty + 開封加算))` |
| `latestPrice(observations)` | `cardId × storeId` ごとの最新値のマップ |
| `bestStore(latestPrices)` | 最安の店舗と価格。同額なら `favorite` 優先 |
| `effectiveUnitPrice(purchase, packsPerBox)` | BOX → 1 パック換算、パック → そのまま、単品 → 単価 |
| `budgetSummary(limit, purchases, categories)` | 支出・予約枠・残額・消化率・カテゴリ別 |
| `dueReminders(reminders, today)` | `remindAt <= today` かつ未完了のもの |
| `packsPerBox(release, settings)` | 商品値 → 設定既定値の順で解決 |
| `typeGroup(card)` | `cardType` から `monster(1) / extra(2) / spell(3) / trap(4) / other(5)` を導出（融合・シンクロ・エクシーズ・リンクは extra） |
| `patrolOrder(items, mode)` | `priority`: 優先度昇順→追加順。`typeName`: `typeGroup` → 名前（`nameKana` 優先、`Intl.Collator('ja', {numeric:true})`）の順 |

# 6. データ保全

- エクスポート: 全テーブルを 1 つの JSON（`{ schemaVersion, exportedAt, tables }`）。`dexie-export-import` の形式を利用
- インポート: スキーマバージョンを検査し、未知の新しいバージョンは拒否。確認ダイアログ 2 段階
- 削除: 物理削除は「データ全削除」のみ。通常操作は `deletedAt` セット

# 7. 移行メモ（旧モデルからの変更点）

- `cardPrints`（型番）を廃止 → `cards` に統合。既存の型番は「レアリティ」ラベルとして価格・購入へ退避
- `priceObservations.printId` → `cardId`
- `purchases.printId` → `cardId`（単品）/ `releaseId`（シール品）
- 新規: `reminders`、`setReleases` の定価・パック数・予約開始日、`settings.defaultPacksPerBox`
- 実装前なのでデータ移行は不要。仕様の読み替えのみ
