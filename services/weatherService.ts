import { Factor } from '../types';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';

/**
 * Open-Meteo Weather API Service
 * 提供全球气象数据（实时预测与历史存档）
 */
export const weatherService = {
  /**
   * 获取特定坐标的天气数据
   * @param lat 纬度
   * @param lon 经度
   * @param date 可选日期 (YYYY-MM-DD)，如果不传则获取实时预测
   */
  async getWeatherData(lat: number, lon: number, date?: string) {
    const isHistorical = date && new Date(date) < new Date(new Date().setDate(new Date().getDate() - 1));
    const baseUrl = isHistorical ? ARCHIVE_URL : FORECAST_URL;
    
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      hourly: 'temperature_2m,precipitation,soil_moisture_0_to_7cm',
      timezone: 'auto'
    });

    if (isHistorical && date) {
      params.append('start_date', date);
      params.append('end_date', date);
    }

    try {
      const response = await fetch(`${baseUrl}?${params.toString()}`);
      if (!response.ok) throw new Error('Weather API request failed');
      return await response.json();
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return null;
    }
  },

  /**
   * 将天气数据转换为平台 Factor 格式
   */
  mapToFactor(weatherData: any, locationName: string): Factor {
    if (!weatherData) {
        return {
            id: `weather-error-${locationName}`,
            name: `Weather Data Unavailable - ${locationName}`,
            category: 'Weather',
            description: `Failed to fetch weather data for ${locationName}`,
            lastUpdated: new Date().toISOString(),
            correlationToTarget: 0
        };
    }
    return {
      id: `weather-${locationName}-${Date.now()}`,
      name: `Soil Moisture - ${locationName}`,
      category: 'Weather',
      description: `Real-time soil moisture data for ${locationName}`,
      lastUpdated: new Date().toISOString(),
      correlationToTarget: 0.72
    };
  }
};
