# API key setup

Status verified on 2026-10-16. API keys belong in the local `.env` file, which is ignored by Git. Do not add real values to `.env.example`, Docker images, documentation, or issue reports.

## Current providers

| Provider | Environment variable | Key requirement | Current server status |
|---|---|---|---|
| FRED | `FRED_API_KEY` | Free key required | Live calls verified |
| Census Bureau | `CENSUS_API_KEY` | Free key required by current Census policy | Adapter works; configured key was rejected during the latest check |
| BLS | `BLS_API_KEY` | Free registration key; limited public access may work without one | `.env` currently contains the example placeholder, so authenticated calls fail |
| Alpha Vantage | `ALPHA_VANTAGE_API_KEY` | Free key available | Key is accepted, but some fundamentals endpoints used by this server now require a paid plan |
| Finnhub | `FINNHUB_API_KEY` | Free developer tier available | Live quote check verified |
| Nasdaq Data Link | `NASDAQ_DATA_LINK_API_KEY` | Account key; individual datasets may require subscriptions | Requests are currently blocked by provider bot protection |
| ExchangeRateAPI | `EXCHANGE_RATE_API_KEY` | Optional | Authenticated key supported; public fallback also works |
| CoinGecko | `COINGECKO_API_KEY` | Optional | Public endpoint verified |
| World Bank | None | No key | Live calls verified |
| OECD | None | No key | Reachable; dataset endpoint/parser needs modernization |
| IMF | None | No key | Legacy adapter endpoint needs replacement; current calls are unavailable |

## Minimal `.env`

```dotenv
FRED_API_KEY=
CENSUS_API_KEY=
BLS_API_KEY=
ALPHA_VANTAGE_API_KEY=
FINNHUB_API_KEY=
NASDAQ_DATA_LINK_API_KEY=
EXCHANGE_RATE_API_KEY=
COINGECKO_API_KEY=

CENSUS_CBP_YEAR=2022
CACHE_TTL=300
CACHE_CHECK_PERIOD=600
MCP_NOTIFICATIONS_ENABLED=true
USE_MOCK_DATA=false
```

Blank optional values must not contain inline comments. Use this:

```dotenv
COINGECKO_API_KEY=
```

not this:

```dotenv
COINGECKO_API_KEY= # optional
```

## Validate from Docker

```bash
docker compose up -d --build
docker compose exec -T tam-mcp-server node scripts/validate-datasources.mjs
curl http://localhost:3000/health
```

Provider connectivity does not make the market-sizing tools authoritative. Free public APIs supply economic, employment, company, and financial observations. The industry search, market segmentation, forecasting, opportunity, and source-derived TAM tools remain unavailable until a real catalog/methodology layer is implemented. Input-based TAM and SAM arithmetic tools continue to work and identify their assumptions.

## Premium sources

`IBISWORLD_API_KEY`, `STATISTA_API_KEY`, `GRAND_VIEW_RESEARCH_API_KEY`, `BLOOMBERG_API_KEY`, and `PITCHBOOK_API_KEY` appear only as commented examples in `.env.example`. There are no corresponding server adapters, configured subscriptions, or successful live tests. Do not add a key expecting those sources to become available. Nasdaq Data Link paid datasets and Alpha Vantage paid endpoints have also not been verified with paid access. See [DATA_SOURCE_STATUS.md](DATA_SOURCE_STATUS.md) for the exact last observed behavior.
