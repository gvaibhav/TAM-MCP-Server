import axios from 'axios';
import { logger } from '../../utils/index.js';
import { CacheService } from '../cache/cacheService.js';
import { DataSourceService } from '../../types/dataSources.js';
import { CacheStatus } from '../../types/cache.js';

const BASE_URL = 'https://stats.oecd.org/SDMX-JSON/data';

export class OecdService implements DataSourceService {
    private cacheService: CacheService;

    constructor(cacheService: CacheService) {
        this.cacheService = cacheService;
    }

    private async fetchApiData(endpoint: string): Promise<any> {
        const cacheKey = `oecd:${endpoint}`;
        const cachedData = await this.cacheService.get(cacheKey);
        if (cachedData) {
            logger.info('OecdService: Cache hit', { cacheKey });
            return cachedData;
        }
        logger.info('OecdService: Cache miss', { cacheKey });

        try {
            const response = await axios.get(`${BASE_URL}/${endpoint}`);
            await this.cacheService.set(cacheKey, response.data, 3600000); // 1 hour TTL
            return response.data;
        } catch (error) {
            logger.error('OecdService: API call failed', { 
                error: error instanceof Error ? error.message : error, 
                endpoint 
            });
            throw error;
        }
    }

    async fetchOecdDataset(
        datasetId: string,
        filterExpression?: string,
        agencyId: string = 'OECD',
        startTime?: string,
        endTime?: string,
        dimensionAtObservation: string = 'AllDimensions'
    ): Promise<any> {
        logger.info('OecdService.fetchOecdDataset called', { datasetId, filterExpression, agencyId, startTime, endTime, dimensionAtObservation });
        
        let endpoint = `${datasetId}`;
        
        if (filterExpression) {
            endpoint += `/${filterExpression}`;
        }
        
        endpoint += `/${agencyId}`;
        
        const queryParams: string[] = [];
        if (startTime) queryParams.push(`startTime=${startTime}`);
        if (endTime) queryParams.push(`endTime=${endTime}`);
        queryParams.push(`dimensionAtObservation=${dimensionAtObservation}`);
        
        if (queryParams.length > 0) {
            endpoint += `?${queryParams.join('&')}`;
        }

        try {
            const data = await this.fetchApiData(endpoint);
            
            // Extract observations from OECD SDMX-JSON structure
            if (data?.dataSets?.[0]?.observations) {
                const observations = data.dataSets[0].observations;
                
                // Transform OECD observations to more usable format
                const transformedData = Object.entries(observations).map(([key, value]: [string, any]) => ({
                    key,
                    value: Array.isArray(value) ? value[0] : value,
                    attributes: Array.isArray(value) && value.length > 1 ? value.slice(1) : []
                }));
                
                return transformedData.length > 0 ? transformedData : null;
            }
            
            return null;
        } catch (error) {
            logger.error('OecdService.fetchOecdDataset failed', { error: error instanceof Error ? error.message : error, datasetId, filterExpression });
            return null;
        }
    }

    async fetchMarketSize(datasetId: string, filterExpression?: string): Promise<any> {
        try {
            const data = await this.fetchOecdDataset(datasetId, filterExpression);
            
            if (!data || data.length === 0) {
                return null;
            }
            
            // Return the most recent observation
            return data[data.length - 1];
        } catch (error) {
            logger.error('OecdService.fetchMarketSize failed', { error: error instanceof Error ? error.message : error, datasetId, filterExpression });
            return null;
        }
    }

    // Placeholder for search functionality
    async searchDatasets(searchQuery: string, params?: any): Promise<any> {
        logger.warn('OecdService.searchDatasets is a placeholder and needs specific implementation.', { searchQuery, params });
        return { message: 'Search functionality not yet implemented for OECD service', query: searchQuery };
    }

    // DataSourceService interface implementation
    async isAvailable(): Promise<boolean> {
        // OECD API is publicly available
        return true;
    }

    async getDataFreshness(...args: any[]): Promise<Date | null> {
        // Try to get freshness based on cache entry
        const [datasetId, filterExpression, agencyId, startTime, endTime, dimensionAtObservation] = args;
        if (!datasetId) {
            return null;
        }

        let endpoint = `${datasetId}`;
        
        if (filterExpression) {
            endpoint += `/${filterExpression}`;
        }
        
        endpoint += `/${agencyId || 'OECD'}`;
        
        const queryParams: string[] = [];
        if (startTime) queryParams.push(`startTime=${startTime}`);
        if (endTime) queryParams.push(`endTime=${endTime}`);
        queryParams.push(`dimensionAtObservation=${dimensionAtObservation || 'AllDimensions'}`);
        
        if (queryParams.length > 0) {
            endpoint += `?${queryParams.join('&')}`;
        }

        const cacheKey = `oecd:${endpoint}`;
        
        const entry = await this.cacheService.getEntry(cacheKey);
        return entry ? new Date(entry.timestamp) : null;
    }

    getCacheStatus(): CacheStatus {
        return this.cacheService.getStats();
    }

    async fetchIndustryData(...args: any[]): Promise<any> {
        const [datasetId, filterExpression, agencyId, startTime, endTime, dimensionAtObservation] = args;
        if (!datasetId) {
            logger.warn('OecdService.fetchIndustryData: Missing required datasetId');
            return null;
        }

        try {
            return await this.fetchOecdDataset(datasetId, filterExpression, agencyId, startTime, endTime, dimensionAtObservation);
        } catch (error) {
            logger.error('OecdService.fetchIndustryData failed', { error: error instanceof Error ? error.message : error, args });
            return null;
        }
    }
}
