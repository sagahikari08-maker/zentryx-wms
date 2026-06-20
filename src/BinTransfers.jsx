import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from './AppContext';

// ─── TOAST COMPONENT ─────────────────────────────────────────────────────────
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
    {toasts.map(({ id, message, type }) => (
      <div key={id} className={`flex items-center gap-3 px-4 py-3 rounded-sm shadow-xl text-white text-xs font-semibold min-w-[280px] border-l-4 ${
        type === 'success' ? 'bg-green-600 border-green-800' : type === 'error' ? 'bg-red-600 border-red-800' : 'bg-orange-500 border-orange-700'
      }`}>
        <span className="text-base">{type === 'success' ? '✓' : type === 'error' ? '🛡️' : '⚠'}</span>
        <span className="flex-1">{message}</span>
        <button onClick={() => removeToast(id)} className="opacity-70 hover:opacity-100 text-lg leading-none">×</button>
      </div>
    ))}
  </div>
);

// ─── MOCK DATABASE UNTUK AUTO-FILL (ARUS MOTORS) ─────────────────────────────
const masterItemsDB = {
  'SKU-ARS-LFP01': { name: 'Blade Battery Cell 3.2V 150Ah', category: 'Energy Storage (Needs Cold)' },
  'SKU-ARS-MCU03': { name: 'Motor Control Unit (MCU) Gen 3', category: 'Powertrain (Ambient)' },
  'SKU-ARS-CBL12': { name: 'High Voltage Harness Cable 50mm2', category: 'Electrical (Ambient)' },
  'SKU-ARS-CHZ04': { name: 'Underbody Steel Chassis Frame', category: 'Structural (Heavy Load)' },
  'SKU-ARS-CLT99': { name: 'Thermal Management Coolant 20L', category: 'Consumables (Ambient)' }
};

// ─── MASTER LOCATION DIRECTORY ───────────────────────────────────────────────
const facilityLocations = [
  { value: 'DOCK-01', label: 'DOCK-01 (Inbound Heavy)' },
  { value: 'RCV-STAGING', label: 'RCV-STAGING (Inbound Transit)' },
  { value: 'QC-STAGING', label: 'QC-STAGING (Inspection Area)' },
  { value: 'ZONE-A-01', label: 'ZONE-A-01 (Ambient Storage)' },
  { value: 'ZONE-A-05', label: 'ZONE-A-05 (Ambient Storage)' },
  { value: 'ZONE-B-01', label: 'ZONE-B-01 (Cold Storage)' },
  { value: 'ZONE-B-02', label: 'ZONE-B-02 (Cold Storage)' },
  { value: 'ZONE-C-01', label: 'ZONE-C-01 (Heavy Chassis Rack)' },
  { value: 'ASSY-LINE-A', label: 'ASSY-LINE-A (Production Line)' },
  { value: 'ASSY-LINE-B', label: 'ASSY-LINE-B (Production Line)' },
  { value: 'RMA-QUARANTINE', label: 'RMA-QUARANTINE (Returns/Defect)' }
];

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const BinTransfers = () => {
  const { bahasa } = useContext(AppContext);

  // 1. DATA SIMULASI (ARUS Motors Internal Logistics)
  const [transfers, setTransfers] = useState([
    { id: 'TRF-ARS-8801', date: '2026-09-18', itemId: 'SKU-ARS-LFP01', itemName: 'Blade Battery Cell 3.2V 150Ah', fromBin: 'ZONE-B-01', toBin: 'ASSY-LINE-B', qty: 120, reason: 'Pick Face Replenishment', status: 'Completed', user: 'Forklift Op 1' },
    { id: 'TRF-ARS-8802', date: '2026-09-19', itemId: 'SKU-ARS-CBL12', itemName: 'High Voltage Harness Cable 50mm2', fromBin: 'RCV-STAGING', toBin: 'ZONE-A-01', qty: 5000, reason: 'Putaway Routing', status: 'Completed', user: 'Inbound Logistics' },
    { id: 'TRF-ARS-8803', date: '2026-09-20', itemId: 'SKU-ARS-MCU03', itemName: 'Motor Control Unit (MCU) Gen 3', fromBin: 'ZONE-A-05', toBin: 'RMA-QUARANTINE', qty: 10, reason: 'Damage/Quarantine Isolation', status: 'Pending', user: 'QA Inspector' },
  ]);

  // 2. STATE UI & MODAL
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrf, setSelectedTrf] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [toasts, setToasts] = useState([]);

  // State Form dengan Default kosong untuk Dropdown
  const [form, setForm] = useState({ 
    itemId: '', itemName: '', fromBin: '', toBin: '', qty: '', reason: 'Pick Face Replenishment' 
  });

  // 3. TOAST LOGIC
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000); // Durasi toast diperpanjang agar user bisa membaca alert Safeguard
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // 4. FILTERING & STATS
  const filteredTransfers = useMemo(() => {
    let data = transfers.filter(t => 
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.itemId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.fromBin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.toBin.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (statusFilter !== 'All') data = data.filter(t => t.status === statusFilter);
    return data;
  }, [transfers, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    return {
      pending: transfers.filter(t => t.status === 'Pending').length,
      completed: transfers.filter(t => t.status === 'Completed').length,
      totalUnitsMoved: transfers.filter(t => t.status === 'Completed').reduce((sum, t) => sum + t.qty, 0)
    };
  }, [transfers]);

  // 5. ACTION HANDLERS
  const handleItemLookup = (id) => {
    const item = masterItemsDB[id.toUpperCase()];
    if (item) {
      setForm({ ...form, itemId: id.toUpperCase(), itemName: item.name });
    } else {
      setForm({ ...form, itemId: id.toUpperCase(), itemName: '' });
    }
  };

  const handleSaveTransfer = () => {
    // Basic Form Validation
    if (!form.itemId || !form.fromBin || !form.toBin || !form.qty) {
      addToast(bahasa === 'en' ? "Please fill all required fields!" : "Harap isi semua kolom wajib!", 'warning');
      return;
    }

    const qtyNumber = parseInt(form.qty, 10);
    const targetBin = form.toBin.toUpperCase();

    // ══════════════════════════════════════════════════════════════
    // ZENTRYX SAFEGUARD SYSTEM (ERROR-PROOFING / POKA-YOKE)
    // ══════════════════════════════════════════════════════════════
    
    // SAFEGUARD 1: Logika Fisika Dasar
    if (form.fromBin === targetBin) {
      addToast('SYSTEM BLOCK: Lokasi asal dan tujuan tidak boleh sama.', 'error');
      return;
    }
    if (qtyNumber <= 0) {
      addToast('SYSTEM BLOCK: Kuantitas transfer minimal adalah 1 unit.', 'error');
      return;
    }
    if (qtyNumber > 50000) {
      addToast('SAFEGUARD TRIGGERED: Jumlah transfer melebihi kapasitas maksimal armada Forklift (Max 50.000 unit).', 'error');
      return;
    }

    // SAFEGUARD 2: Zone Compatibility (Baterai LFP = Bahaya Termal, Wajib Cold Storage)
    if (form.itemId === 'SKU-ARS-LFP01') {
      if (!targetBin.includes('ZONE-B') && !targetBin.includes('ASSY-LINE') && !targetBin.includes('QC-STAGING')) {
        addToast('SAFEGUARD TRIGGERED: Pelanggaran Standar Keamanan! Baterai LFP rentan panas dan HANYA diizinkan masuk ke area Cold Storage (ZONE-B) atau Line Perakitan.', 'error');
        return;
      }
    }

    // SAFEGUARD 3: Structural Load Limit (Sasis Baja = Sangat Berat)
    if (form.itemId === 'SKU-ARS-CHZ04') {
      if (!targetBin.includes('ZONE-C') && !targetBin.includes('ASSY-LINE') && !targetBin.includes('DOCK')) {
        addToast('SAFEGUARD TRIGGERED: Peringatan Ambruk! Sasis Baja sangat berat dan dilarang diletakkan di rak standar. Wajib di Heavy Rack (ZONE-C).', 'error');
        return;
      }
    }

    // ══════════════════════════════════════════════════════════════
    // Lolos Safeguard -> Eksekusi Task
    // ══════════════════════════════════════════════════════════════
    const newTransfer = {
      id: `TRF-ARS-${Math.floor(8000 + Math.random() * 1000)}`,
      date: new Date().toISOString().split('T')[0],
      itemId: form.itemId.toUpperCase(),
      itemName: form.itemName || 'Manual Item Entry',
      fromBin: form.fromBin,
      toBin: targetBin,
      qty: qtyNumber,
      reason: form.reason,
      status: 'Pending',
      user: 'Current User'
    };

    setTransfers([newTransfer, ...transfers]);
    setIsModalOpen(false);
    addToast('Internal relocation task created successfully. Passed all safety safeguards.', 'success');
    setForm({ itemId: '', itemName: '', fromBin: '', toBin: '', qty: '', reason: 'Pick Face Replenishment' });
  };

  const handleExecuteTransfer = (id) => {
    setTransfers(transfers.map(t => t.id === id ? { ...t, status: 'Completed' } : t));
    addToast(`Task ${id} executed. Inventory records successfully moved to target bin.`, 'success');
  };

  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 animate-fade-in">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>📦 Inventory</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Logistics</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide">
            {bahasa === 'en' ? 'Internal Bin Transfers' : 'Transfer Antar Lokasi (Rak)'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {bahasa === 'en' ? 'Create, monitor, and execute EV component movements across facility zones.' : 'Buat, pantau, dan eksekusi pergerakan komponen EV antar zona fasilitas pabrik.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 px-4 py-2 rounded-sm shadow-sm text-xs font-bold transition-colors">
            🖨 {bahasa === 'en' ? 'Print Pending Tasks' : 'Cetak Tugas Belum Selesai'}
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-4 py-2 rounded-sm shadow-sm text-sm font-bold transition-colors flex items-center gap-2"
          >
            <span>+</span> {bahasa === 'en' ? 'New Transfer Task' : 'Buat Tugas Transfer'}
          </button>
        </div>
      </div>

      {/* ── DASHBOARD STATS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="bg-white border border-gray-200 p-4 shadow-sm border-l-4 border-l-orange-500 flex justify-between items-center hover:shadow-md transition-shadow">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Tasks Pending Execution</p>
            <h3 className="text-2xl font-black text-orange-600">{stats.pending}</h3>
          </div>
          <div className="text-3xl opacity-20">🕒</div>
        </div>
        <div className="bg-white border border-gray-200 p-4 shadow-sm border-l-4 border-l-green-500 flex justify-between items-center hover:shadow-md transition-shadow">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Tasks Completed</p>
            <h3 className="text-2xl font-black text-green-600">{stats.completed}</h3>
          </div>
          <div className="text-3xl opacity-20">✅</div>
        </div>
        <div className="bg-white border border-gray-200 p-4 shadow-sm border-l-4 border-l-[#125ab2] flex justify-between items-center hover:shadow-md transition-shadow">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Total Units Relocated</p>
            <h3 className="text-2xl font-black text-[#125ab2]">{stats.totalUnitsMoved.toLocaleString('en-US')}</h3>
          </div>
          <div className="text-3xl opacity-20">📦</div>
        </div>
      </div>

      {/* ── SEARCH & FILTER ── */}
      <div className="bg-white border border-gray-300 shadow-sm p-3 mb-0 flex gap-2">
        <input 
          type="text"
          placeholder={bahasa === 'en' ? 'Search TRF ID, Item SKU, or Bin Location...' : 'Cari ID TRF, SKU, atau Lokasi Rak...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 border border-gray-300 px-3 py-1.5 text-xs outline-none focus:border-[#125ab2] transition-colors"
        />
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 px-3 py-1.5 text-xs font-bold outline-none bg-gray-50 text-gray-700 cursor-pointer"
        >
          <option value="All">All Status</option>
          <option value="Pending">Pending (Awaiting Move)</option>
          <option value="Completed">Completed (Moved)</option>
        </select>
      </div>

      {/* ── TABLE AREA ── */}
      <div className="bg-white border border-gray-300 shadow-sm w-full overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-[#e5e5e5] text-[#666666] text-[11px] border-b border-gray-300">
                <th className="py-3 px-4 font-bold w-28">TRF ID</th>
                <th className="py-3 px-4 font-bold w-48">COMPONENT DETAIL</th>
                <th className="py-3 px-4 font-bold text-center">ROUTING (ORIGIN ➔ TARGET)</th>
                <th className="py-3 px-4 font-bold w-20 text-center">QTY</th>
                <th className="py-3 px-4 font-bold w-32">REASON</th>
                <th className="py-3 px-4 font-bold w-28 text-center">STATUS</th>
                <th className="py-3 px-4 font-bold w-28 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="text-[12px] text-[#333333]">
              {filteredTransfers.length === 0 ? (
                <tr><td colSpan="7" className="py-10 text-center text-gray-400 italic font-bold">No transfer records found.</td></tr>
              ) : (
                filteredTransfers.map((t) => (
                  <tr key={t.id} className={`border-b border-gray-100 transition-colors ${t.status === 'Completed' ? 'bg-gray-50 opacity-70' : 'hover:bg-blue-50'}`}>
                    <td className="py-3 px-4">
                      <span onClick={() => setSelectedTrf(t)} className="text-[#125ab2] font-black cursor-pointer hover:underline" title="View Ticket">
                        {t.id}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span onClick={() => setSelectedItem(t)} className="text-purple-700 font-mono font-bold cursor-pointer hover:underline text-[12px]">
                        {t.itemId}
                      </span>
                      <p className="text-[10px] text-gray-500 font-semibold truncate w-48">{t.itemName}</p>
                    </td>
                    
                    {/* VISUAL ROUTING */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded font-mono font-bold text-[10px]">
                          {t.fromBin}
                        </span>
                        <span className="text-gray-400 font-black">➔</span>
                        <span className="bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded font-mono font-bold text-[10px]">
                          {t.toBin}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center font-black text-sm">{t.qty.toLocaleString('en-US')}</td>
                    <td className="py-3 px-4">
                      <span className="bg-gray-100 text-[9px] font-bold text-gray-600 uppercase tracking-wider px-2 py-1 rounded-sm">{t.reason}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-sm font-bold text-[10px] uppercase tracking-wider ${t.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700 animate-pulse'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {t.status === 'Pending' ? (
                        <button 
                          onClick={() => handleExecuteTransfer(t.id)} 
                          className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-3 py-1.5 rounded-sm shadow-sm text-[10px] font-bold uppercase tracking-wider transition-colors w-full"
                        >
                          Execute Move
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs italic font-bold uppercase tracking-wider">Done</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ MODAL 1: FORM INPUT TRANSFER (WITH SAFEGUARDS) ═══ */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-sm w-[550px] shadow-2xl overflow-hidden animate-fade-in">
            
            {/* Modal Header */}
            <div className="bg-[#415a77] text-white px-5 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm uppercase tracking-wider">Create Component Transfer Task</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-300 hover:text-white font-bold text-xl leading-none">✕</button>
            </div>
            
            <div className="p-6 flex flex-col gap-4 text-sm">
              
              {/* Safeguard Info Banner */}
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-sm flex items-start gap-3">
                <span className="text-xl">🛡️</span>
                <div>
                  <p className="font-bold text-[#125ab2] text-xs mb-0.5">Zentryx Active Safeguards Enabled</p>
                  <p className="text-[10px] text-blue-800 leading-tight">Sistem ini memvalidasi batas berat struktur rak dan persyaratan suhu zona (Zone Compatibility) secara *real-time* untuk mencegah kecelakaan operasional.</p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Component SKU to Move <span className="text-red-500">*</span></label>
                <input 
                  type="text" placeholder="e.g. SKU-ARS-LFP01" 
                  value={form.itemId} onChange={e => handleItemLookup(e.target.value)} 
                  className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] font-mono uppercase font-bold text-sm" 
                />
                <p className="text-[11px] text-[#125ab2] font-bold mt-1 ml-1">{form.itemName}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-red-700 uppercase tracking-wider mb-1">From Bin (Origin) <span className="text-red-500">*</span></label>
                  <select 
                    value={form.fromBin} 
                    onChange={e => setForm({...form, fromBin: e.target.value})} 
                    className="w-full border border-red-300 bg-red-50 px-3 py-2 outline-none focus:border-red-500 font-mono font-bold text-[11px] text-red-800 cursor-pointer" 
                  >
                    <option value="" disabled>Select Origin...</option>
                    {facilityLocations.map((loc) => (
                      <option key={`from-${loc.value}`} value={loc.value}>{loc.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-green-700 uppercase tracking-wider mb-1">To Bin (Target) <span className="text-red-500">*</span></label>
                  <select 
                    value={form.toBin} 
                    onChange={e => setForm({...form, toBin: e.target.value})} 
                    className="w-full border border-green-300 bg-green-50 px-3 py-2 outline-none focus:border-green-500 font-mono font-bold text-[11px] text-green-800 cursor-pointer" 
                  >
                    <option value="" disabled>Select Target...</option>
                    {facilityLocations.map((loc) => (
                      <option key={`to-${loc.value}`} value={loc.value}>{loc.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Transfer Reason</label>
                  <select 
                    value={form.reason} onChange={e => setForm({...form, reason: e.target.value})}
                    className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] bg-white text-xs font-bold cursor-pointer text-gray-700"
                  >
                    <option value="Pick Face Replenishment">Assembly Line Replenishment</option>
                    <option value="Space Consolidation">Space Consolidation</option>
                    <option value="Damage/Quarantine Isolation">Damage/Quarantine Isolation</option>
                    <option value="Putaway Routing">Putaway Routing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Quantity <span className="text-red-500">*</span></label>
                  <input 
                    type="number" min="1" placeholder="Units" 
                    value={form.qty} onChange={e => setForm({...form, qty: e.target.value})} 
                    className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] font-black text-lg text-[#125ab2] font-mono" 
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-2">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-bold uppercase tracking-wider transition-colors shadow-sm rounded-sm">Cancel</button>
              <button onClick={handleSaveTransfer} className="px-6 py-2 bg-[#125ab2] hover:bg-[#0e4487] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-colors rounded-sm flex items-center gap-2">
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL 2: TICKET DETAIL (DRILL-DOWN) ═══ */}
      {selectedTrf && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-sm w-[450px] shadow-2xl overflow-hidden animate-fade-in">
            <div className="bg-gray-100 border-b border-gray-300 px-5 py-4 flex justify-between items-center">
              <h3 className="font-bold text-[#4d5f79] text-sm uppercase tracking-wider">Transfer Ticket: {selectedTrf.id}</h3>
              <button onClick={() => setSelectedTrf(null)} className="text-gray-400 hover:text-gray-700 font-bold text-xl leading-none">✕</button>
            </div>
            
            <div className="p-6 text-sm">
              <div className="text-center mb-6">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Component to Relocate</p>
                <h4 className="text-xl font-black font-mono text-[#125ab2]">{selectedTrf.itemId}</h4>
                <p className="font-bold text-gray-700 mt-1">{selectedTrf.itemName}</p>
                <div className="mt-3 text-2xl font-black text-[#125ab2] bg-blue-50 border border-blue-100 inline-block px-5 py-1.5 rounded-sm">
                  {selectedTrf.qty.toLocaleString('en-US')} <span className="text-xs font-bold text-blue-800 uppercase tracking-widest">Units</span>
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-50 border border-gray-200 p-4 rounded-sm mb-6">
                <div className="text-center">
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1">Pull From Origin</p>
                  <p className="font-mono text-lg font-bold text-red-700 bg-red-50 border border-red-100 px-3 py-1 rounded">{selectedTrf.fromBin}</p>
                </div>
                <div className="text-3xl text-gray-300">➔</div>
                <div className="text-center">
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1">Place To Target</p>
                  <p className="font-mono text-lg font-bold text-green-700 bg-green-50 border border-green-100 px-3 py-1 rounded">{selectedTrf.toBin}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-4 mb-2">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Requested By</p>
                  <p className="font-semibold text-gray-800">{selectedTrf.user}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Reason</p>
                  <p className="font-bold text-gray-800 text-xs bg-gray-100 px-2 py-1 rounded-sm inline-block">{selectedTrf.reason}</p>
                </div>
                <div className="col-span-2 border-t border-gray-100 pt-3 flex justify-between items-center mt-2">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Execution Status</p>
                  <span className={`px-3 py-1.5 rounded-sm font-black text-[10px] uppercase tracking-wider border ${selectedTrf.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
                    {selectedTrf.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
              <button onClick={() => setSelectedTrf(null)} className="w-full bg-gray-200 py-2.5 font-bold text-xs text-gray-700 uppercase tracking-wider hover:bg-gray-300 transition-colors rounded-sm shadow-sm">Tutup Tiket</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL 3: ITEM SNAPSHOT ═══ */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-sm w-[350px] shadow-2xl p-6 text-sm text-center border-t-4 border-[#125ab2] animate-fade-in">
            <h3 className="font-bold text-gray-400 mb-1 uppercase tracking-widest text-[10px]">Component Master Record</h3>
            <p className="font-black font-mono text-2xl text-[#125ab2] mb-1">{selectedItem.itemId}</p>
            <p className="font-bold text-gray-800 mb-4">{selectedItem.itemName}</p>
            
            <div className="bg-blue-50 p-4 rounded-sm border border-blue-100 mb-6 text-left">
              <p className="text-[#125ab2] text-xs font-semibold leading-relaxed text-center">
                Snapshot API active.<br/>Connected to Zentryx Core.
              </p>
            </div>
            <button onClick={() => setSelectedItem(null)} className="w-full bg-gray-200 hover:bg-gray-300 transition-colors py-2.5 font-black text-[10px] text-gray-700 rounded-sm uppercase tracking-widest shadow-sm">
              Tutup Profil
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default BinTransfers;