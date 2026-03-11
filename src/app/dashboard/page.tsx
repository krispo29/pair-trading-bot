import { db } from '@/lib/db';
import { tradingPairs, tradeHistory, zScoreHistory } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getPaperBalance } from '@/app/actions/get-balance';
import DashboardClient from '@/components/DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // 1. ดึงข้อมูลจาก Neon DB แบบ Server-side สำหรับ Initial Load
  const pairs = await db.select().from(tradingPairs);
  const paperBalanceValue = await getPaperBalance();
  const recentTrades = await db.select()
    .from(tradeHistory)
    .orderBy(desc(tradeHistory.createdAt))
    .limit(5);

  const activePairs = pairs.filter(p => p.isActive);

  // ดึงประวัติ Z-Score สำหรับทุกคู่ที่ active
  const chartsData = await Promise.all(activePairs.map(async (pair) => {
    const history = await db.select()
      .from(zScoreHistory)
      .where(eq(zScoreHistory.pairId, pair.id))
      .orderBy(desc(zScoreHistory.createdAt))
      .limit(50);
    
    return {
      pairId: pair.id,
      assetA: pair.assetA,
      assetB: pair.assetB,
      data: history.map(h => ({
        time: Math.floor(new Date(h.createdAt!).getTime() / 1000),
        value: h.zScore
      })).reverse()
    };
  }));

  const initialData = {
    pairs,
    paperBalanceValue,
    recentTrades,
    chartsData
  };

  return <DashboardClient initialData={initialData} />;
}
