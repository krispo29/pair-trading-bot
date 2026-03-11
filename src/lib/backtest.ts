import { calculateZScore } from './math';

export interface BacktestConfig {
  lookback: number;
  upperThreshold: number;
  lowerThreshold: number;
  exitThreshold: number;
  initialBalance: number;
  tradingFee: number; // e.g., 0.001 for 0.1%
}

export interface TradeSimulation {
  type: 'LONG_SPREAD' | 'SHORT_SPREAD';
  entryIndex: number;
  exitIndex: number;
  entryZScore: number;
  exitZScore: number;
  entryPriceA: number;
  entryPriceB: number;
  exitPriceA: number;
  exitPriceB: number;
  pnl: number;
  pnlPercent: number;
}

export function runBacktest(
  pricesA: number[],
  pricesB: number[],
  config: BacktestConfig
) {
  const { lookback, upperThreshold, lowerThreshold, exitThreshold, initialBalance, tradingFee } = config;
  const trades: TradeSimulation[] = [];
  const zScores: number[] = [];
  
  let currentPosition: {
    type: 'LONG_SPREAD' | 'SHORT_SPREAD';
    entryIndex: number;
    entryZScore: number;
    entryPriceA: number;
    entryPriceB: number;
  } | null = null;

  // วนลูปเริ่มจากจุดที่ข้อมูลเพียงพอสำหรับ Lookback
  for (let i = lookback; i < pricesA.length; i++) {
    // ดึงข้อมูลย้อนหลังตาม Lookback Window
    const sliceA = pricesA.slice(i - lookback, i + 1);
    const sliceB = pricesB.slice(i - lookback, i + 1);
    
    const { zScore } = calculateZScore(sliceA, sliceB);
    zScores.push(zScore);

    if (!currentPosition) {
      // เช็คจุดเข้า (Entry)
      if (zScore > upperThreshold) {
        // Short Spread: Sell A, Buy B
        currentPosition = {
          type: 'SHORT_SPREAD',
          entryIndex: i,
          entryZScore: zScore,
          entryPriceA: pricesA[i],
          entryPriceB: pricesB[i],
        };
      } else if (zScore < lowerThreshold) {
        // Long Spread: Buy A, Sell B
        currentPosition = {
          type: 'LONG_SPREAD',
          entryIndex: i,
          entryZScore: zScore, entryPriceA: pricesA[i],
          entryPriceB: pricesB[i],
        };
      }
    } else {
      // เช็คจุดออก (Exit)
      const isExit = Math.abs(zScore) < exitThreshold;
      
      if (isExit || i === pricesA.length - 1) {
        const entryPriceA = currentPosition.entryPriceA;
        const entryPriceB = currentPosition.entryPriceB;
        const exitPriceA = pricesA[i];
        const exitPriceB = pricesB[i];
        
        let pnlPercent = 0;
        
        if (currentPosition.type === 'LONG_SPREAD') {
          // Long A (Buy low, Sell high), Short B (Sell high, Buy low)
          const pnlA = (exitPriceA - entryPriceA) / entryPriceA;
          const pnlB = (entryPriceB - exitPriceB) / entryPriceB;
          pnlPercent = (pnlA + pnlB) - (tradingFee * 4); // 4 fees: Entry A/B, Exit A/B
        } else {
          // Short A (Sell high, Buy low), Long B (Buy low, Sell high)
          const pnlA = (entryPriceA - exitPriceA) / entryPriceA;
          const pnlB = (exitPriceB - entryPriceB) / entryPriceB;
          pnlPercent = (pnlA + pnlB) - (tradingFee * 4);
        }

        trades.push({
          type: currentPosition.type,
          entryIndex: currentPosition.entryIndex,
          exitIndex: i,
          entryZScore: currentPosition.entryZScore,
          exitZScore: zScore,
          entryPriceA,
          entryPriceB,
          exitPriceA,
          exitPriceB,
          pnl: initialBalance * (pnlPercent / 2), // สมมติแบ่งเงินคนละ 50%
          pnlPercent: pnlPercent * 100,
        });

        currentPosition = null;
      }
    }
  }

  // คำนวณ Metrics
  const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
  const winTrades = trades.filter(t => t.pnl > 0);
  const winRate = trades.length > 0 ? (winTrades.length / trades.length) * 100 : 0;
  
  return {
    summary: {
      totalPnL,
      totalPnLPercent: (totalPnL / initialBalance) * 100,
      tradesCount: trades.length,
      winRate,
      finalBalance: initialBalance + totalPnL,
    },
    trades,
    zScores: zScores.map((v, i) => ({ time: i, value: v })), // สำหรับแสดงกราฟแบบง่าย
  };
}
