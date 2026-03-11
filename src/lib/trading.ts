/**
 * ฟังก์ชันคำนวณจำนวนเหรียญสำหรับการเทรดแบบ Dollar Neutral
 * @param totalBudget งบประมาณรวมสำหรับคู่นี้ (USD)
 * @param priceA ราคาปัจจุบันของ Asset A
 * @param priceB ราคาปัจจุบันของ Asset B
 * @param marketA ข้อมูลตลาด A จาก CCXT (เพื่อดึง precision/limits)
 * @param marketB ข้อมูลตลาด B จาก CCXT
 */
export function calculatePositionSizes(
  totalBudget: number,
  priceA: number,
  priceB: number,
  marketA: any,
  marketB: any
) {
  // 1. หักค่าธรรมเนียมเผื่อไว้ (เช่น 0.2% เพื่อความปลอดภัย)
  const safeBudget = totalBudget * 0.998;
  const halfBudget = safeBudget / 2;

  // 2. คำนวณจำนวนเหรียญดิบ
  let qtyA = halfBudget / priceA;
  let qtyB = halfBudget / priceB;

  // 3. ตรวจสอบความถูกต้องตามกฎของ Exchange (Lot Size / Step Size)
  // หมายเหตุ: ในการใช้งานจริงควรใช้ exchange.amount_to_precision()
  const finalQtyA = adjustToStepSize(qtyA, marketA.limits.amount.min, marketA.precision.amount);
  const finalQtyB = adjustToStepSize(qtyB, marketB.limits.amount.min, marketB.precision.amount);

  // 4. ตรวจสอบเงื่อนไขขั้นต่ำ (Minimum Notional - ส่วนใหญ่ $5-$10)
  const valueA = finalQtyA * priceA;
  const valueB = finalQtyB * priceB;

  const minNotionalA = marketA.limits.cost?.min || 10;
  const minNotionalB = marketB.limits.cost?.min || 10;

  if (valueA < minNotionalA || valueB < minNotionalB) {
    throw new Error(`Budget $${totalBudget} is too low. Min required: $${Math.max(minNotionalA, minNotionalB) * 2}`);
  }

  return {
    qtyA: finalQtyA,
    qtyB: finalQtyB,
    actualValueA: valueA,
    actualValueB: valueB,
    totalValue: valueA + valueB
  };
}

/**
 * ช่วยปรับจำนวนเหรียญให้ตรงตาม Step Size และ Precision ของ Exchange
 */
function adjustToStepSize(qty: number, minAmount: number, precision: number): number {
  if (qty < minAmount) return 0;
  
  // ปรับทศนิยมตามที่ Exchange กำหนด
  const factor = Math.pow(10, precision);
  return Math.floor(qty * factor) / factor;
}
