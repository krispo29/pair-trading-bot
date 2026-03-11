'use client';
import { useState } from 'react';
import { Wallet, Globe, ShieldCheck, RefreshCcw, Plus, TrendingUp, AlertCircle, ArrowLeft } from 'lucide-react';
import { topUpPaperBalance, resetPaperBalance, setPaperBalance } from '@/app/actions/paper-trade';
import Link from 'next/link';

export default function PaperTradeSetup() {
  const [balance, setBalance] = useState(10000);
  const [customAmount, setCustomAmount] = useState('10000');
  const [selectedExchange, setSelectedExchange] = useState('internal_sim');
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdateBalance = async () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount)) return alert("Please enter a valid number");
    
    setIsSaving(true);
    const res = await setPaperBalance(amount);
    if (res.success && res.currentBalance !== undefined) {
        setBalance(Number(res.currentBalance));
        alert(res.message);
    } else {
        alert(res.message || "Failed to update balance");
    }
    setIsSaving(false);
  };

  const handleReset = async () => {
    if (confirm('Reset your virtual wallet to $10,000?')) {
        const res = await resetPaperBalance();
        if (res.success) {
            setBalance(10000);
            alert(res.message);
        }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    // บันทึกการตั้งค่าอื่นๆ เช่น exchange selection 
    setTimeout(() => {
        setIsSaving(false);
        alert('Simulation environment updated.');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-black text-slate-200 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Back Button */}
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors group mb-2"
        >
          <div className="p-2 bg-slate-900 rounded-lg group-hover:bg-slate-800 transition-colors">
            <ArrowLeft size={16} />
          </div>
          <span className="text-sm font-bold uppercase tracking-widest">Back to Dashboard</span>
        </Link>

        {/* Header & Status Toggle */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900/40 p-8 rounded-3xl border border-blue-500/20 backdrop-blur-md gap-4">
          <div>
            <h2 className="text-3xl font-black text-white flex items-center gap-3">
              <Globe className="text-blue-400" /> Paper Trade Setup
            </h2>
            <p className="text-slate-500 text-sm mt-1">ทดสอบกลยุทธ์ Z-Score ด้วยเงินสมมติบนสภาพตลาดจริง</p>
          </div>
          <div className="flex items-center gap-4 bg-black/40 p-2 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-500 uppercase px-2">Current Mode:</span>
            <span className="px-4 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-xl text-sm font-bold animate-pulse">
              Simulator Active
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Virtual Wallet Management */}
          <div className="bg-slate-900/30 border border-slate-800 p-8 rounded-3xl space-y-6 hover:border-emerald-500/30 transition-colors">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold flex items-center gap-2 text-slate-100">
                <Wallet size={20} className="text-emerald-400" /> Virtual Wallet
                </h3>
                <TrendingUp size={18} className="text-emerald-500/50" />
            </div>
            
            <div className="bg-black/50 p-6 rounded-2xl border border-slate-800/50">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Available Funds</p>
                <div className="text-4xl font-black text-white tracking-tighter">
                ${balance.toLocaleString()} <span className="text-sm text-slate-500 font-medium">USDT</span>
                </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] text-slate-500 uppercase font-bold">Set Custom Balance</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-3.5 text-slate-500">$</span>
                  <input 
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full bg-black border border-slate-700 rounded-xl py-3 pl-8 pr-4 text-white font-bold focus:border-blue-500 outline-none transition"
                    placeholder="Enter amount"
                  />
                </div>
                <button 
                  onClick={handleUpdateBalance}
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-500 px-6 rounded-xl font-bold text-sm transition active:scale-95 disabled:opacity-50"
                >
                  Update
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={handleReset}
                className="flex-1 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 py-3 rounded-xl flex items-center justify-center gap-2 transition font-bold text-sm border border-rose-500/10 active:scale-95"
              >
                <RefreshCcw size={16} /> Reset to Default ($10,000)
              </button>
            </div>
          </div>

          {/* Connectivity Selector */}
          <div className="bg-slate-900/30 border border-slate-800 p-8 rounded-3xl space-y-6 hover:border-blue-500/30 transition-colors">
            <h3 className="text-lg font-bold flex items-center gap-2 text-slate-100">
              <ShieldCheck size={20} className="text-blue-400" /> Execution Environment
            </h3>
            
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Select Provider</label>
                    <select 
                    value={selectedExchange}
                    onChange={(e) => setSelectedExchange(e.target.value)}
                    className="w-full bg-black border border-slate-700 rounded-xl p-4 text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer"
                    >
                    <option value="internal_sim">Internal Simulator (Neon DB)</option>
                    <option value="binance_testnet">Binance Testnet (SPOT)</option>
                    <option value="bybit_testnet">Bybit Testnet (Futures)</option>
                    </select>
                </div>
                
                <div className="flex gap-2 p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                    <AlertCircle size={14} className="text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-blue-300/70 leading-relaxed italic">
                    *โหมด Internal Simulator ใช้ราคา Real-time จากตลาด แต่บันทึกผลกำไรลงฐานข้อมูลส่วนตัวของคุณเอง
                    </p>
                </div>
            </div>
          </div>
        </div>

        {/* Professional Simulation Rules */}
        <div className="bg-slate-900/30 border border-slate-800 p-8 rounded-3xl">
          <h3 className="text-lg font-bold mb-8 text-slate-100 flex items-center gap-2">
              Simulation Tuning <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-500">QUANT TOOLS</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Simulated Slippage (%)</label>
              <div className="relative">
                <input type="number" defaultValue={0.05} step="0.01" className="w-full bg-black border border-slate-700 rounded-xl p-4 font-bold text-white focus:border-blue-500 outline-none transition" />
                <span className="absolute right-4 top-4 text-slate-600">%</span>
              </div>
              <p className="text-[10px] text-slate-600">จำลองการเสียราคาช่วงตลาดผันผวน</p>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Trading Fee (%)</label>
              <div className="relative">
                <input type="number" defaultValue={0.1} step="0.01" className="w-full bg-black border border-slate-700 rounded-xl p-4 font-bold text-white focus:border-blue-500 outline-none transition" />
                <span className="absolute right-4 top-4 text-slate-600">%</span>
              </div>
              <p className="text-[10px] text-slate-600">ค่าธรรมเนียมต่อออเดอร์ (Standard 0.1%)</p>
            </div>
            <div className="space-y-3 flex flex-col justify-end">
               <button 
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-95"
               >
                 {isSaving ? 'Saving Configurations...' : 'Save Simulation Config'}
               </button>
            </div>
          </div>
        </div>

        <footer className="text-center pt-8">
            <p className="text-[10px] text-slate-700 font-bold uppercase tracking-widest">
                Pair Trading Bot System v2.0 • 2026 Edition
            </p>
        </footer>
      </div>
    </div>
  );
}
