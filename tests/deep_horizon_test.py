
# -*- coding: utf-8 -*-
"""
QuantAgrify Titan Suite v6.3 (Precision Mode)
--------------------------------------------------
CRITICAL FIXES:
1. SQL: Switched from Fuzzy Search (LIKE) to Exact Match (=).
   This eliminates "Contract Mixing" artifacts that caused 50,000% volatility.
2. Target: Now targeting specific Continuous Indexes (e.g., C9999.XDCE).
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
from google.oauth2 import service_account
from google.cloud import bigquery
from datetime import datetime, timedelta

# --- 0. CONFIGURATION ---

KEY_PATH = "service_account.json"
DATASET_ID = "quant_database"
TABLE_ID = "futures_1min"

# 🎯 PRECISION ASSETS (Exact Match Required)
ASSETS = {
    'Corn':    {'code': 'C9999.XDCE',  'name': 'Corn (玉米)',    'region': 'Heilongjiang'},
    'Soybean': {'code': 'A9999.XDCE',  'name': 'Soybean No.1',   'region': 'Heihe'},
    'Sugar':   {'code': 'SR9999.XZCE', 'name': 'Sugar (白糖)',     'region': 'Guangxi'},
    'Cotton':  {'code': 'CF9999.XZCE', 'name': 'Cotton (棉花)',    'region': 'Xinjiang'},
}

TRAIN_START = '2020-01-01'
TEST_END    = '2025-12-31'

# Setup Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - [TITAN v6.3] - %(message)s')
logger = logging.getLogger("Titan-v6.3")
warnings.filterwarnings("ignore")

class TitanBlackBox:
    def __init__(self):
        self.execution_log = []
        self.report_sections = []
        self.asset_metrics = {}
        self.use_synthetic = False
        
        self.log("🚀 INITIALIZING TITAN v6.3 (PRECISION MODE)...")
        self.bq_client = self._init_bq()

    def log(self, msg, level='INFO'):
        timestamp = datetime.now().strftime('%H:%M:%S')
        log_entry = f"[{timestamp}] [{level}] {msg}"
        self.execution_log.append(log_entry)
        if level == 'ERROR': logger.error(msg)
        elif level == 'WARN': logger.warning(msg)
        else: logger.info(msg)

    def _init_bq(self):
        if not os.path.exists(KEY_PATH):
            self.log(f"⚠️ Key file '{KEY_PATH}' not found in Colab.", 'WARN')
            self.log("   -> Switching to SYNTHETIC SIMULATION ENGINE.", 'WARN')
            self.use_synthetic = True
            return None
        try:
            creds = service_account.Credentials.from_service_account_file(KEY_PATH)
            client = bigquery.Client(credentials=creds, project=creds.project_id)
            self.log("✅ BigQuery Connection: ESTABLISHED")
            return client
        except Exception as e:
            self.log(f"❌ Auth Failed: {e}. Engaging SYNTHETIC.", 'ERROR')
            self.use_synthetic = True
            return None

    def _generate_synthetic_series(self, asset_name, start_date, end_date):
        dates = pd.date_range(start=start_date, end=end_date)
        n = len(dates)
        price = 2500 if 'Corn' in asset_name else 5000 if 'Soy' in asset_name else 15000 if 'Cotton' in asset_name else 6000
        volatility = 0.015
        data = []
        for i in range(n):
            season = np.sin(i / 365 * 2 * np.pi) * 0.005
            noise = np.random.normal(0, volatility)
            price = price * (1 + noise + season)
            data.append([dates[i], price, price*1.01, price*0.99, price, 100000])
        df = pd.DataFrame(data, columns=['date', 'open', 'high', 'low', 'close', 'volume'])
        df.set_index('date', inplace=True)
        return df

    def run_suite(self):
        try:
            self.audit_1_data_integrity()
            
            for key, meta in ASSETS.items():
                self.log(f"--- Processing Asset: {key} ({meta['code']}) ---")
                
                # 1. Get Data
                df = self.fetch_data(key, meta['code'])
                
                if df is not None and not df.empty:
                    # 2. Risk Modeling
                    self.audit_2_risk_modeling(key, df)
                    
                    # 3. Strategy Sim
                    self.audit_3_strategy_sim(key, df)
                else:
                    self.log(f"❌ No data available for {key}", 'ERROR')

            self.audit_4_cross_asset_summary()
            
        except Exception as e:
            self.log(f"FATAL ERROR IN SUITE: {e}", 'ERROR')
        finally:
            self.save_report()

    def fetch_data(self, key, target_code):
        if self.use_synthetic:
            return self._generate_synthetic_series(key, TRAIN_START, TEST_END)
        
        # 🎯 STRICT EQUALITY QUERY (=)
        # Using exact match prevents mixing different contracts (e.g. C2101 vs C2105)
        # We aggregate to Daily OHLC using the First/Last logic for accuracy
        query = f"""
            SELECT 
                DATE(timestamp_field_0) as date,
                ARRAY_AGG(open ORDER BY timestamp_field_0 ASC LIMIT 1)[OFFSET(0)] as open,
                MAX(high) as high,
                MIN(low) as low,
                ARRAY_AGG(close ORDER BY timestamp_field_0 DESC LIMIT 1)[OFFSET(0)] as close,
                SUM(volume) as volume
            FROM `{self.bq_client.project}.{DATASET_ID}.{TABLE_ID}`
            WHERE contract = '{target_code}'
            AND timestamp_field_0 BETWEEN '{TRAIN_START}' AND '{TEST_END}'
            GROUP BY date 
            ORDER BY date
        """
        try:
            # create_bqstorage_client=False prevents 403 error
            df = self.bq_client.query(query).to_dataframe(create_bqstorage_client=False)
            
            if df.empty:
                self.log(f"   [Data] 0 rows found for EXACT match '{target_code}'. Falling back to Synthetic.", 'WARN')
                return self._generate_synthetic_series(key, TRAIN_START, TEST_END)
            
            df['date'] = pd.to_datetime(df['date'])
            df.set_index('date', inplace=True)
            self.log(f"   [Data] Loaded {len(df)} rows. Range: {df.index.min().date()} -> {df.index.max().date()}")
            return df
        except Exception as e:
            self.log(f"   [Data] Query failed: {e}. Using Synthetic.", 'ERROR')
            return self._generate_synthetic_series(key, TRAIN_START, TEST_END)

    def audit_1_data_integrity(self):
        self.log("🔵 [DIM 1] Data Integrity Check...")
        status = "SYNTHETIC_FALLBACK" if self.use_synthetic else "CLOUD_CONNECTED"
        html = f"""
        <div class="card">
            <h3>1. Data Infrastructure Status</h3>
            <p><strong>Mode:</strong> <span class="tag {'fail' if self.use_synthetic else 'pass'}">{status}</span></p>
            <p>Matching Logic: <strong>EXACT MATCH (=)</strong> on BigQuery Contract ID.</p>
        </div>
        """
        self.report_sections.append(html)

    def audit_2_risk_modeling(self, key, df):
        self.log(f"   [Risk] Calculating volatility surface for {key}...")
        
        # Calculate Metrics
        df['ret'] = df['close'].pct_change()
        vol = df['ret'].std() * np.sqrt(252)
        
        # Drawdown
        cum = (1 + df['ret']).cumprod()
        peak = cum.cummax()
        dd = (cum - peak) / peak
        max_dd = dd.min()
        
        # Store for summary
        if key not in self.asset_metrics: self.asset_metrics[key] = {}
        self.asset_metrics[key]['vol'] = vol
        self.asset_metrics[key]['max_dd'] = max_dd

        # Quality Check Highlight
        vol_display = f"{vol*100:.2f}%"
        if vol > 1.0: vol_display += " ⚠️(DATA ERROR?)" # Flag if Vol > 100%

        html = f"""
        <div class="metric-row">
            <strong>{key} Risk Profile</strong>: 
            Vol: {vol_display} | MaxDD: {(max_dd*100):.2f}%
        </div>
        """
        self.report_sections.append(html)

    def audit_3_strategy_sim(self, key, df):
        self.log(f"   [Sim] Running Vector vs Harvester for {key}...")
        
        # Simulation Logic
        test_df = df.copy() # Use full range for charts
        if test_df.empty: return

        # 1. Vector (Trend Following MA Crossover)
        test_df['MA20'] = test_df['close'].rolling(20).mean()
        test_df['Vector_Sig'] = np.where(test_df['close'] > test_df['MA20'], 1, 0)
        test_df['Vector_Ret'] = test_df['Vector_Sig'].shift(1) * test_df['ret']
        vector_perf = (1 + test_df['Vector_Ret']).cumprod().iloc[-1] - 1

        # 2. Harvester (Mean Reversion / Weather Proxy)
        # Logic: Buy if 3-day drop (simulating weather dip buying)
        test_df['Down3'] = (test_df['close'] < test_df['close'].shift(1)) & \
                           (test_df['close'].shift(1) < test_df['close'].shift(2)) & \
                           (test_df['close'].shift(2) < test_df['close'].shift(3))
        test_df['Harv_Sig'] = np.where(test_df['Down3'], 1, 0)
        test_df['Harv_Ret'] = test_df['Harv_Sig'].shift(1) * test_df['ret']
        harvester_perf = (1 + test_df['Harv_Ret']).cumprod().iloc[-1] - 1

        # Store results
        self.asset_metrics[key]['vector_roi'] = vector_perf
        self.asset_metrics[key]['harvester_roi'] = harvester_perf

        # Chart
        fig = go.Figure()
        fig.add_trace(go.Scatter(x=test_df.index, y=(1+test_df['Vector_Ret']).cumprod(), name='Vector (Trend)', line=dict(color='#a855f7')))
        fig.add_trace(go.Scatter(x=test_df.index, y=(1+test_df['Harv_Ret']).cumprod(), name='Harvester (MeanRev)', line=dict(color='#ffb347')))
        fig.update_layout(title=f"{key} Strategy Performance", template="plotly_dark", height=300, margin=dict(l=20, r=20, t=40, b=20))
        chart_html = fig.to_html(full_html=False, include_plotlyjs='cdn')

        html = f"""
        <div class="card">
            <h3>{key} Strategy Simulation</h3>
            <div style="display:flex; justify-content:space-around; margin-bottom:10px;">
                <span style="color:#a855f7">Vector ROI: {vector_perf*100:.1f}%</span>
                <span style="color:#ffb347">Harvester ROI: {harvester_perf*100:.1f}%</span>
            </div>
            {chart_html}
        </div>
        """
        self.report_sections.append(html)

    def audit_4_cross_asset_summary(self):
        self.log("🔵 [DIM 4] Generating Cross-Asset Matrix...")
        rows = ""
        for key, m in self.asset_metrics.items():
            winner = "Vector" if m.get('vector_roi',0) > m.get('harvester_roi',0) else "Harvester"
            rows += f"<tr><td>{key}</td><td>{m.get('vol',0)*100:.1f}%</td><td>{winner}</td></tr>"
        
        html = f"""
        <div class="card">
            <h3>4. Cross-Asset Summary</h3>
            <table>
                <thead><tr><th>Asset</th><th>Volatility</th><th>Best Strategy</th></tr></thead>
                <tbody>{rows}</tbody>
            </table>
        </div>
        """
        self.report_sections.append(html)

    def save_report(self):
        self.log("💾 COMPILING FINAL REPORT...")
        
        prompt_context = "QuantAgrify Audit v6.3 (Precision Mode) Results:\n"
        for key, m in self.asset_metrics.items():
            prompt_context += f"Asset: {key}\n"
            prompt_context += f"- Volatility: {m.get('vol',0)*100:.1f}%\n"
            prompt_context += f"- Trend Strategy: {m.get('vector_roi',0)*100:.1f}%\n"
            prompt_context += f"- MeanRev Strategy: {m.get('harvester_roi',0)*100:.1f}%\n\n"
        
        prompt_html = f"""
        <div class="section">
            <h2 class="section-title">🧠 Gemini 3.0 Prompt Context</h2>
            <p><em>Copy this block below and paste it into Gemini/ChatGPT for analysis:</em></p>
            <textarea style="width:100%; height:150px; background:#0f172a; color:#a855f7; padding:10px; border:1px solid #334155; font-family:monospace;">{prompt_context}</textarea>
        </div>
        """

        log_html = "<div class='log-box'>" + "<br/>".join(self.execution_log) + "</div>"

        css = """
        body { background-color: #020617; color: #e2e8f0; font-family: 'Segoe UI', Roboto, Helvetica, sans-serif; padding: 40px; max-width: 1200px; margin: 0 auto; }
        h1 { color: #3b82f6; border-bottom: 2px solid #1e293b; padding-bottom: 20px; }
        .section-title { color: #94a3b8; font-size: 1.5rem; margin-top: 0; border-left: 4px solid #3b82f6; padding-left: 15px; }
        .card { background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 25px; margin-bottom: 30px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5); }
        .metric-row { margin-bottom: 10px; padding: 10px; background: #1e293b; border-radius: 6px; border-left: 4px solid #0d59f2; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { text-align: left; color: #64748b; border-bottom: 1px solid #334155; padding: 10px; }
        td { padding: 12px 10px; border-bottom: 1px solid #1e293b; }
        .tag { padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 0.8rem; }
        .pass { background: rgba(16, 185, 129, 0.2); color: #10b981; }
        .fail { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
        .log-box { background: #000; color: #00ff00; font-family: monospace; padding: 15px; border-radius: 8px; max-height: 300px; overflow-y: scroll; font-size: 11px; margin-top: 20px; border: 1px solid #333; }
        """

        html = f"""
        <!DOCTYPE html>
        <html>
        <head><title>QuantAgrify BlackBox Audit v6.3</title><style>{css}</style></head>
        <body>
            <h1>QuantAgrify // Titan v6.3 Precision Audit</h1>
            <p><strong>Date:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M')} | <strong>System:</strong> {sys.platform}</p>
            
            {''.join(self.report_sections)}
            
            {prompt_html}
            
            <div class="card">
                <h3 class="section-title">System Execution Logs</h3>
                {log_html}
            </div>
        </body>
        </html>
        """
        
        file_name = "QuantAgrify_Precision_Report.html"
        with open(file_name, "w", encoding='utf-8') as f:
            f.write(html)
        self.log(f"✅ REPORT SAVED: {file_name}")
        
        # Try to trigger auto-download in Colab
        try:
            from google.colab import files
            files.download(file_name)
            self.log("🚀 Colab Auto-Download Triggered.")
        except Exception:
            self.log("⚠️ Auto-download failed (normal if not in Colab).")

if __name__ == "__main__":
    # Ensure dependencies are installed if running in a fresh colab
    try:
        import plotly
    except ImportError:
        os.system('pip install plotly google-cloud-bigquery pandas')
        
    engine = TitanBlackBox()
    engine.run_suite()
