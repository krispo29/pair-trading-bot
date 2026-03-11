/**
 * ส่งข้อความแจ้งเตือนเข้า Telegram Bot
 * @param message ข้อความ (รองรับ Markdown)
 * @param imageUrl URL ของรูปภาพที่จะส่งพร้อมข้อความ (ถ้ามี)
 */
export async function sendTelegramAlert(message: string, imageUrl?: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
  
    if (!token || !chatId) {
      console.warn('Telegram Bot configuration is missing. Skipping alert.');
      return;
    }
  
    try {
      if (imageUrl) {
        // ส่งรูปภาพพร้อมข้อความกำกับ (Caption)
        await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            photo: imageUrl,
            caption: message,
            parse_mode: 'Markdown',
          }),
        });
      } else {
        // ส่งเฉพาะข้อความ
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown',
          }),
        });
      }
    } catch (error) {
      console.error('Failed to send Telegram alert:', error);
    }
  }
