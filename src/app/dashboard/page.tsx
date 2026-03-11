import { db } from '@/lib/db';
import { tradingPairs, tradeHistory } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Activity, TrendingUp, AlertTriangle, Zap, Power } from 'lucide-react';
import { ZScoreChart } from '@/components/ZScoreChart';
import { PanicButton } from '@/components/PanicButton';
import { BotStatusCard } from '@/components/BotStatusCard';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // 1. ดึงข้อมูลจาก Neon DB แบบ Server-side
  const pairs = await db.select().from(tradingPairs);
  const recentTrades = await db.select()
    .from(tradeHistory)
    .orderBy(desc(tradeHistory.createdAt))
    .limit(5);

  // คำนวณกำไรเบื้องต้น
  const totalPnL = recentTrades.reduce((sum, trade) => sum + parseFloat(String(trade.pnl || '0')), 0);

  return (
    <div className="min-h-screen bg-black text-slate-200 p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              QuantBot Dashboard 2026
            </h1>
            <p className="text-slate-500 text-sm mt-1">Pair Trading Strategy • Delta Neutral • High Frequency</p>
          </div>
          <div className="flex gap-3">
            <PanicButton />
            <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold shadow-lg shadow-emerald-900/20 active:scale-95">
              <Power size={18} /> Start All Bots
            </button>
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
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-100">
                <Activity size={20} className="text-blue-400" /> Live Z-Score Monitoring
              </h3>
              {/* ส่งข้อมูลจำลองไปก่อนในขั้นตอนนี้ */}
              <ZScoreChart data={[
                { time: '2026-03-11 08:00', value: 0.1 },
                { time: '2026-03-11 09:00', value: 1.4 },
                { time: '2026-03-11 10:00', value: 0.5 },
                { time: '2026-03-11 11:00', value: -1.2 },
                { time: '2026-03-11 12:00', value: -2.1 },
                { time: '2026-03-11 13:00', value: -0.8 },
              ]} /> 
            </div>

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
                    {recentTrades.length > 0 ? recentTrades.map((trade) => (
                      <tr key={trade.id} className="hover:bg-slate-800/30 transition-colors group">
                        <td className="py-4 font-bold text-slate-300">BTC/ETH</td>
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
                        <td className={`py-4 text-right font-mono font-bold ${parseFloat(String(trade.pnl || '0')) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {parseFloat(String(trade.pnl || '0')) >= 0 ? '+' : ''}{trade.pnl || '0.00'}
                        </td>
                      </tr>
                    )) : (
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
                    <button className="text-blue-400 text-xs mt-2 hover:underline">+ Add New Pair</button>
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

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
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
