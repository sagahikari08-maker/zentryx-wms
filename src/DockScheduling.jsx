import React, { useState, useContext, useEffect, useMemo } from 'react';
import { AppContext } from './AppContext';

// ─── TOAST COMPONENT (Aman dari Bug Klik/Pointer Events) ─────────────────────
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
    {toasts.map(({ id, message, type }) => (
      <div key={id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-sm shadow-xl text-white text-xs font-semibold min-w-[280px] border-l-4 ${
        type === 'success' ? 'bg-emerald-600 border-emerald-800' : 
        type === 'error' ? 'bg-red-600 border-red-800' : 
        type === 'warning' ? 'bg-amber-500 border-amber-700' : 'bg-[#125ab2] border-blue-800'
      }`}>
        <span className="text-base">{type === 'success' ? '✓' : type === 'error' ? '🚨' : type === 'warning' ? '⚠️' : 'ℹ'}</span>
        <span className="flex-1">{message}</span>
        <button onClick={() => removeToast(id)} className="opacity-70 hover:opacity-100 text-lg leading-none">×</button>
      </div>
    ))}
  </div>
);

const DockScheduling = () => {
  // ─── 🚀 INJEKSI: Mengambil state global untuk Sync dengan SO dan PO ───
  const { bahasa, poData, setPoData, soData, setSoData } = useContext(AppContext);

  // 🚀 INJEKSI INTERLOCK: FILTER PO AKTIF UNTUK DROPDOWN
  const activePOs = useMemo(() => {
    return (poData || []).filter(po => po.status !== 'Received' && po.status !== 'Completed');
  }, [poData]);

  // 1. DATA MASTER DOCK (ARUS MOTORS GIGAFACTORY)
  const [docks] = useState([
    { id: 'BAY-01', name: 'Bay 1 (Heavy Duty / Chassis)', type: 'Structural' },
    { id: 'BAY-02', name: 'Bay 2 (Climate Control / HAZMAT)', type: 'Battery / Coolants' },
    { id: 'BAY-03', name: 'Bay 3 (Clean Room Access)', type: 'Electronics / MCU' },
    { id: 'BAY-04', name: 'Bay 4 (Outbound Dispatch)', type: 'RORO / General' },
  ]);

  // ─── 🚀 ENGINE INTERLOCK: PULL DATA DARI GLOBAL PO & SO SECARA DINAMIS ───
  const generatedSchedules = useMemo(() => {
    let combined = [];

    // Ambil Purchase Orders yang sudah dikirim ke vendor / punya ASN Date
    if (poData && poData.length > 0) {
      const activePOsFiltered = poData.filter(po => po.status === 'Sent to Vendor' || po.status === 'Pending');
      const poSchedules = activePOsFiltered.map((po, index) => {
        // Pseudo-random assignment untuk simulasi
        const dockAssignment = docks[index % 3]; 
        return {
          id: `DS-IN-${po.id.split('-').pop()}`,
          time: '10:00 AM', // Jam default
          duration: '60 Min',
          type: 'Inbound',
          entity: po.vendor,
          reference: po.id,
          dock: dockAssignment.id,
          dockName: dockAssignment.name,
          status: 'Scheduled',
          driver: 'Auto-Assigned Vendor Fleet',
          vehicle: 'Standard Freight Container'
        };
      });
      combined = [...combined, ...poSchedules];
    }

    // Ambil Sales Orders yang siap dikirim (Shipped)
    if (soData && soData.length > 0) {
      const activeSOs = soData.filter(so => so.status === 'Shipped');
      const soSchedules = activeSOs.map(so => {
        return {
          id: `DS-OUT-${so.id.split('-').pop()}`,
          time: '02:00 PM', // Jam default
          duration: '90 Min',
          type: 'Outbound',
          entity: so.customer,
          reference: so.id,
          dock: 'BAY-04', // Bay 4 khusus outbound
          dockName: 'Bay 4 (Outbound Dispatch)',
          status: 'Scheduled',
          driver: so.courier || 'Zentryx Partner Driver',
          vehicle: 'Flatbed Delivery Truck'
        };
      });
      combined = [...combined, ...soSchedules];
    }

    return combined;
  }, [poData, soData, docks]);


  // 2. DATA MASTER JADWAL (MENGGUNAKAN GABUNGAN LOCAL DAN GLOBAL)
  const initialSchedules = [
    { id: 'DS-ARS-101', time: '08:00 AM', duration: '90 Min', type: 'Inbound', entity: 'Krakatau Steel', reference: 'PO-2026-104', dock: 'BAY-01', dockName: 'Bay 1 (Heavy Duty / Chassis)', status: 'Docked / Active', driver: 'Budi (0812345)', vehicle: 'B 9012 XYZ - Flatbed Trailer' },
    { id: 'DS-ARS-102', time: '10:30 AM', duration: '60 Min', type: 'Inbound', entity: 'Contemporary Amperex Tech (CATL)', reference: 'PO-2026-105', dock: 'BAY-02', dockName: 'Bay 2 (Climate Control / HAZMAT)', status: 'Arrived at Gate', driver: 'Agus (0856789)', vehicle: 'D 8812 BB - Hazmat Container' },
  ];

  const [schedules, setSchedules] = useState(() => {
    try {
      const saved = window.localStorage.getItem('dockSchedules_ARUS');
      return saved ? JSON.parse(saved) : initialSchedules;
    } catch {
      return initialSchedules;
    }
  });

  // Gabungkan jadwal buatan manual dengan jadwal otomatis dari PO/SO
  const combinedSchedules = useMemo(() => {
    // Saring agar jadwal otomatis tidak tertimpa jika statusnya sudah diubah manual oleh Satpam (ada di state `schedules`)
    const manualAndModifiedSchedules = [...schedules];
    const autoSchedules = generatedSchedules.filter(auto => !schedules.some(man => man.id === auto.id));
    return [...manualAndModifiedSchedules, ...autoSchedules];
  }, [schedules, generatedSchedules]);


  // ─── PEMBERSIH DATA LAMA ───
  useEffect(() => {
    const hasOldData = schedules.some(s => s.entity.includes('Dough') || s.dock.includes('DK-'));
    if (hasOldData) setSchedules(initialSchedules);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('dockSchedules_ARUS', JSON.stringify(schedules));
    } catch (error) {
      console.error('Failed to save schedule data:', error);
    }
  }, [schedules]);

  // 3. STATE INTERAKTIF
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [toasts, setToasts] = useState([]);
  
  // STATE MODAL BOOKING & MODAL DOKUMEN
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ time: '', duration: '60 Min', type: 'Inbound', entity: '', reference: '', dock: 'BAY-01', driver: '', vehicle: '' });
  const [docModal, setDocModal] = useState({ isOpen: false, item: null });

  // 4. FUNGSI TOAST & AKSI YARD MANAGEMENT
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const updateStatus = (id, newStatus) => {
    // Validasi pencegahan tabrakan dok (Bottleneck Safeguard)
    const targetSchedule = combinedSchedules.find(s => s.id === id);

    if (newStatus === 'Docked / Active') {
      const isDockOccupied = combinedSchedules.some(s => s.dock === targetSchedule.dock && s.status === 'Docked / Active');
      if (isDockOccupied) {
        addToast(`GATING REJECTED: ${targetSchedule.dock} is currently occupied by another vehicle! Please wait until it is cleared.`, 'error');
        return;
      }
    }

    // Update state lokal untuk menyimpan perubahan status
    setSchedules(prev => {
      const exists = prev.find(s => s.id === id);
      if (exists) {
        return prev.map(s => s.id === id ? { ...s, status: newStatus } : s);
      } else {
        return [...prev, { ...targetSchedule, status: newStatus }];
      }
    });
    
    // ─── 🚀 ENGINE INTERLOCK: MEMBERI TAHU GUDANG JIKA TRUK TIBA! ───
    if (newStatus === 'Arrived at Gate' && targetSchedule.type === 'Inbound') {
      addToast(`Vehicle for ${id} has arrived. Performing manifest checks. Alerting ReceivePO.`, 'info');
      // Jika SetPoData ada (kita mengubah status PO agar tim ReceivePO bersiap)
      if (setPoData && targetSchedule.reference.startsWith('PO-')) {
        setPoData(prevPOs => prevPOs.map(po => po.id === targetSchedule.reference ? { ...po, status: 'Arrived at Dock' } : po));
      }
    } else if (newStatus === 'Docked / Active') {
      addToast(`Vehicle ${id} is now DOCKED. Unloading/Loading commenced.`, 'warning');
    } else if (newStatus === 'Completed') {
      addToast(`Manifest ${id} completed. Vehicle has departed the facility.`, 'success');
      // Jika SetSoData ada (kita mengubah status SO bahwa barang benar-benar sudah pergi dari Dock)
      if (setSoData && targetSchedule.type === 'Outbound' && targetSchedule.reference.startsWith('SO-')) {
        setSoData(prevSOs => prevSOs.map(so => so.id === targetSchedule.reference ? { ...so, status: 'Shipped' } : so));
      }
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    const selectedDock = docks.find(d => d.id === form.dock);
    const nextNum = schedules.length > 0 ? Math.max(...schedules.map(s => parseInt(s.id.split('-')[2]) || 0)) + 1 : 1;
    const newId = `DS-ARS-${nextNum.toString().padStart(3, '0')}`;
    
    setSchedules([...schedules, { 
      id: newId, 
      ...form, 
      dockName: selectedDock.name,
      status: 'Scheduled' 
    }]);
    
    setIsModalOpen(false);
    setForm({ time: '', duration: '60 Min', type: 'Inbound', entity: '', reference: '', dock: 'BAY-01', driver: '', vehicle: '' });
    addToast(`Gatepass ${newId} successfully scheduled into the Yard Management System!`, 'success');
  };

  // 5. ENGINE SINKRONISASI LIVE DOCK BAY
  const activeDocks = docks.map(dock => {
    const activeTruck = combinedSchedules.find(s => s.dock === dock.id && s.status === 'Docked / Active');
    return {
      ...dock,
      status: activeTruck ? 'Occupied' : 'Available',
      currentTruck: activeTruck ? activeTruck.vehicle.split(' - ')[0] : 'Empty',
      ref: activeTruck ? activeTruck.reference : ''
    };
  });

  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 animate-fade-in">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>🚛 Operations</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Logistics</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide">
            {bahasa === 'en' ? 'Dock Scheduling & Yard Management' : 'Manajemen Dok & Jadwal Truk'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">Real-time gate management to prevent bottlenecks and ensure JIT (Just-In-Time) compliance.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <input 
            type="date" 
            value={filterDate} 
            onChange={(e) => setFilterDate(e.target.value)} 
            className="border border-gray-300 px-4 py-2.5 rounded-sm text-xs outline-none focus:border-[#125ab2] font-bold text-gray-700 w-full md:w-auto cursor-pointer" 
          />
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-5 py-2.5 rounded-sm text-xs font-bold transition-colors shadow-sm uppercase tracking-wider flex items-center justify-center gap-2 w-full md:w-auto"
          >
            <span>+</span> Assign Dock Slot
          </button>
        </div>
      </div>

      {/* ── LIVE DOCK UTILIZATION (SINKRON OTOMATIS) ── */}
      <div className="mb-8">
        <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
          <span>📡</span> Live Dock Bay Telemetry
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {activeDocks.map((dock) => {
            const isOccupied = dock.status === 'Occupied';
            return (
              <div key={dock.id} className={`p-5 border shadow-sm rounded-sm flex flex-col justify-between transition-colors duration-500 ${isOccupied ? 'bg-red-50 border-red-300' : 'bg-white border-gray-300 hover:border-[#125ab2]'}`}>
                <div className="flex justify-between items-start mb-3 border-b border-gray-100 pb-3">
                  <div>
                    <span className={`font-black text-xl ${isOccupied ? 'text-red-800' : 'text-[#125ab2]'}`}>{dock.id}</span>
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">{dock.type}</p>
                  </div>
                  <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-sm border ${isOccupied ? 'bg-red-600 text-white border-red-700 shadow-sm animate-pulse' : 'bg-emerald-100 text-emerald-700 border-emerald-300'}`}>
                    {dock.status}
                  </span>
                </div>
                <div>
                  <p className={`text-xs font-black ${isOccupied ? 'text-red-900' : 'text-gray-800'}`}>{dock.name}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-2">Active Vehicle:</p>
                  <p className={`text-sm mt-0.5 ${isOccupied ? 'text-red-700 font-black font-mono' : 'text-gray-400 font-semibold'}`}>
                    {dock.currentTruck} {isOccupied && <span className="text-[9px] ml-1 bg-red-200 px-1 rounded">({dock.ref})</span>}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── TABEL JADWAL DOCK (YARD MANIFEST) ── */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden flex flex-col">
        <div className="bg-slate-50 border-b border-gray-200 p-4 flex justify-between items-center">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Today's Fleet Manifest</h3>
          <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest bg-white px-3 py-1.5 border border-gray-300 rounded-sm shadow-sm">
            Total Handled: {combinedSchedules.length} Trucks
          </span>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
            <thead className="bg-[#f8f9fa] text-[#64748b] text-[10px] uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3 px-5 font-bold border-b w-32">TIME & DUR.</th>
                <th className="py-3 px-5 font-bold border-b w-48">DOC. REF / TYPE</th>
                <th className="py-3 px-5 font-bold border-b">ENTITY / SUPPLIER</th>
                <th className="py-3 px-5 font-bold border-b">ASSIGNED DOCK</th>
                <th className="py-3 px-5 font-bold border-b">VEHICLE & DRIVER</th>
                <th className="py-3 px-5 font-bold border-b text-center w-36">SYSTEM STATUS</th>
                <th className="py-3 px-5 font-bold border-b text-center w-36">GATE ACTION</th>
              </tr>
            </thead>
            <tbody className="text-[12px] text-gray-700">
              {combinedSchedules.sort((a,b) => a.time.localeCompare(b.time)).map((item, idx) => (
                <tr key={idx} className={`border-b border-gray-100 transition-colors ${
                  item.status === 'Docked / Active' ? 'bg-red-50/30' : 
                  item.status === 'Arrived at Gate' ? 'bg-amber-50/40' : 
                  item.status === 'Completed' ? 'bg-gray-50 opacity-60 grayscale' : 'hover:bg-blue-50'
                }`}>
                  
                  <td className="py-4 px-5">
                    <div className="font-black text-gray-900 text-sm">{item.time}</div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase mt-0.5 tracking-wider">Est: {item.duration}</div>
                  </td>
                  
                  {/* --- DOC REF BISA DIKLIK --- */}
                  <td className="py-4 px-5">
                    <div 
                      className="font-mono font-black text-[#125ab2] cursor-pointer hover:underline text-[13px] flex items-center gap-1.5"
                      onClick={() => setDocModal({ isOpen: true, item: item })}
                      title="Open Digital Gatepass"
                    >
                      <span className="text-base">📄</span> {item.reference}
                    </div>
                    <div className={`inline-block mt-1.5 px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-widest border shadow-sm ${item.type === 'Inbound' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-purple-100 text-purple-800 border-purple-300'}`}>
                      {item.type}
                    </div>
                  </td>

                  <td className="py-4 px-5 font-bold text-gray-800">{item.entity}</td>
                  
                  <td className="py-4 px-5">
                    <div className="font-mono font-black text-gray-900">{item.dock}</div>
                    <div className="text-[9px] font-bold text-gray-500 uppercase mt-0.5">{item.dockName.split('(')[1]?.replace(')', '') || 'Standard'}</div>
                  </td>
                  
                  <td className="py-4 px-5">
                    <div className="font-bold text-gray-800">{item.vehicle}</div>
                    <div className="text-[10px] font-semibold text-gray-500 mt-0.5">Driver: <span className="font-bold text-gray-700">{item.driver}</span></div>
                  </td>
                  
                  <td className="py-4 px-5 text-center">
                    <span className={`px-2 py-1 rounded-sm text-[9px] font-black uppercase tracking-wider border shadow-sm ${
                      item.status === 'Scheduled' ? 'bg-white text-gray-600 border-gray-300' :
                      item.status === 'Arrived at Gate' ? 'bg-amber-500 text-white border-amber-600' :
                      item.status === 'Docked / Active' ? 'bg-red-600 text-white border-red-700 animate-pulse' :
                      'bg-gray-800 text-white border-black'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  
                  <td className="py-4 px-5 text-center">
                    {item.status === 'Scheduled' && (
                      <button onClick={() => updateStatus(item.id, 'Arrived at Gate')} className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-3 py-2 rounded-sm font-bold text-[9px] uppercase tracking-wider shadow-sm w-full transition-colors">
                        Security Check-In
                      </button>
                    )}
                    {item.status === 'Arrived at Gate' && (
                      <button onClick={() => updateStatus(item.id, 'Docked / Active')} className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-sm font-bold text-[9px] uppercase tracking-wider shadow-sm w-full transition-colors">
                        Assign to Dock
                      </button>
                    )}
                    {item.status === 'Docked / Active' && (
                      <button onClick={() => updateStatus(item.id, 'Completed')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-sm font-bold text-[9px] uppercase tracking-wider shadow-sm w-full transition-colors flex items-center justify-center gap-1">
                        <span>✓</span> Release Fleet
                      </button>
                    )}
                    {item.status === 'Completed' && (
                      <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">— CLEARED —</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🛡️ MODAL 1: NEW APPOINTMENT FORM (BULLETPROOF FLEXBOX)                    */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[600px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-[#125ab2]" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            <div className="bg-blue-50 text-gray-800 px-6 py-4 flex justify-between items-center border-b border-blue-100 shrink-0 z-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-gray-500">Yard Management</p>
                <h3 className="font-black text-sm uppercase tracking-wider text-[#125ab2]">Schedule Dock Appointment</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-800 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 text-sm flex flex-col gap-4">
                
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-5 rounded-sm border border-gray-200">
                  <div className="col-span-2 sm:col-span-1">
                    {/* 🚀 INJEKSI: SELECT DROPDOWN UNTUK ACTIVE PO */}
                    <label className="block text-[10px] font-bold text-[#125ab2] uppercase tracking-wider mb-1.5">Select Active PO <span className="text-red-500">*</span></label>
                    <select 
                      value={form.reference} 
                      onChange={e => {
                          const selectedPo = activePOs.find(p => p.id === e.target.value);
                          setForm({...form, reference: e.target.value, entity: selectedPo ? selectedPo.vendor : form.entity });
                      }}
                      className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] font-mono text-sm font-black text-gray-900 rounded-sm cursor-pointer" required
                    >
                      <option value="">-- Click to select Active PO --</option>
                      {activePOs.map(po => <option key={po.id} value={po.id}>{po.id} - {po.vendor}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Logistics Flow Type</label>
                    <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] font-bold text-xs bg-white rounded-sm cursor-pointer">
                      <option value="Inbound">Inbound (Receive)</option>
                      <option value="Outbound">Outbound (Dispatch)</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Entity (Vendor / Dealership) <span className="text-red-500">*</span></label>
                    <input type="text" placeholder="Auto-filled from PO" value={form.entity} onChange={e => setForm({...form, entity: e.target.value})} className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] font-semibold text-gray-800 rounded-sm bg-gray-50" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Assign Target Dock Door <span className="text-red-500">*</span></label>
                    <select value={form.dock} onChange={e => setForm({...form, dock: e.target.value})} className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] font-bold text-gray-800 bg-white rounded-sm cursor-pointer">
                      {docks.map(d => <option key={d.id} value={d.id}>{d.id} - {d.name}</option>)}
                    </select>
                    <p className="text-[9px] font-bold text-amber-600 uppercase tracking-wider mt-1.5 flex items-center gap-1"><span>⚠️</span> Verify payload compliance (Hazmat/Heavy) before assigning.</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Expected Arrival Time <span className="text-red-500">*</span></label>
                    <input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] font-black text-gray-800 rounded-sm cursor-pointer" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Est. Unload/Load Duration</label>
                    <select value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] font-semibold bg-white rounded-sm cursor-pointer text-xs">
                      <option>30 Min (Express)</option>
                      <option>60 Min (Standard)</option>
                      <option>90 Min (Heavy/Complex)</option>
                      <option>120 Min (Full Container)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Vehicle Plat & Classification <span className="text-red-500">*</span></label>
                    <input type="text" placeholder="e.g. B 1234 CD - Flatbed" value={form.vehicle} onChange={e => setForm({...form, vehicle: e.target.value})} className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] font-semibold rounded-sm text-xs" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Driver Details <span className="text-red-500">*</span></label>
                    <input type="text" placeholder="Name & Contact No." value={form.driver} onChange={e => setForm({...form, driver: e.target.value})} className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] font-semibold rounded-sm text-xs" required />
                  </div>
                </div>

              </div>
              
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 shrink-0 z-10">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm rounded-sm">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-[#125ab2] hover:bg-[#0e4487] text-white font-bold shadow-sm transition-colors text-[10px] uppercase tracking-wider rounded-sm">Confirm Gate Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ MODAL 2: DIGITAL GATEPASS DOCUMENT (BULLETPROOF FLEXBOX)               */}
      {/* ========================================================================= */}
      {docModal.isOpen && docModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[450px] shadow-2xl flex flex-col relative animate-fade-in" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            <div className={`px-6 py-5 flex justify-between items-start border-b shrink-0 z-10 ${docModal.item.type === 'Inbound' ? 'bg-emerald-50 border-emerald-200' : 'bg-purple-50 border-purple-200'}`}>
              <div>
                <h3 className={`font-black text-2xl font-mono leading-none ${docModal.item.type === 'Inbound' ? 'text-emerald-900' : 'text-purple-900'}`}>{docModal.item.reference}</h3>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1.5">Official {docModal.item.type} Gatepass</p>
              </div>
              <button onClick={() => setDocModal({ isOpen: false, item: null })} className="text-gray-400 hover:text-gray-800 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 text-gray-800 space-y-6">
              
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-sm border border-gray-200">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">System ID Code:</span>
                <span className="font-mono font-black text-gray-900">{docModal.item.id}</span>
              </div>

              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Partner Entity</p>
                  <p className="col-span-1 font-black text-gray-900 text-sm border-b border-gray-100 pb-1">{docModal.item.entity}</p>
                </div>
                
                <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Assigned Bay</p>
                  <div className="border-b border-gray-100 pb-1">
                    <span className="font-mono font-black text-[#125ab2] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{docModal.item.dock}</span>
                    <span className="text-[10px] text-gray-600 font-bold ml-2 uppercase tracking-wider">{docModal.item.dockName.split('(')[1]?.replace(')', '')}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Schedule Time</p>
                  <p className="font-black text-gray-900 border-b border-gray-100 pb-1">
                    {docModal.item.time} <span className="text-[10px] text-gray-400 font-bold uppercase ml-1 tracking-wider">(Est. {docModal.item.duration})</span>
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 border border-gray-200 rounded-sm">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 border-b border-gray-200 pb-2">Logistics & Fleet Telemetry</p>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Driver Contact</span>
                    <span className="font-bold text-gray-900">{docModal.item.driver}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Vehicle Details</span>
                    <span className="font-mono font-black text-gray-800 bg-white border border-gray-300 px-2 py-1 rounded-sm shadow-sm">{docModal.item.vehicle}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Current Status</span>
                    <span className={`px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-wider border shadow-sm ${
                      docModal.item.status === 'Scheduled' ? 'bg-white text-gray-600 border-gray-300' :
                      docModal.item.status === 'Arrived at Gate' ? 'bg-amber-500 text-white border-amber-600' :
                      docModal.item.status === 'Docked / Active' ? 'bg-red-600 text-white border-red-700 animate-pulse' :
                      'bg-gray-800 text-white border-black'
                    }`}>
                      {docModal.item.status}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Pseudo-Barcode for Realism */}
              <div className="flex flex-col items-center justify-center pt-2 opacity-60">
                <div className="h-12 w-full bg-[repeating-linear-gradient(90deg,#000,#000_2px,transparent_2px,transparent_5px,#000_5px,#000_6px,transparent_6px,transparent_10px)]"></div>
                <p className="font-mono text-[9px] font-bold tracking-[0.3em] mt-1">{docModal.item.id}</p>
              </div>

            </div>

            <div className="bg-gray-100 border-t border-gray-300 px-6 py-4 shrink-0 z-10">
              <button onClick={() => setDocModal({ isOpen: false, item: null })} className="w-full bg-gray-800 hover:bg-black text-white py-3 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-colors shadow-sm">
                Close Digital Gatepass
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
};

export default DockScheduling;