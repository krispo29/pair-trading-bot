'use client';
import { useState } from 'react';
import { Activity, TrendingUp, BarChart2, Play, Search, Filter } from 'lucide-react';
import { ZScoreChart } from '@/components/ZScoreChart';

export const dynamic = 'force-dynamic';

export default function BacktestPage() {
  const [params, setParams] = useState({
    assetA: 'BTC/USDT',
    assetB: 'ETH/USDT',
    timeframe: '1h',
    limit: '500',
    lookback: '100',
    upper: '2.0',
    lower: '-2.0',
    exit: '0.5'
  });
  
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runTest = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`/api/backtest?${query}`);
      const data = await res.json();
      setResults(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-slate-200 p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Backtest Engine
          </h1>
          <p className="text-slate-500 text-sm mt-1">Simulate strategies with historical data</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar: Controls */}
          <div className="space-y-6">
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-slate-100 uppercase tracking-wider">
                <Filter size={16} className="text-blue-400" /> Parameters
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Asset A / B</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition"
                      value={params.assetA}
                      onChange={e => setParams({...params, assetA: e.target.value})}
                    />
                    <input 
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition"
                      value={params.assetB}
                      onChange={e => setParams({...params, assetB: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Timeframe / Limit</label>
                  <div className="grid grid-cols-2 gap-2">
                    <select 
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                      value={params.timeframe}
                      onChange={e => setParams({...params, timeframe: e.target.value})}
                    >
                      <option value="15m">15m</option>
                      <option value="1h">1h</option>
                      <option value="4h">4h</option>
                    </select>
                    <input 
                      type="number"
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                      value={params.limit}
                      onChange={e => setParams({...params, limit: e.target.value})}
                    />
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4">
                  <label className="text-xs text-slate-500 mb-1 block">Lookback / Thresholds</label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Lookback</span>
                      <input type="number" className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs" value={params.lookback} onChange={e => setParams({...params, lookback: e.target.value})} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-rose-400">Upper (Sell)</span>
                      <input type="number" step="0.1" className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs" value={params.upper} onChange={e => setParams({...params, upper: e.target.value})} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-emerald-400">Lower (Buy)</span>
                      <input type="number" step="0.1" className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs" value={params.lower} onChange={e => setParams({...params, lower: e.target.value})} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-blue-400">Exit</span>
                      <input type="number" step="0.1" className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs" value={params.exit} onChange={e => setParams({...params, exit: e.target.value})} />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={runTest}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all mt-4"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play size={18} />}
                  {loading ? 'Processing...' : 'Run Simulation'}
                </button>
              </div>
            </div>
          </div>

          {/* Main: Results */}
          <div className="lg:col-span-3 space-y-6">
            {results ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <SummaryCard 
                    title="Net Profit" 
                    value={`$${results.summary.totalPnL.toFixed(2)}`} 
                    subValue={`${results.summary.totalPnLPercent.toFixed(2)}%`}
                    color={results.summary.totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}
                  />
                  <SummaryCard 
                    title="Trades Count" 
                    value={results.summary.tradesCount} 
                    subValue="Completed Trades"
                  />
                  <SummaryCard 
                    title="Win Rate" 
                    value={`${results.summary.winRate.toFixed(1)}%`} 
                    subValue="Profitability Factor"
                    color="text-blue-400"
                  />
                </div>

                {/* Chart */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-100">
                    <Activity size={20} className="text-blue-400" /> Z-Score Backtest History
                  </h3>
                  <ZScoreChart data={results.zScores} />
                </div>

                {/* Trade List */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-lg font-bold mb-6 text-slate-100">Trade Logs</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-800">
                          <th className="pb-4">Type</th>
                          <th className="pb-4">Entry Z</th>
                          <th className="pb-4">Exit Z</th>
                          <th className="pb-4 text-right">PnL (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {results.trades.map((trade: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${trade.type === 'LONG_SPREAD' ? 'bg-emerald-900/20 text-emerald-400' : 'bg-rose-900/20 text-rose-400'}`}>
                                {trade.type}
                              </span>
                            </td>
                            <td className="py-3 font-mono">{trade.entryZScore.toFixed(2)}</td>
                            <td className="py-3 font-mono">{trade.exitZScore.toFixed(2)}</td>
                            <td className={`py-3 text-right font-bold ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {trade.pnlPercent.toFixed(2)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-[500px] flex flex-col items-center justify-center bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl text-slate-600">
                <BarChart2 size={48} className="mb-4 opacity-20" />
                <p>Select parameters and run simulation to see results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, subValue, color = 'text-slate-100' }: any) {
  return (
    <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl">
      <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-2">{title}</span>
      <div className={`text-2xl font-black ${color}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-1">{subValue}</div>
    </div>
  );
}
