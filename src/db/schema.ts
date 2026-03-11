import { pgTable, serial, text, doublePrecision, timestamp, integer, boolean } from 'drizzle-orm/pg-core';

// 1. เก็บข้อมูลคู่เทรดที่ Bot ต้องเฝ้าดู
export const tradingPairs = pgTable('trading_pairs', {
  id: serial('id').primaryKey(),
  assetA: text('asset_a').notNull(), // e.g., 'BTC/USDT'
  assetB: text('asset_b').notNull(), // e.g., 'ETH/USDT'
  isActive: boolean('is_active').default(false),
  upperThreshold: doublePrecision('upper_threshold').default(2.0), // Z-Score Sell
  lowerThreshold: doublePrecision('lower_threshold').default(-2.0), // Z-Score Buy
  totalBudget: doublePrecision('total_budget').default(100.0), // งบประมาณรวมสำหรับคู่นี้ (USD)
  lastZScore: doublePrecision('last_z_score'),
  aiReason: text('ai_reason'),
  isProcessing: boolean('is_processing').default(false), // ระบบ Lock
  lastClosedAt: timestamp('last_closed_at'), 
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 2. เก็บประวัติการเทรด
export const tradeHistory = pgTable('trade_history', {
  id: serial('id').primaryKey(),
  pairId: integer('pair_id').references(() => tradingPairs.id),
  side: text('side').notNull(), 
  entryPriceA: doublePrecision('entry_price_a'),
  entryPriceB: doublePrecision('entry_price_b'),
  qtyA: doublePrecision('qty_a'), // จำนวนที่เทรดจริงของ A
  qtyB: doublePrecision('qty_b'), // จำนวนที่เทรดจริงของ B
  orderIdA: text('order_id_a'), // เก็บ ID จาก Exchange จริง
  orderIdB: text('order_id_b'),
  status: text('status').default('open'), 
  isPaper: boolean('is_paper').default(true),
  pnl: doublePrecision('pnl'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 3. เก็บประวัติ Z-Score สำหรับวาดกราฟ
export const zScoreHistory = pgTable('z_score_history', {
  id: serial('id').primaryKey(),
  pairId: integer('pair_id').references(() => tradingPairs.id),
  zScore: doublePrecision('z_score').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 4. เก็บ API Keys ของ Exchange (ต้องมีการเข้ารหัสเสมอ!)
export const exchangeConfig = pgTable('exchange_config', {
  id: serial('id').primaryKey(),
  exchangeId: text('exchange_id').notNull(), // e.g., 'binance'
  encryptedApiKey: text('encrypted_api_key').notNull(),
  encryptedSecret: text('encrypted_secret').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 5. เก็บยอดเงินจำลอง (Paper Balance)
export const paperBalances = pgTable('paper_balances', {
  id: serial('id').primaryKey(),
  asset: text('asset').default('USDT').unique(),
  balance: doublePrecision('balance').default(10000),
  updatedAt: timestamp('updated_at').defaultNow(),
});
