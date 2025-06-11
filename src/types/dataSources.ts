export interface DataSourceService {
  fetchIndustryData(industryId: string): Promise<any>;
  fetchMarketSize(industryId: string, region: string): Promise<any>;
  isAvailable(): Promise<boolean>;
  getDataFreshness(): Date;
  getCacheStatus(): CacheStatus;
}
