'use client';
import { useState } from 'react';
import { Plus, X, Search } from 'lucide-react';

export const AddPairModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [assetA, setAssetA] = useState('BTC/USDT');
  const [assetB, setAssetB] = useState('ETH/USDT');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/pairs/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetA, assetB }),
      });
      if (res.ok) {
        setIsOpen(false);
        window.location.reload(); // Refresh to see the new pair
      } else {
        const error = await res.json();
        alert('Error: ' + error.error);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to add pair');
    }
    setLoading(false);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="text-blue-400 text-xs mt-2 hover:underline flex items-center gap-1"
      >
        <Plus size={12} /> Add New Pair
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Plus className="text-blue-400" /> Add Trading Pair
          </h3>
          <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Asset A (Leg 1)</label>
            <input 
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
              placeholder="e.g. BTC/USDT"
              value={assetA}
              onChange={e => setAssetA(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Asset B (Leg 2)</label>
            <input 
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
              placeholder="e.g. ETH/USDT"
              value={assetB}
              onChange={e => setAssetB(e.target.value)}
              required
            />
          </div>

          <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-xl">
            <p className="text-[10px] text-blue-300/70 leading-relaxed italic">
              *ระบุชื่อเหรียญให้ถูกต้องตามรูปแบบของ Binance (เช่น BTC/USDT) ระบบจะเริ่มสแกนค่า Z-Score ทันทีที่กดตกลง
            </p>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
          >
            {loading ? <div className="w-5 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search size={18} />}
            {loading ? 'Adding Pair...' : 'Confirm & Add Pair'}
          </button>
        </form>
      </div>
    </div>
  );
};
