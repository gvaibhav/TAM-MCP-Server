// src/services/dataService.ts
import { CacheService } from './cache/cacheService.js';
import { PersistenceService } from './cache/persistenceService.js';
import { DataSourceService } from '../types/dataSources.js';

// Import all data source services
import { WorldBankService } from './dataSources/worldBankService.js';
import { FredService } from './dataSources/fredService.js';
import { BlsService } from './dataSources/blsService.js';
import { CensusService } from './dataSources/censusService.js';
import { OecdService } from './dataSources/oecdService.js';
import { ImfService } from './dataSources/imfService.js';
import { AlphaVantageService } from './dataSources/alphaVantageService.js';
import { NasdaqDataService } from './dataSources/nasdaqDataService.js';

// Mock data (remains for ultimate fallback or for methods not yet fully migrated)
const mockIndustryData: Record<string, any> = {
  'tech-software': { id: 'tech-software', name: 'Software Technology', country: 'USA', marketSize: 659 * 1e9, year: 2023 },
  'tech-ai': { id: 'tech-ai', name: 'AI Technology', country: 'USA', marketSize: 328 * 1e9, year: 2023 },
};

const mockMarketForecast: Record<string, any[]> = {
  'tech-software': [{ year: 2024, value: 754 * 1e9 }, { year: 2025, value: 850 * 1e9 }],
  'tech-ai': [{ year: 2024, value: 422 * 1e9 }, { year: 2025, value: 510 * 1e9 }],
};


// Helper type for service map
type DataSourceServiceMap = { [key: string]: DataSourceService };

export class DataService {
  private persistenceService: PersistenceService;
  private cacheService: CacheService;
  private dataSourceServicesMap: DataSourceServiceMap; // Store as a map for easy lookup by name

  // Define a preferred order and class mapping
  private serviceDefinitions: { name: string, class: new (cacheService: CacheService, apiKey?: string) => DataSourceService }[] = [
    // Order can be adjusted based on typical use cases or data quality preference
    { name: 'AlphaVantageService', class: AlphaVantageService },
    { name: 'CensusService', class: CensusService },
    { name: 'FredService', class: FredService },
    { name: 'WorldBankService', class: WorldBankService },
    { name: 'BlsService', class: BlsService },
    { name: 'NasdaqDataService', class: NasdaqDataService },
    { name: 'OecdService', class: OecdService },
    { name: 'ImfService', class: ImfService },
  ];

  constructor() {
    this.persistenceService = new PersistenceService();
    this.cacheService = new CacheService(this.persistenceService);
    
    this.dataSourceServicesMap = {};
    this.serviceDefinitions.forEach(def => {
      // Services that might take an API key in constructor:
      // AlphaVantage, Census, Fred, Nasdaq, BLS (optional for BLS)
      // WorldBank, OECD, IMF generally don't.
      // Services currently get API keys from process.env internally if not passed.
      // This generic instantiation should be fine.
      this.dataSourceServicesMap[def.name] = new def.class(this.cacheService);
    });

    console.log("DataService initialized with all data source services:", Object.keys(this.dataSourceServicesMap));
  }

  // --- Existing methods (searchIndustries, getIndustryById) largely unchanged for now ---
  async searchIndustries(query: string, limit?: number): Promise<any[]> { // Added limit from market-tools
    console.log(`DataService: Searching industries for query "${query}"`);
    // Stays mock for now
    const results = Object.values(mockIndustryData).filter(ind =>
      ind.name.toLowerCase().includes(query.toLowerCase())
    );
    return Promise.resolve(limit ? results.slice(0, limit) : results);
  }

  async getIndustryById(id: string): Promise<any | null> {
    console.log(`DataService: Getting industry by ID "${id}"`);
    // Stays mock for now
    const industry = mockIndustryData[id as keyof typeof mockIndustryData] || null;
    if (industry) { // Add defaultRegion for compatibility with market-tools
        (industry as any).defaultRegion = 'US'; // Example default
        (industry as any).keyMetrics = {
            marketSize: (industry as any).marketSize,
            growthRate: 0.05, // Mock growth
            cagr: 0.04, // Mock cagr
            volatility: 0.1 // Mock volatility
        };
        (industry as any).source = 'mock';
        (industry as any).lastUpdated = new Date().toISOString();
        (industry as any).description = `Mock description for ${industry.name}.`;
        (industry as any).naicsCode = "541511"; // Example NAICS
        (industry as any).sicCode = "7371"; // Example SIC
    }
    return Promise.resolve(industry);
  }

  // --- Updated getMarketSize ---
  async getMarketSize(industryId: string, region: string, year?: number): Promise<any | null> {
    console.log(`DataService: getMarketSize for industry "${industryId}" in region "${region}"${year ? ` for year ${year}` : ''}`);

    // Attempt AlphaVantage if industryId looks like a stock symbol (e.g., IBM, AAPL)
    if (/^[A-Z]{1,5}$/.test(industryId)) {
      try {
        const avService = this.dataSourceServicesMap['AlphaVantageService'] as AlphaVantageService;
        if (avService && await avService.isAvailable()) {
          console.log(`Attempting to fetch from AlphaVantageService with symbol: ${industryId}`);
          const overview = await avService.fetchMarketSize(industryId, region);
          if (overview && overview.marketCapitalization) {
            return {
              value: overview.marketCapitalization,
              source: 'AlphaVantageService',
              details: overview,
            };
          }
        }
      } catch (error: any) {
        console.warn(`DataService: Error from AlphaVantageService for getMarketSize: ${error.message}`);
      }
    }

    // Attempt Census if industryId looks like a NAICS code (e.g., 23, 31-33, 4411)
    if (/^(\d{2}|\d{2}-\d{2}|\d{3,6})$/.test(industryId)) {
      try {
        const censusService = this.dataSourceServicesMap['CensusService'] as CensusService;
        if (censusService && await censusService.isAvailable()) {
          console.log(`Attempting to fetch from CensusService with NAICS: ${industryId}, region: ${region}`);
          const censusData = await censusService.fetchMarketSize(industryId, region, "EMP");
          if (censusData && censusData.value !== null && censusData.value !== undefined) {
            return {
              value: censusData.value,
              source: 'CensusService',
              details: censusData,
            };
          }
        }
      } catch (error: any) {
        console.warn(`DataService: Error from CensusService for getMarketSize: ${error.message}`);
      }
    }

    try {
        const fredService = this.dataSourceServicesMap['FredService'] as FredService;
        if (fredService && await fredService.isAvailable()) {
            console.log(`Attempting to fetch from FredService with seriesId: ${industryId}`);
            const fredDataArray = await fredService.fetchMarketSize(industryId, region); // region might be used by specific series logic
            if (fredDataArray && fredDataArray.length > 0 && fredDataArray[0].value !== null) {
                return {
                    value: fredDataArray[0].value,
                    source: 'FredService',
                    details: fredDataArray[0],
                };
            }
        }
    } catch (error: any) {
        console.warn(`DataService: Error from FredService for getMarketSize: ${error.message}`);
    }

    try {
        const wbService = this.dataSourceServicesMap['WorldBankService'] as WorldBankService;
        if (wbService && await wbService.isAvailable()) {
            // Use industryId as indicator if it's not a generic term like "GDP", otherwise default indicator is used by service
            const indicator = (industryId && industryId.toUpperCase() !== 'GDP') ? industryId : undefined;
            console.log(`Attempting to fetch from WorldBankService with countryCode: ${region}, indicator: ${indicator || 'default GDP'}`);
            const wbDataArray = await wbService.fetchMarketSize(region, indicator);
            if (wbDataArray && wbDataArray.length > 0 && wbDataArray[0].value !== null) {
                return {
                    value: wbDataArray[0].value,
                    source: 'WorldBankService',
                    details: wbDataArray[0],
                };
            }
        }
    } catch (error: any) {
        console.warn(`DataService: Error from WorldBankService for getMarketSize: ${error.message}`);
    }

    console.warn(`DataService: No real data source provided market size for industry "${industryId}" in region "${region}". Falling back to mock.`);
    const mockKey = industryId as keyof typeof mockIndustryData;
    if (mockIndustryData[mockKey]) { // Basic fallback, region matching could be added
      return Promise.resolve({
          value: mockIndustryData[mockKey].marketSize,
          source: 'mock',
          details: { ...mockIndustryData[mockKey], year: new Date().getFullYear(), region: region, methodology: "Mock data based on industry ID" }
      });
    }

    console.error(`DataService: No data found for industry "${industryId}" in region "${region}" from any source.`);
    return null;
  }

  // --- New method for specific data source access ---
  async getSpecificDataSourceData(sourceName: string, methodName: string, params: any[]): Promise<any | null> {
    console.log(`DataService: getSpecificDataSourceData for source "${sourceName}", method "${methodName}" with params:`, params);
    const service = this.dataSourceServicesMap[sourceName];

    if (!service) {
      console.error(`DataService: Source "${sourceName}" not found.`);
      throw new Error(`Data source "${sourceName}" not found.`);
    }

    if (typeof (service as any)[methodName] !== 'function') {
      console.error(`DataService: Method "${methodName}" not found on source "${sourceName}".`);
      throw new Error(`Method "${methodName}" not found on source "${sourceName}".`);
    }

    try {
      if (await service.isAvailable()) {
        const result = await (service as any)[methodName](...params);
        return result;
      } else {
        console.warn(`DataService: Source "${sourceName}" is not available (e.g., missing API key).`);
        return null;
      }
    } catch (error: any) {
      console.error(`DataService: Error calling method "${methodName}" on source "${sourceName}": ${error.message}`);
      throw error;
    }
  }

  async generateMarketForecast(industryId: string, years?: number, region?: string): Promise<any[] | null> {
    console.log(`DataService: Generating market forecast for industry "${industryId}" in region "${region}" for ${years} years.`);
    const forecast = mockMarketForecast[industryId as keyof typeof mockMarketForecast] || null;
    return Promise.resolve(forecast ? (years ? forecast.slice(0, years) : forecast) : null);
  }

  async getSupportedCurrencies(): Promise<string[]> {
    return ['USD', 'EUR', 'JPY', 'GBP', 'CAD', 'AUD'];
  }

  async getMarketOpportunities(industryId: string, region: string, minMarketSize?: number): Promise<any> {
    console.log(`DataService: Getting market opportunities for ${industryId} in ${region}`);
    // Return a structure that matches market-tools expectation (an object with an 'opportunities' array)
    return {
      industry: industryId,
      region: region,
      opportunities: [
          { id: 'opp1', title: "Untapped rural areas", description: "Description for untapped rural areas", marketSize: (minMarketSize || 1000000) * 1.5, competitiveIntensity: 'low', barrierToEntry: 'medium', growthPotential: 0.15, timeToMarket: '12m', riskFactors: ["Logistics"], requirements: ["Local partnerships"] },
          { id: 'opp2', title: "Integration with emerging tech X", description: "Description for tech X", marketSize: (minMarketSize || 1000000) * 2.0, competitiveIntensity: 'medium', barrierToEntry: 'high', growthPotential: 0.25, timeToMarket: '18m', riskFactors: ["R&D Cost"], requirements: ["Skilled engineers"] }
      ],
      source: "mock"
    };
  }

  async calculateTam(industryId: string, region: string, _customerSegments?: any[]): Promise<number | null> {
    const marketSizeData = await this.getMarketSize(industryId, region);
    if (marketSizeData && marketSizeData.value !== null && marketSizeData.value !== undefined) {
      console.log(`DataService: Calculating TAM based on market size ${marketSizeData.value} from ${marketSizeData.source}`);
      return marketSizeData.value;
    }
    return null;
  }

  async calculateSam(industryId: string, region: string, _targetSegmentCriteria?: any): Promise<number | null> {
    const tam = await this.calculateTam(industryId, region, []);
    if (tam !== null) {
      const samPercentage = 0.5;
      console.log(`DataService: Calculating SAM as ${samPercentage*100}% of TAM ${tam}`);
      return tam * samPercentage;
    }
    return null;
  }

  async compareMarkets(marketA_industryId: string, marketA_region: string, marketB_industryId: string, marketB_region: string): Promise<any> {
    console.log(`DataService: Comparing markets A(${marketA_industryId}/${marketA_region}) and B(${marketB_industryId}/${marketB_region})`);
    const marketAData = await this.getMarketSize(marketA_industryId, marketA_region);
    const marketBData = await this.getMarketSize(marketB_industryId, marketB_region);
    return { marketA: marketAData, marketB: marketBData, source: "DataService (aggregation)" };
  }

  async validateMarketData(dataToValidate: any, referenceIndustryId: string, referenceRegion: string): Promise<any> {
     console.log(`DataService: Validating data against ${referenceIndustryId}/${referenceRegion}`);
     const referenceData = await this.getMarketSize(referenceIndustryId, referenceRegion);
     let isValid = false;
     let variance = null;
     if (referenceData && referenceData.value !== null && referenceData.value !== undefined && dataToValidate && dataToValidate.value !== null && dataToValidate.value !== undefined) {
         variance = Math.abs(dataToValidate.value - referenceData.value) / referenceData.value;
         isValid = variance < 0.2;
     }
    return { isValid, variance, providedData: dataToValidate, referenceData, source: "DataService (validation)" };
  }

  async forecastMarket(industryId: string, region: string, years: number): Promise<any[] | null> {
    console.log(`DataService: Forecasting market for ${industryId} in ${region} for ${years} years`);
    const baseForecast = await this.generateMarketForecast(industryId, years, region);
    return baseForecast;
  }

  async getMarketSegments(industryId: string, region: string): Promise<any[] | null> {
    console.log(`DataService: Getting market segments for ${industryId} in ${region}`);
    if (industryId === 'tech-software' || industryId === 'tech-ai') {
        const marketSizeData = await this.getMarketSize(industryId, region);
        const totalMarketSize = marketSizeData?.value || 1_000_000_000; // Fallback for segment value calculation
        return [
            { segmentName: "Enterprise", percentage: 0.45, value: totalMarketSize * 0.45, growthRate: 0.05, description: "Large businesses" },
            { segmentName: "SMB", percentage: 0.35, value: totalMarketSize * 0.35, growthRate: 0.07, description: "Small to Medium businesses" },
            { segmentName: "Consumer", percentage: 0.20, value: totalMarketSize * 0.20, growthRate: 0.03, description: "Individual users" }
        ];
    }
    return null;
  }
}
