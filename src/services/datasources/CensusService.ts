import axios from 'axios';
import { CacheManager, logger } from '../../utils/index.js';

const API_KEY = process.env.CENSUS_API_KEY; // Census API key is optional for some datasets
const BASE_URL = 'https://api.census.gov/data';

export class CensusService {
    private cache: typeof CacheManager;

    constructor() {
        this.cache = CacheManager;
    }

    private async fetchApiData(endpoint: string, params: Record<string, any> = {}): Promise<any> {
        const cacheKey = `census:${endpoint}:${JSON.stringify(params)}`;
        const cachedData = this.cache.get(cacheKey);
        if (cachedData) {
            logger.info('CensusService: Cache hit', { cacheKey });
            return cachedData;
        }
        logger.info('CensusService: Cache miss', { cacheKey });

        try {
            const apiParams = { ...params };
            if (API_KEY) {
                apiParams.key = API_KEY;
            }
            
            const response = await axios.get(`${BASE_URL}/${endpoint}`, { params: apiParams });
            
            // Census API returns arrays, first row is usually headers
            if (Array.isArray(response.data) && response.data.length === 0) {
                throw new Error('Census API returned empty result set');
            }
            
            this.cache.set(cacheKey, response.data);
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

    async fetchIndustryData(params: {
        variables: string[];
        forGeography: string;
        filterParams?: Record<string, string>;
        year: string;
        datasetPath: string;
    }): Promise<any> {
        const endpoint = `${params.year}/${params.datasetPath}`;
        
        const apiParams: Record<string, any> = {
            get: params.variables.join(','),
            for: params.forGeography
        };
        
        // Add filter parameters
        if (params.filterParams) {
            Object.assign(apiParams, params.filterParams);
        }
        
        return this.fetchApiData(endpoint, apiParams);
    }

    async fetchMarketSize(params: {
        naicsCode: string;
        geography: string;
        measure: 'EMP' | 'PAYANN' | 'ESTAB'; // Employment, Annual Payroll, Establishments
        year: string;
    }): Promise<any> {
        logger.info('CensusService.fetchMarketSize called', params);
        
        // Use County Business Patterns (CBP) dataset
        const datasetPath = `cbp/${params.year}`;
        const endpoint = datasetPath;
        
        const variables = [params.measure];
        const apiParams: Record<string, any> = {
            get: variables.join(','),
            for: params.geography,
            NAICS2017: params.naicsCode
        };
        
        return this.fetchApiData(endpoint, apiParams);
    }

    // Placeholder for NAICS search functionality
    async searchNaics(searchQuery: string, params?: any): Promise<any> {
        logger.info('CensusService.searchNaics called', { searchQuery, params });
        
        // This would need to implement NAICS code lookup logic
        // Census doesn't have a direct search API for NAICS codes
        logger.warn('CensusService.searchNaics is a placeholder and needs specific implementation.');
        return { message: 'NAICS search functionality not yet implemented for Census service', query: searchQuery };
    }

    // Generic method for fetching census data
    async getData(params: {
        variables: string[];
        forGeography: string;
        filterParams?: Record<string, string>;
        year: string;
        datasetPath: string;
    }): Promise<any> {
        return this.fetchIndustryData(params);
    }
}
