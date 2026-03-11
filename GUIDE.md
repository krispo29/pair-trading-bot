# 🤖 QuantBot 2026: Pair Trading System Guide

เอกสารฉบับนี้อธิบายวิธีการใช้งานและ Flow การทำงานของระบบบอทเทรดคู่เหรียญ (Pair Trading) โดยใช้กลยุทธ์ Mean Reversion (Z-Score)

---

## 🚀 Quick Start (วิธีเริ่มใช้งาน)

### 1. การตั้งค่า Environment
- สร้างไฟล์ `.env.local` และใส่ค่าคอนฟิกที่จำเป็น:
    - `DATABASE_URL`: เชื่อมต่อกับ Neon Database (Postgres)
    - `BINANCE_API_KEY` & `BINANCE_SECRET`: สำหรับส่งคำสั่งซื้อขาย
    - `ENCRYPTION_KEY`: กุญแจ 32 ตัวอักษรสำหรับรักษาสถาพความปลอดภัยของ API Keys
    - `TELEGRAM_BOT_TOKEN` & `TELEGRAM_CHAT_ID`: สำหรับรับการแจ้งเตือน

### 2. การเตรียมฐานข้อมูล
- รันคำสั่ง `npx drizzle-kit push` เพื่อสร้าง Table ใน Database ให้พร้อมใช้งาน

### 3. การเพิ่มคู่เหรียญ (Setup Pairs)
- ไปที่หน้า **Dashboard**
- คลิกปุ่ม **"+ Add New Pair"** ในส่วนของ Pair Control
- ใส่ชื่อเหรียญที่ต้องการเทรดคู่กัน เช่น `BTC/USDT` และ `ETH/USDT`

### 4. เริ่มการทำงาน
- กดปุ่ม **"Start Bot"** ในคู่เหรียญที่ต้องการ หรือกด **"Start All Bots"** เพื่อเริ่มทำงานทุกคู่พร้อมกัน
- ระบบจะเริ่มดึงราคาล่าสุดมาคำนวณ Z-Score และแสดงผลบนกราฟ

---

## 💻 Local Execution (วิธีรันบนเครื่องตัวเอง)

หากคุณต้องการรันบอทบนเครื่อง Localhost ให้ทำงานตลอดเวลา (24/7) แนะนำให้ใช้ **PM2** เพื่อจัดการโปรเซสครับ

### 1. ติดตั้ง Library ที่จำเป็น
```bash
npm install axios
npm install -g pm2
```

### 2. สั่งรันบอทด้วย PM2 (สำหรับ Windows)
เปิด Terminal ในโฟลเดอร์โปรเจกต์แล้วรันคำสั่งเหล่านี้:

```bash
# 1. รันหน้า Dashboard
pm2 start node_modules/next/dist/bin/next --name bot-dashboard -- dev

# 2. รันตัวสะกิดเช็คสัญญาณ (Worker)
pm2 start scripts/worker.mjs --name bot-worker
```

### 3. คำสั่งที่ใช้บ่อย
- **ดูสถานะบอท:** `pm2 status`
- **ดู Logs การเทรด:** `pm2 logs bot-worker`
- **ดู Logs ของหน้าเว็บ:** `pm2 logs bot-dashboard`
- **หยุดการทำงาน:** `pm2 stop all`
- **เริ่มใหม่:** `pm2 restart all`
- **ลบบอทออก:** `pm2 delete all`

---

## 🔄 Workflow (Flow การทำงานของระบบ)

ระบบทำงานเป็นวงจร (Cycle) ดังนี้:

### 1. Market Monitoring (การเฝ้าระวัง)
- ระบบจะเรียกใช้ API `/api/trade` (ควรตั้ง Cron Job ให้รันทุก 1-5 นาที)
- ดึงราคาปิด (OHLCV) ย้อนหลัง 100 แท่งของทั้งสองเหรียญมาคำนวณ

### 2. Z-Score Calculation (การคำนวณสถิติ)
- คำนวณค่า **Spread** (ส่วนต่างราคา) ระหว่างเหรียญ A และ B
- คำนวณ **Z-Score** เพื่อดูว่า Spread ในปัจจุบันเบี่ยงเบนจากค่าเฉลี่ยมากน้อยเพียงใด
    - **Z-Score > +2.0**: เหรียญ A แพงเกินไปเมื่อเทียบกับ B (Overvalued)
    - **Z-Score < -2.0**: เหรียญ A ถูกเกินไปเมื่อเทียบกับ B (Undervalued)

### 3. Trading Logic (การตัดสินใจ)
- **Entry (เข้าออเดอร์):**
    - ถ้า `Z-Score >= 2.0`: เปิด **Short Spread** (Sell A + Buy B)
    - ถ้า `Z-Score <= -2.0`: เปิด **Long Spread** (Buy A + Sell B)
- **Exit (ปิดออเดอร์):**
    - เมื่อ `Z-Score` กลับมาใกล้ค่าเฉลี่ย (ใกล้ 0) ระบบจะปิดออเดอร์เพื่อรับกำไร (Take Profit)
    - ถ้า `Z-Score` กระโดดไปไกลเกินไป (เช่น > 4.0) ระบบจะตัดขาดทุนอัตโนมัติ (Stop Loss)

### 4. Safety First (ระบบความปลอดภัย)
- **Transaction Lock:** ป้องกันการส่งคำสั่งซ้ำซ้อนด้วยระบบ Database Locking
- **Slippage Protection:** เช็คความห่างของราคา (Spread) ก่อนส่งคำสั่งซื้อขายจริง
- **Atomic Trade:** หากขาใดขาหนึ่ง (Leg) ล้มเหลว ระบบจะพยายาม Rollback หรือแจ้งเตือนทันที

---

## 📊 Dashboard Overview

- **Estimated P&L:** กำไร/ขาดทุนรวมที่ประมาณการไว้
- **Live Z-Score Monitoring:** กราฟแสดงความเคลื่อนไหวของ Z-Score แบบ Real-time
- **Pair Control:** ส่วนสำหรับเปิด/ปิดบอทในแต่ละคู่เหรียญ
- **Backtest Engine:** เมนูสำหรับทดลองกลยุทธ์ย้อนหลังเพื่อหาค่า Configuration ที่ดีที่สุด

---

## 🛠️ Maintenance (การดูแลรักษา)

- **Cron Job:** แนะนำให้ใช้ GitHub Actions หรือเครื่องมือ Cron ภายนอกเรียกไปที่ `https://your-domain.com/api/trade` อย่างสม่ำเสมอ
- **Logs:** ตรวจสอบประวัติการเทรดในหน้า Dashboard เพื่อดูประสิทธิภาพของบอท
- **Telegram:** หากเกิดข้อผิดพลาดรุนแรง บอทจะส่งข้อความแจ้งเตือนเข้า Telegram ของคุณทันที
