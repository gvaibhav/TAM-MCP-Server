import axios from 'axios';
import { logger } from '../../utils/index.js';
import { CacheService } from '../cache/cacheService.js';
import { DataSourceService } from '../../types/dataSources.js';
import { CacheStatus } from '../../types/cache.js';

const BASE_URL = 'https://api.census.gov/data';

export class CensusService implements DataSourceService {
    private cacheService: CacheService;
    private apiKey?: string;

    constructor(cacheService: CacheService, apiKey?: string) {
        this.cacheService = cacheService;
        this.apiKey = apiKey || process.env.CENSUS_API_KEY || '';
        
        // Log API key status for testing
        if (!this.apiKey) {
            console.error("ℹ️  Census Bureau: API key not configured - service disabled (set CENSUS_API_KEY to enable)");
        }
    }

    private async fetchApiData(endpoint: string, params: Record<string, any> = {}): Promise<any> {
        // Use endpoint directly in cache key format to match test expectations
        const cacheKey = `census_${endpoint}_${JSON.stringify(params)}`;
        
        const cachedData = await this.cacheService.get(cacheKey);
        if (cachedData) {
            logger.info('CensusService: Cache hit', { cacheKey });
            return cachedData;
        }
        logger.info('CensusService: Cache miss', { cacheKey });

        try {
            const apiParams = { ...params };
            if (this.apiKey) {
                apiParams.key = this.apiKey;
            }
            
            const response = await axios.get(`${BASE_URL}/${endpoint}`, { params: apiParams });
            
            // Census API returns arrays, first row is usually headers
            if (Array.isArray(response.data) && response.data.length === 0) {
                throw new Error('Census API returned empty result set');
            }
            
            await this.cacheService.set(cacheKey, response.data, 3600000); // 1 hour TTL
            return response.data;
        } catch (error) {
            logger.error('CensusService: API call failed', { 
                error: error instanceof Error ? error.message : error, 
                endpoint, 
                params 
            });
            throw error;
        }
    }

    async fetchIndustryData(...args: any[]): Promise<any> {
        logger.info('CensusService.fetchIndustryData called', { args });
        
        // Handle both structured and individual parameter calls
        let variables: string | string[];
        let forGeography: string;
        let filterParams: Record<string, string> | undefined;
        let year: string;
        let datasetPath: string;

        if (args.length === 1 && typeof args[0] === 'object' && !Array.isArray(args[0])) {
            // Called with structured parameters (from DataService)
            const params = args[0];
            variables = params.variables;
            forGeography = params.forGeography;
            filterParams = params.filterParams;
            year = params.year || '2021';
            datasetPath = params.datasetPath || 'cbp';
        } else {
            // Called with individual parameters (from tests)
            [variables, forGeography, filterParams, year, datasetPath] = args;
            year = year || '2021';
            datasetPath = datasetPath || 'cbp';
        }

        // Validate required parameters
        if (!variables) {
            throw new Error('Variables must be provided for Census API query.');
        }
        if (!forGeography) {
            throw new Error('Geography must be provided for Census API query.');
        }

        // Check API availability
        if (!(await this.isAvailable())) {
            throw new Error('Census API key is not configured or service is unavailable.');
        }

        // Convert variables to array if it's a string
        const variablesArray = Array.isArray(variables) ? variables : variables.split(',');
        
        let endpoint = `${year}/${datasetPath}`;
        const apiParams: Record<string, any> = {
            get: variablesArray.join(','),
            for: forGeography
        };

        // Add additional filter parameters if provided
        if (filterParams) {
            Object.assign(apiParams, filterParams);
        }

        try {
            const rawData = await this.fetchApiData(endpoint, apiParams);
            
            // Transform Census API response (array format) to objects
            if (Array.isArray(rawData) && rawData.length > 1) {
                const headers = rawData[0];
                const rows = rawData.slice(1);
                
                return rows.map(row => {
                    const obj: Record<string, any> = {};
                    headers.forEach((header: string, index: number) => {
                        let value = row[index];
                        // Try to convert numeric strings to numbers
                        if (typeof value === 'string' && /^\d+$/.test(value)) {
                            value = parseInt(value, 10);
                        }
                        obj[header] = value;
                    });
                    return obj;
                });
            }
            
            return rawData;
        } catch (error) {
            logger.error('CensusService.fetchIndustryData error', { error: error instanceof Error ? error.message : error });
            throw error;
        }
    }

    async fetchMarketSize(industryId: string, region?: string): Promise<any> {
        logger.info('CensusService.fetchMarketSize called', { industryId, region });
        
        // Translate parameters to Census-specific format
        // industryId is expected to be a NAICS code
        // region is optional geography parameter
        const params = {
            naicsCode: industryId,
            geography: region || 'US', // Default to US if no region specified
            measure: 'EMP' as const, // Default to Employment measure
            year: '2022' // Default to latest available year
        };
        
        return this.fetchMarketSizeWithParams(params);
    }

    async fetchMarketSizeWithParams(params: {
        naicsCode: string;
        geography: string;
        measure: 'EMP' | 'PAYANN' | 'ESTAB'; // Employment, Annual Payroll, Establishments
        year: string;
    }): Promise<any> {
        logger.info('CensusService.fetchMarketSizeWithParams called', params);
        
        const { naicsCode, geography, measure, year } = params;
        
        if (!naicsCode) {
            throw new Error('NAICS code must be provided for fetchMarketSize.');
        }

        // Use County Business Patterns (CBP) dataset
        const endpoint = `${year}/cbp`;
        const apiParams = {
            get: measure,
            for: geography,
            NAICS2017: naicsCode
        };

        return this.fetchApiData(endpoint, apiParams);
    }

    // Placeholder for NAICS search functionality
    async searchNaics(searchQuery: string, params?: any): Promise<any> {
        logger.warn('CensusService.searchNaics is a placeholder and needs specific implementation.', { searchQuery, params });
        return { message: 'Search functionality not yet implemented for Census service', query: searchQuery };
    }

    // Generic method for fetching census data
    async getData(params: {
        variables: string[];
        geography: string;
        year: string;
        dataset: string;
        filters?: Record<string, string>;
    }): Promise<any> {
        logger.info('CensusService.getData called', params);
        
        const { variables, geography, year, dataset, filters } = params;
        
        const endpoint = `${year}/${dataset}`;
        const apiParams: Record<string, any> = {
            get: variables.join(','),
            for: geography
        };

        if (filters) {
            Object.assign(apiParams, filters);
        }

        return this.fetchApiData(endpoint, apiParams);
    }

    // DataSourceService interface implementation
    async isAvailable(): Promise<boolean> {
        // Census API requires API key for most datasets
        return Boolean(this.apiKey);
    }

    async getDataFreshness(...args: any[]): Promise<Date | null> {
        // Try to get freshness based on cache entry
        const [variables, forGeography, filterParams, year, datasetPath] = args;
        if (!variables || !year || !datasetPath) {
            return null;
        }

        const endpoint = `${year}/${datasetPath}`;
        const apiParams: Record<string, any> = {
            get: Array.isArray(variables) ? variables.join(',') : variables,
            for: forGeography
        };

        if (filterParams) {
            Object.assign(apiParams, filterParams);
        }

        const cacheKey = `census:${endpoint}:${JSON.stringify(apiParams)}`;
        
        const entry = await this.cacheService.getEntry(cacheKey);
        return entry ? new Date(entry.timestamp) : null;
    }

    getCacheStatus(): CacheStatus {
        return this.cacheService.getStats();
    }
}
