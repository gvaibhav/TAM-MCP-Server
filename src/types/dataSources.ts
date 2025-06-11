import { CacheStatus } from './cache.js';

export interface DataSourceService {
  fetchIndustryData(...args: any[]): Promise<any>;
  fetchMarketSize(industryId: string, region?: string): Promise<any>;
  isAvailable(): Promise<boolean>;
  getDataFreshness(...args: any[]): Promise<Date | null> | Date;
  getCacheStatus(): CacheStatus;
}
