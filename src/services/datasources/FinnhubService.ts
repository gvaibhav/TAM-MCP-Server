import axios from "axios";
import { logger } from "../../utils/index.js";
import { DataSourceService } from "../../types/dataSources.js";
import { cacheService } from "../CacheService.js";

const BASE_URL = "https://finnhub.io/api/v1";

export class FinnhubService implements DataSourceService {
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.FINNHUB_API_KEY ?? "";

    if (!this.apiKey) {
      logger.info(
        "ℹ️  Finnhub: API key not configured - service disabled (set FINNHUB_API_KEY to enable)",
      );
    }
  }

  private async fetchApiData(
    endpoint: string,
    params: Record<string, any> = {},
  ): Promise<any> {
    if (!this.apiKey) {
      throw new Error("Finnhub API key not configured");
    }

    try {
      const response = await axios.get(`${BASE_URL}${endpoint}`, {
        params: {
          ...params,
          token: this.apiKey,
        },
      });

      const data = response.data;

      // Check for API errors
      if (data.error) {
        throw new Error(`Finnhub API Error: ${data.error}`);
      }

      return data;
    } catch (error: any) {
      logger.error("FinnhubService: API call failed", {
        error: error.message,
        endpoint,
        params,
      });
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async getDataFreshness(..._args: any[]): Promise<Date | null> {
    // Finnhub provides real-time data, return current time
    return new Date();
  }

  /**
   * Get real-time quote for a symbol
   */
  async getQuote(symbol: string): Promise<any> {
    logger.info("FinnhubService.getQuote called", { symbol });

    try {
      // Use cache with 60 second TTL for real-time quotes
      return await cacheService.withCache(
        "finnhub:quote",
        { symbol },
        async () => {
          const data = await this.fetchApiData("/quote", { symbol });

          return {
            symbol,
            current: data.c,
            change: data.d,
            percentChange: data.dp,
            high: data.h,
            low: data.l,
            open: data.o,
            previousClose: data.pc,
            timestamp: data.t ? new Date(data.t * 1000) : new Date(),
            source: "Finnhub",
          };
        },
        60, // 60 second cache for real-time quotes
      );
    } catch (error) {
      logger.error("FinnhubService.getQuote failed", {
        error: error instanceof Error ? error.message : error,
        symbol,
      });
      return null;
    }
  }

  /**
   * Search for symbols by query
   */
  async searchSymbols(query: string): Promise<any> {
    logger.info("FinnhubService.searchSymbols called", { query });

    try {
      const data = await this.fetchApiData("/search", { q: query });

      if (data?.result) {
        return data.result.map((item: any) => ({
          symbol: item.symbol,
          description: item.description,
          type: item.type,
          displaySymbol: item.displaySymbol,
        }));
      }

      return [];
    } catch (error) {
      logger.error("FinnhubService.searchSymbols failed", {
        error: error instanceof Error ? error.message : error,
        query,
      });
      return [];
    }
  }

  /**
   * Get company profile
   */
  async getCompanyProfile(symbol: string): Promise<any> {
    logger.info("FinnhubService.getCompanyProfile called", { symbol });

    try {
      const data = await this.fetchApiData("/stock/profile2", { symbol });

      return {
        symbol: data.ticker,
        name: data.name,
        country: data.country,
        currency: data.currency,
        exchange: data.exchange,
        industry: data.finnhubIndustry,
        ipo: data.ipo,
        marketCap: data.marketCapitalization,
        shareOutstanding: data.shareOutstanding,
        logo: data.logo,
        phone: data.phone,
        weburl: data.weburl,
        source: "Finnhub",
      };
    } catch (error) {
      logger.error("FinnhubService.getCompanyProfile failed", {
        error: error instanceof Error ? error.message : error,
        symbol,
      });
      return null;
    }
  }

  /**
   * Get market news
   */
  async getMarketNews(category: string = "general"): Promise<any> {
    logger.info("FinnhubService.getMarketNews called", { category });

    try {
      const data = await this.fetchApiData("/news", { category });

      return data.map((item: any) => ({
        id: item.id,
        category: item.category,
        datetime: new Date(item.datetime * 1000),
        headline: item.headline,
        image: item.image,
        related: item.related,
        source: item.source,
        summary: item.summary,
        url: item.url,
      }));
    } catch (error) {
      logger.error("FinnhubService.getMarketNews failed", {
        error: error instanceof Error ? error.message : error,
        category,
      });
      return [];
    }
  }

  /**
   * Get company news
   */
  async getCompanyNews(symbol: string, from?: string, to?: string): Promise<any> {
    logger.info("FinnhubService.getCompanyNews called", { symbol, from, to });

    const today = new Date();
    const defaultTo = to || today.toISOString().split("T")[0];
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const defaultFrom = from || weekAgo.toISOString().split("T")[0];

    try {
      const data = await this.fetchApiData("/company-news", {
        symbol,
        from: defaultFrom,
        to: defaultTo,
      });

      return data.map((item: any) => ({
        category: item.category,
        datetime: new Date(item.datetime * 1000),
        headline: item.headline,
        id: item.id,
        image: item.image,
        related: item.related,
        source: item.source,
        summary: item.summary,
        url: item.url,
      }));
    } catch (error) {
      logger.error("FinnhubService.getCompanyNews failed", {
        error: error instanceof Error ? error.message : error,
        symbol,
      });
      return [];
    }
  }

  /**
   * Get sentiment analysis for a symbol
   */
  async getSentiment(symbol: string): Promise<any> {
    logger.info("FinnhubService.getSentiment called", { symbol });

    try {
      const data = await this.fetchApiData("/news-sentiment", { symbol });

      return {
        symbol,
        buzz: data.buzz,
        companyNewsScore: data.companyNewsScore,
        sectorAverageBullishPercent: data.sectorAverageBullishPercent,
        sectorAverageNewsScore: data.sectorAverageNewsScore,
        sentiment: data.sentiment,
        source: "Finnhub",
      };
    } catch (error) {
      logger.error("FinnhubService.getSentiment failed", {
        error: error instanceof Error ? error.message : error,
        symbol,
      });
      return null;
    }
  }

  /**
   * Get recommendation trends (analyst ratings)
   */
  async getRecommendationTrends(symbol: string): Promise<any> {
    logger.info("FinnhubService.getRecommendationTrends called", { symbol });

    try {
      const data = await this.fetchApiData("/stock/recommendation", { symbol });

      return data.map((item: any) => ({
        symbol: item.symbol,
        buy: item.buy,
        hold: item.hold,
        sell: item.sell,
        strongBuy: item.strongBuy,
        strongSell: item.strongSell,
        period: item.period,
      }));
    } catch (error) {
      logger.error("FinnhubService.getRecommendationTrends failed", {
        error: error instanceof Error ? error.message : error,
        symbol,
      });
      return [];
    }
  }

  /**
   * Get basic financials
   */
  async getBasicFinancials(symbol: string): Promise<any> {
    logger.info("FinnhubService.getBasicFinancials called", { symbol });

    try {
      const data = await this.fetchApiData("/stock/metric", {
        symbol,
        metric: "all",
      });

      return {
        symbol,
        metric: data.metric,
        series: data.series,
        source: "Finnhub",
      };
    } catch (error) {
      logger.error("FinnhubService.getBasicFinancials failed", {
        error: error instanceof Error ? error.message : error,
        symbol,
      });
      return null;
    }
  }

  /**
   * Get ESG scores
   */
  async getESGScores(symbol: string): Promise<any> {
    logger.info("FinnhubService.getESGScores called", { symbol });

    try {
      const data = await this.fetchApiData("/stock/esg", { symbol });

      return {
        symbol,
        totalESG: data.totalESG,
        environmentScore: data.environmentScore,
        socialScore: data.socialScore,
        governanceScore: data.governanceScore,
        lastUpdated: data.lastUpdated,
        source: "Finnhub",
      };
    } catch (error) {
      logger.error("FinnhubService.getESGScores failed", {
        error: error instanceof Error ? error.message : error,
        symbol,
      });
      return null;
    }
  }

  // DataSourceService interface methods
  async fetchMarketSize(symbol: string): Promise<any> {
    logger.info("FinnhubService.fetchMarketSize called", { symbol });

    try {
      const profile = await this.getCompanyProfile(symbol);

      if (!profile) {
        return null;
      }

      return {
        value: profile.marketCap ? profile.marketCap * 1000000 : null,
        symbol: profile.symbol,
        name: profile.name,
        industry: profile.industry,
        exchange: profile.exchange,
        source: "Finnhub",
        lastUpdated: new Date().toISOString().split("T")[0],
      };
    } catch (error) {
      logger.error("FinnhubService.fetchMarketSize failed", {
        error: error instanceof Error ? error.message : error,
        symbol,
      });
      return null;
    }
  }

  async fetchIndustryData(symbol: string): Promise<any> {
    logger.info("FinnhubService.fetchIndustryData called", { symbol });

    try {
      const [profile, financials, quote] = await Promise.all([
        this.getCompanyProfile(symbol),
        this.getBasicFinancials(symbol),
        this.getQuote(symbol),
      ]);

      return {
        profile,
        financials,
        quote,
        source: "Finnhub",
      };
    } catch (error) {
      logger.error("FinnhubService.fetchIndustryData failed", {
        error: error instanceof Error ? error.message : error,
        symbol,
      });
      return null;
    }
  }
}

export default FinnhubService;
