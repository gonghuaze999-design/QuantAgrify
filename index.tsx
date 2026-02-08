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