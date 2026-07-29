import React from 'react';
import { useUi } from '../../context/UiContext';
import { Coffee, Loader2 } from 'lucide-react';

const GlobalLoading = () => {
  const { loadingState } = useUi();

  if (!loadingState.isLoading) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-surface/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="relative">
        <div className="absolute inset-0 bg-[#1A1F16] rounded-full blur-2xl opacity-20 animate-pulse"></div>
        <div className="relative w-24 h-24 bg-surface/80 rounded-full border border-[#1A1F16]/10 flex items-center justify-center mb-6 shadow-2xl backdrop-blur-xl animate-bounce">
          <Coffee className="w-12 h-12 text-[#1A1F16]" />
        </div>
      </div>
      <h2 className="text-3xl font-black text-text-main tracking-widest mb-2 animate-pulse">YU_COFFE</h2>
      <div className="flex items-center gap-2 text-[#1A1F16] font-bold">
        <Loader2 className="w-5 h-5 animate-spin" />
        {loadingState.message}
      </div>
    </div>
  );
};

export default GlobalLoading;
