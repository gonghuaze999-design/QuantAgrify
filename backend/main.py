
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
    GEE_IMPORTED = True
except ImportError:
    GEE_IMPORTED = False
    logger.error("❌ earthengine-api or google-auth not installed.")

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
    "active_project": None,
    "jq_ready": JQ_AVAILABLE
}

# Scope needed for Earth Engine REST API
GEE_SCOPES = ['https://www.googleapis.com/auth/earthengine']

def attempt_gee_connection(creds_json: Optional[Dict] = None) -> bool:
    """
    Connect to Google Earth Engine.
    Uses 'try/except' aggressively to prevent server crashes.
    """
    global GLOBAL_STATE
    
    if not GEE_IMPORTED:
        GLOBAL_STATE["gee_error"] = "Library 'earthengine-api' missing."
        return False

    credentials = None
    project_id = None

    try:
        # Step 1: Resolve Credentials
        if creds_json:
            # Hot Swap
            logger.info("🔑 GEE: Using provided JSON credentials...")
            credentials = Credentials.from_service_account_info(creds_json, scopes=GEE_SCOPES)
            project_id = creds_json.get('project_id')
        
        elif os.environ.get("GEE_SERVICE_ACCOUNT"):
            # Env Var
            logger.info("🔑 GEE: Found GEE_SERVICE_ACCOUNT env var...")
            try:
                service_account_info = json.loads(os.environ.get("GEE_SERVICE_ACCOUNT"))
                credentials = Credentials.from_service_account_info(service_account_info, scopes=GEE_SCOPES)
                project_id = service_account_info.get('project_id')
            except json.JSONDecodeError:
                error_msg = "GEE_SERVICE_ACCOUNT is not valid JSON."
                logger.error(f"❌ {error_msg}")
                GLOBAL_STATE["gee_error"] = error_msg
                return False
        else:
            # Local Default
            logger.info("🔑 GEE: Attempting local default credentials...")
            try:
                ee.Initialize()
                GLOBAL_STATE["gee_ready"] = True
                GLOBAL_STATE["gee_error"] = None
                GLOBAL_STATE["active_project"] = "Local Default"
                logger.info("✅ GEE: Connected via Local Auth.")
                return True
            except Exception as e:
                # If local fails and no service account, we just can't connect.
                # But we don't crash the server.
                logger.warning(f"⚠️ GEE Local Auth failed: {e}")
                GLOBAL_STATE["gee_error"] = "No credentials provided and local auth failed."
                return False

        # Step 2: Initialize Earth Engine
        if credentials:
            # We skip explicit token refresh here to avoid blocking startup.
            # ee.Initialize will handle auth.
            logger.info(f"🌍 GEE: Initializing (Project: {project_id})...")
            ee.Initialize(credentials=credentials, project=project_id)
            
            GLOBAL_STATE["gee_ready"] = True
            GLOBAL_STATE["gee_error"] = None
            GLOBAL_STATE["active_project"] = project_id
            logger.info("✅ GEE: Initialization COMPLETE.")
            return True

    except Exception as e:
        logger.error(f"❌ GEE Critical Failure: {str(e)}")
        GLOBAL_STATE["gee_ready"] = False
        GLOBAL_STATE["gee_error"] = str(e)
        return False
    
    return False


# --- 5. APP LIFESPAN ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Try to connect, but don't block/fail app if it errors
    try:
        logger.info("🟢 System Startup...")
        attempt_gee_connection()
    except Exception as e:
        logger.error(f"⚠️ Startup Error (Non-Fatal): {e}")
    yield
    logger.info("🔴 System Shutdown.")

# Set Current Version - UPDATED TO 2.9.5-LTS
CURRENT_VERSION = "2.9.5-STABLE-LTS"

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
    buffer_radius: int = 50000 # 50km
    
    # Time Windows for CHART (Full Season)
    full_season_start: str 
    full_season_end: str
    
    # Time Windows for IMAGE (Selected Stage)
    stage_start: str
    stage_end: str
    
    compare_year: int # e.g. 2023 (Last Year) or 2022
    target_year: int # e.g. 2024 (Current Year)

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
        "mode": "STRICT_ROBUST",
        "global_state": GLOBAL_STATE
    }

@app.get("/health")
def health_check():
    """Simple health check for monitoring systems."""
    return {"status": "ok"}

@app.post("/api/gee/status")
def check_gee_status(payload: GeeStatusRequest):
    credentials_loaded = False
    
    if payload.credentials:
        logger.info("🔄 API Trigger: Hot Swapping Credentials...")
        success = attempt_gee_connection(payload.credentials)
        if success:
            credentials_loaded = True
        else:
            return {
                "success": False, 
                "status": "AUTH_FAILED", 
                "error": GLOBAL_STATE["gee_error"]
            }

    if not GLOBAL_STATE["gee_ready"]:
         return {
             "success": False, 
             "status": "NOT_CONFIGURED", 
             "error": GLOBAL_STATE["gee_error"] or "Not Authenticated"
         }
         
    try:
        t0 = time.time()
        # Lightweight check
        val = ee.Number(1).getInfo() 
        lat = (time.time() - t0) * 1000
        
        return {
            "success": True,
            "status": "ONLINE",
            "latency_ms": round(lat, 2),
            "response": {"value": val},
            "project": GLOBAL_STATE["active_project"],
            "backend_version": CURRENT_VERSION,
            "credentials_loaded": credentials_loaded
        }
    except Exception as e:
        logger.error(f"GEE Runtime Check Failed: {e}")
        GLOBAL_STATE["gee_ready"] = False
        GLOBAL_STATE["gee_error"] = f"Runtime Error: {str(e)}"
        return {"success": False, "status": "ERROR", "error": str(e)}

@app.post("/api/gee/analyze")
def analyze_satellite_data(payload: GeeAnalysisRequest):
    start_time = time.time()
    
    if not GLOBAL_STATE["gee_ready"]:
        raise HTTPException(
            status_code=503, 
            detail=f"GEE Not Ready: {GLOBAL_STATE.get('gee_error', 'Unknown Error')}"
        )

    try:
        # 1. Define ROI (50km Radius)
        point = ee.Geometry.Point([payload.lon, payload.lat])
        aoi = point.buffer(payload.buffer_radius)

        # 2. Date Setup
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

        # 3. Load Land Cover for Masking (ESA WorldCover 10m)
        worldcover = ee.ImageCollection("ESA/WorldCover/v200").first()
        cropland_mask = worldcover.select('Map').eq(40).clip(aoi)
        
        # 4. Processing Chain - SPLIT INTO VISUAL (RAW) AND ANALYTICS (MASKED)
        
        def process_common_clouds(image):
            # Cloud Masking (Sentinel-2 QA60) - Applied to ALL images
            qa = image.select('QA60')
            cloud_bit_mask = 1 << 10
            cirrus_bit_mask = 1 << 11
            mask = qa.bitwiseAnd(cloud_bit_mask).eq(0).And(qa.bitwiseAnd(cirrus_bit_mask).eq(0))
            return image.updateMask(mask).divide(10000).copyProperties(image, ["system:time_start"])

        # Base Collection (Cloud Masked Only, UNMASKED LAND) - For RGB Thumbnails
        s2_visual = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED') \
            .filterBounds(aoi) \
            .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 15)) \
            .map(process_common_clouds)

        # Analytics Collection (Cropland Masked + NDVI) - For Charts/Stats
        def process_analytics_bands(image):
            # Apply Cropland Mask here
            final_masked = image.updateMask(cropland_mask)
            # Compute NDVI
            ndvi = final_masked.normalizedDifference(['B8', 'B4']).rename('NDVI')
            return final_masked.addBands(ndvi)

        s2_analytics = s2_visual.map(process_analytics_bands)

        # 5. Chart Data Extraction (Full Season) - USES s2_analytics (Masked)
        # UPDATED: Use Histogram/Mode instead of Mean
        def get_stats(image):
            # To get mode of floats, we scale to int (x10000), get mode, then divide back.
            ndvi_scaled = image.select('NDVI').multiply(10000).int()
            
            stats = ndvi_scaled.reduceRegion(
                reducer=ee.Reducer.mode().combine(
                    reducer2=ee.Reducer.count(),
                    sharedInputs=True
                ), 
                geometry=aoi,
                scale=1000, # 1km scale for speed/mode aggregation
                maxPixels=1e9,
                bestEffort=True
            )
            
            raw_mode = stats.get('NDVI_mode')
            
            return ee.Feature(None, {
                'date': image.date().format('YYYY-MM-dd'),
                'ndvi': raw_mode, 
                'count': stats.get('NDVI_count'),
                'millis': image.date().millis()
            })

        logger.info(f"⏳ Computing Chart: {t_season_start} to {t_season_end}")
        
        target_fc = s2_analytics.filterDate(t_season_start, t_season_end).map(get_stats).getInfo()
        compare_fc = s2_analytics.filterDate(c_season_start, c_season_end).map(get_stats).getInfo()

        # 6. Image Generation (Specific Stage - True Color RGB) - USES s2_visual (Unmasked)
        vis_params = {
            'min': 0.0,
            'max': 0.3,
            'bands': ['B4', 'B3', 'B2'], # True Color
            'dimensions': 800, # Higher resolution for detailed map
            'region': aoi,
            'format': 'png'
        }
        
        def get_thumb(start, end):
            try:
                # Median composite handles overlaps/clouds
                # Using s2_visual (unmasked cropland)
                img = s2_visual.filterDate(start, end).median().clip(aoi)
                return img.getThumbURL(vis_params)
            except Exception as e:
                logger.warning(f"Thumb gen failed for {start}: {e}")
                return None

        target_url = get_thumb(t_stage_start, t_stage_end)
        compare_url = get_thumb(c_stage_start, c_stage_end)

        # 7. Helper to Parse Results
        def extract_points(feature_collection):
            points = []
            if 'features' in feature_collection:
                for f in feature_collection['features']:
                    props = f['properties']
                    val = props.get('ndvi')
                    count = props.get('count')
                    if val is not None and count is not None and count > 100: 
                        points.append({
                            'date': props['date'],
                            'ndvi': float(val) / 10000.0,  # DIVIDE BACK TO FLOAT
                            'timestamp': props['millis']
                        })
            points.sort(key=lambda x: x['date'])
            return points

        data_target = extract_points(target_fc)
        data_compare = extract_points(compare_fc)

        return {
            "success": True,
            "meta": {
                "asset": payload.asset_name,
                "radius": "50km",
                "mask": "Cropland (Charts Only)",
                "visuals": "Raw RGB (Unmasked)",
                "algo": "NDVI Histogram Mode",
                "cloud_limit": "15%",
                "stage_window": f"{payload.stage_start} to {payload.stage_end}",
                "execution_time": round(time.time() - start_time, 2),
            },
            "images": {
                "target_year_url": target_url,
                "compare_year_url": compare_url
            },
            "chart_data": {
                "target_year": data_target,
                "compare_year": data_compare
            }
        }

    except ee.EEException as e:
        logger.error(f"❌ GEE API Error: {e}")
        raise HTTPException(status_code=502, detail=f"GEE API Error: {str(e)}")
    except Exception as e:
        tb = traceback.format_exc()
        logger.error(f"❌ Internal Server Error: {tb}")
        raise HTTPException(status_code=500, detail=f"Internal Error: {str(e)}\n\nTraceback: {tb}")


@app.post("/api/jqdata/auth")
def auth_jq(payload: JQAuthRequest):
    if not JQ_AVAILABLE:
        raise HTTPException(status_code=501, detail="JQData SDK not installed.")
    try:
        jq.auth(payload.username, payload.password)
        q_count = jq.get_query_count()
        return {
            "success": True, 
            "status": "Authenticated", 
            "data_limit": q_count.get('total', 0), 
            "remaining": q_count.get('spare', 0)
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/jqdata/price")
def get_price(payload: PriceRequest):
    if not JQ_AVAILABLE:
        raise HTTPException(status_code=501, detail="JQData SDK not installed.")
    
    # Inner helper to perform the actual SDK call
    def perform_fetch():
        # Check if we have specific dates. 
        # JQ SDK Logic: If end_date and count are both present, count usually wins or logic is complex.
        # We prefer using specific range if start_date is provided.
        if payload.start_date and payload.end_date:
            return jq.get_price(
                security=payload.symbol, 
                start_date=payload.start_date,
                end_date=payload.end_date,
                frequency=payload.frequency or 'daily'
            )
        else:
            # Default to recent history if no dates provided
            return jq.get_price(
                security=payload.symbol, 
                count=payload.count or 100, 
                end_date=datetime.datetime.now(), 
                frequency=payload.frequency or 'daily'
            )

    try:
        # First attempt: Check state or login
        if not jq.is_auth():
            if payload.username and payload.password:
                jq.auth(payload.username, payload.password)
            else:
                return {"success": False, "error": "JQData: Not logged in & no credentials provided"}
        
        df = perform_fetch()
        
    except Exception as e:
        # Retry Logic: JQ sessions can be kicked or expire.
        err_msg = str(e)
        logger.warning(f"JQ First Attempt Failed: {err_msg}. Attempting robust re-auth...")
        
        if payload.username and payload.password:
            try:
                # Force auth regardless of current state
                jq.auth(payload.username, payload.password)
                df = perform_fetch()
            except Exception as e2:
                return {"success": False, "error": f"JQ Retry Failed: {str(e2)}. Check JQ concurrency limits."}
        else:
             return {"success": False, "error": f"JQ Error (No Creds to Retry): {err_msg}"}

    if df.empty:
        return {"success": False, "error": "No Data Found for Symbol/Date Range"}

    data = []
    for idx, row in df.iterrows():
        data.append({
            "date": idx.strftime("%Y-%m-%d"),
            "open": float(row['open']),
            "high": float(row['high']),
            "low": float(row['low']),
            "close": float(row['close']),
            "volume": float(row['volume']),
            "open_interest": float(row['open_interest']) if 'open_interest' in row else 0.0
        })
    return {"success": True, "data": data}

@app.post("/api/te/proxy")
def proxy_te(payload: ProxyRequest):
    url = f"https://api.tradingeconomics.com/{payload.endpoint}?c={payload.apiKey}&f=json"
    try:
        if CFFI_AVAILABLE:
            res = cffi_requests.get(url, impersonate="chrome120", timeout=15)
        else:
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
        if res.ok:
            return {"success": True, "data": res.json()}
        return {"success": False, "status": res.status_code, "error": res.text[:100]}
    except Exception as e:
        return {"success": False, "error": str(e)}

# --- NEW ROUTE: USDA QUICKSTATS GET PROXY ---
@app.get("/api/usda/quickstats")
def proxy_usda_quickstats(request: Request):
    """
    Proxy for USDA NASS QuickStats GET API.
    Used by ApiConsole for the 'USDA QuickStats' preset.
    """
    url = "https://quickstats.nass.usda.gov/api/api_GET"
    try:
        # Pass all query parameters from the frontend request to USDA
        params = dict(request.query_params)
        # Verify=False needed as USDA NASS certs sometimes fail in Python requests
        res = requests.get(url, params=params, timeout=20, verify=False)
        
        if res.ok:
            try:
                return {"success": True, "data": res.json()}
            except:
                # Fallback if API returns non-JSON success (rare but possible)
                return {"success": False, "data": res.text, "error": "Invalid JSON from USDA"}
        
        return {
            "success": False, 
            "status": res.status_code, 
            "error": res.text[:200]
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    logger.info(f"🚀 QuantAgrify Backend Starting on Port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
