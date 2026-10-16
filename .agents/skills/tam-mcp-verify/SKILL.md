---
name: tam-mcp-verify
description: Verify TAM-MCP-Server functionality, trace provider data through MCP, and document exactly what is working, blocked, mocked, or untested. Use for functionality audits, regression checks, or readiness reports.
---

# Verify TAM MCP behavior

Use this skill from the repository root. Read [AGENTS.md](../../../AGENTS.md), [DATA_SOURCE_STATUS.md](../../../DATA_SOURCE_STATUS.md), and [MCP_FEATURE_STATUS.md](../../../MCP_FEATURE_STATUS.md) for scope and known limits. Treat recorded checks as dated evidence.

## Choose evidence that answers the request

Distinguish these observations in the report:

- A build or unit test passed: implementation compiled or behaved correctly with the test's mocks.
- A direct provider request returned data: the upstream endpoint accepted that request.
- A real MCP tool call returned correct data: discovery, validation, routing, provider response, and serialization worked for the specific parameters.
- A response was served from cache: provenance and observation time must still be checked; it does not demonstrate current upstream access.
- A provider error was correctly surfaced: error handling passed, but the provider is not thereby working.

Inspect `config/vitest.config.ts` and `tests/setup.ts` before making coverage claims. The default suite excludes live and legacy tests; the live npm script currently uses the same exclusions. Placeholder notification tests and private-handler tests do not establish real transport behavior.

## Client and provider checks

Run `npm run test:mcp-discovery -- http://127.0.0.1:3000/mcp` against a running service, or `docker compose exec -T tam-mcp-server node scripts/verify-mcp-discovery.mjs`. This helper uses an SDK client to initialize, find status guidance in tool descriptions, read the three status resources, and close its session. It does not make provider calls or validate the truth of those documents.

For a live tool check, use the discovered input schema, call the tool through the SDK client, and inspect `isError` as well as content. Pick a small request that exercises the relevant route. Compare returned values, units, geography, and observation dates with the provider response; account for publication lag and revisions. Count only the paths actually checked.

Use `scripts/validate-datasources.mjs` only as a direct connectivity aid. It uses its own requests: its IMF probe differs from the legacy runtime adapter, its OECD probe may accept endpoint errors as reachability, and its ExchangeRate check uses the public endpoint. It cannot prove paid access or MCP routing.

If testing caching, establish the first upstream response and the repeated request separately. Do not infer a cache hit solely from a faster response or fabricate metrics. Use targeted cache isolation or instrumentation when the task warrants it.

Missing credentials or subscriptions leave successful data retrieval unverified. Test the failure path when relevant, record the exact constraint, and continue independent checks. Never substitute mock success for unavailable licensed data.

## Record the result

Update the relevant maintained status document with date, execution layer, endpoint/tool and parameters, outcome, and remaining verification. Include enough evidence to reproduce a check without keys or raw request configuration. Separate production dependency audit results from development-tool advisories.

Run only checks justified by the change. A documentation-only correction generally needs link/path and diff checks; provider routing changes need contract/error tests and an actual MCP call when access is available. Existing user authorization governs any rebuild, deployment, or push.
