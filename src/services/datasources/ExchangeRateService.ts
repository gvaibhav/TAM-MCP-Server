import axios from "axios";
import { logger } from "../../utils/index.js";
import { DataSourceService } from "../../types/dataSources.js";

// Using open.er-api.com - truly free, no key required
const BASE_URL = "https://open.er-api.com/v6";

export class ExchangeRateService implements DataSourceService {
  constructor() {
    logger.info(
      "ℹ️  ExchangeRateAPI: Using free tier (no API key required)",
    );
  }

  private async fetchApiData(
    endpoint: string,
    params: Record<string, any> = {},
  ): Promise<any> {
    try {
      const response = await axios.get(`${BASE_URL}${endpoint}`, {
        params,
      });

      const data = response.data;

      // Check for API errors
      if (data.result === "error") {
        throw new Error(
          `ExchangeRateAPI Error: ${data["error-type"] || "Unknown error"}`,
        );
      }

      return data;
    } catch (error: any) {
      logger.error("ExchangeRateService: API call failed", {
        error: error.message,
        endpoint,
        params,
      });
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    // No API key required, always available
    return true;
  }

  async getDataFreshness(..._args: any[]): Promise<Date | null> {
    // ExchangeRateAPI provides real-time data
    return new Date();
  }

  /**
   * Get latest exchange rates
   */
  async getLatestRates(
    base: string = "USD",
    symbols?: string | string[],
  ): Promise<any> {
    logger.info("ExchangeRateService.getLatestRates called", { base, symbols });

    try {
      const data = await this.fetchApiData(`/latest/${base}`);

      // Filter to specific symbols if requested
      let rates = data.rates;
      if (symbols) {
        const symbolList = Array.isArray(symbols) ? symbols : [symbols];
        rates = Object.fromEntries(
          Object.entries(data.rates).filter(([key]) => symbolList.includes(key))
        );
      }

      return {
        base: data.base_code,
        date: new Date(data.time_last_update_unix * 1000).toISOString().split('T')[0],
        rates,
        timestamp: new Date(data.time_last_update_unix * 1000),
        source: "ExchangeRateAPI",
      };
    } catch (error) {
      logger.error("ExchangeRateService.getLatestRates failed", {
        error: error instanceof Error ? error.message : error,
        base,
        symbols,
      });
      return null;
    }
  }

  /**
   * Get historical exchange rates for a specific date
   */
  async getHistoricalRates(
    date: string,
    base: string = "USD",
    symbols?: string | string[],
  ): Promise<any> {
    logger.info("ExchangeRateService.getHistoricalRates called", {
      date,
      base,
      symbols,
    });

    try {
      const params: Record<string, any> = { base };
      if (symbols) {
        params.symbols = Array.isArray(symbols) ? symbols.join(",") : symbols;
      }

      const data = await this.fetchApiData(`/${date}`, params);

      return {
        base: data.base,
        date: data.date,
        historical: data.historical,
        rates: data.rates,
        timestamp: new Date(data.date),
        source: "ExchangeRate.host",
      };
    } catch (error) {
      logger.error("ExchangeRateService.getHistoricalRates failed", {
        error: error instanceof Error ? error.message : error,
        date,
        base,
      });
      return null;
    }
  }

  /**
   * Get time series data (range of dates)
   */
  async getTimeSeries(
    startDate: string,
    endDate: string,
    base: string = "USD",
    symbols?: string | string[],
  ): Promise<any> {
    logger.info("ExchangeRateService.getTimeSeries called", {
      startDate,
      endDate,
      base,
      symbols,
    });

    try {
      const params: Record<string, any> = {
        start_date: startDate,
        end_date: endDate,
        base,
      };
      if (symbols) {
        params.symbols = Array.isArray(symbols) ? symbols.join(",") : symbols;
      }

      const data = await this.fetchApiData("/timeseries", params);

      return {
        base: data.base,
        startDate: data.start_date,
        endDate: data.end_date,
        rates: data.rates,
        source: "ExchangeRate.host",
      };
    } catch (error) {
      logger.error("ExchangeRateService.getTimeSeries failed", {
        error: error instanceof Error ? error.message : error,
        startDate,
        endDate,
      });
      return null;
    }
  }

  /**
   * Convert currency amount
   */
  async convertCurrency(
    from: string,
    to: string,
    amount: number,
    date?: string,
  ): Promise<any> {
    logger.info("ExchangeRateService.convertCurrency called", {
      from,
      to,
      amount,
      date,
    });

    try {
      const params: Record<string, any> = {
        from,
        to,
        amount,
      };
      if (date) {
        params.date = date;
      }

      const data = await this.fetchApiData("/convert", params);

      return {
        query: {
          from: data.query.from,
          to: data.query.to,
          amount: data.query.amount,
        },
        info: {
          rate: data.info.rate,
          timestamp: new Date(data.info.timestamp * 1000),
        },
        date: data.date,
        result: data.result,
        source: "ExchangeRate.host",
      };
    } catch (error) {
      logger.error("ExchangeRateService.convertCurrency failed", {
        error: error instanceof Error ? error.message : error,
        from,
        to,
        amount,
      });
      return null;
    }
  }

  /**
   * Get list of available currencies
   */
  async getAvailableCurrencies(): Promise<any> {
    logger.info("ExchangeRateService.getAvailableCurrencies called");

    try {
      const data = await this.fetchApiData("/symbols");

      return {
        symbols: data.symbols,
        count: Object.keys(data.symbols || {}).length,
        source: "ExchangeRate.host",
      };
    } catch (error) {
      logger.error("ExchangeRateService.getAvailableCurrencies failed", {
        error: error instanceof Error ? error.message : error,
      });
      return null;
    }
  }

  /**
   * Get fluctuation data (changes between two dates)
   */
  async getFluctuation(
    startDate: string,
    endDate: string,
    base: string = "USD",
    symbols?: string | string[],
  ): Promise<any> {
    logger.info("ExchangeRateService.getFluctuation called", {
      startDate,
      endDate,
      base,
      symbols,
    });

    try {
      const params: Record<string, any> = {
        start_date: startDate,
        end_date: endDate,
        base,
      };
      if (symbols) {
        params.symbols = Array.isArray(symbols) ? symbols.join(",") : symbols;
      }

      const data = await this.fetchApiData("/fluctuation", params);

      return {
        base: data.base,
        startDate: data.start_date,
        endDate: data.end_date,
        fluctuation: data.rates,
        source: "ExchangeRate.host",
      };
    } catch (error) {
      logger.error("ExchangeRateService.getFluctuation failed", {
        error: error instanceof Error ? error.message : error,
        startDate,
        endDate,
      });
      return null;
    }
  }

  /**
   * Get precious metals rates (Gold, Silver, etc.)
   */
  async getMetalRates(base: string = "USD"): Promise<any> {
    logger.info("ExchangeRateService.getMetalRates called", { base });

    try {
      // Request precious metals: XAU (Gold), XAG (Silver), XPT (Platinum), XPD (Palladium)
      const symbols = ["XAU", "XAG", "XPT", "XPD"];

      const data = await this.getLatestRates(base, symbols);

      if (!data || !data.rates) {
        return null;
      }

      return {
        base: data.base,
        date: data.date,
        metals: {
          gold: data.rates.XAU,
          silver: data.rates.XAG,
          platinum: data.rates.XPT,
          palladium: data.rates.XPD,
        },
        timestamp: data.timestamp,
        source: "ExchangeRate.host",
      };
    } catch (error) {
      logger.error("ExchangeRateService.getMetalRates failed", {
        error: error instanceof Error ? error.message : error,
        base,
      });
      return null;
    }
  }

  // DataSourceService interface methods
  async searchSymbols(keywords: string): Promise<any> {
    // Search for currency codes
    logger.info("ExchangeRateService.searchSymbols called", { keywords });

    try {
      const currencies = await this.getAvailableCurrencies();

      if (!currencies || !currencies.symbols) {
        return [];
      }

      const upperKeywords = keywords.toUpperCase();
      const results = Object.entries(currencies.symbols)
        .filter(
          ([code, name]) =>
            code.includes(upperKeywords) ||
            (name as string).toUpperCase().includes(upperKeywords),
        )
        .map(([code, name]) => ({
          symbol: code,
          name: name as string,
          type: "currency",
        }));

      return results;
    } catch (error) {
      logger.error("ExchangeRateService.searchSymbols failed", {
        error: error instanceof Error ? error.message : error,
        keywords,
      });
      return [];
    }
  }

  async fetchMarketSize(symbol: string): Promise<any> {
    // Not applicable for forex/commodities
    logger.info("ExchangeRateService.fetchMarketSize called", { symbol });
    return null;
  }

  async fetchIndustryData(base: string = "USD"): Promise<any> {
    logger.info("ExchangeRateService.fetchIndustryData called", { base });

    try {
      // Get latest rates and precious metals
      const [rates, metals] = await Promise.all([
        this.getLatestRates(base),
        this.getMetalRates(base),
      ]);

      return {
        forex: rates,
        preciousMetals: metals,
        source: "ExchangeRate.host",
      };
    } catch (error) {
      logger.error("ExchangeRateService.fetchIndustryData failed", {
        error: error instanceof Error ? error.message : error,
        base,
      });
      return null;
    }
  }
}

export default ExchangeRateService;
