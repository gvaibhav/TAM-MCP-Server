---
name: tam-mcp-upgrade
description: Upgrade TAM-MCP-Server SDK or dependencies, change MCP transports/resources/notifications, and verify Docker or npm packaging. Use for protocol and runtime maintenance rather than provider endpoint implementation.
---

# Maintain the TAM MCP runtime

Read [AGENTS.md](../../../AGENTS.md) and [MCP_FEATURE_STATUS.md](../../../MCP_FEATURE_STATUS.md). Inspect `package.json`, the lockfile, `Dockerfile`, and active imports; the recorded SDK and Node versions are a snapshot, not a directive to keep obsolete versions.

## Make the compatibility boundary explicit

Separate the npm SDK version, negotiated MCP revision, application version, and runtime version in reasoning and reports. Consult official SDK and protocol migration documentation before changing transport or notification APIs. Do not assume a dependency bump implements a newer protocol revision or its extensions.

The current server uses the low-level SDK `Server`, session-based Streamable HTTP, an in-memory event store, STDIO, and a legacy SSE transport. Trace `src/server.ts` and the transport entry points together when changing lifecycle behavior. Preserve MCP `isError` semantics, schema defaults, and client negotiation behavior.

Use standard initialization `instructions` to direct clients to status resources, and retain a status pointer in tool descriptions for hosts that primarily expose tools. Repository `AGENTS.md` and skills do not reach remote clients automatically. Key-presence checks and `/health` do not establish upstream availability.

## Notifications and resources

Require a client progress token for standard progress notifications. Keep TAM extension methods documented as custom, and use actual measured events for cache/health messages. Avoid duplicating full provider results or request secrets in notifications. Unit tests with a mocked notification sender do not prove client delivery.

For each advertised documentation resource, check its read handler, source file, `.dockerignore` exceptions, and `package.json` `files` allowlist. `npm pack --dry-run --ignore-scripts --json` can reveal missing package resources. Run this in a development install: the tested npm version still ran `prepare` during this command, and the pruned runtime image has no compiler. Docker success does not imply an npm installation contains those files. Skills and repository instructions need not be shipped to runtime clients.

## Verify the artifact being shipped

Use the committed lockfile. For dependency changes, build and run the relevant suite, inspect both production and development audit results, and explain outstanding advisories by dependency scope. Prefer reviewed version changes to an unexamined force upgrade.

The runtime image is pruned to production dependencies and excludes tests. Run tests in a development install or isolated Node container. Rebuild the image when code or runtime documentation changes, and recreate the service only when deployment is in scope. Do not remove unrelated containers, volumes, or data.

Run `scripts/verify-mcp-discovery.mjs` against the deployed HTTP endpoint to check initialization instructions, tool discovery pointers, and real resource reads. For changed tool or notification behavior, add the relevant client interaction; the discovery check itself makes no provider calls and does not test notification delivery.

Record the actual negotiated revision and tested paths in `MCP_FEATURE_STATUS.md` and the README verification summary. Keep provider status in `DATA_SOURCE_STATUS.md`; do not repeat a successful process health check as proof that all tools work.
