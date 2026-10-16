# Working on TAM-MCP-Server

This repository exposes economic observations and input-based market calculations through MCP. Preserve the distinction between provider facts, calculation assumptions, and features that have no real data source.

## Start with maintained state

Read [DATA_SOURCE_STATUS.md](DATA_SOURCE_STATUS.md) for provider findings and [MCP_FEATURE_STATUS.md](MCP_FEATURE_STATUS.md) for protocol/test coverage. Consult [API_KEY_SETUP.md](API_KEY_SETUP.md) when credentials are involved and [AUDIT_AND_UPGRADE_PLAN.md](AUDIT_AND_UPGRADE_PLAN.md) for outstanding work. These documents are dated snapshots; historical deployment reports are not proof of current health.

As of the 2026-10-16 uplift, the project uses MCP SDK 1.32.1, Node.js 22 in Docker, 28 tool definitions, 15 prompts, and 9 resources. Verify these against code before changing or repeating them. The default suite passed 232 tests, including placeholders; that count is not a claim of complete live coverage.

## Repository map

- `src/server.ts`: MCP initialization instructions, handlers, descriptions, and documentation resources.
- `src/tools/tool-definitions.ts`: tool schemas and definitions; `src/tools/market-tools.ts`: analytical handlers.
- `src/services/DataService.ts`: runtime provider routing and unavailable catalog operations.
- `src/services/datasources/`: provider adapters. Follow imports before editing; similarly named duplicate and legacy files exist.
- `src/http.ts`, `src/stdio-simple.ts`, `src/sse-new.ts`: Streamable HTTP, STDIO, and legacy SSE entry points.
- `src/notifications/`: progress and TAM extension notifications.
- `config/vitest.config.ts`, `tests/setup.ts`: test exclusions and shared mocks; inspect them before interpreting a passing test.

## Data and protocol rules

- Never replace unavailable data with fabricated markets, segments, forecasts, competitors, cache statistics, or provider-health claims. Fixtures belong in tests; runtime failures must remain explicit, including MCP `isError` when appropriate.
- A key being present is a configuration fact. It does not prove that the key is valid, a paid endpoint is entitled, or a provider is healthy. A successful upstream probe does not prove the MCP route works.
- Employment, payroll, GDP, company market capitalization, and TAM are different measures. Preserve units, geography, observation date, source, and calculation assumptions; label defaults as examples.
- Cache entries retain their original provider provenance and observation time. Do not label a cache response as a fresh upstream observation without evidence.
- Catalog-backed industry search, sizing, segmentation, forecasts, and opportunities remain unavailable. Premium provider key names in `.env.example` do not imply implemented adapters.
- MCP clients learn state through initialization instructions, tool descriptions, and `tam://data-source-status`, `tam://mcp-status`, and `tam://api-key-setup`. This file and `.agents/skills` guide repository agents and are not transmitted to remote clients.
- When resource paths change, update `src/server.ts`, `.dockerignore`, and `package.json` packaging together. Verify the files exist in the deployable artifact.
- Standard progress needs the client's progress token. TAM-specific notifications are extensions; they must not replace the authoritative tool result or include keys/raw request configuration.

## Verification and local operation

Use the locked dependency graph (`npm ci --ignore-scripts`), then `npm run build` and relevant tests. `npm test` runs the configured suite, which excludes live-provider and some legacy tests. `npm run test:live` currently inherits that exclusion. Notification end-to-end tests contain placeholders. Report those limits; use a real MCP client for transport claims.

The runtime Docker image contains production dependencies only. Run unit tests locally with development dependencies or in an isolated Node.js 22 container. Do not install test tooling into the long-running service just to run tests.

For an authorized deployment, use `docker compose build` and `docker compose up -d`. The `tam-mcp-server` service exposes `/health` and `/mcp` on port 3000 with `restart: unless-stopped`. Documentation is copied into the image, so documentation-resource updates need a rebuild. Run `docker compose exec -T tam-mcp-server node scripts/verify-mcp-discovery.mjs` to verify client guidance and status resource reads. `scripts/validate-datasources.mjs` calls providers directly and has known differences from runtime routes; it is not an MCP end-to-end test.

Keep `.env` local and ignored. Check key presence without printing values; avoid `docker compose config` in shared output because it expands secrets. Provider error objects and URLs may also contain keys.

Keep the maintained status documents aligned with observed evidence and remaining gaps. Commit/push/restart actions should follow the user's current authorization; this file does not grant new authority. Use the current branch and inspect the worktree rather than assuming a branch name.

## Task-specific skills

- [tam-mcp-verify](.agents/skills/tam-mcp-verify/SKILL.md): audit what works, trace real data, and report verification limits.
- [tam-mcp-provider](.agents/skills/tam-mcp-provider/SKILL.md): add or migrate providers and correct source routing or data semantics.
- [tam-mcp-upgrade](.agents/skills/tam-mcp-upgrade/SKILL.md): change SDK/dependencies, transports, resources, notifications, or Docker packaging.
