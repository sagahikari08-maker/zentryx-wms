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

const SpaceCapacity = () => {
  const { bahasa } = useContext(AppContext);

  // 1. DATA MASTER ZONA GUDANG (ARUS MOTORS EV GIGAFACTORY)
  const [zones, setZones] = useState([
    { id: 'Z-A', name: 'Zone A (Ambient Powertrain)', maxVolumeCbm: 2500, usedVolumeCbm: 1850, maxWeightKg: 45000, usedWeightKg: 38000, type: 'Ambient', temp: '25°C' }, 
    { id: 'Z-B', name: 'Zone B (Cold Storage - Batteries)', maxVolumeCbm: 1500, usedVolumeCbm: 600, maxWeightKg: 80000, usedWeightKg: 76000, type: 'Climate Controlled', temp: '15°C' }, // Baterai padat = Volume kecil, tapi berat nyaris max
    { id: 'Z-C', name: 'Zone C (Heavy Duty - Chassis)', maxVolumeCbm: 3000, usedVolumeCbm: 2800, maxWeightKg: 60000, usedWeightKg: 45000, type: 'Structural', temp: 'Ambient' }, // Sasis = Volume besar, berat menengah
    { id: 'Z-D', name: 'Zone D (Clean Room - MCU/Sensors)', maxVolumeCbm: 500, usedVolumeCbm: 120, maxWeightKg: 10000, usedWeightKg: 1500, type: 'Anti-Static', temp: '22°C' },
    { id: 'Z-E', name: 'Zone E (Hazmat - Coolants/Chems)', maxVolumeCbm: 800, usedVolumeCbm: 150, maxWeightKg: 20000, usedWeightKg: 4500, type: 'Hazardous', temp: '18°C' },
  ]);

  // DATA ABC SLOTTING EFFICIENCY METRIC
  const [slottingScore, setSlottingScore] = useState(72); 
  const [slottingMismatches, setSlottingMismatches] = useState([
    { sku: 'SKU-ARS-LFP01 (Battery Cell)', category: 'A (Fast Moving / Heavy)', currentLoc: 'Zone B - Level 4 (Top Rack)', idealLoc: 'Zone B - Level 1 (Floor)', impact: 'Critical risk of rack collapse & slow AGV retrieval' },
    { sku: 'SKU-ARS-CBL12 (HV Harness)', category: 'B (Medium Velocity)', currentLoc: 'Zone A - Level 1 (Floor)', idealLoc: 'Zone A - Level 3 (Mid Rack)', impact: 'Taking up valuable floor space needed for heavy motors' },
  ]);

  // STATE UNTUK SIMULASI INBOUND PROJECTION FORECAST
  const [projectionForm, setProjectionForm] = useState({
    poId: 'CUSTOM-SIMULATION',
    cbm: '150',
    weight: '5000',
    zoneTarget: 'Z-A'
  });
  const [projectionResult, setProjectionResult] = useState(null);

  // PRESET UPCOMING PO UNTUK FITUR PROJECTION FORECAST (EV CONTEXT)
  const poPresets = [
    { id: 'PO-2026-104 (LFP Battery Cell Cargo)', cbm: 120, weight: 15000, zoneTarget: 'Z-B' }, // Heavy!
    { id: 'PO-2026-105 (Steel Chassis Bulk Delivery)', cbm: 850, weight: 12000, zoneTarget: 'Z-C' }, // Bulky!
    { id: 'PO-2026-106 (Thermal Coolant Drums)', cbm: 80, weight: 3500, zoneTarget: 'Z-E' },
  ];

  // DATA REKOMENDASI KONSOLIDASI LOKASI
  const [consolidationTasks, setConsolidationTasks] = useState([
    { id: 'CNS-ARS-001', zone: 'Z-B', fromBins: ['B-12-01', 'B-12-02'], toBin: 'B-12-04', sku: 'SKU-ARS-LFP01 (Batteries)', savedSpace: '45 CBM', status: 'Pending' },
    { id: 'CNS-ARS-002', zone: 'Z-A', fromBins: ['A-01-10', 'A-01-11'], toBin: 'A-01-15', sku: 'SKU-ARS-CBL12 (Cables)', savedSpace: '20 CBM', status: 'Pending' },
  ]);

  // STATE INTERAKTIF UTAMA
  const [toasts, setToasts] = useState([]);
  const [activeTab, setActiveTab] = useState('ZONES'); 

  // FUNGSI TOAST
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // ENGINE ANALISA KAPASITAS PINTAR: EVALUASI VOLUME VS WEIGHT DUAL-AXIS
  const processedZones = useMemo(() => {
    return zones.map(z => {
      const volUtil = ((z.usedVolumeCbm / z.maxVolumeCbm) * 100).toFixed(1);
      const weightUtil = ((z.usedWeightKg / z.maxWeightKg) * 100).toFixed(1);
      
      const freeVolumeCbm = z.maxVolumeCbm - z.usedVolumeCbm;
      const freeWeightKg = z.maxWeightKg - z.usedWeightKg;
      
      const maxUtil = Math.max(parseFloat(volUtil), parseFloat(weightUtil));
      let status = 'Optimal';
      if (maxUtil >= 95) status = 'Bottleneck';
      else if (maxUtil >= 85) status = 'Warning';
      else if (maxUtil < 40) status = 'Underutilized';

      return { 
        ...z, 
        volUtil: parseFloat(volUtil), 
        weightUtil: parseFloat(weightUtil), 
        freeVolumeCbm, 
        freeWeightKg, 
        maxUtil,
        status 
      };
    });
  }, [zones]);

  // METRIK GLOBAL WAREHOUSE
  const globalMetrics = useMemo(() => {
    const totalMaxVol = zones.reduce((sum, z) => sum + z.maxVolumeCbm, 0);
    const totalUsedVol = zones.reduce((sum, z) => sum + z.usedVolumeCbm, 0);
    const totalMaxWgt = zones.reduce((sum, z) => sum + z.maxWeightKg, 0);
    const totalUsedWgt = zones.reduce((sum, z) => sum + z.usedWeightKg, 0);
    
    return {
      globalVolUtil: ((totalUsedVol / totalMaxVol) * 100).toFixed(1),
      globalWgtUtil: ((totalUsedWgt / totalMaxWgt) * 100).toFixed(1),
      criticalZones: processedZones.filter(z => z.status === 'Bottleneck').length
    };
  }, [zones, processedZones]);

  // ⚡ EKSEKUSI: OPTIMASI ABC SLOTTING ENGINE
  const handleOptimizeSlotting = () => {
    addToast('Engine compiling new velocity paths for AGV and Forklifts...', 'info');
    setTimeout(() => {
      setSlottingScore(98);
      setSlottingMismatches([]);
      addToast('ABC Optimization Complete! Heavy/Fast items grounded. Efficiency score updated to 98%.', 'success');
    }, 1500);
  };

  // 🔮 EKSEKUSI: FORECAST SIMULATOR KAPASITAS INBOUND
  const handleRunSimulation = (e) => {
    e.preventDefault();
    const targetZone = processedZones.find(z => z.id === projectionForm.zoneTarget);
    const inputCbm = parseFloat(projectionForm.cbm);
    const inputWeight = parseFloat(projectionForm.weight);

    if (!targetZone) return;

    const willFitVolume = targetZone.freeVolumeCbm >= inputCbm;
    const willFitWeight = targetZone.freeWeightKg >= inputWeight;

    const newVolUtil = (((targetZone.usedVolumeCbm + inputCbm) / targetZone.maxVolumeCbm) * 100).toFixed(1);
    const newWgtUtil = (((targetZone.usedWeightKg + inputWeight) / targetZone.maxWeightKg) * 100).toFixed(1);

    setProjectionResult({
      zoneName: targetZone.name,
      success: willFitVolume && willFitWeight,
      volumeFit: willFitVolume,
      weightFit: willFitWeight,
      projectedVolUtil: newVolUtil,
      projectedWgtUtil: newWgtUtil,
      cbmShortage: willFitVolume ? 0 : (inputCbm - targetZone.freeVolumeCbm).toFixed(0),
      weightShortage: willFitWeight ? 0 : (inputWeight - targetZone.freeWeightKg).toFixed(0)
    });

    if (willFitVolume && willFitWeight) {
      addToast('Simulation Complete: Zone capacity validated for incoming cargo.', 'success');
    } else {
      addToast('CRITICAL: Simulation failed. Target zone cannot support this payload.', 'error');
    }
  };

  const applyPoPreset = (preset) => {
    setProjectionForm({
      poId: preset.id,
      cbm: preset.cbm.toString(),
      weight: preset.weight.toString(),
      zoneTarget: preset.zoneTarget
    });
    setProjectionResult(null);
    addToast(`Preset cargo signature loaded: ${preset.id.split(' ')[0]}`, 'info');
  };

  const handleTriggerConsolidation = (task) => {
    setConsolidationTasks(consolidationTasks.map(t => t.id === task.id ? { ...t, status: 'Dispatched' } : t));
    addToast(`Directive ${task.id} pushed to AGV & Forklift terminals. Space salvage initiated.`, 'success');
  };

  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 animate-fade-in">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER NAVIGATION HUB ── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>📊 Analytics</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Infrastructure</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide">
            {bahasa === 'en' ? 'Space & Capacity Smart Engine' : 'Engine Tata Ruang & Kapasitas Pintar'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">Prevent structural collapse via Weight-vs-Volume tracking, optimize AGV paths, and run cargo simulations.</p>
        </div>
        
        {/* NAV TABS */}
        <div className="bg-gray-100 p-1 rounded-sm shadow-inner flex border border-gray-300 w-full lg:w-auto overflow-x-auto">
          <button onClick={() => setActiveTab('ZONES')} className={`px-4 py-2 text-xs font-bold uppercase transition-all rounded-sm whitespace-nowrap ${activeTab === 'ZONES' ? 'bg-[#415a77] text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}>
            📦 Weight vs Volume Heatmap
          </button>
          <button onClick={() => setActiveTab('SLOTTING')} className={`px-4 py-2 text-xs font-bold uppercase transition-all rounded-sm flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'SLOTTING' ? 'bg-[#415a77] text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}>
            ⚡ ABC Slotting Velocity <span className={`px-1.5 py-0.5 text-[9px] rounded-sm font-black ${slottingScore > 90 ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>{slottingScore}%</span>
          </button>
          <button onClick={() => setActiveTab('PROJECTION')} className={`px-4 py-2 text-xs font-bold uppercase transition-all rounded-sm whitespace-nowrap ${activeTab === 'PROJECTION' ? 'bg-[#415a77] text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}>
            🔮 Inbound Payload Simulator
          </button>
        </div>
      </div>

      {/* ── GLOBAL REAL-TIME METRICS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
        <div className="bg-[#125ab2] p-5 rounded-sm text-white shadow-sm border-l-4 border-l-blue-400 hover:shadow-md transition-all">
          <p className="text-[10px] uppercase font-bold text-blue-200 tracking-wider">Total Volume Utilized</p>
          <p className="text-3xl font-black mt-1 font-mono">{globalMetrics.globalVolUtil}%</p>
          <p className="text-[10px] text-blue-100 mt-2 font-semibold uppercase tracking-wider">Global CBM Footprint</p>
        </div>
        <div className="bg-gray-800 p-5 rounded-sm text-white shadow-sm border-l-4 border-l-red-500 hover:shadow-md transition-all">
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Structural Weight Load</p>
          <p className="text-3xl font-black mt-1 font-mono">{globalMetrics.globalWgtUtil}%</p>
          <p className="text-[10px] text-red-400 mt-2 font-bold uppercase tracking-wider flex items-center gap-1"><span>⚠️</span> Heavy Tonnage Tracking</p>
        </div>
        <div className="bg-white p-5 border border-gray-200 shadow-sm rounded-sm hover:shadow-md transition-all">
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Storage Bottlenecks</p>
          <div className="flex items-end gap-2 mt-1">
            <p className="text-3xl font-black text-red-700 font-mono">{globalMetrics.criticalZones}</p>
            <span className="text-xs font-bold text-gray-400 mb-1">Zones</span>
          </div>
          <p className="text-[10px] text-red-500 mt-2 font-bold uppercase tracking-wider">Operating &gt;95% limits</p>
        </div>
        <div className="bg-white p-5 border border-gray-200 shadow-sm rounded-sm hover:shadow-md transition-all">
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Active Space Salvage</p>
          <div className="flex items-end gap-2 mt-1">
            <p className="text-3xl font-black text-amber-600 font-mono">{consolidationTasks.filter(t => t.status === 'Pending').length}</p>
            <span className="text-xs font-bold text-gray-400 mb-1">Tasks</span>
          </div>
          <p className="text-[10px] text-amber-600 font-bold mt-2 uppercase tracking-wider">Pending Consolidation</p>
        </div>
      </div>

      {/* ── TAB 1: WEIGHT VS VOLUME HEATMAP ── */}
      {activeTab === 'ZONES' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {processedZones.map((zone, idx) => (
              <div key={idx} className={`bg-white border shadow-sm rounded-sm overflow-hidden flex flex-col transition-all ${zone.status === 'Bottleneck' ? 'border-red-300 ring-1 ring-red-200' : 'border-gray-200 hover:border-[#125ab2]'}`}>
                
                <div className={`px-5 py-4 border-b flex justify-between items-center ${zone.status === 'Bottleneck' ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-200'}`}>
                  <div>
                    <h3 className="font-black text-sm text-[#125ab2] uppercase tracking-wider leading-tight">{zone.name}</h3>
                    <div className="text-[9px] text-gray-500 font-bold flex items-center gap-2 mt-1 uppercase tracking-widest">
                      <span className="bg-white border px-1.5 py-0.5 rounded-sm">{zone.type}</span> <span>|</span> <span>🌡️ {zone.temp}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-[9px] font-black rounded-sm uppercase tracking-wider shadow-sm border ${
                    zone.status === 'Bottleneck' ? 'bg-red-600 text-white border-red-700 animate-pulse' : 
                    zone.status === 'Warning' ? 'bg-amber-500 text-white border-amber-600' : 'bg-emerald-100 text-emerald-700 border-emerald-300'
                  }`}>{zone.status}</span>
                </div>

                <div className="p-6 flex-1 space-y-5">
                  {/* INDIKATOR 1: CBM VOLUME */}
                  <div className="bg-gray-50 p-3 rounded-sm border border-gray-100">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider">1. Spatial Volume (CBM)</span>
                      <span className="font-mono font-black text-gray-800 text-sm">{zone.volUtil}%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden shadow-inner">
                      <div className={`h-full ${zone.volUtil > 90 ? 'bg-red-500' : zone.volUtil > 75 ? 'bg-amber-500' : 'bg-[#125ab2]'}`} style={{ width: `${Math.min(zone.volUtil, 100)}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[9px] font-bold text-gray-400 mt-2 uppercase tracking-wider">
                      <span>Used: {zone.usedVolumeCbm} CBM</span>
                      <span>Max: {zone.maxVolumeCbm} CBM</span>
                    </div>
                  </div>

                  {/* INDIKATOR 2: STRUCTURAL WEIGHT LOAD (TONASE) */}
                  <div className={`p-3 rounded-sm border ${zone.weightUtil > 90 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className={`${zone.weightUtil > 90 ? 'text-red-700' : 'text-gray-500'} font-bold uppercase text-[10px] tracking-wider`}>2. Structural Weight (Tonnage)</span>
                      <span className={`font-mono font-black text-sm ${zone.weightUtil > 90 ? 'text-red-700' : 'text-gray-800'}`}>{zone.weightUtil}%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden shadow-inner">
                      <div className={`h-full ${zone.weightUtil > 90 ? 'bg-red-600' : zone.weightUtil > 75 ? 'bg-amber-500' : 'bg-[#125ab2]'}`} style={{ width: `${Math.min(zone.weightUtil, 100)}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[9px] font-bold text-gray-400 mt-2 uppercase tracking-wider">
                      <span className={zone.weightUtil > 90 ? 'text-red-500' : ''}>Load: {(zone.usedWeightKg / 1000).toFixed(1)} Tons</span>
                      <span>Struct Limit: {(zone.maxWeightKg / 1000).toFixed(0)} Tons</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border-t border-gray-200 p-4 shrink-0 flex gap-3">
                  <button onClick={() => { addToast(`Safety check passed for ${zone.id}. Structural rack bolts integrity ok.`, 'success'); }} className="w-1/2 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 py-2 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-1.5">
                    <span>🛡️</span> Safety Audit
                  </button>
                  <button onClick={() => { addToast(`Inbound routing paused for ${zone.name} to avoid structural failure.`, 'error'); }} className="w-1/2 bg-gray-800 hover:bg-black text-white py-2 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-1.5">
                    <span>🔒</span> Lock Zone
                  </button>
                </div>

              </div>
            ))}
          </div>

          {/* SPACE CONSOLIDATION PANEL */}
          <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-6 mt-2">
            <h3 className="text-xs font-black text-[#125ab2] uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
              <span>🔀</span> Fast-Action Space Salvage & Consolidation
            </h3>
            <div className="space-y-3">
              {consolidationTasks.map((task, i) => (
                <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-blue-50/50 border border-blue-100 p-4 rounded-sm gap-4 text-xs transition-colors hover:bg-blue-50">
                  <div className="flex-1 leading-relaxed">
                    <span className="bg-[#125ab2] text-white font-mono font-bold px-2 py-0.5 rounded-sm mr-2 text-[10px]">{task.id}</span>
                    <span className="text-gray-600 font-medium">Relocate SKU</span> <span className="font-bold text-gray-900">{task.sku}</span> <span className="text-gray-600 font-medium">from loose bins</span> <span className="font-mono font-bold text-[#125ab2] bg-white border px-1 rounded">{task.fromBins.join(', ')}</span> <span className="text-gray-600 font-medium">into Target Bin</span> <span className="font-mono font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 rounded">{task.toBin}</span>
                  </div>
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-200">
                    <div className="text-center">
                      <span className="block text-[9px] font-bold text-gray-400 uppercase">Yields</span>
                      <span className="font-black text-emerald-600 text-sm">{task.savedSpace}</span>
                    </div>
                    {task.status === 'Pending' ? (
                      <button onClick={() => handleTriggerConsolidation(task)} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-sm text-[10px] uppercase font-bold shadow-sm transition-colors tracking-wider whitespace-nowrap">
                        Dispatch AGV
                      </button>
                    ) : (
                      <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest bg-emerald-100 px-3 py-1.5 rounded-sm border border-emerald-200">✓ Dispatched</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: ABC SLOTTING VELOCITY OPTIMIZER ── */}
      {activeTab === 'SLOTTING' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-sm shadow-sm flex flex-col overflow-hidden">
            <div className="bg-slate-50 border-b border-gray-200 px-5 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-black text-xs uppercase text-gray-800 tracking-wider">Velocity Placement Misalignment (ABC Score)</h3>
                <p className="text-[11px] font-semibold text-gray-500 mt-1 leading-relaxed">Fast-moving / heavy EV components placed in distant or high shelving units, drastically ruining AGV retrieval speeds and increasing accident risks.</p>
              </div>
              {slottingMismatches.length > 0 && (
                <button onClick={handleOptimizeSlotting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider px-5 py-2.5 rounded-sm shadow-sm transition-colors whitespace-nowrap flex items-center gap-2">
                  <span>⚡</span> Auto-Resolve Paths
                </button>
              )}
            </div>

            <div className="p-0 overflow-x-auto flex-1">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-[#f8f9fa] text-[#666666] text-[10px] uppercase font-bold tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-5 border-b border-gray-200">SKU Detail</th>
                    <th className="py-3 px-5 border-b border-gray-200 text-center">Velocity Grade</th>
                    <th className="py-3 px-5 border-b border-gray-200">Current Location</th>
                    <th className="py-3 px-5 border-b border-gray-200">Ideal Placement</th>
                    <th className="py-3 px-5 border-b border-gray-200 text-red-600">Retrieval Impact</th>
                  </tr>
                </thead>
                <tbody className="text-[12px] text-gray-700">
                  {slottingMismatches.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-16 text-center">
                        <span className="text-4xl block mb-3">🎯</span>
                        <p className="text-gray-800 font-black text-sm uppercase tracking-wider">ALL SLOTS PERFECTLY ALIGNED</p>
                        <p className="text-gray-500 font-medium text-xs mt-1">ABC Velocity Efficiency is at an optimal 98% operational score.</p>
                      </td>
                    </tr>
                  ) : (
                    slottingMismatches.map((mis, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-red-50/40 transition-colors">
                        <td className="py-4 px-5 font-black text-[#125ab2] font-mono">{mis.sku}</td>
                        <td className="py-4 px-5 text-center">
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-sm font-black text-[9px] uppercase border border-red-200 tracking-wider whitespace-nowrap">{mis.category}</span>
                        </td>
                        <td className="py-4 px-5 font-mono font-bold text-red-600 text-[11px]">{mis.currentLoc}</td>
                        <td className="py-4 px-5 font-mono font-black text-emerald-700 text-[11px]">⟶ {mis.idealLoc}</td>
                        <td className="py-4 px-5 text-[11px] font-semibold text-gray-600 leading-snug">"{mis.impact}"</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-6 h-fit">
            <h3 className="font-black text-xs uppercase text-gray-800 tracking-wider border-b border-gray-200 pb-3 mb-4">ABC EV Slotting Rules</h3>
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-sm">
                <p className="font-black text-emerald-800 uppercase text-[10px] tracking-wider mb-1">Category A (Fast/Heavy)</p>
                <p className="text-gray-700 font-medium leading-relaxed">Top 20% high-frequency or heavy items (e.g. Battery Packs, Chassis). Must be restricted to **Floor Levels (Level 1-2)** to prevent rack collapse and speed up forklift access.</p>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-sm">
                <p className="font-black text-blue-800 uppercase text-[10px] tracking-wider mb-1">Category B (Medium Velocity)</p>
                <p className="text-gray-700 font-medium leading-relaxed">Next 30% average turnout items (e.g. Cables, MCU). Kept on **Mid-Levels (Level 3-4)** in the middle aisles for ergonomic human-picker access.</p>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-sm">
                <p className="font-black text-gray-600 uppercase text-[10px] tracking-wider mb-1">Category C (Slow-Moving)</p>
                <p className="text-gray-700 font-medium leading-relaxed">Bottom 50% slow stock. Allowed on **Top Shelves (Level 5+)** or remote corridors back at Zone D/E.</p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ── TAB 3: INBOUND CAPACITY PROJECTION FORECAST TOOL ── */}
      {activeTab === 'PROJECTION' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* PARAMETERS FORM */}
          <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-6 flex flex-col h-fit">
            <h3 className="font-black text-xs uppercase text-[#125ab2] tracking-wider border-b border-gray-100 pb-3 flex items-center gap-2">
              <span>🔮</span> Payload Capacity Simulator
            </h3>
            
            {/* PRESETS TIMESTAMPS */}
            <div className="mt-4">
              <span className="block text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-wider">Load Upcoming PO Cargo Profile</span>
              <div className="flex flex-col gap-2">
                {poPresets.map((preset, i) => (
                  <button key={i} type="button" onClick={() => applyPoPreset(preset)} className="text-left bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-[#125ab2] p-3 rounded-sm transition-all flex justify-between items-center group shadow-sm">
                    <span className="font-semibold text-gray-700 group-hover:text-[#125ab2] text-xs truncate max-w-[200px]">{preset.id}</span>
                    <span className="font-black font-mono text-gray-400 group-hover:text-[#125ab2] text-[10px]">{preset.cbm} CBM</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 my-5"></div>

            {/* SIMULATION FORM */}
            <form onSubmit={handleRunSimulation} className="space-y-4 text-xs flex-1">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Cargo Reference ID</label>
                <input type="text" value={projectionForm.poId} onChange={e => setProjectionForm({...projectionForm, poId: e.target.value})} className="w-full border border-gray-300 rounded-sm p-2.5 font-mono font-bold text-gray-800 outline-none focus:border-[#125ab2] focus:ring-1 focus:ring-[#125ab2] transition-all" required/>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#125ab2] uppercase tracking-wider mb-1.5">Total Vol (CBM)</label>
                  <input type="number" value={projectionForm.cbm} onChange={e => setProjectionForm({...projectionForm, cbm: e.target.value})} className="w-full border border-gray-300 rounded-sm p-2.5 font-black font-mono text-lg text-[#125ab2] outline-none focus:border-[#125ab2] transition-all" required/>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#125ab2] uppercase tracking-wider mb-1.5">Total Weight (KG)</label>
                  <input type="number" value={projectionForm.weight} onChange={e => setProjectionForm({...projectionForm, weight: e.target.value})} className="w-full border border-gray-300 rounded-sm p-2.5 font-black font-mono text-lg text-[#125ab2] outline-none focus:border-[#125ab2] transition-all" required/>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Target Placement Zone</label>
                <select value={projectionForm.zoneTarget} onChange={e => setProjectionForm({...projectionForm, zoneTarget: e.target.value})} className="w-full border border-gray-300 rounded-sm p-2.5 outline-none focus:border-[#125ab2] font-bold text-gray-800 bg-gray-50 cursor-pointer">
                  {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </div>

              <button type="submit" className="w-full bg-gray-800 hover:bg-black text-white font-bold py-3 rounded-sm tracking-widest uppercase transition-colors shadow-sm text-[11px] mt-4 flex items-center justify-center gap-2">
                <span>▶</span> Execute Projection
              </button>
            </form>
          </div>

          {/* REPORT SCREEN COVERS */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-sm shadow-sm flex flex-col overflow-hidden">
            <div className="bg-slate-50 border-b border-gray-200 px-6 py-4">
              <h3 className="font-black text-xs uppercase text-gray-800 tracking-wider">Forecast Output Report</h3>
            </div>
            
            <div className="p-8 flex-1 flex flex-col items-center justify-center bg-gray-50/50">
              {!projectionResult ? (
                <div className="text-center text-gray-400 py-16">
                  <span className="text-5xl block mb-4 opacity-40">⚖️</span>
                  <p className="font-black text-base uppercase tracking-widest text-gray-500 mb-2">Awaiting Parameters</p>
                  <p className="text-xs max-w-[380px] mx-auto leading-relaxed font-medium">Enter cargo dimensions or select a preset to simulate structural and volumetric thresholds against current live warehouse capacity.</p>
                </div>
              ) : (
                <div className="w-full space-y-6 max-w-[600px] animate-fade-in">
                  
                  <div className={`p-6 rounded-sm border-2 text-center shadow-sm ${
                    projectionResult.success ? 'bg-emerald-50 border-emerald-400 text-emerald-900' : 'bg-red-50 border-red-400 text-red-900'
                  }`}>
                    <span className="text-[10px] uppercase font-bold tracking-widest block mb-2 opacity-80">Simulation Verdict</span>
                    <p className="text-2xl font-black tracking-wide leading-tight">
                      {projectionResult.success ? '✅ CARGO ALLOCATION CLEARED' : '❌ STRUCTURAL / VOLUME OVERLOAD'}
                    </p>
                    <p className="text-xs mt-3 font-semibold opacity-80 bg-white/50 inline-block px-3 py-1 rounded-sm border border-current">Target Vector: {projectionResult.zoneName}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                    
                    {/* VOLUME ACCORDANCE */}
                    <div className="border border-gray-200 p-5 rounded-sm bg-white shadow-sm">
                      <div className="flex justify-between items-center mb-2 font-bold border-b border-gray-100 pb-2">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">Spatial Volume Assessment</span>
                        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm ${projectionResult.volumeFit ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700 animate-pulse'}`}>
                          {projectionResult.volumeFit ? 'Fits ✓' : 'Overflow ⚠'}
                        </span>
                      </div>
                      <p className="text-3xl font-black text-[#125ab2] mt-2 font-mono">{projectionResult.projectedVolUtil}%</p>
                      <p className="text-[9px] text-gray-400 uppercase font-bold mt-1 tracking-wider">Projected Capacity Load</p>
                      {!projectionResult.volumeFit && (
                        <div className="text-[10px] font-black text-red-700 bg-red-50 border border-red-200 p-2 rounded-sm mt-3 text-center uppercase tracking-wider">
                          Shortage: {projectionResult.cbmShortage} CBM
                        </div>
                      )}
                    </div>

                    {/* WEIGHT ACCORDANCE */}
                    <div className="border border-gray-200 p-5 rounded-sm bg-white shadow-sm">
                      <div className="flex justify-between items-center mb-2 font-bold border-b border-gray-100 pb-2">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">Rack Structural Compliance</span>
                        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm ${projectionResult.weightFit ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700 animate-pulse'}`}>
                          {projectionResult.weightFit ? 'Secure ✓' : 'OVERLOAD 🚨'}
                        </span>
                      </div>
                      <p className={`text-3xl font-black mt-2 font-mono ${projectionResult.projectedWgtUtil > 100 ? 'text-red-600' : 'text-[#125ab2]'}`}>{projectionResult.projectedWgtUtil}%</p>
                      <p className="text-[9px] text-gray-400 uppercase font-bold mt-1 tracking-wider">Projected Tonnage Load</p>
                      {!projectionResult.weightFit && (
                        <div className="text-[10px] font-black text-red-700 bg-red-50 border border-red-200 p-2 rounded-sm mt-3 text-center uppercase tracking-wider">
                          Excess: +{projectionResult.weightShortage} KG
                        </div>
                      )}
                    </div>

                  </div>

                  <div className={`border p-4 rounded-sm text-xs shadow-sm ${projectionResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
                    <span className="font-black uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                      <span>{projectionResult.success ? '💡' : '🛡️'}</span> Logistics Countermeasures
                    </span>
                    <p className="font-medium leading-relaxed opacity-90 pl-6 border-l-2 border-current ml-1">
                      {projectionResult.success 
                        ? 'Allocation parameters verified secure. Dock Manager is authorized to issue receiving gatepasses for tomorrow\'s inbound fleet.' 
                        : 'ACTION REQUIRED: Do not admit fleet to dock. You must either run the "Space Salvage Consolidation" task to free up structural limits, or recalculate projection against a different warehouse zone.'}
                    </p>
                  </div>

                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </main>
  );
};

export default SpaceCapacity;