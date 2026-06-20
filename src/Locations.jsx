import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from './AppContext';

// ─── TOAST COMPONENT (Aman dari Bug Klik/Pointer Events) ─────────────────────
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
    {toasts.map(({ id, message, type }) => (
      <div key={id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-sm shadow-xl text-white text-xs font-semibold min-w-[280px] border-l-4 ${
        type === 'success' ? 'bg-emerald-600 border-emerald-800' : type === 'error' ? 'bg-red-600 border-red-800' : 'bg-[#125ab2] border-blue-800'
      }`}>
        <span className="text-base">{type === 'success' ? '✓' : type === 'error' ? '🛡️' : 'ℹ'}</span>
        <span className="flex-1">{message}</span>
        <button onClick={() => removeToast(id)} className="opacity-70 hover:opacity-100 text-lg leading-none">×</button>
      </div>
    ))}
  </div>
);

const Locations = () => {
  const { bahasa } = useContext(AppContext);

  // 1. DATA MASTER LOKASI (PABRIK EV - ARUS MOTORS)
  const initialLocations = [
    { id: 'FAC-CKR-001', name: 'Cikarang Gigafactory', type: 'Main Assembly', city: 'Cikarang', capacity: 88, manager: 'Budi Santoso', area: 55000, status: 'Active' },
    { id: 'FAC-KRW-002', name: 'Karawang Battery Hub', type: 'Cold Storage', city: 'Karawang', capacity: 65, manager: 'Siti Rahma', area: 15000, status: 'Active' },
    { id: 'FAC-PWK-003', name: 'Purwakarta Logistics Center', type: 'Cross-Dock', city: 'Purwakarta', capacity: 40, manager: 'Agus Pratama', area: 25000, status: 'Active' },
    { id: 'FAC-SBY-004', name: 'Surabaya Distribution Hub', type: 'Fulfillment Center', city: 'Surabaya', capacity: 0, manager: 'Pending Allocation', area: 12000, status: 'Maintenance' }
  ];

  const [locations, setLocations] = useState(() => {
    try {
      const saved = window.localStorage.getItem('locationsData_ARUS_Motors');
      return saved ? JSON.parse(saved) : initialLocations;
    } catch {
      return initialLocations;
    }
  });

  // ─── ALGORITMA PEMBERSIH DATA LAMA ───
  useEffect(() => {
    const hasOldData = locations.some(loc => 
      loc.id.startsWith('LOC-') || 
      loc.type === 'Main WH'
    );
    if (hasOldData) {
      setLocations(initialLocations);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simpan setiap ada perubahan
  useEffect(() => {
    try {
      window.localStorage.setItem('locationsData_ARUS_Motors', JSON.stringify(locations));
    } catch (error) {
      console.error('Failed to save Location data:', error);
    }
  }, [locations]);

  // 2. STATE FORM, MODAL, PENCARIAN & DETAIL
  const [form, setForm] = useState({ name: '', type: '', city: '', manager: '', area: '' });
  const [formErrors, setFormErrors] = useState({});
  const [toasts, setToasts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 3. DAFTAR OPSI DROPDOWN (ENTERPRISE SCALE)
  const typeOptions = ['Main Assembly', 'Cold Storage', 'Cross-Dock', 'Fulfillment Center', 'Transit Hub', 'RMA Center'];
  const cityOptions = ['Cikarang', 'Karawang', 'Purwakarta', 'Jakarta Timur', 'Surabaya', 'Semarang', 'Medan', 'Makassar'];

  // 4. FUNGSI TOAST
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // 5. STATS DASHBOARD
  const stats = useMemo(() => {
    const total = locations.length;
    const totalArea = locations.reduce((sum, loc) => sum + (loc.area || 0), 0);
    const critical = locations.filter(loc => loc.capacity >= 85).length;
    return { total, totalArea, critical };
  }, [locations]);

  // 6. FUNGSI AKSI BARIS (Toggle Status & Delete)
  const toggleStatus = (id) => {
    setLocations(locations.map(loc => {
      if (loc.id === id) {
        const newStatus = loc.status === 'Active' ? 'Maintenance' : 'Active';
        if (selectedLocation && selectedLocation.id === id) setSelectedLocation({ ...loc, status: newStatus });
        return { ...loc, status: newStatus };
      }
      return loc;
    }));
    addToast(`Operational status updated for facility ${id}.`, 'success');
  };

  const deleteLocation = (id) => {
    if(window.confirm(`WARNING: Are you sure you want to permanently decommission facility ${id}?`)) {
      setLocations(locations.filter(loc => loc.id !== id));
      setSelectedLocation(null);
      addToast(`Facility ${id} successfully decommissioned from network.`, 'success');
    }
  };

  // 7. FUNGSI SIMPAN DATA DENGAN SAFEGUARD
  const handleSave = (e) => {
    e.preventDefault();
    const errors = {};
    if (!form.name.trim()) errors.name = 'Facility Name required';
    if (!form.type) errors.type = 'Type required';
    if (!form.city) errors.city = 'City required';
    if (!form.manager.trim()) errors.manager = 'Manager required';
    if (!form.area || isNaN(form.area) || parseInt(form.area) <= 0) errors.area = 'Valid area required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      addToast(bahasa === 'en' ? 'Please complete all required fields!' : 'Harap isi semua kolom wajib!', 'error');
      return;
    }
    
    // Auto-generate ID Cerdas: FAC-[3 Huruf Kota]-[Random]
    const cityCode = form.city.replace(/\s+/g, '').substring(0, 3).toUpperCase();
    const newId = `FAC-${cityCode}-${Math.floor(100 + Math.random() * 900)}`;

    // Validasi Duplikat Nama
    if (locations.some(l => l.name.toLowerCase() === form.name.toLowerCase())) {
      addToast(`Facility name "${form.name}" already exists in the network.`, 'error');
      return;
    }

    const newLocation = {
      id: newId,
      name: form.name.trim(),
      type: form.type,
      city: form.city,
      capacity: 0, // Default pabrik/gudang baru adalah kosong (0%)
      manager: form.manager.trim(),
      area: parseInt(form.area),
      status: 'Active'
    };
    
    setLocations([newLocation, ...locations]);
    setIsModalOpen(false);
    setForm({ name: '', type: '', city: '', manager: '', area: '' });
    setFormErrors({});
    addToast(bahasa === 'en' ? `Facility ${newId} registered successfully!` : `Fasilitas ${newId} berhasil didaftarkan!`, 'success');
  };

  // 8. FILTER PENCARIAN
  const filteredLocations = locations.filter(loc => 
    loc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    loc.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.manager.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 animate-fade-in">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER (CLEAN & COMPACT) ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>⚙️ System</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Infrastructure</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide">
            {bahasa === 'en' ? 'Warehouse & Facility Network' : 'Jaringan Fasilitas Gudang'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {bahasa === 'en' ? 'Manage global facility network, capacities, and site managers.' : 'Kelola jaringan fasilitas global, kapasitas muatan, dan manajer lokasi.'}
          </p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={() => {
              setForm({ name: '', type: '', city: '', manager: '', area: '' });
              setFormErrors({});
              setIsModalOpen(true);
            }}
            className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-5 py-2 rounded-sm text-sm font-bold transition-colors shadow-sm flex items-center gap-2 w-full md:w-auto justify-center"
          >
            <span>+</span> {bahasa === 'en' ? 'Register Facility' : 'Tambah Fasilitas'}
          </button>
        </div>
      </div>

      {/* ── DASHBOARD STATS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="bg-white border border-gray-200 p-4 shadow-sm border-l-4 border-l-[#415a77] flex justify-between items-center hover:shadow-md transition-shadow">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Total Facilities</p>
            <h3 className="text-2xl font-black text-[#415a77]">{stats.total} <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sites</span></h3>
          </div>
          <div className="text-3xl opacity-20">🏢</div>
        </div>
        <div className="bg-white border border-gray-200 p-4 shadow-sm border-l-4 border-l-[#125ab2] flex justify-between items-center hover:shadow-md transition-shadow">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Total Network Area</p>
            <h3 className="text-2xl font-black text-[#125ab2]">{stats.totalArea.toLocaleString('en-US')} <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">M²</span></h3>
          </div>
          <div className="text-3xl opacity-20">🗺️</div>
        </div>
        <div className="bg-white border border-gray-200 p-4 shadow-sm border-l-4 border-l-amber-500 flex justify-between items-center hover:shadow-md transition-shadow">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Critical Capacity (&gt;85%)</p>
            <h3 className="text-2xl font-black text-amber-600">{stats.critical} <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sites</span></h3>
          </div>
          <div className="text-3xl opacity-20">🚨</div>
        </div>
      </div>

      {/* ── SEARCH BAR ── */}
      <div className="bg-white border border-gray-300 shadow-sm p-3 mb-0 flex gap-2 rounded-sm">
        <input 
          type="text" 
          placeholder={bahasa === 'en' ? 'Search Facility ID, City, or Manager...' : 'Cari ID Fasilitas, Kota, atau Manajer...'} 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 border border-gray-300 px-3 py-1.5 text-xs outline-none focus:border-[#125ab2] transition-colors"
        />
      </div>

      {/* ── TABEL DATA ── */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
        <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex items-center gap-3 text-sm text-[#125ab2]">
          <span className="text-lg leading-none">ℹ️</span>
          <p className="font-semibold text-xs">
            {bahasa === 'en' ? 'Click FAC ID to view facility profile and operational metrics.' : 'Klik FAC ID untuk melihat profil fasilitas dan metrik operasional.'}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
            <thead className="bg-[#e5e5e5] text-[#666666] text-[10px] uppercase tracking-wider border-b border-gray-300">
              <tr>
                <th className="py-3 px-4 font-bold w-32">FAC ID</th>
                <th className="py-3 px-4 font-bold">FACILITY NAME</th>
                <th className="py-3 px-4 font-bold text-center w-36">TYPE</th>
                <th className="py-3 px-4 font-bold w-40">CITY / REGION</th>
                <th className="py-3 px-4 font-bold w-48 text-center">LIVE CAPACITY (UTILIZATION)</th>
                <th className="py-3 px-4 font-bold border-b border-gray-300 text-center w-28">STATUS</th>
              </tr>
            </thead>
            <tbody className="text-[12px] text-gray-700">
              {filteredLocations.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400 font-bold italic">
                    <span className="text-3xl block mb-2 opacity-50">📭</span>
                    No facilities found in network registry.
                  </td>
                </tr>
              ) : (
                filteredLocations.map((loc) => (
                  <tr key={loc.id} className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${loc.status === 'Maintenance' ? 'bg-gray-50 opacity-60' : ''}`}>
                    <td className="py-3 px-4 font-black">
                      <span 
                        onClick={() => setSelectedLocation(loc)}
                        className="text-[#125ab2] hover:text-[#0e4487] hover:underline cursor-pointer font-bold font-mono text-[13px] flex items-center gap-1.5"
                        title="View Facility Details"
                      >
                        <span className="text-base">🏢</span> {loc.id}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-800 text-[13px]">{loc.name}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 border rounded-sm text-[9px] font-bold uppercase tracking-wider ${
                        loc.type.includes('Assembly') ? 'bg-blue-100 text-blue-800 border-blue-200' :
                        loc.type.includes('Cold') ? 'bg-cyan-100 text-cyan-800 border-cyan-200' :
                        'bg-gray-100 text-gray-800 border-gray-200'
                      }`}>
                        {loc.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-600">{loc.city}</td>
                    
                    {/* VISUAL CAPACITY FILL BAR */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden shadow-inner">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              loc.capacity >= 85 ? 'bg-red-500' : loc.capacity >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${loc.capacity}%` }}
                          ></div>
                        </div>
                        <span className={`text-[11px] font-mono font-black w-10 text-right ${loc.capacity >= 85 ? 'text-red-600' : 'text-gray-600'}`}>
                          {loc.capacity}%
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider border ${loc.status === 'Active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                        {loc.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🛡️ MODAL 1: FORM REGISTER FASILITAS BARU (BULLETPROOF FLEXBOX)            */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[550px] shadow-2xl flex flex-col relative animate-fade-in" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            {/* --- HEADER --- */}
            <div className="bg-[#415a77] text-white px-5 py-4 flex justify-between items-center shrink-0 z-10">
              <h3 className="font-black text-sm uppercase tracking-wider">Register New Facility Node</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-300 hover:text-white font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            {/* --- BODY FORM --- */}
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0">
              
              <div className="bg-blue-50 border border-blue-200 text-blue-800 text-[10px] p-3 rounded-sm flex items-start gap-3 mb-5">
                <span className="text-xl leading-none">💡</span>
                <div className="leading-tight">
                  <strong className="text-[#125ab2]">Smart ID Generation:</strong> Facility ID akan diciptakan secara otomatis oleh sistem berdasarkan kodifikasi area (City) untuk menjaga standarisasi global ARUS Motors.
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Facility Official Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text" placeholder="e.g. Cikarang Battery Assembly" 
                    value={form.name} onChange={e => setForm({...form, name: e.target.value})} 
                    className={`w-full border px-3 py-2 outline-none text-xs font-semibold transition-colors rounded-sm ${formErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-[#125ab2]'}`} 
                  />
                  {formErrors.name && <p className="text-red-500 text-[9px] font-bold mt-1 uppercase tracking-wider">{formErrors.name}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Facility Type / Function <span className="text-red-500">*</span></label>
                    <select 
                      value={form.type} onChange={e => setForm({...form, type: e.target.value})} 
                      className={`w-full border px-3 py-2 outline-none text-xs font-bold cursor-pointer rounded-sm bg-white ${formErrors.type ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-[#125ab2]'}`}
                    >
                      <option value="" disabled>-- Select Type --</option>
                      {typeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">City / Region <span className="text-red-500">*</span></label>
                    <select 
                      value={form.city} onChange={e => setForm({...form, city: e.target.value})} 
                      className={`w-full border px-3 py-2 outline-none text-xs font-bold cursor-pointer rounded-sm bg-white ${formErrors.city ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-[#125ab2]'}`}
                    >
                      <option value="" disabled>-- Select Region --</option>
                      {cityOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Site Manager (PIC) <span className="text-red-500">*</span></label>
                    <input 
                      type="text" placeholder="e.g. John Doe" 
                      value={form.manager} onChange={e => setForm({...form, manager: e.target.value})} 
                      className={`w-full border px-3 py-2 outline-none text-xs rounded-sm ${formErrors.manager ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-[#125ab2]'}`} 
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Total Area Size (M²) <span className="text-red-500">*</span></label>
                    <input 
                      type="number" min="1" placeholder="e.g. 15000" 
                      value={form.area} onChange={e => setForm({...form, area: e.target.value})} 
                      className={`w-full border px-3 py-2 outline-none text-sm font-black text-[#125ab2] rounded-sm ${formErrors.area ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-[#125ab2]'}`} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* --- FOOTER --- */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 shrink-0 z-10">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm rounded-sm">Cancel</button>
              <button onClick={handleSave} className="px-6 py-2.5 bg-[#125ab2] hover:bg-[#0e4487] text-white text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors rounded-sm">Register Facility</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ MODAL 2: DETAIL FASILITAS / DRILL-DOWN (BULLETPROOF FLEXBOX)           */}
      {/* ========================================================================= */}
      {selectedLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[550px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-[#125ab2]" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            {/* Header Pop-up Detail */}
            <div className="bg-blue-50 border-b border-blue-100 px-6 py-4 flex justify-between items-center shrink-0 z-10">
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Facility Node Profile</p>
                <h3 className="font-black font-mono text-xl text-[#125ab2] leading-none">{selectedLocation.id}</h3>
              </div>
              <button onClick={() => setSelectedLocation(null)} className="text-gray-400 hover:text-gray-800 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            {/* Body Rincian */}
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 text-gray-800">
              <div className="grid grid-cols-2 gap-x-6 gap-y-5 border-b border-gray-200 pb-5">
                <div className="col-span-2">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider mb-1">Facility Name</span>
                  <span className="text-lg font-black text-gray-900 leading-tight">{selectedLocation.name}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-gray-100 py-5">
                <div className="bg-gray-50 border border-gray-200 p-3 rounded-sm">
                  <span className="text-[9px] font-bold uppercase text-gray-500 block tracking-wider mb-1">Facility Type</span>
                  <span className="text-sm font-black text-[#125ab2]">{selectedLocation.type}</span>
                </div>
                <div className="bg-gray-50 border border-gray-200 p-3 rounded-sm">
                  <span className="text-[9px] font-bold uppercase text-gray-500 block tracking-wider mb-1">City / Region</span>
                  <span className="text-xs font-bold text-gray-700">{selectedLocation.city}</span>
                </div>
                <div className="bg-gray-50 border border-gray-200 p-3 rounded-sm">
                  <span className="text-[9px] font-bold uppercase text-gray-500 block tracking-wider mb-1">Site Manager (PIC)</span>
                  <span className="text-xs font-bold text-gray-700">{selectedLocation.manager}</span>
                </div>
                <div className="bg-gray-50 border border-gray-200 p-3 rounded-sm">
                  <span className="text-[9px] font-bold uppercase text-gray-500 block tracking-wider mb-1">Total Mapped Area</span>
                  <span className="text-sm font-black font-mono text-slate-700">{selectedLocation.area.toLocaleString('en-US')} M²</span>
                </div>
              </div>

              {/* UTILIZATION GAUGE */}
              <div className="mt-5">
                <div className="flex justify-between items-end mb-2">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Live Capacity Utilization</p>
                  <span className={`text-xl font-black ${selectedLocation.capacity > 85 ? 'text-red-600' : selectedLocation.capacity > 50 ? 'text-amber-500' : 'text-emerald-600'}`}>
                    {selectedLocation.capacity}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 border border-gray-200 h-4 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className={`h-full transition-all ${
                      selectedLocation.capacity >= 85 ? 'bg-red-500' : 
                      selectedLocation.capacity >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${selectedLocation.capacity}%` }}
                  ></div>
                </div>
                <p className="text-[9px] text-gray-400 mt-2 italic">*Data is aggregated dynamically from Active Bin contents.</p>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider mb-1">Operational Status Node</span>
                  <span className={`inline-block px-3 py-1 text-[10px] font-black uppercase tracking-wider border rounded-sm ${selectedLocation.status === 'Active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                    {selectedLocation.status}
                  </span>
                </div>
                <button 
                  onClick={() => toggleStatus(selectedLocation.id)}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-colors shadow-sm"
                >
                  Toggle Maintenance
                </button>
              </div>
            </div>

            {/* Action Buttons inside Details */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between shrink-0 z-10">
              <button 
                onClick={() => deleteLocation(selectedLocation.id)} 
                className="bg-white border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-sm shadow-sm transition-colors"
              >
                Decommission
              </button>
              <button 
                onClick={() => setSelectedLocation(null)} 
                className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-6 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-sm shadow-sm transition-colors"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Locations;