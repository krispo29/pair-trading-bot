export interface TradePair {
  id: number;
  assetA: string;
  assetB: string;
  isActive: boolean;
  upperThreshold: number;
  lowerThreshold: number;
  lastZScore: number | null;
  updatedAt: Date | null;
}

export interface TradeHistoryEntry {
  id: number;
  pairId: number | null;
  side: string;
  entryPriceA: number | null;
  entryPriceB: number | null;
  status: string | null;
  pnl: number | null;
  createdAt: Date | null;
}

export type TradeSide = 'long_spread' | 'short_spread';
export type TradeStatus = 'open' | 'closed';
