/**
 * ฟังก์ชันคำนวณ Linear Regression (OLS) เบื้องต้น
 * เพื่อหาค่า Hedge Ratio (Beta) และ Intercept (Alpha)
 */
function calculateOLS(x: number[], y: number[]) {
  const n = x.length;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    numerator += diffX * diffY;
    denominator += diffX * diffX;
  }

  const beta = numerator / denominator; // Hedge Ratio
  const alpha = meanY - beta * meanX;   // Intercept

  return { beta, alpha };
}

/**
 * ฟังก์ชันทำ Augmented Dickey-Fuller (ADF) Test แบบย่อ
 * เพื่อตรวจสอบความนิ่ง (Stationarity) ของ Spread
 */
export function calculateADFTest(pricesA: number[], pricesB: number[]): { isCointegrated: boolean, hedgeRatio: number, tStat: number } {
  const n = pricesA.length;
  if (n < 10) throw new Error("Not enough data for ADF Test");

  // Step 1: หา Hedge Ratio และคำนวณ Spread (Residuals)
  // Equation: A = Beta * B + Alpha
  const { beta } = calculateOLS(pricesB, pricesA); 
  const spread: number[] = [];
  
  for (let i = 0; i < n; i++) {
    spread.push(pricesA[i] - (beta * pricesB[i]));
  }

  // Step 2: เตรียมข้อมูลสำหรับ DF Test (Delta Spread vs Lagged Spread)
  const deltaSpread: number[] = [];
  const laggedSpread: number[] = [];
  
  for (let i = 1; i < n; i++) {
    deltaSpread.push(spread[i] - spread[i - 1]);
    laggedSpread.push(spread[i - 1]);
  }

  // Step 3: ทำ Regression อีกรอบเพื่อหาค่า Gamma (Coefficient ของ Lagged Spread)
  const { beta: gamma } = calculateOLS(laggedSpread, deltaSpread);

  // Step 4: คำนวณ Standard Error เพื่อหาค่า t-statistic
  let sse = 0; // Sum of Squared Errors
  let sst = 0; // Total Sum of Squares
  const meanLagged = laggedSpread.reduce((a, b) => a + b, 0) / laggedSpread.length;

  for (let i = 0; i < deltaSpread.length; i++) {
    const predictedDelta = gamma * laggedSpread[i];
    const error = deltaSpread[i] - predictedDelta;
    sse += error * error;
    sst += Math.pow(laggedSpread[i] - meanLagged, 2);
  }

  // ป้องกันการหารด้วยศูนย์
  if (sst === 0) return { isCointegrated: false, hedgeRatio: beta, tStat: 0 };

  const standardError = Math.sqrt((sse / (deltaSpread.length - 2)) / sst);
  const tStat = gamma / (standardError || 0.000001);

  // Step 5: ตรวจสอบกับ Critical Value 
  // ค่ามาตรฐานที่ระดับความเชื่อมั่น 95% (p < 0.05) คือประมาณ -2.86 ถึง -3.4
  const criticalValue5Percent = -2.86;
  const isCointegrated = tStat < criticalValue5Percent;

  return {
    isCointegrated,
    hedgeRatio: parseFloat(beta.toFixed(4)),
    tStat: parseFloat(tStat.toFixed(4))
  };
}
