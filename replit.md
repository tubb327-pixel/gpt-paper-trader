# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

- **GPT Paper Trader Dashboard** (`artifacts/dashboard`) — React + Vite dark dashboard at `/`. Polls 8 endpoints via `/dashboard-proxy/*` every 5s. Requires `DASHBOARD_API_TOKEN` secret.
- **API Server** (`artifacts/api-server`) — Express 5 server at `/api` and `/dashboard-proxy`. Proxies dashboard requests to the upstream host configured via `DASHBOARD_UPSTREAM_URL` (defaults to `https://snipesatbig.tubbsgrabberbrah.us`) with the bearer token.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
