import * as process from 'process';
import { CacheService } from './cache/cacheService';
import { PersistenceService } from './cache/persistenceService';
import { DataSourceService } from '../types/dataSources';

// Import all data source services
import { WorldBankService } from './dataSources/worldBankService';
import { FredService } from './dataSources/fredService';
import { BlsService } from './dataSources/blsService';
import { CensusService } from './dataSources/censusService';
import { OecdService } from './dataSources/oecdService';
import { ImfService } from './dataSources/imfService';
import { AlphaVantageService } from './dataSources/alphaVantageService';
import { NasdaqDataService } from './dataSources/nasdaqDataService';

// Mock data (to be used as fallback or until all sources are integrated)
const mockIndustryData: Record<string, any> = {
  'tech-software': { id: 'tech-software', name: 'Software Technology', country: 'USA', marketSize: 659 * 1e9, year: 2023 },
  'tech-ai': { id: 'tech-ai', name: 'AI Technology', country: 'USA', marketSize: 328 * 1e9, year: 2023 },
};

const mockMarketForecast: Record<string, any[]> = {
  'tech-software': [{ year: 2024, value: 754 * 1e9 }, { year: 2025, value: 850 * 1e9 }],
  'tech-ai': [{ year: 2024, value: 422 * 1e9 }, { year: 2025, value: 510 * 1e9 }],
};

export class DataService {
  private persistenceService: PersistenceService;
  private cacheService: CacheService;
  private dataSourceServices: DataSourceService[];

  // Define a preferred order for data sources
  // Services earlier in the array will be tried first.
  private servicePreference: (new (cacheService: CacheService, apiKey?: string) => DataSourceService)[] = [
    FredService,        // US-centric, good for specific US data
    WorldBankService,   // Global, good for country-level GDP etc.
    // Add other services here in preferred order once they are more fully implemented
    BlsService,
    CensusService,
    OecdService,
    ImfService,
    AlphaVantageService,
    NasdaqDataService,
  ];


  constructor() {
    this.persistenceService = new PersistenceService(); // Uses default path
    this.cacheService = new CacheService(this.persistenceService);
    
    this.dataSourceServices = this.servicePreference.map(ServiceClass => {
        // Check if the constructor expects an API key argument explicitly
        // For simplicity, we assume services get their keys from process.env if not passed.
        // More sophisticated DI could be used here.
        // BlsService, CensusService, FredService, AlphaVantageService, NasdaqDataService expect optional apiKey.
        // WorldBank, OECD, IMF do not.
        // A more robust check would be `ServiceClass.prototype.constructor.length`
        // but ServiceClass here is the class itself. The `length` property of a class refers to
        // the number of parameters in its constructor.
        if (ServiceClass.length > 1) {
            // This heuristic might not be perfect. BlsService constructor has (cacheService, apiKey), length 2.
            // WorldBankService constructor has (cacheService), length 1.
            // This assumes that services requiring an API key will list it as a second param after cacheService.
            // Services like FredService, BlsService, etc., take (cacheService, apiKey?)
            // Services like WorldBankService, OecdService take (cacheService)
            // This will instantiate services like FredService with new FredService(this.cacheService, undefined)
            // which is fine as they then fallback to process.env.
            return new ServiceClass(this.cacheService);
        }
        return new ServiceClass(this.cacheService);
    }).filter(service => service !== null) as DataSourceService[];

    console.log("DataService initialized with data source services.");
  }

  async searchIndustries(query: string): Promise<any[]> {
    console.log(`DataService: Searching industries for query "${query}"`);
    // TODO: Implement with real data sources if applicable, or refine mock search
    const results = Object.values(mockIndustryData).filter(ind =>
      ind.name.toLowerCase().includes(query.toLowerCase())
    );
    return Promise.resolve(results);
  }

  async getIndustryById(id: string): Promise<any | null> {
    console.log(`DataService: Getting industry by ID "${id}"`);
    // TODO: Implement with real data sources
    const industry = mockIndustryData[id as keyof typeof mockIndustryData] || null;
    return Promise.resolve(industry);
  }

  async getMarketSize(industryId: string, region: string): Promise<any | null> {
    console.log(`DataService: getMarketSize for industry "${industryId}" in region "${region}"`);

    // Map industryId/region to parameters for data services
    // This is highly dependent on what industryId and region represent.
    // Example: if industryId is a FRED series (e.g. "GDP") and region is not used by that series.
    // Or if industryId is "generic" and region is a country code for World Bank.
    
    // Simplified approach:
    // For FRED, we might pass industryId as seriesId.
    // For WorldBank, we might pass region as countryCode and industryId as indicator (e.g., 'NY.GDP.MKTP.CD').

    for (const service of this.dataSourceServices) {
      try {
        if (await service.isAvailable()) {
          let data: any = null; // Use 'any' for data to accommodate different service return types
          if (service instanceof FredService) {
            // Assuming industryId can be a FRED series ID. Region might be ignored or used to pick a more specific series.
            // For now, let's assume industryId is the series ID.
            console.log(`Attempting to fetch from FredService with seriesId: ${industryId}`);
            data = await service.fetchMarketSize(industryId);
          } else if (service instanceof WorldBankService) {
            // Assuming region is a country code and industryId could be an indicator. Default to GDP.
            const indicator = industryId === 'GDP' || !industryId ? 'NY.GDP.MKTP.CD' : industryId;
            console.log(`Attempting to fetch from WorldBankService with countryCode: ${region}, indicator: ${indicator}`);
            data = await service.fetchMarketSize(region, indicator);
          }
          // Add more else if blocks for other services as they are implemented

          if (data) {
            console.log(`DataService: Data found via ${service.constructor.name}`);
            // Data format from services is an array of observations/points.
            // The original mock data returned a single value. We may need to adapt this.
            // For now, returning the raw data from the service (which is often an array).
            // If data is an array and we need a single "market size" value, we'd pick the latest.
            if (Array.isArray(data) && data.length > 0) {
                // Assuming the latest value is most relevant for "market size"
                // And assuming data is sorted with latest first or has a 'value' field.
                const latestDataPoint = data[0]; // Simplification
                return {
                    value: latestDataPoint.value,
                    source: service.constructor.name,
                    details: latestDataPoint
                };
            } else if (data && typeof data === 'object' && !Array.isArray(data)) { // If service returns a single object
                 return {
                    value: (data as any).value, // Or however the value is structured
                    source: service.constructor.name,
                    details: data
                };
            } else if (data) { // If data is some other type (e.g. primitive, though services return objects/arrays)
                 return {
                    value: data,
                    source: service.constructor.name,
                    details: { raw: data } // Wrap primitive in details
                 }
            }
          }
        }
      } catch (error: any) {
        console.warn(`DataService: Error from ${service.constructor.name} for getMarketSize: ${error.message}`);
      }
    }

    console.warn(`DataService: No real data source provided market size for industry "${industryId}" in region "${region}". Falling back to mock.`);
    const mockKey = industryId as keyof typeof mockIndustryData;
    if (mockIndustryData[mockKey] && mockIndustryData[mockKey].country.toUpperCase() === region.toUpperCase()) {
      return Promise.resolve({
          value: mockIndustryData[mockKey].marketSize,
          source: 'mock',
          details: mockIndustryData[mockKey]
      });
    }
    
    console.error(`DataService: No data found for industry "${industryId}" in region "${region}"`);
    return null;
  }

  async generateMarketForecast(industryId: string): Promise<any[] | null> {
    console.log(`DataService: Generating market forecast for industry "${industryId}"`);
    // TODO: Implement with real data sources
    const forecast = mockMarketForecast[industryId as keyof typeof mockMarketForecast] || null;
    return Promise.resolve(forecast);
  }

  async getSupportedCurrencies(): Promise<string[]> {
    // For now, returning a mock list. This could be fetched from IMF or other sources later.
    return ['USD', 'EUR', 'JPY', 'GBP', 'CAD', 'AUD'];
  }

  async getMarketOpportunities(industryId: string, region: string): Promise<any> {
    // TODO: Implement with real data sources
    console.log(`DataService: Getting market opportunities for ${industryId} in ${region}`);
    return {
      industry: industryId,
      region: region,
      opportunities: ["Untapped rural areas", "Integration with emerging tech X"],
      source: "mock"
    };
  }

  async calculateTam(industryId: string, region: string, customerSegments?: any[]): Promise<number | null> {
    // Example: TAM might be based on total market size
    const marketSizeData = await this.getMarketSize(industryId, region);
    if (marketSizeData && marketSizeData.value) {
      // Simplified: TAM equals total market size. Real TAM needs more segmentation.
      console.log(`DataService: Calculating TAM based on market size ${marketSizeData.value}`);
      return marketSizeData.value;
    }
    return null;
  }

  async calculateSam(industryId: string, region: string, targetSegmentCriteria?: any): Promise<number | null> {
    // Example: SAM might be a percentage of TAM
    const tam = await this.calculateTam(industryId, region, []); // Simplified customer segments
    if (tam) {
      // Simplified: SAM is 50% of TAM. Real SAM needs specific segment analysis.
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
     // Simple validation: check if dataToValidate.value is close to referenceData.value
     let isValid = false;
     let variance = null;
     if (referenceData && referenceData.value && dataToValidate && dataToValidate.value) {
         variance = Math.abs(dataToValidate.value - referenceData.value) / referenceData.value;
         isValid = variance < 0.2; // e.g., valid if within 20%
     }
    return { isValid, variance, providedData: dataToValidate, referenceData, source: "DataService (validation)" };
  }

  async forecastMarket(industryId: string, region: string, years: number): Promise<any[] | null> {
    console.log(`DataService: Forecasting market for ${industryId} in ${region} for ${years} years`);
    // This would ideally use a forecasting model or a data source that provides forecasts.
    // For now, leveraging generateMarketForecast mock.
    const baseForecast = await this.generateMarketForecast(industryId);
    if (baseForecast) {
        return baseForecast.slice(0, years);
    }
    return null;
  }

  async getMarketSegments(industryId: string, region: string): Promise<any[] | null> {
    console.log(`DataService: Getting market segments for ${industryId} in ${region}`);
    // Mock implementation
    if (industryId === 'tech-software' || industryId === 'tech-ai') {
        return [
            { segmentName: "Enterprise", percentage: 45, value: null }, // Value could be calculated if total market size is known
            { segmentName: "SMB", percentage: 35, value: null },
            { segmentName: "Consumer", percentage: 20, value: null }
        ];
    }
    return null;
  }
}
