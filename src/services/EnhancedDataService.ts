import { AlphaVantageService } from "./datasources/AlphaVantageService.js";
import { FredService } from "./datasources/FredService.js";
import { ImfService } from "./datasources/ImfService.js";
import { NasdaqService } from "./datasources/NasdaqService.js";
import { OecdService } from "./datasources/OecdService.js";
import { WorldBankService } from "./datasources/WorldBankService.js";
import { BlsService } from "./datasources/BlsService.js";
import { CensusService } from "./datasources/CensusService.js";
import { logger } from "../utils/index.js";

export interface EnhancedDataServiceConfig {
  apiKeys?: {
    alphaVantage?: string;
    fred?: string;
    nasdaq?: string;
    census?: string;
    bls?: string;
  };
  enableMetrics?: boolean;
}

export class EnhancedDataService {
  private alphaVantageService!: AlphaVantageService;
  private fredService!: FredService;
  private imfService!: ImfService;
  private nasdaqService!: NasdaqService;
  private oecdService!: OecdService;
  private worldBankService!: WorldBankService;
  private blsService!: BlsService;
  private censusService!: CensusService;
  private config: EnhancedDataServiceConfig;

  constructor(config: EnhancedDataServiceConfig = {}) {
    this.config = config;
    this.initializeServices();
  }

  private initializeServices(): void {
    try {
      logger.info("EnhancedDataService: Initializing services without cache");

      // Initialize all data source services without cache dependencies
      this.alphaVantageService = new AlphaVantageService(
        this.config.apiKeys?.alphaVantage ?? process.env.ALPHA_VANTAGE_API_KEY,
      );

      this.fredService = new FredService(
        this.config.apiKeys?.fred ?? process.env.FRED_API_KEY,
      );

      this.imfService = new ImfService();
      this.nasdaqService = new NasdaqService();
      this.oecdService = new OecdService();
      this.worldBankService = new WorldBankService();

      this.blsService = new BlsService(
        this.config.apiKeys?.bls ?? process.env.BLS_API_KEY,
      );

      this.censusService = new CensusService(
        this.config.apiKeys?.census ?? process.env.CENSUS_API_KEY,
      );

      logger.info("EnhancedDataService: All services initialized successfully");
    } catch (error) {
      logger.error("EnhancedDataService: Failed to initialize services", {
        error,
      });
      throw error;
    }
  }

  // Financial data methods
  async getStockPrice(symbol: string): Promise<any> {
    try {
      // AlphaVantage doesn't have getStockPrice, use fetchIndustryData for time series
      return await this.alphaVantageService.fetchIndustryData(symbol);
    } catch (error) {
      logger.error("EnhancedDataService.getStockPrice failed", {
        symbol,
        error,
      });
      throw error;
    }
  }

  async getCompanyOverview(symbol: string): Promise<any> {
    try {
      return await this.alphaVantageService.getCompanyOverview(symbol);
    } catch (error) {
      logger.error("EnhancedDataService.getCompanyOverview failed", {
        symbol,
        error,
      });
      throw error;
    }
  }

  async getIncomeStatement(symbol: string): Promise<any> {
    try {
      return await this.alphaVantageService.getIncomeStatement(symbol);
    } catch (error) {
      logger.error("EnhancedDataService.getIncomeStatement failed", {
        symbol,
        error,
      });
      throw error;
    }
  }

  async getBalanceSheet(symbol: string): Promise<any> {
    try {
      return await this.alphaVantageService.getBalanceSheet(symbol);
    } catch (error) {
      logger.error("EnhancedDataService.getBalanceSheet failed", {
        symbol,
        error,
      });
      throw error;
    }
  }

  async getCashFlow(symbol: string): Promise<any> {
    try {
      return await this.alphaVantageService.getCashFlow(symbol);
    } catch (error) {
      logger.error("EnhancedDataService.getCashFlow failed", { symbol, error });
      throw error;
    }
  }

  // Economic data methods
  async getEconomicData(seriesId: string, params?: any): Promise<any> {
    try {
      return await this.fredService.getSeriesObservations(seriesId, params);
    } catch (error) {
      logger.error("EnhancedDataService.getEconomicData failed", {
        seriesId,
        error,
      });
      throw error;
    }
  }

  async getIMFData(indicator: string, country?: string): Promise<any> {
    try {
      // Use fetchImfDataset which is the actual method in ImfService
      return await this.imfService.fetchImfDataset(indicator, country ?? "all");
    } catch (error) {
      logger.error("EnhancedDataService.getIMFData failed", {
        indicator,
        country,
        error,
      });
      throw error;
    }
  }

  async getWorldBankData(
    countryCode: string,
    indicatorCode: string,
    params?: any,
  ): Promise<any> {
    try {
      return await this.worldBankService.getIndicatorData(
        countryCode,
        indicatorCode,
        params,
      );
    } catch (error) {
      logger.error("EnhancedDataService.getWorldBankData failed", {
        countryCode,
        indicatorCode,
        error,
      });
      throw error;
    }
  }

  // Market data methods
  async fetchMarketSize(industryId: string, region?: string): Promise<any> {
    logger.info("EnhancedDataService.fetchMarketSize called", {
      industryId,
      region,
    });

    try {
      // Try multiple data sources for market size
      const sources = [
        () => this.worldBankService.fetchMarketSize(industryId, region),
        () => this.fredService.fetchMarketSize(industryId, region),
        () => this.censusService.fetchMarketSize(industryId, region),
      ];

      for (const source of sources) {
        try {
          const result = await source();
          if (result && result !== 0) {
            return result;
          }
        } catch (error) {
          logger.debug(
            "EnhancedDataService: Market size source failed, trying next",
            {
              industryId,
              region,
              error,
            },
          );
        }
      }

      logger.warn("EnhancedDataService: No market size data available", {
        industryId,
        region,
      });
      return 0;
    } catch (error) {
      logger.error("EnhancedDataService.fetchMarketSize failed", {
        industryId,
        region,
        error,
      });
      return 0;
    }
  }

  // Health check and monitoring
  async healthCheck(): Promise<{
    status: "healthy" | "degraded" | "unhealthy";
    services: Record<string, boolean>;
    timestamp: string;
  }> {
    try {
      const serviceChecks = await Promise.allSettled([
        this.alphaVantageService.isAvailable(),
        this.fredService.isAvailable(),
        this.imfService.isAvailable(),
        this.nasdaqService.isAvailable(),
        this.oecdService.isAvailable(),
        this.worldBankService.isAvailable(),
        this.blsService.isAvailable(),
        this.censusService.isAvailable(),
      ]);

      const services = {
        alphaVantage:
          serviceChecks[0].status === "fulfilled"
            ? serviceChecks[0].value
            : false,
        fred:
          serviceChecks[1].status === "fulfilled"
            ? serviceChecks[1].value
            : false,
        imf:
          serviceChecks[2].status === "fulfilled"
            ? serviceChecks[2].value
            : false,
        nasdaq:
          serviceChecks[3].status === "fulfilled"
            ? serviceChecks[3].value
            : false,
        oecd:
          serviceChecks[4].status === "fulfilled"
            ? serviceChecks[4].value
            : false,
        worldBank:
          serviceChecks[5].status === "fulfilled"
            ? serviceChecks[5].value
            : false,
        bls:
          serviceChecks[6].status === "fulfilled"
            ? serviceChecks[6].value
            : false,
        census:
          serviceChecks[7].status === "fulfilled"
            ? serviceChecks[7].value
            : false,
      };

      const availableServices = Object.values(services).filter(
        (available) => available,
      ).length;
      const totalServices = Object.keys(services).length;

      let status: "healthy" | "degraded" | "unhealthy";
      if (availableServices === totalServices) {
        status = "healthy";
      } else if (availableServices > totalServices / 2) {
        status = "degraded";
      } else {
        status = "unhealthy";
      }

      return {
        status,
        services,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("EnhancedDataService.healthCheck failed", { error });
      return {
        status: "unhealthy",
        services: {},
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getMetrics(): Promise<any> {
    try {
      return {
        services: {
          total: 8,
          healthy: (await this.healthCheck()).services,
        },
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("EnhancedDataService.getMetrics failed", { error });
      return {
        error: "Failed to retrieve metrics",
        timestamp: new Date().toISOString(),
      };
    }
  }
}

export default EnhancedDataService;
