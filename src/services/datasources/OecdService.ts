import axios from "axios";
import { logger } from "../../utils/index.js";
import { DataSourceService } from "../../types/dataSources.js";

const BASE_URL = "https://sdmx.oecd.org/public/rest/data";

export class OecdService implements DataSourceService {
  constructor() {
    // OECD API is publicly available, no API key needed
  }

  private async fetchApiData(
    endpoint: string,
    params: Record<string, any> = {},
  ): Promise<any> {
    try {
      const response = await axios.get(`${BASE_URL}/${endpoint}`, {
        params: {
          format: "jsondata",
          ...params,
        },
      });

      return response.data;
    } catch (error: any) {
      logger.error("OecdService: API call failed", {
        error: error.message,
        endpoint,
        params,
      });
      throw error;
    }
  }

  async fetchOecdDataset(
    datasetId: string,
    filterExpression?: string,
    params: any = {},
  ): Promise<any> {
    logger.info("OecdService.fetchOecdDataset called", {
      datasetId,
      filterExpression,
      params,
    });

    try {
      const endpoint = filterExpression
        ? `${datasetId}/${filterExpression}`
        : datasetId;
      const data = await this.fetchApiData(endpoint, params);

      if (!data) {
        return null;
      }

      return this.parseSdmxJsonData(data);
    } catch (error) {
      logger.error("OecdService.fetchOecdDataset failed", {
        error: error instanceof Error ? error.message : error,
        datasetId,
        filterExpression,
      });
      return null;
    }
  }

  private parseSdmxJsonData(data: any): any[] | null {
    try {
      if (
        !data.dataSets ||
        !Array.isArray(data.dataSets) ||
        data.dataSets.length === 0
      ) {
        logger.warn("OecdService: No dataSets found in response");
        return null;
      }

      const dataset = data.dataSets[0];
      const structure = data.structure;

      if (!structure?.dimensions) {
        logger.warn("OecdService: No structure dimensions found");
        return null;
      }

      const result: any[] = [];

      // Handle different SDMX-JSON formats
      if (dataset.observations) {
        // Observation-centric format
        for (const [key, observation] of Object.entries(dataset.observations)) {
          const obsData = observation as any[];
          const record = this.parseObservationKey(key, obsData, structure);
          if (record) {
            result.push(record);
          }
        }
      } else if (dataset.series) {
        // Series-centric format
        for (const [seriesKey, seriesData] of Object.entries(dataset.series)) {
          const series = seriesData as any;
          const seriesRecord = this.parseSeriesKey(seriesKey, structure);

          if (series.observations) {
            for (const [timePeriod, obsData] of Object.entries(
              series.observations,
            )) {
              const observation = obsData as any[];
              const record = {
                ...seriesRecord,
                TIME_PERIOD: timePeriod,
                value: observation[0],
              };
              result.push(record);
            }
          }
        }
      }

      return result.length > 0 ? result : null;
    } catch (error) {
      logger.error("OecdService: Error parsing SDMX data", {
        error: error instanceof Error ? error.message : error,
      });
      return null;
    }
  }

  private parseObservationKey(
    key: string,
    observation: any[],
    structure: any,
  ): any | null {
    try {
      const dimensions = [
        ...(structure.dimensions.observation || []),
        ...(structure.dimensions.series || []),
      ];

      const keyParts = key.split(":").map(Number);
      const record: any = { value: observation[0] };

      keyParts.forEach((valueIndex, dimIndex) => {
        if (dimensions[dimIndex]?.values?.[valueIndex]) {
          const dim = dimensions[dimIndex];
          const value = dim.values[valueIndex];
          record[dim.id] = value.name || value.id;
        }
      });

      return record;
    } catch (error) {
      logger.warn("OecdService: Error parsing observation key", { key, error });
      return null;
    }
  }

  private parseSeriesKey(key: string, structure: any): any {
    try {
      const seriesDimensions = structure.dimensions.series || [];
      const keyParts = key.split(":").map(Number);
      const record: any = {};

      keyParts.forEach((valueIndex, dimIndex) => {
        if (seriesDimensions[dimIndex]?.values?.[valueIndex]) {
          const dim = seriesDimensions[dimIndex];
          const value = dim.values[valueIndex];
          record[dim.id] = value.name || value.id;
        }
      });

      return record;
    } catch (error) {
      logger.warn("OecdService: Error parsing series key", { key, error });
      return {};
    }
  }

  async fetchMarketSize(
    datasetId: string,
    filterExpression?: string,
  ): Promise<any> {
    try {
      const data = await this.fetchOecdDataset(datasetId, filterExpression, {
        startPeriod: "latest",
        dimensionAtObservation: "AllDimensions",
      });

      if (!data || data.length === 0) {
        return null;
      }

      // Find the most recent observation
      const latestRecord = data
        .filter(
          (record: any) => record.value !== null && record.value !== undefined,
        )
        .sort((a: any, b: any) =>
          (b.TIME_PERIOD || "").localeCompare(a.TIME_PERIOD || ""),
        )[0];

      if (!latestRecord) {
        return null;
      }

      return {
        value: latestRecord.value,
        time_period: latestRecord.TIME_PERIOD,
        dataset: datasetId,
        source: "OECD",
        record: latestRecord,
      };
    } catch (error) {
      logger.error("OecdService.fetchMarketSize failed", {
        error: error instanceof Error ? error.message : error,
        datasetId,
        filterExpression,
      });
      return null;
    }
  }

  async fetchIndustryData(
    datasetId: string,
    filterExpression?: string,
    params: any = {},
  ): Promise<any> {
    logger.info("OecdService.fetchIndustryData called", {
      datasetId,
      filterExpression,
      params,
    });
    return this.fetchOecdDataset(datasetId, filterExpression, params);
  }

  async isAvailable(): Promise<boolean> {
    return true; // OECD API is publicly available
  }

  async getDataFreshness(..._args: any[]): Promise<Date | null> {
    // OECD data is typically updated quarterly/annually
    return new Date();
  }
}

export default OecdService;
