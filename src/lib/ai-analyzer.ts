import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

/**
 * วิเคราะห์อารมณ์ตลาดจากข่าวสาร (Mock ข่าว X ในปี 2026)
 */
export async function analyzeMarketMood(assetNames: string) {
  // จำลองข้อมูลข่าว (ในการใช้งานจริงอาจเรียก API จาก X/Twitter)
  const mockNews = [
    `Unusual volatility detected in ${assetNames} correlation.`,
    `Institutional investors rebalancing ${assetNames} portfolios.`,
    `Major exchange update regarding ${assetNames} trading pairs.`
  ];

  try {
    const { object } = await generateObject({
      model: google('gemini-1.5-pro'),
      schema: z.object({
        sentimentScore: z.number().describe('คะแนนอารมณ์ตลาดจาก -1 (ลบมาก) ถึง 1 (บวกมาก)'),
        summary: z.string().describe('สรุปสั้นๆ ของข่าวปัจจุบัน'),
        shouldPause: z.boolean().describe('จริงหากมีความเสี่ยงสูงหรือตลาดไม่เสถียร'),
        reason: z.string().describe('เหตุผลที่ตัดสินใจหยุดเทรดหรือดำเนินการต่อ')
      }),
      prompt: `วิเคราะห์ข่าวคริปโตต่อไปนี้สำหรับคู่สินทรัพย์ ${assetNames} และตัดสินใจว่าควรเทรดต่อหรือไม่: ${mockNews.join(' | ')}`
    });

    return object;
  } catch (error) {
    console.error('AI Analysis failed:', error);
    return {
        sentimentScore: 0,
        summary: 'Unable to analyze news.',
        shouldPause: false,
        reason: 'AI Service currently unavailable.'
    };
  }
}
