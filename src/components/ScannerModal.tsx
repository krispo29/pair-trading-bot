'use client';
import { useState } from 'react';
import { Search, X, TrendingUp, Link as LinkIcon, Plus, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

export const ScannerModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [addedPairs, setAddedPairs] = useState<Set<string>>(new Set());

  const runScanner = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/scanner?min_corr=0.85&limit=100');
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error('Scan failed:', err);
      alert('Failed to scan market');
    }
    setLoading(false);
  };

  const addPair = async (assetA: string, assetB: string) => {
    try {
      const res = await fetch('/api/pairs/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetA, assetB }),
      });
      if (res.ok) {
        setAddedPairs(prev => new Set(prev).add(`${assetA}-${assetB}`));
        // ไม่ต้องรีเฟรชหน้าทันที เพื่อให้แอดได้หลายคู่
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClose = () => {
    if (addedPairs.size > 0) {
      window.location.reload(); // รีเฟรชเมื่อปิด modal ถ้ามีการแอดเหรียญ
    }
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => { setIsOpen(true); runScanner(); }}
        className="text-emerald-400 text-xs mt-2 hover:underline flex items-center gap-1"
      >
        <Sparkles size={12} /> Scan for Market Opportunities
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-3xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div>
            <h3 className="text-2xl font-black text-white flex items-center gap-2">
              <Search className="text-emerald-400" /> Market Scanner
            </h3>
            <p className="text-slate-500 text-xs mt-1">สแกนหาคู่เหรียญที่มีความสัมพันธ์กันสูง (High Correlation) บน Binance</p>
          </div>
          <button onClick={handleClose} className="text-slate-500 hover:text-white transition p-2 hover:bg-slate-800 rounded-full">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-4 text-slate-500">
              <Loader2 className="animate-spin text-emerald-500" size={48} />
              <div className="text-center">
                <p className="font-bold text-slate-300">Scanning Binance Top 20...</p>
                <p className="text-xs">กำลังคำนวณ Correlation & ADF Test ในแต่ละคู่</p>
              </div>
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((item, idx) => {
                const isAdded = addedPairs.has(`${item.assetA}-${item.assetB}`);
                return (
                  <div key={idx} className="bg-slate-800/40 border border-slate-800 p-5 rounded-2xl flex justify-between items-center group hover:border-emerald-500/30 transition-all hover:bg-slate-800/60">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold border-2 border-slate-900">{item.assetA.split('/')[0]}</div>
                          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] font-bold border-2 border-slate-900">{item.assetB.split('/')[0]}</div>
                        </div>
                        <h4 className="font-bold text-slate-100">{item.assetA} / {item.assetB}</h4>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-500 uppercase font-bold">Correlation</span>
                          <span className="text-emerald-400 font-mono font-bold">{(item.correlation * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-px h-6 bg-slate-800" />
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-500 uppercase font-bold">P-Value (ADF)</span>
                          <span className="text-blue-400 font-mono font-bold">Statistically Fit</span>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => addPair(item.assetA, item.assetB)}
                      disabled={isAdded}
                      className={`p-3 rounded-xl transition-all ${
                        isAdded 
                        ? 'bg-emerald-500/10 text-emerald-500 cursor-default' 
                        : 'bg-slate-700 text-white hover:bg-emerald-600 shadow-lg active:scale-95'
                      }`}
                    >
                      {isAdded ? <CheckCircle2 size={20} /> : <Plus size={20} />}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-600">
              <p>No high-correlation pairs found with current filters.</p>
              <button onClick={runScanner} className="mt-4 text-emerald-500 font-bold hover:underline">Try Again</button>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-4 bg-emerald-500/5 border-t border-slate-800 flex items-center gap-3">
          <Sparkles className="text-emerald-500" size={16} />
          <p className="text-[10px] text-emerald-300/70 leading-relaxed italic">
            คู่เหรียญที่แสดงผ่านการตรวจสอบ Cointegration แล้ว มีความเสถียรของค่าเฉลี่ยส่วนต่างราคาสูง (Mean Reversion Potential)
          </p>
        </div>
      </div>
    </div>
  );
};
