import ccxt from 'ccxt';
import { decrypt } from './encryption';
import { db } from '@/db/index';
import { exchangeConfig } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * ดึงการตั้งค่า Exchange จาก Database และสร้าง Client
 * @param exchangeId ชื่อ exchange เช่น 'binance'
 */
export async function getExchangeClient(exchangeId: string = 'binance') {
  // 1. ดึง config จาก DB
  const config = await db.query.exchangeConfig.findFirst({
    where: eq(exchangeConfig.exchangeId, exchangeId),
  });

  if (!config) {
    // ถ้าไม่มีใน DB ให้ลองใช้จาก .env (สำหรับการทดสอบ)
    if (process.env.BINANCE_API_KEY && process.env.BINANCE_SECRET) {
      return new ccxt.binance({
        apiKey: process.env.BINANCE_API_KEY,
        secret: process.env.BINANCE_SECRET,
        options: { adjustForTimeDifference: true },
      });
    }
    throw new Error(`Exchange config for ${exchangeId} not found in database or env`);
  }

  // 2. ถอดรหัส API Key และ Secret
  const apiKey = decrypt(config.encryptedApiKey);
  const secret = decrypt(config.encryptedSecret);

  // 3. สร้าง CCXT Client (รองรับ Dynamic Exchange)
  // @ts-ignore
  const exchangeClass = ccxt[exchangeId];
  if (!exchangeClass) throw new Error(`Exchange ${exchangeId} not supported by CCXT`);

  const exchange = new exchangeClass({
    apiKey,
    secret,
    enableRateLimit: true,
    options: { adjustForTimeDifference: true },
  });

  return exchange;
}
