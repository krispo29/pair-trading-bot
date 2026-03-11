import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tradingPairs } from '@/db/schema';
import { revalidatePath } from 'next/cache';

/**
 * API สำหรับเพิ่มคู่เหรียญเข้าระบบแบบ Manual
 * Body: { assetA: "BTC/USDT", assetB: "ETH/USDT", upper: 2.0, lower: -2.0 }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { assetA, assetB, upper, lower } = body;

    if (!assetA || !assetB) {
      return NextResponse.json({ error: 'Missing assetA or assetB' }, { status: 400 });
    }

    const newPair = await db.insert(tradingPairs).values({
      assetA,
      assetB,
      isActive: true, // เปิดใช้งานทันที
      upperThreshold: upper || 2.0,
      lowerThreshold: lower || -2.0,
      updatedAt: new Date()
    }).returning();

    revalidatePath('/dashboard');
    
    return NextResponse.json({ 
      message: 'Pair added successfully',
      pair: newPair[0] 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
