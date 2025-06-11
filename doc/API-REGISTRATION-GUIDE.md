# API Registration Guide

This guide walks you through registering for all the required API keys for the TAM MCP Server's data sources.

## 🎯 Quick Start Checklist

- [ ] Alpha Vantage API Key
- [ ] FRED API Key  
- [ ] Census Bureau API Key
- [ ] Nasdaq Data Link API Key
- [ ] BLS API Key (Optional)

## 📋 Required API Keys

### 1. Alpha Vantage (Stock & Financial Data)

**🔗 Registration URL**: https://www.alphavantage.co/support/#api-key

**📊 What it provides**: 
- Company financials and market capitalization
- Stock price data and time series
- Real-time market data

**💰 Free Tier Limits**:
- 25 API calls per day
- 5 API calls per minute

**📝 Registration Steps**:
1. Visit https://www.alphavantage.co/support/#api-key
2. Fill out the simple registration form:
   - Email address
   - First and last name
   - Organization (optional)
3. Click "GET FREE API KEY"
4. Check your email for verification
5. Your API key will be displayed immediately after verification

**⚙️ Environment Variable**: `ALPHA_VANTAGE_API_KEY`

---

### 2. FRED (Federal Reserve Economic Data)

**🔗 Registration URL**: https://fredaccount.stlouisfed.org/apikeys

**📊 What it provides**:
- Economic indicators (GDP, inflation, employment)
- Federal Reserve economic data
- Historical economic time series

**💰 Free Tier Limits**:
- Very generous limits for research use
- No hard daily limits for reasonable usage

**📝 Registration Steps**:
1. Go to https://fredaccount.stlouisfed.org/login/secure/
2. Create a new FRED account if you don't have one:
   - Click "Register" 
   - Fill out registration form
   - Verify email address
3. Log into your FRED account
4. Navigate to "My Account" → "API Keys"
5. Click "Request API Key"
6. Fill out the API key request form:
   - Application name: "TAM MCP Server"
   - Description: "Market sizing analysis server for economic data"
   - Website (optional)
7. Submit and your key will be approved immediately

**⚙️ Environment Variable**: `FRED_API_KEY`

---

### 3. Census Bureau (Demographic & Economic Data)

**🔗 Registration URL**: https://api.census.gov/data/key_signup.html

**📊 What it provides**:
- County Business Patterns data
- Demographic and economic statistics
- Employment data by industry (NAICS codes)

**💰 Free Tier Limits**:
- High limits suitable for research and development
- 500 calls per day typical limit

**📝 Registration Steps**:
1. Visit https://api.census.gov/data/key_signup.html
2. Fill out the registration form:
   - First and last name
   - Email address
   - Organization name
   - Organization type (select "Other" if individual)
   - Intended usage: "Market sizing analysis and economic research"
3. Click "Submit"
4. Check your email for the API key (usually arrives within a few minutes)

**⚙️ Environment Variable**: `CENSUS_API_KEY`

---

### 4. Nasdaq Data Link (Financial Datasets)

**🔗 Registration URL**: https://data.nasdaq.com/sign-up

**📊 What it provides**:
- Financial and economic datasets
- Market data and time series
- Alternative data sources

**💰 Free Tier Limits**:
- 50 API calls per day
- Access to free datasets only

**📝 Registration Steps**:
1. Go to https://data.nasdaq.com/sign-up
2. Create account:
   - Email address
   - Password
   - First and last name
   - Company (optional)
3. Verify your email address
4. Log into your account
5. Navigate to "Account Settings" or click your profile
6. Find the "API Key" section
7. Your API key will be displayed there

**⚙️ Environment Variable**: `NASDAQ_DATA_LINK_API_KEY`

---

### 5. Bureau of Labor Statistics (BLS) - Optional

**🔗 Registration URL**: https://data.bls.gov/registrationEngine/

**📊 What it provides**:
- Employment statistics
- Wage and salary data
- Industry-specific labor metrics

**💰 Free Tier Limits**:
- **Without API key**: 25 queries per day, 10 years of data per query
- **With API key**: 500 queries per day, 20 years of data per query

**📝 Registration Steps**:
1. Visit https://data.bls.gov/registrationEngine/
2. Fill out registration form:
   - Email address
   - Password
   - First and last name
   - Phone number
   - Organization details
3. Verify email address
4. Log in and navigate to API section
5. Your API key will be displayed in your account

**⚙️ Environment Variable**: `BLS_API_KEY`

**💡 Note**: This key is optional but recommended for higher rate limits

---

## 🔓 No API Key Required

These data sources work without registration:

- **World Bank**: Public access to development indicators
- **OECD**: Public access to economic statistics  
- **IMF**: Public access to financial data

---

## ⚙️ Configuration Setup

### 1. Environment File Setup

Copy the example environment file:
```bash
cp .env.example .env
```

### 2. Add Your API Keys

Edit the `.env` file and add your keys:

```bash
# API Keys for Data Sources
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here
FRED_API_KEY=your_fred_key_here
CENSUS_API_KEY=your_census_key_here
NASDAQ_DATA_LINK_API_KEY=your_nasdaq_key_here
BLS_API_KEY=your_bls_key_here

# Other required environment variables
SESSION_SECRET=your_secure_session_secret_here
PORT=3000
NODE_ENV=development
```

### 3. Verify Configuration

Test that your API keys are working:

```bash
# Start the server
npm start

# In another terminal, run integration tests
npm run test:integration

# Or test individual data sources
npm run test:integration -- --testNamePattern="DataService"
```

---

## 🚨 Security Best Practices

### Protecting Your API Keys

1. **Never commit .env files**: Ensure `.env` is in your `.gitignore`
2. **Use different keys for development/production**: Register separate keys if possible
3. **Monitor usage**: Check your API dashboards regularly for unexpected usage
4. **Rotate keys periodically**: Refresh keys every 6-12 months

### Rate Limiting Awareness

The server implements intelligent caching to minimize API calls:

- **In-memory caching**: Fast access to recent data
- **Persistent caching**: Data survives server restarts
- **Configurable TTLs**: Per-source cache expiration settings

---

## 🔧 Troubleshooting

### Common Issues

**"API key not configured" warnings**:
- Check that your `.env` file contains the correct key names
- Restart the server after adding new keys
- Verify there are no extra spaces or quotes around keys

**"Rate limit exceeded" errors**:
- Check your API dashboard for usage
- Consider upgrading to paid tiers if needed
- The server caches aggressively to minimize calls

**"Service unavailable" messages**:
- Verify your internet connection
- Check if the API service is experiencing downtime
- Confirm your API key is still valid

### Testing Individual Services

You can test each service independently:

```bash
# Test Alpha Vantage
node -e "console.log(process.env.ALPHA_VANTAGE_API_KEY ? 'Alpha Vantage key configured' : 'Missing Alpha Vantage key')"

# Test FRED
node -e "console.log(process.env.FRED_API_KEY ? 'FRED key configured' : 'Missing FRED key')"

# And so on for other services...
```

---

## 📞 Support

If you encounter issues with API registration:

1. **Alpha Vantage**: https://www.alphavantage.co/support/
2. **FRED**: https://fred.stlouisfed.org/docs/api/fred/
3. **Census**: https://www.census.gov/data/developers/guidance.html
4. **Nasdaq**: https://data.nasdaq.com/contact-us
5. **BLS**: https://www.bls.gov/developers/api_faqs.htm

For issues with the TAM MCP Server integration, please open an issue on the project's GitHub repository.

---

## ✅ Verification Checklist

Once you've completed registration:

- [ ] All required API keys added to `.env` file
- [ ] Server starts without "API key not configured" warnings
- [ ] Integration tests pass: `npm run test:integration`
- [ ] Data sources respond correctly in server logs
- [ ] Cache is working (check for "cached data" messages in logs)

Your TAM MCP Server is now ready to access real market data from all integrated sources!
