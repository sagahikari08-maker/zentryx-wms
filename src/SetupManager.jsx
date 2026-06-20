import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AppContext } from './AppContext';

// ─── TOAST COMPONENT (Aman dari Bug Klik/Pointer Events) ─────────────────────
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
    {toasts.map(({ id, message, type }) => (
      <div key={id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-sm shadow-xl text-white text-xs font-semibold min-w-[280px] border-l-4 ${
        type === 'success' ? 'bg-emerald-600 border-emerald-800' : 
        type === 'error' ? 'bg-red-600 border-red-800' : 
        type === 'warning' ? 'bg-amber-500 border-amber-800' : 
        type === 'info' ? 'bg-[#125ab2] border-blue-800' : 'bg-purple-600 border-purple-800'
      }`}>
        <span className="text-base">{type === 'success' ? '✓' : type === 'error' ? '🚨' : type === 'warning' ? '⚠️' : 'ℹ'}</span>
        <span className="flex-1">{message}</span>
        <button onClick={() => removeToast(id)} className="opacity-70 hover:opacity-100 text-lg leading-none">×</button>
      </div>
    ))}
  </div>
);

const SetupManager = () => {
  const { bahasa, halaman, setHalaman } = useContext(AppContext);

  // ─── AUTO-SWITCH TABS BERDASARKAN NAVBAR CLICK ───
  const [activeTab, setActiveTab] = useState(() => {
    if (halaman === 'setupRoles') return 'ROLES';
    if (halaman === 'setupLayout') return 'LAYOUT';
    if (halaman === 'setupPrint') return 'PRINT';
    return 'COMPANY'; 
  });

  useEffect(() => {
    if (halaman === 'setupCompany') setActiveTab('COMPANY');
    else if (halaman === 'setupRoles') setActiveTab('ROLES');
    else if (halaman === 'setupLayout') setActiveTab('LAYOUT');
    else if (halaman === 'setupPrint') setActiveTab('PRINT');
  }, [halaman]);

  const handleTabClick = (tabName, routeName) => {
    setActiveTab(tabName);
    setHalaman(routeName);
  };

  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // ─── 1. DATA: COMPANY INFO (ARUS MOTORS) ───
  const [companyInfo, setCompanyInfo] = useState({
    name: 'ARUS Motors Gigafactory',
    taxId: '01.234.567.8-091.000',
    email: 'operations@arusmotors.com',
    phone: '+62 21 8899 7766 (SCM Command)',
    address: 'Kawasan Industri Terpadu (KIT) Batang, Blok C, Jawa Tengah',
    currency: 'USD ($)',
    timezone: 'Asia/Jakarta (GMT+7)'
  });

  // ─── 2. DATA: ROLES & PERMISSIONS ───
  const [roles] = useState([
    { role: 'System Admin', desc: 'Full global configuration access. MRO, Network, & Security.', inventory: 'Full', orders: 'Full', finance: 'Full' },
    { role: 'Chief Logistics Officer', desc: 'Manage demand planning, vendor SLAs, and macro-financials.', inventory: 'Full', orders: 'Full', finance: 'View' },
    { role: 'Floor Supervisor', desc: 'Authorize cycle counts, staff scheduling, and AGV assignments.', inventory: 'Edit', orders: 'Full', finance: 'None' },
  ]);

  // FITUR: USER-TO-ZONE SHIFT SCHEDULER DATA (EV SPECIFIC)
  const [staffSchedules, setStaffSchedules] = useState([
    { id: 'EMP-ARS-001', name: 'Budi Santoso', role: 'HV Assembler', zone: 'Zone B (Battery Storage)', shift: 'Shift 1 (06:00 - 14:00)', status: 'Active' },
    { id: 'EMP-ARS-002', name: 'Siti Aminah', role: 'Telemetry QC', zone: 'Zone D (Clean Room)', shift: 'Shift 2 (14:00 - 22:00)', status: 'Active' },
    { id: 'EMP-ARS-003', name: 'Agus Pratama', role: 'AGV Operator', zone: 'Zone C (Chassis Line)', shift: 'Shift 1 (06:00 - 14:00)', status: 'Active' },
  ]);

  // ─── 3. DATA: WAREHOUSE LAYOUT & DIRECTED PUTAWAY (EV TOPOLOGY) ───
  const [zones] = useState([
    { id: 'Z-A', name: 'Ambient Powertrain Storage', type: 'Heavy Duty', racks: 30, bins: 1500, utilization: 85, color: 'border-blue-300 bg-blue-50' },
    { id: 'Z-B', name: 'Battery Climate Control (HV)', type: 'Temp Controlled', racks: 12, bins: 420, utilization: 60, color: 'border-emerald-300 bg-emerald-50' },
    { id: 'Z-C', name: 'Heavy Chassis Floor Staging', type: 'Floor-Only', racks: 0, bins: 80, utilization: 92, color: 'border-amber-300 bg-amber-50' },
    { id: 'Z-D', name: 'Clean Room (Anti-Static)', type: 'ESD Safe', racks: 8, bins: 600, utilization: 45, color: 'border-purple-300 bg-purple-50' },
  ]);

  // FITUR: DIRECTED PUTAWAY RULES CONFIGURATION
  const [putawayRules, setPutawayRules] = useState({
    maxWeightLevel4: 250, // kg max untuk rak atas
    forceFloorLevelWeight: 1000, // kg min untuk dipaksa di lantai bawah
    segregateHazmat: true,
    esdCompliance: true
  });

  // ─── 4. DATA: PRINT SETTINGS & FAILOVER ENGINE ───
  const [printerDevices, setPrinterDevices] = useState([
    { id: 'PRN-Z-01', name: 'Zebra ZT411 Industrial', type: 'Thermal Label', location: 'Inbound Dock 1', status: 'ONLINE' },
    { id: 'PRN-Z-02', name: 'Zebra ZT411 Industrial', type: 'Thermal Label', location: 'Inbound Dock 2', status: 'ONLINE' },
    { id: 'PRN-L-01', name: 'HP LaserJet Enterprise', type: 'Laser A4', location: 'SCM Office', status: 'ONLINE' },
  ]);

  const [templateRoutes, setTemplateRoutes] = useState({
    packingSlip: 'PRN-Z-01', 
    packingSlipFailover: 'PRN-Z-02', 
    billOfLading: 'PRN-L-01',
    commercialInvoice: 'PRN-L-01'
  });

  // ─── ACTIONS HANDLERS ───
  const handleSaveSettings = (e, module) => {
    e?.preventDefault();
    addToast(`CONFIGURATION SYNCED: ${module} parameters successfully mapped to WMS Engine.`, 'success');
  };

  const handleUpdateStaffZone = (id, field, value) => {
    setStaffSchedules(prev => prev.map(staff => staff.id === id ? { ...staff, [field]: value } : staff));
    addToast(`ROSTER UPDATE: Parameters re-mapped for ${id}. AGV Scanner instructions updated.`, 'info');
  };

  // SIMULASI PRINTER JAM (FAILOVER ENGINE)
  const triggerPrinterJamSimulation = () => {
    setPrinterDevices(prev => prev.map(p => p.id === 'PRN-Z-01' ? { ...p, status: 'ERROR: PRINT-HEAD JAM' } : p));
    
    addToast(`🚨 CRITICAL HARDWARE FAULT: Zebra ZT411 (Dock 1) reported a mechanical failure!`, 'error');
    
    setTimeout(() => {
      const backupPrinter = printerDevices.find(p => p.id === templateRoutes.packingSlipFailover);
      addToast(`🔄 FAILOVER PROTOCOL ACTIVE: Print queues automatically rerouted to backup unit [${backupPrinter.name}]. Zero downtime achieved.`, 'warning');
    }, 1500);
  };

  const resetPrinterSimulation = () => {
    setPrinterDevices(prev => prev.map(p => ({ ...p, status: 'ONLINE' })));
    addToast(`SYSTEM RECOVERY: All network hardware reported nominal health.`, 'success');
  };

  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 flex flex-col xl:flex-row gap-6 items-start animate-fade-in">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── SIDEBAR NAVIGATION (MENU SETUP VERTIKAL) ── */}
      <div className="w-full xl:w-64 shrink-0 bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden sticky top-4">
        <div className="bg-[#415a77] text-white px-5 py-4">
          <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
            <span>⚙️</span> System Control
          </h2>
          <p className="text-[10px] text-blue-100 mt-1">Configure physical & software constraints</p>
        </div>
        <div className="flex flex-row xl:flex-col p-2 gap-1 overflow-x-auto whitespace-nowrap xl:whitespace-normal">
          <button onClick={() => handleTabClick('COMPANY', 'setupCompany')} className={`text-left px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors flex-1 xl:flex-none ${activeTab === 'COMPANY' ? 'bg-blue-50 text-[#125ab2] border-l-4 border-[#125ab2]' : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent'}`}>
            🏢 Corp Profile
          </button>
          <button onClick={() => handleTabClick('ROLES', 'setupRoles')} className={`text-left px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors flex-1 xl:flex-none ${activeTab === 'ROLES' ? 'bg-blue-50 text-[#125ab2] border-l-4 border-[#125ab2]' : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent'}`}>
            🔐 Access & Rostering
          </button>
          <button onClick={() => handleTabClick('LAYOUT', 'setupLayout')} className={`text-left px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors flex-1 xl:flex-none ${activeTab === 'LAYOUT' ? 'bg-blue-50 text-[#125ab2] border-l-4 border-[#125ab2]' : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent'}`}>
            🗺️ Layout & Putaway
          </button>
          <button onClick={() => handleTabClick('PRINT', 'setupPrint')} className={`text-left px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors flex-1 xl:flex-none ${activeTab === 'PRINT' ? 'bg-blue-50 text-[#125ab2] border-l-4 border-[#125ab2]' : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent'}`}>
            🖨️ Hardware Failover
          </button>
        </div>
      </div>

      {/* ── MAIN CONFIGURATION COMPLEX ── */}
      <div className="flex-1 w-full flex flex-col gap-6">

        {/* TAB 1: COMPANY PROFILE */}
        {activeTab === 'COMPANY' && (
          <div className="bg-white border border-gray-300 shadow-sm rounded-sm animate-fade-in flex flex-col hover:shadow-md transition-shadow">
            <div className="bg-slate-50 border-b border-gray-200 px-6 py-4">
              <h3 className="font-bold text-xs uppercase text-gray-800 tracking-wider">Corporate Identity Blueprint</h3>
              <p className="text-[10px] text-gray-500 font-semibold mt-0.5">Core organizational parameters shared across Gatepasses & Invoice outputs.</p>
            </div>
            
            <form onSubmit={(e) => handleSaveSettings(e, 'Corporate Profile')} className="flex flex-col">
              <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Legal Entity Name <span className="text-red-500">*</span></label>
                      <input type="text" value={companyInfo.name} onChange={(e) => setCompanyInfo({...companyInfo, name: e.target.value})} className="w-full border border-gray-300 p-2.5 text-xs font-bold text-gray-900 bg-white focus:border-[#125ab2] outline-none rounded-sm transition-colors" required/>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tax ID / Incorporation No. <span className="text-red-500">*</span></label>
                      <input type="text" value={companyInfo.taxId} onChange={(e) => setCompanyInfo({...companyInfo, taxId: e.target.value})} className="w-full border border-gray-300 p-2.5 text-xs font-mono font-bold bg-white focus:border-[#125ab2] outline-none rounded-sm transition-colors" required/>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Corporate Email</label>
                      <input type="email" value={companyInfo.email} onChange={(e) => setCompanyInfo({...companyInfo, email: e.target.value})} className="w-full border border-gray-300 p-2.5 text-xs font-semibold focus:border-[#125ab2] outline-none rounded-sm transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">SCM Operations Hotline</label>
                      <input type="text" value={companyInfo.phone} onChange={(e) => setCompanyInfo({...companyInfo, phone: e.target.value})} className="w-full border border-gray-300 p-2.5 text-xs font-semibold focus:border-[#125ab2] outline-none rounded-sm transition-colors" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Gigafactory Hub Address</label>
                      <textarea rows="2" value={companyInfo.address} onChange={(e) => setCompanyInfo({...companyInfo, address: e.target.value})} className="w-full border border-gray-300 p-2.5 text-xs font-semibold focus:border-[#125ab2] outline-none rounded-sm resize-none transition-colors" />
                    </div>
                  </div>
                </div>
                
                <div className="border-2 border-dashed border-gray-200 rounded-sm p-6 bg-gray-50 flex flex-col items-center justify-center text-center shadow-inner h-full min-h-[200px]">
                  <span className="text-4xl mb-3">🏭</span>
                  <span className="text-xs font-black uppercase tracking-wider text-gray-800">Identity Active</span>
                  <span className="text-[10px] text-gray-400 mt-1 font-semibold">Brand assets synchronized with cloud.</span>
                </div>
              </div>
              
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
                <button type="submit" className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-6 py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors">
                  Deploy Blueprint
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: ROLES & USER-TO-ZONE ROSTER SCHEDULER */}
        {activeTab === 'ROLES' && (
          <div className="space-y-6 animate-fade-in w-full">
            {/* MATRIX HAK AKSES */}
            <div className="bg-white border border-gray-300 shadow-sm rounded-sm hover:shadow-md transition-shadow">
              <div className="bg-slate-50 border-b border-gray-200 px-6 py-4">
                <h3 className="font-bold text-xs uppercase text-gray-800 tracking-wider">Access Control Matrix Policy</h3>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
                  <thead className="bg-[#f8f9fa] text-[#64748b] text-[10px] uppercase tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-6 font-bold w-64">Role Hierarchy</th>
                      <th className="py-3 px-4 font-bold text-center">WMS Inventory</th>
                      <th className="py-3 px-4 font-bold text-center">Procurement & Order</th>
                      <th className="py-3 px-4 font-bold text-center">Financials & MRO</th>
                    </tr>
                  </thead>
                  <tbody className="text-[12px] text-gray-700">
                    {roles.map((r, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-black text-[#125ab2] text-[13px]">{r.role}</div>
                          <div className="text-[10px] text-gray-500 font-medium mt-1 truncate max-w-[280px]" title={r.desc}>{r.desc}</div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-sm text-[9px] font-bold uppercase tracking-wider border shadow-sm ${r.inventory === 'Full' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : r.inventory === 'Edit' ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-gray-100 text-gray-500 border-gray-300'}`}>{r.inventory}</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-sm text-[9px] font-bold uppercase tracking-wider border shadow-sm ${r.orders === 'Full' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-gray-100 text-gray-500 border-gray-300'}`}>{r.orders}</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-sm text-[9px] font-bold uppercase tracking-wider border shadow-sm ${r.finance === 'Full' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : r.finance === 'View' ? 'bg-purple-100 text-purple-800 border-purple-300' : 'bg-red-100 text-red-800 border-red-300'}`}>{r.finance}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SUNTIKAN FITUR: EV USER-TO-ZONE SHIFT SCHEDULER */}
            <div className="bg-white border border-gray-300 shadow-sm rounded-sm hover:shadow-md transition-shadow overflow-hidden">
              <div className="bg-[#415a77] text-white px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider">🏃 Floor Scheduler & Assignment</h3>
                  <p className="text-[10px] text-gray-300 mt-0.5 font-medium">Plot operators to active physical zones. Forces task lock on their AGV/RF Scanners.</p>
                </div>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
                  <thead className="bg-[#f8f9fa] text-[#64748b] text-[10px] uppercase tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-6 font-bold w-48">Staff ID & Name</th>
                      <th className="py-3 px-4 font-bold">System Role</th>
                      <th className="py-3 px-4 font-bold w-56">Assigned Warehouse Zone</th>
                      <th className="py-3 px-6 font-bold w-48">Operational Shift</th>
                    </tr>
                  </thead>
                  <tbody className="text-[12px] text-gray-700">
                    {staffSchedules.map((staff) => (
                      <tr key={staff.id} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                        <td className="py-3 px-6">
                          <div className="font-black text-gray-900">{staff.name}</div>
                          <div className="text-[10px] text-[#125ab2] font-mono font-bold mt-0.5">{staff.id}</div>
                        </td>
                        <td className="py-3 px-4 font-bold text-gray-600">{staff.role}</td>
                        <td className="py-3 px-4">
                          <select 
                            value={staff.zone} 
                            onChange={(e) => handleUpdateStaffZone(staff.id, 'zone', e.target.value)}
                            className="w-full border border-gray-300 rounded-sm px-2 py-1.5 font-bold text-gray-800 text-xs bg-white outline-none focus:border-[#125ab2] focus:ring-1 focus:ring-[#125ab2] transition-all cursor-pointer shadow-sm"
                          >
                            <option value="Zone A (Ambient)">Zone A (Ambient Powertrain)</option>
                            <option value="Zone B (Battery Storage)">Zone B (HV Battery Cold)</option>
                            <option value="Zone C (Chassis Line)">Zone C (Heavy Chassis Floor)</option>
                            <option value="Zone D (Clean Room)">Zone D (Clean Room Anti-Static)</option>
                          </select>
                        </td>
                        <td className="py-3 px-6">
                          <select 
                            value={staff.shift} 
                            onChange={(e) => handleUpdateStaffZone(staff.id, 'shift', e.target.value)}
                            className="w-full border border-gray-300 rounded-sm px-2 py-1.5 font-bold text-gray-800 text-xs bg-white outline-none focus:border-[#125ab2] focus:ring-1 focus:ring-[#125ab2] transition-all cursor-pointer shadow-sm"
                          >
                            <option value="Shift 1 (06:00 - 14:00)">Shift 1 (06:00 - 14:00)</option>
                            <option value="Shift 2 (14:00 - 22:00)">Shift 2 (14:00 - 22:00)</option>
                            <option value="Shift 3 (22:00 - 06:00)">Shift 3 (22:00 - 06:00)</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: WAREHOUSE LAYOUT & DIRECTED PUTAWAY */}
        {activeTab === 'LAYOUT' && (
          <div className="space-y-6 animate-fade-in w-full">
            {/* STORAGE ZONES LIST */}
            <div className="bg-white border border-gray-300 shadow-sm rounded-sm hover:shadow-md transition-shadow">
              <div className="bg-slate-50 border-b border-gray-200 px-6 py-4">
                <h3 className="font-bold text-xs uppercase text-gray-800 tracking-wider">Warehouse Topography Footprint</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {zones.map((zone, i) => (
                  <div key={i} className={`border rounded-sm p-4 ${zone.color} shadow-sm transition-transform hover:-translate-y-0.5`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="font-mono font-black text-xs text-gray-700 bg-white/60 px-2 py-0.5 rounded shadow-sm">{zone.id}</div>
                      <span className="font-black text-xs text-gray-900">{zone.utilization}% Vol</span>
                    </div>
                    <h4 className="font-black text-sm text-gray-900 leading-tight mb-1">{zone.name}</h4>
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{zone.type}</p>
                    <p className="text-[10px] text-gray-600 font-semibold mt-3 bg-white/50 p-1.5 rounded">{zone.racks} Aisles / {zone.bins} Bins</p>
                  </div>
                ))}
              </div>
            </div>

            {/* SUNTIKAN FITUR: EV DIRECTED PUTAWAY SAFEGUARDS */}
            <div className="bg-white border border-red-300 shadow-sm rounded-sm overflow-hidden flex flex-col">
              <div className="bg-red-700 text-white px-6 py-4">
                <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2"><span>🛡️</span> Putaway Logic & Isolation Interlocks</h3>
                <p className="text-[10px] text-red-200 mt-1 font-medium">Automated constraints mapped to RF Scanners to prevent structural collapse and chemical contamination.</p>
              </div>
              
              <form onSubmit={(e) => handleSaveSettings(e, 'Putaway Logic')} className="flex flex-col flex-1">
                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 text-sm">
                  {/* FORM ATURAN PUTAWAY */}
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-[#125ab2] uppercase tracking-wider border-b border-gray-200 pb-2">Physical Tolerance Rules</h4>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Max Tonnage - Top Racks (Level 4/5)</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="number" 
                          value={putawayRules.maxWeightLevel4} 
                          onChange={(e) => setPutawayRules({...putawayRules, maxWeightLevel4: Number(e.target.value)})}
                          className="border border-gray-300 p-2.5 text-sm font-black font-mono text-[#125ab2] rounded-sm outline-none focus:border-[#125ab2] focus:ring-1 focus:ring-[#125ab2] w-32 shadow-sm transition-all" 
                        />
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">KG / Bin Slot</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1.5 font-medium leading-relaxed">Pallets exceeding this weight will fail AGV validation if assigned to high tiers.</p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Force Floor Placement Threshold (Level 1 Lock)</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="number" 
                          value={putawayRules.forceFloorLevelWeight} 
                          onChange={(e) => setPutawayRules({...putawayRules, forceFloorLevelWeight: Number(e.target.value)})}
                          className="border border-gray-300 p-2.5 text-sm font-black font-mono text-red-600 rounded-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 w-32 shadow-sm transition-all" 
                        />
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">KG / Pallet</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1.5 font-medium leading-relaxed">Heavy components (e.g. chassis/castings) automatically locked to coordinates ending in Level-01 (Ground Shelf).</p>
                    </div>
                  </div>

                  {/* MATRIX CONFIG ALGORITMA HAZMAT/ESD */}
                  <div className="bg-red-50 border border-red-100 p-5 rounded-sm space-y-5 shadow-inner">
                    <h4 className="text-[10px] font-black text-red-800 uppercase tracking-wider border-b border-red-200 pb-2">Hazmat & Compliance Interlocks</h4>
                    
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center mt-0.5">
                        <input 
                          type="checkbox" 
                          checked={putawayRules.segregateHazmat} 
                          onChange={(e) => setPutawayRules({...putawayRules, segregateHazmat: e.target.checked})}
                          className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer" 
                        />
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-900 group-hover:text-red-700 transition-colors uppercase tracking-wider">Enforce Battery / Hazmat Quarantine</p>
                        <p className="text-[10px] text-gray-700 mt-1 font-medium leading-relaxed">Locks cross-contamination and fire risk. Prevents LFP Battery components from routing to ambient/general storage racks.</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center mt-0.5">
                        <input 
                          type="checkbox" 
                          checked={putawayRules.esdCompliance} 
                          onChange={(e) => setPutawayRules({...putawayRules, esdCompliance: e.target.checked})}
                          className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer" 
                        />
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-900 group-hover:text-red-700 transition-colors uppercase tracking-wider">Enable ESD Clean Room Routing</p>
                        <p className="text-[10px] text-gray-700 mt-1 font-medium leading-relaxed">Bypasses manual slotting. Inbound GRN scans for electronic units (MCU/Sensors) immediately force routing into Zone D Anti-Static area.</p>
                      </div>
                    </label>
                  </div>
                </div>
                <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end shrink-0 z-10">
                  <button type="submit" className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-6 py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors">
                    Commit Logistics Rules
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 4: PRINT SETTINGS & HARDWARE FAILOVER ENGINE */}
        {activeTab === 'PRINT' && (
          <div className="space-y-6 animate-fade-in w-full flex flex-col">
            
            {/* CONFIG INTERACTIVE FAILOVER HUB */}
            <div className="bg-white border border-gray-300 shadow-sm rounded-sm flex flex-col hover:shadow-md transition-shadow">
              <div className="bg-slate-50 border-b border-gray-200 px-6 py-4">
                <h3 className="font-bold text-xs uppercase text-gray-800 tracking-wider">Network Hardware & Routing</h3>
                <p className="text-[10px] text-gray-500 font-medium mt-1">Assign primary output destinations for physical documents.</p>
              </div>
              <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Gatepass / Packing Slips</label>
                  <select value={templateRoutes.packingSlip} onChange={(e) => setTemplateRoutes({...templateRoutes, packingSlip: e.target.value})} className="w-full border border-gray-300 p-2.5 text-xs font-bold text-gray-800 bg-white rounded-sm outline-none focus:border-[#125ab2] focus:ring-1 focus:ring-[#125ab2] transition-colors cursor-pointer shadow-sm">
                    <option value="PRN-Z-01">Zebra ZT411 (Dock 1)</option>
                    <option value="PRN-Z-02">Zebra ZT411 (Dock 2)</option>
                  </select>
                </div>
                
                {/* SUNTIKAN FITUR: CADANGAN PRINTER FAILOVER MAP */}
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-sm shadow-inner">
                  <label className="block text-[10px] font-black text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1.5"><span>🔀</span> Active Failover Target</label>
                  <select value={templateRoutes.packingSlipFailover} onChange={(e) => setTemplateRoutes({...templateRoutes, packingSlipFailover: e.target.value})} className="w-full border border-amber-300 p-2.5 text-xs font-bold text-amber-900 bg-white rounded-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors cursor-pointer shadow-sm">
                    <option value="PRN-Z-02">Zebra ZT411 (Dock 2)</option>
                    <option value="PRN-Z-01">Zebra ZT411 (Dock 1)</option>
                  </select>
                  <p className="text-[9px] text-amber-700 font-semibold mt-2 leading-relaxed">If primary hardware drops offline, print spooler instantly redirects payload here to prevent dispatch queues.</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">BOL / Invoice Output</label>
                  <select value={templateRoutes.billOfLading} className="w-full border border-gray-200 p-2.5 text-xs font-bold text-gray-400 bg-gray-100 rounded-sm cursor-not-allowed" disabled>
                    <option value="PRN-L-01">HP LaserJet Enterprise (Admin)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* LIVE DEVICE HARDWARE TELEMETRY & STRESS TEST BUTTONS */}
            <div className="bg-white border border-purple-300 shadow-sm rounded-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <div className="bg-gradient-to-r from-purple-800 to-[#125ab2] text-white px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2"><span>⚡</span> Hardware Spooler Stress Test</h3>
                  <p className="text-[10px] text-purple-200 mt-1 font-medium">Simulate mechanical failures to verify automatic failover routing integrity.</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto shrink-0">
                  <button onClick={triggerPrinterJamSimulation} className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-wider px-4 py-2.5 rounded-sm shadow-sm transition-colors border border-red-700 flex items-center justify-center gap-1.5">
                    <span>💥</span> Trigger Jam
                  </button>
                  <button onClick={resetPrinterSimulation} className="flex-1 sm:flex-none bg-white hover:bg-gray-100 text-purple-900 text-[10px] font-black uppercase tracking-wider px-4 py-2.5 rounded-sm shadow-sm transition-colors flex items-center justify-center gap-1.5">
                    <span>🔄</span> Reset
                  </button>
                </div>
              </div>
              <div className="p-0 overflow-x-auto flex-1">
                <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
                  <thead className="bg-[#f8f9fa] text-[#64748b] text-[10px] uppercase tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-6 font-bold w-48">Device MAC/ID</th>
                      <th className="py-3 px-5 font-bold">Hardware Profile</th>
                      <th className="py-3 px-5 font-bold w-56">Assigned Station</th>
                      <th className="py-3 px-6 font-bold text-center w-48">Telemetry Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-[12px] text-gray-700">
                    {printerDevices.map((device, i) => (
                      <tr key={i} className={`border-b border-gray-100 transition-colors ${device.status !== 'ONLINE' ? 'bg-red-50/60' : 'hover:bg-purple-50/20'}`}>
                        <td className="py-4 px-6 font-mono font-black text-[#125ab2]">{device.id}</td>
                        <td className="py-4 px-5 font-bold text-gray-900">{device.name}</td>
                        <td className="py-4 px-5 text-gray-600 font-semibold">{device.location}</td>
                        <td className="py-4 px-6 text-center">
                          <span className={`px-2.5 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest border shadow-sm ${device.status === 'ONLINE' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-red-600 text-white border-red-700 animate-pulse'}`}>
                            {device.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>
    </main>
  );
};

export default SetupManager;