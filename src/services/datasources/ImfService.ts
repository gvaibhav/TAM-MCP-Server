import axios from 'axios';
import { logger } from '../../utils/index.js';
import { DataSourceService } from '../../types/dataSources.js';
import { imfApi } from '../../config/apiConfig.js';
import { APIService } from '../APIService.js';

export class ImfService extends APIService implements DataSourceService {
    constructor(_apiKey?: string) {
        super('https://dataservices.imf.org/REST/SDMX_JSON.svc');
        console.error('ImfService: Constructor - API Configuration:', { available: true });
    }

    async fetchImfDataset(dataflowId: string, key: string, startPeriod?: string, endPeriod?: string): Promise<any> {
        // Parameter validation
        if (!dataflowId || !key) {
            throw new Error('Dataflow ID and Key must be provided');
        }

        logger.info('ImfService.fetchImfDataset called', { dataflowId, key, startPeriod, endPeriod });

        try {
            // Build URL and query parameters
            const url = `${imfApi.baseUrl}/CompactData/${dataflowId}/${key}`;
            const params: any = {};
            if (startPeriod) params.startPeriod = startPeriod;
            if (endPeriod) params.endPeriod = endPeriod;

            const response = await axios.get(url, { params });
            const data = response.data;

            // Parse SDMX JSON format
            const parsedData = this.parseSdmxCompactData(data);
            
            return parsedData;

        } catch (error: any) {
            logger.error('ImfService: API call failed', { 
                error: error instanceof Error ? error.message : error, 
                dataflowId, key, startPeriod, endPeriod
            });

            // Handle axios errors with specific message format
            if (error.isAxiosError && error.response) {
                const status = error.response.status;
                const errorData = error.response.data;
                throw new Error(`IMF API Error: ${status} - ${JSON.stringify(errorData)}`);
            }

            throw error;
        }
    }

    private parseSdmxCompactData(data: any): any[] | null {
        try {
            // Check for proper structure
            if (!data.structure?.dimensions?.series) {
                console.warn('ImfService: Series structure definition not found in response');
                return null;
            }

            if (!data.dataSets || !Array.isArray(data.dataSets) || data.dataSets.length === 0) {
                console.warn('ImfService: No datasets found in response');
                return null;
            }

            const dataset = data.dataSets[0];
            if (!dataset.series || Object.keys(dataset.series).length === 0) {
                console.warn('ImfService: No series data found in dataset');
                return null;
            }

            const structure = data.structure;
            const seriesDimensions = structure.dimensions.series;
            const observationAttributes = structure.attributes?.observation || [];
            const seriesAttributes = structure.attributes?.series || [];

            const result: any[] = [];

            // Process each series
            for (const [seriesKey, seriesData] of Object.entries(dataset.series)) {
                const series = seriesData as any;
                
                // Parse series key (e.g., "1:0:0:0" -> [1,0,0,0])
                const keyParts = seriesKey.split(':').map(Number);
                
                // Build series dimension values
                const seriesDimensionValues: any = {};
                seriesDimensions.forEach((dim: any, index: number) => {
                    const valueIndex = keyParts[index];
                    if (dim.values && dim.values[valueIndex]) {
                        const value = dim.values[valueIndex];
                        seriesDimensionValues[dim.id] = value.name;
                        seriesDimensionValues[`${dim.id}_ID`] = value.id;
                    }
                });

                // Get series attributes
                const seriesAttributeValues: any = {};
                if (series.attributes && seriesAttributes.length > 0) {
                    series.attributes.forEach((attrIndex: number, index: number) => {
                        if (seriesAttributes[index] && seriesAttributes[index].values) {
                            const attr = seriesAttributes[index];
                            const value = attr.values[attrIndex];
                            if (value) {
                                seriesAttributeValues[attr.id] = value.name;
                                seriesAttributeValues[`${attr.id}_ID`] = value.id;
                            }
                        }
                    });
                }

                // Process observations
                if (series.observations) {
                    for (const [timePeriod, obsData] of Object.entries(series.observations)) {
                        const observation = obsData as any[];
                        const obsValue = observation[0];

                        // Build observation record
                        const record: any = {
                            ...seriesDimensionValues,
                            ...seriesAttributeValues,
                            TIME_PERIOD: timePeriod,
                            value: obsValue
                        };

                        // Add observation attributes
                        if (observation.length > 1 && observationAttributes.length > 0) {
                            observation.slice(1).forEach((attrIndex: number, index: number) => {
                                if (observationAttributes[index] && observationAttributes[index].values) {
                                    const attr = observationAttributes[index];
                                    const value = attr.values[attrIndex];
                                    if (value) {
                                        record[attr.id] = value.name;
                                        record[`${attr.id}_ID`] = value.id;
                                    }
                                }
                            });
                        }

                        result.push(record);
                    }
                }
            }

            return result.length > 0 ? result : null;

        } catch (error) {
            logger.error('ImfService: Error parsing SDMX data', { error: error instanceof Error ? error.message : error });
            return null;
        }
    }

    async fetchMarketSize(industryId: string, region?: string): Promise<any> {
        logger.info('ImfService.fetchMarketSize called', { industryId, region });
        
        try {
            const data = await this.fetchImfDataset(industryId, region || 'ALL_COUNTRIES');
            
            if (data && Array.isArray(data) && data.length > 0) {
                // Find the latest record based on TIME_PERIOD
                let latestRecord = data[0];
                let latestYear = parseInt(latestRecord.TIME_PERIOD);
                
                for (const record of data) {
                    const recordYear = parseInt(record.TIME_PERIOD);
                    if (!isNaN(recordYear) && (isNaN(latestYear) || recordYear > latestYear)) {
                        latestRecord = record;
                        latestYear = recordYear;
                    }
                }

                return {
                    value: latestRecord.value,
                    dimensions: latestRecord, // Use the entire record as dimensions
                    source: 'IMF',
                    dataset: industryId,
                    key: region || 'ALL_COUNTRIES'
                };
            }
            
            return null;
        } catch (error) {
            logger.error('ImfService.fetchMarketSize failed', { 
                error: error instanceof Error ? error.message : error, 
                industryId, region 
            });
            return null;
        }
    }

    async searchDataset(searchQuery: string, params?: any): Promise<any> {
        logger.warn('ImfService.searchDataset is a placeholder and needs specific implementation.', { searchQuery, params });
        return { message: 'Search functionality not yet implemented for IMF service', query: searchQuery };
    }

        // DataSourceService interface implementation
    async isAvailable(): Promise<boolean> {
        // IMF API is publicly available
        return true;
    }

    async getDataFreshness(_params: any): Promise<any> {
        // Placeholder implementation
        return { lastUpdated: "N/A", nextUpdate: "N/A" };
    }

    async fetchIndustryData(...args: any[]): Promise<any> {
        const [dataflowId, key, options] = args;
        if (!dataflowId || !key) {
            logger.warn('ImfService.fetchIndustryData: Missing required parameters');
            return null;
        }

        try {
            // Handle both legacy (startPeriod, endPeriod) and new (options) formats
            let startPeriod: string | undefined;
            let endPeriod: string | undefined;

            if (typeof options === 'object' && options !== null) {
                startPeriod = options.startPeriod;
                endPeriod = options.endPeriod;
            } else if (typeof options === 'string') {
                // Legacy format where third arg is startPeriod and fourth is endPeriod
                startPeriod = options;
                endPeriod = args[3];
            }

            return await this.fetchImfDataset(dataflowId, key, startPeriod, endPeriod);
        } catch (error) {
            logger.error('ImfService.fetchIndustryData failed', { 
                error: error instanceof Error ? error.message : error, 
                args 
            });
            return null;
        }
    }
}

export default ImfService;
