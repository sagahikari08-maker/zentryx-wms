import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AppContext } from './AppContext';

// ─── TOAST COMPONENT (Aman dari Bug Klik/Pointer Events) ─────────────────────
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
    {toasts.map(({ id, message, type }) => (
      <div key={id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-sm shadow-xl text-white text-xs font-semibold min-w-[280px] border-l-4 ${
        type === 'success' ? 'bg-emerald-600 border-emerald-800' : 
        type === 'error' ? 'bg-red-600 border-red-800' : 
        type === 'info' ? 'bg-[#125ab2] border-blue-800' : 'bg-purple-600 border-purple-800'
      }`}>
        <span className="text-base">{type === 'success' ? '✓' : type === 'error' ? '🚨' : type === 'info' ? 'ℹ' : '🔮'}</span>
        <span className="flex-1">{message}</span>
        <button onClick={() => removeToast(id)} className="opacity-70 hover:opacity-100 text-lg leading-none">×</button>
      </div>
    ))}
  </div>
);

const DemandPlanning = () => {
  const { bahasa, halaman, setHalaman } = useContext(AppContext);

  // ─── TABS STATE ───
  const [activeTab, setActiveTab] = useState(() => {
    if (halaman === 'demandSupply') return 'SUPPLY';
    if (halaman === 'demandSafety') return 'SAFETY';
    return 'DEMAND'; 
  });

  useEffect(() => {
    if (halaman === 'demandPlans') setActiveTab('DEMAND');
    else if (halaman === 'demandSupply') setActiveTab('SUPPLY');
    else if (halaman === 'demandSafety') setActiveTab('SAFETY');
  }, [halaman]);

  const handleTabClick = (tabName, routeName) => {
    setActiveTab(tabName);
    setHalaman(routeName);
  };

  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // ─── MODALS STATE ───
  const [modalImport, setModalImport] = useState(false);
  const [modalAdjustDemand, setModalAdjustDemand] = useState({ isOpen: false, data: null });
  const [modalSync, setModalSync] = useState(false);
  const [modalGeneratePR, setModalGeneratePR] = useState({ isOpen: false, data: null });
  const [modalRecalc, setModalRecalc] = useState(false);
  const [modalAdjustSS, setModalAdjustSS] = useState({ isOpen: false, data: null });
  const [modalSupplyDetail, setModalSupplyDetail] = useState({ isOpen: false, data: null });

  // ─── DATA STATE (ARUS MOTORS EV CONTEXT) ───

  // 1. DEMAND PLANS
  const initialDemandPlans = [
    { id: 'FCAST-Q3-ARS-01', sku: 'SKU-ARS-BATT01', item: 'High Voltage Battery Pack 75kWh', prevPeriod: 1200, forecast: 1650, trend: 'up', variance: '+37.5%', confidence: 92, notes: 'B2B Government Fleet Expansion.' },
    { id: 'FCAST-Q3-ARS-02', sku: 'SKU-ARS-MCU03', item: 'Motor Control Unit Gen 3', prevPeriod: 850, forecast: 800, trend: 'down', variance: '-5.8%', confidence: 88, notes: 'Transitioning to Gen 4 next quarter.' },
    { id: 'FCAST-Q3-ARS-03', sku: 'SKU-ARS-CHAS05', item: 'Underbody Steel Chassis Frame', prevPeriod: 1500, forecast: 1800, trend: 'up', variance: '+20.0%', confidence: 95, notes: 'Aligned with new export market openings.' },
    { id: 'FCAST-Q3-ARS-04', sku: 'SKU-ARS-COOL01', item: 'Thermal Management Coolant 20L', prevPeriod: 400, forecast: 420, trend: 'flat', variance: '+5.0%', confidence: 90, notes: 'Standard baseline consumption.' },
  ];

  // 2. SUPPLY PLANS
  const initialSupplyPlans = [
    { id: 'SP-ARS-2601', sku: 'SKU-ARS-BATT01', item: 'High Voltage Battery Pack 75kWh', requiredQty: 550, uom: 'Packs', supplier: 'PT Voltara Daya Nusantara', reqDate: '01 Oct 2026', status: 'Pending Review' },
    { id: 'SP-ARS-2602', sku: 'SKU-ARS-CHAS05', item: 'Underbody Steel Chassis Frame', requiredQty: 300, uom: 'Units', supplier: 'Krakatau Steel Automotive', reqDate: '25 Sep 2026', status: 'Converted to PR' },
    { id: 'SP-ARS-2603', sku: 'SKU-ARS-COOL01', item: 'Thermal Management Coolant 20L', requiredQty: 100, uom: 'Drums', supplier: 'PetroChina Chemicals', reqDate: '05 Oct 2026', status: 'Pending Review' },
  ];

  // 3. SAFETY STOCK CALCULATIONS
  const initialSafetyStocks = [
    { sku: 'SKU-ARS-BATT01', item: 'High Voltage Battery Pack 75kWh', avgDaily: 55, maxDaily: 80, avgLT: 14, maxLT: 21, currentStock: 450, calculatedSS: 910, reorderPoint: 1680, status: 'Warning' },
    { sku: 'SKU-ARS-MCU03', item: 'Motor Control Unit Gen 3', avgDaily: 26, maxDaily: 35, avgLT: 30, maxLT: 45, currentStock: 620, calculatedSS: 795, reorderPoint: 1575, status: 'Critical' },
    { sku: 'SKU-ARS-CHAS05', item: 'Underbody Steel Chassis Frame', avgDaily: 60, maxDaily: 85, avgLT: 7, maxLT: 10, currentStock: 850, calculatedSS: 430, reorderPoint: 850, status: 'Optimal' },
  ];

  const [demandPlans, setDemandPlans] = useState(() => { try { return JSON.parse(window.localStorage.getItem('arus_dp')) || initialDemandPlans; } catch { return initialDemandPlans; }});
  const [supplyPlans, setSupplyPlans] = useState(() => { try { return JSON.parse(window.localStorage.getItem('arus_sp')) || initialSupplyPlans; } catch { return initialSupplyPlans; }});
  const [safetyStocks, setSafetyStocks] = useState(() => { try { return JSON.parse(window.localStorage.getItem('arus_ss')) || initialSafetyStocks; } catch { return initialSafetyStocks; }});

  // ─── PEMBERSIH DATA LAMA ───
  useEffect(() => {
    const hasOldData = demandPlans.some(p => p.sku.includes('PIZ') || p.item.includes('Pizza') || p.item.includes('Mozzarella'));
    if (hasOldData) {
      setDemandPlans(initialDemandPlans);
      setSupplyPlans(initialSupplyPlans);
      setSafetyStocks(initialSafetyStocks);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.localStorage.setItem('arus_dp', JSON.stringify(demandPlans));
    window.localStorage.setItem('arus_sp', JSON.stringify(supplyPlans));
    window.localStorage.setItem('arus_ss', JSON.stringify(safetyStocks));
  }, [demandPlans, supplyPlans, safetyStocks]);


  // ─── ACTION HANDLERS ───

  // Demand Handlers
  const handleImportForecast = () => {
    addToast('Processing Market Telemetry CSV Data...', 'info');
    setTimeout(() => {
      setDemandPlans([{ id: `FCAST-Q3-ARS-NEW`, sku: 'SKU-ARS-SNT01', item: 'ADAS Telemetry Sensor Kit', prevPeriod: 300, forecast: 450, trend: 'up', variance: '+50.0%', confidence: 85, notes: 'Model-X Launch Requirements.' }, ...demandPlans]);
      addToast('Sales & Operations Forecast Imported Successfully!', 'success');
      setModalImport(false);
    }, 1500);
  };

  const handleSaveDemandAdjustment = (e) => {
    e.preventDefault();
    setDemandPlans(prev => prev.map(p => p.id === modalAdjustDemand.data.id ? { ...modalAdjustDemand.data } : p));
    addToast(`Forecast ${modalAdjustDemand.data.id} updated. Supply engine parameters flagged for recalculation.`, 'success');
    setModalAdjustDemand({ isOpen: false, data: null });
  };

  // Supply Handlers
  const handleExecuteSync = () => {
    addToast('Executing Reconciliation Algorithm against MRP...', 'info');
    setTimeout(() => {
      setSupplyPlans([{ id: `SP-ARS-${Math.floor(2700 + Math.random() * 100)}`, sku: 'SKU-ARS-SNT01', item: 'ADAS Telemetry Sensor Kit', requiredQty: 250, uom: 'Sets', supplier: 'Bosch Automotive Electronics', reqDate: '10 Oct 2026', status: 'Pending Review' }, ...supplyPlans]);
      addToast('Engine Synced! 1 new shortage detected and Supply Plan generated.', 'success');
      setModalSync(false);
    }, 1500);
  };

  const handleConfirmPR = () => {
    setSupplyPlans(prev => prev.map(sp => sp.id === modalGeneratePR.data.id ? { ...sp, status: 'Converted to PR' } : sp));
    
    // 💥 TRIGGER INJEKSI: Auto-Generate PR di Modul Procurement menggunakan LocalStorage Bridge sementara
    try {
      const existingPRs = JSON.parse(window.localStorage.getItem('requisitionsData_ARUS') || '[]');
      const newPR = { 
        id: `PR-ARS-${Math.floor(10050 + Math.random() * 100)}`, 
        dept: 'Automated MRP Engine', 
        requester: 'Zentryx AI Planner', 
        itemDesc: `${modalGeneratePR.data.item} (${modalGeneratePR.data.sku}) - ${modalGeneratePR.data.requiredQty} ${modalGeneratePR.data.uom}`, 
        estCost: modalGeneratePR.data.requiredQty * 150000, // Dummy estimation
        date: new Date().toLocaleDateString('en-GB'), 
        status: 'Pending Approval' 
      };
      // Jika di masa depan procurement.jsx membaca state ini, data sudah tersambung
      window.localStorage.setItem('requisitionsData_ARUS', JSON.stringify([newPR, ...existingPRs]));
    } catch (e) {
      console.warn("Storage sync skipped", e);
    }
    
    addToast(`Supply Plan ${modalGeneratePR.data.id} successfully escalated to Procurement as a Purchase Requisition.`, 'success');
    setModalGeneratePR({ isOpen: false, data: null });
  };

  // Safety Stock Handlers
  const handleExecuteRecalc = (algorithm) => {
    setModalRecalc(false);
    addToast(`Applying [${algorithm}] Safety Algorithm across all SKUs...`, 'info');
    setTimeout(() => {
      setSafetyStocks(prev => prev.map(ss => {
        if(ss.sku === 'SKU-ARS-MCU03') {
          // Recalculating based on algorithm
          const multiplier = algorithm === 'Aggressive' ? 1.5 : 1.0;
          const newCalcSS = Math.round(((ss.maxDaily * ss.maxLT) - (ss.avgDaily * ss.avgLT)) * multiplier);
          const newROP = Math.round((ss.avgDaily * ss.avgLT) + newCalcSS);
          return { ...ss, calculatedSS: newCalcSS, reorderPoint: newROP, status: 'Optimal', currentStock: 1600 };
        }
        return ss;
      }));
      addToast('Safety Stock targets recalibrated & synchronized with Inventory DB.', 'success');
    }, 1500);
  };

  const handleSaveSSAdjustment = (e) => {
    e.preventDefault();
    const { avgDaily, maxDaily, avgLT, maxLT } = modalAdjustSS.data;
    // Formula Standard: (Max Daily * Max LT) - (Avg Daily * Avg LT)
    const calcSS = (maxDaily * maxLT) - (avgDaily * avgLT);
    const newROP = (avgDaily * avgLT) + (calcSS > 0 ? calcSS : 0);
    
    setSafetyStocks(prev => prev.map(s => s.sku === modalAdjustSS.data.sku ? { ...modalAdjustSS.data, calculatedSS: calcSS > 0 ? calcSS : 0, reorderPoint: newROP, status: 'Optimal' } : s));
    addToast(`Lead Time & Demand metrics updated for ${modalAdjustSS.data.sku}. New Reorder Point is ${newROP}.`, 'success');
    setModalAdjustSS({ isOpen: false, data: null });
  };

  // ─── EXPORT TELEMETRY (DYNAMIC BASED ON ACTIVE TAB) ───
  const handleExportCSV = () => {
    addToast(`Compiling ${activeTab} Data Model for Export...`, 'info');
    let headers = [];
    let csvRows = [];

    if (activeTab === 'DEMAND') {
      headers = ['Forecast_ID', 'SKU', 'Item_Description', 'Prev_Period_Volume', 'Projected_Forecast', 'Trend', 'Variance', 'Confidence_Score', 'Notes'];
      csvRows = [headers.join(',')];
      demandPlans.forEach(p => {
        csvRows.push([p.id, p.sku, `"${p.item}"`, p.prevPeriod, p.forecast, p.trend, `"${p.variance}"`, p.confidence, `"${p.notes}"`].join(','));
      });
    } else if (activeTab === 'SUPPLY') {
      headers = ['Plan_ID', 'SKU', 'Item_Description', 'Required_Qty', 'UOM', 'Target_Supplier', 'Required_By_Date', 'Status'];
      csvRows = [headers.join(',')];
      supplyPlans.forEach(p => {
        csvRows.push([p.id, p.sku, `"${p.item}"`, p.requiredQty, p.uom, `"${p.supplier}"`, p.reqDate, p.status].join(','));
      });
    } else {
      headers = ['SKU', 'Item_Description', 'Avg_Daily_Demand', 'Max_Daily_Demand', 'Avg_LeadTime', 'Max_LeadTime', 'Current_Stock', 'Calculated_SafetyStock', 'Reorder_Point_ROP', 'Health_Status'];
      csvRows = [headers.join(',')];
      safetyStocks.forEach(p => {
        csvRows.push([p.sku, `"${p.item}"`, p.avgDaily, p.maxDaily, p.avgLT, p.maxLT, p.currentStock, p.calculatedSS, p.reorderPoint, p.status].join(','));
      });
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `ARUS_${activeTab}_Analytics_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => addToast(`${activeTab} Dataset Exported Successfully!`, 'success'), 800);
  };


  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 animate-fade-in">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>📈 Planning</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">MRP Engine</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide">
            {bahasa === 'en' ? 'Demand Planning & MRP Analytics' : 'Perencanaan Permintaan & Analitik MRP'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">Forecast EV components demand, generate supply plans, and calculate optimal safety stock formulas.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button onClick={handleExportCSV} className="bg-gray-800 hover:bg-black text-white px-5 py-2.5 rounded-sm text-xs font-bold transition-colors shadow-sm uppercase tracking-wider flex items-center justify-center gap-2 w-full md:w-auto">
            <span>⭳</span> Export Analytics
          </button>
        </div>
      </div>

      {/* TABS (SYNCED WITH NAVBAR) */}
      <div className="bg-gray-100 p-1 rounded-sm shadow-inner flex overflow-x-auto border border-gray-300 mb-6 w-full lg:w-max">
        <button onClick={() => handleTabClick('DEMAND', 'demandPlans')} className={`px-5 py-2.5 text-xs font-bold uppercase transition-all rounded-sm whitespace-nowrap ${activeTab === 'DEMAND' ? 'bg-[#415a77] text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}>
          Item Demand Forecast
        </button>
        <button onClick={() => handleTabClick('SUPPLY', 'demandSupply')} className={`px-5 py-2.5 text-xs font-bold uppercase transition-all rounded-sm whitespace-nowrap ${activeTab === 'SUPPLY' ? 'bg-[#415a77] text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}>
          Procurement Supply Plans
        </button>
        <button onClick={() => handleTabClick('SAFETY', 'demandSafety')} className={`px-5 py-2.5 text-xs font-bold uppercase transition-all rounded-sm whitespace-nowrap ${activeTab === 'SAFETY' ? 'bg-[#415a77] text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}>
          Safety Stock Engine
        </button>
      </div>

      {/* ── TAB 1: DEMAND PLANS ── */}
      {activeTab === 'DEMAND' && (
        <div className="bg-white border border-gray-300 shadow-sm rounded-sm animate-fade-in flex flex-col overflow-hidden hover:shadow-md transition-shadow">
          <div className="bg-slate-50 border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-xs uppercase text-gray-700 tracking-wider">Demand Forecasting Pipeline</h3>
              <p className="text-[10px] text-gray-500 font-semibold mt-0.5">Projected EV component outbound volume based on historical sales and B2B market inputs.</p>
            </div>
            <button onClick={() => setModalImport(true)} className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-5 py-2.5 rounded-sm text-[10px] font-bold uppercase shadow-sm transition-colors w-full sm:w-auto flex items-center justify-center gap-2">
              <span>⬇️</span> Import Market Forecast
            </button>
          </div>
          <div className="p-0 overflow-x-auto flex-1">
            <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
              <thead className="bg-[#f8f9fa] text-[#64748b] text-[10px] uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-6 border-b w-40">Forecast ID</th>
                  <th className="py-3 px-6 border-b">Component Details</th>
                  <th className="py-3 px-6 border-b text-right w-40">Prev Period Vol</th>
                  <th className="py-3 px-6 border-b text-right w-40">Projected Demand</th>
                  <th className="py-3 px-6 border-b text-center w-36">Trend / Variance</th>
                  <th className="py-3 px-6 border-b text-center w-32">Action</th>
                </tr>
              </thead>
              <tbody className="text-[12px] text-gray-700">
                {demandPlans.map((plan, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-blue-50/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-black font-mono text-[#125ab2] cursor-pointer hover:underline" onClick={() => setModalAdjustDemand({ isOpen: true, data: plan })}>{plan.id}</div>
                      <div className={`mt-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm inline-block border ${plan.confidence >= 90 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'}`}>
                        Conf: {plan.confidence}%
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-gray-900 text-[13px]">{plan.item}</div>
                      <div className="text-[10px] font-mono text-gray-500 mt-1">{plan.sku}</div>
                      <div className="text-[10px] text-gray-500 italic mt-1.5 truncate max-w-[250px] border-l-2 border-gray-300 pl-2" title={plan.notes}>"{plan.notes}"</div>
                    </td>
                    <td className="py-4 px-6 text-right font-mono font-semibold text-gray-600 text-[13px]">{plan.prevPeriod.toLocaleString()}</td>
                    <td className="py-4 px-6 text-right font-mono font-black text-[#125ab2] text-sm bg-blue-50/50">{plan.forecast.toLocaleString()}</td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {plan.trend === 'up' && <span className="text-emerald-600 text-sm font-black">↑</span>}
                        {plan.trend === 'down' && <span className="text-red-600 text-sm font-black">↓</span>}
                        {plan.trend === 'flat' && <span className="text-gray-400 text-sm font-black">→</span>}
                        <span className={`font-bold ${plan.trend === 'up' ? 'text-emerald-600' : plan.trend === 'down' ? 'text-red-600' : 'text-gray-500'}`}>{plan.variance}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button onClick={() => setModalAdjustDemand({ isOpen: true, data: plan })} className="bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm w-full">
                        Adjust
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: SUPPLY PLANS ── */}
      {activeTab === 'SUPPLY' && (
        <div className="bg-white border border-gray-300 shadow-sm rounded-sm animate-fade-in flex flex-col overflow-hidden hover:shadow-md transition-shadow">
          <div className="bg-slate-50 border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-xs uppercase text-gray-700 tracking-wider">Procurement Supply Plans</h3>
              <p className="text-[10px] text-gray-500 font-semibold mt-0.5">Procurement triggers generated automatically to meet Projected Demand minus Current Stock.</p>
            </div>
            <button onClick={() => setModalSync(true)} className="bg-gray-800 hover:bg-black text-white px-5 py-2.5 rounded-sm text-[10px] font-bold uppercase shadow-sm transition-colors flex items-center justify-center gap-2 w-full sm:w-auto tracking-wider">
              <span>🔄</span> Sync MRP Engine
            </button>
          </div>
          <div className="p-0 overflow-x-auto flex-1">
            <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
              <thead className="bg-[#f8f9fa] text-[#64748b] text-[10px] uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-6 border-b w-36">Plan ID</th>
                  <th className="py-3 px-6 border-b">SKU / Component Details</th>
                  <th className="py-3 px-6 border-b text-right w-40">Required Order Qty</th>
                  <th className="py-3 px-6 border-b w-64">Suggested Vendor</th>
                  <th className="py-3 px-6 border-b text-center w-36">Required By Date</th>
                  <th className="py-3 px-6 border-b text-center w-40">Execution Status</th>
                </tr>
              </thead>
              <tbody className="text-[12px] text-gray-700">
                {supplyPlans.map((sp, i) => (
                  <tr key={i} className={`border-b border-gray-100 transition-colors ${sp.status === 'Converted to PR' ? 'bg-gray-50 opacity-70 grayscale' : 'hover:bg-blue-50/40'}`}>
                    <td className="py-4 px-6">
                      <div onClick={() => setModalSupplyDetail({ isOpen: true, data: sp })} className="font-mono font-black text-[#125ab2] cursor-pointer hover:underline w-max text-[13px]">
                        {sp.id}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-gray-900">{sp.item}</div>
                      <div className="text-[10px] font-mono font-semibold text-gray-500 mt-0.5">{sp.sku}</div>
                    </td>
                    <td className="py-4 px-6 text-right font-mono font-black text-amber-600 text-sm bg-amber-50/50">
                      {sp.requiredQty.toLocaleString()} <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{sp.uom}</span>
                    </td>
                    <td className="py-4 px-6 font-bold text-gray-700 truncate max-w-[200px]" title={sp.supplier}>{sp.supplier}</td>
                    <td className="py-4 px-6 text-center font-bold text-gray-800">{sp.reqDate}</td>
                    <td className="py-4 px-6 text-center">
                      {sp.status === 'Pending Review' ? (
                        <button onClick={() => setModalGeneratePR({ isOpen: true, data: sp })} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-sm text-[9px] font-bold uppercase tracking-wider shadow-sm transition-colors w-full">
                          Escalate to PR
                        </button>
                      ) : (
                        <span className="bg-gray-100 text-gray-500 border border-gray-200 px-3 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-wider shadow-sm inline-block whitespace-nowrap">
                          {sp.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: SAFETY STOCK CALCULATIONS ── */}
      {activeTab === 'SAFETY' && (
        <div className="bg-white border border-gray-300 shadow-sm rounded-sm animate-fade-in flex flex-col overflow-hidden hover:shadow-md transition-shadow">
          <div className="bg-slate-50 border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-xs uppercase text-gray-800 tracking-wider">Algorithmic Safety Stock & Reorder Points</h3>
              <p className="text-[10px] text-gray-500 font-semibold mt-1">Calculated using: (Max Daily Demand × Max Lead Time) - (Avg Daily Demand × Avg Lead Time).</p>
            </div>
            <button onClick={() => setModalRecalc(true)} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-sm text-[10px] font-bold uppercase shadow-sm transition-colors flex items-center justify-center gap-2 w-full sm:w-auto tracking-wider">
              <span>🤖</span> Recalculate AI Parameters
            </button>
          </div>
          <div className="p-0 overflow-x-auto flex-1">
            <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
              <thead className="bg-[#f8f9fa] text-[#64748b] text-[10px] uppercase tracking-wider border-b-2 border-gray-200">
                <tr>
                  <th className="py-3 px-6 border-r border-gray-200" colSpan="2">Item Specification</th>
                  <th className="py-3 px-4 border-r border-gray-200 text-center bg-blue-50/50" colSpan="2">Demand Vol (Daily)</th>
                  <th className="py-3 px-4 border-r border-gray-200 text-center bg-amber-50/50" colSpan="2">Lead Time (Days)</th>
                  <th className="py-3 px-6 text-center" colSpan="4">Output Metric Matrix</th>
                </tr>
                <tr className="bg-gray-50 text-[9px] text-gray-500 border-b border-gray-200">
                  <th className="py-2.5 px-6 border-r border-gray-200 font-bold">SKU ID</th>
                  <th className="py-2.5 px-6 border-r border-gray-200 font-bold">Description</th>
                  <th className="py-2.5 px-4 border-r border-gray-200 text-center font-bold">Avg</th>
                  <th className="py-2.5 px-4 border-r border-gray-200 text-center font-bold">Max</th>
                  <th className="py-2.5 px-4 border-r border-gray-200 text-center font-bold">Avg</th>
                  <th className="py-2.5 px-4 border-r border-gray-200 text-center font-bold">Max</th>
                  <th className="py-2.5 px-6 border-r border-gray-200 text-right font-bold text-gray-700">Calculated SS</th>
                  <th className="py-2.5 px-6 border-r border-gray-200 text-right font-bold text-purple-700">System ROP</th>
                  <th className="py-2.5 px-4 border-r border-gray-200 text-center font-bold">Health Check</th>
                  <th className="py-2.5 px-4 text-center font-bold w-20">Tune</th>
                </tr>
              </thead>
              <tbody className="text-[12px] text-gray-700">
                {safetyStocks.map((ss, i) => (
                  <tr key={i} className={`border-b border-gray-100 transition-colors ${ss.status === 'Critical' ? 'bg-red-50/30 hover:bg-red-50' : ss.status === 'Warning' ? 'bg-amber-50/30 hover:bg-amber-50' : 'hover:bg-blue-50/40'}`}>
                    <td className="py-4 px-6 font-mono font-black text-[#125ab2] border-r border-gray-100 cursor-pointer hover:underline text-[13px]" onClick={() => setModalAdjustSS({ isOpen: true, data: ss })}>{ss.sku}</td>
                    <td className="py-4 px-6 font-bold text-gray-900 border-r border-gray-100">{ss.item}</td>
                    
                    <td className="py-4 px-4 text-center font-mono font-semibold border-r border-gray-100">{ss.avgDaily}</td>
                    <td className="py-4 px-4 text-center font-mono font-semibold text-gray-400 border-r border-gray-100">{ss.maxDaily}</td>
                    
                    <td className="py-4 px-4 text-center font-mono font-semibold border-r border-gray-100">{ss.avgLT}</td>
                    <td className="py-4 px-4 text-center font-mono font-semibold text-gray-400 border-r border-gray-100">{ss.maxLT}</td>
                    
                    <td className="py-4 px-6 text-right font-mono font-black text-gray-800 text-sm border-r border-gray-100">{ss.calculatedSS.toLocaleString()}</td>
                    <td className="py-4 px-6 text-right font-mono font-black text-purple-700 text-[15px] border-r border-gray-100 bg-purple-50/30 shadow-inner">{ss.reorderPoint.toLocaleString()}</td>
                    
                    <td className="py-4 px-4 text-center border-r border-gray-100">
                      <div className="flex flex-col items-center">
                        <span className={`px-2.5 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-wider border shadow-sm ${
                          ss.status === 'Optimal' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                          ss.status === 'Warning' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                          'bg-red-600 text-white border-red-700 animate-pulse'
                        }`}>
                          {ss.status}
                        </span>
                        <span className="text-[9px] font-bold text-gray-500 mt-1.5 tracking-wider uppercase">Stock: <span className={ss.currentStock < ss.calculatedSS ? 'text-red-600' : 'text-gray-800'}>{ss.currentStock.toLocaleString()}</span></span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button onClick={() => setModalAdjustSS({ isOpen: true, data: ss })} className="text-gray-400 hover:text-[#125ab2] bg-white border border-gray-200 hover:border-[#125ab2] px-3 py-1.5 rounded-sm transition-colors shadow-sm text-sm" title="Edit Parameters">
                        ⚙️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          DYNAMIC BULLETPROOF MODALS SECTION
      ═══════════════════════════════════════════════════ */}

      {/* Modal 1: Import Sales Forecast */}
      {modalImport && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[500px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-[#125ab2]" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            <div className="px-6 py-4 flex justify-between items-center bg-blue-50 border-b border-blue-100 shrink-0 z-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-gray-500">Data Integration</p>
                <h3 className="font-black text-sm uppercase tracking-wider text-[#125ab2]">Import Market Forecast</h3>
              </div>
              <button onClick={() => setModalImport(false)} className="text-gray-400 hover:text-gray-800 font-bold text-xl leading-none px-2">✕</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0">
              <p className="text-xs font-semibold text-gray-600 mb-4 leading-relaxed">Upload CSV telemetry from CRM, Marketing, or B2B Dealership network to update volume projections.</p>
              <div className="border-2 border-dashed border-[#125ab2] bg-blue-50/50 p-10 text-center rounded-sm cursor-pointer hover:bg-blue-50 transition-colors">
                <span className="text-5xl block mb-3 opacity-80">📄</span>
                <p className="text-xs font-black text-[#125ab2] mt-3 uppercase tracking-widest">Drag & Drop CSV File Here</p>
                <p className="text-[10px] text-gray-500 font-bold mt-2 uppercase tracking-wider">Max file size: 10MB</p>
              </div>
            </div>
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end shrink-0 z-10">
              <button onClick={handleImportForecast} className="w-full bg-[#125ab2] hover:bg-[#0e4487] text-white px-6 py-3 text-[10px] font-bold uppercase tracking-wider rounded-sm shadow-sm transition-colors">
                Simulate Upload & Parse Telemetry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Adjust Demand Forecast */}
      {modalAdjustDemand.isOpen && modalAdjustDemand.data && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[500px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-[#415a77]" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            <div className="px-6 py-4 flex justify-between items-center text-white bg-[#415a77] shrink-0 z-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 opacity-80">Forecast Editor</p>
                <h3 className="font-black text-sm uppercase tracking-wider">{modalAdjustDemand.data.id}</h3>
              </div>
              <button onClick={() => setModalAdjustDemand({ isOpen: false, data: null })} className="text-white opacity-70 hover:opacity-100 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <form onSubmit={handleSaveDemandAdjustment} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 space-y-5">
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-sm shadow-inner">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Target EV Component</p>
                  <p className="font-black text-gray-900 text-base leading-tight">{modalAdjustDemand.data.item}</p>
                  <p className="font-mono text-[#125ab2] font-bold text-xs mt-1 border-t border-gray-200 pt-2">{modalAdjustDemand.data.sku}</p>
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Projected Demand Volume <span className="text-red-500">*</span></label>
                  <input type="number" value={modalAdjustDemand.data.forecast} onChange={e => setModalAdjustDemand({ ...modalAdjustDemand, data: { ...modalAdjustDemand.data, forecast: Number(e.target.value) }})} className="w-full border border-gray-300 p-2.5 text-lg font-black font-mono text-[#125ab2] rounded-sm outline-none focus:border-[#125ab2] focus:ring-1 focus:ring-[#125ab2]" required/>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Trend Direction</label>
                    <select value={modalAdjustDemand.data.trend} onChange={e => setModalAdjustDemand({ ...modalAdjustDemand, data: { ...modalAdjustDemand.data, trend: e.target.value }})} className="w-full border border-gray-300 p-2.5 text-xs font-bold text-gray-800 bg-white rounded-sm outline-none focus:border-[#125ab2]">
                      <option value="up">↑ Upward Spike</option>
                      <option value="down">↓ Downward Dip</option>
                      <option value="flat">→ Flat / Stable</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Confidence Score (%)</label>
                    <input type="number" value={modalAdjustDemand.data.confidence} onChange={e => setModalAdjustDemand({ ...modalAdjustDemand, data: { ...modalAdjustDemand.data, confidence: Number(e.target.value) }})} className="w-full border border-gray-300 p-2.5 text-sm font-bold text-gray-800 rounded-sm outline-none focus:border-[#125ab2]" max="100" min="0" required/>
                  </div>
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Analyst Notes / Business Context</label>
                  <textarea value={modalAdjustDemand.data.notes} onChange={e => setModalAdjustDemand({ ...modalAdjustDemand, data: { ...modalAdjustDemand.data, notes: e.target.value }})} className="w-full border border-gray-300 p-2.5 text-xs font-semibold text-gray-700 rounded-sm outline-none focus:border-[#125ab2] resize-none" rows="3" required/>
                </div>
              </div>
              
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 shrink-0 z-10">
                <button type="button" onClick={() => setModalAdjustDemand({ isOpen: false, data: null })} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-sm text-[10px] font-bold uppercase tracking-wider hover:bg-gray-100 transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-[#125ab2] hover:bg-[#0e4487] text-white rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors">Save Tuning</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Sync Supply Engine */}
      {modalSync && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[500px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-gray-900" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            <div className="px-6 py-4 flex justify-between items-center bg-gray-50 border-b border-gray-200 shrink-0 z-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-gray-500">Reconciliation Engine</p>
                <h3 className="font-black text-sm uppercase tracking-wider text-gray-900">Sync MRP Supply Plan</h3>
              </div>
              <button onClick={() => setModalSync(false)} className="text-gray-400 hover:text-gray-800 font-bold text-xl leading-none px-2">✕</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0">
              <p className="text-xs text-gray-600 font-medium leading-relaxed mb-5">
                The MRP Engine will now cross-reference <strong>Projected Demand Forecasts</strong> against <strong>Current On-Hand Inventory</strong> and <strong>Safety Stock Thresholds</strong>.
              </p>
              <div className="bg-blue-50 border border-blue-200 p-5 rounded-sm text-center shadow-inner">
                <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-2 border-b border-blue-200 pb-2">Pre-Flight Diagnostic:</p>
                <p className="text-sm font-semibold text-blue-900 mt-3">Detected <span className="font-black text-red-600 text-xl mx-1">1</span> critical EV component where projected demand exceeds current safety buffers.</p>
              </div>
            </div>
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 shrink-0 z-10">
              <button onClick={handleExecuteSync} className="w-full bg-gray-900 hover:bg-black text-white px-4 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-sm shadow-md transition-colors flex justify-center items-center gap-2">
                <span>🔄</span> Execute Sync & Auto-Generate Plans
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Generate PR Confirmation */}
      {modalGeneratePR.isOpen && modalGeneratePR.data && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[500px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-emerald-600" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            <div className="px-6 py-4 flex justify-between items-center text-white bg-emerald-600 shrink-0 z-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 opacity-90">Procurement Escalation</p>
                <h3 className="font-black text-sm uppercase tracking-wider">Generate Formal PR</h3>
              </div>
              <button onClick={() => setModalGeneratePR({ isOpen: false, data: null })} className="text-white opacity-70 hover:opacity-100 font-bold text-xl leading-none px-2">✕</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 space-y-5">
              <p className="text-xs text-gray-700 font-medium leading-relaxed">
                You are about to convert Supply Plan <strong className="font-mono text-[#125ab2]">{modalGeneratePR.data.id}</strong> into a formal Purchase Requisition (PR) to trigger the purchasing pipeline.
              </p>
              
              <div className="bg-gray-50 border border-gray-200 p-5 rounded-sm space-y-3 shadow-inner">
                <div className="grid grid-cols-[100px_1fr] gap-2 items-center text-sm border-b border-gray-200 pb-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Target Component</span>
                  <span className="font-black text-gray-900 leading-tight">{modalGeneratePR.data.item}</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-2 items-center text-sm border-b border-gray-200 pb-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Order Qty</span>
                  <span className="font-black font-mono text-amber-600 text-lg">{modalGeneratePR.data.requiredQty.toLocaleString()} <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{modalGeneratePR.data.uom}</span></span>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-2 items-center text-sm border-b border-gray-200 pb-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Required By</span>
                  <span className="font-bold text-gray-800">{modalGeneratePR.data.reqDate}</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-2 items-start text-sm pt-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">Suggested Vendor</span>
                  <span className="font-bold text-[#125ab2] bg-blue-50 px-2 py-1 rounded-sm border border-blue-100">{modalGeneratePR.data.supplier}</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 shrink-0 z-10">
              <button onClick={() => setModalGeneratePR({ isOpen: false, data: null })} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm w-full sm:w-auto">Cancel</button>
              <button onClick={handleConfirmPR} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors w-full sm:w-auto flex items-center justify-center gap-2">
                <span>✓</span> Confirm & Submit PR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Recalculate Safety Stock Menu */}
      {modalRecalc && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[550px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-purple-700" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            <div className="px-6 py-4 flex justify-between items-center bg-purple-50 border-b border-purple-200 shrink-0 z-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-purple-700">Safety Stock Engine</p>
                <h3 className="font-black text-sm uppercase tracking-wider text-purple-900">Algorithmic Recalibration</h3>
              </div>
              <button onClick={() => setModalRecalc(false)} className="text-gray-400 hover:text-gray-800 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 space-y-4">
              <p className="text-xs text-gray-600 font-medium leading-relaxed mb-2">Select the predictive model to recalibrate Safety Stock (SS) and Reorder Points (ROP) for all EV components.</p>
              
              <div onClick={() => handleExecuteRecalc('Standard')} className="border-2 border-gray-200 p-5 rounded-sm cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all shadow-sm group">
                <h4 className="font-black text-sm text-gray-800 mb-1 group-hover:text-purple-800">Standard / Balanced Model</h4>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">Uses 30-day historical averages. Balances stockout risk with holding costs. Recommended for stable, non-critical mechanical parts.</p>
              </div>

              <div onClick={() => handleExecuteRecalc('Aggressive')} className="border-2 border-gray-200 p-5 rounded-sm cursor-pointer hover:border-red-500 hover:bg-red-50 transition-all shadow-sm group">
                <h4 className="font-black text-sm text-red-700 mb-1 flex items-center gap-2"><span>🛡️</span> Aggressive Model (High Service Level)</h4>
                <p className="text-xs text-gray-600 font-medium leading-relaxed">Heavily weights maximum observed demand & maximum supplier lead times. Increases capital holding costs but guarantees 99.9% assembly line availability for critical items (e.g., Batteries, MCU).</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 6: Adjust Individual Safety Stock Params */}
      {modalAdjustSS.isOpen && modalAdjustSS.data && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[550px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-purple-700" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            <div className="px-6 py-4 flex justify-between items-center text-white bg-purple-700 shrink-0 z-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 opacity-80">Manual Calibration</p>
                <h3 className="font-black text-sm uppercase tracking-wider">Override SS Params: {modalAdjustSS.data.sku}</h3>
              </div>
              <button onClick={() => setModalAdjustSS({ isOpen: false, data: null })} className="text-white opacity-70 hover:opacity-100 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <form onSubmit={handleSaveSSAdjustment} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 space-y-5">
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-sm shadow-inner">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Target Component</p>
                  <p className="font-black text-gray-900 text-base leading-tight">{modalAdjustSS.data.item}</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* DEMAND VARS */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-[#125ab2] uppercase tracking-wider border-b border-gray-200 pb-2">Demand Vol (Daily)</h4>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Average Demand <span className="text-red-500">*</span></label>
                      <input type="number" min="0" value={modalAdjustSS.data.avgDaily} onChange={e => setModalAdjustSS({ ...modalAdjustSS, data: { ...modalAdjustSS.data, avgDaily: Number(e.target.value) }})} className="w-full border border-gray-300 p-2.5 text-sm font-mono font-bold rounded-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" required/>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Max Spiked Demand <span className="text-red-500">*</span></label>
                      <input type="number" min="0" value={modalAdjustSS.data.maxDaily} onChange={e => setModalAdjustSS({ ...modalAdjustSS, data: { ...modalAdjustSS.data, maxDaily: Number(e.target.value) }})} className="w-full border border-gray-300 p-2.5 text-sm font-mono font-black text-[#125ab2] bg-blue-50/50 rounded-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" required/>
                    </div>
                  </div>

                  {/* LEAD TIME VARS */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-wider border-b border-gray-200 pb-2">Lead Time (Days)</h4>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Average Lead Time <span className="text-red-500">*</span></label>
                      <input type="number" min="1" value={modalAdjustSS.data.avgLT} onChange={e => setModalAdjustSS({ ...modalAdjustSS, data: { ...modalAdjustSS.data, avgLT: Number(e.target.value) }})} className="w-full border border-gray-300 p-2.5 text-sm font-mono font-bold rounded-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" required/>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Max Delayed LT <span className="text-red-500">*</span></label>
                      <input type="number" min="1" value={modalAdjustSS.data.maxLT} onChange={e => setModalAdjustSS({ ...modalAdjustSS, data: { ...modalAdjustSS.data, maxLT: Number(e.target.value) }})} className="w-full border border-gray-300 p-2.5 text-sm font-mono font-black text-amber-600 bg-amber-50/50 rounded-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" required/>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 border border-purple-200 rounded-sm text-[10px] font-bold text-purple-900 flex items-start gap-2 shadow-inner">
                  <span className="text-base leading-none">💡</span>
                  <p className="leading-relaxed">New Safety Stock and Reorder Point (ROP) parameters will be automatically calculated and applied to the database upon saving.</p>
                </div>

              </div>
              
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 shrink-0 z-10">
                <button type="button" onClick={() => setModalAdjustSS({ isOpen: false, data: null })} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-sm text-[10px] font-bold uppercase tracking-wider hover:bg-gray-100 transition-colors shadow-sm">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors">Save & Recalibrate Component</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FITUR BARU: Modal 7: Supply Plan Details Drill-down */}
      {modalSupplyDetail.isOpen && modalSupplyDetail.data && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[500px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-[#125ab2]" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            <div className="px-6 py-4 flex justify-between items-center text-white bg-[#415a77] shrink-0 z-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 opacity-80">Supply Plan Execution</p>
                <h3 className="font-black text-sm uppercase tracking-wider">{modalSupplyDetail.data.id}</h3>
              </div>
              <button onClick={() => setModalSupplyDetail({ isOpen: false, data: null })} className="text-white opacity-70 hover:opacity-100 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 space-y-5 text-sm text-gray-800">
              
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-sm shadow-inner">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Target Component / SKU</p>
                <p className="font-black text-gray-900 text-base leading-tight mb-1">{modalSupplyDetail.data.item}</p>
                <p className="font-mono text-[11px] font-bold text-[#125ab2] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-sm inline-block">{modalSupplyDetail.data.sku}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-gray-200 pb-5">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Suggested Vendor</p>
                  <p className="font-black text-gray-800 text-[13px] leading-snug">{modalSupplyDetail.data.supplier}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Required By Date</p>
                  <p className="font-bold text-gray-800 bg-gray-100 border border-gray-300 px-2 py-1 rounded-sm w-max">{modalSupplyDetail.data.reqDate}</p>
                </div>
              </div>

              <div className="border-2 border-amber-200 bg-amber-50 p-5 rounded-sm flex justify-between items-center shadow-sm">
                <div>
                  <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-1">Target Order Volume</p>
                  <p className="text-[10px] text-amber-700 font-semibold max-w-[200px] leading-relaxed">Calculated to meet forecasted demand while securing Safety Stock parameters.</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-amber-600 font-mono">{modalSupplyDetail.data.requiredQty.toLocaleString()}</p>
                  <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider">{modalSupplyDetail.data.uom}</p>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center">
                 <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">System Action Status</span>
                 <span className={`px-3 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-wider border shadow-sm ${
                   modalSupplyDetail.data.status === 'Converted to PR' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-gray-100 text-gray-600 border-gray-300'
                 }`}>
                   {modalSupplyDetail.data.status}
                 </span>
              </div>

            </div>
            
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 shrink-0 z-10">
              <button onClick={() => setModalSupplyDetail({ isOpen: false, data: null })} className="w-full sm:w-auto px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-sm text-[10px] font-bold uppercase tracking-wider hover:bg-gray-100 transition-colors shadow-sm">Close Detail</button>
              {modalSupplyDetail.data.status === 'Pending Review' && (
                <button onClick={() => {
                  setModalSupplyDetail({ isOpen: false, data: null });
                  setModalGeneratePR({ isOpen: true, data: modalSupplyDetail.data });
                }} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors flex items-center justify-center gap-2">
                  <span>➡️</span> Escalate to PR
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </main>
  );
};

export default DemandPlanning;