export type IndexSymbol = 'NIFTY' | 'BANKNIFTY' | 'FINNIFTY' | 'SENSEX' | 'BANKEX';

export interface LotSizes {
  NIFTY: number;
  BANKNIFTY: number;
  FINNIFTY: number;
  SENSEX: number;
  BANKEX: number;
  [key: string]: number | undefined;
}

export type OptionType = 'CE' | 'PE';
export type TradeType = 'LIVE' | 'PAPER';

/** Predefined strategies for Paper Trading */
export const PAPER_STRATEGIES = [
  'Trend Following',
  'Breakout Buy',
  'Breakout Sell',
  'Support & Resistance',
  'Iron Condor',
  'Bull Call Spread',
  'Bear Put Spread',
  'Straddle',
  'Strangle',
  'Covered Call',
  'Scalping',
  'Swing Trade',
  'News-Based Trade',
  'Gap Fill',
  'VWAP Reversal',
] as const;

export interface Trade {
  id: string;
  date: string; // ISO format string or YYYY-MM-DD
  symbol: string;
  strike: number;
  optionType: OptionType;
  entryPremium: number;
  exitPremium?: number; // Optional if active / open trade
  quantity: number;
  stopLossPremium: number;
  targetPremium: number;
  netPL?: number; // Calculated field: (exitPremium - entryPremium) * quantity
  notes?: string;
  status: 'OPEN' | 'WIN' | 'LOSS' | 'BREAKEVEN';
  tradeType?: TradeType; // 'LIVE' (default) or 'PAPER'
  strategy?: string;     // Optional strategy label (for paper trades primarily)
}

export interface AppSettings {
  capital: number;
  dailyRiskPercent: number;
  maxRiskPerTradePercent: number;
  lotSizes: LotSizes;
}

export interface ValidationChecklist {
  riskWithinLimit: boolean;
  dailyLossLimitNotExceeded: boolean;
  riskRewardValid: boolean;
  quantityValid: boolean;
  stopLossPresent: boolean;
  passed: boolean;
}
