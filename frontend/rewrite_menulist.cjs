const fs = require('fs');

const content = `import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';
import { useUi } from '../../context/UiContext';
import { Coffee, MapPin, ShoppingBag, Flame, Plus, Star, Clock, Search, Grid, Utensils, X, QrCode } from 'lucide-react';
import ConfirmModal from '../../components/common/ConfirmModal';

const formatRupiah = (num) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);
};

const MenuList = () => {
  const [menus, setMenus] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isQrisOpen, setIsQrisOpen] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const { user, logout } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  const { showLoading, showSuccess } = useUi();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMenus();
    if (socket) {
      socket.on('payment_confirmed', (data) => {
        if (data.orderId === currentOrderId) {
          setIsQrisOpen(false);
          showSuccess('Pembayaran Berhasil! Pesanan diproses.');
          navigate('/tracking');
        }
      });
    }
    return () => {
      if (socket) socket.off('payment_confirmed');
    };
  }, [socket, currentOrderId, navigate, showSuccess]);

  const fetchMenus = async () => {
    try {
      const res = await api.get('/menu');
      setMenus(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const addToCart = (menu) => {
    const existing = cart.find(item => item.id === menu.id);
    if (existing) {
      setCart(cart.map(item => item.id === menu.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...menu, quantity: 1 }]);
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const totalCart = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const requestCheckout = () => {
    if (cart.length === 0) return;
    setIsConfirmOpen(true);
  };

  const executeCheckout = async () => {
    setIsConfirmOpen(false);
    showLoading(true, 'Membuat pesanan...');
    try {
      const items = cart.map(c => ({ menuId: c.id, quantity: c.quantity }));
      const res = await api.post('/orders', { items, paymentMethod: 'QRIS' });
      setCurrentOrderId(res.data.id);
      setIsCartOpen(false);
      showLoading(false);
      setIsQrisOpen(true);
      setCart([]);
    } catch (error) {
      showLoading(false);
      alert('Gagal checkout');
    }
  };

  const simulatePaymentConfirm = async () => {
    showLoading(true, 'Memproses simulasi...');
    try {
      await api.put(\`/orders/\${currentOrderId}/payment\`);
      showLoading(false);
    } catch (error) {
      showLoading(false);
      console.error(error);
    }
  };

  const filteredMenus = menus.filter(m => {
    if (activeCategory !== 'Semua' && m.category !== activeCategory) return false;
    if (searchTerm && !m.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const featuredMenu = menus.length > 0 ? menus[0] : null;

  return (
    <div className="bg-background min-h-screen pb-24 font-sans text-text-main relative">
      {/* Header */}
      <header className="px-6 pt-8 pb-4 flex justify-between items-start sticky top-0 bg-background/95 backdrop-blur-sm z-30">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <Coffee className="w-5 h-5 text-[#4A3B32]" />
             <h1 className="text-xl font-black tracking-tight text-[#2B231D]">YUUCOFFE</h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#2B231D]/60 font-medium">
             <MapPin className="w-3 h-3" />
             <span className="capitalize">{user?.name || 'Pelanggan'}</span>
             <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
             <span className="bg-[#E6EBE0] border border-gray-200 px-2 py-0.5 rounded-full shadow-sm text-text-main">Meja {user?.username || '-'}</span>
          </div>
        </div>
        <button onClick={() => setIsCartOpen(true)} className="relative w-12 h-12 bg-[#1A1F16] text-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-black transition-colors">
          <ShoppingBag className="w-5 h-5" />
          {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-utang text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold border-2 border-white">{cart.length}</span>}
        </button>
      </header>

      {/* Search & Filters */}
      <div className="px-6 mb-6">
        <div className="relative mb-4">
          <input 
            type="text" 
            placeholder="Cari menu favorit..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-2xl py-3.5 px-5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent" 
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
           {['Semua', 'Kopi', 'Non-Kopi', 'Makanan'].map((cat, i) => {
             const Icon = i === 0 ? Grid : i === 3 ? Utensils : Coffee;
             return (
               <button 
                 key={cat} 
                 onClick={() => setActiveCategory(cat)} 
                 className={\`px-4 py-2 rounded-2xl text-sm font-semibold whitespace-nowrap flex items-center gap-2 border transition-all \${activeCategory === cat ? 'bg-[#1A1F16] text-white border-transparent shadow-md' : 'bg-white text-text-main/70 border-gray-100 shadow-sm hover:bg-gray-50'}\`}
               >
                 <Icon className="w-4 h-4" />
                 {cat}
               </button>
             )
           })}
        </div>
      </div>

      {/* Featured Menu */}
      {featuredMenu && activeCategory === 'Semua' && !searchTerm && (
        <div className="px-6 mb-8">
           <div className="relative rounded-[2rem] overflow-hidden h-56 shadow-lg">
             <img src={featuredMenu.image || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2047&auto=format&fit=crop'} className="w-full h-full object-cover" alt="Featured" />
             <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent"></div>
             <div className="absolute inset-0 p-6 flex flex-col justify-between">
                <div>
                   <div className="flex items-center gap-1 text-accent font-bold text-xs mb-2 tracking-wider">
                      <Flame className="w-3 h-3" /> PILIHAN HARI INI
                   </div>
                   <h3 className="text-white text-2xl font-black mb-1">{featuredMenu.name}</h3>
                   <p className="text-white/80 text-xs line-clamp-2 w-3/4">{featuredMenu.description}</p>
                </div>
                <div className="flex items-end justify-between">
                   <div className="flex items-center gap-3">
                      <span className="text-white font-bold text-lg">{formatRupiah(featuredMenu.price)}</span>
                      <span className="bg-accent text-white text-[10px] px-2.5 py-1 rounded-md font-bold">TERLARIS</span>
                   </div>
                   <button onClick={() => addToCart(featuredMenu)} className="w-12 h-12 bg-piutang/90 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-xl hover:bg-piutang transition-transform active:scale-95">
                      <Plus className="w-6 h-6" />
                   </button>
                </div>
             </div>
           </div>
        </div>
      )}

      {/* Grid */}
      <div className="px-6">
        <div className="flex justify-between items-end mb-4">
           <h2 className="text-lg font-bold text-[#2B231D]">Semua Menu</h2>
           <span className="text-xs font-medium text-text-main/50">{filteredMenus.length} item</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
           {filteredMenus.map((menu, index) => (
             <div key={menu.id} className="bg-white rounded-[1.5rem] p-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-50 flex flex-col">
                <div className="relative h-32 rounded-2xl overflow-hidden mb-3">
                   <img src={menu.image || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2047&auto=format&fit=crop'} className="w-full h-full object-cover" alt={menu.name} />
                   <div className={\`absolute top-2 left-2 text-white text-[9px] font-bold px-2 py-0.5 rounded-md \${index % 2 === 0 ? 'bg-utang' : 'bg-accent'}\`}>
                     {index % 2 === 0 ? 'TERLARIS' : 'FAVORIT'}
                   </div>
                   <button onClick={() => addToCart(menu)} className="absolute bottom-2 right-2 w-8 h-8 bg-piutang/90 backdrop-blur-sm rounded-full flex items-center justify-center text-white shadow-md active:scale-95 hover:bg-piutang">
                      <Plus className="w-4 h-4" />
                   </button>
                </div>
                <div className="px-1 pb-1 flex-1 flex flex-col">
                   <h3 className="font-bold text-sm leading-tight mb-1 text-[#2B231D]">{menu.name}</h3>
                   <p className="text-[10px] text-text-main/60 line-clamp-2 mb-3 flex-1">{menu.description}</p>
                   <div className="flex items-center justify-between mt-auto">
                      <span className="font-bold text-sm text-text-main">{formatRupiah(menu.price)}</span>
                      <div className="flex items-center gap-1.5 text-[9px] text-text-main/50 font-medium">
                         <span className="flex items-center gap-0.5"><Star className="w-2.5 h-2.5 text-accent fill-accent" /> 4.8</span>
                         <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> 5m</span>
                      </div>
                   </div>
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* Cart Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-text-main/50 z-50 flex items-end sm:items-center justify-center animate-in fade-in duration-200">
          <div className="bg-surface w-full sm:max-w-md sm:rounded-2xl rounded-t-[2rem] max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-8 duration-300">
            <div className="p-6 border-b border-black/5 flex justify-between items-center">
              <h3 className="font-bold text-xl">Keranjang Anda</h3>
              <button onClick={() => setIsCartOpen(false)} className="p-2 bg-background rounded-full hover:bg-gray-200"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
                  <div>
                    <h4 className="font-bold text-[#2B231D]">{item.name}</h4>
                    <p className="text-sm text-text-main/70">{formatRupiah(item.price)} x {item.quantity}</p>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-utang text-xs font-bold bg-utang/10 px-3 py-1.5 rounded-lg">Hapus</button>
                </div>
              ))}
              {cart.length === 0 && (
                 <div className="text-center py-10 text-text-main/50 font-medium">
                    Belum ada pesanan di keranjang
                 </div>
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-6 border-t border-black/5 bg-white sm:rounded-b-2xl">
                <div className="flex justify-between font-bold text-lg mb-6">
                  <span>Total Bayar</span>
                  <span className="text-piutang text-xl">{formatRupiah(totalCart)}</span>
                </div>
                <button onClick={requestCheckout} className="w-full py-4 rounded-2xl bg-piutang text-white font-bold text-lg hover:bg-piutang/90 transition-colors shadow-lg shadow-piutang/30 active:scale-95">
                  Bayar Sekarang
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QRIS Modal */}
      {isQrisOpen && (
        <div className="fixed inset-0 bg-text-main/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="bg-text-main p-8 text-center text-white relative overflow-hidden">
              <QrCode className="w-12 h-12 mx-auto mb-3 relative z-10" />
              <h2 className="text-xl font-bold relative z-10">Scan QRIS</h2>
              <p className="opacity-80 text-sm relative z-10">Tunjukkan atau scan di kasir</p>
            </div>
            <div className="p-8 text-center bg-white">
              <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" alt="QRIS" className="w-48 h-48 mx-auto mb-6 p-4 bg-surface rounded-2xl shadow-sm border border-gray-100" />
              <div className="text-sm text-text-main/70 mb-1 font-medium">Total Tagihan</div>
              <div className="text-3xl font-black text-text-main mb-6">{formatRupiah(totalCart)}</div>
              
              <div className="bg-accent/10 text-accent py-3 px-4 rounded-xl text-sm font-bold mb-6 flex items-center justify-center gap-2 border border-accent/20">
                <span className="w-2.5 h-2.5 rounded-full bg-accent animate-ping shrink-0"></span>
                Menunggu Konfirmasi...
              </div>

              {/* SIMULATION BUTTON - FOR DEMO ONLY */}
              <button onClick={simulatePaymentConfirm} className="w-full py-3 rounded-xl border-2 border-dashed border-text-main/20 text-text-main/50 font-bold text-sm hover:border-text-main hover:text-text-main hover:bg-text-main/5 transition-colors">
                (Simulasi) Konfirmasi Kasir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal 
        isOpen={isConfirmOpen}
        title="Konfirmasi Pesanan"
        message={\`Anda akan memesan \${cart.length} item dengan total \${formatRupiah(totalCart)}.\`}
        onConfirm={executeCheckout}
        onCancel={() => setIsConfirmOpen(false)}
        type="info"
      />
    </div>
  );
};

export default MenuList;
`;

fs.writeFileSync('src/pages/customer/MenuList.jsx', content, 'utf8');
