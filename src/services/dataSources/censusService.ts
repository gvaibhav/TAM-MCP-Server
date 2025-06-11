// src/services/dataSources/censusService.ts
import axios from 'axios';
import * as process from 'process';
import { DataSourceService } from '../../types/dataSources.js';
import { CacheEntry, CacheStatus } from '../../types/cache.js';
import { CacheService } from '../cache/cacheService.js';
import { censusApi } from '../../config/apiConfig.js';
import { getEnvAsNumber } from '../../utils/envHelper.js';

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 1 day
const DEFAULT_TTL_NODATA_MS = 1 * 60 * 60 * 1000; // 1 hour

// Example: https://api.census.gov/data/2021/cbp?get=EMP,PAYANN,ESTAB&for=us:1&NAICS2017=23&key=YOUR_KEY
// NAICS2017 lookup: https://www.census.gov/naics/?58967?yearbck=2017 (use codes like "23", "31-33", "44-45")

export class CensusService implements DataSourceService {
  private apiKey: string | undefined;
  private cacheService: CacheService;
  private successfulFetchTtl: number;
  private noDataFetchTtl: number;

  constructor(cacheService: CacheService, apiKey?: string) {
    this.cacheService = cacheService;
    this.apiKey = apiKey || process.env.CENSUS_API_KEY;
    if (!this.apiKey) {
      console.warn("Census API key not configured. CensusService will not be available.");
    }
    this.successfulFetchTtl = getEnvAsNumber('CACHE_TTL_CENSUS_MS', DEFAULT_TTL_MS);
    this.noDataFetchTtl = getEnvAsNumber('CACHE_TTL_CENSUS_NODATA_MS', DEFAULT_TTL_NODATA_MS);
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  /**
   * Fetches data from the Census Bureau (e.g., County Business Patterns).
   * @param variables Comma-separated string or array of variable names (e.g., "EMP,PAYANN,ESTAB").
   * @param forGeography Geography parameter (e.g., "us:1", "state:01").
   * @param filterParams Object for additional filters like NAICS2017, SIC, etc. (e.g., { NAICS2017: "23" })
   * @param year Data year, defaults to censusApi.cbpYear or a recent year.
   * @param datasetPath Path to specific dataset, e.g., "cbp" for County Business Patterns.
   */
  async fetchIndustryData(
    variables: string[] | string,
    forGeography: string,
    filterParams?: Record<string, string>,
    year: string = censusApi.cbpYear || new Date().getFullYear().toString(), // Default to config or current year as fallback
    datasetPath: string = censusApi.cbpDataset || "cbp" // Default to County Business Patterns
  ): Promise<any[] | null> {
    if (!await this.isAvailable()) {
      throw new Error('Census API key is not configured or service is unavailable.');
    }

    const varString = Array.isArray(variables) ? variables.join(',') : variables;
    if (!varString) throw new Error("Variables must be provided for Census API query.");
    if (!forGeography) throw new Error("Geography must be provided for Census API query.");

    const queryBase: Record<string, string | undefined> = { // Allow undefined for key
      get: varString,
      for: forGeography,
      key: this.apiKey, // API key is required by Census
      ...filterParams,
    };

    const cacheKeyParams = { ...queryBase };
    delete cacheKeyParams.key; // Exclude API key from cache key
    const cacheKey = `census_${year}_${datasetPath}_${JSON.stringify(cacheKeyParams)}`;

    const cachedData = await this.cacheService.get<any[]>(cacheKey);
    if (cachedData) {
      console.log(`CensusService: Returning cached data for year ${year}, dataset ${datasetPath}, geo ${forGeography}, vars ${varString}`);
      return cachedData;
    }

    const apiUrl = `${censusApi.baseUrl}/${year}/${datasetPath}`;
    console.log(`CensusService: Fetching data from ${apiUrl} with params:`, queryBase);

    try {
      const response = await axios.get(apiUrl, { params: queryBase });

      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const headers = response.data[0] as string[];
        const dataRows = response.data.slice(1) as any[][];

        if (dataRows.length > 0) {
          const transformedData = dataRows.map(row => {
            const rowObject: any = {};
            headers.forEach((header, index) => {
              // Attempt to parse numbers, but keep as string if NaN or if it's a known non-numeric field like GEO_ID
              const val = row[index];
              if (header === 'GEO_ID' || header === 'NAME' || header.startsWith('NAICS') || header.startsWith('SIC') || header === 'YEAR') {
                 rowObject[header] = val;
              } else {
                const numVal = parseFloat(val);
                rowObject[header] = isNaN(numVal) ? val : numVal;
              }
            });
            return rowObject;
          });
          await this.cacheService.set(cacheKey, transformedData, this.successfulFetchTtl);
          return transformedData;
        } else {
          console.warn(`CensusService: No data rows found for query. Headers: ${headers.join(',')}. May indicate valid query with no results.`);
          await this.cacheService.set(cacheKey, null, this.noDataFetchTtl);
          return null;
        }
      } else if (response.data === null || (Array.isArray(response.data) && response.data.length === 0)) {
        // Census API might return null or an empty array for queries that find no data (e.g. invalid NAICS for a geo)
        console.warn(`CensusService: No data returned (null or empty array) for query.`);
        await this.cacheService.set(cacheKey, null, this.noDataFetchTtl);
        return null;
      }
      else {
        console.warn(`CensusService: Unexpected response structure or no data. Response:`, response.data);
        await this.cacheService.set(cacheKey, null, this.noDataFetchTtl);
        return null;
      }
    } catch (error: any) {
      console.error(`CensusService: Error fetching data:`, error.message);
      await this.cacheService.set(cacheKey, null, this.noDataFetchTtl); // Cache null on error
      if (axios.isAxiosError(error) && error.response) {
        // Census API errors might be plain text or a specific structure.
        // Often, errors are returned with a 200 OK but contain an error message in the body (e.g. for invalid key or params)
        // or a 204 No Content for valid query with no results.
        // Actual HTTP errors (4xx, 5xx) might have error.response.data as text/html or sometimes JSON.
        let errorMessage = error.message;
        if (typeof error.response.data === 'string' && error.response.data.length < 500) { // Avoid logging huge HTML pages
            errorMessage = error.response.data;
        } else if (error.response.data && typeof error.response.data.error === 'string') {
            errorMessage = error.response.data.error;
        }
        console.error('API Error Details:', errorMessage);
        throw new Error(`Census API Error: ${errorMessage}`);
      }
      throw error;
    }
  }

  /**
   * Fetches a specific measure (e.g., Employment) for an industry and geography.
   * @param naicsCode Industry code (e.g., "23" for Construction).
   * @param geography e.g., "us:1".
   * @param measure "EMP", "PAYANN", or "ESTAB".
   * @param year Data year.
   */
  async fetchMarketSize(
    naicsCode: string,
    geography: string,
    measure: "EMP" | "PAYANN" | "ESTAB" = "EMP",
    year: string = censusApi.cbpYear || new Date().getFullYear().toString()
  ): Promise<any | null> {
    if (!naicsCode) throw new Error("NAICS code must be provided for fetchMarketSize.");

    // The NAICS filter key can change based on year (e.g., NAICS2017, NAICS2012).
    // For CBP, the year in the path determines the NAICS vintage used in that dataset.
    // We need to find out which NAICS key the specific dataset year uses.
    // Common ones are NAICS2017, NAICS2012, NAICS2007.
    // For simplicity, we'll assume a common pattern or make it configurable if needed.
    // Let's assume the dataset for 'year' uses a NAICS code from that same year or a recent one.
    // This is a heuristic. A more robust solution might involve a lookup or config.
    let naicsFilterKey = `NAICS${year}`; // e.g. NAICS2021
    // BLS often uses specific vintage names like NAICS2017.
    // For CBP, the data year implies the NAICS vintage. The variable name in API output is like NAICS2017_LABEL
    // but the query parameter is often just NAICSYYYY.
    // A common filter for CBP is just "NAICS2017", "NAICS2012" etc.
    // Let's assume the year of the data implies the NAICS vintage for now.
    // If 'year' is 2017-2021 (likely NAICS2017), 2012-2016 (NAICS2012), etc.
    // This is a simplification. For CBP, the NAICS code in the response is often `NAICS<vintage>_LABEL`.
    // The query parameter is usually `NAICS<vintage>`.
    // For CBP 2017-2021, it's NAICS2017. For 2012-2016, it's NAICS2012.
    if (parseInt(year) >= 2017) naicsFilterKey = "NAICS2017";
    else if (parseInt(year) >= 2012) naicsFilterKey = "NAICS2012";
    else if (parseInt(year) >= 2007) naicsFilterKey = "NAICS2007";
    // Add more logic if older years are needed or make this more robust

    const filters = { [naicsFilterKey]: naicsCode };
    const datasetPath = censusApi.cbpDataset || "cbp"; // Default to County Business Patterns

    const results = await this.fetchIndustryData([measure, naicsFilterKey], geography, filters, year, datasetPath);

    if (results && results.length > 0) {
      const dataPoint = results[0]; // Expecting one result for specific NAICS/Geo
      if (dataPoint && dataPoint.hasOwnProperty(measure)) {
        return {
          measure: measure,
          value: parseFloat(dataPoint[measure]) || dataPoint[measure],
          geography: dataPoint[geography.split(':')[0].toUpperCase()] || dataPoint.GEO_ID || geography, // e.g., US or state FIPS
          naicsCode: dataPoint[naicsFilterKey] || naicsCode,
          year: dataPoint.YEAR || year,
          source: `Census CBP (${datasetPath} ${year})`
        };
      }
    }
    console.warn(`CensusService: Could not derive market size for ${measure} for NAICS ${naicsFilterKey}=${naicsCode} in ${geography} for ${year}.`);
    return null;
  }

  async getDataFreshness(
    variables: string[] | string,
    forGeography: string,
    filterParams?: Record<string, string>,
    year: string = censusApi.cbpYear || new Date().getFullYear().toString(),
    datasetPath: string = censusApi.cbpDataset || "cbp"
  ): Promise<Date | null> {
    const varString = Array.isArray(variables) ? variables.join(',') : variables;
    const queryBase = { get: varString, for: forGeography, ...filterParams };
    // API key is not part of cache key, so no need to delete it from queryBase for cacheKey
    const cacheKey = `census_${year}_${datasetPath}_${JSON.stringify(queryBase)}`;

    const entry = await (this.cacheService as any).getEntry?.(cacheKey) as CacheEntry<any> | null;
    return entry?.timestamp ? new Date(entry.timestamp) : null;
  }

  getCacheStatus(): CacheStatus {
    return (this.cacheService as any).getStats?.() || { hits: 0, misses: 0, size: 0, lastRefreshed: null };
  }
}
