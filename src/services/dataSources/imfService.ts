// src/services/dataSources/imfService.ts
import axios from 'axios';
import { DataSourceService } from '../../types/dataSources';
import { CacheEntry, CacheStatus } from '../../types/cache';
import { CacheService } from '../cache/cacheService';
import { imfApi } from '../../config/apiConfig';
import { getEnvAsNumber } from '../../utils/envHelper';

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 1 day
const DEFAULT_TTL_NODATA_MS = 1 * 60 * 60 * 1000; // 1 hour

// Interface for the expected SDMX-JSON structure from IMF (similar to OECD)
interface ImfSdmxDimensionValue {
  id: string;
  name?: string; // Name might be optional or not present for all value types
}
interface ImfSdmxDimension {
  id: string;
  name?: string;
  keyPosition: number; // Crucial for IMF series key parsing
  values?: ImfSdmxDimensionValue[];
}
interface ImfSdmxAttribute {
  id: string;
  name?: string;
  values?: ImfSdmxDimensionValue[];
}

interface ImfSdmxData {
  header: any;
  dataSets?: Array<{
    series?: Record<string, {
        attributes?: (number | null)[]; // Indices into structure.attributes.series[...].values
        observations: Record<string, (number | null)[]> // Key: TIME_PERIOD string, Value: [value, attr1_idx, attr2_idx...]
    }>;
  }>;
  structure?: {
    name?: string;
    dimensions: {
      observation?: Array<{ id: string; name?: string; keyPosition?: number; values?: Array<{ id: string; name?: string }> }>; // Typically just TIME_PERIOD for IMF CompactData series observations
      series: ImfSdmxDimension[]; // Definition of dimensions that form the series key
    };
    attributes?: {
      series?: ImfSdmxAttribute[];
      observation?: ImfSdmxAttribute[];
    };
  };
}


export class ImfService implements DataSourceService {
  private cacheService: CacheService;
  private successfulFetchTtl: number;
  private noDataFetchTtl: number;

  constructor(cacheService: CacheService) {
    this.cacheService = cacheService;
    this.successfulFetchTtl = getEnvAsNumber('CACHE_TTL_IMF_MS', DEFAULT_TTL_MS);
    this.noDataFetchTtl = getEnvAsNumber('CACHE_TTL_IMF_NODATA_MS', DEFAULT_TTL_NODATA_MS);
    console.log("IMF Service: Initialized. Uses public access.");
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  /**
   * Fetches a dataset from IMF SDMX-JSON API (CompactData endpoint).
   * @param dataflowId Identifier of the dataflow (e.g., "IFS").
   * @param key Dimension filter key (e.g., "A.US.NGDP_RPCH"). Periodicity.Location.Indicator
   * @param startPeriod Optional start period (e.g., "2020").
   * @param endPeriod Optional end period.
   */
  async fetchImfDataset(
    dataflowId: string,
    key: string,
    startPeriod?: string,
    endPeriod?: string
  ): Promise<any[] | null> {
    if (!dataflowId || !key) {
      throw new Error("Dataflow ID and Key must be provided for IMF query.");
    }

    const queryParams: Record<string, string> = {};
    if (startPeriod) queryParams.startPeriod = startPeriod;
    if (endPeriod) queryParams.endPeriod = endPeriod;

    const cacheKeyObj = { dataflowId, key, ...queryParams };
    const cacheKey = `imf_${JSON.stringify(cacheKeyObj)}`;

    const cachedData = await this.cacheService.get<any[]>(cacheKey);
    if (cachedData) {
      console.log(`IMF Service: Returning cached data for ${dataflowId}/${key}`);
      return cachedData;
    }

    // IMF CompactData URL structure: /CompactData/{DataflowID}/{Key}?params...
    // Key is typically FREQ.REF_AREA.INDICATOR.COUNTERPART_AREA...
    const apiUrl = `${imfApi.baseUrl}/CompactData/${dataflowId}/${key}`;
    console.log(`IMF Service: Fetching data from ${apiUrl} with params:`, queryParams);

    try {
      const response = await axios.get<ImfSdmxData>(apiUrl, { params: queryParams });
      const sdmxData = response.data;

      if (!sdmxData || !sdmxData.dataSets || sdmxData.dataSets.length === 0 || !sdmxData.dataSets[0].series) {
        console.warn(`IMF Service: No series data found in response for ${dataflowId}/${key}. Response:`, JSON.stringify(sdmxData).substring(0, 500));
        await this.cacheService.set(cacheKey, null, this.noDataFetchTtl);
        return null;
      }

      const observations: any[] = [];
      const seriesStructure = sdmxData.structure?.dimensions?.series;
      // TIME_PERIOD is usually the only observation dimension in CompactData, defined in structure.dimensions.observation
      // However, for IMF CompactData, the observation keys within seriesObject.observations ARE the time periods.
      const seriesAttributesStructure = sdmxData.structure?.attributes?.series || [];
      const obsAttributesStructure = sdmxData.structure?.attributes?.observation || [];

      if (!seriesStructure) {
          console.warn(`IMF Service: Series structure definition not found in response for ${dataflowId}/${key}. Cannot reliably parse series keys.`);
          await this.cacheService.set(cacheKey, null, this.noDataFetchTtl);
          return null;
      }

      Object.entries(sdmxData.dataSets[0].series).forEach(([seriesKeyString, seriesObject]) => {
        const seriesKeyParts = seriesKeyString.split(':'); // e.g., "0:1:2"
        const seriesContext: any = {};

        seriesStructure.forEach((dimDef) => { // Iterate based on structure definition order
          const keyPartIndex = dimDef.keyPosition; // keyPosition is 0-indexed for IMF
          const dimValueIndex = parseInt(seriesKeyParts[keyPartIndex], 10);

          if (dimDef.values && !isNaN(dimValueIndex) && dimValueIndex < dimDef.values.length) {
            seriesContext[dimDef.id] = dimDef.values[dimValueIndex].name || dimDef.values[dimValueIndex].id;
            seriesContext[`${dimDef.id}_ID`] = dimDef.values[dimValueIndex].id;
          } else {
            seriesContext[dimDef.id] = `KEYPART_${keyPartIndex}_VAL_${seriesKeyParts[keyPartIndex]}`; // Fallback if structure is incomplete
          }
        });

        if (seriesObject.attributes && seriesAttributesStructure.length > 0) {
            seriesObject.attributes.forEach((attrValIdx, attrDefStructIdx) => {
                const attrDef = seriesAttributesStructure[attrDefStructIdx];
                if (attrDef && attrDef.values && attrValIdx !== null && attrValIdx < attrDef.values.length) {
                    seriesContext[attrDef.id] = attrDef.values[attrValIdx].name || attrDef.values[attrValIdx].id;
                    seriesContext[`${attrDef.id}_ID`] = attrDef.values[attrValIdx].id;
                }
            });
        }

        Object.entries(seriesObject.observations).forEach(([timePeriodKey, obsValueArray]) => {
          const observation: any = { ...seriesContext };
          observation.TIME_PERIOD = timePeriodKey;
          observation.value = obsValueArray[0];

          if (obsAttributesStructure.length > 0) {
            obsAttributesStructure.forEach((attrDef, attrDefStructIdx) => {
              const attrValIdx = obsValueArray[attrDefStructIdx + 1];
              if (attrDef && attrDef.values && attrValIdx !== null && attrValIdx !== undefined && attrValIdx < attrDef.values.length) {
                observation[attrDef.id] = attrDef.values[attrValIdx].name || attrDef.values[attrValIdx].id;
                observation[`${attrDef.id}_ID`] = attrDef.values[attrValIdx].id;
              }
            });
          }
          observations.push(observation);
        });
      });

      if (observations.length > 0) {
        await this.cacheService.set(cacheKey, observations, this.successfulFetchTtl);
        return observations;
      } else {
        console.warn(`IMF Service: No observations extracted for ${dataflowId}/${key}.`);
        await this.cacheService.set(cacheKey, null, this.noDataFetchTtl);
        return null;
      }

    } catch (error: any) {
      console.error(`IMF Service: Error fetching data for ${dataflowId}/${key}:`, error.message);
      await this.cacheService.set(cacheKey, null, this.noDataFetchTtl);
      if (axios.isAxiosError(error) && error.response) {
        const errorDataString = error.response.data ? JSON.stringify(error.response.data).substring(0,500) : error.message;
        console.error('API Error Details:', errorDataString);
        throw new Error(`IMF API Error: ${error.response.status} - ${errorDataString}`);
      }
      throw error;
    }
  }

  async fetchIndustryData(dataflowId: string, key: string, options?: { startPeriod?: string, endPeriod?: string, region?: string }): Promise<any[] | null> {
    // 'region' if provided in options is not directly used here as IMF 'key' structure already contains geographic info.
    return this.fetchImfDataset(dataflowId, key, options?.startPeriod, options?.endPeriod);
  }

  async fetchMarketSize(dataflowId: string, key: string, options?: { startPeriod?: string, endPeriod?: string, valueAttribute?: string, region?: string }): Promise<any | null> {
    // 'region' if provided in options is not directly used here.
    const results = await this.fetchImfDataset(dataflowId, key, options?.startPeriod, options?.endPeriod);
    if (results && results.length > 0) {
      results.sort((a, b) => (a.TIME_PERIOD > b.TIME_PERIOD ? -1 : 1)); // Sort descending by TIME_PERIOD
      const latestObservation = results[0];
      const valueAttr = options?.valueAttribute || 'value';
      return {
          value: latestObservation[valueAttr],
          dimensions: latestObservation,
          source: 'IMF',
          dataset: dataflowId,
          key: key
      };
    }
    return null;
  }

  async getDataFreshness(dataflowId: string, key: string, startPeriod?: string, endPeriod?: string): Promise<Date | null> {
    const queryParams: Record<string, string> = {};
    if (startPeriod) queryParams.startPeriod = startPeriod;
    if (endPeriod) queryParams.endPeriod = endPeriod;
    const cacheKeyObj = { dataflowId, key, ...queryParams };
    const cacheKey = `imf_${JSON.stringify(cacheKeyObj)}`;

    const entry = await (this.cacheService as any).getEntry?.(cacheKey) as CacheEntry<any> | null;
    return entry?.timestamp ? new Date(entry.timestamp) : null;
  }

  getCacheStatus(): CacheStatus {
    return (this.cacheService as any).getStats?.() || { hits: 0, misses: 0, size: 0, lastRefreshed: null };
  }
}
