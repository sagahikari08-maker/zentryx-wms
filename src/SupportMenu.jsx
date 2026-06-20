import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from './AppContext';

// ─── TOAST COMPONENT (Aman dari Bug Klik/Pointer Events) ─────────────────────
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

const SupportMenu = () => {
  const { bahasa, halaman, setHalaman } = useContext(AppContext);

  // ─── TABS STATE ───
  const [activeTab, setActiveTab] = useState(() => {
    if (halaman === 'supportTicket') return 'TICKET';
    if (halaman === 'systemStatus') return 'STATUS';
    return 'HELP'; 
  });

  useEffect(() => {
    if (halaman === 'helpCenter') setActiveTab('HELP');
    else if (halaman === 'supportTicket') setActiveTab('TICKET');
    else if (halaman === 'systemStatus') setActiveTab('STATUS');
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

  // ─── MODALS STATE ───
  const [modalArticle, setModalArticle] = useState({ isOpen: false, data: null });
  const [modalNewTicket, setModalNewTicket] = useState(false);
  const [modalTicketDetail, setModalTicketDetail] = useState({ isOpen: false, data: null });
  const [modalDiagnostic, setModalDiagnostic] = useState(false);
  const [modalSuggest, setModalSuggest] = useState(false);
  const [modalService, setModalService] = useState({ isOpen: false, data: null });

  // ─── FORMS STATE ───
  const [ticketForm, setTicketForm] = useState({ subject: '', priority: 'Low', desc: '' });
  const [suggestForm, setSuggestForm] = useState({ title: '', category: 'Inbound Logistics', content: '' });
  const [chatInput, setChatInput] = useState('');
  
  // FITUR BARU: RCA & CAPA MANDATORY FORM STATE
  const [rcaForm, setRcaForm] = useState({ rootCause: '', preventiveAction: '' });

  // ─── HELPER FUNCTION ───
  const getDynamicDate = (daysOffset) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toLocaleDateString('en-GB'); 
  };

  // ─── DATA STATE (ARUS MOTORS END-TO-END KNOWLEDGE BASE) ───

  const [articles, setArticles] = useState([
    // INBOUND LOGISTICS
    { id: 'KB-INB-01', title: 'SOP: Penerimaan Barang (Receiving) & Scan GRN Komponen EV', category: 'Inbound Logistics', reads: 3250, content: "Langkah-langkah penerimaan kargo dari supplier:\n1. Buka modul 'Receive Purchase Orders' saat truk merapat ke Inbound Dock.\n2. Verifikasi nomor PO dengan Surat Jalan (Delivery Note) fisik dari supir.\n3. Gunakan RF Scanner untuk menembak barcode di pallet. Pastikan QTY fisik sama dengan sistem.\n4. Klik 'Generate GRN (Goods Receipt Note)'.\n5. Jika komponen berupa Baterai LFP atau Modul Sensor, sistem otomatis memberikan flag 'Pending QC'." },
    { id: 'KB-INB-02', title: 'SOP: Directed Putaway & Penempatan Komponen di Rak', category: 'Inbound Logistics', reads: 2840, content: "Sistem Zentryx menggunakan Directed Putaway untuk keamanan. Setelah GRN dibuat:\n1. Buka modul 'Putaway'. Sistem akan menyarankan Bin Location (Koordinat Rak).\n2. Untuk barang >1000kg (Sasis), sistem akan MENGUNCI penempatan hanya di Level 1 (Ground Floor).\n3. Bawa pallet menggunakan Forklift ke lokasi yang ditunjuk.\n4. Scan Barcode Rak, lalu Scan Barcode Pallet untuk konfirmasi 'Stock In Place'." },

    // OUTBOUND LOGISTICS
    { id: 'KB-OUT-01', title: 'SOP: Pemrosesan Pick, Pack & Ship (Outbound Fulfillment)', category: 'Outbound Logistics', reads: 4120, content: "Siklus pengiriman komponen ke Dealership atau Perakitan:\n1. Masuk ke modul 'Fulfill Orders', pilih order dengan status 'Pending Fulfillment'.\n2. Klik 'Generate Pick Task'. RF Scanner petugas lapangan akan berbunyi.\n3. Petugas melakukan 'Pick' sesuai urutan rute (Route Optimization) dari sistem.\n4. Bawa kargo ke Zone Staging (Packing).\n5. Lakukan verifikasi akhir dan klik 'Pack & Ship'. Sistem otomatis membuat Packing Slip dan memotong stok." },
    { id: 'KB-OUT-02', title: 'SOP: Menangani "LOCKED - Missing Legal Cert" pada Gatepass Outbound', category: 'Outbound Logistics', reads: 1420, content: "Jika status Packing Slip berubah menjadi LOCKED warna merah, ini adalah fitur Compliance Interlock.\n\nSebab: Izin Transportasi HAZMAT atau UN3480 Lithium Battery Certificate yang didaftarkan sudah kedaluwarsa.\nSolusi: Tim Legal atau HSE harus mengupload dokumen izin terbaru di menu 'Document Center > Compliance Config'. Sistem akan langsung membuka gembok gatepass secara otomatis setelah status izin menjadi 'Valid'." },
    { id: 'KB-OUT-03', title: 'SOP: Digital Handshake Supir (Driver POD) untuk Bill of Lading (BOL)', category: 'Outbound Logistics', reads: 2650, content: "Truk logistik pihak ketiga (3PL) DILARANG berangkat sebelum BOL ditandatangani.\n1. Buka menu 'Document Center > Bill of Lading'.\n2. Klik tombol 'Capture E-Signature' pada armada yang siap berangkat.\n3. Ketik nama lengkap supir sesuai KTP/SIM.\n4. Minta supir menandatangani pad menggunakan stylus.\n5. Klik 'Accept Liability & Dispatch'. Tanggung jawab barang kini beralih ke 3PL." },

    // INVENTORY CONTROL
    { id: 'KB-INV-01', title: 'SOP: Pelaksanaan Cycle Count (Opname) Harian via RF Scanner', category: 'Inventory', reads: 3100, content: "Untuk menjaga akurasi 99.9% tanpa mematikan pabrik:\n1. Buka modul 'Cycle Counts'. Sistem akan menghasilkan daftar lokasi acak (Blind Count) untuk dihitung hari ini.\n2. Supervisor menugaskan task ke operator.\n3. Operator menuju lokasi dan scan barcode rak, lalu memasukkan QTY fisik tanpa mengetahui QTY di sistem.\n4. Jika selisih (discrepancy) di luar toleransi (misal >2%), Manager harus memverifikasi dan menyetujui 'Inventory Adjustment'." },
    { id: 'KB-INV-02', title: 'SOP: Pemindahan Stok Antar-Bin (Bin Transfer)', category: 'Inventory', reads: 1890, content: "Pemindahan stok untuk optimalisasi ruang:\n1. Buka modul 'Bin Transfers'.\n2. Scan Barcode Pallet asal (Source Bin).\n3. Tentukan QTY yang ingin dipindah.\n4. Scan Barcode Rak tujuan (Destination Bin).\nCatatan: Sistem akan menolak pemindahan komponen kimia/baterai (Hazmat) ke zona penyimpanan umum (Ambient)." },

    // PROCUREMENT & VENDOR
    { id: 'KB-PRO-01', title: 'Automasi Pipeline: Konversi Requisition (PR) menjadi Draft PO', category: 'Procurement', reads: 2190, content: "Siklus pengadaan material internal:\n1. Staf teknis membuat permintaan di tab 'Requisitions (PR)'.\n2. Manager mereview dan klik 'Approve & Build PO'.\n3. PR tersebut seketika hilang dari antrean dan masuk ke tab 'Purchase Orders' sebagai Draft.\n4. Tim Purchasing membuka Draft tersebut, memilih Vendor resmi dari *dropdown*, mengisi harga final kontrak, lalu klik 'Commit Contract'." },
    { id: 'KB-PRO-02', title: 'SOP: Flag Discrepancy, Tahan Invoice, dan Klaim RMA ke Vendor', category: 'Procurement', reads: 2940, content: "Jika barang yang dikirim vendor kurang atau gagal lulus uji QC (Quality Control):\n1. Di tab 'Purchase Orders', klik '🚨 Flag Discrepancy'.\n2. Tuliskan deskripsi kerusakan (misal: Segel rusak, kurang 5 unit).\n3. Klik Submit. Langkah ini akan MENGUNCI dokumen di departemen Finance sehingga Invoice tidak bisa dibayar.\n4. Kasus ini akan otomatis terlempar ke modul 'Reverse Logistics & RMAs' untuk diproses klaimnya ke Vendor." },

    // DEMAND PLANNING (MRP)
    { id: 'KB-DMN-01', title: 'SOP: Sinkronisasi MRP Engine untuk Kalkulasi Supply Plan', category: 'Demand Planning', reads: 1820, content: "Setiap awal bulan atau setelah ada revisi ramalan penjualan (Forecast):\n1. Buka modul 'Demand Planning > Supply Plans'.\n2. Klik tombol '🔄 Sync MRP Engine'.\n3. Sistem secara otonom akan menghitung [Forecast Demand - Stok Aktual - Buffer Safety Stock].\n4. Jika terdeteksi potensi kekurangan (shortage), sistem akan memuntahkan daftar 'Supply Plan' yang merekomendasikan jumlah order dan tanggal harus tiba (Required By Date)." },
    { id: 'KB-DMN-02', title: 'Penjelasan Engine Safety Stock: Standard vs Aggressive Model', category: 'Demand Planning', reads: 1510, content: "WMS memiliki 2 Algoritma Safety Stock (SS):\n• Standard Model: Berbasis rata-rata historis (30 hari). Menekan biaya simpan (holding cost). Cocok untuk suku cadang mekanikal non-kritis.\n• Aggressive Model: Fokus pada antisipasi kondisi terburuk (Max Demand x Max Lead Time). Jauh lebih boros ruang/modal, namun menjamin komponen KRUSIAL (seperti Baterai EV atau Chip MCU) tidak pernah kosong (No Line-Stop)." },

    // HSE & SAFETY
    { id: 'KB-HSE-01', title: 'SOP Darurat: Protokol Lockout/Tagout (LOTO) pada Mesin', category: 'HSE', reads: 4500, content: "PENTING - KESELAMATAN NYAWA:\nJika terjadi insiden kategori 'Critical', 'Chemical Spill', atau 'High-Voltage Arc':\n1. Input insiden di modul 'Safety Incidents'.\n2. Pilih Severity: CRITICAL.\n3. Saat di-submit, sistem akan otomatis membunyikan alarm logik dan memutus akses integrasi API terhadap alat di zona tersebut.\n4. Status alat di modul Maintenance akan berubah menjadi '🔒 LOTO ENGAGED'. Alat HARAM dinyalakan sebelum di-reset oleh Kepala HSE." },
    { id: 'KB-HSE-02', title: 'Prosedur Cetak BAP Insiden K3 Standar ISO 45001', category: 'HSE', reads: 1350, content: "Seluruh insiden K3 (Health & Safety) yang telah diinvestigasi wajib didokumentasikan untuk audit eksternal:\n1. Buka modul 'Safety Incidents' > Tab IT Support & HSE Log.\n2. Klik nomor tiket insiden.\n3. Pastikan kronologi dan tindakan CAPA (Corrective Action) sudah terisi lengkap.\n4. Klik 'Download BAP (ISO)'. Sistem akan mengunduh dokumen resmi siap cetak." },

    // MRO & ENGINEERING
    { id: 'KB-MRO-01', title: 'SOP: Check-Out Suku Cadang Mesin (MRO Inventory)', category: 'Engineering & MRO', reads: 1720, content: "Teknisi yang membutuhkan part untuk perbaikan mesin:\n1. Wajib melaporkan nomor Work Order / Asset ID mesin yang rusak.\n2. Buka modul 'Engineering MRO Inventory'.\n3. Cari SKU part (misal: Pelumas, Sensor, Motor).\n4. Klik 'Check-Out', masukkan jumlah, referensi mesin, dan nama teknisi penanggung jawab.\n5. Log transaksi akan tersimpan permanen di Ledger untuk analisis biaya (Costing)." },

    // SYSTEM SETUP & INTEGRATION
    { id: 'KB-SET-01', title: 'Konfigurasi Maksimum Beban Rak & Batasan Floor-Level', category: 'Setup', reads: 2450, content: "Untuk mengubah batas beban struktural rak gudang:\n1. Buka menu 'Setup & Integrations > Layout & Putaway'.\n2. Sesuaikan metrik 'Max Tonnage - Top Racks' (Rekomendasi max 250kg).\n3. Sesuaikan metrik 'Force Floor Placement' (Rekomendasi >1000kg). Kargo di atas angka ini tidak akan pernah diizinkan sistem untuk dinaikkan ke lantai 2 ke atas." },
    { id: 'KB-SET-02', title: 'Panduan Troubleshooting: Auto-Routing Failover Spooler Printer', category: 'Setup', reads: 1120, content: "Jika staf gudang melapor surat jalan gagal cetak (Printer Zebra Error/Jammed):\nJangan panik. Buka 'Setup > Hardware Failover'. Pastikan 'Active Failover Target' sudah diatur ke printer cadangan yang menyala. Print Spooler Zentryx secara otomatis telah merutekan ulang seluruh dokumen ke printer cadangan tersebut. Minta teknisi IT memperbaiki printer utama secara offline tanpa mengganggu operasional." },
    { id: 'KB-APP-01', title: 'Panduan Sinkronisasi Handheld Scanner (MDM) Baru', category: 'Integrations', reads: 1350, content: "Mendaftarkan perangkat scanner Zebra/Honeywell baru:\n1. Buka 'Setup & Integrations > Barcode Scanner Setup'.\n2. Daftarkan Serial Number perangkat (MAC Address).\n3. Masuk ke modul 'Shift Roster' dan pasangkan staf dengan Zona yang diizinkan.\n4. Di layar scanner fisik, minta staf melakukan 'Login'. Sistem MDM akan mengunci layar scanner HANYA untuk tugas di Zona yang telah diatur." },
  ]);
  const [searchQuery, setSearchQuery] = useState('');

  // 2. TICKETS (IT INFRASTRUCTURE)
  const [tickets, setTickets] = useState([
    { id: 'TKT-ARS-9912', subject: 'Zebra Scanner HW-TC52 Battery Drain', priority: 'Medium', status: 'In Progress', date: getDynamicDate(-1), user: 'Budi S. (Line Spv)', desc: 'Scanner battery drops from 100% to 10% in less than 2 hours of scanning incoming chassis blocks.', conversation: [{ sender: 'IT Fleet Support', text: 'Ticket auto-assigned to hardware maintenance. Please swap device at Admin Desk.' }] },
    { id: 'TKT-ARS-9911', subject: 'AGV Routing API Checksum Error', priority: 'High', status: 'Open', date: getDynamicDate(0), user: 'Arief R. (Dock Master)', desc: 'KUKA AGV Unit 4 throwing checksum parsing error when attempting to read inbound dock barcode.', conversation: [] },
    { id: 'TKT-ARS-9908', subject: 'Cannot void Putaway Task for Order #ORD-881', priority: 'Low', status: 'Resolved', date: getDynamicDate(-4), user: 'Siti A.', desc: 'Task lock was stuck due to Wi-Fi connection drop inside the Clean Room (Zone D).', conversation: [{ sender: 'System Audit', text: '[STATUS: RESOLVED]\nRoot Cause: Access Point 04 offline due to power surge.\nPreventive Action: Installed UPS backup for Zone D access points.' }] },
  ]);

  // 3. SYSTEM STATUS (MICROSERVICES)
  const [services, setServices] = useState([
    { id: 'SRV-DB-MAIN', name: 'Core MRO Database (PostgreSQL)', status: 'Operational', uptime: '99.99%', latency: '12ms', logs: 'Active Connection Pool: 432/1000. Buffer pool hit rate: 98.4%.' },
    { id: 'SRV-API-AGV', name: 'AGV Routing Gateway / Webhooks', status: 'Operational', uptime: '99.98%', latency: '24ms', logs: 'Ingress traffic standard. 0% packet dropped.' },
    { id: 'SRV-SPOOL-01', name: 'Zebra Print Spooler Engine', status: 'Operational', uptime: '100%', latency: '8ms', logs: 'Queue Spool: Empty. Thermal raw streaming socket nominal.' },
    { id: 'SRV-MDM-SYNC', name: 'MDM & RF Scanner Sync Node', status: 'Degraded', uptime: '98.50%', latency: '250ms', logs: 'High socket handshake delay observed on Zone D access points. Data packets experiencing jitter.' },
  ]);

  // ─── ACTIONS LOGIC ───

  const filteredArticles = articles.filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.category.toLowerCase().includes(searchQuery.toLowerCase()) || a.content.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleCreateTicket = (e) => {
    e.preventDefault();
    if (!ticketForm.subject || !ticketForm.desc) return addToast('Please fill all required diagnostic fields.', 'error');
    const newTkt = {
      id: `TKT-ARS-${Math.floor(9920 + Math.random() * 50)}`,
      subject: ticketForm.subject,
      priority: ticketForm.priority,
      status: 'Open',
      date: new Date().toLocaleDateString('en-GB'),
      user: 'Admin Manager',
      desc: ticketForm.desc,
      conversation: []
    };
    setTickets([newTkt, ...tickets]);
    addToast(`Ticket ${newTkt.id} created and broadcasted to IT Center.`, 'success');
    setModalNewTicket(false);
    setTicketForm({ subject: '', priority: 'Low', desc: '' });
  };

  const handleSaveSuggestion = (e) => {
    e.preventDefault();
    if(!suggestForm.title || !suggestForm.content) return addToast('Title and documentation content are required.', 'error');
    setArticles([{ id: `KB-ARS-${Math.floor(110 + Math.random() * 50)}`, title: suggestForm.title, category: suggestForm.category, reads: 1, content: suggestForm.content }, ...articles]);
    addToast('Knowledge Base updated! Your SOP is now live for all WMS users.', 'success');
    setModalSuggest(false);
    setSuggestForm({ title: '', category: 'Operations', content: '' });
  };

  const handleSendTicketReply = () => {
    if (!chatInput.trim()) return;
    const updatedTickets = tickets.map(t => {
      if (t.id === modalTicketDetail.data.id) {
        const newChat = [...t.conversation, { sender: 'You (SysAdmin)', text: chatInput }];
        const updatedObj = { ...t, conversation: newChat, status: t.status === 'Open' ? 'In Progress' : t.status };
        setModalTicketDetail({ isOpen: true, data: updatedObj });
        return updatedObj;
      }
      return t;
    });
    setTickets(updatedTickets);
    setChatInput('');
    addToast('Reply injected into ticket communication log.', 'success');
  };

  // FITUR INTERLOCK RCA (Root Cause Analysis) SEBELUM TIKET BISA DITUTUP
  const handleResolveTicket = (id) => {
    if (!rcaForm.rootCause.trim() || !rcaForm.preventiveAction.trim()) {
      return addToast('CRITICAL: Root Cause Analysis (RCA) and Preventive Action are strictly required before closing an investigation.', 'error');
    }

    const resolvedAuditMessage = {
      sender: 'System Audit',
      text: `[STATUS: RESOLVED]\nRoot Cause: ${rcaForm.rootCause}\nPreventive Action: ${rcaForm.preventiveAction}`
    };

    const updatedTickets = tickets.map(t => {
      if (t.id === id) {
        return { ...t, status: 'Resolved', conversation: [...t.conversation, resolvedAuditMessage] };
      }
      return t;
    });

    setTickets(updatedTickets);
    addToast(`Ticket ${id} marked as RESOLVED. Audit trail locked securely.`, 'success');
    
    // Reset form and close modal
    setRcaForm({ rootCause: '', preventiveAction: '' });
    setModalTicketDetail({ isOpen: false, data: null });
  };

  const handleRunDiagnostics = () => {
    setModalDiagnostic(true);
    setTimeout(() => {
      setServices(prev => prev.map(s => {
        if (s.id === 'SRV-MDM-SYNC') return { ...s, status: 'Operational', latency: '28ms', uptime: '98.55%', logs: 'Handshake re-established. Zone D Access Points power grid normalized.' };
        return { ...s, latency: `${Math.floor(Math.random() * 10) + 5}ms` };
      }));
      setModalDiagnostic(false);
      addToast('Global Diagnostics finished. Network latency bottleneck cleared.', 'success');
    }, 2500);
  };

  const handleRestartService = (srvId) => {
    setModalService({ isOpen: false, data: null });
    addToast(`REBOOT INITIALIZED: Flushing memory cache for Cluster Node [${srvId}]...`, 'warning');
    setTimeout(() => {
      setServices(prev => prev.map(s => s.id === srvId ? { ...s, status: 'Operational', latency: '9ms', logs: 'Node hot-swapped successfully. Memory footprints cleared to 0.02%.' } : s));
      addToast(`Cluster Node ${srvId} successfully recovered to nominal operational state.`, 'success');
    }, 1500);
  };


  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 animate-fade-in">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>🛟 Operations</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Tech Support</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide">
            {bahasa === 'en' ? 'Support & System Health' : 'Bantuan & Telemetri Server'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">Access knowledge base, report bugs to IT Fleet, and monitor real-time microservice telemetry.</p>
        </div>
        
        {/* TABS (SYNCED WITH NAVBAR) */}
        <div className="bg-gray-100 p-1 rounded-sm shadow-inner flex overflow-x-auto border border-gray-300">
          <button onClick={() => handleTabClick('HELP', 'helpCenter')} className={`px-5 py-2.5 text-xs font-bold uppercase transition-all rounded-sm whitespace-nowrap ${activeTab === 'HELP' ? 'bg-[#415a77] text-white shadow' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}>
            Knowledge Base
          </button>
          <button onClick={() => handleTabClick('TICKET', 'supportTicket')} className={`px-5 py-2.5 text-xs font-bold uppercase transition-all rounded-sm whitespace-nowrap ${activeTab === 'TICKET' ? 'bg-[#415a77] text-white shadow' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}>
            IT Support Tickets
          </button>
          <button onClick={() => handleTabClick('STATUS', 'systemStatus')} className={`px-5 py-2.5 text-xs font-bold uppercase transition-all rounded-sm whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'STATUS' ? 'bg-[#415a77] text-white shadow' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}>
            System Status {services.some(s => s.status !== 'Operational') && <span className="bg-red-500 w-2.5 h-2.5 rounded-full animate-pulse shadow-sm"></span>}
          </button>
        </div>
      </div>

      {/* ── TAB 1: KNOWLEDGE BASE ── */}
      {activeTab === 'HELP' && (
        <div className="animate-fade-in space-y-6">
          <div className="bg-white border border-gray-300 shadow-sm rounded-sm p-10 text-center bg-gradient-to-b from-blue-50/50 to-white">
            <h3 className="text-2xl font-black text-[#125ab2] mb-3">How can we assist your operations today?</h3>
            <p className="text-sm text-gray-600 mb-8 font-medium max-w-3xl mx-auto">Search comprehensive Standard Operating Procedures (SOP), end-to-end operational guides, and hardware manuals across the entire ARUS Motors WMS infrastructure.</p>
            <div className="max-w-2xl mx-auto relative flex gap-3">
              <div className="relative flex-1">
                <span className="absolute left-4 top-3.5 text-lg opacity-60">🔍</span>
                <input 
                  type="text" 
                  placeholder="Search for 'LOTO', 'Hazmat Putaway', 'Sync MRP', 'ASN'..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border-2 border-[#125ab2] p-3.5 pl-12 text-sm font-bold text-gray-800 rounded-sm outline-none shadow-sm transition-shadow focus:shadow-md"
                />
              </div>
              <button onClick={() => setModalSuggest(true)} className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-6 rounded-sm text-[11px] font-bold uppercase tracking-wider shadow-sm transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap">
                <span>+</span> Write New SOP
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredArticles.length === 0 ? (
               <div className="col-span-3 text-center py-12 bg-white border border-gray-200 rounded-sm">
                 <span className="text-4xl block mb-3 opacity-50">📚</span>
                 <p className="text-gray-500 font-bold">No documentation found matching your query.</p>
               </div>
            ) : (
              filteredArticles.map((art, i) => (
                <div key={i} onClick={() => setModalArticle({ isOpen: true, data: art })} className="bg-white border border-gray-200 rounded-sm shadow-sm p-6 cursor-pointer hover:border-[#125ab2] hover:shadow-md transition-all group flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[9px] font-black text-[#125ab2] uppercase tracking-wider bg-blue-50 border border-blue-100 px-2 py-1 rounded-sm shadow-sm">{art.category}</span>
                      <span className="text-[10px] text-gray-400 font-bold">{art.reads.toLocaleString()} Views</span>
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm group-hover:text-[#125ab2] transition-colors line-clamp-2 leading-relaxed mb-2">{art.title}</h4>
                    <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">{art.content}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-100 text-[10px] font-bold text-gray-400 flex items-center gap-1 group-hover:text-[#125ab2] transition-colors">
                    <span>📖</span> Read Complete Protocol →
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: IT SUPPORT TICKETS ── */}
      {activeTab === 'TICKET' && (
        <div className="bg-white border border-gray-300 shadow-sm rounded-sm animate-fade-in flex flex-col overflow-hidden hover:shadow-md transition-shadow">
          <div className="bg-slate-50 border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-xs uppercase text-gray-700 tracking-wider">IT Helpdesk Ticketing Center</h3>
              <p className="text-[10px] text-gray-500 font-semibold mt-0.5">Report software bugs, request user credentials, or dispatch hardware engineers for hardware replacement.</p>
            </div>
            <button onClick={() => setModalNewTicket(true)} className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-5 py-2.5 rounded-sm text-[10px] font-bold uppercase shadow-sm transition-colors w-full sm:w-auto tracking-wider flex items-center justify-center gap-1.5">
              <span>+</span> Submit New Ticket
            </button>
          </div>
          <div className="p-0 overflow-x-auto flex-1">
            <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
              <thead className="bg-[#f8f9fa] text-[#64748b] text-[10px] uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-6 border-b w-40">Ticket ID & Date</th>
                  <th className="py-3 px-6 border-b">Reported Issue / Subject</th>
                  <th className="py-3 px-6 text-center w-36 border-b">Priority Level</th>
                  <th className="py-3 px-6 text-center w-36 border-b">Resolution Status</th>
                  <th className="py-3 px-6 text-right w-48 border-b">Initiated By</th>
                </tr>
              </thead>
              <tbody className="text-[12px] text-gray-700">
                {tickets.map((tkt, i) => (
                  <tr key={i} className={`border-b border-gray-100 transition-colors ${tkt.status === 'Resolved' ? 'bg-gray-50 opacity-60 grayscale hover:bg-gray-100' : 'hover:bg-blue-50/40'}`}>
                    <td className="py-4 px-6">
                      <div onClick={() => {
                        setModalTicketDetail({ isOpen: true, data: tkt });
                        setRcaForm({ rootCause: '', preventiveAction: '' }); // Clear state on open
                      }} className="font-mono font-black text-[#125ab2] cursor-pointer hover:underline w-max text-[13px]">
                        {tkt.id}
                      </div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">{tkt.date}</div>
                    </td>
                    <td className="py-4 px-6 font-bold text-gray-900 text-[13px]">{tkt.subject}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm border ${
                        tkt.priority === 'High' ? 'bg-red-50 text-red-700 border-red-200' : 
                        tkt.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                        'bg-gray-100 text-gray-600 border-gray-300'
                      }`}>
                        {tkt.priority}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-2.5 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                        tkt.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
                        tkt.status === 'Open' ? 'bg-red-600 text-white border-red-700 animate-pulse' :
                        'bg-blue-100 text-blue-800 border-blue-300'
                      }`}>{tkt.status}</span>
                    </td>
                    <td className="py-4 px-6 text-right font-semibold text-gray-800">{tkt.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: SYSTEM STATUS ── */}
      {activeTab === 'STATUS' && (
        <div className="bg-white border border-gray-300 shadow-sm rounded-sm animate-fade-in flex flex-col overflow-hidden hover:shadow-md transition-shadow">
          <div className="bg-slate-50 border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-xs uppercase text-gray-700 tracking-wider">Cloud Infrastructure Telemetry</h3>
              <p className="text-[10px] text-gray-500 font-semibold mt-0.5">Real-time macro-status of Zentryx EV microservices, database clusters, and endpoint latencies.</p>
            </div>
            <button onClick={handleRunDiagnostics} className="bg-gray-800 hover:bg-black text-white px-5 py-2.5 rounded-sm text-[10px] font-bold uppercase shadow-sm transition-colors flex items-center justify-center gap-2 w-full sm:w-auto tracking-wider">
              <span>🎛️</span> Ping Endpoints
            </button>
          </div>
          <div className="p-0 overflow-x-auto flex-1">
            <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
              <thead className="bg-[#f8f9fa] text-[#64748b] text-[10px] uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-6 border-b w-64">Microservice / Cluster Node</th>
                  <th className="py-3 px-6 text-center border-b w-40">Live Status</th>
                  <th className="py-3 px-6 text-center border-b w-40">Uptime (30 Days)</th>
                  <th className="py-3 px-6 text-right border-b w-36">Ping / Latency</th>
                </tr>
              </thead>
              <tbody className="text-[12px] text-gray-700">
                {services.map((srv, i) => (
                  <tr key={i} onClick={() => setModalService({ isOpen: true, data: srv })} className={`border-b border-gray-100 cursor-pointer transition-colors ${srv.status !== 'Operational' ? 'bg-red-50/40 hover:bg-red-50' : 'hover:bg-blue-50/40'}`}>
                    <td className="py-4 px-6">
                      <div className="font-black text-[#125ab2] hover:underline text-[13px]">{srv.name}</div>
                      <div className="text-[10px] text-gray-500 font-mono font-bold mt-0.5">{srv.id}</div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex justify-center items-center gap-2 px-2.5 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest border shadow-sm ${srv.status === 'Operational' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-red-600 text-white border-red-700'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${srv.status === 'Operational' ? 'bg-emerald-500' : 'bg-white animate-pulse'}`}></div>
                        {srv.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center font-mono font-black text-gray-800 text-[13px]">{srv.uptime}</td>
                    <td className="py-4 px-6 text-right font-mono font-black text-gray-900 text-[13px]">{srv.latency}</td>
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

      {/* Modal 1: Article Reader */}
      {modalArticle.isOpen && modalArticle.data && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[650px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-[#125ab2]" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            <div className="px-6 py-4 flex justify-between items-center text-white bg-[#415a77] shrink-0 z-10">
              <div>
                <span className="bg-white/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded border border-white/30 mr-2 shadow-sm">{modalArticle.data.category}</span>
                <span className="font-mono text-[10px] font-bold opacity-90 tracking-widest">{modalArticle.data.id}</span>
              </div>
              <button onClick={() => setModalArticle({ isOpen: false, data: null })} className="text-white opacity-70 hover:opacity-100 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <div className="p-0 overflow-y-auto flex-1 custom-scrollbar z-0 flex flex-col">
              <div className="p-8">
                <h3 className="font-black text-xl text-gray-900 mb-6 leading-snug">{modalArticle.data.title}</h3>
                <div className="text-sm text-gray-800 leading-relaxed font-medium bg-gray-50 border border-gray-200 p-6 rounded-sm whitespace-pre-wrap shadow-inner">
                  {modalArticle.data.content}
                </div>
              </div>
            </div>

            <div className="bg-gray-100 px-6 py-4 border-t border-gray-300 shrink-0 z-10 flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Was this guide helpful for operations?</span>
              <div className="flex gap-3 w-full sm:w-auto">
                <button onClick={() => { addToast('Thank you for your constructive vote!', 'success'); setModalArticle({ isOpen: false, data: null }) }} className="flex-1 sm:flex-none px-4 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 rounded-sm text-xs font-bold transition-colors shadow-sm uppercase tracking-wider">👍 Yes</button>
                <button onClick={() => { addToast('Feedback noted. Operations Analyst will review content accuracy.', 'info'); setModalArticle({ isOpen: false, data: null }) }} className="flex-1 sm:flex-none px-4 py-2 bg-red-50 text-red-800 border border-red-200 hover:bg-red-100 rounded-sm text-xs font-bold transition-colors shadow-sm uppercase tracking-wider">👎 No</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Suggest New SOP Article Form */}
      {modalSuggest && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[550px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-[#125ab2]" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            <div className="px-6 py-4 flex justify-between items-center bg-blue-50 border-b border-blue-100 shrink-0 z-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-gray-500">Knowledge Base Engine</p>
                <h3 className="font-black text-sm uppercase tracking-wider text-[#125ab2]">Write New Standard Operating Procedure</h3>
              </div>
              <button onClick={() => setModalSuggest(false)} className="text-gray-400 hover:text-gray-800 font-bold text-xl leading-none px-2">✕</button>
            </div>
            <form onSubmit={handleSaveSuggestion} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 text-sm flex flex-col gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">SOP Guide Title <span className="text-red-500">*</span></label>
                  <input type="text" value={suggestForm.title} onChange={e => setSuggestForm({...suggestForm, title: e.target.value})} placeholder="e.g. Closing Procedures for Cold Vault" className="w-full border border-gray-300 p-2.5 text-xs rounded-sm outline-none focus:border-[#125ab2] font-bold text-gray-900" required autoFocus/>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Classification Category <span className="text-red-500">*</span></label>
                  <select value={suggestForm.category} onChange={e => setSuggestForm({...suggestForm, category: e.target.value})} className="w-full border border-gray-300 p-2.5 text-xs font-bold text-gray-800 bg-white rounded-sm outline-none focus:border-[#125ab2] cursor-pointer" required>
                    <option value="Inbound Logistics">Inbound Logistics</option>
                    <option value="Outbound Logistics">Outbound Logistics</option>
                    <option value="Inventory">Inventory Control</option>
                    <option value="Procurement">Procurement</option>
                    <option value="Demand Planning">Demand Planning</option>
                    <option value="HSE">HSE & Safety</option>
                    <option value="Engineering & MRO">Engineering & MRO</option>
                    <option value="Setup">System Setup</option>
                    <option value="Integrations">API & Integrations</option>
                    <option value="Documents">Documents Center</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Documentation Content <span className="text-red-500">*</span></label>
                  <textarea value={suggestForm.content} onChange={e => setSuggestForm({...suggestForm, content: e.target.value})} placeholder="Write step-by-step operating instructions here..." className="w-full border border-gray-300 p-2.5 text-xs font-medium rounded-sm outline-none focus:border-[#125ab2] resize-none" rows="8" required/>
                </div>
              </div>
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 shrink-0 z-10">
                <button type="button" onClick={() => setModalSuggest(false)} className="px-5 py-2.5 text-[10px] font-bold bg-white border border-gray-300 text-gray-700 uppercase tracking-wider rounded-sm shadow-sm transition-colors hover:bg-gray-100">Cancel</button>
                <button type="submit" className="bg-[#125ab2] text-white px-6 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-sm shadow-sm transition-colors hover:bg-[#0e4487]">Publish SOP to Live KB</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Submit New Ticket Form */}
      {modalNewTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[500px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-[#125ab2]" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            <div className="px-6 py-4 flex justify-between items-center bg-gray-50 border-b border-gray-200 shrink-0 z-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-gray-500">Service Desk</p>
                <h3 className="font-black text-sm uppercase tracking-wider text-gray-800">Submit IT Support Ticket</h3>
              </div>
              <button onClick={() => setModalNewTicket(false)} className="text-gray-400 hover:text-gray-800 font-bold text-xl leading-none px-2">✕</button>
            </div>
            <form onSubmit={handleCreateTicket} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 text-sm flex flex-col gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Issue Summary <span className="text-red-500">*</span></label>
                  <input type="text" value={ticketForm.subject} onChange={e => setTicketForm({...ticketForm, subject: e.target.value})} placeholder="e.g. Zebra Printer at Dock 2 is jammed" className="w-full border border-gray-300 p-2.5 text-xs rounded-sm outline-none focus:border-[#125ab2] font-bold text-gray-900" required autoFocus/>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Urgency Priority <span className="text-red-500">*</span></label>
                  <select value={ticketForm.priority} onChange={e => setTicketForm({...ticketForm, priority: e.target.value})} className="w-full border border-gray-300 p-2.5 text-xs font-bold text-gray-800 bg-white rounded-sm outline-none focus:border-[#125ab2] cursor-pointer" required>
                    <option value="Low">Low - Minor operational glitch</option>
                    <option value="Medium">Medium - Distrupting standard workflow</option>
                    <option value="High">High - Critical blocker (Operations Halted)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Detailed Technical Breakdown <span className="text-red-500">*</span></label>
                  <textarea value={ticketForm.desc} onChange={e => setTicketForm({...ticketForm, desc: e.target.value})} placeholder="Provide error codes, device IDs, or specific conditions..." className="w-full border border-gray-300 p-2.5 text-xs rounded-sm outline-none focus:border-[#125ab2] resize-none font-medium" rows="4" required/>
                </div>
              </div>
              <div className="pt-4 px-6 py-4 flex justify-end gap-3 bg-gray-50 border-t border-gray-200 shrink-0 z-10">
                <button type="button" onClick={() => setModalNewTicket(false)} className="px-5 py-2.5 text-[10px] font-bold bg-white border border-gray-300 text-gray-700 uppercase tracking-wider rounded-sm shadow-sm transition-colors hover:bg-gray-100">Cancel</button>
                <button type="submit" className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-6 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-sm shadow-sm transition-colors">Dispatch Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Interactive Ticket Control Room View w/ RCA Interlock */}
      {modalTicketDetail.isOpen && modalTicketDetail.data && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[650px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-[#415a77]" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            <div className="px-6 py-4 flex justify-between items-center text-white bg-[#415a77] shrink-0 z-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 opacity-80">Helpdesk Operator Panel</p>
                <h3 className="font-black text-sm uppercase tracking-wider text-white">Ticket Ref: {modalTicketDetail.data.id}</h3>
              </div>
              <button onClick={() => {
                setModalTicketDetail({ isOpen: false, data: null });
                setRcaForm({ rootCause: '', preventiveAction: '' });
              }} className="text-white opacity-70 hover:opacity-100 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <div className="p-0 flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto flex-1 custom-scrollbar z-0 p-6 space-y-6 text-sm text-gray-800">
                
                <div className="grid grid-cols-2 gap-4 border-b border-gray-200 pb-5">
                  <div>
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Reported By</p>
                    <p className="font-black text-gray-900 text-sm leading-tight">{modalTicketDetail.data.user}</p>
                    <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-wider">{modalTicketDetail.data.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">System Parameters</p>
                    <span className={`px-2.5 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                      modalTicketDetail.data.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                      modalTicketDetail.data.status === 'Open' ? 'bg-red-600 text-white border-red-700 animate-pulse' :
                      'bg-blue-100 text-blue-800 border-blue-300'
                    }`}>{modalTicketDetail.data.status}</span>
                    <p className={`text-[10px] font-black uppercase tracking-wider mt-2 ${modalTicketDetail.data.priority === 'High' ? 'text-red-600' : 'text-amber-600'}`}>{modalTicketDetail.data.priority} Priority</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-sm shadow-inner">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Diagnostic Subject</p>
                  <p className="font-black text-[#125ab2] text-base leading-tight mb-3 border-b border-gray-200 pb-3">{modalTicketDetail.data.subject}</p>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Initial Technical Log</p>
                  <p className="text-xs font-semibold text-gray-700 leading-relaxed italic border-l-2 border-gray-300 pl-2">"{modalTicketDetail.data.desc}"</p>
                </div>

                {/* ACTIVITY LEDGER / AUDIT TRAIL FEED */}
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 pb-1.5">Audit Trail & Communications Feed</p>
                  <div className="space-y-3 max-h-[180px] overflow-y-auto border border-gray-200 p-3 bg-white rounded-sm shadow-inner">
                    {modalTicketDetail.data.conversation.map((c, idx) => (
                      <div key={idx} className={`p-3 rounded-sm text-xs border shadow-sm ${
                        c.sender.includes('You') ? 'bg-blue-50 border-blue-100 ml-6' : 
                        c.sender.includes('System') ? 'bg-amber-50 border-amber-200 mx-3' : 
                        'bg-gray-50 border-gray-100 mr-6'
                      }`}>
                        <span className={`font-black text-[10px] uppercase tracking-wider block mb-1.5 border-b pb-1 ${
                          c.sender.includes('You') ? 'text-[#125ab2] border-blue-100' : 
                          c.sender.includes('System') ? 'text-amber-800 border-amber-200' : 
                          'text-gray-600 border-gray-200'
                        }`}>{c.sender}</span> 
                        <span className={`font-medium leading-relaxed whitespace-pre-wrap ${c.sender.includes('System') ? 'text-amber-900 font-bold' : 'text-gray-800'}`}>{c.text}</span>
                      </div>
                    ))}
                    {modalTicketDetail.data.conversation.length === 0 && <p className="text-gray-400 italic text-xs font-semibold text-center py-4">No entries in communication feed yet.</p>}
                  </div>
                </div>

                {/* SUNTIKAN FITUR: MANDATORY RCA FORM UNTUK RESOLUSI */}
                {modalTicketDetail.data.status !== 'Resolved' && (
                  <div className="bg-amber-50 border border-amber-200 p-5 rounded-sm shadow-inner mt-4">
                    <p className="text-[10px] font-black text-amber-800 uppercase tracking-wider mb-3 border-b border-amber-200 pb-2">Mandatory Closure Criteria (CAPA)</p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1.5">Root Cause Analysis (RCA) <span className="text-red-500">*</span></label>
                        <textarea 
                          value={rcaForm.rootCause} 
                          onChange={(e) => setRcaForm({...rcaForm, rootCause: e.target.value})} 
                          placeholder="Detail the fundamental reason for this failure..." 
                          className="w-full border border-amber-300 p-2.5 text-xs font-semibold rounded-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white resize-none" 
                          rows="2"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1.5">Preventive Action <span className="text-red-500">*</span></label>
                        <textarea 
                          value={rcaForm.preventiveAction} 
                          onChange={(e) => setRcaForm({...rcaForm, preventiveAction: e.target.value})} 
                          placeholder="Steps taken to ensure this does not happen again..." 
                          className="w-full border border-amber-300 p-2.5 text-xs font-semibold rounded-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white resize-none" 
                          rows="2"
                        />
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Chat Input Area (Fixed Bottom of Content) */}
              <div className="p-4 bg-white border-t border-gray-200 shrink-0">
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    value={chatInput} 
                    onChange={(e) => setChatInput(e.target.value)} 
                    placeholder="Type notes or message to IT Desk..." 
                    className="flex-1 border border-gray-300 p-2.5 text-xs font-bold rounded-sm outline-none focus:border-[#125ab2] focus:ring-1 focus:ring-[#125ab2] transition-all"
                    onKeyDown={(e) => { if(e.key === 'Enter') handleSendTicketReply(); }}
                    disabled={modalTicketDetail.data.status === 'Resolved'}
                  />
                  <button 
                    onClick={handleSendTicketReply} 
                    disabled={modalTicketDetail.data.status === 'Resolved'}
                    className={`text-[10px] font-black uppercase tracking-wider px-5 py-2.5 rounded-sm shadow-sm transition-colors ${modalTicketDetail.data.status === 'Resolved' ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#125ab2] hover:bg-[#0e4487] text-white'}`}
                  >
                    Reply
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center shrink-0 z-10">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden sm:block">Manager Controls</span>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button onClick={() => {
                    setModalTicketDetail({ isOpen: false, data: null });
                    setRcaForm({ rootCause: '', preventiveAction: '' });
                  }} className="flex-1 sm:flex-none px-5 py-2.5 text-[10px] font-bold bg-white border border-gray-300 text-gray-700 uppercase tracking-wider rounded-sm hover:bg-gray-100 transition-colors shadow-sm">Cancel</button>
                  {modalTicketDetail.data.status !== 'Resolved' && (
                    <button onClick={() => handleResolveTicket(modalTicketDetail.data.id)} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-sm shadow-sm transition-colors flex justify-center items-center gap-1.5">
                      <span>🔒</span> Verify RCA & Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: System Diagnostics Spinner */}
      {modalDiagnostic && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-sm w-[400px] shadow-2xl flex flex-col border-t-4 border-gray-900 p-8 text-center animate-fade-in">
            <div className="text-5xl mb-5 animate-spin">🎛️</div>
            <h3 className="font-black text-lg text-gray-900 mb-2 uppercase tracking-wide">Running Telemetry Diagnostics...</h3>
            <p className="text-xs text-gray-500 font-semibold mb-6 leading-relaxed">Pinging infrastructure endpoints, auditing database locks, and flushing DNS cache routes.</p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2 overflow-hidden">
              <div className="bg-[#125ab2] h-full rounded-full animate-[pulse_1s_ease-in-out_infinite] w-full origin-left"></div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 6: Microservice Node Inspector */}
      {modalService.isOpen && modalService.data && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[500px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-purple-700" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            <div className="px-6 py-4 flex justify-between items-center bg-gray-50 border-b border-gray-200 shrink-0 z-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-gray-500">Node Cluster Analyzer</p>
                <h3 className="font-black text-sm uppercase tracking-wider text-[#125ab2]">{modalService.data.name}</h3>
              </div>
              <button onClick={() => setModalService({ isOpen: false, data: null })} className="text-gray-400 hover:text-gray-800 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 space-y-5">
              
              <div className="grid grid-cols-2 gap-4 border-b border-gray-200 pb-5">
                <div>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Microservice Identifier</p>
                  <p className="font-mono font-black text-gray-900 bg-gray-100 border border-gray-300 px-2 py-0.5 rounded-sm inline-block">{modalService.data.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">30D Avg Uptime</p>
                  <p className="font-mono font-black text-emerald-600 text-lg leading-tight">{modalService.data.uptime}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex justify-between items-center">
                  <span>Live Telemetry Terminal Stream</span>
                  <span className={`px-2 py-0.5 rounded-sm border text-[9px] font-black uppercase tracking-wider shadow-sm ${modalService.data.status === 'Operational' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-red-600 text-white border-red-700 animate-pulse'}`}>
                    Status: {modalService.data.status}
                  </span>
                </p>
                <div className="w-full bg-gray-900 text-emerald-400 font-mono text-[11px] p-4 rounded-sm shadow-inner leading-relaxed overflow-x-auto whitespace-pre-wrap">
                  {`> INIT CONNECTION POOL... [OK]\n> FETCHING LOGS...\n[LOG] ${modalService.data.logs}\n> EXECUTING PING...\n[PING] Response latency verified at ${modalService.data.latency}.`}
                </div>
              </div>

            </div>

            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex flex-col sm:flex-row justify-end gap-3 shrink-0 z-10">
              <button onClick={() => setModalService({ isOpen: false, data: null })} className="w-full sm:w-auto px-5 py-2.5 text-[10px] font-bold bg-white border border-gray-300 text-gray-700 uppercase tracking-wider rounded-sm shadow-sm transition-colors hover:bg-gray-100">Cancel</button>
              <button onClick={() => handleRestartService(modalService.data.id)} className="w-full sm:w-auto bg-gray-800 hover:bg-black text-white px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-sm shadow-sm transition-colors flex items-center justify-center gap-2">
                <span>⚡</span> Reboot Service Node
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
};

export default SupportMenu;