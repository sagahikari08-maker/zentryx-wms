import React, { useState, useContext, useCallback, useMemo } from 'react';
import { AppContext } from './AppContext';

// ─── TOAST COMPONENT ─────────────────────────────────────────────────────────
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
    {toasts.map(({ id, message, type }) => (
      <div key={id} className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl text-white text-xs font-semibold min-w-[280px] backdrop-blur-md bg-opacity-95 ${
        type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-rose-600' : type === 'warning' ? 'bg-amber-500' : 'bg-[#125ab2]'
      }`}>
        <span className="text-base">{type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠️' : '⚙️'}</span>
        <span className="flex-1">{message}</span>
        <button onClick={() => removeToast(id)} className="opacity-70 hover:opacity-100 text-lg leading-none transition-opacity">×</button>
      </div>
    ))}
  </div>
);

// ─── MOCK BOM DATA (Untuk rujukan komponen) ──────────────────────────────────
const activeBOMs = {
  'BOM-ARS-P01': [{sku: 'SKU-ARS-CHZ04', name: 'Chassis Frame', reqQty: 1}, {sku: 'SKU-ARS-MCU03', name: 'MCU Gen 3', reqQty: 2}],
  'BOM-ARS-B01': [{sku: 'BATT-LFP-75K', name: 'LFP Battery Packs', reqQty: 10}]
};

const AssemblyBuilds = () => {
  // ─── 🚀 INJEKSI: Memanggil AppContext untuk Sinkronisasi Lintas Modul ───
  const { setHalaman, taskData, inventoryData, setInventoryData } = useContext(AppContext);

  // ─── STATE MANAGEMENT ───
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // ─── 🚀 ENGINE INTERLOCK: FETCH DARI LOCALSTORAGE WORK ORDERS ───
  // Di dunia nyata ini query database. Karena simulasi, kita baca LocalStorage dari hasil WorkOrders.jsx
  const [rawWorkOrders, setRawWorkOrders] = useState(() => {
    try {
      const saved = window.localStorage.getItem('woData_ARUS_Motors');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // ─── 🚀 ENGINE INTERLOCK: MEMANTAU SCANNER OPERATOR GUDANG ───
  const workOrders = useMemo(() => {
    return rawWorkOrders.map(wo => {
      // Cari apakah ada Task Picking di Scanner Gudang untuk Work Order ini
      const relatedTasks = (taskData || []).filter(t => t.refId === wo.id && t.type === 'Picking');
      
      let isMaterialReady = false;
      let newStatus = wo.status;

      if (relatedTasks.length > 0) {
        // Jika SEMUA task picking untuk WO ini sudah "Completed" oleh operator scanner
        const allTasksCompleted = relatedTasks.every(t => t.status === 'Completed');
        if (allTasksCompleted && wo.status === 'Released') {
          isMaterialReady = true;
          newStatus = 'Ready to Build'; // Override status menjadi Ready to Build!
        } else if (!allTasksCompleted && wo.status === 'Released') {
          newStatus = 'Awaiting Materials'; // Kunci Mesin Pabrik, suruh tunggu gudang!
        }
      } else if (wo.status === 'Released') {
        // Jika tidak butuh picking (atau auto-cleared), langsung bisa di-build
        isMaterialReady = true;
        newStatus = 'Ready to Build';
      }

      return {
        ...wo,
        status: newStatus,
        isMaterialReady,
        targetSku: wo.bomId === 'BOM-ARS-P01' ? 'SKU-ARS-EVPLATFORM' : 'SKU-ARS-BATPAC',
        targetName: wo.fgName,
        targetQty: wo.qty,
        uom: 'Units',
        progress: wo.completedQty === wo.qty ? 100 : (wo.completedQty / wo.qty) * 100 || 0,
        line: wo.bomId === 'BOM-ARS-P01' ? 'Assembly Line A' : 'Battery Assembly Line',
        bom: (activeBOMs[wo.bomId] || []).map(comp => ({
          sku: comp.sku,
          name: comp.name,
          reqQty: comp.reqQty,
          // Baca stok riil dari gudang untuk UI (sekadar info)
          stock: (inventoryData || []).find(i => i.sku === comp.sku)?.qty || 0,
          bin: 'Auto-Routed'
        }))
      };
    });
  }, [rawWorkOrders, taskData, inventoryData]);

  // Modals State
  const [activeWO, setActiveWO] = useState(null);
  const [isKioskOpen, setIsKioskOpen] = useState(false);
  const [buildStep, setBuildStep] = useState(0); // 0: Allocate, 1: Building, 2: Done
  const [modalWO, setModalWO] = useState({ isOpen: false, data: null });

  // ─── ACTION HANDLERS ───
  const openWODetails = (wo) => {
    addToast(`Retrieving Work Order Document ${wo.id}...`, 'info');
    setTimeout(() => {
      setModalWO({ isOpen: true, data: wo });
    }, 400);
  };

  const openBuildKiosk = (wo) => {
    if (wo.status === 'Material Shortage') {
      return addToast(`Cannot start ${wo.id}. Components are missing from inventory!`, 'error');
    }
    if (wo.status === 'Awaiting Materials') {
      return addToast(`Cannot start. Waiting for Warehouse Operator to complete Picking tasks!`, 'warning');
    }
    setActiveWO(wo);
    setBuildStep(0);
    setIsKioskOpen(true);
    addToast(`Initializing Zentryx Assembly Kiosk for ${wo.id}...`, 'info');
  };

  const processBuildExecution = () => {
    if (buildStep === 0) {
      addToast('Allocating components from bins and securing inventory locks...', 'warning');
      setTimeout(() => {
        setBuildStep(1);
        
        // 🚀 INJEKSI: Update Status ke "In Progress" di DB WorkOrders
        const updatedWOs = rawWorkOrders.map(w => w.id === activeWO.id ? { ...w, status: 'In Progress' } : w);
        setRawWorkOrders(updatedWOs);
        window.localStorage.setItem('woData_ARUS_Motors', JSON.stringify(updatedWOs));

        addToast('Components allocated. Assembly in progress...', 'info');
      }, 1000);
    } else if (buildStep === 1) {
      addToast('Finalizing build and running QA validations...', 'warning');
      setTimeout(() => {
        setBuildStep(2);
        
        // ─── 🚀 ENGINE INTERLOCK: INVENTORY DEDUCTION & FG ADDITION ───
        if (setInventoryData) {
          setInventoryData(prevInv => {
            let newInv = [...prevInv];
            
            // 1. Kurangi Raw Materials
            activeWO.bom.forEach(comp => {
              const totalNeeded = comp.reqQty * activeWO.targetQty;
              newInv = newInv.map(i => i.sku === comp.sku ? { ...i, qty: Math.max(0, i.qty - totalNeeded) } : i);
            });

            // 2. Tambahkan Finished Good
            const fgExists = newInv.find(i => i.sku === activeWO.targetSku);
            if (fgExists) {
              newInv = newInv.map(i => i.sku === activeWO.targetSku ? { ...i, qty: i.qty + activeWO.targetQty } : i);
            } else {
              newInv.push({
                sku: activeWO.targetSku,
                name: activeWO.targetName,
                qty: activeWO.targetQty,
                category: 'Finished Goods',
                location: 'Outbound Staging',
                price: 0
              });
            }
            return newInv;
          });
        }

        // Update WO State to Completed
        const updatedWOs = rawWorkOrders.map(w => w.id === activeWO.id ? { ...w, status: 'Completed', completedQty: w.qty } : w);
        setRawWorkOrders(updatedWOs);
        window.localStorage.setItem('woData_ARUS_Motors', JSON.stringify(updatedWOs));

        addToast(`✅ Assembly Complete! ${activeWO.targetQty} Units of ${activeWO.targetSku} added to Finished Goods.`, 'success');
      }, 1500);
    }
  };

  const closeKiosk = () => {
    setIsKioskOpen(false);
    setActiveWO(null);
    setBuildStep(0);
  };

  return (
    <div className="bg-[#f3f6f9] min-h-screen px-4 py-6 md:px-8 font-sans text-slate-800">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER ── */}
      <div className="max-w-[1500px] mx-auto mb-6 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 pb-3 gap-4 animate-fade-in">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>⚙️ Manufacturing</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Execution</span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Assembly Builds (Work Orders)</h1>
        </div>
        
        <div className="flex gap-3">
          <button onClick={() => addToast('Refreshing MES (Manufacturing Execution System) sync...', 'info')} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 shadow-sm transition-colors">
            🔄 Sync MES
          </button>
          <button onClick={() => {addToast('Routing to Production Planner...', 'info'); setHalaman('workOrders');}} className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors">
            + Create Work Order
          </button>
        </div>
      </div>

      {/* ── METRICS DASHBOARD ── */}
      <div className="max-w-[1500px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-5 mb-6 animate-fade-in">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active WOs</p>
          <p className="text-3xl font-black text-[#125ab2] mt-1">{workOrders.filter(w => w.status !== 'Completed').length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Units Built (Today)</p>
          <p className="text-3xl font-black text-emerald-600 mt-1">15</p>
        </div>
        <div className="md:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-sm flex items-center justify-between text-white">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assembly Line Status</p>
            <p className="text-lg font-black text-emerald-400 mt-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              All Lines Operational
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[9px] font-bold text-slate-400 uppercase">OEE Efficiency</p>
            <p className="text-xl font-black text-white mt-0.5">94.2%</p>
          </div>
        </div>
      </div>

      {/* ── WORK ORDERS TABLE ── */}
      <div className="max-w-[1500px] mx-auto bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-fade-in">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Production Schedule</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-4 px-6">Work Order ID</th>
                <th className="py-4 px-6">Target Finished Good</th>
                <th className="py-4 px-6 text-center">Progress</th>
                <th className="py-4 px-6">Assembly Line</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-center">Execution</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {workOrders.map((wo) => (
                <tr key={wo.id} className={`border-b border-slate-50 transition-colors ${wo.status === 'Completed' ? 'bg-gray-50 opacity-60' : 'hover:bg-blue-50/30'}`}>
                  
                  <td className="py-4 px-6">
                    <div 
                      onClick={() => openWODetails(wo)}
                      className="font-black text-[#125ab2] mb-1 cursor-pointer hover:underline inline-block text-sm"
                      title="View Work Order Document"
                    >
                      {wo.id}
                    </div>
                    <div>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                        wo.priority === 'Critical' ? 'bg-rose-100 text-rose-700' : 
                        wo.priority === 'High' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {wo.priority} Priority
                      </span>
                    </div>
                  </td>

                  <td className="py-4 px-6">
                    <div className="font-bold text-slate-800 text-sm mb-0.5">{wo.targetName}</div>
                    <div className="flex items-center gap-2">
                      <span 
                        onClick={() => { addToast(`Viewing Finished Goods Master Data for ${wo.targetSku}...`, 'info'); setHalaman('invOverview'); }}
                        className="font-mono font-bold text-slate-400 cursor-pointer hover:text-[#125ab2] hover:underline"
                        title="View Master Data"
                      >
                        {wo.targetSku}
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="font-black text-slate-700">Target: {wo.targetQty} {wo.uom}</span>
                    </div>
                  </td>

                  <td className="py-4 px-6 w-48">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                      <span>Completion</span>
                      <span>{wo.progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full rounded-full ${wo.progress === 100 ? 'bg-emerald-500' : 'bg-[#125ab2]'}`} style={{ width: `${wo.progress}%` }}></div>
                    </div>
                  </td>

                  <td className="py-4 px-6 font-semibold text-slate-600">
                    {wo.line}
                  </td>

                  <td className="py-4 px-6 text-center">
                    <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      wo.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                      wo.status === 'Material Shortage' ? 'bg-rose-100 text-rose-700' :
                      wo.status === 'Awaiting Materials' ? 'bg-purple-100 text-purple-700 animate-pulse' :
                      wo.status === 'Ready to Build' ? 'bg-emerald-500 text-white shadow-sm' :
                      wo.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {wo.status}
                    </span>
                  </td>

                  <td className="py-4 px-6 text-center">
                    {wo.status === 'Completed' ? (
                      <button disabled className="bg-slate-100 text-slate-400 px-5 py-2 rounded-lg text-[10px] font-bold uppercase cursor-not-allowed">
                        Closed
                      </button>
                    ) : (
                      <button 
                        onClick={() => openBuildKiosk(wo)} 
                        className={`${wo.status === 'Material Shortage' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' : wo.status === 'Awaiting Materials' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-200' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-200'} text-white px-5 py-2 rounded-lg text-[10px] font-bold uppercase transition-all shadow-md transform hover:-translate-y-0.5`}
                      >
                        {wo.status === 'Material Shortage' ? 'Fix Shortage' : wo.status === 'Awaiting Materials' ? 'Track Material' : 'Build Kiosk'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {workOrders.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-16 text-center text-slate-500 font-bold">
                    <span className="text-3xl block mb-2 opacity-50">🏭</span>
                    No active production schedules found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          MODAL 1: WORK ORDER DOCUMENT PREVIEW
      ═══════════════════════════════════════════════════ */}
      {modalWO.isOpen && modalWO.data && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-[600px] shadow-2xl flex flex-col border-t-4 border-slate-800 overflow-hidden animate-fade-in">
            <div className="px-6 py-4 flex justify-between items-center bg-slate-50 border-b border-slate-100">
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider text-slate-800">Work Order Overview</h3>
                <p className="text-[10px] font-mono text-slate-500 mt-0.5">{modalWO.data.id}</p>
              </div>
              <button onClick={() => setModalWO({ isOpen: false, data: null })} className="text-slate-400 hover:text-slate-800 font-bold text-xl transition-colors">✕</button>
            </div>
            
            <div className="p-6">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5">
                <p className="text-[10px] font-bold text-[#125ab2] uppercase tracking-wider mb-1">Target Production</p>
                <p className="font-black text-slate-800 text-lg leading-tight">{modalWO.data.targetName}</p>
                <div className="flex justify-between items-end mt-2">
                  <p className="font-mono text-xs font-bold text-slate-500">{modalWO.data.targetSku}</p>
                  <p className="font-black text-slate-800">{modalWO.data.targetQty} <span className="text-[10px] text-slate-500 uppercase">{modalWO.data.uom}</span></p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Routing Line</span>
                  <span className="text-xs font-black text-slate-800">{modalWO.data.line}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Current Status</span>
                  <span className="text-xs font-black text-slate-800">{modalWO.data.status} ({modalWO.data.progress.toFixed(0)}%)</span>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Required Components (BOM Summary)</p>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-4 font-bold text-slate-500">Item</th>
                        <th className="py-2 px-4 font-bold text-slate-500 text-right">Qty/Unit</th>
                        <th className="py-2 px-4 font-bold text-[#125ab2] text-right">Total Req.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalWO.data.bom.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-50">
                          <td className="py-2 px-4">
                            <p className="font-bold text-slate-700 truncate max-w-[200px]" title={item.name}>{item.name}</p>
                            <p className="text-[9px] font-mono text-slate-400">{item.sku}</p>
                          </td>
                          <td className="py-2 px-4 text-right font-mono font-bold text-slate-500">{item.reqQty}</td>
                          <td className="py-2 px-4 text-right font-mono font-black text-[#125ab2]">{(item.reqQty * modalWO.data.targetQty).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-6 pt-4 flex justify-end">
                <button onClick={() => setModalWO({ isOpen: false, data: null })} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors">
                  Close Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          MODAL 2: ASSEMBLY BUILD KIOSK (EXECUTION)
      ═══════════════════════════════════════════════════ */}
      {isKioskOpen && activeWO && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col overflow-hidden animate-fade-in h-[80vh] max-h-[800px]">
            
            {/* Kiosk Header */}
            <div className="px-8 py-5 bg-[#125ab2] text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-black text-sm uppercase tracking-widest text-blue-200">Zentryx Assembly Kiosk</h3>
                <p className="text-xl font-bold mt-1">{activeWO.id} <span className="text-blue-300 mx-2">|</span> {activeWO.line}</p>
              </div>
              <button onClick={closeKiosk} className="text-blue-300 hover:text-white font-black text-2xl transition-colors">✕</button>
            </div>
            
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* Top Banner: Target info */}
              <div className="bg-blue-50/50 border-b border-blue-100 p-6 flex justify-between items-center shrink-0">
                <div>
                  <p className="text-[10px] font-black text-[#125ab2] uppercase tracking-wider mb-1">Target Finished Good</p>
                  <p className="text-2xl font-black text-slate-800">{activeWO.targetName}</p>
                  <p className="font-mono text-xs font-bold text-slate-500 mt-1">{activeWO.targetSku}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-[#125ab2] uppercase tracking-wider mb-1">Build Quantity</p>
                  <p className="text-4xl font-black text-slate-800">{activeWO.targetQty} <span className="text-lg text-slate-500">{activeWO.uom}</span></p>
                </div>
              </div>

              {/* Main Content: BOM & Allocation */}
              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-slate-50">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span>📋</span> Bill of Materials & Inventory Allocation
                </h4>
                
                <div className="space-y-3">
                  {activeWO.bom.map((component, idx) => {
                    const totalRequired = component.reqQty * activeWO.targetQty;
                    const hasStock = component.stock >= totalRequired;
                    
                    return (
                      <div key={idx} className={`bg-white border p-4 rounded-xl flex items-center justify-between shadow-sm transition-all ${hasStock ? 'border-slate-200' : 'border-rose-300 bg-rose-50/30'}`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span 
                              onClick={() => { addToast(`Checking stock details for ${component.sku} in ${component.bin}...`, 'info'); }}
                              className="font-mono font-bold text-slate-500 text-xs cursor-pointer hover:text-[#125ab2] hover:underline"
                            >
                              {component.sku}
                            </span>
                            {!hasStock && <span className="bg-rose-100 text-rose-700 text-[8px] font-black px-1.5 py-0.5 rounded uppercase animate-pulse">Shortage</span>}
                          </div>
                          <p className="font-bold text-slate-800 text-sm">{component.name}</p>
                        </div>
                        
                        <div className="flex items-center gap-8 text-right">
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Available Stock</p>
                            <p className={`text-lg font-black ${hasStock ? 'text-emerald-600' : 'text-rose-600'}`}>{component.stock.toLocaleString()}</p>
                          </div>
                          <div className="w-px h-8 bg-slate-200"></div>
                          <div className="w-24">
                            <p className="text-[9px] font-bold text-[#125ab2] uppercase">Qty Needed</p>
                            <p className="text-xl font-black text-slate-800">{totalRequired.toLocaleString()}</p>
                          </div>
                          <div className="w-8 flex justify-end">
                            {buildStep >= 1 ? (
                              <span className="text-xl text-emerald-500">✅</span>
                            ) : (
                              <span className="text-xl text-slate-300">⏳</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Kiosk Footer Controls */}
              <div className="p-6 bg-white border-t border-slate-200 shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${buildStep === 0 ? 'bg-amber-400 animate-pulse' : buildStep === 1 ? 'bg-blue-500 animate-bounce' : 'bg-emerald-500'}`}></div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {buildStep === 0 ? 'Awaiting Allocation' : buildStep === 1 ? 'Assembly In Progress' : 'Build Completed'}
                  </span>
                </div>
                
                <div className="flex gap-3">
                  <button onClick={closeKiosk} className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">
                    Close Kiosk
                  </button>
                  
                  {buildStep < 2 && (
                    <button 
                      onClick={processBuildExecution} 
                      className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-white shadow-lg transform transition-all hover:-translate-y-0.5 ${
                        buildStep === 0 ? 'bg-[#125ab2] hover:bg-[#0e4487] shadow-blue-200' : 
                        'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-200'
                      }`}
                    >
                      {buildStep === 0 ? 'Allocate & Start Build' : 'Complete Assembly'}
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AssemblyBuilds;