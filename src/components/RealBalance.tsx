'use client';
import { useState, useEffect } from 'react';
import { Wallet } from 'lucide-react';

export const RealBalance = () => {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        if (data.status === 'Connected') {
          setBalance(data.totalUSDT);
        }
      } catch (err) {
        console.error('Failed to fetch real balance:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
    // Refresh every 1 minute
    const interval = setInterval(fetchBalance, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col">
      <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Real Balance (Binance)</span>
      <div className="flex items-center gap-2">
        <Wallet size={16} className="text-emerald-400" />
        <span className="text-xl font-black text-white">
          {loading ? '---' : `$${balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          <span className="text-xs text-slate-500 ml-1 font-medium">USDT</span>
        </span>
      </div>
    </div>
  );
};
