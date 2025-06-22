# IMF Service Documentation

## Overview

The IMF (International Monetary Fund) Service provides access to IMF's SDMX-JSON REST API for retrieving economic and financial data. This service handles the complex SDMX (Statistical Data and Metadata eXchange) format and provides a simplified interface for accessing IMF datasets.

## Features

- **Multiple SDMX Format Support**: Handles various SDMX-JSON response formats from the IMF API
- **Intelligent Key Validation**: Provides helpful suggestions for malformed dataset keys
- **Comprehensive Error Handling**: Returns detailed error messages with troubleshooting guidance
- **Dataset Pattern Recognition**: Includes built-in knowledge of common IMF dataset patterns
- **Flexible Data Parsing**: Supports both simple and complex SDMX data structures

## Architecture

### Core Components

1. **ImfService Class**: Main service implementing the DataSourceService interface
2. **SDMX Parsers**: Multiple parsing strategies for different SDMX response formats
3. **Validation System**: Key format validation with contextual suggestions
4. **Error Recovery**: Intelligent error handling with user-friendly messages

### Key Methods

#### Public Methods

- `fetchImfDataset(dataflowId, key, startPeriod?, endPeriod?)`: Fetch dataset from IMF API
- `fetchMarketSize(industryId, region?)`: Fetch market size data using IFS dataset
- `fetchIndustryData(datasetKey, options?)`: Generic industry data fetching
- `getDataFreshness()`: Get data freshness information (returns null for IMF)
- `isAvailable()`: Check if service is available (always true - no API key required)

#### Private Methods

- `validateImfKey()`: Validate IMF key format and provide suggestions
- `isEmptyResponse()`: Detect empty/no-data responses
- `buildNoDataErrorMessage()`: Build comprehensive error messages
- `parseSdmxCompactData()`: Parse SDMX compact data format
- `parseComplexSdmxStructure()`: Parse complex SDMX structures with dimensions
- `parseSimplifiedSdmxStructure()`: Parse simplified SDMX structures
- `extractObservationsFromAnyStructure()`: Extract observations from various formats
- `getStructureSummary()`: Get structure summary for debugging

## Supported Datasets

### International Financial Statistics (IFS)
- **Description**: Comprehensive macroeconomic data
- **Common Format**: `M.{COUNTRY}.{INDICATOR}`
- **Examples**:
  - `M.US.PMP_IX` - US Import Price Index (Monthly)
  - `A.GB.GDP_IX` - UK GDP Index (Annual)

### Primary Commodity Price System (PCPS)
- **Description**: Global commodity price data
- **Common Format**: `M.W0.{COMMODITY}_USD`
- **Examples**:
  - `M.W0.PCRUDE_USD` - Crude Oil Prices (Monthly)
  - `M.W0.PGOLD_USD` - Gold Prices (Monthly)

## Usage Examples

### Basic Dataset Fetching

```typescript
const imfService = new ImfService();

// Fetch US import price index data
const data = await imfService.fetchImfDataset('IFS', 'M.US.PMP_IX');

if (Array.isArray(data)) {
  console.log(`Retrieved ${data.length} observations`);
  data.forEach(obs => {
    console.log(`${obs.TIME_PERIOD}: ${obs.value}`);
  });
} else {
  console.error('Error:', data.error);
  console.log('Suggestions:', data.suggestions);
}
```

### Market Size Data

```typescript
// Fetch market size using industry ID
const marketData = await imfService.fetchMarketSize('PMP_IX');
console.log('Market data:', marketData);
```

### With Time Period Filtering

```typescript
// Fetch data for specific time period
const recentData = await imfService.fetchImfDataset(
  'PCPS', 
  'M.W0.PCRUDE_USD', 
  '2020-01', 
  '2023-12'
);
```

## Error Handling

The service provides comprehensive error handling with contextual suggestions:

### Common Error Scenarios

1. **Invalid Dataset Key**: Returns suggestions for correct format
2. **Dataset Not Found**: Provides alternative dataset recommendations
3. **No Data Available**: Explains possible reasons and solutions
4. **Network Errors**: Handles API connection issues gracefully

### Error Response Format

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

## Data Format

### Input Parameters

- **dataflowId**: IMF dataset identifier (e.g., 'IFS', 'PCPS')
- **key**: Dataset key following IMF conventions (e.g., 'M.US.PMP_IX')
- **startPeriod**: Optional start date (ISO format: '2020-01')
- **endPeriod**: Optional end date (ISO format: '2023-12')

### Output Format

```typescript
interface ImfDataRecord {
  TIME_PERIOD: string;
  value: number | string;
  [dimensionId: string]: string | number | null | undefined;
}
```

## Configuration

The service uses configuration from `apiConfig.ts`:

```typescript
export const imfApi = {
  baseUrl: 'https://dataservices.imf.org/REST/SDMX_JSON.svc',
  // No API key required for IMF data
};
```

## Testing

### Unit Tests
- Located in: `tests/unit/services/dataSources/imfService.test.ts`
- Coverage: All public and private methods
- Mocking: Uses Vitest with axios mocking

### Integration Tests
- Located in: `tests/integration/imfService.integration.test.ts`
- Real API testing with timeouts
- Performance and reliability testing
- **Updated Error Handling**: Tests now properly handle both successful data retrieval and error scenarios
- **Concurrent Request Testing**: Validates that both successful and failed requests are handled appropriately

### Running Tests

```bash
# Run unit tests only
npm test -- tests/unit/services/dataSources/imfService.test.ts

# Run integration tests (requires internet connection)
npm test -- tests/integration/imfService.integration.test.ts

# Run all tests
npm test
```

## Performance Considerations

- **Caching**: No built-in caching (IMF data updates frequently)
- **Rate Limiting**: IMF API has built-in rate limiting
- **Timeout Handling**: Network requests have reasonable timeouts
- **Concurrent Requests**: Service supports multiple concurrent requests

## Troubleshooting

### Common Issues

1. **"Dataset not found" errors**: Check dataset ID and key format
2. **Empty responses**: Verify time period and indicator availability
3. **Network timeouts**: Check internet connection and IMF API status

### Debug Information

The service provides detailed debug information through:
- Structure summaries for SDMX responses
- Validation feedback for keys
- Comprehensive error messages with suggestions

## Contributing

When contributing to the IMF Service:

1. **Run Tests**: Ensure all tests pass
2. **Update Documentation**: Modify this file for new features
3. **Add Test Coverage**: Include tests for new functionality
4. **Follow Patterns**: Maintain consistency with existing code patterns

### Code Style Guidelines

- Use TypeScript strict mode
- Include JSDoc comments for public methods
- Handle errors gracefully with user-friendly messages
- Provide comprehensive logging for debugging

## References

- [IMF SDMX API Documentation](https://datahelp.imf.org/knowledgebase/articles/667681)
- [SDMX Information Model](https://sdmx.org/wp-content/uploads/SDMX_2-1-1_SECTION_2_InformationModel_201108.pdf)
- [IMF Data Portal](https://data.imf.org/)

## Change Log

### Recent Updates

- **Enhanced SDMX Parsing**: Improved support for complex SDMX structures
- **Better Error Messages**: Added contextual error messages with suggestions
- **Comprehensive Testing**: Added unit and integration test coverage
- **Documentation**: Added complete API documentation and usage examples
