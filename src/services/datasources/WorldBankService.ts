import axios from 'axios';
import { logger } from '../../utils/index.js';
import { CacheService } from '../cache/cacheService.js';
import { DataSourceService } from '../../types/dataSources.js';
import { CacheStatus } from '../../types/cache.js';

const BASE_URL = 'https://api.worldbank.org/v2';

export class WorldBankService implements DataSourceService {
    private cacheService: CacheService;

    constructor(cacheService: CacheService) {
        this.cacheService = cacheService;
    }

    private async fetchApiData(endpoint: string, params: Record<string, any> = {}): Promise<any> {
        const cacheKey = `worldbank:${endpoint}:${JSON.stringify(params)}`;
        const cachedData = await this.cacheService.get(cacheKey);
        if (cachedData) {
            logger.info('WorldBankService: Cache hit', { cacheKey });
            return cachedData;
        }
        logger.info('WorldBankService: Cache miss', { cacheKey });

        try {
            const apiParams = { format: 'json', ...params };
            
            const response = await axios.get(`${BASE_URL}/${endpoint}`, { params: apiParams });
            
            // World Bank API returns array with metadata and data
            // [0] is metadata, [1] is actual data
            const data = Array.isArray(response.data) && response.data.length > 1 ? response.data[1] : response.data;
            
            await this.cacheService.set(cacheKey, data, 3600000); // 1 hour TTL
            return data;
        } catch (error) {
            logger.error('WorldBankService: API call failed', { 
                error: error instanceof Error ? error.message : error, 
                endpoint, 
                params 
            });
            throw error;
        }
    }

    async getIndicatorData(countryCode: string, indicatorCode: string, params?: any): Promise<any> {
        logger.info('WorldBankService.getIndicatorData called', { countryCode, indicatorCode, params });
        
        const endpoint = `country/${countryCode}/indicator/${indicatorCode}`;
        return this.fetchApiData(endpoint, params);
    }

    async fetchMarketSize(countryCode: string, indicatorCode: string, params?: any): Promise<any> {
        try {
            const data = await this.getIndicatorData(countryCode, indicatorCode, { 
                date: params?.year || new Date().getFullYear() - 1, // Default to previous year
                ...params 
            });
            
            if (!data || data.length === 0) {
                return null;
            }
            
            // Return the most recent data point
            const latestData = data.find((item: any) => item.value !== null) || data[0];
            return latestData ? {
                country: latestData.country?.value,
                indicator: latestData.indicator?.value,
                date: latestData.date,
                value: latestData.value
            } : null;
        } catch (error) {
            logger.error('WorldBankService.fetchMarketSize failed', { error: error instanceof Error ? error.message : error, countryCode, indicatorCode });
            return null;
        }
    }

    // Search functionality for indicators
    async searchIndicators(searchQuery: string, params?: any): Promise<any> {
        try {
            const endpoint = 'indicator';
            const searchParams = { 
                ...params,
                per_page: params?.limit || 50
            };
            
            const data = await this.fetchApiData(endpoint, searchParams);
            
            if (!data) {
                return [];
            }
            
            // Filter results based on search query
            return data.filter((indicator: any) => 
                indicator.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                indicator.id?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        } catch (error) {
            logger.error('WorldBankService.searchIndicators failed', { error: error instanceof Error ? error.message : error, searchQuery });
            return [];
        }
    }

    // DataSourceService interface implementation
    async isAvailable(): Promise<boolean> {
        // World Bank API is publicly available
        return true;
    }

    async getDataFreshness(...args: any[]): Promise<Date | null> {
        // Try to get freshness based on cache entry
        const [countryCode, indicatorCode, params] = args;
        if (!countryCode || !indicatorCode) {
            return null;
        }

        const endpoint = `country/${countryCode}/indicator/${indicatorCode}`;
        const cacheKey = `worldbank:${endpoint}:${JSON.stringify(params || {})}`;
        
        const entry = await this.cacheService.getEntry(cacheKey);
        return entry ? new Date(entry.timestamp) : null;
    }

    getCacheStatus(): CacheStatus {
        return this.cacheService.getStats();
    }

    async fetchIndustryData(...args: any[]): Promise<any> {
        // World Bank doesn't have direct industry data, but we can proxy to indicator data
        logger.warn('WorldBankService.fetchIndustryData not yet implemented', { args });
        throw new Error('WorldBankService.fetchIndustryData not yet implemented');
    }
}
