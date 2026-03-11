import { NextResponse } from 'next/server';
import ccxt from 'ccxt';
import { getPairData } from '@/lib/market';
import { runBacktest, BacktestConfig } from '@/lib/backtest';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const assetA = searchParams.get('a') || 'BTC/USDT';
  const assetB = searchParams.get('b') || 'ETH/USDT';
  const timeframe = searchParams.get('tf') || '1h';
  const limit = parseInt(searchParams.get('limit') || '500');
  
  const config: BacktestConfig = {
    lookback: parseInt(searchParams.get('lookback') || '100'),
    upperThreshold: parseFloat(searchParams.get('upper') || '2.0'),
    lowerThreshold: parseFloat(searchParams.get('lower') || '-2.0'),
    exitThreshold: parseFloat(searchParams.get('exit') || '0.5'),
    initialBalance: parseFloat(searchParams.get('balance') || '10000'),
    tradingFee: parseFloat(searchParams.get('fee') || '0.001'),
  };

  try {
    const exchange = new ccxt.binance();
    
    // 1. ดึงข้อมูลประวัติราคา
    const { pricesA, pricesB } = await getPairData(exchange, assetA, assetB, timeframe, limit);
    
    // 2. รัน Backtest
    const results = runBacktest(pricesA, pricesB, config);

    return NextResponse.json({
      pair: `${assetA} vs ${assetB}`,
      config,
      ...results
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
