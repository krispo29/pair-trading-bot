/**
 * สร้าง URL รูปกราฟ Z-Score โดยใช้ QuickChart API
 * @param zScoreHistory อาร์เรย์ของค่า Z-Score ย้อนหลัง
 * @param pair ชื่อคู่เทรด
 */
export function generateZScoreChartUrl(zScoreHistory: number[], pair: string) {
    const chartConfig = {
      type: 'line',
      data: {
        labels: zScoreHistory.map((_, i) => i), // แกน X (ลำดับแท่ง)
        datasets: [
          {
            label: `Z-Score: ${pair}`,
            data: zScoreHistory,
            borderColor: 'rgb(59, 130, 246)', // Blue-500
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            pointRadius: 0,
            borderWidth: 2,
          },
        ],
      },
      options: {
        scales: {
          yAxes: [{
            ticks: {
              min: -4,
              max: 4,
            }
          }]
        },
        annotation: {
          annotations: [
            { type: 'line', mode: 'horizontal', scaleID: 'y-axis-0', value: 2, borderColor: 'rgba(239, 68, 68, 0.5)', borderDash: [5, 5], label: { enabled: true, content: 'Short Threshold' } },
            { type: 'line', mode: 'horizontal', scaleID: 'y-axis-0', value: -2, borderColor: 'rgba(16, 185, 129, 0.5)', borderDash: [5, 5], label: { enabled: true, content: 'Long Threshold' } },
            { type: 'line', mode: 'horizontal', scaleID: 'y-axis-0', value: 0, borderColor: 'rgba(148, 163, 184, 0.3)', borderWidth: 1 },
          ],
        },
      },
    };
  
    return `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&bkg=white&w=800&h=400`;
  }
