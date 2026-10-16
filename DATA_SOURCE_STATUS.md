# Data-source status

Last verified: 2026-10-16 from the Docker container. These are direct API connectivity observations and adapter findings, not a passing end-to-end test of every MCP tool. The default automated suite uses mocks. See the [README verification summary](README.md#verification-status-2026-10-16).

| Source | Last observation | MCP tool or adapter limit | What remains to verify |
|---|---|---|---|
| World Bank | Live indicator data returned | Direct indicator path exists | End-to-end MCP tool call and more indicator types |
| FRED | Live series data returned with free key | Direct series path and search exist | End-to-end MCP tool call, quota and error cases |
| Finnhub | Live quote returned in provider check | Free-tier limits apply | Wire and verify an MCP tool route; test other endpoints |
| CoinGecko | Public cryptocurrency data returned | Key optional | Wire and verify an MCP tool route; test authenticated tier |
| ExchangeRateAPI | Public exchange-rate endpoint returned data | Adapter supports an optional key | Wire and verify an MCP tool route and authenticated requests |
| OECD | Endpoint reachable | Current dataset query/parser may return no records | Update SDMX identifiers and confirm a real observation through MCP |
| BLS | Configured value caused provider error | Adapter surfaces failure as MCP error | Valid free key or keyless access, then live data through MCP |
| Census | Configured key rejected | Adapter surfaces failure as MCP error | Valid free key, then live CBP data through MCP |
| Alpha Vantage | `OVERVIEW` returned a free-tier entitlement response | Adapter surfaces failure as MCP error | Verify eligible free endpoints; paid fundamentals require a subscription and have not been tested |
| Nasdaq Data Link | Request blocked by provider protection | No usable dataset returned | Confirm account access and dataset entitlement; paid datasets have not been tested |
| IMF | Legacy adapter endpoint obsolete | Calls fail explicitly | Migrate endpoint/dataflow and test a real observation through MCP |

## Licensed data sources

No IBISWorld, Statista, Grand View Research, Bloomberg, or PitchBook adapter is implemented in `src/`. Their names in `.env.example` are placeholders for possible future integrations. No paid keys or subscriptions were available for validation, so these sources are **not tested or working integrations**. Nasdaq paid datasets and Alpha Vantage paid endpoints are likewise **untested**. A licensed source would still need an adapter, entitlement checks, response mapping, and an MCP tool test before it could be called working.

## Correct interpretation

- FRED, World Bank, OECD, BLS, and Census provide economic or operational measures. Their values are not automatically market size or TAM.
- Census employment (`EMP`) is an employment count. Payroll (`PAYANN`) is reported in dataset-specific units. Neither should be labeled revenue.
- Alpha Vantage and Finnhub provide company/financial observations, not comprehensive private-market coverage.
- Free sources can support transparent bottom-up estimates, but every estimate must identify its measure, year, geography, source, assumptions, and confidence.
- The server no longer returns hard-coded industry sizes, segments, forecasts, players, or opportunities. Unsupported catalog-backed tools fail explicitly.

Run the current health check with:

```bash
docker compose exec -T tam-mcp-server node scripts/validate-datasources.mjs
```
