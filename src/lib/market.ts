import { getExchangeClient } from './exchange';

/**
 * ดึงข้อมูลราคาปิด (OHLCV) ของคู่สินทรัพย์ 2 ชนิด
 */
export async function getPairData(
  exchange: any, 
  symbolA: string, 
  symbolB: string, 
  timeframe: string = '1h', 
  limit: number = 100
) {
  const [ohlcvA, ohlcvB] = await Promise.all([
    exchange.fetchOHLCV(symbolA, timeframe, undefined, limit),
    exchange.fetchOHLCV(symbolB, timeframe, undefined, limit),
  ]);

  const pricesA = ohlcvA.map((d: any) => d[4]);
  const pricesB = ohlcvB.map((d: any) => d[4]);

  return { pricesA, pricesB };
}

/**
 * ดึงข้อมูลราคาปิด (OHLCV) ของหลายเหรียญพร้อมกัน (Parallel)
 */
export async function getMultipleOHLCV(
  exchange: any, 
  symbols: string[], 
  timeframe: string = '1h', 
  limit: number = 100
) {
  const results = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const ohlcv = await exchange.fetchOHLCV(symbol, timeframe, undefined, limit);
        return { 
            symbol, 
            prices: ohlcv.map((d: any) => d[4]) 
        };
      } catch (e) {
        console.error(`Error fetching ${symbol}:`, e);
        return null;
      }
    })
  );
  
  // กรองเอาเฉพาะข้อมูลที่ไม่เป็น null
  return results.filter((r): r is { symbol: string; prices: number[] } => r !== null);
}
