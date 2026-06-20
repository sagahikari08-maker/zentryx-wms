import React, { useContext, useState, useMemo, useEffect } from 'react';
import { AppContext } from './AppContext';

// ─── TOAST COMPONENT (Aman dari Bug Pointer Events) ──────────────────────────
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

const FulfillOrders = () => {
  // ─── 🚀 INJEKSI: Mengambil dispatchAutoTask dari AppContext ───
  const { teks, bahasa, dispatchAutoTask, soData, setSoData } = useContext(AppContext);
  const [toasts, setToasts] = useState([]);

  // ─── HELPER DATES ───
  const getDynamicDate = (daysOffset) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().slice(0, 10);
  };
  const todayStr = getDynamicDate(0);

  // ─── TOAST FUNCS ───
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // ─── INTERACTIVE STATES ───
  const [activeSO, setActiveSO] = useState(null); // Print & Ship Modal
  const [selectedCourier, setSelectedCourier] = useState('Zentryx Flatbed Fleet');

  const defaultNewForm = { customer: '', date: todayStr, address: '', weight: '', type: 'Standard Parts', notes: '' };
  const [isNewSOModalOpen, setIsNewSOModalOpen] = useState(false);
  const [newSOForm, setNewSOForm] = useState(defaultNewForm);

  const [detailSO, setDetailSO] = useState(null);
  const [editSO, setEditSO] = useState(null);
  const [editForm, setEditForm] = useState({});

  const [selectedIds, setSelectedIds] = useState([]);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchCourier, setBatchCourier] = useState('Zentryx Express Logistics');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const courierOptions = ['Zentryx Flatbed Fleet', 'Zentryx Express Logistics', 'Krakatau Freight LTL', 'Maersk Global Cargo', 'Special Hazmat Carrier'];
  const typeOptions = ['Standard Parts', 'Heavy Chassis', 'Hazmat (LFP Battery)', 'Electronics (ESD)'];

  // ─── SUMMARY STATS ───
  const stats = useMemo(() => ({
    total: (soData || []).length,
    ready: (soData || []).filter(s => s.status === 'Ready to Pick').length,
    packed: (soData || []).filter(s => s.status === 'Packed / Staged').length,
    shipped: (soData || []).filter(s => s.status === 'Shipped').length,
    delivered: (soData || []).filter(s => s.status === 'Delivered').length,
    totalWeight: (soData || []).reduce((acc, curr) => acc + (Number(curr.weight) || 0), 0)
  }), [soData]);

  // ─── FILTER & SORT (Diperbarui dengan Safe Navigation agar tidak crash) ───
  const filteredData = useMemo(() => {
    let data = [...(soData || [])];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(so =>
        (so.id && so.id.toLowerCase().includes(q)) ||
        (so.customer && so.customer.toLowerCase().includes(q)) ||
        (so.address && so.address.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== 'All') {
      data = data.filter(so => so.status === statusFilter);
    }
    data.sort((a, b) => {
      let aVal = a[sortConfig.key] || '';
      let bVal = b[sortConfig.key] || '';
      if (sortConfig.key === 'weight') {
        aVal = Number(aVal); bVal = Number(bVal);
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return data;
  }, [soData, searchQuery, statusFilter, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const SortIcon = ({ col }) => {
    if (sortConfig.key !== col) return <span className="text-gray-300 ml-1 opacity-50">↕</span>;
    return <span className="ml-1 text-[#125ab2] font-black">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  // ─── CHECKBOX LOGIC ───
  const readyOrPackedFiltered = filteredData.filter(so => so.status === 'Ready to Pick' || so.status === 'Packed / Staged');
  const allEligibleSelected = readyOrPackedFiltered.length > 0 && readyOrPackedFiltered.every(so => selectedIds.includes(so.id));

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (allEligibleSelected) setSelectedIds([]);
    else setSelectedIds(readyOrPackedFiltered.map(so => so.id));
  };

  // ─── UI HELPERS ───
  const getStatusBadge = (status) => {
    const map = {
      'Ready to Pick': 'bg-blue-100 text-blue-800 border-blue-300',
      'Packed / Staged': 'bg-purple-100 text-purple-800 border-purple-300',
      'Shipped': 'bg-amber-100 text-amber-800 border-amber-300',
      'Delivered': 'bg-emerald-100 text-emerald-800 border-emerald-300',
    };
    return map[status] || 'bg-gray-100 text-gray-600 border-gray-300';
  };

  // ─── LABEL PRINTING ENGINE (INDUSTRIAL GRADE) ───
  const generateTrackingNumber = () => `AWB-${Math.floor(10000000 + Math.random() * 90000000)}`;

  const shippingLabelStyles = `
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #000; background-color: #f0f0f0; }
    .label-wrapper { background: #fff; border: 4px solid #000; width: 450px; margin: 0 auto; box-sizing: border-box; overflow: hidden; }
    .header { background: #000; color: #fff; padding: 25px 20px; text-align: center; }
    .courier-name { font-size: 32px; font-weight: 900; text-transform: uppercase; letter-spacing: -1px; line-height: 1; }
    .service-type { font-size: 13px; font-weight: 700; letter-spacing: 4px; margin-top: 8px; color: #fff; }
    .section { padding: 20px; border-bottom: 2px solid #000; }
    .flex-row { display: flex; }
    .col-left { flex: 1; border-right: 2px solid #000; padding: 20px; }
    .col-right { flex: 1; padding: 20px; }
    .label { font-size: 11px; color: #000; text-transform: uppercase; font-weight: 900; margin-bottom: 5px; letter-spacing: 1px; border-bottom: 1px solid #ccc; padding-bottom: 3px; display: inline-block; }
    .text-main { font-size: 14px; font-weight: 600; line-height: 1.5; margin-top: 5px; }
    .text-lg { font-size: 22px; font-weight: 900; line-height: 1.1; margin-top: 5px; text-transform: uppercase; }
    .barcode-section { text-align: center; padding: 30px 20px; background: #fff; }
    .barcode-real { font-family: 'Libre Barcode 39', cursive; font-size: 75px; line-height: 0.7; margin: 10px 0; font-weight: normal; color: #000; }
    .tracking-text { font-size: 20px; font-weight: 900; letter-spacing: 3px; margin-top: 5px; }
    .hazard-box { border: 5px solid #000; padding: 15px; margin-top: 15px; text-align: center; background: #fff; }
    .hazard-title { font-size: 24px; font-weight: 900; text-transform: uppercase; margin-bottom: 5px; }
    .hazard-sub { font-size: 16px; font-weight: 900; }
    .metrics-bar { display: flex; justify-content: space-between; background: #f9f9f9; padding: 10px 20px; font-size: 14px; font-weight: 900; border-bottom: 2px solid #000; }
    .footer { background: #000; padding: 15px; font-size: 10px; text-align: center; color: #fff; font-weight: 700; letter-spacing: 1px; }
  `;

  const buildLabelHTML = (so, courier, trackingNumber) => {
    const isHazmat = (so.type || '').includes('Hazmat'); // Fallback aman
    const hazardHTML = isHazmat ? `
      <div class="hazard-box">
        <div class="hazard-title">⚠️ DANGER: CLASS 9 HAZMAT</div>
        <div class="hazard-sub">UN3480 LITHIUM ION BATTERIES</div>
      </div>` : '';

    return `
      <div class="label-wrapper">
        <div class="header">
          <div class="courier-name">${courier}</div>
          <div class="service-type">INDUSTRIAL OUTBOUND FREIGHT</div>
        </div>
        <div class="metrics-bar">
          <div>WEIGHT: ${so.weight || 0} KG</div>
          <div>PKG: 1 OF 1</div>
        </div>
        <div class="flex-row" style="border-bottom: 2px solid #000;">
          <div class="col-left">
            <div class="label">SENDER:</div>
            <div class="text-main" style="font-size: 13px;">
              <b>ARUS GIGAFACTORY</b><br/>KIT Batang, Blok C<br/>Jawa Tengah, INA
            </div>
          </div>
          <div class="col-right">
            <div class="label">SHIP TO:</div>
            <div class="text-lg">${so.customer}</div>
            <div class="text-main" style="font-size: 12px; font-weight: 500;">${so.address || 'Address on file'}</div>
          </div>
        </div>
        <div class="section flex-row">
          <div style="flex: 1;">
            <div class="label">ORDER REF:</div>
            <div class="text-main" style="font-weight: 900;">${so.id}</div>
          </div>
          <div style="flex: 1; text-align: right;">
            <div class="label">DISPATCH DATE:</div>
            <div class="text-main" style="font-weight: 900;">${so.date}</div>
          </div>
        </div>
        <div class="barcode-section">
          <div class="label" style="border: none;">MASTER TRACKING NUMBER</div>
          <div class="barcode-real">*${trackingNumber}*</div>
          <div class="tracking-text">${trackingNumber}</div>
          ${hazardHTML}
        </div>
        ${so.notes ? `<div class="section" style="background:#f9f9f9;"><div class="label">DISPATCH NOTES:</div><div style="font-size:12px; font-weight: 600; margin-top:5px; text-transform:uppercase;">${so.notes}</div></div>` : ''}
        <div class="footer">ARUS MOTORS WMS ENGINE &bull; AUTHORIZED DISPATCH</div>
      </div>
    `;
  };

  const fontLinks = `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
  `;

  // ─── ACTION HANDLERS ───
  const handleBatchPrintExecute = () => {
    if (selectedIds.length === 0) return;
    const ordersToPrint = soData.filter(so => selectedIds.includes(so.id));
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    const newTrackingNums = {};

    const labelsHTML = ordersToPrint.map(so => {
      const trackingNumber = generateTrackingNumber();
      newTrackingNums[so.id] = trackingNumber;
      return `<div class="label-page">${buildLabelHTML(so, batchCourier, trackingNumber)}</div>`;
    }).join('');

    const finalHTML = `
      <html>
        <head>
          <title>Batch Freight Labels - ARUS</title>
          ${fontLinks}
          <style>
            ${shippingLabelStyles}
            @media print { body { background-color: white; padding: 0; } .label-page { page-break-after: always; padding: 20px; } .label-wrapper { border: none; } }
            @media screen { .label-page { padding: 40px; border-bottom: 5px dashed #ccc; } }
          </style>
        </head>
        <body>
          ${labelsHTML}
          <script>setTimeout(() => { window.print(); }, 1000);</script>
        </body>
      </html>
    `;
    printWindow.document.write(finalHTML);
    printWindow.document.close();

    setSoData(soData.map(so =>
      selectedIds.includes(so.id)
        ? { ...so, status: 'Shipped', trackingNumber: newTrackingNums[so.id], courier: batchCourier }
        : so
    ));
    setSelectedIds([]);
    setIsBatchModalOpen(false);
    addToast(`${ordersToPrint.length} Cargo labels generated. Status escalated to Shipped.`, 'success');
  };

  const handleProsesKirimSingle = () => {
    const trackingNumber = generateTrackingNumber();
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    const html = `
      <html>
        <head>
          <title>Freight Label - ${activeSO.id}</title>
          ${fontLinks}
          <style>${shippingLabelStyles}</style>
        </head>
        <body>
          ${buildLabelHTML(activeSO, selectedCourier, trackingNumber)}
          <script>setTimeout(() => { window.print(); }, 800);</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();

    setSoData(soData.map(so =>
      so.id === activeSO.id ? { ...so, status: 'Shipped', trackingNumber, courier: selectedCourier } : so
    ));
    setActiveSO(null);
    setSelectedCourier('Zentryx Flatbed Fleet');
    addToast(`Order ${activeSO.id} dispatched successfully.`, 'success');
  };

  const updateSOStatus = (id, newStatus) => {
    setSoData(soData.map(so => so.id === id ? { ...so, status: newStatus } : so));
    if (newStatus === 'Packed / Staged') addToast(`Order ${id} is packed and staged at Loading Dock.`, 'info');
    else if (newStatus === 'Delivered') addToast(`Electronic POD received. Order ${id} closed.`, 'success');
  };

  const handleClearDelivered = () => {
    if (!window.confirm('Archive all delivered orders from active view?')) return;
    setSoData(soData.filter(so => so.status !== 'Delivered'));
    addToast('Delivered orders archived to master ledger.', 'info');
  };

  // ─── 🚀 INJEKSI INTERLOCK: Saat Membuat Outbound Manifest Baru ───
  const handleSaveNewSO = (e) => {
    e.preventDefault();
    if (!newSOForm.customer || !newSOForm.weight) return addToast('Customer and Weight are mandatory.', 'error');
    
    const nextNum = soData.length > 0 ? Math.max(...soData.map(i => parseInt(i.id.split('-')[2]) || 0)) + 1 : 1;
    const newId = `OUT-ARS-${nextNum.toString().padStart(4, '0')}`;

    setSoData([{ id: newId, ...newSOForm, status: 'Ready to Pick' }, ...soData]);
    setIsNewSOModalOpen(false);
    
    // 💥 TRIGGER PICKING TASK OTOMATIS KE SCANNER
    dispatchAutoTask({
      type: 'Picking',
      desc: `Pick order for ${newSOForm.customer} (${newSOForm.type})`,
      zone: newSOForm.type.includes('Hazmat') ? 'Zone B (Cold Storage)' : 'Zone A (Ambient)',
      assignee: 'Auto-Assigned Picker',
      priority: 'High',
      isLocked: false,
      dependency: 'None',
      sku: 'SKU-ARS-GENERIC', 
      refId: newId,
      qty: 1, 
      notes: newSOForm.notes || 'Auto-generated from Outbound SO.'
    });

    setNewSOForm(defaultNewForm);
    addToast(`Outbound Order ${newId} generated. Pickers notified via Scanner.`, 'success');
  };

  const handleOpenEdit = (so) => {
    setEditSO(so);
    setEditForm({ customer: so.customer, date: so.date, address: so.address || '', weight: so.weight || '', type: so.type || 'Standard Parts', notes: so.notes || '' });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    setSoData(soData.map(so => so.id === editSO.id ? { ...so, ...editForm } : so));
    setEditSO(null);
    addToast(`Outbound Manifest ${editSO.id} updated.`, 'success');
  };

  const handleDeleteSO = (id) => {
    setSoData(soData.filter(so => so.id !== id));
    setDeleteConfirmId(null);
    setSelectedIds(prev => prev.filter(i => i !== id));
    addToast(`Order ${id} voided from system.`, 'warning');
  };

  const handleExportCSV = () => {
    addToast('Compiling Outbound Manifest...', 'info');
    const headers = ['Order_ID', 'Customer', 'Address', 'Date', 'Weight_KG', 'Cargo_Type', 'Status', 'Courier', 'Tracking_Number', 'Notes'];
    const rows = soData.map(so => [
      so.id, `"${so.customer}"`, `"${so.address || ''}"`, so.date, so.weight || 0, so.type || 'Standard',
      so.status, `"${so.courier || ''}"`, so.trackingNumber || '', `"${so.notes || ''}"`
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `ARUS_Outbound_Manifest_${todayStr}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 animate-fade-in">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>📦 Logistics</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Outbound</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide">Freight & Order Fulfillment</h2>
          <p className="text-sm text-gray-500 mt-1">Manage outbound assembly pipelines, generate Hazmat labels, and track 3PL couriers.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button onClick={handleExportCSV} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-sm shadow-sm text-[10px] font-bold uppercase tracking-wider transition-colors">
            ⭳ Export CSV
          </button>
          <button onClick={handleClearDelivered} className="bg-white border border-gray-300 text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-sm shadow-sm text-[10px] font-bold uppercase tracking-wider transition-colors">
            🗑 Archive Delivered
          </button>
          <button onClick={() => setIsNewSOModalOpen(true)} className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-5 py-2.5 rounded-sm shadow-sm text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5">
            <span>+</span> Generate Outbound SO
          </button>
        </div>
      </div>

      {/* ── SUMMARY STATS CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 border border-gray-200 rounded-sm shadow-sm flex flex-col justify-center">
          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Total Manifest</p>
          <p className="text-2xl font-black text-gray-900 font-mono">{stats.total}</p>
        </div>
        <div className="bg-white p-4 border-l-4 border-l-blue-600 border border-y-gray-200 border-r-gray-200 rounded-sm shadow-sm">
          <p className="text-[9px] font-bold text-blue-600 uppercase tracking-wider mb-1">Ready to Pick</p>
          <p className="text-2xl font-black text-blue-800 font-mono">{stats.ready}</p>
        </div>
        <div className="bg-white p-4 border-l-4 border-l-purple-600 border border-y-gray-200 border-r-gray-200 rounded-sm shadow-sm">
          <p className="text-[9px] font-bold text-purple-600 uppercase tracking-wider mb-1">Staged / Packed</p>
          <p className="text-2xl font-black text-purple-800 font-mono">{stats.packed}</p>
        </div>
        <div className="bg-white p-4 border-l-4 border-l-amber-500 border border-y-gray-200 border-r-gray-200 rounded-sm shadow-sm">
          <p className="text-[9px] font-bold text-amber-600 uppercase tracking-wider mb-1">In Transit</p>
          <p className="text-2xl font-black text-amber-700 font-mono">{stats.shipped}</p>
        </div>
        <div className="bg-white p-4 border-l-4 border-l-emerald-500 border border-y-gray-200 border-r-gray-200 rounded-sm shadow-sm">
          <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Delivered (POD)</p>
          <p className="text-2xl font-black text-emerald-700 font-mono">{stats.delivered}</p>
        </div>
      </div>

      {/* ── SEARCH & FILTER BAR ── */}
      <div className="bg-white p-3 border border-gray-300 shadow-sm rounded-sm mb-4 flex flex-col lg:flex-row gap-3 items-center justify-between">
        
        {selectedIds.length > 0 ? (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-4 py-2 rounded-sm w-full lg:w-auto shadow-inner">
            <span className="text-xs font-black text-amber-800">{selectedIds.length} Selected (Ready/Packed)</span>
            <button onClick={() => setIsBatchModalOpen(true)} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 rounded-sm text-[9px] font-bold uppercase tracking-wider shadow-sm transition-colors flex items-center gap-1.5">
              <span>🖨️</span> Batch Print Labels
            </button>
            <button onClick={() => setSelectedIds([])} className="bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-sm text-[9px] font-bold uppercase tracking-wider shadow-sm transition-colors">Deselect All</button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700 outline-none rounded-sm cursor-pointer shadow-sm min-w-[150px]">
              <option value="All">All Pipeline Stages</option>
              <option value="Ready to Pick">Ready to Pick</option>
              <option value="Packed / Staged">Packed / Staged</option>
              <option value="Shipped">Shipped (In Transit)</option>
              <option value="Delivered">Delivered (POD)</option>
            </select>
          </div>
        )}

        <div className="relative w-full lg:w-80">
          <span className="absolute left-3 top-2 opacity-40">🔍</span>
          <input 
            type="text" 
            placeholder="Search Order ID, Customer, or Address..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-gray-300 pl-9 pr-4 py-2 rounded-sm text-xs font-semibold outline-none focus:border-[#125ab2] transition-colors shadow-sm"
          />
        </div>
      </div>

      {/* ── MAIN TABLE ── */}
      <div className="bg-white border border-gray-300 shadow-sm w-full overflow-hidden rounded-sm flex flex-col hover:shadow-md transition-shadow">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-[#f8f9fa] text-[#64748b] text-[9px] uppercase tracking-widest border-b border-gray-200">
              <tr>
                <th className="py-3 px-4 text-center w-12">
                  <input type="checkbox" className="cursor-pointer w-3.5 h-3.5" onChange={toggleSelectAll} checked={allEligibleSelected} />
                </th>
                <th className="py-3 px-4 font-bold border-b w-40 cursor-pointer hover:text-gray-900" onClick={() => handleSort('id')}>
                  ORDER ID <SortIcon col="id" />
                </th>
                <th className="py-3 px-4 font-bold border-b w-64 cursor-pointer hover:text-gray-900" onClick={() => handleSort('customer')}>
                  CUSTOMER DETAILS <SortIcon col="customer" />
                </th>
                <th className="py-3 px-4 font-bold border-b w-40 cursor-pointer hover:text-gray-900" onClick={() => handleSort('weight')}>
                  CARGO PROFILE <SortIcon col="weight" />
                </th>
                <th className="py-3 px-4 font-bold border-b w-40 text-center">PIPELINE STATUS</th>
                <th className="py-3 px-4 font-bold border-b w-56">LOGISTICS TRACKING</th>
                <th className="py-3 px-4 font-bold border-b text-right">EXECUTION ACTIONS</th>
              </tr>
            </thead>
            <tbody className="text-[12px] text-gray-800">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-500 font-bold italic">
                    <span className="text-3xl block mb-2 opacity-50">📭</span>
                    No outbound manifests found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredData.map((so) => {
                  const isReady = so.status === 'Ready to Pick';
                  const isPacked = so.status === 'Packed / Staged';
                  const isShipped = so.status === 'Shipped';
                  const isDelivered = so.status === 'Delivered';
                  const isSelected = selectedIds.includes(so.id);
                  const isHazmat = (so.type || '').includes('Hazmat'); // Fallback Aman

                  return (
                    <tr key={so.id} onClick={() => { if (isReady || isPacked) toggleSelect(so.id) }} className={`border-b border-gray-100 transition-colors ${
                      isSelected ? 'bg-amber-50/50' : 
                      isDelivered ? 'bg-gray-50 opacity-60 grayscale hover:bg-gray-100' : 
                      'hover:bg-blue-50/40'
                    } ${isReady || isPacked ? 'cursor-pointer' : ''}`}>
                      
                      <td className="py-4 px-4 text-center">
                        {(isReady || isPacked) ? (
                          <input type="checkbox" className="cursor-pointer w-3.5 h-3.5" checked={isSelected} onChange={(e) => { e.stopPropagation(); toggleSelect(so.id); }} />
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      
                      <td className="py-4 px-4">
                        <div className="font-mono font-black text-[#125ab2] text-[13px]">{so.id}</div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">{so.date}</div>
                      </td>
                      
                      <td className="py-4 px-4 max-w-[280px] whitespace-normal">
                        <div className="font-bold text-gray-900 leading-tight">{so.customer}</div>
                        {so.address && <div className="text-[10px] text-gray-500 mt-1 truncate" title={so.address}>📍 {so.address}</div>}
                        {so.notes && <div className="text-[10px] text-amber-700 italic font-bold mt-1.5 truncate border-l-2 border-amber-300 pl-1.5" title={so.notes}>"{so.notes}"</div>}
                      </td>
                      
                      <td className="py-4 px-4">
                        <div className="font-mono font-black text-gray-800 text-[13px]">{Number(so.weight || 0).toLocaleString()} <span className="text-[9px] text-gray-500">KG</span></div>
                        <span className={`inline-block mt-1.5 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-sm border shadow-sm ${
                          isHazmat ? 'bg-red-600 text-white border-red-700 animate-pulse' : 
                          so.type === 'Heavy Chassis' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                          'bg-gray-100 text-gray-600 border-gray-300'
                        }`}>{so.type || 'Standard Parts'}</span>
                      </td>
                      
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2.5 py-1.5 rounded-sm font-black text-[9px] uppercase tracking-widest border shadow-sm ${getStatusBadge(so.status)}`}>
                          {so.status}
                        </span>
                      </td>
                      
                      <td className="py-4 px-4">
                        {so.trackingNumber ? (
                          <div>
                            <div className="text-[11px] font-black font-mono text-gray-900 bg-gray-100 px-2 py-0.5 rounded-sm inline-block border border-gray-200">{so.trackingNumber}</div>
                            {so.courier && <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1.5">🚚 {so.courier}</div>}
                          </div>
                        ) : (
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider italic">Awaiting Dispatch</span>
                        )}
                      </td>
                      
                      <td className="py-4 px-4 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {isReady && (
                            <button onClick={(e) => { e.stopPropagation(); updateSOStatus(so.id, 'Packed / Staged'); }} className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-sm text-[9px] font-bold uppercase tracking-wider transition-colors shadow-sm">
                              Pack Order
                            </button>
                          )}
                          {isPacked && (
                            <button onClick={(e) => { e.stopPropagation(); setActiveSO(so); }} className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-3 py-1.5 rounded-sm text-[9px] font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center gap-1">
                              <span>🖨️</span> Ship
                            </button>
                          )}
                          {isShipped && (
                            <button onClick={(e) => { e.stopPropagation(); updateSOStatus(so.id, 'Delivered'); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-sm text-[9px] font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center gap-1">
                              <span>✓</span> Sign POD
                            </button>
                          )}
                          
                          {/* Common Actions */}
                          {!isDelivered && (
                            <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(so); }} className="bg-white border border-gray-300 hover:bg-gray-100 text-[#125ab2] px-2.5 py-1.5 rounded-sm text-[10px] font-black transition-colors shadow-sm" title="Edit">
                              ✎
                            </button>
                          )}
                          {!isShipped && !isDelivered && (
                            <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(so.id); }} className="bg-white border border-red-200 hover:bg-red-50 text-red-600 px-2.5 py-1.5 rounded-sm text-[10px] font-black transition-colors shadow-sm" title="Void Order">
                              ✕
                            </button>
                          )}
                        </div>
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
      {/* 🛡️ MODAL: CREATE / EDIT OUTBOUND MANIFEST                               */}
      {/* ========================================================================= */}
      {(isNewSOModalOpen || editSO) && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[600px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-[#125ab2]" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            <div className="bg-blue-50 border-b border-blue-100 px-6 py-4 flex justify-between items-center shrink-0 z-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-[#125ab2]">Outbound Logistics</p>
                <h3 className="font-black text-sm uppercase tracking-wider text-gray-900">{editSO ? `Update Order: ${editSO.id}` : 'Generate Outbound Manifest'}</h3>
              </div>
              <button onClick={() => { setIsNewSOModalOpen(false); setEditSO(null); }} className="text-blue-400 hover:text-blue-800 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <form onSubmit={editSO ? handleSaveEdit : handleSaveNewSO} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 text-sm flex flex-col gap-5">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Target Customer / Entity <span className="text-red-500">*</span></label>
                    <input type="text" value={editSO ? editForm.customer : newSOForm.customer} onChange={e => editSO ? setEditForm({...editForm, customer: e.target.value}) : setNewSOForm({...newSOForm, customer: e.target.value})} placeholder="e.g. Dealership Jakarta" className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] font-black text-gray-900 rounded-sm shadow-sm text-xs" required autoFocus/>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Expected Dispatch Date <span className="text-red-500">*</span></label>
                    <input type="date" value={editSO ? editForm.date : newSOForm.date} onChange={e => editSO ? setEditForm({...editForm, date: e.target.value}) : setNewSOForm({...newSOForm, date: e.target.value})} className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] font-mono font-bold text-gray-800 rounded-sm shadow-sm cursor-pointer text-xs" required/>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Delivery Address <span className="text-red-500">*</span></label>
                  <input type="text" value={editSO ? editForm.address : newSOForm.address} onChange={e => editSO ? setEditForm({...editForm, address: e.target.value}) : setNewSOForm({...newSOForm, address: e.target.value})} placeholder="Full destination address..." className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] font-semibold text-gray-800 rounded-sm shadow-sm text-xs" required/>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Cargo Tonnage (KG) <span className="text-red-500">*</span></label>
                    <input type="number" min="1" value={editSO ? editForm.weight : newSOForm.weight} onChange={e => editSO ? setEditForm({...editForm, weight: e.target.value}) : setNewSOForm({...newSOForm, weight: e.target.value})} placeholder="e.g. 1500" className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] font-mono font-black text-[#125ab2] bg-blue-50/30 rounded-sm shadow-sm text-xs" required/>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Cargo Profile / Hazmat <span className="text-red-500">*</span></label>
                    <select value={editSO ? editForm.type : newSOForm.type} onChange={e => editSO ? setEditForm({...editForm, type: e.target.value}) : setNewSOForm({...newSOForm, type: e.target.value})} className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] font-bold text-gray-700 bg-white rounded-sm shadow-sm cursor-pointer text-xs" required>
                      {typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Special Handling Notes</label>
                  <textarea rows="2" value={editSO ? editForm.notes : newSOForm.notes} onChange={e => editSO ? setEditForm({...editForm, notes: e.target.value}) : setNewSOForm({...newSOForm, notes: e.target.value})} placeholder="Clearance documentation, fragility warnings..." className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] rounded-sm resize-none text-xs font-medium shadow-sm"></textarea>
                </div>

              </div>
              
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 shrink-0 z-10">
                <button type="button" onClick={() => { setIsNewSOModalOpen(false); setEditSO(null); }} className="w-full sm:w-auto px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm rounded-sm">Cancel</button>
                <button type="submit" className="w-full sm:w-auto px-6 py-2.5 bg-[#125ab2] hover:bg-[#0e4487] text-white text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors rounded-sm flex items-center justify-center gap-2">
                  {editSO ? 'Commit Changes' : 'Generate Manifest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ MODAL: SINGLE DISPATCH (PRINT & SHIP)                                  */}
      {/* ========================================================================= */}
      {activeSO && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[500px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-[#125ab2]" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            <div className="bg-[#415a77] text-white px-6 py-4 flex justify-between items-center shrink-0 z-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 opacity-80">Dispatch Terminal</p>
                <h3 className="font-black text-sm uppercase tracking-wider">Execute Shipment: {activeSO.id}</h3>
              </div>
              <button onClick={() => { setActiveSO(null); setSelectedCourier('Zentryx Flatbed Fleet'); }} className="text-white opacity-70 hover:opacity-100 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 space-y-5">
              
              <div className="grid grid-cols-2 gap-4 border-b border-gray-200 pb-5">
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Target Customer</p>
                  <p className="font-black text-gray-900 text-sm leading-tight">{activeSO.customer}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Cargo Profile</p>
                  <span className={`inline-block px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-sm border shadow-sm ${activeSO.type?.includes('Hazmat') ? 'bg-red-600 text-white border-red-700 animate-pulse' : 'bg-gray-100 text-gray-800 border-gray-300'}`}>{activeSO.type || 'Standard Parts'}</span>
                  <p className="font-mono font-black text-[#125ab2] mt-1">{Number(activeSO.weight || 0).toLocaleString()} KG</p>
                </div>
              </div>

              {activeSO.notes && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-sm shadow-inner">
                  <p className="text-[9px] font-black text-amber-800 uppercase tracking-wider mb-1">Handling Warnings</p>
                  <p className="text-xs text-amber-900 italic font-semibold">"{activeSO.notes}"</p>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Assign Fleet / Carrier <span className="text-red-500">*</span></label>
                <select value={selectedCourier} onChange={e => setSelectedCourier(e.target.value)} className="w-full border border-gray-300 p-3 outline-none focus:border-[#125ab2] font-black text-[#125ab2] bg-blue-50/30 rounded-sm shadow-sm cursor-pointer text-sm">
                  {courierOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-2 text-center">A shipping label with Master AWB will be generated in a new window.</p>
              </div>

            </div>
            
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 shrink-0 z-10">
              <button onClick={() => { setActiveSO(null); setSelectedCourier('Zentryx Flatbed Fleet'); }} className="w-full sm:w-auto px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm rounded-sm">Cancel</button>
              <button onClick={handleProsesKirimSingle} className="w-full sm:w-auto px-6 py-2.5 bg-[#125ab2] hover:bg-[#0e4487] text-white text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors rounded-sm flex items-center justify-center gap-2">
                <span>🖨️</span> Print Label & Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ MODAL: BATCH PRINT EXECUTION                                           */}
      {/* ========================================================================= */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[450px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-amber-500" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            <div className="bg-amber-500 text-white px-6 py-4 flex justify-between items-center shrink-0 z-10">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-0.5 opacity-90">Mass Dispatch Execution</p>
                <h3 className="font-black text-sm uppercase tracking-wider">Batch Print Freight Labels</h3>
              </div>
              <button onClick={() => setIsBatchModalOpen(false)} className="text-white opacity-80 hover:opacity-100 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 space-y-6">
              
              <div className="text-center">
                <span className="text-5xl block mb-2 opacity-80">🚛</span>
                <p className="text-4xl font-black text-gray-900 font-mono">{selectedIds.length}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Cargo Manifests Queued</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Assign Fleet/Carrier for entire batch <span className="text-red-500">*</span></label>
                <select value={batchCourier} onChange={e => setBatchCourier(e.target.value)} className="w-full border border-gray-300 p-3 outline-none focus:border-amber-500 font-black text-amber-700 bg-amber-50/50 rounded-sm shadow-sm cursor-pointer text-sm">
                  {courierOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-2 text-center text-amber-600/80">Make sure pop-ups are allowed in your browser.</p>
              </div>

            </div>
            
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex flex-col sm:flex-row justify-end gap-3 shrink-0 z-10">
              <button onClick={() => setIsBatchModalOpen(false)} className="w-full sm:w-auto px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm rounded-sm">Cancel</button>
              <button onClick={handleBatchPrintExecute} className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm transition-colors rounded-sm flex items-center justify-center gap-2">
                <span>🖨️</span> Execute {selectedIds.length} Labels
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ MODAL: DELETE CONFIRMATION                                             */}
      {/* ========================================================================= */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[110] p-4">
          <div className="bg-white p-8 rounded-sm w-[400px] shadow-2xl text-center border-t-4 border-red-600 animate-fade-in">
            <div className="text-5xl mb-4 opacity-90">⚠️</div>
            <h3 className="font-black text-lg text-gray-900 mb-2 uppercase tracking-wide">Void Outbound Order?</h3>
            <p className="text-xs text-gray-500 font-semibold mb-6 leading-relaxed">
              Are you sure you want to permanently void order <span className="font-bold text-red-600">{deleteConfirmId}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteConfirmId(null)} className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-colors w-full">Cancel</button>
              <button onClick={() => handleDeleteSO(deleteConfirmId)} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm rounded-sm w-full transition-colors">Yes, Void Order</button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
};

export default FulfillOrders;