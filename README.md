# cloudflare-workers-hono

[![Test](https://github.com/takuya320/cloudflare-workers-hono/actions/workflows/test.yml/badge.svg)](https://github.com/takuya320/cloudflare-workers-hono/actions/workflows/test.yml)
[![Audit](https://github.com/takuya320/cloudflare-workers-hono/actions/workflows/audit.yml/badge.svg)](https://github.com/takuya320/cloudflare-workers-hono/actions/workflows/audit.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

[Hono](https://hono.dev/) と TypeScript で実装した [Cloudflare Workers](https://developers.cloudflare.com/workers/) 向けの REST API です。

## Overview

- Workers 上で Hono アプリを動かすための最小構成のリファレンス実装
- リクエスト ID・ロギング・CORS・グローバルエラーハンドリングといった共通処理を備える

## Architecture

| 区分 | 使用技術 |
| --- | --- |
| 実行環境 | Cloudflare Workers |
| Web フレームワーク | Hono |
| バリデーション | Zod / `@hono/zod-validator` |
| テスト | Vitest（Hono の `app.request()` による結合テスト） |
| Lint / Format | Biome |
| パッケージマネージャー | pnpm |

```text
src/
├── index.ts        # エントリポイント（ミドルウェア、ルート定義、グローバルエラーハンドラ）
├── index.test.ts   # アプリ全体のテスト
├── auth/           # Bearer トークン認証のミドルウェアと、認証が必要なルート
├── error/          # ApiError（クライアント向け/内部向けメッセージを分離したエラー）
└── <feature>/      # 機能ごとのルートモジュール（例: sample/, task/）
```

各ルートモジュールは Hono インスタンスを export し、`src/index.ts` で `/api` 配下に `app.route()` でマウントします。`@/` は `src/` へのパスエイリアスです。

`src/index.ts` では、公開ルート（`/`、`/health`、`/api/sample`、`/api/task`）を先に登録し、その後ろで認証ミドルウェアを `app.use('*', ...)` します。Hono はハンドラーを登録順に実行するため、認証が必要になるのはミドルウェアより後ろに登録したルートだけです。未定義のパスも認証前は 401 を返し、ルートの有無を教えません。

> **注意**: CORS は `http://localhost:3000` のみ許可しています（`src/index.ts`）。別のオリジンからアクセスする場合は設定の変更が必要です。

## Getting Started

### 前提条件

- Node.js 26.13.0 / pnpm 10.14.0（`package.json` の `engines` で固定）

### セットアップと起動

```bash
pnpm i
pnpm run dev
```

`http://localhost:8787` で起動します。動作確認:

```bash
curl http://localhost:8787/health
# => OK
```

### 認証用トークンの設定

`/api/auth` 配下は `Authorization: Bearer <token>` が必要です。トークンはシークレット `API_TOKENS` に `名前:トークン` をカンマ区切りで設定します（トークンにコロンを含めても構いませんが、名前には含められません）。未設定や形式不正の場合は、認証なしで通さず 500 を返します。

```bash
# ローカル: .dev.vars（gitignore 済み）
echo 'API_TOKENS=alice:local-dev-token' > .dev.vars

curl -H 'Authorization: Bearer local-dev-token' http://localhost:8787/api/auth/me
# => {"clientName":"alice"}

# 本番
pnpm exec wrangler secret put API_TOKENS
```

## Development

| コマンド | 内容 |
| --- | --- |
| `pnpm run dev` | ローカル開発サーバー起動（`wrangler dev`） |
| `pnpm test` | テスト実行（`vitest run`） |
| `pnpm run check` | Lint / フォーマットの検査のみ（`biome check .`） |
| `pnpm run lint` | Lint / フォーマットの自動修正（`biome check --write .`） |

スタイルは `biome.json` で定義されています（シングルクォート、セミコロンなし、末尾カンマあり）。コミット前に `pnpm run check` と `pnpm test` が通ることを確認してください。

## Deployment / Operations

```bash
pnpm run deploy
```

`wrangler deploy` で Cloudflare Workers へデプロイします。事前に `wrangler login` などで Cloudflare アカウントへの認証が必要です。Worker 名と設定は `wrangler.toml` を参照してください。

### CI

GitHub Actions で次を実行しています（`.github/workflows/`）。

| ワークフロー | 内容 | トリガー |
| --- | --- | --- |
| `test.yml` | `pnpm check` と `pnpm test` | `main` への push / PR |
| `audit.yml` | `pnpm audit --audit-level=high` による依存関係の脆弱性チェック | `main` への push / PR、毎週月曜 |

依存関係の更新は Dependabot（週次）が PR を作成します。

## References

- [Hono](https://hono.dev/docs/) — フレームワークのドキュメント
- [Cloudflare Workers](https://developers.cloudflare.com/workers/) — 実行環境のドキュメント
- [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/) — `wrangler.toml` のリファレンス
- [Biome](https://biomejs.dev/) — Lint / Formatter

## License

[MIT](./LICENSE)
