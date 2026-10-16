# Data-source status

Last verified: 2026-10-16 from the Docker container.

| Source | Connectivity | Tool behavior | Notes |
|---|---|---|---|
| World Bank | Working | Returns real indicator observations | No key required |
| FRED | Working | Returns real series observations | Free key required |
| Finnhub | Working | Provider health check returns a live quote | Free-tier limits apply |
| CoinGecko | Working | Public cryptocurrency data available | Key optional |
| ExchangeRateAPI | Working | Authenticated endpoint with public fallback | Key optional |
| OECD | Degraded | Reachable, but current dataset queries may return no parsed records | Migrate queries to the current SDMX dataflow identifiers |
| BLS | Configuration blocked | Provider error is returned as an MCP error | Replace the placeholder key or remove it to use limited public access |
| Census | Configuration blocked | Invalid-key response is returned as an MCP error | Request/activate a valid free key |
| Alpha Vantage | Tier limited | Provider error is returned as an MCP error | The tested company-overview endpoint is not available to the configured free tier |
| Nasdaq Data Link | Provider blocked | Returns no usable records | Incapsula protection and dataset entitlements limit server-to-server access |
| IMF | Adapter obsolete | Calls fail explicitly | Replace the retired `dataservices.imf.org` integration with a current IMF API/dataflow |

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
