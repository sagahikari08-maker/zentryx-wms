import React, { useState, useContext, useMemo, useEffect } from 'react';
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

const ReturnsRMA = () => {
  // ─── 🚀 INJEKSI: Mengambil state global untuk manipulasi stok ───
  const { bahasa, inventoryData, setInventoryData } = useContext(AppContext);

  // Helper Date
  const getDynamicDate = (daysOffset) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
  };

  // 1. DATA MASTER RETURNS (ARUS MOTORS EV REVERSE LOGISTICS)
  const initialReturns = [
    { id: 'RMA-ARS-001', date: getDynamicDate(-1), entity: 'ARUS Dealer - South JKT', sku: 'SKU-ARS-LFP01', item: 'Blade Battery Cell 3.2V (Swollen)', qty: 2, reason: 'Thermal Degradation / Swelling', status: 'Pending Triage', resolution: '-' },
    { id: 'RMA-ARS-002', date: getDynamicDate(-2), entity: 'Assembly Line C', sku: 'SKU-ARS-MCU03', item: 'Motor Control Unit Gen 3', qty: 5, reason: 'Software Calibration Failure', status: 'Disposed', resolution: 'Scrapped / E-Waste' },
    { id: 'RMA-ARS-003', date: getDynamicDate(0), entity: 'Aptiv Wiring Systems', sku: 'SKU-ARS-CBL12', item: 'HV Harness Cable 50mm2', qty: 30, reason: 'Connector Pin Defect (Vendor)', status: 'Pending Triage', resolution: '-' },
    { id: 'RMA-ARS-004', date: getDynamicDate(-5), entity: 'ARUS Dealer - North JKT', sku: 'SKU-ARS-SNT01', item: 'ADAS Telemetry Sensor Kit', qty: 1, reason: 'Lens Scratched During Transit', status: 'Restocked', resolution: 'Refurbished & Restocked' },
  ];

  const [returns, setReturns] = useState(() => {
    try {
      const saved = window.localStorage.getItem('returnsRma_ARUS');
      return saved ? JSON.parse(saved) : initialReturns;
    } catch {
      return initialReturns;
    }
  });

  // ─── PEMBERSIH DATA LAMA ───
  useEffect(() => {
    const hasOldData = returns.some(r => r.sku.includes('CHE-') || r.sku.includes('PIZ-') || r.id.includes('2606'));
    if (hasOldData) setReturns(initialReturns);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('returnsRma_ARUS', JSON.stringify(returns));
    } catch (error) {
      console.error('Failed to save RMA data:', error);
    }
  }, [returns]);

  // 2. STATE INTERAKTIF
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [toasts, setToasts] = useState([]);
  
  // State Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resolveModal, setResolveModal] = useState({ isOpen: false, item: null });
  const [rmaModal, setRmaModal] = useState({ isOpen: false, data: null });
  
  const [form, setForm] = useState({ 
    date: new Date().toISOString().split('T')[0], 
    entity: '', sku: '', item: '', qty: '', reason: 'Transit Damage' 
  });

  // 3. FUNGSI TOAST
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // 4. FUNGSI LOG NEW RETURN
  const handleLogReturn = (e) => {
    e.preventDefault();
    if (!form.sku || !form.item || !form.entity) {
      addToast('SKU, Item Name, and Source Entity are mandatory!', 'error');
      return;
    }

    const nextNum = returns.length > 0 ? Math.max(...returns.map(r => parseInt(r.id.split('-')[2]) || 0)) + 1 : 1;
    const newId = `RMA-ARS-${nextNum.toString().padStart(3, '0')}`;
    
    setReturns([{ 
      id: newId, 
      ...form, 
      qty: parseInt(form.qty) || 1,
      status: 'Pending Triage',
      resolution: '-'
    }, ...returns]);
    
    setIsModalOpen(false);
    setForm({ date: new Date().toISOString().split('T')[0], entity: '', sku: '', item: '', qty: '', reason: 'Transit Damage' });
    addToast(`Reverse Logistics Manifest ${newId} logged successfully. Awaiting QC Triage.`, 'success');
  };

  // 5. 🚀 ENGINE INTERLOCK: RESOLVE RMA DENGAN INVENTORY SYNC
  const handleResolveRMA = (resolutionType) => {
    const { item } = resolveModal;
    let newStatus = '';
    let resolutionText = '';
    let toastType = 'success';

    if (resolutionType === 'RESTOCK') {
      newStatus = 'Restocked';
      resolutionText = 'Refurbished & Restocked';
      
      // 💥 INJEKSI: Mengembalikan stok ke inventory!
      if (setInventoryData) {
        setInventoryData(prevInv => {
          let newInv = [...prevInv];
          const existsIndex = newInv.findIndex(i => i.sku === item.sku);
          if (existsIndex >= 0) {
            newInv[existsIndex].qty += item.qty;
          } else {
            // Kalau barangnya belum ada di inventory (mungkin SKU baru), tambahkan
            newInv.push({
              sku: item.sku,
              name: item.item,
              qty: item.qty,
              category: 'RMA Replenishment',
              location: 'RMA Holding Area',
              price: 0
            });
          }
          return newInv;
        });
      }
      
    } else if (resolutionType === 'DISPOSE') {
      newStatus = 'Disposed';
      resolutionText = 'HAZMAT / Scrapped E-Waste';
      toastType = 'error';
    } else if (resolutionType === 'RTV') {
      newStatus = 'Returned to Vendor';
      resolutionText = 'Warranty Claim (RTV)';
      toastType = 'info';
    }

    setReturns(returns.map(ret => ret.id === item.id ? { ...ret, status: newStatus, resolution: resolutionText } : ret));
    setResolveModal({ isOpen: false, item: null });
    addToast(`Triage completed for ${item.id}. Resolution: ${resolutionText}`, toastType);
  };

  // ─── FITUR EXPORT DATA UNTUK POWER BI / EXCEL ───
  const handleExportCSV = () => {
    addToast('Compiling Reverse Logistics Telemetry for Power BI...', 'info');
    const headers = ['RMA_ID', 'Logged_Date', 'Source_Entity', 'SKU_ID', 'Item_Description', 'Quantity', 'Reported_Reason', 'QC_Status', 'Resolution_Action'];
    const csvRows = [headers.join(',')];
    
    filteredData.forEach(r => {
      const row = [r.id, r.date, `"${r.entity}"`, r.sku, `"${r.item}"`, r.qty, `"${r.reason}"`, r.status, `"${r.resolution}"`];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `ARUS_ReverseLogistics_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => addToast('Data Model exported successfully!', 'success'), 800);
  };

  // ─── FITUR PRINT SLIP DENGAN AUTO-HAZMAT DETECTION ───
  const handlePrintSlip = (rma) => {
    addToast(`Generating Reverse Logistics routing slip for ${rma.id}...`, 'info');
    
    const isHazmat = rma.item.toLowerCase().includes('battery') || rma.item.toLowerCase().includes('coolant') || rma.item.toLowerCase().includes('cell');
    const hazmatWarning = isHazmat ? '\n!!! DANGER: CONTAINS HAZARDOUS / HIGH-VOLTAGE MATERIALS !!!\n!!! STRICT HANDLING PROTOCOL REQUIRED !!!\n' : '';

    const slipContent = `
==================================================
ARUS MOTORS GIGAFACTORY - RETURN AUTHORIZATION (RMA)
==================================================
RMA ID        : ${rma.id}
Date Logged   : ${rma.date}
--------------------------------------------------
FROM (ENTITY) : ${rma.entity}
--------------------------------------------------${hazmatWarning}
RETURNED COMPONENT DETAILS:
SKU           : ${rma.sku}
Item Name     : ${rma.item}
Quantity      : ${rma.qty} Units
Reason        : ${rma.reason}
--------------------------------------------------
QC STATUS     : ${rma.status.toUpperCase()}
RESOLUTION    : ${rma.resolution.toUpperCase()}
==================================================
Please attach this routing slip to the physical pallet.
Generated on  : ${new Date().toLocaleString()}
By            : Zentryx WMS (Chief Warehouse Manager)
==================================================
`;

    const blob = new Blob([slipContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `RMA_Gatepass_${rma.id}.txt`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => addToast('RMA Routing Slip generated successfully!', 'success'), 800);
  };

  // 6. SEARCH & FILTER ENGINE
  const filteredData = useMemo(() => {
    return returns.filter(r => {
      const matchesSearch = r.id.toLowerCase().includes(searchTerm.toLowerCase()) || r.item.toLowerCase().includes(searchTerm.toLowerCase()) || r.entity.toLowerCase().includes(searchTerm.toLowerCase()) || r.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'ALL' ? true : 
                            filterStatus === 'PENDING' ? r.status === 'Pending Triage' : 
                            r.status !== 'Pending Triage';
      return matchesSearch && matchesStatus;
    });
  }, [returns, filterStatus, searchTerm]);

  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 animate-fade-in">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>🔄 Operations</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Reverse Logistics</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide">
            {bahasa === 'en' ? 'Reverse Logistics & RMA Triage' : 'Logistik Balik & Triase RMA'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">Manage defective EV components, warranty claims, and hazmat e-waste routing.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button onClick={handleExportCSV} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2.5 rounded-sm text-xs font-bold transition-colors shadow-sm uppercase tracking-wider flex items-center justify-center gap-2 w-full md:w-auto">
            <span>⭳</span> Export BI Data
          </button>
          <button onClick={() => setIsModalOpen(true)} className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-5 py-2.5 rounded-sm text-xs font-bold transition-colors shadow-sm uppercase tracking-wider flex items-center justify-center gap-2 w-full md:w-auto">
            <span>+</span> Log New Return
          </button>
        </div>
      </div>

      {/* ── METRICS SUMMARY ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
        <div className="bg-white p-5 border border-gray-200 shadow-sm rounded-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Total RMAs Processed</p>
          <p className="text-3xl font-black text-gray-900 mt-1 font-mono">{returns.length}</p>
          <p className="text-[9px] font-bold text-gray-400 mt-2 uppercase tracking-wider">Historical Logs</p>
        </div>
        <div className="bg-white p-5 border-l-4 border-l-amber-500 border border-y-gray-200 border-r-gray-200 shadow-sm rounded-sm relative overflow-hidden hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">Pending QC Triage</p>
          <p className="text-3xl font-black text-gray-800 mt-1 font-mono">{returns.filter(r => r.status === 'Pending Triage').length}</p>
          <p className="text-[9px] font-bold text-amber-600 mt-2 uppercase tracking-wider animate-pulse">Awaiting Technical Insp.</p>
        </div>
        <div className="bg-white p-5 border-l-4 border-l-emerald-500 border border-y-gray-200 border-r-gray-200 shadow-sm rounded-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Successfully Mitigated</p>
          <p className="text-3xl font-black text-gray-800 mt-1 font-mono">{returns.filter(r => r.status === 'Restocked' || r.status === 'Returned to Vendor').length}</p>
          <p className="text-[9px] font-bold text-emerald-600 mt-2 uppercase tracking-wider">Refurbished & Claimed</p>
        </div>
        <div className="bg-white p-5 border-l-4 border-l-red-600 border border-y-gray-200 border-r-gray-200 shadow-sm rounded-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-red-600 tracking-wider">Disposed / Scrapped</p>
          <p className="text-3xl font-black text-gray-800 mt-1 font-mono">{returns.filter(r => r.status === 'Disposed').length}</p>
          <p className="text-[9px] font-bold text-red-500 mt-2 uppercase tracking-wider">Capital Written-Off</p>
        </div>
      </div>

      {/* ── TOOLBAR (SEARCH & FILTER) ── */}
      <div className="bg-white p-3 border border-gray-300 shadow-sm rounded-sm mb-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {['ALL', 'PENDING', 'RESOLVED'].map(stat => (
            <button 
              key={stat} 
              onClick={() => setFilterStatus(stat)} 
              className={`px-4 py-1.5 text-xs font-bold uppercase rounded-sm border transition-colors shadow-sm ${filterStatus === stat ? 'bg-[#415a77] text-white border-[#415a77]' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-300'}`}
            >
              {stat}
            </button>
          ))}
        </div>
        <input 
          type="text" 
          placeholder="Search RMA ID, SKU, or Source Entity..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 px-4 py-1.5 rounded-sm text-sm outline-none focus:border-[#125ab2] w-full sm:w-80 transition-colors"
        />
      </div>

      {/* ── TABEL DATA RMA ── */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden flex flex-col">
        <div className="bg-slate-50 border-b border-gray-200 p-3 flex justify-between items-center">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-2">Reverse Logistics Master Ledger</h3>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
            <thead className="bg-[#f8f9fa] text-[#64748b] text-[10px] uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3 px-5 font-bold border-b w-40">RMA ID & DATE</th>
                <th className="py-3 px-5 font-bold border-b w-48">SOURCE ENTITY</th>
                <th className="py-3 px-5 font-bold border-b">COMPONENT DETAILS</th>
                <th className="py-3 px-5 font-bold border-b text-center w-48">RETURN REASON</th>
                <th className="py-3 px-5 font-bold border-b text-center w-36">QC STATUS</th>
                <th className="py-3 px-5 font-bold border-b text-center w-36">ACTION</th>
              </tr>
            </thead>
            <tbody className="text-[12px] text-gray-700">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400 font-bold italic">
                    <span className="text-3xl block mb-2 opacity-50">📭</span>
                    No reverse logistics records match your query.
                  </td>
                </tr>
              ) : (
                filteredData.map((ret, idx) => {
                  const isHazmat = ret.item.toLowerCase().includes('battery') || ret.item.toLowerCase().includes('coolant') || ret.item.toLowerCase().includes('cell');
                  return (
                    <tr key={idx} className={`border-b border-gray-100 transition-colors ${ret.status === 'Pending Triage' ? 'bg-amber-50/50 hover:bg-amber-50' : 'hover:bg-blue-50/40'}`}>
                      <td className="py-4 px-5">
                        <div 
                          className="font-mono font-black text-[#125ab2] cursor-pointer hover:underline text-[13px] flex items-center gap-1.5"
                          onClick={() => setRmaModal({ isOpen: true, data: ret })}
                          title="View Digital RMA Manifest"
                        >
                          <span className="text-base">📄</span> {ret.id}
                        </div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">{ret.date}</div>
                      </td>
                      <td className="py-4 px-5 font-bold text-gray-800">{ret.entity}</td>
                      <td className="py-4 px-5">
                        <div className="font-black text-gray-900 flex items-center gap-2">
                          {ret.item}
                          {isHazmat && <span className="bg-red-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-sm animate-pulse tracking-widest">HAZMAT</span>}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1 font-bold uppercase tracking-wider">
                          SKU: <span className="font-mono text-[#125ab2]">{ret.sku}</span> | QTY: <strong className="text-gray-800">{ret.qty}</strong>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-center">
                        <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-sm text-[10px] uppercase tracking-wider shadow-sm">
                          {ret.reason}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-center">
                        <span className={`px-2 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-wider border shadow-sm ${
                          ret.status === 'Pending Triage' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                          ret.status === 'Restocked' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                          ret.status === 'Disposed' ? 'bg-red-100 text-red-800 border-red-300' :
                          'bg-blue-100 text-blue-800 border-blue-300'
                        }`}>
                          {ret.status}
                        </span>
                        {ret.status !== 'Pending Triage' && (
                          <div className="text-[9px] text-gray-500 mt-1.5 font-bold uppercase tracking-wider">{ret.resolution}</div>
                        )}
                      </td>
                      <td className="py-4 px-5 text-center">
                        {ret.status === 'Pending Triage' ? (
                          <button 
                            onClick={() => setResolveModal({ isOpen: true, item: ret })} 
                            className="bg-[#125ab2] text-white px-3 py-2 rounded-sm font-bold text-[10px] uppercase tracking-wider shadow-sm hover:bg-[#0e4487] w-full transition-colors"
                          >
                            Inspect & Triage
                          </button>
                        ) : (
                          <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">— CLEARED —</span>
                        )}
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
      {/* 🛡️ MODAL 1: LOG NEW RETURN / RMA (BULLETPROOF FLEXBOX)                    */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[550px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-[#125ab2]" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            <div className="bg-blue-50 text-gray-800 px-6 py-4 flex justify-between items-center border-b border-blue-100 shrink-0 z-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-gray-500">Reverse Logistics</p>
                <h3 className="font-black text-sm uppercase tracking-wider text-[#125ab2]">Log Incoming RMA Manifest</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-800 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <form onSubmit={handleLogReturn} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 text-sm flex flex-col gap-5">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Date Logged <span className="text-red-500">*</span></label>
                    <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] font-mono text-xs font-bold text-gray-700 rounded-sm cursor-pointer" required/>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Source Entity (Vendor/Line) <span className="text-red-500">*</span></label>
                    <input type="text" placeholder="e.g. Assembly Line B" value={form.entity} onChange={e => setForm({...form, entity: e.target.value})} className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] font-bold text-gray-800 rounded-sm" required autoFocus/>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 p-4 rounded-sm">
                  <p className="text-[10px] font-bold text-[#125ab2] uppercase tracking-wider mb-3 border-b border-gray-200 pb-2">Component Specifications</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">SKU ID <span className="text-red-500">*</span></label>
                      <input type="text" placeholder="SKU-ARS-..." value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] font-mono font-bold uppercase rounded-sm text-xs" required/>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Component Name <span className="text-red-500">*</span></label>
                      <input type="text" placeholder="e.g. LFP Battery Pack" value={form.item} onChange={e => setForm({...form, item: e.target.value})} className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] font-bold text-gray-800 rounded-sm" required/>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Returned QTY <span className="text-red-500">*</span></label>
                    <input type="number" min="1" placeholder="0" value={form.qty} onChange={e => setForm({...form, qty: e.target.value})} className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] font-black text-gray-900 rounded-sm" required/>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Reason for Return <span className="text-red-500">*</span></label>
                    <select value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] font-semibold text-gray-700 bg-white rounded-sm cursor-pointer">
                      <option>Transit Damage</option>
                      <option>Thermal Degradation / Swelling</option>
                      <option>Software Calibration Failure</option>
                      <option>Connector / Pin Defect</option>
                      <option>Wrong Item Shipped</option>
                    </select>
                  </div>
                </div>

              </div>
              
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 shrink-0 z-10">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm rounded-sm">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-[#125ab2] hover:bg-[#0e4487] text-white text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors rounded-sm">Commit RMA Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ MODAL 2: RESOLVE QC TRIAGE (BULLETPROOF FLEXBOX)                       */}
      {/* ========================================================================= */}
      {resolveModal.isOpen && resolveModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[500px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-amber-500" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            <div className="bg-amber-50 border-b border-amber-100 px-6 py-4 flex justify-between items-center shrink-0 z-10">
              <div>
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-0.5">Quality Control Hub</p>
                <h3 className="font-black text-sm uppercase tracking-wider text-amber-900">Technical Inspection Triage</h3>
              </div>
              <button onClick={() => setResolveModal({ isOpen: false, item: null })} className="text-amber-400 hover:text-amber-800 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 flex flex-col gap-5">
              
              <div className="bg-white border border-gray-200 p-5 rounded-sm shadow-sm">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-3">
                  <span className="text-gray-500 font-bold text-[10px] uppercase tracking-wider">Target RMA Manifest</span>
                  <span className="font-mono font-black text-[#125ab2] bg-blue-50 px-2 py-0.5 border border-blue-200 rounded-sm shadow-sm">{resolveModal.item.id}</span>
                </div>
                <p className="font-black text-lg text-gray-900 leading-tight mb-1">{resolveModal.item.item}</p>
                <p className="text-sm font-semibold text-gray-600 mb-4">Qty at Risk: <span className="font-black text-gray-900">{resolveModal.item.qty} units</span></p>
                
                <div className="bg-amber-50 p-3 rounded-sm border border-amber-200 flex items-start gap-2">
                  <span className="text-lg leading-none">⚠️</span>
                  <div>
                    <span className="text-[9px] font-bold text-amber-800 uppercase tracking-wider block mb-0.5">Reported Issue:</span>
                    <span className="font-bold text-amber-900 text-sm">{resolveModal.item.reason}</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase mb-3 text-center tracking-wider border-b border-gray-200 pb-2">Select Engineering Resolution Action</p>
                <div className="flex flex-col gap-3 mt-4">
                  <button onClick={() => handleResolveRMA('RESTOCK')} className="bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm flex justify-between items-center transition-colors">
                    <span className="flex items-center gap-2"><span>1.</span> Quality Cleared ➔ Refurbish & Restock</span>
                    <span className="text-base leading-none">✓</span>
                  </button>
                  <button onClick={() => handleResolveRMA('RTV')} className="bg-[#125ab2] hover:bg-[#0e4487] text-white p-3.5 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm flex justify-between items-center transition-colors">
                    <span className="flex items-center gap-2"><span>2.</span> Vendor Defect ➔ Warranty Claim (RTV)</span>
                    <span className="text-base leading-none">⭯</span>
                  </button>
                  <button onClick={() => handleResolveRMA('DISPOSE')} className="bg-red-600 hover:bg-red-700 text-white p-3.5 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm flex justify-between items-center transition-colors">
                    <span className="flex items-center gap-2"><span>3.</span> Fatal Damage ➔ HAZMAT / Scrap E-Waste</span>
                    <span className="text-base leading-none">✕</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ MODAL 3: DIGITAL RMA MANIFEST DOCUMENT (BULLETPROOF FLEXBOX)           */}
      {/* ========================================================================= */}
      {rmaModal.isOpen && rmaModal.data && (() => {
        const isHazmat = rmaModal.data.item.toLowerCase().includes('battery') || rmaModal.data.item.toLowerCase().includes('coolant') || rmaModal.data.item.toLowerCase().includes('cell');
        
        return (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
            <div className="bg-white rounded-sm w-full max-w-[500px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-[#125ab2]" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
              
              <div className="bg-blue-50 border-b border-blue-100 px-6 py-5 flex justify-between items-start shrink-0 z-10">
                <div>
                  <h3 className="font-black text-2xl text-[#125ab2] font-mono leading-none">{rmaModal.data.id}</h3>
                  <p className="text-[10px] font-bold text-gray-500 uppercase mt-1.5 tracking-widest">Return Authorization Routing Slip</p>
                </div>
                <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-sm border shadow-sm ${
                  rmaModal.data.status === 'Pending Triage' ? 'bg-amber-500 text-white border-amber-600' :
                  rmaModal.data.status === 'Restocked' ? 'bg-emerald-500 text-white border-emerald-600' :
                  rmaModal.data.status === 'Disposed' ? 'bg-red-600 text-white border-red-700' :
                  'bg-[#125ab2] text-white border-[#0e4487]'
                }`}>
                  {rmaModal.data.status}
                </span>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 text-sm text-gray-800 space-y-6">
                
                {isHazmat && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-sm flex items-center gap-3 shadow-inner mb-2">
                    <span className="text-3xl animate-pulse">☢️</span>
                    <div>
                      <p className="text-[10px] font-black text-red-700 uppercase tracking-wider mb-0.5">Danger: Hazmat Components</p>
                      <p className="text-[10px] font-semibold text-red-600 leading-relaxed">This manifest contains high-voltage or chemical materials. Follow strict disposal & containment protocols.</p>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="grid grid-cols-[110px_1fr] gap-2 items-center">
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Logged Date</p>
                    <p className="col-span-1 font-bold font-mono text-gray-900 border-b border-gray-100 pb-1">{rmaModal.data.date}</p>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] gap-2 items-center">
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Source Entity</p>
                    <p className="col-span-1 font-bold text-gray-900 border-b border-gray-100 pb-1">{rmaModal.data.entity}</p>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] gap-2 items-start">
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mt-1">Component</p>
                    <div className="col-span-1 border-b border-gray-100 pb-2">
                      <p className="font-black text-gray-900 leading-tight mb-1">{rmaModal.data.item}</p>
                      <span className="font-mono text-[10px] font-bold text-[#125ab2] bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-sm">SKU: {rmaModal.data.sku}</span> 
                    </div>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] gap-2 items-center">
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Quantity</p>
                    <p className="col-span-1 font-black text-lg text-gray-900">{rmaModal.data.qty} <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Units</span></p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 border border-gray-200 rounded-sm">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 border-b border-gray-200 pb-2">Diagnostic & Resolution Trail</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Client Reason:</span>
                      <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-xs">{rmaModal.data.reason}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Final Action:</span>
                      <span className={`font-bold text-[11px] uppercase tracking-wider ${rmaModal.data.resolution === '-' ? 'text-amber-500 animate-pulse' : 'text-gray-800'}`}>
                        {rmaModal.data.resolution !== '-' ? rmaModal.data.resolution : 'AWAITING QC TRIAGE...'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pseudo-Barcode for Realism */}
                <div className="flex flex-col items-center justify-center pt-4 opacity-50">
                  <div className="h-10 w-full bg-[repeating-linear-gradient(90deg,#000,#000_2px,transparent_2px,transparent_5px,#000_5px,#000_6px,transparent_6px,transparent_10px)]"></div>
                  <p className="font-mono text-[9px] font-bold tracking-[0.3em] mt-1.5">{rmaModal.data.id}</p>
                </div>

              </div>

              <div className="bg-gray-100 border-t border-gray-300 px-6 py-4 shrink-0 z-10 flex gap-3">
                <button 
                  onClick={() => handlePrintSlip(rmaModal.data)}
                  className="w-1/2 bg-white hover:bg-gray-50 text-gray-800 py-3 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm border border-gray-300 flex items-center justify-center gap-2"
                >
                  <span>🖨️</span> Print Routing Slip
                </button>
                <button 
                  onClick={() => setRmaModal({ isOpen: false, data: null })} 
                  className="w-1/2 bg-gray-800 hover:bg-black text-white py-3 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm"
                >
                  Close Manifest
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </main>
  );
};

export default ReturnsRMA;