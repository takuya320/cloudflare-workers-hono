# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, Cursor, Codex, etc.) when working with code in this repository.

## Project Overview

Cloudflare Workers API built with the Hono web framework and TypeScript. The app exposes REST endpoints with middleware for request IDs, logging, and CORS.

## Commands

```bash
pnpm run dev      # Start local dev server (wrangler dev)
pnpm run deploy   # Deploy to Cloudflare Workers
pnpm test         # Run all tests (vitest run)
pnpm run lint     # Lint and format with Biome (auto-fix)
pnpm run check    # Lint and format check without modifying files
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

Biome config (`biome.json`): no semicolons, single quotes, trailing commas. Biome is the only linter/formatter (no ESLint or Prettier).

CI runs `pnpm check` and `pnpm test` on pushes/PRs to `main`.

## Conventions

Solo project: no external contributors are expected, so these rules exist for consistency, not onboarding.

**Branches**: changes to `main` go through a PR. Name branches `<type>/<short-description>` (e.g. `feat/task-pagination`), with `type` matching the commit type.

**Commits**: Conventional Commits, in English.

- Types: `feat` / `fix` / `docs` / `test` / `refactor` / `chore` / `ci` / `build`
- Subject: imperative, lowercase, ≤72 chars, no trailing period
- Body explains **why**, not what (the diff shows what)
- Breaking changes: `type!:` plus a `BREAKING CHANGE:` line in the body
- One purpose per commit

**Pull requests**: one purpose per PR; title in the same format as a commit subject; description follows `.github/pull_request_template.md` (Japanese is fine). CI (`pnpm check` and `pnpm test`) must pass before merging.

**Code comments**: English, and only for **why** and **why not**: non-obvious constraints, workaround reasons, deliberate behavior, and improvements knowingly skipped, with the reason (e.g. "~300 rows and a one-off script, so the N+1 is acceptable"). Express what the code does through naming and types. `TODO` / `FIXME` carry a reason or issue number; use `FIXME` when knowingly taking on technical debt.

**Tests**: test behavior, not implementation; cover error paths; inject time and randomness so tests stay deterministic.

**Security**: secrets only via environment variables (`.dev.vars` locally); validate all input server-side with Zod. Vulnerability reports: see `SECURITY.md`.

## Cloudflare Workers

Config in `wrangler.toml`. Currently minimal — no bindings (KV, R2, D1) are active, but commented-out templates exist for adding them.

Local env variables go in `.dev.vars` (gitignored).
