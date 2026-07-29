import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';
import { useUi } from '../../context/UiContext';
import { Coffee, MapPin, ShoppingBag, Flame, Plus, Minus, Trash2, Star, Clock, Search, Grid, Utensils, X, QrCode, Download } from 'lucide-react';
import ConfirmModal from '../../components/common/ConfirmModal';
import { QRCodeCanvas } from 'qrcode.react';
import { generateDynamicQris } from '../../utils/qris';

const formatRupiah = (num) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);
};

const MenuList = () => {
  const [menus, setMenus] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isQrisOpen, setIsQrisOpen] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [checkoutAmount, setCheckoutAmount] = useState(0);
  
  const [qrisTimeLeft, setQrisTimeLeft] = useState(15 * 60); // 15 minutes
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  
  // Product Modal State
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [modalSize, setModalSize] = useState('Kecil');
  const [modalNote, setModalNote] = useState('');
  const [modalQuantity, setModalQuantity] = useState(1);

  const { user, logout } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  const { showLoading, showSuccess, showAlert } = useUi();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMenus();
    if (socket) {
      socket.on('payment_confirmed', async (data) => {
        if (data.orderId === currentOrderId) {
          setIsQrisOpen(false);
          // Fetch the full order details for the receipt
          try {
            const res = await api.get('/orders/my-orders');
            const confirmedOrder = res.data.find(o => o.id === currentOrderId);
            if (confirmedOrder) {
              setReceiptData(confirmedOrder);
              setIsReceiptOpen(true);
              showSuccess('Pembayaran Berhasil! Pesanan diproses.');
            } else {
              // fallback if not found
              navigate('/tracking');
            }
          } catch (error) {
            navigate('/tracking');
          }
        }
      });
      // Refresh menu list whenever any order changes stock
      socket.on('menu_updated', () => {
        fetchMenus();
      });
    }
    return () => {
      if (socket) {
        socket.off('payment_confirmed');
        socket.off('menu_updated');
      }
    };
  }, [socket, currentOrderId, navigate, showSuccess]);

  // QRIS Timer logic
  useEffect(() => {
    let interval = null;
    if (isQrisOpen && qrisTimeLeft > 0) {
      interval = setInterval(() => {
        setQrisTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isQrisOpen && qrisTimeLeft <= 0) {
      // Waktu habis, otomatis cancel pesanan
      const cancelExpiredOrder = async () => {
        try {
          await api.put(`/orders/${currentOrderId}/cancel`);
        } catch(e) {
          console.error('Failed to cancel order', e);
        }
        setIsQrisOpen(false);
        showAlert('Waktu pembayaran QRIS habis. Pesanan telah dibatalkan.', 'Waktu Habis', 'warning');
      };
      cancelExpiredOrder();
    }
    return () => clearInterval(interval);
  }, [isQrisOpen, qrisTimeLeft, currentOrderId]);

  const readyMenus = menus.filter(m => m.isAvailable);

  // Auto Slider logic
  useEffect(() => {
    if (readyMenus.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % readyMenus.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [readyMenus.length]);

  const fetchMenus = async () => {
    try {
      const res = await api.get('/menu');
      setMenus(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const getParsedOptions = (menu) => {
    if (!menu) return [];
    if (Array.isArray(menu.options)) return menu.options;
    try {
      return menu.options ? JSON.parse(menu.options) : [];
    } catch {
      return [];
    }
  };

  const openProductModal = (menu) => {
    setSelectedMenu(menu);
    const opts = getParsedOptions(menu);
    if (opts && opts.length > 0) {
      const firstAvailable = opts.find(o => (parseInt(o.stock) || 0) > 0);
      setModalSize(firstAvailable ? firstAvailable.name : opts[0].name);
    } else {
      setModalSize('');
    }
    setModalNote('');
    setModalQuantity(1);
  };

  const closeProductModal = () => {
    setSelectedMenu(null);
  };

  const addToCartFromModal = () => {
    if (!selectedMenu) return;
    
    const opts = getParsedOptions(selectedMenu);
    const selectedOption = opts.find(o => o.name === modalSize);
    const priceModifier = selectedOption ? (parseInt(selectedOption.priceModifier) || 0) : 0;
    
    let finalPrice = selectedMenu.price + priceModifier;

    const sizeText = modalSize ? `Opsi: ${modalSize}` : '';
    const noteText = modalNote ? `Catatan: ${modalNote}` : '';
    const combinedNote = [sizeText, noteText].filter(Boolean).join(' | ');

    // Unique ID for cart item based on menu + size + note
    const cartItemId = `${selectedMenu.id}-${modalSize}-${modalNote}`;

    const existing = cart.find(item => item.cartItemId === cartItemId);
    
    if (existing) {
      setCart(cart.map(item => 
        item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + modalQuantity } : item
      ));
    } else {
      setCart([...cart, { 
        ...selectedMenu, 
        cartItemId,
        quantity: modalQuantity, 
        cartPrice: finalPrice,
        note: combinedNote,
        optionName: modalSize
      }]);
    }
    
    closeProductModal();
  };

  const updateCartQuantity = (cartItemId, delta) => {
    setCart(prevCart => {
      const updated = prevCart.map(item => {
        if (item.cartItemId === cartItemId) {
          return { ...item, quantity: item.quantity + delta };
        }
        return item;
      });
      return updated.filter(item => item.quantity > 0);
    });
  };

  const removeFromCart = (cartItemId) => {
    setCart(cart.filter(item => item.cartItemId !== cartItemId));
  };

  const totalCart = cart.reduce((acc, item) => acc + (item.cartPrice * item.quantity), 0);

  // Calculate total quantity of a menu across all variants (sizes/notes)
  const getTotalMenuQuantity = (menuId) => {
    return cart.filter(c => c.id === menuId).reduce((sum, item) => sum + item.quantity, 0);
  };

  const requestCheckout = () => {
    if (cart.length === 0) return;
    executeCheckout();
  };

  const executeCheckout = async () => {
    showLoading(true, 'Membuat pesanan...');
    try {
      // Backend expects { menuId, quantity, note }
      const items = cart.map(c => ({ 
        menuId: c.id, 
        quantity: c.quantity,
        note: c.note,
        optionName: c.optionName
      }));
      const res = await api.post('/orders', { items, paymentMethod: 'QRIS' });
      setCurrentOrderId(res.data.id);
      setCheckoutAmount(totalCart);
      setIsCartOpen(false);
      showLoading(false);
      setQrisTimeLeft(15 * 60); // Reset timer to 15 minutes
      setIsQrisOpen(true);
      setCart([]);
    } catch (error) {
      showLoading(false);
      showAlert('Gagal membuat pesanan. Coba lagi.');
    }
  };

  const filteredMenus = menus.filter(m => {
    if (activeCategory !== 'Semua' && m.category?.toLowerCase() !== activeCategory.toLowerCase()) return false;
    if (searchTerm && !m.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const featuredMenu = readyMenus.length > 0 ? readyMenus[currentSlideIndex] : null;

  return (
    <div className="bg-background min-h-screen pb-24 font-sans text-text-main relative">
      <div className="max-w-5xl mx-auto">
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
               <span className="bg-[#E6EBE0] border border-gray-200 px-2 py-0.5 rounded-full shadow-sm text-text-main">Meja {user?.tableNum || '-'}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/tracking')} className="relative w-12 h-12 bg-white border border-gray-200 text-[#1A1F16] rounded-2xl flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors">
              <Clock className="w-5 h-5" />
            </button>
            <button onClick={() => setIsCartOpen(true)} className="relative w-12 h-12 bg-[#1A1F16] text-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-black transition-colors">
              <ShoppingBag className="w-5 h-5" />
              {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-utang text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold border-2 border-white">{cart.reduce((a,c) => a + c.quantity, 0)}</span>}
            </button>
          </div>
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
             {['Semua', 'Minuman', 'Makanan', 'Snack'].map((cat, i) => {
               const Icon = i === 0 ? Grid : i === 2 ? Utensils : Coffee;
               return (
                 <button 
                   key={cat} 
                   onClick={() => setActiveCategory(cat)} 
                   className={`px-4 py-2 rounded-2xl text-sm font-semibold whitespace-nowrap flex items-center gap-2 border transition-all ${activeCategory === cat ? 'bg-[#1A1F16] text-white border-transparent shadow-md' : 'bg-white text-text-main/70 border-gray-100 shadow-sm hover:bg-gray-50'}`}
                 >
                   <Icon className="w-4 h-4" />
                   {cat}
                 </button>
               )
             })}
          </div>
        </div>

        {/* Featured Menu Slider */}
        {featuredMenu && activeCategory === 'Semua' && !searchTerm && (
          <div className="px-6 mb-8 relative">
            <div onClick={() => openProductModal(featuredMenu)} className="relative rounded-[2rem] overflow-hidden shadow-lg group cursor-pointer" style={{height: 'clamp(200px, 40vw, 320px)'}}>
              {readyMenus.map((menu, idx) => (
                <div key={menu.id} className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentSlideIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                  <img src={menu.image || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2047&auto=format&fit=crop'} className="w-full h-full object-cover object-bottom" alt="Featured" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent"></div>
                  <div className="absolute inset-0 p-5 md:p-6 flex flex-col justify-between">
                     <div>
                        <div className="flex items-center gap-1 text-accent font-bold text-xs mb-2 tracking-wider">
                           <Flame className="w-3 h-3" /> PILIHAN HARI INI
                        </div>
                        <h3 className="text-white text-xl md:text-2xl font-black mb-1 drop-shadow-md">{menu.name}</h3>
                        <p className="text-white/90 text-xs line-clamp-2 w-3/4 drop-shadow-md">{menu.description}</p>
                     </div>
                     <div className="flex items-end justify-between">
                        <div className="flex items-center gap-2 md:gap-3">
                           <span className="text-white font-bold text-base md:text-lg drop-shadow-md">{formatRupiah(menu.price)}</span>
                           <span className="bg-accent text-white text-[10px] px-2.5 py-1 rounded-md font-bold">TERSEDIA</span>
                        </div>
                        
                        <div className="relative" onClick={(e) => { e.stopPropagation(); openProductModal(menu); }}>
                           {getTotalMenuQuantity(menu.id) > 0 && (
                             <span className="absolute -top-2 -right-2 bg-utang text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full z-10 shadow-sm border-2 border-white">{getTotalMenuQuantity(menu.id)}</span>
                           )}
                           <button className="w-10 h-10 md:w-12 md:h-12 bg-piutang/90 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-xl hover:bg-piutang transition-transform active:scale-95">
                              <Plus className="w-5 h-5 md:w-6 md:h-6" />
                           </button>
                        </div>
                     </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Slider Dots */}
            {readyMenus.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-20">
                {readyMenus.map((_, idx) => (
                  <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentSlideIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/40'}`}></div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Grid */}
        <div className="px-6">
          <div className="flex justify-between items-end mb-4">
             <h2 className="text-lg font-bold text-[#2B231D]">Semua Menu</h2>
             <span className="text-xs font-medium text-text-main/50">{filteredMenus.length} item</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
             {filteredMenus.map((menu, index) => (
               <div key={menu.id} onClick={() => openProductModal(menu)} className="bg-white rounded-[1.5rem] p-2.5 md:p-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-50 flex flex-col group hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all cursor-pointer relative">
                  {/* Image */}
                  <div className="relative h-32 md:h-40 rounded-2xl overflow-hidden mb-3">
                     <img src={menu.image || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2047&auto=format&fit=crop'} className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110" alt={menu.name} />
                    <div className={`absolute top-2 left-2 text-white text-[9px] font-bold px-2 py-0.5 rounded-md ${index % 2 === 0 ? 'bg-utang' : 'bg-accent'}`}>
                      {index % 2 === 0 ? 'TERLARIS' : 'FAVORIT'}
                    </div>
                 </div>
                 {/* Info */}
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
                 {/* Add Button - always visible, bottom-right of card */}
                 <div
                   className="absolute bottom-3 right-3"
                   onClick={(e) => { e.stopPropagation(); openProductModal(menu); }}
                 >
                   {getTotalMenuQuantity(menu.id) > 0 && (
                     <span className="absolute -top-2 -right-2 bg-utang text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full z-10 border-2 border-white shadow-sm">{getTotalMenuQuantity(menu.id)}</span>
                   )}
                   <button className="w-8 h-8 bg-piutang rounded-full flex items-center justify-center text-white shadow-md active:scale-95 hover:bg-piutang/80 transition-all">
                     <Plus className="w-4 h-4" />
                   </button>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedMenu && (
         <div className="fixed inset-0 bg-black/70 z-[60] flex items-end sm:items-center justify-center animate-in fade-in duration-200" onClick={closeProductModal}>
           <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-8 duration-300 relative overflow-hidden" onClick={e => e.stopPropagation()}>
             
             {/* Close Button */}
             <button onClick={closeProductModal} className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm shadow-md p-1.5 rounded-full z-20 transition-colors border border-gray-100 hover:bg-gray-100">
               <X className="w-4 h-4 text-gray-700" />
             </button>

             {/* Image — compact height */}
             <div className="w-full h-40 sm:h-44 relative bg-gray-100 shrink-0">
               <img src={selectedMenu.image || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2047&auto=format&fit=crop'} className="w-full h-full object-cover object-center" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
             </div>

             {/* Content */}
             <div className="px-5 pt-4 pb-5 flex flex-col gap-3">

               {/* Name + Price */}
               <div className="flex items-start justify-between gap-2">
                 <div>
                   <h2 className="text-2xl font-black text-[#2B231D] leading-tight">{selectedMenu.name}</h2>
                   <p className="text-xs text-text-main/55 mt-0.5 line-clamp-1">{selectedMenu.description}</p>
                 </div>
                 <div className="text-lg font-black text-piutang shrink-0 mt-0.5">{formatRupiah(selectedMenu.price)}</div>
               </div>

               {/* Variants */}
               {getParsedOptions(selectedMenu).length > 0 && (
                 <div>
                   <p className="text-[10px] font-bold text-text-main/40 uppercase tracking-widest mb-2">Pilih Varian</p>
                   <div className="flex flex-wrap gap-2">
                     {getParsedOptions(selectedMenu).map(opt => {
                       const priceAdd = parseInt(opt.priceModifier) || 0;
                       const stock = parseInt(opt.stock) || 0;
                       const isOut = stock <= 0;
                       const isSelected = modalSize === opt.name;
                       return (
                         <button
                           key={opt.name}
                           onClick={() => !isOut && setModalSize(opt.name)}
                           disabled={isOut}
                           className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex flex-col items-center ${
                             isOut
                               ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                               : isSelected
                                 ? 'border-piutang bg-piutang text-white shadow-sm'
                                 : 'border-gray-200 bg-white text-text-main hover:border-piutang/50'
                           }`}
                         >
                           <span>{opt.name}</span>
                           {priceAdd > 0 && <span className={`text-[9px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-text-main/40'}`}>+{formatRupiah(priceAdd)}</span>}
                           {isOut && <span className="text-[9px] text-utang mt-0.5">Habis</span>}
                         </button>
                       );
                     })}
                   </div>
                 </div>
               )}

               {/* Catatan */}
               <div>
                 <p className="text-[10px] font-bold text-text-main/40 uppercase tracking-widest mb-1.5">Catatan Spesial</p>
                 <textarea
                   value={modalNote}
                   onChange={e => setModalNote(e.target.value)}
                   placeholder="Contoh: Less ice, extra gula, jangan pedas..."
                   className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-piutang/40 focus:bg-white transition-all resize-none"
                   rows="2"
                 />
               </div>

               {/* Quantity + Add Button */}
               <div className="flex items-center gap-3 pt-1">
                 <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1 shrink-0">
                   <button onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))} className="w-8 h-8 flex items-center justify-center text-text-main hover:bg-white rounded-lg active:scale-95 transition-all">
                     <Minus className="w-4 h-4" />
                   </button>
                   <span className="font-bold text-base w-6 text-center">{modalQuantity}</span>
                   <button
                     onClick={() => {
                       const opts = getParsedOptions(selectedMenu);
                       const currentOpt = opts.find(o => o.name === modalSize);
                       const maxStock = currentOpt ? (parseInt(currentOpt.stock) || 0) : (selectedMenu.stock ?? 999);
                       if (modalQuantity < maxStock) {
                         setModalQuantity(modalQuantity + 1);
                       } else {
                         showAlert(`Stok hanya tersisa ${maxStock}.`, 'Stok Habis', 'warning');
                       }
                     }}
                     className="w-8 h-8 flex items-center justify-center text-text-main hover:bg-white rounded-lg active:scale-95 transition-all"
                   >
                     <Plus className="w-4 h-4" />
                   </button>
                 </div>
                 <button
                   onClick={addToCartFromModal}
                   disabled={(() => {
                     const opts = getParsedOptions(selectedMenu);
                     if (opts.length === 0) return false;
                     const currentOpt = opts.find(o => o.name === modalSize);
                     return currentOpt ? (parseInt(currentOpt.stock) || 0) <= 0 : false;
                   })()}
                   className={`flex-1 text-white font-bold rounded-xl py-3 shadow-lg active:scale-95 transition-all text-sm text-center ${
                     (() => {
                       const opts = getParsedOptions(selectedMenu);
                       if (opts.length > 0) {
                         const currentOpt = opts.find(o => o.name === modalSize);
                         if (currentOpt && (parseInt(currentOpt.stock) || 0) <= 0) return 'bg-gray-300 cursor-not-allowed shadow-none';
                       }
                       return 'bg-piutang hover:bg-piutang/90';
                     })()
                   }`}
                 >
                   Tambah ke Pesanan • {formatRupiah((selectedMenu.price + (getParsedOptions(selectedMenu).find(o => o.name === modalSize) ? (parseInt(getParsedOptions(selectedMenu).find(o => o.name === modalSize).priceModifier) || 0) : 0)) * modalQuantity)}
                 </button>
               </div>

             </div>
           </div>
         </div>
      )}


      {/* Cart / Confirmation Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center animate-in fade-in duration-200">
          <div className="bg-[#F9F9F9] w-full sm:max-w-md sm:rounded-[2.5rem] rounded-t-[2.5rem] flex flex-col animate-in slide-in-from-bottom-8 duration-300 pb-6 relative max-h-[90vh]">
            
            {/* Top drag indicator */}
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-4 mb-2"></div>
            
            <div className="px-6 flex justify-between items-start mb-4">
              <div>
                <h3 className="font-black text-xl text-[#2B231D]">Detail Pesanan</h3>
                <div className="flex items-center gap-2 text-sm mt-1">
                  <span className="text-gray-500 font-medium capitalize">{user?.name || 'Pelanggan'}</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <span className="text-gray-500 font-medium">Meja {user?.tableNum || '-'}</span>
                </div>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-2 border border-gray-200 bg-white rounded-full hover:bg-gray-50 text-gray-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="px-6 overflow-y-auto flex-1 space-y-4 mb-6">
              {cart.map(item => (
                <div key={item.cartItemId} className="flex bg-white p-3 rounded-[1.5rem] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-50 items-center gap-4 relative">
                  <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                    <img src={item.image || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2047&auto=format&fit=crop'} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 py-1">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-[#2B231D] text-[14px] leading-tight pr-8">{item.name}</h4>
                      <button onClick={() => removeFromCart(item.cartItemId)} className="absolute top-3 right-3 bg-red-50 text-red-400 hover:text-red-600 hover:bg-red-100 w-6 h-6 rounded-full flex items-center justify-center transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    {item.note && (
                       <p className="text-[11px] text-gray-500 mb-2 font-medium bg-gray-50 p-1.5 rounded-lg inline-block border border-gray-100">{item.note}</p>
                    )}
                    <div className="flex justify-between items-center w-full">
                      <div className="font-bold text-gray-900 text-sm">{item.quantity} <span className="text-gray-400 font-normal ml-0.5">x</span></div>
                      <div className="text-sm font-bold text-[#4A725D]">{formatRupiah(item.cartPrice)}</div>
                    </div>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                 <div className="text-center py-10 flex flex-col items-center opacity-50 bg-white rounded-3xl border border-gray-100">
                    <ShoppingBag className="w-12 h-12 mb-3" />
                    <span className="font-bold">Belum ada pesanan</span>
                 </div>
              )}
            </div>
            
            {cart.length > 0 && (
              <div className="px-6">
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-50">
                  <div className="flex justify-between text-sm text-gray-500 font-medium mb-3">
                    <span>Subtotal</span>
                    <span className="text-gray-900 font-bold">{formatRupiah(totalCart)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500 font-medium mb-4 pb-4 border-b border-gray-100">
                    <span>PPN 10%</span>
                    <span className="text-gray-900 font-bold">(Termasuk)</span>
                  </div>
                  <div className="flex justify-between font-black text-lg mb-6 text-[#2B231D]">
                    <span>Total</span>
                    <span>{formatRupiah(totalCart)}</span>
                  </div>
                  <button onClick={requestCheckout} className="w-full py-4 rounded-2xl bg-[#8B3A2B] text-white font-bold text-[15px] hover:bg-[#722F23] transition-colors shadow-lg shadow-[#8B3A2B]/30 active:scale-95 mb-4">
                    Konfirmasi Pesanan
                  </button>
                  <p className="text-center text-[10px] text-gray-400 font-medium">Bayar langsung di kasir setelah selesai makan</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QRIS Modal */}
      {isQrisOpen && (
        <div className="fixed inset-0 bg-text-main/60 z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="bg-text-main p-8 text-center text-white relative overflow-hidden">
              <QrCode className="w-12 h-12 mx-auto mb-3 relative z-10" />
              <h2 className="text-xl font-bold relative z-10">Scan QRIS</h2>
              <p className="opacity-80 text-sm relative z-10">Tunjukkan atau scan di kasir</p>
            </div>
            <div className="p-8 text-center bg-white">
              <div className="relative inline-block w-48 mx-auto mb-6 bg-surface p-4 rounded-2xl shadow-sm border border-gray-100">
                <QRCodeCanvas 
                  id="qris-canvas"
                  value={generateDynamicQris(checkoutAmount)} 
                  size={512} 
                  level="H" 
                  includeMargin={true}
                  style={{ width: "100%", height: "auto" }}
                />
              </div>
              <div className="text-sm text-text-main/70 mb-1 font-medium mt-4">Total Tagihan</div>
              <div className="text-3xl font-black text-text-main mb-6">{formatRupiah(checkoutAmount)}</div>
              
              <div className="flex flex-col gap-2 mb-6">
                <div className="flex justify-between items-center bg-accent/10 text-accent py-3 px-4 rounded-xl text-sm font-bold border border-accent/20">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent animate-ping shrink-0"></span>
                    <span>Menunggu...</span>
                  </div>
                  <div className="text-accent font-black tracking-widest bg-white/50 px-2 py-1 rounded">
                    {Math.floor(qrisTimeLeft / 60).toString().padStart(2, '0')}:
                    {(qrisTimeLeft % 60).toString().padStart(2, '0')}
                  </div>
                </div>
                <button 
                  onClick={() => {
                    const canvas = document.getElementById('qris-canvas');
                    if (canvas) {
                      const url = canvas.toDataURL('image/png');
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `QRIS_Yuucoffe_Rp${checkoutAmount}.png`;
                      a.click();
                    }
                  }}
                  className="w-full bg-text-main text-white py-3 px-4 rounded-xl text-sm font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-black transition-colors"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span>Download QR</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}


      {/* RECEIPT MODAL */}
      {isReceiptOpen && receiptData && (
        <div className="fixed inset-0 bg-text-main/80 z-[80] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface rounded-none w-full max-w-sm shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            {/* Receipt Header */}
            <div className="bg-white p-6 border-b border-dashed border-gray-300 flex flex-col items-center">
               <Coffee className="w-8 h-8 text-[#4A3B32] mb-2" />
               <h2 className="text-xl font-black text-[#2B231D] tracking-widest">YUUCOFFE</h2>
               <p className="text-xs text-text-main/50">Struk Pembelian Digital</p>
            </div>
            
            {/* Receipt Body */}
            <div className="p-6 bg-white flex-1 overflow-y-auto">
               <div className="flex justify-between items-center mb-4 text-sm border-b border-dashed border-gray-200 pb-4">
                  <div>
                    <div className="text-text-main/50 text-xs mb-1">Pelanggan</div>
                    <div className="font-bold text-text-main capitalize">{user?.name || 'Pelanggan'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-text-main/50 text-xs mb-1">Meja</div>
                    <div className="font-bold text-text-main bg-accent/20 text-accent px-2 py-0.5 rounded inline-block">{user?.tableNum || '-'}</div>
                  </div>
               </div>
               
               <div className="mb-4">
                 <div className="text-text-main/50 text-xs mb-2">Waktu</div>
                 <div className="font-medium text-text-main text-sm">{new Date(receiptData.createdAt).toLocaleString('id-ID')}</div>
               </div>

               <div className="text-text-main/50 text-xs mb-2 mt-6 border-b border-gray-100 pb-1">Pesanan</div>
               <div className="space-y-3 mb-6">
                 {receiptData.items?.map(item => (
                    <div key={item.id} className="flex justify-between items-start text-sm">
                      <div className="flex-1 pr-2">
                        <div className="font-semibold text-text-main">{item.quantity}x {item.menu.name}</div>
                        {item.note && <div className="text-[10px] text-text-main/60 mt-0.5">{item.note}</div>}
                      </div>
                      <div className="font-bold text-text-main text-right shrink-0">
                        {formatRupiah(item.price * item.quantity)}
                      </div>
                    </div>
                 ))}
               </div>
            </div>

            {/* Receipt Footer */}
            <div className="p-6 bg-white border-t border-dashed border-gray-300">
               <div className="flex justify-between items-center mb-6">
                 <div className="text-text-main/70 font-medium">TOTAL LUNAS</div>
                 <div className="text-xl font-black text-text-main">{formatRupiah(receiptData.totalAmount)}</div>
               </div>
               <button 
                  onClick={() => {
                    setIsReceiptOpen(false);
                    navigate('/tracking');
                  }}
                  className="w-full bg-text-main text-white font-bold py-3.5 rounded-xl hover:bg-black transition-colors"
               >
                 Tutup & Pantau Pesanan
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuList;
