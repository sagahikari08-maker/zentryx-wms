import React, { useState, useContext, useEffect } from 'react';
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

const DailyLogistics = () => {
  const { bahasa } = useContext(AppContext);

  // 1. STATE & DATA MASTER (ARUS MOTORS CONTEXT)
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reportStatus, setReportStatus] = useState('Draft'); // Draft, Locked
  const [toasts, setToasts] = useState([]);

  // Simulasi Metrik Operasional EV Manufacturing
  const [metrics, setMetrics] = useState({
    inbound: { expected: 125, received: 110, pallets: 38, status: 'In Progress' },
    outbound: { orders: 42, shipped: 42, pending: 0, fillRate: 100.0 }, // Orders di sini = B2B Dealer Shipments / Assembly Line Feed
    labor: { activeStaff: 185, overtimeHours: 24, pickRate: '45 Lines/Hr' }
  });

  // State Log Aktivitas (EV Context)
  const [departmentLogs, setDepartmentLogs] = useState([
    { id: 'LOG-001', dept: 'Inbound / Receiving', shift: 'Morning', metric: '15 Shipping Containers Unloaded', performance: '92% (Slight Delay)', note: 'Customs clearance delay for LFP Batteries. Managed to catch up by 14:00.' },
    { id: 'LOG-002', dept: 'Kitting / Assembly Feed', shift: 'Morning', metric: '42 Powertrain Kits Delivered to Line', performance: '100% Efficiency', note: 'All kits delivered to Zone C assembly lines on schedule.' },
  ]);

  // State Exceptions (Logistics Incidents)
  const [exceptions, setExceptions] = useState([
    { id: 'INC-001', time: '14:30', issue: 'Carrier Delay (Maersk Logistics)', impact: '2 Container inbound delayed to tomorrow', status: 'Open', resolution: '' },
    { id: 'INC-002', time: '10:00', issue: 'Scanner Network Outage in Zone B', impact: '15 mins picking downtime for Batteries', status: 'Resolved', resolution: 'IT restarted Access Point in Zone B-01.' },
  ]);

  // Modal States
  const [resolveModal, setResolveModal] = useState({ isOpen: false, item: null });
  const [resolveText, setResolveText] = useState('');
  
  const [logModal, setLogModal] = useState(false);
  const [logForm, setLogForm] = useState({ dept: 'Kitting / Assembly Feed', shift: 'Swing', metric: '', performance: '', note: '' });

  const [excModal, setExcModal] = useState(false);
  const [excForm, setExcForm] = useState({ time: '15:00', issue: '', impact: '' });

  // Reset/Clear Data Lama (Pizza Catcher)
  useEffect(() => {
    const hasOldData = departmentLogs.some(log => log.dept === 'Putaway' && log.metric.includes('42 Pallets'));
    if (hasOldData) {
      // Data sudah tergantikan dengan initial state di atas
    }
  }, [departmentLogs]);

  // 2. FUNGSI TOAST
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // 3. FUNGSI RESOLVE EXCEPTION
  const handleResolveException = (e) => {
    e.preventDefault();
    if (!resolveText.trim()) {
      addToast('Resolution action cannot be empty!', 'error');
      return;
    }
    setExceptions(exceptions.map(ex => 
      ex.id === resolveModal.item.id 
        ? { ...ex, status: 'Resolved', resolution: resolveText.trim() } 
        : ex
    ));
    addToast(`Incident ${resolveModal.item.id} marked as Resolved.`, 'success');
    setResolveModal({ isOpen: false, item: null });
    setResolveText('');
  };

  // 4. FUNGSI TAMBAH ACTIVITY LOG (DINAMIS)
  const handleAddLog = (e) => {
    e.preventDefault();
    if (!logForm.metric || !logForm.performance) {
      addToast('Key metric and performance status are required.', 'error');
      return;
    }
    const newLog = { 
      id: `LOG-${String(departmentLogs.length + 1).padStart(3, '0')}`,
      ...logForm 
    };
    setDepartmentLogs([newLog, ...departmentLogs]);
    setLogModal(false);
    setLogForm({ dept: 'Kitting / Assembly Feed', shift: 'Swing', metric: '', performance: '', note: '' });
    addToast('Department operational log added successfully.', 'success');
  };

  // 5. FUNGSI TAMBAH EXCEPTION BARU (DINAMIS)
  const handleAddException = (e) => {
    e.preventDefault();
    if (!excForm.issue || !excForm.impact) {
      addToast('Issue description and impact are required.', 'error');
      return;
    }
    const newId = `INC-${String(exceptions.length + 1).padStart(3, '0')}`;
    setExceptions([{ id: newId, ...excForm, status: 'Open', resolution: '' }, ...exceptions]);
    setExcModal(false);
    setExcForm({ time: '15:00', issue: '', impact: '' });
    addToast('New operational incident reported!', 'error');
  };

  // 6. FUNGSI SIGN-OFF (LOCK REPORT) SAFEGUARD
  const handleSignOff = () => {
    const openIssues = exceptions.filter(e => e.status === 'Open').length;
    if (openIssues > 0) {
      addToast(`Compliance Check Failed: Cannot sign-off report! There are ${openIssues} open incidents that must be resolved first.`, 'error');
      return;
    }
    setReportStatus('Locked');
    addToast('Daily Logistics Report Signed-Off and Secured. Excellent operations today!', 'success');
  };

  // 7. FUNGSI DOWNLOAD EOD REPORT (.TXT)
  const handleDownloadReport = () => {
    addToast('Compiling Official EOD Report...', 'info');
    const content = `
==================================================
ARUS MOTORS - OFFICIAL DAILY LOGISTICS REPORT
==================================================
Date          : ${reportDate}
Generated By  : Zentryx WMS (Chief Warehouse Manager)
Status        : ${reportStatus}
--------------------------------------------------
[ INBOUND OPERATIONS ]
Expected Shipments : ${metrics.inbound.expected}
Received Shipments : ${metrics.inbound.received} (${metrics.inbound.status})
Pallets Stowed     : ${metrics.inbound.pallets}

[ OUTBOUND & LINE FEEDING ]
Total Orders       : ${metrics.outbound.orders}
Completed Feeds    : ${metrics.outbound.shipped}
Order Fill Rate    : ${metrics.outbound.fillRate}%

[ WORKFORCE PERFORMANCE ]
Active Personnel   : ${metrics.labor.activeStaff}
Overtime Hours     : ${metrics.labor.overtimeHours}
Avg. Clearance     : ${metrics.labor.pickRate}

[ DEPARTMENTAL ACTIVITY LOGS ]
${departmentLogs.map(l => `- [${l.dept} / ${l.shift}] Metric: ${l.metric} | Perf: ${l.performance} | Note: ${l.note || 'None'}`).join('\n')}

[ OPERATIONAL INCIDENTS / EXCEPTIONS ]
${exceptions.map(ex => `[${ex.time}] ${ex.issue} -> Status: ${ex.status} | Resolution: ${ex.resolution || 'Pending Action'}`).join('\n')}
==================================================
`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `ARUS_EOD_Logistics_Report_${reportDate}.txt`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => addToast('EOD Report Exported successfully!', 'success'), 800);
  };

  const openIssuesCount = exceptions.filter(e => e.status === 'Open').length;

  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 animate-fade-in">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER & TOOLBAR ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>📊 Analytics</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Operational Reports</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide flex items-center gap-3">
            {bahasa === 'en' ? 'Daily Logistics EOD Report' : 'Laporan Logistik Harian (EOD)'}
            {reportStatus === 'Locked' && (
              <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-sm text-[10px] uppercase font-black border border-emerald-200 shadow-sm flex items-center gap-1">
                <span>🔒</span> Signed-Off
              </span>
            )}
            {reportStatus === 'Draft' && (
              <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-sm text-[10px] uppercase font-black border border-amber-200 flex items-center gap-1">
                <span>📝</span> Draft Mode
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-500 mt-1">Review end-of-day metrics, log departmental activities, and resolve operational incidents.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <input 
            type="date" 
            value={reportDate} 
            onChange={(e) => setReportDate(e.target.value)} 
            disabled={reportStatus === 'Locked'}
            className={`border border-gray-300 px-3 py-2.5 rounded-sm text-xs font-bold text-gray-700 outline-none transition-colors ${reportStatus === 'Locked' ? 'bg-gray-100 opacity-60 cursor-not-allowed' : 'bg-white focus:border-[#125ab2]'}`}
            title={reportStatus === 'Locked' ? "Report is locked. Cannot change date." : "Select Report Date"}
          />
          <button onClick={handleDownloadReport} className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 px-4 py-2.5 rounded-sm text-[11px] font-bold transition-colors shadow-sm uppercase tracking-wider flex items-center gap-2">
            <span>⭳</span> Export EOD Text
          </button>
          
          {reportStatus === 'Draft' ? (
            <button 
              onClick={handleSignOff} 
              className={`px-5 py-2.5 rounded-sm text-[11px] font-bold transition-colors shadow-sm uppercase tracking-wider flex items-center gap-2 ${openIssuesCount > 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#125ab2] hover:bg-[#0e4487] text-white'}`}
              title={openIssuesCount > 0 ? "Resolve all incidents before signing off" : "Sign-Off and Lock Report"}
            >
              <span>✍️</span> Sign-Off Day
            </button>
          ) : (
            <button disabled className="bg-emerald-600 text-white px-5 py-2.5 rounded-sm text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 cursor-not-allowed opacity-80">
              <span>✓</span> Day Locked
            </button>
          )}
        </div>
      </div>

      {/* ── METRICS DASHBOARD (EV SCALE) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
        <div className="bg-white p-5 border border-gray-200 shadow-sm rounded-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-[#125ab2] tracking-wider mb-2">Inbound Flow (Received)</p>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-black text-gray-900 leading-none">{metrics.inbound.received}</p>
            <p className="text-xs font-bold text-gray-400">/ {metrics.inbound.expected} Shipments</p>
          </div>
          <div className="w-full bg-gray-100 border border-gray-200 h-2 mt-4 rounded-full overflow-hidden">
            <div className="bg-[#125ab2] h-full" style={{ width: `${(metrics.inbound.received/metrics.inbound.expected)*100}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-5 border border-gray-200 shadow-sm rounded-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider mb-2">Assembly Feed (Outbound)</p>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-black text-gray-900 leading-none">{metrics.outbound.shipped}</p>
            <p className="text-xs font-bold text-gray-400">/ {metrics.outbound.orders} Feeds</p>
          </div>
          <div className="w-full bg-gray-100 border border-gray-200 h-2 mt-4 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full" style={{ width: `${(metrics.outbound.shipped/metrics.outbound.orders)*100}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-5 border border-gray-200 shadow-sm rounded-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-amber-600 tracking-wider mb-2">Line Fill Rate (OTIF)</p>
          <div className="flex items-end justify-between mt-1">
            <p className="text-3xl font-black text-gray-900 leading-none">{metrics.outbound.fillRate}%</p>
            <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-sm border border-amber-200">
              {metrics.outbound.pending} Pending Feed
            </span>
          </div>
          <p className="text-[10px] font-semibold text-gray-500 mt-3 pt-3 border-t border-gray-100">Workforce active: {metrics.labor.activeStaff} Staff</p>
        </div>

        <div className="bg-white p-5 border border-gray-200 shadow-sm rounded-sm relative overflow-hidden hover:shadow-md transition-shadow">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
          <p className="text-[10px] uppercase font-bold text-red-600 tracking-wider mb-2 pl-2">Active Incidents</p>
          <div className="flex items-end gap-3 pl-2">
            <p className="text-4xl font-black text-red-600 leading-none mt-1">
              {openIssuesCount}
            </p>
            {openIssuesCount > 0 && <span className="text-xl animate-pulse">🚨</span>}
          </div>
          <p className="text-[9px] text-gray-500 mt-3 pt-3 border-t border-gray-100 font-bold uppercase pl-2">
            {openIssuesCount > 0 ? "Requires resolution for Sign-off" : "All clear. Ready for Sign-off."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* ── DEPARTMENTAL PERFORMANCE LOG ── */}
        <div className="xl:col-span-2 bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden flex flex-col">
          <div className="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Departmental Activity Log</h3>
            {reportStatus === 'Draft' && (
              <button 
                onClick={() => setLogModal(true)} 
                className="bg-white border border-[#125ab2] text-[#125ab2] px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase shadow-sm hover:bg-blue-50 transition-colors"
              >
                + Add Activity Log
              </button>
            )}
          </div>
          <div className="p-0 overflow-x-auto flex-1">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-[#e5e5e5] text-[#666666] text-[10px] uppercase tracking-wider border-b border-gray-300">
                <tr>
                  <th className="py-3 px-4 font-bold w-48">DEPARTMENT / SHIFT</th>
                  <th className="py-3 px-4 font-bold">KEY METRIC ACHIEVED</th>
                  <th className="py-3 px-4 font-bold w-64">PERFORMANCE STATUS</th>
                </tr>
              </thead>
              <tbody className="text-[12px] text-gray-700">
                {departmentLogs.length === 0 ? (
                  <tr><td colSpan="3" className="py-8 text-center text-gray-400 italic">No departmental activities logged today.</td></tr>
                ) : (
                  departmentLogs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#125ab2]">{log.dept}</div>
                        <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-1 bg-white inline-block px-1.5 py-0.5 border border-gray-200 rounded-sm">
                          {log.shift} Shift
                        </div>
                      </td>
                      <td className="py-3 px-4 font-black text-gray-800 text-[13px]">{log.metric}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-emerald-700">{log.performance}</div>
                        <div className="text-[10px] text-gray-500 mt-1 italic leading-relaxed border-l-2 border-gray-300 pl-2">"{log.note}"</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── OPERATIONAL INCIDENTS (EXCEPTIONS) ── */}
        <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden flex flex-col h-[500px] xl:h-auto">
          <div className="bg-red-50 border-b border-red-100 p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-red-800 uppercase tracking-wider">Operational Incidents</h3>
              <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded border border-red-700 shadow-sm">
                {openIssuesCount} Open
              </span>
            </div>
            {reportStatus === 'Draft' && (
              <button 
                onClick={() => setExcModal(true)} 
                className="bg-white border border-red-400 text-red-700 px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase shadow-sm hover:bg-red-50 transition-colors"
              >
                + Report Incident
              </button>
            )}
          </div>
          <div className="p-4 flex-1 overflow-y-auto bg-gray-50 space-y-4 custom-scrollbar">
            {exceptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-70 pt-10">
                <span className="text-4xl mb-2">🎉</span>
                <p className="text-xs font-bold italic text-center">Perfect run today!<br/>No incidents reported.</p>
              </div>
            ) : (
              exceptions.map(ex => (
                <div key={ex.id} className={`p-4 rounded-sm border shadow-sm transition-all ${ex.status === 'Open' ? 'bg-white border-red-200 border-l-4 border-l-red-500 hover:shadow-md' : 'bg-gray-100 border-gray-200 border-l-4 border-l-gray-400 opacity-80'}`}>
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-100">
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-sm">{ex.time}</span>
                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-sm tracking-wider ${ex.status === 'Open' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                      {ex.status}
                    </span>
                  </div>
                  <p className={`text-sm font-bold leading-snug mb-2 ${ex.status === 'Open' ? 'text-gray-900' : 'text-gray-600 line-through'}`}>{ex.issue}</p>
                  
                  <div className="bg-red-50 border border-red-100 p-2 rounded-sm mb-3">
                    <span className="text-[9px] font-bold text-red-800 uppercase tracking-wider block mb-0.5">Impact:</span>
                    <span className="text-xs font-semibold text-red-700">{ex.impact}</span>
                  </div>
                  
                  {ex.status === 'Open' && reportStatus === 'Draft' && (
                    <button 
                      onClick={() => setResolveModal({ isOpen: true, item: ex })}
                      className="w-full bg-white hover:bg-red-50 border border-red-300 text-red-700 py-2 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm"
                    >
                      Acknowledge & Resolve
                    </button>
                  )}
                  {ex.status === 'Resolved' && (
                    <div className="text-[11px] bg-white p-3 border border-emerald-200 rounded-sm text-gray-700 font-medium">
                      <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">Resolution Applied:</span>
                      {ex.resolution}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🛡️ MODAL 1: ADD DEPARTMENT LOG (BULLETPROOF FLEXBOX)                      */}
      {/* ========================================================================= */}
      {logModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[500px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-[#125ab2]" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            <div className="bg-blue-50 text-gray-800 px-5 py-4 flex justify-between items-center border-b border-blue-100 shrink-0 z-10">
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Operational Activity</p>
                <h3 className="font-black text-sm text-[#125ab2] uppercase tracking-wider">Log Department Performance</h3>
              </div>
              <button onClick={() => setLogModal(false)} className="text-gray-400 hover:text-gray-800 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <form onSubmit={handleAddLog} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 text-sm flex flex-col gap-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Department Area <span className="text-red-500">*</span></label>
                    <select 
                      value={logForm.dept} onChange={e => setLogForm({...logForm, dept: e.target.value})} 
                      className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] bg-white rounded-sm font-semibold text-gray-700 cursor-pointer"
                    >
                      <option value="Inbound / Receiving">Inbound / Receiving</option>
                      <option value="Putaway / Storing">Putaway / Storing</option>
                      <option value="Kitting / Assembly Feed">Kitting / Assembly Feed</option>
                      <option value="Outbound Shipping">Outbound Shipping</option>
                      <option value="QC / Compliance">QC / Compliance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Operational Shift <span className="text-red-500">*</span></label>
                    <select 
                      value={logForm.shift} onChange={e => setForm({...logForm, shift: e.target.value})} 
                      className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] bg-white rounded-sm font-semibold text-gray-700 cursor-pointer"
                    >
                      <option value="Morning">Morning (06:00 - 14:00)</option>
                      <option value="Swing">Swing (14:00 - 22:00)</option>
                      <option value="Night">Night (22:00 - 06:00)</option>
                    </select>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 border border-gray-200 rounded-sm">
                  <div className="mb-4">
                    <label className="block text-[10px] font-bold text-[#125ab2] uppercase tracking-wider mb-1.5">Key Metric Achieved <span className="text-red-500">*</span></label>
                    <input 
                      type="text" placeholder="e.g. 50 Chassis Frames fed to Assembly Line" 
                      value={logForm.metric} onChange={e => setLogForm({...logForm, metric: e.target.value})} 
                      className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] font-bold text-gray-900 rounded-sm" 
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#125ab2] uppercase tracking-wider mb-1.5">Performance Evaluation <span className="text-red-500">*</span></label>
                    <input 
                      type="text" placeholder="e.g. 100% On-Time Delivery" 
                      value={logForm.performance} onChange={e => setLogForm({...logForm, performance: e.target.value})} 
                      className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] font-semibold text-emerald-700 rounded-sm" 
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Supervisor Context Notes</label>
                  <textarea 
                    rows="3" placeholder="Add qualitative context or reasons for delays..." 
                    value={logForm.note} onChange={e => setLogForm({...logForm, note: e.target.value})} 
                    className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] rounded-sm resize-none"
                  ></textarea>
                </div>
              </div>
              
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 shrink-0 z-10">
                <button type="button" onClick={() => setLogModal(false)} className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm rounded-sm">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-[#125ab2] hover:bg-[#0e4487] text-white text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors rounded-sm">Save Log Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ MODAL 2: REPORT INCIDENT / EXCEPTION (BULLETPROOF FLEXBOX)             */}
      {/* ========================================================================= */}
      {excModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[450px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-red-600" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            <div className="bg-red-50 text-red-800 px-5 py-4 flex justify-between items-center border-b border-red-100 shrink-0 z-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-red-600">Operations Disruption</p>
                <h3 className="font-black text-sm uppercase tracking-wider">Report New Incident</h3>
              </div>
              <button onClick={() => setExcModal(false)} className="text-red-300 hover:text-red-800 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <form onSubmit={handleAddException} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 text-sm flex flex-col gap-5">
                <div className="w-full sm:w-1/2">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Time of Occurrence <span className="text-red-500">*</span></label>
                  <input 
                    type="time" value={excForm.time} onChange={e => setExcForm({...excForm, time: e.target.value})} 
                    className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-red-500 font-mono font-bold rounded-sm text-gray-800" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-red-700 uppercase tracking-wider mb-1.5">Disruption Description <span className="text-red-500">*</span></label>
                  <input 
                    type="text" placeholder="e.g. Automated Guided Vehicle (AGV) stalled in Zone C" 
                    value={excForm.issue} onChange={e => setExcForm({...excForm, issue: e.target.value})} 
                    className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 font-bold text-gray-900 rounded-sm transition-all" 
                    required autoFocus
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-red-700 uppercase tracking-wider mb-1.5">Operational Impact Assessment <span className="text-red-500">*</span></label>
                  <textarea 
                    rows="2" placeholder="e.g. Chassis picking delayed by 45 minutes" 
                    value={excForm.impact} onChange={e => setExcForm({...excForm, impact: e.target.value})} 
                    className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-red-500 rounded-sm resize-none font-semibold text-gray-700" 
                    required
                  ></textarea>
                </div>
              </div>
              
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 shrink-0 z-10">
                <button type="button" onClick={() => setExcModal(false)} className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm rounded-sm">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors rounded-sm">Submit Incident</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ MODAL 3: RESOLVE INCIDENT (BULLETPROOF FLEXBOX)                        */}
      {/* ========================================================================= */}
      {resolveModal.isOpen && resolveModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[500px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-emerald-500" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            <div className="bg-emerald-50 text-emerald-800 px-5 py-4 flex justify-between items-center border-b border-emerald-100 shrink-0 z-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-emerald-600">Operations Recovery</p>
                <h3 className="font-black text-sm uppercase tracking-wider">Acknowledge & Resolve Incident</h3>
              </div>
              <button onClick={() => setResolveModal({ isOpen: false, item: null })} className="text-emerald-300 hover:text-emerald-800 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <form onSubmit={handleResolveException} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0">
                <div className="bg-red-50 p-4 rounded-sm border border-red-100 mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-red-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm">Incident {resolveModal.item.id}</span>
                    <span className="text-[10px] font-bold text-red-500">{resolveModal.item.time}</span>
                  </div>
                  <p className="font-black text-red-900 text-base leading-tight mb-2">{resolveModal.item.issue}</p>
                  <div className="bg-white px-3 py-2 border border-red-200 rounded-sm">
                    <span className="text-[9px] font-bold text-red-600 uppercase tracking-wider block mb-0.5">Assessed Impact:</span>
                    <span className="text-xs font-semibold text-gray-800">{resolveModal.item.impact}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1.5">
                    Resolution Action Taken <span className="text-red-500">*</span>
                  </label>
                  <textarea 
                    rows="4" 
                    placeholder="Describe how the issue was resolved to clear this incident from the log..." 
                    value={resolveText} onChange={e => setResolveText(e.target.value)} 
                    className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-sm text-sm font-medium text-gray-800 transition-all resize-none" 
                    required autoFocus
                  ></textarea>
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-2">Note: This resolution will be permanently logged in the EOD Report.</p>
                </div>
              </div>
              
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 shrink-0 z-10">
                <button type="button" onClick={() => setResolveModal({ isOpen: false, item: null })} className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm rounded-sm">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors rounded-sm flex items-center gap-2">
                  <span>✓</span> Mark as Resolved
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default DailyLogistics;