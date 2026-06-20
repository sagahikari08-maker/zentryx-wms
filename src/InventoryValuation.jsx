import React, { useState, useContext, useMemo, useEffect } from 'react';
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

const InventoryValuation = () => {
  const { bahasa } = useContext(AppContext);

  // Helper untuk tanggal dinamis
  const getDynamicDate = (daysOffset) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
  };

  // 1. DATA MASTER VALUASI (ARUS MOTORS EV COMPONENTS)
  const initialValuationData = [
    { sku: 'SKU-ARS-LFP01', name: 'Blade Battery Cell 3.2V 150Ah', category: 'Energy Storage', stock: 4500, unit: 'Pcs', unitCost: 250.00, lastPurchaseDate: getDynamicDate(-5) },
    { sku: 'SKU-ARS-MCU03', name: 'Motor Control Unit (MCU) Gen 3', category: 'Powertrain & Electronics', stock: 210, unit: 'Units', unitCost: 850.00, lastPurchaseDate: getDynamicDate(-12) },
    { sku: 'SKU-ARS-CBL12', name: 'High Voltage Harness Cable 50mm2', category: 'Electrical & Wiring', stock: 15000, unit: 'Meters', unitCost: 12.50, lastPurchaseDate: getDynamicDate(-2) },
    { sku: 'SKU-ARS-CHZ04', name: 'Underbody Steel Chassis Frame', category: 'Structural Chassis', stock: 90, unit: 'Units', unitCost: 1200.00, lastPurchaseDate: getDynamicDate(-20) },
    { sku: 'SKU-ARS-CLT99', name: 'Thermal Management Coolant 20L', category: 'Consumables & Liquids', stock: 300, unit: 'Drums', unitCost: 45.00, lastPurchaseDate: getDynamicDate(-8) },
    { sku: 'SKU-ARS-SNT01', name: 'ADAS Telemetry Sensor Kit', category: 'Powertrain & Electronics', stock: 150, unit: 'Sets', unitCost: 450.00, lastPurchaseDate: getDynamicDate(-15) },
  ];

  const [valuationData, setValuationData] = useState(() => {
    try {
      const saved = window.localStorage.getItem('valuationData_ARUS');
      return saved ? JSON.parse(saved) : initialValuationData;
    } catch {
      return initialValuationData;
    }
  });

  // ─── ALGORITMA PEMBERSIH DATA LAMA (PIZZA) ───
  useEffect(() => {
    const hasOldData = valuationData.some(item => 
      item.sku.includes('PIZ-') || item.category === 'Dairy & Chilled' || item.name.toLowerCase().includes('pizza')
    );
    if (hasOldData) {
      setValuationData(initialValuationData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('valuationData_ARUS', JSON.stringify(valuationData));
    } catch (error) {
      console.error('Failed to save valuation data:', error);
    }
  }, [valuationData]);

  // 2. STATE PENCARIAN & FILTER
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [toasts, setToasts] = useState([]);
  const [skuModal, setSkuModal] = useState({ isOpen: false, item: null, percentage: 0 }); 

  // 3. FUNGSI TOAST
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // 4. ENGINE PERHITUNGAN ANALITIK FINANSIAL
  const analytics = useMemo(() => {
    let totalAssetValue = 0;
    const categoryBreakdown = {};

    valuationData.forEach(item => {
      const itemValue = item.stock * item.unitCost;
      totalAssetValue += itemValue;
      if (!categoryBreakdown[item.category]) categoryBreakdown[item.category] = 0;
      categoryBreakdown[item.category] += itemValue;
    });

    let topCategory = { name: '-', value: 0 };
    for (const [cat, val] of Object.entries(categoryBreakdown)) {
      if (val > topCategory.value) topCategory = { name: cat, value: val };
    }

    return { totalAssetValue, categoryBreakdown, topCategory };
  }, [valuationData]);

  // 5. FUNGSI EXPORT CSV (ENTERPRISE STANDARD)
  const handleExportCSV = () => {
    addToast(bahasa === 'en' ? 'Compiling Financial Data...' : 'Menyusun Laporan Keuangan...', 'info');
    
    const headers = ['SKU ID', 'Component Description', 'Asset Class', 'Qty On Hand', 'UOM', 'Avg Unit Cost (USD)', 'Total Asset Value (USD)', '% Contribution'];
    const csvRows = [headers.join(',')];
    
    valuationData.forEach(item => {
      const itemTotalValue = item.stock * item.unitCost;
      const percentage = ((itemTotalValue / analytics.totalAssetValue) * 100).toFixed(2);
      
      const row = [
        item.sku, `"${item.name}"`, `"${item.category}"`, item.stock, item.unit, 
        item.unitCost.toFixed(2), itemTotalValue.toFixed(2), `${percentage}%`
      ];
      csvRows.push(row.join(','));
    });

    csvRows.push(`,,,,,,${analytics.totalAssetValue.toFixed(2)},100%`);

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `ARUS_Inventory_Valuation_${getDynamicDate(0)}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    setTimeout(() => addToast('Financial Report Exported Successfully!', 'success'), 800);
  };

  // 6. FILTERING & BUKA DETAIL SKU
  const filteredData = useMemo(() => {
    return valuationData.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [valuationData, searchTerm, categoryFilter]);

  const categories = ['ALL', ...new Set(valuationData.map(item => item.category))];

  const openSkuDetails = (item, percentage) => {
    setSkuModal({ isOpen: true, item, percentage });
  };

  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 animate-fade-in">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>📊 Analytics</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Financials</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide">
            {bahasa === 'en' ? 'Inventory Valuation' : 'Valuasi Aset Inventaris'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">Financial breakdown and capital allocation of current warehouse assets.</p>
        </div>
        <button onClick={handleExportCSV} className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-5 py-2.5 rounded-sm text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-2 uppercase tracking-wider w-full md:w-auto">
          <span>⭳</span> {bahasa === 'en' ? 'Export Financials' : 'Ekspor Laporan Keuangan'}
        </button>
      </div>

      {/* ── METRICS SUMMARY ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        <div className="bg-white p-5 border-l-4 border-l-emerald-500 border border-y-gray-200 border-r-gray-200 shadow-sm rounded-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Total Capital Asset Value</p>
          <p className="text-3xl font-black text-emerald-700 mt-1 font-mono">${analytics.totalAssetValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-[10px] font-semibold text-gray-500 mt-1">Based on Moving Average Cost</p>
        </div>
        <div className="bg-white p-5 border border-gray-200 shadow-sm rounded-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Highest Value Category</p>
          <p className="text-xl font-black text-[#125ab2] mt-1 truncate">{analytics.topCategory.name}</p>
          <p className="text-sm font-black text-gray-700 mt-1 font-mono">${analytics.topCategory.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-5 border border-gray-200 shadow-sm rounded-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Asset Classes Tracked</p>
          <p className="text-2xl font-black text-gray-800 mt-1">{categories.length - 1} <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Classes</span></p>
          <p className="text-[10px] font-semibold text-gray-500 mt-1">Spanning {valuationData.length} active Master SKUs</p>
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="bg-white p-3 border border-gray-300 shadow-sm rounded-sm mb-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:block">Filter by Class:</span>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full sm:w-auto border border-gray-300 px-3 py-1.5 rounded-sm text-xs font-bold outline-none focus:border-[#125ab2] bg-gray-50 text-gray-700 cursor-pointer">
            {categories.map(cat => <option key={cat} value={cat}>{cat === 'ALL' ? 'All Asset Categories' : cat}</option>)}
          </select>
        </div>
        <input 
          type="text" 
          placeholder="Search SKU or Component Description..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="border border-gray-300 px-4 py-1.5 rounded-sm text-xs outline-none focus:border-[#125ab2] w-full sm:w-80 transition-colors" 
        />
      </div>

      {/* ── TABEL DATA VALUASI ── */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-[#e5e5e5] text-[#666666] text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4 font-bold border-b border-gray-300 w-32">SKU ID</th>
                <th className="py-3 px-4 font-bold border-b border-gray-300">COMPONENT DESCRIPTION</th>
                <th className="py-3 px-4 font-bold border-b border-gray-300">ASSET CLASS</th>
                <th className="py-3 px-4 font-bold border-b border-gray-300 text-right w-28">QTY HELD</th>
                <th className="py-3 px-4 font-bold border-b border-gray-300 text-right w-36">UNIT COST (USD)</th>
                <th className="py-3 px-4 font-bold border-b border-gray-300 text-right w-40">TOTAL VALUE (USD)</th>
                <th className="py-3 px-4 font-bold border-b border-gray-300 text-center w-36">% ALLOCATION</th>
              </tr>
            </thead>
            <tbody className="text-[12px] text-gray-700">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-400 font-bold italic">
                    <span className="text-3xl block mb-2 opacity-50">📭</span>
                    No valuation data matches your current criteria.
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => {
                  const itemTotalValue = item.stock * item.unitCost;
                  const percentage = ((itemTotalValue / analytics.totalAssetValue) * 100).toFixed(2);
                  
                  return (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                      <td className="py-3 px-4">
                        <span 
                          onClick={() => openSkuDetails(item, percentage)} 
                          className="font-mono font-black text-[#125ab2] cursor-pointer hover:underline text-[13px] flex items-center gap-1.5"
                          title="View Financial Breakdown"
                        >
                          <span className="text-base">📈</span> {item.sku}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-800">{item.name}</td>
                      <td className="py-3 px-4">
                        <span className="bg-gray-100 border border-gray-200 text-gray-600 px-2 py-1 rounded-sm text-[9px] font-bold uppercase tracking-wider">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-black text-gray-800 text-[13px]">{item.stock.toLocaleString('en-US')}</span> <span className="text-gray-400 font-bold text-[10px] uppercase">{item.unit}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-gray-600">
                        ${item.unitCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-bold font-mono text-emerald-700 text-[13px]">
                        ${itemTotalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                            <div className="h-full bg-[#125ab2]" style={{ width: `${percentage}%` }}></div>
                          </div>
                          <span className="w-10 text-right font-mono text-[11px] font-black text-gray-600">{percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-300">
              <tr>
                <td colSpan="5" className="py-4 px-4 font-bold text-right text-gray-500 uppercase text-[10px] tracking-widest">Filtered Asset Valuation:</td>
                <td className="py-4 px-4 font-black text-right font-mono text-lg text-emerald-800">
                  ${filteredData.reduce((acc, item) => acc + (item.stock * item.unitCost), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🛡️ MODAL SKU FINANCIAL BREAKDOWN (BULLETPROOF FLEXBOX)                    */}
      {/* ========================================================================= */}
      {skuModal.isOpen && skuModal.item && (() => {
        const item = skuModal.item;
        return (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
            <div className="bg-white rounded-sm w-full max-w-[500px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-emerald-500" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
              
              <div className="bg-emerald-50 text-emerald-800 px-6 py-4 flex justify-between items-center border-b border-emerald-100 shrink-0 z-10">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-emerald-600">Accounting Engine</p>
                  <h3 className="font-black text-sm uppercase tracking-wider">Asset Financial Breakdown</h3>
                </div>
                <button onClick={() => setSkuModal({ isOpen: false, item: null, percentage: 0 })} className="text-emerald-400 hover:text-emerald-800 font-bold text-xl leading-none px-2">✕</button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 text-gray-800">
                
                <div className="border-b border-gray-200 pb-5 mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] uppercase font-black text-[#125ab2] bg-blue-50 px-2 py-0.5 rounded-sm border border-blue-200 font-mono tracking-widest">{item.sku}</span>
                  </div>
                  <h4 className="text-xl font-black text-gray-900 leading-tight mb-2">{item.name}</h4>
                  <p className="text-xs text-gray-600 font-semibold">Asset Class: <strong className="text-gray-800 uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded border border-gray-200 ml-1">{item.category}</strong></p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="bg-gray-50 p-4 rounded-sm border border-gray-200">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Unit Cost (Moving Avg)</span>
                    <p className="font-mono font-black text-gray-900 text-lg">${item.unitCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-sm border border-gray-200">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Quantity On Hand</span>
                    <p className="font-black text-gray-900 text-lg">{item.stock.toLocaleString('en-US')} <span className="text-xs font-bold text-gray-500 uppercase">{item.unit}</span></p>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-sm flex items-center justify-between mb-5">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">Total Book Value</span>
                    <p className="font-mono font-black text-emerald-700 text-2xl">${(item.stock * item.unitCost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">% of Capital</span>
                    <p className="font-black text-emerald-700 text-2xl">{skuModal.percentage}%</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-3 border border-gray-200 rounded-sm">
                  <span className="text-lg">🗓️</span>
                  <p>Last inventory acquisition recorded on: <strong className="font-mono">{item.lastPurchaseDate}</strong></p>
                </div>

              </div>
              
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end shrink-0 z-10">
                <button onClick={() => setSkuModal({ isOpen: false, item: null, percentage: 0 })} className="px-6 py-2.5 bg-gray-800 hover:bg-black text-white text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors rounded-sm">
                  Close Breakdown
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </main>
  );
};

export default InventoryValuation;