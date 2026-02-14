
import os
import sys
import json
import logging
import time
from typing import List, Dict, Optional
import pandas as pd
from google.cloud import bigquery
from google.oauth2.service_account import Credentials

# --- CONFIGURATION ---
TARGET_ASSETS = {
    'DCE': ['C9999.DCE', 'A9999.DCE', 'M9999.DCE', 'P9999.DCE'], # Normalized BQ Symbols
    'ZCE': ['SR9999.ZCE', 'CF9999.ZCE']
}
START_DATE = '2006-01-01'
END_DATE = '2025-11-30'
TABLE_ID = 'quant_database.futures_1min' # Update with actual project id prefix later or via code

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("DeepHorizonTest")

class DeepHorizonTester:
    def __init__(self, creds_path: Optional[str] = None):
        self.bq_client = self._init_client(creds_path)
        self.project_id = self.bq_client.project if self.bq_client else None
        self.report_data = []

    def _init_client(self, creds_path):
        try:
            if creds_path and os.path.exists(creds_path):
                logger.info(f"Loading credentials from {creds_path}")
                creds = Credentials.from_service_account_file(creds_path)
                return bigquery.Client(credentials=creds, project=creds.project_id)
            elif os.environ.get('GOOGLE_APPLICATION_CREDENTIALS'):
                logger.info("Using GOOGLE_APPLICATION_CREDENTIALS env var.")
                return bigquery.Client()
            else:
                # Try default
                logger.warning("No explicit creds found. Trying default auth...")
                return bigquery.Client()
        except Exception as e:
            logger.critical(f"Failed to initialize BigQuery: {e}")
            return None

    def run_suite(self):
        if not self.bq_client:
            logger.error("Client not ready. Aborting.")
            return

        logger.info("🚀 Starting Deep Horizon Stress Test Suite (2006-2025)...")
        
        for exchange, symbols in TARGET_ASSETS.items():
            for symbol in symbols:
                self.run_asset_test(symbol, exchange)

        self.generate_html_report()

    def run_asset_test(self, symbol: str, exchange: str):
        logger.info(f"--- Testing {symbol} ({exchange}) ---")
        
        # 1. Fetch Data
        start_time = time.time()
        query = f"""
            SELECT date, open, high, low, close, volume 
            FROM `{self.project_id}.{TABLE_ID}`
            WHERE symbol = '{symbol}'
            AND date >= '{START_DATE}' AND date <= '{END_DATE}'
            ORDER BY date ASC
        """
        
        try:
            df = self.bq_client.query(query).to_dataframe()
            duration = time.time() - start_time
            row_count = len(df)
            
            logger.info(f"   Fetched {row_count} rows in {duration:.2f}s")
            
            if row_count == 0:
                self.report_data.append({
                    "symbol": symbol, "status": "FAIL", "reason": "No Data", "rows": 0
                })
                return

            # 2. Integrity Checks
            # Gap Detection (Time Delta > 1 min within trading hours - simplifed to > 5 days here as requested)
            df['date'] = pd.to_datetime(df['date'])
            df['delta'] = df['date'].diff()
            
            # Simple Gap: > 5 Days
            gaps = df[df['delta'] > pd.Timedelta(days=5)]
            gap_count = len(gaps)
            
            # Zero Volume
            zero_vol = len(df[df['volume'] == 0])
            
            # 3. Compute Stress (RSI)
            compute_start = time.time()
            self.calculate_rsi(df)
            compute_time = time.time() - compute_start
            
            # Result
            self.report_data.append({
                "symbol": symbol,
                "status": "PASS",
                "rows": row_count,
                "fetch_time": round(duration, 2),
                "compute_time": round(compute_time, 2),
                "gaps_gt_5d": gap_count,
                "zero_vol_rows": zero_vol,
                "start_date": df['date'].min().strftime('%Y-%m-%d'),
                "end_date": df['date'].max().strftime('%Y-%m-%d')
            })
            
        except Exception as e:
            logger.error(f"   Error testing {symbol}: {e}")
            self.report_data.append({
                "symbol": symbol, "status": "ERROR", "reason": str(e)
            })

    def calculate_rsi(self, df, window=14):
        # Basic vectorized RSI calculation
        delta = df['close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=window).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=window).mean()
        rs = gain / loss
        df['rsi'] = 100 - (100 / (1 + rs))
        return df

    def generate_html_report(self):
        html = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Deep Horizon Test Report</title>
            <style>
                body { font-family: sans-serif; background: #121212; color: #e0e0e0; padding: 20px; }
                table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                th, td { border: 1px solid #333; padding: 10px; text-align: left; }
                th { background: #1e1e1e; color: #0d59f2; }
                tr:nth-child(even) { background: #1a1a1a; }
                .pass { color: #00e676; font-weight: bold; }
                .fail { color: #ff1744; font-weight: bold; }
                .error { color: #ff9100; font-weight: bold; }
                h1 { color: #0d59f2; border-bottom: 2px solid #0d59f2; padding-bottom: 10px; }
            </style>
        </head>
        <body>
            <h1>Deep Horizon Stress Test Report</h1>
            <p><strong>Range:</strong> 2006-01-01 to 2025-11-30</p>
            <table>
                <thead>
                    <tr>
                        <th>Symbol</th><th>Status</th><th>Rows</th><th>Fetch (s)</th><th>Compute (s)</th><th>Gaps (>5d)</th><th>Zero Vol</th><th>Range</th>
                    </tr>
                </thead>
                <tbody>
        """
        
        for row in self.report_data:
            status_class = row['status'].lower()
            html += f"""
                <tr>
                    <td>{row['symbol']}</td>
                    <td class="{status_class}">{row['status']}</td>
                    <td>{row.get('rows', 'N/A'):,}</td>
                    <td>{row.get('fetch_time', '-')}</td>
                    <td>{row.get('compute_time', '-')}</td>
                    <td>{row.get('gaps_gt_5d', '-')}</td>
                    <td>{row.get('zero_vol_rows', '-')}</td>
                    <td>{row.get('start_date', '')} to {row.get('end_date', '')}</td>
                </tr>
            """
            
        html += """
                </tbody>
            </table>
        </body>
        </html>
        """
        
        with open("deep_horizon_report.html", "w", encoding='utf-8') as f:
            f.write(html)
        
        logger.info("✅ Report generated: deep_horizon_report.html")

if __name__ == "__main__":
    # Check for creds argument or file in local dir
    creds_file = "service_account.json"
    if len(sys.argv) > 1:
        creds_file = sys.argv[1]
    
    if not os.path.exists(creds_file) and not os.environ.get('GOOGLE_APPLICATION_CREDENTIALS'):
        print(f"❌ Error: {creds_file} not found. Please place service_account.json in this directory or pass path as argument.")
        sys.exit(1)
        
    tester = DeepHorizonTester(creds_file if os.path.exists(creds_file) else None)
    tester.run_suite()
