'use server';

import { db } from "@/lib/db";
import { paperBalances } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * เติมเงินสมมติ (Paper Balance) เข้าสู่ระบบ
 * @param amount จำนวนเงินที่จะเติม
 */
export async function topUpPaperBalance(amount: number) {
  try {
    if (amount <= 0) throw new Error("Amount must be greater than 0");

    // อัปเดตยอดเงินแบบ Atomic (ใช้ SQL increment)
    const result = await db
      .insert(paperBalances)
      .values({
        asset: "USDT",
        balance: amount,
      })
      .onConflictDoUpdate({
        target: paperBalances.asset,
        set: {
          balance: sql`${paperBalances.balance} + ${amount}`,
          updatedAt: new Date(),
        },
      })
      .returning();

    // ล้าง cache ของหน้า settings เพื่อให้ข้อมูลแสดงเป็นค่าล่าสุด
    revalidatePath("/dashboard/settings/paper-trade");
    
    return { 
        success: true, 
        message: `Success! Added $${amount.toLocaleString()} to your virtual wallet.`,
        currentBalance: result[0].balance
    };
  } catch (error: any) {
    console.error("Top up error:", error);
    return { 
        success: false, 
        message: error.message || "Failed to update virtual balance." 
    };
  }
}

/**
 * กำหนดยอดเงินสมมติเป็นตัวเลขที่ระบุ
 */
export async function setPaperBalance(amount: number) {
    try {
        if (amount < 0) throw new Error("Amount cannot be negative");

        const result = await db
          .insert(paperBalances)
          .values({
            asset: "USDT",
            balance: amount,
          })
          .onConflictDoUpdate({
            target: paperBalances.asset,
            set: {
              balance: amount,
              updatedAt: new Date(),
            },
          })
          .returning();
    
        revalidatePath("/dashboard/settings/paper-trade");
        return { 
            success: true, 
            message: `Virtual wallet set to $${amount.toLocaleString()}.`,
            currentBalance: result[0].balance 
        };
      } catch (error: any) {
        return { success: false, message: error.message || "Failed to set wallet." };
      }
}

/**
 * รีเซ็ตยอดเงินสมมติเป็นค่าเริ่มต้น ($10,000)
 */
export async function resetPaperBalance() {
    try {
        await db
          .insert(paperBalances)
          .values({
            asset: "USDT",
            balance: 10000,
          })
          .onConflictDoUpdate({
            target: paperBalances.asset,
            set: {
              balance: 10000,
              updatedAt: new Date(),
            },
          });
    
        revalidatePath("/dashboard/settings/paper-trade");
        return { success: true, message: "Virtual wallet reset to $10,000." };
      } catch (error: any) {
        return { success: false, message: "Failed to reset wallet." };
      }
}
