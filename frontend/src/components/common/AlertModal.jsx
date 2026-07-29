import React from 'react';
import { AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';

const AlertModal = ({ isOpen, title, message, onClose, type = 'error' }) => {
  if (!isOpen) return null;

  const config = {
    error: {
      icon: <AlertTriangle className="w-8 h-8 text-red-500" />,
      bg: 'bg-red-100',
      btn: 'bg-red-500 hover:bg-red-600',
    },
    warning: {
      icon: <AlertTriangle className="w-8 h-8 text-[#D98C15]" />,
      bg: 'bg-amber-100',
      btn: 'bg-[#D98C15] hover:bg-[#B87510]',
    },
    info: {
      icon: <Info className="w-8 h-8 text-[#157CD9]" />,
      bg: 'bg-blue-100',
      btn: 'bg-[#157CD9] hover:bg-[#1062B1]',
    },
    success: {
      icon: <CheckCircle2 className="w-8 h-8 text-[#15D936]" />,
      bg: 'bg-green-100',
      btn: 'bg-[#15D936] hover:bg-[#10B329]',
    },
  };

  const c = config[type] || config.error;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-300 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex flex-col items-center text-center pt-2">
          <div className={`w-16 h-16 ${c.bg} rounded-full flex items-center justify-center mb-4 shadow-inner`}>
            {c.icon}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-500 text-sm mb-6">{message}</p>
          <button
            onClick={onClose}
            className={`w-full py-3 px-4 ${c.btn} text-white font-bold rounded-xl shadow-lg transition-colors`}
          >
            Oke, Mengerti
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
