import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from './AppContext';

// ─── TOAST COMPONENT (Notifikasi Sistem Anti-Klik Bug) ───────────────────────
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

// ─── MASTER WAREHOUSE TOPOLOGY (CETAK BIRU GUDANG) ───────────────────────────
// Sistem hanya akan mengizinkan registrasi rak berdasarkan master slot ini
const zoneCoordinateMap = {
  'Zone A (Ambient)': Array.from({ length: 20 }, (_, i) => `ZONE-A-${String(i + 1).padStart(2, '0')}`),
  'Zone B (Cold Storage)': Array.from({ length: 20 }, (_, i) => `ZONE-B-${String(i + 1).padStart(2, '0')}`),
  'Zone C (Heavy Rack)': Array.from({ length: 20 }, (_, i) => `ZONE-C-${String(i + 1).padStart(2, '0')}`),
  'QC Staging Area': ['QC-STG-01', 'QC-STG-02', 'QC-STG-03', 'QC-STG-04', 'QC-STG-05'],
  'RMA / Quarantine': ['RMA-QNT-01', 'RMA-QNT-02', 'RMA-QNT-03'],
  'Inbound Dock': ['DOCK-IN-01', 'DOCK-IN-02', 'DOCK-IN-03', 'DOCK-IN-04', 'DOCK-IN-05']
};

const Bins = () => {
  const { bahasa } = useContext(AppContext);

  // 1. DATA SIMULASI RAK GUDANG (Enterprise ARUS Motors Data)
  const initialBins = [
    { id: 'BIN-ZONE-A-01', zone: 'Zone A (Ambient)', type: 'Bulk Storage', maxWeight: 5000, currentWeight: 3500, status: 'Active', itemsInside: [{ sku: 'SKU-ARS-CBL12', name: 'High Voltage Harness Cable 50mm2', qty: 1500 }] },
    { id: 'BIN-ZONE-A-05', zone: 'Zone A (Ambient)', type: 'Picking Bin', maxWeight: 1000, currentWeight: 880, status: 'Active', itemsInside: [{ sku: 'SKU-ARS-MCU03', name: 'Motor Control Unit (MCU) Gen 3', qty: 150 }] },
    { id: 'BIN-ZONE-B-01', zone: 'Zone B (Cold Storage)', type: 'Heavy Duty Rack', maxWeight: 10000, currentWeight: 9200, status: 'Active', itemsInside: [{ sku: 'SKU-ARS-LFP01', name: 'Blade Battery Cell 3.2V 150Ah', qty: 4500 }] },
    { id: 'BIN-ZONE-C-01', zone: 'Zone C (Heavy Rack)', type: 'Heavy Duty Rack', maxWeight: 15000, currentWeight: 12000, status: 'Active', itemsInside: [{ sku: 'SKU-ARS-CHZ04', name: 'Underbody Steel Chassis Frame', qty: 90 }] },
    { id: 'BIN-QC-STG-01', zone: 'QC Staging Area', type: 'Staging Area', maxWeight: 2000, currentWeight: 0, status: 'Active', itemsInside: [] },
    { id: 'BIN-RMA-QNT-01', zone: 'RMA / Quarantine', type: 'Bulk Storage', maxWeight: 5000, currentWeight: 150, status: 'Active', itemsInside: [{ sku: 'SKU-ARS-MCU03', name: 'Motor Control Unit (MCU) Gen 3 - Defect', qty: 10 }] },
  ];

  const [bins, setBins] = useState(() => {
    try {
      const saved = window.localStorage.getItem('binData_ARUS_Motors');
      return saved ? JSON.parse(saved) : initialBins;
    } catch {
      return initialBins;
    }
  });

  // ─── ALGORITMA PEMBERSIH PIZZA / DATA LAMA ───
  useEffect(() => {
    const hasOldData = bins.some(b => 
      b.id.includes('COLD-A01') || 
      b.itemsInside.some(i => i.name.toLowerCase().includes('pizza'))
    );
    if (hasOldData) {
      setBins(initialBins);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('binData_ARUS_Motors', JSON.stringify(bins));
    } catch (error) {
      console.error('Failed to save Bin data:', error);
    }
  }, [bins]);

  // 2. STATE UI & FORM
  const [searchQuery, setSearchQuery] = useState('');
  const [zoneFilter, setZoneFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBinDetails, setSelectedBinDetails] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Form State Bin Baru
  const [form, setForm] = useState({ zone: 'Zone A (Ambient)', binCode: '', type: 'Picking Bin', maxWeight: '' });

  // DYNAMIC DROPDOWN LOGIC: Hitung ketersediaan slot rak berdasarkan Zona terpilih
  const availableCoords = useMemo(() => {
    if (!form.zone) return [];
    const allCoordsInZone = zoneCoordinateMap[form.zone];
    // Filter out koordinat yang sudah ada di state `bins`
    return allCoordsInZone.filter(coord => !bins.some(b => b.id === `BIN-${coord}`));
  }, [form.zone, bins]);

  // Auto-select koordinat pertama yang tersedia jika Zona berubah
  useEffect(() => {
    if (availableCoords.length > 0) {
      setForm(prev => ({ ...prev, binCode: availableCoords[0] }));
    } else {
      setForm(prev => ({ ...prev, binCode: '' }));
    }
  }, [availableCoords]);

  // 3. TOAST HELPERS
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // 4. METRIK PERSENTASE KETERISIAN RAK
  const stats = useMemo(() => {
    const total = bins.length;
    const empty = bins.filter(b => b.currentWeight === 0).length;
    const nearFull = bins.filter(b => (b.currentWeight / b.maxWeight) >= 0.85).length;
    return { total, empty, nearFull };
  }, [bins]);

  // 5. FILTER DATA SEARCH
  const filteredBins = useMemo(() => {
    return bins.filter(b => {
      const matchSearch = b.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchZone = zoneFilter === 'All' || b.zone === zoneFilter;
      return matchSearch && matchZone;
    });
  }, [bins, searchQuery, zoneFilter]);

  // 6. SAVE TRANSACTION HANDLER
  const handleSaveBin = () => {
    if (!form.binCode) {
      addToast(bahasa === 'en' ? 'No available coordinate selected!' : 'Tidak ada koordinat yang dipilih!', 'error');
      return;
    }
    if (!form.maxWeight) {
      addToast(bahasa === 'en' ? 'Maximum Weight capacity is required!' : 'Kapasitas Berat Maksimal wajib diisi!', 'error');
      return;
    }

    const fullBinId = `BIN-${form.binCode}`;
    
    // Double validation just in case
    if (bins.some(b => b.id === fullBinId)) {
      addToast(`System Block: Location coordinate ${fullBinId} already exists!`, 'error');
      return;
    }

    const newBin = {
      id: fullBinId,
      zone: form.zone,
      type: form.type,
      maxWeight: parseFloat(form.maxWeight),
      currentWeight: 0,
      status: 'Active',
      itemsInside: []
    };

    setBins([newBin, ...bins]);
    setIsModalOpen(false);
    addToast(`Success! New location coordinate ${fullBinId} has been mapped.`, 'success');
    
    // Reset Form
    setForm({ zone: 'Zone A (Ambient)', binCode: '', type: 'Picking Bin', maxWeight: '' });
  };

  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 animate-fade-in">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>⚙️ System</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Infrastructure</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide">
            {bahasa === 'en' ? 'Warehouse Bin Directory' : 'Daftar Koordinat Rak (Bins)'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {bahasa === 'en' ? 'Manage micro-locations, dimensional restrictions, and space utilization.' : 'Kelola lokasi penyimpanan mikro, batas kapasitas berat, dan tingkat keterisian rak.'}
          </p>
        </div>
        <button 
          onClick={() => {
            setForm({ zone: 'Zone A (Ambient)', binCode: '', type: 'Picking Bin', maxWeight: '' });
            setIsModalOpen(true);
          }}
          className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-5 py-2 rounded-sm shadow-sm text-sm font-bold transition-colors flex items-center gap-2"
        >
          <span>+</span> {bahasa === 'en' ? 'Map New Location' : 'Buat Koordinat Baru'}
        </button>
      </div>

      {/* ── DASHBOARD UTILLIZATION STATS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="bg-white border border-gray-200 p-4 shadow-sm border-l-4 border-l-[#415a77] flex justify-between items-center hover:shadow-md transition-shadow">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Total Registered Locs</p>
            <h3 className="text-2xl font-black text-[#415a77]">{stats.total} <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Zones</span></h3>
          </div>
          <div className="text-3xl opacity-20">🏗️</div>
        </div>
        <div className="bg-white border border-gray-200 p-4 shadow-sm border-l-4 border-l-emerald-500 flex justify-between items-center hover:shadow-md transition-shadow">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Empty (Available Space)</p>
            <h3 className="text-2xl font-black text-emerald-600">{stats.empty} <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Zones</span></h3>
          </div>
          <div className="text-3xl opacity-20">✅</div>
        </div>
        <div className="bg-white border border-gray-200 p-4 shadow-sm border-l-4 border-l-amber-500 flex justify-between items-center hover:shadow-md transition-shadow">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Critical Capacity (&gt;85% Full)</p>
            <h3 className="text-2xl font-black text-amber-600">{stats.nearFull} <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Zones</span></h3>
          </div>
          <div className="text-3xl opacity-20">🚨</div>
        </div>
      </div>

      {/* ── SEARCH & FILTER ── */}
      <div className="bg-white border border-gray-300 shadow-sm p-3 mb-0 flex gap-2 rounded-sm">
        <input 
          type="text"
          placeholder={bahasa === 'en' ? 'Search by Bin Location Code (e.g. ZONE-B)...' : 'Cari berdasarkan Kode Lokasi Bin (Cth: ZONE-B)...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 border border-gray-300 px-3 py-1.5 text-xs outline-none focus:border-[#125ab2] transition-colors"
        />
        <select 
          value={zoneFilter}
          onChange={(e) => setZoneFilter(e.target.value)}
          className="border border-gray-300 px-3 py-1.5 text-xs font-bold outline-none bg-gray-50 text-gray-700 cursor-pointer"
        >
          <option value="All">All Warehouse Zones</option>
          {Object.keys(zoneCoordinateMap).map(zone => (
            <option key={zone} value={zone}>{zone}</option>
          ))}
        </select>
      </div>

      {/* ── TABLE DATA RECENT BINS ── */}
      <div className="bg-white border border-gray-300 shadow-sm w-full overflow-hidden rounded-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-[#e5e5e5] text-[#666666] text-[10px] uppercase tracking-wider border-b border-gray-300">
                <th className="py-3 px-4 font-bold w-40">COORDINATE CODE</th>
                <th className="py-3 px-4 font-bold w-44">WAREHOUSE ZONE</th>
                <th className="py-3 px-4 font-bold w-40">BIN TYPE</th>
                <th className="py-3 px-4 font-bold w-48 text-center">CAPACITY UTILIZATION</th>
                <th className="py-3 px-4 font-bold w-32 text-right">WEIGHT LOAD</th>
                <th className="py-3 px-4 font-bold w-24 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody className="text-[12px] text-[#333333]">
              {filteredBins.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <span className="text-4xl opacity-50">📭</span>
                      <p className="text-gray-500 font-bold italic">{bahasa === 'en' ? 'No locations found in database.' : 'Tidak ada lokasi ditemukan.'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBins.map((bin) => {
                  const fillPercent = Math.min(100, Math.round((bin.currentWeight / bin.maxWeight) * 100));
                  
                  return (
                    <tr key={bin.id} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <span 
                          onClick={() => setSelectedBinDetails(bin)}
                          className="font-mono font-black text-[#125ab2] cursor-pointer hover:underline text-[13px] flex items-center gap-1.5"
                          title="View Contents Map"
                        >
                          <span className="text-base">📍</span> {bin.id}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-700">{bin.zone}</td>
                      <td className="py-3 px-4 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">{bin.type}</td>
                      
                      {/* VISUAL CAPACITY FILL BAR */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden shadow-inner">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                fillPercent >= 85 ? 'bg-red-500' : fillPercent >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${fillPercent}%` }}
                            ></div>
                          </div>
                          <span className={`text-[11px] font-mono font-black w-10 text-right ${fillPercent >= 85 ? 'text-red-600' : 'text-gray-600'}`}>{fillPercent}%</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span className="text-gray-800">{bin.currentWeight.toLocaleString('en-US')}</span> <span className="text-gray-400">/ {bin.maxWeight.toLocaleString('en-US')} kg</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-sm font-bold text-[9px] uppercase tracking-wider border ${bin.status === 'Active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gray-200 text-gray-600 border-gray-300'}`}>
                          {bin.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🛡️ MODAL 1: FORM PENDAFTARAN BIN BARU (BULLETPROOF & DYNAMIC DROPDOWN)    */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[500px] shadow-2xl flex flex-col relative animate-fade-in" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            {/* --- HEADER --- */}
            <div className="bg-[#415a77] text-white px-5 py-4 flex justify-between items-center shrink-0 z-10">
              <h3 className="font-black text-sm uppercase tracking-wider">Register Single Location Bin</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-300 hover:text-white font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            {/* --- BODY --- */}
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0">
              
              <div className="bg-blue-50 border border-blue-200 text-blue-800 text-[10px] p-3 rounded-sm flex items-start gap-3 mb-5">
                <span className="text-xl leading-none">💡</span>
                <div className="leading-tight">
                  <strong className="text-[#125ab2]">Topology Grid Lock:</strong> Pilih Zona Gudang terlebih dahulu. Sistem akan menyajikan opsi slot koordinat yang masih kosong berdasarkan cetak biru (blueprint) fasilitas kita.
                </div>
              </div>

              {/* ── 1. ZONE SELECTION (Memicu ketersediaan slot) ── */}
              <div className="mb-4">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">1. Select Warehouse Zone <span className="text-red-500">*</span></label>
                <select 
                  value={form.zone} 
                  onChange={e => setForm({...form, zone: e.target.value})}
                  className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] bg-white text-xs font-bold text-gray-800 cursor-pointer rounded-sm"
                >
                  {Object.keys(zoneCoordinateMap).map(zone => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
              </div>

              {/* ── 2. DYNAMIC COORDINATE DROPDOWN ── */}
              <div className="mb-5 p-4 border border-blue-100 bg-blue-50/30 rounded-sm">
                <label className="block text-[10px] font-bold text-[#125ab2] uppercase tracking-wider mb-1.5">2. Available Bin Coordinate Code <span className="text-red-500">*</span></label>
                <div className="flex items-center border border-gray-300 bg-white rounded-sm focus-within:border-[#125ab2] transition-colors">
                  <span className="px-3 py-2 bg-gray-100 border-r border-gray-300 font-mono font-bold text-gray-500 text-xs">BIN-</span>
                  <select 
                    value={form.binCode} 
                    onChange={e => setForm({...form, binCode: e.target.value})}
                    className="w-full px-3 py-2 bg-transparent border-none outline-none font-mono font-black text-[#125ab2] text-xs cursor-pointer"
                    disabled={availableCoords.length === 0}
                  >
                    {availableCoords.length > 0 ? (
                      availableCoords.map(coord => (
                        <option key={coord} value={coord}>{coord} (Empty Slot)</option>
                      ))
                    ) : (
                      <option value="">[ ZONE FULL - NO SLOTS AVAILABLE ]</option>
                    )}
                  </select>
                </div>
                {availableCoords.length === 0 && (
                  <p className="text-[10px] text-red-600 font-bold mt-2 uppercase tracking-wider">🚨 All blueprint slots in this zone are currently mapped.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">3. Bin Putting Type <span className="text-red-500">*</span></label>
                  <select 
                    value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                    className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] bg-white text-xs font-bold text-gray-700 cursor-pointer rounded-sm"
                  >
                    <option value="Picking Bin">Picking Bin (Lantai)</option>
                    <option value="Bulk Storage">Bulk Storage (Atas)</option>
                    <option value="Heavy Duty Rack">Heavy Duty Rack</option>
                    <option value="Staging Area">Staging Area (Transit)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">4. Max Weight (Kg) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" min="1" placeholder="e.g. 5000" value={form.maxWeight}
                    onChange={e => setForm({...form, maxWeight: e.target.value})}
                    className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] font-black text-sm text-[#125ab2] rounded-sm"
                  />
                </div>
              </div>
            </div>

            {/* --- FOOTER --- */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 shrink-0 z-10">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm rounded-sm">Cancel</button>
              <button 
                onClick={handleSaveBin} 
                disabled={availableCoords.length === 0}
                className={`px-6 py-2.5 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors rounded-sm ${availableCoords.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#125ab2] hover:bg-[#0e4487]'}`}
              >
                Save Location Mapping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ MODAL 2: MAP CONTENT DRILL-DOWN (BULLETPROOF FLEXBOX)                  */}
      {/* ========================================================================= */}
      {selectedBinDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[550px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-purple-600" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            <div className="bg-purple-50 px-5 py-4 flex justify-between items-center border-b border-purple-100 shrink-0 z-10">
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Location Contents Map</p>
                <h3 className="font-black text-xl text-purple-700 leading-none">{selectedBinDetails.id}</h3>
              </div>
              <button onClick={() => setSelectedBinDetails(null)} className="text-gray-400 hover:text-gray-800 font-bold text-xl leading-none px-2">✕</button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0">
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-3 rounded-sm border border-gray-200">
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-1">Warehouse Zone</p>
                  <p className="font-black text-gray-800 text-sm">{selectedBinDetails.zone}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-sm border border-gray-200">
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-1">Structural Type</p>
                  <p className="font-black text-gray-800 text-sm">{selectedBinDetails.type}</p>
                </div>
              </div>

              {/* UTILIZATION GAUGE */}
              <div className="mb-6 border-b border-gray-200 pb-5">
                <div className="flex justify-between items-end mb-2">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Weight Load Utilization</p>
                  <p className="font-mono font-black text-sm text-[#125ab2]">
                    {selectedBinDetails.currentWeight.toLocaleString('en-US')} <span className="text-gray-400 text-xs">/ {selectedBinDetails.maxWeight.toLocaleString('en-US')} kg</span>
                  </p>
                </div>
                <div className="w-full bg-gray-100 border border-gray-200 h-3 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className={`h-full transition-all ${
                      (selectedBinDetails.currentWeight / selectedBinDetails.maxWeight) >= 0.85 ? 'bg-red-500' : 
                      (selectedBinDetails.currentWeight / selectedBinDetails.maxWeight) >= 0.50 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, (selectedBinDetails.currentWeight / selectedBinDetails.maxWeight) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">📦</span>
                <p className="text-[10px] font-black text-gray-600 uppercase tracking-wider">Stored Items Manifest</p>
              </div>
              
              <div className="border border-gray-200 rounded-sm overflow-hidden mb-2 shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 font-bold text-gray-500 uppercase tracking-wider text-[9px]">
                    <tr>
                      <th className="p-2.5 w-32 border-r border-gray-100">SKU ID</th>
                      <th className="p-2.5 border-r border-gray-100">ITEM DESCRIPTION</th>
                      <th className="p-2.5 text-right w-24">QTY HELD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBinDetails.itemsInside.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                        <td className="p-2.5 font-black text-[#125ab2] font-mono border-r border-gray-100">{item.sku}</td>
                        <td className="p-2.5 text-gray-700 font-semibold border-r border-gray-100">{item.name}</td>
                        <td className="p-2.5 text-right font-black text-sm text-gray-800">{item.qty.toLocaleString('en-US')}</td>
                      </tr>
                    ))}
                    {selectedBinDetails.itemsInside.length === 0 && (
                      <tr>
                        <td colSpan="3" className="p-8 text-center text-gray-400 font-bold italic">
                          <span className="text-3xl block mb-2 opacity-50">💨</span>
                          Empty Bin Location. No inventory mapped here.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end shrink-0 z-10">
              <button onClick={() => setSelectedBinDetails(null)} className="w-full sm:w-auto px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-[10px] font-bold uppercase tracking-wider transition-colors rounded-sm shadow-sm">
                Tutup Peta Rak
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Bins;