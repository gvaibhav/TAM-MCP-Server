import axios from "axios";
import { logger } from "../../utils/index.js";
import { DataSourceService } from "../../types/dataSources.js";
import { cacheService } from "../CacheService.js";

const BASE_URL = "https://api.coingecko.com/api/v3";

export class CoinGeckoService implements DataSourceService {
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.COINGECKO_API_KEY ?? "";

    if (!this.apiKey) {
      logger.info(
        "ℹ️  CoinGecko: Using free tier (no API key) - 10,000 calls/month limit",
      );
    } else {
      logger.info("ℹ️  CoinGecko: Using Pro tier with API key");
    }
  }

  private async fetchApiData(
    endpoint: string,
    params: Record<string, any> = {},
  ): Promise<any> {
    try {
      const headers: Record<string, string> = {};
      if (this.apiKey) {
        headers["x-cg-pro-api-key"] = this.apiKey;
      }

      const response = await axios.get(`${BASE_URL}${endpoint}`, {
        params,
        headers,
      });

      return response.data;
    } catch (error: any) {
      logger.error("CoinGeckoService: API call failed", {
        error: error.message,
        endpoint,
        params,
        status: error.response?.status,
      });
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    // CoinGecko free tier doesn't require API key
    return true;
  }

  async getDataFreshness(..._args: any[]): Promise<Date | null> {
    // CoinGecko provides real-time data, return current time
    return new Date();
  }

  /**
   * Get current price for one or more cryptocurrencies
   */
  async getPrice(
    ids: string | string[],
    vsCurrencies: string | string[] = "usd",
    includeMarketCap: boolean = true,
    include24hrVol: boolean = true,
    include24hrChange: boolean = true,
  ): Promise<any> {
    const idList = Array.isArray(ids) ? ids.join(",") : ids;
    const vsList = Array.isArray(vsCurrencies)
      ? vsCurrencies.join(",")
      : vsCurrencies;

    logger.info("CoinGeckoService.getPrice called", { ids: idList, vsCurrencies: vsList });

    try {
      // Cache crypto prices for 60 seconds (volatile data)
      return await cacheService.withCache(
        "coingecko:price",
        { ids: idList, vsCurrencies: vsList, includeMarketCap, include24hrVol, include24hrChange },
        async () => {
          return await this.fetchApiData("/simple/price", {
            ids: idList,
            vs_currencies: vsList,
            include_market_cap: includeMarketCap,
            include_24hr_vol: include24hrVol,
            include_24hr_change: include24hrChange,
          });
        },
        60, // 60 second cache
      );
    } catch (error) {
      logger.error("CoinGeckoService.getPrice failed", {
        error: error instanceof Error ? error.message : error,
        ids: idList,
      });
      return null;
    }
  }

  /**
   * Search for coins by query
   */
  async searchCoins(query: string): Promise<any> {
    logger.info("CoinGeckoService.searchCoins called", { query });

    try {
      const data = await this.fetchApiData("/search", { query });

      if (data?.coins) {
        return data.coins.map((coin: any) => ({
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol,
          marketCapRank: coin.market_cap_rank,
          thumb: coin.thumb,
          large: coin.large,
        }));
      }

      return [];
    } catch (error) {
      logger.error("CoinGeckoService.searchCoins failed", {
        error: error instanceof Error ? error.message : error,
        query,
      });
      return [];
    }
  }

  /**
   * Get detailed coin data
   */
  async getCoinData(
    id: string,
    localization: boolean = false,
    tickers: boolean = false,
    marketData: boolean = true,
    communityData: boolean = false,
    developerData: boolean = false,
  ): Promise<any> {
    logger.info("CoinGeckoService.getCoinData called", { id });

    try {
      const data = await this.fetchApiData(`/coins/${id}`, {
        localization,
        tickers,
        market_data: marketData,
        community_data: communityData,
        developer_data: developerData,
      });

      return {
        id: data.id,
        symbol: data.symbol,
        name: data.name,
        description: data.description?.en,
        image: data.image,
        marketCapRank: data.market_cap_rank,
        marketData: data.market_data
          ? {
              currentPrice: data.market_data.current_price,
              marketCap: data.market_data.market_cap,
              totalVolume: data.market_data.total_volume,
              priceChange24h: data.market_data.price_change_24h,
              priceChangePercentage24h: data.market_data.price_change_percentage_24h,
              priceChangePercentage7d: data.market_data.price_change_percentage_7d,
              priceChangePercentage30d: data.market_data.price_change_percentage_30d,
              high24h: data.market_data.high_24h,
              low24h: data.market_data.low_24h,
              circulatingSupply: data.market_data.circulating_supply,
              totalSupply: data.market_data.total_supply,
              maxSupply: data.market_data.max_supply,
            }
          : null,
        lastUpdated: data.last_updated,
        source: "CoinGecko",
      };
    } catch (error) {
      logger.error("CoinGeckoService.getCoinData failed", {
        error: error instanceof Error ? error.message : error,
        id,
      });
      return null;
    }
  }

  /**
   * Get historical market data (OHLC)
   */
  async getMarketChart(
    id: string,
    vsCurrency: string = "usd",
    days: number = 7,
  ): Promise<any> {
    logger.info("CoinGeckoService.getMarketChart called", { id, days });

    try {
      const data = await this.fetchApiData(`/coins/${id}/market_chart`, {
        vs_currency: vsCurrency,
        days,
      });

      return {
        id,
        vsCurrency,
        prices: data.prices?.map((p: any) => ({
          timestamp: new Date(p[0]),
          price: p[1],
        })),
        marketCaps: data.market_caps?.map((m: any) => ({
          timestamp: new Date(m[0]),
          marketCap: m[1],
        })),
        totalVolumes: data.total_volumes?.map((v: any) => ({
          timestamp: new Date(v[0]),
          volume: v[1],
        })),
        source: "CoinGecko",
      };
    } catch (error) {
      logger.error("CoinGeckoService.getMarketChart failed", {
        error: error instanceof Error ? error.message : error,
        id,
      });
      return null;
    }
  }

  /**
   * Get OHLC data (candles)
   */
  async getOHLC(
    id: string,
    vsCurrency: string = "usd",
    days: number = 7,
  ): Promise<any> {
    logger.info("CoinGeckoService.getOHLC called", { id, days });

    try {
      const data = await this.fetchApiData(`/coins/${id}/ohlc`, {
        vs_currency: vsCurrency,
        days,
      });

      return data.map((candle: any) => ({
        timestamp: new Date(candle[0]),
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
      }));
    } catch (error) {
      logger.error("CoinGeckoService.getOHLC failed", {
        error: error instanceof Error ? error.message : error,
        id,
      });
      return [];
    }
  }

  /**
   * Get top cryptocurrencies by market cap
   */
  async getTopCoins(
    vsCurrency: string = "usd",
    perPage: number = 100,
    page: number = 1,
  ): Promise<any> {
    logger.info("CoinGeckoService.getTopCoins called", {
      vsCurrency,
      perPage,
      page,
    });

    try {
      const data = await this.fetchApiData("/coins/markets", {
        vs_currency: vsCurrency,
        order: "market_cap_desc",
        per_page: perPage,
        page,
        sparkline: false,
      });

      return data.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        image: coin.image,
        currentPrice: coin.current_price,
        marketCap: coin.market_cap,
        marketCapRank: coin.market_cap_rank,
        totalVolume: coin.total_volume,
        priceChange24h: coin.price_change_24h,
        priceChangePercentage24h: coin.price_change_percentage_24h,
        circulatingSupply: coin.circulating_supply,
        totalSupply: coin.total_supply,
        maxSupply: coin.max_supply,
        lastUpdated: coin.last_updated,
      }));
    } catch (error) {
      logger.error("CoinGeckoService.getTopCoins failed", {
        error: error instanceof Error ? error.message : error,
      });
      return [];
    }
  }

  /**
   * Get global cryptocurrency market data
   */
  async getGlobalData(): Promise<any> {
    logger.info("CoinGeckoService.getGlobalData called");

    try {
      const data = await this.fetchApiData("/global");

      if (data?.data) {
        return {
          activeCryptocurrencies: data.data.active_cryptocurrencies,
          markets: data.data.markets,
          totalMarketCap: data.data.total_market_cap,
          totalVolume: data.data.total_volume,
          marketCapPercentage: data.data.market_cap_percentage,
          marketCapChangePercentage24hUsd: data.data.market_cap_change_percentage_24h_usd,
          updatedAt: data.data.updated_at,
          source: "CoinGecko",
        };
      }

      return null;
    } catch (error) {
      logger.error("CoinGeckoService.getGlobalData failed", {
        error: error instanceof Error ? error.message : error,
      });
      return null;
    }
  }

  // DataSourceService interface methods
  async searchSymbols(keywords: string): Promise<any> {
    return this.searchCoins(keywords);
  }

  async fetchMarketSize(id: string): Promise<any> {
    logger.info("CoinGeckoService.fetchMarketSize called", { id });

    try {
      const coinData = await this.getCoinData(id);

      if (!coinData || !coinData.marketData) {
        return null;
      }

      return {
        value: coinData.marketData.marketCap?.usd || null,
        symbol: coinData.symbol?.toUpperCase(),
        name: coinData.name,
        marketCapRank: coinData.marketCapRank,
        source: "CoinGecko",
        lastUpdated: new Date().toISOString().split("T")[0],
      };
    } catch (error) {
      logger.error("CoinGeckoService.fetchMarketSize failed", {
        error: error instanceof Error ? error.message : error,
        id,
      });
      return null;
    }
  }

  async fetchIndustryData(id: string): Promise<any> {
    logger.info("CoinGeckoService.fetchIndustryData called", { id });

    try {
      const [coinData, chartData] = await Promise.all([
        this.getCoinData(id),
        this.getMarketChart(id, "usd", 30),
      ]);

      return {
        coin: coinData,
        chart: chartData,
        source: "CoinGecko",
      };
    } catch (error) {
      logger.error("CoinGeckoService.fetchIndustryData failed", {
        error: error instanceof Error ? error.message : error,
        id,
      });
      return null;
    }
  }
}

export default CoinGeckoService;
