// QuantAgrify Core Data Interfaces (Typescript)
// Phase 1: Data Contract Definition

/**
 * 1. 数据源与因子 (Data Source & Factor)
 */
export interface Factor {
  id: string;
  name: string;
  category: 'Weather' | 'Futures' | 'SupplyDemand' | 'PolicySentiment' | 'SpotIndustry' | 'Custom';
  description: string;
  lastUpdated: string;
  correlationToTarget: number; // 与目标资产的相关性
}

export interface CustomUploadConfig {
  fileName: string;
  fileType: 'CSV' | 'JSON' | 'XLSX' | 'GEOJSON';
  sizeMB: number;
  status: 'Validated' | 'Parsing' | 'Error';
  fieldMapping: {
    sourceColumn: string;
    targetType: 'Timestamp' | 'Factor' | 'Region' | 'Other';
  }[];
}

/**
 * 2. 算法策略与工作流 (Strategy Pipeline)
 */
export interface PipelineNode {
  id: string;
  type: 'Source' | 'Transformation' | 'Fusion' | 'RiskControl' | 'Model';
  name: string;
  status: 'Verified' | 'Pending' | 'Error';
  config: Record<string, any>; // 节点配置参数
}

export interface StrategyPipeline {
  id: string;
  name: string;
  version: string;
  asset: string; // 目标资产，如 Soybean Futures
  layers: PipelineNode[];
}

/**
 * 3. 回测与绩效指标 (Backtest Metrics)
 */
export interface BacktestMetrics {
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number; // 最大回撤 (百分比)
  calmarRatio: number;
  totalReturn: number; // 总回报 (百分比)
  annualizedReturn: number; // 年化回报 (百分比)
  winRate: number; // 胜率 (百分比)
  pnlAttribution: PnLAttribution[];
  monthlyReturns: { year: number, returns: number[] }[]; // 月度收益数据
}

export interface PnLAttribution {
  factor: string; // 归因因子，如 Weather, Macro, Flow
  contribution: number; // 贡献度 (百分比)
  color: string; // 可视化颜色
}

/**
 * 4. 风险管理 (Risk Management)
 */
export interface VaRResult {
  confidenceLevel: number; // 置信水平，如 99%
  dailyVaR: number; // 日 VaR (百分比)
  weeklyVaR: number; // 周 VaR (百分比)
  monthlyVaR: number; // 月 VaR (百分比)
}

export interface MarginUtilization {
  exchange: string; // 交易所，如 CBOT, ICE
  utilization: number; // 保证金利用率 (百分比)
  limit: number; // 限制 (百分比)
  status: 'Normal' | 'Warning' | 'Critical';
}

export interface RiskLimit {
  maxDrawdownLimit: number; // 最大回撤限制 (百分比)
  concentrationLimit: number; // 集中度限制 (百分比)
  activeEnforcement: boolean;
}

/**
 * 5. 资产组合 (Portfolio Assets)
 */
export interface AssetAllocation {
  asset: string; // 资产名称，如 Corn (ZC)
  percentage: number; // 占比 (百分比)
  value: number; // 资产价值
  color: string;
}

export interface PortfolioSummary {
  totalNetLiquidity: number;
  availableMargin: number;
  settledCash: number;
  allocation: AssetAllocation[];
  navTrend: { date: string, value: number }[]; // 净资产价值趋势
}

/**
 * 6. API 状态与日志 (API Status & Logs)
 */
export interface ApiEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'DEL';
  description: string;
  authentication: boolean;
}

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  source: string;
  message: string;
}
