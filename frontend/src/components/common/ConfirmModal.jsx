import React from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, type = 'info' }) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch(type) {
      case 'warning': return <AlertTriangle className="w-8 h-8 text-red-500" />;
      case 'success': return <CheckCircle2 className="w-8 h-8 text-[#15D936]" />;
      default: return <Info className="w-8 h-8 text-[#157CD9]" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
            {getIcon()}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-500 text-sm mb-8">{message}</p>
          
          <div className="flex gap-3 w-full">
            <button 
              onClick={onCancel}
              className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
            >
              Tidak
            </button>
            <button 
              onClick={onConfirm}
              className="flex-1 py-3 px-4 bg-[#2A3F36] hover:bg-[#1E2D27] text-white font-bold rounded-xl shadow-lg transition-colors"
            >
              Ya, Lanjutkan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
