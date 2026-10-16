# TAM-MCP-Server audit and upgrade plan

Last verified: 2026-10-16. See [DATA_SOURCE_STATUS.md](DATA_SOURCE_STATUS.md) for provider-specific findings and [MCP_FEATURE_STATUS.md](MCP_FEATURE_STATUS.md) for protocol status.

## Completed in this upgrade

- Removed production fallback records that claimed invented markets, sizes, segments, forecasts, and opportunities. Catalog-backed tools now report that the operation is unavailable.
- Implemented FRED series search and observation-based freshness, plus a direct World Bank indicator query.
- Corrected BLS, Census, and ExchangeRate request routing and error handling; removed a hard-coded Census CBP year.
- Upgraded the MCP SDK to 1.32.1 and the Docker runtime to Node.js 22. Updated Axios and Express; the production dependency audit reports zero vulnerabilities.
- Advertised supported MCP capabilities, added three documentation resources, corrected progress-token handling, and removed fabricated cache and provider notifications.
- Updated deployment, API key, notification, and architecture documentation. The container builds, negotiates MCP protocol `2025-11-25`, and the default test suite passes 232 tests across 21 files.

## Remaining enhancements

1. Integrate an authoritative, licensed market-data catalog and a documented sizing methodology. Free public APIs provide observations but do not supply a complete normalized industry, segment, competitor, or opportunity catalog.
2. Expose each measure's unit, geography, period, source, and calculation assumptions. Do not treat Census employment or World Bank GDP as market size without a defined model.
3. Modernize adapters with runtime dataset/year selection, pagination, bounded retries, response validation, and provider-specific quota handling. The IMF and OECD adapters need special attention because their previous endpoints are unreliable or obsolete.
4. Add live provider contract checks and end-to-end notification tests using a real MCP client. The default suite uses mocks; excluded legacy and live tests require separate modernization.
5. Migrate to the MCP `2026-07-28` protocol and TypeScript SDK v2 as a dedicated compatibility project, including notification subscriptions, transport changes, and conformance tests.
6. Refresh aging development tooling and resolve its remaining audit advisories. The deployed production dependency tree is clean, but the full development tree is not.
7. Review HTTP authentication and audience validation before exposing the server outside a trusted local network.
