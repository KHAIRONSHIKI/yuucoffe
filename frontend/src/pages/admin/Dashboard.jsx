import React, { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { useUi } from '../../context/UiContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, LayoutDashboard, Coffee, Search, LogOut, X } from 'lucide-react';
import ConfirmModal from '../../components/common/ConfirmModal';

const Dashboard = () => {
  const [menus, setMenus] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '', description: '', price: '', category: 'MINUMAN', image: '', isAvailable: true, options: [] });
  
  // Confirm Modal State
  const [confirmState, setConfirmState] = useState({ isOpen: false, actionType: null, targetId: null, data: null });
  
  const { logout } = useContext(AuthContext);
  const { showLoading, showSuccess } = useUi();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      const res = await api.get('/menu');
      setMenus(res.data);
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

  const handleAction = (actionType, targetId = null, data = null) => {
    setConfirmState({ isOpen: true, actionType, targetId, data });
  };

  const executeAction = async () => {
    const { actionType, targetId, data } = confirmState;
    setConfirmState({ isOpen: false, actionType: null, targetId: null, data: null });
    
    showLoading(true, actionType === 'DELETE' ? 'Menghapus menu...' : 'Menyimpan menu...');
    try {
      if (actionType === 'DELETE') {
        await api.delete(`/menu/${targetId}`);
        fetchMenus();
        showLoading(false);
        showSuccess('Menu berhasil dihapus!');
      } else if (actionType === 'SAVE') {
        if (formData.image && formData.image.startsWith('data:image')) {
          showLoading(false);
          alert('Tindakan gagal: URL Gambar terlalu panjang. Tolong gunakan link URL gambar biasa (http...), jangan gambar base64.');
          return;
        }

        const payload = {
          name: formData.name,
          description: formData.description,
          price: parseInt(formData.price) || 0,
          category: formData.category,
          image: formData.image,
          isAvailable: formData.isAvailable,
          options: formData.options
        };
        
        if (formData.id) {
          await api.put(`/menu/${formData.id}`, payload);
        } else {
          await api.post('/menu', payload);
        }
        setIsModalOpen(false);
        fetchMenus();
        setFormData({ id: null, name: '', description: '', price: '', category: 'MINUMAN', image: '', isAvailable: true, options: [] });
        showLoading(false);
        showSuccess(formData.id ? 'Menu berhasil diperbarui!' : 'Menu baru berhasil ditambahkan!');
      }
    } catch (error) {
      showLoading(false);
      const detail = error.response?.data?.error ? `\n\nDetail: ${error.response.data.error}` : '';
      alert('Tindakan gagal: ' + (error.response?.data?.message || error.message) + detail);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleAction('SAVE');
  };

  const handleEdit = (menu) => {
    setFormData({
      id: menu.id,
      name: menu.name,
      description: menu.description || '',
      price: menu.price.toString(),
      category: menu.category,
      image: menu.image || '',
      isAvailable: menu.isAvailable,
      options: Array.isArray(menu.options) ? menu.options : (menu.options ? JSON.parse(menu.options) : [])
    });
    setIsModalOpen(true);
  };
  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...(prev.options || []), { name: '', priceModifier: 0, stock: 0 }]
    }));
  };

  const updateOption = (index, field, value) => {
    setFormData(prev => {
      const newOptions = [...prev.options];
      newOptions[index][field] = (field === 'priceModifier' || field === 'stock') ? (parseInt(value) || 0) : value;
      return { ...prev, options: newOptions };
    });
  };

  const removeOption = (index) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };


  return (
    <div className="min-h-screen bg-surface flex text-text-main font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-background border-r border-gray-200 hidden lg:flex flex-col">
        <div className="h-20 flex items-center px-8">
          <h1 className="text-lg font-black text-[#2B231D] flex items-center gap-2">
            <Coffee className="w-5 h-5 text-[#4A3B32]" />
            YUUCOFFE
          </h1>
        </div>
        <div className="flex-1 py-4 px-4 space-y-2">
          <button className="w-full flex items-center gap-3 px-5 py-3 bg-[#1A1F16] text-white rounded-xl font-bold transition-all shadow-md">
            <LayoutDashboard className="w-5 h-5" />
            Manajemen Menu
          </button>
        </div>
        <div className="p-4">
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center gap-3 px-5 py-3 text-red-600 hover:bg-red-50 rounded-xl font-bold transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-20 bg-surface flex items-center justify-between px-4 md:px-8 shrink-0 border-b border-gray-100">
          <div className="flex items-center gap-3 lg:hidden">
            <Coffee className="w-6 h-6 text-[#4A3B32]" />
            <h1 className="text-lg font-black text-[#2B231D]">YUUCOFFE</h1>
          </div>
          <h2 className="text-lg font-bold text-text-main hidden lg:block tracking-wide">Dashboard Admin</h2>
          
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Cari menu..." className="pl-11 pr-4 py-2.5 bg-white border border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-accent w-64 shadow-sm" />
            </div>
            {/* LOGOUT BUTTON FOR MOBILE/TABLET */}
            <button 
              onClick={handleLogout} 
              className="lg:hidden flex items-center justify-center p-2 text-red-600 bg-red-50 rounded-full hover:bg-red-100 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-full bg-gray-900 text-white hidden lg:flex items-center justify-center font-bold shadow-md">
              A
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-surface">
          
          {/* Header Action */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h3 className="text-2xl font-black text-text-main">Daftar Menu Utama</h3>
              <p className="text-text-main/70 text-sm mt-1">Kelola ketersediaan, harga, dan gambar menu cafe Anda.</p>
            </div>
            <button 
              onClick={() => { setFormData({ id: null, name: '', description: '', price: '', category: 'MINUMAN', image: '', isAvailable: true }); setIsModalOpen(true); }}
              className="flex items-center justify-center w-full sm:w-auto gap-2 px-6 py-3.5 bg-[#1A1F16] hover:bg-black text-white rounded-xl font-bold transition-all duration-300 shadow-md text-sm"
            >
              <Plus className="w-5 h-5" /> Tambah Menu Baru
            </button>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="text-gray-500 text-[11px] uppercase tracking-wider border-b border-gray-200">
                    <th className="px-6 py-5 font-bold">Produk</th>
                    <th className="px-6 py-5 font-bold">Kategori</th>
                    <th className="px-6 py-5 font-bold">Harga</th>
                    <th className="px-6 py-5 font-bold">Status</th>
                    <th className="px-6 py-5 font-bold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {menus.map((menu) => (
                    <tr key={menu.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gray-50 overflow-hidden flex-shrink-0 border border-gray-100 shadow-sm">
                            {menu.image ? (
                              <img src={menu.image} alt={menu.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Coffee className="w-5 h-5 opacity-50" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-text-main text-[15px]">{menu.name}</div>
                            <div className="text-xs text-text-main/60 line-clamp-1 max-w-[200px] mt-0.5">{menu.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold tracking-wider text-text-main/70 uppercase">
                          {menu.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-text-main text-[15px]">
                          Rp {menu.price.toLocaleString('id-ID')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold shadow-sm border ${menu.isAvailable ? 'bg-piutang/10 text-piutang border-piutang/20' : 'bg-utang/10 text-utang border-utang/20'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${menu.isAvailable ? 'bg-piutang' : 'bg-utang'}`}></span>
                          {menu.isAvailable ? 'Tersedia' : 'Habis'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3 transition-opacity">
                          <button onClick={() => handleEdit(menu)} className="text-text-main/60 hover:text-text-main transition-colors" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleAction('DELETE', menu.id)} className="text-utang/60 hover:text-utang transition-colors" title="Hapus">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {menus.length === 0 && (
              <div className="p-12 text-center text-gray-500 bg-white">
                <Coffee className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Belum ada menu yang ditambahkan.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-background shrink-0">
              <h3 className="font-black text-xl text-text-main">{formData.id ? 'Edit Menu' : 'Tambah Menu Baru'}</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 text-text-main/50 hover:text-text-main hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 bg-surface">
              <div>
                <label className="block text-sm font-bold text-text-main/70 mb-1.5">Nama Menu</label>
                <input maxLength={100} type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none transition-all shadow-sm" placeholder="Contoh: Caramel Macchiato" />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-text-main/70 mb-1.5">Deskripsi</label>
                <textarea maxLength={191} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none transition-all shadow-sm" rows="2" placeholder="Jelaskan menu ini secara singkat..."></textarea>
                <p className="text-[10px] text-right mt-1 text-text-main/40">{formData.description.length}/191 karakter</p>
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-text-main/70 mb-1.5">Harga (Rp)</label>
                  <input type="number" required min="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none transition-all shadow-sm" placeholder="25000" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-main/70 mb-1.5">Kategori</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none transition-all shadow-sm">
                    <option value="MINUMAN">Minuman</option>
                    <option value="MAKANAN">Makanan</option>
                    <option value="SNACK">Snack</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-text-main/70 mb-1.5">URL Gambar</label>
                <input maxLength={191} type="text" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none transition-all shadow-sm" placeholder="https://..." />
              </div>
              
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-bold text-text-main">Varian / Opsi (Opsional)</label>
                  <button type="button" onClick={addOption} className="text-xs flex items-center gap-1 bg-white border border-gray-200 px-3 py-1.5 rounded-lg font-bold hover:bg-gray-100 transition-colors">
                    <Plus className="w-3 h-3" /> Tambah Opsi
                  </button>
                </div>
                {formData.options && formData.options.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 px-1 mb-2">
                       <span className="flex-1 text-[11px] uppercase tracking-wider font-bold text-text-main/50">Nama Varian</span>
                       <span className="w-28 text-[11px] uppercase tracking-wider font-bold text-text-main/50">Harga (+Rp)</span>
                       <span className="w-20 text-[11px] uppercase tracking-wider font-bold text-text-main/50 text-center">Stok</span>
                       <span className="w-10"></span>
                    </div>
                    {formData.options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <input type="text" value={opt.name} onChange={e => updateOption(idx, 'name', e.target.value)} placeholder="Misal: Besar" className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-accent" />
                        <div className="relative w-28 shrink-0">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">Rp</span>
                          <input type="text" inputMode="numeric" value={opt.priceModifier} onChange={e => updateOption(idx, 'priceModifier', e.target.value.replace(/\D/g, ''))} className="w-full pl-7 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-accent" />
                        </div>
                        <input type="number" min="0" value={opt.stock} onChange={e => updateOption(idx, 'stock', e.target.value)} className="w-20 shrink-0 px-2 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-accent text-center" />
                        <button type="button" onClick={() => removeOption(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-text-main/50 text-center py-2">Belum ada opsi. Tambahkan jika menu memiliki varian (misal ukuran).</p>
                )}
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-white shadow-sm rounded-xl border border-gray-100">
                <input type="checkbox" id="isAvailable" checked={formData.isAvailable} onChange={e => setFormData({...formData, isAvailable: e.target.checked})} className="w-5 h-5 text-accent rounded focus:ring-accent border-gray-300" />
                <div>
                  <label htmlFor="isAvailable" className="text-sm font-bold text-text-main block cursor-pointer">Menu Tersedia</label>
                  <p className="text-xs text-text-main/60">Matikan jika stok bahan sedang habis.</p>
                </div>
              </div>
              
              <div className="pt-2 flex gap-3 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 bg-gray-100 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all">Batal</button>
                <button type="submit" className="flex-1 py-3.5 bg-[#1A1F16] text-white font-bold rounded-xl hover:bg-black transition-all shadow-md">
                  {formData.id ? 'Perbarui Menu' : 'Simpan Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal 
        isOpen={confirmState.isOpen}
        title={confirmState.actionType === 'DELETE' ? 'Hapus Menu?' : 'Simpan Menu?'}
        message={confirmState.actionType === 'DELETE' ? 'Menu ini akan dihapus secara permanen dari daftar. Lanjutkan?' : 'Apakah Anda yakin data menu sudah benar dan ingin menyimpannya?'}
        onConfirm={executeAction}
        onCancel={() => setConfirmState({ isOpen: false, actionType: null, targetId: null, data: null })}
        type={confirmState.actionType === 'DELETE' ? 'warning' : 'info'}
      />
    </div>
  );
};

export default Dashboard;
