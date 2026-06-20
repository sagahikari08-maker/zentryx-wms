import React, { useState, useContext, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppContext } from './AppContext';

// ─── TOAST COMPONENT ─────────────────────────────────────────────────────────
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
    {toasts.map(({ id, message, type }) => (
      <div key={id} className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl text-white text-xs font-semibold min-w-[280px] backdrop-blur-md bg-opacity-95 ${
        type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-rose-600' : type === 'warning' ? 'bg-amber-500' : 'bg-[#125ab2]'
      }`}>
        <span className="text-base">{type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠️' : '⚡'}</span>
        <span className="flex-1">{message}</span>
        <button onClick={() => removeToast(id)} className="opacity-70 hover:opacity-100 text-lg leading-none transition-opacity">×</button>
      </div>
    ))}
  </div>
);

const Putaway = () => {
  const { setHalaman, taskData, completeTaskAndSync } = useContext(AppContext);

  // ─── STATE MANAGEMENT ───
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // ─── 🚀 ENGINE INTERLOCK: FETCH UNLOCKED PUTAWAY TASKS ───
  const putawayTasks = useMemo(() => {
    // Tarik hanya tugas Putaway yang TIDAK terkunci (Sudah Lolos QC) dan belum selesai
    return (taskData || []).filter(t => t.type === 'Putaway' && !t.isLocked && t.status !== 'Completed').map(t => ({
      id: t.id,
      sku: t.sku || 'N/A',
      name: t.desc,
      qty: t.qty || 10, // Default 10 jika qty kosong
      uom: 'Units',
      sourceLoc: 'QC Staging Area',
      targetZone: t.zone || 'ZONE-A (Ambient)',
      targetBin: `${t.zone ? t.zone.charAt(0) : 'A'}-01-01`, // Mocking lokasi Bin dinamis berdasarkan Zone
      isDG: t.sku?.includes('LFP') || false,
      weight: `${(t.qty || 10) * 5} kg`,
      status: t.status === 'Not Started' ? 'Ready for Putaway' : t.status
    }));
  }, [taskData]);

  // Modals & Active States
  const [activeTask, setActiveTask] = useState(null);
  const [modalBin, setModalBin] = useState({ isOpen: false, data: null });
  const [simulatedScan, setSimulatedScan] = useState('');

  // ─── ACTION HANDLERS ───
  const openTaskDetails = (task) => {
    setActiveTask(task);
    addToast(`Task ${task.id} selected. Please move to ${task.targetZone} and scan the Bin barcode.`, 'info');
  };

  const checkBinCapacity = (task) => {
    addToast(`Retrieving Structural Metrics for Bin ${task.targetBin}...`, 'info');
    setTimeout(() => {
      setModalBin({ isOpen: true, data: task });
    }, 400);
  };

  // ─── 🚀 ENGINE INTERLOCK: COMPLETE & SYNC INVENTORY ───
  const executePutaway = useCallback((taskId) => {
    addToast(`Confirming Putaway transaction for Task ${taskId}...`, 'info');
    setTimeout(() => {
      // 1. Sinkronisasi Inventory Global & Menghapus Task dari Antrean
      completeTaskAndSync(taskId);
      
      addToast(`✅ Putaway Confirmed. Inventory successfully transferred to Core Database.`, 'success');
      setActiveTask(null);
    }, 600);
  }, [completeTaskAndSync, addToast]);

  // ─── CORE SCANNER LOGIC (DIPAKAI OLEH LISTENER MAUPUN INPUT MANUAL) ───
  const processBarcode = useCallback((scannedCode) => {
    const code = scannedCode.toUpperCase().trim();
    addToast(`Scanner Detected: ${code}`, 'info');
    
    if (activeTask && code === activeTask.targetBin) {
      executePutaway(activeTask.id);
    } else if (activeTask) {
      addToast(`Location Mismatch! Scanned: ${code}, but system requires ${activeTask.targetBin}.`, 'error');
    } else {
      addToast(`Please select a Putaway Task first before scanning a Bin.`, 'warning');
    }
  }, [activeTask, addToast, executePutaway]);

  // ─── 1. INVISIBLE HARDWARE LISTENER (Menggunakan useRef agar tidak terhapus Re-render) ───
  const bufferRef = useRef('');
  const timerRef = useRef(null);

  useEffect(() => {
    const handleGlobalScan = (e) => {
      // Abaikan jika user sedang mengetik di kolom input/textarea apapun
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'Enter' && bufferRef.current.length > 0) {
        e.preventDefault();
        processBarcode(bufferRef.current);
        bufferRef.current = '';
      } else if (e.key.length === 1) {
        bufferRef.current += e.key;
        // Beri waktu 5 detik bagi user untuk menyelesaikan ketikannya
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => { bufferRef.current = ''; }, 5000);
      }
    };

    window.addEventListener('keydown', handleGlobalScan);
    return () => {
      window.removeEventListener('keydown', handleGlobalScan);
      clearTimeout(timerRef.current);
    };
  }, [processBarcode]);

  // ─── 2. VISIBLE SIMULATOR SUBMIT ───
  const handleSimulatedSubmit = (e) => {
    e.preventDefault();
    if (simulatedScan) {
      processBarcode(simulatedScan);
      setSimulatedScan('');
    }
  };

  return (
    <div className="bg-[#f3f6f9] min-h-screen px-4 py-6 md:px-8 font-sans text-slate-800">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER ── */}
      <div className="max-w-[1500px] mx-auto mb-6 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 pb-3 gap-4 animate-fade-in">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>🔀 Receiving</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Inbound</span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Directed Putaway</h1>
        </div>
        
        {/* Zentryx AI Telemetry & Visible Scanner Simulator */}
        <div className="flex flex-wrap gap-3">
          <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm flex flex-col justify-center">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Zentryx AI Routing</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Active</span>
            </div>
          </div>

          {/* VISIBLE SCANNER SIMULATOR (Solusi Anti-Gagal) */}
          <form onSubmit={handleSimulatedSubmit} className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl shadow-sm flex flex-col justify-center">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Hardware Scanner Simulator</span>
            <div className="flex items-center gap-2">
              <span className="text-sm">🔫</span>
              <input 
                type="text" 
                value={simulatedScan}
                onChange={(e) => setSimulatedScan(e.target.value)}
                placeholder="Type bin here & Enter..." 
                className="bg-transparent text-emerald-400 text-[10px] font-mono outline-none border-b border-slate-600 focus:border-emerald-400 w-32 placeholder-slate-500 transition-colors"
              />
            </div>
          </form>
        </div>
      </div>

      {/* ── METRICS DASHBOARD ── */}
      <div className="max-w-[1500px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-5 mb-6 animate-fade-in">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tasks Pending</p>
          <p className="text-3xl font-black text-[#125ab2] mt-1">{putawayTasks.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed (Shift)</p>
          <p className="text-3xl font-black text-emerald-600 mt-1">42</p>
        </div>
        <div className="md:col-span-2 bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-5 shadow-sm flex items-center justify-between text-white">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Task Execution</p>
            {activeTask ? (
              <p className="text-lg font-black text-emerald-400 mt-1 flex items-center gap-2">
                {activeTask.id} <span className="text-xs text-slate-400">({activeTask.targetBin})</span>
              </p>
            ) : (
              <p className="text-lg font-bold text-slate-500 mt-1 italic">No task selected.</p>
            )}
          </div>
          {activeTask && (
            <div className="text-right">
              <p className="text-[9px] font-bold text-slate-400 uppercase">Scanner Status</p>
              <p className="text-xs font-black text-emerald-400 animate-pulse mt-0.5">Awaiting Target Scan...</p>
            </div>
          )}
        </div>
      </div>

      {/* ── PUTAWAY QUEUE TABLE ── */}
      <div className="max-w-[1500px] mx-auto bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-fade-in">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">System-Directed Routing Queue</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-4 px-6">Putaway Task ID</th>
                <th className="py-4 px-6">Payload (SKU)</th>
                <th className="py-4 px-6">Current Location</th>
                <th className="py-4 px-6">AI Target Destination</th>
                <th className="py-4 px-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {putawayTasks.map((task) => (
                <tr key={task.id} className={`border-b border-slate-50 transition-colors ${activeTask?.id === task.id ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}>
                  
                  {/* TASK ID (INTERACTIVE) */}
                  <td className="py-4 px-6">
                    <div 
                      onClick={() => openTaskDetails(task)}
                      className="font-black text-[#125ab2] mb-1 cursor-pointer hover:underline inline-block"
                      title="Activate Task"
                    >
                      {task.id}
                    </div>
                    <div>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${activeTask?.id === task.id ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
                        {activeTask?.id === task.id ? 'Active' : task.status}
                      </span>
                    </div>
                  </td>

                  {/* SKU & PAYLOAD (INTERACTIVE) */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 mb-1">
                      <span 
                        onClick={() => { addToast(`Viewing Master Data for ${task.sku}...`, 'info'); setHalaman('invOverview'); }}
                        className="font-mono font-bold text-slate-600 cursor-pointer hover:text-[#125ab2] hover:underline"
                        title="View SKU Database"
                      >
                        {task.sku}
                      </span>
                      {task.isDG && <span className="bg-rose-100 text-rose-700 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">DG</span>}
                    </div>
                    <div className="font-bold text-slate-800 truncate max-w-[200px]" title={task.name}>{task.name}</div>
                    <div className="text-[10px] font-bold text-slate-500 mt-1">Qty: <span className="text-slate-800">{task.qty} {task.uom}</span> | Est. Wt: <span className="text-amber-600">{task.weight}</span></div>
                  </td>

                  {/* SOURCE LOCATION */}
                  <td className="py-4 px-6">
                    <span className="font-semibold text-slate-700">{task.sourceLoc}</span>
                  </td>

                  {/* TARGET DESTINATION (INTERACTIVE) */}
                  <td className="py-4 px-6">
                    <div className="font-bold text-slate-700 mb-1">{task.targetZone}</div>
                    <div 
                      onClick={() => checkBinCapacity(task)}
                      className="font-mono font-black text-[#125ab2] bg-blue-50 border border-blue-100 px-2 py-1 rounded inline-block cursor-pointer hover:bg-blue-100 transition-colors"
                      title="View Bin Structural Capacity"
                    >
                      👉 {task.targetBin}
                    </div>
                  </td>

                  {/* ACTION CONTROLS */}
                  <td className="py-4 px-6 text-center">
                    {activeTask?.id === task.id ? (
                      <button onClick={() => executePutaway(task.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg text-[10px] font-bold uppercase transition-all shadow-[0_0_10px_rgba(16,185,129,0.4)] transform hover:-translate-y-0.5">
                        Confirm Store
                      </button>
                    ) : (
                      <button onClick={() => openTaskDetails(task)} className="bg-slate-800 hover:bg-black text-white px-5 py-2 rounded-lg text-[10px] font-bold uppercase transition-colors shadow-sm">
                        Select Task
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {putawayTasks.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-16 text-center">
                    <div className="text-4xl mb-2 opacity-50">🏆</div>
                    <p className="text-sm font-bold text-slate-500">Staging Area Clear! No pending putaway tasks.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          MODAL: BIN STRUCTURAL CAPACITY (WHEN TARGET BIN CLICKED)
      ═══════════════════════════════════════════════════ */}
      {modalBin.isOpen && modalBin.data && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-[450px] shadow-2xl flex flex-col border-t-4 border-[#125ab2] overflow-hidden animate-fade-in">
            <div className="px-6 py-4 flex justify-between items-center bg-slate-50 border-b border-slate-100">
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider text-slate-800">Bin Capacity Profile</h3>
                <p className="text-[10px] font-mono text-slate-500 mt-0.5">{modalBin.data.targetZone}</p>
              </div>
              <button onClick={() => setModalBin({ isOpen: false, data: null })} className="text-slate-400 hover:text-slate-800 font-bold text-xl transition-colors">✕</button>
            </div>
            
            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Location Barcode</p>
                <div className="text-3xl font-black font-mono text-slate-800 bg-slate-100 py-3 rounded-xl border border-slate-200">
                  {modalBin.data.targetBin}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase">Incoming Payload</span>
                  <span className="text-sm font-black text-amber-600">{modalBin.data.weight}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase">Max Structural Limit</span>
                  <span className="text-sm font-black text-slate-800">
                    {modalBin.data.targetZone.includes('Heavy') ? '5,000 kg' : modalBin.data.targetZone.includes('Cold') ? '2,500 kg' : '1,500 kg'}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Clearance Status</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-black uppercase">Capacity Approved</span>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100">
                <button onClick={() => setModalBin({ isOpen: false, data: null })} className="w-full bg-[#125ab2] hover:bg-[#0e4487] text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-sm">
                  Close & Proceed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Putaway;