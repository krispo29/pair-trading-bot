'use server';

import { db } from "@/lib/db";
import { tradingPairs } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * เปิด/ปิด สถานะการทำงานของบอทเฉพาะคู่เหรียญ
 */
export async function togglePairStatus(id: number, currentStatus: boolean) {
  try {
    const newStatus = !currentStatus;
    
    await db.update(tradingPairs)
      .set({ isActive: newStatus, updatedAt: new Date() })
      .where(eq(tradingPairs.id, id));

    revalidatePath("/dashboard");
    return { success: true, isActive: newStatus };
  } catch (error: any) {
    console.error("Toggle pair error:", error);
    return { success: false, message: error.message };
  }
}

/**
 * เปิดการทำงานของบอททุกตัวพร้อมกัน
 */
export async function toggleAllPairs(active: boolean) {
  try {
    await db.update(tradingPairs)
      .set({ isActive: active, updatedAt: new Date() });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Toggle all error:", error);
    return { success: false, message: error.message };
  }
}
