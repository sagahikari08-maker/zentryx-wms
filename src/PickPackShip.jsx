import React, { useContext, useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { AppContext } from './AppContext';

// ─── TOAST COMPONENT ─────────────────────────────────────────────────────────
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
    {toasts.map(toast => (
      <div
        key={toast.id}
        className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-sm shadow-xl text-white text-xs font-semibold min-w-[280px] border-l-4 ${
          toast.type === 'success' ? 'bg-emerald-600 border-emerald-800' :
          toast.type === 'error'   ? 'bg-red-600 border-red-800' :
          toast.type === 'warning' ? 'bg-amber-500 border-amber-800' : 'bg-[#125ab2] border-blue-800'
        }`}
      >
        <span className="text-base">
          {toast.type === 'success' ? '✓' : toast.type === 'error' ? '🚨' : toast.type === 'warning' ? '⚠️' : 'ℹ'}
        </span>
        <span className="flex-1">{toast.message}</span>
        <button onClick={() => removeToast(toast.id)} className="opacity-70 hover:opacity-100 text-lg leading-none">×</button>
      </div>
    ))}
  </div>
);

// ─── PRIORITY BADGE ──────────────────────────────────────────────────────────
const PriorityBadge = ({ priority }) => {
  const map = {
    High:     'bg-red-100 text-red-700 border-red-300',
    Critical: 'bg-red-600 text-white border-red-800 animate-pulse',
    Normal:   'bg-gray-100 text-gray-600 border-gray-300',
    Low:      'bg-blue-50 text-blue-500 border-blue-200',
  };
  return (
    <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-widest border shadow-sm ${map[priority] || map.Normal}`}>
      {priority || 'Normal'}
    </span>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const PickPackShip = () => {
  // ─── 🚀 INJEKSI: Memanggil taskData & setInventoryData dari AppContext ───
  const { soData, setSoData, bahasa, taskData, setInventoryData } = useContext(AppContext);

  // ─── ARUS MOTORS AUTO-SEEDER (HARD OVERRIDE) ─────────────────────────────
  useEffect(() => {
    const isOldData = soData.length === 0 || !soData.some(so => so.id?.startsWith('SO-ARS'));

    if (isOldData) {
      setSoData([
        {
          id: 'SO-ARS-2609-001', customer: 'ARUS Dealership - Jakarta Selatan', date: '2026-09-20', address: 'DKI Jakarta, ID', notes: 'High Voltage Handing Required', priority: 'High', status: 'Ready to Pick',
          items: [{ sku: 'SKU-ARS-EVPLATFORM', qty: 5, desc: 'ARUS EV Skateboard Platform (Series 1)' }], createdAt: new Date().toISOString()
        },
        {
          id: 'SO-ARS-2609-002', customer: 'PT Energi Nusantara (B2B Fleet)', date: '2026-09-22', address: 'Surabaya, East Java, ID', notes: 'Partial shipment allowed', priority: 'Normal', status: 'Picking',
          items: [{ sku: 'BATT-LFP-75K', qty: 10, desc: 'ARUS Modular Battery Pack 75kWh' }, { sku: 'SKU-ARS-CBL12', qty: 50, desc: 'High Voltage Harness Cable 50mm2' }], createdAt: new Date().toISOString(), pickingStartAt: new Date().toISOString()
        },
        {
          id: 'SO-ARS-2609-003', customer: 'Global EV Exporters Ltd.', date: '2026-09-18', address: 'Port of Tanjung Priok', notes: 'Export Compliance Docs Attached', priority: 'Critical', status: 'Packing',
          items: [{ sku: 'SKU-ARS-MCU03', qty: 50, desc: 'Motor Control Unit (MCU) Gen 3' }], createdAt: new Date().toISOString(), pickingStartAt: new Date().toISOString(), packingStartAt: new Date().toISOString()
        }
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── 🚀 ENGINE INTERLOCK: AUTO-SYNC DENGAN SCANNER OPERATOR ───
  useEffect(() => {
    if (!taskData || !setInventoryData) return;
    
    setSoData(prevSO => {
      let changed = false;
      const nextSO = prevSO.map(so => {
        if (so.status === 'Ready to Pick' || so.status === 'Picking') {
          // Cari apakah ada Task di Scanner yang refId-nya sama dengan Order ini
          const relatedTask = taskData.find(t => t.refId === so.id && t.type === 'Picking');
          
          if (relatedTask && relatedTask.status === 'Completed' && so.status !== 'Packing') {
            changed = true;
            
            // 💥 TRIGGER INJEKSI: Kurangi stok inventaris riil karena Picking selesai
            setInventoryData(inv => {
              let newInv = [...inv];
              (so.items || []).forEach(item => {
                if (item.sku && item.sku !== 'MISC-000' && item.sku !== 'SKU-ARS-GENERIC') {
                  newInv = newInv.map(i => i.sku === item.sku ? { ...i, qty: Math.max(0, i.qty - Number(item.qty)) } : i);
                }
              });
              return newInv;
            });

            return { ...so, status: 'Packing', packingStartAt: relatedTask.deliveredAt || new Date().toISOString() };
          } else if (relatedTask && relatedTask.status === 'In Progress' && so.status === 'Ready to Pick') {
            changed = true;
            return { ...so, status: 'Picking', pickingStartAt: relatedTask.pickingStartAt || new Date().toISOString() };
          }
        }
        return so;
      });
      return changed ? nextSO : prevSO;
    });
  }, [taskData, setSoData, setInventoryData]);

  // ─── TOAST ───────────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);
  const removeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  // ─── MODAL STATES ────────────────────────────────────────────────────────
  const [activeSO, setActiveSO]               = useState(null); // Print & Ship Modal
  const [selectedCourier, setSelectedCourier] = useState('Zentryx Fleet Transport');
  const [isNewSOModalOpen, setIsNewSOModalOpen] = useState(false);
  const [newSOForm, setNewSOForm] = useState({
    customer: '', date: new Date().toISOString().split('T')[0],
    address: '', notes: '', priority: 'Normal',
    items: [{ sku: '', qty: 1, desc: '' }]
  });
  const [detailSO, setDetailSO]         = useState(null);
  const [editSO, setEditSO]             = useState(null);
  const [editForm, setEditForm]         = useState({});
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // ─── TABLE STATES ────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds]       = useState([]);
  const [searchQuery, setSearchQuery]       = useState('');
  const [statusFilter, setStatusFilter]     = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [dateFrom, setDateFrom]             = useState('');
  const [dateTo, setDateTo]                 = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [currentPage, setCurrentPage]       = useState(1);
  const [pageSize, setPageSize]             = useState(10);
  const [activeStageTab, setActiveStageTab] = useState('All');

  // Scanner Simulator State
  const [simulatedScan, setSimulatedScan] = useState('');

  // ─── ESC TO CLOSE MODALS ─────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (activeSO)          { setActiveSO(null); setSelectedCourier('Zentryx Fleet Transport'); }
      else if (editSO)       setEditSO(null);
      else if (detailSO)     setDetailSO(null);
      else if (isNewSOModalOpen) setIsNewSOModalOpen(false);
      else if (deleteConfirmId)  setDeleteConfirmId(null);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeSO, editSO, detailSO, isNewSOModalOpen, deleteConfirmId]);

  // ─── WORKFLOW STAGE HANDLERS ─────────────────────────────────────────────
  const handleStartPicking  = useCallback((id) => { setSoData(prev => prev.map(so => so.id === id ? { ...so, status: 'Picking',  pickingStartAt: new Date().toISOString() } : so)); addToast(`Task Sent: ${id} → Picking`, 'info'); }, [setSoData, addToast]);
  
  // 🚀 INJEKSI: Mengurangi stok inventaris saat digeser manual ke Packing
  const handleMarkPacking   = useCallback((id) => { 
    setSoData(prev => {
      const so = prev.find(s => s.id === id);
      if (so && so.status !== 'Packing') {
        setInventoryData(inv => {
          let newInv = [...inv];
          (so.items || []).forEach(item => {
            if (item.sku && item.sku !== 'MISC-000' && item.sku !== 'SKU-ARS-GENERIC') {
              newInv = newInv.map(i => i.sku === item.sku ? { ...i, qty: Math.max(0, i.qty - Number(item.qty)) } : i);
            }
          });
          return newInv;
        });
      }
      return prev.map(s => s.id === id ? { ...s, status: 'Packing',  packingStartAt: new Date().toISOString() } : s);
    });
    addToast(`Stage Cleared: ${id} → Packing Staging Area. Inventory Deducted.`, 'info'); 
  }, [setSoData, addToast, setInventoryData]);
  
  const handleMarkDelivered = useCallback((id) => { setSoData(prev => prev.map(so => so.id === id ? { ...so, status: 'Delivered', deliveredAt:  new Date().toISOString() } : so)); addToast(`POD Confirmed: ${id} → Delivered`, 'success'); }, [setSoData, addToast]);

  // ─── HARDWARE SCANNER LOGIC ──────────────────────────────────────────────
  const processBarcode = useCallback((code) => {
    const scannedCode = code.toUpperCase().trim();
    
    const targetSO = soData.find(so => so.id.toUpperCase() === scannedCode || so.trackingNumber?.toUpperCase() === scannedCode);
    
    if (targetSO) {
      addToast(`Scanner Hit: Processing ${targetSO.id}...`, 'info');
      
      // Auto-escalate status based on current stage
      if (targetSO.status === 'Ready to Pick') {
        handleStartPicking(targetSO.id);
      } else if (targetSO.status === 'Picking') {
        handleMarkPacking(targetSO.id);
      } else if (targetSO.status === 'Packing') {
        setActiveSO(targetSO); // Opens the shipping modal
        addToast(`Order ${targetSO.id} is ready for Dispatch. Assign a carrier.`, 'success');
      } else if (targetSO.status === 'Shipped') {
        handleMarkDelivered(targetSO.id);
      } else {
        addToast(`Terminal Block: Order ${targetSO.id} is already ${targetSO.status}.`, 'warning');
      }
    } else {
      addToast(`Scanner Error: Barcode [${scannedCode}] not recognized in master ledger.`, 'error');
    }
  }, [soData, addToast, handleStartPicking, handleMarkPacking, handleMarkDelivered]);

  // Invisible Scanner Listener
  const bufferRef = useRef('');
  const timerRef = useRef(null);
  useEffect(() => {
    const handleGlobalScan = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Enter' && bufferRef.current.length > 3) {
        e.preventDefault();
        processBarcode(bufferRef.current);
        bufferRef.current = '';
      } else if (e.key.length === 1) {
        bufferRef.current += e.key;
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => { bufferRef.current = ''; }, 2000); // 2 sec timeout
      }
    };
    window.addEventListener('keydown', handleGlobalScan);
    return () => { window.removeEventListener('keydown', handleGlobalScan); clearTimeout(timerRef.current); };
  }, [processBarcode]);

  const handleSimulatedSubmit = (e) => {
    e.preventDefault();
    if (simulatedScan) {
      processBarcode(simulatedScan);
      setSimulatedScan('');
    }
  };

  // ─── SUMMARY STATS ───────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:       soData.length,
    ready:       soData.filter(s => s.status === 'Ready to Pick').length,
    picking:     soData.filter(s => s.status === 'Picking').length,
    packing:     soData.filter(s => s.status === 'Packing').length,
    shipped:     soData.filter(s => s.status === 'Shipped').length,
    delivered:   soData.filter(s => s.status === 'Delivered').length,
    highPriority: soData.filter(s => (s.priority === 'High' || s.priority === 'Critical') && s.status !== 'Delivered').length,
  }), [soData]);

  // ─── FILTERED & SORTED DATA ──────────────────────────────────────────────
  const filteredData = useMemo(() => {
    let data = [...soData];
    if (activeStageTab !== 'All') data = data.filter(so => so.status === activeStageTab);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(so =>
        so.id.toLowerCase().includes(q) ||
        so.customer.toLowerCase().includes(q) ||
        (so.address && so.address.toLowerCase().includes(q)) ||
        (so.trackingNumber && so.trackingNumber.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== 'All')   data = data.filter(so => so.status === statusFilter);
    if (priorityFilter !== 'All') data = data.filter(so => (so.priority || 'Normal') === priorityFilter);
    if (dateFrom) data = data.filter(so => so.date >= dateFrom);
    if (dateTo)   data = data.filter(so => so.date <= dateTo);

    data.sort((a, b) => {
      // Hard pin Critical/High to the top unless Delivered
      const aIsHigh = (a.priority === 'High' || a.priority === 'Critical') && a.status !== 'Delivered';
      const bIsHigh = (b.priority === 'High' || b.priority === 'Critical') && b.status !== 'Delivered';
      
      if (aIsHigh && !bIsHigh) return -1;
      if (!aIsHigh && bIsHigh) return 1;

      // Regular Sorting
      const aVal = a[sortConfig.key] || '';
      const bVal = b[sortConfig.key] || '';
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return data;
  }, [soData, searchQuery, statusFilter, priorityFilter, dateFrom, dateTo, sortConfig, activeStageTab]);

  // ─── PAGINATION ──────────────────────────────────────────────────────────
  const totalPages    = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  useEffect(() => setCurrentPage(1), [searchQuery, statusFilter, priorityFilter, dateFrom, dateTo, activeStageTab, pageSize]);

  const handleSort = (key) => setSortConfig(prev => ({
    key,
    direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
  }));

  const SortIcon = ({ col }) => {
    if (sortConfig.key !== col) return <span className="text-gray-300 ml-1 opacity-50">↕</span>;
    return <span className="ml-1 text-[#125ab2] font-black">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  // ─── CHECKBOX LOGIC ──────────────────────────────────────────────────────
  const selectableInPage    = paginatedData.filter(so => so.status !== 'Delivered');
  const allSelected         = selectableInPage.length > 0 && selectableInPage.every(so => selectedIds.includes(so.id));
  const toggleSelect        = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleSelectAll     = () => allSelected ? setSelectedIds([]) : setSelectedIds(selectableInPage.map(so => so.id));

  // ─── ORDER AGE BADGE ─────────────────────────────────────────────────────
  const OrderAgeBadge = ({ date }) => {
    const age = Math.floor((new Date() - new Date(date)) / 86400000);
    if (age <= 1) return null;
    const cls = age > 7 ? 'bg-red-100 text-red-600 border border-red-200' : age > 3 ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-gray-100 text-gray-500 border border-gray-200';
    return <span className={`ml-1.5 text-[9px] px-1.5 py-0.5 rounded-sm font-black uppercase tracking-wider shadow-sm ${cls}`}>{age} Days Old</span>;
  };

  // ─── STATUS HELPERS ──────────────────────────────────────────────────────
  const getStatusBadge = (status) => ({
    'Ready to Pick': 'bg-blue-100 text-blue-800 border-blue-300',
    'Picking':       'bg-purple-100 text-purple-800 border-purple-300',
    'Packing':       'bg-amber-100 text-amber-800 border-amber-300',
    'Shipped':       'bg-orange-100 text-orange-800 border-orange-300',
    'Delivered':     'bg-emerald-100 text-emerald-800 border-emerald-300',
  })[status] || 'bg-gray-100 text-gray-600 border-gray-300';

  // ─── PRINT ASSETS & HTML GENERATORS ──────────────────────────────────────
  const fontLinks = `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Helvetica+Neue:wght@400;700;900&family=Libre+Barcode+39&display=swap" rel="stylesheet">
  `;

  const shippingLabelStyles = `
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; color: #000; background: #fff; }
    .label-wrapper { border: 4px solid #000; width: 450px; margin: 0 auto; box-sizing: border-box; overflow: hidden; page-break-after: always; }
    .header { background: #000; color: #fff; padding: 25px 20px; text-align: center; }
    .courier-name { font-size: 32px; font-weight: 900; text-transform: uppercase; letter-spacing: -1px; line-height: 1; }
    .service-type { font-size: 13px; font-weight: 700; letter-spacing: 4px; margin-top: 8px; color: #fff; }
    .flex-row { display: flex; border-bottom: 2px solid #000; }
    .col-left { flex: 1; border-right: 2px solid #000; padding: 20px; }
    .col-right { flex: 1; padding: 20px; }
    .label { font-size: 11px; color: #000; text-transform: uppercase; font-weight: 900; margin-bottom: 5px; letter-spacing: 1px; border-bottom: 1px solid #ccc; padding-bottom: 3px; display: inline-block; }
    .text-main { font-size: 14px; font-weight: 600; line-height: 1.5; margin-top: 5px; }
    .text-lg { font-size: 22px; font-weight: 900; line-height: 1.1; margin-top: 5px; text-transform: uppercase; }
    .barcode-section { text-align: center; padding: 30px 20px; border-bottom: 2px solid #000; }
    .barcode-real { font-family: 'Libre Barcode 39', cursive; font-size: 75px; line-height: 0.7; margin: 10px 0; font-weight: normal; color: #000; }
    .tracking-text { font-size: 20px; font-weight: 900; letter-spacing: 3px; margin-top: 5px; }
    .footer { background: #000; padding: 15px; font-size: 10px; text-align: center; color: #fff; font-weight: 700; letter-spacing: 1px; }
  `;

  const packingSlipStyles = `
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #000; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 28px; font-weight: 900; border-bottom: 4px solid #000; padding-bottom: 15px; margin-bottom: 25px; text-transform: uppercase; letter-spacing: 1px; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 14px; }
    .ml { font-weight: 900; font-size: 11px; text-transform: uppercase; color: #000; letter-spacing: 1px; margin-bottom: 4px; border-bottom: 1px solid #000; display: inline-block; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; border: 2px solid #000; }
    th { background: #000; color: #fff; text-align: left; padding: 12px 15px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
    td { padding: 12px 15px; font-size: 14px; border-bottom: 1px solid #000; border-right: 1px solid #000; font-weight: 600; }
    .tr td { font-weight: 900; border-top: 3px solid #000; background: #f0f0f0; }
    .ft { margin-top: 60px; text-align: center; font-size: 12px; color: #000; border-top: 2px solid #000; padding-top: 20px; font-weight: 700; }
    .pb { background: #000; color: white; padding: 4px 10px; font-size: 14px; font-weight: 900; vertical-align: middle; float: right; }
    .box { width: 25px; height: 25px; border: 2px solid #000; display: inline-block; }
    @media print { @page { size: A4; margin: 1cm; } }
  `;

  const generateTrackingNumber = () => `AWB-${Math.floor(10000000 + Math.random() * 90000000)}`;

  const buildLabelHTML = (so, courier, trackingNumber) => `
    <div class="label-wrapper">
      <div class="header">
        <div class="courier-name">${courier}</div>
        <div class="service-type">INDUSTRIAL OUTBOUND FREIGHT</div>
      </div>
      <div class="flex-row">
        <div class="col-left">
          <div class="label">SENDER:</div>
          <div class="text-main" style="font-size:13px"><b>ARUS GIGAFACTORY</b><br/>KIT Batang, Blok C<br/>Jawa Tengah, INA</div>
        </div>
        <div class="col-right">
          <div class="label">SHIP TO:</div>
          <div class="text-lg">${so.customer}</div>
          <div class="text-main" style="font-size:12px">${so.address || 'Address on file'}</div>
        </div>
      </div>
      <div class="flex-row">
        <div class="col-left">
          <div class="label">ORDER REF:</div>
          <div class="text-main" style="font-weight:900">${so.id}</div>
        </div>
        <div class="col-right">
          <div class="label">DISPATCH DATE:</div>
          <div class="text-main" style="font-weight:900">${so.date}</div>
        </div>
      </div>
      <div class="barcode-section">
        <div class="label" style="border:none">MASTER TRACKING NUMBER</div>
        <div class="barcode-real">*${trackingNumber}*</div>
        <div class="tracking-text">${trackingNumber}</div>
      </div>
      ${so.notes ? `<div style="padding:15px; border-bottom:2px solid #000; background:#f9f9f9"><div class="label">DISPATCH NOTES:</div><div style="font-size:13px; font-weight:700; margin-top:5px; text-transform:uppercase">${so.notes}</div></div>` : ''}
      <div class="footer">ARUS MOTORS WMS ENGINE &bull; AUTHORIZED DISPATCH</div>
    </div>
  `;

  const buildPackingSlipHTML = (so) => {
    const items = (so.items && so.items.filter(i => i.sku || i.desc).length > 0) ? so.items : [{ sku: 'MISC-000', qty: 1, desc: 'Standard Fulfillment Package' }];
    const rows = items.map((item, i) => `
      <tr>
        <td style="text-align:center">${i + 1}</td>
        <td style="font-family:'Courier New', monospace">${item.sku || '—'}</td>
        <td>${item.desc || 'Item'}</td>
        <td style="text-align:center; font-size:18px">${item.qty}</td>
        <td style="text-align:center"><div class="box"></div></td>
      </tr>`).join('');
    const totalQty = items.reduce((s, i) => s + (parseInt(i.qty) || 0), 0);
    
    return `
      <h1>OFFICIAL PACKING SLIP ${(so.priority === 'High' || so.priority === 'Critical') ? '<span class="pb">URGENT DISPATCH</span>' : ''}</h1>
      <div class="meta">
        <div>
          <div class="ml">Delivery Destination:</div><br/>
          <b style="font-size:18px">${so.customer}</b><br/>
          <span style="color:#000;font-size:14px;margin-top:5px;display:block">${so.address || 'Address not specified'}</span>
        </div>
        <div style="text-align:right">
          <div class="ml">Order Reference ID:</div><br/><b style="font-size:18px">${so.id}</b><br/><br/>
          <div class="ml">Order Date:</div><br/>${so.date}<br/><br/>
          <div class="ml">Print Timestamp:</div><br/>${new Date().toLocaleString('id-ID')}
        </div>
      </div>
      ${so.notes ? `<div style="border:3px solid #000; padding:15px; margin-bottom:25px; font-size:14px"><b>⚠️ CRITICAL HANDLING NOTES:</b><br/>${so.notes}</div>` : ''}
      <table>
        <thead>
          <tr>
            <th style="width:40px;text-align:center">#</th>
            <th style="width:140px">SKU CODE</th>
            <th style="width:100%">COMMODITY DESCRIPTION</th>
            <th style="width:80px;text-align:center">REQUIRED</th>
            <th style="width:80px;text-align:center">PICKED</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr class="tr">
            <td colspan="3" style="text-align:right">TOTAL CARGO UNITS</td>
            <td style="text-align:center;font-size:20px">${totalQty}</td>
            <td style="background:#000"></td>
          </tr>
        </tbody>
      </table>
      <div class="ft">
        <table style="border:none; margin-top:0;">
          <tr style="background:#fff">
            <td style="border:none; text-align:center">Picked By (Sign):<br/><br/><br/>______________________</td>
            <td style="border:none; text-align:center">Checked By (Sign):<br/><br/><br/>______________________</td>
            <td style="border:none; text-align:center">Date / Time:<br/><br/><br/>______________________</td>
          </tr>
        </table>
        <br/>ARUS MOTORS GIGAFACTORY WMS
      </div>`;
  };

  // ─── PRINT FUNCTIONS ─────────────────────────────────────────────────────
  const openPrintWindow = (title, styles, body, extraStyles = '') => {
    const w = window.open('', '_blank', 'width=900,height=700');
    w.document.write(`<html><head><title>${title}</title>${fontLinks}<style>${styles}${extraStyles}</style></head><body>${body}<script>setTimeout(()=>{window.print();},800);</script></body></html>`);
    w.document.close();
  };

  const printPackingSlip = (so) => openPrintWindow(`Packing Slip - ${so.id}`, packingSlipStyles, buildPackingSlipHTML(so));

  const printLabel = (so, courier) => {
    const trackingNumber = generateTrackingNumber();
    openPrintWindow(`Freight Label - ${so.id}`, shippingLabelStyles, buildLabelHTML(so, courier, trackingNumber));
    return trackingNumber;
  };

  // ─── BATCH & SINGLE SHIP ─────────────────────────────────────────────────
  const handleBatchPrint = () => {
    const toPrint = soData.filter(so => selectedIds.includes(so.id) && so.status === 'Packing');
    if (toPrint.length === 0) return addToast('Select orders currently in "Packing" stage to generate labels.', 'warning');
    
    const newNums = {};
    const labelsHTML = toPrint.map(so => {
      const tn = generateTrackingNumber();
      newNums[so.id] = tn;
      return `<div class="label-page">${buildLabelHTML(so, 'ZENTRYX FLEET TRANSPORT', tn)}</div>`;
    }).join('');
    
    openPrintWindow('Batch Freight Labels - ARUS', shippingLabelStyles, labelsHTML);
    
    setSoData(soData.map(so => newNums[so.id] ? { ...so, status: 'Shipped', trackingNumber: newNums[so.id], courier: 'Zentryx Fleet Transport', shippedAt: new Date().toISOString() } : so));
    setSelectedIds([]);
    addToast(`${toPrint.length} Cargo manifests generated and escalated to Shipped.`, 'success');
  };

  const handleProsesKirimSingle = () => {
    const trackingNumber = printLabel(activeSO, selectedCourier);
    setSoData(soData.map(so => so.id === activeSO.id ? { ...so, status: 'Shipped', trackingNumber, courier: selectedCourier, shippedAt: new Date().toISOString() } : so));
    addToast(`Manifest ${activeSO.id} dispatched via ${selectedCourier}.`, 'success');
    setActiveSO(null);
    setSelectedCourier('Zentryx Fleet Transport');
  };

  const handleBulkMarkDelivered = () => {
    const eligible = soData.filter(so => selectedIds.includes(so.id) && so.status === 'Shipped');
    if (!eligible.length) return addToast('No Shipped orders selected for POD verification.', 'warning');
    setSoData(soData.map(so => eligible.find(e => e.id === so.id) ? { ...so, status: 'Delivered', deliveredAt: new Date().toISOString() } : so));
    addToast(`POD confirmed for ${eligible.length} orders!`, 'success');
    setSelectedIds([]);
  };

  // ─── CRUD ────────────────────────────────────────────────────────────────
  const handleClearCompleted = () => {
    if(!window.confirm('Archive all delivered orders from the active queue?')) return;
    const count = soData.filter(so => so.status === 'Delivered').length;
    setSoData(soData.filter(so => so.status !== 'Delivered'));
    addToast(`${count} delivered orders archived.`, 'info');
  };

  const handleSaveNewSO = (e) => {
    e.preventDefault();
    if (!newSOForm.customer) return addToast('Customer entity is mandatory.', 'error');
    const cleanItems = newSOForm.items.filter(i => i.sku || i.desc);
    
    const nextNum = soData.length > 0 ? Math.max(...soData.map(i => parseInt(i.id.split('-')[2]) || 0)) + 1 : 1;
    const newId = `SO-ARS-${new Date().getFullYear().toString().slice(-2)}${String(new Date().getMonth()+1).padStart(2,'0')}-${nextNum.toString().padStart(3, '0')}`;

    setSoData([{ 
      id: newId, customer: newSOForm.customer, date: newSOForm.date, address: newSOForm.address, notes: newSOForm.notes, priority: newSOForm.priority,
      items: cleanItems.length > 0 ? cleanItems : [{ sku: 'MISC-000', qty: 1, desc: 'Standard Package' }],
      status: 'Ready to Pick', createdAt: new Date().toISOString()
    }, ...soData]);
    
    setIsNewSOModalOpen(false);
    setNewSOForm({ customer: '', date: new Date().toISOString().split('T')[0], address: '', notes: '', priority: 'Normal', items: [{ sku: '', qty: 1, desc: '' }] });
    addToast(`Outbound Order ${newId} generated. Pickers notified.`, 'success');
  };

  const handleOpenEdit = (so) => { setEditSO(so); setEditForm({ customer: so.customer, date: so.date, address: so.address || '', notes: so.notes || '', priority: so.priority || 'Normal' }); };
  const handleSaveEdit = (e) => {
    e.preventDefault();
    setSoData(soData.map(so => so.id === editSO.id ? { ...so, ...editForm } : so));
    addToast(`Manifest ${editSO.id} updated.`, 'success');
    setEditSO(null);
  };
  const handleDeleteSO = (id) => { setSoData(soData.filter(so => so.id !== id)); setDeleteConfirmId(null); addToast(`Order ${id} voided from system.`, 'warning'); };

  // ─── EXPORT CSV ──────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    addToast('Compiling Operations Manifest...', 'info');
    const headers = ['Order_ID','Target_Customer','Destination_Address','Dispatch_Date','Priority_Level','Current_Status','Carrier','Tracking_AWB','Time_Created','Time_Picked','Time_Packed','Time_Shipped','Time_Delivered','Handling_Notes'];
    const rows = filteredData.map(so => [so.id, `"${so.customer}"`, `"${so.address||''}"`, so.date, so.priority||'Normal', so.status, `"${so.courier||''}"`, so.trackingNumber||'', so.createdAt||'', so.pickingStartAt||'', so.packingStartAt||'', so.shippedAt||'', so.deliveredAt||'', `"${so.notes||''}"`]);
    const csv  = [headers,...rows].map(r => r.join(',')).join('\n');
    const url  = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    Object.assign(document.createElement('a'), { href: url, download: `ARUS_PickPackShip_Log_${new Date().toISOString().split('T')[0]}.csv` }).click();
    URL.revokeObjectURL(url);
  };

  // ─── ITEM FORM HELPERS ───────────────────────────────────────────────────
  const updateItem = (i, field, value) => {
    const items = [...newSOForm.items];
    items[i] = { ...items[i], [field]: value };
    setNewSOForm({ ...newSOForm, items });
  };
  const removeItem = (i) => {
    const items = newSOForm.items.filter((_, idx) => idx !== i);
    setNewSOForm({ ...newSOForm, items: items.length > 0 ? items : [{ sku: '', qty: 1, desc: '' }] });
  };

  // ─── STAGE TABS CONFIG ───────────────────────────────────────────────────
  const stageTabs = [
    { key: 'All',           label: 'All Active',   count: stats.total,      icon: '📋' },
    { key: 'Ready to Pick', label: 'Queue',        count: stats.ready,      icon: '📥' },
    { key: 'Picking',       label: 'Picking',      count: stats.picking,    icon: '🛒' },
    { key: 'Packing',       label: 'Packing',      count: stats.packing,    icon: '📦' },
    { key: 'Shipped',       label: 'In Transit',   count: stats.shipped,    icon: '🚛' },
    { key: 'Delivered',     label: 'Delivered',    count: stats.delivered,  icon: '✓'  },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 animate-fade-in">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>📦 Logistics</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Execution</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide">Pick, Pack, & Dispatch Flow</h2>
          {stats.highPriority > 0 ? (
            <p className="text-xs text-red-600 font-black mt-1 uppercase tracking-wider animate-pulse flex items-center gap-1.5">
              <span>⚠️</span> {stats.highPriority} Line-Stop / Critical Order(s) pending execution!
            </p>
          ) : (
            <p className="text-sm text-gray-500 mt-1">Manage outbound assembly pipelines and generate industrial shipping manifests.</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
          {/* ── SCANNER SIMULATOR ── */}
          <form onSubmit={handleSimulatedSubmit} className="bg-gray-900 border border-gray-800 px-3 py-2 rounded-sm shadow-sm flex items-center gap-2 mr-auto md:mr-4">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Scanner 🔫</span>
            <input 
              type="text" 
              value={simulatedScan}
              onChange={(e) => setSimulatedScan(e.target.value)}
              placeholder="Awaiting Barcode..." 
              className="bg-transparent text-white text-[11px] font-mono outline-none border-b border-gray-600 focus:border-emerald-400 w-32 placeholder-gray-500"
            />
          </form>

          <button onClick={handleExportCSV} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-sm shadow-sm text-[10px] font-bold uppercase tracking-wider transition-colors">
            ⭳ Export Log
          </button>
          <button onClick={handleClearCompleted} className="bg-white border border-gray-300 text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-sm shadow-sm text-[10px] font-bold uppercase tracking-wider transition-colors">
            🗑 Archive POD
          </button>
          <button onClick={() => setIsNewSOModalOpen(true)} className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-5 py-2.5 rounded-sm shadow-sm text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5">
            <span>+</span> Generate Outbound SO
          </button>
        </div>
      </div>

      {/* ── STAGE TABS ── */}
      <div className="flex flex-wrap gap-1 mb-5">
        {stageTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveStageTab(tab.key)}
            className={`px-4 py-2 text-[11px] font-black uppercase tracking-wider rounded-sm transition-colors shadow-sm flex items-center gap-2 border ${
              activeStageTab === tab.key
                ? 'border-[#125ab2] text-white bg-[#125ab2]'
                : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50'
            }`}
          >
            <span className="opacity-80 text-sm">{tab.icon}</span> 
            {tab.label}
            <span className={`ml-1 px-1.5 py-0.5 rounded-sm text-[9px] font-mono ${
              activeStageTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
            }`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* ── SEARCH & FILTER BAR ── */}
      <div className="bg-white p-3 border border-gray-300 shadow-sm rounded-sm mb-4 flex flex-col lg:flex-row gap-3 items-center justify-between">
        
        {selectedIds.length > 0 ? (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-4 py-2 rounded-sm w-full lg:w-auto shadow-inner">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-800">{selectedIds.length} Manifests Selected</span>
            
            {/* Conditional Batch Action Buttons */}
            {soData.filter(so => selectedIds.includes(so.id)).every(so => so.status === 'Packing') && (
              <button onClick={handleBatchPrint} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 rounded-sm text-[9px] font-bold uppercase tracking-wider shadow-sm transition-colors flex items-center gap-1.5">
                <span>🖨️</span> Batch Print Freight Labels
              </button>
            )}
            {soData.filter(so => selectedIds.includes(so.id)).every(so => so.status === 'Shipped') && (
              <button onClick={handleBulkMarkDelivered} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-sm text-[9px] font-bold uppercase tracking-wider shadow-sm transition-colors flex items-center gap-1.5">
                <span>✓</span> Verify POD for Batch
              </button>
            )}

            <button onClick={() => setSelectedIds([])} className="bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-sm text-[9px] font-bold uppercase tracking-wider shadow-sm transition-colors">Deselect All</button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700 outline-none rounded-sm cursor-pointer shadow-sm min-w-[150px]">
              <option value="All">All Priorities</option>
              <option value="Critical">Critical (Line-Stop)</option>
              <option value="High">High Priority</option>
              <option value="Normal">Normal</option>
            </select>
            <div className="flex items-center gap-2 border border-gray-300 bg-gray-50 px-3 py-1 rounded-sm shadow-sm">
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Timeline:</span>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer" />
              <span className="text-gray-400">-</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer" />
            </div>
          </div>
        )}

        <div className="relative w-full lg:w-80">
          <span className="absolute left-3 top-2 opacity-40">🔍</span>
          <input 
            type="text" 
            placeholder="Search Order ID, Target Entity, AWB..." 
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
                  <input type="checkbox" className="cursor-pointer w-3.5 h-3.5" onChange={toggleSelectAll} checked={allSelected} />
                </th>
                <th className="py-3 px-4 font-bold border-b w-40 cursor-pointer hover:text-gray-900" onClick={() => handleSort('id')}>
                  ORDER REF <SortIcon col="id" />
                </th>
                <th className="py-3 px-4 font-bold border-b w-64 cursor-pointer hover:text-gray-900" onClick={() => handleSort('customer')}>
                  DESTINATION ENTITY <SortIcon col="customer" />
                </th>
                <th className="py-3 px-4 font-bold border-b w-28 cursor-pointer hover:text-gray-900" onClick={() => handleSort('date')}>
                  DISPATCH DATE <SortIcon col="date" />
                </th>
                <th className="py-3 px-4 font-bold border-b w-40 text-center">PIPELINE STAGE</th>
                <th className="py-3 px-4 font-bold border-b w-52 text-center">LOGISTICS AWB</th>
                <th className="py-3 px-4 font-bold border-b text-right">WORKFLOW ACTIONS</th>
              </tr>
            </thead>
            <tbody className="text-[12px] text-gray-800">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-500 font-bold italic">
                    <span className="text-3xl block mb-2 opacity-50">📭</span>
                    No execution tasks found for the selected criteria.
                  </td>
                </tr>
              ) : (
                paginatedData.map((so, index) => {
                  const isReady     = so.status === 'Ready to Pick';
                  const isPicking   = so.status === 'Picking';
                  const isPacking   = so.status === 'Packing';
                  const isShipped   = so.status === 'Shipped';
                  const isDelivered = so.status === 'Delivered';
                  const isHigh      = so.priority === 'High' || so.priority === 'Critical';
                  const isSelected  = selectedIds.includes(so.id);

                  return (
                    <tr key={index} onClick={() => { if (!isDelivered) toggleSelect(so.id) }} className={`border-b border-gray-100 transition-colors ${
                      isSelected ? 'bg-amber-50/50' : 
                      isHigh && !isDelivered ? 'bg-red-50/40 hover:bg-red-50' :
                      isDelivered ? 'bg-gray-50 opacity-60 grayscale hover:bg-gray-100' : 
                      'hover:bg-blue-50/40'
                    } ${!isDelivered ? 'cursor-pointer' : ''}`}>
                      
                      <td className="py-4 px-4 text-center">
                        {!isDelivered ? (
                          <input type="checkbox" className="cursor-pointer w-3.5 h-3.5" checked={isSelected} onChange={(e) => { e.stopPropagation(); toggleSelect(so.id); }} />
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      
                      <td className="py-4 px-4">
                        <div className="font-mono font-black text-[#125ab2] text-[13px] hover:underline" onClick={(e) => { e.stopPropagation(); setDetailSO(so); }} title="Open Master Ledger">
                          {so.id}
                        </div>
                        <div className="mt-1.5"><PriorityBadge priority={so.priority} /></div>
                      </td>
                      
                      <td className="py-4 px-4 max-w-[280px] whitespace-normal">
                        <div className="font-bold text-gray-900 leading-tight">{so.customer}</div>
                        {so.address && <div className="text-[10px] text-gray-500 mt-1 truncate" title={so.address}>📍 {so.address}</div>}
                        {so.notes && <div className="text-[10px] text-amber-700 italic font-bold mt-1.5 truncate border-l-2 border-amber-300 pl-1.5" title={so.notes}>"{so.notes}"</div>}
                      </td>
                      
                      <td className="py-4 px-4">
                        <div className="font-bold text-gray-800 text-[11px]">{so.date}</div>
                        <OrderAgeBadge date={so.date} />
                      </td>
                      
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2.5 py-1.5 rounded-sm font-black text-[9px] uppercase tracking-widest border shadow-sm ${getStatusBadge(so.status)}`}>
                          {so.status}
                        </span>
                      </td>
                      
                      <td className="py-4 px-4 text-center">
                        {so.trackingNumber ? (
                          <div>
                            <div className="text-[11px] font-black font-mono text-gray-900 bg-gray-100 px-2 py-0.5 rounded-sm inline-block border border-gray-200">{so.trackingNumber}</div>
                            {so.courier && <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mt-1.5">🚚 {so.courier}</div>}
                          </div>
                        ) : (
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider italic">Awaiting Fleet</span>
                        )}
                      </td>
                      
                      <td className="py-4 px-4 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {/* DYNAMIC PIPELINE BUTTONS */}
                          {isReady && (
                            <button onClick={(e) => { e.stopPropagation(); handleStartPicking(so.id); }} className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-sm text-[9px] font-bold uppercase tracking-wider transition-colors shadow-sm">
                              Begin Pick
                            </button>
                          )}
                          {isPicking && (
                            <>
                              <button onClick={(e) => { e.stopPropagation(); printPackingSlip(so); }} className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 px-2.5 py-1.5 rounded-sm text-[10px] font-black transition-colors shadow-sm" title="Print Packing Slip">📄</button>
                              <button onClick={(e) => { e.stopPropagation(); handleMarkPacking(so.id); }} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-sm text-[9px] font-bold uppercase tracking-wider transition-colors shadow-sm">
                                To Staging
                              </button>
                            </>
                          )}
                          {isPacking && (
                            <button onClick={(e) => { e.stopPropagation(); setActiveSO(so); }} className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-3 py-1.5 rounded-sm text-[9px] font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center gap-1">
                              <span>🖨️</span> Assign Fleet
                            </button>
                          )}
                          {isShipped && (
                            <button onClick={(e) => { e.stopPropagation(); handleMarkDelivered(so.id); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-sm text-[9px] font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center gap-1">
                              <span>✓</span> Sign POD
                            </button>
                          )}
                          
                          {/* Common Actions */}
                          {!isDelivered && (
                            <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(so); }} className="bg-white border border-gray-300 hover:bg-gray-100 text-[#125ab2] px-2.5 py-1.5 rounded-sm text-[10px] font-black transition-colors shadow-sm" title="Edit Manifest">✎</button>
                          )}
                          {!isShipped && !isDelivered && (
                            <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(so.id); }} className="bg-white border border-red-200 hover:bg-red-50 text-red-600 px-2.5 py-1.5 rounded-sm text-[10px] font-black transition-colors shadow-sm" title="Void Order">✕</button>
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

      {/* ── PAGINATION ── */}
      {filteredData.length > 0 && (
        <div className="flex flex-col md:flex-row items-center justify-between mt-4 gap-3 text-[11px] text-gray-500 font-bold uppercase tracking-wider">
          <div>
            Showing {Math.min((currentPage - 1) * pageSize + 1, filteredData.length)} – {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} active orders
          </div>
          <div className="flex items-center gap-2">
            <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="border border-gray-300 px-2 py-1 outline-none bg-white rounded-sm cursor-pointer shadow-sm">
              {[10, 25, 50].map(n => <option key={n} value={n}>{n} / page</option>)}
            </select>
            <div className="flex rounded-sm shadow-sm border border-gray-300 overflow-hidden">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-3 py-1 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:bg-gray-50 border-r border-gray-200 transition-colors">«</button>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:bg-gray-50 border-r border-gray-200 transition-colors">‹</button>
              <span className="px-4 py-1 bg-gray-50 text-[#125ab2] font-black">{currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:bg-gray-50 border-l border-gray-200 transition-colors">›</button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-3 py-1 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:bg-gray-50 border-l border-gray-200 transition-colors">»</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ MODAL: CREATE / EDIT OUTBOUND MANIFEST                               */}
      {/* ========================================================================= */}
      {(isNewSOModalOpen || editSO) && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[650px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-[#125ab2]" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            <div className="bg-blue-50 border-b border-blue-100 px-6 py-4 flex justify-between items-center shrink-0 z-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-[#125ab2]">Order Orchestration</p>
                <h3 className="font-black text-sm uppercase tracking-wider text-gray-900">{editSO ? `Update Ledger: ${editSO.id}` : 'Draft New Outbound Order'}</h3>
              </div>
              <button onClick={() => { setIsNewSOModalOpen(false); setEditSO(null); }} className="text-blue-400 hover:text-blue-800 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <form onSubmit={editSO ? handleSaveEdit : handleSaveNewSO} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 text-sm flex flex-col gap-5">
                
                <div className="grid grid-cols-1 md:grid-cols-[1fr_150px] gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Target Destination / Customer <span className="text-red-500">*</span></label>
                    <input type="text" value={editSO ? editForm.customer : newSOForm.customer} onChange={e => editSO ? setEditForm({...editForm, customer: e.target.value}) : setNewSOForm({...newSOForm, customer: e.target.value})} placeholder="e.g. Dealership Jakarta" className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] font-black text-gray-900 rounded-sm shadow-sm text-xs" required autoFocus/>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Execution Priority <span className="text-red-500">*</span></label>
                    <select value={editSO ? editForm.priority : newSOForm.priority} onChange={e => editSO ? setEditForm({...editForm, priority: e.target.value}) : setNewSOForm({...newSOForm, priority: e.target.value})} className={`w-full border border-gray-300 px-3 py-2.5 outline-none font-bold bg-white rounded-sm shadow-sm cursor-pointer text-xs ${
                      (editSO ? editForm.priority : newSOForm.priority) === 'Critical' ? 'text-red-600 focus:border-red-600' : 'text-gray-700 focus:border-[#125ab2]'
                    }`} required>
                      <option value="Normal">Normal</option>
                      <option value="High">High (Urgent)</option>
                      <option value="Critical">Critical (Line-Stop)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Delivery Address <span className="text-red-500">*</span></label>
                    <input type="text" value={editSO ? editForm.address : newSOForm.address} onChange={e => editSO ? setEditForm({...editForm, address: e.target.value}) : setNewSOForm({...newSOForm, address: e.target.value})} placeholder="Physical location..." className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] font-semibold text-gray-800 rounded-sm shadow-sm text-xs" required/>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Expected Dispatch Date <span className="text-red-500">*</span></label>
                    <input type="date" value={editSO ? editForm.date : newSOForm.date} onChange={e => editSO ? setEditForm({...editForm, date: e.target.value}) : setNewSOForm({...newSOForm, date: e.target.value})} className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] font-mono font-bold text-gray-800 rounded-sm shadow-sm cursor-pointer text-xs" required/>
                  </div>
                </div>

                {/* LINE ITEMS LOGIC (Only visible when creating NEW) */}
                {!editSO && (
                  <div className="border border-gray-200 p-4 rounded-sm bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Cargo Line Items</label>
                      <button type="button" onClick={() => setNewSOForm({ ...newSOForm, items: [...newSOForm.items, { sku: '', qty: 1, desc: '' }] })} className="text-[10px] bg-white border border-gray-300 text-gray-700 px-2 py-1 rounded-sm hover:bg-gray-100 font-bold uppercase tracking-wider shadow-sm transition-colors">+ Add SKU</button>
                    </div>
                    <div className="space-y-2">
                      {newSOForm.items.map((item, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <input type="text" placeholder="SKU Code" value={item.sku} onChange={e => updateItem(i, 'sku', e.target.value)} className="w-1/4 border border-gray-300 px-2 py-2 text-xs font-mono font-bold outline-none focus:border-[#125ab2] rounded-sm shadow-sm" />
                          <input type="text" placeholder="Description / Part Name" value={item.desc} onChange={e => updateItem(i, 'desc', e.target.value)} className="flex-1 border border-gray-300 px-2 py-2 text-xs font-semibold outline-none focus:border-[#125ab2] rounded-sm shadow-sm" />
                          <input type="number" min="1" value={item.qty} onChange={e => updateItem(i, 'qty', e.target.value)} className="w-16 border border-gray-300 px-2 py-2 text-xs text-center font-black outline-none focus:border-[#125ab2] rounded-sm shadow-sm" />
                          <button type="button" onClick={() => removeItem(i)} className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 border border-red-200 rounded-sm hover:bg-red-100 font-black transition-colors" title="Remove Item">✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Compliance / Handling Notes</label>
                  <textarea rows="2" value={editSO ? editForm.notes : newSOForm.notes} onChange={e => editSO ? setEditForm({...editForm, notes: e.target.value}) : setNewSOForm({...newSOForm, notes: e.target.value})} placeholder="Clearance documentation, ESD warnings..." className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] rounded-sm resize-none text-xs font-medium shadow-sm"></textarea>
                </div>

              </div>
              
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 shrink-0 z-10">
                <button type="button" onClick={() => { setIsNewSOModalOpen(false); setEditSO(null); }} className="w-full sm:w-auto px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm rounded-sm">Cancel</button>
                <button type="submit" className="w-full sm:w-auto px-6 py-2.5 bg-[#125ab2] hover:bg-[#0e4487] text-white text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors rounded-sm flex items-center justify-center gap-2">
                  {editSO ? 'Commit Changes' : 'Draft to Execution Queue'}
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
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 opacity-80">Logistics Terminal</p>
                <h3 className="font-black text-sm uppercase tracking-wider">Execute Shipment: {activeSO.id}</h3>
              </div>
              <button onClick={() => { setActiveSO(null); setSelectedCourier('Zentryx Fleet Transport'); }} className="text-white opacity-70 hover:opacity-100 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 space-y-5">
              
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-sm flex items-start gap-3">
                <span className="text-2xl mt-1 opacity-80">🚛</span>
                <div>
                  <p className="text-[10px] font-black text-blue-800 uppercase tracking-wider mb-1">Destination Entity</p>
                  <p className="font-black text-gray-900 text-sm leading-tight mb-1">{activeSO.customer}</p>
                  <p className="text-xs text-gray-600 font-semibold">{activeSO.address}</p>
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
                  <option>Zentryx Fleet Transport</option>
                  <option>ARUS Internal Logistics</option>
                  <option>Maersk Global Freight</option>
                  <option>DHL Enterprise Express</option>
                </select>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-2 text-center">A shipping label with Master AWB will be generated.</p>
              </div>

            </div>
            
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 shrink-0 z-10">
              <button onClick={() => { setActiveSO(null); setSelectedCourier('Zentryx Fleet Transport'); }} className="w-full sm:w-auto px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm rounded-sm">Cancel</button>
              <button onClick={handleProsesKirimSingle} className="w-full sm:w-auto px-6 py-2.5 bg-[#125ab2] hover:bg-[#0e4487] text-white text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors rounded-sm flex items-center justify-center gap-2">
                <span>🖨️</span> Print Label & Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ MODAL: MASTER LEDGER (READ-ONLY DETAIL)                                */}
      {/* ========================================================================= */}
      {detailSO && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-sm w-[550px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="bg-[#415a77] text-white px-6 py-4 flex justify-between items-center shrink-0">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 opacity-80">Order Ledger Entry</p>
                <h3 className="font-black text-sm uppercase tracking-wider">{detailSO.id}</h3>
              </div>
              <button onClick={() => setDetailSO(null)} className="text-white opacity-70 hover:opacity-100 font-bold text-xl leading-none px-2">✕</button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar text-sm text-gray-700 space-y-6">
              
              {/* Header Info */}
              <div className="flex justify-between items-start border-b border-gray-200 pb-5">
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Target Entity</p>
                  <h4 className="font-black text-lg text-[#125ab2] leading-tight">{detailSO.customer}</h4>
                  {detailSO.address && <p className="text-xs text-gray-600 mt-1 max-w-[280px] font-semibold">{detailSO.address}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Current State</p>
                  <div className="mb-1.5"><PriorityBadge priority={detailSO.priority} /></div>
                  <span className={`px-2 py-1 rounded-sm font-black text-[9px] uppercase tracking-widest border shadow-sm ${getStatusBadge(detailSO.status)}`}>
                    {detailSO.status}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {detailSO.notes && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-sm shadow-inner">
                  <p className="text-[9px] font-black text-amber-800 uppercase tracking-wider mb-1">Compliance Notes</p>
                  <p className="text-xs text-amber-900 italic font-semibold">"{detailSO.notes}"</p>
                </div>
              )}

              {/* Items */}
              {detailSO.items && detailSO.items.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Cargo Manifest</p>
                  <div className="border border-gray-200 rounded-sm overflow-hidden shadow-sm">
                    <div className="bg-gray-50 grid grid-cols-12 px-3 py-2 text-[9px] font-black uppercase tracking-wider text-gray-500 border-b border-gray-200">
                      <div className="col-span-4">SKU Code</div>
                      <div className="col-span-6">Description</div>
                      <div className="col-span-2 text-center">Qty</div>
                    </div>
                    {detailSO.items.map((item, i) => (
                      <div key={i} className="grid grid-cols-12 px-3 py-2.5 text-xs border-b border-gray-100 last:border-0 hover:bg-blue-50/30 transition-colors">
                        <div className="col-span-4 font-mono font-black text-[#125ab2]">{item.sku || 'MISC'}</div>
                        <div className="col-span-6 text-gray-800 font-semibold">{item.desc || 'Standard Cargo'}</div>
                        <div className="col-span-2 text-center font-black text-gray-900">{item.qty}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tracking */}
              {detailSO.trackingNumber && (
                <div className="p-4 bg-gray-900 rounded-sm text-center shadow-inner">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Master Tracking (AWB)</p>
                  <p className="text-xl font-mono font-black text-emerald-400 tracking-widest">{detailSO.trackingNumber}</p>
                  {detailSO.courier && <p className="text-[10px] font-bold text-gray-300 mt-2 uppercase tracking-wider">CARRIER: {detailSO.courier}</p>}
                </div>
              )}

              {/* Timeline */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Audit Timeline</p>
                <div className="space-y-3 text-[11px] font-semibold border-l-2 border-gray-200 ml-2 pl-3">
                  <div className="relative">
                    <span className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white shadow-sm"></span>
                    <span className="text-gray-500">Order drafted at {detailSO.createdAt ? new Date(detailSO.createdAt).toLocaleString('en-GB') : detailSO.date}</span>
                  </div>
                  {detailSO.pickingStartAt && (
                    <div className="relative">
                      <span className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-purple-500 border-2 border-white shadow-sm"></span>
                      <span className="text-gray-700">Execution commenced (Picking) at {new Date(detailSO.pickingStartAt).toLocaleString('en-GB')}</span>
                    </div>
                  )}
                  {detailSO.packingStartAt && (
                    <div className="relative">
                      <span className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-yellow-500 border-2 border-white shadow-sm"></span>
                      <span className="text-gray-700">Moved to staging (Packing) at {new Date(detailSO.packingStartAt).toLocaleString('en-GB')}</span>
                    </div>
                  )}
                  {detailSO.shippedAt && (
                    <div className="relative">
                      <span className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-orange-500 border-2 border-white shadow-sm"></span>
                      <span className="text-gray-700">Dispatched via {detailSO.courier} at {new Date(detailSO.shippedAt).toLocaleString('en-GB')}</span>
                    </div>
                  )}
                  {detailSO.deliveredAt && (
                    <div className="relative">
                      <span className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm"></span>
                      <span className="text-emerald-700 font-black">POD Secured & Closed at {new Date(detailSO.deliveredAt).toLocaleString('en-GB')}</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
            
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 shrink-0">
              <button onClick={() => setDetailSO(null)} className="w-full px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm rounded-sm">
                Close Ledger
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
            <h3 className="font-black text-lg text-gray-900 mb-2 uppercase tracking-wide">Void Order Record?</h3>
            <p className="text-xs text-gray-500 font-semibold mb-6 leading-relaxed">
              Are you sure you want to permanently void <span className="font-bold text-red-600">{deleteConfirmId}</span>? This will erase all audit trails associated with it.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteConfirmId(null)} className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-colors w-full">Cancel</button>
              <button onClick={() => handleDeleteSO(deleteConfirmId)} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm rounded-sm w-full transition-colors">Yes, Void It</button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
};

export default PickPackShip;