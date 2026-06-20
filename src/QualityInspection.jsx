import React, { useState, useContext, useEffect, useMemo } from 'react';
import { AppContext } from './AppContext';

// ─── TOAST COMPONENT ─────────────────────────────────────────────────────────
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
    {toasts.map(({ id, message, type }) => (
      <div key={id} className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl text-white text-xs font-semibold min-w-[280px] backdrop-blur-md bg-opacity-95 ${
        type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-rose-600' : type === 'warning' ? 'bg-amber-500' : 'bg-[#125ab2]'
      }`}>
        <span className="text-base">{type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠️' : '🛡️'}</span>
        <span className="flex-1">{message}</span>
        <button onClick={() => removeToast(id)} className="opacity-70 hover:opacity-100 text-lg leading-none transition-opacity">×</button>
      </div>
    ))}
  </div>
);

// ─── DATA BASE QA STATIS (Sebagai cadangan / tiket QC mandiri yang tidak ada di Task Scanner) ───
const BASE_QC_ITEMS = [
  { id: 'QC-2607-001', poRef: 'PO-260802', sku: 'SKU-ARS-MCU03', name: 'Motor Control Unit (MCU) Gen 3', vendor: 'PT Voltara Daya Nusantara', receivedQty: 210, uom: 'Units', dateReceived: '12 Jul 2026', priority: 'High', status: 'Pending Inspection' },
  { id: 'QC-2607-002', poRef: 'PO-260805', sku: 'SKU-ARS-SNT01', name: 'ADAS Telemetry Sensor Kit', vendor: 'ElectroTech Indo', receivedQty: 500, uom: 'Sets', dateReceived: '14 Jul 2026', priority: 'Medium', status: 'Pending Inspection' },
];

const QualityInspection = () => {
  // ─── GLOBAL CONTEXT ───
  const { setHalaman, taskData, setTaskData } = useContext(AppContext);

  // ─── STATE MANAGEMENT ───
  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const [searchQuery, setSearchQuery] = useState('');
  const [qcQueue, setQcQueue] = useState([]);

  // ─── 🚀 ENGINE PENYIMPANAN HISTORY QC (Mencegah Hantu Refresh) ───
  const [clearedQC, setClearedQC] = useState(() => {
    try {
      const saved = window.localStorage.getItem('zentryx_cleared_qc');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    window.localStorage.setItem('zentryx_cleared_qc', JSON.stringify(clearedQC));
  }, [clearedQC]);

  // ─── 🚀 ENGINE INTERLOCK: PULL DATA FROM GLOBAL TASKS ───
  useEffect(() => {
    // 1. Tarik data tugas dari otak global yang sedang TERKUNCI oleh QC
    const pendingQAFromScanner = (taskData || []).filter(t => t.isLocked && t.dependency === 'QA Clearance Required');
    
    // 2. Petakan format data Scanner ke format tabel QC Anda
    const mappedQA = pendingQAFromScanner.map(t => ({
      id: `QC-${t.id.split('-').slice(-2).join('-')}`, // Format misal: QC-2606-002
      linkedTaskId: t.id,
      poRef: t.refId || 'SYSTEM-GENERATED',
      sku: t.sku || 'N/A',
      name: t.desc,
      vendor: 'Auto-Routed by Inbound PO',
      receivedQty: t.qty || 0,
      uom: 'Units',
      dateReceived: t.createdAt ? t.createdAt.split('T')[0] : 'Today',
      priority: t.priority,
      status: 'Pending Inspection',
      isFloorTask: true
    }));
    
    // 3. Gabungkan tiket QA dadakan (statis) dengan tiket dari Scanner
    // Pastikan tidak ada duplikasi jika sku sudah sama
    const staticFiltered = BASE_QC_ITEMS.filter(baseItem => 
      !mappedQA.some(mappedItem => mappedItem.sku === baseItem.sku)
    );

    const combinedQueue = [...mappedQA, ...staticFiltered].filter(q => q.status === 'Pending Inspection');
    
    // 4. HAPUS "HANTU": Saring data menggunakan history yang sudah clear
    setQcQueue(combinedQueue.filter(q => !clearedQC.includes(q.id)));

  }, [taskData, clearedQC]);

  // ─── FILTERING QUEUE ───
  const filteredQueue = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return qcQueue.filter(item => 
      item.id.toLowerCase().includes(q) || 
      item.name.toLowerCase().includes(q) || 
      (item.linkedTaskId && item.linkedTaskId.toLowerCase().includes(q))
    );
  }, [qcQueue, searchQuery]);

  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [modalDoc, setModalDoc] = useState({ isOpen: false, data: null }); 
  const [activeItem, setActiveItem] = useState(null);
  
  // Inspection Form State
  const [inspectForm, setInspectForm] = useState({
    passedQty: '',
    rejectedQty: '',
    defectCode: '',
    inspectorNotes: ''
  });

  // ─── ACTION HANDLERS ───
  const openInspectionProtocol = (item) => {
    setActiveItem(item);
    setInspectForm({ passedQty: item.receivedQty, rejectedQty: 0, defectCode: '', inspectorNotes: '' });
    setIsModalOpen(true);
  };

  const openDocumentPreview = (item) => {
    addToast(`Retrieving Document ${item.id} from Zentryx Core...`, 'info');
    setTimeout(() => {
      setModalDoc({ isOpen: true, data: item });
    }, 400);
  };

  const handleQtyChange = (e, field) => {
    const val = parseInt(e.target.value) || 0;
    if (field === 'passed') {
      const passed = Math.min(val, activeItem.receivedQty);
      const rejected = activeItem.receivedQty - passed;
      setInspectForm({ ...inspectForm, passedQty: passed, rejectedQty: rejected });
    } else {
      const rejected = Math.min(val, activeItem.receivedQty);
      const passed = activeItem.receivedQty - rejected;
      setInspectForm({ ...inspectForm, passedQty: passed, rejectedQty: rejected });
    }
  };

  const submitInspection = () => {
    if (inspectForm.passedQty + inspectForm.rejectedQty !== activeItem.receivedQty) {
      return addToast('Total Inspected Qty must equal Received Qty.', 'error');
    }

    if (inspectForm.rejectedQty > 0 && !inspectForm.defectCode) {
      return addToast('Please select a Defect Code for the rejected items.', 'warning');
    }

    addToast(`Executing Quality Protocol for ${activeItem.sku}...`, 'info');
    
    setTimeout(() => {
      // ─── 🚀 SURGICAL INJECTION: CROSS-MODULE UNLOCK ───
      if (activeItem.isFloorTask && inspectForm.passedQty > 0) {
        setTaskData(prev => prev.map(t => t.id === activeItem.linkedTaskId ? {
          ...t,
          isLocked: false, // 🔓 BUKA GEMBOK DI SCANNER OPERATOR
          qty: inspectForm.passedQty, // Update Qty jika ada yg di-reject
          currentStage: 'Awaiting Activation',
          notes: t.notes ? `${t.notes} | [QA PASSED: ${inspectForm.passedQty} Units Cleared]` : `[QA PASSED: ${inspectForm.passedQty} Units Cleared]`
        } : t));
        addToast(`System Interlock Released for Task: ${activeItem.linkedTaskId}`, 'success');
      }

      if (inspectForm.rejectedQty === 0) {
        addToast(`✅ 100% Passed. ${activeItem.sku} is now cleared for Assembly Line/Putaway!`, 'success');
      } else {
        addToast(`⚠️ Inspection Logged. ${inspectForm.passedQty} Passed, ${inspectForm.rejectedQty} Rejected. RMA triggered.`, 'warning');
      }
      
      // ─── 🚀 KUNCI PERMANEN: Masukkan ke history agar tidak muncul saat F5
      setClearedQC(prev => [...prev, activeItem.id]);

      // Menghapus dari antrean lokal secara optimis (atau biarkan useEffect membersihkan)
      setQcQueue(prev => prev.filter(q => q.id !== activeItem.id));
      
      setIsModalOpen(false);
      setActiveItem(null);
    }, 600);
  };

  return (
    <div className="bg-[#f3f6f9] min-h-screen px-4 py-6 md:px-8 font-sans text-slate-800 animate-fade-in">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER ── */}
      <div className="max-w-[1500px] mx-auto mb-6 flex justify-between items-end border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>🛡️ Receiving</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Inbound</span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Quality Control (QC)</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => {addToast('Generating QA Compliance Report...', 'info')}} className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm">
            📄 Export QC Logs
          </button>
        </div>
      </div>

      {/* ── METRICS DASHBOARD ── */}
      <div className="max-w-[1500px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xl">⏳</div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Inspections</p>
            <p className="text-2xl font-black text-slate-800 leading-none mt-1">{qcQueue.length}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-xl">✅</div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lots Passed (Today)</p>
            <p className="text-2xl font-black text-slate-800 leading-none mt-1">14</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center text-xl">⚠️</div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lots Rejected / RMA</p>
            <p className="text-2xl font-black text-slate-800 leading-none mt-1">1</p>
          </div>
        </div>
      </div>

      {/* ── SEARCH BAR FOR QC QUEUE ── */}
      <div className="max-w-[1500px] mx-auto bg-white p-3 border border-gray-300 shadow-sm rounded-sm mb-4 flex items-center">
        <span className="opacity-40 px-3">🔍</span>
        <input 
          type="text" 
          placeholder="Search QC Ref ID or Linked Task ID..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-none text-xs font-semibold outline-none w-full"
        />
      </div>

      {/* ── QC QUEUE TABLE ── */}
      <div className="max-w-[1500px] mx-auto bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Inspection Queue</h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400">Barcode Scanner Active</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-4 px-6 w-56">QC ID / PO Ref</th>
                <th className="py-4 px-6 w-48 text-[#125ab2]">LINKED FLOOR TASK</th>
                <th className="py-4 px-6">Component Data</th>
                <th className="py-4 px-6">Vendor Info</th>
                <th className="py-4 px-6 text-right">Received Qty</th>
                <th className="py-4 px-6 text-center">Priority</th>
                <th className="py-4 px-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {filteredQueue.map((item) => (
                <tr key={item.id} className={`border-b border-slate-50 transition-colors ${item.isFloorTask ? 'bg-blue-50/30 hover:bg-blue-50/70' : 'hover:bg-slate-50'}`}>
                  <td className="py-4 px-6">
                    <div 
                      onClick={() => openDocumentPreview(item)}
                      className="font-black text-[#125ab2] mb-1 cursor-pointer hover:underline inline-block"
                      title="Preview Document"
                    >
                      {item.id}
                    </div>
                    <div className="block">
                      <span 
                        onClick={() => { addToast(`Routing to Purchase Order: ${item.poRef}...`, 'info'); setHalaman('procPO'); }}
                        className="text-[10px] font-mono text-slate-500 bg-slate-100 hover:bg-slate-200 hover:text-[#125ab2] px-1.5 py-0.5 rounded inline-block cursor-pointer transition-colors"
                        title="View Original PO"
                      >
                        {item.poRef}
                      </span>
                    </div>
                  </td>

                  {/* 🚀 RENDER LINKED TASK ID SECARA CERDAS */}
                  <td className="py-4 px-6">
                    {item.linkedTaskId ? (
                      <div className="bg-white border border-[#125ab2]/40 text-[#125ab2] font-mono font-black px-2.5 py-1.5 rounded-sm inline-block text-[11px] shadow-sm cursor-help hover:bg-blue-50 transition-colors" title="Floor Task is waiting for this QC clearance">
                        🔗 {item.linkedTaskId}
                      </div>
                    ) : (
                      <span className="text-gray-300 font-bold">—</span>
                    )}
                  </td>

                  <td className="py-4 px-6">
                    <div className="font-bold text-slate-800 mb-0.5">{item.name}</div>
                    <div 
                      onClick={() => { addToast(`Viewing Item Master for ${item.sku}...`, 'info'); setHalaman('invOverview'); }}
                      className="font-mono font-bold text-slate-400 cursor-pointer hover:text-[#125ab2] hover:underline inline-block"
                      title="View Item Data"
                    >
                      {item.sku}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-semibold text-slate-700">{item.vendor}</div>
                    <div className="text-[9px] font-bold text-slate-400 mt-0.5">Arrived: {item.dateReceived}</div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="text-base font-black text-slate-800">{item.receivedQty}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase">{item.uom}</div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider ${
                      item.priority === 'Critical' ? 'bg-rose-600 text-white animate-pulse' :
                      item.priority === 'High' ? 'bg-rose-100 text-rose-700' :
                      item.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {item.priority}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button onClick={() => openInspectionProtocol(item)} className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-colors shadow-sm whitespace-nowrap">
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
              {filteredQueue.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-16 text-center">
                    <div className="text-4xl mb-2 opacity-50">✨</div>
                    <p className="text-sm font-bold text-slate-500">All Clear! No pending inspections.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
         MODAL 1: DOCUMENT PREVIEW
      ═══════════════════════════════════════════════════ */}
      {modalDoc.isOpen && modalDoc.data && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-[500px] shadow-2xl flex flex-col border-t-4 border-slate-800 overflow-hidden animate-fade-in">
            <div className="px-6 py-4 flex justify-between items-center bg-slate-50 border-b border-slate-100">
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider text-slate-800">Inspection Request Ticket</h3>
                <p className="text-[10px] font-mono text-slate-500 mt-0.5">{modalDoc.data.id}</p>
              </div>
              <button onClick={() => setModalDoc({ isOpen: false, data: null })} className="text-slate-400 hover:text-slate-800 font-bold text-xl transition-colors">✕</button>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Vendor</span>
                  <span className="text-xs font-black text-slate-800">{modalDoc.data.vendor}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">PO Reference</span>
                  <span className="text-xs font-mono font-bold text-[#125ab2]">{modalDoc.data.poRef}</span>
                </div>
                
                {/* PREVIEW TASK LINK */}
                {modalDoc.data.linkedTaskId && (
                  <div className="flex justify-between border-b border-slate-100 pb-2 items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase">System Interlock</span>
                    <span className="text-[10px] font-mono font-bold bg-[#125ab2] text-white px-2 py-1 rounded shadow-sm flex items-center gap-1">
                      <span>🔗</span> Unlocks: {modalDoc.data.linkedTaskId}
                    </span>
                  </div>
                )}

                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Component</span>
                  <span className="text-xs font-black text-slate-800">{modalDoc.data.name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Qty to Inspect</span>
                  <span className="text-xs font-black text-slate-800">{modalDoc.data.receivedQty} {modalDoc.data.uom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase">Status</span>
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-black uppercase">{modalDoc.data.status}</span>
                </div>
              </div>

              <div className="mt-8 pt-4">
                <button onClick={() => setModalDoc({ isOpen: false, data: null })} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-colors">
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
         MODAL 2: INSPECTION EXECUTION
      ═══════════════════════════════════════════════════ */}
      {isModalOpen && activeItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="px-6 py-4 flex justify-between items-center bg-slate-800 text-white">
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider text-blue-300">Quality Execution Protocol</h3>
                <p className="text-[10px] font-mono mt-0.5">{activeItem.id}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white font-bold text-xl transition-colors">✕</button>
            </div>
            
            <div className="p-6">
              {/* Item Info Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 flex justify-between items-center relative overflow-hidden">
                {activeItem.isFloorTask && (
                  <div className="absolute top-0 right-0 bg-[#125ab2] text-white text-[8px] font-black uppercase px-3 py-1 rounded-bl-lg shadow-sm">
                    ⚠️ Action Unlocks Floor Task
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Component</p>
                  <p className="font-black text-slate-800 text-lg">{activeItem.name}</p>
                  <p className="font-mono text-xs font-bold text-[#125ab2]">{activeItem.sku}</p>
                </div>
                <div className="text-right mt-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Received</p>
                  <p className="font-black text-slate-800 text-2xl">{activeItem.receivedQty} <span className="text-xs text-slate-500 uppercase">{activeItem.uom}</span></p>
                </div>
              </div>

              {/* Input Grid */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Passed Qty */}
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4">
                  <label className="flex items-center gap-2 text-xs font-black text-emerald-700 uppercase tracking-wider mb-2">
                    <span>✅</span> Approved Qty
                  </label>
                  <input 
                    type="number" 
                    value={inspectForm.passedQty}
                    onChange={(e) => handleQtyChange(e, 'passed')}
                    className="w-full text-2xl font-black text-slate-800 bg-white border border-emerald-200 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[9px] font-bold text-emerald-600 mt-2">
                    {activeItem.isFloorTask ? `Will unlock Scanner for ${activeItem.linkedTaskId}` : 'Will be moved to Available stock.'}
                  </p>
                </div>

                {/* Rejected Qty */}
                <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-4">
                  <label className="flex items-center gap-2 text-xs font-black text-rose-700 uppercase tracking-wider mb-2">
                    <span>❌</span> Rejected Qty
                  </label>
                  <input 
                    type="number" 
                    value={inspectForm.rejectedQty}
                    onChange={(e) => handleQtyChange(e, 'rejected')}
                    className="w-full text-2xl font-black text-slate-800 bg-white border border-rose-200 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <p className="text-[9px] font-bold text-rose-600 mt-2">Will be sent to Quarantine/RMA.</p>
                </div>
              </div>

              {/* Conditional Rejection Fields */}
              {inspectForm.rejectedQty > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6 animate-fade-in space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-rose-700 uppercase tracking-wider mb-1.5">Primary Defect Code *</label>
                    <select 
                      value={inspectForm.defectCode}
                      onChange={(e) => setInspectForm({...inspectForm, defectCode: e.target.value})}
                      className="w-full border border-rose-200 bg-white text-sm font-bold text-slate-700 p-2.5 rounded-lg outline-none focus:border-rose-500"
                    >
                      <option value="" disabled>Select Reason...</option>
                      <option value="DEF-01">DEF-01: Physical Damage (Dents/Scratches)</option>
                      <option value="DEF-02">DEF-02: Failed Electrical Diagnostic Test</option>
                      <option value="DEF-03">DEF-03: Missing/Incorrect Serial Numbers</option>
                      <option value="DEF-04">DEF-04: Packaging Compromised (Water/Chemical)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-rose-700 uppercase tracking-wider mb-1.5">Inspector Notes</label>
                    <textarea 
                      value={inspectForm.inspectorNotes}
                      onChange={(e) => setInspectForm({...inspectForm, inspectorNotes: e.target.value})}
                      placeholder="Add specific details for vendor claim..."
                      className="w-full border border-rose-200 bg-white text-sm text-slate-700 p-2.5 rounded-lg outline-none focus:border-rose-500 resize-none h-20"
                    ></textarea>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-8 border-t border-slate-100 pt-4">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-colors">
                  Cancel
                </button>
                <button onClick={submitInspection} className="flex-1 bg-[#125ab2] hover:bg-[#0e4487] text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
                  {activeItem.isFloorTask ? <span>🔓 Unlock Operator Scanner</span> : <span>Submit QC Results</span>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default QualityInspection;