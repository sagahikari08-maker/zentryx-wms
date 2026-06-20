import React, { useState, useContext, useMemo } from 'react';
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

// ─── ORDER AGE BADGE ─────────────────────────────────────────────────────────
const OrderAgeBadge = ({ date }) => {
  const age = Math.floor((new Date() - new Date(date)) / 86400000);
  if (age <= 1) return null;
  const cls = age > 7
    ? 'bg-red-100 text-red-700'
    : age > 3
    ? 'bg-yellow-100 text-yellow-700'
    : 'bg-gray-100 text-gray-500';
  return (
    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${cls}`}>
      {age}d ago
    </span>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const ShippingManifests = () => {
  const { bahasa, soData, setSoData } = useContext(AppContext);

  const manifestOrders = soData.filter(so => so.status === 'Shipped' || so.status === 'Delivered');
  const shippedOrders  = soData.filter(so => so.status === 'Shipped');

  const [selectedSODetail, setSelectedSODetail] = useState(null);
  const [selectedIds, setSelectedIds]           = useState([]);
  const [searchQuery, setSearchQuery]           = useState('');
  const [statusFilter, setStatusFilter]         = useState('All');
  const [currentPage, setCurrentPage]           = useState(1);
  const [pageSize, setPageSize]                 = useState(10);
  const [toasts, setToasts]                     = useState([]);

  // ─── TOAST HELPERS ───────────────────────────────────────────────────────
  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // ─── FILTERED & PAGINATED DATA ───────────────────────────────────────────
  const filtered = useMemo(() => {
    let data = [...manifestOrders];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(so =>
        so.id.toLowerCase().includes(q) ||
        so.customer.toLowerCase().includes(q) ||
        (so.trackingNumber && so.trackingNumber.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== 'All') data = data.filter(so => so.status === statusFilter);
    return data;
  }, [manifestOrders, searchQuery, statusFilter]);

  const totalPages    = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // ─── STATS ───────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:     manifestOrders.length,
    shipped:   shippedOrders.length,
    delivered: soData.filter(so => so.status === 'Delivered').length,
  }), [manifestOrders, shippedOrders, soData]);

  // ─── CHECKBOX LOGIC ──────────────────────────────────────────────────────
  const shippedInPage   = paginatedData.filter(so => so.status === 'Shipped');
  const allSelected     = shippedInPage.length > 0 && shippedInPage.every(so => selectedIds.includes(so.id));
  const toggleSelect    = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleSelectAll = () => allSelected
    ? setSelectedIds([])
    : setSelectedIds(shippedInPage.map(so => so.id));

  // ─── 🚀 ENGINE INTERLOCK: MARK DELIVERED & CLEAR DOCK ───
  const releaseDockSchedule = (orderIds) => {
    try {
      const savedDocks = JSON.parse(window.localStorage.getItem('dockSchedules_ARUS') || '[]');
      let updatedDocks = [...savedDocks];
      let hasChanges = false;

      orderIds.forEach(orderId => {
        updatedDocks = updatedDocks.map(ds => {
          if (ds.reference === orderId && ds.status === 'Docked / Active') {
            hasChanges = true;
            return { ...ds, status: 'Completed' };
          }
          return ds;
        });
      });

      if (hasChanges) {
        window.localStorage.setItem('dockSchedules_ARUS', JSON.stringify(updatedDocks));
      }
    } catch (e) {
      console.warn("Failed to update Dock Schedule", e);
    }
  };

  const handleMarkAsDelivered = (id) => {
    setSoData(soData.map(so => so.id === id ? { ...so, status: 'Delivered', deliveredAt: new Date().toISOString() } : so));
    releaseDockSchedule([id]); // 🚀 INJEKSI: Bebaskan dermaga untuk truk lain!
    addToast(`Order ${id} marked as Delivered! Logistics Gate Cleared.`, 'success');
  };

  const handleBulkMarkAsDelivered = () => {
    if (!selectedIds.length) {
      addToast(bahasa === 'en' ? 'No orders selected.' : 'Tidak ada pesanan dipilih.', 'warning');
      return;
    }
    
    setSoData(soData.map(so =>
      selectedIds.includes(so.id) && so.status === 'Shipped'
        ? { ...so, status: 'Delivered', deliveredAt: new Date().toISOString() }
        : so
    ));
    
    releaseDockSchedule(selectedIds); // 🚀 INJEKSI: Bebaskan dermaga secara massal!
    addToast(`${selectedIds.length} orders marked as Delivered! Logistics Gate Cleared.`, 'success');
    setSelectedIds([]);
  };

  // ─── EXPORT CSV ──────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const headers = ['Order ID','Customer','Address','Date','Status','Courier','Tracking Number'];
    const rows = filtered.map(so => [
      so.id, so.customer, so.address || '', so.date,
      so.status, so.courier || '', so.trackingNumber || ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    Object.assign(document.createElement('a'), {
      href: url,
      download: `ShippingManifest_${new Date().toISOString().split('T')[0]}.csv`
    }).click();
    URL.revokeObjectURL(url);
    addToast('Manifest exported as CSV!', 'success');
  };

  // ─── PRINT MANIFEST ──────────────────────────────────────────────────────
  const handlePrintManifest = () => {
    if (!shippedOrders.length) {
      addToast(
        bahasa === 'en'
          ? 'No waiting orders to generate a manifest.'
          : 'Tidak ada pesanan menunggu jemputan untuk dibuatkan manifes.',
        'warning'
      );
      return;
    }

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    const tableRows = shippedOrders.map((so, index) => {
      const awb = so.trackingNumber || `AWB${Math.floor(100000000 + Math.random() * 900000000)}`;
      return `
        <tr>
          <td style="padding:10px;border:1px solid #ddd;text-align:center;">${index + 1}</td>
          <td style="padding:10px;border:1px solid #ddd;font-weight:bold;">${so.id}</td>
          <td style="padding:10px;border:1px solid #ddd;">${so.customer}</td>
          <td style="padding:10px;border:1px solid #ddd;font-size:12px;">${so.address || '—'}</td>
          <td style="padding:10px;border:1px solid #ddd;font-family:monospace;font-size:12px;">${awb}</td>
          <td style="padding:10px;border:1px solid #ddd;">${so.courier || 'Zentryx Express'}</td>
          <td style="padding:10px;border:1px solid #ddd;text-align:center;">1 Pcs</td>
        </tr>
      `;
    }).join('');

    const html = `
      <html>
        <head>
          <title>Shipping Manifest - Zentryx</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: 'Arial', sans-serif;
              padding: 40px;
              color: #000;
              background: #fff;
            }

            /* ── HEADER ── */
            .header-container {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 3px solid #000;
              padding-bottom: 20px;
              margin-bottom: 28px;
            }
            .header-left .logo-text {
              font-size: 26px;
              font-weight: 900;
              letter-spacing: 3px;
              text-transform: uppercase;
            }
            .header-left .doc-title {
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 2px;
              color: #666;
              margin-top: 6px;
            }
            .header-right {
              text-align: right;
              font-size: 12px;
              line-height: 1.8;
            }
            .header-right .manifest-no {
              font-size: 16px;
              font-weight: 800;
              color: #000;
            }

            /* ── INFO GRID ── */
            .info-grid {
              display: flex;
              gap: 20px;
              margin-bottom: 24px;
            }
            .info-box {
              flex: 1;
              border: 1px solid #ccc;
              padding: 14px 16px;
              border-radius: 4px;
              font-size: 13px;
              line-height: 1.7;
            }
            .info-label {
              font-size: 9px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              color: #888;
              margin-bottom: 6px;
            }

            /* ── TABLE ── */
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
              margin-bottom: 40px;
            }
            thead tr {
              background-color: #000;
              color: #fff;
            }
            th {
              padding: 10px 12px;
              text-align: left;
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            tbody tr:nth-child(even) { background: #f9f9f9; }
            tbody tr:hover { background: #f0f0f0; }
            td { padding: 10px 12px; border-bottom: 1px solid #ddd; }

            /* ── SUMMARY ── */
            .summary-bar {
              background: #f4f4f4;
              border: 1px solid #ddd;
              border-radius: 4px;
              padding: 12px 16px;
              font-size: 12px;
              display: flex;
              gap: 30px;
              margin-bottom: 40px;
            }
            .summary-bar span { font-weight: 800; }

            /* ── SIGNATURES ── */
            .signatures-section {
              margin-top: 20px;
              page-break-inside: avoid;
            }
            .signatures-title {
              font-size: 10px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              color: #888;
              margin-bottom: 24px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 8px;
            }
            .signatures {
              display: flex;
              justify-content: space-between;
              gap: 20px;
            }
            .sign-box {
              flex: 1;
              border: 1px solid #ccc;
              border-radius: 4px;
              padding: 16px;
              text-align: center;
            }
            .sign-role {
              font-weight: 800;
              font-size: 13px;
              margin-bottom: 4px;
              color: #000;
            }
            .sign-sub {
              font-size: 11px;
              color: #666;
              margin-bottom: 70px;
            }
            .sign-area {
              border-top: 2px solid #000;
              padding-top: 8px;
              font-size: 10px;
              color: #555;
              line-height: 1.8;
            }
            .sign-field {
              display: flex;
              justify-content: space-between;
              font-size: 10px;
              margin-top: 4px;
              color: #333;
            }
            .sign-field-label {
              font-weight: bold;
              color: #888;
              font-size: 9px;
              text-transform: uppercase;
            }
            .sign-underline {
              border-bottom: 1px solid #ccc;
              min-width: 140px;
              display: inline-block;
              height: 14px;
              vertical-align: bottom;
            }

            /* ── FOOTER ── */
            .footer {
              margin-top: 32px;
              font-size: 10px;
              text-align: center;
              color: #aaa;
              border-top: 1px solid #eee;
              padding-top: 12px;
            }

            @media print {
              @page { size: A4; margin: 1.5cm; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>

          <div class="header-container">
            <div class="header-left">
              <div class="logo-text">Zentryx Logistics</div>
              <div class="doc-title">Berita Acara Serah Terima — Shipping Manifest</div>
            </div>
            <div class="header-right">
              <div class="manifest-no">MNF-${Date.now().toString().slice(-8)}</div>
              <div><strong>Tanggal:</strong> ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
              <div><strong>Waktu Cetak:</strong> ${new Date().toLocaleTimeString('id-ID')}</div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-box">
              <div class="info-label">Gudang Asal (Origin)</div>
              <strong>Zentryx Main Warehouse</strong><br/>
              Kawasan Industri Terpadu Blok B<br/>
              Jakarta Timur, 13920, Indonesia<br/>
              Telp: (021) 555-0100
            </div>
            <div class="info-box">
              <div class="info-label">Ringkasan Penyerahan</div>
              <strong>Total Paket:</strong> ${shippedOrders.length} Paket<br/>
              <strong>Tanggal Serah Terima:</strong> ${new Date().toLocaleDateString('id-ID')}<br/>
              <strong>Waktu Serah Terima:</strong> ${new Date().toLocaleTimeString('id-ID')}<br/>
              <strong>Disiapkan Oleh:</strong> Sistem Zentryx WMS
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width:4%">No</th>
                <th style="width:14%">Order ID</th>
                <th style="width:25%">Penerima (Customer)</th>
                <th style="width:22%">Alamat Tujuan</th>
                <th style="width:18%">No. Resi (AWB)</th>
                <th style="width:12%">Kurir</th>
                <th style="width:5%">Qty</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <div class="summary-bar">
            <div>Total Paket: <span>${shippedOrders.length} Pcs</span></div>
            <div>Tanggal: <span>${new Date().toLocaleDateString('id-ID')}</span></div>
            <div>Waktu: <span>${new Date().toLocaleTimeString('id-ID')}</span></div>
            <div>Manifest No: <span>MNF-${Date.now().toString().slice(-8)}</span></div>
          </div>

          <div class="signatures-section">
            <div class="signatures-title">Tanda Tangan Serah Terima / Handover Signatures</div>
            <div class="signatures">

              <div class="sign-box">
                <div class="sign-role">Pihak Pertama</div>
                <div class="sign-sub">Petugas Gudang (Warehouse Team)</div>
                <div class="sign-area">
                  <div class="sign-field">
                    <span class="sign-field-label">Nama Terang</span>
                    <span class="sign-underline"></span>
                  </div>
                  <div class="sign-field" style="margin-top:8px">
                    <span class="sign-field-label">Jabatan</span>
                    <span class="sign-underline"></span>
                  </div>
                  <div class="sign-field" style="margin-top:8px">
                    <span class="sign-field-label">Tanda Tangan</span>
                    <span class="sign-underline" style="min-width:140px;height:40px;display:inline-block;border-bottom:1px solid #ccc;"></span>
                  </div>
                  <div class="sign-field" style="margin-top:8px">
                    <span class="sign-field-label">Tanggal</span>
                    <span class="sign-underline"></span>
                  </div>
                </div>
              </div>

              <div class="sign-box">
                <div class="sign-role">Pihak Kedua</div>
                <div class="sign-sub">Kurir / Driver Pickup</div>
                <div class="sign-area">
                  <div class="sign-field">
                    <span class="sign-field-label">Nama Driver</span>
                    <span class="sign-underline"></span>
                  </div>
                  <div class="sign-field" style="margin-top:8px">
                    <span class="sign-field-label">No. Polisi Kendaraan</span>
                    <span class="sign-underline"></span>
                  </div>
                  <div class="sign-field" style="margin-top:8px">
                    <span class="sign-field-label">Tanda Tangan</span>
                    <span class="sign-underline" style="min-width:140px;height:40px;display:inline-block;border-bottom:1px solid #ccc;"></span>
                  </div>
                  <div class="sign-field" style="margin-top:8px">
                    <span class="sign-field-label">Tanggal</span>
                    <span class="sign-underline"></span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div class="footer">
            Dokumen ini digenerate secara otomatis oleh Zentryx Warehouse Management System &copy; ${new Date().getFullYear()} &bull;
            Dicetak pada ${new Date().toLocaleString('id-ID')}
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
            {bahasa === 'en' ? 'Shipping Manifests' : 'Manifes Pengiriman'}
          </h2>
          <p className="text-gray-500 text-xs mt-1">
            {bahasa === 'en'
              ? 'Manage outbound shipments and confirm deliveries with courier handover.'
              : 'Kelola pengiriman keluar dan konfirmasi serah terima dengan kurir.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportCSV}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 px-3 py-1.5 text-xs font-semibold transition-colors"
          >
            ↓ Export CSV
          </button>
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkMarkAsDelivered}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 text-xs font-bold transition-colors"
            >
              ✓ {bahasa === 'en' ? `Bulk Delivered (${selectedIds.length})` : `Tandai Selesai (${selectedIds.length})`}
            </button>
          )}
          <button
            onClick={handlePrintManifest}
            disabled={!shippedOrders.length}
            className={`px-4 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
              shippedOrders.length
                ? 'bg-[#125ab2] hover:bg-[#0e4487] text-white shadow-sm'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            📄 {bahasa === 'en' ? 'Print Daily Manifest' : 'Cetak Manifes Hari Ini'}
            {shippedOrders.length > 0 && (
              <span className="bg-white text-[#125ab2] text-[10px] font-black px-1.5 py-0.5 rounded-sm">
                {shippedOrders.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: bahasa === 'en' ? 'Total in Manifest' : 'Total di Manifes', value: stats.total,     color: 'bg-[#4d5f79]' },
          { label: bahasa === 'en' ? 'Waiting Pickup'    : 'Menunggu Jemputan', value: stats.shipped,  color: 'bg-orange-500' },
          { label: bahasa === 'en' ? 'Delivered'         : 'Terkirim',          value: stats.delivered, color: 'bg-green-500' },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-sm shadow-sm p-3 flex items-center gap-3">
            <div className={`${s.color} text-white text-lg font-black w-10 h-10 flex items-center justify-center rounded-sm shrink-0`}>
              {s.value}
            </div>
            <div className="text-xs text-gray-500 font-semibold leading-tight">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── SEARCH & FILTER BAR ── */}
      <div className="flex flex-col md:flex-row gap-2 mb-3">
        <input
          type="text"
          placeholder={bahasa === 'en' ? 'Search by Order ID, Customer, or Tracking...' : 'Cari Order ID, Customer, atau No. Resi...'}
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
          <option value="Shipped">{bahasa === 'en' ? 'Waiting for Pickup' : 'Menunggu Jemputan'}</option>
          <option value="Delivered">{bahasa === 'en' ? 'Delivered' : 'Terkirim'}</option>
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
            ? 'Click Order ID to view manifest trace. Print Daily Manifest generates a handover document with signature fields.'
            : 'Klik Order ID untuk melihat rincian manifes. Cetak Manifes Hari Ini menghasilkan dokumen serah terima dengan kolom tanda tangan.'}
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
              <th className="py-2 px-4 font-bold w-32">ORDER ID</th>
              <th className="py-2 px-4 font-bold">CUSTOMER</th>
              <th className="py-2 px-4 font-bold w-36">ORDER DATE</th>
              <th className="py-2 px-4 font-bold w-28">AGE</th>
              <th className="py-2 px-4 font-bold w-40">TRACKING</th>
              <th className="py-2 px-4 font-bold w-36">STATUS</th>
              <th className="py-2 px-4 font-bold w-48 text-center">ACTION</th>
            </tr>
          </thead>
          <tbody className="text-[12px] text-[#333333]">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan="9" className="py-10 text-center text-gray-400">
                  {bahasa === 'en' ? 'No manifest orders found.' : 'Tidak ada data manifes.'}
                </td>
              </tr>
            ) : (
              paginatedData.map((so, index) => (
                <tr
                  key={so.id}
                  className={`border-b border-gray-100 transition-colors ${
                    selectedIds.includes(so.id) ? 'bg-orange-50' :
                    so.status === 'Delivered' ? 'opacity-50 bg-gray-50' : 'hover:bg-blue-50'
                  }`}
                >
                  <td className="py-3 px-4 text-center">
                    {so.status === 'Shipped' ? (
                      <input
                        type="checkbox"
                        className="w-3.5 h-3.5 cursor-pointer"
                        checked={selectedIds.includes(so.id)}
                        onChange={() => toggleSelect(so.id)}
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
                      onClick={() => setSelectedSODetail(so)}
                      className="text-[#125ab2] font-bold cursor-pointer hover:underline"
                    >
                      {so.id}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold">{so.customer}</div>
                    {so.address && (
                      <div className="text-gray-400 text-[10px] mt-0.5 max-w-[200px] truncate">{so.address}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-500">{so.date}</td>
                  <td className="py-3 px-4">
                    <OrderAgeBadge date={so.date} />
                  </td>
                  <td className="py-3 px-4">
                    {so.trackingNumber ? (
                      <div>
                        <div className="text-[10px] font-bold font-mono text-gray-700">{so.trackingNumber}</div>
                        {so.courier && <div className="text-[10px] text-gray-400">{so.courier}</div>}
                      </div>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {so.status === 'Shipped' ? (
                      <span className="px-2 py-0.5 rounded-sm font-bold text-[10px] bg-orange-100 text-orange-700">
                        {bahasa === 'en' ? 'Waiting Pickup' : 'Menunggu Jemputan'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-sm font-bold text-[10px] bg-green-100 text-green-700">
                        {bahasa === 'en' ? 'Delivered' : 'Terkirim'}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {so.status === 'Shipped' ? (
                      <button
                        onClick={() => handleMarkAsDelivered(so.id)}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 text-[10px] font-bold transition-colors"
                      >
                        ✓ {bahasa === 'en' ? 'Mark Delivered' : 'Konfirmasi Selesai'}
                      </button>
                    ) : (
                      <span className="text-gray-400 text-[10px] font-bold italic">
                        {so.deliveredAt
                          ? new Date(so.deliveredAt).toLocaleDateString('id-ID')
                          : (bahasa === 'en' ? 'Done' : 'Selesai')}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── PAGINATION ── */}
      <div className="flex flex-col md:flex-row justify-between items-center mt-3 gap-2 text-xs text-gray-500">
        <div>
          {bahasa === 'en'
            ? `Showing ${Math.min((currentPage - 1) * pageSize + 1, filtered.length)}–${Math.min(currentPage * pageSize, filtered.length)} of ${filtered.length} orders`
            : `Menampilkan ${Math.min((currentPage - 1) * pageSize + 1, filtered.length)}–${Math.min(currentPage * pageSize, filtered.length)} dari ${filtered.length} pesanan`}
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

      {/* ═══ MODAL: ORDER DETAIL ═══ */}
      {selectedSODetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-sm w-[480px] shadow-2xl overflow-hidden">
            <div className="bg-gray-100 border-b border-gray-300 px-4 py-3 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-[#4d5f79]">Manifest Order Trace: {selectedSODetail.id}</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">{selectedSODetail.date}</p>
              </div>
              <button onClick={() => setSelectedSODetail(null)} className="text-gray-400 hover:text-gray-700 font-bold text-xl">✕</button>
            </div>
            <div className="p-5 text-sm text-gray-700 space-y-4">
              <div className="flex justify-between gap-4">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Customer</p>
                  <h4 className="font-black text-lg text-[#125ab2]">{selectedSODetail.customer}</h4>
                  {selectedSODetail.address && (
                    <p className="text-xs text-gray-500 mt-0.5">{selectedSODetail.address}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Status</p>
                  <span className={`px-2 py-0.5 rounded-sm font-bold text-[10px] ${
                    selectedSODetail.status === 'Shipped'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {selectedSODetail.status === 'Shipped'
                      ? (bahasa === 'en' ? 'Waiting Pickup' : 'Menunggu Jemputan')
                      : (bahasa === 'en' ? 'Delivered' : 'Terkirim')}
                  </span>
                </div>
              </div>

              {selectedSODetail.trackingNumber && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-sm">
                  <p className="text-[10px] font-bold text-blue-700 uppercase mb-1">Tracking Information</p>
                  <p className="font-mono font-bold text-blue-800">{selectedSODetail.trackingNumber}</p>
                  {selectedSODetail.courier && (
                    <p className="text-xs text-blue-600 mt-0.5">via {selectedSODetail.courier}</p>
                  )}
                </div>
              )}

              {/* Timeline */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Timeline</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                    <span className="text-gray-500">Order created — {selectedSODetail.date}</span>
                  </div>
                  {selectedSODetail.shippedAt && (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0"></span>
                      <span className="text-gray-500">
                        Shipped via {selectedSODetail.courier} — {new Date(selectedSODetail.shippedAt).toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                  {selectedSODetail.deliveredAt && (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
                      <span className="text-gray-600 font-semibold">
                        Delivered — {new Date(selectedSODetail.deliveredAt).toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelectedSODetail(null)}
                className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold transition-colors"
              >
                {bahasa === 'en' ? 'Close Document' : 'Tutup Dokumen'}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
};

export default ShippingManifests;