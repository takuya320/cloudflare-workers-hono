# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cloudflare Workers API built with the Hono web framework and TypeScript. The app exposes REST endpoints with middleware for request IDs, logging, and CORS.

## Commands

```bash
pnpm run dev      # Start local dev server (wrangler dev)
pnpm run deploy   # Deploy to Cloudflare Workers
pnpm test         # Run all tests (vitest run)
pnpm run lint     # Format code with Prettier
pnpm run check    # Check formatting without modifying files
```

Package manager is **pnpm** (v10.14.0). Use `pnpm i` to install dependencies.

## Architecture

**Entry point**: `src/index.ts` — Creates the Hono app, registers middleware (requestId, logger, CORS), defines root routes (`/`, `/health`), mounts sub-routers, and sets up global error handling.

**Route modules** are mounted under `/api`:

- `src/sample/index.ts` → `/api/sample` — Demo endpoints (timestamps, UUID generation, params, query strings, headers, error handling)
- `src/task/index.ts` → `/api/task` — Simple in-memory task CRUD

Each route module exports a Hono instance that gets mounted via `app.route()`.

**Testing**: Tests live in `src/index.test.ts`. Uses Vitest with Hono's `app.request()` for integration testing (no HTTP server needed).

## Code Style

Prettier config (in package.json): no semicolons, single quotes, trailing commas. No ESLint — Prettier is the only formatter.

CI runs `pnpm check` (formatting) and `pnpm test` on pushes/PRs to `main`.

## Cloudflare Workers

Config in `wrangler.toml`. Currently minimal — no bindings (KV, R2, D1) are active, but commented-out templates exist for adding them.

Local env variables go in `.dev.vars` (gitignored).
