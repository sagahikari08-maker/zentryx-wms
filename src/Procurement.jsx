import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AppContext } from './AppContext';

// ─── TOAST COMPONENT (Aman dari Bug Klik/Pointer Events) ─────────────────────
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
    {toasts.map(({ id, message, type }) => (
      <div key={id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-sm shadow-xl text-white text-xs font-semibold min-w-[280px] border-l-4 ${
        type === 'success' ? 'bg-emerald-600 border-emerald-800' : 
        type === 'error' ? 'bg-red-600 border-red-800' : 
        type === 'warning' ? 'bg-amber-500 border-amber-800' : 
        type === 'info' ? 'bg-[#125ab2] border-blue-800' : 'bg-purple-600 border-purple-800'
      }`}>
        <span className="text-base">{type === 'success' ? '✓' : type === 'error' ? '🚨' : type === 'warning' ? '⚠️' : 'ℹ'}</span>
        <span className="flex-1">{message}</span>
        <button onClick={() => removeToast(id)} className="opacity-70 hover:opacity-100 text-lg leading-none">×</button>
      </div>
    ))}
  </div>
);

const Procurement = () => {
  // ─── 🚀 INJEKSI: Mengambil state global untuk Sync ke ReceivePO (poData) ───
  const { bahasa, halaman, setHalaman, poData: globalPoData, setPoData: setGlobalPoData } = useContext(AppContext);

  // ─── TABS STATE (Sinkronisasi Penuh dengan Status Halaman Gudang) ───
  const [activeTab, setActiveTab] = useState(() => {
    if (halaman === 'procPO') return 'PO';
    if (halaman === 'procVendors') return 'VENDORS';
    if (halaman === 'procRFQ') return 'RFQ';
    return 'PR'; 
  });

  useEffect(() => {
    if (halaman === 'procRequisitions') setActiveTab('PR');
    else if (halaman === 'procPO') setActiveTab('PO');
    else if (halaman === 'procVendors') setActiveTab('VENDORS');
    else if (halaman === 'procRFQ') setActiveTab('RFQ');
  }, [halaman]);

  const handleTabClick = (tabName, routeName) => {
    setActiveTab(tabName);
    setHalaman(routeName);
  };

  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // ─── DATA STATE (ARUS MOTORS CONTEXT) ───
  const [requisitions, setRequisitions] = useState([
    { id: 'PR-ARS-10042', dept: 'Battery Assembly', requester: 'Arief R.', itemDesc: 'Thermal Management Coolant 20L - 50 Drums', estCost: 22500000, date: '17 Sep 2026', status: 'Pending Approval' },
    { id: 'PR-ARS-10043', dept: 'Facilities', requester: 'Joko W.', itemDesc: 'High Voltage Safety Gear & Gloves - 20 Sets', estCost: 8200000, date: '16 Sep 2026', status: 'Approved' },
    { id: 'PR-ARS-10041', dept: 'Engineering', requester: 'Budi S.', itemDesc: 'Robotic Arm Servo Motor Replacement', estCost: 45500000, date: '14 Sep 2026', status: 'Rejected' },
  ]);

  // Kita gunakan globalPoData jika ada, atau state lokal jika tidak
  const [localPurchaseOrders, setLocalPurchaseOrders] = useState([
    { id: 'PO-ARS-260801', vendor: 'PT Voltara Daya Nusantara', items: 'Blade Battery Cell 3.2V 150Ah - 10,000 Pcs', amount: 3500000000, date: '01 Aug 2026', status: 'Sent to Vendor', asnDate: '15 Sep 2026', discrepancy: null },
    { id: 'PO-ARS-260802', vendor: 'ElectroTech Indo', items: 'Motor Control Unit (MCU) Gen 3 - 210 Units', amount: 2625000000, date: '05 Aug 2026', status: 'Discrepancy Hold', asnDate: '12 Aug 2026', discrepancy: 'Failed QC Diagnostic Test. Defect Code: DEF-02. Pending RMA.' },
    { id: 'PO-ARS-260803', vendor: 'Kabelindo EV Solutions', items: 'High Voltage Harness Cable 50mm2 - 5000 Meters', amount: 425000000, date: '10 Aug 2026', status: 'Partially Received', asnDate: '20 Aug 2026', discrepancy: null },
  ]);

  // 🚀 ENGINE INTERLOCK: Sinkronisasi PO Procurement dengan PO Gudang
  const purchaseOrders = globalPoData || localPurchaseOrders;
  const setPurchaseOrders = setGlobalPoData || setLocalPurchaseOrders;

  const [rfqs, setRfqs] = useState([
    { id: 'RFQ-ARS-2026-05', title: 'Q4 Supply of LFP Battery Cells (50,000 units)', deadline: '30 Sep 2026', bids: 4, status: 'Open for Bidding' },
    { id: 'RFQ-ARS-2026-04', title: 'Factory Assembly Line Calibration Contract', deadline: '10 Sep 2026', bids: 2, status: 'Evaluation' },
    { id: 'RFQ-ARS-2026-03', title: 'Warehouse Structural Reinforcement (Zone C)', deadline: '01 Aug 2026', bids: 6, status: 'Awarded' },
  ]);

  const [vendors, setVendors] = useState([
    { id: 'VEND-001', name: 'PT Voltara Daya Nusantara', category: 'Energy Storage (Batteries)', contact: 'Bpk. Hendra', otd: 98, defectRate: 1, status: 'Active', safetyStock: 'Standard' },
    { id: 'VEND-002', name: 'ElectroTech Indo', category: 'Powertrain & IT', contact: 'Ibu Linda', otd: 88, defectRate: 5, status: 'Active', safetyStock: 'Standard' },
    { id: 'VEND-003', name: 'Kabelindo EV Solutions', category: 'Electrical & Harness', contact: 'Sales Team', otd: 92, defectRate: 2, status: 'Active', safetyStock: 'Standard' },
    { id: 'VEND-004', name: 'PT Logistik Cepat', category: '3PL Carrier', contact: 'Bpk. Agus', otd: 65, defectRate: 12, status: 'Probation', safetyStock: 'Standard' },
  ]);

  const calculateVendorScore = (otd, defectRate) => Math.max(0, Math.min(100, Math.round((otd * 0.7) + ((100 - defectRate) * 0.3))));

  // ─── 🔮 SIMULATOR SCENARIO ENGINE ───
  const [simMode, setSimMode] = useState(false);
  const [simParams, setSimParams] = useState({ globalDelayDays: 0, otdDropPct: 0 });

  const processedVendors = useMemo(() => {
    return vendors.map(v => {
      let currentOtd = v.otd;
      let currentStatus = v.status;
      
      if (simMode) {
        currentOtd = Math.max(0, currentOtd - parseInt(simParams.otdDropPct) - (parseInt(simParams.globalDelayDays) * 1.5));
      }

      if (v.status !== 'Probation') {
        const simScore = calculateVendorScore(currentOtd, v.defectRate);
        if (simScore < 70) currentStatus = 'Critical';
        else if (simScore < 85) currentStatus = 'Warning';
        else currentStatus = 'Excellent';
      }

      return { ...v, otd: parseFloat(currentOtd.toFixed(1)), systemStatus: currentStatus };
    });
  }, [vendors, simMode, simParams]);

  // ─── MODALS STATE ───
  const [modalPR, setModalPR] = useState({ isOpen: false, data: null, mode: 'view' });
  const [modalPO, setModalPO] = useState({ isOpen: false, data: null, mode: 'view' });
  const [modalVendor, setModalVendor] = useState({ isOpen: false, data: null, mode: 'view' });
  const [modalRFQ, setModalRFQ] = useState({ isOpen: false, data: null, mode: 'view' });

  // FORMS STATE
  const [newPRForm, setNewPRForm] = useState({ dept: '', requester: '', itemDesc: '', estCost: '' });
  const [newPOForm, setNewPOForm] = useState({ vendor: '', items: '', amount: '', sku: '', qty: 1 });
  const [asnForm, setAsnForm] = useState('');
  const [discrepancyForm, setDiscrepancyForm] = useState('');

  // ─── ACTIONS ───
  const handleSaveNewPR = (e) => {
    e.preventDefault();
    if(!newPRForm.itemDesc) return addToast('Item description required', 'error');
    setRequisitions([{ id: `PR-ARS-${Math.floor(10050 + Math.random() * 100)}`, ...newPRForm, date: new Date().toLocaleDateString('en-GB'), status: 'Pending Approval' }, ...requisitions]);
    addToast('New Purchase Requisition generated and sent for executive approval.', 'success');
    setModalPR({ isOpen: false });
    setNewPRForm({ dept: '', requester: '', itemDesc: '', estCost: '' });
  };

  const handleApprovePR = (prId) => {
    const pr = requisitions.find(r => r.id === prId);
    setRequisitions(prev => prev.map(r => r.id === prId ? { ...r, status: 'Approved' } : r));
    const newPO = { 
      id: `PO-ARS-${Math.floor(26012 + Math.random() * 100)}`, 
      vendor: 'Unassigned Vendor', 
      items: pr.itemDesc, 
      sku: 'SKU-ARS-GENERIC', // Fallback SKU
      quantity: 1, // Fallback Qty
      amount: pr.estCost, 
      date: new Date().toLocaleDateString('en-GB'), 
      status: 'Draft', 
      eta: '-', // Equivalent to asnDate for ReceivePO sync
      asnDate: null, 
      discrepancy: null 
    };
    setPurchaseOrders([newPO, ...purchaseOrders]);
    addToast(`Requisition ${prId} approved. Draft PO Auto-Generated for sourcing.`, 'success');
    setModalPR({ isOpen: false });
  };

  const handleRejectPR = (prId) => {
    setRequisitions(prev => prev.map(r => r.id === prId ? { ...r, status: 'Rejected' } : r));
    addToast(`Requisition ${prId} rejected.`, 'error');
    setModalPR({ isOpen: false });
  };

  const handleSaveNewPO = (e) => {
    e.preventDefault();
    if(!newPOForm.items || !newPOForm.vendor) return addToast('Vendor and Items are required', 'error');
    
    // Mengekstrak atau menggunakan fallback untuk sku dan qty agar kompatibel dengan ReceivePO
    const skuCode = newPOForm.sku || 'SKU-ARS-GENERIC';
    const qtyNum = parseInt(newPOForm.qty) || 1;

    setPurchaseOrders([{ 
      id: `PO-ARS-${Math.floor(26012 + Math.random() * 100)}`, 
      ...newPOForm, 
      sku: skuCode,
      quantity: qtyNum,
      eta: '-',
      date: new Date().toLocaleDateString('en-GB'), 
      status: 'Draft', 
      asnDate: null, 
      discrepancy: null 
    }, ...purchaseOrders]);

    addToast('Blank PO Draft created and stored in ledger.', 'success');
    setModalPO({ isOpen: false });
    setNewPOForm({ vendor: '', items: '', amount: '', sku: '', qty: 1 });
  };

  const handleSendPO = (poId) => {
    // 🚀 ENGINE INTERLOCK: Update status PO yang membuat Receiving Dock tahu PO ini sedang berjalan
    setPurchaseOrders(prev => prev.map(p => p.id === poId ? { ...p, status: 'Pending' } : p)); // Gunakan 'Pending' agar cocok dengan standar ReceivePO
    addToast(`PO ${poId} legally dispatched to vendor. Awaiting ASN confirmation.`, 'success');
  };

  const handleSaveASN = () => {
    // 🚀 ENGINE INTERLOCK: Update ETA/ASN Date ke PO agar Inbound Dock tahu kapan truk akan datang!
    setPurchaseOrders(prev => prev.map(p => p.id === modalPO.data.id ? { ...p, asnDate: asnForm, eta: asnForm, status: 'Pending' } : p));
    addToast(`ASN Updated! Inbound Dock Scheduling alerted for PO ${modalPO.data.id}.`, 'success');
    setModalPO({ isOpen: false, data: null, mode: 'view' });
    setAsnForm('');
  };

  const handleSaveDiscrepancy = () => {
    setPurchaseOrders(prev => prev.map(p => p.id === modalPO.data.id ? { ...p, discrepancy: discrepancyForm, status: 'Discrepancy Hold' } : p));
    addToast(`DISCREPANCY FLAGGED: SCM and Quality Team notified for PO ${modalPO.data.id}.`, 'error');
    setModalPO({ isOpen: false, data: null, mode: 'view' });
    setDiscrepancyForm('');
  };

  const handleIssueCAPA = (vendor) => {
    addToast(`Formal CAPA warning dispatched to ${vendor.name}.`, 'info');
    setModalVendor({ isOpen: false, data: null, mode: 'view' });
  };

  const handleBoostSafetyStock = (vendor) => {
    setVendors(vendors.map(v => v.id === vendor.id ? { ...v, safetyStock: '+20% Buffer Boosted' } : v));
    addToast(`Safety Stock threshold for ${vendor.name} increased by 20% to avoid starvation lines.`, 'error');
    setModalVendor({ isOpen: false, data: null, mode: 'view' });
  };

  const handleExportReport = () => {
    addToast('Compiling Procurement Performance Summary Ledger...', 'info');
    setTimeout(() => addToast('Procurement Matrix Report Exported Successfully!', 'success'), 1000);
  };

  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 animate-fade-in">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER & MODULE INTERNAL NAVIGATION ── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>🤝 Supply Chain</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Procurement Management</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide">
            {bahasa === 'en' ? 'Procurement & Vendor Command Hub' : 'Pusat Komando Pengadaan & Vendor'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">Manage B2B EV pipelines, perform supplier health checks, and verify material requisitions.</p>
        </div>
        
        {/* WHAT-IF SIMULATOR LINK HUB */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setSimMode(!simMode);
              if (!simMode) addToast('Macro Supply Chain Simulator Activated!', 'info');
            }}
            className={`px-5 py-2.5 rounded-sm text-xs font-bold transition-colors uppercase tracking-wider flex items-center gap-2 border shadow-sm ${
              simMode ? 'bg-purple-600 border-purple-700 text-white shadow-inner' : 'bg-white hover:bg-purple-50 text-purple-700 border-purple-300'
            }`}
          >
            <span>🔮</span> {simMode ? 'Close Simulator' : 'Crisis Simulator'}
          </button>
          <button onClick={handleExportReport} className="bg-gray-800 hover:bg-black text-white px-5 py-2.5 rounded-sm text-xs font-bold transition-colors shadow-sm uppercase tracking-wider">
            ⭳ Export Data
          </button>
        </div>
      </div>

      {/* ── 🔮 WHAT-IF SIMULATOR CONTROL CORE ── */}
      {simMode && (
        <div className="bg-purple-50 border-t-4 border-purple-600 shadow-lg rounded-sm p-6 mb-6 flex flex-col md:flex-row gap-8 items-center animate-fade-in">
          <div className="md:w-1/3">
            <h3 className="font-black text-purple-900 uppercase tracking-wider text-sm flex items-center gap-2 mb-2">
              <span>🔮</span> SCM Disruption Injector
            </h3>
            <p className="text-xs text-purple-800 font-medium leading-relaxed">Inject material scarcity parameters to simulate real-time degradation of vendor OTD profiles on the scorecard ledger below.</p>
          </div>
          
          <div className="md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-8 w-full border-l border-purple-200 pl-8">
            <div className="space-y-2">
              <label className="flex justify-between text-[11px] font-bold text-purple-900 uppercase tracking-wider">
                <span>Global Ocean Freight Delay</span>
                <span className="bg-purple-200 px-2 py-0.5 rounded text-purple-900 border border-purple-300 font-black">+{simParams.globalDelayDays} Days</span>
              </label>
              <input type="range" min="0" max="15" step="1" value={simParams.globalDelayDays} onChange={(e) => setSimParams({...simParams, globalDelayDays: e.target.value})} className="w-full accent-purple-700 cursor-pointer"/>
            </div>
            <div className="space-y-2">
              <label className="flex justify-between text-[11px] font-bold text-purple-900 uppercase tracking-wider">
                <span>Supplier Production Defect Rate</span>
                <span className="bg-purple-200 px-2 py-0.5 rounded text-purple-900 border border-purple-300 font-black">Drop {simParams.otdDropPct}%</span>
              </label>
              <input type="range" min="0" max="30" step="1" value={simParams.otdDropPct} onChange={(e) => setSimParams({...simParams, otdDropPct: e.target.value})} className="w-full accent-purple-700 cursor-pointer"/>
            </div>
          </div>
        </div>
      )}

      {/* ── INTERNAL SUB-TABS MODULE CONTROL ── */}
      <div className="bg-gray-100 p-1 rounded-sm shadow-inner flex overflow-x-auto border border-gray-300 mb-6">
        <button onClick={() => handleTabClick('PR', 'procRequisitions')} className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all rounded-sm flex-1 ${activeTab === 'PR' ? 'bg-[#125ab2] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-800'}`}>
          Requisitions (PR)
        </button>
        <button onClick={() => handleTabClick('PO', 'procPO')} className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all rounded-sm whitespace-nowrap flex-1 ${activeTab === 'PO' ? 'bg-[#125ab2] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-800'}`}>
          Purchase Orders (PO)
        </button>
        <button onClick={() => handleTabClick('VENDORS', 'procVendors')} className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all rounded-sm whitespace-nowrap flex-1 ${activeTab === 'VENDORS' ? 'bg-[#125ab2] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-800'}`}>
          Vendor Matrix Scorecard
        </button>
        <button onClick={() => handleTabClick('RFQ', 'procRFQ')} className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all rounded-sm whitespace-nowrap flex-1 ${activeTab === 'RFQ' ? 'bg-[#125ab2] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-800'}`}>
          RFQ Bidding Tenders
        </button>
      </div>

      {/* ── TAB 1: PURCHASE REQUISITIONS (PR) ── */}
      {activeTab === 'PR' && (
        <div className="bg-white border border-gray-300 shadow-sm rounded-sm flex flex-col overflow-hidden hover:shadow-md transition-shadow">
          <div className="bg-slate-50 border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-xs uppercase text-gray-700 tracking-wider">Internal Sourcing Requisitions</h3>
              <p className="text-[10px] text-gray-500 font-semibold mt-1">Material requests initiated from the assembly floor awaiting administrative sign-off.</p>
            </div>
            <button onClick={() => setModalPR({ isOpen: true, mode: 'new' })} className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-5 py-2.5 rounded-sm text-[10px] font-bold uppercase shadow-sm transition-colors w-full sm:w-auto flex items-center justify-center gap-1.5 tracking-wider">
              <span>+</span> Create Requisition
            </button>
          </div>
          <div className="p-0 overflow-x-auto flex-1">
            <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
              <thead className="bg-[#f8f9fa] text-[#64748b] text-[10px] uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-6 border-b w-40">Req ID & Date</th>
                  <th className="py-3 px-6 border-b w-48">Origin Department</th>
                  <th className="py-3 px-6 border-b">Material Specification</th>
                  <th className="py-3 px-6 border-b text-right w-40">Est. Cost</th>
                  <th className="py-3 px-6 border-b text-center w-40">Status Check</th>
                  <th className="py-3 px-6 border-b text-center w-48">Managerial Action Center</th>
                </tr>
              </thead>
              <tbody className="text-[12px] text-gray-700">
                {requisitions.map((req, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-blue-50/40 transition-colors">
                    <td className="py-4 px-6">
                      <div onClick={() => setModalPR({ isOpen: true, data: req, mode: 'view' })} className="font-black font-mono text-[#125ab2] cursor-pointer hover:underline text-[13px]">
                        {req.id}
                      </div>
                      <div className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">{req.date}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-gray-900">{req.dept}</div>
                      <div className="text-[10px] text-gray-500 font-semibold mt-1">Req By: <span className="font-bold text-gray-700">{req.requester}</span></div>
                    </td>
                    <td className="py-4 px-6 font-bold text-gray-700 truncate max-w-[220px]" title={req.itemDesc}>{req.itemDesc}</td>
                    <td className="py-4 px-6 text-right font-mono font-black text-gray-900 text-[13px]">Rp {Number(req.estCost).toLocaleString('id-ID')}</td>
                    
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-block whitespace-nowrap px-2.5 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                        req.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 
                        req.status === 'Rejected' ? 'bg-red-50 text-red-800 border-red-300' : 
                        'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    
                    <td className="py-4 px-6 text-center">
                      {req.status === 'Pending Approval' ? (
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleApprovePR(req.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-sm text-[9px] font-bold uppercase tracking-wider shadow-sm transition-colors">Approve</button>
                          <button onClick={() => handleRejectPR(req.id)} className="bg-white border border-red-300 hover:bg-red-50 text-red-700 px-3 py-1.5 rounded-sm text-[9px] font-bold uppercase tracking-wider transition-colors">Reject</button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest bg-gray-50 border border-gray-200 px-2 py-1 rounded-sm">— ARCHIVED —</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: PURCHASE ORDERS (PO) ── */}
      {activeTab === 'PO' && (
        <div className="bg-white border border-gray-300 shadow-sm rounded-sm animate-fade-in flex flex-col overflow-hidden hover:shadow-md transition-shadow">
          <div className="bg-slate-50 border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-xs uppercase text-gray-700 tracking-wider">Purchase Orders & Inbound Telemetry</h3>
              <p className="text-[10px] text-gray-500 font-semibold mt-1">Dispatched contracts routed to suppliers. Log dynamic ASNs or audit delivery variances.</p>
            </div>
            <button onClick={() => setModalPO({ isOpen: true, mode: 'new' })} className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-5 py-2.5 rounded-sm text-[10px] font-bold uppercase shadow-sm transition-colors w-full sm:w-auto flex items-center justify-center gap-1.5 tracking-wider">
              <span>+</span> Generate Blank PO
            </button>
          </div>
          <div className="p-0 overflow-x-auto flex-1">
            <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
              <thead className="bg-[#f8f9fa] text-[#64748b] text-[10px] uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-6 border-b w-40">PO Number & Date</th>
                  <th className="py-3 px-6 border-b w-56">Contracted Supplier</th>
                  <th className="py-3 px-6 border-b">Fulfillment Summary</th>
                  <th className="py-3 px-6 border-b text-center w-36">Logistics / ASN</th>
                  <th className="py-3 px-6 border-b text-center w-40">Finance Status Check</th>
                  <th className="py-3 px-6 border-b text-center w-36">Actions Center</th>
                </tr>
              </thead>
              <tbody className="text-[12px] text-gray-700">
                {purchaseOrders.map((po, i) => (
                  <tr key={i} className={`border-b border-gray-100 transition-colors ${po.discrepancy ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-blue-50/40'}`}>
                    <td className="py-4 px-6">
                      <div 
                        onClick={() => setModalPO({ isOpen: true, data: po, mode: 'view' })} 
                        className={`font-black font-mono cursor-pointer hover:underline text-[13px] ${po.discrepancy ? 'text-red-700' : 'text-[#125ab2]'}`}
                      >
                        {po.id}
                      </div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-wider">{po.date}</div>
                    </td>
                    <td className="py-4 px-6 font-black text-gray-900">{po.vendor}</td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-gray-700 truncate max-w-[200px]" title={po.items}>{po.items}</div>
                      {po.discrepancy && <div className="text-[8px] font-black text-white bg-red-600 px-1.5 py-0.5 rounded-sm uppercase mt-1.5 tracking-widest animate-pulse inline-block shadow-sm">⚠️ RMA Claim Pending</div>}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {po.asnDate ? (
                        <div className="bg-blue-50 border border-blue-200 text-[#125ab2] px-2 py-1 rounded-sm text-[9px] font-black uppercase inline-block shadow-sm">
                          ETA: {po.asnDate}
                        </div>
                      ) : (
                        <span className="text-[9px] font-bold text-gray-400 uppercase italic tracking-wider">Awaiting ASN</span>
                      )}
                    </td>
                    
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-block whitespace-nowrap px-2.5 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                        po.status === 'Sent to Vendor' || po.status === 'Pending' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                        po.status === 'Discrepancy Hold' ? 'bg-red-600 text-white border-red-700' :
                        po.status === 'Partially Received' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                        po.status === 'Received' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                        'bg-gray-100 text-gray-600 border-gray-300'
                      }`}>
                        {po.status === 'Pending' ? 'Sent to Vendor' : po.status}
                      </span>
                    </td>
                    
                    <td className="py-4 px-6 text-center">
                      {po.status === 'Draft' ? (
                        <button onClick={() => handleSendPO(po.id)} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm w-full transition-colors">Dispatch PO</button>
                      ) : (
                        <button onClick={() => setModalPO({ isOpen: true, data: po, mode: 'view' })} className="bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm w-full transition-colors">Manage PO</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: VENDOR MANAGEMENT (LIVE SCORECARD) ── */}
      {activeTab === 'VENDORS' && (
        <div className="bg-white border border-gray-300 shadow-sm rounded-sm animate-fade-in flex flex-col overflow-hidden hover:shadow-md transition-shadow">
          <div className="bg-slate-50 border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-xs uppercase text-gray-700 tracking-wider">Live Vendor Scorecard & Directory</h3>
              <p className="text-[10px] text-gray-500 font-semibold mt-1">Real-time contract valuation based on On-Time Delivery (OTD) and Quality Pass Rates.</p>
            </div>
          </div>
          <div className="p-0 overflow-x-auto flex-1">
            <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
              <thead className="bg-[#f8f9fa] text-[#64748b] text-[10px] uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-6 border-b w-64">Vendor Corporate Name</th>
                  <th className="py-3 px-6 border-b">Supply Commodity</th>
                  <th className="py-3 px-6 border-b text-center w-36">On-Time Delivery</th>
                  <th className="py-3 px-6 border-b text-center w-32">Defect Rate</th>
                  <th className="py-3 px-6 border-b">Reliability Index (Z-Score)</th>
                  <th className="py-3 px-6 border-b text-center w-32">SLA Status</th>
                </tr>
              </thead>
              <tbody className="text-[12px] text-gray-700">
                {processedVendors.map((vend, i) => {
                  const score = calculateVendorScore(vend.otd, vend.defectRate);
                  return (
                    <tr key={i} className={`border-b border-gray-100 transition-colors ${vend.systemStatus === 'Critical' || vend.status === 'Probation' ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-blue-50/40'}`}>
                      <td className="py-4 px-6">
                        <div 
                          onClick={() => setModalVendor({ isOpen: true, data: vend, mode: 'view' })} 
                          className="font-black text-[#125ab2] cursor-pointer hover:underline text-[13px] mb-1 inline-block"
                          title="Open SCM Control Panel"
                        >
                          {vend.name}
                        </div>
                        <div className="text-[9px] font-bold text-gray-500 font-mono tracking-widest">{vend.id}</div>
                      </td>
                      <td className="py-4 px-6 font-bold text-gray-700">{vend.category}</td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`font-black text-[15px] ${vend.otd >= 90 ? 'text-emerald-600' : vend.otd >= 75 ? 'text-amber-500' : 'text-red-600'}`}>
                            {vend.otd}%
                          </span>
                          {simMode && <span className="text-[8px] bg-purple-100 text-purple-700 font-bold px-1.5 rounded-sm uppercase tracking-wider border border-purple-200 scale-90">Simulated</span>}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center font-mono font-black text-red-600 text-[13px]">{vend.defectRate}%</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                            <div className={`h-full ${score >= 85 ? 'bg-emerald-500' : score >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${score}%` }}></div>
                          </div>
                          <span className={`font-black text-[13px] ${score >= 85 ? 'text-emerald-700' : score >= 70 ? 'text-amber-600' : 'text-red-700'}`}>{score}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-2.5 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-wider border shadow-sm block ${
                          vend.status === 'Probation' ? 'bg-gray-800 text-white border-black animate-pulse' :
                          vend.systemStatus === 'Excellent' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 
                          vend.systemStatus === 'Warning' ? 'bg-amber-100 text-amber-800 border-amber-200' : 
                          'bg-red-600 text-white border-red-700'
                        }`}>
                          {vend.status === 'Probation' ? 'PROBATION' : vend.systemStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: REQUEST FOR QUOTE (RFQ) ── */}
      {activeTab === 'RFQ' && (
        <div className="bg-white border border-gray-300 shadow-sm rounded-sm animate-fade-in flex flex-col overflow-hidden hover:shadow-md transition-shadow">
          <div className="bg-slate-50 border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-xs uppercase text-gray-700 tracking-wider">RFQ / Bidding Tenders</h3>
              <p className="text-[10px] text-gray-500 font-semibold mt-1">Procurement matrix to analyze and execute competitive tender structures.</p>
            </div>
          </div>
          <div className="p-0 overflow-x-auto flex-1">
            <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
              <thead className="bg-[#f8f9fa] text-[#64748b] text-[10px] uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-6 border-b w-40">Tender ID</th>
                  <th className="py-3 px-6 border-b">Project Title Specification</th>
                  <th className="py-3 px-6 border-b w-40">Closing Deadline</th>
                  <th className="py-3 px-6 border-b text-center w-36">Bids Logged</th>
                  <th className="py-3 px-6 border-b text-center w-36">Status</th>
                  <th className="py-3 px-6 border-b text-center w-36">Manager Evaluation</th>
                </tr>
              </thead>
              <tbody className="text-[12px] text-gray-700">
                {rfqs.map((rfq, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-blue-50/40 transition-colors">
                    <td className="py-4 px-6">
                      <div onClick={() => setModalRFQ({ isOpen: true, data: rfq, mode: 'view' })} className="font-mono font-black text-[#125ab2] cursor-pointer hover:underline text-[13px]">{rfq.id}</div>
                    </td>
                    <td className="py-4 px-6 font-bold text-gray-900">{rfq.title}</td>
                    <td className="py-4 px-6 font-bold text-gray-600 font-mono text-[11px]">{rfq.deadline}</td>
                    <td className="py-4 px-6 text-center font-black text-xl text-[#125ab2]">{rfq.bids}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-2.5 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-wider border shadow-sm ${
                        rfq.status === 'Open for Bidding' ? 'bg-blue-100 text-blue-800 border-blue-300' : 
                        rfq.status === 'Evaluation' ? 'bg-amber-100 text-amber-800 border-amber-300' : 
                        'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}>{rfq.status}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button onClick={() => setModalRFQ({ isOpen: true, data: rfq, mode: 'view' })} className="bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm w-full transition-colors">View Bids</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          DYNAMIC MODALS SECTION (BULLETPROOF FLEXBOX ARCHITECTURE)
      ═══════════════════════════════════════════════════ */}

      {/* ── PR MODAL ── */}
      {modalPR.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[500px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-[#415a77]" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            <div className="px-6 py-4 flex justify-between items-center text-white bg-[#415a77] shrink-0 z-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 opacity-80">Sourcing Request</p>
                <h3 className="font-black text-sm uppercase tracking-wider">{modalPR.mode === 'new' ? 'Submit New Requisition' : `PR Evaluation: ${modalPR.data.id}`}</h3>
              </div>
              <button onClick={() => setModalPR({ isOpen: false, data: null, mode: 'view' })} className="text-white opacity-70 hover:opacity-100 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <form onSubmit={handleSaveNewPR} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 text-sm flex flex-col gap-4">
                {modalPR.mode === 'new' ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Origin Department <span className="text-red-500">*</span></label>
                        <select value={newPRForm.dept} onChange={e => setNewPRForm({...newPRForm, dept: e.target.value})} className="w-full border border-gray-300 p-2.5 text-xs font-bold text-gray-800 rounded-sm outline-none focus:border-[#125ab2] bg-white cursor-pointer" required>
                          <option value="" disabled>Select Dept...</option>
                          <option value="Battery Assembly">Battery Assembly</option>
                          <option value="EV Powertrain">EV Powertrain</option>
                          <option value="Engineering & IT">Engineering & IT</option>
                          <option value="Facilities">Facilities</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Requester Staff <span className="text-red-500">*</span></label>
                        <input type="text" placeholder="Full Name" value={newPRForm.requester} onChange={e => setNewPRForm({...newPRForm, requester: e.target.value})} className="w-full border border-gray-300 p-2.5 text-xs font-semibold rounded-sm outline-none focus:border-[#125ab2]" required/>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Detailed Item Description <span className="text-red-500">*</span></label>
                      <textarea placeholder="Specify components, quantities, and line codes..." value={newPRForm.itemDesc} onChange={e => setNewPRForm({...newPRForm, itemDesc: e.target.value})} className="w-full border border-gray-300 p-2.5 text-xs font-semibold rounded-sm outline-none focus:border-[#125ab2] resize-none" rows="3" required/>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Estimated Cost Valuation (IDR) <span className="text-red-500">*</span></label>
                      <input type="number" min="0" placeholder="0" value={newPRForm.estCost} onChange={e => setNewPRForm({...newPRForm, estCost: e.target.value})} className="w-full border border-gray-300 p-2.5 text-lg font-black font-mono text-[#125ab2] rounded-sm outline-none focus:border-[#125ab2]" required/>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-gray-50 border border-gray-200 p-4 rounded-sm shadow-inner">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Item Requested</p>
                      <p className="font-black text-base text-gray-900 leading-tight">{modalPR.data.itemDesc}</p>
                      <p className="text-[10px] font-bold text-[#125ab2] uppercase tracking-wider mt-2 border-t border-gray-200 pt-2">Est Cost: <span className="font-mono text-sm">Rp {Number(modalPR.data.estCost).toLocaleString('id-ID')}</span></p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Department</p>
                        <p className="font-bold text-gray-800">{modalPR.data.dept}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Requester</p>
                        <p className="font-semibold text-gray-800">{modalPR.data.requester}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 shrink-0 z-10">
                <button type="button" onClick={() => setModalPR({ isOpen: false, data: null, mode: 'view' })} className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm rounded-sm">Close</button>
                {modalPR.mode === 'new' ? (
                  <button type="submit" className="px-6 py-2.5 bg-[#125ab2] hover:bg-[#0e4487] text-white text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors rounded-sm">Submit Request</button>
                ) : modalPR.data.status === 'Pending Approval' ? (
                  <>
                    <button type="button" onClick={() => handleRejectPR(modalPR.data.id)} className="bg-white border border-red-300 text-red-700 hover:bg-red-50 px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-colors shadow-sm">Reject</button>
                    <button type="button" onClick={() => handleApprovePR(modalPR.data.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-sm shadow-sm transition-colors flex items-center justify-center gap-1.5"><span>✓</span> Approve & Build PO</button>
                  </>
                ) : null}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PO MODAL ── */}
      {modalPO.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 sm:p-6 overflow-hidden">
          <div className={`bg-white rounded-sm w-full max-w-[600px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 ${modalPO.mode === 'discrepancy' || modalPO.data?.discrepancy ? 'border-t-red-600' : 'border-t-[#125ab2]'}`} style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            <div className={`px-6 py-4 flex justify-between items-center text-white shrink-0 z-10 ${modalPO.mode === 'discrepancy' || modalPO.data?.discrepancy ? 'bg-red-700' : 'bg-[#415a77]'}`}>
              <h3 className="font-black text-sm uppercase tracking-wider">
                {modalPO.mode === 'new' ? 'Draft New Procurement Contract' : 
                 modalPO.mode === 'asn' ? `Set Logistics ASN Date` : 
                 modalPO.mode === 'discrepancy' ? `Flag Compliance Discrepancy` : 
                 `Tracking: ${modalPO.data.id}`}
              </h3>
              <button onClick={() => setModalPO({ isOpen: false, data: null, mode: 'view' })} className="text-white opacity-70 hover:opacity-100 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 text-sm flex flex-col gap-4">
              {modalPO.mode === 'new' ? (
                <form id="newPoForm" onSubmit={handleSaveNewPO} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Target Supplier <span className="text-red-500">*</span></label>
                    <select value={newPOForm.vendor} onChange={e => setNewPOForm({...newPOForm, vendor: e.target.value})} className="w-full border border-gray-300 p-2.5 text-xs font-bold text-gray-800 rounded-sm outline-none focus:border-[#125ab2] bg-white cursor-pointer" required>
                      <option value="" disabled>Select Authorized Vendor...</option>
                      {vendors.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Order Logistics Spec <span className="text-red-500">*</span></label>
                    <textarea placeholder="List raw materials, components, and technical bounds..." value={newPOForm.items} onChange={e => setNewPOForm({...newPOForm, items: e.target.value})} className="w-full border border-gray-300 p-2.5 text-xs font-semibold rounded-sm outline-none focus:border-[#125ab2] resize-none" rows="3" required/>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Target SKU <span className="text-red-500">*</span></label>
                      <input type="text" placeholder="e.g. SKU-ARS-LFP01" value={newPOForm.sku} onChange={e => setNewPOForm({...newPOForm, sku: e.target.value})} className="w-full border border-gray-300 p-2.5 text-sm font-bold font-mono text-[#125ab2] rounded-sm outline-none focus:border-[#125ab2]" required/>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Order Quantity <span className="text-red-500">*</span></label>
                      <input type="number" min="1" placeholder="0" value={newPOForm.qty} onChange={e => setNewPOForm({...newPOForm, qty: e.target.value})} className="w-full border border-gray-300 p-2.5 text-sm font-bold rounded-sm outline-none focus:border-[#125ab2]" required/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Contract Valuation Amount (IDR)</label>
                    <input type="number" min="0" placeholder="0" value={newPOForm.amount} onChange={e => setNewPOForm({...newPOForm, amount: e.target.value})} className="w-full border border-gray-300 p-2.5 text-lg font-black font-mono text-[#125ab2] rounded-sm outline-none focus:border-[#125ab2]"/>
                  </div>
                </form>
              ) : modalPO.mode === 'asn' ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-sm text-[#125ab2] text-xs font-semibold leading-relaxed shadow-inner">
                    Advance Shipping Notice (ASN) feeds telemetry directly into the Inbound Dock Yard Management schedule.
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Confirmed Delivery ETA <span className="text-red-500">*</span></label>
                    <input type="date" value={asnForm} onChange={e => setAsnForm(e.target.value)} className="w-full border border-gray-300 p-3 text-sm font-black font-mono text-gray-800 rounded-sm outline-none focus:border-[#125ab2] cursor-pointer" required/>
                  </div>
                </div>
              ) : modalPO.mode === 'discrepancy' ? (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 p-4 rounded-sm text-red-800 text-xs font-bold leading-relaxed shadow-inner">
                    Flagging a deficit will automatically freeze active balance accounts in Finance and hold yard gate passes.
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-red-700 uppercase tracking-wider mb-1.5">Describe Audit Deficit <span className="text-red-500">*</span></label>
                    <textarea value={discrepancyForm} onChange={e => setDiscrepancyForm(e.target.value)} placeholder="e.g. Broken container seals. Delayed calibration matrices." className="w-full border border-red-300 p-3 text-xs font-semibold rounded-sm outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 bg-red-50/50 resize-none text-red-900" rows="3" required/>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-gray-800">
                  <div className="grid grid-cols-2 gap-4 border-b border-gray-200 pb-4">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contracted Vendor</p>
                      <p className="font-black text-base text-gray-900 leading-tight">{modalPO.data.vendor}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Value</p>
                      <p className="font-mono font-black text-xl text-[#125ab2]">Rp {Number(modalPO.data.amount).toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Component Matrix Summary</p>
                    <div className="bg-gray-50 border border-gray-200 p-3 text-xs font-semibold rounded-sm leading-relaxed">{modalPO.data.items}</div>
                  </div>
                  
                  {modalPO.data.discrepancy && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-sm shadow-inner border-l-4 border-l-red-500">
                      <p className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-1.5">⚠️ Active Dispute Hold</p>
                      <p className="text-xs text-red-900 font-bold italic leading-relaxed pl-2 border-l border-gray-300">"{modalPO.data.discrepancy}"</p>
                    </div>
                  )}

                  {!modalPO.data.discrepancy && modalPO.data.status !== 'Draft' && (
                    <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Inbound Logistics Overrides</p>
                      <div className="flex gap-2">
                        <button onClick={() => setModalPO({ ...modalPO, mode: 'asn' })} className="bg-white border border-blue-200 text-[#125ab2] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-sm hover:bg-blue-50 transition-colors">📅 Log ASN</button>
                        <button onClick={() => setModalPO({ ...modalPO, mode: 'discrepancy' })} className="bg-white border border-red-200 text-red-600 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-sm hover:bg-red-50 transition-colors">🚨 Hold Dispute</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 shrink-0 z-10">
              {modalPO.mode === 'new' ? (
                <>
                  <button type="button" onClick={() => setModalPO({ isOpen: false, data: null, mode: 'view' })} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-[10px] font-bold uppercase tracking-wider rounded-sm shadow-sm">Cancel</button>
                  <button type="submit" form="newPoForm" className="px-6 py-2.5 bg-[#125ab2] text-white text-[10px] font-bold uppercase tracking-wider shadow-sm rounded-sm">Commit Contract</button>
                </>
              ) : modalPO.mode === 'asn' ? (
                <>
                  <button type="button" onClick={() => setModalPO({ ...modalPO, mode: 'view' })} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-[10px] font-bold uppercase tracking-wider rounded-sm">Back</button>
                  <button type="button" onClick={handleSaveASN} className="px-6 py-2.5 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm rounded-sm">Commit ASN</button>
                </>
              ) : modalPO.mode === 'discrepancy' ? (
                <>
                  <button type="button" onClick={() => setModalPO({ ...modalPO, mode: 'view' })} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-[10px] font-bold uppercase tracking-wider rounded-sm">Back</button>
                  <button type="button" onClick={handleSaveDiscrepancy} className="px-6 py-2.5 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm rounded-sm">Lock Balance</button>
                </>
              ) : (
                <button type="button" onClick={() => setModalPO({ isOpen: false, data: null, mode: 'view' })} className="px-6 py-2.5 bg-gray-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-sm w-full sm:w-auto">Close</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── VENDOR CONTROL MODAL ── */}
      {modalVendor.isOpen && modalVendor.data && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[500px] shadow-2xl flex flex-col relative border-t-4 border-t-purple-700" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            <div className={`px-6 py-4 flex justify-between items-center text-white shrink-0 z-10 ${modalVendor.data.systemStatus === 'Critical' || modalVendor.data.status === 'Probation' ? 'bg-red-700' : 'bg-[#415a77]'}`}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 opacity-80">Vendor Risk Ledger</p>
                <h3 className="font-black text-lg tracking-wide leading-none">{modalVendor.data.name}</h3>
              </div>
              <button onClick={() => setModalVendor({ isOpen: false, data: null, mode: 'view' })} className="text-white opacity-70 hover:opacity-100 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 text-sm space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-sm text-center shadow-inner">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Reliability Z-Score</span>
                  <span className={`font-black text-3xl ${calculateVendorScore(modalVendor.data.otd, modalVendor.data.defectRate) >= 85 ? 'text-emerald-600' : 'text-red-600'}`}>{calculateVendorScore(modalVendor.data.otd, modalVendor.data.defectRate)}</span>
                </div>
                <div className="space-y-2 text-xs">
                  <p className="bg-white p-2 border font-semibold flex justify-between"><span>OTD Score:</span><strong>{modalVendor.data.otd}%</strong></p>
                  <p className="bg-white p-2 border font-semibold flex justify-between text-red-600"><span>Defects:</span><strong>{modalVendor.data.defectRate}%</strong></p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase border-b pb-1.5 mb-2">Mitigation Controls</p>
                <div className="flex flex-col gap-2">
                  {(modalVendor.data.systemStatus === 'Critical' || modalVendor.data.systemStatus === 'Warning') && (
                    <button onClick={() => handleIssueCAPA(modalVendor.data)} className="w-full bg-red-50 hover:bg-red-100 border border-red-300 text-red-700 p-2.5 rounded-sm text-[10px] font-bold uppercase tracking-wider">Issue CAPA Penalty Warning</button>
                  )}
                  {modalVendor.data.safetyStock === 'Standard' && (
                    <button onClick={() => handleBoostSafetyStock(modalVendor.data)} className="w-full bg-[#125ab2] hover:bg-[#0e4487] text-white p-2.5 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm">Boost Safety Stock (+20%)</button>
                  )}
                  {modalVendor.data.safetyStock.includes('Boosted') && (
                    <div className="p-2 bg-emerald-50 text-emerald-800 font-bold text-center border text-[10px] uppercase tracking-wider rounded-sm shadow-inner">✓ Emergency Buffer Engaged</div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end shrink-0 z-10">
              <button type="button" onClick={() => setModalVendor({ isOpen: false, data: null, mode: 'view' })} className="px-6 py-2.5 bg-gray-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-sm shadow-sm w-full sm:w-auto">Close Profile</button>
            </div>
          </div>
        </div>
      )}

      {/* ── RFQ DETAILS MODAL ── */}
      {modalRFQ.isOpen && modalRFQ.data && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[500px] shadow-2xl flex flex-col relative border-t-4 border-t-[#415a77]" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            <div className="px-6 py-4 flex justify-between items-center text-white bg-[#415a77] shrink-0 z-10">
              <h3 className="font-black text-sm uppercase tracking-wider">Tender Assessment Portfolio</h3>
              <button onClick={() => setModalRFQ({ isOpen: false, data: null, mode: 'view' })} className="text-white opacity-70 hover:opacity-100 font-bold text-xl leading-none px-2">✕</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar text-gray-800 space-y-4">
              <h4 className="text-base font-black text-gray-900 leading-tight border-b pb-2">{modalRFQ.data.title}</h4>
              <p className="text-xs font-bold text-gray-500 uppercase">Tender Code: <span className="font-mono text-gray-700">{modalRFQ.data.id}</span></p>
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-sm text-center">
                <span className="text-3xl font-mono font-black text-[#125ab2]">{modalRFQ.data.bids}</span>
                <p className="text-[10px] font-black text-gray-400 uppercase mt-1 tracking-wider">Bids Active in Matrix</p>
              </div>
            </div>
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end shrink-0 z-10">
              <button type="button" onClick={() => setModalRFQ({ isOpen: false, data: null, mode: 'view' })} className="px-6 py-2.5 bg-gray-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-sm shadow-sm w-full sm:w-auto">Close</button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
};

export default Procurement;