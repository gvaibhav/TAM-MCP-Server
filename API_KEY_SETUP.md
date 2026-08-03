# API Key Setup Guide

## Current Status (2026-08-03)

### ✅ Working APIs
- **World Bank** - No key required ✅
- **OECD** - No key required ✅
- **FRED** - Key valid ✅
- **Alpha Vantage** - Key valid ✅

### ❌ Failed APIs (Need New Keys)

#### 1. BLS (Bureau of Labor Statistics)
**Error**: Invalid API key

**How to get a new key:**
1. Visit: https://www.bls.gov/developers/home.htm
2. Click "Register" or "Request API Key"
3. Fill out the registration form
4. You'll receive the API key via email
5. Update `.env` file: `BLS_API_KEY=your_new_key_here`

**Note**: Registration is free and provides 500 daily queries (vs 25 without registration)

---

#### 2. Census Bureau
**Error**: Invalid API key

**How to get a new key:**
1. Visit: https://api.census.gov/data/key_signup.html
2. Fill out the request form with your email and organization
3. You'll receive the API key via email immediately
4. Update `.env` file: `CENSUS_API_KEY=your_new_key_here`

**Note**: Free and unlimited for reasonable use

---

#### 3. IMF (International Monetary Fund)
**Error**: HTTP 403 (API-side issue)

**Status**: The IMF DataMapper API appears to be experiencing access restrictions. This is likely a temporary issue on their end or they've changed authentication requirements.

**Workaround**: The server will continue to work with the other 6 data sources. IMF data is supplementary.

---

#### 4. Nasdaq Data Link (Optional)
**Status**: Currently commented out in `.env`

**How to get a key:**
1. Visit: https://data.nasdaq.com/sign-up
2. Create a free account
3. Go to Account Settings → API Key
4. Copy your API key
5. Uncomment and update in `.env`: `NASDAQ_DATA_LINK_API_KEY=your_key_here`

**Note**: Free tier allows 50 calls/day. Premium datasets may require subscription.

---

## Quick Fix Commands

After obtaining new keys, update your `.env` file:

```bash
# Edit .env file
nano .env  # or use your preferred editor

# Validate the new keys
node scripts/validate-datasources.mjs
```

## Docker Usage

Once keys are updated, rebuild and run the Docker container:

```bash
# Build the image
docker-compose build

# Run the container
docker-compose up -d

# Check logs
docker-compose logs -f

# Validate data sources inside container
docker-compose exec tam-mcp-server node scripts/validate-datasources.mjs
```

## Minimum Requirements

The server can run with just the **working 4 sources**:
- World Bank ✅
- OECD ✅  
- FRED ✅
- Alpha Vantage ✅

For full functionality, update BLS and Census keys.
