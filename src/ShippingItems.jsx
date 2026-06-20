import React, { useState, useContext, useEffect, useMemo } from 'react';
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

const ShippingItems = () => {
  const { bahasa } = useContext(AppContext);
  
  // 1. DATA MASTER KURIR (PABRIK EV - ARUS MOTORS)
  const initialCarriers = [
    { id: 'SHP-ARS-001', name: 'Raw Material Restock (Batteries)', carrier: 'DHL Supply Chain', service: 'Freight LTL', fleet: 'Refrigerated Truck (Cold Chain)', baseCost: 1250, status: 'Active' },
    { id: 'SHP-ARS-002', name: 'Chassis & Structural Transport', carrier: 'Maersk Logistics', service: 'Ground Heavy', fleet: 'Flatbed Trailer', baseCost: 850, status: 'Active' },
    { id: 'SHP-ARS-003', name: 'Finished Vehicle Delivery (B2B)', carrier: 'ARUS Internal Fleet', service: 'Direct to Dealer', fleet: 'RORO Car Carrier', baseCost: 450, status: 'Active' },
    { id: 'SHP-ARS-004', name: 'Urgent Component Replacement', carrier: 'FedEx Express', service: 'Next Day Air', fleet: 'Cargo Plane / Van', baseCost: 320, status: 'Inactive' },
  ];

  const [items, setItems] = useState(() => {
    try {
      const saved = window.localStorage.getItem('shippingData_ARUS_Motors');
      return saved ? JSON.parse(saved) : initialCarriers;
    } catch {
      return initialCarriers;
    }
  });

  // ─── ALGORITMA PEMBERSIH PIZZA / DATA LAMA ───
  useEffect(() => {
    const hasOldData = items.some(item => 
      item.carrier.includes('GoSend') || 
      item.fleet.includes('Motorcycle') || 
      item.id === 'SHP-001'
    );
    if (hasOldData) {
      setItems(initialCarriers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simpan setiap ada perubahan
  useEffect(() => {
    try {
      window.localStorage.setItem('shippingData_ARUS_Motors', JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save Shipping data:', error);
    }
  }, [items]);

  // 2. STATE FORM, MODAL, PENCARIAN & DETAIL
  const [form, setForm] = useState({ name: '', carrier: '', service: '', fleet: '', baseCost: '' });
  const [toasts, setToasts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null); 
  const [searchTerm, setSearchTerm] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // 3. DAFTAR OPSI DROPDOWN (HEAVY LOGISTICS)
  const carrierOptions = ['ARUS Internal Fleet', 'DHL Supply Chain', 'Maersk Logistics', 'CEVA Logistics', 'FedEx Express', 'UPS Freight'];
  const serviceOptions = ['Ground Standard', 'Ground Heavy', 'Freight LTL', 'Freight FTL', 'Next Day Air', 'Direct to Dealer'];
  const fleetOptions = ['Standard Box Truck', 'Flatbed Trailer', 'Refrigerated Truck (Cold Chain)', 'RORO Car Carrier', 'Cargo Plane / Van'];

  // 4. FUNGSI TOAST
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // 5. STATS DASHBOARD
  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter(i => i.status === 'Active').length;
    const inactive = items.filter(i => i.status === 'Inactive').length;
    return { total, active, inactive };
  }, [items]);

  // 6. FUNGSI AKSI BARIS (Toggle Status & Delete)
  const toggleStatus = (id) => {
    setItems(items.map(item => item.id === id ? { ...item, status: item.status === 'Active' ? 'Inactive' : 'Active' } : item));
    addToast(`Service node ${id} status has been updated.`, 'success');
    if (selectedItem && selectedItem.id === id) {
      setSelectedItem(prev => ({ ...prev, status: prev.status === 'Active' ? 'Inactive' : 'Active' }));
    }
  };

  const deleteItem = (id) => {
    if(window.confirm(`WARNING: Are you sure you want to permanently delete shipping route ${id}? This action cannot be undone.`)) {
      setItems(items.filter(item => item.id !== id));
      setSelectedItem(null);
      addToast(`Shipping route ${id} successfully purged from registry.`, 'success');
    }
  };

  // 7. FUNGSI SIMPAN DATA DENGAN SAFEGUARD
  const handleSave = (e) => {
    e.preventDefault();
    const errors = {};
    if (!form.name.trim()) errors.name = 'Description required';
    if (!form.carrier) errors.carrier = 'Carrier required';
    if (!form.service) errors.service = 'Service required';
    if (!form.fleet) errors.fleet = 'Fleet required';
    if (!form.baseCost || isNaN(form.baseCost) || parseFloat(form.baseCost) <= 0) errors.baseCost = 'Valid cost required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      addToast(bahasa === 'en' ? 'Please complete all required fields!' : 'Harap isi semua kolom wajib!', 'error');
      return;
    }
    
    // Auto-Generate ID Cerdas
    const nextIdNumber = items.length > 0 ? Math.max(...items.map(i => parseInt(i.id.split('-')[2]) || 0)) + 1 : 1;
    const newId = `SHP-ARS-${nextIdNumber.toString().padStart(3, '0')}`;

    const newItem = {
      id: newId,
      name: form.name.trim(),
      carrier: form.carrier,
      service: form.service,
      fleet: form.fleet,
      baseCost: parseFloat(form.baseCost),
      status: 'Active'
    };
    
    setItems([newItem, ...items]);
    setIsModalOpen(false);
    setForm({ name: '', carrier: '', service: '', fleet: '', baseCost: '' });
    setFormErrors({});
    addToast(bahasa === 'en' ? `Logistics route ${newId} saved successfully!` : `Rute logistik ${newId} berhasil disimpan!`, 'success');
  };

  // 8. FILTER PENCARIAN
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.carrier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 animate-fade-in">
      <Toast toasts={toasts} removeToast={removeToast} />
      
      {/* ── HEADER (CLEAN & COMPACT) ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>🚚 Outbound</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Logistics Setup</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide">
            {bahasa === 'en' ? 'Shipping Routes & Carriers' : 'Rute Pengiriman & Kurir'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {bahasa === 'en' ? 'Manage 3PL logistics, fleet types, and base delivery costs.' : 'Kelola logistik 3PL, tipe armada alat berat, dan biaya dasar pengiriman.'}
          </p>
        </div>
        <button 
          onClick={() => {
            setForm({ name: '', carrier: '', service: '', fleet: '', baseCost: '' });
            setFormErrors({});
            setIsModalOpen(true);
          }}
          className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-5 py-2 rounded-sm text-xs font-bold transition-colors shadow-sm uppercase tracking-wider whitespace-nowrap flex items-center gap-2"
        >
          <span>+</span> {bahasa === 'en' ? 'New Logistics Route' : 'Tambah Rute Kurir'}
        </button>
      </div>

      {/* ── DASHBOARD STATS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="bg-white border border-gray-200 p-4 shadow-sm border-l-4 border-l-[#415a77] flex justify-between items-center hover:shadow-md transition-shadow">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Total Routes Mapped</p>
            <h3 className="text-2xl font-black text-[#415a77]">{stats.total} <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nodes</span></h3>
          </div>
          <div className="text-3xl opacity-20">🗺️</div>
        </div>
        <div className="bg-white border border-gray-200 p-4 shadow-sm border-l-4 border-l-emerald-500 flex justify-between items-center hover:shadow-md transition-shadow">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Active Carriers</p>
            <h3 className="text-2xl font-black text-emerald-600">{stats.active} <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Fleets</span></h3>
          </div>
          <div className="text-3xl opacity-20">🚛</div>
        </div>
        <div className="bg-white border border-gray-200 p-4 shadow-sm border-l-4 border-l-gray-400 flex justify-between items-center hover:shadow-md transition-shadow">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Inactive / Suspended</p>
            <h3 className="text-2xl font-black text-gray-600">{stats.inactive} <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Routes</span></h3>
          </div>
          <div className="text-3xl opacity-20">⏸️</div>
        </div>
      </div>

      {/* ── SEARCH BAR ── */}
      <div className="bg-white border border-gray-300 shadow-sm p-3 mb-0 flex gap-2 rounded-sm">
        <input 
          type="text" 
          placeholder={bahasa === 'en' ? 'Search by Route ID, Description, or Carrier Name...' : 'Cari berdasarkan ID Rute, Deskripsi, atau Nama Kurir...'} 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 border border-gray-300 px-3 py-1.5 text-xs outline-none focus:border-[#125ab2] transition-colors"
        />
      </div>

      {/* ── TABEL DATA ── */}
      <div className="bg-white border border-gray-300 shadow-sm w-full overflow-hidden rounded-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
            <thead className="bg-[#e5e5e5] text-[#666666] text-[10px] uppercase tracking-wider border-b border-gray-300">
              <tr>
                <th className="py-3 px-4 font-bold w-32">ROUTE ID</th>
                <th className="py-3 px-4 font-bold">DESCRIPTION NAME</th>
                <th className="py-3 px-4 font-bold">CARRIER & FLEET</th>
                <th className="py-3 px-4 font-bold text-center w-36">SERVICE CLASS</th>
                <th className="py-3 px-4 font-bold text-right w-36">BASE COST (USD)</th>
                <th className="py-3 px-4 font-bold text-center w-28">STATUS</th>
                <th className="py-3 px-4 font-bold text-center w-28">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="text-[12px] text-gray-700">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-400 font-bold italic">
                    <span className="text-3xl block mb-2 opacity-50">📭</span>
                    No shipping routes found in registry.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${item.status === 'Inactive' ? 'bg-gray-50 opacity-60' : ''}`}>
                    <td className="py-3 px-4 font-black">
                      <span 
                        onClick={() => setSelectedItem(item)}
                        className="text-[#125ab2] hover:underline cursor-pointer font-bold font-mono text-[13px] flex items-center gap-1.5"
                        title="View Route Details"
                      >
                        <span className="text-base">📍</span> {item.id}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-800">{item.name}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-800">{item.carrier}</div>
                      <div className="text-[10px] text-gray-500 font-semibold tracking-wider mt-0.5">{item.fleet}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-gray-100 text-gray-700 border border-gray-300 px-2 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider">
                        {item.service}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-emerald-700">
                      ${item.baseCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider border ${item.status === 'Active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gray-200 text-gray-600 border-gray-300'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center gap-3">
                        <button onClick={() => toggleStatus(item.id)} className="text-gray-400 hover:text-[#125ab2] font-black text-lg cursor-pointer" title="Toggle Status">⟳</button>
                        <button onClick={() => deleteItem(item.id)} className="text-gray-400 hover:text-red-600 font-black text-sm cursor-pointer mt-0.5" title="Purge Record">✕</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🛡️ MODAL 1: FORM REGISTER KURIR BARU (BULLETPROOF FLEXBOX)                */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[550px] shadow-2xl flex flex-col relative animate-fade-in" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            {/* --- HEADER --- */}
            <div className="bg-[#415a77] text-white px-5 py-4 flex justify-between items-center shrink-0 z-10">
              <h3 className="font-black text-sm uppercase tracking-wider">Map New Logistics Route</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-300 hover:text-white font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            {/* --- BODY FORM --- */}
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0">
              
              <div className="bg-blue-50 border border-blue-200 text-blue-800 text-[10px] p-3 rounded-sm flex items-start gap-3 mb-5">
                <span className="text-xl leading-none">💡</span>
                <div className="leading-tight">
                  <strong className="text-[#125ab2]">Standardization Lock:</strong> Data Base Cost akan diformat ke dalam mata uang USD ($) untuk keperluan kalkulasi landed cost internasional.
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description / Route Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text" placeholder="e.g. VIP Dealer Direct Transport" 
                    value={form.name} onChange={e => setForm({...form, name: e.target.value})} 
                    className={`w-full border px-3 py-2 outline-none text-xs font-semibold transition-colors rounded-sm ${formErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-[#125ab2]'}`} 
                  />
                  {formErrors.name && <p className="text-red-500 text-[9px] font-bold mt-1 uppercase tracking-wider">{formErrors.name}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">3PL Carrier Company <span className="text-red-500">*</span></label>
                    <select 
                      value={form.carrier} onChange={e => setForm({...form, carrier: e.target.value})} 
                      className={`w-full border px-3 py-2 outline-none text-xs font-bold cursor-pointer rounded-sm bg-white ${formErrors.carrier ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-[#125ab2]'}`}
                    >
                      <option value="" disabled>-- Select Carrier --</option>
                      {carrierOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Fleet / Vehicle Type <span className="text-red-500">*</span></label>
                    <select 
                      value={form.fleet} onChange={e => setForm({...form, fleet: e.target.value})} 
                      className={`w-full border px-3 py-2 outline-none text-xs font-bold cursor-pointer rounded-sm bg-white ${formErrors.fleet ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-[#125ab2]'}`}
                    >
                      <option value="" disabled>-- Select Fleet --</option>
                      {fleetOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Service Level <span className="text-red-500">*</span></label>
                    <select 
                      value={form.service} onChange={e => setForm({...form, service: e.target.value})} 
                      className={`w-full border px-3 py-2 outline-none text-xs font-bold cursor-pointer rounded-sm bg-white ${formErrors.service ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-[#125ab2]'}`}
                    >
                      <option value="" disabled>-- Select Class --</option>
                      {serviceOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Contract Base Cost ($) <span className="text-red-500">*</span></label>
                    <div className={`flex items-center border rounded-sm px-3 py-2 bg-white transition-colors ${formErrors.baseCost ? 'border-red-500 bg-red-50' : 'border-gray-300 focus-within:border-[#125ab2] focus-within:ring-1 focus-within:ring-[#125ab2]'}`}>
                      <span className="text-emerald-700 font-black mr-1">$</span>
                      <input 
                        type="number" min="1" step="any" placeholder="0.00" 
                        value={form.baseCost} onChange={e => setForm({...form, baseCost: e.target.value})} 
                        className="w-full border-none outline-none font-mono font-black text-[#125ab2] text-sm bg-transparent" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* --- FOOTER --- */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 shrink-0 z-10">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm rounded-sm">Cancel</button>
              <button onClick={handleSave} className="px-6 py-2.5 bg-[#125ab2] hover:bg-[#0e4487] text-white text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors rounded-sm">Register Route</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ MODAL 2: DETAIL LOGISTIK / DRILL-DOWN (BULLETPROOF FLEXBOX)            */}
      {/* ========================================================================= */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[550px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-[#125ab2]" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            {/* Header Pop-up Detail */}
            <div className="bg-blue-50 border-b border-blue-100 px-6 py-4 flex justify-between items-center shrink-0 z-10">
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Logistics Node Record</p>
                <h3 className="font-black font-mono text-xl text-[#125ab2] leading-none">{selectedItem.id}</h3>
              </div>
              <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-gray-800 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            {/* Body Rincian */}
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 text-gray-800">
              <div className="grid grid-cols-2 gap-x-6 gap-y-5 border-b border-gray-200 pb-5">
                <div className="col-span-2">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider mb-1">Route Description Name</span>
                  <span className="text-lg font-black text-gray-900 leading-tight">{selectedItem.name}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-gray-100 py-5">
                <div className="bg-gray-50 border border-gray-200 p-3 rounded-sm">
                  <span className="text-[9px] font-bold uppercase text-gray-500 block tracking-wider mb-1">3PL Provider</span>
                  <span className="text-sm font-black text-[#125ab2]">{selectedItem.carrier}</span>
                </div>
                <div className="bg-gray-50 border border-gray-200 p-3 rounded-sm">
                  <span className="text-[9px] font-bold uppercase text-gray-500 block tracking-wider mb-1">Assigned Fleet Type</span>
                  <span className="text-xs font-bold text-gray-700">{selectedItem.fleet}</span>
                </div>
                <div className="bg-gray-50 border border-gray-200 p-3 rounded-sm">
                  <span className="text-[9px] font-bold uppercase text-gray-500 block tracking-wider mb-1">Service Level Class</span>
                  <span className="text-[11px] bg-white border border-gray-300 px-2 py-0.5 font-bold uppercase tracking-wider inline-block mt-0.5 rounded-sm text-gray-600">{selectedItem.service}</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-sm">
                  <span className="text-[9px] font-bold uppercase text-emerald-800 block tracking-wider mb-1">Contracted Base Cost</span>
                  <span className="text-lg font-black font-mono text-emerald-700">${selectedItem.baseCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-5">
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider mb-1">Operational Status Node</span>
                  <span className={`inline-block px-3 py-1 text-[10px] font-black uppercase tracking-wider border rounded-sm ${selectedItem.status === 'Active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gray-200 text-gray-600 border-gray-300'}`}>
                    {selectedItem.status}
                  </span>
                </div>
                <button 
                  onClick={() => toggleStatus(selectedItem.id)}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-colors shadow-sm"
                >
                  Change Status
                </button>
              </div>
            </div>

            {/* Action Buttons inside Details */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between shrink-0 z-10">
              <button 
                onClick={() => deleteItem(selectedItem.id)} 
                className="bg-white border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-sm shadow-sm transition-colors"
              >
                Purge Record
              </button>
              <button 
                onClick={() => setSelectedItem(null)} 
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

export default ShippingItems;