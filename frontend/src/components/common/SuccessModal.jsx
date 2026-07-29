import React from 'react';
import { useUi } from '../../context/UiContext';
import { Check } from 'lucide-react';

const SuccessModal = () => {
  const { successState } = useUi();

  if (!successState.isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200 pointer-events-none">
      <div className="bg-surface rounded-3xl w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-50 duration-300 flex flex-col items-center text-center">
        <div className="relative mb-4">
          <div className="absolute inset-0 bg-[#1A1F16] rounded-full blur-xl opacity-20 animate-pulse"></div>
          <div className="w-20 h-20 bg-[#1A1F16] rounded-full flex items-center justify-center text-white relative shadow-lg shadow-[#1A1F16]/20">
            <Check className="w-10 h-10 animate-[bounce_1s_ease-in-out]" />
          </div>
        </div>
        <h3 className="text-2xl font-black text-text-main mb-1">Berhasil!</h3>
        <p className="text-text-main/70 font-medium">{successState.message}</p>
      </div>
    </div>
  );
};

export default SuccessModal;
