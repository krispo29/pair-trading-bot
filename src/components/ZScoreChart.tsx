'use client';
import { createChart, ColorType, LineStyle, LineSeries } from 'lightweight-charts';
import { useEffect, useRef } from 'react';

interface ZScoreDataPoint {
  time: number | string;
  value: number;
}

export const ZScoreChart = ({ data, title = 'Z-Score Analysis (Real-time)' }: { data: ZScoreDataPoint[]; title?: string }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    const chart = createChart(chartContainerRef.current, {
      layout: { 
        background: { type: ColorType.Solid, color: '#0f172a' }, // Slate-900
        textColor: '#94a3b8', // Slate-400
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 350,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // 1. เส้นหลัก Z-Score
    const lineSeries = chart.addSeries(LineSeries, { 
      color: '#3b82f6', // Blue-500
      lineWidth: 2,
    });
    lineSeries.setData(data as any);

    // 2. เส้น Baseline (0)
    const baselineSeries = chart.addSeries(LineSeries, {
      color: '#475569', // Slate-600
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
    });
    // สร้างเส้นตรงที่ 0 ตามจำนวนข้อมูลที่มี
    baselineSeries.setData(data.map(d => ({ time: d.time, value: 0 })) as any);

    // 3. เส้นขอบบน (Upper Threshold +2.0)
    const upperLimit = chart.addSeries(LineSeries, { 
      color: '#ef4444', // Red-500 (Short Signal)
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
    });
    upperLimit.setData(data.map(d => ({ time: d.time, value: 2.0 })) as any);

    // 4. เส้นขอบล่าง (Lower Threshold -2.0)
    const lowerLimit = chart.addSeries(LineSeries, { 
      color: '#10b981', // Emerald-500 (Long Signal)
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
    });
    lowerLimit.setData(data.map(d => ({ time: d.time, value: -2.0 })) as any);

    // ปรับกราฟให้พอดีกับข้อมูล
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data]);

  return (
    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg">
      <h3 className="text-slate-200 text-sm font-semibold mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
        {title}
      </h3>
      <div ref={chartContainerRef} className="w-full h-[350px]" />
    </div>
  );
};
