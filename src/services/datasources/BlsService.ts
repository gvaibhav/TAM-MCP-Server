import axios from "axios";
import { logger } from "../../utils/index.js";
import { DataSourceService } from "../../types/dataSources.js";

const BASE_URL = "https://api.bls.gov/publicAPI/v2/timeseries/data";

export class BlsService implements DataSourceService {
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.BLS_API_KEY ?? "";

    if (!this.apiKey) {
      console.log(
        "ℹ️  BLS: API key not configured - using public access with limited rate limits (set BLS_API_KEY to enable full access)",
      );
    }
  }

  private async fetchApiData(
    seriesIds: string[],
    startYear?: string,
    endYear?: string,
    options: any = {},
  ): Promise<any> {
    try {
      const data: any = {
        seriesid: seriesIds,
        registrationkey: this.apiKey,
      };

      if (startYear) data.startyear = startYear;
      if (endYear) data.endyear = endYear;
      if (options.catalog) data.catalog = options.catalog;
      if (options.calculations) data.calculations = options.calculations;
      if (options.annualaverage) data.annualaverage = options.annualaverage;

      const response = await axios.post(BASE_URL, data, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      return response.data;
    } catch (error: any) {
      logger.error("BlsService: API call failed", {
        error: error.message,
        seriesIds,
      });
      throw error;
    }
  }

  async fetchSeriesData(
    seriesIds: string[],
    startYear?: string,
    endYear?: string,
    options: any = {},
  ): Promise<any> {
    logger.info("BlsService.fetchSeriesData called", {
      seriesIds,
      startYear,
      endYear,
      options,
    });

    if (!Array.isArray(seriesIds) || seriesIds.length === 0) {
      throw new Error("SeriesIds must be a non-empty array");
    }

    return this.fetchApiData(seriesIds, startYear, endYear, options);
  }

  async fetchMarketSize(industryId: string, region?: string): Promise<any> {
    try {
      // Use employment series as a proxy for market size
      const seriesId = `CES${industryId}0001`; // All employees series
      const data = await this.fetchSeriesData(
        [seriesId],
        undefined,
        undefined,
        {},
      );

      if (
        !data?.Results?.series?.[0]?.data ||
        data.Results.series[0].data.length === 0
      ) {
        return null;
      }

      const latestData = data.Results.series[0].data[0];

      return {
        value: parseFloat(latestData.value),
        period: latestData.period,
        year: latestData.year,
        seriesId,
        region: region ?? "US",
        source: "BLS",
        title: data.Results.series[0].title,
      };
    } catch (error) {
      logger.error("BlsService.fetchMarketSize failed", {
        error: error instanceof Error ? error.message : error,
        industryId,
        region,
      });
      return null;
    }
  }

  async fetchIndustryData(
    seriesIds: string[],
    startYear?: string,
    endYear?: string,
    options: any = {},
  ): Promise<any> {
    logger.info("BlsService.fetchIndustryData called", {
      seriesIds,
      startYear,
      endYear,
      options,
    });
    return this.fetchSeriesData(seriesIds, startYear, endYear, options);
  }

  async isAvailable(): Promise<boolean> {
    return true; // BLS API is publicly available
  }

  async getDataFreshness(..._args: any[]): Promise<Date | null> {
    // BLS data is typically updated monthly
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() - 1, 1);
  }
}

export default BlsService;
