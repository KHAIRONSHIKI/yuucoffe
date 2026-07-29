import React, { useState, useEffect, useContext, useMemo } from 'react';
import api from '../../services/api';
import { SocketContext } from '../../context/SocketContext';
import { AuthContext } from '../../context/AuthContext';
import { useUi } from '../../context/UiContext';
import { useNavigate } from 'react-router-dom';
import { Receipt, CheckCircle, Clock, LogOut, Coffee, X, Printer, CheckCircle2, UserCircle2 } from 'lucide-react';
import ConfirmModal from '../../components/common/ConfirmModal';

const IncomingOrders = () => {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('Semua');
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Confirm Modal State
  const [confirmState, setConfirmState] = useState({ isOpen: false, orderId: null, actionType: null });
  
  
  const socket = useContext(SocketContext);
  const { logout } = useContext(AuthContext);
  const { showLoading, showSuccess, showAlert } = useUi();
  const navigate = useNavigate();

  const tabs = ['Semua', 'Belum Bayar', 'Baru', 'Diproses', 'Siap Diambil', 'Selesai', 'Meja'];

  useEffect(() => {
    fetchOrders();
    if (socket) {
      socket.on('new_order', (order) => {
        setOrders(prev => [order, ...prev]);
      });
      socket.on('order_updated', (order) => {
        setOrders(prev => prev.map(o => o.id === order.id ? order : o));
      });
      // In case payment confirmed elsewhere
      socket.on('payment_confirmed', () => {
        fetchOrders();
      });
      // Listen for table cleared from any Kasir
      socket.on('table_cleared', ({ tableNum }) => {
        setOrders(prev => prev.map(o => {
          const t = o.customer?.tableNum;
          // Compare both padded and unpadded versions
          if (t === tableNum || t === String(parseInt(tableNum)) || String(parseInt(t)) === String(parseInt(tableNum))) {
            return { ...o, isTableCleared: true };
          }
          return o;
        }));
      });
    }
    return () => {
      if (socket) {
        socket.off('new_order');
        socket.off('order_updated');
        socket.off('payment_confirmed');
        socket.off('table_cleared');
      }
    };
  }, [socket]);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = () => {
    showLoading(true, 'Sedang keluar...');
    setTimeout(() => {
      logout();
      showLoading(false);
      navigate('/');
    }, 1500);
  };

  const handleAction = (orderId, actionType) => {
    setConfirmState({ isOpen: true, orderId, actionType });
  };

  const executeAction = async () => {
    const { orderId, actionType } = confirmState;
    setConfirmState({ isOpen: false, orderId: null, actionType: null });
    
    showLoading(true, 'Memproses tindakan...');
    try {
      if (actionType === 'PAYMENT') {
        await api.put(`/orders/${orderId}/payment`);
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, payment: { ...o.payment, status: 'PAID' } } : o));
        showLoading(false);
        showSuccess('Pembayaran berhasil dikonfirmasi!');
      } else if (actionType === 'COOKING') {
        await api.put(`/orders/${orderId}/status`, { status: 'COOKING' });
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'COOKING' } : o));
        showLoading(false);
        showSuccess('Pesanan mulai diproses!');
      } else if (actionType === 'READY') {
        await api.put(`/orders/${orderId}/status`, { status: 'READY' });
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'READY' } : o));
        showLoading(false);
        showSuccess('Pesanan siap diambil!');
      } else if (actionType === 'COMPLETE') {
        await api.put(`/orders/${orderId}/status`, { status: 'COMPLETED' });
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'COMPLETED' } : o));
        showLoading(false);
        showSuccess('Pesanan telah diselesaikan!');
      } else if (actionType === 'CLEAR_TABLE') {
        const { tableNum } = confirmState;
        await api.put(`/orders/clear-table/${tableNum}`);
        setOrders(prev => prev.map(o => {
          if (o.customer?.tableNum === tableNum) {
            return { ...o, isTableCleared: true };
          }
          return o;
        }));
        showLoading(false);
        showSuccess(`Meja ${tableNum} berhasil dikosongkan`);
      }
      setSelectedOrder(null);
    } catch (error) {
      showLoading(false);
      showAlert('Tindakan gagal dilakukan. Coba lagi.');
    }
  };

  const handleDirectComplete = async (orderId) => {
    showLoading(true, 'Menyelesaikan pesanan...');
    try {
      await api.put(`/orders/${orderId}/status`, { status: 'COMPLETED' });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'COMPLETED' } : o));
      showLoading(false);
      showSuccess('Pesanan telah diselesaikan!');
    } catch (error) {
      showLoading(false);
      showAlert('Gagal menyelesaikan pesanan. Coba lagi.');
    }
  };

  const handleClearTable = (tableNum) => {
    setConfirmState({ isOpen: true, tableNum, actionType: 'CLEAR_TABLE' });
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (activeTab === 'Semua') return true;
      if (activeTab === 'Belum Bayar') return o.payment?.status === 'UNPAID';
      if (activeTab === 'Baru') return o.status === 'PENDING' && o.payment?.status !== 'UNPAID';
      if (activeTab === 'Diproses') return o.status === 'COOKING';
      if (activeTab === 'Siap Diambil') return o.status === 'READY';
      if (activeTab === 'Selesai') return o.status === 'COMPLETED';
      return true;
    });
  }, [orders, activeTab]);

  return (
    <div className="min-h-screen bg-[#F9F9F9] text-gray-900 font-sans pb-safe">
      <div className="min-h-screen px-4 sm:px-6 md:px-8 py-4 sm:py-6 max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="mb-4 sm:mb-6 flex justify-between items-center bg-[#F9F9F9] pt-2 pb-4 sm:pb-6 border-b border-gray-200 sticky top-0 z-20">
          <h1 className="text-base sm:text-xl md:text-2xl font-black text-[#2B4B40] uppercase tracking-wide">
            KASIR
          </h1>
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-bold transition-all text-xs sm:text-sm"
          >
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-4 sm:mb-8 flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map(tab => {
            let count = 0;
            if (tab === 'Semua') count = orders.filter(o => o.status !== 'COMPLETED').length;
            else if (tab === 'Belum Bayar') count = orders.filter(o => o.payment?.status === 'UNPAID').length;
            else if (tab === 'Baru') count = orders.filter(o => o.status === 'PENDING' && o.payment?.status !== 'UNPAID').length;
            else if (tab === 'Diproses') count = orders.filter(o => o.status === 'COOKING').length;
            else if (tab === 'Siap Diambil') count = orders.filter(o => o.status === 'READY').length;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-md font-semibold whitespace-nowrap transition-all duration-200 text-xs sm:text-sm border flex items-center gap-1.5 sm:gap-2
                ${activeTab === tab 
                  ? 'bg-[#1E2D27] text-white border-[#1E2D27]' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border-gray-200'}`}
              >
                <span>{tab}</span>
                {tab !== 'Meja' && tab !== 'Selesai' && count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab ? 'bg-red-500 text-white' : 'bg-red-500 text-white'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content Grid */}
        {activeTab === 'Meja' ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 12 }, (_, i) => {
              const tableNumStr = String(i + 1).padStart(2, '0');
              const tableNumInt = i + 1;
              const activeOrder = orders.find(o => {
                const t = o.customer?.tableNum;
                const tNum = parseInt(t);
                return tNum === tableNumInt && o.isTableCleared === false;
              });
              
              return (
                <div key={tableNumStr} onClick={() => activeOrder && handleClearTable(tableNumStr)} className={`relative flex flex-col p-3 sm:p-5 rounded-xl sm:rounded-2xl border transition-all duration-300 shadow-sm items-center justify-center text-center ${activeOrder ? 'bg-[#15D936] border-[#15D936] text-white shadow-md hover:scale-105 cursor-pointer' : 'bg-gray-100 border-gray-200 opacity-70 hover:opacity-100'}`}>
                   <Coffee className={`w-5 h-5 sm:w-7 sm:h-7 mb-1.5 sm:mb-2 ${activeOrder ? 'text-white drop-shadow-sm' : 'text-gray-400'}`} />
                   <h3 className={`text-sm sm:text-lg font-black mb-1 ${activeOrder ? 'text-white' : 'text-gray-500'}`}>Meja {tableNumStr}</h3>
                   <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md uppercase tracking-wider ${activeOrder ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'}`}>
                     {activeOrder ? 'Terisi' : 'Kosong'}
                   </span>
                   {activeOrder && (
                     <div className="absolute top-2 right-2 flex gap-1">
                       <span className={`w-2 h-2 rounded-full animate-pulse shadow-sm ${activeOrder.status === 'PENDING' ? 'bg-[#D98C15]' : activeOrder.status === 'COOKING' ? 'bg-[#157CD9]' : activeOrder.status === 'COMPLETED' ? 'bg-gray-500' : 'bg-white'}`} title={activeOrder.status}></span>
                     </div>
                   )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center text-gray-500">
              <Coffee className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-xl font-bold">Tidak ada pesanan di kategori ini</p>
            </div>
          ) : (
            filteredOrders.map(order => {
              const getStatusColor = (status) => {
                if(status === 'PENDING') return { bg: 'bg-[#FDF4E3]', text: 'text-[#D98C15]', dot: 'bg-[#D98C15]' };
                if(status === 'COOKING') return { bg: 'bg-[#E3F0FD]', text: 'text-[#157CD9]', dot: 'bg-[#157CD9]' };
                if(status === 'READY') return { bg: 'bg-[#E7FDE3]', text: 'text-[#15D936]', dot: 'bg-[#15D936]' };
                return { bg: 'bg-gray-200', text: 'text-gray-700', dot: 'bg-gray-700' };
              };
              
              const statusDisplay = order.status === 'PENDING' ? 'Baru' :
                                    order.status === 'COOKING' ? 'Di dapur' :
                                    order.status === 'READY' ? 'Siap ambil' : 'Selesai';
                                    
              const sc = getStatusColor(order.status);

              return (
              <div 
                key={order.id} 
                onClick={() => setSelectedOrder(order)}
                className="cursor-pointer bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col md:flex-row justify-between"
              >
                {/* Kiri */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-800 text-sm">#{order.id}</span>
                    <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${sc.bg} ${sc.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}></span>
                      {statusDisplay}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{order.customer.name}</h3>
                    <p className="text-sm font-medium text-gray-400 mt-0.5">Meja No.{String(order.customer.tableNum).padStart(2, '0')} / {order.items.length} item</p>
                  </div>
                </div>
                
                {/* Kanan */}
                <div className="flex flex-col items-start md:items-end gap-3 mt-4 md:mt-0">
                  <div className={`px-3 py-1 rounded-md text-[11px] font-bold ${order.payment?.status === 'PAID' ? 'bg-[#3E6553] text-white' : 'bg-red-500 text-white'}`}>
                    {order.payment?.status === 'PAID' ? `Pembayaran ${order.payment.method?.toLowerCase() || 'tunai'}` : 'Belum dibayar'}
                  </div>
                  <div className="text-right mt-1">
                    <div className="font-medium text-[#4A725D] text-[15px]">Rp {order.totalAmount.toLocaleString('id-ID')}</div>
                  </div>
                </div>
              </div>
            )})
          )}
        </div>
        )}
      </div>

      {/* RECEIPT MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm animate-in slide-in-from-bottom-4 duration-300">
            {/* Close button outside the main card */}
            <div className="absolute -top-12 right-0">
               <button onClick={() => setSelectedOrder(null)} className="p-2 bg-white text-gray-500 rounded-md hover:text-gray-900 shadow-sm border border-dashed border-gray-300">
                 <X className="w-5 h-5"/>
               </button>
            </div>
            
            {/* Main Card */}
            <div className="bg-[#F8F9F9] rounded-2xl w-full shadow-2xl flex flex-col border border-dashed border-gray-300 overflow-hidden">
              
              {/* Header Dark Green */}
              <div className="bg-[#2A3F36] p-6 text-white flex justify-between items-start">
                <div>
                  <div className="text-[10px] text-gray-300 tracking-wider mb-1 font-medium">NO. PESANAN</div>
                  <div className="text-xl font-bold">#{selectedOrder.id}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-gray-300 tracking-wider mb-1 font-medium">MEJA</div>
                  <div className="text-xl font-bold text-[#D98C15]">{String(selectedOrder.customer.tableNum).padStart(2, '0')}</div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 pb-2">
                {/* Customer Info */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                    <UserCircle2 className="w-6 h-6 text-gray-500" />
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 tracking-wider font-medium">PELANGGAN</div>
                    <div className="font-bold text-gray-900">{selectedOrder.customer.name}</div>
                  </div>
                </div>

                <div className="border-t border-dashed border-gray-300 my-5"></div>

                {/* Items */}
                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 scrollbar-hide">
                  {selectedOrder.items && selectedOrder.items.map(item => (
                    <div key={item.id} className="flex gap-3">
                      {/* Image Placeholder */}
                      <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200 flex items-center justify-center">
                        {item.menu?.image ? <img src={item.menu.image.startsWith('http') ? item.menu.image : `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000'}${item.menu.image}`} alt={item.menu.name} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100?text=Menu'; }} /> : <Coffee className="w-5 h-5 text-gray-400"/>}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div className="font-bold text-gray-800 text-[13px]">{item.quantity || 1}x {item.menu?.name || 'Menu Dihapus'}</div>
                          <div className="font-medium text-gray-500 text-[13px]">Rp {((item.price || 0) * (item.quantity || 1)).toLocaleString('id-ID')}</div>
                        </div>
                        <div className="text-[11px] text-gray-500 mt-1">Catatan : {item.note || '-'}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-dashed border-gray-300 my-5"></div>

                {/* Totals */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs text-gray-500 font-medium">
                    <span>Subtotal</span>
                    <span>Rp {selectedOrder.totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 font-medium">
                    <span>PPN 10%</span>
                    <span>Rp 0</span>
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-2">
                    <span className="font-bold text-gray-900 text-lg">Total</span>
                    <span className="font-black text-gray-900 text-lg">Rp {selectedOrder.totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="px-6 pb-6 pt-2 space-y-2">
                {selectedOrder.payment?.status !== 'PAID' && (
                  <button 
                    onClick={() => handleAction(selectedOrder.id, 'PAYMENT')}
                    className="w-full py-3 bg-[#2A3F36] hover:bg-[#1E2D27] text-white rounded-xl font-bold shadow-md transition-all flex justify-center items-center gap-2 text-sm"
                  >
                    Konfirmasi Pembayaran
                  </button>
                )}
                
                <div className="flex gap-2">
                  {selectedOrder.status === 'PENDING' && (
                    <button onClick={() => handleAction(selectedOrder.id, 'COOKING')} className="flex-1 py-3 bg-[#D98C15] text-white rounded-xl font-bold flex justify-center items-center gap-2 shadow-md hover:bg-[#B87510]">Mulai Proses</button>
                  )}
                  {selectedOrder.status === 'COOKING' && (
                    <button onClick={() => handleAction(selectedOrder.id, 'READY')} className="flex-1 py-3 bg-[#157CD9] text-white rounded-xl font-bold flex justify-center items-center gap-2 shadow-md hover:bg-[#1062B1]">Pesanan Siap</button>
                  )}
                  {(selectedOrder.status === 'READY' || selectedOrder.status === 'COMPLETED') && (
                    <button onClick={() => handleAction(selectedOrder.id, 'COMPLETE')} className={`flex-1 py-3 text-white rounded-xl font-bold flex justify-center items-center gap-2 shadow-md ${selectedOrder.status === 'COMPLETED' ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#15D936] hover:bg-[#10B329]'}`} disabled={selectedOrder.status === 'COMPLETED'}>
                      Selesai
                    </button>
                  )}
                   <button className="px-4 py-3 bg-gray-200 text-gray-600 rounded-xl hover:bg-gray-300 transition-colors" title="Print Struk">
                     <Printer className="w-5 h-5" />
                   </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal 
        isOpen={confirmState.isOpen}
        title={
          confirmState.actionType === 'PAYMENT' ? 'Konfirmasi Pembayaran' : 
          confirmState.actionType === 'COOKING' ? 'Mulai Proses Pesanan?' : 
          confirmState.actionType === 'READY' ? 'Pesanan Siap?' : 
          confirmState.actionType === 'CLEAR_TABLE' ? `Kosongkan Meja ${confirmState.tableNum}?` : 'Selesaikan Pesanan?'
        }
        message={
          confirmState.actionType === 'PAYMENT' ? 'Apakah pelanggan ini sudah berhasil melakukan pembayaran QRIS/Cash?' : 
          confirmState.actionType === 'COOKING' ? 'Tandai pesanan ini mulai diproses di dapur?' : 
          confirmState.actionType === 'READY' ? 'Tandai pesanan ini sudah selesai dimasak dan siap diambil?' : 
          confirmState.actionType === 'CLEAR_TABLE' ? 'Status pesanan di meja ini akan direset. Lanjutkan?' : 'Tandai pesanan ini sebagai selesai?'
        }
        onConfirm={executeAction}
        onCancel={() => setConfirmState({ isOpen: false, orderId: null, actionType: null, tableNum: null })}
        type={confirmState.actionType === 'PAYMENT' ? 'info' : confirmState.actionType === 'CLEAR_TABLE' ? 'warning' : 'success'}
      />
    </div>
  );
};

export default IncomingOrders;
