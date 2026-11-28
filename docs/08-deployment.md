---
title: wantandwallet デプロイ（Cloudflare）
version: 0.2
status: draft
updated: 2026-11-28
---

# 1. 構成

- ホスティング: **Cloudflare（Pages の最新版 = Workers 上の静的アセット）**
- URL: **https://wantandwallet.nsmr0604.workers.dev**
- プロジェクト名: `wantandwallet`
- 設定: `wrangler.jsonc`（assets の SPA フォールバック、observability）
- ビルド: `npm run build`（`@cloudflare/vite-plugin` が `dist/wrangler.json` を生成）
- ルーティング: ハッシュ（`#/wish`）なので追加のリダイレクト不要

# 2. デプロイ

```powershell
npm run deploy    # build → wrangler deploy
```

- 初回のみ `wrangler login`（OAuth）
- `wrangler.jsonc` が正で、`wrangler deploy` が assets をアップロードする
- 旧 Pages 直デプロイ（`wrangler pages deploy`）は不要。互換のため残すなら `--force` が要る

# 3. CI からデプロイ（将来）

`main` への push で自動デプロイする場合、GitHub リポジトリに次の Secrets を登録する。

- `CLOUDFLARE_API_TOKEN`（Workers Scripts:Edit / Pages:Edit）
- `CLOUDFLARE_ACCOUNT_ID`

```yaml
- run: npm ci
- run: npm run build
- uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    command: deploy
```

# 4. エージェント環境（Cloudflare 公式セットアップ）

`https://developers.cloudflare.com/agent-setup/prompt.md` の OpenCode 向け手順に沿って設定済み。

| 項目 | 内容 |
| --- | --- |
| Skills | `npx -y skills add cloudflare/skills --skill '*' --yes --global` → `~/.agents/skills` |
| MCP | `~/.config/opencode/opencode.json` の `mcp.servers.cloudflare`（`https://mcp.cloudflare.com/mcp`, OAuth） |
| 認証 | `opencode-cli mcp auth cloudflare` → 完了（`Connected to cloudflare`） |
| 反映 | MCP は**エージェント再起動後**に利用可能（3053 ツール） |

# 5. 確認

- デプロイ URL にアクセスし、9 画面の遷移と設定の表示を確認
- iOS/Android で「ホーム画面に追加」→ 機内モードで再起動
- Lighthouse で PWA インストール可能・Service Worker 有効を確認
