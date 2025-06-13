// filepath: /home/gvaibhav/Documents/TAM-MCP-Server/src/services/datasources/WorldBankService.ts
import axios from 'axios';
import { logger } from '../../utils/index.js';
import { DataSourceService } from '../../types/dataSources.js';

const BASE_URL = 'https://api.worldbank.org/v2';

export class WorldBankService implements DataSourceService {

    constructor() {
        // World Bank API is publicly available, no API key needed
    }

    private async fetchApiData(endpoint: string, params: Record<string, any> = {}): Promise<any> {
        try {
            const apiParams = { format: 'json', ...params };
            
            const response = await axios.get(`${BASE_URL}/${endpoint}`, { params: apiParams });
            
            // World Bank API returns array with metadata and data
            // [0] is metadata, [1] is actual data
            const data = Array.isArray(response.data) && response.data.length > 1 ? response.data[1] : response.data;
            
            return data;
        } catch (error: any) {
            logger.error('WorldBankService: API call failed', { 
                error: error.message, 
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

    async fetchMarketSize(industryId: string, region?: string): Promise<any> {
        try {
            // For World Bank, we'll use a default country and economic indicator
            // This is a simplified implementation that maps industry to appropriate indicators
            const countryCode = region === 'us' ? 'US' : 'WLD'; // World or US
            let indicatorCode = 'NY.GDP.MKTP.CD'; // Default to GDP
            
            // Map industry to relevant World Bank indicators
            const industryIndicatorMap: Record<string, string> = {
                'technology': 'IC.BUS.EASE.XQ',
                'manufacturing': 'NV.IND.MANF.ZS',
                'agriculture': 'NV.AGR.TOTL.ZS',
                'services': 'NV.SRV.TETC.ZS',
                'energy': 'EG.USE.PCAP.KG.OE',
                'finance': 'FB.BNK.CAPA.ZS'
            };
            
            if (industryIndicatorMap[industryId.toLowerCase()]) {
                indicatorCode = industryIndicatorMap[industryId.toLowerCase()];
            }
            
            const data = await this.getIndicatorData(countryCode, indicatorCode, {
                date: 'MRV:5', // Most recent 5 values
                per_page: 5
            });
            
            if (!data || data.length === 0) {
                return null;
            }
            
            // Find the most recent non-null value
            const latestRecord = data.find((record: any) => record.value !== null);
            
            return {
                value: latestRecord?.value,
                year: latestRecord?.date,
                country: latestRecord?.country?.value,
                indicator: latestRecord?.indicator?.value,
                source: 'World Bank',
                dataset: indicatorCode
            };
        } catch (error) {
            logger.error('WorldBankService.fetchMarketSize failed', { 
                error: error instanceof Error ? error.message : error, 
                industryId, 
                region 
            });
            return null;
        }
    }

    async searchIndicators(searchQuery: string, params?: any): Promise<any> {
        try {
            const endpoint = 'indicator';
            const searchParams = {
                format: 'json',
                per_page: 100,
                ...params
            };

            const data = await this.fetchApiData(endpoint, searchParams);

            if (!data) {
                return [];
            }

            // Filter indicators based on search query
            return data.filter((indicator: any) =>
                indicator.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                indicator.topics?.some((topic: any) => topic.value?.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        } catch (error) {
            logger.error('WorldBankService.searchIndicators failed', { 
                error: error instanceof Error ? error.message : error, 
                searchQuery 
            });
            return [];
        }
    }

    async isAvailable(): Promise<boolean> {
        return true;
    }

    async getDataFreshness(...args: any[]): Promise<Date | null> {
        const [countryCode, indicatorCode] = args;
        if (!countryCode || !indicatorCode) {
            return null;
        }
        return new Date();
    }

    async fetchIndustryData(...args: any[]): Promise<any> {
        logger.warn('WorldBankService.fetchIndustryData not yet implemented', { args });
        throw new Error('WorldBankService.fetchIndustryData not yet implemented');
    }
}

export default WorldBankService;
