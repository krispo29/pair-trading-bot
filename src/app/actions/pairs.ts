'use server';

import { db } from "@/lib/db";
import { tradingPairs, zScoreHistory, tradeHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * ลบคู่เหรียญออกจากระบบ
 */
export async function deletePair(id: number) {
  try {
    // 1. ลบประวัติ Z-Score และประวัติเทรดที่เกี่ยวข้องก่อน (ถ้ามี FK constraint)
    await db.delete(zScoreHistory).where(eq(zScoreHistory.pairId, id));
    await db.delete(tradeHistory).where(eq(tradeHistory.pairId, id));
    
    // 2. ลบคู่เหรียญ
    await db.delete(tradingPairs).where(eq(tradingPairs.id, id));

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Delete pair error:", error);
    return { success: false, message: error.message };
  }
}
