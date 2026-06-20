import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from './AppContext';

// ─── TOAST COMPONENT (Aman dari Bug Klik/Pointer Events) ─────────────────────
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
    {toasts.map(({ id, message, type }) => (
      <div key={id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-sm shadow-xl text-white text-xs font-semibold min-w-[280px] border-l-4 ${
        type === 'success' ? 'bg-emerald-600 border-emerald-800' : 
        type === 'error' ? 'bg-red-600 border-red-800' : 
        type === 'warning' ? 'bg-amber-500 border-amber-800' : 'bg-[#125ab2] border-blue-800'
      }`}>
        <span className="text-base">{type === 'success' ? '✓' : type === 'error' ? '🚨' : type === 'warning' ? '⚠️' : 'ℹ'}</span>
        <span className="flex-1">{message}</span>
        <button onClick={() => removeToast(id)} className="opacity-70 hover:opacity-100 text-lg leading-none">×</button>
      </div>
    ))}
  </div>
);

const EngineeringMRO = () => {
  // ─── 🚀 INJEKSI: Mengambil setInventoryData dari AppContext ───
  const { bahasa, setInventoryData } = useContext(AppContext);

  // 1. DATA MASTER SPARE PARTS (ARUS MOTORS EV MRO)
  const initialParts = [
    { sku: 'MRO-ROB-001', name: 'Yaskawa Welding Arm Servo Motor', category: 'Robotics', stock: 12, minStock: 5, bin: 'ENG-A1', unit: 'Unit' },
    { id: 'MRO-HVC-042', sku: 'MRO-HVC-042', name: 'Daikin Thermal Coolant Pump', category: 'HVAC & Climate', stock: 2, minStock: 4, bin: 'ENG-B2', unit: 'Unit' },
    { id: 'MRO-FLUID-11', sku: 'MRO-FLUID-11', name: 'Dielectric Transmission Fluid', category: 'Consumables', stock: 45, minStock: 20, bin: 'ENG-C1', unit: 'Gallon' },
    { id: 'MRO-AGV-009', sku: 'MRO-AGV-009', name: 'LiDAR Sensor for KUKA AGV', category: 'Automation', stock: 0, minStock: 5, bin: 'ENG-A3', unit: 'Pcs' },
    { id: 'MRO-MECH-088', sku: 'MRO-MECH-088', name: 'Heavy Duty Conveyor Drive Belt', category: 'Mechanical', stock: 8, minStock: 10, bin: 'ENG-A2', unit: 'Roll' },
  ];

  const [parts, setParts] = useState(() => {
    try {
      const saved = window.localStorage.getItem('mroInventory_ARUS');
      return saved ? JSON.parse(saved) : initialParts;
    } catch {
      return initialParts;
    }
  });

  // 2. DATA RIWAYAT PENGGUNAAN (LEDGER)
  const initialHistory = [
    { id: 'TX-ARS-001', date: new Date().toISOString().split('T')[0] + ' 08:30', sku: 'MRO-FLUID-11', action: 'Check-Out', qty: 5, ref: 'WO-MAINT-102', user: 'Engineer Budi' },
    { id: 'TX-ARS-002', date: new Date(Date.now() - 86400000).toISOString().split('T')[0] + ' 14:00', sku: 'MRO-ROB-001', action: 'Restock', qty: 10, ref: 'PO-MRO-992', user: 'Admin Warehouse' },
  ];

  const [history, setHistory] = useState(() => {
    try {
      const saved = window.localStorage.getItem('mroHistory_ARUS');
      return saved ? JSON.parse(saved) : initialHistory;
    } catch {
      return initialHistory;
    }
  });

  // ─── PEMBERSIH DATA LAMA ───
  useEffect(() => {
    const hasOldData = parts.some(p => p.sku.includes('SP-MECH') || p.name.includes('Forklift Starter'));
    if (hasOldData) {
      setParts(initialParts);
      setHistory(initialHistory);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.localStorage.setItem('mroInventory_ARUS', JSON.stringify(parts));
    window.localStorage.setItem('mroHistory_ARUS', JSON.stringify(history));
  }, [parts, history]);

  // 3. STATE INTERAKTIF
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [toasts, setToasts] = useState([]);
  
  // State Modals
  const [actionModal, setActionModal] = useState({ isOpen: false, type: '', part: null }); // type: 'OUT' or 'IN'
  const [detailModal, setDetailModal] = useState({ isOpen: false, part: null });
  const [txForm, setTxForm] = useState({ qty: 1, ref: '', user: '' });

  // 4. FUNGSI TOAST
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // 5. ENGINE STATUS STOK DENGAN PERINGATAN KRITIKAL
  const processedParts = useMemo(() => {
    return parts.map(p => {
      let status = 'Optimal';
      if (p.stock === 0) status = 'Out of Stock (CRITICAL)';
      else if (p.stock <= p.minStock) status = 'Low Stock (Warning)';
      return { ...p, status };
    });
  }, [parts]);

  // 6. 🚀 ENGINE INTERLOCK: FUNGSI TRANSAKSI DENGAN SYNC GLOBAL INVENTORY
  const handleTransaction = (e) => {
    e.preventDefault();
    const { type, part } = actionModal;
    const qty = parseInt(txForm.qty);

    if (type === 'OUT' && qty > part.stock) {
      addToast(`Inventory Safeguard: Insufficient stock! Only ${part.stock} available.`, 'error');
      return;
    }

    if (!txForm.ref || !txForm.user) {
      addToast('Reference ID and User Name are required for auditing.', 'error');
      return;
    }

    // Update Stock Lokal MRO
    setParts(parts.map(p => 
      p.sku === part.sku 
        ? { ...p, stock: type === 'OUT' ? p.stock - qty : p.stock + qty } 
        : p
    ));

    // 💥 TRIGGER INJEKSI: Update Stock di Global InventoryOverview secara sinkron
    if (setInventoryData) {
      setInventoryData(prevInv => {
        let newInv = [...prevInv];
        const existingItemIndex = newInv.findIndex(i => i.sku === part.sku);
        
        if (existingItemIndex >= 0) {
          if (type === 'IN') { // Restock
            newInv[existingItemIndex].qty += qty;
          } else { // Check-out
            newInv[existingItemIndex].qty = Math.max(0, newInv[existingItemIndex].qty - qty);
          }
        } else if (type === 'IN') {
          // Jika item MRO belum ada di Master Inventory, daftarkan secara otomatis
          newInv.push({
            sku: part.sku,
            name: part.name,
            qty: qty,
            price: 50, // Estimasi harga MRO standar
            category: 'Consumables',
            location: part.bin
          });
        }
        return newInv;
      });
    }

    // Log History MRO
    const nextNum = history.length > 0 ? Math.max(...history.map(h => parseInt(h.id.split('-')[2]) || 0)) + 1 : 1;
    const newTx = {
      id: `TX-ARS-${nextNum.toString().padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0] + ' ' + new Date().toLocaleTimeString('en-GB', { hour12: false }).slice(0, 5),
      sku: part.sku,
      action: type === 'OUT' ? 'Check-Out' : 'Restock',
      qty: qty,
      ref: txForm.ref.toUpperCase(),
      user: txForm.user
    };
    setHistory([newTx, ...history]);

    setActionModal({ isOpen: false, type: '', part: null });
    setTxForm({ qty: 1, ref: '', user: '' });
    addToast(type === 'OUT' ? `Successfully issued ${qty} ${part.unit} of ${part.sku} to ${txForm.user}. Synced to Master DB.` : `Successfully restocked ${qty} ${part.unit} of ${part.sku}. Synced to Master DB.`, 'success');
  };

  // 7. FUNGSI EXPORT MRO REPORT (POWER BI READY)
  const handleExportCSV = () => {
    addToast('Generating Engineering MRO Telemetry...', 'info');
    const headers = ['SKU_ID', 'Part_Name', 'Category', 'Bin_Location', 'Current_Stock', 'Min_Stock_Threshold', 'UOM', 'System_Status'];
    const csvRows = [headers.join(',')];
    
    processedParts.forEach(p => {
      const row = [p.sku, `"${p.name}"`, `"${p.category}"`, p.bin, p.stock, p.minStock, p.unit, `"${p.status}"`];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `ARUS_MRO_Inventory_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => addToast('MRO Telemetry exported successfully!', 'success'), 800);
  };

  // 8. FILTER ENGINE
  const filteredData = processedParts.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'ALL' ? true : item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Helper untuk mendapatkan riwayat spesifik sebuah part
  const getPartHistory = (sku) => history.filter(h => h.sku === sku);

  // Global Metrics
  const criticalOutCount = processedParts.filter(p => p.stock === 0).length;
  const warningLowCount = processedParts.filter(p => p.stock > 0 && p.stock <= p.minStock).length;

  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 animate-fade-in">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>⚙️ Engineering</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Facilities</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide">
            {bahasa === 'en' ? 'MRO & Spare Parts Inventory' : 'Inventaris Suku Cadang MRO'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">Manage critical spare parts, consumables, and automated engineering assets.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button onClick={handleExportCSV} className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-5 py-2.5 rounded-sm text-xs font-bold transition-colors shadow-sm uppercase tracking-wider flex items-center justify-center gap-2 w-full md:w-auto">
            <span>⭳</span> Export MRO Stock
          </button>
        </div>
      </div>

      {/* ── METRICS SUMMARY ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
        <div className="bg-white p-5 border border-gray-200 shadow-sm rounded-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Total Registered Parts</p>
          <p className="text-3xl font-black text-gray-900 mt-1 font-mono">{parts.length}</p>
          <p className="text-[9px] text-gray-400 mt-2 font-bold uppercase tracking-wider">SKUs Tracked</p>
        </div>
        <div className="bg-white p-5 border-l-4 border-l-emerald-500 border border-y-gray-200 border-r-gray-200 shadow-sm rounded-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Optimal / Healthy Stock</p>
          <p className="text-3xl font-black text-gray-800 mt-1">{processedParts.filter(p => p.status === 'Optimal').length}</p>
          <p className="text-[9px] text-emerald-600 mt-2 font-bold uppercase tracking-wider">Adequate Levels</p>
        </div>
        <div className="bg-white p-5 border-l-4 border-l-amber-500 border border-y-gray-200 border-r-gray-200 shadow-sm rounded-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">Low Stock Warning</p>
          <p className="text-3xl font-black text-gray-800 mt-1">{warningLowCount}</p>
          <p className="text-[9px] text-amber-600 mt-2 font-bold uppercase tracking-wider">Approaching Min Threshold</p>
        </div>
        <div className="bg-white p-5 border-l-4 border-l-red-600 border border-y-gray-200 border-r-gray-200 shadow-sm rounded-sm relative overflow-hidden hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-red-600 tracking-wider">Out of Stock</p>
          <p className="text-3xl font-black text-red-700 mt-1">
            {criticalOutCount}
          </p>
          <p className="text-[9px] text-red-500 mt-2 font-bold uppercase tracking-wider flex items-center gap-1">
            {criticalOutCount > 0 ? <span className="animate-pulse">🚨 Restock Action Required</span> : 'All Good'}
          </p>
        </div>
      </div>

      {/* ── TOOLBAR (SEARCH & FILTER) ── */}
      <div className="bg-white p-3 border border-gray-300 shadow-sm rounded-sm mb-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {['ALL', 'Robotics', 'Mechanical', 'HVAC & Climate', 'Automation', 'Consumables'].map(cat => (
            <button 
              key={cat} 
              onClick={() => setFilterCategory(cat)} 
              className={`px-4 py-1.5 text-xs font-bold uppercase rounded-sm border transition-colors shadow-sm ${filterCategory === cat ? 'bg-[#415a77] text-white border-[#415a77]' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-300'}`}
            >
              {cat}
            </button>
          ))}
        </div>
        <input 
          type="text" 
          placeholder="Search Part Name or SKU ID..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 px-4 py-1.5 rounded-sm text-sm outline-none focus:border-[#125ab2] w-full sm:w-80 transition-colors"
        />
      </div>

      {/* ── TABEL INVENTARIS MRO ── */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden flex flex-col">
        <div className="bg-slate-50 border-b border-gray-200 p-3 flex justify-between items-center">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-2">MRO Parts Ledger</h3>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
            <thead className="bg-[#f8f9fa] text-[#64748b] text-[10px] uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3 px-5 font-bold border-b w-32">PART SKU</th>
                <th className="py-3 px-5 font-bold border-b w-64">PART DESCRIPTION</th>
                <th className="py-3 px-5 font-bold border-b text-center">BIN LOC.</th>
                <th className="py-3 px-5 font-bold border-b text-center w-36">CURRENT STOCK</th>
                <th className="py-3 px-5 font-bold border-b text-center w-40">SYSTEM STATUS</th>
                <th className="py-3 px-5 font-bold border-b text-center w-48">INVENTORY ACTIONS</th>
              </tr>
            </thead>
            <tbody className="text-[12px] text-gray-700">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-500 font-bold italic">
                    <span className="text-3xl block mb-2 opacity-50">🛡️</span>
                    No spare parts match your query.
                  </td>
                </tr>
              ) : (
                filteredData.map((part, idx) => (
                  <tr key={idx} className={`border-b border-gray-100 transition-colors ${part.status.includes('CRITICAL') ? 'bg-red-50/50 hover:bg-red-50' : part.status.includes('Warning') ? 'bg-amber-50/40 hover:bg-amber-50' : 'hover:bg-blue-50/40'}`}>
                    <td className="py-4 px-5">
                      {/* SKU CLICKABLE UNTUK MELIHAT RIWAYAT */}
                      <div 
                        className="font-mono font-black text-[#125ab2] cursor-pointer hover:underline text-[13px] flex items-center gap-1.5"
                        onClick={() => setDetailModal({ isOpen: true, part: part })}
                        title="View MRO Transaction Ledger"
                      >
                        <span className="text-base">📋</span> {part.sku}
                      </div>
                      <div className="text-[9px] uppercase font-bold text-gray-500 mt-1 tracking-wider">{part.category}</div>
                    </td>
                    <td className="py-4 px-5 font-bold text-gray-800 text-[13px]">{part.name}</td>
                    <td className="py-4 px-5 text-center font-mono font-bold text-[#125ab2]">{part.bin}</td>
                    <td className="py-4 px-5 text-center">
                      <div className={`font-black text-xl leading-none ${part.stock === 0 ? 'text-red-600' : part.stock <= part.minStock ? 'text-amber-600' : 'text-gray-900'}`}>{part.stock}</div>
                      <div className="text-[9px] font-bold text-gray-400 uppercase mt-1 tracking-wider">Min: {part.minStock} {part.unit}</div>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className={`px-2 py-1 rounded-sm text-[9px] font-black uppercase tracking-wider border shadow-sm ${
                        part.status === 'Optimal' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                        part.status.includes('Warning') ? 'bg-amber-100 text-amber-800 border-amber-300' : 
                        'bg-red-600 text-white border-red-700 animate-pulse'
                      }`}>
                        {part.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <div className="flex gap-2 justify-center">
                        <button 
                          onClick={() => setActionModal({ isOpen: true, type: 'OUT', part: part })} 
                          className="bg-gray-800 text-white px-3 py-2 rounded-sm font-bold text-[10px] uppercase shadow-sm hover:bg-black w-1/2 transition-colors"
                        >
                          Check-Out
                        </button>
                        {part.stock === 0 ? (
                          <button 
                            onClick={() => setActionModal({ isOpen: true, type: 'IN', part: part })} 
                            className="bg-red-600 text-white px-3 py-2 rounded-sm font-bold text-[10px] uppercase shadow-sm hover:bg-red-700 w-1/2 transition-colors animate-pulse border border-red-800"
                          >
                            EMERG. RESTOCK
                          </button>
                        ) : (
                          <button 
                            onClick={() => setActionModal({ isOpen: true, type: 'IN', part: part })} 
                            className="bg-[#125ab2] text-white px-3 py-2 rounded-sm font-bold text-[10px] uppercase shadow-sm hover:bg-[#0e4487] w-1/2 transition-colors"
                          >
                            Restock
                          </button>
                        )}
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
      {/* 🛡️ MODAL TRANSAKSI (IN/OUT) DENGAN BULLETPROOF FLEXBOX                    */}
      {/* ========================================================================= */}
      {actionModal.isOpen && actionModal.part && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
          <div className={`bg-white rounded-sm w-full max-w-[450px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 ${actionModal.type === 'OUT' ? 'border-t-gray-800' : 'border-t-[#125ab2]'}`} style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            <div className={`${actionModal.type === 'OUT' ? 'bg-gray-50 border-b border-gray-200' : 'bg-blue-50 border-b border-blue-100'} px-6 py-4 flex justify-between items-center shrink-0 z-10`}>
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${actionModal.type === 'OUT' ? 'text-gray-500' : 'text-[#125ab2]'}`}>Inventory Movement</p>
                <h3 className={`font-black text-sm uppercase tracking-wider ${actionModal.type === 'OUT' ? 'text-gray-800' : 'text-[#125ab2]'}`}>
                  {actionModal.type === 'OUT' ? 'Issue Part (Check-Out)' : 'Receive Part (Restock)'}
                </h3>
              </div>
              <button onClick={() => setActionModal({ isOpen: false, type: '', part: null })} className="text-gray-400 hover:text-gray-800 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <form onSubmit={handleTransaction} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 text-sm flex flex-col gap-4">
                
                <div className="bg-white border border-gray-200 p-4 rounded-sm mb-2 shadow-sm text-center">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Selected Component</p>
                  <p className="font-black text-lg text-gray-900 leading-tight mb-1">{actionModal.part.name}</p>
                  <p className="font-mono font-bold text-[#125ab2] bg-blue-50 inline-block px-2 py-0.5 rounded border border-blue-100 text-xs">{actionModal.part.sku}</p>
                  
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Current Floor Stock</p>
                    <p className={`text-2xl font-black font-mono ${actionModal.part.stock === 0 ? 'text-red-600' : 'text-gray-800'}`}>
                      {actionModal.part.stock} <span className="text-[10px] uppercase font-bold text-gray-400">{actionModal.part.unit}</span>
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Action Quantity <span className="text-red-500">*</span></label>
                  <input type="number" min="1" value={txForm.qty} onChange={e => setTxForm({...txForm, qty: e.target.value})} className="w-full border border-gray-300 px-3 py-3 outline-none focus:border-[#125ab2] font-black text-center text-lg rounded-sm" required autoFocus/>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    {actionModal.type === 'OUT' ? 'Asset ID / Work Order Ref' : 'PO / Supplier Ref'} <span className="text-red-500">*</span>
                  </label>
                  <input type="text" placeholder={actionModal.type === 'OUT' ? 'e.g. WO-MAINT-102' : 'e.g. PO-MRO-001'} value={txForm.ref} onChange={e => setTxForm({...txForm, ref: e.target.value})} className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] font-bold uppercase rounded-sm" required/>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    {actionModal.type === 'OUT' ? 'Technician Name' : 'Received By'} <span className="text-red-500">*</span>
                  </label>
                  <input type="text" placeholder="Full Name" value={txForm.user} onChange={e => setTxForm({...txForm, user: e.target.value})} className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] font-semibold rounded-sm" required/>
                </div>
              </div>

              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 shrink-0 z-10">
                <button type="button" onClick={() => setActionModal({ isOpen: false, type: '', part: null })} className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm rounded-sm">Cancel</button>
                <button type="submit" className={`px-6 py-2.5 text-white font-bold shadow-sm transition-colors text-[10px] uppercase tracking-wider rounded-sm ${actionModal.type === 'OUT' ? 'bg-gray-800 hover:bg-black' : 'bg-[#125ab2] hover:bg-[#0e4487]'}`}>
                  Confirm {actionModal.type === 'OUT' ? 'Check-Out' : 'Restock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ MODAL DETAIL & RIWAYAT LEDGER (BULLETPROOF FLEXBOX)                    */}
      {/* ========================================================================= */}
      {detailModal.isOpen && detailModal.part && (() => {
        const p = detailModal.part;
        const partHistory = getPartHistory(p.sku);

        return (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
            <div className="bg-white rounded-sm w-full max-w-[550px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-[#125ab2]" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
              
              <div className="bg-blue-50 border-b border-blue-100 px-6 py-4 flex justify-between items-start shrink-0 z-10">
                <div>
                  <h3 className="font-black text-xl text-[#125ab2] font-mono leading-none">{p.sku}</h3>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1.5">Component Master Ledger</p>
                </div>
                <div className="text-right">
                  <div className={`font-black text-3xl font-mono leading-none ${p.stock === 0 ? 'text-red-600' : 'text-gray-900'}`}>{p.stock}</div>
                  <div className="text-[9px] font-bold text-gray-400 uppercase mt-1 tracking-wider">Current Stock ({p.unit})</div>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 text-sm text-gray-800 space-y-6">
                
                <div className="bg-white border border-gray-200 p-4 rounded-sm shadow-sm space-y-3">
                  <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Part Name</p>
                    <p className="col-span-1 font-black text-gray-900 border-b border-gray-100 pb-1">{p.name}</p>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Category</p>
                    <p className="col-span-1 font-bold text-gray-800 border-b border-gray-100 pb-1">{p.category}</p>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Bin Location</p>
                    <p className="col-span-1 font-mono font-bold text-[#125ab2] border-b border-gray-100 pb-1">{p.bin}</p>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">System Status</p>
                    <span className={`px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-wider border w-max shadow-sm ${
                        p.status === 'Optimal' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                        p.status.includes('Warning') ? 'bg-amber-100 text-amber-800 border-amber-300' : 
                        'bg-red-600 text-white border-red-700 animate-pulse'
                      }`}>
                      {p.status}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 border-b border-gray-200 pb-2">Transaction History Ledger</p>
                  <div className="space-y-3">
                    {partHistory.length === 0 ? (
                      <p className="text-xs text-gray-400 font-medium italic text-center py-6 bg-gray-50 border border-gray-200 rounded-sm">No transactions recorded for this component yet.</p>
                    ) : (
                      partHistory.map(tx => (
                        <div key={tx.id} className="bg-white border border-gray-200 p-4 rounded-sm flex justify-between items-center shadow-sm">
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-sm tracking-wider border ${tx.action === 'Check-Out' ? 'bg-gray-800 text-white border-black' : 'bg-[#125ab2] text-white border-[#0e4487]'}`}>
                                {tx.action}
                              </span>
                              <span className="text-[10px] font-bold text-gray-500">{tx.date}</span>
                            </div>
                            <p className="text-xs font-bold text-gray-900 border-b border-gray-100 pb-1 mb-1 w-max">Ref: <span className="font-mono text-[#125ab2]">{tx.ref}</span></p>
                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">By: {tx.user}</p>
                          </div>
                          <div className={`font-black font-mono text-xl ${tx.action === 'Check-Out' ? 'text-gray-800' : 'text-[#125ab2]'}`}>
                            {tx.action === 'Check-Out' ? '-' : '+'}{tx.qty}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              <div className="bg-gray-100 border-t border-gray-300 px-6 py-4 shrink-0 z-10">
                <button 
                  onClick={() => setDetailModal({ isOpen: false, part: null })} 
                  className="w-full bg-gray-800 hover:bg-black text-white py-3 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-colors shadow-sm"
                >
                  Close Ledger Profile
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </main>
  );
};

export default EngineeringMRO;