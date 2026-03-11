import axios from 'axios';

// ตั้งค่า URL ของบอทที่รันอยู่ในเครื่อง
const BOT_URL = 'http://localhost:3000/api/trade';
const INTERVAL_SECONDS = 30; // ตั้งค่ากี่วินาทีให้เช็ค 1 ครั้ง (เช่น 60 = 1 นาที)

console.log('------------------------------------------');
console.log('🚀 Local Bot Worker Started...');
console.log(`⏰ Monitoring signals every ${INTERVAL_SECONDS} seconds`);
console.log(`🔗 Target: ${BOT_URL}`);
console.log('------------------------------------------');

// ฟังก์ชันสั่งรันบอท
async function triggerBot() {
    try {
        const startTime = Date.now();
        process.stdout.write(`[${new Date().toLocaleTimeString()}] 🔍 Checking signals... `);
        
        const response = await axios.get(BOT_URL);
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log(`✅ Done! (${duration}s)`);
        
        if (response.data.results && response.data.results.length > 0) {
            response.data.results.forEach(res => {
                if (res.action !== 'SKIP') {
                    console.log(`   ➔ [${res.pair}] Action: ${res.action} | Reason: ${res.reason || 'Threshold Reached'}`);
                } else {
                    // แสดงเหตุผลที่ข้ามด้วย จะได้รู้ว่าทำไม data ไม่เพิ่ม
                    console.log(`   ➔ [${res.pair}] SKIP: ${res.reason}`);
                }
            });
        } else if (response.data.message) {
            console.log(`   ➔ Info: ${response.data.message}`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

// รันทันที 1 รอบตอนเริ่ม
triggerBot();

// ตั้ง Loop การทำงาน
setInterval(triggerBot, INTERVAL_SECONDS * 1000);
