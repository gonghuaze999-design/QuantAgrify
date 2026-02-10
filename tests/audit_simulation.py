
import numpy as np
import pandas as pd
import math

# --- 1. SIMULATION GENERATOR (Replicating CustomUpload.tsx logic) ---
def generate_sim_data():
    dates = pd.date_range(start="2023-01-01", end="2023-12-31")
    price = 2600.0
    vol = 300000
    oi = 800000
    
    data = []
    
    for d in dates:
        month = d.month
        
        # Seasonality Logic (The "Script")
        trend = 0
        noise = (np.random.random() - 0.5) * 15
        
        if month < 4: trend = (np.random.random() - 0.45) * 2
        elif month < 6: trend = (np.random.random() - 0.4) * 5 # Planting
        elif month < 8: # Drought Season (Pump)
            if month == 7: trend = (np.random.random() + 0.2) * 10
            else: trend = (np.random.random() - 0.2) * 8
            noise = (np.random.random() - 0.5) * 40 # High Vol
        elif month < 10: trend = (np.random.random() - 0.8) * 6 # Harvest Dump
        else: trend = (np.random.random() - 0.4) * 3
        
        price = max(2000, price + trend + noise)
        
        # Simulating Rollover Drop in OI
        if month in [5, 9] and d.day > 10 and d.day < 20:
            current_oi = oi * 0.1 # Gap in OI during rollover
        else:
            current_oi = oi
            
        data.append({
            "date": d,
            "close": price,
            "volume": vol * (1 + np.random.random()),
            "open_interest": current_oi
        })
        
    return pd.DataFrame(data)

# --- 2. PLATFORM LOGIC REPLICATION (The "QuantMath" Object) ---

def platform_rsi_logic(prices, window=14):
    """
    Replicates the logic found in FeatureEngineering.tsx
    Uses Simple Moving Average (SMA) instead of Wilder's.
    """
    deltas = prices.diff()
    gain = deltas.clip(lower=0)
    loss = -1 * deltas.clip(upper=0)
    
    # Platform uses QuantMath.mean (Rolling Mean)
    avg_gain = gain.rolling(window=window).mean()
    avg_loss = loss.rolling(window=window).mean()
    
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    return rsi.fillna(50) # Platform handles nulls gracefully

def standard_rsi_logic(prices, window=14):
    """
    Standard Industry RSI (Wilder's Smoothing).
    """
    deltas = prices.diff()
    gain = deltas.clip(lower=0)
    loss = -1 * deltas.clip(upper=0)
    
    # Use ewm (Exponential Weighted Function) for Wilder's approximation
    alpha = 1/window
    avg_gain = gain.ewm(alpha=alpha, adjust=False).mean()
    avg_loss = loss.ewm(alpha=alpha, adjust=False).mean()
    
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

# --- 3. AUDIT EXECUTION ---

def run_audit():
    print("--- STARTING QUANTAGRIFY LOGIC AUDIT ---")
    df = generate_sim_data()
    print(f"Generated {len(df)} bars of simulated DCE Corn data.")
    
    # 1. Test Price Spike (Drought)
    max_price = df['close'].max()
    max_price_date = df.loc[df['close'].idxmax(), 'date']
    print(f"\n[Scenario Check] Peak Drought Price: {max_price:.2f} on {max_price_date.strftime('%Y-%m-%d')}")
    if max_price > 2800 and 6 <= max_price_date.month <= 8:
        print("✅ PASS: Simulation successfully generated Q3 drought spike.")
    else:
        print("❌ FAIL: Simulation logic did not produce expected drought scenario.")

    # 2. RSI Logic Comparison
    df['platform_rsi'] = platform_rsi_logic(df['close'])
    df['standard_rsi'] = standard_rsi_logic(df['close'])
    
    rsi_diff = (df['platform_rsi'] - df['standard_rsi']).abs().mean()
    max_rsi_diff = (df['platform_rsi'] - df['standard_rsi']).abs().max()
    
    print(f"\n[Logic Audit] RSI Calculation")
    print(f"   Avg Difference (Platform vs Standard): {rsi_diff:.2f}")
    print(f"   Max Difference: {max_rsi_diff:.2f}")
    
    if max_rsi_diff > 5:
        print("⚠️ WARNING: Significant deviation in RSI calculation detected.")
        print("   Cause: Platform uses Simple Moving Average (SMA) instead of Wilder's Smoothing.")
        print("   Impact: Platform signals are 'noisier' and may trigger false positives.")
    else:
        print("✅ PASS: RSI Logic is within acceptable tolerance.")

    # 3. Liquidity Pressure Edge Case
    df['liq_pressure'] = df['volume'] / df['open_interest']
    max_lp = df['liq_pressure'].max()
    
    print(f"\n[Logic Audit] Liquidity Pressure (Vol/OI)")
    print(f"   Max LP Score: {max_lp:.2f}")
    
    if max_lp > 50: # Threshold for "Normal"
        print("⚠️ WARNING: Extreme outlier detected in Liquidity Pressure.")
        print("   Cause: Rollover periods have low Open Interest, causing division by near-zero.")
        print("   Recommendation: Add logic to filter or cap LP when OI < Threshold.")
    else:
        print("✅ PASS: Liquidity metrics stable.")

if __name__ == "__main__":
    run_audit()
