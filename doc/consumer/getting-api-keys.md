# How to Obtain Free API Keys for Integration Testing

To run integration tests with real external APIs, you need to obtain free API keys for the following services:

| Service                | Free Tier              | Sign Up URL                                                      |
|------------------------|------------------------|------------------------------------------------------------------|
| **FRED**               | 120,000 calls/day      | [Get FRED API Key](https://fred.stlouisfed.org/docs/api/api_key.html)         |
| **BLS**                | 500 calls/day          | [Get BLS API Key](https://www.bls.gov/developers/api_signature_v2.htm)        |
| **Alpha Vantage**      | 25 calls/day           | [Get Alpha Vantage API Key](https://www.alphavantage.co/support/#api-key)     |
| **Census Bureau**      | No limit               | [Get Census API Key](https://api.census.gov/data/key_signup.html)             |
| **NASDAQ Data Link**   | 50 calls/day           | [Get NASDAQ Data Link API Key](https://data.nasdaq.com/sign-up)               |

## Step-by-Step Instructions

1. **FRED (Federal Reserve Economic Data)**
   - Go to the [FRED API Key page](https://fred.stlouisfed.org/docs/api/api_key.html).
   - Log in or create an account.
   - Request your API key and copy it.

2. **BLS (Bureau of Labor Statistics)**
   - Visit the [BLS API registration page](https://www.bls.gov/developers/api_signature_v2.htm).
   - Fill out the registration form.
   - Your API key will be sent to your email.

3. **Alpha Vantage**
   - Go to the [Alpha Vantage API key page](https://www.alphavantage.co/support/#api-key).
   - Enter your email address.
   - You will receive your API key by email.

4. **Census Bureau**
   - Visit the [Census API key signup page](https://api.census.gov/data/key_signup.html).
   - Fill out the form and submit.
   - Your API key will be displayed instantly.

5. **NASDAQ Data Link (formerly Quandl)**
   - Go to the [NASDAQ Data Link sign-up page](https://data.nasdaq.com/sign-up).
   - Create an account.
   - After logging in, find your API key in your account settings.

## Add Keys to Your .env File

Once you have your keys, add them to your `.env` file like this:

```
FRED_API_KEY=your_fred_api_key_here
BLS_API_KEY=your_bls_api_key_here
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here
CENSUS_API_KEY=your_census_key_here
NASDAQ_DATA_LINK_API_KEY=your_nasdaq_key_here
```

You can now run integration tests as described in the [API Integration Testing Guide](./api-reference.md).
