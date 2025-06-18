import axios from "axios";
import { logger } from "../../utils/index.js";
import { DataSourceService } from "../../types/dataSources.js";

const BASE_URL = "https://api.stlouisfed.org/fred";

export class FredService implements DataSourceService {
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.FRED_API_KEY ?? "";

    if (!this.apiKey) {
      console.error(
        "ℹ️  FRED: API key not configured - service disabled (set FRED_API_KEY to enable)",
      );
    }
  }

  private async fetchApiData(
    endpoint: string,
    params: Record<string, string>,
  ): Promise<any> {
    if (!this.apiKey) {
      throw new Error("FRED API key not configured");
    }

    try {
      const apiParams = {
        api_key: this.apiKey,
        file_type: "json",
        ...params,
      };

      const response = await axios.get(`${BASE_URL}/${endpoint}`, {
        params: apiParams,
      });
      return response.data;
    } catch (error: any) {
      logger.error("FredService: API call failed", {
        error: error.message,
        endpoint,
        params,
      });
      throw error;
    }
  }

  async getSeriesObservations(seriesId: string, params?: any): Promise<any> {
    const apiParams: Record<string, string> = { series_id: seriesId };

    if (params?.observation_start)
      apiParams.observation_start = params.observation_start;
    if (params?.observation_end)
      apiParams.observation_end = params.observation_end;
    if (params?.limit) apiParams.limit = params.limit.toString();
    if (params?.offset) apiParams.offset = params.offset.toString();
    if (params?.sort_order) apiParams.sort_order = params.sort_order;
    if (params?.output_type) apiParams.output_type = params.output_type;
    if (params?.vintage_dates) apiParams.vintage_dates = params.vintage_dates;

    return this.fetchApiData("series/observations", apiParams);
  }

  async fetchMarketSize(seriesId: string, region?: string): Promise<any> {
    if (!this.apiKey) {
      logger.warn("FRED: API key not configured, returning null");
      return null;
    }

    try {
      const data = await this.getSeriesObservations(seriesId, {
        limit: 1,
        sort_order: "desc",
      });

      if (!data?.observations || data.observations.length === 0) {
        return null;
      }

      const latestObservation = data.observations[0];

      return {
        value: parseFloat(latestObservation.value),
        date: latestObservation.date,
        seriesId,
        region: region ?? "US",
        source: "FRED",
        realtime_start: latestObservation.realtime_start,
        realtime_end: latestObservation.realtime_end,
      };
    } catch (error) {
      logger.error("FredService.fetchMarketSize failed", {
        error: error instanceof Error ? error.message : error,
        seriesId,
        region,
      });
      return null;
    }
  }

  async searchSeries(searchText: string, params?: any): Promise<any> {
    logger.warn(
      "FredService.searchSeries is a placeholder and needs specific implementation.",
      { searchText, params },
    );
    return {
      message: "Search functionality not yet implemented for FRED service",
      query: searchText,
    };
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(this.apiKey);
  }

  async getDataFreshness(...args: any[]): Promise<Date | null> {
    const [seriesId] = args;
    if (!seriesId) {
      return null;
    }
    return new Date();
  }

  async fetchIndustryData(...args: any[]): Promise<any> {
    const [seriesId, params] = args;
    if (!seriesId) {
      logger.warn(
        "FredService.fetchIndustryData: Missing required seriesId parameter",
      );
      return null;
    }

    if (!this.apiKey) {
      logger.warn("FRED: API key not configured");
      return null;
    }

    try {
      return await this.getSeriesObservations(seriesId, params);
    } catch (error) {
      logger.error("FredService.fetchIndustryData failed", {
        error: error instanceof Error ? error.message : error,
        seriesId,
      });
      return null;
    }
  }
}

export default FredService;
