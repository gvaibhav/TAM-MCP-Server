// src/services/dataSources/oecdService.ts
import axios from 'axios';
import { DataSourceService } from '../../types/dataSources';
import { CacheEntry, CacheStatus } from '../../types/cache';
import { CacheService } from '../cache/cacheService';
import { oecdApi } from '../../config/apiConfig';
import { getEnvAsNumber } from '../../utils/envHelper';

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 1 day
const DEFAULT_TTL_NODATA_MS = 1 * 60 * 60 * 1000; // 1 hour

interface OecdSdmxDimensionValue {
  id: string;
  name: string;
}

interface OecdSdmxDimension {
  id: string;
  name: string;
  keyPosition?: number;
  values: OecdSdmxDimensionValue[];
}

interface OecdSdmxAttribute {
  id: string;
  name: string;
  values: OecdSdmxDimensionValue[]; // Attributes can also have a list of possible values
}

interface OecdSdmxData {
  header: any;
  dataSets: Array<{
    action: string;
    validFrom?: string;
    series?: Record<string, { attributes: (number | null)[]; observations: Record<string, (number | null)[]> }>;
    observations?: Record<string, (number | null)[]>;
  }>;
  structure: {
    name: string;
    description?: string;
    dimensions: {
      observation: OecdSdmxDimension[];
      series?: OecdSdmxDimension[];
    };
    attributes: {
      series?: OecdSdmxAttribute[];
      observation?: OecdSdmxAttribute[];
    };
  };
}


export class OecdService implements DataSourceService {
  private cacheService: CacheService;
  private successfulFetchTtl: number;
  private noDataFetchTtl: number;

  constructor(cacheService: CacheService) {
    this.cacheService = cacheService;
    // OECD does not typically require an API key for public data
    this.successfulFetchTtl = getEnvAsNumber('CACHE_TTL_OECD_MS', DEFAULT_TTL_MS);
    this.noDataFetchTtl = getEnvAsNumber('CACHE_TTL_OECD_NODATA_MS', DEFAULT_TTL_NODATA_MS);
    console.log("OECD Service: Initialized. Uses public access.");
  }

  async isAvailable(): Promise<boolean> {
    return true; // Public access generally available
  }

  /**
   * Fetches a dataset from OECD SDMX-JSON API.
   * @param datasetId Identifier of the dataset (e.g., "QNA").
   * @param filterExpression Dimension filter (e.g., "AUS.TOTAL.AGR.Q").
   * @param agencyId Agency identifier, defaults to 'all'.
   * @param startTime Start period (e.g., "2020", "2020-Q1").
   * @param endTime End period.
   * @param dimensionAtObservation How dimensions are reported, defaults to 'AllDimensions'.
   */
  async fetchOecdDataset(
    datasetId: string,
    filterExpression: string, // e.g., "AUS.GDP+B1_GE.CURR+VOBARSA.Q"
    agencyId: string = oecdApi.defaultAgencyId,
    startTime?: string,
    endTime?: string,
    dimensionAtObservation: string = oecdApi.defaultDimensionObservation
  ): Promise<any[] | null> { // Returns array of flat observation objects
    if (!datasetId || !filterExpression) {
      throw new Error("Dataset ID and filter expression must be provided for OECD query.");
    }

    const queryParams: Record<string, string> = { dimensionAtObservation };
    if (startTime) queryParams.startTime = startTime;
    if (endTime) queryParams.endTime = endTime;

    const cacheKeyObj = { datasetId, filterExpression, agencyId, ...queryParams };
    const cacheKey = `oecd_${JSON.stringify(cacheKeyObj)}`;

    const cachedData = await this.cacheService.get<any[]>(cacheKey);
    if (cachedData) {
      console.log(`OECD Service: Returning cached data for ${datasetId}/${filterExpression}`);
      return cachedData;
    }

    const apiUrl = `${oecdApi.baseUrl}/${datasetId}/${filterExpression}/${agencyId}`;
    console.log(`OECD Service: Fetching data from ${apiUrl} with params:`, queryParams);

    try {
      const response = await axios.get<OecdSdmxData>(apiUrl, { params: queryParams });
      const sdmxData = response.data;

      if (!sdmxData || !sdmxData.dataSets || sdmxData.dataSets.length === 0) {
        console.warn(`OECD Service: No dataSets found in response for ${datasetId}/${filterExpression}.`);
        await this.cacheService.set(cacheKey, null, this.noDataFetchTtl);
        return null;
      }

      const getDimValueById = (dimValueId: string, dim: OecdSdmxDimension): OecdSdmxDimensionValue | undefined => {
          return dim.values.find(v => v.id === dimValueId);
      };

      const getAttrValueByIndex = (attrValueIndex: number | null, attr: OecdSdmxAttribute): OecdSdmxDimensionValue | undefined => {
          if (attrValueIndex === null || attrValueIndex === undefined) return undefined;
          return attr.values[attrValueIndex];
      };


      const observations: any[] = [];
      const obsDimsStructure = sdmxData.structure.dimensions.observation; // Array of dimension objects
      const obsAttrsStructure = sdmxData.structure.attributes?.observation || []; // Array of attribute objects

      // Case 1: dimensionAtObservation=AllDimensions (dataSets[0].observations)
      // Key is like "0:1:2:0:2022-Q1" (dim1_val_idx:dim2_val_idx:...:time_val_idx)
      // Value array: [value, attr1_val_idx, attr2_val_idx, ...]
      if (sdmxData.dataSets[0].observations) {
        Object.entries(sdmxData.dataSets[0].observations).forEach(([obsKey, obsValueArray]) => {
          const obsKeyParts = obsKey.split(':');
          const observation: any = {};

          obsDimsStructure.forEach((dimStruct) => {
            // keyPosition is 0-indexed position in the obsKeyParts for this dimension
            if (dimStruct.keyPosition !== undefined) {
                const dimValueIdFromKey = obsKeyParts[dimStruct.keyPosition];
                const dimValue = getDimValueById(dimValueIdFromKey, dimStruct);
                observation[dimStruct.id] = dimValue ? dimValue.name : dimValueIdFromKey;
                observation[`${dimStruct.id}_ID`] = dimValueIdFromKey;
            } else if (dimStruct.id === 'TIME_PERIOD') { // Time period is usually the last part of key if not explicitly positioned
                const timeIdxInKey = obsKeyParts.length -1; // Assume last part is time
                const timeValueIdFromKey = obsKeyParts[timeIdxInKey];
                const timeDimValue = getDimValueById(timeValueIdFromKey, dimStruct);
                observation.TIME_PERIOD = timeDimValue ? timeDimValue.name : timeValueIdFromKey;
                observation.TIME_PERIOD_ID = timeValueIdFromKey;
            }
          });

          observation.value = obsValueArray[0]; // First element is the value

          obsAttrsStructure.forEach((attrStruct, attrIdxInStructure) => {
              const attrValueIndexInObsArray = obsValueArray[attrIdxInStructure + 1]; // Attributes follow value
              if (attrValueIndexInObsArray !== null && attrValueIndexInObsArray !== undefined) {
                  const attrValue = getAttrValueByIndex(attrValueIndexInObsArray, attrStruct);
                  observation[attrStruct.id] = attrValue ? attrValue.name : null;
                  observation[`${attrStruct.id}_ID`] = attrValue ? attrValue.id : null;
              }
          });
          observations.push(observation);
        });
      }
      // Case 2: dimensionAtObservation points to series (dataSets[0].series)
      // Series Key is like "0:0:0" (seriesDim1_val_idx:seriesDim2_val_idx:...)
      // Series Object has `attributes` array (indices) and `observations` object
      // Obs Object key is time_val_idx, value array is [value, attr1_val_idx, ...]
      else if (sdmxData.dataSets[0].series) {
        const seriesDimsStructure = sdmxData.structure.dimensions.series || [];
        const seriesAttrsStructure = sdmxData.structure.attributes?.series || [];

        Object.entries(sdmxData.dataSets[0].series).forEach(([seriesKey, seriesObject]) => {
          const seriesKeyParts = seriesKey.split(':');
          const seriesContext: any = {};

          seriesDimsStructure.forEach((dimStruct) => {
            if (dimStruct.keyPosition !== undefined) {
                const dimValueIdFromKey = seriesKeyParts[dimStruct.keyPosition];
                const dimValue = getDimValueById(dimValueIdFromKey, dimStruct);
                seriesContext[dimStruct.id] = dimValue ? dimValue.name : dimValueIdFromKey;
                seriesContext[`${dimStruct.id}_ID`] = dimValueIdFromKey;
            }
          });

          seriesAttrsStructure.forEach((attrStruct, attrIdxInStructure) => {
              const attrValueIndexInSeries = seriesObject.attributes[attrIdxInStructure];
              if(attrValueIndexInSeries !== null && attrValueIndexInSeries !== undefined) {
                const attrValue = getAttrValueByIndex(attrValueIndexInSeries, attrStruct);
                seriesContext[attrStruct.id] = attrValue ? attrValue.name : null;
                seriesContext[`${attrStruct.id}_ID`] = attrValue ? attrValue.id : null;
              }
          });

          Object.entries(seriesObject.observations).forEach(([timeKeyIndex, obsValueArray]) => {
            const observation: any = { ...seriesContext };
            const timeDimStructure = obsDimsStructure.find(d => d.id === 'TIME_PERIOD');
            if(timeDimStructure) {
                const timeValue = timeDimStructure.values[parseInt(timeKeyIndex)]; // timeKeyIndex is index in TIME_PERIOD.values
                observation.TIME_PERIOD = timeValue ? timeValue.name : timeKeyIndex;
                observation.TIME_PERIOD_ID = timeValue ? timeValue.id : timeKeyIndex;
            } else {
                observation.TIME_PERIOD = timeKeyIndex; // Fallback
            }

            observation.value = obsValueArray[0];

            obsAttrsStructure.forEach((attrStruct, attrIdxInStructure) => {
              const attrValueIndexInObsArray = obsValueArray[attrIdxInStructure + 1];
              if (attrValueIndexInObsArray !== null && attrValueIndexInObsArray !== undefined) {
                const attrValue = getAttrValueByIndex(attrValueIndexInObsArray, attrStruct);
                observation[attrStruct.id] = attrValue ? attrValue.name : null;
                observation[`${attrStruct.id}_ID`] = attrValue ? attrValue.id : null;
              }
            });
            observations.push(observation);
          });
        });
      }


      if (observations.length > 0) {
        await this.cacheService.set(cacheKey, observations, this.successfulFetchTtl);
        return observations;
      } else {
        console.warn(`OECD Service: No observations extracted for ${datasetId}/${filterExpression}.`);
        await this.cacheService.set(cacheKey, null, this.noDataFetchTtl);
        return null;
      }

    } catch (error: any) {
      console.error(`OECD Service: Error fetching data for ${datasetId}/${filterExpression}:`, error.message);
      await this.cacheService.set(cacheKey, null, this.noDataFetchTtl);
      if (axios.isAxiosError(error) && error.response) {
        console.error('API Error Details:', error.response.data, error.response.status, error.response.headers);
        const errorSummary = typeof error.response.data === 'string' ? error.response.data.substring(0, 200) : JSON.stringify(error.response.data).substring(0, 200);
        throw new Error(`OECD API Error: ${error.response.status} - ${errorSummary}`);
      }
      throw error;
    }
  }

  async fetchIndustryData(datasetId: string, filterExpression: string, options?: { agencyId?: string, startTime?: string, endTime?: string, dimensionAtObservation?: string }): Promise<any[] | null> {
    return this.fetchOecdDataset(datasetId, filterExpression, options?.agencyId, options?.startTime, options?.endTime, options?.dimensionAtObservation);
  }

  async fetchMarketSize(datasetId: string, filterExpression: string, valueAttribute: string = 'value', options?: { agencyId?: string, startTime?: string, endTime?: string, dimensionAtObservation?: string, region?: string }): Promise<any | null> {
    // 'region' from options is not directly used in OECD filterExpression construction here,
    // it's assumed to be part of the filterExpression string already (e.g. "USA.GDP...")
    const results = await this.fetchOecdDataset(datasetId, filterExpression, options?.agencyId, options?.startTime, options?.endTime, options?.dimensionAtObservation);
    if (results && results.length > 0) {
      // Sort by TIME_PERIOD_ID (if available and sortable) or TIME_PERIOD string descending to get latest
      // This is a heuristic as time period formats vary.
      results.sort((a, b) => {
          const timeA = a.TIME_PERIOD_ID || a.TIME_PERIOD || '';
          const timeB = b.TIME_PERIOD_ID || b.TIME_PERIOD || '';
          if (timeA > timeB) return -1;
          if (timeA < timeB) return 1;
          return 0;
      });
      const latestObservation = results[0];
      return {
          value: latestObservation[valueAttribute] ?? latestObservation.value,
          dimensions: latestObservation,
          source: 'OECD',
          dataset: datasetId,
          filter: filterExpression
      };
    }
    return null;
  }

  async getDataFreshness(datasetId: string, filterExpression: string, agencyId?: string, startTime?: string, endTime?: string, dimensionAtObservation?: string): Promise<Date | null> {
    const queryParams: Record<string, string> = { dimensionAtObservation: dimensionAtObservation || oecdApi.defaultDimensionObservation };
    if (startTime) queryParams.startTime = startTime;
    if (endTime) queryParams.endTime = endTime;
    const cacheKeyObj = { datasetId, filterExpression, agencyId: agencyId || oecdApi.defaultAgencyId, ...queryParams };
    const cacheKey = `oecd_${JSON.stringify(cacheKeyObj)}`;

    const entry = await (this.cacheService as any).getEntry?.(cacheKey) as CacheEntry<any> | null;
    return entry?.timestamp ? new Date(entry.timestamp) : null;
  }

  getCacheStatus(): CacheStatus {
    return (this.cacheService as any).getStats?.() || { hits: 0, misses: 0, size: 0, lastRefreshed: null };
  }
}
