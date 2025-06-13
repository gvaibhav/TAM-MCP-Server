import axios from 'axios';
import { logger } from '../../utils/index.js';
import { CacheService } from '../cache/cacheService.js';
import { DataSourceService } from '../../types/dataSources.js';
import { CacheStatus } from '../../types/cache.js';

const BASE_URL = 'https://data.nasdaq.com/api/v3';

export class NasdaqService implements DataSourceService {
    private cacheService: CacheService;
    private apiKey?: string;

    constructor(cacheService: CacheService, apiKey?: string) {
        this.cacheService = cacheService;
        this.apiKey = apiKey || process.env.NASDAQ_API_KEY || '';
        
        // Log API key status for testing
        if (!this.apiKey) {
            console.error("ℹ️  Nasdaq Data Link: API key not configured - service disabled (set NASDAQ_DATA_LINK_API_KEY to enable)");
        }
    }

    private async fetchApiData(endpoint: string, params: Record<string, any> = {}): Promise<any> {
        const cacheKey = `nasdaq:${endpoint}:${JSON.stringify(params)}`;
        const cachedData = await this.cacheService.get(cacheKey);
        if (cachedData) {
            logger.info('NasdaqService: Cache hit', { cacheKey });
            return cachedData;
        }
        logger.info('NasdaqService: Cache miss', { cacheKey });

        try {
            const apiParams = { ...params };
            if (this.apiKey) {
                apiParams.api_key = this.apiKey;
            }
            
            const response = await axios.get(`${BASE_URL}/${endpoint}`, { params: apiParams });
            
            await this.cacheService.set(cacheKey, response.data, 3600000); // 1 hour TTL
            return response.data;
        } catch (error) {
            logger.error('NasdaqService: API call failed', { 
                error: error instanceof Error ? error.message : error, 
                endpoint, 
                params 
            });
            throw error;
        }
    }

    async getDatasetData(databaseCode: string, datasetCode: string, params?: any): Promise<any> {
        const endpoint = `datasets/${databaseCode}/${datasetCode}/data`;
        return this.fetchApiData(endpoint, params);
    }

    async fetchDatasetTimeSeries(databaseCode: string, datasetCode: string, params?: any): Promise<any> {
        logger.info('NasdaqService.fetchDatasetTimeSeries called', { databaseCode, datasetCode, params });
        
        try {
            const response = await this.getDatasetData(databaseCode, datasetCode, params);
            
            if (!response?.dataset_data?.data) {
                return null;
            }
            
            const { column_names, data } = response.dataset_data;
            
            // Transform to array of objects
            return data.map((row: any[]) => {
                const item: Record<string, any> = {};
                column_names.forEach((col: string, index: number) => {
                    item[col] = row[index];
                });
                return item;
            });
        } catch (error) {
            logger.error('NasdaqService.fetchDatasetTimeSeries failed', { error: error instanceof Error ? error.message : error, databaseCode, datasetCode, params });
            return null;
        }
    }

    async fetchMarketSize(databaseCode: string, datasetCode: string, valueColumn?: string): Promise<any> {
        try {
            const data = await this.fetchDatasetTimeSeries(databaseCode, datasetCode, { limit: 1 });
            
            if (!data || data.length === 0) {
                return null;
            }
            
            const latestData = data[0];
            const column = valueColumn || 'Value';
            
            if (!(column in latestData)) {
                console.warn(`Value column "${column}" not found in dataset. Available columns: ${Object.keys(latestData).join(', ')}`);
                return null;
            }
            
            return latestData[column];
        } catch (error) {
            logger.error('NasdaqService.fetchMarketSize failed', { error: error instanceof Error ? error.message : error, databaseCode, datasetCode, valueColumn });
            return null;
        }
    }

    // Placeholder for search functionality
    async searchDatasets(searchQuery: string, params?: any): Promise<any> {
        logger.warn('NasdaqService.searchDatasets is a placeholder and needs specific implementation.', { searchQuery, params });
        return { message: 'Search functionality not yet implemented for Nasdaq service', query: searchQuery };
    }

    // DataSourceService interface implementation
    async isAvailable(): Promise<boolean> {
        // Nasdaq API is available without key for some basic functionality
        return true;
    }

    async getDataFreshness(...args: any[]): Promise<Date | null> {
        // Try to get freshness based on cache entry
        const [databaseCode, datasetCode, params] = args;
        if (!databaseCode || !datasetCode) {
            return null;
        }

        const endpoint = `datasets/${databaseCode}/${datasetCode}/data`;
        const cacheKey = `nasdaq:${endpoint}:${JSON.stringify(params || {})}`;
        
        const entry = await this.cacheService.getEntry(cacheKey);
        return entry ? new Date(entry.timestamp) : null;
    }

    getCacheStatus(): CacheStatus {
        return this.cacheService.getStats();
    }

    async fetchIndustryData(...args: any[]): Promise<any> {
        const [databaseCode, datasetCode, params] = args;
        if (!databaseCode || !datasetCode) {
            logger.warn('NasdaqService.fetchIndustryData: Missing required parameters');
            return null;
        }

        try {
            return await this.fetchDatasetTimeSeries(databaseCode, datasetCode, params);
        } catch (error) {
            logger.error('NasdaqService.fetchIndustryData failed', { error: error instanceof Error ? error.message : error, args });
            return null;
        }
    }
}
