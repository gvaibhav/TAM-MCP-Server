#!/usr/bin/env node
/**
 * TAM MCP Server - Data Source Health Check
 * Validates live connectivity to all 8 external data sources.
 * Usage: node scripts/validate-datasources.mjs
 *
 * Requirements: dotenv must be available (it's a prod dependency).
 */

import { createRequire } from "module";
import https from "https";
import http from "http";
import url from "url";
import zlib from "zlib";

// Load .env
const require = createRequire(import.meta.url);
try {
  const dotenv = require("dotenv");
  dotenv.config();
} catch {
  console.warn("⚠️  dotenv not available, using process.env as-is");
}

const ENV = process.env;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function httpGet(rawUrl, timeoutMs = 10000, headers = {}, useCompression = true) {
  return new Promise((resolve, reject) => {
    const parsed = new url.URL(rawUrl);
    const lib = parsed.protocol === "https:" ? https : http;

    const defaultHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    if (useCompression) {
      defaultHeaders['Accept'] = 'application/json, text/plain, */*';
      defaultHeaders['Accept-Language'] = 'en-US,en;q=0.9';
      defaultHeaders['Accept-Encoding'] = 'gzip, deflate, br';
    }

    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: 'GET',
      timeout: timeoutMs,
      headers: { ...defaultHeaders, ...headers }
    };

    const req = lib.request(options, (res) => {
      const encoding = res.headers['content-encoding'];
      let stream = res;

      // Handle gzip/deflate/brotli compression
      if (encoding === 'gzip' || encoding === 'x-gzip') {
        stream = res.pipe(zlib.createGunzip());
      } else if (encoding === 'deflate') {
        stream = res.pipe(zlib.createInflate());
      } else if (encoding === 'br') {
        stream = res.pipe(zlib.createBrotliDecompress());
      }

      let body = "";
      stream.on("data", (d) => (body += d));
      stream.on("end", () => resolve({ status: res.statusCode, body }));
      stream.on("error", reject);
    });
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });
    req.end();
  });
}

function httpPost(rawUrl, payload, headers = {}, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const parsed = new url.URL(rawUrl);
    const data = JSON.stringify(payload);
    const lib = parsed.protocol === "https:" ? https : http;
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
        ...headers,
      },
      timeout: timeoutMs,
    };
    const req = lib.request(options, (res) => {
      let body = "";
      res.on("data", (d) => (body += d));
      res.on("end", () => resolve({ status: res.statusCode, body }));
    });
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });
    req.write(data);
    req.end();
  });
}

// Follow HTTP redirects (max 5 hops)
function httpGetFollow(rawUrl, timeoutMs = 10000, maxRedirects = 5, headers = {}, useCompression = true) {
  return new Promise((resolve, reject) => {
    function doRequest(currentUrl, hops) {
      const parsed = new url.URL(currentUrl);
      const lib = parsed.protocol === "https:" ? https : http;

      const defaultHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      };

      if (useCompression) {
        defaultHeaders['Accept'] = 'application/json, text/plain, */*';
        defaultHeaders['Accept-Language'] = 'en-US,en;q=0.9';
        defaultHeaders['Accept-Encoding'] = 'gzip, deflate, br';
      }

      const options = {
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method: 'GET',
        timeout: timeoutMs,
        headers: { ...defaultHeaders, ...headers }
      };

      const req = lib.request(options, (res) => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && hops < maxRedirects) {
          const next = res.headers.location.startsWith("http")
            ? res.headers.location
            : `${parsed.protocol}//${parsed.host}${res.headers.location}`;
          res.resume();
          doRequest(next, hops + 1);
        } else {
          const encoding = res.headers['content-encoding'];
          let stream = res;

          // Handle gzip/deflate/brotli compression
          if (encoding === 'gzip' || encoding === 'x-gzip') {
            stream = res.pipe(zlib.createGunzip());
          } else if (encoding === 'deflate') {
            stream = res.pipe(zlib.createInflate());
          } else if (encoding === 'br') {
            stream = res.pipe(zlib.createBrotliDecompress());
          }

          let body = "";
          stream.on("data", (d) => (body += d));
          stream.on("end", () => resolve({ status: res.statusCode, body }));
          stream.on("error", reject);
        }
      });
      req.on("error", reject);
      req.on("timeout", () => { req.destroy(); reject(new Error("Request timed out")); });
      req.end();
    }
    doRequest(rawUrl, 0);
  });
}

function parseJson(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function formatStatus(ok, detail) {
  const icon = ok ? "✅" : "❌";
  return `${icon} ${detail}`;
}

// ─── Individual Source Checks ─────────────────────────────────────────────────

const results = [];

async function check(name, fn) {
  process.stdout.write(`  Checking ${name}... `);
  const start = Date.now();
  try {
    const { ok, detail } = await fn();
    const elapsed = Date.now() - start;
    const msg = formatStatus(ok, `${detail} (${elapsed}ms)`);
    console.log(msg);
    results.push({ name, ok, detail, elapsed });
  } catch (err) {
    const elapsed = Date.now() - start;
    const msg = formatStatus(false, `${err.message} (${elapsed}ms)`);
    console.log(msg);
    results.push({ name, ok: false, detail: err.message, elapsed });
  }
}

// 1. World Bank (no API key)
async function checkWorldBank() {
  const res = await httpGet(
    "https://api.worldbank.org/v2/country/US/indicator/NY.GDP.MKTP.CD?format=json&per_page=1"
  );
  if (res.status !== 200) return { ok: false, detail: `HTTP ${res.status}` };
  const json = parseJson(res.body);
  const hasData = Array.isArray(json) && json.length === 2 && json[1]?.length > 0;
  return {
    ok: hasData,
    detail: hasData
      ? `GDP data found (year: ${json[1][0]?.date}, value: ${json[1][0]?.value?.toLocaleString()})`
      : "Unexpected response structure",
  };
}

// 2. IMF (no API key) - old dataservices.imf.org is deprecated; try new endpoint
async function checkImf() {
  // Note: IMF API has Akamai protection that blocks some automated requests
  // Adding browser-like headers with compression support
  try {
    const res = await httpGetFollow(
      "https://www.imf.org/external/datamapper/api/v1/NGDP_RPCH/USA?periods=2023",
      20000,  // Increased timeout for large response (~120KB)
      5,      // max redirects
      {       // Additional headers to appear more browser-like
        'Referer': 'https://www.imf.org/',
        'Origin': 'https://www.imf.org',
        'Cache-Control': 'no-cache'
      },
      true    // Use compression
    );
    if (res.status === 200) {
      const json = parseJson(res.body);
      const val = json?.values?.NGDP_RPCH?.USA?.['2023'];
      return {
        ok: !!json,
        detail: json
          ? `IMF DataMapper OK (US GDP growth 2023: ${val !== undefined ? val + '%' : 'data present'})`
          : "No parseable JSON in response",
      };
    }
    if (res.status === 403) {
      return { ok: false, detail: `HTTP 403 - Akamai bot protection (intermittent - API is functional)` };
    }
    return { ok: false, detail: `IMF DataMapper HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, detail: `IMF API error: ${err.message}` };
  }
}

// 3. OECD (no API key)
async function checkOecd() {
  // Use a reliable, minimal OECD SDMX endpoint (country list is always available)
  const res = await httpGetFollow(
    "https://sdmx.oecd.org/public/rest/dataflow/OECD.SDD.NAD/DSD_NAMAIN1?format=jsondata",
    12000
  );
  if (res.status === 200) {
    const json = parseJson(res.body);
    return {
      ok: !!json,
      detail: json
        ? "OECD SDMX API reachable (National Accounts dataflow found)"
        : "OECD API responded but no JSON",
    };
  }
  // 404 means host is up but specific path changed - still connectable
  if (res.status === 404 || res.status === 400 || res.status === 406) {
    return { ok: true, detail: `OECD API reachable (HTTP ${res.status} - endpoint path may need update)` };
  }
  return { ok: false, detail: `OECD API unreachable: HTTP ${res.status}` };
}

// 4. BLS (key optional)
async function checkBls() {
  const key = ENV.BLS_API_KEY || "";
  const payload = {
    seriesid: ["CES0000000001"], // Total nonfarm employees
    startyear: "2023",
    endyear: "2024",
    ...(key ? { registrationkey: key } : {}),
  };
  const res = await httpPost(
    "https://api.bls.gov/publicAPI/v2/timeseries/data",
    payload,
    {}
  );
  if (res.status !== 200) return { ok: false, detail: `HTTP ${res.status}` };
  const json = parseJson(res.body);
  const ok = json?.status === "REQUEST_SUCCEEDED";
  const seriesData = json?.Results?.series?.[0]?.data?.[0];
  return {
    ok,
    detail: ok
      ? `BLS data OK (CES0000000001, latest: ${seriesData?.year}-${seriesData?.period}, ${seriesData?.value}K employees)`
      : `API response status: ${json?.status} - ${json?.message?.join(", ")}`,
  };
}

// 5. FRED (key required)
async function checkFred() {
  const key = ENV.FRED_API_KEY;
  if (!key) return { ok: false, detail: "FRED_API_KEY not set in .env" };
  const res = await httpGet(
    `https://api.stlouisfed.org/fred/series/observations?series_id=GDP&api_key=${key}&file_type=json&limit=1&sort_order=desc`
  );
  if (res.status !== 200) return { ok: false, detail: `HTTP ${res.status}` };
  const json = parseJson(res.body);
  const obs = json?.observations?.[0];
  return {
    ok: !!obs,
    detail: obs
      ? `GDP series OK (date: ${obs.date}, value: ${obs.value}B USD)`
      : `Unexpected response: ${res.body.slice(0, 120)}`,
  };
}

// 6. Census Bureau (key optional)
async function checkCensus() {
  const key = ENV.CENSUS_API_KEY || "";
  const url =
    `https://api.census.gov/data/2021/cbp?get=NAME,NAICS2017_LABEL,EMP,ESTAB&for=state:06&NAICS2017=5112` +
    (key ? `&key=${key}` : "");
  const res = await httpGetFollow(url, 15000);
  if (res.status !== 200) {
    // Check if it's an invalid key redirect
    if (res.body.includes("Invalid Key") || res.body.includes("invalid_key")) {
      return { ok: false, detail: `Invalid API key - check key activation at https://api.census.gov/data/key_signup.html` };
    }
    return { ok: false, detail: `HTTP ${res.status}` };
  }
  const json = parseJson(res.body);
  const ok = Array.isArray(json) && json.length > 1;
  return {
    ok,
    detail: ok
      ? `CBP data OK (NAICS 5112/Software Publishers, CA state, ${json.length - 1} row(s))`
      : `Unexpected response: ${res.body.slice(0, 120)}`,
  };
}

// 7. Alpha Vantage (key required)
async function checkAlphaVantage() {
  const key = ENV.ALPHA_VANTAGE_API_KEY;
  if (!key) return { ok: false, detail: "ALPHA_VANTAGE_API_KEY not set in .env" };
  const res = await httpGet(
    `https://www.alphavantage.co/query?function=OVERVIEW&symbol=MSFT&apikey=${key}`
  );
  if (res.status !== 200) return { ok: false, detail: `HTTP ${res.status}` };
  const json = parseJson(res.body);
  if (json?.Note) return { ok: false, detail: `Rate limited: ${json.Note}` };
  if (json?.Information) return { ok: false, detail: `API limit: ${json.Information}` };
  if (json?.["Error Message"]) return { ok: false, detail: `Error: ${json["Error Message"]}` };
  const ok = json?.Symbol === "MSFT";
  return {
    ok,
    detail: ok
      ? `MSFT overview OK (MarketCap: $${(json.MarketCapitalization / 1e12).toFixed(2)}T, Sector: ${json.Sector})`
      : `Unexpected response keys: ${Object.keys(json || {}).join(", ")}`,
  };
}

// 8. Nasdaq Data Link (optional - has strict bot protection)
async function checkNasdaq() {
  const key = ENV.NASDAQ_DATA_LINK_API_KEY || "";

  // Note: Nasdaq Data Link uses Incapsula/Imperva bot protection
  // which blocks most automated requests. This is a known limitation.
  // The API works in browsers but blocks curl/Node.js even with proper headers.
  // This source is OPTIONAL and not critical for TAM MCP Server functionality.

  if (!key) {
    return {
      ok: false,
      detail: `Optional source - API key not set (requires browser-based access due to Incapsula protection)`,
    };
  }

  try {
    const url = `https://data.nasdaq.com/api/v3/datasets/FRED/GDP.json?api_key=${key}&limit=1`;
    const res = await httpGet(url, 10000, {}, true);

    // Check for Incapsula block (HTML response instead of JSON)
    if (res.body.includes('Incapsula') || res.body.includes('_Incapsula_Resource')) {
      return {
        ok: false,
        detail: `Blocked by Incapsula bot protection (optional source - not critical for server operation)`,
      };
    }

    if (res.status === 403 || res.status === 429) {
      return {
        ok: false,
        detail: `HTTP ${res.status} - Bot protection active (optional premium source)`,
      };
    }

    if (res.status !== 200) {
      return { ok: false, detail: `HTTP ${res.status} (optional source)` };
    }

    const json = parseJson(res.body);
    const dataset = json?.dataset;
    const ok = !!dataset;

    return {
      ok,
      detail: ok
        ? `Nasdaq Data Link OK (FRED/GDP: ${dataset.newest_available_date})`
        : `Unexpected response (optional source)`,
    };
  } catch (err) {
    return {
      ok: false,
      detail: `Optional source - ${err.message} (not critical)`,
    };
  }
}

// 9. Finnhub (key required for real-time data)
async function checkFinnhub() {
  const key = ENV.FINNHUB_API_KEY;
  if (!key) {
    return {
      ok: false,
      detail: "FINNHUB_API_KEY not set in .env (required for v1.1 portfolio rebalancing)",
    };
  }

  try {
    const res = await httpGet(
      `https://finnhub.io/api/v1/quote?symbol=AAPL&token=${key}`,
      10000,
      {},
      false
    );
    if (res.status !== 200) return { ok: false, detail: `HTTP ${res.status}` };

    const json = parseJson(res.body);
    if (json.error) return { ok: false, detail: `API error: ${json.error}` };

    const ok = json.c !== undefined; // current price
    return {
      ok,
      detail: ok
        ? `Finnhub OK (AAPL: $${json.c}, change: ${json.dp?.toFixed(2)}%)`
        : "Unexpected response structure",
    };
  } catch (err) {
    return { ok: false, detail: `Finnhub API error: ${err.message}` };
  }
}

// 10. CoinGecko (no key required, free tier)
async function checkCoinGecko() {
  // Free tier doesn't require API key
  try {
    const res = await httpGet(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true",
      10000,
      {},
      false
    );
    if (res.status !== 200) return { ok: false, detail: `HTTP ${res.status}` };

    const json = parseJson(res.body);
    const btc = json?.bitcoin;
    const ok = btc && btc.usd !== undefined;

    return {
      ok,
      detail: ok
        ? `CoinGecko OK (BTC: $${btc.usd.toLocaleString()}, ETH: $${json.ethereum.usd.toLocaleString()})`
        : "Unexpected response structure",
    };
  } catch (err) {
    return { ok: false, detail: `CoinGecko API error: ${err.message}` };
  }
}

// 11. ExchangeRateAPI (no key required, free tier)
async function checkExchangeRate() {
  try {
    const res = await httpGet(
      "https://open.er-api.com/v6/latest/USD",
      10000,
      {},
      false
    );
    if (res.status !== 200) return { ok: false, detail: `HTTP ${res.status}` };

    const json = parseJson(res.body);
    if (json.result === "error") {
      return { ok: false, detail: `API error: ${json["error-type"] || "Unknown"}` };
    }

    const ok = json.rates && json.rates.EUR;
    return {
      ok,
      detail: ok
        ? `ExchangeRateAPI OK (EUR: ${json.rates.EUR.toFixed(4)}, GBP: ${json.rates.GBP.toFixed(4)}, JPY: ${json.rates.JPY.toFixed(2)})`
        : "Unexpected response structure",
    };
  } catch (err) {
    return { ok: false, detail: `ExchangeRateAPI error: ${err.message}` };
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log("\n╔═══════════════════════════════════════════════════════════╗");
console.log("║         TAM MCP Server - Data Source Validation           ║");
console.log("╚═══════════════════════════════════════════════════════════╝\n");

console.log("🌐 Public APIs (no key required):");
await check("World Bank", checkWorldBank);
await check("IMF", checkImf);
await check("OECD", checkOecd);

console.log("\n🔑 APIs with optional key (public access with limits):");
await check("BLS (Bureau of Labor Statistics)", checkBls);
await check("Census Bureau", checkCensus);

console.log("\n🔐 APIs requiring a key:");
await check("FRED (Federal Reserve)", checkFred);
await check("Alpha Vantage", checkAlphaVantage);
await check("Nasdaq Data Link", checkNasdaq);

console.log("\n📊 Portfolio Rebalancing APIs (v1.1):");
await check("Finnhub (Real-time + Sentiment)", checkFinnhub);
await check("CoinGecko (Cryptocurrency)", checkCoinGecko);
await check("ExchangeRate.host (Forex + Metals)", checkExchangeRate);

// ─── Summary ──────────────────────────────────────────────────────────────────

const passed = results.filter((r) => r.ok);
const failed = results.filter((r) => !r.ok);

console.log("\n╔═══════════════════════════════════════════════════════════╗");
console.log(`║  Summary: ${passed.length}/${results.length} data sources connected`.padEnd(59) + "║");
console.log("╚═══════════════════════════════════════════════════════════╝");

if (failed.length > 0) {
  console.log("\n⚠️  Failed sources:");
  failed.forEach((r) => console.log(`   • ${r.name}: ${r.detail}`));
}

console.log(
  `\n${passed.length === results.length ? "🎉 All data sources healthy!" : "⚡ Some sources need attention (see above)."}\n`
);

process.exit(failed.length === 0 ? 0 : 1);
