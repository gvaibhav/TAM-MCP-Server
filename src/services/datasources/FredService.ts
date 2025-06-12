import axios from 'axios';
import { CacheManager, logger } from '../../utils/index.js';

const API_KEY = process.env.FRED_API_KEY || 'YOUR_API_KEY';
const BASE_URL = 'https://api.stlouisfed.org/fred';

export class FredService {
    private cache: typeof CacheManager;

    constructor() {
        this.cache = CacheManager;
    }

    private async fetchApiData(endpoint: string, params: Record<string, string>): Promise<any> {
        const cacheKey = `fred:${endpoint}:${JSON.stringify(params)}`;
        const cachedData = this.cache.get(cacheKey);
        if (cachedData) {
            logger.info('FredService: Cache hit', { cacheKey });
            return cachedData;
        }
        logger.info('FredService: Cache miss', { cacheKey });

        try {
            const response = await axios.get(`${BASE_URL}/${endpoint}`, {
                params: { ...params, api_key: API_KEY, file_type: 'json' }
            });
            
            if (response.data.error_code) {
                throw new Error(`FRED API Error: ${response.data.error_message}`);
            }
            
            this.cache.set(cacheKey, response.data);
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
        
        // Add optional parameters
        if (params?.realtime_start) apiParams.realtime_start = params.realtime_start;
        if (params?.realtime_end) apiParams.realtime_end = params.realtime_end;
        if (params?.limit) apiParams.limit = params.limit.toString();
        if (params?.offset) apiParams.offset = params.offset.toString();
        if (params?.sort_order) apiParams.sort_order = params.sort_order;
        if (params?.observation_start) apiParams.observation_start = params.observation_start;
        if (params?.observation_end) apiParams.observation_end = params.observation_end;
        if (params?.units) apiParams.units = params.units;
        if (params?.frequency) apiParams.frequency = params.frequency;
        if (params?.aggregation_method) apiParams.aggregation_method = params.aggregation_method;
        if (params?.output_type) apiParams.output_type = params.output_type;
        if (params?.vintage_dates) apiParams.vintage_dates = params.vintage_dates;

        return this.fetchApiData('series/observations', apiParams);
    }

    // Generic method for market size data - maps to getSeriesObservations for now
    async fetchMarketSize(params: any): Promise<any> {
        logger.info('FredService.fetchMarketSize called', params);
        return this.getSeriesObservations(params.seriesId, params);
    }

    // Placeholder for search functionality
    async searchSeries(searchText: string, params?: any): Promise<any> {
        const apiParams: Record<string, string> = { search_text: searchText };
        
        if (params?.search_type) apiParams.search_type = params.search_type;
        if (params?.realtime_start) apiParams.realtime_start = params.realtime_start;
        if (params?.realtime_end) apiParams.realtime_end = params.realtime_end;
        if (params?.limit) apiParams.limit = params.limit.toString();
        if (params?.offset) apiParams.offset = params.offset.toString();
        if (params?.order_by) apiParams.order_by = params.order_by;
        if (params?.sort_order) apiParams.sort_order = params.sort_order;
        if (params?.filter_variable) apiParams.filter_variable = params.filter_variable;
        if (params?.filter_value) apiParams.filter_value = params.filter_value;
        if (params?.tag_names) apiParams.tag_names = params.tag_names;
        if (params?.exclude_tag_names) apiParams.exclude_tag_names = params.exclude_tag_names;

        return this.fetchApiData('series/search', apiParams);
    }
}
