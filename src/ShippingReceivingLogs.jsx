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

const ShippingReceivingLogs = () => {
  const { bahasa } = useContext(AppContext);

  // Helper untuk generate tanggal dinamis
  const getDynamicDate = (daysOffset) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
  };

  const getDynamicTime = () => {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // 1. DATA MASTER LOG TRANSAKSI (ARUS MOTORS)
  const initialLogs = [
    { id: 'RCV-ARS-081', type: 'INBOUND', date: getDynamicDate(0), time: '08:30 AM', reference: 'PO-2026-104', entity: 'Contemporary Amperex Tech (CATL)', carrier: 'Maersk Logistics', vehicle: 'B 9012 XYZ', driver: 'Budi S.', items: 1250, pallets: 12, status: 'Completed', note: 'All LFP Battery cells received intact. Strict HAZMAT handling applied.', isHazmat: true },
    { id: 'RCV-ARS-082', type: 'INBOUND', date: getDynamicDate(0), time: '10:15 AM', reference: 'PO-2026-105', entity: 'Bosch Automotive', carrier: 'FedEx Freight', vehicle: 'D 8812 BB', driver: 'Agus T.', items: 500, pallets: 5, status: 'Completed', note: 'MCU Gen 3 units safely unloaded.', isHazmat: false },
    { id: 'RCV-ARS-083', type: 'INBOUND', date: getDynamicDate(0), time: '01:45 PM', reference: 'PO-2026-106', entity: 'Krakatau Steel', carrier: 'Internal Fleet', vehicle: 'B 1122 AA', driver: 'Joko M.', items: 45, pallets: 0, status: 'Exception', note: '2 chassis frames rejected due to visible structural dent during transit.', isHazmat: false },
    { id: 'SHP-ARS-101', type: 'OUTBOUND', date: getDynamicDate(0), time: '09:00 AM', reference: 'SO-992-JKT', entity: 'ARUS Dealer - South JKT', carrier: 'ARUS Car Carrier', vehicle: 'B 3344 CC', driver: 'Hendra G.', items: 8, pallets: 0, status: 'Shipped', note: 'Finished vehicles dispatched on time.', isHazmat: false },
    { id: 'SHP-ARS-102', type: 'OUTBOUND', date: getDynamicDate(0), time: '11:30 AM', reference: 'RMA-993-RTR', entity: 'Aptiv Wiring Sys', carrier: 'DHL Supply', vehicle: 'B 7766 DD', driver: 'Rahmat', items: 120, pallets: 2, status: 'Shipped', note: 'Defective harness cables returned to vendor.', isHazmat: false },
    { id: 'SHP-ARS-103', type: 'OUTBOUND', date: getDynamicDate(0), time: '03:00 PM', reference: 'SO-994-SBY', entity: 'ARUS Dealer - Surabaya', carrier: 'Siba Surya', vehicle: 'H 9988 EE', driver: 'Supri', items: 12, pallets: 0, status: 'Delayed', note: 'Waiting for RORO carrier arrival at dock 4.', isHazmat: false },
  ];

  const [logs, setLogs] = useState(() => {
    try {
      const saved = window.localStorage.getItem('shippingReceivingLogs_ARUS');
      return saved ? JSON.parse(saved) : initialLogs;
    } catch {
      return initialLogs;
    }
  });

  // ─── PEMBERSIH DATA PIZZA ───
  useEffect(() => {
    const hasPizza = logs.some(log => log.entity.includes('DoughPro') || log.entity.includes('MeatPackers') || log.id.includes('2606'));
    if (hasPizza) setLogs(initialLogs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('shippingReceivingLogs_ARUS', JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to save logs data:', error);
    }
  }, [logs]);

  // 2. STATE INTERAKTIF UTAMA
  const [activeTab, setActiveTab] = useState('INBOUND'); // 'INBOUND' | 'OUTBOUND'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [toasts, setToasts] = useState([]);
  
  // Modals
  const [manifestModal, setManifestModal] = useState({ isOpen: false, data: null });
  const [addLogModal, setAddLogModal] = useState(false);

  // Form State untuk Add Log
  const [form, setForm] = useState({
    type: 'INBOUND', reference: '', entity: '', carrier: '', vehicle: '', driver: '', items: '', pallets: '', status: 'Completed', note: ''
  });

  // 3. FUNGSI TOAST
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // 4. ENGINE FILTER DATA
  const processedLogs = useMemo(() => {
    return logs.filter(log => {
      const isTabMatch = log.type === activeTab;
      const isSearchMatch = log.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            log.reference.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            log.carrier.toLowerCase().includes(searchTerm.toLowerCase());
      const isStatusMatch = filterStatus === 'ALL' ? true : log.status === filterStatus;
      
      return isTabMatch && isSearchMatch && isStatusMatch;
    });
  }, [logs, activeTab, searchTerm, filterStatus]);

  // 5. METRIK DINAMIS (Berdasarkan Tab Aktif)
  const totalItems = processedLogs.reduce((sum, log) => sum + parseInt(log.items || 0), 0);
  const totalPallets = processedLogs.reduce((sum, log) => sum + parseInt(log.pallets || 0), 0);
  const exceptionCount = processedLogs.filter(log => log.status === 'Exception' || log.status === 'Delayed').length;

  // 6. FUNGSI SIMPAN LOG BARU DENGAN HAZMAT DETECTION
  const handleSaveLog = (e) => {
    e.preventDefault();
    if (!form.reference || !form.entity || !form.items) {
      addToast('Reference, Entity, and Item Qty are mandatory!', 'error');
      return;
    }

    // Auto-Hazmat Detection Logic
    const isHazmatDetected = 
      form.note.toLowerCase().includes('battery') || 
      form.note.toLowerCase().includes('chemical') || 
      form.note.toLowerCase().includes('coolant') ||
      form.entity.toLowerCase().includes('catL');

    const prefix = form.type === 'INBOUND' ? 'RCV' : 'SHP';
    const nextNum = logs.filter(l => l.type === form.type).length + 1;
    const newId = `${prefix}-ARS-${nextNum.toString().padStart(3, '0')}`;

    const newEntry = {
      id: newId,
      type: form.type,
      date: getDynamicDate(0),
      time: getDynamicTime(),
      reference: form.reference.toUpperCase(),
      entity: form.entity,
      carrier: form.carrier || 'Internal Fleet',
      vehicle: form.vehicle.toUpperCase(),
      driver: form.driver,
      items: parseInt(form.items),
      pallets: parseInt(form.pallets || 0),
      status: form.status,
      note: form.note || '-',
      isHazmat: isHazmatDetected
    };

    setLogs([newEntry, ...logs]);
    setAddLogModal(false);
    addToast(`${form.type} Transaction ${newId} logged successfully!`, 'success');
    if (isHazmatDetected) {
      setTimeout(() => addToast('HAZMAT Protocols automatically engaged based on entry notes.', 'info'), 500);
    }

    // Reset Form
    setForm({ type: activeTab, reference: '', entity: '', carrier: '', vehicle: '', driver: '', items: '', pallets: '', status: 'Completed', note: '' });
  };

  // 7. FUNGSI EXPORT CSV
  const handleExportCSV = () => {
    addToast(`Exporting ${activeTab} Ledger...`, 'info');
    const headers = ['Log ID', 'Date', 'Time', 'Reference', 'Entity/Partner', 'Carrier', 'Vehicle Plat', 'Total Units', 'Pallets', 'Status', 'HAZMAT', 'Notes'];
    const csvRows = [headers.join(',')];
    
    processedLogs.forEach(log => {
      const row = [log.id, log.date, log.time, log.reference, `"${log.entity}"`, `"${log.carrier}"`, log.vehicle, log.items, log.pallets, log.status, log.isHazmat ? 'YES' : 'NO', `"${log.note}"`];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `ARUS_${activeTab}_Ledger_${getDynamicDate(0)}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => addToast('Ledger exported successfully!', 'success'), 800);
  };

  // 8. FUNGSI DOWNLOAD SURAT JALAN / MANIFEST (.TXT)
  const handlePrintManifest = (log) => {
    addToast(`Generating Proof of Document for ${log.id}...`, 'info');
    
    const isOutbound = log.type === 'OUTBOUND';
    const docTitle = isOutbound ? 'DISPATCH MANIFEST (GATEPASS)' : 'RECEIVING LOG (GOODS RECEIPT)';
    const hazmatWarning = log.isHazmat ? '\n!!! WARNING: CONTAINS HAZARDOUS MATERIALS. FOLLOW SAFETY PROTOCOLS !!!\n' : '';

    const content = `
==================================================
ARUS MOTORS GIGAFACTORY - ${docTitle}
==================================================
LOG ID        : ${log.id}
Date & Time   : ${log.date} | ${log.time}
Status        : ${log.status.toUpperCase()} ${hazmatWarning}
--------------------------------------------------
[ ${isOutbound ? 'CONSIGNEE / DESTINATION' : 'VENDOR / SOURCE'} ]
Entity Name   : ${log.entity}
Reference No. : ${log.reference}

[ LOGISTICS & FLEET DETAILS ]
Carrier/Exp.  : ${log.carrier}
Vehicle Plat  : ${log.vehicle}
Driver Name   : ${log.driver}

[ CARGO SUMMARY ]
Total Items   : ${log.items} Units
Total Pallets : ${log.pallets} Pallets
Notes/Remarks : ${log.note}
--------------------------------------------------
AUTHORIZED BY : ZENTRYX DOCK MANAGER
SIGNATURE     : _______________________
TIMESTAMP     : ${new Date().toISOString()}
==================================================
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `Gatepass_${log.id}.txt`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => addToast('Manifest document generated successfully!', 'success'), 800);
  };

  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 animate-fade-in">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER & TOOLBAR ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>📝 Reports</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Logistics</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide">
            {bahasa === 'en' ? 'Shipping & Receiving Logs' : 'Log Pengiriman & Penerimaan'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">Real-time uneditable ledger for all inbound and outbound dock movements.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => {
              setForm(prev => ({ ...prev, type: activeTab }));
              setAddLogModal(true);
            }} 
            className="bg-white border border-[#125ab2] text-[#125ab2] hover:bg-blue-50 px-5 py-2.5 rounded-sm text-xs font-bold transition-colors shadow-sm uppercase tracking-wider flex items-center gap-2 justify-center w-full md:w-auto"
          >
            <span>+</span> Log Transaction
          </button>
          <button onClick={handleExportCSV} className="bg-gray-800 hover:bg-black text-white px-5 py-2.5 rounded-sm text-xs font-bold transition-colors shadow-sm uppercase tracking-wider flex items-center gap-2 justify-center w-full md:w-auto">
            <span>⭳</span> Export CSV
          </button>
        </div>
      </div>

      {/* ── DUAL TAB NAVIGATION ── */}
      <div className="flex mb-6 bg-white border border-gray-300 rounded-sm shadow-sm overflow-hidden">
        <button 
          onClick={() => { setActiveTab('INBOUND'); setFilterStatus('ALL'); }}
          className={`flex-1 py-3 text-sm font-black uppercase tracking-widest transition-colors ${activeTab === 'INBOUND' ? 'bg-[#125ab2] text-white shadow-inner' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
        >
          ⬇ INBOUND (RECEIVING DOCK)
        </button>
        <button 
          onClick={() => { setActiveTab('OUTBOUND'); setFilterStatus('ALL'); }}
          className={`flex-1 py-3 text-sm font-black uppercase tracking-widest transition-colors ${activeTab === 'OUTBOUND' ? 'bg-[#e91e63] text-white shadow-inner' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
        >
          ⬆ OUTBOUND (DISPATCH DOCK)
        </button>
      </div>

      {/* ── METRICS SUMMARY ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 border border-gray-300 shadow-sm rounded-sm border-l-4 border-l-[#415a77]">
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Total Transacted Units</p>
          <p className="text-3xl font-black text-gray-900 mt-1 font-mono">{totalItems.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 border border-gray-300 shadow-sm rounded-sm">
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Palletized Freight</p>
          <p className="text-3xl font-black text-gray-900 mt-1 font-mono">{totalPallets}</p>
        </div>
        <div className="bg-white p-5 border border-gray-300 shadow-sm rounded-sm border-l-4 border-l-emerald-500">
          <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Successfully Cleared</p>
          <p className="text-3xl font-black text-gray-800 mt-1">{processedLogs.filter(l => l.status === 'Completed' || l.status === 'Shipped').length} <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Trucks</span></p>
        </div>
        <div className="bg-white p-5 border border-gray-300 shadow-sm rounded-sm relative overflow-hidden border-l-4 border-l-red-500">
          <p className="text-[10px] uppercase font-bold text-red-600 tracking-wider">Exceptions / Delayed</p>
          <p className="text-3xl font-black text-red-700 mt-1">{exceptionCount} <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Trucks</span></p>
        </div>
      </div>

      {/* ── TOOLBAR (SEARCH & FILTER) ── */}
      <div className="bg-white p-3 border border-gray-300 shadow-sm rounded-sm mb-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button onClick={() => setFilterStatus('ALL')} className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors ${filterStatus === 'ALL' ? 'bg-[#415a77] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All Logs</button>
          
          {activeTab === 'INBOUND' ? (
            <>
              <button onClick={() => setFilterStatus('Completed')} className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors ${filterStatus === 'Completed' ? 'bg-[#125ab2] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Completed</button>
              <button onClick={() => setFilterStatus('Exception')} className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors ${filterStatus === 'Exception' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>Exception</button>
            </>
          ) : (
            <>
              <button onClick={() => setFilterStatus('Shipped')} className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors ${filterStatus === 'Shipped' ? 'bg-[#e91e63] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Shipped</button>
              <button onClick={() => setFilterStatus('Delayed')} className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors ${filterStatus === 'Delayed' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}>Delayed</button>
            </>
          )}
        </div>
        <input 
          type="text" 
          placeholder="Search Log ID, Entity, Ref, or Carrier..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 px-4 py-1.5 rounded-sm text-sm outline-none focus:border-[#125ab2] w-full sm:w-80 transition-colors"
        />
      </div>

      {/* ── TABEL DATA LOG ── */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
            <thead className="bg-[#e5e5e5] text-[#666666] text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 font-bold border-b border-gray-300 w-40">LOG ID & TIMESTAMP</th>
                <th className="py-3 px-4 font-bold border-b border-gray-300 w-48">REFERENCE (PO/SO)</th>
                <th className="py-3 px-4 font-bold border-b border-gray-300">ENTITY & CARRIER</th>
                <th className="py-3 px-4 font-bold border-b border-gray-300 text-right w-28">VOLUME</th>
                <th className="py-3 px-4 font-bold border-b border-gray-300 text-center w-28">STATUS</th>
                <th className="py-3 px-4 font-bold border-b border-gray-300 text-center w-32">ACTION</th>
              </tr>
            </thead>
            <tbody className="text-[12px] text-gray-700">
              {processedLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400 font-bold italic">
                    <span className="text-3xl block mb-2 opacity-50">📭</span>
                    No {activeTab.toLowerCase()} dock records found matching criteria.
                  </td>
                </tr>
              ) : (
                processedLogs.map((log) => {
                  const isProblem = log.status === 'Exception' || log.status === 'Delayed';
                  return (
                    <tr key={log.id} className={`border-b border-gray-100 transition-colors ${isProblem ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-slate-50'}`}>
                      <td className="py-3 px-4">
                        <div 
                          className={`font-mono font-black cursor-pointer hover:underline text-[13px] ${activeTab === 'INBOUND' ? 'text-[#125ab2]' : 'text-[#e91e63]'}`}
                          onClick={() => setManifestModal({ isOpen: true, data: log })}
                          title="View Manifest Details"
                        >
                          {log.id}
                        </div>
                        <div className="text-[10px] font-bold text-gray-500 mt-0.5 uppercase tracking-wider">{log.date} | {log.time}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-800 text-[13px]">{log.reference}</div>
                        {log.isHazmat && (
                          <span className="inline-block bg-red-600 text-white text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm mt-1 animate-pulse">HAZMAT</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">{log.entity}</div>
                        <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">By: <span className="text-gray-700 font-black">{log.carrier}</span></div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="font-black text-gray-800 text-[13px]">{log.items.toLocaleString()} <span className="font-bold text-gray-400 text-[10px] uppercase">Units</span></div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">{log.pallets} Pallets</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded-sm text-[9px] font-bold uppercase tracking-wider border ${
                          log.status === 'Completed' || log.status === 'Shipped' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                          'bg-red-100 text-red-700 border-red-200'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button 
                          onClick={() => handlePrintManifest(log)}
                          className="bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 px-3 py-1.5 rounded-sm font-bold text-[9px] uppercase tracking-wider shadow-sm w-full transition-colors"
                        >
                          Print Gatepass
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
      {/* 🛡️ MODAL 1: MANUAL LOG ENTRY FORM (BULLETPROOF FLEXBOX)                   */}
      {/* ========================================================================= */}
      {addLogModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[600px] shadow-2xl flex flex-col relative animate-fade-in" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            <div className={`${form.type === 'INBOUND' ? 'bg-[#125ab2]' : 'bg-[#e91e63]'} text-white px-5 py-4 flex justify-between items-center shrink-0 z-10`}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 opacity-80">Manual Entry Registration</p>
                <h3 className="font-black text-sm uppercase tracking-wider">Log New {form.type} Transaction</h3>
              </div>
              <button onClick={() => setAddLogModal(false)} className="text-white opacity-70 hover:opacity-100 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <form onSubmit={handleSaveLog} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 text-sm flex flex-col gap-4">
                
                <div className="bg-gray-50 border border-gray-200 p-3 rounded-sm flex items-start gap-2 mb-2">
                  <span className="text-lg">💡</span>
                  <p className="text-[10px] font-semibold text-gray-600 leading-tight">
                    <strong>Zentryx Hazmat Scanner:</strong> Sistem akan otomatis melabeli transaksi ini sebagai HAZMAT jika mendeteksi kata sandi berbahaya pada Entity atau Notes (misal: "Battery", "Chemical").
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Transaction Type <span className="text-red-500">*</span></label>
                    <select 
                      value={form.type} onChange={e => setForm({...form, type: e.target.value})} 
                      className="w-full border border-gray-300 px-3 py-2 outline-none font-bold text-gray-700 bg-white"
                    >
                      <option value="INBOUND">INBOUND (Receiving)</option>
                      <option value="OUTBOUND">OUTBOUND (Dispatch)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Reference Document (PO/SO) <span className="text-red-500">*</span></label>
                    <input 
                      type="text" placeholder={form.type === 'INBOUND' ? 'e.g. PO-2026-999' : 'e.g. SO-2026-999'}
                      value={form.reference} onChange={e => setForm({...form, reference: e.target.value})} 
                      className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] font-mono font-bold uppercase text-gray-800" required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Source/Destination Entity (Vendor/Dealer) <span className="text-red-500">*</span></label>
                  <input 
                    type="text" placeholder="e.g. Panasonic Energy Corp"
                    value={form.entity} onChange={e => setForm({...form, entity: e.target.value})} 
                    className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] font-bold text-gray-800" required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Logistics Carrier</label>
                    <input type="text" placeholder="e.g. Maersk" value={form.carrier} onChange={e => setForm({...form, carrier: e.target.value})} className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Vehicle Plat</label>
                    <input type="text" placeholder="e.g. B 1234 CD" value={form.vehicle} onChange={e => setForm({...form, vehicle: e.target.value})} className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] font-mono text-xs uppercase" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Driver Name</label>
                    <input type="text" placeholder="e.g. John Doe" value={form.driver} onChange={e => setForm({...form, driver: e.target.value})} className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] text-xs" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 bg-gray-50 p-3 rounded-sm border border-gray-200">
                  <div>
                    <label className="block text-[10px] font-bold text-[#125ab2] uppercase tracking-wider mb-1.5">Total Item Qty <span className="text-red-500">*</span></label>
                    <input type="number" min="1" value={form.items} onChange={e => setForm({...form, items: e.target.value})} className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] font-black" required/>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#125ab2] uppercase tracking-wider mb-1.5">Total Pallets</label>
                    <input type="number" min="0" value={form.pallets} onChange={e => setForm({...form, pallets: e.target.value})} className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] font-bold"/>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#125ab2] uppercase tracking-wider mb-1.5">Final Status <span className="text-red-500">*</span></label>
                    <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full border border-gray-300 px-3 py-2 outline-none font-bold text-gray-800">
                      {form.type === 'INBOUND' ? (
                        <><option value="Completed">Completed</option><option value="Exception">Exception</option></>
                      ) : (
                        <><option value="Shipped">Shipped</option><option value="Delayed">Delayed</option></>
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Dock Supervisor Notes</label>
                  <textarea 
                    rows="2" placeholder="Detail any damages, delays, or hazmat handling procedures..." 
                    value={form.note} onChange={e => setForm({...form, note: e.target.value})} 
                    className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] rounded-sm resize-none text-xs"
                  ></textarea>
                </div>
              </div>
              
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 shrink-0 z-10">
                <button type="button" onClick={() => setAddLogModal(false)} className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm rounded-sm">Cancel</button>
                <button type="submit" className={`px-6 py-2.5 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors rounded-sm ${form.type === 'INBOUND' ? 'bg-[#125ab2] hover:bg-[#0e4487]' : 'bg-[#e91e63] hover:bg-[#c2185b]'}`}>
                  Commit Ledger Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ MODAL 2: DETAIL MANIFEST / DOCK RECEIPT (BULLETPROOF FLEXBOX)          */}
      {/* ========================================================================= */}
      {manifestModal.isOpen && manifestModal.data && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[500px] shadow-2xl flex flex-col relative animate-fade-in" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            <div className={`${manifestModal.data.type === 'INBOUND' ? 'bg-[#125ab2]' : 'bg-[#e91e63]'} text-white px-6 py-4 flex justify-between items-center shrink-0 z-10`}>
              <div>
                <h3 className="font-black text-xl font-mono">{manifestModal.data.id}</h3>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-80 mt-0.5">
                  {manifestModal.data.type === 'INBOUND' ? 'Inbound Goods Receipt' : 'Outbound Dispatch Gatepass'}
                </p>
              </div>
              <button onClick={() => setManifestModal({ isOpen: false, data: null })} className="text-white opacity-70 hover:opacity-100 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 text-gray-800">
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Document Reference</p>
                  <p className="font-black text-lg text-gray-900 border-b border-gray-200 pb-1">{manifestModal.data.reference}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-sm border ${
                    manifestModal.data.status === 'Completed' || manifestModal.data.status === 'Shipped' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
                    'bg-red-100 text-red-700 border-red-300'
                  }`}>
                    {manifestModal.data.status}
                  </span>
                  <p className="text-[10px] font-bold text-gray-500 mt-2">{manifestModal.data.date} | {manifestModal.data.time}</p>
                </div>
              </div>

              {manifestModal.data.isHazmat && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-sm flex items-center gap-3 mb-5">
                  <span className="text-2xl animate-pulse">☢️</span>
                  <div>
                    <p className="text-[10px] font-black text-red-700 uppercase tracking-wider mb-0.5">Hazmat Protocol Engaged</p>
                    <p className="text-[10px] font-semibold text-red-600">This shipment contains hazardous materials. Ensure proper PPE and staging zones are utilized.</p>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 border border-gray-200 p-4 rounded-sm mb-5">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Entity & Logistics Info</p>
                <div className="grid grid-cols-[80px_1fr] gap-y-2 text-xs">
                  <span className="font-bold text-gray-500">Partner:</span>
                  <span className="font-black text-gray-800">{manifestModal.data.entity}</span>
                  
                  <span className="font-bold text-gray-500">Carrier:</span>
                  <span className="font-bold text-gray-700">{manifestModal.data.carrier}</span>
                  
                  <span className="font-bold text-gray-500">Vehicle:</span>
                  <span className="font-mono font-black text-[#125ab2] bg-white border border-blue-100 px-2 py-0.5 rounded-sm w-max">{manifestModal.data.vehicle}</span>
                  
                  <span className="font-bold text-gray-500 mt-1">Driver:</span>
                  <span className="font-semibold text-gray-800 mt-1">{manifestModal.data.driver}</span>
                </div>
              </div>

              <div className="flex gap-4 mb-5">
                <div className="flex-1 bg-blue-50 border border-blue-100 p-3 rounded-sm text-center">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Total Items</p>
                  <p className="text-2xl font-black text-blue-800 mt-1">{manifestModal.data.items.toLocaleString()}</p>
                </div>
                <div className="flex-1 bg-emerald-50 border border-emerald-100 p-3 rounded-sm text-center">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Palletized</p>
                  <p className="text-2xl font-black text-emerald-800 mt-1">{manifestModal.data.pallets}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Dock Supervisor Remarks</p>
                <p className={`text-xs font-semibold p-3 border-l-4 rounded-sm leading-relaxed ${manifestModal.data.status === 'Exception' || manifestModal.data.status === 'Delayed' ? 'bg-red-50 border-l-red-500 text-red-800' : 'bg-gray-50 border-l-gray-400 text-gray-700'}`}>
                  "{manifestModal.data.note}"
                </p>
              </div>
            </div>

            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 shrink-0 z-10">
              <button 
                onClick={() => handlePrintManifest(manifestModal.data)}
                className="w-1/2 bg-white hover:bg-gray-100 text-gray-800 py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm border border-gray-300 flex items-center justify-center gap-2"
              >
                <span>🖨️</span> Print Gatepass
              </button>
              <button 
                onClick={() => setManifestModal({ isOpen: false, data: null })} 
                className="w-1/2 bg-gray-800 hover:bg-black text-white py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm"
              >
                Close Manifest
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
};

export default ShippingReceivingLogs;