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

const Maintenance = () => {
  // ─── 🚀 INJEKSI: Mengambil dispatchAutoTask dari AppContext ───
  const { bahasa, dispatchAutoTask } = useContext(AppContext);

  // Helper untuk mendapatkan tanggal
  const addDays = (dateStr, days) => {
    const d = new Date(dateStr || new Date());
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  // 1. DATA MASTER ASET & MAINTENANCE (ARUS MOTORS GIGAFACTORY)
  const initialEquipments = [
    { id: 'MRO-AGV-01', name: 'KUKA Automated Guided Vehicle (Unit 1)', type: 'Robotics & Automation', location: 'Zone C (Assembly Feed)', lastService: addDays(new Date(), -45), nextService: addDays(new Date(), 45), cyclesRun: 4200, maxCycles: 5000, status: 'Healthy', vendor: 'KUKA Robotics', serialNo: 'KK-AGV-9982A' },
    { id: 'MRO-WLD-04', name: '6-Axis Spot Welding Arm', type: 'Manufacturing Rig', location: 'Chassis Assembly Line', lastService: addDays(new Date(), -120), nextService: addDays(new Date(), -2), cyclesRun: 15500, maxCycles: 15000, status: 'Under Maintenance', vendor: 'Yaskawa Motoman', serialNo: 'YS-WLD-1102X' },
    { id: 'MRO-HVC-02', name: 'Industrial Thermal Chiller Unit', type: 'HVAC & Climate', location: 'Zone B (LFP Battery Storage)', lastService: addDays(new Date(), -160), nextService: addDays(new Date(), 20), cyclesRun: 3200, maxCycles: 8000, status: 'Healthy', vendor: 'Daikin Applied', serialNo: 'DK-HV-0045V' },
    { id: 'MRO-FRK-09', name: 'Heavy Duty Reach Truck 15T', type: 'Material Handling', location: 'Inbound Dock Bay', lastService: addDays(new Date(), -85), nextService: addDays(new Date(), 5), cyclesRun: 1950, maxCycles: 2000, status: 'Healthy', vendor: 'Toyota Material Handling', serialNo: 'TY-HD-7731M' },
    { id: 'MRO-CAL-01', name: 'High-Voltage Telemetry Testing Rig', type: 'Precision QA/QC', location: 'Clean Room A', lastService: addDays(new Date(), -30), nextService: addDays(new Date(), 60), cyclesRun: 150, maxCycles: 1000, status: 'Healthy', vendor: 'Fluke Calibration', serialNo: 'FL-CAL-9922Z' },
  ];

  const [equipments, setEquipments] = useState(() => {
    try {
      const saved = window.localStorage.getItem('mroData_ARUS');
      return saved ? JSON.parse(saved) : initialEquipments;
    } catch {
      return initialEquipments;
    }
  });

  // ─── PEMBERSIH DATA LAMA ───
  useEffect(() => {
    const hasOldData = equipments.some(eq => eq.id.includes('EQ-') || eq.name.includes('Conveyor Belt'));
    if (hasOldData) setEquipments(initialEquipments);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('mroData_ARUS', JSON.stringify(equipments));
    } catch (error) {
      console.error('Failed to save MRO data:', error);
    }
  }, [equipments]);

  // 2. STATE INTERAKTIF
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [toasts, setToasts] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assetModal, setAssetModal] = useState({ isOpen: false, data: null });
  
  const [form, setForm] = useState({ 
    name: '', type: 'Robotics & Automation', location: 'Zone A (Ambient)', 
    lastService: new Date().toISOString().split('T')[0], intervalDays: 90, 
    maxCycles: 5000, vendor: '', serialNo: '' 
  });

  // 3. FUNGSI TOAST
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // 4. ENGINE PERHITUNGAN PREDICTIVE MAINTENANCE (TIME & USAGE DUAL-AXIS)
  const processedEquipments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return equipments.map(eq => {
      const nextDate = new Date(eq.nextService);
      const diffTime = nextDate - today;
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const cycleWearPct = ((eq.cyclesRun / eq.maxCycles) * 100).toFixed(1);
      const isCycleWarning = cycleWearPct >= 90;
      const isCycleCritical = cycleWearPct >= 100;

      let computedStatus = eq.status;
      if (eq.status === 'Healthy') {
        if (daysLeft < 0 || isCycleCritical) computedStatus = 'Critical / Overdue';
        else if (daysLeft <= 14 || isCycleWarning) computedStatus = 'Warning / Due Soon';
      } else if (eq.status === 'Under Maintenance') {
        computedStatus = 'LOTO ENGAGED (Repair)';
      }

      return { ...eq, daysLeft, cycleWearPct: parseFloat(cycleWearPct), computedStatus };
    });
  }, [equipments]);

  // 5. 🚀 ENGINE INTERLOCK: FUNGSI AKSI MAINTENANCE DENGAN AUTO-TASK
  const handleSendToRepair = (id) => {
    const targetAsset = equipments.find(e => e.id === id);
    
    setEquipments(equipments.map(eq => eq.id === id ? { ...eq, status: 'Under Maintenance' } : eq));
    setAssetModal({ isOpen: false, data: null });
    
    // 💥 TRIGGER INJEKSI: MENGIRIM TUGAS HSE/MRO DARURAT KE SCANNER OPERATOR
    if (dispatchAutoTask && targetAsset) {
      dispatchAutoTask({
        type: 'HSE', // Health, Safety, Environment
        desc: `EMERGENCY LOTO: Secure ${targetAsset.name} & install physical barricades`,
        zone: targetAsset.location,
        assignee: 'HSE & MRO Team',
        priority: 'Critical',
        isLocked: false, // Bebas diakses teknisi
        dependency: 'None',
        sku: 'MRO-LOTO-KIT', // Kit LOTO standard
        refId: targetAsset.id,
        qty: 1,
        notes: `DANGER. Machine ${targetAsset.id} is down. Ensure power is cut off before approaching.`
      });
    }

    addToast(`Asset ${id} locked out. LOTO Protocol Engaged & Task Sent to Scanner.`, 'error');
  };

  const handleLogService = (id, intervalDays) => {
    const today = new Date().toISOString().split('T')[0];
    const nextDue = addDays(today, intervalDays || 90);
    
    setEquipments(equipments.map(eq => 
      eq.id === id ? { ...eq, status: 'Healthy', lastService: today, nextService: nextDue, cyclesRun: 0 } : eq
    ));
    setAssetModal({ isOpen: false, data: null });
    addToast(`MRO Service logged for ${id}. Usage cycles reset to 0. Next due updated to ${nextDue}`, 'success');
  };

  // --- EXPORT TELEMETRY UNTUK POWER BI ---
  const handleExportCSV = () => {
    addToast('Compiling MRO Telemetry Data Model...', 'info');
    const headers = ['Asset_ID', 'Equipment_Name', 'Category', 'Location', 'Vendor', 'Serial_No', 'Last_Service', 'Next_Due', 'Days_Remaining', 'Current_Cycles', 'Max_Cycles', 'Wear_Percentage', 'System_Status'];
    const csvRows = [headers.join(',')];
    
    processedEquipments.forEach(eq => {
      const row = [eq.id, `"${eq.name}"`, eq.type, `"${eq.location}"`, `"${eq.vendor}"`, eq.serialNo, eq.lastService, eq.nextService, eq.daysLeft, eq.cyclesRun, eq.maxCycles, eq.cycleWearPct, `"${eq.computedStatus}"`];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `ARUS_MRO_Telemetry_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => addToast('Telemetry Data exported successfully!', 'success'), 800);
  };

  // --- GENERATE & DOWNLOAD MANUAL LOG ---
  const handleDownloadManual = (asset) => {
    addToast(`Generating Digital Service Log for ${asset.id}...`, 'info');
    
    const isLOTO = asset.computedStatus.includes('LOTO');
    const lotoWarning = isLOTO ? '\n[!!!] DANGER: LOCKOUT/TAGOUT (LOTO) IS CURRENTLY ACTIVE [!!!]\nDO NOT ENERGIZE OR OPERATE THIS EQUIPMENT UNDER ANY CIRCUMSTANCES.\n' : '';

    const fileContent = `
============================================================
ARUS MOTORS GIGAFACTORY - EQUIPMENT MRO LOG & AUDIT
============================================================
Asset ID      : ${asset.id}
Equipment     : ${asset.name}
Category      : ${asset.type}
Location      : ${asset.location}
------------------------------------------------------------
Manufacturer  : ${asset.vendor}
Serial Number : ${asset.serialNo}
------------------------------------------------------------${lotoWarning}
Current Status: ${asset.computedStatus.toUpperCase()}
Last Serviced : ${asset.lastService}
Next Due Date : ${asset.nextService} (In ${asset.daysLeft} days)

USAGE TELEMETRY (PREDICTIVE WEAR):
Cycles Run    : ${asset.cyclesRun.toLocaleString()}
Max Tolerance : ${asset.maxCycles.toLocaleString()}
Wear Level    : ${asset.cycleWearPct}%

SERVICE HISTORY & MRO LOG:
[${asset.lastService}] - Preventive maintenance & recalibration completed. Cycles reset to 0. 
[Archived] - Previous historical logs are stored in the Enterprise ERP.

MAINTENANCE & SAFETY GUIDELINES:
1. Complete pre-operation checklist and physical inspection daily.
2. Report abnormal vibrations, thermal spikes, or fluid leaks to MRO.
3. Observe all ISO 45001 safety bounds when operating in proximity.
============================================================
Generated on  : ${new Date().toLocaleString()}
Authorized By : Chief MRO Engineer
============================================================
`;

    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `MRO_Log_${asset.id}.txt`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => addToast('Digital Service Log generated successfully!', 'success'), 800);
  };

  // 6. FUNGSI REGISTER ASSET BARU
  const handleRegisterAsset = (e) => {
    e.preventDefault();
    const prefix = form.type.includes('Robotics') ? 'ROB' : form.type.includes('HVAC') ? 'HVC' : form.type.includes('QA') ? 'CAL' : 'EQP';
    const nextNum = equipments.length > 0 ? Math.max(...equipments.map(eq => parseInt(eq.id.split('-')[2]) || 0)) + 1 : 1;
    const newId = `MRO-${prefix}-${nextNum.toString().padStart(3, '0')}`;
    const nextDate = addDays(form.lastService, parseInt(form.intervalDays));

    setEquipments([...equipments, { 
      id: newId, 
      name: form.name, 
      type: form.type, 
      location: form.location, 
      lastService: form.lastService, 
      nextService: nextDate, 
      cyclesRun: 0,
      maxCycles: parseInt(form.maxCycles),
      status: 'Healthy',
      vendor: form.vendor || 'Unknown',
      serialNo: form.serialNo || 'PENDING-SN'
    }]);
    
    setIsModalOpen(false);
    setForm({ name: '', type: 'Robotics & Automation', location: 'Zone A (Ambient)', lastService: new Date().toISOString().split('T')[0], intervalDays: 90, maxCycles: 5000, vendor: '', serialNo: '' });
    addToast(`New MRO Asset ${newId} commissioned successfully!`, 'success');
  };

  // 7. SEARCH & FILTER
  const filteredData = processedEquipments.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' ? true : item.computedStatus.includes(filterStatus);
    return matchesSearch && matchesStatus;
  });

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
            {bahasa === 'en' ? 'MRO & Predictive Maintenance' : 'Pemeliharaan Prediktif & MRO'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">Track dual-axis preventive maintenance (Time & Usage) and enforce LOTO protocols.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button onClick={handleExportCSV} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2.5 rounded-sm text-xs font-bold transition-colors shadow-sm uppercase tracking-wider flex items-center justify-center gap-2 w-full md:w-auto">
            <span>⭳</span> Export Telemetry
          </button>
          <button onClick={() => setIsModalOpen(true)} className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-5 py-2.5 rounded-sm text-xs font-bold transition-colors shadow-sm uppercase tracking-wider flex items-center justify-center gap-2 w-full md:w-auto">
            <span>+</span> Commission Asset
          </button>
        </div>
      </div>

      {/* ── METRICS SUMMARY ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
        <div className="bg-white p-5 border border-gray-200 shadow-sm rounded-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Commissioned Assets</p>
          <p className="text-3xl font-black text-gray-900 mt-1 font-mono">{equipments.length}</p>
          <p className="text-[9px] text-gray-400 mt-2 font-bold uppercase tracking-wider">Total Tracked Machinery</p>
        </div>
        <div className="bg-white p-5 border-l-4 border-l-emerald-500 border border-y-gray-200 border-r-gray-200 shadow-sm rounded-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Optimal / Healthy</p>
          <p className="text-3xl font-black text-gray-800 mt-1 font-mono">{processedEquipments.filter(e => e.computedStatus === 'Healthy').length}</p>
          <p className="text-[9px] text-emerald-600 mt-2 font-bold uppercase tracking-wider">Fully Operational</p>
        </div>
        <div className="bg-white p-5 border-l-4 border-l-amber-500 border border-y-gray-200 border-r-gray-200 shadow-sm rounded-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">Predictive Warning</p>
          <p className="text-3xl font-black text-gray-800 mt-1 font-mono">{processedEquipments.filter(e => e.computedStatus.includes('Warning')).length}</p>
          <p className="text-[9px] text-amber-600 mt-2 font-bold uppercase tracking-wider">Due for Service Soon</p>
        </div>
        <div className="bg-white p-5 border-l-4 border-l-red-600 border border-y-gray-200 border-r-gray-200 shadow-sm rounded-sm relative overflow-hidden hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-red-600 tracking-wider">Overdue / LOTO Active</p>
          <p className="text-3xl font-black text-red-700 mt-1 font-mono">
            {processedEquipments.filter(e => e.computedStatus.includes('LOTO') || e.computedStatus.includes('Critical')).length}
          </p>
          <p className="text-[9px] text-red-500 mt-2 font-bold uppercase tracking-wider animate-pulse flex items-center gap-1">
            <span>🔒</span> Stand-Down Required
          </p>
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="bg-white p-3 border border-gray-300 shadow-sm rounded-sm mb-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {['ALL', 'Healthy', 'Warning', 'Critical', 'LOTO'].map(stat => (
            <button 
              key={stat} 
              onClick={() => setFilterStatus(stat)} 
              className={`px-4 py-1.5 text-xs font-bold uppercase rounded-sm border transition-colors shadow-sm ${filterStatus === stat ? 'bg-[#415a77] text-white border-[#415a77]' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-300'}`}
            >
              {stat === 'ALL' ? 'All Assets' : stat}
            </button>
          ))}
        </div>
        <input 
          type="text" 
          placeholder="Search Asset ID or Name..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 px-4 py-1.5 rounded-sm text-sm outline-none focus:border-[#125ab2] w-full sm:w-80 transition-colors"
        />
      </div>

      {/* ── TABEL DATA ASET ── */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden flex flex-col">
        <div className="bg-slate-50 border-b border-gray-200 p-3 flex justify-between items-center">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-2">MRO Master Ledger</h3>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
            <thead className="bg-[#f8f9fa] text-[#64748b] text-[10px] uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3 px-5 font-bold border-b w-64">EQUIPMENT DETAILS</th>
                <th className="py-3 px-5 font-bold border-b text-center w-36">MAINTENANCE CLOCK</th>
                <th className="py-3 px-5 font-bold border-b text-center w-40">USAGE TELEMETRY (WEAR)</th>
                <th className="py-3 px-5 font-bold border-b text-center w-44">SYSTEM STATUS</th>
                <th className="py-3 px-5 font-bold border-b text-center w-36">ACTION</th>
              </tr>
            </thead>
            <tbody className="text-[12px] text-gray-700">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-400 font-bold italic">
                    <span className="text-3xl block mb-2 opacity-50">🛡️</span>
                    No assets match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredData.map((eq, idx) => {
                  const isCritical = eq.computedStatus.includes('Critical') || eq.computedStatus.includes('LOTO');
                  const isWarning = eq.computedStatus.includes('Warning');

                  return (
                    <tr key={idx} className={`border-b border-gray-100 transition-colors ${isCritical ? 'bg-red-50/40 hover:bg-red-50' : isWarning ? 'bg-amber-50/40 hover:bg-amber-50' : 'hover:bg-blue-50/40'}`}>
                      
                      <td className="py-4 px-5">
                        <div className="font-black text-gray-900 text-[13px]">{eq.name}</div>
                        <div 
                          className="font-mono font-bold text-[#125ab2] cursor-pointer hover:underline text-[10px] mt-1 tracking-wider inline-block bg-white border border-gray-200 px-1.5 py-0.5 rounded-sm"
                          onClick={() => setAssetModal({ isOpen: true, data: eq })}
                          title="View Digital Log Book"
                        >
                          {eq.id}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1.5 uppercase font-semibold tracking-wider">Loc: <span className="font-bold text-gray-700">{eq.location}</span></div>
                      </td>

                      <td className="py-4 px-5 text-center">
                        <div className={`font-mono font-black text-sm ${isCritical ? 'text-red-700' : isWarning ? 'text-amber-600' : 'text-gray-800'}`}>
                          {eq.nextService}
                        </div>
                        <div className={`text-[9px] font-bold uppercase mt-1 tracking-wider ${eq.daysLeft < 0 ? 'text-red-600 bg-red-100 px-2 py-0.5 rounded-sm inline-block' : 'text-gray-500'}`}>
                          {eq.daysLeft < 0 ? `Overdue by ${Math.abs(eq.daysLeft)} Days` : `${eq.daysLeft} Days Left`}
                        </div>
                      </td>

                      {/* FEATURE: USAGE TELEMETRY (CYCLE TRACKER) */}
                      <td className="py-4 px-5">
                        <div className="flex justify-between items-end mb-1">
                          <span className="font-mono font-black text-gray-800 text-[13px]">{eq.cyclesRun.toLocaleString()}</span>
                          <span className={`text-[10px] font-black ${eq.cycleWearPct >= 100 ? 'text-red-600' : eq.cycleWearPct >= 90 ? 'text-amber-500' : 'text-emerald-600'}`}>{eq.cycleWearPct}%</span>
                        </div>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden shadow-inner">
                          <div className={`h-full ${eq.cycleWearPct >= 100 ? 'bg-red-500 animate-pulse' : eq.cycleWearPct >= 90 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(eq.cycleWearPct, 100)}%` }}></div>
                        </div>
                        <div className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-wider text-right">Max: {eq.maxCycles.toLocaleString()} Cycles</div>
                      </td>

                      <td className="py-4 px-5 text-center">
                        <span className={`px-2 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-wider border shadow-sm ${
                          eq.computedStatus === 'Healthy' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                          eq.computedStatus.includes('Warning') ? 'bg-amber-100 text-amber-800 border-amber-300' : 
                          eq.computedStatus.includes('LOTO') ? 'bg-gray-800 text-white border-black animate-pulse' :
                          'bg-red-100 text-red-800 border-red-300'
                        }`}>
                          {eq.computedStatus.includes('LOTO') ? '🔒 LOTO ENGAGED' : eq.computedStatus}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-center">
                        <button 
                          onClick={() => setAssetModal({ isOpen: true, data: eq })}
                          className="w-full bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 py-2 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors"
                        >
                          Manage MRO
                        </button>
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
      {/* 🛡️ MODAL 1: REGISTER ASSET (BULLETPROOF FLEXBOX)                          */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[550px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-[#125ab2]" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            <div className="bg-blue-50 border-b border-blue-100 text-gray-800 px-6 py-4 flex justify-between items-center shrink-0 z-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-gray-500">Infrastructure Management</p>
                <h3 className="font-black text-sm uppercase tracking-wider text-[#125ab2]">Commission New Asset</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-800 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <form onSubmit={handleRegisterAsset} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 text-sm flex flex-col gap-5">
                
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Equipment Formal Name <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="e.g. 6-Axis Spot Welding Arm" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] font-bold text-gray-800 rounded-sm" required autoFocus/>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Asset Category <span className="text-red-500">*</span></label>
                    <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] font-semibold text-gray-700 bg-white rounded-sm cursor-pointer">
                      <option>Robotics & Automation</option>
                      <option>Manufacturing Rig</option>
                      <option>Material Handling</option>
                      <option>HVAC & Climate</option>
                      <option>Precision QA/QC</option>
                      <option>Safety Equipment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Assigned Floor Location <span className="text-red-500">*</span></label>
                    <select value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] font-semibold text-gray-700 bg-white rounded-sm cursor-pointer">
                      <option>Zone A (Ambient)</option>
                      <option>Zone B (Cold Storage)</option>
                      <option>Zone C (Assembly Feed)</option>
                      <option>Chassis Assembly Line</option>
                      <option>Clean Room A</option>
                      <option>Inbound Dock Bay</option>
                      <option>Outbound Dispatch</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Vendor / Manufacturer</label>
                    <input type="text" placeholder="e.g. Yaskawa" value={form.vendor} onChange={e => setForm({...form, vendor: e.target.value})} className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] font-semibold rounded-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Serial Number</label>
                    <input type="text" placeholder="Serial ID" value={form.serialNo} onChange={e => setForm({...form, serialNo: e.target.value})} className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] font-mono rounded-sm uppercase" />
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-sm border border-gray-200 mt-2">
                  <p className="text-[10px] font-bold text-[#125ab2] uppercase tracking-wider mb-3 border-b border-gray-200 pb-2">Predictive Maintenance Bounds</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Commission Date</label>
                      <input type="date" value={form.lastService} onChange={e => setForm({...form, lastService: e.target.value})} className="w-full border border-gray-300 px-2 py-2 outline-none focus:border-[#125ab2] font-mono text-xs rounded-sm cursor-pointer" required />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Interval (Days)</label>
                      <select value={form.intervalDays} onChange={e => setForm({...form, intervalDays: e.target.value})} className="w-full border border-gray-300 px-2 py-2 outline-none focus:border-[#125ab2] font-semibold bg-white rounded-sm text-xs cursor-pointer">
                        <option value="30">Monthly (30D)</option>
                        <option value="90">Quarterly (90D)</option>
                        <option value="180">Bi-Annually (180D)</option>
                        <option value="365">Yearly (365D)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Max Usage Cycles</label>
                      <input type="number" min="100" step="100" value={form.maxCycles} onChange={e => setForm({...form, maxCycles: e.target.value})} className="w-full border border-gray-300 px-2 py-2 outline-none focus:border-[#125ab2] font-mono font-bold text-[#125ab2] rounded-sm" required />
                    </div>
                  </div>
                </div>

              </div>
              
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 shrink-0 z-10">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm rounded-sm">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-[#125ab2] hover:bg-[#0e4487] text-white text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors rounded-sm">Register Asset</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ MODAL 2: ASSET DETAIL & MRO CONTROL (BULLETPROOF FLEXBOX)              */}
      {/* ========================================================================= */}
      {assetModal.isOpen && assetModal.data && (() => {
        const eq = assetModal.data;
        const isLOTO = eq.computedStatus.includes('LOTO');

        return (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
            <div className={`bg-white rounded-sm w-full max-w-[500px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 ${isLOTO ? 'border-t-red-600' : 'border-t-[#125ab2]'}`} style={{ maxHeight: 'calc(100vh - 2rem)' }}>
              
              <div className={`px-6 py-4 flex justify-between items-start shrink-0 z-10 ${isLOTO ? 'bg-red-50 border-b border-red-100' : 'bg-blue-50 border-b border-blue-100'}`}>
                <div>
                  <h3 className={`font-black text-xl font-mono leading-none ${isLOTO ? 'text-red-700' : 'text-[#125ab2]'}`}>{eq.id}</h3>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1.5">{eq.type}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-sm border shadow-sm block mb-1.5 ${
                    eq.computedStatus === 'Healthy' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                    eq.computedStatus.includes('Warning') ? 'bg-amber-100 text-amber-800 border-amber-300' : 
                    isLOTO ? 'bg-gray-800 text-white border-black animate-pulse' :
                    'bg-red-100 text-red-800 border-red-300'
                  }`}>
                    {isLOTO ? '🔒 LOTO ENGAGED' : eq.computedStatus}
                  </span>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 text-sm text-gray-800 space-y-6">
                
                {isLOTO && (
                  <div className="bg-red-600 border border-red-800 p-4 rounded-sm flex items-start gap-4 shadow-sm text-white">
                    <span className="text-3xl animate-pulse">🔒</span>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-90">Lockout / Tagout Active</p>
                      <p className="text-xs font-semibold leading-relaxed">This machinery is disconnected from power sources for repair. Do not attempt to operate until MRO clears the status.</p>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="grid grid-cols-[110px_1fr] gap-2 items-center">
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Equipment Name</p>
                    <p className="col-span-1 font-black text-gray-900 border-b border-gray-100 pb-1">{eq.name}</p>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] gap-2 items-center">
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Floor Location</p>
                    <p className="col-span-1 font-bold text-gray-900 border-b border-gray-100 pb-1">{eq.location}</p>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] gap-2 items-center">
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Manufacturer</p>
                    <p className="col-span-1 font-bold text-gray-800 border-b border-gray-100 pb-1">{eq.vendor}</p>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] gap-2 items-center">
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Serial Number</p>
                    <p className="col-span-1 font-mono font-bold text-gray-800 border-b border-gray-100 pb-1 uppercase">{eq.serialNo}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 border border-gray-200 rounded-sm">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 border-b border-gray-200 pb-2 flex justify-between items-center">
                    <span>⏳ Maintenance Chronology</span>
                    <span className={`font-black ${eq.daysLeft < 0 ? 'text-red-600' : 'text-[#125ab2]'}`}>{eq.daysLeft < 0 ? `Overdue ${Math.abs(eq.daysLeft)}d` : `Due in ${eq.daysLeft}d`}</span>
                  </p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 font-semibold">Last Serviced:</span>
                      <span className="font-mono font-bold text-gray-800">{eq.lastService}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 font-semibold">Next Deadline:</span>
                      <span className="font-mono font-black text-[#125ab2]">{eq.nextService}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 border border-gray-200 rounded-sm">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 border-b border-gray-200 pb-2 flex justify-between items-center">
                    <span>⚙️ Usage Telemetry (Wear)</span>
                    <span className={`font-black ${eq.cycleWearPct >= 100 ? 'text-red-600' : eq.cycleWearPct >= 90 ? 'text-amber-600' : 'text-emerald-600'}`}>{eq.cycleWearPct}% Limit</span>
                  </p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 font-semibold">Cycles Executed:</span>
                      <span className="font-mono font-bold text-gray-800">{eq.cyclesRun.toLocaleString()} runs</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 font-semibold">Max Tolerance:</span>
                      <span className="font-mono font-bold text-gray-500">{eq.maxCycles.toLocaleString()} limit</span>
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="pt-2">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Managerial MRO Actions</p>
                  <div className="flex flex-col gap-2.5">
                    {!isLOTO && (
                      <button onClick={() => handleSendToRepair(eq.id)} className="w-full bg-red-600 hover:bg-red-700 text-white p-3 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm flex justify-between items-center transition-colors">
                        <span className="flex items-center gap-2"><span>🔒</span> Suspend Operations (Engage LOTO)</span>
                        <span>→</span>
                      </button>
                    )}
                    <button onClick={() => handleLogService(eq.id, 90)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm flex justify-between items-center transition-colors">
                      <span className="flex items-center gap-2"><span>✅</span> Certify Maintenance & Reset Cycles</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>

              </div>

              <div className="bg-gray-100 border-t border-gray-300 px-6 py-4 shrink-0 z-10 flex gap-3">
                <button 
                  onClick={() => handleDownloadManual(eq)}
                  className="w-1/2 bg-white hover:bg-gray-50 text-gray-800 py-3 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm border border-gray-300 flex items-center justify-center gap-2"
                >
                  <span>⭳</span> Download MRO Log
                </button>
                <button 
                  onClick={() => setAssetModal({ isOpen: false, data: null })} 
                  className="w-1/2 bg-gray-800 hover:bg-black text-white py-3 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </main>
  );
};

export default Maintenance;