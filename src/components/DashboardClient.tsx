'use client';

import { useState, useEffect, useCallback } from 'react';
import { Activity, TrendingUp, AlertTriangle, Zap, Settings } from 'lucide-react';
import { ZScoreChart } from '@/components/ZScoreChart';
import { PanicButton } from '@/components/PanicButton';
import { BotStatusCard } from '@/components/BotStatusCard';
import { BotControlGroup } from '@/components/BotControlGroup';
import { AddPairModal } from '@/components/AddPairModal';
import { ScannerModal } from '@/components/ScannerModal';
import { RealBalance } from '@/components/RealBalance';
import { PaperBalance } from '@/components/PaperBalance';
import { ForceCheckButton } from '@/components/ForceCheckButton';
import Link from 'next/link';
import Image from 'next/image';

export default function DashboardClient({ 
  initialData 
}: { 
  initialData: {
    pairs: any[],
    paperBalanceValue: number,
    recentTrades: any[],
    chartsData: any[]
  }
}) {
  const [data, setData] = useState(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/data');
      if (res.ok) {
        const newData = await res.json();
        setData(newData);
      }
    } catch (error) {
      console.error("Failed to refresh dashboard data:", error);
    }
  }, []);

  // Poll every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 10000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const { pairs, paperBalanceValue, recentTrades, chartsData } = data;
  const anyActive = pairs.some(p => p.isActive);
  const totalPnL = recentTrades.reduce((sum, trade) => sum + Number.parseFloat(String(trade.pnl || '0')), 0);

  return (
    <div className="min-h-screen bg-black text-slate-200 p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-slate-900/40 p-6 rounded-3xl border border-slate-800 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <Image 
                src="/logo.png" 
                alt="QuantBot Logo" 
                width={64} 
                height={64} 
                className="relative rounded-2xl border border-slate-700 shadow-2xl"
              />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent tracking-tight">
                QuantBot Dashboard 2026
              </h1>
              <p className="text-slate-500 text-sm mt-1 font-medium">Pair Trading Strategy • Professional Edition</p>
            </div>
            <div className="hidden md:block h-10 w-px bg-slate-800" />
            <RealBalance />
            <div className="hidden md:block h-10 w-px bg-slate-800" />
            <PaperBalance initialBalance={paperBalanceValue} />
          </div>
          <div className="flex gap-3">
            <ForceCheckButton onComplete={refreshData} />
            <Link 
              href="/dashboard/settings/paper-trade"
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold border border-slate-700"
            >
              <Settings size={18} /> Paper Settings
            </Link>
            <PanicButton />
            <BotControlGroup anyActive={anyActive} />
          </div>
        </header>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="Estimated P&L" 
            value={`$${totalPnL.toFixed(2)}`} 
            icon={<TrendingUp className={totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'} />} 
          />
          <StatCard 
            title="Active Pairs" 
            value={pairs.filter(p => p.isActive).length.toString()} 
            icon={<Activity className="text-blue-400" />} 
          />
          <StatCard 
            title="Open Positions" 
            value={recentTrades.filter(t => t.status === 'open').length.toString()} 
            icon={<Zap className="text-yellow-400" />} 
          />
          <StatCard 
            title="Bot Status" 
            value={pairs.some(p => p.isProcessing) ? 'Processing' : 'Online'} 
            icon={
              pairs.some(p => p.isProcessing) 
              ? <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_#f59e0b]" />
              : <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
            } 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Charts & History */}
          <div className="lg:col-span-2 space-y-6">
            {chartsData && chartsData.length > 0 ? (
              chartsData.map(({ pairId, assetA, assetB, data }) => (
                <div key={pairId} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                  <ZScoreChart 
                    data={data} 
                    title={`Z-Score Monitoring (${assetA}/${assetB})`}
                  />
                </div>
              ))
            ) : (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm h-[350px] flex flex-col items-center justify-center text-slate-500 italic">
                <Activity size={48} className="mb-4 opacity-20" />
                <p>No active pairs. Start a bot to begin monitoring.</p>
              </div>
            )}

            {/* Trade History Table */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 overflow-hidden">
              <h3 className="text-lg font-bold mb-6 text-slate-100">Recent Transactions</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800">
                      <th className="pb-4">Pair</th>
                      <th className="pb-4 text-center">Side</th>
                      <th className="pb-4">Price (A/B)</th>
                      <th className="pb-4 text-right">P&L Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {recentTrades.length > 0 ? recentTrades.map((trade) => {
                      const pair = pairs.find(p => p.id === trade.pairId);
                      return (
                        <tr key={trade.id} className="hover:bg-slate-800/30 transition-colors group">
                          <td className="py-4 font-bold text-slate-300">
                            {pair ? `${pair.assetA}/${pair.assetB}` : 'Unknown'}
                          </td>
                          <td className="py-4 text-center">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-extrabold border ${
                              trade.side.includes('LONG') 
                              ? 'bg-emerald-900/20 text-emerald-400 border-emerald-500/20' 
                              : 'bg-rose-900/20 text-rose-400 border-rose-500/20'
                            }`}>
                              {trade.side}
                            </span>
                          </td>
                          <td className="py-4 text-sm text-slate-500">
                            {trade.entryPriceA?.toFixed(2)} / {trade.entryPriceB?.toFixed(2)}
                          </td>
                          <td className={`py-4 text-right font-mono font-bold ${Number.parseFloat(String(trade.pnl || '0')) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {Number.parseFloat(String(trade.pnl || '0')) >= 0 ? '+' : ''}{trade.pnl || '0.00'}
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-600 italic">No recent trades found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Control Center */}
          <div className="space-y-6">
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold mb-6 flex items-center justify-between text-slate-100">
                Pair Control <span className="text-xs font-normal text-slate-500">{pairs.length} Available</span>
              </h3>
              <div className="space-y-4">
                {pairs.length > 0 ? pairs.map((pair) => (
                  <BotStatusCard key={pair.id} pair={pair} />
                )) : (
                  <div className="text-center p-8 bg-slate-800/20 rounded-xl border border-dashed border-slate-700">
                    <p className="text-slate-500 text-sm">No pairs configured</p>
                    <AddPairModal />
                    <ScannerModal />
                  </div>
                )}
                {pairs.length > 0 && (
                  <div className="flex flex-col items-start gap-1">
                    <AddPairModal />
                    <ScannerModal />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-amber-900/10 border border-amber-900/30 rounded-2xl p-5 flex gap-4">
              <div className="p-2 bg-amber-900/20 rounded-lg h-fit">
                <AlertTriangle className="text-amber-500" size={20} />
              </div>
              <div>
                <h4 className="text-amber-200 text-sm font-bold mb-1">Risk Assessment</h4>
                <p className="text-xs text-amber-200/60 leading-relaxed">
                  Market volatility is currently <strong>normal</strong>. Monitor BTC Correlation before scaling positions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: Readonly<{ title: string; value: string; icon: React.ReactNode }>) {
  return (
    <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-all hover:translate-y-[-2px] group">
      <div className="flex justify-between items-start mb-3">
        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">{title}</span>
        <div className="p-1.5 bg-slate-800 rounded-lg group-hover:bg-slate-700 transition-colors">
          {icon}
        </div>
      </div>
      <div className="text-3xl font-black text-slate-100 tracking-tight">{value}</div>
    </div>
  );
}
