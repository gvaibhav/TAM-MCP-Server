import axios from 'axios';
import { CacheManager, logger } from '../../utils/index.js';

const API_KEY = process.env.BLS_API_KEY; // BLS API key is optional for some endpoints
const BASE_URL = 'https://api.bls.gov/publicAPI/v2';

export class BlsService {
    private cache: typeof CacheManager;

    constructor() {
        this.cache = CacheManager;
    }

    private async fetchApiData(endpoint: string, data?: any, method: 'GET' | 'POST' = 'GET'): Promise<any> {
        const cacheKey = `bls:${endpoint}:${JSON.stringify(data)}:${method}`;
        const cachedData = this.cache.get(cacheKey);
        if (cachedData) {
            logger.info('BlsService: Cache hit', { cacheKey });
            return cachedData;
        }
        logger.info('BlsService: Cache miss', { cacheKey });

        try {
            let response;
            if (method === 'POST') {
                const postData: any = { ...data };
                if (API_KEY) {
                    postData.registrationkey = API_KEY;
                }
                response = await axios.post(`${BASE_URL}/${endpoint}`, postData);
            } else {
                const params: any = { ...data };
                if (API_KEY) {
                    params.registrationkey = API_KEY;
                }
                response = await axios.get(`${BASE_URL}/${endpoint}`, { params });
            }
            
            if (response.data.status !== 'REQUEST_SUCCEEDED') {
                throw new Error(`BLS API Error: ${response.data.message || 'Unknown error'}`);
            }
            
            this.cache.set(cacheKey, response.data);
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

    async fetchIndustryData(params: any): Promise<any> {
        logger.info('BlsService.fetchIndustryData called', params);
        // Map industry query to BLS series IDs - this would need more sophisticated logic
        return this.getSeriesData(params);
    }

    async fetchMarketSize(params: any): Promise<any> {
        logger.info('BlsService.fetchMarketSize called', params);
        // For market size, we might focus on employment or establishment data
        return this.getSeriesData(params);
    }

    // Placeholder for search functionality
    async searchSeries(searchQuery: string, params?: any): Promise<any> {
        logger.warn('BlsService.searchSeries is a placeholder and needs specific implementation.', { searchQuery, params });
        // BLS doesn't have a direct search API, would need to implement custom logic
        // or use their series ID lookup tables
        return { message: 'Search functionality not yet implemented for BLS service', query: searchQuery };
    }
}
