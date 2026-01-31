export interface UserPreferences {
  id: string;
  user_id: string;
  risk_profile: 'conservative' | 'moderate' | 'aggressive';
  investment_horizon: 'short' | 'medium' | 'long';
  preferred_sectors: string[];
  created_at: string;
  updated_at: string;
}

export interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  description: string;
  initial_capital: number;
  created_at: string;
  updated_at: string;
}

export interface Stock {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  exchange: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  portfolio_id: string;
  stock_id: string;
  transaction_type: 'buy' | 'sell';
  quantity: number;
  price: number;
  fees: number;
  transaction_date: string;
  notes: string;
  created_at: string;
  stock?: Stock;
}

export interface StockPrice {
  id: string;
  stock_id: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  created_at: string;
}

export interface PortfolioSnapshot {
  id: string;
  portfolio_id: string;
  snapshot_date: string;
  total_value: number;
  cash_balance: number;
  total_return: number;
  created_at: string;
}

export interface Holding {
  stock: Stock;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalCost: number;
  currentValue: number;
  unrealizedGain: number;
  unrealizedGainPercent: number;
  weight: number;
}

export interface PortfolioMetrics {
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;
  cagr: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  beta: number;
  holdings: Holding[];
  sectorAllocation: { sector: string; value: number; percentage: number }[];
}

export interface Recommendation {
  type: 'buy' | 'sell' | 'hold' | 'rebalance';
  symbol: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  action?: string;
}
