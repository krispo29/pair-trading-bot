import ccxt from 'ccxt';

/**
 * ส่งคำสั่งเทรดแบบ Limit Order พร้อมระบบป้องกัน Slippage
 * @param exchange ตัวจัดการ exchange
 * @param symbol สัญลักษณ์เหรียญ (เช่น BTC/USDT)
 * @param side ฝั่งการเทรด ('buy' | 'sell')
 * @param amount จำนวนเหรียญ
 * @param maxSlippagePercent เปอร์เซ็นต์ slippage สูงสุดที่ยอมรับได้ (ค่าเริ่มต้น 0.1%)
 */
export async function executeLimitTrade(
  exchange: any, 
  symbol: string, 
  side: 'buy' | 'sell', 
  amount: number,
  maxSlippagePercent: number = 0.001 
) {
  // 1. ดึงข้อมูล Order Book ล่าสุด (ความลึก 5 แถว)
  const orderBook = await exchange.fetchOrderBook(symbol, 5);
  
  const bestBid = orderBook.bids[0][0]; // ราคารับซื้อสูงสุด
  const bestAsk = orderBook.asks[0][0]; // ราคาเสนอขายต่ำสุด
  
  // 2. คำนวณ Spread ของ Order Book (ความห่างระหว่าง Bid/Ask)
  const bookSpreadPercent = (bestAsk - bestBid) / bestBid;

  // 3. ป้องกัน Slippage: หากช่องว่างราคากว้างเกินไป ให้ระงับออเดอร์
  if (bookSpreadPercent > maxSlippagePercent) {
    throw new Error(`[Slippage Protection] ${symbol} spread wide: ${(bookSpreadPercent * 100).toFixed(3)}% > ${(maxSlippagePercent * 100).toFixed(3)}%`);
  }

  // 4. กำหนดราคา Limit Order เพื่อให้แมตช์ทันที (Immediate-or-Cancel style)
  // ซื้อที่ราคาขาย (Ask) หรือ ขายที่ราคารับซื้อ (Bid) เพื่อล็อกต้นทุนสูงสุดไว้
  const limitPrice = side === 'buy' ? bestAsk : bestBid;

  // 5. ส่งคำสั่ง Limit Order
  const order = await exchange.createLimitOrder(symbol, side, amount, limitPrice);
  
  return {
    id: order.id,
    price: order.price || limitPrice,
    amount: order.amount,
    status: order.status
  };
}
