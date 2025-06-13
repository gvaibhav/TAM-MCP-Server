import axios from 'axios';
import { logger } from '../../utils/index.js';
import { CacheService } from '../cache/cacheService.js';
import { DataSourceService } from '../../types/dataSources.js';
import { CacheStatus } from '../../types/cache.js';
import { getEnvAsNumber } from '../../utils/envHelper.js';

const BASE_URL = 'https://api.stlouisfed.org/fred';

export class FredService implements DataSourceService {
    private cacheService: CacheService;
    private apiKey?: string;

    constructor(cacheService: CacheService, apiKey?: string) {
        this.cacheService = cacheService;
        this.apiKey = apiKey || process.env.FRED_API_KEY || '';
        
        // Log API key status for testing
        if (!this.apiKey) {
            console.error("ℹ️  FRED: API key not configured - service disabled (set FRED_API_KEY to enable)");
        }
    }

    private async fetchApiData(endpoint: string, params: Record<string, string>): Promise<any> {
        const cacheKey = `fred:${endpoint}:${JSON.stringify(params)}`;
        const cachedData = await this.cacheService.get(cacheKey);
        if (cachedData) {
            logger.info('FredService: Cache hit', { cacheKey });
            return cachedData;
        }
        logger.info('FredService: Cache miss', { cacheKey });

        try {
            if (!this.apiKey) {
                throw new Error('FRED API key is required');
            }

            const response = await axios.get(`${BASE_URL}/${endpoint}`, {
                params: { ...params, api_key: this.apiKey, file_type: 'json' }
            });
            
            if (response.data.error_code) {
                throw new Error(`FRED API Error: ${response.data.error_message}`);
            }
            
            await this.cacheService.set(cacheKey, response.data, 3600000); // 1 hour TTL
            return response.data;
        } catch (error) {
            logger.error('FredService: API call failed', { 
                error: error instanceof Error ? error.message : error, 
                endpoint, 
                params 
            });
            throw error;
        }
    }

    async getSeriesObservations(seriesId: string, params?: any): Promise<any> {
        const apiParams: Record<string, string> = { series_id: seriesId };
        
        if (params) {
            if (params.start_date) apiParams.start_date = params.start_date;
            if (params.end_date) apiParams.end_date = params.end_date;
            if (params.limit) apiParams.limit = params.limit.toString();
            if (params.offset) apiParams.offset = params.offset.toString();
            if (params.sort_order) apiParams.sort_order = params.sort_order;
        }

        return this.fetchApiData('series/observations', apiParams);
    }

    async fetchMarketSize(seriesId: string, region?: string): Promise<any> {
        if (!this.apiKey) {
            throw new Error('FRED API key is not configured');
        }

        const cacheKey = `fred_marketsize_${seriesId}`;
        
        const cachedData = await this.cacheService.get(cacheKey);
        if (cachedData) {
            logger.info('FredService: Cache hit', { cacheKey });
            return cachedData;
        }
        logger.info('FredService: Cache miss', { cacheKey });

        try {
            const response = await axios.get(`${BASE_URL}/series/observations`, {
                params: {
                    series_id: seriesId,
                    api_key: this.apiKey,
                    file_type: 'json',
                    sort_order: 'desc',
                    limit: '1'
                }
            });
            
            if (response.data.error_code) {
                throw new Error(`FRED API Error: ${response.data.error_message}`);
            }
            
            if (!response.data.observations || response.data.observations.length === 0) {
                logger.warn('FredService: No observations found', { seriesId });
                
                const noDataTtl = getEnvAsNumber('CACHE_TTL_FRED_NODATA_MS', 300000);
                await this.cacheService.set(cacheKey, null, noDataTtl);
                return null;
            }
            
            // Transform to expected format
            const transformedData = response.data.observations.map((obs: any) => ({
                date: obs.date,
                value: parseFloat(obs.value) || null
            }));
            
            const successTtl = getEnvAsNumber('CACHE_TTL_FRED_MS', 3600000);
            await this.cacheService.set(cacheKey, transformedData, successTtl);
            
            logger.info('FredService: Data fetched and cached', { cacheKey, observationCount: transformedData.length });
            return transformedData;

        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.data?.error_message) {
                const errorMsg = `FRED API Error: ${error.response.data.error_message}`;
                console.error('FredService: API error', { error: errorMsg, seriesId });
                
                const noDataTtl = getEnvAsNumber('CACHE_TTL_FRED_NODATA_MS', 300000);
                await this.cacheService.set(cacheKey, null, noDataTtl);
                throw new Error(errorMsg);
            }
            
            logger.error('FredService.fetchMarketSize failed', { 
                error: error instanceof Error ? error.message : error, 
                seriesId, region 
            });
            
            const noDataTtl = getEnvAsNumber('CACHE_TTL_FRED_NODATA_MS', 300000);
            await this.cacheService.set(cacheKey, null, noDataTtl);
            throw error;
        }
    }

    // Placeholder for search functionality
    async searchSeries(searchText: string, params?: any): Promise<any> {
        logger.warn('FredService.searchSeries is a placeholder and needs specific implementation.', { searchText, params });
        return { message: 'Search functionality not yet implemented for FRED service', query: searchText };
    }

    // DataSourceService interface implementation
    async isAvailable(): Promise<boolean> {
        return Boolean(this.apiKey);
    }

    async getDataFreshness(...args: any[]): Promise<Date | null> {
        const [seriesId] = args;
        if (!seriesId) {
            return null;
        }

        const cacheKey = `fred_marketsize_${seriesId}`;
        
        const entry = await this.cacheService.getEntry(cacheKey);
        return entry ? new Date(entry.timestamp) : null;
    }

    getCacheStatus(): CacheStatus {
        return this.cacheService.getStats();
    }

    async fetchIndustryData(...args: any[]): Promise<any> {
        const [seriesId, params] = args;
        if (!seriesId) {
            logger.warn('FredService.fetchIndustryData: No series ID provided');
            return null;
        }

        if (!this.apiKey) {
            throw new Error('FRED API key is not configured or service is not available');
        }

        try {
            return await this.getSeriesObservations(seriesId, params);
        } catch (error) {
            logger.error('FredService.fetchIndustryData failed', { error: error instanceof Error ? error.message : error, args });
            throw new Error('not yet implemented');
        }
    }
}
