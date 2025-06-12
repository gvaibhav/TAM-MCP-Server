import { AlphaVantageService } from './datasources/AlphaVantageService.js';
import { FredService } from './datasources/FredService.js';
import { ImfService } from './datasources/ImfService.js';
import { NasdaqService } from './datasources/NasdaqService.js';
import { OecdService } from './datasources/OecdService.js';
import { WorldBankService } from './datasources/WorldBankService.js';
import { BlsService } from './datasources/BlsService.js';
import { CensusService } from './datasources/CensusService.js';

export class DataService {
    private alphaVantageService: AlphaVantageService;
    private fredService: FredService;
    private imfService: ImfService;
    private nasdaqService: NasdaqService;
    private oecdService: OecdService;
    private worldBankService: WorldBankService;
    private blsService: BlsService;
    private censusService: CensusService;

    constructor() {
        this.alphaVantageService = new AlphaVantageService();
        this.fredService = new FredService();
        this.imfService = new ImfService();
        this.nasdaqService = new NasdaqService();
        this.oecdService = new OecdService();
        this.worldBankService = new WorldBankService();
        this.blsService = new BlsService();
        this.censusService = new CensusService();
    }

    // Alpha Vantage methods
    async getAlphaVantageData(apiFunction: string, params: any): Promise<any> {
        switch (apiFunction) {
            case 'OVERVIEW':
                return this.alphaVantageService.getCompanyOverview(params.symbol);
            case 'SYMBOL_SEARCH':
                return this.alphaVantageService.searchSymbols(params.keywords);
            case 'INCOME_STATEMENT':
                return this.alphaVantageService.getIncomeStatement(params.symbol, params.period);
            case 'BALANCE_SHEET':
                return this.alphaVantageService.getBalanceSheet(params.symbol, params.period);
            case 'CASH_FLOW':
                return this.alphaVantageService.getCashFlow(params.symbol, params.period);
            default:
                throw new Error(`Function ${apiFunction} not implemented for AlphaVantageService`);
        }
    }

    // FRED methods
    async getFredData(params: any): Promise<any> {
        return this.fredService.getSeriesObservations(params.seriesId, params);
    }

    // IMF methods
    async getImfData(apiFunction: string, params: any): Promise<any> {
        switch (apiFunction) {
            case 'fetchImfDataset':
                return this.imfService.fetchImfDataset(params);
            case 'fetchMarketSize':
                return this.imfService.fetchMarketSize(params);
            default:
                throw new Error(`Function ${apiFunction} not implemented for ImfService`);
        }
    }

    // Nasdaq methods
    async getNasdaqData(apiFunction: string, params: any): Promise<any> {
        switch (apiFunction) {
            case 'fetchIndustryData':
                return this.nasdaqService.fetchIndustryData(params);
            case 'fetchMarketSize':
                return this.nasdaqService.fetchMarketSize(params);
            default:
                throw new Error(`Function ${apiFunction} not implemented for NasdaqService`);
        }
    }

    // OECD methods
    async getOecdData(apiFunction: string, params: any): Promise<any> {
        switch (apiFunction) {
            case 'fetchOecdDataset':
                return this.oecdService.fetchOecdDataset(params);
            case 'fetchMarketSize':
                return this.oecdService.fetchMarketSize(params);
            default:
                throw new Error(`Function ${apiFunction} not implemented for OecdService`);
        }
    }

    // World Bank methods
    async getWorldBankData(params: any): Promise<any> {
        return this.worldBankService.fetchMarketSize(params);
    }

    // BLS methods
    async getBlsData(apiFunction: string, params: any): Promise<any> {
        switch (apiFunction) {
            case 'fetchSeriesData':
                return this.blsService.fetchSeriesData(params);
            case 'fetchIndustryData':
                return this.blsService.fetchIndustryData(params);
            case 'fetchMarketSize':
                return this.blsService.fetchMarketSize(params);
            default:
                throw new Error(`Function ${apiFunction} not implemented for BlsService`);
        }
    }

    // Census methods
    async getCensusData(apiFunction: string, params: any): Promise<any> {
        switch (apiFunction) {
            case 'fetchIndustryData':
                return this.censusService.fetchIndustryData(params);
            case 'fetchMarketSize':
                return this.censusService.fetchMarketSize(params);
            case 'getData':
                return this.censusService.getData(params);
            default:
                throw new Error(`Function ${apiFunction} not implemented for CensusService`);
        }
    }

    // Company Financials method (consolidates Alpha Vantage financial statements)
    async getCompanyFinancials(params: any): Promise<any> {
        const { companySymbol, statementType, period, limit } = params;
        
        switch (statementType) {
            case 'OVERVIEW':
                return this.alphaVantageService.getCompanyOverview(companySymbol);
            case 'INCOME_STATEMENT':
                const incomeData = await this.alphaVantageService.getIncomeStatement(companySymbol, period);
                return limit > 1 ? incomeData.slice(0, limit) : incomeData[0] || incomeData;
            case 'BALANCE_SHEET':
                const balanceData = await this.alphaVantageService.getBalanceSheet(companySymbol, period);
                return limit > 1 ? balanceData.slice(0, limit) : balanceData[0] || balanceData;
            case 'CASH_FLOW':
                const cashFlowData = await this.alphaVantageService.getCashFlow(companySymbol, period);
                return limit > 1 ? cashFlowData.slice(0, limit) : cashFlowData[0] || cashFlowData;
            default:
                throw new Error(`Statement type ${statementType} not supported`);
        }
    }


    // Method for industry_search tool
    async searchIndustries(params: any): Promise<any> {
        // Logic for searchIndustries, calling multiple data source services
        console.log('DataService.searchIndustries called with:', params);
        // This will be a complex method involving:
        // 1. Determining relevant sources
        // 2. Concurrently querying them (e.g., this.alphaVantageService.searchSymbol(...), this.censusService.fetchNaicsDetails(...))
        // 3. Consolidating, deduplicating, and transforming results into IndustryDTO
        // 4. Scoring and ranking
        // 5. Handling errors from individual sources
        return {
            query: params.query,
            parameters: params,
            results: [], // Placeholder
            summary: 'Search results will appear here.',
            errors: [],
        };
    }

    // Method for tam_calculator tool
    async calculateTam(params: any): Promise<any> {
        console.log('DataService.calculateTam called with:', params);
        const { baseMarketSize, annualGrowthRate, projectionYears, segmentationAdjustments } = params;
        let calculatedTam = baseMarketSize;
        const projectionDetails: { year: number, tam: number }[] = [];
        const assumptions = [`Constant annual growth rate of ${annualGrowthRate * 100}%`];

        for (let i = 1; i <= projectionYears; i++) {
            calculatedTam *= (1 + annualGrowthRate);
            projectionDetails.push({ year: i, tam: calculatedTam });
        }

        if (segmentationAdjustments && segmentationAdjustments.factor) {
            calculatedTam *= segmentationAdjustments.factor;
            assumptions.push(`Applied segmentation adjustment factor of ${segmentationAdjustments.factor}. Rationale: ${segmentationAdjustments.rationale || 'Not specified'}`);
        }

        return {
            calculatedTam,
            projectionDetails,
            assumptions,
        };
    }

    // Method for market_size_calculator tool
    async calculateMarketSize(params: any): Promise<any> {
        console.log('DataService.calculateMarketSize called with:', params);
        // This method will involve:
        // 1. Parsing industryQuery and geographyCodes
        // 2. Calling other DataService methods or specific data source services
        //    (e.g., searchIndustries, or direct calls to get data from Census, BLS, World Bank)
        // 3. Applying a methodology (top_down, bottom_up, auto)
        // 4. Synthesizing data and calculating market size
        return {
            estimatedMarketSize: 0, // Placeholder
            currency: 'USD',
            year: params.year || new Date().getFullYear().toString(),
            dataSourcesUsed: [],
            confidenceScore: 0.5, // Placeholder
        };
    }

    // Add other methods for analytical/calculation tools as needed
}
