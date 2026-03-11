'use server';

import { db } from "@/lib/db";
import { paperBalances } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getPaperBalance() {
  try {
    const result = await db.select().from(paperBalances).where(eq(paperBalances.asset, 'USDT'));
    return result[0]?.balance || 0;
  } catch (error) {
    console.error("Failed to fetch paper balance:", error);
    return 0;
  }
}
