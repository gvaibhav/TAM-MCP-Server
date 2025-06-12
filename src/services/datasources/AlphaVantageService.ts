import axios from 'axios';
import { CacheManager, logger } from '../../utils/index.js';

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'YOUR_API_KEY'; // Fallback, should be in .env
const BASE_URL = 'https://www.alphavantage.co/query';

export class AlphaVantageService {
    private cache: typeof CacheManager;

    constructor() {
        this.cache = CacheManager;
    }

    private async fetchApiData(params: Record<string, string>): Promise<any> {
        const cacheKey = `alphavantage:${JSON.stringify(params)}`;
        const cachedData = this.cache.get(cacheKey);
        if (cachedData) {
            logger.info('AlphaVantageService: Cache hit', { cacheKey });
            return cachedData;
        }
        logger.info('AlphaVantageService: Cache miss', { cacheKey });

        try {
            const response = await axios.get(BASE_URL, { params: { ...params, apikey: API_KEY } });
            if (response.data["Error Message"]) {
                throw new Error(`Alpha Vantage API Error: ${response.data["Error Message"]}`);
            }
            if (response.data["Information"]) { // Handle rate limit messages
                logger.warn('AlphaVantageService: API Information', { info: response.data["Information"] });
                // Potentially throw an error or handle rate limiting more gracefully
            }
            this.cache.set(cacheKey, response.data);
            return response.data;
        } catch (error) {
            logger.error('AlphaVantageService: API call failed', { error: error instanceof Error ? error.message : error, params });
            throw error;
        }
    }

    async getCompanyOverview(symbol: string): Promise<any> {
        return this.fetchApiData({ function: 'OVERVIEW', symbol });
    }

    async getIncomeStatement(symbol: string, period: 'annual' | 'quarterly' = 'annual'): Promise<any> {
        // Alpha Vantage API returns multiple reports, SDK might expect one or allow selection
        // For now, returning the full response.
        const data = await this.fetchApiData({ function: 'INCOME_STATEMENT', symbol });
        return period === 'annual' ? data.annualReports : data.quarterlyReports;
    }

    async getBalanceSheet(symbol: string, period: 'annual' | 'quarterly' = 'annual'): Promise<any> {
        const data = await this.fetchApiData({ function: 'BALANCE_SHEET', symbol });
        return period === 'annual' ? data.annualReports : data.quarterlyReports;
    }

    async getCashFlow(symbol: string, period: 'annual' | 'quarterly' = 'annual'): Promise<any> {
        const data = await this.fetchApiData({ function: 'CASH_FLOW', symbol });
        return period === 'annual' ? data.annualReports : data.quarterlyReports;
    }
    
    // Corresponds to alphaVantage_searchSymbols
    async searchSymbols(keywords: string): Promise<any> {
        return this.fetchApiData({ function: 'SYMBOL_SEARCH', keywords });
    }

    // Placeholder for other Alpha Vantage functions if needed by other tools
    // e.g., for market_size_calculator or industry_search if they use stock data
    async fetchMarketData(params: any): Promise<any> {
        // This could be a generic method or specific ones like getGlobalQuote, etc.
        logger.warn('AlphaVantageService.fetchMarketData is a placeholder and needs specific implementation.', params);
        return this.fetchApiData(params);
    }
}
