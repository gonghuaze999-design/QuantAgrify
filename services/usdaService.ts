import { Factor } from '../types';

const USDA_API_KEY = '9F34147B-E779-3D48-808C-BC58120DD01C';
const BASE_URL = 'https://quickstats.nass.usda.gov/api/api_GET/';

/**
 * USDA QuickStats API Service
 * 用于获取美国农业统计数据（产量、种植面积等）
 */
export const usdaService = {
  /**
   * 获取特定作物的统计数据
   * @param commodity 作物名称 (CORN, SOYBEANS, WHEAT)
   * @param year 年份
   */
  async getCommodityData(commodity: 'CORN' | 'SOYBEANS' | 'WHEAT', year: number) {
    const params = new URLSearchParams({
      key: USDA_API_KEY,
      commodity_desc: commodity,
      year: year.toString(),
      agg_level_desc: 'NATIONAL',
      format: 'JSON'
    });

    try {
      const response = await fetch(`${BASE_URL}?${params.toString()}`);
      if (!response.ok) throw new Error('USDA API request failed');
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching USDA data:', error);
      return null;
    }
  },

  /**
   * 将 USDA 数据转换为平台 Factor 格式
   */
  mapToFactor(usdaData: any[]): Factor[] {
    if (!usdaData) return [];
    return usdaData.map(item => ({
      id: `usda-${item.statisticcat_desc}-${item.year}`,
      name: `${item.commodity_desc} ${item.statisticcat_desc}`,
      category: 'SupplyDemand',
      description: `${item.short_desc} in ${item.year}`,
      lastUpdated: new Date().toISOString(),
      correlationToTarget: 0.85 // 示例值
    }));
  }
};
