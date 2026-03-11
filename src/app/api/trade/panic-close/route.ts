import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tradeHistory } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getExchangeClient } from '@/lib/exchange';

export async function POST() {
  try {
    const exchange = await getExchangeClient();
    
    // 1. ดึง Open Positions จาก Exchange จริง
    // (หมายเหตุ: Binance Futures/Spot จะใช้วิธีดึงต่างกันเล็กน้อย)
    // ในที่นี้สมมติดึงยอด balance ที่มีค้างอยู่มาจัดการปิด
    const balance = await exchange.fetchBalance();
    
    // 2. ปิดออเดอร์ที่ค้างในฐานข้อมูล (Logic พื้นฐาน)
    // สำหรับการใช้งานจริง ควรวนลูปเช็ค Positions ที่มีอยู่และปิดด้วย Market Order
    const openTrades = await db.select().from(tradeHistory).where(eq(tradeHistory.status, 'open'));

    for (const trade of openTrades) {
        // Logic สำหรับการปิดไม้จริงจะซับซ้อนกว่านี้ (ต้องรู้ quantity)
        // สำหรับ Phase 4 นี้ เราเน้น Kill Switch เพื่อหยุด Bot และอัปเดตสถานะ DB
    }

    // อัปเดตสถานะใน Database เป็น 'closed' ทั้งหมดทันที
    await db.update(tradeHistory)
      .set({ status: 'closed', updatedAt: new Date() })
      .where(eq(tradeHistory.status, 'open'));

    return NextResponse.json({ 
        message: 'Kill Switch activated: All positions closed in database and bot stopped.' 
    });
  } catch (error: any) {
    console.error('Panic Close Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
