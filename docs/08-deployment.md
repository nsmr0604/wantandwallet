---
title: wantandwallet デプロイ（Cloudflare Pages）
version: 0.1
status: draft
updated: 2026-11-28
---

# 1. 構成

- ホスティング: **Cloudflare Pages**
- プロジェクト名: `wantandwallet`
- ビルド: `npm run build`
- 出力: `dist/`
- 本番ブランチ: `main`
- ルーティング: ハッシュ（`#/wish`）なので `_redirects` は不要

# 2. ローカルからデプロイ

```powershell
npm run deploy          # build → wrangler pages deploy（main）
npm run deploy:preview  # build → プレビューデプロイ
```

初回のみ `wrangler login`（OAuth）が必要。
`wrangler` は devDependencies に含める（バージョン固定）。

# 3. CI からデプロイ（将来）

`main` への push で自動デプロイする場合、GitHub リポジトリに次の Secrets を登録する。

- `CLOUDFLARE_API_TOKEN`（Pages:Edit 権限）
- `CLOUDFLARE_ACCOUNT_ID`

ワークフロー例:

```yaml
- run: npm ci
- run: npm run build
- uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    command: pages deploy dist --project-name wantandwallet --branch main
```

# 4. エージェント環境（Cloudflare 公式セットアップ）

`https://developers.cloudflare.com/agent-setup/prompt.md` の OpenCode 向け手順に沿って設定済み。

| 項目 | 内容 |
| --- | --- |
| Skills | `npx -y skills add cloudflare/skills --skill '*' --yes --global` → `~/.agents/skills` |
| MCP | `~/.config/opencode/opencode.json` の `mcp.servers.cloudflare`（`https://mcp.cloudflare.com/mcp`, OAuth） |
| 認証 | `opencode-cli mcp auth cloudflare`（初回はブラウザで承認） |
| 反映 | MCP は**エージェント再起動後**に利用可能 |

# 5. 確認

- デプロイ URL にアクセスし、9 画面の遷移と設定の表示を確認
- iOS/Android で「ホーム画面に追加」→ 機内モードで再起動
- Lighthouse で PWA インストール可能・Service Worker 有効を確認
