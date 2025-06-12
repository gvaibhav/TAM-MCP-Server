import axios from 'axios';
import { CacheManager, logger } from '../../utils/index.js';

const BASE_URL = 'https://stats.oecd.org/SDMX-JSON/data';

export class OecdService {
    private cache: typeof CacheManager;

    constructor() {
        this.cache = CacheManager;
    }

    private async fetchApiData(endpoint: string): Promise<any> {
        const cacheKey = `oecd:${endpoint}`;
        const cachedData = this.cache.get(cacheKey);
        if (cachedData) {
            logger.info('OecdService: Cache hit', { cacheKey });
            return cachedData;
        }
        logger.info('OecdService: Cache miss', { cacheKey });

        try {
            const response = await axios.get(`${BASE_URL}/${endpoint}`);
            this.cache.set(cacheKey, response.data);
            return response.data;
        } catch (error) {
            logger.error('OecdService: API call failed', { 
                error: error instanceof Error ? error.message : error, 
                endpoint 
            });
            throw error;
        }
    }

    async fetchOecdDataset(params: {
        datasetId: string;
        filterExpression?: string;
        agencyId?: string;
        startTime?: string;
        endTime?: string;
        dimensionAtObservation?: string;
    }): Promise<any> {
        let endpoint = `${params.agencyId || 'OECD'},${params.datasetId}`;
        
        if (params.filterExpression) {
            endpoint += `/${params.filterExpression}`;
        } else {
            endpoint += '/all';
        }
        
        const queryParams: string[] = [];
        if (params.startTime) queryParams.push(`startTime=${params.startTime}`);
        if (params.endTime) queryParams.push(`endTime=${params.endTime}`);
        if (params.dimensionAtObservation) queryParams.push(`dimensionAtObservation=${params.dimensionAtObservation}`);
        
        if (queryParams.length > 0) {
            endpoint += `?${queryParams.join('&')}`;
        }

        return this.fetchApiData(endpoint);
    }

    async fetchIndustryData(params: {
        datasetId: string;
        filterExpression?: string;
        agencyId?: string;
        startTime?: string;
        endTime?: string;
        dimensionAtObservation?: string;
    }): Promise<any> {
        logger.info('OecdService.fetchIndustryData called', params);
        return this.fetchOecdDataset(params);
    }

    async fetchMarketSize(params: {
        datasetId: string;
        filterExpression?: string;
        valueAttribute?: string;
        agencyId?: string;
        startTime?: string;
        endTime?: string;
        dimensionAtObservation?: string;
    }): Promise<any> {
        logger.info('OecdService.fetchMarketSize called', params);
        
        // For market size, we typically want the latest observation
        const dataset = await this.fetchOecdDataset(params);
        
        // Extract the latest observation based on valueAttribute
        // This is a simplified implementation - actual logic would need to parse OECD SDMX structure
        return dataset;
    }

    // Placeholder for search functionality
    async searchDataset(searchQuery: string, params?: any): Promise<any> {
        logger.warn('OecdService.searchDataset is a placeholder and needs specific implementation.', { searchQuery, params });
        // OECD doesn't have a direct search API, would need to implement custom logic
        return { message: 'Search functionality not yet implemented for OECD service', query: searchQuery };
    }
}
