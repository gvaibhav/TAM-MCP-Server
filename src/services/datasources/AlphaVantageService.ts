import axios from "axios";
import { logger } from "../../utils/index.js";
import { DataSourceService } from "../../types/dataSources.js";

const BASE_URL = "https://www.alphavantage.co/query";

export class AlphaVantageService implements DataSourceService {
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ALPHA_VANTAGE_API_KEY || "";

    if (!this.apiKey) {
      console.error(
        "ℹ️  AlphaVantage: API key not configured - service disabled (set ALPHA_VANTAGE_API_KEY to enable)",
      );
    }
  }

  private async fetchApiData(
    functionName: string,
    symbol: string,
    _isTimeSeries: boolean = false,
  ): Promise<any> {
    if (!this.apiKey) {
      throw new Error("Alpha Vantage API key not configured");
    }

    try {
      const params = {
        function: functionName,
        symbol: symbol,
        apikey: this.apiKey,
      };

      const response = await axios.get(BASE_URL, { params });
      const data = response.data;

      // Check for API errors
      if (data.Note) {
        throw new Error(`Alpha Vantage API Note: ${data.Note}`);
      }

      if (data["Error Message"]) {
        throw new Error(`Alpha Vantage API Error: ${data["Error Message"]}`);
      }

      if (data["Information"]) {
        throw new Error(
          `Alpha Vantage API Information: ${data["Information"]}`,
        );
      }

      return data;
    } catch (error: any) {
      logger.error("AlphaVantageService: API call failed", {
        error: error.message,
        functionName,
        symbol,
      });
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async getDataFreshness(...args: any[]): Promise<Date | null> {
    const [symbol, dataType = "overview"] = args;
    if (!symbol) return null;

    if (dataType === "overview") {
      return new Date(); // Company overview data is generally updated daily
    } else if (dataType === "timeseries") {
      return new Date(); // Time series data varies by market hours
    }

    return null;
  }

  async searchSymbols(keywords: string): Promise<any> {
    logger.info("AlphaVantageService.searchSymbols called", { keywords });

    try {
      const data = await this.fetchApiData("SYMBOL_SEARCH", keywords, false);

      if (data && data["bestMatches"]) {
        return data["bestMatches"];
      }

      return [];
    } catch (error) {
      logger.error("AlphaVantageService.searchSymbols failed", {
        error: error instanceof Error ? error.message : error,
        keywords,
      });
      return [];
    }
  }

  async fetchMarketSize(symbol: string): Promise<any> {
    logger.info("AlphaVantageService.fetchMarketSize called", { symbol });

    try {
      const overview = await this.fetchApiData("OVERVIEW", symbol, false);

      if (!overview || overview["Symbol"] !== symbol) {
        return null;
      }

      const marketCap = parseFloat(overview["MarketCapitalization"]);

      return {
        value: isNaN(marketCap) ? null : marketCap,
        symbol: overview["Symbol"],
        name: overview["Name"],
        sector: overview["Sector"],
        industry: overview["Industry"],
        description: overview["Description"],
        source: "Alpha Vantage",
        lastUpdated: new Date().toISOString().split("T")[0],
      };
    } catch (error) {
      logger.error("AlphaVantageService.fetchMarketSize failed", {
        error: error instanceof Error ? error.message : error,
        symbol,
      });
      return null;
    }
  }

  async fetchIndustryData(
    symbol: string,
    seriesType: string = "DAILY",
  ): Promise<any> {
    logger.info("AlphaVantageService.fetchIndustryData called", {
      symbol,
      seriesType,
    });

    if (!symbol) {
      logger.warn("AlphaVantageService.fetchIndustryData: Symbol is required");
      return null;
    }

    const functionName = seriesType.startsWith("TIME_SERIES_")
      ? seriesType
      : `TIME_SERIES_${seriesType}_ADJUSTED`;

    try {
      const data = await this.fetchApiData(functionName, symbol, true);

      if (!data) {
        return null;
      }

      return data;
    } catch (error) {
      logger.error("AlphaVantageService.fetchIndustryData failed", {
        error: error instanceof Error ? error.message : error,
        symbol,
        seriesType,
      });
      return null;
    }
  }

  async getCompanyOverview(symbol: string): Promise<any> {
    logger.info("AlphaVantageService.getCompanyOverview called", { symbol });
    return this.fetchApiData("OVERVIEW", symbol, false);
  }

  async getIncomeStatement(
    symbol: string,
    period: "annual" | "quarterly" = "annual",
  ): Promise<any> {
    logger.info("AlphaVantageService.getIncomeStatement called", {
      symbol,
      period,
    });
    const data = await this.fetchApiData("INCOME_STATEMENT", symbol, false);
    return period === "annual" ? data.annualReports : data.quarterlyReports;
  }

  async getBalanceSheet(
    symbol: string,
    period: "annual" | "quarterly" = "annual",
  ): Promise<any> {
    logger.info("AlphaVantageService.getBalanceSheet called", {
      symbol,
      period,
    });
    const data = await this.fetchApiData("BALANCE_SHEET", symbol, false);
    return period === "annual" ? data.annualReports : data.quarterlyReports;
  }

  async getCashFlow(
    symbol: string,
    period: "annual" | "quarterly" = "annual",
  ): Promise<any> {
    logger.info("AlphaVantageService.getCashFlow called", { symbol, period });
    const data = await this.fetchApiData("CASH_FLOW", symbol, false);
    return period === "annual" ? data.annualReports : data.quarterlyReports;
  }
}

export default AlphaVantageService;
