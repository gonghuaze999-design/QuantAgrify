
# -*- coding: utf-8 -*-
"""
QuantAgrify Titan Suite v7.1 (Elite Harvest Edition)
--------------------------------------------------
Goal: MJD Numerical Simulation & Elite Robot Custody (Risk Parity)
Author: QuantAgrify Architect
"""

import os
import sys
import time
import logging
import warnings
import json
import random
import numpy as np
import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from google.oauth2 import service_account
from google.cloud import bigquery
import google.generativeai as genai
from datetime import datetime, timedelta
from getpass import getpass
import requests
import markdown
from scipy import stats, optimize

# --- 0. CONFIGURATION ---

# AI
GEMINI_MODEL_NAME = 'models/gemini-2.5-flash' 

# Database
KEY_FILENAME = "service_account.json" 
DATASET_ID = "quant_database"
TABLE_ID = "futures_1min"

# Simulation Config (LONG TERM)
START_DATE = "2006-01-01"
END_DATE = "2024-12-30"
TRAIN_RATIO = 0.7  # 70% Modeling, 30% Managed Custody

# --- ASSET UNIVERSE (Optimized: Removed Low Quality WT9999) ---
ASSETS = {
    'A9999.XDCE':  {'name': 'Soybean No.1 (黄大豆1号)', 'sector': 'Oilseed', 'tick_size': 1.0, 'leverage': 10},
    'A8888.XDCE':  {'name': 'Soybean No.2 (黄大豆2号)', 'sector': 'Oilseed', 'tick_size': 1.0, 'leverage': 10},
    'AP9999.XZCE': {'name': 'Apple (苹果)',             'sector': 'Softs',   'tick_size': 1.0, 'leverage': 8},
    'ER9999.XZCE': {'name': 'Early Rice (早籼稻)',      'sector': 'Grain',   'tick_size': 1.0, 'leverage': 10},
}

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - [TITAN v7.1] - %(message)s')
logger = logging.getLogger("Titan")
warnings.filterwarnings("ignore")

class TitanElite:
    def __init__(self):
        self.bq_client = self._init_bq()
        self.model = None
        self.results = {}
        print("🚀 Titan v7.1 (Elite Harvest Edition) Initialized.")
        print(f"📅 Horizon: {START_DATE} to {END_DATE}")

    def _init_bq(self):
        possible_paths = [KEY_FILENAME, os.path.join("/content", KEY_FILENAME)]
        found_key_path = None
        for path in possible_paths:
            if os.path.exists(path):
                found_key_path = path
                break
        
        if not found_key_path:
            print(f"⚠️ Warning: '{KEY_FILENAME}' not found. Using Synthetic Data Mode.")
            return None

        try:
            creds = service_account.Credentials.from_service_account_file(found_key_path)
            client = bigquery.Client(credentials=creds, project=creds.project_id)
            print(f"✅ BigQuery Connected: {creds.project_id}")
            return client
        except Exception as e:
            print(f"❌ BigQuery Auth Failed: {e}")
            return None

    def setup_ai(self):
        print("\n🔐 初始化 AI (Gemini 2.5)...")
        try:
            api_key = getpass("👉 请输入您的 Gemini API Key: ")
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel(GEMINI_MODEL_NAME)
            print(f"✅ AI Analyst Online.")
        except Exception as e:
            print(f"❌ AI Init Failed: {e}")

    # --- 1. DATA LAYER ---

    def fetch_long_term_data(self, symbol):
        if not self.bq_client:
            # Synthetic 18 year data
            dates = pd.date_range(start=START_DATE, end=END_DATE, freq='D')
            df = pd.DataFrame(index=dates)
            base_price = 3000
            # Generate jumpy data for MJD testing
            returns = np.random.normal(0.0002, 0.01, len(dates))
            # Add random jumps
            jumps = np.random.poisson(0.05, len(dates)) * np.random.normal(0, 0.05, len(dates))
            price_path = base_price * np.exp(np.cumsum(returns + jumps))
            
            df['close'] = price_path
            df['volume'] = np.random.randint(1000, 500000, len(dates))
            df['high'] = df['close'] * 1.01
            df['low'] = df['close'] * 0.99
            df['open'] = df['close']
            return df

        print(f"   📡 [BQ] Fetching 1min History for {symbol}...")
        
        query = f"""
            SELECT 
                timestamp_field_0 as ts,
                close,
                volume,
                high,
                low,
                open
            FROM `{self.bq_client.project}.{DATASET_ID}.{TABLE_ID}`
            WHERE contract = '{symbol}' 
            AND timestamp_field_0 BETWEEN TIMESTAMP('{START_DATE}') AND TIMESTAMP('{END_DATE}')
            ORDER BY ts ASC
            LIMIT 300000 
        """
        try:
            df = self.bq_client.query(query).to_dataframe(create_bqstorage_client=False)
            if df.empty: return pd.DataFrame()
            df['ts'] = pd.to_datetime(df['ts'])
            df.set_index('ts', inplace=True)
            # Re-sample to 1H to speed up 18-year processing while keeping granularity
            df = df.resample('1H').agg({'open':'first', 'high':'max', 'low':'min', 'close':'last', 'volume':'sum'}).dropna()
            return df
        except Exception as e:
            print(f"   ❌ Query Error: {e}")
            return pd.DataFrame()

    # --- 2. ADVANCED NUMERICAL SIMULATION (Merton Jump Diffusion) ---

    def fit_merton_jump_diffusion(self, df):
        """
        Fits MJD Model: Returns have a normal component + Poisson jump component.
        Better for Ags than OU because Ags trend (inflation) and jump (weather).
        """
        if df.empty: return None

        returns = np.log(df['close'] / df['close'].shift(1)).dropna().values
        
        # 1. Basic Stats
        mu = np.mean(returns) * 252 # Annualized Drift
        sigma = np.std(returns) * np.sqrt(252) # Annualized Vol
        
        # 2. Jump Detection (Simplified Moments Method)
        # Assuming jumps are events > 3 std devs
        jump_threshold = 3 * np.std(returns)
        jumps = returns[np.abs(returns) > jump_threshold]
        
        lambda_j = len(jumps) / (len(returns) / 252) # Jumps per year
        mu_j = np.mean(jumps) if len(jumps) > 0 else 0
        sigma_j = np.std(jumps) if len(jumps) > 0 else 0
        
        return {
            "mu": mu,
            "sigma": sigma,
            "lambda": lambda_j,
            "jump_mean": mu_j,
            "jump_vol": sigma_j
        }

    def simulate_mjd_path(self, start_price, days, params):
        dt = 1/252
        prices = [start_price]
        current = start_price
        
        for _ in range(days):
            # Normal component
            z = np.random.normal(0, 1)
            # Jump component (Poisson)
            k = np.random.poisson(params['lambda'] * dt)
            jump_factor = 0
            if k > 0:
                jump_factor = np.sum(np.random.normal(params['jump_mean'], params['jump_vol'], k))
            
            # Geometric Brownian Motion + Jump
            # dS/S = (mu - lambda*k)dt + sigma*dZ + dJ
            drift = (params['mu'] - 0.5 * params['sigma']**2) * dt
            diffusion = params['sigma'] * np.sqrt(dt) * z
            
            ret = drift + diffusion + jump_factor
            current = current * np.exp(ret)
            prices.append(current)
            
        return prices

    def run_numerical_test(self, df):
        if df.empty: return None
        
        split_idx = int(len(df) * TRAIN_RATIO)
        train_df = df.iloc[:split_idx]
        test_df = df.iloc[split_idx:]
        
        if test_df.empty: return None
        
        # Fit on Train
        params = self.fit_merton_jump_diffusion(train_df)
        
        # Sim on Test duration
        sim_days = len(test_df) # Assuming daily steps for sim simplicity in report
        # Adjusting for resampling frequency if needed, but MJD fits annualized params
        # To compare curve shape, we generate a daily path of same length
        sim_path = self.simulate_mjd_path(test_df['close'].iloc[0], len(test_df), params)
        
        # Calculate deviation (Area between curves)
        # Normalize both to start at 100 for shape comparison
        real_norm = test_df['close'].values / test_df['close'].iloc[0] * 100
        sim_norm = np.array(sim_path[:-1]) / sim_path[0] * 100
        
        # Truncate to matching length
        min_len = min(len(real_norm), len(sim_norm))
        rmse = np.sqrt(np.mean((real_norm[:min_len] - sim_norm[:min_len])**2))
        
        return {
            "model": "Merton Jump Diffusion (MJD)",
            "params": params,
            "rmse_score": rmse,
            "sim_path_sample": sim_path[::max(1, len(sim_path)//50)]
        }

    # --- 3. ELITE ROBOT STRATEGIES ---

    def run_robot_custody(self, df, asset_meta):
        if df.empty: return None
        
        split_idx = int(len(df) * TRAIN_RATIO)
        # train_df = df.iloc[:split_idx] # Used for calibration if needed
        test_df = df.iloc[split_idx:].copy()
        
        capital = 1_000_000
        commission = 0.0001 # 1bps
        
        robots = {
            'Sentinel': {'cash': capital, 'pos': 0, 'equity': [], 'color': '#0d59f2'},
            'Vector':   {'cash': capital, 'pos': 0, 'equity': [], 'color': '#a855f7'},
            'Harvester':{'cash': capital, 'pos': 0, 'equity': [], 'color': '#ffb347'}
        }
        
        # Prepare Indicators
        closes = test_df['close'].values
        highs = test_df['high'].values
        lows = test_df['low'].values
        dates = test_df.index
        
        # 1. Sentinel (Basic): Adaptive Bollinger Bands
        # Revert to mean when price hits 2 std devs
        bb_period = 20
        bb_std = 2.0
        
        # 2. Vector (Pro): Dual-Thrust (Breakout)
        # Range = Max(HH-LC, HC-LL)
        dt_n = 4 # Lookback for range
        k1 = 0.7 # Trigger buy
        k2 = 0.7 # Trigger sell
        
        # 3. Harvester (Elite): Risk Parity Vol-Targeting Trend
        # Position Size = (Target Vol / Current Vol) * Equity
        target_vol = 0.15 # 15% Annualized Vol Target
        harvest_lookback = 60
        
        # Rolling State
        for i in range(50, len(closes)):
            price = closes[i]
            prev_close = closes[i-1]
            date = dates[i]
            
            # --- A. SENTINEL (Mean Reversion) ---
            # Calc BB
            history = closes[i-bb_period:i]
            sma = np.mean(history)
            std = np.std(history)
            upper = sma + bb_std * std
            lower = sma - bb_std * std
            
            s_pos = robots['Sentinel']['pos']
            s_cash = robots['Sentinel']['cash']
            s_val = s_cash + s_pos * price
            
            if price < lower and s_pos == 0:
                # Buy Limit (Conservative)
                qty = (s_val * 0.5) / price
                robots['Sentinel']['pos'] = qty
                robots['Sentinel']['cash'] -= qty * price * (1+commission)
            elif price > upper and s_pos > 0:
                # Sell
                robots['Sentinel']['cash'] += robots['Sentinel']['pos'] * price * (1-commission)
                robots['Sentinel']['pos'] = 0

            # --- B. VECTOR (Breakout) ---
            # Calc Dual Thrust
            range_high = np.max(highs[i-dt_n:i])
            range_close = closes[i-1] # Yesterday close
            range_low = np.min(lows[i-dt_n:i])
            
            # Simple approx for Dual Thrust lines
            buy_line = range_close + (range_high - range_low) * k1
            sell_line = range_close - (range_high - range_low) * k2
            
            v_pos = robots['Vector']['pos']
            v_val = robots['Vector']['cash'] + v_pos * price
            
            if price > buy_line and v_pos <= 0:
                # Close Short if any (simplified to long only for visual clarity in equity curve, or flip)
                # Let's do Long/Cash for clarity on up-only charts, or Flip for Pro
                # Pro Strategy: Flip
                qty_to_buy = (v_val * 0.9) / price # 90% capital
                if v_pos < 0: qty_to_buy += abs(v_pos) # Cover short
                
                robots['Vector']['cash'] -= qty_to_buy * price * (1+commission)
                robots['Vector']['pos'] += qty_to_buy
                
            elif price < sell_line and v_pos >= 0:
                # Go Short
                qty_to_sell = (v_val * 0.9) / price
                if v_pos > 0: qty_to_sell += v_pos # Close long
                
                robots['Vector']['cash'] += qty_to_sell * price * (1-commission)
                robots['Vector']['pos'] -= qty_to_sell

            # --- C. HARVESTER (Risk Parity) ---
            # 1. Calc Signal (Trend + Carry)
            # Simple Trend: Price > SMA60
            h_history = closes[i-harvest_lookback:i]
            h_sma = np.mean(h_history)
            trend_score = 1 if price > h_sma else -1
            
            # 2. Calc Volatility (Realized)
            returns = np.diff(h_history) / h_history[:-1]
            realized_vol = np.std(returns) * np.sqrt(252 * 24 * 60) # Approx annualized from minutes/hours
            if realized_vol == 0: realized_vol = 0.01 # Safety
            
            # 3. Size Position (Vol Target)
            h_val = robots['Harvester']['cash'] + robots['Harvester']['pos'] * price
            # Target Exposure = Target Vol / Realized Vol
            # Cap leverage at 2.0x
            leverage = min(2.0, target_vol / realized_vol) 
            
            target_pos_value = h_val * leverage * trend_score
            target_qty = target_pos_value / price
            
            current_qty = robots['Harvester']['pos']
            
            # Rebalance buffer (reduce churn)
            if abs(target_qty - current_qty) > (h_val * 0.05 / price):
                diff = target_qty - current_qty
                cost = diff * price
                robots['Harvester']['pos'] += diff
                robots['Harvester']['cash'] -= cost * (1 + commission)

            # --- ACCOUNTING ---
            for r in robots:
                eq = robots[r]['cash'] + (robots[r]['pos'] * price)
                robots[r]['equity'].append(eq)

        # Metrics
        results = {}
        for r in robots:
            equity = np.array(robots[r]['equity'])
            if len(equity) == 0:
                roi, max_dd = 0, 0
            else:
                roi = (equity[-1] - capital) / capital
                peak = np.maximum.accumulate(equity)
                dd = (equity - peak) / peak
                max_dd = np.min(dd)
            results[r] = {'roi': roi, 'max_dd': max_dd, 'equity': equity}
            
        return results

    # --- REPORTING ---

    def analyze_asset(self, symbol, config):
        print(f"\n🚜 Processing: {config['name']} ({symbol})...")
        
        # 1. Fetch
        df = self.fetch_long_term_data(symbol)
        if df.empty:
            print("   ⚠️ No Data. Skipping.")
            return None
        
        # 2. DQ (Simple Check)
        dq_score = 100 - (df.isnull().sum().sum() / len(df) * 100)
        
        # 3. MJD Sim
        sim_res = self.run_numerical_test(df)
        
        # 4. Robot Custody
        custody_res = self.run_robot_custody(df, config)
        
        return {
            "config": config,
            "dq": dq_score,
            "sim": sim_res,
            "custody": custody_res
        }

    def generate_full_report(self, results):
        print("\n📝 Generating Titan v7.1 Elite Report...")
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M')
        
        # --- AI Summary ---
        prompt_data = {}
        for k, v in results.items():
            prompt_data[k] = {
                "MJD_RMSE": v['sim']['rmse_score'],
                "Harvester_ROI": v['custody']['Harvester']['roi'],
                "Harvester_DD": v['custody']['Harvester']['max_dd']
            }
            
        prompt = f"""
        Role: Hedge Fund Quant Strategist.
        Report: Titan v7.1 Backtest Results (MJD Model + Risk Parity Robots).
        Data: {json.dumps(prompt_data)}
        
        Goal: Verify if 'Harvester' achieved >10% annualized return with acceptable drawdown.
        Explain why Merton Jump Diffusion is better for Ags than OU.
        Highlight the "Risk Parity" advantage in Harvester.
        """
        
        ai_text = "AI Unavailable."
        if self.model:
            try:
                resp = self.model.generate_content(prompt)
                ai_text = resp.text
            except: pass

        # --- Charts & HTML ---
        html_charts = ""
        for sym, res in results.items():
            curves = res['custody']
            
            # Downsample for chart
            step = max(1, len(curves['Sentinel']['equity']) // 500)
            
            fig = go.Figure()
            fig.add_trace(go.Scatter(y=curves['Sentinel']['equity'][::step], name='Sentinel (Bollinger)', line=dict(color='#0d59f2')))
            fig.add_trace(go.Scatter(y=curves['Vector']['equity'][::step], name='Vector (DualThrust)', line=dict(color='#a855f7')))
            fig.add_trace(go.Scatter(y=curves['Harvester']['equity'][::step], name='Harvester (RiskParity)', line=dict(color='#ffb347', width=3)))
            
            fig.update_layout(
                title=f"{res['config']['name']} - Elite Custody Performance",
                template="plotly_dark", height=400,
                yaxis_title="Equity (RMB)",
                annotations=[dict(
                    x=0.05, y=0.95, xref='paper', yref='paper',
                    text=f"Harvester ROI: {curves['Harvester']['roi']*100:.1f}%",
                    showarrow=False, font=dict(color='#ffb347', size=14)
                )]
            )
            chart_html = fig.to_html(full_html=False, include_plotlyjs='cdn')
            
            html_charts += f"""
            <div class="asset-card">
                <h3>{res['config']['name']}</h3>
                <div class="stats-row">
                    <span class="stat">Data Quality: {res['dq']:.1f}%</span>
                    <span class="stat">Sim Model: MJD (RMSE: {res['sim']['rmse_score']:.2f})</span>
                </div>
                {chart_html}
            </div>
            """

        full_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>QuantAgrify Titan v7.1 Report</title>
            <style>
                body {{ background: #0b0f19; color: #e2e8f0; font-family: sans-serif; padding: 40px; max-width: 1200px; margin: 0 auto; }}
                h1 {{ color: #ffb347; border-bottom: 2px solid #334155; padding-bottom: 10px; }}
                .ai-box {{ background: #1e293b; padding: 20px; border-left: 4px solid #ffb347; margin-bottom: 40px; }}
                .asset-card {{ background: #161b28; padding: 20px; margin-bottom: 30px; border-radius: 12px; border: 1px solid #334155; }}
                .stats-row {{ display: flex; gap: 20px; margin-bottom: 15px; font-family: monospace; color: #94a3b8; }}
            </style>
        </head>
        <body>
            <h1>🌾 Titan v7.1: Elite Harvest Edition</h1>
            <div class="ai-box">{markdown.markdown(ai_text)}</div>
            {html_charts}
        </body>
        </html>
        """
        
        with open("QuantAgrify_Titan_v7.1_Report.html", "w", encoding='utf-8') as f:
            f.write(full_html)
        print("\n✅ Report Generated: QuantAgrify_Titan_v7.1_Report.html")

    def run(self):
        all_results = {}
        for sym, cfg in ASSETS.items():
            res = self.analyze_asset(sym, cfg)
            if res: all_results[sym] = res
            
        self.generate_full_report(all_results)

if __name__ == "__main__":
    titan = TitanElite()
    titan.setup_ai()
    titan.run()
