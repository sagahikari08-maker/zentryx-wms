import React, { useState, useContext, useMemo, useEffect } from 'react';
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

const SupplyChainDashboard = () => {
  // ─── 🚀 INJEKSI: Mengambil Urat Nadi Data Global + RBAC + Interlock ───
  const { bahasa, poData, inventoryData, user, setPoData, setTaskData } = useContext(AppContext);

  // ─── STATE EMERGENCY OVERRIDE ───
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchLog, setDispatchLog] = useState(null);

  // 1. DATA PERFORMA SUPPLIER (EV COMPONENTS)
  const initialSuppliers = [
    { id: 'VEN-CATL-01', name: 'Contemporary Amperex Tech (CATL)', item: 'LFP Battery Cell 3.2V', leadTimeAvg: 22.5, leadTimeTarget: 21.0, onTimeDelivery: 92, status: 'Warning', safetyStock: 'Standard', baseDefect: 1 },
    { id: 'VEN-BSCH-02', name: 'Bosch Automotive Electronics', item: 'Motor Control Unit (MCU)', leadTimeAvg: 14.2, leadTimeTarget: 14.0, onTimeDelivery: 98, status: 'Excellent', safetyStock: 'Standard', baseDefect: 5 },
    { id: 'VEN-APTV-03', name: 'Aptiv Wiring Systems', item: 'HV Harness Cable 50mm2', leadTimeAvg: 6.5, leadTimeTarget: 7.0, onTimeDelivery: 96, status: 'Good', safetyStock: 'Standard', baseDefect: 2 },
    { id: 'VEN-KS-04', name: 'Krakatau Steel (Automotive)', item: 'Underbody Steel Chassis', leadTimeAvg: 8.5, leadTimeTarget: 5.0, onTimeDelivery: 75, status: 'Critical', safetyStock: 'Standard', baseDefect: 12 }
  ];

  const [supplierData, setSupplierData] = useState(() => {
    try {
      const saved = window.localStorage.getItem('scmData_ARUS');
      return saved ? JSON.parse(saved) : initialSuppliers;
    } catch {
      return initialSuppliers;
    }
  });

  // ─── PEMBERSIH DATA LAMA ───
  useEffect(() => {
    const hasOldData = supplierData.some(v => v.name.includes('Dough') || v.id.includes('VEN-01'));
    if (hasOldData) setSupplierData(initialSuppliers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('scmData_ARUS', JSON.stringify(supplierData));
    } catch (error) {
      console.error('Failed to save SCM data:', error);
    }
  }, [supplierData]);

  // ─── 🚀 ENGINE INTERLOCK: DYNAMIC KPI & VENDOR HEALTH DARI PO DATA ───
  const { dynamicKpis, dynamicSuppliers } = useMemo(() => {
    // A. Evaluasi Vendor Defects dari PO
    let totalPODefects = 0;
    const totalPOs = (poData || []).length || 1; // Hindari division by zero

    const updatedSuppliers = supplierData.map(v => {
      // Cari PO milik vendor ini yang bermasalah (Discrepancy / Hold)
      const vendorPOs = (poData || []).filter(po => po.vendor.includes(v.name) || v.name.includes(po.vendor));
      const defectPOs = vendorPOs.filter(po => po.discrepancy || po.status.includes('Hold')).length;
      totalPODefects += defectPOs;

      // Defect Rate naik 5% untuk setiap PO yang bermasalah
      const activeDefectRate = v.baseDefect + (defectPOs * 5);
      return { ...v, defectRate: Math.min(100, activeDefectRate) };
    });

    // B. Evaluasi Perfect Order Rate (OTIF)
    const poSuccessRate = ((totalPOs - totalPODefects) / totalPOs) * 100;
    const perfectOrderVal = totalPODefects > 0 ? poSuccessRate.toFixed(1) : 94.5;
    const perfectOrderTrend = totalPODefects > 0 ? `Dropped (Due to ${totalPODefects} Defect POs)` : '+0.8% (Up)';

    // C. Evaluasi Inventory Turnover (Dummy logic berdasarkan total qty)
    const totalInv = (inventoryData || []).reduce((sum, item) => sum + item.qty, 0);
    const turnoverVal = totalInv > 50000 ? 6.2 : totalInv > 20000 ? 8.4 : 11.5;

    const kpis = {
      orderCycleTime: { value: 14.2, unit: 'Days', target: 12.0, trend: '-1.5 days (Improved)' },
      perfectOrderRate: { value: perfectOrderVal, unit: '%', target: 98.0, trend: perfectOrderTrend },
      inventoryTurnover: { value: turnoverVal, unit: 'Turns/Yr', target: 10.0, trend: 'Dynamic Sync' },
      cashToCash: { value: 45, unit: 'Days', target: 40, trend: '-3 days (Healthy)' },
      resilienceScore: { value: 88, unit: '/100', target: 90, trend: 'Stable' }
    };

    return { dynamicKpis: kpis, dynamicSuppliers: updatedSuppliers };
  }, [supplierData, poData, inventoryData]);

  // 3. LIVE DISRUPTION RADAR (EV MACRO-ECONOMICS)
  const [disruptions] = useState([
    { id: 'D-ARS-001', type: 'Semiconductor Allocation Cut', location: 'Taiwan Foundry Hub', delayImpact: '+14 Days', severity: 'Critical', status: 'Active' },
    { id: 'D-ARS-002', type: 'Customs & Hazmat Clearance Delay', location: 'Tanjung Priok, JKT', delayImpact: '+3 Days', severity: 'Warning', status: 'Active' },
    { id: 'D-ARS-003', type: 'Lithium Raw Material Shortage', location: 'Global Spot Market', delayImpact: '+7 Days', severity: 'Critical', status: 'Monitoring' },
  ]);

  const [bottlenecks] = useState([
    { stage: 'Procurement (Sourcing & PO)', time: '4.2 Days', impact: 'Medium' },
    { stage: 'Global Transit (Ocean Freight)', time: '18.5 Days', impact: 'High' },
    { stage: 'Customs & Port Clearance', time: '5.0 Days', impact: 'High' },
    { stage: 'Battery Thermal Staging (Dwell)', time: '2.5 Days', impact: 'Medium' },
    { stage: 'Assembly Line Feed (JIT)', time: '0.8 Days', impact: 'Low' }
  ]);

  // 4. STATE UNTUK MODAL & SIMULATOR
  const [vendorModal, setVendorModal] = useState({ isOpen: false, data: null });
  const [simMode, setSimMode] = useState(false);
  const [simParams, setSimParams] = useState({ globalDelayDays: 0, otdDropPct: 0 });
  const [toasts, setToasts] = useState([]);

  // FUNGSI TOAST
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const calculateVendorScore = (otd, defectRate) => Math.max(0, Math.min(100, Math.round((otd * 0.7) + ((100 - defectRate) * 0.3))));

  // 5. ENGINE SIMULATOR WHAT-IF (CRISIS INJECTOR)
  const processedVendors = useMemo(() => {
    return dynamicSuppliers.map(v => {
      let currentOtd = v.onTimeDelivery;
      let currentStatus = v.status;
      
      if (simMode) {
        currentOtd = Math.max(0, currentOtd - parseInt(simParams.otdDropPct) - (parseInt(simParams.globalDelayDays) * 1.5));
      }

      if (v.status !== 'Probation') {
        const simScore = calculateVendorScore(currentOtd, v.defectRate);
        if (simScore < 70) currentStatus = 'Critical';
        else if (simScore < 85) currentStatus = 'Warning';
        else currentStatus = 'Excellent';
      }

      return { ...v, otd: parseFloat(currentOtd.toFixed(1)), systemStatus: currentStatus };
    });
  }, [dynamicSuppliers, simMode, simParams]);

  const displayKpis = useMemo(() => {
    if (!simMode) return dynamicKpis;

    const extraDelay = parseFloat(simParams.globalDelayDays);
    const dropOTD = parseFloat(simParams.otdDropPct);

    // Kalkulasi Dampak Simulasi Eksekutif
    const newCycleTime = (dynamicKpis.orderCycleTime.value + (extraDelay * 0.8)).toFixed(1);
    const newOTIF = (dynamicKpis.perfectOrderRate.value - (dropOTD * 0.6)).toFixed(1);
    const newC2C = Math.round(dynamicKpis.cashToCash.value + (extraDelay * 1.2));
    const newTurnover = (dynamicKpis.inventoryTurnover.value - (extraDelay * 0.15)).toFixed(1);
    
    // Resilience Score Drop
    const resiliencePenalty = (extraDelay * 1.5) + (dropOTD * 0.5);
    const newResilience = Math.max(0, Math.round(dynamicKpis.resilienceScore.value - resiliencePenalty));

    return {
      orderCycleTime: { ...dynamicKpis.orderCycleTime, value: newCycleTime, trend: 'SIMULATED CRISIS' },
      perfectOrderRate: { ...dynamicKpis.perfectOrderRate, value: newOTIF, trend: 'SIMULATED CRISIS' },
      inventoryTurnover: { ...dynamicKpis.inventoryTurnover, value: newTurnover, trend: 'SIMULATED CRISIS' },
      cashToCash: { ...dynamicKpis.cashToCash, value: newC2C, trend: 'SIMULATED CRISIS' },
      resilienceScore: { ...dynamicKpis.resilienceScore, value: newResilience, trend: 'SIMULATED CRISIS' }
    };
  }, [dynamicKpis, simMode, simParams]);

  // 6. FUNGSI MITIGASI VENDOR (EKSEKUSI NYATA)
  const handleIssueCAPA = (vendor) => {
    addToast(`Formal CAPA (Corrective Action) warning sent to ${vendor.name} executive management!`, 'info');
    setVendorModal({ isOpen: false, data: null });
  };

  const handleBoostSafetyStock = (vendor) => {
    setSupplierData(supplierData.map(v => v.id === vendor.id ? { ...v, safetyStock: '+20% Buffer Boosted' } : v));
    addToast(`EMERGENCY MITIGATION: Minimum Safety Stock for ${vendor.item} computationally increased by 20% to buffer against lead-time variance.`, 'error');
    setVendorModal({ isOpen: false, data: null });
  };

  const handleExportReport = () => {
    addToast('Compiling Supply Chain Executive Summary...', 'info');
    setTimeout(() => addToast('Executive Dashboard Exported Successfully!', 'success'), 1000);
  };

  // 7. 🚀 THE ULTIMATE EMERGENCY OVERRIDE
  const triggerE2EScenario = () => {
    setIsDispatching(true);

    // Simulasi jeda komputasi sistem
    setTimeout(() => {
      const uniqueId = Date.now().toString().slice(-4);
      const poId = `PO-EMER-${uniqueId}`;
      const taskId = `TSK-EMER-${uniqueId}`;

      // A. INJEKSI KE PROCUREMENT (Untuk Manager)
      if (setPoData) {
        setPoData(prev => [{
          id: poId, 
          vendor: 'Contemporary Amperex Tech (CATL)', 
          items: 'LFP Battery Cell 3.2V - 10,000 Pcs', 
          amount: 5500000000, 
          date: new Date().toISOString().split('T')[0], 
          status: 'Pending', 
          eta: 'URGENT (Same Day)', 
          discrepancy: null
        }, ...prev]);
      }

      // B. INJEKSI KE OPERATOR FLOOR (Terkunci oleh QA)
      if (setTaskData) {
        setTaskData(prev => [{
          id: taskId,
          type: 'Putaway',
          sku: 'BATT-LFP-75K',
          desc: 'Urgent Putaway: LFP Battery Cells (Requires QC)',
          qty: 10000,
          zone: 'ZONE-B-02',
          targetBin: 'ZONE-B-02',
          priority: 'Critical',
          status: 'Not Started',
          refId: poId, // Di-link ke PO
          isLocked: true, // 🔒 TERKUNCI! Operator tidak bisa scan sebelum QA lolos
          dependency: 'QA Clearance Required', // 🛡️ Memicu modul QualityInspection
          createdAt: new Date().toISOString()
        }, ...prev]);
      }

      setDispatchLog({ poId, taskId });
      setIsDispatching(false);
      addToast('Emergency Override Deployed successfully.', 'success');
    }, 1500);
  };

  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 animate-fade-in">
      <Toast toasts={toasts} removeToast={removeToast} />
      
      {/* ── HEADER DASHBOARD ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>🌍 Network</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Analytics</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide flex items-center gap-2">
            {bahasa === 'en' ? 'Supply Chain Command Center' : 'Pusat Komando Rantai Pasok'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">End-to-End macro visibility from Global Lead Times to Last-Mile Order Cycle metrics.</p>
        </div>
        
        {/* INTERACTIVE CONTROLS */}
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => {
              setSimMode(!simMode);
              if (!simMode) addToast('What-If Crisis Engine Activated! Adjust disruption sliders below.', 'info');
            }}
            className={`px-5 py-2.5 rounded-sm text-[11px] font-bold transition-all shadow-sm uppercase tracking-wider flex items-center gap-2 border ${
              simMode ? 'bg-purple-600 border-purple-700 text-white shadow-inner' : 'bg-white hover:bg-purple-50 text-purple-700 border-purple-300'
            }`}
          >
            <span>🔮</span> {simMode ? 'Close Simulator' : 'Crisis Simulator'}
          </button>
          <button onClick={handleExportReport} className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-5 py-2.5 rounded-sm text-[11px] font-bold transition-colors shadow-sm uppercase tracking-wider flex items-center gap-2">
            <span>⭳</span> Export Report
          </button>
        </div>
      </div>

      {/* ── 🔮 WHAT-IF SIMULATOR PANEL (Toggled) ── */}
      {simMode && (
        <div className="bg-purple-50 border-t-4 border-purple-600 shadow-lg rounded-sm p-6 mb-6 flex flex-col md:flex-row gap-8 items-center animate-fade-in">
          <div className="md:w-1/3">
            <h3 className="font-black text-purple-900 uppercase tracking-wider text-sm flex items-center gap-2 mb-2">
              <span>🔮</span> Macro Crisis Injector
            </h3>
            <p className="text-xs text-purple-800 leading-relaxed font-medium">Inject hypothetical geopolitical or logistical disruptions to foresee impacts on global ARUS Motors KPIs. Data is safely sandboxed.</p>
          </div>
          
          <div className="md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-8 w-full border-l border-purple-200 pl-8">
            <div className="space-y-2">
              <label className="flex justify-between text-[11px] font-black text-purple-900 uppercase tracking-wider">
                <span>Global Port/Transit Delay</span>
                <span className="bg-purple-200 px-2 py-0.5 rounded-sm text-purple-900 border border-purple-300">+{simParams.globalDelayDays} Days</span>
              </label>
              <input type="range" min="0" max="30" step="1" value={simParams.globalDelayDays} onChange={(e) => setSimParams({...simParams, globalDelayDays: e.target.value})} className="w-full accent-purple-700 cursor-pointer"/>
              <p className="text-[10px] text-purple-700 font-bold uppercase tracking-wider">Simulates macro congestion & weather events.</p>
            </div>
            <div className="space-y-2">
              <label className="flex justify-between text-[11px] font-black text-purple-900 uppercase tracking-wider">
                <span>Supplier Production Defect Rate</span>
                <span className="bg-purple-200 px-2 py-0.5 rounded-sm text-purple-900 border border-purple-300">Drop {simParams.otdDropPct}%</span>
              </label>
              <input type="range" min="0" max="50" step="1" value={simParams.otdDropPct} onChange={(e) => setSimParams({...simParams, otdDropPct: e.target.value})} className="w-full accent-purple-700 cursor-pointer"/>
              <p className="text-[10px] text-purple-700 font-bold uppercase tracking-wider">Simulates semi-conductor & raw material scarcity.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── TOP KPI WIDGETS (MACRO LEVEL) ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        
        {/* RESILIENCE SCORE (NEW) */}
        <div className={`bg-gray-900 text-white p-5 border-l-4 shadow-sm rounded-sm ${simMode ? 'border-purple-500 bg-gray-800' : 'border-emerald-500'}`}>
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">SC Resilience Index</p>
          <div className="flex items-end gap-2 mt-2">
            <p className={`text-4xl font-black leading-none ${simMode && displayKpis.resilienceScore.value < 80 ? 'text-red-500' : 'text-emerald-400'}`}>
              {displayKpis.resilienceScore.value}
            </p>
          </div>
          <p className={`text-[9px] font-bold mt-3 uppercase tracking-wider w-max px-2 py-0.5 rounded-sm ${simMode ? 'bg-purple-900 text-purple-200 border border-purple-700' : 'bg-gray-700 text-gray-300'}`}>
            {simMode ? 'SIMULATED IMPACT' : 'Network Stable'}
          </p>
        </div>

        <div className={`bg-white p-5 border-l-4 shadow-sm rounded-sm ${simMode ? 'border-purple-500 bg-purple-50/50' : 'border-[#125ab2]'}`}>
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Avg Order Cycle Time</p>
          <div className="flex items-end gap-2 mt-2">
            <p className={`text-3xl font-black leading-none ${simMode && displayKpis.orderCycleTime.value > dynamicKpis.orderCycleTime.value ? 'text-red-600' : 'text-gray-900'}`}>
              {displayKpis.orderCycleTime.value} <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{displayKpis.orderCycleTime.unit}</span>
            </p>
          </div>
          <p className={`text-[9px] font-bold mt-3 uppercase tracking-wider w-max px-2 py-0.5 rounded-sm ${simMode ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {simMode ? displayKpis.orderCycleTime.trend : `↓ ${displayKpis.orderCycleTime.trend}`}
          </p>
        </div>

        <div className={`bg-white p-5 border-l-4 shadow-sm rounded-sm ${simMode ? 'border-purple-500 bg-purple-50/50' : 'border-emerald-500'}`}>
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Perfect Order (OTIF)</p>
          <div className="flex items-end gap-2 mt-2">
            <p className={`text-3xl font-black leading-none ${simMode && displayKpis.perfectOrderRate.value < dynamicKpis.perfectOrderRate.value ? 'text-red-600' : displayKpis.perfectOrderRate.value < 98 ? 'text-amber-500' : 'text-gray-900'}`}>
              {displayKpis.perfectOrderRate.value} <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{displayKpis.perfectOrderRate.unit}</span>
            </p>
          </div>
          <p className={`text-[9px] font-bold mt-3 uppercase tracking-wider w-max px-2 py-0.5 rounded-sm ${simMode || displayKpis.perfectOrderRate.value < 98 ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {simMode ? displayKpis.perfectOrderRate.trend : displayKpis.perfectOrderRate.trend}
          </p>
        </div>

        <div className={`bg-white p-5 border-l-4 shadow-sm rounded-sm ${simMode ? 'border-purple-500 bg-purple-50/50' : 'border-amber-500'}`}>
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Inventory Turnover</p>
          <div className="flex items-end gap-2 mt-2">
            <p className={`text-3xl font-black leading-none ${simMode && displayKpis.inventoryTurnover.value < dynamicKpis.inventoryTurnover.value ? 'text-red-600' : 'text-gray-900'}`}>
              {displayKpis.inventoryTurnover.value} <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{displayKpis.inventoryTurnover.unit}</span>
            </p>
          </div>
          <p className={`text-[9px] font-bold mt-3 uppercase tracking-wider w-max px-2 py-0.5 rounded-sm ${simMode ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
            {simMode ? displayKpis.inventoryTurnover.trend : `${displayKpis.inventoryTurnover.trend}`}
          </p>
        </div>

        <div className={`bg-white p-5 border-l-4 shadow-sm rounded-sm ${simMode ? 'border-purple-500 bg-purple-50/50' : 'border-blue-400'}`}>
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Cash-to-Cash Cycle</p>
          <div className="flex items-end gap-2 mt-2">
            <p className={`text-3xl font-black leading-none ${simMode && displayKpis.cashToCash.value > dynamicKpis.cashToCash.value ? 'text-red-600' : 'text-gray-900'}`}>
              {displayKpis.cashToCash.value} <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{displayKpis.cashToCash.unit}</span>
            </p>
          </div>
          <p className={`text-[9px] font-bold mt-3 uppercase tracking-wider w-max px-2 py-0.5 rounded-sm ${simMode ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {simMode ? displayKpis.cashToCash.trend : `↓ ${displayKpis.cashToCash.trend}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* ── KIRI: VENDOR MITIGATION MATRIX ── */}
        <div className="xl:col-span-2 bg-white border border-gray-300 shadow-sm rounded-sm flex flex-col overflow-hidden">
          <div className="bg-slate-50 border-b border-gray-200 px-5 py-4 flex justify-between items-center">
            <h3 className="font-bold text-xs uppercase text-gray-800 tracking-wider">Critical Supplier Risk Matrix</h3>
            <span className="text-[9px] bg-blue-100 text-[#125ab2] border border-blue-200 font-bold px-2 py-1 rounded-sm uppercase tracking-wider">Click Row to Intervene</span>
          </div>
          <div className="p-0 overflow-x-auto flex-1">
            <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
              <thead className="bg-[#f8f9fa] text-[#64748b] text-[10px] uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-5 font-bold border-b">SUPPLIER / EV COMMODITY</th>
                  <th className="py-3 px-5 font-bold border-b text-center">LEAD TIME (AVG)</th>
                  <th className="py-3 px-5 font-bold border-b text-center">ON-TIME (OTD)</th>
                  <th className="py-3 px-5 font-bold border-b text-center">DEFECT RATE</th>
                  <th className="py-3 px-5 font-bold border-b text-center">RISK STATUS</th>
                </tr>
              </thead>
              <tbody className="text-[12px] text-gray-700">
                {processedVendors.map((sup, idx) => (
                  <tr 
                    key={idx} 
                    onClick={() => setVendorModal({ isOpen: true, data: sup })}
                    className={`border-b border-gray-100 transition-colors cursor-pointer ${sup.systemStatus === 'Critical' ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-blue-50'}`}
                  >
                    <td className="py-4 px-5">
                      <div className="font-bold text-[#125ab2] hover:underline text-[13px]">{sup.name}</div>
                      <div className="text-[10px] font-bold text-gray-500 mt-0.5 uppercase tracking-wider">{sup.item}</div>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`font-black text-[14px] ${sup.leadTimeAvg > sup.leadTimeTarget ? 'text-red-600' : 'text-emerald-600'}`}>
                          {sup.leadTimeAvg} <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Days</span>
                        </span>
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Target: {sup.leadTimeTarget}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3 justify-center">
                        <span className={`font-black text-[13px] ${sup.otd >= 95 ? 'text-emerald-600' : sup.otd >= 85 ? 'text-amber-500' : 'text-red-600'}`}>
                          {sup.otd}%
                        </span>
                        <div className="w-16 bg-gray-200 h-1.5 rounded-full overflow-hidden shadow-inner">
                          <div className={`h-full ${sup.otd >= 95 ? 'bg-emerald-500' : sup.otd >= 85 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.max(0, sup.otd)}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className={`font-mono font-black text-[13px] ${sup.defectRate > 5 ? 'text-red-600 animate-pulse' : 'text-emerald-600'}`}>{sup.defectRate}%</span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className={`px-2 py-1 rounded-sm text-[9px] font-black uppercase tracking-wider border shadow-sm ${
                        sup.status === 'Probation' ? 'bg-gray-800 text-white border-black animate-pulse' :
                        sup.systemStatus === 'Excellent' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                        sup.systemStatus === 'Warning' ? 'bg-amber-100 text-amber-700 border-amber-200' : 
                        'bg-red-600 text-white border-red-700 shadow-sm'
                      }`}>
                        {sup.status === 'Probation' ? 'PROBATION' : sup.systemStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── KANAN: LIVE DISRUPTION RADAR & BOTTLENECKS ── */}
        <div className="flex flex-col gap-6">
          
          {/* WIDGET BARU: LIVE DISRUPTION RADAR */}
          <div className="bg-white border border-red-200 shadow-sm rounded-sm flex flex-col overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-600 animate-pulse"></div>
            <div className="bg-red-50 border-b border-red-100 px-5 py-4 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-xs uppercase text-red-800 tracking-wider flex items-center gap-2">
                <span className="text-base animate-pulse">📡</span> Global Disruption Radar
              </h3>
            </div>
            <div className="p-4 space-y-3 bg-white flex-1 overflow-y-auto">
              {disruptions.map((dis, idx) => (
                <div key={idx} className={`border p-3 rounded-sm flex flex-col gap-1.5 shadow-sm ${dis.severity === 'Critical' ? 'bg-white border-red-200 border-l-4 border-l-red-500' : 'bg-gray-50 border-orange-200 border-l-4 border-l-orange-400'}`}>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-black text-gray-900 leading-tight">{dis.type}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-sm font-black uppercase tracking-wider border ${
                      dis.severity === 'Critical' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-orange-100 text-orange-700 border-orange-200'
                    }`}>{dis.severity}</span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">📍 {dis.location}</span>
                  <div className="bg-red-50 p-1.5 rounded text-center border border-red-100 mt-1">
                    <span className="text-[10px] font-black text-red-700 uppercase tracking-wider">Est Impact: {dis.delayImpact} Delay</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CYCLE TRACE */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-sm flex flex-col">
            <div className="bg-slate-50 border-b border-gray-200 px-5 py-3">
              <h3 className="font-bold text-xs uppercase text-gray-700 tracking-wider">End-to-End Cycle Bottlenecks</h3>
            </div>
            <div className="p-5 space-y-4">
              {bottlenecks.map((stage, idx) => (
                <div key={idx} className="relative">
                  {idx !== bottlenecks.length - 1 && <div className="absolute left-3 top-6 bottom-[-24px] w-0.5 bg-gray-200"></div>}
                  <div className="flex items-start gap-4">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 border-2 shadow-sm ${
                      stage.impact.includes('High') ? 'bg-red-50 border-red-500 text-red-600' :
                      stage.impact.includes('Medium') ? 'bg-amber-50 border-amber-400 text-amber-600' :
                      'bg-emerald-50 border-emerald-300 text-emerald-500'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${stage.impact.includes('High') ? 'bg-red-500' : stage.impact.includes('Medium') ? 'bg-amber-400' : 'bg-emerald-500'}`}></div>
                    </div>
                    <div className="flex-1 pb-1">
                      <p className="text-[11px] font-bold text-gray-800 uppercase tracking-wider">{stage.stage}</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm font-mono font-black text-[#125ab2]">{stage.time}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm border ${
                          stage.impact.includes('High') ? 'bg-red-100 text-red-700 border-red-200' :
                          stage.impact.includes('Medium') ? 'bg-amber-100 text-amber-700 border-amber-200' :
                          'bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}>
                          {stage.impact} Impact
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── EXECUTIVE OVERRIDE PANEL (THE TRIGGER) ── */}
      <div className="bg-slate-900 rounded-sm overflow-hidden shadow-2xl border border-slate-800 relative mt-6 animate-fade-in">
        {/* Background Map Simulation */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-400 via-slate-900 to-slate-900 pointer-events-none"></div>
        
        <div className="p-8 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-3 h-3 bg-rose-500 rounded-full animate-ping"></span>
              <span className="text-xs font-black text-rose-400 uppercase tracking-widest">System Alert</span>
            </div>
            <h2 className="text-2xl font-black text-white mb-3">Critical Shortage Detected</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              AI Demand Forecasting indicates a critical shortage of <strong className="text-white">LFP Battery Cells</strong> for Assembly Line 3 within the next 12 hours. Normal procurement lead time will result in line stoppage.
            </p>
            
            {(user?.role === 'EXECUTIVE' || user?.role === 'ADMIN') ? (
              <button 
                onClick={triggerE2EScenario}
                disabled={isDispatching || dispatchLog}
                className={`w-full sm:w-auto px-8 py-4 rounded-sm font-black uppercase tracking-widest text-xs transition-all shadow-lg ${
                  dispatchLog ? 'bg-emerald-600 text-white cursor-default' :
                  isDispatching ? 'bg-slate-700 text-slate-400 cursor-wait' :
                  'bg-rose-600 hover:bg-rose-500 text-white active:scale-95 shadow-rose-900/50'
                }`}
              >
                {dispatchLog ? '✓ OVERRIDE EXECUTED' : 
                 isDispatching ? 'TRANSMITTING PROTOCOL...' : 
                 '🚨 INITIATE EMERGENCY OVERRIDE'}
              </button>
            ) : (
              <div className="bg-slate-800 border border-slate-700 p-4 rounded-sm text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-3">
                <span className="text-xl">🔒</span> Clearance Level Too Low to Execute Override
              </div>
            )}
          </div>

          {/* TELEMETRY LOG */}
          <div className="bg-black/50 border border-slate-700 p-6 rounded-sm h-full font-mono">
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest border-b border-slate-800 pb-2 mb-4">Live Dispatch Telemetry</p>
            
            {!dispatchLog && !isDispatching && (
              <p className="text-slate-600 text-xs">Waiting for command authorization...</p>
            )}

            {isDispatching && (
              <p className="text-amber-500 text-xs animate-pulse">Establishing secure handshake with Floor Nodes...</p>
            )}

            {dispatchLog && (
              <div className="space-y-3 text-xs animate-fade-in">
                <div className="flex gap-2">
                  <span className="text-emerald-500">[{new Date().toLocaleTimeString()}]</span>
                  <span className="text-slate-300">Auth accepted. Generating Emergency PO...</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-emerald-500">[{new Date().toLocaleTimeString()}]</span>
                  <span className="text-blue-400">PO CREATED: {dispatchLog.poId}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-emerald-500">[{new Date().toLocaleTimeString()}]</span>
                  <span className="text-slate-300">Dispatching locked task to Floor Scanner...</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-emerald-500">[{new Date().toLocaleTimeString()}]</span>
                  <span className="text-amber-400">TASK CREATED: {dispatchLog.taskId} (Requires QA)</span>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800 text-[10px] text-emerald-600 font-bold tracking-widest uppercase">
                  ✓ TRANSMISSION COMPLETE. NOTIFYING MANAGER.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ MODAL MITIGASI VENDOR (BULLETPROOF FLEXBOX) ═══ */}
      {vendorModal.isOpen && vendorModal.data && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[500px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-purple-700" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            <div className={`px-6 py-4 flex justify-between items-center text-white shrink-0 z-10 ${vendorModal.data.systemStatus === 'Critical' || vendorModal.data.status === 'Probation' ? 'bg-red-700' : 'bg-[#415a77]'}`}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 opacity-80">Vendor Risk Ledger</p>
                <h3 className="font-black text-lg tracking-wide leading-none">{vendorModal.data.name}</h3>
                <p className="text-[10px] font-mono opacity-90 mt-0.5 bg-white/20 inline-block px-1.5 py-0.5 rounded-sm border border-white/30">{vendorModal.data.id}</p>
              </div>
              <button onClick={() => setVendorModal({ isOpen: false, data: null })} className="text-white opacity-70 hover:opacity-100 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 text-sm space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-sm text-center shadow-inner">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Reliability Z-Score</span>
                  <span className={`font-black text-3xl ${calculateVendorScore(vendorModal.data.otd, vendorModal.data.defectRate) >= 85 ? 'text-emerald-600' : 'text-red-600'}`}>{calculateVendorScore(vendorModal.data.otd, vendorModal.data.defectRate)}</span>
                </div>
                <div className="space-y-2 text-xs">
                  <p className="bg-white p-2 border font-semibold flex justify-between"><span>OTD Score:</span><strong>{vendorModal.data.otd}%</strong></p>
                  <p className="bg-white p-2 border font-semibold flex justify-between text-red-600"><span>Defects:</span><strong>{vendorModal.data.defectRate}%</strong></p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase border-b pb-1.5 mb-2">Mitigation Controls</p>
                <div className="flex flex-col gap-2">
                  {(vendorModal.data.systemStatus === 'Critical' || vendorModal.data.systemStatus === 'Warning') && (
                    <button onClick={() => handleIssueCAPA(vendorModal.data)} className="w-full bg-red-50 hover:bg-red-100 border border-red-300 text-red-700 p-2.5 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm flex justify-between items-center transition-colors">
                      <span className="flex items-center gap-2"><span>✉️</span> Issue Formal CAPA Notice</span>
                      <span>→</span>
                    </button>
                  )}
                  {vendorModal.data.safetyStock === 'Standard' && (
                    <button onClick={() => handleBoostSafetyStock(vendorModal.data)} className="w-full bg-[#125ab2] hover:bg-[#0e4487] text-white p-2.5 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm">Boost Safety Stock (+20%)</button>
                  )}
                  {vendorModal.data.safetyStock.includes('Boosted') && (
                    <div className="p-2 bg-emerald-50 text-emerald-800 font-bold text-center border text-[10px] uppercase tracking-wider rounded-sm shadow-inner">✓ Emergency Buffer Engaged</div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end shrink-0 z-10">
              <button type="button" onClick={() => setVendorModal({ isOpen: false, data: null })} className="px-6 py-2.5 bg-gray-800 text-white text-[10px] font-bold uppercase tracking-wider border border-gray-300 transition-colors rounded-sm shadow-sm w-full sm:w-auto">Close Profile</button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
};

export default SupplyChainDashboard;