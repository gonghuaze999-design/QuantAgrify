
# QuantAgrify System Snapshot (v3.3.0-almost)

**Timestamp:** System Freeze - Post Currency Synchronization
**Status:** **PRODUCTION READY - STABLE**

## 1. Latest Updates (v3.3.0-almost)
This snapshot solidifies the "Global Currency Context" upgrade. The system now supports dynamic switching between **USD ($)** and **CNY (¥)** across the entire simulation lifecycle.

### Key Features Fixed
*   **Global State Persistence:** Currency selection in `PortfolioAssets` now persists in the `GLOBAL_EXCHANGE` engine config.
*   **Cross-Module Synchronization:**
    *   **Portfolio Assets:** Configuration entry point.
    *   **Analysis Cockpit:** Real-time equity and PnL display.
    *   **Risk Management:** VaR and Drawdown calculations.
    *   **In-Depth Analytics:** Performance attribution metrics.
*   **Simulation Mode:** Users can toggle currency freely in Simulation/Training modes (Real mode remains locked to broker feed).

## 2. Architecture Overview
*   **Core Engine:** `SimulationEngine.ts` (VirtualExchange) now holds the `baseCurrency` state.
*   **Frontend:** React components subscribe to engine status updates (200ms-1000ms polling) to reflect currency changes instantly without page reloads.

## 3. Backend Middleware (`backend/main.py`)
*   **Status:** Stable (v2.9.5-LTS).
*   **Services:** GEE Proxy, JQData Bridge, CORS Handling active.

## 4. Deployment Notes
*   **Version:** v3.3.0-almost
*   **Target:** Web (Responsive Desktop/Tablet).
*   **State:** All modules (DataSource, Algorithm, Cockpit, Risk, Assets) are integrated and consistent.

---
*Snapshot v3.3.0-almost created by Lead Architect.*
