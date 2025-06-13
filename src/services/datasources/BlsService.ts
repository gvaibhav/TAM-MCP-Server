import axios from 'axios';
import { logger } from '../../utils/index.js';
import { CacheService } from '../cache/cacheService.js';
import { DataSourceService } from '../../types/dataSources.js';
import { CacheStatus } from '../../types/cache.js';
import { getEnvAsNumber } from '../../utils/envHelper.js';
import { blsApi } from '../../config/apiConfig.js';

export class BlsService implements DataSourceService {
    private cacheService: CacheService;
    private apiKey?: string;

    constructor(cacheService: CacheService, apiKey?: string) {
        this.cacheService = cacheService;
        this.apiKey = apiKey || process.env.BLS_API_KEY || '';
        
        // Log API key status for testing
        if (this.apiKey) {
            console.error("✅ BLS: Service enabled with API key (higher limits)");
        } else {
            console.error("ℹ️  BLS: Using anonymous access (limited requests per day)");
        }
    }

    private async fetchApiData(endpoint: string, data?: any, method: 'GET' | 'POST' = 'GET'): Promise<any> {
        // Create cache key in expected format
        let cacheKey: string;
        if (method === 'POST' && endpoint === 'timeseries/data') {
            cacheKey = `bls_data_${JSON.stringify(data)}`;
        } else {
            cacheKey = `bls:${endpoint}:${JSON.stringify(data)}:${method}`;
        }
        
        const cachedData = await this.cacheService.get(cacheKey);
        if (cachedData) {
            logger.info('BlsService: Cache hit', { cacheKey });
            return cachedData;
        }
        logger.info('BlsService: Cache miss', { cacheKey });

        try {
            let response;
            if (method === 'POST') {
                const postData: any = { ...data };
                if (this.apiKey) {
                    postData.registrationkey = this.apiKey;
                }
                response = await axios.post(blsApi.baseUrlV2, postData, { 
                    headers: { 'Content-Type': 'application/json' } 
                });
            } else {
                const params: any = { ...data };
                if (this.apiKey) {
                    params.registrationkey = this.apiKey;
                }
                response = await axios.get(`${blsApi.baseUrlV2}/${endpoint}`, { params });
            }
            
            if (response.data.status !== 'REQUEST_SUCCEEDED') {
                throw new Error(`BLS API Error: ${response.data.message || 'Unknown error'}`);
            }
            
            await this.cacheService.set(cacheKey, response.data, 3600000); // 1 hour TTL
            return response.data;
        } catch (error) {
            logger.error('BlsService: API call failed', { 
                error: error instanceof Error ? error.message : error, 
                endpoint, 
                data, 
                method 
            });
            throw error;
        }
    }

    async getSeriesData(params: {
        seriesid: string[];
        startyear?: string;
        endyear?: string;
        catalog?: boolean;
        calculations?: boolean;
        annualaverage?: boolean;
        aspects?: boolean;
    }): Promise<any> {
        // Validate required parameters
        if (!params.seriesid || !Array.isArray(params.seriesid) || params.seriesid.length === 0) {
            throw new Error('BLS series IDs must be provided.');
        }
        
        // Use POST for multiple series or when using advanced parameters
        if (params.seriesid.length > 1 || params.startyear || params.endyear || 
            params.catalog || params.calculations || params.annualaverage || params.aspects) {
            return this.fetchApiData('timeseries/data', params, 'POST');
        } else {
            // Use GET for simple single series requests
            return this.fetchApiData(`timeseries/data/${params.seriesid[0]}`);
        }
    }

    async fetchSeriesData(params: {
        seriesid: string[];
        startyear?: string;
        endyear?: string;
        catalog?: boolean;
        calculations?: boolean;
        annualaverage?: boolean;
        aspects?: boolean;
    }): Promise<any> {
        logger.info('BlsService.fetchSeriesData called', params);
        return this.getSeriesData(params);
    }

    // Placeholder for search functionality
    async searchSeries(searchQuery: string, params?: any): Promise<any> {
        logger.warn('BlsService.searchSeries is a placeholder and needs specific implementation.', { searchQuery, params });
        // BLS doesn't have a direct search API, would need to implement custom logic
        // or use their series ID lookup tables
        return { message: 'Search functionality not yet implemented for BLS service', query: searchQuery };
    }

    // DataSourceService interface implementation
    async isAvailable(): Promise<boolean> {
        // BLS API is available without key for basic functionality
        return true;
    }

    async getDataFreshness(...args: any[]): Promise<Date | null> {
        const [seriesIds, startYear, endYear, catalog, calculations, annualaverage] = args;
        if (!seriesIds) {
            return null;
        }

        const seriesArray = Array.isArray(seriesIds) ? seriesIds : [seriesIds];
        const payload: any = {
            seriesid: seriesArray,
            startyear: startYear,
            endyear: endYear,
            catalog: catalog === true,
            calculations: calculations === true,
            annualaverage: annualaverage === true
        };

        if (this.apiKey) {
            payload.registrationkey = this.apiKey;
        }

        const cacheKey = `bls_data_${JSON.stringify(payload)}`;
        
        const entry = await this.cacheService.getEntry(cacheKey);
        return entry ? new Date(entry.timestamp) : null;
    }

    getCacheStatus(): CacheStatus {
        return this.cacheService.getStats();
    }

    async fetchIndustryData(...args: any[]): Promise<any> {
        const [seriesIds, startYear, endYear, catalog, calculations, annualaverage] = args;
        
        if (!seriesIds || (Array.isArray(seriesIds) && seriesIds.length === 0)) {
            throw new Error('BLS series IDs must be provided.');
        }

        // Validate series IDs array length
        const seriesArray = Array.isArray(seriesIds) ? seriesIds : [seriesIds];
        
        if (!this.apiKey && seriesArray.length > 25) {
            console.warn("BLS API: Too many series requested for anonymous access (25 max)");
        } else if (this.apiKey && seriesArray.length > 50) {
            console.warn("BLS API: Too many series requested for registered access (50 max)");
        }

        // Create payload for cache key (always include booleans)
        const cachePayload: any = {
            seriesid: seriesArray,
            startyear: startYear,
            endyear: endYear,
            catalog: catalog === true,
            calculations: calculations === true,
            annualaverage: annualaverage === true
        };

        if (this.apiKey) {
            cachePayload.registrationkey = this.apiKey;
        }

        // Create cache key
        const cacheKey = `bls_data_${JSON.stringify(cachePayload)}`;
        
        const cachedData = await this.cacheService.get(cacheKey);
        if (cachedData) {
            logger.info('BlsService: Cache hit', { cacheKey });
            return cachedData;
        }
        logger.info('BlsService: Cache miss', { cacheKey });

        // Create payload for API request (only include true booleans)
        const apiPayload: any = {
            seriesid: seriesArray,
            startyear: startYear,
            endyear: endYear
        };

        if (catalog === true) apiPayload.catalog = true;
        if (calculations === true) apiPayload.calculations = true;
        if (annualaverage === true) apiPayload.annualaverage = true;

        if (this.apiKey) {
            apiPayload.registrationkey = this.apiKey;
        }

        try {
            const response = await axios.post(blsApi.baseUrlV2, apiPayload, { 
                headers: { 'Content-Type': 'application/json' } 
            });
            
            const data = response.data;
            
            // Check for API error
            if (data.status !== 'REQUEST_SUCCEEDED') {
                console.error('BLS API error:', data.message || 'Unknown error');
                
                const noDataTtl = getEnvAsNumber('CACHE_TTL_BLS_NODATA_MS', 300000);
                await this.cacheService.set(cacheKey, null, noDataTtl);
                throw new Error(`BLS API Error: ${data.message || 'Unknown error'}`);
            }

            // Handle successful response but no data
            if (!data.Results || !data.Results.series || data.Results.series.length === 0) {
                logger.warn('BlsService: No series data in response', { seriesIds });
                
                const noDataTtl = getEnvAsNumber('CACHE_TTL_BLS_NODATA_MS', 300000);
                await this.cacheService.set(cacheKey, null, noDataTtl);
                return null;
            }

            // Cache successful response
            const successTtl = getEnvAsNumber('CACHE_TTL_BLS_MS', 3600000);
            await this.cacheService.set(cacheKey, data.Results, successTtl);
            
            logger.info('BlsService: Data fetched and cached', { cacheKey, seriesCount: data.Results.series.length });
            return data.Results;

        } catch (error) {
            // Handle axios errors
            if (axios.isAxiosError(error)) {
                let errorMsg = 'BLS API request failed';
                
                if (error.response?.data) {
                    const errorData = error.response.data;
                    if (errorData.status === 'REQUEST_NOT_PROCESSED' && errorData.message) {
                        errorMsg = `BLS API Error: ${errorData.message.join(', ')} (Status: ${errorData.status})`;
                    } else if (errorData.status === 'ERROR_VALIDATION' && errorData.message) {
                        errorMsg = `BLS API Error: ${errorData.message.join(', ')} (Status: ${errorData.status})`;
                    }
                }
                
                console.error('BlsService: API call failed', { 
                    error: errorMsg, 
                    seriesIds, 
                    responseData: error.response?.data 
                });
                
                const noDataTtl = getEnvAsNumber('CACHE_TTL_BLS_NODATA_MS', 300000);
                await this.cacheService.set(cacheKey, null, noDataTtl);
                throw new Error(errorMsg);
            }
            
            logger.error('BlsService: API call failed', { 
                error: error instanceof Error ? error.message : error, 
                seriesIds 
            });
            
            const noDataTtl = getEnvAsNumber('CACHE_TTL_BLS_NODATA_MS', 300000);
            await this.cacheService.set(cacheKey, null, noDataTtl);
            throw error;
        }
    }

    async fetchMarketSize(industryId: string, region?: string): Promise<any> {
        console.warn('BLS Service: fetchMarketSize is not directly applicable. Use fetchIndustryData with specific series IDs', { industryId, region });
        return null;
    }
}
