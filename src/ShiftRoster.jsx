import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from './AppContext';

// ─── TOAST COMPONENT (Aman dari Bug Klik/Pointer Events) ─────────────────────
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
    {toasts.map(({ id, message, type }) => (
      <div key={id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-sm shadow-xl text-white text-xs font-semibold min-w-[280px] border-l-4 ${
        type === 'success' ? 'bg-emerald-600 border-emerald-800' : 
        type === 'error' ? 'bg-red-600 border-red-800' : 
        type === 'info' ? 'bg-[#125ab2] border-blue-800' : 'bg-amber-500 border-amber-700'
      }`}>
        <span className="text-base">{type === 'success' ? '✓' : type === 'error' ? '🚨' : type === 'info' ? 'ℹ' : '⚠️'}</span>
        <span className="flex-1">{message}</span>
        <button onClick={() => removeToast(id)} className="opacity-70 hover:opacity-100 text-lg leading-none">×</button>
      </div>
    ))}
  </div>
);

const ShiftRoster = () => {
  const { bahasa } = useContext(AppContext);

  // 1. DATA MASTER PEGAWAI (ARUS MOTORS GIGAFACTORY)
  const initialRoster = [
    { id: 'EMP-ARS-001', name: 'Budi Santoso', role: 'HV Battery Assembler', shift: 'Morning (06:00 - 14:00)', status: 'On Duty', area: 'Zone B (Cold Storage)', phone: '0812-3344-5566', joinDate: '2023-02-15', kpiScore: 95, fatigueLevel: 'Low', cert: 'HV Safety Level 3' },
    { id: 'EMP-ARS-002', name: 'Siti Aminah', role: 'Telemetry QC Inspector', shift: 'Morning (06:00 - 14:00)', status: 'On Leave', area: 'Clean Room A', phone: '0856-7788-9900', joinDate: '2024-05-10', kpiScore: 88, fatigueLevel: 'Rested', cert: 'Precision QA' },
    { id: 'EMP-ARS-003', name: 'Agus Pratama', role: 'AGV Operator', shift: 'Swing (14:00 - 22:00)', status: 'Scheduled', area: 'Zone C (Chassis)', phone: '0811-2233-4455', joinDate: '2025-01-20', kpiScore: 72, fatigueLevel: 'Medium', cert: 'AGV Sys-Admin' },
    { id: 'EMP-ARS-004', name: 'Rahmat Hidayat', role: 'Heavy Forklift Opr', shift: 'Morning (06:00 - 14:00)', status: 'On Break', area: 'Inbound Dock Bay 1', phone: '0819-9988-7766', joinDate: '2022-11-01', kpiScore: 92, fatigueLevel: 'High', cert: 'Class IV Forklift' },
    { id: 'EMP-ARS-005', name: 'Joko Widodo', role: 'Line Feeder', shift: 'Night (22:00 - 06:00)', status: 'Scheduled', area: 'Assembly Line Feed', phone: '0813-5544-3322', joinDate: '2025-08-05', kpiScore: 65, fatigueLevel: 'Medium', cert: 'Basic Logistics' },
    { id: 'EMP-ARS-006', name: 'Hendra Gunawan', role: 'Powertrain Kitter', shift: 'Morning (06:00 - 14:00)', status: 'On Duty', area: 'Zone A (Ambient)', phone: '0821-6677-8899', joinDate: '2026-01-10', kpiScore: 45, fatigueLevel: 'Low', cert: 'Under Probation' },
  ];

  const [roster, setRoster] = useState(() => {
    try {
      const saved = window.localStorage.getItem('shiftRoster_ARUS');
      return saved ? JSON.parse(saved) : initialRoster;
    } catch {
      return initialRoster;
    }
  });

  // ─── PEMBERSIH DATA LAMA ───
  useEffect(() => {
    const hasOldData = roster.some(r => r.role === 'Picker' || r.role === 'Packer' || !r.id.includes('ARS'));
    if (hasOldData) setRoster(initialRoster);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('shiftRoster_ARUS', JSON.stringify(roster));
    } catch (error) {
      console.error('Failed to save roster data:', error);
    }
  }, [roster]);

  // 2. STATE INTERAKTIF
  const [filterShift, setFilterShift] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [toasts, setToasts] = useState([]);
  
  // State Modal (Assign Staff & Employee Profile)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [empModal, setEmpModal] = useState({ isOpen: false, data: null });
  const [form, setForm] = useState({ name: '', role: 'AGV Operator', shift: 'Morning (06:00 - 14:00)', area: 'Zone A (Ambient)', phone: '', cert: 'Basic Safety' });

  // 3. FUNGSI TOAST & AKSI
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const updateStatus = (id, newStatus) => {
    setRoster(roster.map(emp => emp.id === id ? { ...emp, status: newStatus } : emp));
    addToast(`Telemetry Update: Status for ${id} changed to ${newStatus}`, 'success');
  };

  // 4. FUNGSI ASSIGN STAFF BARU
  const handleAssignStaff = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      addToast('Employee name is mandatory for registration!', 'error');
      return;
    }
    const nextNum = roster.length > 0 ? Math.max(...roster.map(r => parseInt(r.id.split('-')[2]) || 0)) + 1 : 1;
    const newId = `EMP-ARS-${nextNum.toString().padStart(3, '0')}`;
    
    setRoster([...roster, { 
      id: newId, 
      ...form, 
      status: 'Scheduled',
      joinDate: new Date().toISOString().split('T')[0],
      kpiScore: 50, // Default probation score
      fatigueLevel: 'Rested'
    }]);
    
    setIsModalOpen(false);
    setForm({ name: '', role: 'AGV Operator', shift: 'Morning (06:00 - 14:00)', area: 'Zone A (Ambient)', phone: '', cert: 'Basic Safety' });
    addToast('New personnel profile injected into the global roster.', 'success');
  };

  // 5. FUNGSI EXPORT CSV (POWER BI / EXCEL DATA MODEL READY)
  const handleExportCSV = () => {
    addToast('Compiling Data Model for Power BI Export...', 'info');
    const headers = ['EMP_ID', 'Employee_Name', 'Job_Role', 'Assigned_Shift', 'Work_Area', 'Current_Status', 'KPI_Score', 'Fatigue_Level', 'Certification'];
    const csvRows = [headers.join(',')];
    
    filteredData.forEach(emp => {
      const row = [emp.id, `"${emp.name}"`, `"${emp.role}"`, `"${emp.shift}"`, `"${emp.area}"`, emp.status, emp.kpiScore, emp.fatigueLevel, `"${emp.cert}"`];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `ARUS_Workforce_Telemetry_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => addToast('Timesheet Raw Data Exported successfully!', 'success'), 800);
  };

  // 6. MANAGERIAL ACTIONS
  const handleTriggerCoaching = (empName) => {
    addToast(`Action Plan Generated: Formal KPI Coaching session scheduled for ${empName}.`, 'info');
    setEmpModal({ isOpen: false, data: null });
  };

  const handleMandatoryRest = (empName) => {
    addToast(`Team Stabilization: Mandatory stand-down applied to ${empName}. Fatigue protocols engaged.`, 'warning');
    setEmpModal({ isOpen: false, data: null });
  };

  // 7. SEARCH & FILTER ENGINE
  const filteredData = useMemo(() => {
    return roster.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.id.toLowerCase().includes(searchTerm.toLowerCase()) || r.role.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesShift = filterShift === 'ALL' ? true : r.shift.includes(filterShift);
      return matchesSearch && matchesShift;
    });
  }, [roster, filterShift, searchTerm]);

  // Global Metrics
  const underperformingCount = roster.filter(r => r.kpiScore < 70).length;
  const fatiguedCount = roster.filter(r => r.fatigueLevel === 'High').length;

  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 animate-fade-in">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>👥 Workforce</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Scheduling</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide">
            {bahasa === 'en' ? 'Enterprise Shift Roster & Stabilization' : 'Jadwal Shift & Stabilitas Tim'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">Manage dynamic floor scheduling, track KPI stability, and mitigate personnel fatigue.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button onClick={handleExportCSV} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2.5 rounded-sm text-xs font-bold transition-colors shadow-sm uppercase tracking-wider flex items-center justify-center gap-2 w-full md:w-auto">
            <span>⭳</span> Export Raw Data
          </button>
          <button onClick={() => setIsModalOpen(true)} className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-5 py-2.5 rounded-sm text-xs font-bold transition-colors shadow-sm uppercase tracking-wider flex items-center justify-center gap-2 w-full md:w-auto">
            <span>+</span> Assign Personnel
          </button>
        </div>
      </div>

      {/* ── KPI & TEAM STABILIZATION METRICS ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-5 border border-gray-200 shadow-sm rounded-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Total Headcount</p>
          <p className="text-3xl font-black text-gray-900 mt-1 font-mono">{roster.length}</p>
          <p className="text-[9px] text-gray-400 mt-2 font-bold uppercase">Registered Personnel</p>
        </div>
        
        <div className="bg-white p-5 border-l-4 border-l-[#125ab2] border border-y-gray-200 border-r-gray-200 shadow-sm rounded-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-[#125ab2] tracking-wider">Active On Duty</p>
          <p className="text-3xl font-black text-gray-900 mt-1">{roster.filter(r => r.status === 'On Duty').length}</p>
          <p className="text-[9px] text-gray-400 mt-2 font-bold uppercase">Operating on Floor</p>
        </div>
        
        <div className="bg-white p-5 border-l-4 border-l-amber-500 border border-y-gray-200 border-r-gray-200 shadow-sm rounded-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">Stand-Down / Breaks</p>
          <p className="text-3xl font-black text-gray-900 mt-1">{roster.filter(r => r.status === 'On Break').length}</p>
          <p className="text-[9px] text-amber-600 mt-2 font-bold uppercase animate-pulse">{fatiguedCount} Staff High Fatigue</p>
        </div>
        
        <div className="bg-white p-5 border border-gray-200 shadow-sm rounded-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Scheduled Next</p>
          <p className="text-3xl font-black text-gray-900 mt-1">{roster.filter(r => r.status === 'Scheduled').length}</p>
          <p className="text-[9px] text-gray-400 mt-2 font-bold uppercase">Awaiting Shift In</p>
        </div>
        
        <div className="bg-white p-5 border-l-4 border-l-red-500 border border-y-gray-200 border-r-gray-200 shadow-sm rounded-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-red-600 tracking-wider">Underperforming</p>
          <p className="text-3xl font-black text-red-700 mt-1">{underperformingCount}</p>
          <p className="text-[9px] text-red-500 mt-2 font-bold uppercase">KPI Action Plan Req.</p>
        </div>
      </div>

      {/* ── TOOLBAR (SEARCH & FILTER) ── */}
      <div className="bg-white p-3 border border-gray-300 shadow-sm rounded-sm mb-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {['ALL', 'Morning', 'Swing', 'Night'].map(shift => (
            <button 
              key={shift} 
              onClick={() => setFilterShift(shift)} 
              className={`px-4 py-1.5 text-[11px] font-bold uppercase rounded-sm border transition-colors shadow-sm ${filterShift === shift ? 'bg-[#415a77] text-white border-[#415a77]' : 'bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100'}`}
            >
              {shift === 'ALL' ? 'All Shifts' : shift}
            </button>
          ))}
        </div>
        <input 
          type="text" 
          placeholder="Search Name, ID, or Role..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 px-4 py-1.5 rounded-sm text-sm outline-none focus:border-[#125ab2] w-full sm:w-80 transition-colors"
        />
      </div>

      {/* ── TABEL DATA PEGAWAI ── */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden flex flex-col">
        <div className="bg-slate-50 border-b border-gray-200 p-3 flex justify-between items-center">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-2">Live Telemetry & Attendance Grid</h3>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
            <thead className="bg-[#e5e5e5] text-[#666666] text-[10px] uppercase tracking-wider border-b border-gray-300">
              <tr>
                <th className="py-3 px-5 font-bold border-b w-64">PERSONNEL RECORD</th>
                <th className="py-3 px-5 font-bold border-b w-48">SHIFT & AREA</th>
                <th className="py-3 px-5 font-bold border-b text-center w-36">KPI SCORE</th>
                <th className="py-3 px-5 font-bold border-b text-center w-36">FATIGUE INDEX</th>
                <th className="py-3 px-5 font-bold border-b text-center w-32">LIVE STATUS</th>
                <th className="py-3 px-5 font-bold border-b text-center w-48">SYSTEM ACTION</th>
              </tr>
            </thead>
            <tbody className="text-[12px] text-gray-700">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400 font-bold italic">
                    <span className="text-3xl block mb-2 opacity-50">📭</span>
                    No personnel profiles match the specified criteria.
                  </td>
                </tr>
              ) : (
                filteredData.map((emp, idx) => (
                  <tr key={idx} className={`border-b border-gray-100 transition-colors ${
                    emp.status === 'On Leave' || emp.status === 'Absent' ? 'bg-gray-50 opacity-60 grayscale' : 
                    emp.kpiScore < 70 ? 'bg-red-50/30 hover:bg-red-50' : 'hover:bg-blue-50/40'
                  }`}>
                    
                    <td className="py-4 px-5">
                      <div 
                        className="font-black text-[13px] text-[#125ab2] cursor-pointer hover:underline flex items-center gap-1.5"
                        onClick={() => setEmpModal({ isOpen: true, data: emp })}
                        title="Open Personnel Intervention Profile"
                      >
                        <span className="text-base">👤</span> {emp.name}
                      </div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">{emp.id} | <span className="text-gray-800">{emp.role}</span></div>
                    </td>

                    <td className="py-4 px-5">
                      <div className="font-bold text-gray-900">{emp.shift.split(' ')[0]} <span className="text-[10px] text-gray-500 font-mono ml-1">{emp.shift.split(' ')[1]} {emp.shift.split(' ')[2]} {emp.shift.split(' ')[3]}</span></div>
                      <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-1">Loc: <span className="font-bold text-gray-700">{emp.area}</span></div>
                    </td>

                    <td className="py-4 px-5 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`font-black text-lg ${emp.kpiScore >= 90 ? 'text-emerald-600' : emp.kpiScore >= 70 ? 'text-amber-500' : 'text-red-600'}`}>
                          {emp.kpiScore}
                        </span>
                        <div className="w-16 h-1 bg-gray-200 rounded-full mt-1 overflow-hidden shadow-inner">
                          <div className={`h-full ${emp.kpiScore >= 90 ? 'bg-emerald-500' : emp.kpiScore >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${emp.kpiScore}%` }}></div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-5 text-center">
                      <span className={`px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-widest border ${
                        emp.fatigueLevel === 'Low' || emp.fatigueLevel === 'Rested' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        emp.fatigueLevel === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-red-100 text-red-700 border-red-300 shadow-sm animate-pulse'
                      }`}>
                        {emp.fatigueLevel}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-center">
                      <span className={`px-2.5 py-1 rounded-sm text-[10px] font-black uppercase tracking-wider border shadow-sm ${
                        emp.status === 'On Duty' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                        emp.status === 'On Break' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                        emp.status === 'Scheduled' ? 'bg-white text-gray-700 border-gray-300' : 
                        'bg-gray-800 text-white border-black'
                      }`}>
                        {emp.status}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-center">
                      <div className="flex justify-center gap-2">
                        {emp.status === 'Scheduled' && (
                          <button onClick={() => updateStatus(emp.id, 'On Duty')} className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm w-full transition-colors flex justify-center items-center gap-1">
                            <span>▶</span> Clock In
                          </button>
                        )}
                        
                        {emp.status === 'On Duty' && (
                          <>
                            <button onClick={() => updateStatus(emp.id, 'On Break')} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm w-1/2 transition-colors">Break</button>
                            <button onClick={() => updateStatus(emp.id, 'Scheduled')} className="bg-gray-800 hover:bg-black text-white px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm w-1/2 transition-colors">Out</button>
                          </>
                        )}

                        {emp.status === 'On Break' && (
                          <button onClick={() => updateStatus(emp.id, 'On Duty')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm w-full transition-colors flex justify-center items-center gap-1">
                            <span>⟲</span> Resume Shift
                          </button>
                        )}

                        {(emp.status === 'On Leave' || emp.status === 'Absent') && (
                          <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest bg-gray-100 px-3 py-1.5 rounded border border-gray-200 w-full inline-block">Off Duty</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🛡️ MODAL 1: ASSIGN PERSONNEL (BULLETPROOF FLEXBOX)                        */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[500px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-[#125ab2]" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            <div className="bg-blue-50 border-b border-blue-100 text-gray-800 px-6 py-4 flex justify-between items-center shrink-0 z-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-gray-500">Personnel Roster</p>
                <h3 className="font-black text-sm uppercase tracking-wider text-[#125ab2]">Assign Floor Staff</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-800 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <form onSubmit={handleAssignStaff} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 text-sm flex flex-col gap-5">
                
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Employee Name <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="e.g. John Doe" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] font-bold text-gray-800 rounded-sm transition-colors" required autoFocus/>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Job Role / Function <span className="text-red-500">*</span></label>
                    <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] font-semibold text-gray-700 bg-white rounded-sm cursor-pointer">
                      <option>AGV Operator</option>
                      <option>HV Battery Assembler</option>
                      <option>Powertrain Kitter</option>
                      <option>Telemetry QC Inspector</option>
                      <option>Line Feeder</option>
                      <option>Heavy Forklift Opr</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Safety Certification</label>
                    <select value={form.cert} onChange={e => setForm({...form, cert: e.target.value})} className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] font-semibold text-gray-700 bg-white rounded-sm cursor-pointer">
                      <option>Basic Safety</option>
                      <option>HV Safety Level 3</option>
                      <option>AGV Sys-Admin</option>
                      <option>Precision QA</option>
                      <option>Class IV Forklift</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Operational Shift</label>
                    <select value={form.shift} onChange={e => setForm({...form, shift: e.target.value})} className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] font-bold text-gray-800 bg-gray-50 rounded-sm cursor-pointer">
                      <option>Morning (06:00 - 14:00)</option>
                      <option>Swing (14:00 - 22:00)</option>
                      <option>Night (22:00 - 06:00)</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Floor Routing Area</label>
                    <select value={form.area} onChange={e => setForm({...form, area: e.target.value})} className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] font-semibold text-gray-700 bg-white rounded-sm cursor-pointer">
                      <option>Zone A (Ambient)</option>
                      <option>Zone B (Cold Storage)</option>
                      <option>Zone C (Chassis)</option>
                      <option>Clean Room A</option>
                      <option>Inbound Dock Bay 1</option>
                      <option>Assembly Line Feed</option>
                    </select>
                  </div>
                </div>

              </div>
              
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 shrink-0 z-10">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm rounded-sm">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-[#125ab2] hover:bg-[#0e4487] text-white text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors rounded-sm">Add to Roster</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ MODAL 2: KPI MANAGEMENT & TEAM STABILIZATION PROFILE (FLEXBOX)         */}
      {/* ========================================================================= */}
      {empModal.isOpen && empModal.data && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[500px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-gray-800" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            <div className={`px-6 py-4 flex justify-between items-start shrink-0 z-10 text-white ${
              empModal.data.kpiScore < 70 ? 'bg-red-700' : 'bg-[#415a77]'
            }`}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 opacity-80">Managerial Intervention Hub</p>
                <h3 className="font-black text-xl leading-none">{empModal.data.name}</h3>
                <div className="text-[10px] font-mono font-bold mt-1.5 flex gap-2">
                  <span className="bg-white/20 px-1.5 py-0.5 rounded border border-white/30">{empModal.data.id}</span>
                  <span className="bg-white/20 px-1.5 py-0.5 rounded border border-white/30">{empModal.data.role.toUpperCase()}</span>
                </div>
              </div>
              <button onClick={() => setEmpModal({ isOpen: false, data: null })} className="text-white opacity-70 hover:opacity-100 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 text-sm text-gray-800 space-y-5">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-sm shadow-inner text-center">
                  <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider block mb-1">KPI Audit Score</span>
                  <span className={`font-black text-3xl ${empModal.data.kpiScore >= 90 ? 'text-emerald-600' : empModal.data.kpiScore >= 70 ? 'text-amber-500' : 'text-red-600'}`}>{empModal.data.kpiScore}</span>
                </div>
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-sm shadow-inner text-center">
                  <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider block mb-1">Fatigue Level</span>
                  <span className={`font-black text-xl ${empModal.data.fatigueLevel === 'Low' || empModal.data.fatigueLevel === 'Rested' ? 'text-emerald-600' : empModal.data.fatigueLevel === 'Medium' ? 'text-amber-500' : 'text-red-600 uppercase'}`}>{empModal.data.fatigueLevel}</span>
                </div>
              </div>

              {/* DETAILS */}
              <div className="bg-white border border-gray-200 p-4 rounded-sm shadow-sm space-y-3">
                <div className="grid grid-cols-[100px_1fr] gap-2 items-center text-xs">
                  <p className="text-gray-500 font-bold uppercase tracking-wider">Cert Status:</p>
                  <p className="font-bold text-[#125ab2] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-sm w-max">{empModal.data.cert}</p>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-2 items-center text-xs">
                  <p className="text-gray-500 font-bold uppercase tracking-wider">Work Area:</p>
                  <p className="font-bold text-gray-800">{empModal.data.area}</p>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-2 items-center text-xs">
                  <p className="text-gray-500 font-bold uppercase tracking-wider">Shift Logic:</p>
                  <p className="font-bold text-gray-800">{empModal.data.shift}</p>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-2 items-center text-xs">
                  <p className="text-gray-500 font-bold uppercase tracking-wider">Contact:</p>
                  <p className="font-mono font-semibold text-gray-600">{empModal.data.phone || 'N/A'}</p>
                </div>
              </div>

              {/* KONDISIONAL TEAM STABILIZATION */}
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-200 pb-1.5">Team Stabilization & KPI Actions</p>
                <div className="flex flex-col gap-2.5">
                  
                  {empModal.data.kpiScore < 70 && (
                    <button onClick={() => handleTriggerCoaching(empModal.data.name)} className="w-full bg-red-600 hover:bg-red-700 text-white p-3 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm flex justify-between items-center transition-colors">
                      <span className="flex items-center gap-2"><span>📉</span> Generate Performance Action Plan</span>
                      <span>→</span>
                    </button>
                  )}

                  {empModal.data.fatigueLevel === 'High' && (
                    <button onClick={() => handleMandatoryRest(empModal.data.name)} className="w-full bg-amber-500 hover:bg-amber-600 text-white p-3 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm flex justify-between items-center transition-colors">
                      <span className="flex items-center gap-2"><span>🛡️</span> Assign Mandatory Rest (Fatigue Lock)</span>
                      <span>→</span>
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button 
                      onClick={() => addToast(`Paging protocol initiated to ${empModal.data.name}'s terminal.`, 'info')}
                      className="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>💬</span> Page Radio
                    </button>
                    <button 
                      onClick={() => setEmpModal({ isOpen: false, data: null })}
                      className="bg-gray-800 hover:bg-black text-white py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors"
                    >
                      Close Control
                    </button>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </main>
  );
};

export default ShiftRoster;