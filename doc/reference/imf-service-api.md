# IMF Service API Reference

## Class: ImfService

The ImfService class provides access to the International Monetary Fund's SDMX-JSON REST API for retrieving economic and financial data.

### Constructor

```typescript
constructor(apiKey?: string)
```

Creates a new instance of the IMF Service.

**Parameters:**
- `apiKey` (string, optional): Not used for IMF service (no API key required)

**Example:**
```typescript
const imfService = new ImfService();
```

---

## Public Methods

### fetchImfDataset

```typescript
async fetchImfDataset(
  dataflowId: string,
  key: string,
  startPeriod?: string,
  endPeriod?: string
): Promise<ImfDataRecord[] | ImfErrorResult>
```

Fetches data from an IMF dataset using the SDMX API.

**Parameters:**
- `dataflowId` (string): The IMF dataset identifier (e.g., 'IFS', 'PCPS')
- `key` (string): The dataset key following IMF conventions (e.g., 'M.US.PMP_IX')
- `startPeriod` (string, optional): Start date in ISO format (e.g., '2020-01')
- `endPeriod` (string, optional): End date in ISO format (e.g., '2023-12')

**Returns:**
- `Promise<ImfDataRecord[] | ImfErrorResult>`: Array of data records or error object

**Throws:**
- `Error`: When dataflowId or key is missing
- `Error`: When API returns error status codes

**Example:**
```typescript
// Basic usage
const data = await imfService.fetchImfDataset('IFS', 'M.US.PMP_IX');

// With time period
const recentData = await imfService.fetchImfDataset(
  'PCPS', 
  'M.W0.PCRUDE_USD', 
  '2020-01', 
  '2023-12'
);

// Handle response
if (Array.isArray(data)) {
  console.log(`Retrieved ${data.length} observations`);
} else {
  console.error('Error:', data.error);
  console.log('Suggestions:', data.suggestions);
}
```

---

### fetchMarketSize

```typescript
async fetchMarketSize(
  industryId: string,
  region?: string
): Promise<ImfDataRecord[]>
```

Fetches market size data using the IFS (International Financial Statistics) dataset.

**Parameters:**
- `industryId` (string): Industry identifier to search for
- `region` (string, optional): Region parameter (currently not used)

**Returns:**
- `Promise<ImfDataRecord[]>`: Array of market size data records

**Example:**
```typescript
const marketData = await imfService.fetchMarketSize('PMP_IX');
console.log('Market data:', marketData);
```

---

### fetchIndustryData

```typescript
async fetchIndustryData(
  datasetKey: string,
  options?: string | Record<string, unknown>
): Promise<ImfDataRecord[]>
```

Generic method for fetching industry-related data from IMF datasets.

**Parameters:**
- `datasetKey` (string): The primary dataset identifier
- `options` (string | Record<string, unknown>, optional): Either a key string or options object

**Returns:**
- `Promise<ImfDataRecord[]>`: Array of industry data records

**Example:**
```typescript
// With string key
const data1 = await imfService.fetchIndustryData('IFS', 'M.US.PMP_IX');

// With options object
const data2 = await imfService.fetchIndustryData('PCPS', { startPeriod: '2020' });
```

---

### getDataFreshness

```typescript
async getDataFreshness(): Promise<Date | null>
```

Gets the data freshness information for the IMF service.

**Returns:**
- `Promise<Date | null>`: Always returns null (IMF doesn't provide last-updated metadata easily)

**Example:**
```typescript
const freshness = await imfService.getDataFreshness();
console.log(freshness); // null
```

---

### isAvailable

```typescript
async isAvailable(): Promise<boolean>
```

Checks if the IMF service is available.

**Returns:**
- `Promise<boolean>`: Always returns true (no API key required for IMF)

**Example:**
```typescript
const available = await imfService.isAvailable();
console.log(available); // true
```

---

## Data Types

### ImfDataRecord

Represents a single observation record from an IMF dataset.

```typescript
interface ImfDataRecord {
  TIME_PERIOD: string;
  value: number | string;
  [dimensionId: string]: string | number | null | undefined;
}
```

**Properties:**
- `TIME_PERIOD`: Time period of the observation (ISO format)
- `value`: The observed value
- Additional dimension properties (varies by dataset)

**Example:**
```typescript
{
  "TIME_PERIOD": "2023-01",
  "value": 175.5,
  "COMMODITY_ID": "PAUM",
  "COMMODITY": "Aluminum",
  "FREQ_ID": "M",
  "FREQ": "Monthly",
  "REF_AREA_ID": "W00",
  "REF_AREA": "World",
  "UNIT_MEASURE_ID": "USD",
  "UNIT_MEASURE": "US Dollar"
}
```

---

### ImfErrorResult

Represents an error response when data retrieval fails.

```typescript
interface ImfErrorResult {
  error: string;
  message: string;
  suggestions: string[];
  requestParams: Record<string, unknown>;
  rawResponseKeys?: string[];
  isEmpty: boolean;
}
```

**Properties:**
- `error`: Error type or code
- `message`: Detailed error message with context
- `suggestions`: Array of suggestions to fix the issue
- `requestParams`: Parameters used in the failed request
- `rawResponseKeys`: Keys found in the raw response (for debugging)
- `isEmpty`: Boolean indicating if the response was empty

**Example:**
```typescript
{
  "error": "NO_DATA_AVAILABLE",
  "message": "No data available for IMF dataset \"IFS\" with key \"INVALID\"...",
  "suggestions": [
    "For IFS (International Financial Statistics), try these working examples:",
    "  M.US.PMP_IX - US Import Price Index (Monthly)",
    "  A.GB.GDP_IX - UK GDP Index (Annual)"
  ],
  "requestParams": {
    "dataflowId": "IFS",
    "key": "INVALID"
  },
  "isEmpty": true
}
```

---

## Supported Datasets

### IFS (International Financial Statistics)

**Description:** Comprehensive macroeconomic and financial data

**Key Format:** `{FREQUENCY}.{COUNTRY}.{INDICATOR}`

**Frequency Codes:**
- `M` - Monthly
- `Q` - Quarterly 
- `A` - Annual

**Common Country Codes:**
- `US` - United States
- `GB` - United Kingdom
- `FR` - France
- `DE` - Germany
- `JP` - Japan

**Example Keys:**
- `M.US.PMP_IX` - US Import Price Index (Monthly)
- `A.GB.GDP_IX` - UK GDP Index (Annual)
- `Q.FR.BCA_BP6_USD` - France Current Account Balance (Quarterly)

---

### PCPS (Primary Commodity Price System)

**Description:** Global commodity price data

**Key Format:** `{FREQUENCY}.{AREA}.{COMMODITY}_{CURRENCY}`

**Common Keys:**
- `M.W0.PCRUDE_USD` - Crude Oil Prices (Monthly, World, USD)
- `M.W0.PGOLD_USD` - Gold Prices (Monthly, World, USD)
- `M.W0.PSILVER_USD` - Silver Prices (Monthly, World, USD)

---

## Error Handling

The IMF Service provides comprehensive error handling with helpful suggestions:

### Error Types

1. **Validation Errors**: Invalid parameters or key formats
2. **API Errors**: HTTP errors from the IMF API
3. **Network Errors**: Connection or timeout issues
4. **Data Errors**: Empty responses or parsing failures

### Error Response Pattern

```typescript
try {
  const data = await imfService.fetchImfDataset('IFS', 'INVALID_KEY');
  
  if (Array.isArray(data)) {
    // Process successful data
    console.log(data);
  } else {
    // Handle error response
    console.error('API Error:', data.error);
    console.log('Suggestions:', data.suggestions);
  }
} catch (error) {
  // Handle exceptions
  console.error('Exception:', error.message);
}
```

---

## Rate Limiting and Best Practices

### API Limits
- The IMF API has built-in rate limiting
- No explicit rate limits documented
- Use reasonable delays between requests for bulk operations

### Best Practices

1. **Cache Responses**: IMF data doesn't change frequently
2. **Use Specific Time Periods**: Limit data retrieval to needed periods
3. **Handle Errors Gracefully**: Always check for error responses
4. **Validate Keys**: Use the validation feedback to correct malformed keys

### Example with Error Handling

```typescript
async function safeImfDataFetch(dataflowId: string, key: string) {
  try {
    const result = await imfService.fetchImfDataset(dataflowId, key);
    
    if (Array.isArray(result)) {
      return {
        success: true,
        data: result,
        count: result.length
      };
    } else {
      return {
        success: false,
        error: result.error,
        suggestions: result.suggestions
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      suggestions: []
    };
  }
}

// Usage
const result = await safeImfDataFetch('IFS', 'M.US.PMP_IX');
if (result.success) {
  console.log(`Retrieved ${result.count} records`);
} else {
  console.error('Failed:', result.error);
  if (result.suggestions.length > 0) {
    console.log('Try:', result.suggestions);
  }
}
```

---

## Changelog

### Version 1.0.0
- Initial implementation with SDMX support
- Basic dataset fetching functionality
- Error handling and validation

### Version 1.1.0
- Enhanced SDMX parsing for complex structures
- Improved error messages with suggestions
- Added comprehensive test coverage
- Performance optimizations
