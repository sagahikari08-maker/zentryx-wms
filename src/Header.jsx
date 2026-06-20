import React, { useContext } from 'react';
import { AppContext } from './AppContext';

const Header = () => {
  const { teks, setHalaman, bahasa, setBahasa, user, setUser } = useContext(AppContext);

  const handleLogout = () => {
    setUser(null);
  };

  // Mencegah crash jika data user belum dimuat
  if (!user) return null;

  return (
    <header className="h-14 bg-white flex items-center justify-between px-6 border-b border-gray-300 relative z-[60] shrink-0">
      
      {/* ── BAGIAN KIRI: LOGO & MENU ── */}
      <div className="flex items-center space-x-8">
        
        {/* LOGO */}
        <div className="text-xl font-bold text-gray-800 tracking-wider cursor-pointer flex items-center gap-1" onClick={() => setHalaman('dashboard')}>
          <span className="text-[#125ab2] font-black">{teks?.title || 'ZENTRYX'}</span> 
          <span className="text-orange-500 text-sm font-normal">WMS</span>
        </div>

        {/* REPORTS DROPDOWN (FITUR EKSISTING TETAP UTUH) */}
        <div className="relative group/reports hidden sm:block">
          <div className="text-sm font-semibold text-gray-600 hover:text-[#125ab2] cursor-pointer flex items-center transition-colors">
            Reports ▾
          </div>
          <div className="absolute top-full left-0 w-64 bg-white border border-gray-300 shadow-xl hidden group-hover/reports:block py-2 text-gray-700">
            <div className="px-4 py-1.5 font-bold text-[10px] text-gray-400 uppercase tracking-wider">Inventory Control</div>
            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm" onClick={() => setHalaman('invOverview')}>Inventory Summary</button>
            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm" onClick={() => setHalaman('cycleCounts')}>Cycle Count Accuracy</button>
            
            <div className="border-t my-1"></div>
            
            <div className="px-4 py-1.5 font-bold text-[10px] text-gray-400 uppercase tracking-wider">Logistics & Cost</div>
            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm" onClick={() => setHalaman('shippingItems')}>Shipping Throughput</button>
            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm" onClick={() => setHalaman('landedCost')}>Landed Cost Analysis</button>
            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm" onClick={() => setHalaman('costAnalysis')}>Inventory Valuation</button>
          </div>
        </div>

        {/* SEARCH BAR (FITUR EKSISTING TETAP UTUH) */}
        <div className="hidden md:flex items-center bg-white border border-gray-300 rounded px-3 py-1 w-80 shadow-inner">
          <span className="text-gray-400 mr-2 text-xs">🔍</span>
          <input type="text" placeholder="Search..." className="outline-none w-full text-sm text-gray-700"/>
        </div>
      </div>

      {/* ── BAGIAN KANAN: TOOLS & PROFIL DINAMIS ── */}
      <div className="flex items-center space-x-4">
        
        {/* PILIHAN BAHASA */}
        <select 
          className="bg-gray-100 border border-gray-300 text-gray-700 py-1 px-2 rounded cursor-pointer text-xs outline-none hidden sm:block"
          value={bahasa}
          onChange={(e) => setBahasa(e.target.value)}
        >
          <option value="en">English</option>
          <option value="id">Indonesia</option>
        </select>
        
        <div className="text-gray-600 hover:text-[#125ab2] cursor-pointer text-xs font-semibold hidden sm:block">❓ Help</div>
        
        {/* PROFIL USER & LOGOUT (INJEKSI FASE 10) */}
        <div className="flex items-center space-x-3 border-l border-gray-200 pl-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-black text-gray-800 leading-tight">{user.name}</div>
            <div className="text-[9px] font-bold text-[#125ab2] uppercase tracking-wider">{user.title}</div>
          </div>
          
          {/* Avatar Bulat Dinamis Berdasarkan Nama */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs shadow-inner shrink-0 ${
            user.role === 'ADMIN' ? 'bg-purple-600' :
            user.role === 'EXECUTIVE' ? 'bg-amber-500' :
            user.role === 'MANAGER' ? 'bg-emerald-600' : 'bg-slate-700'
          }`}>
            {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          
          <button 
            onClick={handleLogout}
            className="ml-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors shrink-0"
            title="Logout and Close Session"
          >
            Logout
          </button>
        </div>

      </div>
    </header>
  );
};

export default Header;