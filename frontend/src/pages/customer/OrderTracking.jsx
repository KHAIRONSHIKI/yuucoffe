import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { SocketContext } from '../../context/SocketContext';
import { AuthContext } from '../../context/AuthContext';
import { CheckCircle2, Clock, ChefHat, CupSoda, Coffee, MapPin, LogOut, Receipt } from 'lucide-react';

const formatRupiah = (num) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);
};

const OrderTracking = () => {
  const [orders, setOrders] = useState([]);
  const [completedOrder, setCompletedOrder] = useState(null);
  const { user, logout } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyOrders();
    if (socket && user?.id) {
      socket.on(`order_status_${user.id}`, (updatedOrder) => {
        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? { ...o, status: updatedOrder.status } : o));
        
        // Show notification if it's completed
        if (updatedOrder.status === 'COMPLETED') {
          setCompletedOrder(updatedOrder);
        }
      });
    }
    return () => {
      if (socket && user?.id) socket.off(`order_status_${user.id}`);
    };
  }, [socket, user]);

  const fetchMyOrders = async () => {
    try {
      const res = await api.get('/orders/my-orders');
      setOrders(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const getStatusInfo = (status) => {
    const steps = ['PENDING', 'COOKING', 'READY', 'COMPLETED'];
    // eslint-disable-next-line no-unused-vars
    const _currentIndex = steps.indexOf(status) !== -1 ? steps.indexOf(status) : 0;

    switch (status) {
      case 'PENDING': return { text: 'Menunggu Konfirmasi', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500', lightBg: 'bg-orange-50', border: 'border-orange-200', step: 1 };
      case 'COOKING': return { text: 'Sedang Disiapkan', icon: ChefHat, color: 'text-blue-500', bg: 'bg-blue-500', lightBg: 'bg-blue-50', border: 'border-blue-200', step: 2 };
      case 'READY': return { text: 'Siap Diambil', icon: CupSoda, color: 'text-green-500', bg: 'bg-green-500', lightBg: 'bg-green-50', border: 'border-green-200', step: 3 };
      case 'COMPLETED': return { text: 'Selesai', icon: CheckCircle2, color: 'text-gray-500', bg: 'bg-gray-500', lightBg: 'bg-gray-50', border: 'border-gray-200', step: 4 };
      default: return { text: status, icon: Clock, color: 'text-gray-500', bg: 'bg-gray-500', lightBg: 'bg-gray-50', border: 'border-gray-200', step: 0 };
    }
  };

  return (
    <div className="min-h-screen bg-background pb-safe font-sans text-text-main relative">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="px-4 sm:px-6 pt-6 pb-4 flex justify-between items-start sticky top-0 bg-background/95 backdrop-blur-md z-30 border-b border-gray-200">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Coffee className="w-4 h-4 sm:w-5 sm:h-5 text-[#4A3B32] shrink-0" />
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-[#2B231D]">YUUCOFFE</h1>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#2B231D]/60 font-medium flex-wrap">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="capitalize truncate max-w-[120px]">{user?.name || 'Pelanggan'}</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full shrink-0"></span>
              <span className="bg-[#E6EBE0] border border-gray-200 px-2 py-0.5 rounded-full shadow-sm text-text-main whitespace-nowrap">Meja {user?.tableNum || '-'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-3 shrink-0">
            <button onClick={() => navigate('/menu')} className="px-3 py-2 sm:px-4 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors whitespace-nowrap">
              Menu
            </button>
            <button onClick={logout} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors">
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </header>

        <main className="px-4 sm:px-6 py-6">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-[#1A1F16] mb-1">Lacak Pesanan</h2>
            <p className="text-xs sm:text-sm text-gray-500">Pantau status pesanan Anda secara real-time</p>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-8 sm:p-10 text-center shadow-sm border border-gray-100 flex flex-col items-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Receipt className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300" />
              </div>
              <h3 className="font-bold text-base sm:text-lg text-[#1A1F16] mb-2">Belum ada pesanan</h3>
              <p className="text-gray-500 text-sm mb-6">Anda belum memesan apapun hari ini.</p>
              <button onClick={() => navigate('/menu')} className="px-6 py-3 bg-[#1A1F16] text-white font-bold rounded-xl shadow-lg hover:bg-black transition-colors">
                Lihat Menu
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map(order => {
                const statusInfo = getStatusInfo(order.status);
                const Icon = statusInfo.icon;

                return (
                  <div key={order.id} className={`bg-white rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden shadow-lg border ${statusInfo.border} transition-all duration-500`}>

                    {/* Header Card */}
                    <div className={`${statusInfo.lightBg} p-4 sm:p-6 border-b ${statusInfo.border}`}>
                      <div className="flex justify-between items-start mb-4 gap-3">
                        <div className="min-w-0">
                          <div className="text-[10px] sm:text-xs font-bold text-gray-400 tracking-wider mb-1">ORDER #{order.id}</div>
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 sm:p-2 rounded-lg ${statusInfo.bg} text-white shadow-md shrink-0`}>
                              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <span className={`text-base sm:text-lg font-black ${statusInfo.color} leading-tight`}>{statusInfo.text}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[10px] sm:text-xs font-bold text-gray-400 tracking-wider mb-1">TOTAL</div>
                          <div className="font-black text-lg sm:text-xl text-[#1A1F16]">{formatRupiah(order.totalAmount)}</div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4 relative">
                        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 rounded-full z-0"></div>
                        <div className={`absolute top-1/2 left-0 h-1 ${statusInfo.bg} -translate-y-1/2 rounded-full z-0 transition-all duration-1000`} style={{ width: `${((statusInfo.step - 1) / 3) * 100}%` }}></div>

                        <div className="relative z-10 flex justify-between">
                          {[1, 2, 3, 4].map(step => (
                            <div key={step} className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-4 ${step <= statusInfo.step ? statusInfo.bg + ' border-white' : 'bg-gray-200 border-white'} shadow-sm transition-colors duration-500`}></div>
                          ))}
                        </div>
                        <div className="flex justify-between mt-2 text-[9px] sm:text-[10px] font-bold text-gray-400">
                          <span className={statusInfo.step >= 1 ? 'text-gray-700' : ''}>Tunggu</span>
                          <span className={statusInfo.step >= 2 ? 'text-gray-700' : ''}>Proses</span>
                          <span className={statusInfo.step >= 3 ? 'text-gray-700' : ''}>Siap</span>
                          <span className={statusInfo.step >= 4 ? 'text-gray-700' : ''}>Selesai</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Items List */}
                    <div className="p-4 sm:p-6">
                      <h4 className="text-xs sm:text-sm font-bold text-[#1A1F16] mb-4 flex items-center gap-2">
                        <Receipt className="w-4 h-4" /> Daftar Item
                      </h4>
                      <div className="space-y-3 sm:space-y-4">
                        {order.items?.map(item => (
                          <div key={item.id} className="flex justify-between items-start gap-2">
                            <div className="flex gap-2 sm:gap-3 min-w-0">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                                <img src={item.menu?.image || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=400&auto=format&fit=crop'} alt={item.menu?.name || 'Menu'} className="w-full h-full object-cover" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-[#1A1F16] text-xs sm:text-sm leading-tight mb-1 truncate">{item.menu?.name || 'Menu Dihapus'}</div>
                                {item.note && <div className="text-[10px] sm:text-[11px] font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md inline-block border border-gray-100 truncate max-w-full">{item.note}</div>}
                              </div>
                            </div>
                            <div className="text-right shrink-0 ml-1">
                              <div className="text-xs sm:text-sm font-bold text-[#4A725D]">{formatRupiah(item.price || 0)}</div>
                              <div className="text-[10px] sm:text-xs text-gray-400 font-medium">x{item.quantity || 1}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Completion Modal */}
      {completedOrder && (
        <div className="fixed inset-0 bg-text-main/60 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 p-6 sm:p-8 text-center border-2 border-green-500 relative">
            <button onClick={() => setCompletedOrder(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800">✕</button>
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-inner">
              <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1A1F16] mb-2">Pesanan Selesai!</h2>
            <p className="text-gray-600 font-medium mb-5 sm:mb-6 text-sm sm:text-base">
              Pesanan selesai, pelayan akan segera mengantarkannya.
            </p>
            <button 
              onClick={() => setCompletedOrder(null)}
              className="w-full py-3 bg-green-500 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 hover:bg-green-600 transition-colors active:scale-95"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;
