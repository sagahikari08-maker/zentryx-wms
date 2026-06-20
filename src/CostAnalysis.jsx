import React, { useState, useContext, useEffect, useMemo } from 'react';
import { AppContext } from './AppContext';

// ─── TOAST COMPONENT (Aman dari Bug Klik/Pointer Events) ─────────────────────
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
    {toasts.map(({ id, message, type }) => (
      <div key={id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-sm shadow-xl text-white text-xs font-semibold min-w-[280px] border-l-4 ${
        type === 'success' ? 'bg-emerald-600 border-emerald-800' : 
        type === 'error' ? 'bg-red-600 border-red-800' : 
        type === 'warning' ? 'bg-amber-500 border-amber-700' : 'bg-[#125ab2] border-blue-800'
      }`}>
        <span className="text-base">{type === 'success' ? '✓' : type === 'error' ? '🚨' : type === 'warning' ? '⚠️' : 'ℹ'}</span>
        <span className="flex-1">{message}</span>
        <button onClick={() => removeToast(id)} className="opacity-70 hover:opacity-100 text-lg leading-none">×</button>
      </div>
    ))}
  </div>
);

const CostAnalysis = () => {
  // ─── 🚀 INJEKSI: Mengambil Urat Nadi Data Global ───
  const { bahasa, poData, setPoData } = useContext(AppContext);

  const [dateRange, setDateRange] = useState('This Month (MTD)');
  const [toasts, setToasts] = useState([]);
  
  // Triage Modal State
  const [actionModal, setActionModal] = useState({ isOpen: false, data: null, type: '' });

  // 1. DATA ACTIVITY-BASED COSTING (ABC) UNTUK EV
  const activityCosts = [
    { activity: 'HV Battery Handling & Staging (Per Pack)', currentCost: 145.00, targetCost: 120.00, variance: '+20%', status: 'Inefficient' },
    { activity: 'Precision Kitting (Per MCU Set)', currentCost: 32.50, targetCost: 28.00, variance: '+16%', status: 'Inefficient' },
    { activity: 'Automated Clean-Room Storage (Per CBM/Day)', currentCost: 8.50, targetCost: 8.50, variance: '0%', status: 'Optimal' },
    { id: 'ACT-04', activity: 'Chassis Rack Transfer (Per Move)', currentCost: 12.00, targetCost: 15.00, variance: '-20%', status: 'Optimal' },
  ];

  // 2. DATA SUPERVISOR OVERTIME LEADERBOARD
  const [otLeaderboard, setOtLeaderboard] = useState([
    { id: 'SPV-ARS-01', name: 'Budi Santoso', shift: 'Shift 2 (Evening)', otHours: 145, otCost: 18500, cause: 'AGV Network Malfunction Delay', status: 'Critical' },
    { id: 'SPV-ARS-02', name: 'Arief Rahman', shift: 'Shift 3 (Night)', otHours: 92, otCost: 11500, cause: 'Late Heavy-Chassis Inbound', status: 'Warning' },
    { id: 'SPV-ARS-03', name: 'Siti Aminah', shift: 'Shift 1 (Morning)', otHours: 24, otCost: 3000, cause: 'Normal Ops Padding', status: 'Good' },
  ]);

  // 3. DATA CONSUMABLES WASTE RADAR (SCRAP & YIELD)
  const [consumables, setConsumables] = useState([
    { item: 'Thermal Paste Syringes (Industrial)', allocation: 2000, used: 3100, wastedValue: 22000, wastePct: 55, status: 'Critical Bleed' },
    { item: 'Anti-Static Bubble Wrap (Rolls)', allocation: 500, used: 545, wastedValue: 4500, wastePct: 9, status: 'Bleeding' },
    { item: 'Heavy-Duty Steel Strapping (Meters)', allocation: 10000, used: 10500, wastedValue: 500, wastePct: 5, status: 'Normal' },
  ]);

  // 4. DATA FINANCIAL LEAKAGE (MACRO CAPEX/OPEX)
  const initialLeaks = [
    { id: 'LEAK-ARS-01', department: 'Inbound Logistics', issue: 'Hazmat Quarantine Holding Fines', wasteAmount: 15000, status: 'Bleeding' },
    { id: 'LEAK-ARS-02', department: 'Facility Maintenance', issue: 'HVAC Energy Spike (Cold Storage B)', wasteAmount: 8500, status: 'Bleeding' },
  ];

  const [financialLeaks, setFinancialLeaks] = useState(initialLeaks);

  // ─── 🚀 ENGINE INTERLOCK: AUTOGENERATE FINANCIAL LEAKS DARI PO DISPUTES ───
  useEffect(() => {
    if (!poData) return;
    
    // Cari PO yang sedang di-hold karena Discrepancy (Dari ReceivePO/Procurement)
    const discrepancyPOs = poData.filter(po => po.discrepancy);
    
    if (discrepancyPOs.length > 0) {
      setFinancialLeaks(prev => {
        let newLeaks = [...prev];
        discrepancyPOs.forEach(po => {
          const leakId = `LEAK-${po.id}`;
          // Jika leak untuk PO ini belum ada di tabel, tambahkan!
          if (!newLeaks.some(l => l.id === leakId)) {
            newLeaks.unshift({
              id: leakId,
              department: 'Procurement (Vendor Penalty)',
              issue: `Supply Chain Blockage: ${po.vendor} (Hold Dispute)`,
              wasteAmount: (po.amount || 25000000) * 0.005, // Asumsi penalti harian 0.5% dari nilai PO
              status: 'Bleeding',
              isPoLink: true, // Flag khusus untuk Executive Override
              poRef: po.id
            });
          }
        });
        return newLeaks;
      });
    }
  }, [poData]);

  // ─── 🚀 ENGINE INTERLOCK: DYNAMIC FINANCIAL KPIs ───
  const dynamicKpis = useMemo(() => {
    // Tambahkan overhead dari seluruh PO aktif ke Total Operating Cost
    const poOverhead = (poData || []).reduce((sum, po) => sum + ((po.amount || 0) * 0.002), 0);
    const baseOpsCost = 1250000;
    const totalOps = baseOpsCost + (poOverhead / 15000); // Penyesuaian scale mata uang USD
    
    const trendPct = (((totalOps / baseOpsCost) - 1) * 100).toFixed(1);

    return {
      totalOperatingCost: { value: totalOps, budget: baseOpsCost, trend: `+${trendPct}%` },
      consumablesWaste: { value: 45000, target: 15000, trend: 'HIGH' },
      overtimeBurnRate: { value: 125000, target: 50000, trend: 'CRITICAL' },
      costPerTonnageMoved: { value: 145.50, target: 120.00, trend: '+$25.50' }
    };
  }, [poData]);


  // ─── FUNGSI TOAST ───
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // ─── PROACTIVE FEATURE: EXPORT COST FORENSICS CSV ───
  const handleExportCSV = () => {
    addToast('Compiling Activity-Based Costing & Waste Ledgers...', 'info');
    
    let csvContent = "--- ACTIVITY BASED COSTING (ABC) ---\n";
    csvContent += "Activity,Current Cost (USD),Target Cost (USD),Variance,Status\n";
    activityCosts.forEach(act => {
      csvContent += `"${act.activity}",${act.currentCost},${act.targetCost},${act.variance},${act.status}\n`;
    });

    csvContent += "\n--- SCRAP & CONSUMABLES WASTE ---\n";
    csvContent += "Item,Allocated,Used,Wasted Value (USD),Scrap Rate (%),Status\n";
    consumables.forEach(c => {
      csvContent += `"${c.item}",${c.allocation},${c.used},${c.wastedValue},${c.wastePct},${c.status}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `ARUS_Cost_Forensics_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    setTimeout(() => addToast('Cost Forensics Report Downloaded!', 'success'), 800);
  };

  // ─── FUNGSI EKSEKUSI MANAJERIAL TRIAGE ───
  const handleIssueWarning = (spv) => {
    addToast(`KPI WARNING ISSUED: Official reprimand sent to Team Leader ${spv.name} for excessive OT burn rate. Formal CAPA required.`, 'warning');
    setOtLeaderboard(otLeaderboard.map(s => s.id === spv.id ? { ...s, status: 'Under Review' } : s));
    setActionModal({ isOpen: false, data: null, type: '' });
  };

  const handleTriggerPackagingAudit = (material) => {
    addToast(`AUDIT TRIGGERED: Quality Control dispatched to assembly lines to investigate ${material.wastePct}% scrap rate on ${material.item}.`, 'info');
    setConsumables(consumables.map(c => c.item === material.item ? { ...c, status: 'Auditing' } : c));
    setActionModal({ isOpen: false, data: null, type: '' });
  };

  const handleResolveMacroLeak = (leak) => {
    // 💥 🚀 THE APEX INTERLOCK: EXECUTIVE OVERRIDE MEMBUKA GEMBOK RANTAI PASOK
    if (leak.isPoLink && setPoData) {
      setPoData(prevPOs => prevPOs.map(po => 
        po.id === leak.poRef ? { ...po, discrepancy: null, status: 'Pending' } : po
      ));
      addToast(`EXECUTIVE OVERRIDE: Emergency funds deployed! PO ${leak.poRef} has been forcefully unblocked in Procurement/Receiving.`, 'success');
    } else {
      addToast(`CAPEX/OPEX RELEASED: Immediate intervention executed for ${leak.department}. Financial bleeding contained.`, 'success');
    }
    
    setFinancialLeaks(financialLeaks.map(l => l.id === leak.id ? { ...l, status: 'Contained' } : l));
    setActionModal({ isOpen: false, data: null, type: '' });
  };

  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 animate-fade-in">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>📊 Analytics</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Financials</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide flex items-center gap-2">
            {bahasa === 'en' ? 'Micro-Costing & Yield Forensics' : 'Forensik Biaya Mikro & Pemborosan'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">Audit overhead burn rates, track physical ABC handling costs, and stop material shrinkage.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-red-300 px-4 py-2.5 rounded-sm text-xs font-bold text-red-900 outline-none focus:border-red-600 shadow-sm bg-red-50 cursor-pointer transition-colors"
          >
            <option>This Month (MTD)</option>
            <option>Last Month (Closed)</option>
            <option>Q3 Year-to-Date</option>
          </select>
          <button 
            onClick={handleExportCSV} 
            className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-5 py-2.5 rounded-sm text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-2 uppercase tracking-wider w-full md:w-auto"
          >
            <span>⭳</span> Export Forensics
          </button>
        </div>
      </div>

      {/* ── TOP KPI WIDGETS (MACRO FINANCIALS) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
        <div className="bg-red-50 p-5 border border-red-200 shadow-sm rounded-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-red-800 tracking-wider">Total Operating Cost</p>
          <div className="flex items-end gap-2 mt-1">
            <p className="text-3xl font-black text-red-700 font-mono">${(dynamicKpis.totalOperatingCost.value / 1000000).toFixed(2)}M</p>
          </div>
          <p className="text-[9px] text-red-700 mt-3 font-bold uppercase bg-red-200 w-max px-2 py-0.5 rounded border border-red-300">
            {dynamicKpis.totalOperatingCost.trend} Over Budget
          </p>
        </div>

        <div className="bg-white p-5 border border-gray-200 shadow-sm rounded-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Overtime Labor Burn Rate</p>
          <div className="flex items-end gap-2 mt-1">
            <p className="text-3xl font-black text-red-600 font-mono">${(dynamicKpis.overtimeBurnRate.value / 1000).toFixed(1)}K</p>
          </div>
          <p className="text-[9px] text-white mt-3 font-bold uppercase bg-red-600 w-max px-2 py-0.5 rounded animate-pulse shadow-sm">
            {dynamicKpis.overtimeBurnRate.trend} BLEEDING
          </p>
        </div>

        <div className="bg-white p-5 border border-gray-200 shadow-sm rounded-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Cost Per Tonnage Moved (ABC)</p>
          <div className="flex items-end gap-2 mt-1">
            <p className="text-3xl font-black text-orange-600 font-mono">${(dynamicKpis.costPerTonnageMoved.value).toFixed(2)}</p>
          </div>
          <p className="text-[9px] text-orange-600 mt-3 font-bold uppercase tracking-wider">Target: ${(dynamicKpis.costPerTonnageMoved.target).toFixed(2)}</p>
        </div>

        <div className="bg-amber-50 p-5 border border-amber-200 shadow-sm rounded-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Consumables Scrap Value</p>
          <div className="flex items-end gap-2 mt-1">
            <p className="text-3xl font-black text-amber-700 font-mono">${(dynamicKpis.consumablesWaste.value / 1000).toFixed(1)}K</p>
          </div>
          <p className="text-[9px] text-amber-700 mt-3 font-bold uppercase tracking-wider">Assembly materials wasted</p>
        </div>
      </div>

      {/* ── MIDDLE ROW: ACTIVITY COSTING & CONSUMABLES WASTE ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        
        {/* ACTIVITY-BASED COSTING WIDGET */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-sm flex flex-col hover:shadow-md transition-shadow overflow-hidden">
          <div className="bg-slate-50 border-b border-gray-200 px-5 py-4">
            <h3 className="font-bold text-xs uppercase text-gray-800 tracking-wider">Activity-Based Costing (ABC)</h3>
            <p className="text-[10px] text-gray-500 mt-1 font-semibold leading-relaxed">Measuring the physical price of gigafactory logistics operations.</p>
          </div>
          <div className="p-0 overflow-x-auto flex-1">
            <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
              <thead className="bg-[#f8f9fa] text-[#64748b] text-[10px] uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-5 font-bold border-b">Physical Activity</th>
                  <th className="py-3 px-5 font-bold border-b text-right">Actual Cost</th>
                  <th className="py-3 px-5 font-bold border-b text-right">Standard Target</th>
                  <th className="py-3 px-5 font-bold border-b text-center">Variance</th>
                </tr>
              </thead>
              <tbody className="text-[12px] text-gray-700">
                {activityCosts.map((act, idx) => (
                  <tr key={idx} className={`border-b border-gray-100 transition-colors ${act.status === 'Inefficient' ? 'hover:bg-red-50/30' : 'hover:bg-emerald-50/30'}`}>
                    <td className="py-4 px-5 font-bold text-[#125ab2]">{act.activity}</td>
                    <td className={`py-4 px-5 text-right font-mono font-black text-[13px] ${act.status === 'Inefficient' ? 'text-red-600' : 'text-emerald-600'}`}>${act.currentCost.toFixed(2)}</td>
                    <td className="py-4 px-5 text-right font-mono font-bold text-gray-500">${act.targetCost.toFixed(2)}</td>
                    <td className="py-4 px-5 text-center">
                      <span className={`px-2 py-1 rounded-sm text-[9px] font-black uppercase tracking-wider border ${act.status === 'Inefficient' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                        {act.variance} {act.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CONSUMABLES WASTE RADAR (SCRAP & YIELD) */}
        <div className="bg-white border border-amber-300 shadow-sm rounded-sm flex flex-col hover:shadow-md transition-shadow overflow-hidden">
          <div className="bg-amber-50 border-b border-amber-200 px-5 py-4">
            <h3 className="font-bold text-xs uppercase text-amber-900 tracking-wider flex items-center gap-2">
              <span>📦</span> Consumables Scrap & Yield Radar
            </h3>
            <p className="text-[10px] text-amber-700 mt-1 font-semibold leading-relaxed">Detecting over-packaging, assembly material damage, and scrap rates.</p>
          </div>
          <div className="p-5 flex flex-col gap-4 flex-1 overflow-y-auto">
            {consumables.map((item, idx) => (
              <div key={idx} className="border border-gray-200 p-4 rounded-sm bg-gray-50 relative overflow-hidden group hover:border-[#125ab2] transition-colors shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-[13px] font-black text-gray-900 leading-tight">{item.item}</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Budgeted: {item.allocation} | Used: <span className="text-red-600 font-black">{item.used}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-amber-600 font-mono">${(item.wastedValue).toLocaleString('en-US')} Wasted</p>
                    <span className={`inline-block mt-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-sm tracking-wider border ${item.wastePct > 10 ? 'bg-red-600 text-white border-red-700' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
                      {item.wastePct}% Scrap Rate
                    </span>
                  </div>
                </div>
                
                {/* Mitigation Button overlaying on hover */}
                {item.status !== 'Auditing' && item.wastePct > 5 && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button 
                      onClick={() => setActionModal({ isOpen: true, data: item, type: 'audit' })}
                      className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-sm shadow-md transition-transform transform scale-95 group-hover:scale-100"
                    >
                      Trigger QA Audit Triage
                    </button>
                  </div>
                )}
                {item.status === 'Auditing' && (
                  <div className="absolute right-4 bottom-4 text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1 animate-pulse">
                    <span>🔍</span> Under QA Audit
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── BOTTOM ROW: OT LEADERBOARD & MACRO LEAKS ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* SUPERVISOR OT LEADERBOARD (KIRI) */}
        <div className="xl:col-span-2 bg-white border border-red-200 shadow-sm rounded-sm flex flex-col overflow-hidden hover:shadow-md transition-shadow">
          <div className="bg-gradient-to-r from-red-800 to-red-600 border-b border-red-900 px-5 py-4 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-xs uppercase text-white tracking-wider flex items-center gap-2">
                <span>⏱️</span> Shift & Supervisor OT Leaderboard
              </h3>
              <p className="text-[10px] text-red-100 mt-1 font-semibold leading-relaxed">Accountability tracker for excessive labor budget burn rates.</p>
            </div>
          </div>
          
          <div className="p-0 overflow-x-auto flex-1">
            <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
              <thead className="bg-red-50 text-red-900 text-[10px] uppercase tracking-wider border-b border-red-200">
                <tr>
                  <th className="py-3 px-5 font-bold border-b">Team Leader / Shift</th>
                  <th className="py-3 px-5 font-bold border-b text-center">OT Hours</th>
                  <th className="py-3 px-5 font-bold border-b text-right">OT Cost Wasted</th>
                  <th className="py-3 px-5 font-bold border-b">System Diagnosis</th>
                  <th className="py-3 px-5 font-bold border-b text-center w-36">Action Center</th>
                </tr>
              </thead>
              <tbody className="text-[12px] text-gray-700">
                {otLeaderboard.map((spv, idx) => (
                  <tr key={idx} className={`border-b border-gray-100 transition-colors ${spv.status === 'Under Review' ? 'bg-gray-50 grayscale opacity-60' : spv.status === 'Critical' ? 'bg-red-50/40 hover:bg-red-50' : 'hover:bg-slate-50'}`}>
                    <td className="py-4 px-5">
                      <div className="font-black text-gray-900 text-[13px]">{spv.name}</div>
                      <div className="text-[10px] font-bold text-[#125ab2] mt-0.5 uppercase tracking-wider">{spv.shift}</div>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className={`font-black text-lg ${spv.otHours > 50 ? 'text-red-600' : 'text-emerald-600'}`}>{spv.otHours}h</span>
                    </td>
                    <td className="py-4 px-5 text-right font-mono font-black text-red-700 text-sm">
                      ${(spv.otCost).toLocaleString('en-US')}
                    </td>
                    <td className="py-4 px-5">
                      <span className="text-[11px] font-bold text-gray-600 italic">"{spv.cause}"</span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      {spv.status === 'Under Review' ? (
                        <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest border border-amber-300 bg-amber-100 px-3 py-1.5 rounded-sm">Under KPI Review</span>
                      ) : spv.status !== 'Good' ? (
                        <button 
                          onClick={() => setActionModal({ isOpen: true, data: spv, type: 'kpi' })}
                          className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors"
                        >
                          Triage CAPA
                        </button>
                      ) : (
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-sm border border-emerald-200">✓ Optimal</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FINANCIAL LEAKS (KANAN) */}
        <div className="bg-white border border-gray-300 shadow-sm rounded-sm flex flex-col hover:shadow-md transition-shadow overflow-hidden">
          <div className="bg-slate-50 border-b border-gray-200 px-5 py-4">
            <h3 className="font-bold text-xs uppercase text-gray-800 tracking-wider">Macro Financial Leaks</h3>
            <p className="text-[10px] text-gray-500 mt-1 font-semibold leading-relaxed">System-detected CAPEX/OPEX anomalies.</p>
          </div>
          <div className="p-5 flex flex-col gap-4 flex-1 overflow-y-auto">
            {financialLeaks.map((leak, idx) => (
              <div key={idx} className={`border p-4 rounded-sm shadow-sm transition-all ${leak.status === 'Contained' ? 'border-emerald-200 bg-emerald-50 opacity-60' : 'border-red-200 bg-red-50 hover:border-red-300'}`}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-xs font-black text-gray-900 leading-tight pr-4">{leak.issue}</h4>
                  <span className="font-mono font-black text-xs text-red-600">-${(leak.wasteAmount).toLocaleString('en-US')}</span>
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-3">{leak.department}</p>
                {leak.status === 'Contained' ? (
                  <div className="text-[9px] font-black text-emerald-700 uppercase tracking-widest bg-emerald-100 border border-emerald-200 px-2 py-1.5 rounded-sm text-center">
                    ✓ Funds Released / Contained
                  </div>
                ) : (
                  <button onClick={() => setActionModal({ isOpen: true, data: leak, type: 'leak' })} className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-sm shadow-sm w-full transition-colors">
                    Execute Mitigation
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 🛡️ MULTI-PURPOSE TRIAGE MODAL (BULLETPROOF FLEXBOX ARCHITECTURE)          */}
      {/* ========================================================================= */}
      {actionModal.isOpen && actionModal.data && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
          <div className={`bg-white rounded-sm w-full max-w-[500px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 ${
            actionModal.type === 'kpi' ? 'border-t-red-700' : actionModal.type === 'audit' ? 'border-t-amber-600' : 'border-t-gray-800'
          }`} style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            {/* HEADER */}
            <div className={`px-6 py-4 flex justify-between items-center text-white shrink-0 z-10 ${
              actionModal.type === 'kpi' ? 'bg-red-700' : actionModal.type === 'audit' ? 'bg-amber-600' : 'bg-gray-800'
            }`}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 opacity-80">Forensics Command Center</p>
                <h3 className="font-black text-sm uppercase tracking-wider">
                  {actionModal.type === 'kpi' ? 'Supervisor KPI Intervention' : actionModal.type === 'audit' ? 'QA Scrap & Yield Audit' : 'Financial Triage'}
                </h3>
              </div>
              <button onClick={() => setActionModal({ isOpen: false, data: null, type: '' })} className="text-white opacity-70 hover:opacity-100 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            {/* BODY */}
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 text-sm text-gray-800 space-y-5">
              
              {/* KONTEN MODAL BERDASARKAN TIPE */}
              {actionModal.type === 'kpi' && (
                <>
                  <div className="bg-red-50 border border-red-200 p-5 rounded-sm text-center shadow-inner">
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1">Target Personnel</p>
                    <p className="text-xl font-black text-gray-900 leading-tight">{actionModal.data.name}</p>
                    <p className="text-[10px] font-bold text-[#125ab2] uppercase tracking-wider mt-1">{actionModal.data.shift}</p>
                    
                    <div className="mt-4 bg-white border border-red-200 p-3 rounded-sm">
                      <p className="text-xs text-red-700 font-bold">Wasted <span className="font-mono text-sm">${(actionModal.data.otCost).toLocaleString('en-US')}</span> in Overtime Burn Rate.</p>
                    </div>
                    <p className="text-[10px] mt-3 bg-red-100 py-1.5 px-3 rounded-sm inline-block text-red-800 font-bold uppercase tracking-wider border border-red-200">System Diagnosis: {actionModal.data.cause}</p>
                  </div>
                  <button onClick={() => handleIssueWarning(actionModal.data)} className="w-full bg-red-600 hover:bg-red-700 text-white p-3.5 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm flex justify-between items-center transition-colors">
                    <span className="flex items-center gap-2"><span>✉️</span> Issue Official KPI Warning (CAPA)</span>
                    <span>→</span>
                  </button>
                </>
              )}

              {actionModal.type === 'audit' && (
                <>
                  <div className="bg-amber-50 border border-amber-200 p-5 rounded-sm text-center shadow-inner">
                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1">Commodity Target</p>
                    <p className="text-lg font-black text-gray-900 leading-tight">{actionModal.data.item}</p>
                    
                    <div className="mt-4 bg-white border border-amber-200 p-3 rounded-sm text-center">
                      <p className="text-xs text-amber-800 font-bold">Scrap Rate is abnormally high at <span className="font-black text-lg text-red-600">{actionModal.data.wastePct}%</span>.</p>
                    </div>
                    <p className="text-[10px] mt-3 font-bold text-gray-500 uppercase tracking-wider">Value of Wasted Material: <span className="font-mono text-amber-700 font-black">${(actionModal.data.wastedValue).toLocaleString('en-US')}</span></p>
                  </div>
                  <button onClick={() => handleTriggerPackagingAudit(actionModal.data)} className="w-full bg-amber-500 hover:bg-amber-600 text-white p-3.5 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm flex justify-between items-center transition-colors">
                    <span className="flex items-center gap-2"><span>📋</span> Dispatch QA For Floor Audit</span>
                    <span>→</span>
                  </button>
                </>
              )}

              {actionModal.type === 'leak' && (
                <>
                  <div className="bg-gray-50 border border-gray-300 p-5 rounded-sm text-center shadow-inner">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Macro Financial Leak Detected</p>
                    <p className="text-lg font-black text-gray-900 leading-tight">{actionModal.data.issue}</p>
                    <p className="text-[10px] font-bold text-[#125ab2] uppercase tracking-wider mt-1">{actionModal.data.department}</p>
                    
                    <div className="mt-4 bg-red-50 border border-red-200 p-3 rounded-sm">
                      <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-0.5">Projected Loss</p>
                      <p className="text-2xl text-red-700 font-mono font-black">-${(actionModal.data.wasteAmount).toLocaleString('en-US')}</p>
                    </div>

                    {/* INTERLOCK NOTIFICATION UNTUK EXECUTIVE */}
                    {actionModal.data.isPoLink && (
                      <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider mt-4 border border-amber-300 bg-amber-50 p-2 rounded">
                        ⚠️ Authorizing this will forcefully UNBLOCK the supply chain holding at the receiving dock.
                      </p>
                    )}
                  </div>
                  <button onClick={() => handleResolveMacroLeak(actionModal.data)} className="w-full bg-[#125ab2] hover:bg-[#0e4487] text-white p-3.5 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm flex justify-between items-center transition-colors">
                    <span className="flex items-center gap-2"><span>💳</span> Authorize Emergency Mitigation Funds</span>
                    <span>→</span>
                  </button>
                </>
              )}

            </div>

            {/* FOOTER */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end shrink-0 z-10">
              <button onClick={() => setActionModal({ isOpen: false, data: null, type: '' })} className="w-full sm:w-auto px-6 py-2.5 bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 text-[10px] font-bold uppercase tracking-wider transition-colors rounded-sm shadow-sm">
                Cancel / Close
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
};

export default CostAnalysis;