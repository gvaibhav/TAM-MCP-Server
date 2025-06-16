import axios from "axios";
import { logger } from "../../utils/index.js";
import { DataSourceService } from "../../types/dataSources.js";
import { censusApi } from "../../config/apiConfig.js";

export class CensusService implements DataSourceService {
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.CENSUS_API_KEY || "";

    if (!this.apiKey) {
      console.log(
        "ℹ️  Census: API key not configured - using public access with limited rate limits (set CENSUS_API_KEY to enable full access)",
      );
    }
  }

  private async fetchApiData(
    endpoint: string,
    params: Record<string, string> = {},
  ): Promise<any> {
    try {
      const apiParams: Record<string, string> = { ...params };
      if (this.apiKey) {
        apiParams.key = this.apiKey;
      }

      const response = await axios.get(`${censusApi.baseUrl}/${endpoint}`, {
        params: apiParams,
      });

      return response.data;
    } catch (error: any) {
      logger.error("CensusService: API call failed", {
        error: error.message,
        endpoint,
        params,
      });
      throw error;
    }
  }

  async getData(
    dataset: string,
    variables: string,
    geography: string,
    params: any = {},
  ): Promise<any> {
    logger.info("CensusService.getData called", {
      dataset,
      variables,
      geography,
      params,
    });

    const endpoint = `${censusApi.cbpYear}/${dataset}`;
    const queryParams = {
      get: variables,
      for: geography,
      ...params,
    };

    return this.fetchApiData(endpoint, queryParams);
  }

  async fetchIndustryData(
    naicsCode: string,
    geography: string = "state:*",
    params: any = {},
  ): Promise<any> {
    logger.info("CensusService.fetchIndustryData called", {
      naicsCode,
      geography,
      params,
    });

    try {
      // Use County Business Patterns (CBP) data
      const variables = "NAME,NAICS2017,NAICS2017_LABEL,EMP,PAYANN,ESTAB";
      const queryParams = {
        NAICS2017: naicsCode,
        ...params,
      };

      const data = await this.getData(
        censusApi.cbpDataset,
        variables,
        geography,
        queryParams,
      );

      if (!data || data.length === 0) {
        return null;
      }

      // Parse and format the response
      const headers = data[0];
      const rows = data.slice(1);

      return rows.map((row: any[]) => {
        const record: any = {};
        headers.forEach((header: string, index: number) => {
          record[header] = row[index];
        });
        return record;
      });
    } catch (error) {
      logger.error("CensusService.fetchIndustryData failed", {
        error: error instanceof Error ? error.message : error,
        naicsCode,
        geography,
      });
      return null;
    }
  }

  async fetchMarketSize(
    naicsCode: string,
    geography: string = "us:*",
    measure: string = "EMP",
  ): Promise<any> {
    try {
      const data = await this.fetchIndustryData(naicsCode, geography, {});

      if (!data || data.length === 0) {
        return null;
      }

      // Calculate total market size
      let totalValue = 0;
      let validRecords = 0;

      data.forEach((record: any) => {
        const value = parseFloat(record[measure]);
        if (!isNaN(value)) {
          totalValue += value;
          validRecords++;
        }
      });

      return {
        value: totalValue,
        measure,
        naicsCode,
        geography,
        recordCount: validRecords,
        source: "Census Bureau",
        dataset: "County Business Patterns",
        year: censusApi.cbpYear,
      };
    } catch (error) {
      logger.error("CensusService.fetchMarketSize failed", {
        error: error instanceof Error ? error.message : error,
        naicsCode,
        geography,
        measure,
      });
      return null;
    }
  }

  async isAvailable(): Promise<boolean> {
    return true; // Census API is publicly available
  }

  async getDataFreshness(..._args: any[]): Promise<Date | null> {
    // Census data is typically updated annually
    return new Date(`${censusApi.cbpYear}-12-31`);
  }
}

export default CensusService;
