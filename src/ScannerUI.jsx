import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AppContext } from './AppContext';

// ─── TOAST COMPONENT ─────────────────────────────────────────────────────────
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

// ─── HELPER COMPONENTS ───────────────────────────────────────────────────────
const TaskTypeBadge = ({ type }) => {
  const styles = {
    'Picking': 'bg-blue-900/80 text-blue-200 border-blue-400',
    'Putaway': 'bg-emerald-900/80 text-emerald-200 border-emerald-400',
    'Cycle Count': 'bg-purple-900/80 text-purple-200 border-purple-400',
    'MRO': 'bg-amber-900/80 text-amber-200 border-amber-400',
    'HSE': 'bg-rose-900/80 text-rose-200 border-rose-400',
    'Housekeeping': 'bg-teal-900/80 text-teal-200 border-teal-400',
  };
  return (
    <span className={`px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-widest border ${styles[type] || 'bg-slate-700 text-slate-300 border-slate-500'}`}>
      {type}
    </span>
  );
};

const TimeSinceDispatch = ({ createdAt }) => {
  const [elapsed, setElapsed] = useState('');
  
  useEffect(() => {
    const updateTime = () => {
      const createdTime = new Date(createdAt).getTime();
      const now = new Date().getTime();
      const diffInMins = Math.floor((now - createdTime) / 60000);
      
      if (diffInMins < 60) setElapsed(`${diffInMins}m ago`);
      else if (diffInMins < 1440) setElapsed(`${Math.floor(diffInMins/60)}h ago`);
      else setElapsed(`${Math.floor(diffInMins/1440)}d ago`);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [createdAt]);

  return <span className="text-[9px] font-bold text-slate-400">🕒 {elapsed}</span>;
};

// ─── MAIN APP COMPONENT ───────────────────────────────────────────────────────
const ScannerUI = () => {
  // 🚀 INJEKSI: Mengambil completeTaskAndSync & user dari AppContext
  const { taskData, setTaskData, completeTaskAndSync, user } = useContext(AppContext);

  // ─── STATE PERANGKAT & WAKTU ───
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })), 60000);
    return () => clearInterval(timer);
  }, []);

  // ─── STATE WORKFLOW ───
  const [activeView, setActiveView] = useState('queue'); 
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [scanStep, setScanStep] = useState(''); 
  const [scannedData, setScannedData] = useState({ location: false, item: false, photo: false });
  
  const [scannerFlash, setScannerFlash] = useState(false);
  const [cameraFlash, setCameraFlash] = useState(false);
  const [toasts, setToasts] = useState([]);

  // ─── TOAST FUNCS ───
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // 🚀 ENGINE FILTERING: Hanya menampilkan Task yang statusnya BUKAN "Completed"
  const activeTasksForFloor = useMemo(() => {
    return (taskData || [])
      .filter(t => t.status !== 'Completed')
      .sort((a, b) => {
        if (a.status === 'In Progress' && b.status !== 'In Progress') return -1;
        if (a.status !== 'In Progress' && b.status === 'In Progress') return 1;
        
        const priorityWeight = { 'CRITICAL': 4, 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
        const weightA = priorityWeight[a.priority] || 0;
        const weightB = priorityWeight[b.priority] || 0;
        
        if (weightA !== weightB) return weightB - weightA;
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
  }, [taskData]);

  const activeTaskObj = useMemo(() => {
    return (taskData || []).find(t => t.id === activeTaskId);
  }, [taskData, activeTaskId]);

  // ─── SCANNER LASER SIMULATION DENGAN HAPTIC FEEDBACK ───
  const triggerHardwareScan = (expectedType) => {
    setScannerFlash(true);
    setTimeout(() => setScannerFlash(false), 150);

    // 🚀 Haptic Feedback (Getar) jika perangkat mendukung
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

    setTimeout(() => {
      if (expectedType === 'location') {
        setScannedData(prev => ({ ...prev, location: true }));
        setScanStep('item');
        setTaskData(prev => prev.map(t => t.id === activeTaskId ? { ...t, currentStage: 'Scan SKU' } : t));
        addToast('Location Barcode verified.', 'success');
      } else if (expectedType === 'item') {
        setScannedData(prev => ({ ...prev, item: true }));
        setScanStep('evidence');
        setTaskData(prev => prev.map(t => t.id === activeTaskId ? { ...t, currentStage: 'Evidence Cap' } : t));
        addToast('Cargo SKU items verified.', 'success');
      }
    }, 400);
  };

  const handleOpenTaskProfile = (task) => {
    setActiveTaskId(task.id);
    setScannedData({ location: false, item: false, photo: false });
    
    if (task.type === 'Housekeeping' || task.type === 'HSE') {
      setScanStep('evidence');
    } else {
      setScanStep('location');
    }
    setActiveView('detail');
  };

  const handleActivateTask = () => {
    const firstStage = (activeTaskObj.type === 'Housekeeping' || activeTaskObj.type === 'HSE') ? 'Evidence Cap' : 'Scanning Location';
    setTaskData(prev => prev.map(t => t.id === activeTaskId ? { 
      ...t, 
      status: 'In Progress', 
      currentStage: firstStage,
      pickingStartAt: new Date().toISOString() 
    } : t));
    addToast(`Task ${activeTaskId} Activated. Handling time tracking initialized.`, 'warning');
  };

  const handleReportIssue = () => {
    addToast('Issue reported to Manager. Task suspended.', 'error');
    setTaskData(prev => prev.map(t => t.id === activeTaskId ? { ...t, status: 'Suspended', currentStage: 'Issue Reported' } : t));
    setActiveView('queue');
  };

  // ─── HELPER: CALCULATE HANDLING TIME ───
  const getHandlingTime = () => {
    if (!activeTaskObj || !activeTaskObj.pickingStartAt || !activeTaskObj.completedAt) {
      return "00m : 00s";
    }
    const start = new Date(activeTaskObj.pickingStartAt).getTime();
    const end = new Date(activeTaskObj.completedAt).getTime();
    const diffInSeconds = Math.floor((end - start) / 1000);
    
    const minutes = Math.floor(diffInSeconds / 60).toString().padStart(2, '0');
    const seconds = (diffInSeconds % 60).toString().padStart(2, '0');
    
    return `${minutes}m : ${seconds}s`;
  };    

  const handleCapturePhotoExecute = () => {
    setCameraFlash(true);
    if (navigator.vibrate) navigator.vibrate(200); // Shutter feel
    
    setTimeout(() => {
      setCameraFlash(false);
      setScannedData(prev => ({ ...prev, photo: true }));
      
      setTaskData(prev => prev.map(t => t.id === activeTaskId ? {
        ...t,
        evidencePhoto: `EVID_${activeTaskId.split('-').pop()}.jpg`,
        currentStage: 'Completed',
        completedAt: new Date().toISOString()
      } : t));
      
      setActiveView('success');
      addToast('Evidence captured and saved into the cloud.', 'success');
    }, 150);
  };

  // 🚀 INJEKSI: ULTIMATE INTERLOCK (Menambah Stok & Membersihkan Task dari Layar)
  const handleCompleteTaskSignOff = () => {
    // 1. Memanggil fungsi dari AppContext yang akan menambah stok di gudang jika ini tugas Putaway!
    if (typeof completeTaskAndSync === 'function') {
      completeTaskAndSync(activeTaskId); 
    }

    // 2. 🚀 SURGICAL FIX: Pastikan status diganti menjadi 'Completed' di database global secara paksa
    //    agar fungsi filter activeTasksForFloor (di atas) langsung menendang tugas ini keluar dari layar!
    setTaskData(prev => prev.map(t => 
      t.id === activeTaskId ? { ...t, status: 'Completed', currentStage: 'Closed' } : t
    ));

    addToast(`Task ${activeTaskId} officially LOCKED & CLOSED. Data Synced.`, 'success');
    setActiveView('queue');
    setActiveTaskId(null);
  };

  // ─── RENDER: QUEUE VIEW ───
  const renderQueue = () => (
    <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
      <div className="bg-slate-800 p-4 border-b border-slate-700 shrink-0 shadow-lg">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Operator Node</p>
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-black text-white truncate pr-2">{user ? user.name : 'Terminal 01'}</h2>
          <span className="bg-emerald-500/20 border border-emerald-500 text-emerald-400 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0 animate-pulse">Online</span>
        </div>
      </div>
      
      <div className="p-3 bg-slate-950 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 flex justify-between items-center shrink-0">
        <span>Active Dispatch Queue</span>
        <span className="font-mono bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">{activeTasksForFloor.length} Tasks</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {activeTasksForFloor.map((task) => {
          const isCritical = task.priority.toUpperCase() === 'CRITICAL';
          const isInProgress = task.status === 'In Progress';
          
          return (
            <div 
              key={task.id} 
              onClick={() => handleOpenTaskProfile(task)}
              className={`rounded-lg p-3.5 border-2 transition-all active:scale-95 cursor-pointer flex flex-col relative overflow-hidden ${
                isCritical && !isInProgress
                  ? 'bg-red-950/40 border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-[pulse_2s_infinite]' 
                  : isInProgress
                  ? 'bg-amber-950/40 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'bg-slate-800/50 border-slate-700 hover:border-blue-500/50'
              }`}
            >
              {isInProgress && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500 animate-pulse"></div>}
              {isCritical && !isInProgress && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-600"></div>}

              <div className="flex justify-between items-start mb-2 pl-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <TaskTypeBadge type={task.type} />
                  {isCritical && <span className="text-[8px] bg-red-600 text-white px-1.5 py-0.5 rounded-sm uppercase font-black tracking-widest animate-pulse">CRITICAL</span>}
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-500">{task.id.split('-').pop()}</span>
              </div>
              
              <h3 className={`text-base font-black mb-2 leading-snug pl-2 line-clamp-2 ${isCritical && !isInProgress ? 'text-red-100' : 'text-white'}`}>
                {task.desc}
              </h3>
              
              <div className="flex justify-between items-end mt-auto pl-2 border-t border-slate-700/50 pt-2.5">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm opacity-70">📍</span>
                    <span className={`text-[11px] font-bold ${isInProgress ? 'text-amber-400' : 'text-emerald-400'}`}>{task.zone || task.targetBin}</span>
                  </div>
                  {task.qty && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm opacity-70">📦</span>
                      <span className="text-[10px] font-mono font-bold text-blue-300">Qty: {task.qty}</span>
                    </div>
                  )}
                </div>
                
                <div className="text-right flex flex-col items-end gap-1">
                  {isInProgress ? (
                    <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-2 py-1 rounded-sm shadow-lg">IN PROGRESS</span>
                  ) : (
                    <TimeSinceDispatch createdAt={task.createdAt} />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {activeTasksForFloor.length === 0 && (
          <div className="text-center py-24 px-6">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700 shadow-inner">
              <span className="text-3xl opacity-40">☕</span>
            </div>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-2 text-glow">All Clear</p>
            <p className="text-slate-500 text-[10px] leading-relaxed">No pending dispatch tasks. Stand by for Command Center instructions.</p>
          </div>
        )}
      </div>
    </div>
  );

  // ─── RENDER VIEW: DETAIL & WORKFLOW ───
  const renderTaskExecution = () => {
    if (!activeTaskObj) return null;
    const isNotStarted = activeTaskObj.status === 'Not Started';

    return (
      <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-950 pb-8">
          
          <div className="flex gap-2">
            <button onClick={() => setActiveView('queue')} className="bg-slate-800 text-slate-300 p-3 rounded-lg font-bold">← Back</button>
            <div className="flex-1 bg-slate-800 rounded-lg p-3 flex flex-col justify-center">
              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Active ID</span>
              <span className="font-mono text-white text-xs font-black">{activeTaskObj.id}</span>
            </div>
          </div>

          {isNotStarted && (
            <button 
              type="button" 
              disabled={activeTaskObj.isLocked}
              onClick={() => !activeTaskObj.isLocked && handleActivateTask()} 
              className={`w-full py-5 rounded-lg font-black uppercase tracking-[0.2em] text-sm active:scale-95 shadow-[0_0_20px_rgba(5,150,105,0.4)] flex justify-center items-center gap-3 transition-all ${
                activeTaskObj.isLocked 
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white animate-[pulse_2s_infinite]'
              }`}
            >
              {activeTaskObj.isLocked ? (
                <><span className="text-xl">🔒</span> AWAITING CLEARANCE</>
              ) : (
                <><span className="text-xl">▶️</span> START EXECUTION</>
              )}
            </button>
          )}

          {!isNotStarted && (
            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg text-center shadow-inner flex flex-col items-center justify-center">
              <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">Time Tracking Active</p>
              <p className="text-xs font-bold text-amber-400 uppercase tracking-wider bg-amber-500/20 px-3 py-1 rounded-sm border border-amber-500/30">Status: IN PROGRESS ⏳</p>
            </div>
          )}

          <div className={`space-y-4 transition-all duration-500 relative ${isNotStarted ? 'opacity-30 pointer-events-none scale-[0.98] blur-[1px]' : 'opacity-100 scale-100 blur-0'}`}>
            
            {(activeTaskObj.type !== 'Housekeeping' && activeTaskObj.type !== 'HSE') && (
              <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${scannedData.location ? 'bg-emerald-950/40 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : scanStep === 'location' ? 'bg-slate-800 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)]' : 'bg-slate-800/30 border-slate-800 opacity-40'}`}>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Step 1: Bin Verification</p>
                  {scannedData.location && <span className="text-emerald-400 font-black text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">✓ LOCKED</span>}
                </div>
                <p className={`text-xl font-black ${scannedData.location ? 'text-emerald-300' : 'text-white'}`}>📍 {activeTaskObj.targetBin || activeTaskObj.zone}</p>
                
                {scanStep === 'location' && (
                  <button type="button" onClick={() => triggerHardwareScan('location')} className="mt-4 w-full py-4 bg-blue-600 text-white rounded font-black uppercase tracking-widest text-xs active:bg-blue-700 flex justify-center items-center gap-2 shadow-lg transition-colors">
                    <span className="text-lg">🔫</span> SCAN LOCATION
                  </button>
                )}
              </div>
            )}

            {(activeTaskObj.type !== 'Housekeeping' && activeTaskObj.type !== 'HSE') && (
              <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${scannedData.item ? 'bg-emerald-950/40 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : scanStep === 'item' ? 'bg-slate-800 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)]' : 'bg-slate-800/30 border-slate-800 opacity-40'}`}>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Step 2: SKU Validation</p>
                  {scannedData.item && <span className="text-emerald-400 font-black text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">✓ MATCHED</span>}
                </div>
                <p className={`text-lg font-black font-mono tracking-wide ${scannedData.item ? 'text-emerald-300' : 'text-blue-300'}`}>{activeTaskObj.sku || 'SKU-ARS-GENERIC'}</p>
                {activeTaskObj.qty && <p className="text-xs text-slate-400 font-bold mt-1">Target Qty: <span className="text-white text-sm">{activeTaskObj.qty}</span></p>}
                
                {scanStep === 'item' && (
                  <button type="button" onClick={() => triggerHardwareScan('item')} className="mt-4 w-full py-4 bg-blue-600 text-white rounded font-black uppercase tracking-widest text-xs active:bg-blue-700 flex justify-center items-center gap-2 shadow-lg transition-colors">
                    <span className="text-lg">🔫</span> SCAN ITEM BARCODE
                  </button>
                )}
              </div>
            )}

            <div className={`p-5 rounded-xl border-2 transition-all duration-300 text-center ${scanStep === 'evidence' ? 'bg-slate-800 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]' : 'bg-slate-800/30 border-slate-800 opacity-40'}`}>
              <span className="text-4xl block mb-3 opacity-80 drop-shadow-md">📸</span>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-4">Visual Proof Required</p>
              <button 
                type="button"
                disabled={scanStep !== 'evidence'}
                onClick={() => setActiveView('camera')} 
                className="w-full py-5 bg-amber-500 disabled:bg-slate-700 text-slate-950 disabled:text-slate-500 rounded-lg font-black uppercase tracking-widest text-sm active:bg-amber-600 shadow-xl transition-all"
              >
                LAUNCH CAMERA
              </button>
            </div>
            
            {/* EXCEPTION HANDLING */}
            {!isNotStarted && (
              <button 
                onClick={handleReportIssue}
                className="mt-6 w-full py-3 bg-red-950/30 text-red-400 border border-red-900/50 rounded font-bold text-[10px] uppercase tracking-widest"
              >
                ⚠️ Report Issue / Bin Full
              </button>
            )}

          </div>
        </div>
      </div>
    );
  };

  // ─── RENDER VIEW: CAMERA VIEW ───
  const renderCameraView = () => (
    <div className="flex-1 flex flex-col bg-black relative animate-fade-in">
      {cameraFlash && <div className="absolute inset-0 bg-white z-[99999] pointer-events-none transition-opacity duration-150"></div>}
      
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1586528116311-ad8ed7c83a7f?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-60 blur-[0.5px] scale-105"></div>
        
        <div className="absolute top-4 left-4 text-red-500 text-[8px] font-mono font-bold tracking-widest flex items-center gap-1 animate-pulse">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> REC
        </div>
        
        <div className="w-64 h-64 border border-white/20 relative z-10 flex items-center justify-center">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-yellow-400"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-yellow-400"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-yellow-400"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-yellow-400"></div>
          <div className="w-1 h-1 bg-yellow-400 rounded-full opacity-50"></div>
        </div>
      </div>
      
      <div className="h-32 bg-black shrink-0 flex justify-between items-center z-10 px-8 pb-4">
        <button onClick={() => setActiveView('detail')} className="text-white opacity-60 font-black uppercase text-[10px] tracking-widest hover:opacity-100 p-2">Abort</button>
        
        <div className="relative flex items-center justify-center">
          <div className="absolute w-20 h-20 rounded-full border-2 border-white/30 pointer-events-none"></div>
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); handleCapturePhotoExecute(); }} 
            className="relative z-20 w-16 h-16 rounded-full border-4 border-white bg-white/20 active:bg-white transition-all transform active:scale-90 shadow-[0_0_20px_rgba(255,255,255,0.4)] cursor-pointer"
          ></button>
        </div>
        
        <div className="w-10"></div>
      </div>
    </div>
  );

  // ─── RENDER VIEW: SUCCESS TRANSMISSION ───
  const renderSuccessView = () => (
    <div className="flex-1 flex flex-col bg-slate-950 items-center justify-center p-6 text-center text-white animate-fade-in relative overflow-hidden">
      <div className="absolute inset-0 bg-emerald-900/20 blur-3xl rounded-full scale-150"></div>

      <div className="relative z-10 flex flex-col items-center w-full">
        <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.4)] animate-[bounce_2s_ease-in-out_infinite]">
          <span className="text-slate-900 text-5xl font-black">✓</span>
        </div>
        <h2 className="text-2xl font-black uppercase tracking-widest text-white mb-2">Verified</h2>
        <p className="text-xs font-semibold text-emerald-400 mb-8 max-w-[200px] leading-relaxed">Telemetry & visual proof synchronized to DB.</p>
        
        <div className="w-full bg-slate-900/80 p-5 rounded-xl border border-slate-700 text-left mb-8 backdrop-blur-sm shadow-inner">
          <div className="flex justify-between items-end mb-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Ref ID</p>
            <p className="text-[10px] font-mono text-slate-400 font-bold">{activeTaskId}</p>
          </div>
          <div className="flex justify-between items-end border-t border-slate-800 pt-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Handling Time</p>
            <p className="font-mono text-xl font-bold text-emerald-400">{getHandlingTime()}</p>
          </div>
        </div>

        <button 
          type="button" 
          onClick={handleCompleteTaskSignOff} 
          className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-black uppercase tracking-[0.15em] text-sm shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95 transition-all"
        >
          SYNC TO CLOUD & CLOSE
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full flex items-center justify-center p-4 bg-[#f3f6f9]">
      <Toast toasts={toasts} removeToast={removeToast} />
      
      <div className="relative w-[360px] h-[720px] bg-slate-950 rounded-[3rem] p-3.5 shadow-[0_30px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)] border-[2px] border-slate-800 animate-fade-in">
        
        {/* Hardware Details */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-black rounded-full z-10 opacity-80 shadow-inner"></div>
        <div className="absolute top-10 right-20 w-2 h-2 bg-black rounded-full z-10 opacity-80 shadow-inner"></div>

        {/* Physical Scan Buttons */}
        <div className="absolute top-32 -left-2.5 w-1.5 h-20 bg-amber-500 rounded-l-md active:bg-amber-400 cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.5)]" onClick={() => scanStep && scanStep !== 'evidence' && activeTaskObj?.status === 'In Progress' && triggerHardwareScan(scanStep)}></div>
        <div className="absolute top-32 -right-2.5 w-1.5 h-20 bg-amber-500 rounded-r-md active:bg-amber-400 cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.5)]" onClick={() => scanStep && scanStep !== 'evidence' && activeTaskObj?.status === 'In Progress' && triggerHardwareScan(scanStep)}></div>
        <div className="absolute top-16 -right-2.5 w-1 h-10 bg-slate-700 rounded-r-md"></div>

        {/* DISPLAY FRAME */}
        <div className="w-full h-full bg-slate-900 rounded-[2.2rem] overflow-hidden flex flex-col relative border-2 border-black shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
          
          {scannerFlash && <div className="absolute inset-0 bg-red-600/50 z-[9999] pointer-events-none transition-opacity"></div>}

          <div className="h-7 bg-slate-950 w-full flex justify-between items-center px-6 text-[9px] font-mono font-bold text-white/90 shrink-0 z-50 select-none">
            <span>{time}</span>
            <div className="flex items-center gap-1.5 opacity-80">
              <span className="text-[8px]">VoLTE</span>
              <span className="text-[10px]">📶</span>
              <span>92%</span>
              <div className="w-4 h-2.5 border border-white/50 rounded-sm relative flex items-center p-[1px]">
                <div className="w-[90%] h-full bg-white rounded-[1px]"></div>
                <div className="absolute -right-[2px] top-1/2 -translate-y-1/2 w-0.5 h-1 bg-white/50 rounded-r-sm"></div>
              </div>
            </div>
          </div>

          {activeView === 'queue' && renderQueue()}
          {activeView === 'detail' && renderTaskExecution()}
          {activeView === 'camera' && renderCameraView()}
          {activeView === 'success' && renderSuccessView()}

          {/* Android Navigation */}
          <div className="h-10 bg-black w-full flex justify-around items-center shrink-0 select-none border-t border-slate-900/50">
            <div className="w-0 h-0 border-t-[7px] border-t-transparent border-r-[11px] border-r-white/30 border-b-[7px] border-b-transparent cursor-pointer active:scale-75 transition-transform" onClick={() => activeView !== 'queue' && setActiveView('queue')}></div>
            <div className="w-4 h-4 rounded-full border-[2.5px] border-white/30 cursor-pointer active:scale-75 transition-transform" onClick={() => setActiveView('queue')}></div>
            <div className="w-3.5 h-3.5 border-[2.5px] border-white/30 rounded-[3px] cursor-pointer active:scale-75 transition-transform"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScannerUI;