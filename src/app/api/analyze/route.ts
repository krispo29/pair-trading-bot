import { NextResponse } from 'next/server';
import ccxt from 'ccxt';
import { getPairData } from '@/lib/market';
import { calculateZScore, calculateCorrelation, getCorrelationAdvice } from '@/lib/math';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const assetA = searchParams.get('a') || 'BTC/USDT';
  const assetB = searchParams.get('b') || 'ETH/USDT';
  const timeframe = searchParams.get('tf') || '1h';
  const limit = parseInt(searchParams.get('limit') || '100');

  try {
    const exchange = new ccxt.binance({
        options: { adjustForTimeDifference: true }
    }); 
    
    // 1. ดึงข้อมูลราคา
    const { pricesA, pricesB } = await getPairData(exchange, assetA, assetB, timeframe, limit);
    
    // 2. คำนวณ Z-Score และ Correlation
    const analysis = calculateZScore(pricesA, pricesB);
    const correlation = calculateCorrelation(pricesA, pricesB);
    const correlationAdvice = getCorrelationAdvice(correlation);

    // 3. วิเคราะห์สัญญาณเบื้องต้น
    let signal = 'WAIT';
    // เฉพาะคู่ที่ Correlation สูงเท่านั้นที่จะให้สัญญาณ
    if (correlation >= 0.80) {
      if (analysis.zScore >= 2.0) {
          signal = 'SHORT SPREAD (Sell A, Buy B)';
      } else if (analysis.zScore <= -2.0) {
          signal = 'LONG SPREAD (Buy A, Sell B)';
      }
    } else {
      signal = 'WAIT (Correlation too low)';
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      pair: `${assetA} vs ${assetB}`,
      timeframe,
      lookback_period: limit,
      correlation: {
        value: correlation,
        ...correlationAdvice
      },
      ...analysis,
      signal
    });
  } catch (error: any) {
    console.error('Analysis Error:', error);
    return NextResponse.json({ 
        status: 'Error', 
        message: error.message 
    }, { status: 500 });
  }
}
