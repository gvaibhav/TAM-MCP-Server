---
name: tam-mcp-provider
description: Implement or migrate TAM-MCP-Server data-source adapters, fix MCP provider routing, or correct source provenance and market-data interpretation. Use for provider/API changes rather than general dependency maintenance.
---

# Integrate a TAM data provider

Read [AGENTS.md](../../../AGENTS.md), [DATA_SOURCE_STATUS.md](../../../DATA_SOURCE_STATUS.md), and [API_KEY_SETUP.md](../../../API_KEY_SETUP.md). Inspect the source's existing imports and callers before choosing a file; the repository contains alternate and legacy adapter files that may not be active.

## Trace the actual route

Follow `src/tools/tool-definitions.ts` to the handler in `src/server.ts` or `src/tools/market-tools.ts`, then `src/services/DataService.ts` and the adapter in `src/services/datasources/`. A new adapter or health-check entry alone does not expose a working MCP tool. Inspect `getSpecificDataSourceData` and explicit routing switches when adding methods.

Verify the endpoint, authentication, dataset identifiers, pagination, and entitlements against current official provider documentation. Free API keys do not establish access to paid datasets. Read only the required environment-variable names or presence; never echo credentials or full Axios request objects.

An `.env.example` name is only a template. IBISWorld and the other suggested premium providers need actual implementations and authorized subscriptions before any working claim. Do not add guessed endpoints or bypass provider access restrictions.

## Preserve data meaning

Define what the endpoint measures before mapping it into a DTO. Census employment and payroll, World Bank GDP, financial statement values, and company market capitalization are not interchangeable with market revenue or TAM. Preserve source identifiers, units/scaling, geography, period, observation freshness, and assumptions.

Use provider facts as the source of truth. Caching may reuse those facts but must retain provenance and observation time. Example calculator inputs and mock responses must not become real provider output or fallback catalog records.

Keep unavailable catalog operations explicit until a real taxonomy, source, and calculation method support them. Economic indicators alone do not establish industry segments, competitors, forecasts, or opportunities.

## Implement and verify

Validate response shape and provider error bodies, including error payloads returned with HTTP 200. Handle missing observations without manufacturing zeros. Use bounded timeouts/retries and respect rate limits. Error messages should omit keys, tokens, request URLs containing credentials, and raw configuration.

Ensure adapter failures reach the MCP boundary as `isError: true` where appropriate. Test valid mapping, no-data responses, rejected credentials, entitlement limits, and parameter routing for the paths changed. Use the real MCP route for a small live check when credentials and quotas permit; a direct probe alone is insufficient.

Update the tool schema/description, configuration template, `API_KEY_SETUP.md`, and `DATA_SOURCE_STATUS.md` as applicable. Describe paid or inaccessible paths as unverified even when mocked tests pass. Refer to [tam-mcp-verify](../tam-mcp-verify/SKILL.md) when the task requires a broader live audit.
