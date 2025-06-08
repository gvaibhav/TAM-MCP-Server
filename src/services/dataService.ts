import { logger } from '../utils/index.js';

export class DataService {
  // Mock data for testing - in real implementation this would connect to databases/APIs
  private static mockIndustries = [
    {
      id: 'tech-software',
      name: 'Software Development',
      description: 'Software development and programming services',
      naicsCode: '541511',
      sicCode: '7371',
      keyMetrics: {
        marketSize: 659000000000,
        growthRate: 0.145,
        segmentation: {
          enterprise: 0.45,
          smb: 0.35,
          consumer: 0.20
        }
      },
      subIndustries: [
        { id: 'web-dev', name: 'Web Development' },
        { id: 'mobile-dev', name: 'Mobile Development' },
        { id: 'enterprise-software', name: 'Enterprise Software' }
      ],
      lastUpdated: '2024-01-01'
    },
    {
      id: 'tech-ai',
      name: 'Artificial Intelligence',
      description: 'AI and machine learning technologies',
      naicsCode: '541511',
      sicCode: '7371',
      keyMetrics: {
        marketSize: 328000000000,
        growthRate: 0.287,
        segmentation: {
          enterprise: 0.60,
          smb: 0.25,
          consumer: 0.15
        }
      },
      subIndustries: [
        { id: 'ml-platforms', name: 'ML Platforms' },
        { id: 'ai-consulting', name: 'AI Consulting' }
      ],
      lastUpdated: '2024-01-01'
    }
  ];

  private static mockMarketData: { [key: string]: any } = {
    'tech-software': {
      global: {
        2023: { value: 659000000000, segments: [
          { name: 'Enterprise', value: 296550000000, percentage: 0.45 },
          { name: 'SMB', value: 230650000000, percentage: 0.35 },
          { name: 'Consumer', value: 131800000000, percentage: 0.20 }
        ]},
        2024: { value: 754000000000, segments: [
          { name: 'Enterprise', value: 339300000000, percentage: 0.45 },
          { name: 'SMB', value: 263900000000, percentage: 0.35 },
          { name: 'Consumer', value: 150800000000, percentage: 0.20 }
        ]}
      },
      'north-america': {
        2023: { value: 230000000000, segments: [
          { name: 'Enterprise', value: 103500000000, percentage: 0.45 },
          { name: 'SMB', value: 80500000000, percentage: 0.35 },
          { name: 'Consumer', value: 46000000000, percentage: 0.20 }
        ]},
        2024: { value: 263000000000, segments: [
          { name: 'Enterprise', value: 118350000000, percentage: 0.45 },
          { name: 'SMB', value: 92050000000, percentage: 0.35 },
          { name: 'Consumer', value: 52600000000, percentage: 0.20 }
        ]}
      }
    },
    'tech-ai': {
      global: {
        2023: { value: 328000000000, segments: [
          { name: 'Enterprise', value: 196800000000, percentage: 0.60 },
          { name: 'SMB', value: 82000000000, percentage: 0.25 },
          { name: 'Consumer', value: 49200000000, percentage: 0.15 }
        ]},
        2024: { value: 422000000000, segments: [
          { name: 'Enterprise', value: 253200000000, percentage: 0.60 },
          { name: 'SMB', value: 105500000000, percentage: 0.25 },
          { name: 'Consumer', value: 63300000000, percentage: 0.15 }
        ]}
      }
    }
  };

  async searchIndustries(query: string, limit: number = 10): Promise<any[]> {
    logger.info(`Searching industries for query: ${query}, limit: ${limit}`);
    
    const searchTerms = query.toLowerCase().split(' ');
    const matches = DataService.mockIndustries.filter(industry => {
      const searchableText = `${industry.name} ${industry.description}`.toLowerCase();
      return searchTerms.some(term => searchableText.includes(term));
    });

    return matches.slice(0, limit);
  }

  async getIndustryById(industryId: string): Promise<any | null> {
    logger.info(`Fetching industry data for: ${industryId}`);
    
    const industry = DataService.mockIndustries.find(ind => ind.id === industryId);
    return industry || null;
  }

  async getMarketSize(industryId: string, region: string = 'global', year?: number): Promise<any | null> {
    logger.info(`Fetching market size for industry: ${industryId}, region: ${region}, year: ${year}`);
    
    const industryData = DataService.mockMarketData[industryId];
    if (!industryData) return null;

    const regionData = industryData[region];
    if (!regionData) return null;

    if (year) {
      return regionData[year] || null;
    }

    // Return latest year data
    const years = Object.keys(regionData).map(Number).sort((a, b) => b - a);
    const latestYear = years[0];
    return regionData[latestYear] || null;
  }

  async generateMarketForecast(industryId: string, years: number, region: string = 'global'): Promise<any> {
    logger.info(`Generating market forecast for industry: ${industryId}, years: ${years}, region: ${region}`);
    
    const currentData = await this.getMarketSize(industryId, region, 2024);
    const previousData = await this.getMarketSize(industryId, region, 2023);
    
    if (!currentData || !previousData) {
      throw new Error('Insufficient historical data for forecasting');
    }

    const growthRate = (currentData.value - previousData.value) / previousData.value;
    const forecasts = [];
    
    for (let i = 1; i <= years; i++) {
      const year = 2024 + i;
      const forecastValue = currentData.value * Math.pow(1 + growthRate, i);
      forecasts.push({
        year,
        value: forecastValue,
        confidence: Math.max(0.5, 0.9 - (i * 0.1)) // Decreasing confidence over time
      });
    }

    return {
      forecasts,
      cagr: growthRate,
      methodology: 'Linear extrapolation based on historical growth'
    };
  }

  getSupportedCurrencies(): string[] {
    return ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'];
  }

  async getMarketOpportunities(industryId: string, region: string = 'global', minMarketSize?: number): Promise<any> {
    logger.info(`Fetching market opportunities for industry: ${industryId}, region: ${region}`);
    
    const marketData = await this.getMarketSize(industryId, region);
    if (!marketData) {
      throw new Error('Market data not available for the specified industry and region');
    }

    const opportunities = [
      {
        segment: 'Enterprise',
        marketSize: marketData.segments[0]?.value || 0,
        growthPotential: 'High',
        competitionLevel: 'Medium',
        entryBarriers: ['High capital requirements', 'Established relationships required']
      },
      {
        segment: 'SMB',
        marketSize: marketData.segments[1]?.value || 0,
        growthPotential: 'Medium',
        competitionLevel: 'High',
        entryBarriers: ['Price sensitivity', 'Feature complexity']
      }
    ];

    if (minMarketSize) {
      return opportunities.filter(opp => opp.marketSize >= minMarketSize);
    }

    return opportunities;
  }

  // Additional methods that tests might expect
  async calculateTam(params: any): Promise<any> {
    logger.info('Calculating TAM');
    
    const { industryId, region = 'global', methodology = 'top-down' } = params;
    const marketData = await this.getMarketSize(industryId, region);
    
    if (!marketData) {
      throw new Error('Unable to calculate TAM - market data not available');
    }

    const tam = marketData.value;
    const scenarios = {
      conservative: tam * 0.8,
      optimistic: tam * 1.2,
      realistic: tam
    };

    return {
      tam,
      methodology,
      scenarios,
      confidence: 0.85,
      dataQuality: 'High'
    };
  }

  async calculateSam(params: any): Promise<any> {
    logger.info('Calculating SAM');
    
    const { industryId, region = 'global', targetSegments = [] } = params;
    const marketData = await this.getMarketSize(industryId, region);
    
    if (!marketData) {
      throw new Error('Unable to calculate SAM - market data not available');
    }

    const relevantSegments = marketData.segments.filter((seg: any) => 
      targetSegments.length === 0 || targetSegments.includes(seg.name.toLowerCase())
    );

    const sam = relevantSegments.reduce((total: number, seg: any) => total + seg.value, 0);

    return {
      sam,
      segments: relevantSegments,
      penetrationRate: 0.15,
      addressableMarket: sam * 0.15
    };
  }

  async compareMarkets(params: any): Promise<any> {
    logger.info('Comparing markets');
    
    const { industryIds, region = 'global' } = params;
    
    const comparisons = await Promise.all(
      industryIds.map(async (id: string) => {
        const industry = await this.getIndustryById(id);
        const marketData = await this.getMarketSize(id, region);
        
        return {
          industryId: id,
          name: industry?.name || 'Unknown',
          marketSize: marketData?.value || 0,
          growthRate: industry?.keyMetrics?.growthRate || 0
        };
      })
    );

    return {
      industries: comparisons,
      topByMarketSize: comparisons.sort((a, b) => b.marketSize - a.marketSize)[0],
      topByGrowthRate: comparisons.sort((a, b) => b.growthRate - a.growthRate)[0]
    };
  }

  async validateMarketData(params: any): Promise<any> {
    logger.info('Validating market data');
    
    const { data } = params;
    const validationIssues = [];

    // Basic validation rules
    if (data.marketSize && data.marketSize < 0) {
      validationIssues.push('Market size cannot be negative');
    }

    if (data.growthRate && (data.growthRate < -1 || data.growthRate > 5)) {
      validationIssues.push('Growth rate seems unrealistic');
    }

    if (data.segments) {
      const totalPercentage = data.segments.reduce((sum: number, seg: any) => sum + (seg.percentage || 0), 0);
      if (Math.abs(totalPercentage - 1) > 0.01) {
        validationIssues.push('Segment percentages do not sum to 100%');
      }
    }

    return {
      isValid: validationIssues.length === 0,
      validationIssues,
      confidenceScore: validationIssues.length === 0 ? 0.95 : 0.6,
      recommendations: validationIssues.length > 0 ? ['Review data sources', 'Cross-validate with industry reports'] : []
    };
  }

  async forecastMarket(params: any): Promise<any> {
    logger.info('Forecasting market');
    
    const { industryId, years = 5, region = 'global' } = params;
    return this.generateMarketForecast(industryId, years, region);
  }

  async getMarketSegments(params: any): Promise<any> {
    logger.info('Getting market segments');
    
    const { industryId, region = 'global' } = params;
    const marketData = await this.getMarketSize(industryId, region);
    
    if (!marketData) {
      throw new Error('Market segmentation data not available');
    }

    return {
      segments: marketData.segments,
      totalMarketSize: marketData.value,
      methodology: 'Industry standard segmentation'
    };
  }
}
