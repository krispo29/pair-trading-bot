'use client';
import { Power, Settings2, BarChart2, Lock } from 'lucide-react';
import { useState } from 'react';

export const BotStatusCard = ({ pair }: { pair: any }) => {
  const [isActive, setIsActive] = useState(pair.isActive);
  const isLocked = pair.isProcessing;

  const toggleBot = async () => {
    if (isLocked) return;
    // ในการใช้งานจริง: เรียก API เพื่ออัปเดตสถานะใน Database
    setIsActive(!isActive);
  };

  return (
    <div className={`bg-slate-800/40 border p-4 rounded-xl flex justify-between items-center group transition ${isLocked ? 'border-amber-500/50 bg-amber-500/5' : 'border-slate-700 hover:border-slate-600'}`}>
      <div className="flex items-center gap-4">
        <div className={`w-2 h-10 rounded-full ${isLocked ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : (isActive ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600')}`} />
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-slate-100">{pair.assetA} / {pair.assetB}</h4>
            {isLocked && (
              <span className="flex items-center gap-1 bg-amber-500/20 text-amber-500 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider animate-pulse">
                <Lock size={10} /> Locked
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <BarChart2 size={12} /> Z-Score: <span className={isActive ? 'text-blue-400' : 'text-slate-500'}>
              {pair.lastZScore ? pair.lastZScore.toFixed(2) : '0.00'}
            </span>
          </p>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button 
          disabled={isLocked}
          className={`p-2 text-slate-400 hover:text-white transition bg-slate-700/50 rounded-lg ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Settings2 size={18} />
        </button>
        <button 
          onClick={toggleBot}
          disabled={isLocked}
          className={`p-2 rounded-lg transition-all ${
            isLocked 
            ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
            : (isActive 
              ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white' 
              : 'bg-slate-700 text-slate-400 hover:bg-slate-600')
          }`}
        >
          <Power size={18} />
        </button>
      </div>
    </div>
  );
};
