import { NextResponse } from 'next/server';
import ccxt from 'ccxt';

export async function GET() {
  try {
    // ทดสอบดึง Balance เบื้องต้น (ใช้ Key จาก .env ตรงๆ ในขั้นตอนนี้เพื่อทดสอบการเชื่อมต่อ)
    const exchange = new ccxt.binance({
      apiKey: process.env.BINANCE_API_KEY,
      secret: process.env.BINANCE_SECRET,
    });
    
    // ดึง balance เฉพาะ USDT
    const balance = await exchange.fetchBalance();
    
    return NextResponse.json({ 
      status: 'Connected', 
      exchange: 'binance',
      totalUSDT: (balance.total as any)['USDT'] || 0
    });
  } catch (error: any) {
    console.error('Health Check Error:', error);
    return NextResponse.json({ 
      status: 'Error', 
      message: error.message 
    }, { status: 500 });
  }
}
