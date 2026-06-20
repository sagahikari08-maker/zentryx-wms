import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from './AppContext';

// ─── TOAST COMPONENT (Notifikasi Sistem) ─────────────────────────────────────
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
    {toasts.map(({ id, message, type }) => (
      <div key={id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-sm shadow-xl text-white text-xs font-semibold min-w-[280px] border-l-4 ${
        type === 'success' ? 'bg-green-600 border-green-800' : type === 'error' ? 'bg-red-600 border-red-800' : 'bg-orange-500 border-orange-700'
      }`}>
        <span className="text-base">{type === 'success' ? '✓' : type === 'error' ? '🚨' : '⚠'}</span>
        <span className="flex-1">{message}</span>
        <button onClick={() => removeToast(id)} className="opacity-70 hover:opacity-100 text-lg leading-none">×</button>
      </div>
    ))}
  </div>
);

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const CycleCounts = () => {
  // ─── 🚀 INJEKSI: Mengambil data inventory dan dispatchAutoTask ───
  const { bahasa, inventoryData, dispatchAutoTask } = useContext(AppContext);

  // ─── 🚀 ENGINE INTERLOCK: DYNAMIC MASTER DATA DARI INVENTORY GLOBAL ───
  const masterItemsDB = useMemo(() => {
    const db = {};
    (inventoryData || []).forEach(item => {
      db[item.sku] = {
        name: item.name,
        bin: item.location || 'ZONE-A-01',
        systemQty: item.qty || 0,
        cost: item.price || 150.00
      };
    });
    return db;
  }, [inventoryData]);

  // 1. STATE MASTER DATA OPNAME
  const [counts, setCounts] = useState(() => {
    const saved = window.localStorage.getItem('cycleCounts_ARUS');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'CC-ARS-2026-001', date: '2026-09-21', itemId: 'SKU-ARS-LFP01', itemName: 'Blade Battery Cell 3.2V 150Ah', bin: 'ZONE-B-01', systemQty: 4500, countedQty: null, variance: null, status: 'Scheduled', user: 'Admin Gudang', cost: 250.00 },
      { id: 'CC-ARS-2026-002', date: '2026-09-20', itemId: 'SKU-ARS-MCU03', itemName: 'Motor Control Unit (MCU) Gen 3', bin: 'ZONE-A-05', systemQty: 210, countedQty: 208, variance: -2, status: 'Discrepancy', user: 'Logistics Manager', cost: 850.00 },
      { id: 'CC-ARS-2026-003', date: '2026-09-19', itemId: 'SKU-ARS-CHZ04', itemName: 'Underbody Steel Chassis Frame', bin: 'ZONE-C-01', systemQty: 90, countedQty: 90, variance: 0, status: 'Verified', user: 'Stock Controller', cost: 1200.00 },
    ];
  });

  useEffect(() => {
    window.localStorage.setItem('cycleCounts_ARUS', JSON.stringify(counts));
  }, [counts]);

  // 2. STATE UI (Modal & Filter)
  const [isNewScheduleOpen, setIsNewScheduleOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null); // Modal Eksekusi Hitung Fisik
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [toasts, setToasts] = useState([]);

  // State Input Form Jadwal Baru
  const [scheduleForm, setScheduleForm] = useState({ itemId: '', itemName: '', bin: '', systemQty: 0, date: '', user: 'Admin Gudang' });
  
  // State Input Form Eksekusi Hitung Fisik Gudang
  const [physicalCountInput, setPhysicalCountInput] = useState('');

  // 3. TOAST LOGIC
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500); // Diperpanjang untuk notif panjang
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // 4. FILTERING & SEARCH LOGIC
  const filteredCounts = useMemo(() => {
    let data = counts.filter(c => 
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.itemId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.bin.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (statusFilter !== 'All') data = data.filter(c => c.status === statusFilter);
    return data;
  }, [counts, searchQuery, statusFilter]);

  // 5. METRIK RINGKASAN DATA (Inventory Accuracy Matrix)
  const stats = useMemo(() => {
    const totalAudited = counts.filter(c => c.status === 'Verified' || c.status === 'Discrepancy' || c.status === 'Critical Variance').length;
    const accurateCount = counts.filter(c => c.status === 'Verified').length;
    const accuracyRate = totalAudited > 0 ? (accurateCount / totalAudited) * 100 : 100;
    
    return {
      scheduled: counts.filter(c => c.status === 'Scheduled').length,
      discrepancy: counts.filter(c => c.status === 'Discrepancy' || c.status === 'Critical Variance').length,
      verified: counts.filter(c => c.status === 'Verified').length,
      accuracy: accuracyRate.toFixed(1)
    };
  }, [counts]);

  // 6. ACTION HANDLERS
  const handleItemLookup = (id) => {
    const target = id.toUpperCase();
    const item = masterItemsDB[target];
    if (item) {
      setScheduleForm({ 
        ...scheduleForm, 
        itemId: target, 
        itemName: item.name, 
        bin: item.bin, 
        systemQty: item.systemQty,
        date: new Date().toISOString().split('T')[0]
      });
    } else {
      setScheduleForm({ ...scheduleForm, itemId: target, itemName: '', bin: '', systemQty: 0 });
    }
  };

  const handleCreateSchedule = () => {
    if (!scheduleForm.itemId || !scheduleForm.date) {
      addToast('Item ID and Schedule Date are required!', 'error');
      return;
    }

    const newAudit = {
      id: `CC-ARS-${Math.floor(1000 + Math.random() * 9000)}`,
      date: scheduleForm.date,
      itemId: scheduleForm.itemId,
      itemName: scheduleForm.itemName || 'Manual Audit Item',
      bin: scheduleForm.bin.toUpperCase() || 'STAGE-01',
      systemQty: scheduleForm.systemQty,
      countedQty: null,
      variance: null,
      status: 'Scheduled',
      user: scheduleForm.user,
      cost: masterItemsDB[scheduleForm.itemId]?.cost || 1.00
    };

    setCounts([newAudit, ...counts]);
    setIsNewScheduleOpen(false);
    
    // ─── 🚀 ENGINE INTERLOCK: LEMPAR TASK KE SCANNER OPERATOR ───
    if (dispatchAutoTask) {
      dispatchAutoTask({
        type: 'Cycle Count',
        desc: `Blind count required for ${newAudit.itemName}`,
        zone: newAudit.bin,
        assignee: newAudit.user,
        priority: 'High',
        isLocked: false, // Bebas dieksekusi operator
        dependency: 'None',
        sku: newAudit.itemId,
        refId: newAudit.id,
        qty: 0, // Disembunyikan (Blind Count)
        notes: `System QTY is hidden. Proceed to bin and submit exact physical count.`
      });
    }

    addToast('New cycle count task scheduled & dispatched to Warehouse Scanner.', 'success');
    setScheduleForm({ itemId: '', itemName: '', bin: '', systemQty: 0, date: '', user: 'Admin Gudang' });
  };

  const handlePostPhysicalCount = () => {
    if (physicalCountInput === '') {
      addToast('Please enter the physical counted quantity!', 'error');
      return;
    }

    const physicalQty = parseInt(physicalCountInput, 10);
    if (physicalQty < 0) {
      addToast('Quantity cannot be negative.', 'error');
      return;
    }

    const systemQty = selectedBatch.systemQty;
    const varianceResult = physicalQty - systemQty;
    
    // SAFEGUARD MANAGER: CRITICAL VARIANCE CHECK (> 10% discrepancy)
    let finalStatus = 'Verified';
    let isCritical = false;

    if (varianceResult !== 0) {
      const variancePercentage = Math.abs(varianceResult / systemQty);
      if (variancePercentage > 0.1 || Math.abs(varianceResult * selectedBatch.cost) > 5000) {
        finalStatus = 'Critical Variance';
        isCritical = true;
      } else {
        finalStatus = 'Discrepancy';
      }
    }

    setCounts(counts.map(c => 
      c.id === selectedBatch.id 
        ? { ...c, status: finalStatus, countedQty: physicalQty, variance: varianceResult }
        : c
    ));

    if (varianceResult === 0) {
      addToast(`Batch ${selectedBatch.id} verified. Physical stock matches system perfectly!`, 'success');
    } else if (isCritical) {
      addToast(`CRITICAL ALARM: Variance exceeds 10% threshold or $5,000 value! Security/Management review required for ${selectedBatch.id}.`, 'error');
    } else {
      addToast(`Minor discrepancy found on ${selectedBatch.id}: ${varianceResult > 0 ? '+' : ''}${varianceResult} Units. Sent to ledger review.`, 'warning');
    }

    setSelectedBatch(null);
    setPhysicalCountInput('');
  };

  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 animate-fade-in">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>📋 Audit</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Control</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide">
            {bahasa === 'en' ? 'Cycle Counts (Stock Opname)' : 'Stock Opname / Pencatatan Fisik'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {bahasa === 'en' ? 'Audit and verify system quantities against EV components on the warehouse floor.' : 'Audit dan verifikasi kuantitas sistem dengan fisik komponen EV di gudang.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 px-4 py-2 rounded-sm shadow-sm text-xs font-bold transition-colors">
            🖨 {bahasa === 'en' ? 'Print Count Sheets' : 'Cetak Lembar Hitung'}
          </button>
          <button 
            onClick={() => setIsNewScheduleOpen(true)}
            className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-4 py-2 rounded-sm shadow-sm text-sm font-bold transition-colors"
          >
            + {bahasa === 'en' ? 'New Schedule' : 'Buat Jadwal Baru'}
          </button>
        </div>
      </div>

      {/* ── METRIK AKURASI GUDANG (POV CLIENT) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <div className="bg-white border border-gray-200 p-4 shadow-sm border-l-4 border-l-[#125ab2] flex justify-between items-center hover:shadow-md transition-shadow">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Inventory Accuracy Rate</p>
            <h3 className={`text-2xl font-black ${stats.accuracy >= 98 ? 'text-[#125ab2]' : 'text-orange-500'}`}>{stats.accuracy}%</h3>
          </div>
          <div className="text-2xl font-black text-gray-300">🎯</div>
        </div>
        <div className="bg-white border border-gray-200 p-4 shadow-sm border-l-4 border-l-blue-500 flex justify-between items-center hover:shadow-md transition-shadow">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Awaiting Audit</p>
            <h3 className="text-2xl font-black text-blue-600">{stats.scheduled} <span className="text-xs font-normal text-gray-400">SKUs</span></h3>
          </div>
          <div className="text-2xl font-black text-gray-300">📋</div>
        </div>
        <div className="bg-white border border-gray-200 p-4 shadow-sm border-l-4 border-l-green-500 flex justify-between items-center hover:shadow-md transition-shadow">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Verified / Match</p>
            <h3 className="text-2xl font-black text-green-600">{stats.verified} <span className="text-xs font-normal text-gray-400">Batches</span></h3>
          </div>
          <div className="text-2xl font-black text-gray-300">✅</div>
        </div>
        <div className="bg-white border border-gray-200 p-4 shadow-sm border-l-4 border-l-red-500 flex justify-between items-center hover:shadow-md transition-shadow">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Discrepancies Found</p>
            <h3 className="text-2xl font-black text-red-600">{stats.discrepancy} <span className="text-xs font-normal text-gray-400">Alerts</span></h3>
          </div>
          <div className="text-2xl font-black text-gray-300">🚨</div>
        </div>
      </div>

      {/* ── SEARCH & FILTER ── */}
      <div className="bg-white border border-gray-300 shadow-sm p-3 mb-0 flex gap-2">
        <input 
          type="text"
          placeholder="Search by Batch ID, Item SKU, or Bin Location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 border border-gray-300 px-3 py-1.5 text-xs outline-none focus:border-[#125ab2] transition-colors"
        />
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 px-3 py-1.5 text-xs outline-none bg-gray-50 text-gray-600 font-bold cursor-pointer"
        >
          <option value="All">All Status</option>
          <option value="Scheduled">Scheduled (Belum Dihitung)</option>
          <option value="Verified">Verified (Cocok)</option>
          <option value="Discrepancy">Discrepancy (Selisih Standar)</option>
          <option value="Critical Variance">Critical Variance (Selisih Parah)</option>
        </select>
      </div>

      {/* ── TABLE DATA ── */}
      <div className="bg-white border border-gray-300 shadow-sm w-full overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-[#e5e5e5] text-[#666666] text-[11px] border-b border-gray-300">
                <th className="py-3 px-4 font-bold w-32">BATCH ID</th>
                <th className="py-3 px-4 font-bold w-28">AUDIT DATE</th>
                <th className="py-3 px-4 font-bold w-48">COMPONENT DETAIL</th>
                <th className="py-3 px-4 font-bold text-center w-24">TARGET BIN</th>
                <th className="py-3 px-4 font-bold text-right w-24">SYS QTY</th>
                <th className="py-3 px-4 font-bold text-right w-24">PHYSICAL</th>
                <th className="py-3 px-4 font-bold text-right w-24">VARIANCE</th>
                <th className="py-3 px-4 font-bold w-32 text-center">STATUS</th>
                <th className="py-3 px-4 font-bold text-center w-32">ACTION</th>
              </tr>
            </thead>
            <tbody className="text-[12px] text-[#333333]">
              {filteredCounts.length === 0 ? (
                <tr><td colSpan="9" className="py-10 text-center text-gray-400 italic font-bold">No opname items found.</td></tr>
              ) : (
                filteredCounts.map((c) => (
                  <tr key={c.id} className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${c.status === 'Critical Variance' ? 'bg-red-50/30' : ''}`}>
                    <td className="py-3 px-4 font-black text-gray-800">{c.id}</td>
                    <td className="py-3 px-4 font-mono font-bold text-gray-500 text-[11px]">{c.date}</td>
                    <td className="py-3 px-4">
                      <span className="text-[#125ab2] font-black font-mono text-[12px] cursor-pointer hover:underline">{c.itemId}</span>
                      <p className="text-[10px] text-gray-500 font-semibold truncate w-48 mt-0.5">{c.itemName}</p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-gray-100 text-gray-700 border border-gray-300 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                        {c.bin}
                      </span>
                    </td>
                    
                    {/* SYSTEM QTY (Hidden if Scheduled in real life, but for Manager view we can show it here. Let's obscure it for realism) */}
                    <td className="py-3 px-4 text-right font-semibold text-gray-500">
                      {c.status === 'Scheduled' ? <span className="italic text-gray-300">Hidden</span> : c.systemQty.toLocaleString('en-US')}
                    </td>
                    
                    <td className="py-3 px-4 text-right font-black text-gray-800">
                      {c.countedQty !== null ? c.countedQty.toLocaleString('en-US') : <span className="text-gray-300">—</span>}
                    </td>
                    
                    {/* VARIANCE COLUMN */}
                    <td className={`py-3 px-4 text-right font-black text-sm`}>
                      {c.variance === null ? (
                        <span className="text-gray-300">—</span>
                      ) : c.variance === 0 ? (
                        <span className="text-green-600">0</span>
                      ) : (
                        <span className={c.variance < 0 ? 'text-red-600' : 'text-blue-600'}>
                          {c.variance > 0 ? '+' : ''}{c.variance}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-sm font-bold text-[9px] uppercase tracking-wider border ${
                        c.status === 'Verified' ? 'bg-green-100 text-green-700 border-green-200' : 
                        c.status === 'Discrepancy' ? 'bg-amber-100 text-amber-700 border-amber-200' : 
                        c.status === 'Critical Variance' ? 'bg-red-600 text-white border-red-700 shadow-sm animate-pulse' : 
                        'bg-blue-100 text-blue-700 border-blue-200'
                      }`}>
                        {c.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {c.status === 'Scheduled' ? (
                        <button 
                          onClick={() => setSelectedBatch(c)}
                          className="bg-[#2a9d8f] hover:bg-[#1e7166] text-white px-3 py-1.5 rounded-sm shadow-sm text-[10px] font-bold uppercase tracking-wider transition-colors w-full flex items-center justify-center gap-1"
                        >
                          <span>🔒</span> Start Count
                        </button>
                      ) : (
                        <button 
                          onClick={() => setSelectedBatch(c)}
                          className="text-gray-500 hover:text-gray-800 text-[10px] uppercase font-bold tracking-wider underline transition-colors"
                        >
                          View Results
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ MODAL 1: FORM SCHEDULING (BUAT JADWAL BARU) ═══ */}
      {isNewScheduleOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-sm w-full max-w-[450px] shadow-2xl overflow-hidden animate-fade-in">
            <div className="bg-[#415a77] text-white px-5 py-4 flex justify-between items-center">
              <h3 className="font-bold text-sm uppercase tracking-wider">Schedule Cycle Count</h3>
              <button onClick={() => setIsNewScheduleOpen(false)} className="text-gray-300 hover:text-white font-bold text-xl leading-none">✕</button>
            </div>
            
            <div className="p-6 text-sm flex flex-col gap-4">
              <div className="bg-blue-50 border border-blue-200 text-blue-800 text-[10px] p-3 rounded-sm flex gap-2">
                <span className="text-lg">💡</span>
                <span><strong>Smart Entry:</strong> Masukkan SKU komponen (e.g. <code>SKU-ARS-CBL12</code>) untuk memuat data lokasi rak target dari Inventory secara otomatis.</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Component SKU <span className="text-red-500">*</span></label>
                <input 
                  type="text" placeholder="e.g. SKU-ARS-CBL12" value={scheduleForm.itemId} 
                  onChange={e => handleItemLookup(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] font-mono font-bold uppercase text-sm"
                />
                <p className="text-[11px] text-[#125ab2] font-bold mt-1 ml-1">{scheduleForm.itemName}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Assigned Location</p>
                  <p className="font-mono font-bold text-gray-800 text-sm mt-0.5 bg-gray-50 p-2 border border-gray-200 rounded-sm text-center">{scheduleForm.bin || '---'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Current Book Qty</p>
                  <p className="font-black text-[#125ab2] text-sm mt-0.5 bg-blue-50 p-2 border border-blue-100 rounded-sm text-center">{scheduleForm.systemQty ? `${scheduleForm.systemQty.toLocaleString('en-US')} Units` : '---'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Audit Date <span className="text-red-500">*</span></label>
                  <input 
                    type="date" value={scheduleForm.date}
                    onChange={e => setScheduleForm({...scheduleForm, date: e.target.value})}
                    className="w-full border border-gray-300 px-2 py-1.5 outline-none focus:border-[#125ab2] text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Auditor (Assignee)</label>
                  <select 
                    value={scheduleForm.user}
                    onChange={e => setScheduleForm({...scheduleForm, user: e.target.value})}
                    className="w-full border border-gray-300 px-2 py-1.5 outline-none focus:border-[#125ab2] bg-white text-xs font-bold cursor-pointer"
                  >
                    <option value="Admin Gudang">Warehouse Admin</option>
                    <option value="Logistics Manager">Logistics Manager</option>
                    <option value="QA Inspector">QA Inspector</option>
                    <option value="Forklift Op 1">Forklift Op 1</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-2">
              <button onClick={() => setIsNewScheduleOpen(false)} className="px-5 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-bold uppercase tracking-wider transition-colors shadow-sm rounded-sm">Cancel</button>
              <button onClick={handleCreateSchedule} className="px-6 py-2 bg-[#2a9d8f] hover:bg-[#1e7166] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-colors rounded-sm">Confirm Schedule</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL 2: EKSEKUSI HITUNG FISIK (BLIND COUNT) & DRILL-DOWN DETAILS ═══ */}
      {selectedBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-sm w-[450px] shadow-2xl overflow-hidden animate-fade-in">
            <div className={`px-5 py-4 flex justify-between items-center text-white ${selectedBatch.status === 'Scheduled' ? 'bg-amber-600' : selectedBatch.status === 'Critical Variance' ? 'bg-red-700' : 'bg-[#415a77]'}`}>
              <h3 className="font-bold text-sm uppercase tracking-wider">
                {selectedBatch.status === 'Scheduled' ? 'Audit Execution (Blind Count)' : `Opname Card: ${selectedBatch.id}`}
              </h3>
              <button onClick={() => { setSelectedBatch(null); setPhysicalCountInput(''); }} className="text-white opacity-70 hover:opacity-100 font-bold text-xl leading-none">✕</button>
            </div>

            <div className="p-6 text-sm text-gray-700">
              <div className="mb-5 pb-4 border-b border-gray-100 text-center">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Target Component</span>
                <h4 className="font-black font-mono text-xl text-[#125ab2] leading-tight mt-1">{selectedBatch.itemId}</h4>
                <p className="font-semibold text-gray-700 text-sm mt-0.5">{selectedBatch.itemName}</p>
                <div className="mt-3 inline-block bg-gray-100 border border-gray-200 px-4 py-1.5 rounded-sm">
                  <span className="text-[10px] font-bold text-gray-500 uppercase mr-2">Loc:</span>
                  <span className="font-mono font-black text-gray-800">{selectedBatch.bin}</span>
                </div>
              </div>

              {/* JIKA STATUS JADWAL ADALAH SCHEDULED (FITUR BLIND COUNT AKTIF) */}
              {selectedBatch.status === 'Scheduled' ? (
                <>
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-sm flex items-start gap-3 mb-5">
                    <span className="text-xl">🔒</span>
                    <div>
                      <p className="text-xs font-black text-amber-800 uppercase tracking-wider mb-1">Blind Count Active</p>
                      <p className="text-[10px] text-amber-700 leading-relaxed">Book quantity (System Qty) is hidden to prevent pencil whipping. Please count the physical items accurately on the floor.</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-sm text-center">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Enter Physical Count <span className="text-red-500">*</span></label>
                    <input 
                      type="number" min="0" value={physicalCountInput}
                      onChange={(e) => setPhysicalCountInput(e.target.value)}
                      className="w-full max-w-[200px] mx-auto border-2 border-slate-300 p-3 outline-none focus:border-[#125ab2] focus:ring-2 focus:ring-blue-200 text-center font-black text-3xl text-[#125ab2] bg-white transition-all shadow-inner rounded-md"
                      placeholder="0"
                      autoFocus
                    />
                  </div>
                </>
              ) : (
                /* JIKA SUDAH DIPROSES, TAMPILKAN HASIL HISTORI AUDIT FINANSIAL */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 border border-gray-200 p-3 rounded-sm text-center shadow-sm">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">System Book Qty</p>
                      <p className="text-xl font-black text-gray-800 font-mono">{selectedBatch.systemQty.toLocaleString('en-US')}</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-sm text-center shadow-sm">
                      <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1">Physical Audited</p>
                      <p className="text-xl font-black text-blue-800 font-mono">{selectedBatch.countedQty.toLocaleString('en-US')}</p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-sm border ${selectedBatch.variance === 0 ? 'bg-green-50 border-green-200' : selectedBatch.status === 'Critical Variance' ? 'bg-red-50 border-red-300' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex justify-between items-center text-sm border-b border-white/50 pb-2 mb-2">
                      <span className="font-bold text-gray-700">Variance Discrepancy:</span>
                      <span className={`font-black text-lg font-mono ${selectedBatch.variance === 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {selectedBatch.variance > 0 ? '+' : ''}{selectedBatch.variance} Units
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-gray-700">Financial Impact:</span>
                      <span className={`font-black text-lg font-mono ${selectedBatch.variance === 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {selectedBatch.variance < 0 ? '-' : '+'}${Math.abs(selectedBatch.variance * selectedBatch.cost).toLocaleString('en-US', {minimumFractionDigits: 2})}
                      </span>
                    </div>
                  </div>

                  {selectedBatch.status === 'Critical Variance' && (
                    <div className="bg-red-600 text-white p-3 rounded-sm text-center shadow-sm animate-pulse">
                      <p className="text-xs font-black uppercase tracking-widest">🚨 Security / Manager Review Required</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-2">
              <button onClick={() => { setSelectedBatch(null); setPhysicalCountInput(''); }} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-xs font-bold uppercase tracking-wider shadow-sm hover:bg-gray-100 transition-colors rounded-sm">
                Close Card
              </button>
              {selectedBatch.status === 'Scheduled' && (
                <button onClick={handlePostPhysicalCount} className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-colors rounded-sm">
                  Post Opname Result
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default CycleCounts;