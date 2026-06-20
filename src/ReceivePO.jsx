import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from './AppContext';

// ─── TOAST COMPONENT ─────────────────────────────────────────────────────────
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
    {toasts.map(({ id, message, type }) => (
      <div
        key={id}
        className={`flex items-center gap-3 px-4 py-3 rounded-sm shadow-lg text-white text-xs font-semibold min-w-[240px] ${
          type === 'success' ? 'bg-green-600' :
          type === 'error'   ? 'bg-red-600'   :
          type === 'warning' ? 'bg-orange-500' : 'bg-[#125ab2]'
        }`}
      >
        <span className="text-base">
          {type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ'}
        </span>
        <span className="flex-1">{message}</span>
        <button onClick={() => removeToast(id)} className="opacity-70 hover:opacity-100 text-lg leading-none">×</button>
      </div>
    ))}
  </div>
);

// ─── PO AGE BADGE ────────────────────────────────────────────────────────────
const POAgeBadge = ({ eta }) => {
  const now = new Date();
  const etaDate = new Date(eta);
  const daysUntilETA = Math.ceil((etaDate - now) / 86400000);
  
  if (daysUntilETA > 7) return null;
  
  const cls = daysUntilETA < 0
    ? 'bg-red-100 text-red-700'
    : daysUntilETA <= 1
    ? 'bg-orange-100 text-orange-700'
    : 'bg-yellow-100 text-yellow-700';
  
  return (
    <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold ${cls}`}>
      {daysUntilETA < 0 ? `${Math.abs(daysUntilETA)}d overdue` : `${daysUntilETA}d left`}
    </span>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const ReceivePO = () => {
  const { teks, poData, setPoData, bahasa, dispatchAutoTask } = useContext(AppContext);

  // ─── STATE ───────────────────────────────────────────────────────────────
  const [activePO, setActivePO]                 = useState(null);
  const [selectedIds, setSelectedIds]           = useState([]);
  const [searchQuery, setSearchQuery]           = useState('');
  const [statusFilter, setStatusFilter]         = useState('All');
  const [currentPage, setCurrentPage]           = useState(1);
  const [pageSize, setPageSize]                 = useState(10);
  const [toasts, setToasts]                     = useState([]);
  const [qcCondition, setQcCondition]           = useState('Good Condition');
  const [receivedQty, setReceivedQty]           = useState('');
  const [notes, setNotes]                       = useState('');
  const [detailPO, setDetailPO]                 = useState(null);

  // ─── TOAST HELPERS ───────────────────────────────────────────────────────
  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // ─── FILTERED & PAGINATED DATA ───────────────────────────────────────────
  const filtered = useMemo(() => {
    let data = [...poData];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(po =>
        po.id.toLowerCase().includes(q) ||
        po.supplier.toLowerCase().includes(q) ||
        (po.sku && po.sku.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== 'All') data = data.filter(po => po.status === statusFilter);
    return data;
  }, [poData, searchQuery, statusFilter]);

  const totalPages    = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // ─── STATS ───────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:     poData.length,
    pending:   poData.filter(po => po.status === 'Pending').length,
    received:  poData.filter(po => po.status === 'Received').length,
    rejected:  poData.filter(po => po.status === 'Rejected').length,
    overdue:   poData.filter(po => {
      const etaDate = new Date(po.eta);
      return po.status === 'Pending' && etaDate < new Date();
    }).length,
  }), [poData]);

  // ─── CHECKBOX LOGIC ──────────────────────────────────────────────────────
  const pendingInPage = paginatedData.filter(po => po.status === 'Pending');
  const allSelected   = pendingInPage.length > 0 && pendingInPage.every(po => selectedIds.includes(po.id));
  const toggleSelect  = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleSelectAll = () => allSelected
    ? setSelectedIds([])
    : setSelectedIds(pendingInPage.map(po => po.id));

  // ─── RECEIVE PO & TRIGGER INTERLOCK ──────────────────────────────────────
  const handleTerimaBarang = () => {
    if (!activePO) return;
    
    const finalQty = Number(receivedQty || activePO.quantity);

    if (qcCondition === 'Damaged (Reject)') {
      setPoData(poData.map(po =>
        po.id === activePO.id
          ? { ...po, status: 'Rejected', qcCondition, notes, receivedAt: new Date().toISOString() }
          : po
      ));
      addToast(`${activePO.id} rejected due to damage.`, 'warning');
    } else {
      setPoData(poData.map(po =>
        po.id === activePO.id
          ? { ...po, status: 'Received', qcCondition, receivedQty: finalQty, notes, receivedAt: new Date().toISOString() }
          : po
      )); 
      
      // 🚀 INJEKSI INTERLOCK: Lempar task ke Scanner Operator & Modul QC
      dispatchAutoTask({
        type: 'Putaway',
        desc: `Putaway ${finalQty} Units of ${activePO.sku || 'Items'} (Ref: ${activePO.id})`,
        zone: 'Clean Room A',
        assignee: 'Auto-Assigned AGV',
        priority: 'High',
        isLocked: true, // 🔒 TERKUNCI (Hanya bisa dibuka oleh QC)
        dependency: 'QA Clearance Required',
        sku: activePO.sku || 'N/A',
        refId: activePO.id,
        qty: finalQty,
        notes: notes || 'Awaiting QA Verification before floor execution.'
      });

      addToast(`${activePO.id} received successfully! Task sent to QA & Putaway Queue.`, 'success');
    }
    
    setActivePO(null);
    setQcCondition('Good Condition');
    setReceivedQty('');
    setNotes('');
  };

  // ─── BULK RECEIVE & TRIGGER INTERLOCK ────────────────────────────────────
  const handleBulkReceive = () => {
    if (!selectedIds.length) {
      addToast(bahasa === 'en' ? 'No POs selected.' : 'Tidak ada PO yang dipilih.', 'warning');
      return;
    }

    setPoData(poData.map(po => {
      if (selectedIds.includes(po.id) && po.status === 'Pending') {
        
        // 🚀 INJEKSI INTERLOCK: Bulk Generator Task
        dispatchAutoTask({
          type: 'Putaway',
          desc: `Putaway ${po.quantity} Units of ${po.sku || 'Items'} (Ref: ${po.id})`,
          zone: 'Clean Room A',
          assignee: 'Auto-Assigned AGV',
          priority: 'Medium',
          isLocked: true, 
          dependency: 'QA Clearance Required',
          sku: po.sku || 'N/A',
          refId: po.id,
          qty: po.quantity,
          notes: 'Auto-generated from Bulk Receive. Awaiting QA.'
        });

        return { ...po, status: 'Received', qcCondition: 'Good Condition', receivedAt: new Date().toISOString() };
      }
      return po;
    }));

    addToast(`${selectedIds.length} POs received & routed to Putaway!`, 'success');
    setSelectedIds([]);
  };

  // ─── EXPORT CSV ──────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const headers = ['PO Number', 'Supplier', 'SKU', 'Quantity', 'ETA', 'Status', 'QC Condition', 'Received At'];
    const rows = filtered.map(po => [
      po.id, po.supplier, po.sku || '', po.quantity, po.eta,
      po.status, po.qcCondition || '', po.receivedAt || ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    Object.assign(document.createElement('a'), {
      href: url,
      download: `ReceivePO_${new Date().toISOString().split('T')[0]}.csv`
    }).click();
    URL.revokeObjectURL(url);
    addToast('PO data exported as CSV!', 'success');
  };

  // ─── PRINT RECEIVING REPORT ──────────────────────────────────────────────
  const handlePrintReport = () => {
    if (!filtered.length) {
      addToast(bahasa === 'en' ? 'No POs to print.' : 'Tidak ada PO untuk dicetak.', 'warning');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    const tableRows = filtered.map((po, index) => `
      <tr>
        <td style="padding:10px;border:1px solid #ddd;text-align:center;">${index + 1}</td>
        <td style="padding:10px;border:1px solid #ddd;font-weight:bold;">${po.id}</td>
        <td style="padding:10px;border:1px solid #ddd;">${po.supplier}</td>
        <td style="padding:10px;border:1px solid #ddd;">${po.sku || '—'}</td>
        <td style="padding:10px;border:1px solid #ddd;text-align:center;">${po.quantity}</td>
        <td style="padding:10px;border:1px solid #ddd;">${po.eta}</td>
        <td style="padding:10px;border:1px solid #ddd;">${po.status}</td>
        <td style="padding:10px;border:1px solid #ddd;">${po.qcCondition || '—'}</td>
      </tr>
    `).join('');

    const html = `
      <html>
        <head>
          <title>Receiving Report - Zentryx</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #000; }
            .header { border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 30px; text-align: center; }
            .logo { font-size: 26px; font-weight: 900; letter-spacing: 2px; }
            .title { font-size: 14px; font-weight: bold; text-transform: uppercase; margin-top: 8px; color: #666; }
            .info-grid { display: flex; gap: 20px; margin-bottom: 24px; font-size: 12px; }
            .info-box { flex: 1; border: 1px solid #ccc; padding: 12px; border-radius: 4px; }
            .info-label { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #888; margin-bottom: 4px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; font-size: 12px; }
            thead tr { background: #000; color: #fff; }
            th { padding: 10px; text-align: left; font-size: 10px; font-weight: bold; text-transform: uppercase; }
            tbody tr:nth-child(even) { background: #f9f9f9; }
            .footer { margin-top: 40px; font-size: 10px; text-align: center; color: #aaa; border-top: 1px solid #eee; padding-top: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">ZENTRYX</div>
            <div class="title">Purchase Order Receiving Report</div>
          </div>
          <div class="info-grid">
            <div class="info-box">
              <div class="info-label">Report Date</div>
              ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div class="info-box">
              <div class="info-label">Total POs</div>
              ${filtered.length}
            </div>
            <div class="info-box">
              <div class="info-label">Received</div>
              ${filtered.filter(po => po.status === 'Received').length}
            </div>
            <div class="info-box">
              <div class="info-label">Pending</div>
              ${filtered.filter(po => po.status === 'Pending').length}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width:5%">No</th>
                <th style="width:15%">PO Number</th>
                <th style="width:20%">Supplier</th>
                <th style="width:12%">SKU</th>
                <th style="width:10%">Qty</th>
                <th style="width:12%">ETA</th>
                <th style="width:12%">Status</th>
                <th style="width:14%">QC Condition</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <div class="footer">
            Generated by Zentryx WMS &bull; ${new Date().toLocaleString('id-ID')}
          </div>
          <script>setTimeout(() => { window.print(); }, 600);</script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4">
        <div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide">
            {teks.dropReceivePO || (bahasa === 'en' ? 'Receive Purchase Orders' : 'Terima Purchase Order')}
          </h2>
          <p className="text-gray-500 text-xs mt-1">
            {bahasa === 'en'
              ? 'Receive incoming POs, verify quality, and update inventory.'
              : 'Terima PO masuk, verifikasi kualitas, dan perbarui inventori.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportCSV}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 px-3 py-1.5 text-xs font-semibold transition-colors"
          >
            ↓ Export CSV
          </button>
          <button
            onClick={handlePrintReport}
            className="bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300 px-3 py-1.5 text-xs font-semibold transition-colors"
          >
            🖨 Print Report
          </button>
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkReceive}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 text-xs font-bold transition-colors"
            >
              ✓ {bahasa === 'en' ? `Bulk Receive (${selectedIds.length})` : `Terima Massal (${selectedIds.length})`}
            </button>
          )}
        </div>
      </div>

      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        {[
          { label: bahasa === 'en' ? 'Total POs' : 'Total PO',        value: stats.total,    color: 'bg-[#4d5f79]' },
          { label: bahasa === 'en' ? 'Pending' : 'Menunggu',           value: stats.pending,  color: 'bg-yellow-500' },
          { label: bahasa === 'en' ? 'Received' : 'Diterima',          value: stats.received, color: 'bg-green-500' },
          { label: bahasa === 'en' ? 'Rejected' : 'Ditolak',           value: stats.rejected, color: 'bg-red-500' },
          { label: bahasa === 'en' ? 'Overdue' : 'Terlambat',          value: stats.overdue,  color: 'bg-orange-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-sm shadow-sm p-2.5 flex items-center gap-2">
            <div className={`${s.color} text-white text-sm font-black w-9 h-9 flex items-center justify-center rounded-sm shrink-0`}>
              {s.value}
            </div>
            <div className="text-[10px] text-gray-500 font-semibold leading-tight">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── SEARCH & FILTER BAR ── */}
      <div className="flex flex-col md:flex-row gap-2 mb-3">
        <input
          type="text"
          placeholder={bahasa === 'en' ? 'Search by PO Number, Supplier, or SKU...' : 'Cari PO Number, Supplier, atau SKU...'}
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          className="border border-gray-300 px-3 py-1.5 text-xs outline-none focus:border-[#125ab2] flex-1"
        />
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="border border-gray-300 px-3 py-1.5 text-xs outline-none bg-white"
        >
          <option value="All">{bahasa === 'en' ? 'All Status' : 'Semua Status'}</option>
          <option value="Pending">{bahasa === 'en' ? 'Pending' : 'Menunggu'}</option>
          <option value="Received">{bahasa === 'en' ? 'Received' : 'Diterima'}</option>
          <option value="Rejected">{bahasa === 'en' ? 'Rejected' : 'Ditolak'}</option>
        </select>
        <select
          value={pageSize}
          onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
          className="border border-gray-300 px-3 py-1.5 text-xs outline-none bg-white"
        >
          {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
        </select>
      </div>

      {/* ── INFO BANNER ── */}
      <div className="bg-blue-50 border border-blue-100 px-4 py-2.5 flex items-center gap-3 text-xs text-[#125ab2] mb-0">
        <span className="text-base">📦</span>
        <span>
          {bahasa === 'en'
            ? 'Click PO Number to view details. Select multiple POs to bulk receive. Overdue POs are highlighted in red.'
            : 'Klik PO Number untuk melihat detail. Pilih beberapa PO untuk terima massal. PO terlambat ditandai merah.'}
        </span>
      </div>

      {/* ── TABLE ── */}
      <div className="bg-white border border-gray-300 shadow-sm w-full overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-[#e5e5e5] text-[#666666] text-[11px] border-b border-gray-300">
              <th className="py-2 px-4 font-bold text-center w-10">
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 cursor-pointer"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="py-2 px-4 font-bold w-8 text-center">NO</th>
              <th className="py-2 px-4 font-bold w-32">PO NUMBER</th>
              <th className="py-2 px-4 font-bold">SUPPLIER</th>
              <th className="py-2 px-4 font-bold w-20">SKU</th>
              <th className="py-2 px-4 font-bold w-16 text-center">QTY</th>
              <th className="py-2 px-4 font-bold w-36">ETA</th>
              <th className="py-2 px-4 font-bold w-12 text-center">AGE</th>
              <th className="py-2 px-4 font-bold w-32">STATUS</th>
              <th className="py-2 px-4 font-bold w-48 text-center">ACTION</th>
            </tr>
          </thead>
          <tbody className="text-[12px] text-[#333333]">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan="10" className="py-10 text-center text-gray-400">
                  {bahasa === 'en' ? 'No Purchase Orders found.' : 'Tidak ada Purchase Order ditemukan.'}
                </td>
              </tr>
            ) : (
              paginatedData.map((po, index) => {
                const etaDate = new Date(po.eta);
                const isOverdue = po.status === 'Pending' && etaDate < new Date();
                return (
                  <tr
                    key={po.id}
                    className={`border-b border-gray-100 transition-colors ${
                      selectedIds.includes(po.id) ? 'bg-blue-50' :
                      isOverdue ? 'bg-red-50 hover:bg-red-100' :
                      po.status === 'Received' ? 'opacity-50 bg-gray-50' : 'hover:bg-blue-50'
                    }`}
                  >
                    <td className="py-3 px-4 text-center">
                      {po.status === 'Pending' ? (
                        <input
                          type="checkbox"
                          className="w-3.5 h-3.5 cursor-pointer"
                          checked={selectedIds.includes(po.id)}
                          onChange={() => toggleSelect(po.id)}
                        />
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-gray-400 text-xs">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        onClick={() => setDetailPO(po)}
                        className="text-[#125ab2] font-bold cursor-pointer hover:underline"
                      >
                        {po.id}
                      </span>
                    </td>
                    <td className="py-3 px-4">{po.supplier}</td>
                    <td className="py-3 px-4 font-mono text-[11px] font-bold text-gray-600">{po.sku || '—'}</td>
                    <td className="py-3 px-4 text-center font-bold text-lg">{po.quantity}</td>
                    <td className="py-3 px-4 text-gray-500">{po.eta}</td>
                    <td className="py-3 px-4 text-center">
                      <POAgeBadge eta={po.eta} />
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-sm font-bold text-[10px] ${
                        po.status === 'Pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : po.status === 'Received'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {po.status === 'Pending' && bahasa === 'id' ? 'Menunggu' :
                         po.status === 'Received' && bahasa === 'id' ? 'Diterima' :
                         po.status === 'Rejected' && bahasa === 'id' ? 'Ditolak' : po.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {po.status === 'Pending' ? (
                        <button
                          onClick={() => setActivePO(po)}
                          className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-3 py-1.5 text-[10px] font-bold transition-colors"
                        >
                          {bahasa === 'en' ? 'Receive' : 'Terima'}
                        </button>
                      ) : (
                        <span className="text-gray-400 text-[10px] font-bold italic">
                          {po.receivedAt
                            ? new Date(po.receivedAt).toLocaleDateString('id-ID')
                            : (bahasa === 'en' ? 'Done' : 'Selesai')}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── PAGINATION ── */}
      <div className="flex flex-col md:flex-row justify-between items-center mt-3 gap-2 text-xs text-gray-500">
        <div>
          {bahasa === 'en'
            ? `Showing ${Math.min((currentPage - 1) * pageSize + 1, filtered.length)}–${Math.min(currentPage * pageSize, filtered.length)} of ${filtered.length} POs`
            : `Menampilkan ${Math.min((currentPage - 1) * pageSize + 1, filtered.length)}–${Math.min(currentPage * pageSize, filtered.length)} dari ${filtered.length} PO`}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}
            className="px-2 py-1 border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">«</button>
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
            className="px-2 py-1 border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">‹</button>
          <span className="px-3 py-1 font-semibold">{currentPage} / {totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
            className="px-2 py-1 border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">›</button>
          <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}
            className="px-2 py-1 border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">»</button>
        </div>
      </div>

      {/* ═══ MODAL 1: PROSES RECEIVE PO ═══ */}
      {activePO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-sm w-full max-w-[550px] max-h-[90vh] overflow-y-auto shadow-2xl">

            {/* Modal Header */}
            <div className="bg-[#415a77] text-white px-4 py-3 flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-bold">
                {bahasa === 'en' ? 'Process Receipt:' : 'Proses Penerimaan:'} {activePO.id}
              </h3>
              <button
                onClick={() => {
                  setActivePO(null);
                  setQcCondition('Good Condition');
                  setReceivedQty('');
                  setNotes('');
                }}
                className="text-gray-300 hover:text-white font-bold text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <div className="p-6 text-sm">
              
              {/* 1. Detail PO & Info Pemasok */}
              <div className="bg-gray-50 border border-gray-200 rounded-sm p-4 mb-5">
                <div className="flex justify-between items-start mb-3 border-b border-gray-200 pb-3">
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Supplier</p>
                    <p className="font-bold text-[#125ab2]">{activePO.supplier}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Expected Qty</p>
                    <p className="font-black text-lg text-gray-800">{activePO.quantity} <span className="text-xs font-normal">Units</span></p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-gray-500 block">SKU / Item:</span>
                    <span className="font-semibold text-gray-800">{activePO.sku || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">ETA:</span>
                    <span className="font-semibold text-gray-800">{activePO.eta}</span>
                  </div>
                </div>
              </div>

              {/* 2. Form Input Penerimaan Fisik */}
              <div className="space-y-4">
                
                {/* Qty Diterima vs Qty Ditolak (QC Split Simulation) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {bahasa === 'en' ? 'Actual Qty Received' : 'Qty Aktual Diterima'} <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="number" 
                      min="0"
                      placeholder={activePO.quantity}
                      value={receivedQty}
                      onChange={(e) => setReceivedQty(e.target.value)}
                      className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#2a9d8f] focus:ring-1 focus:ring-[#2a9d8f] text-lg font-bold text-gray-800 transition-shadow"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Kosongkan jika menerima *Full Quantity*.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {bahasa === 'en' ? 'Quality Status' : 'Kondisi Kualitas (QC)'}
                    </label>
                    <select 
                      value={qcCondition} 
                      onChange={(e) => setQcCondition(e.target.value)}
                      className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] bg-white transition-colors"
                    >
                      <option value="Good Condition">{bahasa === 'en' ? '✅ Good (Pass)' : '✅ Baik (Lolos QC)'}</option>
                      <option value="Damaged (Reject)">{bahasa === 'en' ? '❌ Damaged (Reject All)' : '❌ Rusak (Tolak Semua)'}</option>
                      <option value="Partial Reject">{bahasa === 'en' ? '⚠️ Mixed / Partial Reject' : '⚠️ Campuran / Sebagian Rusak'}</option>
                    </select>
                  </div>
                </div>

                {/* Staging / Dock Location */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {bahasa === 'en' ? 'Receiving Dock / Staging Area' : 'Lokasi Dock / Area Transit'}
                  </label>
                  <select className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] bg-white">
                    <option value="DOCK-01">Inbound Dock 01</option>
                    <option value="DOCK-02">Inbound Dock 02</option>
                    <option value="STAGING-A">QA Staging Area A</option>
                  </select>
                </div>

                {/* Notes & Upload Bukti Surat Jalan */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {bahasa === 'en' ? 'Delivery Note / Exceptions' : 'Catatan Surat Jalan / Kendala'}
                  </label>
                  <textarea 
                    rows="2" 
                    placeholder="Contoh: Kardus sedikit penyok namun isi aman..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] resize-none"
                  ></textarea>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <button className="text-[#125ab2] text-xs font-bold flex items-center gap-1 hover:underline">
                    <span>📎</span> {bahasa === 'en' ? 'Attach Delivery Doc' : 'Unggah Surat Jalan'}
                  </button>
                  <span className="text-[10px] text-gray-400 italic">Optional</span>
                </div>

              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 rounded-b-sm">
              <button 
                onClick={() => {
                  setActivePO(null);
                  setQcCondition('Good Condition');
                  setReceivedQty('');
                  setNotes('');
                }} 
                className="px-5 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 transition-colors shadow-sm"
              >
                {bahasa === 'en' ? 'Cancel' : 'Batal'}
              </button>
              <button 
                onClick={handleTerimaBarang} 
                className={`px-6 py-2 text-xs font-bold text-white shadow-sm transition-colors flex items-center gap-2 ${
                  qcCondition === 'Damaged (Reject)' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-[#2a9d8f] hover:bg-[#1e7166]'
                }`}
              >
                {qcCondition === 'Damaged (Reject)' 
                  ? (bahasa === 'en' ? 'Confirm Rejection' : 'Konfirmasi Penolakan')
                  : (bahasa === 'en' ? 'Confirm Receipt' : 'Konfirmasi Penerimaan')
                }
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ═══ MODAL 2: DOCUMENT DRILL-DOWN (READ-ONLY) ═══ */}
      {detailPO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-sm w-[450px] shadow-2xl overflow-hidden">
            <div className="bg-gray-100 border-b border-gray-300 px-4 py-3 flex justify-between items-center">
              <h3 className="font-bold text-[#4d5f79] text-sm">Purchase Order: {detailPO.id}</h3>
              <button onClick={() => setDetailPO(null)} className="text-gray-400 hover:text-gray-700 font-bold text-lg leading-none">✕</button>
            </div>
            
            <div className="p-6 text-sm text-gray-700">
              <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-100">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Vendor/Supplier</p>
                  <h4 className="font-black text-lg text-[#125ab2] leading-tight">{detailPO.supplier}</h4>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded-sm font-bold text-[10px] uppercase tracking-wider ${
                    detailPO.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                    detailPO.status === 'Received' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {detailPO.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-4 mb-6">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Expected Arrival</p>
                  <p className="font-semibold">{detailPO.eta}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Ordered Qty</p>
                  <p className="font-black text-base">{detailPO.quantity} <span className="text-xs font-normal">Units</span></p>
                </div>
                {detailPO.status !== 'Pending' && (
                  <>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Processed At</p>
                      <p className="font-semibold text-xs">{new Date(detailPO.receivedAt).toLocaleString('id-ID')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Quality Status</p>
                      <p className={`font-bold text-xs ${detailPO.qcCondition?.includes('Damaged') ? 'text-red-600' : 'text-green-600'}`}>
                        {detailPO.qcCondition || 'Passed'}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {detailPO.notes && (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-sm mb-4">
                  <p className="text-[10px] text-yellow-800 font-bold uppercase mb-1">Receiving Notes</p>
                  <p className="text-xs text-yellow-900 italic">{detailPO.notes}</p>
                </div>
              )}

              <div className="mt-2">
                <button 
                  onClick={() => setDetailPO(null)} 
                  className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold transition-colors uppercase tracking-wider"
                >
                  Close Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default ReceivePO;