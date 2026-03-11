'use client';
import { AlertTriangle } from 'lucide-react';

export const PanicButton = () => {
  const handlePanicClose = async () => {
    if (confirm('CAUTION: Are you sure you want to CLOSE ALL POSITIONS and STOP all bots immediately?')) {
      try {
        const res = await fetch('/api/trade/panic-close', { method: 'POST' });
        const data = await res.json();
        alert(data.message);
        window.location.reload(); // รีโหลดเพื่ออัปเดตสถานะหน้าจอ
      } catch (error) {
        alert('Failed to execute panic close. Please check exchange manually.');
      }
    }
  };

  return (
    <button 
      onClick={handlePanicClose}
      className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition font-bold shadow-lg shadow-rose-900/20"
    >
      <AlertTriangle size={18} /> PANIC CLOSE
    </button>
  );
};
