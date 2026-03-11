import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tradingPairs, tradeHistory, zScoreHistory, paperBalances } from '@/db/schema';
import { eq, and, or, lt, sql } from 'drizzle-orm';
import { getExchangeClient } from '@/lib/exchange';
import { getPairData } from '@/lib/market';
import { calculateZScore, checkCointegration } from '@/lib/math';
import { calculatePositionSizes } from '@/lib/trading';
import { sendTelegramAlert } from '@/lib/telegram';
import { generateZScoreChartUrl } from '@/lib/chart-gen';
import { executeLimitTrade } from '@/lib/execution';

// Configuration
const Z_STOP_LOSS = 4.0;
const Z_SAFE_ENTRY_BUFFER = 0.5;
const COOLDOWN_HOURS = 1;
const SLIPPAGE_LIMIT = 0.001;
const LOCK_TIMEOUT_MINUTES = 2; // ปลดล็อกอัตโนมัติหากค้างเกิน 2 นาที (เดิม 5)

export async function GET() {
  return processTrade();
}

export async function POST() {
  return processTrade();
}

async function processTrade() {
  console.log(`\n[${new Date().toLocaleTimeString()}] 🚀 --- STARTING TRADE CYCLE ---`);
  try {
    // ปลดล็อกคู่ที่ค้างนานเกินไปก่อนเริ่มงาน
    const expiredLocks = await db.update(tradingPairs)
      .set({ isProcessing: false })
      .where(and(
        eq(tradingPairs.isProcessing, true),
        lt(tradingPairs.updatedAt, new Date(Date.now() - LOCK_TIMEOUT_MINUTES * 60 * 1000))
      ))
      .returning();
    
    if (expiredLocks.length > 0) {
        console.log(`🔓 Released ${expiredLocks.length} expired locks`);
    }

    const activePairs = await db.select().from(tradingPairs).where(eq(tradingPairs.isActive, true));
    console.log(`📊 Found ${activePairs.length} active pairs to monitor`);

    if (activePairs.length === 0) return NextResponse.json({ message: 'No active pairs' });

    const exchange = await getExchangeClient(); 
    await exchange.loadMarkets();

    const { analyzeMarketMood } = await import('@/lib/ai-analyzer');
    const results = [];

    for (const pair of activePairs) {
      console.log(`🔎 Checking ${pair.assetA}/${pair.assetB} (ID: ${pair.id})...`);
      try {
        const lockAcquired = await db.update(tradingPairs)
          .set({ isProcessing: true, updatedAt: new Date() })
          .where(and(
            eq(tradingPairs.id, pair.id),
            or(
              eq(tradingPairs.isProcessing, false),
              lt(tradingPairs.updatedAt, new Date(Date.now() - LOCK_TIMEOUT_MINUTES * 60 * 1000))
            )
          ))
          .returning();

        if (lockAcquired.length === 0) {
          console.log(`   ⚠️  SKIP: Pair is currently LOCKED by another process`);
          results.push({ pair: `${pair.assetA}/${pair.assetB}`, action: 'SKIP', reason: 'Already processing by another instance (Locked)' });
          continue;
        }

        try {
            const { pricesA, pricesB } = await getPairData(exchange, pair.assetA, pair.assetB);
            const { zScore } = calculateZScore(pricesA, pricesB);
            console.log(`   ✅ Z-Score Calculated: ${zScore.toFixed(4)}`);

            // บันทึกประวัติ Z-Score สำหรับวาดกราฟ
            const historyInsert = await db.insert(zScoreHistory).values({
              pairId: pair.id,
              zScore: zScore,
              createdAt: new Date()
            }).returning();
            
            console.log(`   💾 Saved to history (ID: ${historyInsert[0].id})`);

            const openTrade = await db.query.tradeHistory.findFirst({
              where: and(eq(tradeHistory.pairId, pair.id), eq(tradeHistory.status, 'open'))
            });

            if (openTrade) {
                console.log(`   📦 Existing position found: ${openTrade.side}`);
                if (Math.abs(zScore) < 0.2) {
                    await closeTradeDefensive(exchange, pair, openTrade, 'TAKE_PROFIT');
                    results.push({ pair: `${pair.assetA}/${pair.assetB}`, action: 'EXIT', reason: 'Target Reached' });
                } else if (Math.abs(zScore) >= Z_STOP_LOSS) {
                    await closeTradeDefensive(exchange, pair, openTrade, 'STOP_LOSS');
                    results.push({ pair: `${pair.assetA}/${pair.assetB}`, action: 'EXIT', reason: 'Hard Stop Loss' });
                }
                continue;
            }

            const absZ = Math.abs(zScore);
            const entryThreshold = pair.upperThreshold || 2.0;

            if (absZ >= entryThreshold) {
                console.log(`   🎯 Signal detected! Z=${zScore.toFixed(2)} Target=${entryThreshold}`);
                
                const isPaper = process.env.TRADING_MODE === 'PAPER';
                const marketA = exchange.market(pair.assetA);
                const marketB = exchange.market(pair.assetB);
                
                const { qtyA, qtyB } = calculatePositionSizes(
                    pair.totalBudget || 100,
                    pricesA[pricesA.length - 1],
                    pricesB[pricesB.length - 1],
                    marketA,
                    marketB
                );

                if (zScore >= entryThreshold) {
                    // Short Spread: Sell A, Buy B
                    await executeAtomicTradeDefensive(exchange, pair, 'SHORT_SPREAD', 'sell', 'buy', qtyA, qtyB, isPaper);
                    results.push({ pair: `${pair.assetA}/${pair.assetB}`, action: 'ENTRY', reason: 'Upper Threshold Reached' });
                } else {
                    // Long Spread: Buy A, Sell B
                    await executeAtomicTradeDefensive(exchange, pair, 'LONG_SPREAD', 'buy', 'sell', qtyA, qtyB, isPaper);
                    results.push({ pair: `${pair.assetA}/${pair.assetB}`, action: 'ENTRY', reason: 'Lower Threshold Reached' });
                }
            }

            await db.update(tradingPairs).set({ lastZScore: zScore, updatedAt: new Date() }).where(eq(tradingPairs.id, pair.id));

        } finally {
            await db.update(tradingPairs)
              .set({ isProcessing: false, updatedAt: new Date() })
              .where(eq(tradingPairs.id, pair.id));
            console.log(`   🔓 Lock released for ${pair.assetA}/${pair.assetB}`);
        }
      } catch (pairError: any) {
        console.error(`   ❌ Error: ${pairError.message}`);
      }
    }
    console.log(`[${new Date().toLocaleTimeString()}] ✨ CYCLE COMPLETE\n`);
    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('❌ Cycle Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ฟังก์ชันอื่นๆ (executeAtomicTradeDefensive, closeTradeDefensive) ยังคงเหมือนเดิมจาก Defensive Update ก่อนหน้า
// ผมจะใส่ไว้ให้ครบถ้วนเพื่อความสมบูรณ์ของไฟล์ครับ

async function executeAtomicTradeDefensive(exchange: any, pair: any, type: string, sideA: any, sideB: any, qtyA: number, qtyB: number, isPaper: boolean) {
  let orderA, orderB;
  if (isPaper) {
    const tickers = await exchange.fetchTickers([pair.assetA, pair.assetB]);
    orderA = { id: 'paper_a', average: tickers[pair.assetA].last };
    orderB = { id: 'paper_b', average: tickers[pair.assetB].last };

    // --- 💸 หักเงินจาก Virtual Wallet ---
    const costA = qtyA * (orderA as any).average;
    const costB = qtyB * (orderB as any).average;
    const totalCost = costA + costB;

    await db.update(paperBalances)
      .set({ 
        balance: sql`${paperBalances.balance} - ${totalCost}`,
        updatedAt: new Date() 
      })
      .where(eq(paperBalances.asset, 'USDT'));
  } else {
    try { orderA = await executeLimitTrade(exchange, pair.assetA, sideA, qtyA, SLIPPAGE_LIMIT); } 
    catch (e: any) { throw new Error(`Leg A Failed: ${e.message}`); }
    try { orderB = await executeLimitTrade(exchange, pair.assetB, sideB, qtyB, SLIPPAGE_LIMIT); } 
    catch (e: any) {
        const reverseSideA = sideA === 'buy' ? 'sell' : 'buy';
        await exchange.createOrder(pair.assetA, 'market', reverseSideA, qtyA);
        throw new Error(`Leg B Failed. Leg A Rolled Back.`);
    }
  }
  const history = await db.insert(tradeHistory).values({
    pairId: pair.id, side: type, entryPriceA: (orderA as any).average || (orderA as any).price,
    entryPriceB: (orderB as any).average || (orderB as any).price, 
    qtyA: qtyA, qtyB: qtyB,
    orderIdA: (orderA as any).id, orderIdB: (orderB as any).id,
    status: 'open', isPaper: isPaper, createdAt: new Date()
  }).returning();
  return { tradeId: history[0].id };
}

async function closeTradeDefensive(exchange: any, pair: any, openTrade: any, reason: string) {
  const isPaper = process.env.TRADING_MODE === 'PAPER';
  const qtyA = openTrade.qtyA || 0.01; // fallback if data is missing
  const qtyB = openTrade.qtyB || 0.01;

  if (!isPaper) {
    const sideA = openTrade.side === 'LONG_SPREAD' ? 'sell' : 'buy';
    const sideB = openTrade.side === 'LONG_SPREAD' ? 'buy' : 'sell';
    await Promise.all([
        exchange.createOrder(pair.assetA, 'market', sideA, qtyA), 
        exchange.createOrder(pair.assetB, 'market', sideB, qtyB)
    ]);
  } else {
    // Paper mode profit calculation and balance return
    const tickers = await exchange.fetchTickers([pair.assetA, pair.assetB]);
    const exitPriceA = tickers[pair.assetA].last;
    const exitPriceB = tickers[pair.assetB].last;

    // Simplified PnL for paper trade
    let pnl = 0;
    if (openTrade.side === 'LONG_SPREAD') {
        // Buy A, Sell B
        pnl = (exitPriceA - openTrade.entryPriceA) * qtyA + (openTrade.entryPriceB - exitPriceB) * qtyB;
    } else {
        // Sell A, Buy B
        pnl = (openTrade.entryPriceA - exitPriceA) * qtyA + (exitPriceB - openTrade.entryPriceB) * qtyB;
    }

    // Return the value to paper wallet
    const currentValA = qtyA * exitPriceA;
    const currentValB = qtyB * exitPriceB;
    
    await db.update(paperBalances)
      .set({ 
        balance: sql`${paperBalances.balance} + ${openTrade.qtyA * openTrade.entryPriceA + openTrade.qtyB * openTrade.entryPriceB} + ${pnl}`,
        updatedAt: new Date() 
      })
      .where(eq(paperBalances.asset, 'USDT'));
      
    await db.update(tradeHistory).set({ pnl: pnl }).where(eq(tradeHistory.id, openTrade.id));
  }
  await db.transaction(async (tx) => {
    await tx.update(tradeHistory).set({ status: 'closed', updatedAt: new Date() }).where(eq(tradeHistory.id, openTrade.id));
    await tx.update(tradingPairs).set({ lastClosedAt: new Date() }).where(eq(tradingPairs.id, pair.id));
  });
  await sendTelegramAlert(`✅ *TRADE CLOSED (${reason})*\nPair: ${pair.assetA}/${pair.assetB}`);
}
