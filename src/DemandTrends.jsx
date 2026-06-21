import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from './AppContext';

// ─── TOAST COMPONENT (Aman dari Bug Klik/Pointer Events) ─────────────────────
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
    {toasts.map(({ id, message, type }) => (
      <div key={id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-sm shadow-xl text-white text-xs font-semibold min-w-[280px] border-l-4 ${
        type === 'success' ? 'bg-emerald-600 border-emerald-800' : 
        type === 'error' ? 'bg-red-600 border-red-800' : 
        type === 'warning' ? 'bg-amber-500 border-amber-700' : 
        type === 'purple' ? 'bg-purple-600 border-purple-800' : 'bg-[#125ab2] border-blue-800'
      }`}>
        <span className="text-base">{type === 'success' ? '✓' : type === 'error' ? '🚨' : type === 'warning' ? '⚠️' : '🔮'}</span>
        <span className="flex-1">{message}</span>
        <button onClick={() => removeToast(id)} className="opacity-70 hover:opacity-100 text-lg leading-none">×</button>
      </div>
    ))}
  </div>
);

// ─── MINI SPARKLINE COMPONENT (MURNI CSS, TANPA LIBRARY) ───────────────
const Sparkline = ({ data, colorClass }) => {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-1 h-8">
      {data.map((val, i) => (
        <div 
          key={i} 
          className={`w-2 rounded-t-sm opacity-80 hover:opacity-100 transition-opacity ${colorClass}`} 
          style={{ height: `${Math.max((val / max) * 100, 10)}%` }} // Min height 10% agar tetap terlihat
          title={`Vol: ${val}`}
        ></div>
      ))}
    </div>
  );
};

const DemandTrends = () => {
  const { bahasa } = useContext(AppContext);
  const [dateRange, setDateRange] = useState('Next 30 Days Forecast');
  const [toasts, setToasts] = useState([]);
  const [actionModal, setActionModal] = useState({ isOpen: false, data: null });

  // 1. DATA MASTER KPI GLOBAL (ARUS MOTORS)
  const kpis = {
    forecastAccuracy: { value: 88.5, target: 90.0, trend: '+2.1%' },
    demandVolatility: { value: 24.4, target: 10.0, trend: '+6.2%' }, 
    obsolescenceCapital: { value: 1250000, target: 0, trend: '-5.0%' }, // USD 1.25M
    upcomingSpikes: { value: 2, label: 'Market Events', text: 'Active' }
  };

  // 2. DATA MARKET DEMAND SPIKES (PENGGANTI PROMO PIZZA)
  const demandSpikes = [
    { id: 'EVT-ARS-01', name: 'B2B Government Fleet Order', date: '15 Oct 2026', affected: 'LFP Batteries, MCU', spike: '+150%', status: 'Impending' },
    { id: 'EVT-ARS-02', name: 'ARUS SUV Model-X Launch', date: '12 Nov 2026', affected: 'ADAS Sensors, HV Cables', spike: '+300%', status: 'Upcoming' },
  ];

  // 3. DATA TREN KATEGORI (KOMPONEN EV)
  const categoryTrends = [
    { id: 'CAT-EV-01', name: 'Energy Storage (LFP)', trendLine: [120, 135, 140, 180, 210, 250], status: 'Surging', growth: '+45%', color: 'bg-emerald-500' },
    { id: 'CAT-EV-02', name: 'ADAS & Telemetry', trendLine: [300, 320, 350, 400, 450, 520], status: 'Surging', growth: '+60%', color: 'bg-purple-500' },
    { id: 'CAT-EV-03', name: 'Gen-1 Powertrain (Phased Out)', trendLine: [400, 320, 250, 180, 100, 50], status: 'Declining', growth: '-85%', color: 'bg-red-500' },
  ];

  // 4. DATA SKU ACTIONABLE (REVISI: PERSISTENCE ENGINE LOCAL STORAGE)
  const defaultActionableSkus = [
    { id: 'SKU-ARS-OBC01', name: 'Gen-1 On-Board Charger (OBC)', type: 'Dead Stock', severity: 'Critical', issue: 'Demand dropped 85% due to Gen-2 release. Capital trapped.', stockValue: 1250000, status: 'Pending Action', currLoc: 'Zone A (Fast Pick)', targetLoc: 'Zone D (Deep Storage)' },
    { id: 'SKU-ARS-LFP02', name: 'LFP Battery Pack 75kWh', type: 'Surge Warning', severity: 'Warning', issue: 'B2B Fleet Order spike detected (+150%).', currentStock: 120, suggestedMin: 850, status: 'Pending Action', daysToSurge: 45, supplierLT: 30, currLoc: 'Zone B (Cold Storage)', targetLoc: 'Zone A (Staging)' }, 
    { id: 'SKU-ARS-SNT01', name: 'ADAS Radar Sensor Kit', type: 'Surge Warning', severity: 'Critical', issue: 'Model-X Launch imminent. Massive component spike.', currentStock: 50, suggestedMin: 1800, status: 'Pending Action', daysToSurge: 12, supplierLT: 35, currLoc: 'Zone D (Clean Room)', targetLoc: 'Zone A (Fast Pick)' }, 
  ];

  const [actionableSkus, setActionableSkus] = useState(() => {
    try {
      const saved = window.localStorage.getItem('zentryx_actionableSkus');
      return saved ? JSON.parse(saved) : defaultActionableSkus;
    } catch {
      return defaultActionableSkus;
    }
  });

  // Menyimpan perubahan ke Local Storage setiap kali actionableSkus diupdate
  useEffect(() => {
    window.localStorage.setItem('zentryx_actionableSkus', JSON.stringify(actionableSkus));
  }, [actionableSkus]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // 5. FUNGSI EKSEKUSI TAKTIS & FISIK (RE-SLOTTING & MITIGASI LT)
  const handleLiquidate = (sku) => {
    addToast(`OBSOLESCENCE TRIGGERED: ${sku.name} flagged for E-Waste Recycling / Aftermarket Sales. Freeing up $${(sku.stockValue).toLocaleString()} in capital.`, 'success');
    updateStatus(sku.id);
  };

  const handleUpdateReorder = (sku) => {
    addToast(`ERP AUTOMATION: Safety Stock limit for ${sku.name} raised to ${sku.suggestedMin} units. Standard Ocean Freight PO generated.`, 'success');
    updateStatus(sku.id);
  };

  const handleExpediteFreight = (sku) => {
    addToast(`EMERGENCY LOGISTICS OVERRIDE: Upgrading shipment for ${sku.name} to Premium Air Freight to beat the ${sku.daysToSurge}-day assembly deadline!`, 'error');
    updateStatus(sku.id);
  };

  const handleReslotting = (sku) => {
    addToast(`PHYSICAL MOVE ORDER ISSUED: AGV assigned to physically move ${sku.name} from ${sku.currLoc} to ${sku.targetLoc} to accommodate velocity changes.`, 'purple');
  };

  const updateStatus = (id) => {
    setActionableSkus(actionableSkus.map(s => s.id === id ? { ...s, status: 'Action Executed' } : s));
    setActionModal({ isOpen: false, data: null });
  };

  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 animate-fade-in">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>📊 Analytics</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Predictive Intelligence</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide flex items-center gap-2">
            {bahasa === 'en' ? 'Demand Trends & Forecasting Radar' : 'Pusat Radar Tren & Prediksi Permintaan'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">Cross-reference macro market events with physical warehouse constraints, supplier lead times, and AI forecasts.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-purple-300 px-4 py-2.5 rounded-sm text-xs font-bold text-purple-900 outline-none focus:border-purple-600 shadow-sm bg-purple-50 cursor-pointer transition-colors"
          >
            <option>Next 30 Days Forecast</option>
            <option>Next Q3 Projections</option>
            <option>Year-End Macro Outlook</option>
          </select>
          <button className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-5 py-2.5 rounded-sm text-xs font-bold transition-colors shadow-sm uppercase tracking-wider flex items-center gap-2">
            <span>⭳</span> Export Telemetry
          </button>
        </div>
      </div>

      {/* ── TOP KPI WIDGETS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
        <div className="bg-white p-5 border-l-4 border-l-emerald-500 shadow-sm rounded-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">AI Forecast Accuracy</p>
          <div className="flex items-end gap-2 mt-1">
            <p className={`text-3xl font-black ${kpis.forecastAccuracy.value >= kpis.forecastAccuracy.target ? 'text-emerald-600' : 'text-amber-500'}`}>
              {kpis.forecastAccuracy.value}%
            </p>
          </div>
          <p className="text-[9px] text-emerald-700 mt-2 font-bold uppercase bg-emerald-50 w-max px-2 py-0.5 rounded border border-emerald-200">↑ {kpis.forecastAccuracy.trend} vs last cycle</p>
        </div>

        <div className="bg-red-50 p-5 border border-red-200 shadow-sm rounded-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-red-800 tracking-wider">Macro Demand Volatility</p>
          <div className="flex items-end gap-2 mt-1">
            <p className="text-3xl font-black text-red-700">{kpis.demandVolatility.value}%</p>
          </div>
          <p className="text-[9px] text-red-700 mt-2 font-bold uppercase bg-red-100 border border-red-300 w-max px-2 py-0.5 rounded">↑ {kpis.demandVolatility.trend} (Unstable)</p>
        </div>

        <div className="bg-white p-5 border border-gray-200 shadow-sm rounded-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Obsolescence Capital (Dead Stock)</p>
          <div className="flex items-end gap-2 mt-1">
            <p className="text-2xl lg:text-3xl font-black text-gray-800 font-mono">${(kpis.obsolescenceCapital.value / 1000000).toFixed(2)}M</p>
          </div>
          <p className="text-[9px] text-gray-500 mt-2 font-bold uppercase">Trapped Asset Cash Flow</p>
        </div>

        <div className="bg-purple-50 p-5 border-l-4 border-l-purple-500 border border-purple-200 shadow-sm rounded-sm flex flex-col justify-center hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-purple-800 tracking-wider">Upcoming Market Events</p>
          <div className="flex items-end gap-2 mt-1">
            <p className="text-3xl font-black text-purple-700">{kpis.upcomingSpikes.value}</p>
            <span className="text-xs font-bold text-purple-600 mb-1">{kpis.upcomingSpikes.label}</span>
          </div>
          <p className="text-[9px] text-purple-700 mt-2 font-bold uppercase tracking-wider animate-pulse flex items-center gap-1">
            <span>🔮</span> Incoming demand shocks
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ── KIRI: MARKET EVENT CALENDAR & CATEGORY RADAR ── */}
        <div className="flex flex-col gap-6">
          
          {/* WIDGET 1: MACRO EVENT INJECTOR */}
          <div className="bg-white border border-purple-200 shadow-sm rounded-sm flex flex-col overflow-hidden hover:shadow-md transition-shadow">
            <div className="bg-purple-50 border-b border-purple-200 px-5 py-3 flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase text-purple-900 tracking-wider flex items-center gap-2">
                <span>🗓️</span> Known Market Demand Spikes
              </h3>
            </div>
            <div className="p-4 flex flex-col gap-4">
              {demandSpikes.map((evt, idx) => (
                <div key={idx} className="border border-gray-200 p-4 rounded-sm relative overflow-hidden bg-gray-50">
                  <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-black px-2 py-1.5 rounded-bl-sm tracking-widest">{evt.spike} SHOCK</div>
                  <h4 className="text-sm font-black text-[#125ab2] pr-16 leading-tight">{evt.name}</h4>
                  <div className="text-[10px] font-bold text-gray-500 mt-1.5 flex justify-between items-center border-b border-gray-200 pb-2">
                    <span className="flex items-center gap-1"><span>📅</span> {evt.date}</span>
                    <span className="text-amber-600 uppercase tracking-wider">{evt.status}</span>
                  </div>
                  <div className="mt-2 text-[9px] bg-white text-gray-700 border border-gray-300 p-2 rounded-sm font-semibold flex flex-col">
                    <span className="text-gray-400 uppercase mb-0.5">Affected Commodities:</span>
                    <span className="font-bold text-gray-900">{evt.affected}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* WIDGET 2: CATEGORY TRENDS */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-sm flex flex-col hover:shadow-md transition-shadow">
            <div className="bg-slate-50 border-b border-gray-200 px-5 py-3">
              <h3 className="font-bold text-xs uppercase text-gray-700 tracking-wider">Component Category Volatility</h3>
            </div>
            <div className="p-5 flex flex-col gap-5">
              {categoryTrends.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-gray-800">{cat.name}</h4>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm border ${
                        cat.status === 'Surging' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {cat.status} {cat.growth}
                      </span>
                    </div>
                  </div>
                  <div className="w-24"><Sparkline data={cat.trendLine} colorClass={cat.color} /></div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── KANAN: AI DEMAND ACTION HUB (PHYSICS & SUPPLY CHAIN INTEGRATED) ── */}
        <div className="lg:col-span-2 bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
          
          <div className="bg-[#125ab2] border-b border-[#0e4487] px-5 py-4 flex justify-between items-center shrink-0">
            <div>
              <h3 className="font-black text-sm uppercase text-white tracking-wider flex items-center gap-2">
                <span>🤖</span> AI Diagnostics & Intelligence Hub
              </h3>
              <p className="text-[10px] text-blue-200 mt-1 font-semibold">Resolving anomalies across Demand Spikes, Storage Space, and Procurement Lead Times.</p>
            </div>
          </div>
          
          <div className="p-0 overflow-x-auto flex-1">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 text-gray-600 text-[10px] uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-5 font-bold border-b">Detected Issue / SKU</th>
                  <th className="py-3 px-5 font-bold border-b text-center w-44">AI Diagnostics</th>
                  <th className="py-3 px-5 font-bold border-b w-64">Logistics Constraint Matrix</th>
                  <th className="py-3 px-5 font-bold border-b text-center w-32">Action Center</th>
                </tr>
              </thead>
              <tbody className="text-[12px] text-gray-700">
                {actionableSkus.map((sku, idx) => {
                  // FITUR 2: LOGIKA PERINGATAN LEAD TIME (Lead Time Window Check)
                  const isLate = sku.type === 'Surge Warning' && sku.supplierLT > sku.daysToSurge;

                  return (
                    <tr key={idx} className={`border-b border-gray-100 transition-colors ${
                      sku.status === 'Action Executed' ? 'bg-gray-50 opacity-60 grayscale' : 'hover:bg-blue-50/40'
                    }`}>
                      <td className="py-4 px-5">
                        <div className="font-black text-gray-900 text-[13px]">{sku.name}</div>
                        <div className="text-[10px] font-mono font-bold text-[#125ab2] mt-0.5">{sku.id}</div>
                        <span className={`inline-block mt-2 px-2 py-0.5 rounded-sm text-[9px] font-black uppercase border tracking-wider ${
                          sku.type === 'Dead Stock' ? 'bg-gray-800 text-white border-black' : 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                        }`}>
                          {sku.type}
                        </span>
                      </td>
                      
                      <td className="py-4 px-5">
                        <p className={`font-bold text-[11px] leading-relaxed ${sku.type === 'Dead Stock' ? 'text-gray-600' : 'text-amber-700'}`}>{sku.issue}</p>
                      </td>

                      <td className="py-4 px-5 space-y-2.5">
                        {/* CONSTRAINT 1: LEAD TIME VS PROMO SURGE */}
                        {sku.type === 'Surge Warning' && (
                          <div className={`p-2 rounded-sm border text-[9px] font-bold shadow-sm ${isLate ? 'bg-red-50 text-red-800 border-red-300' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}`}>
                            {isLate 
                              ? `🚨 TIME BREACH: Event hits in ${sku.daysToSurge}d, but Supplier Lead Time is ${sku.supplierLT}d!` 
                              : `✓ TIMING SECURE: Supplier LT (${sku.supplierLT}d) beats Event Date (${sku.daysToSurge}d).`}
                          </div>
                        )}
                        {/* CONSTRAINT 2: PHYSICAL PLACEMENT */}
                        <div className="p-2 bg-white border border-gray-200 rounded-sm text-[9px] font-bold text-gray-600 flex flex-col gap-1 shadow-sm">
                          <span className="flex justify-between"><span>Cur Loc:</span> <span className="font-mono">{sku.currLoc}</span></span>
                          <span className={`flex justify-between border-t border-gray-100 pt-1 mt-0.5 ${sku.type === 'Surge Warning' ? 'text-[#125ab2]' : 'text-gray-400'}`}>
                            <span>Target Loc:</span> <span className="font-mono">{sku.targetLoc}</span>
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-5 text-center">
                        {sku.status === 'Action Executed' ? (
                          <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest bg-emerald-100 px-3 py-1.5 rounded-sm border border-emerald-200">
                            ✓ Executed
                          </span>
                        ) : (
                          <button 
                            onClick={() => setActionModal({ isOpen: true, data: { ...sku, isLate } })}
                            className="w-full bg-[#125ab2] hover:bg-[#0e4487] text-white py-2.5 rounded-sm text-[10px] font-bold uppercase shadow-sm transition-colors tracking-wider"
                          >
                            Triage Hub
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 🛡️ MODAL EKSEKUSI TAKTIS OMNI-CHANNEL (BULLETPROOF FLEXBOX)               */}
      {/* ========================================================================= */}
      {actionModal.isOpen && actionModal.data && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[550px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-purple-700" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            <div className={`px-6 py-4 flex justify-between items-center text-white shrink-0 z-10 ${
              actionModal.data.isLate ? 'bg-red-700' : actionModal.data.type === 'Dead Stock' ? 'bg-gray-800' : 'bg-purple-700'
            }`}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 opacity-80">Predictive Intelligence Control</p>
                <h3 className="font-black text-sm uppercase tracking-wider">Logistics Triage Execution</h3>
              </div>
              <button onClick={() => setActionModal({ isOpen: false, data: null })} className="text-white opacity-70 hover:opacity-100 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 text-sm text-gray-800 space-y-5">
              
              {/* SUMMARY */}
              <div className="bg-gray-50 border border-gray-200 p-5 rounded-sm shadow-inner">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Identified Anomaly</span>
                  <span className="font-mono font-black text-[#125ab2] bg-white border border-gray-200 px-2 py-0.5 rounded-sm text-[10px]">{actionModal.data.id}</span>
                </div>
                <p className="font-black text-lg text-gray-900 leading-tight border-b border-gray-200 pb-3 mb-3">{actionModal.data.name}</p>
                
                <p className="font-bold text-sm text-gray-700">"{actionModal.data.issue}"</p>
                
                {/* FITUR 2: PHYSICS SAFEGUARD WARNING */}
                {actionModal.data.isLate && (
                  <div className="mt-4 bg-red-50 text-red-900 border-l-4 border-red-600 p-3 text-xs font-medium rounded-r-sm shadow-sm">
                    <span className="font-black text-red-700 uppercase tracking-wider block mb-1">🚨 Supply Chain Physics Violation 🚨</span>
                    Standard Ocean Freight PO will arrive <strong>{actionModal.data.supplierLT - actionModal.data.daysToSurge} days LATE</strong> after the assembly line demand spike hits. Standard restock protocol is mathematically invalid.
                  </div>
                )}
              </div>

              {/* ACTION LOGIC BERDASARKAN TIPE MASALAH */}
              <div className="space-y-5">
                
                {/* BLOK 1: PROCUREMENT & INVENTORY ACTIONS */}
                <div>
                  <p className="text-[10px] font-black text-[#125ab2] uppercase tracking-wider mb-2 border-b border-blue-100 pb-1.5 flex items-center gap-1.5">
                    <span>1️⃣</span> Phase 1: Procurement & Capital Triage
                  </p>
                  <div className="flex flex-col gap-2.5 mt-3">
                    {actionModal.data.type === 'Dead Stock' ? (
                      <button onClick={() => handleLiquidate(actionModal.data)} className="w-full bg-gray-800 hover:bg-black text-white p-3 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors flex items-center justify-between">
                        <span className="flex items-center gap-2"><span>📉</span> Trigger Aftermarket Liquidation</span>
                        <span>→</span>
                      </button>
                    ) : actionModal.data.isLate ? (
                      <button onClick={() => handleExpediteFreight(actionModal.data)} className="w-full bg-red-600 hover:bg-red-700 text-white p-3 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors flex items-center justify-between">
                        <span className="flex items-center gap-2"><span>✈️</span> Authorize Emergency Air Freight Overrides</span>
                        <span>→</span>
                      </button>
                    ) : (
                      <button onClick={() => handleUpdateReorder(actionModal.data)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors flex items-center justify-between">
                        <span className="flex items-center gap-2"><span>⚡</span> Approve ERP Auto-Restock ({actionModal.data.suggestedMin} units)</span>
                        <span>→</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* BLOK 2: WAREHOUSE PHYSICAL ACTIONS (DYNAMIC RE-SLOTTING) */}
                <div>
                  <p className="text-[10px] font-black text-purple-700 uppercase tracking-wider mb-2 border-b border-purple-100 pb-1.5 flex items-center gap-1.5">
                    <span>2️⃣</span> Phase 2: Floor Physical Logistics (Re-Slotting)
                  </p>
                  <div className="flex flex-col gap-2.5 mt-3">
                    <button onClick={() => handleReslotting(actionModal.data)} className="w-full bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 p-3 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors text-left flex justify-between items-center">
                      <span className="flex items-center gap-2"><span>🚜</span> Move to {actionModal.data.type === 'Dead Stock' ? 'Deep Storage' : 'Fast Pick Lane'}</span>
                      <span className="text-[9px] opacity-70 bg-white px-2 py-0.5 rounded border border-purple-200">From {actionModal.data.currLoc.split(' ')[0]}</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>

            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end shrink-0 z-10">
              <button onClick={() => setActionModal({ isOpen: false, data: null })} className="w-full sm:w-auto px-6 py-2.5 bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 text-[10px] font-bold uppercase tracking-wider transition-colors rounded-sm shadow-sm">
                Close Triage Hub
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
};

export default DemandTrends;