// src/config/apiConfig.ts
export const worldBankApi = {
  baseUrl: 'https://api.worldbank.org/v2',
  defaultGdpIndicator: 'NY.GDP.MKTP.CD',
  // Add other World Bank specific endpoints or params as needed
};

export const fredApi = {
  baseUrl: 'https://api.stlouisfed.org/fred',
  // Example: default series for general market size might be 'GDP'
  // but specific series IDs are usually passed in.
  // Add other FRED specific endpoints or params as needed
};

// Add configurations for other APIs as they are integrated
export const blsApi = {
  baseUrlV2: 'https://api.bls.gov/publicAPI/v2/timeseries/data/',
  // registrationUrl: 'https://data.bls.gov/registration/api-beta-request' // For info
  // V1 is https://api.bls.gov/publicAPI/v1/timeseries/data/ (deprecated)
};

export const censusApi = {
  baseUrl: 'https://api.census.gov/data', // Base for many Census APIs
  // Example for County Business Patterns (CBP) - year might change
  cbpYear: '2021', // Or make this a parameter
  cbpDataset: 'cbp', // Placeholder, may need to be more specific e.g. /timeseries/intltrade/exports/por
};

export const oecdApi = {
  baseUrl: 'https://sdmx.oecd.org/sdmx-json/data',
  // Default agency ID, often 'all' or specific like 'OECD'
  defaultAgencyId: 'all',
  // Default: get all dimensions at observation level
  defaultDimensionObservation: 'AllDimensions',
};

export const imfApi = {
    baseUrl: 'http://dataservices.imf.org/REST/SDMX_JSON.svc', // Example, verify actual
};

export const alphaVantageApi = {
  baseUrl: 'https://www.alphavantage.co', // Base URL is correct
  queryPath: '/query', // Common path for queries
  // Default function for daily time series, can be overridden
  defaultTimeSeriesFunction: 'TIME_SERIES_DAILY_ADJUSTED',
  defaultOverviewFunction: 'OVERVIEW', // For company market cap
  // Other functions can be added here e.g., SECTOR for sector performance
};

export const nasdaqDataApi = {
  baseUrl: 'https://data.nasdaq.com/api/v3/datasets', // Correct base for datasets
  // Example: default database for general economic data could be 'FRED' if proxied, or specific Nasdaq ones.
  // Users of the service will typically provide database_code/dataset_code.
};
