import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { useUi } from '../../context/UiContext';
import api from '../../services/api';
import { Coffee, Lock, MapPin, ArrowRight } from 'lucide-react';

const ScanTable = () => {
  const [name, setName] = useState('');
  const [tableNum, setTableNum] = useState('');
  const [isStaffLogin, setIsStaffLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const { login } = useContext(AuthContext);
  const { showLoading, showSuccess, showAlert } = useUi();
  const navigate = useNavigate();

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    showLoading(true, 'Memeriksa meja...');
    try {
      const res = await api.post('/auth/guest', { name, tableNum });
      
      setTimeout(() => {
        showLoading(false);
        showSuccess('Selamat datang di YUUCOFFE!');
        login(res.data);
        navigate('/menu');
      }, 1500);
      
    } catch (error) {
      showLoading(false);
      showAlert(error.response?.data?.message || 'Gagal masuk. Coba lagi.');
    }
  };

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    showLoading(true, 'Otentikasi...');
    try {
      const res = await api.post('/auth/login', { username, password });
      
      setTimeout(() => {
        showLoading(false);
        showSuccess(`Berhasil login sebagai ${res.data.role}`);
        login(res.data);
        if (res.data.role === 'ADMIN') navigate('/admin');
        else if (res.data.role === 'KASIR') navigate('/kasir');
        else if (res.data.role === 'DAPUR') navigate('/dapur');
      }, 1500);

    } catch (error) {
      showLoading(false);
      showAlert(error.response?.data?.message || 'Login gagal. Periksa username dan password.');
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col md:flex-row relative font-sans">
      {/* Top Section - Image Background */}
      <div className="relative h-[45vh] md:h-screen w-full md:w-1/2 bg-[url('https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2047&auto=format&fit=crop')] bg-cover bg-center">
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/90"></div>
        
        {/* Top left Login button for Staff */}
        <button 
          onClick={() => setIsStaffLogin(!isStaffLogin)}
          className="absolute top-6 left-6 text-white/50 text-sm font-medium hover:text-white transition-colors"
        >
          {isStaffLogin ? 'Kembali' : 'Login'}
        </button>

        {/* Header Content */}
        <div className="absolute bottom-10 left-8 right-8 z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
              <Coffee className="w-4 h-4 text-surface" />
            </div>
            <span className="text-white font-bold tracking-widest text-sm">YUUCOFFE</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-2 tracking-tight">
            Pesan Langsung<br />dari Mejamu
          </h1>
          <p className="text-gray-300 text-sm">
            Pilih menu favorit, bayar di kasir
          </p>
        </div>
      </div>

      {/* Bottom Section - Form */}
      <div className="flex-1 md:w-1/2 bg-surface rounded-t-[2.5rem] md:rounded-none md:rounded-l-[2.5rem] -mt-6 md:mt-0 z-20 px-8 py-8 flex flex-col justify-center shadow-[0_-10px_40px_rgba(0,0,0,0.3)] md:shadow-[-10px_0_40px_rgba(0,0,0,0.3)]">
        <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center">
          {/* Drag Handle indicator (Mobile only) */}
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-8 md:hidden"></div>

          {!isStaffLogin ? (
            <>
              <div className="mb-8">
                <h2 className="text-xl font-bold text-text-main mb-1 tracking-tight">Isi Detail Pesananmu</h2>
                <p className="text-sm text-text-main/60">Kami siapkan minuman sesuai namamu</p>
              </div>

              <form onSubmit={handleCustomerSubmit} className="space-y-5">
                <div>
                  <label className="block text-[11px] font-bold text-text-main/50 uppercase tracking-widest mb-2">Nama Pemesan</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full px-5 py-4 rounded-2xl bg-white border border-gray-200 text-text-main placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-piutang/50 focus:border-piutang transition-all font-medium shadow-sm"
                    placeholder="Nama kamu..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-text-main/50 uppercase tracking-widest mb-2">Nomor Meja</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full px-5 py-4 rounded-2xl bg-white border border-gray-200 text-text-main placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-piutang/50 focus:border-piutang transition-all font-medium shadow-sm"
                    placeholder="Contoh: 07"
                    value={tableNum}
                    onChange={(e) => setTableNum(e.target.value)}
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full mt-8 py-4 px-6 bg-piutang hover:bg-piutang/90 text-surface rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-piutang/30 transition-all duration-300 active:scale-95"
                >
                  Lihat Menu
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-xl font-bold text-text-main mb-1 tracking-tight">Login Staff</h2>
                <p className="text-sm text-text-main/60">Akses dashboard admin dan kasir</p>
              </div>

              <form onSubmit={handleStaffSubmit} className="space-y-5">
                <div>
                  <label className="block text-[11px] font-bold text-text-main/50 uppercase tracking-widest mb-2">Username Staff</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full px-5 py-4 rounded-2xl bg-white border border-gray-200 text-text-main placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-text-main/50 focus:border-text-main transition-all font-medium shadow-sm"
                    placeholder="Username..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-text-main/50 uppercase tracking-widest mb-2">Password</label>
                  <input 
                    type="password" 
                    required 
                    className="w-full px-5 py-4 rounded-2xl bg-white border border-gray-200 text-text-main placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-text-main/50 focus:border-text-main transition-all font-medium shadow-sm"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full mt-8 py-4 px-6 bg-text-main hover:bg-text-main/90 text-surface rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-text-main/30 transition-all duration-300 active:scale-95"
                >
                  <Lock className="w-5 h-5" />
                  Masuk Dashboard
                </button>
              </form>
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-2 text-text-main/50 text-xs font-medium w-full max-w-md mx-auto">
          <MapPin className="w-4 h-4" />
          <span>Scan QR code di meja untuk memulai</span>
        </div>
      </div>
    </div>
  );
};

export default ScanTable;
