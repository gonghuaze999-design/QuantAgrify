
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LoginView } from './LoginView';
import { WelcomeHub } from './WelcomeHub';
import { DataSourceConfig } from './DataSourceConfig';
import { WeatherAnalysis } from './WeatherAnalysis';
import { FuturesTrading } from './FuturesTrading';
import { SupplyDemand } from './SupplyDemand';
import { PolicySentiment } from './PolicySentiment';
import { SpotIndustry } from './SpotIndustry';
import { CustomUpload } from './CustomUpload';
import { AlgorithmWorkflow } from './AlgorithmWorkflow';
import { FeatureEngineering } from './FeatureEngineering';
import { MultiFactorFusion } from './MultiFactorFusion';
import { RiskControl } from './RiskControl';
import { ModelIteration } from './ModelIteration';
import { AnalysisCockpit } from './AnalysisCockpit';
import { InDepthAnalytics } from './InDepthAnalytics';
import { BacktestEngine } from './BacktestEngine';
import { RiskManagement } from './RiskManagement';
import { PortfolioAssets } from './PortfolioAssets';
import { ApiConsole } from './ApiConsole';
import { ApiDocs } from './ApiDocs';
import { ApiLogs } from './ApiLogs';
import { UserManagement } from './UserManagement';
import { SystemLogStream } from './GlobalState';

// --- SYSTEM INTERCEPTORS (Non-Invasive Telemetry) ---
const setupSystemInterceptors = () => {
    // 1. Console Interceptor
    // Capture internal logs from existing components without changing their code
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = (...args) => {
        try {
            // Filter out noisy React dev warnings or HMR logs if needed
            const msg = args.map(String).join(' ');
            if (!msg.includes('[HMR]') && !msg.includes('wds')) {
                SystemLogStream.push({
                    type: 'INFO',
                    module: 'Console',
                    action: 'Log',
                    message: msg.substring(0, 300) // Truncate for list view
                });
            }
        } catch (e) {} // Prevent recursion
        originalLog.apply(console, args);
    };

    console.warn = (...args) => {
        try {
            SystemLogStream.push({
                type: 'WARNING',
                module: 'Console',
                action: 'Warn',
                message: args.map(String).join(' ')
            });
        } catch (e) {}
        originalWarn.apply(console, args);
    };

    console.error = (...args) => {
        try {
            SystemLogStream.push({
                type: 'ERROR',
                module: 'Console',
                action: 'Error',
                message: args.map(String).join(' ')
            });
        } catch (e) {}
        originalError.apply(console, args);
    };

    // 2. Network Interceptor (Fetch API)
    // Capture all API calls made by DataSource, FuturesTrading, etc.
    try {
        const originalFetch = window.fetch;
        
        const interceptedFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
            const method = init?.method || 'GET';
            const urlStr = String(input);
            
            // Filter: Only log internal API calls or key external data sources to avoid clutter
            const isSignificant = urlStr.includes('api/') || urlStr.includes('jqdata') || urlStr.includes('open-meteo');

            if (isSignificant) {
                SystemLogStream.push({
                    type: 'INFO',
                    module: 'Network',
                    action: 'Request',
                    message: `${method} ${urlStr}`,
                    // Try to parse body for payload visibility
                    payload: init?.body ? (typeof init.body === 'string' && init.body.startsWith('{') ? JSON.parse(init.body) : init.body) : undefined
                });
            }

            try {
                const response = await originalFetch(input, init);
                
                if (isSignificant) {
                    // Clone response to read body without consuming the stream for the app
                    const clone = response.clone();
                    
                    // Process asynchronously to not block UI thread
                    clone.text().then(text => {
                        let payload: any = text;
                        try { 
                            payload = JSON.parse(text); 
                            // If payload is huge (e.g. 5000 array items), summary it
                            if (payload && typeof payload === 'object' && payload.data && Array.isArray(payload.data) && payload.data.length > 20) {
                                const sample = payload.data.slice(0, 3);
                                payload = { 
                                    ...payload, 
                                    data: `[Array(${payload.data.length}) - Sample: ${JSON.stringify(sample)}...]` 
                                };
                            }
                        } catch(e) {}
                        
                        SystemLogStream.push({
                            type: response.ok ? 'SUCCESS' : 'ERROR',
                            module: 'Network',
                            action: 'Response',
                            message: `Status ${response.status} from ${urlStr}`,
                            payload: payload
                        });
                    });
                }
                return response;
            } catch (err: any) {
                 if (isSignificant) {
                     SystemLogStream.push({
                        type: 'ERROR',
                        module: 'Network',
                        action: 'Failed',
                        message: `Network Error: ${err.message}`,
                     });
                 }
                 throw err;
            }
        };

        // Try direct assignment first
        try {
            window.fetch = interceptedFetch;
        } catch (err) {
            // Fallback: Use Object.defineProperty if direct assignment fails (e.g. getter-only property)
            Object.defineProperty(window, 'fetch', {
                value: interceptedFetch,
                writable: true,
                configurable: true
            });
        }

    } catch (e) {
        console.warn("QuantAgrify: Network monitoring initialization failed. Fetch logs unavailable.", e);
    }
};

// Initialize Interceptors
setupSystemInterceptors();

const QuantAgrifyApp = () => {
  const [currentView, setCurrentView] = useState<'login' | 'hub' | 'dataSource' | 'weatherAnalysis' | 'futuresTrading' | 'supplyDemand' | 'policySentiment' | 'spotIndustry' | 'customUpload' | 'algorithm' | 'featureEngineering' | 'multiFactorFusion' | 'riskControl' | 'modelIteration' | 'cockpit' | 'inDepthAnalytics' | 'backtestEngine' | 'riskManagement' | 'portfolioAssets' | 'api' | 'apiDocs' | 'apiLogs' | 'userMgmt'>('login');

  const handleNavigate = (view: typeof currentView) => {
    setCurrentView(view);
  };

  return (
    <div className="antialiased overflow-hidden">
      {currentView === 'login' && (
        <LoginView onLoginSuccess={() => setCurrentView('hub')} />
      )}
      
      {currentView === 'hub' && (
        <WelcomeHub onNavigate={handleNavigate} />
      )}

      {currentView === 'dataSource' && (
        <DataSourceConfig onNavigate={handleNavigate} />
      )}

      {currentView === 'weatherAnalysis' && (
        <WeatherAnalysis onNavigate={handleNavigate} />
      )}

      {currentView === 'futuresTrading' && (
        <FuturesTrading onNavigate={handleNavigate} />
      )}

      {currentView === 'supplyDemand' && (
        <SupplyDemand onNavigate={handleNavigate} />
      )}

      {currentView === 'policySentiment' && (
        <PolicySentiment onNavigate={handleNavigate} />
      )}

      {currentView === 'spotIndustry' && (
        <SpotIndustry onNavigate={handleNavigate} />
      )}

      {currentView === 'customUpload' && (
        <CustomUpload onNavigate={handleNavigate} />
      )}

      {currentView === 'algorithm' && (
        <AlgorithmWorkflow onNavigate={handleNavigate} />
      )}

      {currentView === 'featureEngineering' && (
        <FeatureEngineering onNavigate={handleNavigate} />
      )}

      {currentView === 'multiFactorFusion' && (
        <MultiFactorFusion onNavigate={handleNavigate} />
      )}

      {currentView === 'riskControl' && (
        <RiskControl onNavigate={handleNavigate} />
      )}

      {currentView === 'modelIteration' && (
        <ModelIteration onNavigate={handleNavigate} />
      )}

      {currentView === 'cockpit' && (
        <AnalysisCockpit onNavigate={handleNavigate} />
      )}

      {currentView === 'inDepthAnalytics' && (
        <InDepthAnalytics onNavigate={handleNavigate} />
      )}

      {currentView === 'backtestEngine' && (
        <BacktestEngine onNavigate={handleNavigate} />
      )}

      {currentView === 'riskManagement' && (
        <RiskManagement onNavigate={handleNavigate} />
      )}

      {currentView === 'portfolioAssets' && (
        <PortfolioAssets onNavigate={handleNavigate} />
      )}

      {currentView === 'api' && (
        <ApiConsole onNavigate={handleNavigate} />
      )}

      {currentView === 'apiDocs' && (
        <ApiDocs onNavigate={handleNavigate} />
      )}

      {currentView === 'apiLogs' && (
        <ApiLogs onNavigate={handleNavigate} />
      )}

      {currentView === 'userMgmt' && (
        <UserManagement onNavigate={handleNavigate} />
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<QuantAgrifyApp />);
