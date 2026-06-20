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

const SafetyIncidents = () => {
  // ─── 🚀 SURGICAL INJECTION: GLOBAL CONTEXT ───
  const { bahasa, taskData, setTaskData } = useContext(AppContext);

  // Helper Date
  const getDynamicDate = (daysOffset) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
  };

  const getCurrentTime = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  // 1. DATA MASTER INCIDENTS (ARUS MOTORS HSE LOG) - Base State Statis
  const initialBaseIncidents = [
    { 
      id: 'HSE-ARS-001', date: getDynamicDate(0), time: '09:15', type: 'Near Miss', severity: 'High', location: 'Zone C (Chassis)', reporter: 'Agus (AGV Opr)', status: 'Investigating', description: 'Automated Guided Vehicle (AGV) routing error almost collided with a heavy forklift carrying steel chassis frames.',
      rca: '', preventiveAction: '', evidence: [], conversation: [{ sender: 'System', text: '[STATUS: INVESTIGATING]\nInvestigation initiated by HSE Safety Officer.' }]
    },
    { 
      id: 'HSE-ARS-002', date: getDynamicDate(-2), time: '14:30', type: 'Property Damage', severity: 'Medium', location: 'Inbound Dock Bay 1', reporter: 'Budi (Dock Master)', status: 'Resolved', description: 'Dock door structural pillar bent by reversing 3PL Vendor truck.',
      rca: 'Vendor driver ignored the docking mirror blindspot.', preventiveAction: 'Vendor penalized based on SLA matrix. Pillar reinforced by MRO Engineering. Installed proximity alarm.', evidence: [{ name: 'pillar_damage_photo.jpg', size: '2.4 MB' }], conversation: [{ sender: 'System Audit', text: '[STATUS: RESOLVED]\nRCA and Preventive Actions have been locked in the ledger.' }]
    },
    { 
      id: 'HSE-ARS-003', date: getDynamicDate(-5), time: '11:00', type: 'Minor Injury', severity: 'Low', location: 'Clean Room A', reporter: 'Joko (Technician)', status: 'Closed', description: 'Finger pinched between MCU housing plates during assembly.',
      rca: 'Lack of situational awareness during plate merging.', preventiveAction: 'First aid applied. Retraining on ergonomic pinch-point avoidance for Clean Room staff.', evidence: [], conversation: [{ sender: 'System Audit', text: '[STATUS: CLOSED]\nCase signed off by Chief HSE Officer.' }]
    },
    { 
      id: 'HSE-ARS-004', date: getDynamicDate(-1), time: '16:45', type: 'Chemical Spill', severity: 'Critical', location: 'Zone B (Cold Storage)', reporter: 'Siti (Safety Insp)', status: 'Open', description: 'LFP Battery thermal management coolant (2 Liters) leaked onto the main walkway from a punctured drum.',
      rca: '', preventiveAction: '', evidence: [], conversation: []
    },
  ];

  // ─── 🚀 SURGICAL INJECTION: DATA BINDING UNTUK LOTO INTERLOCK ───
  const [incidents, setIncidents] = useState([]);
  
  useEffect(() => {
    // A. Ambil data dari LocalStorage atau fallback ke base data
    let savedData = [];
    try {
      const saved = window.localStorage.getItem('hseData_ARUS_V2');
      savedData = saved ? JSON.parse(saved) : initialBaseIncidents;
    } catch {
      savedData = initialBaseIncidents;
    }

    // B. Cari tugas lantai (Tasks.jsx) yang butuh gembok LOTO
    const lotoTasks = (taskData || []).filter(t => t.dependency === 'Safety LOTO Sign-off' && t.isLocked);

    // C. Generate HSE ID & Inject ke data K3
    const injectedLotoIncidents = lotoTasks.map((t, idx) => {
      // Kita buat ID khusus LOTO
      const lotoId = `HSE-LOTO-${t.id.split('-').pop()}`; 
      
      // Jika LOTO ini sudah pernah disimpan di localStorage, pakai data lamanya
      const existingLoto = savedData.find(saved => saved.id === lotoId);
      if (existingLoto) return { ...existingLoto, linkedTaskId: t.id, isFloorTask: true };

      return {
        id: lotoId,
        linkedTaskId: t.id,
        date: t.createdAt ? t.createdAt.split('T')[0] : getDynamicDate(0),
        time: '00:00', // Auto generated time
        type: 'High-Voltage Arc', // Klasifikasi bahaya MRO LOTO
        severity: 'Critical', // LOTO selalu kritis
        location: t.zone,
        reporter: 'System Generated (MRO)',
        status: 'Open',
        description: `CRITICAL LOTO REQUIRED. Floor Task: "${t.desc}". Ensure main power breaker is locked out and tagged out before issuing clearance to the operator.`,
        rca: '',
        preventiveAction: '',
        evidence: [],
        conversation: [{ sender: 'System Audit', text: '[SYSTEM INTERLOCK]\nOperator access blocked. Awaiting LOTO Physical Verification & Sign-off.' }],
        isFloorTask: true
      };
    });

    // D. Gabungkan data (Tanpa duplikasi)
    const combinedData = [...savedData];
    injectedLotoIncidents.forEach(loto => {
      if (!combinedData.some(d => d.id === loto.id)) {
        combinedData.unshift(loto); // Taruh paling atas
      }
    });

    setIncidents(combinedData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskData]);

  // Simpan perubahan ke LocalStorage
  useEffect(() => {
    try {
      // Kita tidak menyimpan tiket LOTO hasil render dinamis agar tidak double saat direfresh
      const dataToSave = incidents.filter(i => !i.isFloorTask);
      window.localStorage.setItem('hseData_ARUS_V2', JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to save HSE data:', error);
    }
  }, [incidents]);

  // 2. STATE INTERAKTIF & MODALS
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [toasts, setToasts] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [incidentModal, setIncidentModal] = useState({ isOpen: false, data: null });
  
  const [form, setForm] = useState({ 
    date: new Date().toISOString().split('T')[0], time: getCurrentTime(), type: 'Near Miss', severity: 'Low', location: 'Zone A (Ambient Powertrain)', reporter: '', description: '' 
  });

  const [rcaForm, setRcaForm] = useState({ rootCause: '', preventiveAction: '' });
  const [chatInput, setChatInput] = useState('');

  // 3. FUNGSI TOAST
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // 4. FUNGSI LOG NEW INCIDENT (DENGAN SMART LOTO TRIGGER)
  const handleLogIncident = (e) => {
    e.preventDefault();
    if (!form.reporter || !form.description) {
      addToast('Reporter name and description are mandatory!', 'error');
      return;
    }

    const nextNum = incidents.length > 0 ? Math.max(...incidents.map(i => parseInt(i.id.split('-').pop()) || 0)) + 1 : 1;
    const newId = `HSE-ARS-${nextNum.toString().padStart(3, '0')}`;
    const isCriticalRisk = form.severity === 'Critical' || form.type === 'Chemical Spill' || form.type === 'High-Voltage Arc';
    
    setIncidents([{ 
      id: newId, 
      ...form, 
      status: 'Open',
      rca: '', preventiveAction: '', evidence: [], conversation: []
    }, ...incidents]);
    
    setIsModalOpen(false);
    setForm({ date: new Date().toISOString().split('T')[0], time: getCurrentTime(), type: 'Near Miss', severity: 'Low', location: 'Zone A (Ambient Powertrain)', reporter: '', description: '' });
    
    addToast('New safety incident logged. Notification sent to Floor Supervisors.', 'info');
    
    if (isCriticalRisk) {
      setTimeout(() => {
        addToast(`LOTO PROTOCOL INITIATED: ${form.location} must be locked down immediately. Evacuate non-essential personnel!`, 'error');
      }, 500);
    }
  };

  // 5. UPDATE STATUS DARI TABEL UTAMA (ACTION WORKFLOW)
  const updateStatusDirect = (id, newStatus) => {
    setIncidents(incidents.map(inc => {
      if (inc.id === id) {
        let auditLog = '';
        if (newStatus === 'Investigating') auditLog = '[STATUS: INVESTIGATING]\nInvestigation team deployed to the location.';
        else if (newStatus === 'Closed') auditLog = '[STATUS: CLOSED]\nCase verified and signed off by Management.';
        
        return { 
          ...inc, 
          status: newStatus, 
          conversation: auditLog ? [...inc.conversation, { sender: 'System Audit', text: auditLog }] : inc.conversation 
        };
      }
      return inc;
    }));
    
    if (newStatus === 'Investigating') addToast(`Investigation commenced for ${id}.`, 'warning');
    else if (newStatus === 'Closed') addToast(`HSE Audit finalized for ${id}. Case closed.`, 'success');
  };

  // 6. FUNGSI UPLOAD BUKTI (EVIDENCE)
  const handleFileUpload = (e, incidentId) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newEvidences = files.map(f => ({
      name: f.name,
      size: (f.size / 1024).toFixed(1) + ' KB'
    }));

    const fileNamesStr = newEvidences.map(f => f.name).join(', ');

    const updatedIncidents = incidents.map(inc => {
      if (inc.id === incidentId) {
        const updatedObj = { 
          ...inc, 
          evidence: [...inc.evidence, ...newEvidences],
          conversation: [...inc.conversation, { sender: 'You (Manager)', text: `Uploaded evidence files: ${fileNamesStr}` }]
        };
        setIncidentModal({ isOpen: true, data: updatedObj }); // Sync Modal state
        return updatedObj;
      }
      return inc;
    });

    setIncidents(updatedIncidents);
    addToast(`${files.length} document(s) securely attached to the incident profile.`, 'success');
    e.target.value = null; // Reset input
  };

  // 7. FUNGSI KIRIM PESAN KE AUDIT TRAIL
  const handleSendAuditNote = () => {
    if (!chatInput.trim()) return;
    const updatedIncidents = incidents.map(inc => {
      if (inc.id === incidentModal.data.id) {
        const updatedObj = { 
          ...inc, 
          conversation: [...inc.conversation, { sender: 'You (Manager)', text: chatInput }] 
        };
        setIncidentModal({ isOpen: true, data: updatedObj });
        return updatedObj;
      }
      return inc;
    });
    setIncidents(updatedIncidents);
    setChatInput('');
    addToast('Audit note recorded to the ledger.', 'success');
  };

  // 8. FUNGSI RESOLUSI DENGAN INTERLOCK RCA & 🚀 RILIS LOTO
  const handleResolveIncident = (id) => {
    const inc = incidents.find(i => i.id === id);
    
    // Jika ini adalah tiket biasa (bukan LOTO), butuh RCA
    if (!inc.isFloorTask && (!rcaForm.rootCause.trim() || !rcaForm.preventiveAction.trim())) {
      return addToast('CRITICAL: Root Cause Analysis (RCA) and Preventive Action (CAPA) are strictly required before closing an investigation.', 'error');
    }

    const resolvedAuditMessage = {
      sender: 'System Audit',
      text: inc.isFloorTask 
        ? `[STATUS: RESOLVED]\nPhysical LOTO Protocol Verified. Main breaker secured. Operator scanner unlocked.`
        : `[STATUS: RESOLVED]\nRoot Cause: ${rcaForm.rootCause}\nPreventive Action: ${rcaForm.preventiveAction}`
    };

    const updatedIncidents = incidents.map(item => {
      if (item.id === id) {
        return { 
          ...item, 
          status: 'Resolved', 
          rca: rcaForm.rootCause || 'LOTO Secured', 
          preventiveAction: rcaForm.preventiveAction || 'LOTO Tags Applied', 
          conversation: [...item.conversation, resolvedAuditMessage] 
        };
      }
      return item;
    });

    setIncidents(updatedIncidents);

    // ─── 🚀 SURGICAL INJECTION: BUKA GEMBOK LOTO DI SCANNER OPERATOR ───
    if (inc.isFloorTask) {
      setTaskData(prev => prev.map(t => t.id === inc.linkedTaskId ? {
        ...t,
        isLocked: false,
        currentStage: 'Awaiting Activation',
        notes: t.notes ? `${t.notes} | [HSE CLEARED: LOTO Secured. Safe to work]` : '[HSE CLEARED: LOTO Secured. Safe to work]'
      } : t));
      addToast(`LOTO Verified! Scanner for Operator on Task ${inc.linkedTaskId} is now UNLOCKED.`, 'success');
    } else {
      addToast(`Incident ${id} marked as RESOLVED. RCA locked securely.`, 'success');
    }
    
    setRcaForm({ rootCause: '', preventiveAction: '' });
    setIncidentModal({ isOpen: false, data: null });
  };


  // 9. FUNGSI DOWNLOAD INCIDENT REPORT
  const handleDownloadReport = (inc) => {
    addToast(`Generating ISO 45001 Compliant Audit Report for ${inc.id}...`, 'info');
    
    const isLOTO = inc.severity === 'Critical' || inc.type === 'Chemical Spill' || inc.type === 'High-Voltage Arc';
    const lotoWarning = isLOTO ? '\n[!!!] CRITICAL: LOTO (LOCKOUT/TAGOUT) PROTOCOL WAS MANDATED FOR THIS INCIDENT [!!!]\n' : '';

    const evidenceList = inc.evidence.length > 0 
      ? inc.evidence.map(e => ` - ${e.name} (${e.size})`).join('\n')
      : ' None Attached.';

    const reportContent = `
============================================================
ARUS MOTORS GIGAFACTORY - OFFICIAL HSE INCIDENT REPORT (BAP)
============================================================
DOCUMENT ID   : ${inc.id}
DATE & TIME   : ${inc.date} | ${inc.time}
LOCATION      : ${inc.location}
FACILITY      : ARUS Main Assembly Plant
------------------------------------------------------------
INCIDENT CLASSIFICATION : ${inc.type.toUpperCase()}
SEVERITY LEVEL          : ${inc.severity.toUpperCase()}
REPORTED BY             : ${inc.reporter}
CURRENT STATUS          : ${inc.status.toUpperCase()}
------------------------------------------------------------${lotoWarning}
INCIDENT CHRONOLOGY / DETAILED DESCRIPTION:
"${inc.description}"

ROOT CAUSE ANALYSIS (RCA):
"${inc.rca || 'Pending Investigation'}"

PREVENTIVE ACTIONS (CAPA) TAKEN:
"${inc.preventiveAction || 'Pending Investigation'}"

ATTACHED EVIDENCE DOCUMENTS:
${evidenceList}

------------------------------------------------------------
HSE COMPLIANCE CHECKLIST:
[X] Floor Supervisor Notified
[${inc.status === 'Resolved' || inc.status === 'Closed' ? 'X' : ' '}] Root Cause Analysis (RCA) Completed
[${inc.status === 'Closed' ? 'X' : ' '}] Final Sign-Off by Management

============================================================
Authorized by : Chief HSE Officer, ARUS Motors
Generated on  : ${new Date().toLocaleString()}
* This document is strictly confidential and serves as 
  official documentation for ISO 45001 Audit purposes.
============================================================
`;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `ARUS_HSE_Audit_${inc.id}.txt`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => addToast('HSE Audit Report downloaded successfully!', 'success'), 800);
  };

  // 10. FUNGSI EXPORT CSV LOG
  const handleExportCSV = () => {
    addToast('Compiling HSE Telemetry Data...', 'info');
    const headers = ['HSE_ID', 'Date', 'Time', 'Classification', 'Severity', 'Location', 'Reporter', 'Status', 'Description', 'Root_Cause'];
    const csvRows = [headers.join(',')];
    
    filteredData.forEach(inc => {
      const row = [inc.id, inc.date, inc.time, inc.type, inc.severity, `"${inc.location}"`, `"${inc.reporter}"`, inc.status, `"${inc.description}"`, `"${inc.rca}"`];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `ARUS_HSE_Telemetry_${getDynamicDate(0)}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => addToast('HSE Telemetry exported successfully!', 'success'), 800);
  };

  // 11. SEARCH & FILTER ENGINE
  const filteredData = useMemo(() => {
    return incidents.filter(r => {
      const matchesSearch = r.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            r.location.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            r.reporter.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (r.linkedTaskId && r.linkedTaskId.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = filterStatus === 'ALL' ? true : r.status.toUpperCase() === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [incidents, filterStatus, searchTerm]);

  // GLOBAL METRICS
  const activeCases = incidents.filter(r => r.status === 'Open' || r.status === 'Investigating').length;
  const criticalCases = incidents.filter(r => r.severity === 'Critical' || r.severity === 'High').length;
  const daysSinceLTI = 14; 

  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 animate-fade-in">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>🛡️ Compliance</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Safety Ops</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide">
            {bahasa === 'en' ? 'Health, Safety & Environment (HSE)' : 'Kesehatan, Keselamatan & Lingkungan (K3)'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">Track hazards, investigate incidents, and enforce RCA interlocks across the Gigafactory.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button onClick={handleExportCSV} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2.5 rounded-sm text-xs font-bold transition-colors shadow-sm uppercase tracking-wider flex items-center justify-center gap-2 w-full md:w-auto">
            <span>⭳</span> Export HSE Log
          </button>
          <button onClick={() => setIsModalOpen(true)} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-sm text-xs font-bold transition-colors shadow-sm uppercase tracking-wider flex items-center justify-center gap-2 w-full md:w-auto">
            <span>⚠</span> Report Incident
          </button>
        </div>
      </div>

      {/* ── METRICS SUMMARY ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
        <div className="bg-white p-5 border border-gray-200 shadow-sm rounded-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Total HSE Reports</p>
          <p className="text-3xl font-black text-gray-900 mt-1 font-mono">{incidents.length}</p>
          <p className="text-[9px] font-bold text-gray-400 mt-2 uppercase tracking-wider">YTD Recorded Incidents</p>
        </div>
        
        <div className="bg-white p-5 border-l-4 border-l-amber-500 border border-y-gray-200 border-r-gray-200 shadow-sm rounded-sm relative overflow-hidden hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">Active Investigations</p>
          <p className="text-3xl font-black text-gray-800 mt-1">{activeCases}</p>
          <p className={`text-[9px] font-bold mt-2 uppercase tracking-wider ${activeCases > 0 ? 'text-amber-600 animate-pulse' : 'text-gray-400'}`}>
            {activeCases > 0 ? 'Requires RCA Completion' : 'All clear'}
          </p>
        </div>
        
        <div className="bg-white p-5 border-l-4 border-l-red-600 border border-y-gray-200 border-r-gray-200 shadow-sm rounded-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-red-600 tracking-wider">Critical / High Severity</p>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-3xl font-black text-red-700">{criticalCases}</p>
            {criticalCases > 0 && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border border-red-200">LOTO Risk</span>}
          </div>
          <p className="text-[9px] font-bold text-red-500 mt-2 uppercase tracking-wider">Threat to life/property</p>
        </div>
        
        <div className="bg-white p-5 border-l-4 border-l-emerald-500 border border-y-gray-200 border-r-gray-200 shadow-sm rounded-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Days Since Last LTI</p>
          <p className="text-3xl font-black text-[#125ab2] mt-1 font-mono">{daysSinceLTI} <span className="text-sm font-bold text-gray-400">Days</span></p>
          <p className="text-[9px] font-bold text-emerald-600 mt-2 uppercase tracking-wider">Lost Time Injury Free</p>
        </div>
      </div>

      {/* ── TOOLBAR (SEARCH & FILTER) ── */}
      <div className="bg-white p-3 border border-gray-300 shadow-sm rounded-sm mb-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {['ALL', 'OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED'].map(stat => (
            <button 
              key={stat} 
              onClick={() => setFilterStatus(stat)} 
              className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm border transition-colors shadow-sm ${filterStatus === stat ? 'bg-[#415a77] text-white border-[#415a77]' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-300'}`}
            >
              {stat}
            </button>
          ))}
        </div>
        <input 
          type="text" 
          placeholder="Search Location, ID, or Linked Task..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 px-4 py-1.5 rounded-sm text-sm font-semibold outline-none focus:border-[#125ab2] w-full sm:w-80 transition-colors"
        />
      </div>

      {/* ── TABEL DATA INSIDEN ── */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
        <div className="bg-slate-50 border-b border-gray-200 p-4 flex justify-between items-center">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">HSE Active Investigation Log</h3>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
            <thead className="bg-[#f8f9fa] text-[#64748b] text-[10px] uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3 px-5 font-bold border-b w-44">INCIDENT ID & TIME</th>
                <th className="py-3 px-5 font-bold border-b text-[#125ab2]">LINKED FLOOR TASK</th>
                <th className="py-3 px-5 font-bold border-b">CLASSIFICATION</th>
                <th className="py-3 px-5 font-bold border-b w-64">LOCATION & REPORTER</th>
                <th className="py-3 px-5 font-bold border-b text-center">SEVERITY</th>
                <th className="py-3 px-5 font-bold border-b text-center">STATUS</th>
                <th className="py-3 px-5 font-bold border-b text-center w-40">WORKFLOW ACTION</th>
              </tr>
            </thead>
            <tbody className="text-[12px] text-gray-700">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-500 font-bold italic">
                    <span className="text-3xl block mb-2 opacity-50">🛡️</span>
                    No incident records found. Target zero accidents maintained!
                  </td>
                </tr>
              ) : (
                filteredData.map((inc, idx) => {
                  const isLOTO = inc.severity === 'Critical' || inc.type === 'Chemical Spill' || inc.type === 'High-Voltage Arc';
                  
                  return (
                    <tr key={idx} className={`border-b border-gray-100 transition-colors ${
                      inc.status === 'Closed' ? 'bg-gray-50 opacity-60 grayscale' : 
                      isLOTO && (inc.status === 'Open' || inc.status === 'Investigating') ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-blue-50/40'
                    }`}>
                      <td className="py-4 px-5">
                        <div 
                          className="font-mono font-black text-[#125ab2] cursor-pointer hover:underline text-[13px] flex items-center gap-1.5 w-max"
                          onClick={() => {
                            setIncidentModal({ isOpen: true, data: inc });
                            setRcaForm({ rootCause: inc.rca || '', preventiveAction: inc.preventiveAction || '' });
                          }}
                          title="Open HSE Audit Profile"
                        >
                          <span className="text-base">📋</span> {inc.id}
                        </div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">{inc.date} | {inc.time}</div>
                      </td>

                      {/* 🚀 INJEKSI LINKED TASK ID (HSE & LOTO) */}
                      <td className="py-4 px-5">
                        {inc.linkedTaskId ? (
                          <div className="bg-white border border-[#125ab2]/40 text-[#125ab2] font-mono font-black px-2.5 py-1.5 rounded-sm inline-block text-[11px] shadow-sm cursor-help hover:bg-blue-50 transition-colors">
                            🔗 {inc.linkedTaskId}
                          </div>
                        ) : (
                          <span className="text-gray-300 font-bold">—</span>
                        )}
                      </td>

                      <td className="py-4 px-5">
                        <div className="font-bold text-gray-900">{inc.type}</div>
                        {isLOTO && <div className="text-[8px] bg-red-600 text-white font-black uppercase px-1.5 py-0.5 rounded-sm inline-block mt-1 animate-pulse tracking-widest shadow-sm">LOTO RISK</div>}
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-bold text-gray-800">{inc.location}</div>
                        <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-semibold">By: <span className="font-black text-gray-700">{inc.reporter}</span></div>
                      </td>
                      <td className="py-4 px-5 text-center">
                        <span className={`px-2 py-0.5 rounded-sm border text-[9px] font-black uppercase tracking-wider shadow-sm ${
                          inc.severity === 'Critical' ? 'bg-red-600 text-white border-red-700' :
                          inc.severity === 'High' ? 'bg-orange-500 text-white border-orange-600' :
                          inc.severity === 'Medium' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                          'bg-gray-100 text-gray-600 border-gray-300'
                        }`}>
                          {inc.severity}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-center">
                        <span className={`px-2.5 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                          inc.status === 'Open' ? 'bg-red-600 text-white border-red-700 animate-pulse' :
                          inc.status === 'Investigating' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                          inc.status === 'Resolved' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                          'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}>
                          {inc.status}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-center">
                        {inc.status === 'Open' && (
                          <button onClick={() => updateStatusDirect(inc.id, 'Investigating')} className="bg-amber-500 text-white px-3 py-2 rounded-sm font-bold text-[9px] uppercase tracking-wider shadow-sm hover:bg-amber-600 w-full transition-colors">Start Investigate</button>
                        )}
                        {inc.status === 'Investigating' && (
                          <button onClick={() => {
                            setIncidentModal({ isOpen: true, data: inc });
                            setRcaForm({ rootCause: inc.rca || '', preventiveAction: inc.preventiveAction || '' });
                          }} className="bg-[#125ab2] text-white px-3 py-2 rounded-sm font-bold text-[9px] uppercase tracking-wider shadow-sm hover:bg-[#0e4487] w-full transition-colors flex items-center justify-center gap-1.5">
                            <span>🔒</span> Fill RCA
                          </button>
                        )}
                        {inc.status === 'Resolved' && (
                          <button onClick={() => updateStatusDirect(inc.id, 'Closed')} className="bg-emerald-600 text-white px-3 py-2 rounded-sm font-bold text-[9px] uppercase tracking-wider shadow-sm hover:bg-emerald-700 w-full transition-colors">Sign & Close</button>
                        )}
                        {inc.status === 'Closed' && (
                          <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">— ARCHIVED —</span>
                        )}
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
      {/* 🛡️ MODAL 1: REPORT INCIDENT FORM                                          */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[600px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-red-600" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            <div className="bg-red-50 border-b border-red-100 text-gray-800 px-6 py-4 flex justify-between items-center shrink-0 z-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-red-600">Compliance & Safety Ops</p>
                <h3 className="font-black text-sm uppercase tracking-wider text-red-800">Report Health & Safety Incident</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-red-400 hover:text-red-800 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <form onSubmit={handleLogIncident} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 text-sm flex flex-col gap-4">
                
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-sm flex items-start gap-2 mb-2 text-amber-900 text-[11px] font-semibold leading-relaxed">
                  <span className="text-base leading-none">⚠️</span>
                  <p><strong>Auto-LOTO Interlock:</strong> Designating the severity as 'Critical' or the type as 'Chemical/High-Voltage' will automatically trigger a factory-wide Lockout/Tagout recommendation for the affected zone.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Date Occurred <span className="text-red-500">*</span></label>
                    <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-red-500 font-mono text-xs font-bold text-gray-800 rounded-sm cursor-pointer" required/>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Time Occurred <span className="text-red-500">*</span></label>
                    <input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-red-500 font-mono text-xs font-bold text-gray-800 rounded-sm cursor-pointer" required/>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Incident Type <span className="text-red-500">*</span></label>
                    <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-red-500 font-bold text-gray-700 bg-white rounded-sm cursor-pointer">
                      <option>Near Miss</option>
                      <option>Minor Injury</option>
                      <option>Major Accident</option>
                      <option>Hazard Report</option>
                      <option>Property Damage</option>
                      <option>Chemical Spill</option>
                      <option>High-Voltage Arc</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Severity Level <span className="text-red-500">*</span></label>
                    <select value={form.severity} onChange={e => setForm({...form, severity: e.target.value})} className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-red-500 font-black text-gray-800 bg-white rounded-sm cursor-pointer">
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Exact Location <span className="text-red-500">*</span></label>
                    <select value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-red-500 font-semibold text-gray-800 bg-white rounded-sm cursor-pointer">
                      <option>Zone A (Ambient Powertrain)</option>
                      <option>Zone B (Cold Storage)</option>
                      <option>Zone C (Chassis)</option>
                      <option>Clean Room A</option>
                      <option>Inbound Dock Bay 1</option>
                      <option>Outbound Dispatch</option>
                      <option>Main Office</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Reported By <span className="text-red-500">*</span></label>
                    <input type="text" placeholder="Name (Role)" value={form.reporter} onChange={e => setForm({...form, reporter: e.target.value})} className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-red-500 font-semibold rounded-sm" required/>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Incident Chronology / Description <span className="text-red-500">*</span></label>
                  <textarea rows="4" placeholder="Describe the sequence of events clearly..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-red-500 rounded-sm resize-none text-xs font-medium" required></textarea>
                </div>
              </div>
              
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 shrink-0 z-10">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm rounded-sm">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors rounded-sm flex items-center gap-2">
                  <span>⚠</span> Broadcast Incident Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ MODAL 2: DETAIL INSIDEN, AUDIT TRAIL, EVIDENCE, RCA INTERLOCK        */}
      {/* ========================================================================= */}
      {incidentModal.isOpen && incidentModal.data && (() => {
        const inc = incidentModal.data;
        const isLOTO = inc.severity === 'Critical' || inc.type === 'Chemical Spill' || inc.type === 'High-Voltage Arc';
        const isResolvedOrClosed = inc.status === 'Resolved' || inc.status === 'Closed';

        return (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 sm:p-6 overflow-hidden">
            <div className="bg-white rounded-sm w-full max-w-[650px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-red-700" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
              
              {/* MODAL HEADER */}
              <div className="bg-red-50 border-b border-red-100 px-6 py-4 flex justify-between items-start shrink-0 z-10">
                <div>
                  <h3 className="font-black text-xl text-red-700 font-mono leading-none">{inc.id}</h3>
                  <p className="text-[10px] font-bold text-gray-500 uppercase mt-1.5 tracking-widest">Official HSE Investigation Profile</p>
                </div>
                <div className="text-right">
                  <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-sm border shadow-sm block mb-1.5 ${
                    inc.status === 'Open' ? 'bg-red-600 text-white border-red-700 animate-pulse' :
                    inc.status === 'Investigating' ? 'bg-amber-500 text-white border-amber-600' :
                    inc.status === 'Resolved' ? 'bg-[#125ab2] text-white border-blue-800' :
                    'bg-emerald-500 text-white border-emerald-600'
                  }`}>
                    Status: {inc.status}
                  </span>
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{inc.date}</div>
                </div>
              </div>

              {/* MODAL BODY (SCROLLABLE) */}
              <div className="p-0 flex flex-col flex-1 overflow-hidden">
                <div className="overflow-y-auto flex-1 custom-scrollbar z-0 p-6 space-y-6 text-sm text-gray-800">
                  
                  {isLOTO && (
                    <div className="bg-red-600 text-white p-3 rounded-sm text-xs font-bold flex flex-col shadow-sm">
                      <div className="flex justify-between items-center animate-pulse mb-1">
                        <span>MANDATORY LOCKOUT/TAGOUT PROTOCOL ACTIVE</span>
                        <span className="text-lg leading-none">⚠️</span>
                      </div>
                      {/* 🚀 INDIKATOR INTERLOCK LOTO DI DALAM MODAL */}
                      {inc.linkedTaskId && (
                         <div className="bg-red-900/50 px-2 py-1.5 mt-2 rounded border border-red-400 text-[10px] font-mono tracking-wider">
                           [SYSTEM] Task <span className="font-black text-white">{inc.linkedTaskId}</span> is currently blocked. Completing this LOTO profile will unlock the operator's scanner.
                         </div>
                      )}
                    </div>
                  )}

                  {/* INFO GRID */}
                  <div className="grid grid-cols-2 gap-4 border-b border-gray-200 pb-5">
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Classification & Severity</p>
                      <p className="font-bold text-gray-900">{inc.type}</p>
                      <p className={`font-black uppercase text-[10px] mt-0.5 tracking-wider ${
                        inc.severity === 'Critical' ? 'text-red-600' : inc.severity === 'High' ? 'text-orange-500' : 'text-amber-600'
                      }`}>{inc.severity} Priority</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Location & Reporter</p>
                      <p className="font-bold text-gray-900">{inc.location}</p>
                      <p className="text-[10px] font-semibold text-gray-500 mt-0.5">By: {inc.reporter}</p>
                    </div>
                  </div>

                  {/* CHRONOLOGY */}
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-sm shadow-inner">
                    <p className="text-[9px] font-bold text-[#125ab2] uppercase tracking-wider mb-2">Chronology of Events</p>
                    <p className="text-gray-700 leading-relaxed text-[13px] italic border-l-2 border-gray-300 pl-2">"{inc.description}"</p>
                  </div>

                  {/* EVIDENCE VAULT */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-gray-200 pb-1.5">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Evidence & Documents Vault</p>
                      {!isResolvedOrClosed && (
                        <label className="cursor-pointer text-[9px] bg-blue-50 text-[#125ab2] border border-blue-200 px-2 py-1 rounded font-black uppercase tracking-wider hover:bg-blue-100 transition-colors">
                          + Upload Evidence
                          <input type="file" multiple className="hidden" onChange={(e) => handleFileUpload(e, inc.id)} />
                        </label>
                      )}
                    </div>
                    
                    {inc.evidence && inc.evidence.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {inc.evidence.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 border border-gray-200 rounded-sm bg-gray-50">
                            <span className="text-lg text-gray-400">📄</span>
                            <div className="flex-1 overflow-hidden">
                              <p className="text-[10px] font-bold text-gray-800 truncate" title={file.name}>{file.name}</p>
                              <p className="text-[9px] text-gray-500 font-mono">{file.size}</p>
                            </div>
                            <span className="text-[9px] font-bold text-[#125ab2] cursor-pointer hover:underline">View</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-200 p-4 rounded-sm text-center bg-gray-50">
                        <span className="text-xl opacity-30 block mb-1">📷</span>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">No evidence attached yet.</p>
                      </div>
                    )}
                  </div>

                  {/* IMMUTABLE AUDIT TRAIL */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 pb-1.5">Audit Trail & Investigation Feed</p>
                    <div className="space-y-3 max-h-[160px] overflow-y-auto border border-gray-200 p-3 bg-white rounded-sm shadow-inner">
                      {inc.conversation && inc.conversation.map((c, idx) => (
                        <div key={idx} className={`p-3 rounded-sm text-xs border shadow-sm ${
                          c.sender.includes('You') ? 'bg-blue-50 border-blue-100 ml-6' : 
                          c.sender.includes('System') ? 'bg-amber-50 border-amber-200 mx-3' : 
                          'bg-gray-50 border-gray-100 mr-6'
                        }`}>
                          <span className={`font-black text-[10px] uppercase tracking-wider block mb-1.5 border-b pb-1 ${
                            c.sender.includes('You') ? 'text-[#125ab2] border-blue-100' : 
                            c.sender.includes('System') ? 'text-amber-800 border-amber-200' : 
                            'text-gray-600 border-gray-200'
                          }`}>{c.sender}</span> 
                          <span className={`font-medium leading-relaxed whitespace-pre-wrap ${c.sender.includes('System') ? 'text-amber-900 font-bold' : 'text-gray-800'}`}>{c.text}</span>
                        </div>
                      ))}
                      {(!inc.conversation || inc.conversation.length === 0) && <p className="text-gray-400 italic text-xs font-semibold text-center py-4">No audit logs recorded yet.</p>}
                    </div>
                  </div>

                  {/* 🚀 RCA & CAPA (Atau Otorisasi LOTO) */}
                  {!isResolvedOrClosed && inc.status === 'Investigating' && (
                    <div className="bg-amber-50 border border-amber-300 p-5 rounded-sm shadow-inner mt-4">
                      
                      {inc.isFloorTask ? (
                         <div className="text-center py-2">
                           <p className="text-[10px] font-black text-amber-800 uppercase tracking-wider mb-2">LOTO Verification Required</p>
                           <p className="text-xs text-amber-900 font-semibold">Please physically verify that the main power is locked. By resolving this, you authorize the Floor Operator to commence work.</p>
                         </div>
                      ) : (
                        <>
                          <p className="text-[10px] font-black text-amber-800 uppercase tracking-wider mb-3 border-b border-amber-200 pb-2">Mandatory Closure Criteria (CAPA)</p>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1.5">Root Cause Analysis (RCA) <span className="text-red-500">*</span></label>
                              <textarea 
                                value={rcaForm.rootCause} 
                                onChange={(e) => setRcaForm({...rcaForm, rootCause: e.target.value})} 
                                placeholder="Detail the fundamental reason for this safety failure..." 
                                className="w-full border border-amber-300 p-2.5 text-xs font-semibold rounded-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white resize-none" 
                                rows="2"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1.5">Preventive Action (CAPA) <span className="text-red-500">*</span></label>
                              <textarea 
                                value={rcaForm.preventiveAction} 
                                onChange={(e) => setRcaForm({...rcaForm, preventiveAction: e.target.value})} 
                                placeholder="Steps taken to ensure this does not happen again..." 
                                className="w-full border border-amber-300 p-2.5 text-xs font-semibold rounded-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white resize-none" 
                                rows="2"
                              />
                            </div>
                          </div>
                        </>
                      )}

                    </div>
                  )}

                  {/* TAMPILAN JIKA SUDAH RESOLVED/CLOSED (READ ONLY RCA) */}
                  {isResolvedOrClosed && (
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-sm">
                      <p className="text-[9px] font-bold text-[#125ab2] uppercase tracking-wider mb-2">{inc.isFloorTask ? 'LOTO Otorisasi Sukses' : 'Final Corrective Action (CAPA) & RCA'}</p>
                      <div className="space-y-2 text-[12px]">
                        <p><strong className="text-[#125ab2]">{inc.isFloorTask ? 'Action' : 'Root Cause'}:</strong> <span className="text-gray-700">{inc.rca}</span></p>
                        <p><strong className="text-[#125ab2]">{inc.isFloorTask ? 'Status' : 'Prevention'}:</strong> <span className="text-gray-700">{inc.preventiveAction}</span></p>
                      </div>
                    </div>
                  )}

                </div>

                {/* Chat Input Area (Fixed Bottom of Content) */}
                <div className="p-4 bg-white border-t border-gray-200 shrink-0">
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      value={chatInput} 
                      onChange={(e) => setChatInput(e.target.value)} 
                      placeholder="Add investigation notes or evidence descriptions..." 
                      className="flex-1 border border-gray-300 p-2.5 text-xs font-bold rounded-sm outline-none focus:border-[#125ab2] focus:ring-1 focus:ring-[#125ab2] transition-all"
                      onKeyDown={(e) => { if(e.key === 'Enter') handleSendAuditNote(); }}
                      disabled={isResolvedOrClosed}
                    />
                    <button 
                      onClick={handleSendAuditNote} 
                      disabled={isResolvedOrClosed}
                      className={`text-[10px] font-black uppercase tracking-wider px-5 py-2.5 rounded-sm shadow-sm transition-colors ${isResolvedOrClosed ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-800 hover:bg-black text-white'}`}
                    >
                      Post Note
                    </button>
                  </div>
                </div>

                {/* MODAL CONTROLS */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center shrink-0 z-10">
                  <button 
                    onClick={() => handleDownloadReport(inc)} 
                    className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-[#125ab2] text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm rounded-sm flex items-center gap-2"
                  >
                    <span>⭳</span> Print BAP
                  </button>
                  
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button onClick={() => {
                      setIncidentModal({ isOpen: false, data: null });
                      setRcaForm({ rootCause: '', preventiveAction: '' });
                    }} className="flex-1 sm:flex-none px-5 py-2.5 text-[10px] font-bold bg-white border border-gray-300 text-gray-700 uppercase tracking-wider rounded-sm hover:bg-gray-100 transition-colors shadow-sm">
                      {isResolvedOrClosed ? 'Close Profile' : 'Cancel'}
                    </button>
                    
                    {!isResolvedOrClosed && inc.status === 'Investigating' && (
                      <button onClick={() => handleResolveIncident(inc.id)} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-sm shadow-sm transition-colors flex justify-center items-center gap-1.5">
                        {inc.isFloorTask ? <span>🔓 Verify LOTO & Unlock Floor</span> : <span>🔒 Verify RCA & Resolve</span>}
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      })()}

    </main>
  );
};

export default SafetyIncidents;