import axios from 'axios';
import { logger } from '../../utils/index.js';
import { DataSourceService } from '../../types/dataSources.js';

const BASE_URL = 'https://data.nasdaq.com/api/v3';

export class NasdaqService implements DataSourceService {
    private apiKey?: string;

    constructor(apiKey?: string) {
        this.apiKey = apiKey || process.env.NASDAQ_DATA_LINK_API_KEY || '';
        
        if (!this.apiKey) {
            console.log("ℹ️  Nasdaq: API key not configured - using public access with limited rate limits (set NASDAQ_DATA_LINK_API_KEY to enable full access)");
        }
    }

    private async fetchApiData(endpoint: string, params: Record<string, any> = {}): Promise<any> {
        try {
            const apiParams: Record<string, any> = { ...params };
            if (this.apiKey) {
                apiParams.api_key = this.apiKey;
            }

            const response = await axios.get(`${BASE_URL}/${endpoint}`, { 
                params: apiParams 
            });
            
            return response.data;
        } catch (error: any) {
            logger.error('NasdaqService: API call failed', { 
                error: error.message, 
                endpoint, 
                params 
            });
            throw error;
        }
    }

    async fetchDatasetTimeSeries(databaseCode: string, datasetCode: string, params: any = {}): Promise<any> {
        logger.info('NasdaqService.fetchDatasetTimeSeries called', { databaseCode, datasetCode, params });

        const endpoint = `datasets/${databaseCode}/${datasetCode}/data.json`;
        
        try {
            const data = await this.fetchApiData(endpoint, params);
            
            if (!data?.dataset_data) {
                return null;
            }

            return data.dataset_data;
        } catch (error) {
            logger.error('NasdaqService.fetchDatasetTimeSeries failed', { 
                error: error instanceof Error ? error.message : error, 
                databaseCode, datasetCode 
            });
            return null;
        }
    }

    async fetchMarketSize(databaseCode: string, datasetCode: string, valueColumn: string = 'Value'): Promise<any> {
        try {
            const data = await this.fetchDatasetTimeSeries(databaseCode, datasetCode, {
                limit: 1,
                order: 'desc'
            });

            if (!data?.data || data.data.length === 0) {
                return null;
            }

            const latestRecord = data.data[0];
            const columnNames = data.column_names;
            const valueIndex = columnNames.indexOf(valueColumn);
            
            if (valueIndex === -1) {
                logger.warn('NasdaqService.fetchMarketSize: Value column not found', { valueColumn, availableColumns: columnNames });
                return null;
            }

            return {
                value: latestRecord[valueIndex],
                date: latestRecord[0], // First column is typically date
                dataset: `${databaseCode}/${datasetCode}`,
                source: 'Nasdaq Data Link',
                column_names: columnNames
            };
        } catch (error) {
            logger.error('NasdaqService.fetchMarketSize failed', { 
                error: error instanceof Error ? error.message : error, 
                databaseCode, datasetCode, valueColumn 
            });
            return null;
        }
    }

    async fetchIndustryData(databaseCode: string, datasetCode: string, params: any = {}): Promise<any> {
        logger.info('NasdaqService.fetchIndustryData called', { databaseCode, datasetCode, params });
        return this.fetchDatasetTimeSeries(databaseCode, datasetCode, params);
    }

    async searchDatasets(query: string, params: any = {}): Promise<any> {
        try {
            const searchParams = {
                query,
                ...params
            };

            return this.fetchApiData('datasets.json', searchParams);
        } catch (error) {
            logger.error('NasdaqService.searchDatasets failed', { 
                error: error instanceof Error ? error.message : error, 
                query 
            });
            return null;
        }
    }

    async isAvailable(): Promise<boolean> {
        return true; // Nasdaq API is publicly available
    }

    async getDataFreshness(..._args: any[]): Promise<Date | null> {
        // Market data is typically updated daily
        return new Date();
    }
}

export default NasdaqService;
