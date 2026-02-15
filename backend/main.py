
import os
import sys
import logging
import json
import time
import datetime
import traceback
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import requests
import urllib3
from google.oauth2.service_account import Credentials # Ensure this is imported

# 1. Disable SSL Warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# 2. Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("QuantAgrify-Backend")

# --- 3. HARD DEPENDENCIES (Strict Mode) ---
try:
    import jqdatasdk as jq
    from jqdatasdk import opt, macro, query
    JQ_AVAILABLE = True
except ImportError:
    JQ_AVAILABLE = False
    logger.warning("⚠️ JQData SDK not installed.")

try:
    import ee
    from google.oauth2.service_account import Credentials
    import google.auth.exceptions
    import google.auth
    GEE_IMPORTED = True
except ImportError:
    GEE_IMPORTED = False
    logger.error("❌ earthengine-api or google-auth not installed.")

try:
    from google.cloud import bigquery
    BIGQUERY_AVAILABLE = True
except ImportError:
    BIGQUERY_AVAILABLE = False
    logger.warning("⚠️ Google Cloud BigQuery library not installed.")

# Curl_CFFI
try:
    from curl_cffi import requests as cffi_requests
    CFFI_AVAILABLE = True
except ImportError:
    CFFI_AVAILABLE = False


# --- 4. GLOBAL STATE ---
GLOBAL_STATE = {
    "gee_ready": False,
    "gee_error": None,
    "bq_ready": False,
    "bq_client": None,
    "active_project": None,
    "jq_ready": JQ_AVAILABLE
}

# Scope needed for Earth Engine REST API
GEE_SCOPES = ['https://www.googleapis.com/auth/earthengine', 'https://www.googleapis.com/auth/bigquery']

def attempt_cloud_connection(creds_json: Optional[Dict] = None) -> bool:
    """
    Connect to Google Cloud Services (GEE & BigQuery).
    """
    global GLOBAL_STATE
    
    credentials = None
    project_id = None

    try:
        # Step 1: Resolve Credentials
        if creds_json:
            # Hot Swap
            logger.info("🔑 Cloud: Using provided JSON credentials from Client...")
            credentials = Credentials.from_service_account_info(creds_json, scopes=GEE_SCOPES)
            project_id = creds_json.get('project_id')
        
        elif os.environ.get("GEE_SERVICE_ACCOUNT"):
            # Env Var
            logger.info("🔑 Cloud: Found GEE_SERVICE_ACCOUNT env var...")
            try:
                service_account_info = json.loads(os.environ.get("GEE_SERVICE_ACCOUNT"))
                credentials = Credentials.from_service_account_info(service_account_info, scopes=GEE_SCOPES)
                project_id = service_account_info.get('project_id')
            except json.JSONDecodeError:
                error_msg = "GEE_SERVICE_ACCOUNT is not valid JSON."
                logger.error(f"❌ {error_msg}")
                GLOBAL_STATE["gee_error"] = error_msg
                return False
        
        # Auto-detect service_account.json in root
        elif os.path.exists("service_account.json"):
            logger.info("🔑 Cloud: Found service_account.json in root directory...")
            try:
                credentials = Credentials.from_service_account_file("service_account.json", scopes=GEE_SCOPES)
                project_id = credentials.project_id
            except Exception as e:
                logger.error(f"❌ Failed to load local json: {e}")

        else:
            # Local Default
            logger.info("🔑 Cloud: Attempting local default credentials (gcloud)...")
            try:
                credentials, project_id = google.auth.default(scopes=GEE_SCOPES)
            except Exception as e:
                logger.warning(f"⚠️ Default auth failed: {e}")

        # Step 2: Initialize Earth Engine
        if GEE_IMPORTED and credentials:
            try:
                logger.info(f"🌍 GEE: Initializing (Project: {project_id})...")
                ee.Initialize(credentials=credentials, project=project_id)
                GLOBAL_STATE["gee_ready"] = True
                GLOBAL_STATE["gee_error"] = None
                GLOBAL_STATE["active_project"] = project_id
                logger.info("✅ GEE: Initialization COMPLETE.")
            except Exception as e:
                logger.error(f"❌ GEE Init Failed: {e}")
                GLOBAL_STATE["gee_error"] = str(e)

        # Step 3: Initialize BigQuery
        if BIGQUERY_AVAILABLE and credentials:
            try:
                logger.info(f"🗄️ BigQuery: Initializing Client...")
                GLOBAL_STATE["bq_client"] = bigquery.Client(credentials=credentials, project=project_id)
                GLOBAL_STATE["bq_ready"] = True
                # Force project ID update if hot-swapped
                GLOBAL_STATE["active_project"] = project_id 
                logger.info(f"✅ BigQuery: Client Ready (Project: {project_id}).")
            except Exception as e:
                logger.error(f"❌ BigQuery Init Failed: {e}")
                GLOBAL_STATE["bq_ready"] = False

        return True

    except Exception as e:
        logger.error(f"❌ Cloud Critical Failure: {str(e)}")
        traceback.print_exc()
        return False
    
    return False


# --- 5. APP LIFESPAN ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Try to connect, but don't block/fail app if it errors
    try:
        logger.info("🟢 System Startup...")
        attempt_cloud_connection()
    except Exception as e:
        logger.error(f"⚠️ Startup Error (Non-Fatal): {e}")
    yield
    logger.info("🔴 System Shutdown.")

# Set Current Version
CURRENT_VERSION = "3.3.8-DEEPTEST"

app = FastAPI(title="QuantAgrify Middleware", version=CURRENT_VERSION, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- REQUEST MODELS ---
class GeeAnalysisRequest(BaseModel):
    lat: float
    lon: float
    asset_name: str
    buffer_radius: int = 50000
    full_season_start: str 
    full_season_end: str
    stage_start: str
    stage_end: str
    compare_year: int 
    target_year: int 

class GeeStatusRequest(BaseModel):
    dummy: str = "ping"
    credentials: Optional[Dict] = None

class JQAuthRequest(BaseModel):
    username: str
    password: str

class PriceRequest(BaseModel):
    username: str
    password: str
    symbol: str
    frequency: str = "daily"
    count: Optional[int] = 100
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class ProxyRequest(BaseModel):
    apiKey: str = ""
    endpoint: str = ""
    token: str = "" 

# --- ROUTES ---

@app.get("/")
def root():
    return {
        "status": "online",
        "version": CURRENT_VERSION,
        "mode": "HYBRID_DATA_AGGR_FIXED",
        "global_state": {k: str(v) if k == "bq_client" else v for k, v in GLOBAL_STATE.items()}
    }

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/api/gee/status")
def check_gee_status(payload: GeeStatusRequest):
    credentials_loaded = False
    
    if payload.credentials:
        logger.info("🔄 API Trigger: Hot Swapping Credentials...")
        success = attempt_cloud_connection(payload.credentials)
        if success:
            credentials_loaded = True
        else:
            return {"success": False, "status": "AUTH_FAILED", "error": "Creds rejected"}

    if not GLOBAL_STATE["gee_ready"]:
         return {"success": False, "status": "NOT_CONFIGURED", "error": GLOBAL_STATE["gee_error"]}
         
    try:
        val = ee.Number(1).getInfo() 
        return {
            "success": True,
            "status": "ONLINE",
            "project": GLOBAL_STATE["active_project"],
            "backend_version": CURRENT_VERSION,
            "credentials_loaded": credentials_loaded
        }
    except Exception as e:
        return {"success": False, "status": "ERROR", "error": str(e)}

@app.post("/api/bigquery/status")
def check_bigquery_status(payload: GeeStatusRequest):
    credentials_loaded = False
    
    # Reuse the same cloud connection logic as GEE
    if payload.credentials:
        logger.info("🔄 API Trigger: Hot Swapping Credentials for BigQuery...")
        success = attempt_cloud_connection(payload.credentials)
        if success:
            credentials_loaded = True
        else:
            return {"success": False, "status": "AUTH_FAILED", "error": "Creds rejected"}

    if not GLOBAL_STATE["bq_ready"] or not GLOBAL_STATE["bq_client"]:
         return {"success": False, "status": "NOT_CONFIGURED", "error": "BigQuery client not initialized"}
         
    try:
        # Try to list datasets to verify permissions
        datasets = list(GLOBAL_STATE["bq_client"].list_datasets())
        dataset_ids = [d.dataset_id for d in datasets]
        
        return {
            "success": True,
            "status": "ONLINE",
            "project": GLOBAL_STATE["active_project"],
            "datasets_found": dataset_ids,
            "credentials_loaded": credentials_loaded
        }
    except Exception as e:
        return {"success": False, "status": "PERMISSION_ERROR", "error": str(e)}

@app.post("/api/gee/analyze")
def analyze_satellite_data(payload: GeeAnalysisRequest):
    if not GLOBAL_STATE["gee_ready"]:
        raise HTTPException(status_code=503, detail="GEE Not Ready")

    try:
        point = ee.Geometry.Point([payload.lon, payload.lat])
        aoi = point.buffer(payload.buffer_radius)

        t_season_start = payload.full_season_start
        t_season_end = payload.full_season_end
        t_stage_start = payload.stage_start
        t_stage_end = payload.stage_end
        
        year_diff = payload.target_year - payload.compare_year
        
        def shift_date(date_str, diff):
            dt = datetime.datetime.strptime(date_str, "%Y-%m-%d")
            new_dt = dt.replace(year=dt.year - diff)
            return new_dt.strftime("%Y-%m-%d")

        c_season_start = shift_date(t_season_start, year_diff)
        c_season_end = shift_date(t_season_end, year_diff)
        c_stage_start = shift_date(t_stage_start, year_diff)
        c_stage_end = shift_date(t_stage_end, year_diff)

        worldcover = ee.ImageCollection("ESA/WorldCover/v200").first()
        cropland_mask = worldcover.select('Map').eq(40).clip(aoi)
        
        def process_common_clouds(image):
            qa = image.select('QA60')
            cloud_bit_mask = 1 << 10
            cirrus_bit_mask = 1 << 11
            mask = qa.bitwiseAnd(cloud_bit_mask).eq(0).And(qa.bitwiseAnd(cirrus_bit_mask).eq(0))
            return image.updateMask(mask).divide(10000).copyProperties(image, ["system:time_start"])

        s2_visual = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED') \
            .filterBounds(aoi) \
            .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 15)) \
            .map(process_common_clouds)

        def process_analytics_bands(image):
            final_masked = image.updateMask(cropland_mask)
            ndvi = final_masked.normalizedDifference(['B8', 'B4']).rename('NDVI')
            return final_masked.addBands(ndvi)

        s2_analytics = s2_visual.map(process_analytics_bands)

        def get_stats(image):
            ndvi_scaled = image.select('NDVI').multiply(10000).int()
            stats = ndvi_scaled.reduceRegion(
                reducer=ee.Reducer.mode().combine(reducer2=ee.Reducer.count(), sharedInputs=True), 
                geometry=aoi, scale=1000, maxPixels=1e9, bestEffort=True
            )
            return ee.Feature(None, {
                'date': image.date().format('YYYY-MM-dd'),
                'ndvi': stats.get('NDVI_mode'), 
                'count': stats.get('NDVI_count'),
                'millis': image.date().millis()
            })

        target_fc = s2_analytics.filterDate(t_season_start, t_season_end).map(get_stats).getInfo()
        compare_fc = s2_analytics.filterDate(c_season_start, c_season_end).map(get_stats).getInfo()

        vis_params = {'min': 0.0, 'max': 0.3, 'bands': ['B4', 'B3', 'B2'], 'dimensions': 800, 'region': aoi, 'format': 'png'}
        
        def get_thumb(start, end):
            try:
                return s2_visual.filterDate(start, end).median().clip(aoi).getThumbURL(vis_params)
            except: return None

        target_url = get_thumb(t_stage_start, t_stage_end)
        compare_url = get_thumb(c_stage_start, c_stage_end)

        def extract_points(feature_collection):
            points = []
            if 'features' in feature_collection:
                for f in feature_collection['features']:
                    props = f['properties']
                    val = props.get('ndvi')
                    count = props.get('count')
                    if val is not None and count is not None and count > 100: 
                        points.append({'date': props['date'], 'ndvi': float(val) / 10000.0, 'timestamp': props['millis']})
            points.sort(key=lambda x: x['date'])
            return points

        return {
            "success": True,
            "images": {"target_year_url": target_url, "compare_year_url": compare_url},
            "chart_data": {"target_year": extract_points(target_fc), "compare_year": extract_points(compare_fc)}
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/jqdata/auth")
def auth_jq(payload: JQAuthRequest):
    if not JQ_AVAILABLE: raise HTTPException(status_code=501, detail="JQData SDK missing")
    try:
        jq.auth(payload.username, payload.password)
        return {"success": True, "status": "Authenticated"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def normalize_bq_symbol(symbol: str) -> str:
    """
    STRICT IDENTITY FUNCTION:
    BigQuery contains full standard codes (e.g. 'C9999.XDCE').
    Do NOT convert to lowercase or strip suffix.
    Just remove whitespace safety.
    """
    if not symbol: return ""
    return symbol.strip()

@app.post("/api/market/hybrid-price")
def get_hybrid_price(payload: PriceRequest):
    """
    Hybrid Cloud Data Logic:
    1. Try BigQuery (Historical Archive) with Smart Aggregation.
    2. Identify Gaps.
    3. Call JQData (Live) for the gap.
    4. Merge & Deduplicate.
    """
    symbol = payload.symbol
    bq_symbol = normalize_bq_symbol(symbol)
    
    # EXTRACT ROOT SYMBOL FOR BROAD SEARCH (e.g. "C9999.XDCE" -> "C9999")
    # This allows searching via LIKE to handle any minor format discrepancies in the DB
    root_symbol = bq_symbol.split('.')[0] if '.' in bq_symbol else bq_symbol
    
    start_date = payload.start_date
    end_date = payload.end_date
    frequency = payload.frequency or 'daily'
    
    if not start_date:
        start_date = (datetime.datetime.now() - datetime.timedelta(days=365)).strftime("%Y-%m-%d")
    if not end_date:
        end_date = datetime.datetime.now().strftime("%Y-%m-%d")

    bq_df = pd.DataFrame()
    source_label = "JQData (Live)" # Default if BQ fails
    
    # --- PHASE 1: BIGQUERY SMART QUERY ---
    if GLOBAL_STATE["bq_ready"] and GLOBAL_STATE["bq_client"]:
        try:
            logger.info(f"🔍 Hybrid: Checking BigQuery for {bq_symbol} (Root: {root_symbol}) ({start_date} to {end_date}, Freq: {frequency})...")
            
            table_id = f"{GLOBAL_STATE['active_project']}.quant_database.futures_1min"
            
            if frequency == 'daily' or frequency == '1d':
                # AGGREGATION QUERY: 1min -> Daily OHLCV
                # Using timestamp_field_0 as per user verification
                # BROAD MATCHING: Use LIKE with root_symbol
                query = f"""
                    SELECT 
                        FORMAT_TIMESTAMP('%Y-%m-%d', timestamp_field_0) as date_str,
                        ARRAY_AGG(open ORDER BY timestamp_field_0 ASC LIMIT 1)[OFFSET(0)] as open,
                        MAX(high) as high,
                        MIN(low) as low,
                        ARRAY_AGG(close ORDER BY timestamp_field_0 DESC LIMIT 1)[OFFSET(0)] as close,
                        SUM(volume) as volume
                    FROM `{table_id}`
                    WHERE contract LIKE '%{root_symbol}%'
                    AND timestamp_field_0 >= TIMESTAMP('{start_date}') 
                    AND timestamp_field_0 < TIMESTAMP_ADD(TIMESTAMP('{end_date}'), INTERVAL 1 DAY)
                    GROUP BY date_str
                    ORDER BY date_str ASC
                """
                label_suffix = "(Aggregated)"
            else:
                # RAW QUERY: 1min
                # UPGRADED LIMIT to 50000
                # BROAD MATCHING: Use LIKE with root_symbol
                query = f"""
                    SELECT 
                        FORMAT_TIMESTAMP('%Y-%m-%d %H:%M:%S', timestamp_field_0) as date_str,
                        open, high, low, close, volume
                    FROM `{table_id}`
                    WHERE contract LIKE '%{root_symbol}%'
                    AND timestamp_field_0 >= TIMESTAMP('{start_date}') 
                    AND timestamp_field_0 < TIMESTAMP_ADD(TIMESTAMP('{end_date}'), INTERVAL 1 DAY)
                    ORDER BY timestamp_field_0 ASC
                    LIMIT 50000 
                """
                label_suffix = "(Raw 1min)"
            
            query_job = GLOBAL_STATE["bq_client"].query(query)
            rows = list(query_job.result())
            
            if rows:
                bq_data = []
                for row in rows:
                    bq_data.append({
                        "date": row.date_str,
                        "open": float(row.open),
                        "high": float(row.high),
                        "low": float(row.low),
                        "close": float(row.close),
                        "volume": float(row.volume) if row.volume is not None else 0.0
                    })
                bq_df = pd.DataFrame(bq_data)
                logger.info(f"✅ Hybrid: BQ returned {len(bq_df)} rows for {bq_symbol}.")
                source_label = f"BigQuery {label_suffix}"
            else:
                logger.info(f"⚠️ Hybrid: BQ returned 0 rows for {bq_symbol} (Root: {root_symbol}). Fallback to JQ.")

        except Exception as e:
            logger.error(f"❌ Hybrid: BigQuery Error: {e}")

    # --- PHASE 2: GAP DETECTION & JQDATA FILL ---
    jq_df = pd.DataFrame()
    needs_jq = True
    jq_start_date = start_date

    if not bq_df.empty:
        last_bq_date_str = bq_df.iloc[-1]['date']
        try:
            if ' ' in str(last_bq_date_str):
                last_bq_dt = datetime.datetime.strptime(str(last_bq_date_str), "%Y-%m-%d %H:%M:%S")
            else:
                last_bq_dt = datetime.datetime.strptime(str(last_bq_date_str), "%Y-%m-%d")
            
            req_end_dt = datetime.datetime.strptime(end_date, "%Y-%m-%d")
            
            if last_bq_dt.date() >= req_end_dt.date():
                needs_jq = False
            else:
                jq_start_date = (last_bq_dt + datetime.timedelta(days=1)).strftime("%Y-%m-%d")
                logger.info(f"🔄 Hybrid: Gap Detected. JQData needed from {jq_start_date}...")
        except Exception as e:
            logger.warning(f"⚠️ Hybrid: Date check failed ({e}). Force checking JQ.")
            pass

    # JQData Fallback / Fill
    if needs_jq and JQ_AVAILABLE:
        try:
            if not jq.is_auth():
                if payload.username and payload.password:
                    jq.auth(payload.username, payload.password)
            
            if jq.is_auth():
                logger.info(f"📡 Hybrid: Fetching JQData from {jq_start_date}...")
                jq_freq = '1m' if frequency in ['1m', 'minute'] else 'daily'
                df = jq.get_price(security=symbol, start_date=jq_start_date, end_date=end_date, frequency=jq_freq)
                if not df.empty:
                    df = df.reset_index()
                    df.columns = df.columns.str.lower()
                    if 'index' in df.columns:
                        df = df.rename(columns={'index': 'date'})
                    df['date'] = df['date'].astype(str)
                    jq_df = df[['date', 'open', 'high', 'low', 'close', 'volume']]
                    logger.info(f"✅ Hybrid: JQData returned {len(jq_df)} rows.")
        except Exception as e:
            logger.error(f"❌ Hybrid: JQData Error: {e}")

    # --- PHASE 3: FUSION ---
    final_df = pd.DataFrame()
    
    if not bq_df.empty and not jq_df.empty:
        final_df = pd.concat([bq_df, jq_df])
        final_df = final_df.drop_duplicates(subset=['date'], keep='last')
        final_df = final_df.sort_values(by='date')
        source_label = f"Hybrid (BQ {label_suffix} + JQ)"
    elif not bq_df.empty:
        final_df = bq_df
    elif not jq_df.empty:
        final_df = jq_df
        source_label = "JQData (Live Only)"
    
    if final_df.empty:
        return {"success": False, "error": "No data found in BQ or JQ for this range."}

    result_data = final_df.to_dict(orient='records')
    
    return {
        "success": True, 
        "data": result_data, 
        "source": source_label,
        "rows": len(result_data)
    }

# Keep legacy endpoint for compatibility
@app.post("/api/jqdata/price")
def get_price_legacy(payload: PriceRequest):
    return get_hybrid_price(payload)

@app.post("/api/te/proxy")
def proxy_te(payload: ProxyRequest):
    url = f"https://api.tradingeconomics.com/{payload.endpoint}?c={payload.apiKey}&f=json"
    try:
        res = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=15)
        if res.status_code == 200:
            return {"success": True, "data": res.json()}
        return {"success": False, "status": res.status_code, "error": res.text[:200]}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/usda/proxy")
def proxy_usda(payload: ProxyRequest):
    url = f"https://apps.fas.usda.gov/psdonline/api/psd/{payload.endpoint}"
    headers = {"API_KEY": payload.apiKey}
    try:
        res = requests.get(url, headers=headers, timeout=20, verify=False)
        if res.ok: return {"success": True, "data": res.json()}
        return {"success": False, "status": res.status_code}
    except Exception as e: return {"success": False, "error": str(e)}

@app.get("/api/usda/quickstats")
def proxy_usda_quickstats(request: Request):
    url = "https://quickstats.nass.usda.gov/api/api_GET"
    try:
        params = dict(request.query_params)
        res = requests.get(url, params=params, timeout=20, verify=False)
        if res.ok:
            try: return {"success": True, "data": res.json()}
            except: return {"success": False, "data": res.text}
        return {"success": False, "status": res.status_code}
    except Exception as e: return {"success": False, "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    logger.info(f"🚀 QuantAgrify Hybrid Backend Starting on Port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
