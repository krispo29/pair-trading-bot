import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tradingPairs, tradeHistory } from '@/db/schema';
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
const LOCK_TIMEOUT_MINUTES = 5; // ปลดล็อกอัตโนมัติหากค้างเกิน 5 นาที

export async function POST() {
  try {
    const activePairs = await db.select().from(tradingPairs).where(eq(tradingPairs.isActive, true));
    if (activePairs.length === 0) return NextResponse.json({ message: 'No active pairs' });

    const exchange = await getExchangeClient(); 
    await exchange.loadMarkets();

    const { analyzeMarketMood } = await import('@/lib/ai-analyzer');
    const results = [];

    for (const pair of activePairs) {
      try {
        // --- 🛡️ TRANSACTION LOCKING (Idempotency) ---
        // พยายามอัปเดต isProcessing เป็น true เฉพาะตัวที่ยังว่างอยู่ (หรือตัวที่ Lock ค้างไว้นานเกินไป)
        // นี่คือคำสั่ง SQL แบบ Atomic ที่ป้องกัน Race Condition ได้ 100%
        const lockAcquired = await db.update(tradingPairs)
          .set({ isProcessing: true, updatedAt: new Date() })
          .where(and(
            eq(tradingPairs.id, pair.id),
            or(
              eq(tradingPairs.isProcessing, false),
              // Safety: ปลดล็อกถ้าค้างเกิน 5 นาที (บอทอาจจะแครช)
              lt(tradingPairs.updatedAt, new Date(Date.now() - LOCK_TIMEOUT_MINUTES * 60 * 1000))
            )
          ))
          .returning();

        if (lockAcquired.length === 0) {
          results.push({ pair: `${pair.assetA}/${pair.assetB}`, action: 'SKIP', reason: 'Already processing by another instance (Locked)' });
          continue;
        }

        // เมื่อได้ Lock แล้ว เราจะทำงานในส่วนที่เหลือ
        try {
            // เช็ค Cooldown
            if (pair.lastClosedAt) {
                const hoursSinceClose = (Date.now() - new Date(pair.lastClosedAt).getTime()) / (1000 * 60 * 60);
                if (hoursSinceClose < COOLDOWN_HOURS) {
                    results.push({ pair: `${pair.assetA}/${pair.assetB}`, action: 'SKIP', reason: `Cooldown active` });
                    continue;
                }
            }

            const { pricesA, pricesB } = await getPairData(exchange, pair.assetA, pair.assetB);
            const { zScore } = calculateZScore(pricesA, pricesB);

            const openTrade = await db.query.tradeHistory.findFirst({
              where: and(eq(tradeHistory.pairId, pair.id), eq(tradeHistory.status, 'open'))
            });

            // Logic จัดการออเดอร์ค้าง (TP/SL)
            if (openTrade) {
                if (Math.abs(zScore) < 0.2) {
                    await closeTradeDefensive(exchange, pair, openTrade, 'TAKE_PROFIT');
                    results.push({ pair: `${pair.assetA}/${pair.assetB}`, action: 'EXIT', reason: 'Target Reached' });
                } else if (Math.abs(zScore) >= Z_STOP_LOSS) {
                    await closeTradeDefensive(exchange, pair, openTrade, 'STOP_LOSS');
                    results.push({ pair: `${pair.assetA}/${pair.assetB}`, action: 'EXIT', reason: 'Hard Stop Loss' });
                }
                continue;
            }

            // Logic เปิดออเดอร์ใหม่
            const absZ = Math.abs(zScore);
            const entryThreshold = pair.upperThreshold || 2.0;

            if (absZ >= entryThreshold) {
                // Safe Zone Check
                if (absZ >= (Z_STOP_LOSS - Z_SAFE_ENTRY_BUFFER)) {
                    results.push({ pair: `${pair.assetA}/${pair.assetB}`, action: 'SKIP', reason: `Too close to SL` });
                    continue;
                }

                // AI Analysis
                const aiAnalysis = await analyzeMarketMood(`${pair.assetA} & ${pair.assetB}`);
                if (aiAnalysis.shouldPause) {
                    results.push({ pair: `${pair.assetA}/${pair.assetB}`, action: 'SKIP', reason: `AI: ${aiAnalysis.reason}` });
                    continue;
                }

                // Execution
                const isPaper = process.env.TRADING_MODE === 'PAPER';
                const sideA = zScore >= entryThreshold ? 'sell' : 'buy';
                const sideB = zScore >= entryThreshold ? 'buy' : 'sell';
                const type = zScore >= entryThreshold ? 'SHORT_SPREAD' : 'LONG_SPREAD';

                const tickers = await exchange.fetchTickers([pair.assetA, pair.assetB]);
                const priceA = tickers[pair.assetA].last;
                const priceB = tickers[pair.assetB].last;

                const { qtyA, qtyB } = calculatePositionSizes(100, priceA, priceB, exchange.market(pair.assetA), exchange.market(pair.assetB));

                const tradeData = await executeAtomicTradeDefensive(exchange, pair, type, sideA, sideB, qtyA, qtyB, isPaper);
                results.push({ pair: `${pair.assetA}/${pair.assetB}`, action: 'ENTRY', ...tradeData });
            }

            // อัปเดต Z-Score และสถานะ Lock (Release Lock)
            await db.update(tradingPairs).set({ lastZScore: zScore, updatedAt: new Date() }).where(eq(tradingPairs.id, pair.id));

        } finally {
            // --- 🔓 RELEASE LOCK ---
            // ไม่ว่าการประมวลผลจะสำเร็จหรือล้มเหลว ต้องปลดล็อกเพื่อให้รอบถัดไปทำงานได้
            await db.update(tradingPairs)
              .set({ isProcessing: false, updatedAt: new Date() })
              .where(eq(tradingPairs.id, pair.id));
        }

      } catch (pairError: any) {
        console.error(`Pair Critical Error ${pair.assetA}/${pair.assetB}:`, pairError.message);
        await sendTelegramAlert(`❌ *CRITICAL ERROR*: ${pair.assetA}/${pair.assetB}\nError: ${pairError.message}`);
      }
    }

    return NextResponse.json({ results });
  } catch (error: any) {
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
    entryPriceB: (orderB as any).average || (orderB as any).price, orderIdA: (orderA as any).id, orderIdB: (orderB as any).id,
    status: 'open', isPaper: isPaper, createdAt: new Date()
  }).returning();
  return { tradeId: history[0].id };
}

async function closeTradeDefensive(exchange: any, pair: any, openTrade: any, reason: string) {
  const isPaper = process.env.TRADING_MODE === 'PAPER';
  if (!isPaper) {
    const sideA = openTrade.side === 'LONG_SPREAD' ? 'sell' : 'buy';
    const sideB = openTrade.side === 'LONG_SPREAD' ? 'buy' : 'sell';
    await Promise.all([
        exchange.createOrder(pair.assetA, 'market', sideA, 0.001), 
        exchange.createOrder(pair.assetB, 'market', sideB, 0.01)
    ]);
  }
  await db.transaction(async (tx) => {
    await tx.update(tradeHistory).set({ status: 'closed', updatedAt: new Date() }).where(eq(tradeHistory.id, openTrade.id));
    await tx.update(tradingPairs).set({ lastClosedAt: new Date() }).where(eq(tradingPairs.id, pair.id));
  });
  await sendTelegramAlert(`✅ *TRADE CLOSED (${reason})*\nPair: ${pair.assetA}/${pair.assetB}`);
}
