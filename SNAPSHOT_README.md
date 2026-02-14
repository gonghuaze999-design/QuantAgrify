
# QuantAgrify System Snapshot (v3.3.6 Pro)

**Timestamp:** BigQuery Integration Complete
**Status:** **PRODUCTION READY - HYBRID CLOUD**

## 1. Version Highlights (v3.3.6 Pro)
This snapshot marks the transition to a **Hybrid Data Architecture**, allowing the system to handle terabyte-scale historical data (via Google Cloud BigQuery) alongside real-time market streams.

### Core Enhancements
*   **BigQuery Native Connector:** 
    *   **Behavior:** The backend now prioritizes `Google Cloud BigQuery` for historical OHLCV data queries. It supports **External Tables** linked to GCS Buckets, enabling query-in-place for massive CSV datasets without importing them.
    *   **Fallback Logic:** If BigQuery returns no data (or connection fails), the system automatically fails over to `JQData` (Live API), ensuring zero downtime.
*   **Hive Partitioning Support:** 
    *   Recognizes folder structures in GCS (e.g., `gs://bucket/Corn/2023/*.csv`) as virtual columns, allowing efficient filtering by asset class without database restructuring.

## 2. Architecture Status
*   **Frontend Kernel:** React 18 + TypeScript. `FuturesTrading.tsx` now displays the active data source (Cloud DB vs. Live API) in the header.
*   **Data Bus:** `ApiConsole.tsx` updated with specific diagnostics for BigQuery credentials and dataset discovery.
*   **Simulation Engine:** Unchanged (Ornstein-Uhlenbeck stochastic modeling).

## 3. Backend Middleware (`backend/main.py`)
*   **Version:** v3.3.6-PRO-HYBRID
*   **Services:** 
    *   GEE Proxy (Satellite)
    *   BigQuery Client (Historical Data)
    *   JQData Bridge (Real-time Fallback)

## 4. Deployment Check
*   **Version Tag:** `3.3.6-Pro`
*   **Target:** Web / Mobile / Tablet.
*   **Integrity:** Pass.

---
*Snapshot v3.3.6 Pro created by Lead Architect.*
