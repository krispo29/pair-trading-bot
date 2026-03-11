import { NextResponse } from 'next/server';
import ccxt from 'ccxt';
import { calculateCorrelation, getCorrelationAdvice } from '@/lib/math';
import { getMultipleOHLCV } from '@/lib/market';
import { calculateADFTest } from '@/lib/cointegration';

// รายการเหรียญที่ต้องการสแกน (Top Coins)
const ASSETS_TO_SCAN = [
  'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 
  'ADA/USDT', 'XRP/USDT', 'AVAX/USDT', 'DOT/USDT',
  'MATIC/USDT', 'LINK/USDT', 'LTC/USDT', 'BCH/USDT'
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const timeframe = searchParams.get('tf') || '1h';
  const limit = parseInt(searchParams.get('limit') || '100');
  const minCorrelation = parseFloat(searchParams.get('min_corr') || '0.85');

  const exchange = new ccxt.binance({
    options: { adjustForTimeDifference: true }
  });
  
  try {
    // 1. ดึงข้อมูลราคาของทุกเหรียญที่กำหนดแบบ Parallel
    const marketData = await getMultipleOHLCV(exchange, ASSETS_TO_SCAN, timeframe, limit);
    
    const potentialPairs = [];

    // 2. วนลูปเปรียบเทียบทุกคู่ที่เป็นไปได้ (Pairwise Comparison)
    for (let i = 0; i < marketData.length; i++) {
      for (let j = i + 1; j < marketData.length; j++) {
        const assetA = marketData[i];
        const assetB = marketData[j];

        // 1. คำนวณความสัมพันธ์ (Correlation)
        const correlation = calculateCorrelation(assetA.prices, assetB.prices);

        // 2. กรองด่านที่ 1: Correlation ต้องสูงตามเงื่อนไข (เช่น > 0.85)
        if (correlation >= minCorrelation) {
          // 3. กรองด่านที่ 2: ADF Test เพื่อหา Cointegration (Stationarity of Spread)
          const adfResult = calculateADFTest(assetA.prices, assetB.prices);

          if (adfResult.isCointegrated) {
            const advice = getCorrelationAdvice(correlation);
            potentialPairs.push({
              pair: `${assetA.symbol} vs ${assetB.symbol}`,
              assetA: assetA.symbol,
              assetB: assetB.symbol,
              correlation,
              hedgeRatio: adfResult.hedgeRatio,
              tStat: adfResult.tStat,
              status: 'COINTEGRATED',
              advice: advice.advice
            });
          }
        }
      }
    }

    // 4. เรียงลำดับตามความสัมพันธ์จากมากไปน้อย
    const sortedPairs = potentialPairs.sort((a, b) => b.correlation - a.correlation);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      timeframe,
      lookback_period: limit,
      scanCount: ASSETS_TO_SCAN.length,
      foundCount: sortedPairs.length,
      results: sortedPairs
    });

  } catch (error: any) {
    console.error('Scanner Error:', error);
    return NextResponse.json({ 
        status: 'Error', 
        message: error.message 
    }, { status: 500 });
  }
}
