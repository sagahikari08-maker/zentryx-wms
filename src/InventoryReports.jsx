import React, { useState, useContext, useEffect, useMemo } from 'react';
import { AppContext } from './AppContext';

// ─── TOAST COMPONENT (Aman dari Bug Klik/Pointer Events) ─────────────────────
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
    {toasts.map(({ id, message, type }) => (
      <div key={id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-sm shadow-xl text-white text-xs font-semibold min-w-[280px] border-l-4 ${
        type === 'success' ? 'bg-emerald-600 border-emerald-800' : type === 'error' ? 'bg-red-600 border-red-800' : 'bg-[#125ab2] border-blue-800'
      }`}>
        <span className="text-base">{type === 'success' ? '✓' : type === 'error' ? '🚨' : 'ℹ'}</span>
        <span className="flex-1">{message}</span>
        <button onClick={() => removeToast(id)} className="opacity-70 hover:opacity-100 text-lg leading-none">×</button>
      </div>
    ))}
  </div>
);

const InventoryReports = () => {
  const { bahasa } = useContext(AppContext);

  // 1. DATA MASTER INVENTARIS (ARUS MOTORS)
  const initialData = [
    { sku: 'SKU-ARS-LFP01', name: 'Blade Battery Cell 3.2V 150Ah', stock: 450, minStock: 1000, unit: 'Pcs', unitPrice: 250.00, supplier: 'Contemporary Amperex Tech', isReordered: false, leadTime: '14 Days', dailyUsage: 120 },
    { sku: 'SKU-ARS-MCU03', name: 'Motor Control Unit (MCU) Gen 3', stock: 120, minStock: 50, unit: 'Units', unitPrice: 850.00, supplier: 'Bosch Automotive', isReordered: false, leadTime: '21 Days', dailyUsage: 15 },
    { sku: 'SKU-ARS-CBL12', name: 'High Voltage Harness Cable 50mm2', stock: 3500, minStock: 1500, unit: 'Meters', unitPrice: 12.50, supplier: 'Aptiv Wiring Sys', isReordered: false, leadTime: '7 Days', dailyUsage: 200 },
    { sku: 'SKU-ARS-CHZ04', name: 'Underbody Steel Chassis Frame', stock: 18, minStock: 40, unit: 'Units', unitPrice: 1200.00, supplier: 'Krakatau Steel', isReordered: false, leadTime: '10 Days', dailyUsage: 8 },
    { sku: 'SKU-ARS-CLT99', name: 'Thermal Management Coolant 20L', stock: 250, minStock: 100, unit: 'Drums', unitPrice: 45.00, supplier: '3M Fluids', isReordered: false, leadTime: '5 Days', dailyUsage: 10 },
  ];

  const [reportData, setReportData] = useState(() => {
    try {
      const saved = window.localStorage.getItem('inventoryReportData_ARUS');
      return saved ? JSON.parse(saved) : initialData;
    } catch {
      return initialData;
    }
  });

  // ─── ALGORITMA PEMBERSIH DATA LAMA (PIZZA) ───
  useEffect(() => {
    const hasOldData = reportData.some(item => 
      item.sku.includes('PIZ-') || item.sku.includes('SAU-') || item.name.toLowerCase().includes('pizza')
    );
    if (hasOldData) {
      setReportData(initialData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('inventoryReportData_ARUS', JSON.stringify(reportData));
    } catch (error) {
      console.error('Failed to save report data:', error);
    }
  }, [reportData]);

  // 2. STATE INTERAKTIF
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('ALL');
  const [toasts, setToasts] = useState([]);
  
  // Modals
  const [reorderModal, setReorderModal] = useState({ isOpen: false, item: null, qty: '' });
  const [skuModal, setSkuModal] = useState({ isOpen: false, item: null });

  // 3. FUNGSI TOAST
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // 4. FUNGSI EXPORT CSV
  const handleExportCSV = () => {
    addToast(bahasa === 'en' ? 'Generating Report Data...' : 'Menyiapkan file CSV...', 'info');
    const headers = ['SKU ID', 'Item Description', 'Current Stock', 'Min Threshold', 'UOM', 'Unit Price (USD)', 'Total Valuation (USD)', 'Primary Supplier', 'Health Status'];
    const csvRows = [headers.join(',')];
    
    reportData.forEach(item => {
      const statusText = item.stock < item.minStock ? 'CRITICAL SHORTAGE' : 'HEALTHY';
      const row = [
        item.sku, 
        `"${item.name}"`, 
        item.stock, 
        item.minStock, 
        item.unit, 
        item.unitPrice, 
        (item.stock * item.unitPrice), 
        `"${item.supplier}"`, 
        statusText
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `ARUS_Inventory_Valuation_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => addToast('Export to CSV completed successfully!', 'success'), 500);
  };

  // 5. FUNGSI AKSI REORDER & BUKA DETAIL SKU
  const openReorderModal = (item) => {
    // Algoritma Pintar: Saran reorder adalah 2x batas minimum dikurangi stok yang ada (Safety Stock Calculation)
    const suggestedQty = Math.max(item.minStock * 2 - item.stock, item.minStock);
    setReorderModal({ isOpen: true, item: item, qty: suggestedQty });
  };

  const submitReorder = (e) => {
    e.preventDefault();
    setReportData(reportData.map(data => data.sku === reorderModal.item.sku ? { ...data, isReordered: true } : data));
    addToast(`Purchase Order Draft created for ${reorderModal.qty} ${reorderModal.item.unit} of ${reorderModal.item.sku}`, 'success');
    setReorderModal({ isOpen: false, item: null, qty: '' });
  };

  const openSkuDetails = (item) => {
    setSkuModal({ isOpen: true, item });
  };

  // 6. FILTERING ENGINE & METRICS
  const filteredData = useMemo(() => {
    return reportData.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterMode === 'CRITICAL' ? item.stock < item.minStock : true;
      return matchesSearch && matchesFilter;
    });
  }, [reportData, searchTerm, filterMode]);

  const stats = useMemo(() => {
    const totalValue = filteredData.reduce((acc, item) => acc + (item.stock * item.unitPrice), 0);
    const criticalCount = reportData.filter(i => i.stock < i.minStock).length;
    return { totalValue, criticalCount };
  }, [filteredData, reportData]);

  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 animate-fade-in">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>📊 Analytics</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Reporting</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide">
            {bahasa === 'en' ? 'Inventory Valuation & Performance' : 'Valuasi & Performa Inventaris'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {bahasa === 'en' ? 'Real-time stock valuation, health monitoring, and replenishment analysis.' : 'Valuasi aset real-time, pemantauan kesehatan stok, dan analisis pengadaan.'}
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={handleExportCSV} 
            className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-5 py-2.5 rounded-sm text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-2 uppercase tracking-wider w-full md:w-auto"
          >
            <span>⭳</span> {bahasa === 'en' ? 'Export CSV Report' : 'Unduh Laporan CSV'}
          </button>
        </div>
      </div>

      {/* ── METRICS SUMMARY ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        <div className="bg-white p-5 border border-gray-200 shadow-sm rounded-sm border-l-4 border-l-[#415a77] hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1">Total SKUs Monitored</p>
          <p className="text-2xl font-black text-[#415a77]">{reportData.length} <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Items</span></p>
        </div>
        <div className="bg-white p-5 border border-gray-200 shadow-sm rounded-sm relative overflow-hidden border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
          {stats.criticalCount > 0 && <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-black uppercase px-2 py-1 rounded-bl-sm animate-pulse">Action Req</div>}
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1">Critical Stock Alerts</p>
          <p className={`text-2xl font-black ${stats.criticalCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {stats.criticalCount} <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">SKUs</span>
          </p>
        </div>
        <div className="bg-white p-5 border border-gray-200 shadow-sm rounded-sm border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1">Total Asset Valuation (Filtered)</p>
          <p className="text-2xl font-black font-mono text-emerald-700">
            ${stats.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* ── TOOLBAR & SEARCH ── */}
      <div className="bg-white p-3 border border-gray-300 shadow-sm rounded-sm mb-0 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setFilterMode('ALL')} 
            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors ${filterMode === 'ALL' ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            All Inventory
          </button>
          <button 
            onClick={() => setFilterMode('CRITICAL')} 
            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors ${filterMode === 'CRITICAL' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
          >
            Critical Only
          </button>
        </div>
        <input 
          type="text" 
          placeholder={bahasa === 'en' ? 'Search SKU ID or Component Name...' : 'Cari SKU atau Nama Komponen...'} 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="border border-gray-300 px-4 py-1.5 rounded-sm text-xs outline-none focus:border-[#125ab2] w-full sm:w-80 transition-colors" 
        />
      </div>

      {/* ── TABEL LAPORAN ── */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden mt-4">
        <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex items-center gap-3 text-sm text-[#125ab2]">
          <span className="text-lg leading-none">ℹ️</span>
          <p className="font-semibold text-xs">
            {bahasa === 'en' ? 'Click SKU ID to view detailed item ledger and runway predictions.' : 'Klik SKU ID untuk melihat kartu stok detail dan prediksi sisa hari.'}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
            <thead className="bg-[#e5e5e5] text-[#666666] text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 font-bold border-b border-gray-300 w-32">SKU ID</th>
                <th className="py-3 px-4 font-bold border-b border-gray-300">COMPONENT DESCRIPTION</th>
                <th className="py-3 px-4 font-bold border-b border-gray-300 text-center w-36">STOCK HEALTH</th>
                <th className="py-3 px-4 font-bold border-b border-gray-300 text-right w-28">UNIT PRICE</th>
                <th className="py-3 px-4 font-bold border-b border-gray-300 text-right w-36">VALUATION (USD)</th>
                <th className="py-3 px-4 font-bold border-b border-gray-300 text-center w-32">PROCUREMENT</th>
              </tr>
            </thead>
            <tbody className="text-[12px] text-gray-700">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400 font-bold italic">
                    <span className="text-3xl block mb-2 opacity-50">📭</span>
                    No components match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => {
                  const isCritical = item.stock < item.minStock;
                  const stockPercent = Math.min(100, Math.round((item.stock / (item.minStock * 2)) * 100)); // Visual ratio based on 2x minstock
                  
                  return (
                    <tr key={idx} className={`border-b border-gray-100 transition-colors ${isCritical ? 'bg-red-50/30 hover:bg-red-50' : 'hover:bg-blue-50'}`}>
                      <td className="py-3 px-4">
                        <span 
                          onClick={() => openSkuDetails(item)} 
                          className="font-mono font-black text-[#125ab2] cursor-pointer hover:underline text-[13px] flex items-center gap-1.5"
                        >
                          <span className="text-base">📋</span> {item.sku}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-800 text-[13px]">{item.name}</div>
                        <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">Supplier: {item.supplier}</div>
                      </td>
                      
                      {/* VISUAL HEALTH BAR */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col gap-1 w-full max-w-[120px] mx-auto">
                          <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider">
                            <span className={isCritical ? 'text-red-600' : 'text-emerald-600'}>{item.stock}</span>
                            <span className="text-gray-400">Min: {item.minStock}</span>
                          </div>
                          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${isCritical ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}
                              style={{ width: `${stockPercent}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-semibold text-gray-600">
                        ${item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-700">
                        ${(item.stock * item.unitPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isCritical && !item.isReordered && (
                          <button onClick={() => openReorderModal(item)} className="bg-red-600 text-white px-3 py-1.5 rounded-sm text-[9px] font-bold uppercase tracking-wider hover:bg-red-700 shadow-sm w-full transition-colors">
                            Reorder Now
                          </button>
                        )}
                        {isCritical && item.isReordered && (
                          <button disabled className="bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-sm text-[9px] font-bold uppercase tracking-wider w-full cursor-not-allowed">
                            PO Drafted
                          </button>
                        )}
                        {!isCritical && (
                          <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-sm text-[9px] font-bold uppercase tracking-wider block">
                            Healthy
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🛡️ MODAL 1: SKU DETAILS / ITEM LEDGER (BULLETPROOF FLEXBOX)               */}
      {/* ========================================================================= */}
      {skuModal.isOpen && skuModal.item && (() => {
        const item = skuModal.item;
        const runwayDays = Math.floor(item.stock / item.dailyUsage);
        const isCritical = item.stock < item.minStock;

        return (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
            <div className="bg-white rounded-sm w-full max-w-[550px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-[#125ab2]" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
              
              <div className="bg-blue-50 border-b border-blue-100 px-6 py-4 flex justify-between items-center shrink-0 z-10">
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Inventory Master Ledger</p>
                  <h3 className="font-black font-mono text-xl text-[#125ab2] leading-none">{item.sku}</h3>
                </div>
                <button onClick={() => setSkuModal({ isOpen: false, item: null })} className="text-gray-400 hover:text-gray-800 font-bold text-xl leading-none px-2">✕</button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 text-gray-800">
                <div className="border-b border-gray-200 pb-5 mb-5">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider mb-1">Component Name</span>
                  <span className="text-xl font-black text-gray-900 leading-tight block">{item.name}</span>
                  <p className="text-xs text-gray-600 mt-2 font-medium">Preferred Vendor: <strong className="text-gray-800">{item.supplier}</strong></p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="bg-gray-50 p-4 rounded-sm border border-gray-200">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Avg. Daily Usage</span>
                    <p className="font-black text-gray-800 text-lg mt-1">{item.dailyUsage} <span className="text-xs font-bold text-gray-500 uppercase">{item.unit}/day</span></p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-sm border border-gray-200">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Supplier Lead Time</span>
                    <p className="font-black text-gray-800 text-lg mt-1">{item.leadTime}</p>
                  </div>
                </div>

                {/* ── FITUR 1: PRODUCTION RUNWAY PREDICTOR ── */}
                <div className={`p-5 rounded-sm border ${runwayDays <= 5 ? 'bg-red-50 border-red-200' : runwayDays <= 14 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Production Runway Predictor</span>
                    <span className="text-xl">⏳</span>
                  </div>
                  <p className={`text-2xl font-black ${runwayDays <= 5 ? 'text-red-700' : runwayDays <= 14 ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {runwayDays} <span className="text-sm font-bold uppercase tracking-wider">Days Left</span>
                  </p>
                  <p className="text-[10px] font-semibold mt-2 opacity-80 leading-relaxed">
                    Based on the current stock of {item.stock} {item.unit} and a daily burn rate of {item.dailyUsage} {item.unit}, assembly lines will run out of this component in approximately {runwayDays} days.
                  </p>
                </div>

                <div className="mt-5 border-t border-gray-100 pt-5 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">System Status</span>
                    <span className={`inline-block px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-wider border ${isCritical ? 'bg-red-100 text-red-700 border-red-200 animate-pulse' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                      {isCritical ? '⚠️ Procurement Required' : '✓ Stock Optimal'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Total Valuation</span>
                    <span className="font-mono font-black text-emerald-700 text-lg">
                      ${(item.stock * item.unitPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end shrink-0 z-10">
                <button onClick={() => setSkuModal({ isOpen: false, item: null })} className="px-6 py-2.5 bg-gray-800 hover:bg-black text-white text-[10px] font-bold uppercase tracking-wider shadow-sm rounded-sm transition-colors">
                  Close Ledger
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* 🛡️ MODAL 2: REORDER PO DRAFT (WITH FINANCIAL SAFEGUARD PREVIEW)           */}
      {/* ========================================================================= */}
      {reorderModal.isOpen && reorderModal.item && (() => {
        const item = reorderModal.item;
        const totalDraftCost = (reorderModal.qty || 0) * item.unitPrice;

        return (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
            <div className="bg-white rounded-sm w-full max-w-[500px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-red-600" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
              
              <div className="bg-red-50 px-5 py-4 flex justify-between items-center border-b border-red-100 shrink-0 z-10">
                <div>
                  <p className="text-[10px] text-red-600 font-bold uppercase tracking-wider mb-0.5">Procurement Action</p>
                  <h3 className="font-black text-sm text-red-800 uppercase tracking-wider">Draft Purchase Order</h3>
                </div>
                <button onClick={() => setReorderModal({ isOpen: false, item: null, qty: '' })} className="text-red-400 hover:text-red-800 font-bold text-xl leading-none px-2">✕</button>
              </div>
              
              <form onSubmit={submitReorder} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0">
                  
                  <div className="mb-6">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Target Component</p>
                    <h4 className="font-black text-lg text-gray-900 leading-tight">{item.name}</h4>
                    <p className="font-mono text-[#125ab2] font-bold text-xs mt-1">{item.sku}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 border border-gray-200 p-3 rounded-sm">
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Current Stock</span>
                      <p className="font-black text-red-600 text-base mt-1">{item.stock} <span className="text-[10px] font-bold text-gray-500 uppercase">{item.unit}</span></p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 p-3 rounded-sm">
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Min. Threshold</span>
                      <p className="font-black text-gray-800 text-base mt-1">{item.minStock} <span className="text-[10px] font-bold text-gray-500 uppercase">{item.unit}</span></p>
                    </div>
                  </div>

                  <div className="mb-5">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Order Quantity ({item.unit}) <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="number" 
                      value={reorderModal.qty} 
                      onChange={e => setReorderModal({...reorderModal, qty: e.target.value})} 
                      className="w-full border border-gray-300 px-3 py-3 rounded-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-2xl font-black text-gray-800 text-center transition-all" 
                      min="1" 
                      required 
                      autoFocus
                    />
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-2 text-center">
                      Auto-Suggested Logic: Safety Stock (Min. Threshold x2)
                    </p>
                  </div>

                  {/* ── FITUR 2: FINANCIAL PO PREVIEW ── */}
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-sm flex justify-between items-center">
                    <div>
                      <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">Est. Financial Impact</span>
                      <span className="text-xs font-semibold text-emerald-700">@ ${item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })} / {item.unit}</span>
                    </div>
                    <span className="font-mono font-black text-xl text-emerald-700">
                      ${totalDraftCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                </div>

                <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 shrink-0 z-10">
                  <button type="button" onClick={() => setReorderModal({ isOpen: false, item: null, qty: '' })} className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm rounded-sm">
                    Cancel
                  </button>
                  <button type="submit" className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors rounded-sm flex items-center gap-2">
                    Submit PO Draft
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </main>
  );
};

export default InventoryReports;