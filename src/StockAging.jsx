import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from './AppContext';

// ─── TOAST COMPONENT (Aman dari Bug Klik/Pointer Events) ─────────────────────
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
    {toasts.map(({ id, message, type }) => (
      <div key={id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-sm shadow-xl text-white text-xs font-semibold min-w-[280px] border-l-4 ${
        type === 'success' ? 'bg-emerald-600 border-emerald-800' : type === 'error' ? 'bg-red-600 border-red-800' : 'bg-orange-500 border-orange-700'
      }`}>
        <span className="text-base">{type === 'success' ? '✓' : type === 'error' ? '🚨' : '⚠'}</span>
        <span className="flex-1">{message}</span>
        <button onClick={() => removeToast(id)} className="opacity-70 hover:opacity-100 text-lg leading-none">×</button>
      </div>
    ))}
  </div>
);

const StockAging = () => {
  const { bahasa } = useContext(AppContext);

  // Helper untuk generate tanggal dinamis agar simulasi selalu relevan
  const getDynamicDate = (daysToAdd) => {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    return d.toISOString().split('T')[0];
  };

  // 1. DATA MASTER BATCH & EXPIRY (ARUS MOTORS EV COMPONENTS)
  const initialAgingData = [
    { sku: 'SKU-ARS-LFP01', name: 'Blade Battery Cell 3.2V (Degradation Risk)', batch: 'LOT-BAT-0881', stock: 450, unit: 'Pcs', unitCost: 250.00, expiryDate: getDynamicDate(-2), bin: 'ZONE-B-01', status: 'Active' },
    { sku: 'SKU-ARS-CLT99', name: 'Thermal Management Coolant 20L', batch: 'LOT-CHM-1102', stock: 80, unit: 'Drums', unitCost: 45.00, expiryDate: getDynamicDate(4), bin: 'ZONE-B-02', status: 'Active' },
    { sku: 'SKU-ARS-MCU03', name: 'Motor Control Unit (Warranty Limit)', batch: 'LOT-ELC-3305', stock: 15, unit: 'Units', unitCost: 850.00, expiryDate: getDynamicDate(10), bin: 'ZONE-A-05', status: 'Active' },
    { sku: 'SKU-ARS-LFP01', name: 'Blade Battery Cell 3.2V 150Ah', batch: 'LOT-BAT-0890', stock: 1200, unit: 'Pcs', unitCost: 250.00, expiryDate: getDynamicDate(45), bin: 'ZONE-B-01', status: 'Active' },
    { sku: 'SKU-ARS-SNT01', name: 'ADAS Telemetry Sensor Kit', batch: 'LOT-ELC-3390', stock: 200, unit: 'Sets', unitCost: 450.00, expiryDate: getDynamicDate(120), bin: 'ZONE-A-05', status: 'Active' },
  ];

  const [agingData, setAgingData] = useState(() => {
    try {
      const saved = window.localStorage.getItem('agingData_ARUS_Motors');
      return saved ? JSON.parse(saved) : initialAgingData;
    } catch {
      return initialAgingData;
    }
  });

  // ─── ALGORITMA PEMBERSIH DATA LAMA (PIZZA) ───
  useEffect(() => {
    const hasOldData = agingData.some(item => 
      item.sku.includes('PIZ-') || item.sku.includes('CHE-') || item.name.toLowerCase().includes('pizza')
    );
    if (hasOldData) {
      setAgingData(initialAgingData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('agingData_ARUS_Motors', JSON.stringify(agingData));
    } catch (error) {
      console.error('Failed to save aging data:', error);
    }
  }, [agingData]);

  // 2. STATE INTERAKTIF
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('ALL'); 
  const [toasts, setToasts] = useState([]);
  const [actionModal, setActionModal] = useState({ isOpen: false, item: null, actionType: '' });
  const [skuModal, setSkuModal] = useState({ isOpen: false, item: null });

  // 3. FUNGSI TOAST
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // 4. ENGINE PERHITUNGAN KEDALUWARSA & ANALITIK
  const processedData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalValueAtRisk = 0;
    let expiredCount = 0;

    const dataWithStatus = agingData.map(item => {
      const expDate = new Date(item.expiryDate);
      const diffTime = expDate - today;
      const daysToExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let condition = 'SAFE';
      if (daysToExpiry < 0) {
        condition = 'EXPIRED';
        expiredCount++;
        if(item.status === 'Active') totalValueAtRisk += (item.stock * item.unitCost);
      } else if (daysToExpiry <= 7) {
        condition = 'CRITICAL';
        if(item.status === 'Active') totalValueAtRisk += (item.stock * item.unitCost);
      } else if (daysToExpiry <= 14) {
        condition = 'WARNING';
      }

      return { ...item, daysToExpiry, condition };
    });
    
    return { dataWithStatus, totalValueAtRisk, expiredCount };
  }, [agingData]);

  // 5. EXPORT CSV
  const handleExportCSV = () => {
    addToast(bahasa === 'en' ? 'Generating Aging Report...' : 'Menyiapkan Laporan Aging...', 'info');
    const headers = ['SKU ID', 'Item Name', 'Batch/Lot', 'Shelf Life Limit', 'Days Remaining', 'Stock', 'UOM', 'Total Value (USD)', 'Condition', 'System Status'];
    const csvRows = [headers.join(',')];
    
    processedData.dataWithStatus.forEach(item => {
      const row = [item.sku, `"${item.name}"`, item.batch, item.expiryDate, item.daysToExpiry, item.stock, item.unit, (item.stock * item.unitCost), item.condition, item.status];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `ARUS_ShelfLife_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => addToast('Export completed!', 'success'), 500);
  };

  // 6. FUNGSI AKSI (KARANTINA / RMA)
  const openActionModal = (item, type) => {
    setActionModal({ isOpen: true, item, actionType: type });
  };

  const submitAction = (e) => {
    e.preventDefault();
    const { item, actionType } = actionModal;
    
    setAgingData(agingData.map(data => 
      data.batch === item.batch ? { ...data, status: actionType === 'QUARANTINE' ? 'Quarantined' : 'RMA Claimed' } : data
    ));
    
    addToast(
      actionType === 'QUARANTINE' 
        ? `Batch ${item.batch} has been securely moved to Quarantine zone.` 
        : `Batch ${item.batch} marked for RMA Warranty Claim.`, 
      actionType === 'QUARANTINE' ? 'error' : 'success'
    );
      
    setActionModal({ isOpen: false, item: null, actionType: '' });
  };

  // 7. FILTERING DATA TABEL
  const filteredData = processedData.dataWithStatus.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.batch.toLowerCase().includes(searchTerm.toLowerCase()) || item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = 
      filterMode === 'ALL' ? true :
      filterMode === 'EXPIRED' ? item.condition === 'EXPIRED' :
      filterMode === 'CRITICAL' ? item.condition === 'CRITICAL' || item.condition === 'WARNING' :
      item.condition === 'SAFE';
    
    return matchesSearch && matchesFilter;
  });

  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 animate-fade-in">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>📊 Analytics</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Compliance</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide">
            {bahasa === 'en' ? 'Component Shelf-Life & Aging Tracker' : 'Pelacakan Umur Komponen & Degradasi'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {bahasa === 'en' ? 'Monitor FEFO compliances, battery degradation limits, and value at risk.' : 'Pantau kepatuhan FEFO, batas degradasi baterai, dan nilai aset yang berisiko.'}
          </p>
        </div>
        <button onClick={handleExportCSV} className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-5 py-2.5 rounded-sm text-xs font-bold transition-colors shadow-sm flex items-center gap-2 uppercase tracking-wider">
          <span>⭳</span> {bahasa === 'en' ? 'Export Compliance Log' : 'Ekspor Log Kepatuhan'}
        </button>
      </div>

      {/* ── METRICS SUMMARY ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        <div className="bg-white p-5 border border-gray-200 shadow-sm rounded-sm relative overflow-hidden border-l-4 border-l-red-600 hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-2 h-full bg-red-600"></div>
          <p className="text-[10px] uppercase font-bold text-red-600 tracking-wider">Total Asset Value at Risk</p>
          <p className="text-2xl font-black text-gray-900 mt-1 font-mono">${processedData.totalValueAtRisk.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="text-[10px] font-semibold text-gray-500 mt-1">Capital tied in expired/critical component batches</p>
        </div>
        <div className="bg-white p-5 border border-gray-200 shadow-sm rounded-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Degraded/Expired Batches</p>
          <p className="text-2xl font-black text-red-600 mt-1">{processedData.expiredCount} <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Lots</span></p>
          <p className="text-[10px] font-semibold text-gray-500 mt-1">Requires immediate quarantine or RMA process</p>
        </div>
        <div className="bg-white p-5 border border-gray-200 shadow-sm rounded-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Active Tracked Batches</p>
          <p className="text-2xl font-black text-[#125ab2] mt-1">{agingData.length} <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Lots</span></p>
          <p className="text-[10px] font-semibold text-gray-500 mt-1">Under strict FEFO monitoring protocol</p>
        </div>
      </div>

      {/* ── TOOLBAR (SEARCH & FILTER) ── */}
      <div className="bg-white p-3 border border-gray-300 shadow-sm rounded-sm mb-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button onClick={() => setFilterMode('ALL')} className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm border transition-colors ${filterMode === 'ALL' ? 'bg-[#415a77] text-white border-[#415a77]' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>All Batches</button>
          <button onClick={() => setFilterMode('EXPIRED')} className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm border transition-colors ${filterMode === 'EXPIRED' ? 'bg-red-600 text-white border-red-600' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}>Degraded / Expired</button>
          <button onClick={() => setFilterMode('CRITICAL')} className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm border transition-colors ${filterMode === 'CRITICAL' ? 'bg-amber-500 text-white border-amber-500' : 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'}`}>Critical & Warning</button>
          <button onClick={() => setFilterMode('SAFE')} className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm border transition-colors ${filterMode === 'SAFE' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`}>Optimal / Safe</button>
        </div>
        <input type="text" placeholder="Search SKU, Component Name, or Batch Lot..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="border border-gray-300 px-4 py-1.5 rounded-sm text-xs outline-none focus:border-[#125ab2] w-full sm:w-80 transition-colors" />
      </div>

      {/* ── TABEL DATA AGING ── */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-[#e5e5e5] text-[#666666] text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4 font-bold border-b border-gray-300 w-32">SKU ID</th>
                <th className="py-3 px-4 font-bold border-b border-gray-300">COMPONENT DESCRIPTION</th>
                <th className="py-3 px-4 font-bold border-b border-gray-300 w-36">BATCH / LOT ID</th>
                <th className="py-3 px-4 font-bold border-b border-gray-300 text-center w-32">SHELF LIFE LIMIT</th>
                <th className="py-3 px-4 font-bold border-b border-gray-300 text-center w-24">DTE</th>
                <th className="py-3 px-4 font-bold border-b border-gray-300 text-right w-24">STOCK</th>
                <th className="py-3 px-4 font-bold border-b border-gray-300 text-right w-36">LOT VALUATION</th>
                <th className="py-3 px-4 font-bold border-b border-gray-300 text-center w-36">ACTION REQUIRED</th>
              </tr>
            </thead>
            <tbody className="text-[12px] text-gray-700">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-400 font-bold italic">
                    <span className="text-3xl block mb-2 opacity-50">📭</span>
                    No batch data matches your current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => {
                  const isQuarantined = item.status === 'Quarantined';
                  const isRMA = item.status === 'RMA Claimed';
                  
                  let bgClass = 'hover:bg-blue-50';
                  let dteColor = 'text-emerald-600';
                  
                  if (item.condition === 'EXPIRED') { bgClass = 'bg-red-50/50 hover:bg-red-50'; dteColor = 'text-red-600'; }
                  else if (item.condition === 'CRITICAL') { bgClass = 'bg-amber-50/50 hover:bg-amber-50'; dteColor = 'text-amber-600'; }
                  else if (item.condition === 'WARNING') { dteColor = 'text-amber-500'; }

                  if (isQuarantined || isRMA) bgClass = 'bg-gray-50 opacity-60';

                  return (
                    <tr key={idx} className={`border-b border-gray-100 transition-colors ${bgClass}`}>
                      {/* --- MODIFIKASI: SKU BISA DIKLIK --- */}
                      <td className="py-3 px-4">
                        <span 
                          onClick={() => setSkuModal({ isOpen: true, item: item })}
                          className="font-mono font-black text-[#125ab2] cursor-pointer hover:underline text-[13px] flex items-center gap-1.5"
                          title="View Ledger Profile"
                        >
                          <span className="text-base">📋</span> {item.sku}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-800">
                        <div className="truncate max-w-[250px]">{item.name}</div>
                        <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">Bin: <strong className="text-gray-700">{item.bin}</strong></div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-white border border-gray-300 text-gray-700 px-2 py-0.5 rounded-sm text-[10px] font-bold font-mono tracking-wider shadow-sm">
                          {item.batch}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-gray-600">{item.expiryDate}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-black ${dteColor}`}>
                          {item.daysToExpiry < 0 ? 'EXPIRED' : `${item.daysToExpiry} Days`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-gray-800">
                        {item.stock.toLocaleString('en-US')} <span className="text-gray-400 font-bold text-[10px] uppercase">{item.unit}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-700">
                        ${(item.stock * item.unitCost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isQuarantined ? (
                          <span className="text-[9px] font-bold text-red-700 bg-red-100 px-2 py-1 rounded-sm uppercase tracking-wider border border-red-200">Quarantined</span>
                        ) : isRMA ? (
                          <span className="text-[9px] font-bold text-[#125ab2] bg-blue-100 px-2 py-1 rounded-sm uppercase tracking-wider border border-blue-200">RMA Processed</span>
                        ) : item.condition === 'EXPIRED' ? (
                          <button onClick={() => openActionModal(item, 'QUARANTINE')} className="bg-red-600 text-white px-3 py-1.5 rounded-sm text-[9px] font-bold uppercase tracking-wider hover:bg-red-700 w-full shadow-sm cursor-pointer transition-colors">
                            Quarantine
                          </button>
                        ) : item.condition === 'CRITICAL' || item.condition === 'WARNING' ? (
                          <button onClick={() => openActionModal(item, 'RMA')} className="bg-amber-500 text-white px-3 py-1.5 rounded-sm text-[9px] font-bold uppercase tracking-wider hover:bg-amber-600 w-full shadow-sm cursor-pointer transition-colors">
                            Claim RMA
                          </button>
                        ) : (
                          <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">—</span>
                        )}
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
      {/* 🛡️ MODAL ACTION (QUARANTINE / RMA) DENGAN BULLETPROOF FLEXBOX             */}
      {/* ========================================================================= */}
      {actionModal.isOpen && actionModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
          <div className={`bg-white rounded-sm w-full max-w-[450px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 ${actionModal.actionType === 'QUARANTINE' ? 'border-t-red-600' : 'border-t-amber-500'}`} style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            <div className={`${actionModal.actionType === 'QUARANTINE' ? 'bg-red-50 border-b border-red-100' : 'bg-amber-50 border-b border-amber-100'} px-5 py-4 flex justify-between items-center shrink-0 z-10`}>
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${actionModal.actionType === 'QUARANTINE' ? 'text-red-600' : 'text-amber-700'}`}>Compliance Action</p>
                <h3 className={`font-black text-sm uppercase tracking-wider ${actionModal.actionType === 'QUARANTINE' ? 'text-red-800' : 'text-amber-800'}`}>
                  {actionModal.actionType === 'QUARANTINE' ? 'Quarantine Degraded Stock' : 'Initiate RMA Warranty Claim'}
                </h3>
              </div>
              <button onClick={() => setActionModal({ isOpen: false, item: null, actionType: '' })} className={`${actionModal.actionType === 'QUARANTINE' ? 'text-red-400 hover:text-red-800' : 'text-amber-400 hover:text-amber-800'} font-bold text-xl leading-none cursor-pointer px-2`}>✕</button>
            </div>
            
            <form onSubmit={submitAction} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0">
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-sm mb-4">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Target Batch for Action</p>
                  <p className="font-black text-xl text-[#125ab2] font-mono mb-1">{actionModal.item.batch}</p>
                  <p className="font-semibold text-gray-800 text-sm leading-tight">{actionModal.item.name}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 border border-gray-200 p-3 rounded-sm">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Impacted Quantity</span>
                    <p className="font-black text-gray-900 text-lg mt-1">{actionModal.item.stock} <span className="text-xs font-bold text-gray-500 uppercase">{actionModal.item.unit}</span></p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 p-3 rounded-sm">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Asset Value Loss</span>
                    <p className="font-black text-red-600 text-lg mt-1 font-mono">${(actionModal.item.stock * actionModal.item.unitCost).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 shrink-0 z-10">
                <button type="button" onClick={() => setActionModal({ isOpen: false, item: null, actionType: '' })} className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm rounded-sm cursor-pointer">Cancel</button>
                <button type="submit" className={`${actionModal.actionType === 'QUARANTINE' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'} text-white px-6 py-2.5 font-bold shadow-sm transition-colors text-[10px] uppercase tracking-wider rounded-sm cursor-pointer`}>
                  {actionModal.actionType === 'QUARANTINE' ? 'Confirm Quarantine' : 'Process RMA Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ MODAL SKU DETAILS / TRACEABILITY (BULLETPROOF FLEXBOX)                 */}
      {/* ========================================================================= */}
      {skuModal.isOpen && skuModal.item && (() => {
        const item = skuModal.item;
        return (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
            <div className="bg-white rounded-sm w-full max-w-[500px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-[#125ab2]" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
              
              <div className="bg-blue-50 px-6 py-4 flex justify-between items-center border-b border-blue-100 shrink-0 z-10">
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Component Master Ledger</p>
                  <h3 className="font-black font-mono text-xl text-[#125ab2] leading-none">{item.sku}</h3>
                </div>
                <button onClick={() => setSkuModal({ isOpen: false, item: null })} className="text-gray-400 hover:text-gray-800 font-bold text-xl leading-none px-2">✕</button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 text-gray-800">
                <div className="border-b border-gray-200 pb-5 mb-5">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider mb-1">Component Name</span>
                  <span className="text-lg font-black text-gray-900 leading-tight block">{item.name}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="bg-gray-50 p-3 rounded-sm border border-gray-100">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Batch / Lot Identifier</span>
                    <p className="font-bold font-mono text-gray-900 text-sm mt-1">{item.batch}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-sm border border-gray-100">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Physical Storage Bin</span>
                    <p className="font-bold text-[#125ab2] font-mono text-sm mt-1">{item.bin}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-sm border border-gray-100">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Lot Expiration Date</span>
                    <p className={`font-bold text-sm mt-1 ${item.daysToExpiry < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {item.expiryDate}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-sm border border-gray-100">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Total Traceable Stock</span>
                    <p className="font-bold text-gray-900 text-sm mt-1">{item.stock.toLocaleString('en-US')} {item.unit}</p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-5 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Compliance Status</span>
                    <span className={`inline-block px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-wider border ${
                      item.status === 'Quarantined' ? 'bg-red-100 text-red-700 border-red-200' :
                      item.status === 'RMA Claimed' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                      'bg-emerald-100 text-emerald-700 border-emerald-200'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end shrink-0 z-10">
                <button onClick={() => setSkuModal({ isOpen: false, item: null })} className="px-6 py-2.5 bg-gray-800 hover:bg-black text-white text-[10px] font-bold uppercase tracking-wider shadow-sm rounded-sm transition-colors">
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

export default StockAging;