'use client';
import { Power, Trash2, BarChart2, Lock } from 'lucide-react';
import { useState } from 'react';
import { togglePairStatus } from '@/app/actions/bot';
import { deletePair } from '@/app/actions/pairs';

export const BotStatusCard = ({ pair }: { pair: any }) => {
  const [isActive, setIsActive] = useState(pair.isActive);
  const [isDeleting, setIsDeleting] = useState(false);
  const isLocked = pair.isProcessing;

  const toggleBot = async () => {
    if (isLocked) return;
    
    // อัปเดตผ่าน Server Action
    const result = await togglePairStatus(pair.id, isActive);
    if (result.success) {
      setIsActive(result.isActive);
    } else {
      alert("Failed to update bot status: " + result.message);
    }
  };

  const handleDelete = async () => {
    if (isActive) return alert("Please stop the bot before deleting the pair.");
    if (!confirm(`Are you sure you want to delete ${pair.assetA}/${pair.assetB}? This will also delete its history.`)) return;

    setIsDeleting(true);
    const result = await deletePair(pair.id);
    if (!result.success) {
      alert("Failed to delete pair: " + result.message);
      setIsDeleting(false);
    }
  };

  return (
    <div className={`bg-slate-800/40 border p-4 rounded-xl flex justify-between items-center group transition ${isLocked ? 'border-amber-500/50 bg-amber-500/5' : 'border-slate-700 hover:border-slate-600'} ${isDeleting ? 'opacity-50 grayscale' : ''}`}>
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
          onClick={handleDelete}
          disabled={isLocked || isDeleting || isActive}
          className={`p-2 text-slate-400 hover:text-rose-400 transition bg-slate-700/50 rounded-lg ${isLocked || isActive ? 'opacity-20 cursor-not-allowed' : ''}`}
          title={isActive ? "Stop bot before deleting" : "Delete Pair"}
        >
          <Trash2 size={18} />
        </button>
        <button 
          onClick={toggleBot}
          disabled={isLocked || isDeleting}
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
