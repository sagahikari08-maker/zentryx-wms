import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from './AppContext';

// ─── TOAST COMPONENT (Aman dari Bug Klik/Pointer Events) ─────────────────────
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
    {toasts.map(({ id, message, type }) => (
      <div key={id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-sm shadow-xl text-white text-xs font-semibold min-w-[280px] border-l-4 ${
        type === 'success' ? 'bg-emerald-600 border-emerald-800' : type === 'error' ? 'bg-red-600 border-red-800' : type === 'info' ? 'bg-[#125ab2] border-blue-800' : 'bg-purple-600 border-purple-800'
      }`}>
        <span className="text-base">{type === 'success' ? '✓' : type === 'error' ? '🚨' : type === 'info' ? 'ℹ' : '⚡'}</span>
        <span className="flex-1">{message}</span>
        <button onClick={() => removeToast(id)} className="opacity-70 hover:opacity-100 text-lg leading-none">×</button>
      </div>
    ))}
  </div>
);

const FillRateAnalysis = () => {
  const { bahasa } = useContext(AppContext);

  // 1. DATA MASTER KPI (ARUS MOTORS EV MANUFACTURING)
  const [dateRange, setDateRange] = useState('This Month');
  const [toasts, setToasts] = useState([]);

  // Data Global KPI
  const kpis = {
    productionFillRate: { value: 94.5, target: 99.0, unit: '%' },
    partAllocationRate: { value: 96.1, target: 98.5, unit: '%' },
    lineShortageRate: { value: 3.8, target: 1.0, unit: '%' },
    capitalAtRisk: { value: 1250000, target: 0, unit: 'USD' } // USD Base
  };

  // 2. DATA ROOT CAUSE (Akar Masalah Kekosongan Komponen EV)
  const rootCauses = [
    { cause: 'Semiconductor Allocation Cut', percentage: 45, color: 'bg-red-600' },
    { cause: 'Port/Customs Congestion', percentage: 25, color: 'bg-orange-500' },
    { cause: 'Phantom Inventory (System Mismatch)', percentage: 15, color: 'bg-amber-500' },
    { cause: 'Damaged in Transit / Handling', percentage: 10, color: 'bg-blue-500' },
    { cause: 'Assembly Line Demand Spike', percentage: 5, color: 'bg-purple-500' },
  ];

  // 3. DATA SKU AT-RISK (KOMPONEN EV KRITIKAL)
  const [problemSkus, setProblemSkus] = useState([
    { id: 'SKU-ARS-MCU03', name: 'Motor Control Unit (Gen 3)', fillRate: 81, missedUnits: 450, lostRevenue: 382500, rootCause: 'Semiconductor Cut', status: 'Critical', isLineStop: true, stockLeft: 0, linesAffected: 4 },
    { id: 'SKU-ARS-CBL12', name: 'HV Harness Cable 50mm2', fillRate: 88, missedUnits: 1200, lostRevenue: 15000, rootCause: 'Phantom Inventory', status: 'Warning', isLineStop: false, stockLeft: 150, linesAffected: 2 },
    { id: 'SKU-ARS-LFP01', name: 'Blade Battery Cell 3.2V', fillRate: 91, missedUnits: 850, lostRevenue: 212500, rootCause: 'Port Congestion', status: 'Warning', isLineStop: true, stockLeft: 0, linesAffected: 5 },
    { id: 'SKU-ARS-SNT01', name: 'ADAS Telemetry Sensor Kit', fillRate: 75, missedUnits: 320, lostRevenue: 144000, rootCause: 'Demand Spike', status: 'Critical', isLineStop: true, stockLeft: 50, linesAffected: 3 },
  ]);

  // 4. STATE MODAL & INTERAKSI
  const [actionModal, setActionModal] = useState({ isOpen: false, data: null });
  const [showLineStopOnly, setShowLineStopOnly] = useState(false); // FILTER LINE-STOP

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // FILTER LOGIC: KOMPONEN YANG BISA MENGHENTIKAN PABRIK (LINE-STOP)
  const filteredSkus = useMemo(() => {
    return showLineStopOnly ? problemSkus.filter(sku => sku.isLineStop) : problemSkus;
  }, [showLineStopOnly, problemSkus]);

  // 5. FUNGSI EKSEKUSI TAKTIS (DIAGNOSA & MITIGASI ROOT CAUSE)
  const handleExpediteAirFreight = (sku) => {
    addToast(`Urgent Logistics Override! Authorizing Air Freight for ${sku.name} to bypass port congestion.`, 'success');
    setActionModal({ isOpen: false, data: null });
  };

  const handleTriggerCycleCount = (sku) => {
    addToast(`Blind Cycle Count Task dispatched to AGV/Scanners for ${sku.id}. Investigating phantom inventory.`, 'info');
    setActionModal({ isOpen: false, data: null });
  };

  // 6. FUNGSI EKSEKUSI PENYELAMATAN (P3K ASSEMBLY LINE)
  const handleSubstitute = (sku) => {
    addToast(`ENGINEERING OVERRIDE: Allocating approved alternative SKU variant for ${sku.name}. Assembly line continues!`, 'success');
    setProblemSkus(problemSkus.map(s => s.id === sku.id ? { ...s, status: 'Mitigated' } : s));
    setActionModal({ isOpen: false, data: null });
  };

  const handleRationing = (sku) => {
    addToast(`PRODUCTION RATIONING ENFORCED: Remaining ${sku.stockLeft} units strictly allocated to Priority Export Lines only. Prevented total shutdown!`, 'info');
    setProblemSkus(problemSkus.map(s => s.id === sku.id ? { ...s, status: 'Mitigated' } : s));
    setActionModal({ isOpen: false, data: null });
  };

  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 animate-fade-in">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>📊 Analytics</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Fulfillment Diagnostics</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide flex items-center gap-2">
            {bahasa === 'en' ? 'Line-Feed & Shortage Control Tower' : 'Pusat Kendali Pasokan Lini & Kekosongan'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">Diagnose part shortages and execute emergency triage to prevent assembly line shutdowns.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 px-4 py-2.5 rounded-sm text-xs font-bold text-gray-700 outline-none focus:border-[#125ab2] shadow-sm bg-white cursor-pointer"
          >
            <option>Last 24 Hours</option>
            <option>This Week</option>
            <option>This Month</option>
            <option>Quarter to Date</option>
          </select>
          <button className="bg-gray-800 hover:bg-black text-white px-5 py-2.5 rounded-sm text-xs font-bold transition-colors shadow-sm uppercase tracking-wider flex items-center gap-2">
            <span>⭳</span> Export Telemetry
          </button>
        </div>
      </div>

      {/* ── TOP KPI WIDGETS (MANUFACTURING STANDARDS) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 border border-gray-300 shadow-sm rounded-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Production Line Fill Rate</p>
          <div className="flex items-end gap-2 mt-1">
            <p className={`text-3xl font-black ${kpis.productionFillRate.value >= kpis.productionFillRate.target ? 'text-emerald-600' : 'text-red-600'}`}>
              {kpis.productionFillRate.value}%
            </p>
          </div>
          <p className="text-[9px] text-gray-400 mt-2 font-bold uppercase border-t border-gray-100 pt-2">Target: &gt;{kpis.productionFillRate.target}%</p>
        </div>

        <div className="bg-white p-5 border border-gray-300 shadow-sm rounded-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Part Allocation Success</p>
          <div className="flex items-end gap-2 mt-1">
            <p className={`text-3xl font-black ${kpis.partAllocationRate.value >= kpis.partAllocationRate.target ? 'text-emerald-600' : 'text-amber-500'}`}>
              {kpis.partAllocationRate.value}%
            </p>
          </div>
          <p className="text-[9px] text-gray-400 mt-2 font-bold uppercase border-t border-gray-100 pt-2">Target: &gt;{kpis.partAllocationRate.target}%</p>
        </div>

        <div className="bg-white p-5 border border-gray-300 shadow-sm rounded-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Line Shortage / Backorder</p>
          <div className="flex items-end gap-2 mt-1">
            <p className="text-3xl font-black text-amber-600">{kpis.lineShortageRate.value}%</p>
          </div>
          <p className="text-[9px] text-amber-600 mt-2 font-bold uppercase border-t border-gray-100 pt-2">Requires triage planning</p>
        </div>

        <div className="bg-red-50 p-5 border border-red-200 shadow-sm rounded-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-red-700 tracking-wider">Capital at Risk (Unbuilt)</p>
          <div className="flex items-end gap-2 mt-1">
            <p className="text-2xl lg:text-3xl font-black text-red-700 font-mono">${(kpis.capitalAtRisk.value / 1000000).toFixed(2)}M</p>
          </div>
          <p className="text-[9px] text-red-600 mt-2 font-bold uppercase border-t border-red-200/50 pt-2">Revenue halted due to stockouts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ── KIRI: ROOT CAUSE ANALYSIS ── */}
        <div className="bg-white border border-gray-300 shadow-sm rounded-sm flex flex-col hover:shadow-md transition-shadow">
          <div className="bg-slate-50 border-b border-gray-200 px-5 py-4">
            <h3 className="font-bold text-xs uppercase text-gray-800 tracking-wider">Root Cause Analysis</h3>
            <p className="text-[10px] text-gray-500 mt-1 font-semibold leading-relaxed">System diagnostics identifying primary factors causing assembly feed failures.</p>
          </div>
          <div className="p-5 flex-1 flex flex-col gap-5">
            {rootCauses.map((rc, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                  <span className="text-gray-700">{rc.cause}</span>
                  <span className="text-gray-900 font-black">{rc.percentage}%</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden border border-gray-200 shadow-inner">
                  <div className={`h-full ${rc.color}`} style={{ width: `${rc.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── KANAN: AT-RISK SKU LEDGER (ACTIONABLE) ── */}
        <div className="lg:col-span-2 bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
          
          <div className="bg-[#125ab2] border-b border-[#0e4487] px-5 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-black text-sm uppercase text-white tracking-wider">High-Risk Component Watchlist</h3>
              <p className="text-[10px] text-blue-200 mt-1 font-semibold">Top items causing revenue leakage. Immediate triage required.</p>
            </div>
            {/* FITUR 1: FILTER LINE-STOP */}
            <button 
              onClick={() => setShowLineStopOnly(!showLineStopOnly)}
              className={`px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors border shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto ${
                showLineStopOnly ? 'bg-red-600 text-white border-red-700' : 'bg-[#0e4487] text-white border-blue-800 hover:bg-[#0b366b]'
              }`}
            >
              {showLineStopOnly ? '🛑 Clear Line-Stop Filter' : '🚨 Show Line-Stop Risks Only'}
            </button>
          </div>
          
          <div className="p-0 overflow-x-auto flex-1">
            <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-5 font-bold border-b">SKU / Component Details</th>
                  <th className="py-3 px-5 font-bold border-b text-center">Fill Rate</th>
                  <th className="py-3 px-5 font-bold border-b text-center">Assembly Impact</th>
                  <th className="py-3 px-5 font-bold border-b text-right">Lost Value (USD)</th>
                  <th className="py-3 px-5 font-bold border-b text-center w-32">Control Center</th>
                </tr>
              </thead>
              <tbody className="text-[12px] text-gray-700">
                {filteredSkus.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-gray-500 font-bold uppercase tracking-wider bg-gray-50/50">
                      <span className="text-3xl block mb-2">🎉</span>
                      No critical line-stop components detected!
                    </td>
                  </tr>
                ) : (
                  filteredSkus.map((sku, idx) => (
                    <tr key={idx} className={`border-b border-gray-100 transition-colors ${sku.status === 'Critical' ? 'bg-red-50/40 hover:bg-red-50' : sku.status === 'Mitigated' ? 'bg-emerald-50/60 opacity-80 grayscale' : 'hover:bg-blue-50'}`}>
                      <td className="py-3 px-5">
                        <div className={`font-black text-[13px] ${sku.status === 'Mitigated' ? 'text-gray-600' : 'text-[#125ab2]'}`}>{sku.name}</div>
                        <div className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-wider font-mono">
                          {sku.id} | <span className="text-red-500 ml-1">{sku.missedUnits} units short</span>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-center">
                        <span className={`font-black text-[15px] ${sku.fillRate < 85 ? 'text-red-600' : 'text-amber-500'}`}>
                          {sku.fillRate}%
                        </span>
                      </td>
                      <td className="py-3 px-5 text-center">
                        {sku.isLineStop ? (
                          <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-sm font-black text-[9px] uppercase tracking-widest border border-red-200 animate-pulse inline-block">
                            Line-Stop Risk
                          </span>
                        ) : (
                          <span className="text-gray-500 font-bold text-[10px] uppercase tracking-wider bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-sm inline-block">
                            Non-Critical
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-5 text-right font-mono font-black text-red-700 text-sm">
                        ${(sku.lostRevenue).toLocaleString('en-US')}
                      </td>
                      <td className="py-3 px-5 text-center">
                        {sku.status === 'Mitigated' ? (
                          <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest bg-emerald-100 px-3 py-1.5 rounded-sm border border-emerald-200 inline-block">
                            ✓ Rescued
                          </span>
                        ) : (
                          <button 
                            onClick={() => setActionModal({ isOpen: true, data: sku })}
                            className={`w-full py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors border ${
                              sku.status === 'Critical' ? 'bg-red-600 hover:bg-red-700 text-white border-red-700' : 'bg-white hover:bg-gray-100 text-gray-800 border-gray-300'
                            }`}
                          >
                            Triage Actions
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 🛡️ MODAL PENYELAMATAN (TRIAGE CONTROL) - BULLETPROOF FLEXBOX              */}
      {/* ========================================================================= */}
      {actionModal.isOpen && actionModal.data && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[500px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-red-600" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            <div className={`px-6 py-4 flex justify-between items-center text-white shrink-0 z-10 ${
              actionModal.data.status === 'Critical' ? 'bg-red-600' : 'bg-amber-500'
            }`}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 opacity-90">Order Triage Center</p>
                <h3 className="font-black text-lg leading-tight">{actionModal.data.name}</h3>
                <p className="text-[10px] font-mono opacity-90 mt-1 bg-white/20 inline-block px-1.5 py-0.5 rounded border border-white/30">{actionModal.data.id}</p>
              </div>
              <button onClick={() => setActionModal({ isOpen: false, data: null })} className="text-white opacity-70 hover:opacity-100 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 text-sm text-gray-800 space-y-6">
              
              {/* SUMMARY */}
              <div className="bg-gray-50 border border-gray-200 p-5 rounded-sm shadow-inner">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Shortage Overview</p>
                  {actionModal.data.isLineStop && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-sm font-black text-[9px] uppercase border border-red-200 animate-pulse tracking-widest">Line-Stop Imminent</span>}
                </div>
                <p className="font-black text-base text-gray-900 leading-tight">Shortage of {actionModal.data.missedUnits} units, blocking {actionModal.data.linesAffected} assembly lines.</p>
                
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200 text-[10px] font-bold uppercase tracking-wider">
                  <div>
                    <span className="text-gray-500 block mb-1">Diagnosed Root Cause</span>
                    <span className="bg-white border border-gray-300 text-gray-800 py-1 px-2 rounded-sm inline-block shadow-sm text-xs">{actionModal.data.rootCause}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-1">Available On-Hand</span>
                    <span className="bg-red-50 border border-red-200 text-red-700 py-1 px-2 rounded-sm inline-block shadow-sm text-xs">{actionModal.data.stockLeft} Units Left</span>
                  </div>
                </div>
              </div>

              {/* FITUR 2 & 3: EMERGENCY TRIAGE ACTIONS (P3K) */}
              <div>
                <p className="text-[10px] font-bold text-[#125ab2] uppercase tracking-wider mb-2 border-b border-gray-200 pb-2">1. Immediate Line Rescue Tactics</p>
                <div className="flex flex-col gap-2.5">
                  <button onClick={() => handleSubstitute(actionModal.data)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm flex justify-between items-center transition-colors">
                    <span className="flex items-center gap-2"><span>🔄</span> Authorize Engineering Substitution</span>
                    <span>→</span>
                  </button>
                  {actionModal.data.stockLeft > 0 ? (
                    <button onClick={() => handleRationing(actionModal.data)} className="w-full bg-amber-500 hover:bg-amber-600 text-white p-3 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm flex justify-between items-center transition-colors">
                      <span className="flex items-center gap-2"><span>⚖️</span> Enforce Strict Line Rationing</span>
                      <span>→</span>
                    </button>
                  ) : (
                    <div className="text-center p-3 text-[10px] uppercase font-bold text-gray-400 bg-gray-50 border border-gray-200 rounded-sm">
                      ⚖️ Rationing Unavailable (0 Stock)
                    </div>
                  )}
                </div>
              </div>

              {/* ROOT CAUSE ACTIONS (DIAGNOSA) */}
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-200 pb-2">2. Supply Chain Escalation</p>
                <div className="flex flex-col gap-2.5">
                  {actionModal.data.rootCause.includes('Semiconductor') || actionModal.data.rootCause.includes('Port') ? (
                    <button onClick={() => handleExpediteAirFreight(actionModal.data)} className="w-full bg-[#125ab2] hover:bg-[#0e4487] text-white p-3 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm flex justify-between items-center transition-colors">
                      <span className="flex items-center gap-2"><span>✈️</span> Authorize Expedited Air Freight</span>
                      <span>→</span>
                    </button>
                  ) : (
                    <button onClick={() => handleTriggerCycleCount(actionModal.data)} className="w-full bg-gray-800 hover:bg-black text-white p-3 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm flex justify-between items-center transition-colors">
                      <span className="flex items-center gap-2"><span>🔍</span> Dispatch AGV for Blind Cycle Count</span>
                      <span>→</span>
                    </button>
                  )}
                </div>
              </div>

            </div>

            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end shrink-0 z-10">
              <button onClick={() => setActionModal({ isOpen: false, data: null })} className="w-full sm:w-auto px-6 py-2.5 bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 text-[10px] font-bold uppercase tracking-wider transition-colors rounded-sm shadow-sm">
                Close Triage Panel
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
};

export default FillRateAnalysis;