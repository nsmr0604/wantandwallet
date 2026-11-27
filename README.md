# wantandwallet

遊戯王 OCG のシングル買い（店舗巡回・価格比較・購入記録・月次予算）を管理する個人用 PWA。

- 対象: 遊戯王 OCG（日本語）
- 形態: インストール型 PWA（iOS / Android）
- データ: 端末内保存（IndexedDB）。同期は将来対応
- リポジトリ: https://github.com/nsmr0604/wantandwallet

> **非公式について**: 本プロジェクトは個人が制作する非公式ツールです。株式会社コナミデジタルエンタテインメントおよび権利者とは一切関係ありません。「遊戯王」は説明のために用いている名称であり、公式・公認を意味しません。カードデータは外部の公開データセットを利用しています。

## ドキュメント

| ファイル | 内容 |
| --- | --- |
| [docs/01-requirements.md](docs/01-requirements.md) | 要件定義（機能・非機能・受入基準） |
| [docs/02-tech-stack.md](docs/02-tech-stack.md) | 技術選定と構成 |
| [docs/03-data-model.md](docs/03-data-model.md) | データモデル設計 |
| [docs/04-roadmap.md](docs/04-roadmap.md) | ロードマップとマイルストーン |
| [docs/05-decisions.md](docs/05-decisions.md) | 決定事項ログ・未決事項 |
| [docs/06-process.md](docs/06-process.md) | 開発プロセス（モックアップ型 × スパイラル型アジャイル） |
| [docs/07-wireframes-s0.md](docs/07-wireframes-s0.md) | S0 の画面遷移とワイヤー（L0）・レビュー観点 |
| `mockups/s0/` | S0 の L1 モック（Svelte・表示専用） |

## 現在のステータス

- フェーズ: **S0（基盤）— モック v0.1 提出済み・承認待ち**
- コード: モックのみ（実装はモック承認後）
- 進め方: モック承認 → 実装 → 実機評価（[docs/06-process.md](docs/06-process.md)）

## モックの見方（S0）

```powershell
cd mockups/s0
npm install     # 初回のみ
npm run dev     # 実機からは http://<PCのIP>:5180
```

- 実機（iPhone / Android）のブラウザで開く。PC の縮小表示では判断しない
- ヘッダー右の ☰ から全 9 画面に切り替えられる（モック専用メニュー）
- 表示専用。データは保存されない（リロードで初期状態に戻る）
- 確認観点と未決事項は [docs/07-wireframes-s0.md](docs/07-wireframes-s0.md) §3・§4
