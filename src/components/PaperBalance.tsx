'use client';
import { useState, useEffect } from 'react';
import { Landmark } from 'lucide-react';

export const PaperBalance = ({ initialBalance }: { initialBalance: number }) => {
  return (
    <div className="flex flex-col">
      <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Paper Balance (Virtual)</span>
      <div className="flex items-center gap-2">
        <Landmark size={16} className="text-blue-400" />
        <span className="text-xl font-black text-white">
          ${initialBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <span className="text-xs text-slate-500 ml-1 font-medium">USDT</span>
        </span>
      </div>
    </div>
  );
};
