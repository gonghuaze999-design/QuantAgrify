
import numpy as np
import pandas as pd
import math

# --- PART 1: THE SIMULATOR (GENERATING THE EXAM) ---

def generate_scenario(scenario_type):
    dates = pd.date_range(start="2023-01-01", end="2023-12-31", freq='B') # Business days
    n = len(dates)
    
    # Base Parameters
    price = 3000.0
    vol_base = 100000
    oi_base = 500000
    
    data = []
    
    # State Memory
    trend_factor = 0
    shock_active = False
    
    for i, d in enumerate(dates):
        month = d.month
        day_of_year = d.dayofyear
        
        # --- SCENARIO LOGIC ---
        
        if scenario_type == 'A_BULL_SHOCK': 
            # Context: Soybean Meal Drought (Summer Spike)
            if 150 <= day_of_year <= 240: # June - Aug (Growing Season)
                shock_active = True
                trend_factor += 0.005 # Compounding daily gain (Exponential)
                noise = np.random.normal(0, 25) # High Volatility
                volume_mult = 2.5
            else:
                shock_active = False
                trend_factor = max(0, trend_factor - 0.002) # Cooling off
                noise = np.random.normal(0, 10)
                volume_mult = 1.0
                
        elif scenario_type == 'B_BEAR_HARVEST':
            # Context: Corn Harvest Pressure (Autumn Dump)
            if 270 <= day_of_year <= 330: # Oct - Nov (Harvest)
                trend_factor = -0.003 # Steady grind down
                noise = np.random.normal(0, 8) # Low Volatility (Bleed)
                volume_mult = 0.8
                # Panic selling at the very bottom
                if day_of_year > 320: volume_mult = 3.0 
            else:
                trend_factor = 0
                noise = np.random.normal(0, 10)
                volume_mult = 1.0
                
        elif scenario_type == 'C_ROLLOVER_GAP':
            # Context: Palm Oil Contract Switch (Gap Test)
            trend_factor = np.sin(i / 10) * 0.001 # Choppy
            noise = np.random.normal(0, 12)
            volume_mult = 1.0
            
            # THE GAP EVENT (May 15th)
            if d.month == 5 and d.day == 15:
                price += 200 # Huge 200 point gap up (Contango)
                volume_mult = 5.0 # Rollover volume
        
        # Apply Dynamics
        price = price * (1 + trend_factor) + noise
        current_vol = vol_base * volume_mult * (1 + np.random.random())
        current_oi = oi_base * (1.2 if shock_active else 0.9)
        
        # OHLC Construction
        daily_range = price * 0.02 if shock_active else price * 0.01
        close = price
        open_p = close + np.random.normal(0, daily_range/2)
        high = max(open_p, close) + abs(np.random.normal(0, daily_range/2))
        low = min(open_p, close) - abs(np.random.normal(0, daily_range/2))
        
        data.append({
            "date": d,
            "open": round(open_p, 2),
            "high": round(high, 2),
            "low": round(low, 2),
            "close": round(close, 2),
            "volume": int(current_vol),
            "open_interest": int(current_oi)
        })
        
    return pd.DataFrame(data)

# --- PART 2: THE DIGITAL TWIN (QUANTAGRIFY LOGIC REPLICATION) ---

class QuantAgrifyEngine:
    """
    Exact replica of the math used in FeatureEngineering.tsx and AlgorithmWorkflow.tsx
    Used to verify correctness.
    """
    
    @staticmethod
    def calc_rsi_wilder(prices, window=14):
        # Using Wilder's Smoothing (EMA-based) matching the upgrade
        delta = prices.diff()
        gain = delta.clip(lower=0)
        loss = -1 * delta.clip(upper=0)
        
        # Alpha for Wilder's EMA is 1/n
        alpha = 1 / window
        
        avg_gain = gain.ewm(alpha=alpha, adjust=False).mean()
        avg_loss = loss.ewm(alpha=alpha, adjust=False).mean()
        
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        return rsi.fillna(50)

    @staticmethod
    def detect_gaps_and_adjust(df, threshold_mult=4):
        # Replicating AlgorithmWorkflow.tsx logic
        prices = df['close'].values
        adjusted = np.copy(prices)
        gaps = []
        
        # 1. Calc Avg Volatility (Simple return diff)
        pct_changes = np.abs(np.diff(prices) / prices[:-1])
        avg_vol = np.mean(pct_changes)
        threshold = avg_vol * threshold_mult
        
        cumulative_gap = 0
        
        for i in range(1, len(prices)):
            curr = prices[i]
            prev = prices[i-1]
            pct_chg = (curr - prev) / prev
            
            if abs(pct_chg) > threshold:
                gap = curr - prev
                gaps.append((df.iloc[i]['date'], gap))
                cumulative_gap += gap
                
            # Back Adjustment Logic: Apply gap backwards
            # (In the script, we just track the gap existence for validation)
            
        return gaps

# --- PART 3: THE AUDIT (RUNNING THE TESTS) ---

def audit_scenario(name, df, expected_criteria):
    print(f"\n🔵 TESTING SCENARIO: {name}")
    print(f"   Data Range: {df['date'].min().date()} to {df['date'].max().date()}")
    
    # 1. Run Platform Math
    df['rsi'] = QuantAgrifyEngine.calc_rsi_wilder(df['close'])
    gaps = QuantAgrifyEngine.detect_gaps_and_adjust(df)
    
    # 2. Analyze Results
    max_price = df['close'].max()
    min_price = df['close'].min()
    max_rsi = df['rsi'].max()
    min_rsi = df['rsi'].min()
    volatility = df['close'].pct_change().std() * np.sqrt(252)
    
    print(f"   [Stats] Price Range: {min_price:.0f}-{max_price:.0f} | RSI Range: {min_rsi:.0f}-{max_rsi:.0f} | Vol: {volatility:.2%}")
    
    # 3. Validation Logic
    failures = []
    
    # Criteria Check: Trend Direction
    if expected_criteria['trend'] == 'BULL':
        if not (df.iloc[-1]['close'] > df.iloc[0]['close'] * 1.2): failures.append("Failed to generate Bull Trend")
    elif expected_criteria['trend'] == 'BEAR':
        if not (df.iloc[-1]['close'] < df.iloc[0]['close'] * 0.9): failures.append("Failed to generate Bear Trend")
        
    # Criteria Check: RSI Extremes
    if expected_criteria.get('check_overbought') and max_rsi < 75:
        failures.append("RSI did not hit Overbought (>75) in Bull Scenario (Sensitivity too low?)")
        
    # Criteria Check: Gap Detection
    if expected_criteria.get('expect_gap'):
        if len(gaps) == 0:
            failures.append("Algorithm failed to detect the Rollover Gap.")
        else:
            print(f"   ✅ Detected Gap of {gaps[0][1]:.2f} on {gaps[0][0].date()}")

    # Output Verdict
    if not failures:
        print("   🟢 RESULT: PASS (All behavioral patterns matched expectations)")
    else:
        print("   🔴 RESULT: FAIL")
        for f in failures:
            print(f"      - {f}")

def run_suite():
    print("="*60)
    print("QUANTAGRIFY ALGORITHM & DATA INTEGRITY TEST SUITE")
    print("="*60)
    
    # TEST 1: The Perfect Storm
    df_a = generate_scenario('A_BULL_SHOCK')
    audit_scenario("A: Soybean Meal Weather Shock", df_a, {
        'trend': 'BULL',
        'check_overbought': True
    })
    
    # TEST 2: Harvest Pressure
    df_b = generate_scenario('B_BEAR_HARVEST')
    audit_scenario("B: Corn Harvest Capitulation", df_b, {
        'trend': 'BEAR'
    })
    
    # TEST 3: Rollover Gap
    df_c = generate_scenario('C_ROLLOVER_GAP')
    audit_scenario("C: Palm Oil Rollover (Gap Adj.)", df_c, {
        'trend': 'NEUTRAL', # Overall flat
        'expect_gap': True
    })
    
    print("\n" + "="*60)
    print("END OF REPORT")

if __name__ == "__main__":
    run_suite()
