'use client';

import { Power } from 'lucide-react';
import { toggleAllPairs } from '@/app/actions/bot';
import { useState } from 'react';

export const BotControlGroup = ({ anyActive }: { anyActive: boolean }) => {
  const [loading, setLoading] = useState(false);

  const handleToggleAll = async () => {
    setLoading(true);
    // ถ้ามีตัวไหนเปิดอยู่ (anyActive = true) ให้กดเพื่อ "Stop All" (false)
    // ถ้าปิดอยู่หมด ให้กดเพื่อ "Start All" (true)
    const nextState = !anyActive; 
    const result = await toggleAllPairs(nextState);
    if (!result.success) {
      alert("Failed to update bots: " + result.message);
    }
    setLoading(false);
  };

  return (
    <button 
      onClick={handleToggleAll}
      disabled={loading}
      className={`${
        anyActive 
        ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/20' 
        : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20'
      } text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold shadow-lg active:scale-95 disabled:opacity-50`}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <Power size={18} />
      )}
      {anyActive ? 'Stop All Bots' : 'Start All Bots'}
    </button>
  );
};
