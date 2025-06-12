import axios from 'axios';
import { CacheManager, logger } from '../../utils/index.js';

const API_KEY = process.env.NASDAQ_DATA_LINK_API_KEY || 'YOUR_API_KEY';
const BASE_URL = 'https://data.nasdaq.com/api/v3';

export class NasdaqService {
    private cache: typeof CacheManager;

    constructor() {
        this.cache = CacheManager;
    }

    private async fetchApiData(endpoint: string, params: Record<string, any> = {}): Promise<any> {
        const cacheKey = `nasdaq:${endpoint}:${JSON.stringify(params)}`;
        const cachedData = this.cache.get(cacheKey);
        if (cachedData) {
            logger.info('NasdaqService: Cache hit', { cacheKey });
            return cachedData;
        }
        logger.info('NasdaqService: Cache miss', { cacheKey });

        try {
            const response = await axios.get(`${BASE_URL}/${endpoint}`, {
                params: { ...params, api_key: API_KEY }
            });
            
            if (response.data.quandl_error) {
                throw new Error(`Nasdaq Data Link API Error: ${response.data.quandl_error.message}`);
            }
            
            this.cache.set(cacheKey, response.data);
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

    async fetchDatasetTimeSeries(params: {
        databaseCode: string;
        datasetCode: string;
        apiParams?: any;
    }): Promise<any> {
        const endpoint = `datasets/${params.databaseCode}/${params.datasetCode}/data.json`;
        return this.fetchApiData(endpoint, params.apiParams || {});
    }

    async fetchIndustryData(params: {
        databaseCode: string;
        datasetCode: string;
        apiParams?: any;
    }): Promise<any> {
        logger.info('NasdaqService.fetchIndustryData called', params);
        return this.fetchDatasetTimeSeries(params);
    }

    async fetchMarketSize(params: {
        databaseCode: string;
        datasetCode: string;
        valueColumn?: string;
        date?: string;
    }): Promise<any> {
        logger.info('NasdaqService.fetchMarketSize called', params);
        
        const apiParams: any = {};
        if (params.date) {
            apiParams.start_date = params.date;
            apiParams.end_date = params.date;
        } else {
            apiParams.rows = 1; // Get latest observation
        }
        
        const result = await this.fetchDatasetTimeSeries({
            databaseCode: params.databaseCode,
            datasetCode: params.datasetCode,
            apiParams
        });
        
        // Extract specific value if valueColumn is specified
        if (params.valueColumn && result.dataset_data?.data?.length > 0) {
            const columnNames = result.dataset_data.column_names;
            const columnIndex = columnNames.indexOf(params.valueColumn);
            if (columnIndex >= 0) {
                const latestRow = result.dataset_data.data[0];
                return {
                    ...result,
                    extractedValue: latestRow[columnIndex],
                    extractedColumn: params.valueColumn
                };
            }
        }
        
        return result;
    }

    // Placeholder for search functionality
    async searchDataset(searchQuery: string, params?: any): Promise<any> {
        logger.info('NasdaqService.searchDataset called', { searchQuery, params });
        const endpoint = 'datasets.json';
        const searchParams = { query: searchQuery, ...params };
        return this.fetchApiData(endpoint, searchParams);
    }
}
