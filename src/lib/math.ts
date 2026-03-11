/**
 * คำนวณ Z-Score สำหรับ Pair Trading โดยใช้ Log Spread
 */
export function calculateZScore(pricesA: number[], pricesB: number[]) {
  if (pricesA.length !== pricesB.length || pricesA.length === 0) {
    throw new Error('Prices arrays must have the same non-zero length');
  }

  const spreads = pricesA.map((pA, i) => Math.log(pA) - Math.log(pricesB[i]));
  const mean = spreads.reduce((a, b) => a + b, 0) / spreads.length;
  const squareDiffs = spreads.map((s) => Math.pow(s - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
  const stdDev = Math.sqrt(avgSquareDiff);

  const currentSpread = spreads[spreads.length - 1];
  const zScore = (currentSpread - mean) / stdDev;

  return {
    zScore: parseFloat(zScore.toFixed(2)),
    mean,
    stdDev,
    currentSpread
  };
}

/**
 * คำนวณ Pearson Correlation Coefficient (r)
 * เพื่อวัดความสัมพันธ์เชิงเส้นระหว่างสินทรัพย์ 2 ตัว
 */
export function calculateCorrelation(pricesA: number[], pricesB: number[]): number {
  const n = pricesA.length;
  const meanA = pricesA.reduce((a, b) => a + b, 0) / n;
  const meanB = pricesB.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denumA = 0;
  let denumB = 0;

  for (let i = 0; i < n; i++) {
    const diffA = pricesA[i] - meanA;
    const diffB = pricesB[i] - meanB;
    numerator += diffA * diffB;
    denumA += Math.pow(diffA, 2);
    denumB += Math.pow(diffB, 2);
  }

  const denominator = Math.sqrt(denumA * denumB);
  if (denominator === 0) return 0;

  const correlation = numerator / denominator;
  return parseFloat(correlation.toFixed(4));
}

/**
 * คำนวณ ATR (Average True Range) เพื่อวัดความผันผวนของตลาด
 * @param high ราคาสูงสุด
 * @param low ราคาต่ำสุด
 * @param close ราคาปิด
 * @param period ช่วงเวลา (เช่น 14)
 */
export function calculateATR(high: number[], low: number[], close: number[], period: number = 14): number {
  if (close.length < period + 1) return 0;
  
  const trs: number[] = [];
  for (let i = 1; i < close.length; i++) {
    const tr = Math.max(
      high[i] - low[i],
      Math.abs(high[i] - close[i - 1]),
      Math.abs(low[i] - close[i - 1])
    );
    trs.push(tr);
  }

  const atr = trs.slice(-period).reduce((a, b) => a + b, 0) / period;
  return atr;
}

/**
 * ตรวจสอบ Cointegration (Stationarity of Spread) เบื้องต้น
 * ในที่นี้ใช้การตรวจสอบความคงที่ของ Variance และ Mean ของ Spread ย้อนหลัง
 */
export function checkCointegration(pricesA: number[], pricesB: number[]): boolean {
  const spreads = pricesA.map((pA, i) => Math.log(pA) - Math.log(pricesB[i]));
  
  // แบ่งข้อมูลเป็น 2 ส่วนเพื่อเทียบ Mean และ Variance (Simplified ADF Logic)
  const mid = Math.floor(spreads.length / 2);
  const part1 = spreads.slice(0, mid);
  const part2 = spreads.slice(mid);

  const mean1 = part1.reduce((a, b) => a + b, 0) / part1.length;
  const mean2 = part2.reduce((a, b) => a + b, 0) / part2.length;

  // หาก Mean ของทั้งสองส่วนห่างกันเกินไป (ไม่เป็น Stationarity) ให้ถือว่าไม่ Cointegrated
  const meanDiff = Math.abs(mean1 - mean2);
  return meanDiff < 0.05; // Threshold จำลองสำหรับการทำ Paper Trade
}

/**
 * ให้คำแนะนำตามค่า Correlation (Interpretation)
 */
export function getCorrelationAdvice(r: number): { status: string; advice: string } {
  const absR = Math.abs(r);
  if (absR >= 0.90) return { status: 'EXCELLENT', advice: 'ดีเยี่ยม เหมาะกับ High Frequency Pair Trading' };
  if (absR >= 0.80) return { status: 'GOOD', advice: 'สัมพันธ์กันดี ผ่านเกณฑ์มาตรฐาน' };
  if (absR >= 0.75) return { status: 'FAIR', advice: 'สัมพันธ์กันปานกลาง ควรระวังช่วงตลาดผันผวน' };
  return { status: 'RISKY', advice: 'เสี่ยงเกินไป สินทรัพย์อาจเกิดการ Diverge ได้ง่าย' };
}
