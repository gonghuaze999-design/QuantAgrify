
# -*- coding: utf-8 -*-
"""
Open-Meteo Connectivity Diagnostic Tool
---------------------------------------
Target: Xinjiang Aksu (Cotton Hub)
Range:  2020-01-01 to 2024-12-31
Metrics: Comprehensive Agronomic Indicators
"""

import requests
import pandas as pd
import time
from datetime import datetime

def test_connection():
    # 1. 配置参数
    LAT = 41.16  # 新疆阿克苏
    LON = 80.26
    START = "2020-01-01"
    END = "2024-12-31" # 历史归档数据通常延迟 1-2 周，截止到 24年底最稳妥
    
    # 农业核心指标
    VARIABLES = [
        "temperature_2m_max",           # 最高温 (热量累积)
        "temperature_2m_min",           # 最低温 (霜冻监测)
        "precipitation_sum",            # 降水 (水分)
        "rain_sum",                     # 液态降水
        "snowfall_sum",                 # 降雪 (冬储水)
        "shortwave_radiation_sum",      # 短波辐射 (光合作用关键)
        "et0_fao_evapotranspiration",   # 潜在蒸散量 (需水量计算)
        "soil_moisture_0_to_7cm_mean"   # 浅层土壤湿度 (播种条件)
    ]

    # 2. 构建请求 URL (Archive Endpoint)
    url = "https://archive-api.open-meteo.com/v1/archive"
    
    # 注意：requests 库会自动将列表转换为 `daily=var1&daily=var2` 格式
    params = {
        "latitude": LAT,
        "longitude": LON,
        "start_date": START,
        "end_date": END,
        "daily": VARIABLES, 
        "timezone": "Asia/Shanghai"
    }

    print("="*60)
    print("🌤️  Open-Meteo Connection Test")
    print(f"📍 Target: Xinjiang Aksu ({LAT}, {LON})")
    print(f"📅 Range:  {START} -> {END}")
    print(f"📊 Metrics: {len(VARIABLES)} variables requested")
    print("-" * 60)

    # 3. 发送请求
    try:
        print("🚀 Sending Request...")
        start_time = time.time()
        
        # 增加 timeout 防止死锁
        response = requests.get(url, params=params, timeout=20)
        
        elapsed = time.time() - start_time
        print(f"⏱️  Latency: {elapsed:.2f}s")
        print(f"📡 Status Code: {response.status_code}")
        print(f"🔗 Final URL: {response.url}") # 打印实际请求的 URL 用于调试

        # 4. 错误诊断
        if response.status_code != 200:
            print("\n❌ FAILED. Server Response:")
            print(response.text)
            return

        # 5. 数据解析
        data = response.json()
        
        if "daily" not in data:
            print("\n⚠️ WARNING: Response JSON structure missing 'daily' key.")
            print(data.keys())
            return

        daily_data = data["daily"]
        df = pd.DataFrame(daily_data)
        
        # 简单清洗
        if "time" in df.columns:
            df["time"] = pd.to_datetime(df["time"])
            df.set_index("time", inplace=True)

        print("\n✅ SUCCESS! Data Retrieved.")
        print("-" * 60)
        print(f"📦 Total Days Fetched: {len(df)}")
        print(f"💧 Total Precip (Sum): {df['precipitation_sum'].sum():.2f} mm")
        print(f"☀️ Avg Radiation:      {df['shortwave_radiation_sum'].mean():.2f} MJ/m²")
        print("-" * 60)
        
        print("\n📋 Data Sample (First 5 Rows):")
        print(df.head())
        
        print("\n📋 Data Sample (Last 5 Rows):")
        print(df.tail())

        # 保存到本地以便查看
        filename = "xinjiang_cotton_weather.csv"
        df.to_csv(filename)
        print(f"\n💾 Saved to: {filename}")

    except requests.exceptions.ConnectionError:
        print("\n❌ Network Error: Could not connect to archive-api.open-meteo.com.")
        print("   -> Check your internet connection or firewall.")
    except requests.exceptions.Timeout:
        print("\n❌ Timeout Error: Server took too long to respond (>20s).")
        print("   -> Try reducing the time range or number of metrics.")
    except Exception as e:
        print(f"\n❌ Unexpected Error: {str(e)}")

if __name__ == "__main__":
    test_connection()
