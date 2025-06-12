import axios from 'axios';
import { CacheManager, logger } from '../../utils/index.js';

const BASE_URL = 'http://dataservices.imf.org/REST/SDMX_JSON.svc';

export class ImfService {
    private cache: typeof CacheManager;

    constructor() {
        this.cache = CacheManager;
    }

    private async fetchApiData(endpoint: string): Promise<any> {
        const cacheKey = `imf:${endpoint}`;
        const cachedData = this.cache.get(cacheKey);
        if (cachedData) {
            logger.info('ImfService: Cache hit', { cacheKey });
            return cachedData;
        }
        logger.info('ImfService: Cache miss', { cacheKey });

        try {
            const response = await axios.get(`${BASE_URL}/${endpoint}`);
            this.cache.set(cacheKey, response.data);
            return response.data;
        } catch (error) {
            logger.error('ImfService: API call failed', { 
                error: error instanceof Error ? error.message : error, 
                endpoint 
            });
            throw error;
        }
    }

    async fetchImfDataset(params: {
        dataflowId: string;
        key: string;
        startPeriod?: string;
        endPeriod?: string;
    }): Promise<any> {
        let endpoint = `CompactData/${params.dataflowId}/${params.key}`;
        
        const queryParams: string[] = [];
        if (params.startPeriod) queryParams.push(`startPeriod=${params.startPeriod}`);
        if (params.endPeriod) queryParams.push(`endPeriod=${params.endPeriod}`);
        
        if (queryParams.length > 0) {
            endpoint += `?${queryParams.join('&')}`;
        }

        return this.fetchApiData(endpoint);
    }

    async fetchMarketSize(params: {
        dataflowId: string;
        key: string;
        startPeriod?: string;
        endPeriod?: string;
        valueAttribute?: string;
    }): Promise<any> {
        logger.info('ImfService.fetchMarketSize called', params);
        
        // For market size, we typically want the latest observation
        const dataset = await this.fetchImfDataset(params);
        
        // Extract the latest observation based on valueAttribute
        // This is a simplified implementation - actual logic would need to parse IMF SDMX structure
        return dataset;
    }

    // Placeholder for search functionality
    async searchDataset(searchQuery: string, params?: any): Promise<any> {
        logger.warn('ImfService.searchDataset is a placeholder and needs specific implementation.', { searchQuery, params });
        // IMF doesn't have a direct search API, would need to implement custom logic
        return { message: 'Search functionality not yet implemented for IMF service', query: searchQuery };
    }
}
