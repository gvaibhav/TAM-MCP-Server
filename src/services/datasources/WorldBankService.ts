import axios from 'axios';
import { CacheManager, logger } from '../../utils/index.js';

const BASE_URL = 'https://api.worldbank.org/v2';

export class WorldBankService {
    private cache: typeof CacheManager;

    constructor() {
        this.cache = CacheManager;
    }

    private async fetchApiData(endpoint: string, params: Record<string, any> = {}): Promise<any> {
        const cacheKey = `worldbank:${endpoint}:${JSON.stringify(params)}`;
        const cachedData = this.cache.get(cacheKey);
        if (cachedData) {
            logger.info('WorldBankService: Cache hit', { cacheKey });
            return cachedData;
        }
        logger.info('WorldBankService: Cache miss', { cacheKey });

        try {
            const response = await axios.get(`${BASE_URL}/${endpoint}`, {
                params: { format: 'json', ...params }
            });
            
            if (response.data[0]?.message) {
                throw new Error(`World Bank API Error: ${response.data[0].message[0].value}`);
            }
            
            this.cache.set(cacheKey, response.data);
            return response.data;
        } catch (error) {
            logger.error('WorldBankService: API call failed', { 
                error: error instanceof Error ? error.message : error, 
                endpoint, 
                params 
            });
            throw error;
        }
    }

    async getIndicatorData(params: {
        countryCode: string;
        indicator: string;
        date?: string;
        mrv?: number; // Most recent values
        gapfill?: string;
        frequency?: string;
    }): Promise<any> {
        const endpoint = `country/${params.countryCode}/indicator/${params.indicator}`;
        
        const apiParams: Record<string, any> = {};
        if (params.date) apiParams.date = params.date;
        if (params.mrv) apiParams.mrv = params.mrv;
        if (params.gapfill) apiParams.gapfill = params.gapfill;
        if (params.frequency) apiParams.frequency = params.frequency;
        
        return this.fetchApiData(endpoint, apiParams);
    }

    async fetchMarketSize(params: {
        countryCode: string;
        indicator?: string;
        date?: string;
        mrv?: number;
    }): Promise<any> {
        logger.info('WorldBankService.fetchMarketSize called', params);
        
        // Default to GDP if no indicator specified
        const indicator = params.indicator || 'NY.GDP.MKTP.CD';
        
        return this.getIndicatorData({
            countryCode: params.countryCode,
            indicator,
            ...(params.date && { date: params.date }),
            mrv: params.mrv || 1 // Get most recent value by default
        });
    }

    // Placeholder for industry data - World Bank doesn't have direct industry classifications
    async fetchIndustryData(params: any): Promise<any> {
        logger.warn('WorldBankService.fetchIndustryData is a placeholder.', params);
        return { message: 'Industry data functionality not available for World Bank service', params };
    }

    // Placeholder for search functionality
    async searchIndicators(searchQuery: string, params?: any): Promise<any> {
        logger.info('WorldBankService.searchIndicators called', { searchQuery, params });
        
        const endpoint = 'indicator';
        const searchParams = { ...params };
        
        // World Bank API doesn't have direct search, but we can list indicators
        // In a real implementation, we'd filter the results based on searchQuery
        return this.fetchApiData(endpoint, searchParams);
    }
}
