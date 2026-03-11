'use client';
import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

export const ForceCheckButton = ({ onComplete }: { onComplete?: () => void }) => {
  const [loading, setLoading] = useState(false);

  const handleForceCheck = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/trade');
      const data = await res.json();
      console.log('Bot Check Result:', data);
      
      if (onComplete) {
        onComplete();
      } else {
        window.location.reload(); 
      }
    } catch (err) {
      console.error('Failed to trigger bot:', err);
      alert('Failed to trigger bot check');
    }
    setLoading(false);
  };

  return (
    <button 
      onClick={handleForceCheck}
      disabled={loading}
      className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold shadow-lg shadow-blue-900/20 active:scale-95 disabled:opacity-50"
    >
      <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
      {loading ? 'Checking...' : 'Force Check Signal'}
    </button>
  );
};
