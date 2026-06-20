import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from './AppContext';

// ─── TOAST COMPONENT (Notifikasi Sistem) ─────────────────────────────────────
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
    {toasts.map(({ id, message, type }) => (
      <div key={id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-sm shadow-xl text-white text-xs font-semibold min-w-[280px] border-l-4 ${
        type === 'success' ? 'bg-emerald-600 border-emerald-800' : type === 'error' ? 'bg-red-600 border-red-800' : 'bg-amber-500 border-amber-700'
      }`}>
        <span className="text-base">{type === 'success' ? '✓' : type === 'error' ? '🚨' : '⚠'}</span>
        <span className="flex-1">{message}</span>
        <button onClick={() => removeToast(id)} className="opacity-70 hover:opacity-100 text-lg leading-none">×</button>
      </div>
    ))}
  </div>
);

// ─── MOCK DATABASE MASTER DATA (ARUS MOTORS) ─────────────────────────────────
const activeBOMs = {
  'BOM-ARS-P01': { fgSku: 'SKU-ARS-EVPLATFORM', fgName: 'ARUS EV Skateboard Platform (Series 1)', components: [{sku: 'SKU-ARS-CHZ04', qtyNeeded: 1}, {sku: 'SKU-ARS-MCU03', qtyNeeded: 2}] },
  'BOM-ARS-B01': { fgSku: 'SKU-ARS-BATPAC', fgName: 'ARUS Modular Battery Pack 75kWh', components: [{sku: 'BATT-LFP-75K', qtyNeeded: 10}] }
};

const initialWorkOrders = [
  { id: 'WO-ARS-5001', bomId: 'BOM-ARS-P01', fgName: 'ARUS EV Skateboard Platform (Series 1)', qty: 20, completedQty: 20, status: 'Completed', dueDate: '2026-09-10', createdBy: 'Production Planner' },
  { id: 'WO-ARS-5002', bomId: 'BOM-ARS-B01', fgName: 'ARUS Modular Battery Pack 75kWh', qty: 150, completedQty: 65, status: 'In Progress', dueDate: '2026-09-25', createdBy: 'Production Planner' },
  { id: 'WO-ARS-5003', bomId: 'BOM-ARS-P01', fgName: 'ARUS EV Skateboard Platform (Series 1)', qty: 50, completedQty: 0, status: 'Released', dueDate: '2026-09-28', createdBy: 'Engineering' },
  { id: 'WO-ARS-5004', bomId: 'BOM-ARS-B01', fgName: 'ARUS Modular Battery Pack 75kWh', qty: 300, completedQty: 0, status: 'Material Shortage', dueDate: '2026-10-05', createdBy: 'Production Planner' },
];

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const WorkOrders = () => {
  // ─── 🚀 INJEKSI: Mengambil dispatchAutoTask dan inventoryData ───
  const { bahasa, dispatchAutoTask, inventoryData } = useContext(AppContext);

  // 1. STATE MANAGEMENT
  const [workOrders, setWorkOrders] = useState(() => {
    try {
      const saved = window.localStorage.getItem('woData_ARUS_Motors');
      return saved ? JSON.parse(saved) : initialWorkOrders;
    } catch {
      return initialWorkOrders;
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [toasts, setToasts] = useState([]);
  
  // Drill-down & Modal State
  const [selectedWO, setSelectedWO] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Form State
  const [newWorkOrder, setNewWorkOrder] = useState({
    id: '', bomId: '', fgName: '', qty: '', dueDate: '', status: 'Released'
  });
  const [formErrors, setFormErrors] = useState({});
  const [materialCheck, setMaterialCheck] = useState(null); // Menyimpan status simulasi ketersediaan bahan

  // Simpan ke LocalStorage & Pembersih Pizza
  useEffect(() => {
    const hasPizzaData = workOrders.some(wo => wo.bomId?.includes('-PZ-') || wo.fgName?.toLowerCase().includes('pizza'));
    if (hasPizzaData) {
      setWorkOrders(initialWorkOrders);
    } else {
      window.localStorage.setItem('woData_ARUS_Motors', JSON.stringify(workOrders));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workOrders]);

  // 2. TOAST LOGIC
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // 3. STATS & FILTERING
  const filteredWO = useMemo(() => {
    let data = workOrders.filter(wo => 
      wo.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wo.bomId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wo.fgName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (statusFilter !== 'All') data = data.filter(wo => wo.status === statusFilter);
    return data;
  }, [workOrders, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: workOrders.length,
      inProgress: workOrders.filter(wo => wo.status === 'In Progress').length,
      released: workOrders.filter(wo => wo.status === 'Released').length,
      shortage: workOrders.filter(wo => wo.status === 'Material Shortage').length,
    };
  }, [workOrders]);

  // 4. ACTION HANDLERS
  const openCreateModal = () => {
    const autoGenId = `WO-ARS-${Math.floor(5000 + Math.random() * 4000)}`;
    setNewWorkOrder({ id: autoGenId, bomId: '', fgName: '', qty: '', dueDate: '', status: 'Released' });
    setMaterialCheck(null);
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  const resetNewWorkOrder = () => {
    setNewWorkOrder({ id: '', bomId: '', fgName: '', qty: '', dueDate: '', status: 'Released' });
    setMaterialCheck(null);
    setFormErrors({});
  };

  // Zentryx Smart Feature: BOM Selection Auto-fill
  const handleBomSelection = (bomId) => {
    if (activeBOMs[bomId]) {
      setNewWorkOrder({ ...newWorkOrder, bomId, fgName: activeBOMs[bomId].fgName });
      checkMaterialAvailability(newWorkOrder.qty, bomId);
    }
  };

  // ─── 🚀 ENGINE INTERLOCK: CEK MATERIAL DARI INVENTORY GLOBAL ───
  const checkMaterialAvailability = (qty, bom = newWorkOrder.bomId) => {
    if (!qty || !bom) {
      setMaterialCheck(null);
      return;
    }
    const targetQty = parseInt(qty, 10);
    const requiredComponents = activeBOMs[bom].components;
    
    let isShortage = false;
    let shortageDetails = [];

    // Validasi stok fisik per komponen berdasarkan BOM
    requiredComponents.forEach(comp => {
      const totalNeeded = comp.qtyNeeded * targetQty;
      const stockInWarehouse = (inventoryData || []).find(i => i.sku === comp.sku)?.qty || 0;
      
      if (stockInWarehouse < totalNeeded) {
        isShortage = true;
        shortageDetails.push(`${comp.sku} (Need: ${totalNeeded}, Stock: ${stockInWarehouse})`);
      }
    });

    if (isShortage) {
      setMaterialCheck({ status: 'Shortage', message: `Material Shortage: ${shortageDetails.join(', ')}` });
      setNewWorkOrder(prev => ({ ...prev, qty, status: 'Material Shortage' }));
    } else {
      setMaterialCheck({ status: 'Available', message: 'All required components are allocated and available in warehouse.' });
      setNewWorkOrder(prev => ({ ...prev, qty, status: 'Released' }));
    }
  };

  // ─── 🚀 ENGINE INTERLOCK: SIMPAN WO & LEMPAR TASK PICKING KE SCANNER ───
  const handleSaveWorkOrder = () => {
    const errors = {};
    if (!newWorkOrder.bomId) errors.bomId = 'BOM Selection is required';
    if (!newWorkOrder.qty || parseInt(newWorkOrder.qty) <= 0) errors.qty = 'Valid quantity is required';
    if (!newWorkOrder.dueDate) errors.dueDate = 'Due Date is required';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      addToast('Please complete all required fields correctly.', 'error');
      return;
    }

    const finalWO = {
      ...newWorkOrder,
      qty: parseInt(newWorkOrder.qty, 10),
      completedQty: 0,
      createdBy: 'Production Planner'
    };

    setWorkOrders([finalWO, ...workOrders]);
    setIsCreateModalOpen(false);
    
    if (finalWO.status === 'Material Shortage') {
      addToast(`Work Order ${finalWO.id} saved but locked due to Material Shortage.`, 'warning');
    } else {
      
      // 💥 TRIGGER INJEKSI: Lempar perintah pengambilan barang (Picking) ke Operator Gudang
      const bomData = activeBOMs[finalWO.bomId];
      bomData.components.forEach(comp => {
        dispatchAutoTask({
          type: 'Picking',
          desc: `Prod Line Supply: Pick ${comp.qtyNeeded * finalWO.qty} units of ${comp.sku}`,
          zone: comp.sku.includes('LFP') ? 'Zone B (Cold Storage)' : 'Zone A (Ambient)',
          assignee: 'Production Feeder Team',
          priority: 'High',
          isLocked: false, // Tidak butuh clearance, bisa langsung eksekusi
          dependency: 'None',
          sku: comp.sku,
          refId: finalWO.id,
          qty: comp.qtyNeeded * finalWO.qty,
          notes: `Raw Material fulfillment for Work Order: ${finalWO.id}`
        });
      });

      addToast(`Work Order ${finalWO.id} released! Material Picking tasks sent to Warehouse Scanners.`, 'success');
    }
    resetNewWorkOrder();
  };

  // Progress Bar Helper
  const getProgressWidth = (completed, total) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 animate-fade-in">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>⚙️ Manufacturing</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Production</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide">
            {bahasa === 'en' ? 'Work Orders (WO)' : 'Perintah Kerja Produksi'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {bahasa === 'en' ? 'Manage EV production schedules, track assembly execution, and monitor component allocation.' : 'Kelola jadwal produksi EV, lacak eksekusi perakitan, dan pantau alokasi komponen.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 px-4 py-2 rounded-sm shadow-sm text-xs font-bold transition-colors">
            ↓ Export Schedule
          </button>
          <button
            onClick={openCreateModal}
            className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-5 py-2 rounded-sm shadow-sm text-sm font-bold transition-colors flex items-center gap-2"
          >
            <span>+</span> {bahasa === 'en' ? 'New Work Order' : 'Buat WO Baru'}
          </button>
        </div>
      </div>

      {/* ── DASHBOARD STATS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <div className="bg-white border border-gray-200 p-4 shadow-sm border-l-4 border-l-[#415a77] flex justify-between items-center hover:shadow-md transition-shadow">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Total Active WOs</p>
            <h3 className="text-2xl font-black text-[#415a77]">{stats.total}</h3>
          </div>
          <div className="text-3xl opacity-20">📋</div>
        </div>
        <div className="bg-white border border-gray-200 p-4 shadow-sm border-l-4 border-l-blue-500 flex justify-between items-center hover:shadow-md transition-shadow">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Ready / Released</p>
            <h3 className="text-2xl font-black text-blue-600">{stats.released}</h3>
          </div>
          <div className="text-3xl opacity-20">🚀</div>
        </div>
        <div className="bg-white border border-gray-200 p-4 shadow-sm border-l-4 border-l-amber-500 flex justify-between items-center hover:shadow-md transition-shadow">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">In Progress (Assembly)</p>
            <h3 className="text-2xl font-black text-amber-600">{stats.inProgress}</h3>
          </div>
          <div className="text-3xl opacity-20">⚙️</div>
        </div>
        <div className="bg-white border border-gray-200 p-4 shadow-sm border-l-4 border-l-red-500 flex justify-between items-center hover:shadow-md transition-shadow">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Material Shortage</p>
            <h3 className="text-2xl font-black text-red-600">{stats.shortage}</h3>
          </div>
          <div className="text-3xl opacity-20">🚨</div>
        </div>
      </div>

      {/* ── SEARCH & FILTER ── */}
      <div className="bg-white border border-gray-300 shadow-sm p-3 mb-0 flex gap-2">
        <input 
          type="text"
          placeholder={bahasa === 'en' ? 'Search WO ID, BOM Ref, or Finished Good...' : 'Cari WO ID, Referensi BOM, atau Barang Jadi...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 border border-gray-300 px-3 py-1.5 text-xs outline-none focus:border-[#125ab2] transition-colors"
        />
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 px-3 py-1.5 text-xs font-bold outline-none bg-gray-50 text-gray-700 cursor-pointer"
        >
          <option value="All">All Status</option>
          <option value="Released">Released</option>
          <option value="In Progress">In Progress</option>
          <option value="Material Shortage">Material Shortage</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {/* ── TABLE AREA ── */}
      <div className="bg-white border border-gray-300 shadow-sm w-full overflow-hidden">
        <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex items-center gap-3 text-sm text-[#125ab2]">
          <span className="text-lg">ℹ️</span>
          <p className="font-semibold text-xs">{bahasa === 'en' ? 'Click WO ID to view production execution status and drill-down details.' : 'Klik WO ID untuk melihat status eksekusi produksi dan detail rincian.'}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-[#e5e5e5] text-[#666666] text-[11px] border-b border-gray-300 uppercase tracking-wider">
                <th className="py-3 px-4 font-bold w-32">WO ID</th>
                <th className="py-3 px-4 font-bold w-32">BOM REF</th>
                <th className="py-3 px-4 font-bold">TARGET ASSEMBLY (FG)</th>
                <th className="py-3 px-4 font-bold text-center w-24">TARGET QTY</th>
                <th className="py-3 px-4 font-bold w-48 text-center">PRODUCTION PROGRESS</th>
                <th className="py-3 px-4 font-bold w-32 text-center">DUE DATE</th>
                <th className="py-3 px-4 font-bold w-36 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody className="text-[12px] text-[#333333]">
              {filteredWO.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-gray-400 italic font-bold">No Work Orders found.</td>
                </tr>
              ) : (
                filteredWO.map((wo) => {
                  const progress = getProgressWidth(wo.completedQty, wo.qty);
                  return (
                    <tr key={wo.id} className={`border-b border-gray-100 transition-colors ${wo.status === 'Completed' ? 'bg-gray-50 opacity-60' : 'hover:bg-blue-50'}`}>
                      <td className="py-3 px-4">
                        <span onClick={() => setSelectedWO(wo)} className="text-[#125ab2] font-black cursor-pointer hover:underline">
                          {wo.id}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                          {wo.bomId}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-800">{wo.fgName}</td>
                      <td className="py-3 px-4 text-center font-black text-gray-800 text-sm">{wo.qty}</td>
                      
                      {/* FITUR 2: LIVE PROGRESS BAR */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${progress === 100 ? 'bg-emerald-500' : 'bg-[#125ab2]'}`} 
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <span className="text-[10px] font-bold text-gray-500 w-8 text-right">{progress}%</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center font-semibold text-gray-600">{wo.dueDate}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded-sm font-bold text-[9px] uppercase tracking-wider border ${
                          wo.status === 'Released' ? 'bg-blue-100 text-blue-700 border-blue-200' : 
                          wo.status === 'In Progress' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                          wo.status === 'Material Shortage' ? 'bg-red-100 text-red-700 border-red-200 animate-pulse' :
                          'bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}>
                          {wo.status}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🛡️ MODAL 1: CREATE NEW WORK ORDER (WITH SAFEGUARDS & SMART FILL)          */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-sm w-full max-w-[550px] shadow-2xl flex flex-col relative animate-fade-in" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            <div className="bg-[#415a77] text-white px-5 py-4 flex justify-between items-center shrink-0 z-10">
              <h3 className="font-black text-sm uppercase tracking-wider">
                {bahasa === 'en' ? 'Create New Work Order' : 'Buat Perintah Kerja Baru'}
              </h3>
              <button onClick={() => { resetNewWorkOrder(); setIsCreateModalOpen(false); }} className="text-gray-300 hover:text-white font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              
              <div className="bg-blue-50 border border-blue-200 text-blue-800 text-[10px] p-3 rounded-sm flex items-start gap-3 mb-5">
                <span className="text-xl leading-none">💡</span>
                <div className="leading-tight">
                  <strong className="text-[#125ab2]">Zentryx AI Planner:</strong> Pilih Target BOM. Saat Anda memasukkan Quantity, sistem akan memvalidasi ketersediaan material di gudang secara *real-time*.
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">WO Document ID</label>
                    <input type="text" className="w-full border border-gray-300 bg-gray-100 rounded-sm px-3 py-2 text-xs font-mono font-bold uppercase outline-none text-gray-500 cursor-not-allowed" value={newWorkOrder.id} readOnly />
                  </div>
                  <div>
                    <label className="block text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">Production Due Date <span className="text-red-500">*</span></label>
                    <input 
                      type="date" 
                      value={newWorkOrder.dueDate}
                      onChange={(e) => setNewWorkOrder({ ...newWorkOrder, dueDate: e.target.value })}
                      className={`w-full border rounded-sm px-3 py-2 text-xs font-bold outline-none focus:border-[#125ab2] ${formErrors.dueDate ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    />
                    {formErrors.dueDate && <p className="text-red-500 text-[10px] mt-1 font-bold">{formErrors.dueDate}</p>}
                  </div>
                </div>

                <div className="border border-gray-200 p-4 rounded-sm bg-gray-50">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Assembly Target Definition</p>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-xs font-bold mb-1">Select BOM (Recipe) <span className="text-red-500">*</span></label>
                    <select
                      value={newWorkOrder.bomId}
                      onChange={(e) => handleBomSelection(e.target.value)}
                      className={`w-full border rounded-sm px-3 py-2 text-xs font-mono font-bold uppercase outline-none cursor-pointer ${formErrors.bomId ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-[#125ab2] bg-white'}`}
                    >
                      <option value="" disabled>Select active BOM...</option>
                      {Object.keys(activeBOMs).map(bom => <option key={bom} value={bom}>{bom} - {activeBOMs[bom].fgName}</option>)}
                    </select>
                    {formErrors.bomId && <p className="text-red-500 text-[10px] mt-1 font-bold">{formErrors.bomId}</p>}
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-xs font-bold mb-1">Finished Good Assembly</label>
                    <input
                      type="text"
                      value={newWorkOrder.fgName}
                      placeholder="Auto-filled from BOM"
                      className="w-full border border-gray-300 bg-gray-200 rounded-sm px-3 py-2 text-xs font-semibold outline-none text-gray-600 cursor-not-allowed"
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-xs font-bold mb-1">Target Build Quantity <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      min="1"
                      value={newWorkOrder.qty}
                      onChange={(e) => checkMaterialAvailability(e.target.value)}
                      placeholder="e.g. 50 Units"
                      className={`w-full border rounded-sm px-3 py-2 text-base font-black outline-none focus:border-[#125ab2] ${formErrors.qty ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    />
                    {formErrors.qty && <p className="text-red-500 text-[10px] mt-1 font-bold">{formErrors.qty}</p>}
                  </div>
                </div>

                {/* FITUR 1: MATERIAL CHECKER FEEDBACK */}
                {materialCheck && (
                  <div className={`p-4 rounded-sm border-l-4 ${materialCheck.status === 'Shortage' ? 'bg-red-50 border-red-500' : 'bg-green-50 border-green-500'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{materialCheck.status === 'Shortage' ? '🚨' : '✅'}</span>
                      <p className={`font-black text-xs uppercase tracking-wider ${materialCheck.status === 'Shortage' ? 'text-red-700' : 'text-green-700'}`}>
                        {materialCheck.status === 'Shortage' ? 'Component Shortage Detected' : 'Materials Available'}
                      </p>
                    </div>
                    <p className={`text-[11px] font-semibold ml-6 ${materialCheck.status === 'Shortage' ? 'text-red-600' : 'text-green-600'}`}>
                      {materialCheck.message}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 shrink-0 z-10">
              <button onClick={() => { resetNewWorkOrder(); setIsCreateModalOpen(false); }} className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider shadow-sm rounded-sm transition-colors">
                {bahasa === 'en' ? 'Cancel' : 'Batal'}
              </button>
              <button onClick={handleSaveWorkOrder} className={`px-6 py-2.5 font-bold text-xs uppercase tracking-wider shadow-sm rounded-sm transition-colors ${newWorkOrder.status === 'Material Shortage' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-[#125ab2] hover:bg-[#0e4487] text-white'}`}>
                {newWorkOrder.status === 'Material Shortage' ? 'Lock WO (Shortage)' : 'Release Work Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ MODAL 2: DETAIL WORK ORDER (DRILL-DOWN)                                */}
      {/* ========================================================================= */}
      {selectedWO && (() => {
        const progress = getProgressWidth(selectedWO.completedQty, selectedWO.qty);
        return (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
            <div className="bg-white rounded-sm w-full max-w-[500px] shadow-2xl flex flex-col relative animate-fade-in" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
              
              <div className="bg-[#415a77] text-white px-5 py-4 flex justify-between items-center shrink-0 z-10">
                <h3 className="font-bold text-sm uppercase tracking-wider">Production Document: {selectedWO.id}</h3>
                <button onClick={() => setSelectedWO(null)} className="text-gray-300 hover:text-white font-bold text-xl leading-none px-2">✕</button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                
                <div className="flex justify-between items-start mb-6 border-b border-gray-200 pb-5">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Target Assembly</p>
                    <h4 className="font-black text-lg text-[#125ab2] mb-1 leading-tight pr-4">{selectedWO.fgName}</h4>
                    <span className="font-mono font-bold text-purple-700 text-[11px] bg-purple-50 px-2 py-1 rounded border border-purple-100 uppercase tracking-widest inline-block mt-1">
                      {selectedWO.bomId}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 border border-gray-200 p-3 rounded-sm text-center">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Target Qty</p>
                    <p className="text-2xl font-black text-gray-800">{selectedWO.qty}</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-sm text-center">
                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1">Due Date</p>
                    <p className="text-lg font-black text-blue-800 mt-1">{selectedWO.dueDate}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Production Progress</p>
                    <span className={`px-2 py-0.5 rounded-sm font-bold text-[10px] uppercase tracking-wider border ${
                        selectedWO.status === 'Released' ? 'bg-blue-100 text-blue-700 border-blue-200' : 
                        selectedWO.status === 'In Progress' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                        selectedWO.status === 'Material Shortage' ? 'bg-red-100 text-red-700 border-red-200 animate-pulse' :
                        'bg-emerald-100 text-emerald-700 border-emerald-200'
                      }`}>
                        {selectedWO.status}
                    </span>
                  </div>
                  
                  {/* DETAIL PROGRESS BAR */}
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-sm">
                    <div className="flex justify-between text-xs font-bold text-gray-700 mb-2">
                      <span>Completed: {selectedWO.completedQty}</span>
                      <span>Target: {selectedWO.qty}</span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
                      <div className={`h-full ${progress === 100 ? 'bg-emerald-500' : 'bg-[#125ab2]'}`} style={{ width: `${progress}%` }}></div>
                    </div>
                    <p className="text-right text-[10px] font-black text-gray-500">{progress}% ACH</p>
                  </div>
                </div>
                
                {selectedWO.status === 'Material Shortage' && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-sm flex items-start gap-3">
                    <span className="text-xl">🚨</span>
                    <div>
                      <p className="font-bold text-red-700 text-xs mb-1 uppercase tracking-wider">Production Halted</p>
                      <p className="text-[11px] text-red-600 font-semibold leading-relaxed">Work Order ini dikunci karena gudang tidak memiliki komponen yang cukup. Harap koordinasi dengan departemen Procurement.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 border-t border-gray-200 px-5 py-4 flex justify-end shrink-0 z-10">
                <button onClick={() => setSelectedWO(null)} className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold uppercase tracking-wider shadow-sm rounded-sm transition-colors">
                  Close Document
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </main>
  );
};

export default WorkOrders;