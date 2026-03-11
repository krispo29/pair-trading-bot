import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  
  // เช็คว่า Vercel เป็นคนส่งมาจริงไหม (CRON_SECRET จะถูกส่งมาใน Header อัตโนมัติจาก Vercel)
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // เรียกใช้ Logic การเทรดผ่าน API ภายใน
    // ใช้ NEXT_PUBLIC_APP_URL จาก Env ถ้าไม่มีให้ใช้ localhost (สำหรับทดสอบ)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // เรียกไปที่ api/trade เพื่อคำนวณ Z-Score และเปิด/ปิด ออเดอร์
    const res = await fetch(`${baseUrl}/api/trade`, { 
        method: 'GET',
        cache: 'no-store' // ป้องกันการดึง Cache
    });
    
    const data = await res.json();

    return NextResponse.json({ 
        success: true, 
        timestamp: new Date().toISOString(),
        bot_results: data 
    });
  } catch (error: any) {
    console.error('Cron Execution Error:', error);
    return NextResponse.json({ 
        success: false, 
        error: error.message 
    }, { status: 500 });
  }
}
