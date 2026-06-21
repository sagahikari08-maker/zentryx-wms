import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from './AppContext';

// ─── TOAST COMPONENT ─────────────────────────────────────────────────────────
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
    {toasts.map(({ id, message, type }) => (
      <div
        key={id}
        className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-sm shadow-xl text-white text-xs font-semibold min-w-[280px] border-l-4 ${
          type === 'success' ? 'bg-emerald-600 border-emerald-800' :
          type === 'error'   ? 'bg-red-600 border-red-800' :
          type === 'warning' ? 'bg-amber-500 border-amber-800' : 'bg-[#125ab2] border-blue-800'
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
    ? 'bg-red-100 text-red-700 border border-red-200'
    : age > 3
    ? 'bg-amber-100 text-amber-700 border border-amber-200'
    : 'bg-gray-100 text-gray-500 border border-gray-200';
  return (
    <span className={`px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-wider shadow-sm ${cls}`}>
      {age}d ago
    </span>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const ShippingManifests = () => {
  const { bahasa, soData, setSoData } = useContext(AppContext);

  const manifestOrders = (soData || []).filter(so => so.status === 'Shipped' || so.status === 'Delivered');
  const shippedOrders  = (soData || []).filter(so => so.status === 'Shipped');

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

  // ─── FILTERED & PAGINATED DATA (REVISI BUG: Menggunakan nama variabel konsisten `filteredData`) ───
  const filteredData = useMemo(() => {
    let data = [...manifestOrders];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(so =>
        (so.id && so.id.toLowerCase().includes(q)) ||
        (so.customer && so.customer.toLowerCase().includes(q)) ||
        (so.trackingNumber && so.trackingNumber.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== 'All') data = data.filter(so => so.status === statusFilter);
    return data;
  }, [manifestOrders, searchQuery, statusFilter]);

  const totalPages    = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // ─── STATS ───────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:     manifestOrders.length,
    shipped:   shippedOrders.length,
    delivered: (soData || []).filter(so => so.status === 'Delivered').length,
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
      const stored = window.localStorage.getItem('dockSchedules_ARUS');
      if (!stored) return; // Aman jika modul dock belum pernah dipakai

      const savedDocks = JSON.parse(stored);
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

  // ─── EXPORT CSV (REVISI BUG: Memanggil `filteredData`) ───────────────────
  const handleExportCSV = () => {
    const headers = ['Order ID','Customer','Address','Date','Status','Courier','Tracking Number'];
    const rows = filteredData.map(so => [
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
          <td style="padding:10px;border:1px solid #ddd;font-family:monospace;font-size:12px;font-weight:bold;">${awb}</td>
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
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
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
              font-size: 18px;
              font-weight: 900;
              color: #000;
              letter-spacing: 1px;
            }

            /* ── INFO GRID ── */
            .info-grid {
              display: flex;
              gap: 20px;
              margin-bottom: 24px;
            }
            .info-box {
              flex: 1;
              border: 2px solid #ccc;
              padding: 14px 16px;
              font-size: 13px;
              line-height: 1.7;
            }
            .info-label {
              font-size: 10px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              color: #000;
              margin-bottom: 6px;
              border-bottom: 1px solid #ccc;
              padding-bottom: 4px;
            }

            /* ── TABLE ── */
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
              margin-bottom: 40px;
              border: 2px solid #000;
            }
            thead tr {
              background-color: #000;
              color: #fff;
            }
            th {
              padding: 12px 12px;
              text-align: left;
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 1px;
              border-right: 1px solid #666;
            }
            tbody tr:nth-child(even) { background: #f9f9f9; }
            td { padding: 12px 12px; border-bottom: 1px solid #000; border-right: 1px solid #000; }

            /* ── SUMMARY ── */
            .summary-bar {
              background: #f4f4f4;
              border: 2px solid #000;
              padding: 15px 20px;
              font-size: 13px;
              display: flex;
              justify-content: space-between;
              margin-bottom: 40px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .summary-bar span { font-weight: 900; color: #125ab2; font-size: 14px; }

            /* ── SIGNATURES ── */
            .signatures-section {
              margin-top: 30px;
              page-break-inside: avoid;
            }
            .signatures-title {
              font-size: 12px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              color: #000;
              margin-bottom: 24px;
              border-bottom: 2px solid #000;
              padding-bottom: 8px;
            }
            .signatures {
              display: flex;
              justify-content: space-between;
              gap: 30px;
            }
            .sign-box {
              flex: 1;
              border: 2px solid #000;
              padding: 20px;
              text-align: center;
            }
            .sign-role {
              font-weight: 900;
              font-size: 14px;
              text-transform: uppercase;
              color: #000;
            }
            .sign-sub {
              font-size: 11px;
              color: #666;
              margin-bottom: 80px;
              margin-top: 4px;
            }
            .sign-area {
              border-top: 2px solid #000;
              padding-top: 10px;
              font-size: 11px;
              line-height: 1.8;
            }
            .sign-field {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-top: 8px;
            }
            .sign-field-label {
              font-weight: bold;
              color: #000;
            }
            .sign-underline {
              border-bottom: 1px solid #000;
              min-width: 160px;
              display: inline-block;
              height: 14px;
            }

            /* ── FOOTER ── */
            .footer {
              margin-top: 40px;
              font-size: 10px;
              text-align: center;
              color: #666;
              border-top: 1px solid #ccc;
              padding-top: 15px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 1px;
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
                <th style="width:5%;text-align:center;">No</th>
                <th style="width:15%">Order ID</th>
                <th style="width:25%">Penerima (Customer)</th>
                <th style="width:25%">Alamat Tujuan</th>
                <th style="width:15%">No. Resi (AWB)</th>
                <th style="width:10%">Kurir</th>
                <th style="width:5%;text-align:center;">Qty</th>
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
                  <div class="sign-field">
                    <span class="sign-field-label">Jabatan</span>
                    <span class="sign-underline"></span>
                  </div>
                  <div class="sign-field">
                    <span class="sign-field-label">Tanda Tangan</span>
                    <span class="sign-underline" style="height:40px;"></span>
                  </div>
                  <div class="sign-field">
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
                  <div class="sign-field">
                    <span class="sign-field-label">No. Kendaraan</span>
                    <span class="sign-underline"></span>
                  </div>
                  <div class="sign-field">
                    <span class="sign-field-label">Tanda Tangan</span>
                    <span class="sign-underline" style="height:40px;"></span>
                  </div>
                  <div class="sign-field">
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

          <script>setTimeout(() => { window.print(); }, 800);</script>
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
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 animate-fade-in font-sans">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
            <span>📤 Logistics</span> <span className="text-gray-300">/</span> <span className="text-[#125ab2]">Outbound</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide">
            {bahasa === 'en' ? 'Shipping Manifests' : 'Manifes Pengiriman'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {bahasa === 'en'
              ? 'Manage outbound shipments and confirm deliveries with courier handover.'
              : 'Kelola pengiriman keluar dan konfirmasi serah terima dengan kurir.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportCSV}
            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-sm shadow-sm text-[10px] font-bold uppercase tracking-wider transition-colors"
          >
            ⭳ Export CSV
          </button>
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkMarkAsDelivered}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-sm shadow-sm text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
            >
              <span>✓</span> {bahasa === 'en' ? `Bulk Delivered (${selectedIds.length})` : `Tandai Selesai (${selectedIds.length})`}
            </button>
          )}
          <button
            onClick={handlePrintManifest}
            disabled={!shippedOrders.length}
            className={`px-5 py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
              shippedOrders.length
                ? 'bg-[#125ab2] hover:bg-[#0e4487] text-white shadow-sm'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'
            }`}
          >
            <span>📄</span> {bahasa === 'en' ? 'Print Daily Manifest' : 'Cetak Manifes Hari Ini'}
            {shippedOrders.length > 0 && (
              <span className="bg-white text-[#125ab2] text-[9px] font-black px-1.5 py-0.5 rounded-sm ml-1">
                {shippedOrders.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: bahasa === 'en' ? 'Total in Manifest' : 'Total di Manifes', value: stats.total,     color: 'bg-gray-800' },
          { label: bahasa === 'en' ? 'Waiting Pickup'    : 'Menunggu Jemputan', value: stats.shipped,  color: 'bg-amber-500' },
          { label: bahasa === 'en' ? 'Delivered'         : 'Terkirim',          value: stats.delivered, color: 'bg-emerald-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-sm shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`${s.color} text-white text-xl font-black w-12 h-12 flex items-center justify-center rounded-sm shrink-0 shadow-inner`}>
              {s.value}
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{s.label}</div>
              <div className="text-xl font-black text-gray-900 leading-tight mt-0.5">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── SEARCH & FILTER BAR ── */}
      <div className="bg-white p-3 border border-gray-300 shadow-sm rounded-sm mb-4 flex flex-col lg:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700 outline-none rounded-sm cursor-pointer shadow-sm min-w-[180px]"
          >
            <option value="All">{bahasa === 'en' ? 'All Status' : 'Semua Status'}</option>
            <option value="Shipped">{bahasa === 'en' ? 'Waiting for Pickup' : 'Menunggu Jemputan'}</option>
            <option value="Delivered">{bahasa === 'en' ? 'Delivered' : 'Terkirim'}</option>
          </select>
        </div>

        <div className="relative w-full lg:w-[400px]">
          <span className="absolute left-3 top-2.5 opacity-40 text-xs">🔍</span>
          <input
            type="text"
            placeholder={bahasa === 'en' ? 'Search by Order ID, Customer, or Tracking...' : 'Cari Order ID, Customer, atau No. Resi...'}
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold border border-gray-300 rounded-sm outline-none focus:border-[#125ab2] transition-colors shadow-sm"
          />
        </div>
      </div>

      {/* ── INFO BANNER ── */}
      <div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded-sm flex items-center gap-3 text-xs text-[#125ab2] mb-4 shadow-inner">
        <span className="text-lg">ℹ️</span>
        <span className="font-semibold">
          {bahasa === 'en'
            ? 'Click Order ID to view manifest trace. Print Daily Manifest generates a handover document with signature fields.'
            : 'Klik Order ID untuk melihat rincian manifes. Cetak Manifes Hari Ini menghasilkan dokumen serah terima dengan kolom tanda tangan.'}
        </span>
      </div>

      {/* ── TABLE ── */}
      <div className="bg-white border border-gray-300 shadow-sm w-full overflow-hidden rounded-sm flex flex-col hover:shadow-md transition-shadow">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-[#f8f9fa] text-[#64748b] text-[9px] uppercase tracking-widest border-b border-gray-200">
              <tr>
                <th className="py-3 px-4 text-center w-12">
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 cursor-pointer"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="py-3 px-4 font-bold w-12 text-center">NO</th>
                <th className="py-3 px-4 font-bold w-40">ORDER ID</th>
                <th className="py-3 px-4 font-bold w-64">CUSTOMER DETAILS</th>
                <th className="py-3 px-4 font-bold w-40">ORDER DATE</th>
                <th className="py-3 px-4 font-bold w-32">AGE</th>
                <th className="py-3 px-4 font-bold w-48">LOGISTICS TRACKING</th>
                <th className="py-3 px-4 font-bold w-36 text-center">STATUS</th>
                <th className="py-3 px-4 font-bold text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="text-[12px] text-gray-800">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-gray-500 font-bold italic">
                    <span className="text-3xl block mb-2 opacity-50">📭</span>
                    {bahasa === 'en' ? 'No manifest orders found.' : 'Tidak ada data manifes.'}
                  </td>
                </tr>
              ) : (
                paginatedData.map((so, index) => {
                  const isShipped = so.status === 'Shipped';
                  const isDelivered = so.status === 'Delivered';
                  const isSelected = selectedIds.includes(so.id);

                  return (
                    <tr
                      key={so.id}
                      className={`border-b border-gray-100 transition-colors ${
                        isSelected ? 'bg-amber-50/50' :
                        isDelivered ? 'bg-gray-50 opacity-60 grayscale hover:bg-gray-100' : 
                        'hover:bg-blue-50/40'
                      }`}
                    >
                      <td className="py-4 px-4 text-center">
                        {isShipped ? (
                          <input
                            type="checkbox"
                            className="w-3.5 h-3.5 cursor-pointer"
                            checked={isSelected}
                            onChange={() => toggleSelect(so.id)}
                          />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      
                      <td className="py-4 px-4 text-center font-bold text-gray-400 text-xs">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>
                      
                      <td className="py-4 px-4">
                        <span
                          onClick={() => setSelectedSODetail(so)}
                          className="font-mono font-black text-[#125ab2] text-[13px] cursor-pointer hover:underline"
                          title="View Trace"
                        >
                          {so.id}
                        </span>
                      </td>
                      
                      <td className="py-4 px-4 max-w-[280px] whitespace-normal">
                        <div className="font-bold text-gray-900 leading-tight">{so.customer}</div>
                        {so.address && (
                          <div className="text-[10px] text-gray-500 mt-1 truncate" title={so.address}>📍 {so.address}</div>
                        )}
                      </td>
                      
                      <td className="py-4 px-4">
                        <div className="font-bold text-gray-800 text-[11px]">{so.date}</div>
                      </td>
                      
                      <td className="py-4 px-4">
                        <OrderAgeBadge date={so.date} />
                      </td>
                      
                      <td className="py-4 px-4">
                        {so.trackingNumber ? (
                          <div>
                            <div className="text-[11px] font-black font-mono text-gray-900 bg-gray-100 px-2 py-0.5 rounded-sm inline-block border border-gray-200 shadow-sm">{so.trackingNumber}</div>
                            {so.courier && <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mt-1.5">🚚 {so.courier}</div>}
                          </div>
                        ) : (
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider italic">—</span>
                        )}
                      </td>
                      
                      <td className="py-4 px-4 text-center">
                        {isShipped ? (
                          <span className="px-2.5 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-widest border shadow-sm bg-amber-100 text-amber-800 border-amber-300 animate-pulse">
                            {bahasa === 'en' ? 'Waiting Pickup' : 'Menunggu Jemputan'}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-widest border shadow-sm bg-emerald-100 text-emerald-800 border-emerald-300">
                            {bahasa === 'en' ? 'Delivered' : 'Terkirim'}
                          </span>
                        )}
                      </td>
                      
                      <td className="py-4 px-4 text-right">
                        {isShipped ? (
                          <button
                            onClick={() => handleMarkAsDelivered(so.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-sm text-[9px] font-black uppercase tracking-wider shadow-sm transition-transform active:scale-95 flex items-center justify-end gap-1.5 ml-auto"
                          >
                            <span>✓</span> {bahasa === 'en' ? 'Mark Delivered' : 'Konfirmasi Selesai'}
                          </button>
                        ) : (
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider italic">
                            {so.deliveredAt
                              ? new Date(so.deliveredAt).toLocaleDateString('id-ID')
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
      </div>

      {/* ── PAGINATION ── */}
      {filteredData.length > 0 && (
        <div className="flex flex-col md:flex-row items-center justify-between mt-4 gap-3 text-[11px] text-gray-500 font-bold uppercase tracking-wider">
          <div>
            {bahasa === 'en'
              ? `Showing ${Math.min((currentPage - 1) * pageSize + 1, filteredData.length)}–${Math.min(currentPage * pageSize, filteredData.length)} of ${filteredData.length} active orders`
              : `Menampilkan ${Math.min((currentPage - 1) * pageSize + 1, filteredData.length)}–${Math.min(currentPage * pageSize, filteredData.length)} dari ${filteredData.length} pesanan`}
          </div>
          <div className="flex items-center gap-2">
            <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="border border-gray-300 px-2 py-1 outline-none bg-white rounded-sm cursor-pointer shadow-sm">
              {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
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

      {/* ═══ MODAL: ORDER DETAIL ═══ */}
      {selectedSODetail && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[550px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-[#415a77]" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            <div className="bg-[#415a77] text-white px-6 py-4 flex justify-between items-center shrink-0">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 opacity-80">Manifest Order Trace</p>
                <h3 className="font-black text-sm uppercase tracking-wider">{selectedSODetail.id}</h3>
              </div>
              <button onClick={() => setSelectedSODetail(null)} className="text-white opacity-70 hover:opacity-100 font-bold text-xl leading-none px-2">✕</button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar text-sm text-gray-700 space-y-6">
              
              <div className="flex justify-between items-start border-b border-gray-200 pb-5 gap-4">
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Customer / Consignee</p>
                  <h4 className="font-black text-lg text-[#125ab2] leading-tight">{selectedSODetail.customer}</h4>
                  {selectedSODetail.address && (
                    <p className="text-xs text-gray-600 mt-1 max-w-[280px] font-semibold">{selectedSODetail.address}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Current Status</p>
                  <span className={`px-2.5 py-1.5 rounded-sm font-black text-[9px] uppercase tracking-widest border shadow-sm ${
                    selectedSODetail.status === 'Shipped'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    {selectedSODetail.status === 'Shipped'
                      ? (bahasa === 'en' ? 'Waiting Pickup' : 'Menunggu Jemputan')
                      : (bahasa === 'en' ? 'Delivered' : 'Terkirim')}
                  </span>
                </div>
              </div>

              {selectedSODetail.trackingNumber && (
                <div className="p-4 bg-gray-900 rounded-sm text-center shadow-inner">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Tracking Information</p>
                  <p className="text-xl font-mono font-black text-emerald-400 tracking-widest">{selectedSODetail.trackingNumber}</p>
                  {selectedSODetail.courier && (
                    <p className="text-[10px] font-bold text-gray-300 mt-2 uppercase tracking-wider">CARRIER: {selectedSODetail.courier}</p>
                  )}
                </div>
              )}

              {/* Timeline */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Audit Timeline</p>
                <div className="space-y-3 text-[11px] font-semibold border-l-2 border-gray-200 ml-2 pl-3">
                  <div className="relative">
                    <span className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white shadow-sm"></span>
                    <span className="text-gray-500">Order drafted at {selectedSODetail.createdAt ? new Date(selectedSODetail.createdAt).toLocaleString('en-GB') : selectedSODetail.date}</span>
                  </div>
                  {selectedSODetail.pickingStartAt && (
                    <div className="relative">
                      <span className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-purple-500 border-2 border-white shadow-sm"></span>
                      <span className="text-gray-700">Execution commenced (Picking) at {new Date(selectedSODetail.pickingStartAt).toLocaleString('en-GB')}</span>
                    </div>
                  )}
                  {selectedSODetail.packingStartAt && (
                    <div className="relative">
                      <span className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-yellow-500 border-2 border-white shadow-sm"></span>
                      <span className="text-gray-700">Moved to staging (Packing) at {new Date(selectedSODetail.packingStartAt).toLocaleString('en-GB')}</span>
                    </div>
                  )}
                  {selectedSODetail.shippedAt && (
                    <div className="relative">
                      <span className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-orange-500 border-2 border-white shadow-sm"></span>
                      <span className="text-gray-700">Dispatched via {selectedSODetail.courier} at {new Date(selectedSODetail.shippedAt).toLocaleString('en-GB')}</span>
                    </div>
                  )}
                  {selectedSODetail.deliveredAt && (
                    <div className="relative">
                      <span className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm"></span>
                      <span className="text-emerald-700 font-black">POD Secured & Closed at {new Date(selectedSODetail.deliveredAt).toLocaleString('en-GB')}</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
            
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedSODetail(null)}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm rounded-sm"
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