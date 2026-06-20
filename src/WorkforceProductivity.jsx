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

const WorkforceProductivity = () => {
  const { bahasa } = useContext(AppContext);

  // 1. DATA MASTER STAFF & KPI (ARUS MOTORS EV GIGAFACTORY)
  const initialStaff = [
    { id: 'EMP-ARS-101', name: 'Budi Santoso', role: 'HV Assembler', shift: 'Morning', rateActual: 45, rateTarget: 40, errorRate: 0.2, overtime: 2, status: 'Active', attendance: 'Present', indirectHrs: 0.5, skills: ['HV Assembly', 'Battery Kitting'], certStatus: 'Valid' },
    { id: 'EMP-ARS-102', name: 'Siti Aminah', role: 'AGV Operator', shift: 'Morning', rateActual: 110, rateTarget: 100, errorRate: 1.5, overtime: 0, status: 'Active', attendance: 'Present', indirectHrs: 0, skills: ['AGV Operation', 'Telemetry QA'], certStatus: 'Valid' },
    { id: 'EMP-ARS-103', name: 'Agus Pratama', role: 'QC Technician', shift: 'Swing', rateActual: 38, rateTarget: 40, errorRate: 3.2, overtime: 14, status: 'Active', attendance: 'Present', indirectHrs: 1.0, skills: ['Telemetry QA'], certStatus: 'Valid' },
    { id: 'EMP-ARS-104', name: 'Joko Widodo', role: 'Battery Kitter', shift: 'Night', rateActual: 62, rateTarget: 60, errorRate: 0.0, overtime: 5, status: 'Active', attendance: 'Absent', indirectHrs: 0, skills: ['Battery Kitting', 'AGV Operation'], certStatus: 'Valid' },
    { id: 'EMP-ARS-105', name: 'Rini Yulianti', role: 'HV Assembler', shift: 'Swing', rateActual: 55, rateTarget: 40, errorRate: 0.1, overtime: 0, status: 'Active', attendance: 'On Leave', indirectHrs: 0, skills: ['HV Assembly', 'Telemetry QA'], certStatus: 'Expired' },
    { id: 'EMP-ARS-106', name: 'Hendra Gunawan', role: 'Line Feeder', shift: 'Night', rateActual: 75, rateTarget: 90, errorRate: 4.5, overtime: 0, status: 'In Training', attendance: 'Present', indirectHrs: 2.5, skills: ['AGV Operation'], certStatus: 'None' },
  ];

  const [staff, setStaff] = useState(() => {
    try {
      const saved = window.localStorage.getItem('workforceData_ARUS');
      return saved ? JSON.parse(saved) : initialStaff;
    } catch {
      return initialStaff;
    }
  });

  // ─── ALGORITMA PEMBERSIH DATA LAMA ───
  useEffect(() => {
    const hasOldData = staff.some(e => e.role === 'Picker' || e.role === 'Packer');
    if (hasOldData) setStaff(initialStaff);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('workforceData_ARUS', JSON.stringify(staff));
    } catch (error) {
      console.error('Failed to save workforce data:', error);
    }
  }, [staff]);

  // 2. STATE INTERAKTIF
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [toasts, setToasts] = useState([]);
  
  // State Modals
  const [profileModal, setProfileModal] = useState({ isOpen: false, data: null });
  const [indirectModal, setIndirectModal] = useState({ isOpen: false, data: null });
  const [indirectForm, setIndirectForm] = useState({ hours: '', reason: '' });

  // 3. FUNGSI TOAST
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // 4. ENGINE ANALISA PERFORMA & KESELAMATAN KERJA
  const processedStaff = useMemo(() => {
    return staff.map(emp => {
      let efficiency = 0;
      let grade = 'N/A';
      
      if (emp.attendance === 'Present') {
        efficiency = ((emp.rateActual / emp.rateTarget) * 100).toFixed(0);
        grade = 'Good';
        if (emp.certStatus === 'Expired') grade = 'Compliance Risk';
        else if (emp.status === 'In Training') grade = 'Training';
        else if (emp.errorRate > 2.0 || efficiency < 80) grade = 'Underperforming';
        else if (efficiency >= 110 && emp.errorRate < 0.5) grade = 'Excellent';
      } else {
        grade = emp.attendance; 
      }
      
      const isFatigued = emp.overtime > 10;

      return { ...emp, efficiency: parseInt(efficiency) || 0, grade, isFatigued };
    });
  }, [staff]);

  // METRIK GLOBAL DASHBOARD
  const presentStaff = processedStaff.filter(e => e.attendance === 'Present');
  const avgEfficiency = presentStaff.length > 0 ? (presentStaff.reduce((sum, e) => sum + e.efficiency, 0) / presentStaff.length).toFixed(0) : 0;
  const totalOvertime = processedStaff.reduce((sum, e) => sum + e.overtime, 0);
  const complianceRisks = processedStaff.filter(e => e.certStatus === 'Expired' && e.attendance === 'Present').length;
  const criticalErrors = presentStaff.filter(e => e.errorRate > 2.0).length;

  // ENGINE SKILL MATRIX (EV SPECIFIC)
  const skillList = ['HV Assembly', 'Battery Kitting', 'AGV Operation', 'Telemetry QA'];
  const skillMatrix = skillList.map(skill => {
    const totalTrained = staff.filter(e => e.skills.includes(skill)).length;
    const availableToday = presentStaff.filter(e => e.skills.includes(skill)).length;
    return { skill, totalTrained, availableToday };
  });

  // 5. FUNGSI EKSEKUSI MANAGERIAL & LMS
  const handleAssignTraining = (id, name, type = 'QA') => {
    setStaff(staff.map(e => e.id === id ? { ...e, status: 'In Training', certStatus: type === 'Safety' ? 'Valid' : e.certStatus } : e));
    setProfileModal({ isOpen: false, data: null });
    addToast(`LMS Action: Mandatory ${type} Training assigned to ${name}.`, 'info');
  };

  const handleApproveBonus = (id, name) => {
    addToast(`Kudos! Performance Bonus logged to Payroll Engine for ${name}.`, 'success');
    setProfileModal({ isOpen: false, data: null });
  };

  const handleClearOvertime = (id, name) => {
    setStaff(staff.map(e => e.id === id ? { ...e, overtime: 0 } : e));
    addToast(`Overtime cleared and sent to Payroll for ${name}. Fatigue warning reset.`, 'success');
  };

  const handleUpdateAttendance = (id, name, newStatus) => {
    setStaff(staff.map(e => e.id === id ? { ...e, attendance: newStatus } : e));
    addToast(`Attendance logic updated: ${name} is now marked as ${newStatus}.`, newStatus === 'Present' ? 'success' : 'info');
  };

  const handleLogIndirectTime = (e) => {
    e.preventDefault();
    if (!indirectForm.hours || !indirectForm.reason) return;

    setStaff(staff.map(emp => 
      emp.id === indirectModal.data.id 
        ? { ...emp, indirectHrs: emp.indirectHrs + parseFloat(indirectForm.hours) } 
        : emp
    ));
    addToast(`Logged ${indirectForm.hours} hrs of Indirect/Downtime for ${indirectModal.data.name}.`, 'success');
    setIndirectModal({ isOpen: false, data: null });
    setIndirectForm({ hours: '', reason: '' });
  };

  // 6. FUNGSI EXPORT (CSV)
  const handleExportCSV = () => {
    addToast(bahasa === 'en' ? 'Compiling HR & Productivity Data...' : 'Mengekspor Data HR...', 'info');
    const headers = ['Emp ID', 'Name', 'Role', 'Attendance', 'Safety Cert', 'Indirect Hrs', 'Efficiency (%)', 'QA Error Rate (%)', 'Overtime Hrs', 'System Grade'];
    const csvRows = [headers.join(',')];
    
    processedStaff.forEach(e => {
      csvRows.push([e.id, `"${e.name}"`, e.role, e.attendance, e.certStatus, e.indirectHrs, e.efficiency, e.errorRate, e.overtime, e.grade].join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `ARUS_Workforce_LMS_Report.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => addToast('Workforce data exported successfully!', 'success'), 800);
  };

  // SEARCH & FILTER
  const roles = ['ALL', ...new Set(staff.map(e => e.role))];
  const filteredData = processedStaff.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === 'ALL' ? true : e.role === filterRole;
    return matchSearch && matchRole;
  });

  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 animate-fade-in">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER & TOOLBAR ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>👥 Workforce</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Productivity</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide">
            {bahasa === 'en' ? 'Workforce Productivity & LMS' : 'KPI Produktivitas & LMS'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">Manage EV assembly attendance, track safety certifications, and evaluate efficiency.</p>
        </div>
        <button onClick={handleExportCSV} className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-5 py-2.5 rounded-sm text-xs font-bold transition-colors shadow-sm uppercase tracking-wider flex items-center gap-2">
          <span>⭳</span> Export HR Data
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* ── KIRI: METRICS DASHBOARD (2 Kolom) ── */}
        <div className="xl:col-span-2 grid grid-cols-2 gap-4">
          <div className="bg-white p-5 border border-gray-200 shadow-sm rounded-sm hover:shadow-md transition-shadow">
            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Live Assembly Attendance</p>
            <div className="flex items-end gap-2 mt-1">
              <p className="text-3xl font-black text-[#125ab2]">{presentStaff.length}</p>
              <span className="text-xs font-bold text-gray-400 mb-1">/ {staff.length} Present</span>
            </div>
            <div className="w-full bg-gray-100 h-1.5 mt-3 rounded-full overflow-hidden">
              <div className="bg-[#125ab2] h-full" style={{ width: `${(presentStaff.length / staff.length) * 100}%` }}></div>
            </div>
          </div>
          
          <div className="bg-white p-5 border-l-4 border-l-[#125ab2] border border-y-gray-200 border-r-gray-200 shadow-sm rounded-sm hover:shadow-md transition-shadow">
            <p className="text-[10px] uppercase font-bold text-[#125ab2] tracking-wider">Avg. Live Efficiency</p>
            <div className="flex items-end gap-2 mt-1">
              <p className={`text-3xl font-black ${avgEfficiency >= 95 ? 'text-emerald-600' : 'text-amber-500'}`}>{avgEfficiency}%</p>
              <span className="text-xs font-bold text-gray-400 mb-1">Target: 100%</span>
            </div>
            <p className="text-[10px] font-semibold text-gray-500 mt-2">Aggregate of actual vs targeted line feeds.</p>
          </div>

          <div className="bg-white p-5 border-l-4 border-l-amber-500 border border-y-gray-200 border-r-gray-200 shadow-sm rounded-sm hover:shadow-md transition-shadow">
            <p className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">Total Overtime (YTD)</p>
            <div className="flex items-end gap-2 mt-1">
              <p className="text-3xl font-black text-amber-600">{totalOvertime}</p>
              <span className="text-sm font-bold text-gray-400 mb-1">Hrs</span>
            </div>
            <p className="text-[10px] font-semibold text-gray-500 mt-2">Monitored for fatigue and safety risk.</p>
          </div>

          <div className="bg-white p-5 border-l-4 border-l-red-600 border border-y-gray-200 border-r-gray-200 shadow-sm rounded-sm hover:shadow-md transition-shadow">
            <p className="text-[10px] uppercase font-bold text-red-600 tracking-wider">Compliance & Safety Risks</p>
            <div className="flex items-end gap-2 mt-1">
              <p className="text-3xl font-black text-red-700">{complianceRisks + criticalErrors}</p>
              <span className="text-sm font-bold text-gray-400 mb-1">Alerts</span>
            </div>
            <p className="text-[10px] font-bold text-red-500 mt-2 flex items-center gap-1">
              <span>⚠</span> Expired Certs ({complianceRisks}) | High Errors ({criticalErrors})
            </p>
          </div>
        </div>

        {/* ── KANAN: SKILL MATRIX BOTTLE-NECK TRACKER ── */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-sm flex flex-col overflow-hidden hover:shadow-md transition-shadow">
          <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex justify-between items-center">
            <h3 className="text-[11px] font-black text-gray-700 uppercase tracking-wider">Cross-Training Matrix</h3>
            <span className="text-lg grayscale">🎯</span>
          </div>
          <div className="p-0 overflow-y-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-[#f8f9fa] text-gray-500 text-[9px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-5 border-b border-gray-200">Critical Skillset</th>
                  <th className="py-2.5 px-5 border-b border-gray-200 text-center">Trained</th>
                  <th className="py-2.5 px-5 border-b border-gray-200 text-center">Floor Avail</th>
                </tr>
              </thead>
              <tbody className="text-[12px]">
                {skillMatrix.map((sm, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                    <td className="py-2.5 px-5 font-bold text-gray-800">{sm.skill}</td>
                    <td className="py-2.5 px-5 text-center font-semibold text-gray-600">{sm.totalTrained}</td>
                    <td className="py-2.5 px-5 text-center">
                      <span className={`font-black px-2 py-0.5 rounded-sm text-[10px] ${sm.availableToday === 0 ? 'bg-red-100 text-red-700' : sm.availableToday <= 1 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {sm.availableToday}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-gray-50 text-[9px] text-gray-500 font-bold uppercase tracking-wider border-t border-gray-200">
            *Floor Avail shows trained staff currently marked "Present".
          </div>
        </div>
      </div>

      {/* ── TOOLBAR (SEARCH & FILTER) ── */}
      <div className="bg-white p-3 border border-gray-300 shadow-sm rounded-sm mb-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {roles.map(role => (
            <button key={role} onClick={() => setFilterRole(role)} className={`px-4 py-1.5 text-xs font-bold uppercase rounded-sm border transition-colors ${filterRole === role ? 'bg-[#415a77] text-white border-[#415a77]' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'}`}>
              {role}
            </button>
          ))}
        </div>
        <input 
          type="text" 
          placeholder="Search Personnel Name or Emp ID..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 px-4 py-1.5 rounded-sm text-sm outline-none focus:border-[#125ab2] w-full sm:w-80 transition-colors"
        />
      </div>

      {/* ── TABEL DATA STAFF KPI & LMS ── */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
            <thead className="bg-[#e5e5e5] text-[#666666] text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 font-bold border-b border-gray-300">EMPLOYEE IDENTIFIER</th>
                <th className="py-3 px-4 font-bold border-b border-gray-300 text-center">SAFETY CERT</th>
                <th className="py-3 px-4 font-bold border-b border-gray-300 text-center">LIVE STATUS</th>
                <th className="py-3 px-4 font-bold border-b border-gray-300 w-40">EFFICIENCY KPI</th>
                <th className="py-3 px-4 font-bold border-b border-gray-300 text-center">INDIRECT TIME</th>
                <th className="py-3 px-4 font-bold border-b border-gray-300 text-center">QA ERROR</th>
                <th className="py-3 px-4 font-bold border-b border-gray-300 text-center">PERFORMANCE</th>
                <th className="py-3 px-4 font-bold border-b border-gray-300 text-center w-28">ACTION</th>
              </tr>
            </thead>
            <tbody className="text-[12px] text-gray-700">
              {filteredData.length === 0 ? (
                <tr><td colSpan="8" className="py-12 text-center text-gray-400 font-bold italic">No personnel records found.</td></tr>
              ) : (
                filteredData.map((emp) => (
                  <tr key={emp.id} className={`border-b border-gray-100 transition-colors ${emp.attendance !== 'Present' ? 'bg-gray-50 opacity-60 grayscale' : emp.grade === 'Underperforming' || emp.certStatus === 'Expired' ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-blue-50'}`}>
                    
                    <td className="py-3 px-4">
                      <div 
                        className="font-black text-[13px] text-[#125ab2] cursor-pointer hover:underline flex items-center gap-1.5"
                        onClick={() => setProfileModal({ isOpen: true, data: emp })}
                        title="Open Personnel Management Profile"
                      >
                        <span className="text-base">👤</span> {emp.name}
                      </div>
                      <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-1">{emp.id} | <span className="text-gray-800">{emp.role}</span> ({emp.shift})</div>
                      <div className="mt-1.5 flex gap-1 flex-wrap w-48">
                        {emp.skills.map((s, i) => <span key={i} className="text-[8px] bg-white text-gray-600 border border-gray-300 px-1.5 py-0.5 rounded-sm uppercase font-bold shadow-sm">{s}</span>)}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider border ${
                        emp.certStatus === 'Valid' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                        emp.certStatus === 'Expired' ? 'bg-red-600 text-white border-red-700 shadow-sm animate-pulse' : 
                        'bg-gray-200 text-gray-600 border-gray-300'
                      }`}>
                        {emp.certStatus}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="relative group/status inline-block">
                        <select 
                          value={emp.attendance}
                          onChange={(e) => handleUpdateAttendance(emp.id, emp.name, e.target.value)}
                          className={`appearance-none cursor-pointer font-bold text-[10px] uppercase tracking-wider px-2 py-1 rounded-sm outline-none border transition-colors shadow-sm ${
                            emp.attendance === 'Present' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
                            emp.attendance === 'Absent' ? 'bg-red-100 text-red-700 border-red-300' :
                            'bg-gray-100 text-gray-600 border-gray-300'
                          }`}
                        >
                          <option value="Present">● Present</option>
                          <option value="Absent">● Absent</option>
                          <option value="On Leave">● On Leave</option>
                          <option value="Rest Day">● Rest Day</option>
                        </select>
                      </div>
                    </td>
                    
                    <td className="py-3 px-4">
                      {emp.attendance === 'Present' ? (
                        <>
                          <div className="flex justify-between items-end mb-1">
                            <span className="font-black text-gray-800">{emp.rateActual} <span className="font-bold text-[9px] text-gray-400 uppercase tracking-wider">/hr</span></span>
                            <span className={`text-[11px] font-black ${emp.efficiency >= 100 ? 'text-emerald-600' : 'text-amber-500'}`}>{emp.efficiency}%</span>
                          </div>
                          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden shadow-inner">
                            <div className={`h-full ${emp.efficiency >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(emp.efficiency, 100)}%` }}></div>
                          </div>
                        </>
                      ) : (
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Off Floor</div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {emp.attendance === 'Present' ? (
                        <div className="font-black text-[#125ab2]">
                          {emp.indirectHrs} <span className="text-[9px] font-bold uppercase text-gray-400">Hrs</span>
                        </div>
                      ) : (
                        <div className="text-gray-300 font-bold">—</div>
                      )}
                    </td>
                    
                    <td className="py-3 px-4 text-center">
                      {emp.attendance === 'Present' ? (
                        <>
                          <div className={`font-black text-[14px] ${emp.errorRate > 2.0 ? 'text-red-600' : emp.errorRate === 0 ? 'text-emerald-600' : 'text-gray-600'}`}>
                            {emp.errorRate}%
                          </div>
                          {emp.errorRate > 2.0 && <div className="text-[9px] text-red-600 bg-red-100 border border-red-200 rounded px-1 uppercase mt-0.5 font-bold inline-block">QA Warning</div>}
                        </>
                      ) : (
                        <div className="text-gray-300 font-bold">—</div>
                      )}
                    </td>
                    
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider border ${
                        emp.grade === 'Excellent' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                        emp.grade === 'Good' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        emp.grade === 'Training' ? 'bg-gray-800 text-white border-black' :
                        emp.grade === 'Compliance Risk' || emp.grade === 'Underperforming' ? 'bg-red-600 text-white border-red-700 shadow-sm' :
                        'bg-gray-100 text-gray-500 border-gray-200'
                      }`}>
                        {emp.grade}
                      </span>
                    </td>
                    
                    <td className="py-3 px-4 text-center">
                      <button 
                        onClick={() => setProfileModal({ isOpen: true, data: emp })}
                        className="bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 px-3 py-1.5 rounded-sm font-bold text-[10px] uppercase shadow-sm w-full transition-colors tracking-wider"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🛡️ MODAL 1: MANAGERIAL INTERVENTION & LMS PROFILE (BULLETPROOF FLEXBOX)   */}
      {/* ========================================================================= */}
      {profileModal.isOpen && profileModal.data && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[500px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-gray-800" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            <div className={`px-6 py-4 flex justify-between items-center shrink-0 z-10 text-white ${
              profileModal.data.certStatus === 'Expired' ? 'bg-red-700' :
              profileModal.data.grade === 'Excellent' ? 'bg-emerald-600' : 
              profileModal.data.grade === 'Underperforming' ? 'bg-amber-600' : 
              'bg-[#415a77]'
            }`}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 opacity-80">Personnel Profile & LMS</p>
                <h3 className="font-black text-xl leading-none">{profileModal.data.name}</h3>
              </div>
              <button onClick={() => setProfileModal({ isOpen: false, data: null })} className="text-white opacity-70 hover:opacity-100 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 text-sm text-gray-800 space-y-5">
              
              <div className="grid grid-cols-2 gap-4 border-b border-gray-200 pb-5">
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider block mb-1">Employee ID</span>
                  <span className="font-mono font-bold text-gray-900">{profileModal.data.id}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider block mb-1">Assigned Role</span>
                  <span className="font-bold text-[#125ab2] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-sm">{profileModal.data.role.toUpperCase()}</span>
                </div>
              </div>

              {profileModal.data.certStatus === 'Expired' && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-sm flex items-start gap-3 shadow-inner">
                  <span className="text-2xl animate-pulse">🚨</span>
                  <div>
                    <p className="text-[10px] font-black text-red-700 uppercase tracking-wider mb-0.5">Critical Safety Violation</p>
                    <p className="text-xs text-red-800 font-semibold leading-relaxed">High-Voltage (HV) handling certification has expired. Immediate recertification required before floor access is granted.</p>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 border border-gray-200 p-4 rounded-sm relative shadow-sm">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3 border-b border-gray-200 pb-2">Operational KPI Overview</p>
                {profileModal.data.attendance !== 'Present' && (
                  <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center font-bold text-gray-500 uppercase text-xs z-10 rounded-sm">
                    <span className="text-2xl mb-2">🔒</span>
                    Metrics Locked - Staff is {profileModal.data.attendance}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-y-4 gap-x-4 relative z-0">
                  <div>
                    <span className="block text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-1">Live Efficiency</span>
                    <span className={`font-black text-xl ${profileModal.data.efficiency >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>{profileModal.data.efficiency}%</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-1">QA Error Rate</span>
                    <span className={`font-black text-xl ${profileModal.data.errorRate > 2.0 ? 'text-red-600' : 'text-gray-800'}`}>{profileModal.data.errorRate}%</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-1">Actual Speed</span>
                    <span className="font-black text-gray-800 text-base">{profileModal.data.rateActual} <span className="text-[10px] font-bold text-gray-400">UNITS/HR</span></span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-1">Target Speed</span>
                    <span className="font-bold text-gray-500 text-base">{profileModal.data.rateTarget} <span className="text-[10px] font-bold text-gray-400">UNITS/HR</span></span>
                  </div>
                </div>
              </div>

              {profileModal.data.isFatigued && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-sm flex items-center justify-between shadow-inner">
                  <div>
                    <p className="text-[10px] font-black text-amber-800 uppercase tracking-wider mb-0.5">⚠ Fatigue / Safety Warning</p>
                    <p className="text-xs text-amber-900 font-medium">Accumulated <strong>{profileModal.data.overtime} hours</strong> of overtime. Accident risk elevated.</p>
                  </div>
                  <button onClick={() => handleClearOvertime(profileModal.data.id, profileModal.data.name)} className="bg-white border border-amber-300 hover:bg-amber-100 text-amber-800 px-3 py-2 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors whitespace-nowrap">
                    Clear OT
                  </button>
                </div>
              )}

              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-200 pb-2">Managerial / HR Actions</p>
                <div className="flex flex-col gap-2">
                  
                  {profileModal.data.certStatus === 'Expired' && (
                    <button onClick={() => handleAssignTraining(profileModal.data.id, profileModal.data.name, 'Safety')} className="w-full bg-red-600 hover:bg-red-700 text-white p-3 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm flex justify-between items-center transition-colors">
                      <span className="flex items-center gap-2"><span>🛡️</span> Assign HV Safety Recertification</span>
                      <span>→</span>
                    </button>
                  )}

                  {profileModal.data.attendance === 'Present' && profileModal.data.certStatus === 'Valid' && (
                    <button 
                      onClick={() => {
                        setIndirectModal({ isOpen: true, data: profileModal.data });
                        setProfileModal({ isOpen: false, data: null });
                      }} 
                      className="w-full bg-white hover:bg-blue-50 text-[#125ab2] border border-[#125ab2] p-3 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm flex justify-between items-center transition-colors"
                    >
                      <span className="flex items-center gap-2"><span>⏱</span> Log Non-Productive / Downtime</span>
                      <span>→</span>
                    </button>
                  )}

                  {profileModal.data.grade === 'Excellent' && profileModal.data.certStatus === 'Valid' && (
                    <button onClick={() => handleApproveBonus(profileModal.data.id, profileModal.data.name)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm flex justify-between items-center transition-colors">
                      <span className="flex items-center gap-2"><span>🏆</span> Authorize Performance Bonus</span>
                      <span>→</span>
                    </button>
                  )}

                  {(profileModal.data.grade === 'Underperforming' || profileModal.data.errorRate > 2.0) && profileModal.data.status !== 'In Training' && profileModal.data.attendance === 'Present' && profileModal.data.certStatus === 'Valid' && (
                    <button onClick={() => handleAssignTraining(profileModal.data.id, profileModal.data.name, 'QA')} className="w-full bg-amber-500 hover:bg-amber-600 text-white p-3 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm flex justify-between items-center transition-colors">
                      <span className="flex items-center gap-2"><span>📚</span> Assign Mandatory QA Retraining</span>
                      <span>→</span>
                    </button>
                  )}

                </div>
              </div>
            </div>

            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end shrink-0 z-10">
              <button onClick={() => setProfileModal({ isOpen: false, data: null })} className="px-6 py-2.5 bg-gray-800 hover:bg-black text-white text-[10px] font-bold uppercase tracking-wider shadow-sm rounded-sm transition-colors w-full sm:w-auto">
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ MODAL 2: LOG INDIRECT TIME (BULLETPROOF FLEXBOX)                       */}
      {/* ========================================================================= */}
      {indirectModal.isOpen && indirectModal.data && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[450px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-[#125ab2]" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            <div className="bg-blue-50 border-b border-blue-100 text-gray-800 px-6 py-4 flex justify-between items-center shrink-0 z-10">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Labor Tracking</p>
                <h3 className="font-black text-sm uppercase tracking-wider text-[#125ab2]">Log Non-Productive Time</h3>
              </div>
              <button onClick={() => setIndirectModal({ isOpen: false, data: null })} className="text-gray-400 hover:text-gray-800 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <form onSubmit={handleLogIndirectTime} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 flex flex-col gap-5">
                
                <div className="bg-gray-50 p-4 rounded-sm border border-gray-200">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Target Personnel</span>
                  <p className="font-black text-gray-900 text-lg leading-tight mb-2">{indirectModal.data.name}</p>
                  <div className="flex justify-between items-center border-t border-gray-200 pt-2 mt-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Current Indirect Hrs:</span>
                    <span className="font-mono font-black text-[#125ab2]">{indirectModal.data.indirectHrs} Hrs</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Downtime Duration (Hours) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" step="0.5" min="0.5" placeholder="e.g. 1.5" 
                    value={indirectForm.hours} onChange={e => setIndirectForm({...indirectForm, hours: e.target.value})} 
                    className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] focus:ring-1 focus:ring-[#125ab2] font-mono font-black text-lg text-gray-800 rounded-sm transition-all" 
                    required autoFocus
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Reason / Activity Category <span className="text-red-500">*</span></label>
                  <select 
                    value={indirectForm.reason} onChange={e => setIndirectForm({...indirectForm, reason: e.target.value})} 
                    className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] font-semibold text-gray-700 bg-white rounded-sm cursor-pointer" 
                    required
                  >
                    <option value="" disabled>-- Select Reason --</option>
                    <option value="Safety/Toolbox Meeting">Safety / Toolbox Briefing</option>
                    <option value="Housekeeping/Cleaning">Housekeeping / 5S Protocol</option>
                    <option value="Equipment Failure (Scanner/AGV)">Equipment Failure (AGV/Scanner)</option>
                    <option value="System Downtime (ERP/WMS)">System Downtime (ERP/WMS)</option>
                    <option value="Assisting Other Departments">Assisting Other Departments</option>
                  </select>
                </div>
              </div>

              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 shrink-0 z-10">
                <button type="button" onClick={() => setIndirectModal({ isOpen: false, data: null })} className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm rounded-sm">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-[#125ab2] hover:bg-[#0e4487] text-white font-bold shadow-sm transition-colors text-[10px] uppercase tracking-wider rounded-sm">Commit Ledger</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
};

export default WorkforceProductivity;