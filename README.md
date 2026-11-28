# wantandwallet

遊戯王 OCG のシングル買い（店舗巡回・価格比較・購入記録・月次予算）と新弾（定価・予約）を管理する個人用 PWA。

- 対象: 遊戯王 OCG（日本語）
- カードの単位: **カード名**（再録・イラスト違いは同一。レアリティは任意ラベル）
- 新弾: **定価（パック/BOX）と 1BOX のパック数**を管理。店舗別価格比較はしない
- 形態: インストール型 PWA（iOS / Android）
- データ: 端末内保存（IndexedDB）。同期は将来対応
- リポジトリ: https://github.com/nsmr0604/wantandwallet

> **非公式について**: 本プロジェクトは個人が制作する非公式ツールです。株式会社コナミデジタルエンタテインメントおよび権利者とは一切関係ありません。「遊戯王」は説明のために用いている名称であり、公式・公認を意味しません。カードデータは外部の公開データセットを利用しています。

## ドキュメント

文書の書き方（arc42 / C4 / ADR / UML）は [docs/00-doc-standards.md](docs/00-doc-standards.md) に定めています。

| ファイル | 内容 |
| --- | --- |
| [docs/00-doc-standards.md](docs/00-doc-standards.md) | ドキュメント規約（フレームワーク・UML・更新義務） |
| [docs/01-requirements.md](docs/01-requirements.md) | 要件定義（機能・非機能・受入基準） |
| [docs/02-tech-stack.md](docs/02-tech-stack.md) | 技術選定・C4 構成・データ取り込み |
| [docs/03-data-model.md](docs/03-data-model.md) | データモデル（ER・スキーマ・計算） |
| [docs/04-roadmap.md](docs/04-roadmap.md) | ロードマップとマイルストーン |
| [docs/05-decisions.md](docs/05-decisions.md) | 決定事項ログ（ADR）・未決事項 |
| [docs/06-process.md](docs/06-process.md) | 開発プロセス（モックアップ型 × スパイラル型） |
| [docs/07-wireframes-s0.md](docs/07-wireframes-s0.md) | 画面遷移（状態遷移図）とワイヤー |
| [docs/08-deployment.md](docs/08-deployment.md) | Cloudflare Pages へのデプロイ・エージェント設定 |
| `mockups/s0/` | S0 の L1 モック（Svelte・表示専用） |

## 現在のステータス

- フェーズ: **S2（巡回・価格・比較）実装済み — S3 準備**
- 公開 URL: **https://wantandwallet.nsmr0604.workers.dev**
- 画面設計: S0 モック v0.3 承認済み（`mockups/s0/`）
- 実装: 店舗マスタ（追加・お気に入り・訪問・アーカイブ・**実在店舗検索**）、欲しいリスト、巡回モード（優先度/種類順・テンキー・レアリティ）、価格記録、比較表（カード別/店舗別）
- 店舗検索データ: Konami カードゲームネットワークから取得（`npm run fetch:shops`、**git 管理外**）
- 未了: 購入・予約・予算（S3）、カードマスタ取り込み（S4）、新弾（S5）、バックアップ（S6）

## 開発

```powershell
npm install
npm run dev      # http://localhost:5173（実機は http://<PCのIP>:5173）
npm run check    # 型検査（svelte-check）
npm run test     # 単体テスト（Vitest）
npm run build    # 本番ビルド（PWA の SW も生成）
npm run preview  # ビルド成果物の確認
```

## 構成

```
src/
  routes/          9 画面（ホームのみ実データ、他は S1 以降）
  lib/
    components/    TabBar / ComingSoon
    domain/        型・純関数（予算・パック換算・並び順）＋テスト
    db/            Dexie スキーマ・初期設定
    repositories/  カード・欲しいリストの入出力
    router.svelte.ts
public/            favicon / icon（PWA）
docs/              仕様・設計（正）
mockups/s0/        画面設計モック（Svelte・表示専用）
.github/workflows/ CI（check / test / build）
```


## ナレッジ

開発中に得た知見は OKF 形式で `knowledge/` に置きます。**個人用メモのため git 管理外**（`.gitignore`）です。
