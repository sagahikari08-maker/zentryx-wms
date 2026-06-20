import React, { useState, useEffect, useContext, useMemo } from 'react';
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

const DocumentCenter = () => {
  const { bahasa, halaman, setHalaman } = useContext(AppContext);
  
  // ─── FITUR BARU: AUTO-SWITCH TABS BERDASARKAN NAVBAR CLICK ───
  const [activeTab, setActiveTab] = useState(() => {
    if (halaman === 'doc_packing') return 'PACKING';
    if (halaman === 'doc_invoice') return 'INVOICE';
    if (halaman === 'doc_compliance') return 'COMPLIANCE';
    return 'BOL'; // Default jika doc_bol
  });

  useEffect(() => {
    if (halaman === 'doc_packing') setActiveTab('PACKING');
    else if (halaman === 'doc_bol') setActiveTab('BOL');
    else if (halaman === 'doc_invoice') setActiveTab('INVOICE');
    else if (halaman === 'doc_compliance') setActiveTab('COMPLIANCE');
  }, [halaman]);

  const handleTabClick = (tabName, routeName) => {
    setActiveTab(tabName);
    setHalaman(routeName); // Update status navbar agar sinkron
  };

  const [toasts, setToasts] = useState([]);
  
  // STATE MODALS
  const [signModal, setSignModal] = useState({ isOpen: false, data: null, driverName: '' });
  const [viewerModal, setViewerModal] = useState({ isOpen: false, data: null, type: '' });

  // 1. DATA COMPLIANCE (ARUS MOTORS LEGAL PERMITS)
  const [complianceDocs] = useState([
    { id: 'CMP-ISO-9001', type: 'ISO 9001:2015 Quality Management', relatedCategory: 'General Manufacturing', expiry: '12 Dec 2027', status: 'Valid' },
    { id: 'CMP-HAZ-044', type: 'Hazardous Material Transport Permit', relatedCategory: 'Hazmat / Chemicals', expiry: '01 Jan 2028', status: 'Valid' },
    { id: 'CMP-UN3480', type: 'UN3480 Lithium Ion Battery Transport Cert', relatedCategory: 'Energy Storage (LFP)', expiry: new Date().toISOString().split('T')[0], status: 'EXPIRED' }, // Dibuat expired untuk demo interlock
  ]);

  const lockedCategories = useMemo(() => {
    return complianceDocs.filter(d => d.status === 'EXPIRED').map(d => d.relatedCategory);
  }, [complianceDocs]);

  // 2. DATA PACKING SLIPS (EV OUTBOUND B2B)
  const [packingSlips, setPackingSlips] = useState([
    { 
      id: 'PS-ARS-8811', orderRef: 'ORD-B2B-5001', client: 'ARUS Dealership - South Jakarta', category: 'General Manufacturing', items: 45, status: 'Ready to Print',
      lineItems: [
        { sku: 'SKU-ARS-MCU03', name: 'Motor Control Unit (MCU) Gen 3', qty: 25, uom: 'Units' },
        { sku: 'SKU-ARS-SNT01', name: 'ADAS Telemetry Sensor Kit', qty: 20, uom: 'Sets' }
      ]
    },
    { 
      id: 'PS-ARS-8812', orderRef: 'ORD-RMA-5002', client: 'Aptiv Wiring Systems', category: 'General Manufacturing', items: 12, status: 'Ready to Print',
      lineItems: [
        { sku: 'SKU-ARS-CBL12', name: 'HV Harness Cable 50mm2 (RTV)', qty: 12, uom: 'Meters' }
      ]
    },
    { 
      id: 'PS-ARS-8813', orderRef: 'ORD-B2B-5003', client: 'Global Battery Recycling Co.', category: 'Energy Storage (LFP)', items: 8, status: 'Pending Generation',
      lineItems: [
        { sku: 'SKU-ARS-LFP01', name: 'Blade Battery Cell 3.2V (E-Waste)', qty: 8, uom: 'Pcs' }
      ]
    }, // Ini akan di-LOCK karena UN3480 expired
  ]);

  const [selectedSlips, setSelectedSlips] = useState([]);

  // 3. DATA BILL OF LADING (FREIGHT LOGISTICS)
  const [bolData, setBolData] = useState([
    { 
      id: 'BOL-ARS-99201', carrier: 'Siba Surya Logistics', destination: 'Assembly Hub Surabaya', pallets: 12, status: 'Pending Signature', date: new Date().toLocaleDateString('en-GB'), driver: 'Waiting...',
      vehiclePlate: 'L 9012 KJL', sealNumber: 'SEAL-77192A', totalWeight: '14,500 KG',
      cargoDetails: 'Mixed Heavy Components (Chassis & Castings). Secure load strictly.'
    },
    { 
      id: 'BOL-ARS-99202', carrier: 'Maersk Line (Export)', destination: 'Port of Singapore', pallets: 40, status: 'Signed & Dispatched', date: new Date(Date.now() - 86400000).toLocaleDateString('en-GB'), driver: 'Agus T.',
      vehiclePlate: 'B 1100 XXX (40ft Container)', sealNumber: 'MAEU-882110', totalWeight: '28,200 KG',
      cargoDetails: 'Export Grade Precision Sensors & Controllers. Ambient Temperature.'
    },
  ]);

  // 4. DATA COMMERCIAL INVOICES (B2B EV BILLING)
  const [invoices] = useState([
    { id: 'INV-ARS-26001', client: 'ARUS Dealership - South Jakarta', amount: 1450000000, term: 'Net 30', status: 'Awaiting Payment', dueDate: new Date(Date.now() + 2592000000).toLocaleDateString('en-GB') },
    { id: 'INV-ARS-26002', client: 'Global Battery Recycling Co.', amount: 45000000, term: 'COD', status: 'Paid', dueDate: new Date().toLocaleDateString('en-GB') },
  ]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // ─── MESIN CETAK HTML (PRINT ENGINE - INDUSTRIAL B2B FORMAT) ───
  const slipPrintStyles = `
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #111; background: #fff; line-height: 1.5; }
    .slip-container { max-width: 850px; margin: 0 auto; border: 2px solid #2c3e50; padding: 40px; box-sizing: border-box; }
    .header { display: flex; justify-content: space-between; border-bottom: 4px solid #125ab2; padding-bottom: 20px; margin-bottom: 30px; }
    .title { font-size: 32px; font-weight: 900; letter-spacing: 1px; color: #125ab2; text-transform: uppercase; }
    .sub-title { font-size: 13px; font-weight: bold; color: #475569; letter-spacing: 1px; margin-top: 5px; }
    .meta-grid { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 40px; }
    .meta-box { flex: 1; border: 1px solid #cbd5e1; padding: 20px; background: #f8fafc; border-top: 4px solid #334155; }
    .meta-label { font-size: 11px; font-weight: 900; color: #64748b; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; }
    .meta-val { font-size: 16px; font-weight: 700; color: #0f172a; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
    .table th, .table td { border: 1px solid #94a3b8; padding: 12px 15px; text-align: left; font-size: 14px; }
    .table th { background: #e2e8f0; font-weight: 900; text-transform: uppercase; font-size: 12px; color: #334155; }
    .table tbody tr:nth-child(even) { background: #f8fafc; }
    .barcode { font-family: 'Libre Barcode 39', cursive; font-size: 56px; line-height: 0.8; margin-top: 10px; color: #000; }
    .footer { text-align: center; font-size: 11px; color: #64748b; border-top: 2px dashed #cbd5e1; padding-top: 20px; font-weight: bold; letter-spacing: 0.5px; }
    .total-row { background: #1e293b; color: white; font-weight: 900; font-size: 18px; }
    .total-row td { border-color: #1e293b; }
  `;

  // HTML Generator untuk Packing Slip
  const buildSlipHTML = (doc) => {
    const itemsRows = doc.lineItems ? doc.lineItems.map(item => `
      <tr>
        <td style="font-family: monospace; font-weight: bold; color: #125ab2;">${item.sku}</td>
        <td style="font-weight: 600;">${item.name}</td>
        <td style="text-align: right; font-weight: 900; font-size: 16px;">${item.qty} <span style="font-size: 11px; color: #64748b; font-weight: normal;">${item.uom}</span></td>
      </tr>
    `).join('') : `<tr><td colspan="3" style="text-align: center; font-style: italic; color: #94a3b8;">Standard Fulfillment Item Matrix</td></tr>`;

    return `
      <div class="slip-container">
        <div class="header">
          <div>
            <div class="title">PACKING SLIP</div>
            <div class="sub-title">ARUS MOTORS GIGAFACTORY OPERATIONS</div>
          </div>
          <div style="text-align: right;">
            <div class="barcode">*${doc.id}*</div>
            <div style="font-weight: 900; font-size: 14px; margin-top: 5px; letter-spacing: 1px;">ID: ${doc.id}</div>
          </div>
        </div>
        
        <div class="meta-grid">
          <div class="meta-box">
            <div class="meta-label">Consignee / Destination</div>
            <div class="meta-val">${doc.client}</div>
            <div style="font-size: 13px; margin-top: 10px; font-weight: 600; color: #334155;">Reference PO/SO: <span style="color: #125ab2;">${doc.orderRef}</span></div>
          </div>
          <div class="meta-box border-top-blue">
            <div class="meta-label">Fulfillment Details</div>
            <div class="meta-val" style="font-size: 14px;">Commodity Class: <br/><strong>${doc.category}</strong></div>
            <div style="font-size: 12px; margin-top: 10px; color: #475569; font-weight: bold;">Date Printed: ${new Date().toLocaleString('en-GB')}</div>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th style="width: 25%;">Component SKU</th>
              <th>Technical Description</th>
              <th style="width: 20%; text-align: right;">Dispatched Qty</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>
        
        <div class="footer">
          DOCUMENT GENERATED BY ZENTRYX ERP PLATFORM • PACKING SLIP IS NOT A TAX INVOICE
        </div>
      </div>
    `;
  };

  // HTML Generator untuk Commercial Invoice
  const buildInvoiceHTML = (doc) => {
    return `
      <div class="slip-container">
        <div class="header">
          <div>
            <div class="title" style="color:#0f172a;">COMMERCIAL INVOICE</div>
            <div class="sub-title">ARUS MOTORS B2B BILLING CENTER</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 900; font-size: 28px; color: #125ab2; letter-spacing: 1px;">${doc.id}</div>
            <div style="font-size: 14px; margin-top: 8px; font-weight: 900; color: ${doc.status === 'Paid' ? '#16a34a' : '#dc2626'}; border: 2px solid currentColor; display: inline-block; padding: 4px 12px; border-radius: 4px;">STATUS: ${doc.status.toUpperCase()}</div>
          </div>
        </div>
        
        <div class="meta-grid">
          <div class="meta-box" style="border-top-color: #125ab2;">
            <div class="meta-label">Billed To (Entity)</div>
            <div class="meta-val">${doc.client}</div>
            <div style="margin-top: 15px; font-size: 12px; color: #64748b;">Tax ID / NPWP: 01.234.567.8-091.000</div>
          </div>
          <div class="meta-box" style="border-top-color: #dc2626;">
            <div class="meta-label">Payment Terms</div>
            <div class="meta-val">${doc.term}</div>
            <div style="font-size: 14px; margin-top: 10px; color:#dc2626; font-weight:900;">Due Date: ${doc.dueDate}</div>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Description of Goods / Services Rendered</th>
              <th style="width: 35%; text-align: right;">Amount (IDR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="font-weight: 600; padding:30px 15px; font-size: 15px;">EV Components Fulfillment & Logistics Services<br/><span style="font-size: 12px; font-weight: normal; color: #64748b; margin-top: 5px; display: block;">As per signed Delivery Orders for current billing cycle.</span></td>
              <td style="text-align: right; font-weight: 800; font-size: 18px; padding:30px 15px;">Rp ${doc.amount.toLocaleString('id-ID')}</td>
            </tr>
            <tr class="total-row">
              <td style="text-align: right; padding-right: 20px;">GRAND TOTAL DUE:</td>
              <td style="text-align: right;">Rp ${doc.amount.toLocaleString('id-ID')}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="footer">
          PLEASE REMIT PAYMENT TO: ARUS MOTORS CORP. BANK MANDIRI A/C: 123-456-7890<br/>
          THIS IS A DIGITALLY VERIFIED TAX INVOICE
        </div>
      </div>
    `;
  };

  const openPrintWindow = (htmlContent, title) => {
    const printWindow = window.open('', '_blank', 'width=900,height=800');
    const finalHTML = `
      <html>
        <head>
          <title>${title}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=Libre+Barcode+39&display=swap" rel="stylesheet">
          <style>
            ${slipPrintStyles}
            @media print { .page-break { page-break-after: always; border: none; padding: 0; } }
            @media screen { 
              body { background-color: #e2e8f0; }
              .page-break { padding: 40px; border-bottom: 5px dashed #94a3b8; background: #fff; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); } 
            }
          </style>
        </head>
        <body>
          ${htmlContent}
          <script>setTimeout(() => { window.print(); }, 800);</script>
        </body>
      </html>
    `;
    printWindow.document.write(finalHTML);
    printWindow.document.close();
  };

  // ─── FUNGSI BATCH & SINGLE PRINT ───
  const toggleSelectSlip = (id) => {
    setSelectedSlips(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleSelectAllPrintable = () => {
    const printableSlips = packingSlips.filter(doc => !lockedCategories.includes(doc.category)).map(doc => doc.id);
    if (selectedSlips.length === printableSlips.length && printableSlips.length > 0) {
      setSelectedSlips([]);
    } else {
      setSelectedSlips(printableSlips);
    }
  };

  const executeBatchPrint = () => {
    if (selectedSlips.length === 0) return;
    
    const slipsToPrint = packingSlips.filter(doc => selectedSlips.includes(doc.id));
    const allSlipsHTML = slipsToPrint.map(slip => `
      <div class="page-break">${buildSlipHTML(slip)}</div>
    `).join('');

    openPrintWindow(allSlipsHTML, 'Batch Print Packing Slips');
    
    addToast(`BATCH DISPATCH: Sending ${selectedSlips.length} documents to Print Server...`, 'success');
    setPackingSlips(packingSlips.map(slip => selectedSlips.includes(slip.id) ? { ...slip, status: 'Printed' } : slip));
    setSelectedSlips([]);
  };

  const executeSinglePrint = (docId) => {
    const slip = packingSlips.find(s => s.id === docId);
    if (!slip) return;

    const slipHTML = `<div class="page-break">${buildSlipHTML(slip)}</div>`;
    openPrintWindow(slipHTML, `Print Slip - ${slip.id}`);

    addToast(`Printing Packing Slip ${slip.id}...`, 'success');
    setPackingSlips(packingSlips.map(s => s.id === docId ? { ...s, status: 'Printed' } : s));
  };

  // Fungsi Eksekusi Invoice
  const handleDownloadInvoice = (doc) => {
    addToast(`Generating secured PDF Invoice for ${doc.client}...`, 'info');
    const invoiceHTML = `<div class="page-break">${buildInvoiceHTML(doc)}</div>`;
    openPrintWindow(invoiceHTML, `Invoice - ${doc.id}`);
  };


  // ─── FUNGSI E-SIGNATURE (DRIVER POD) ───
  const submitSignature = () => {
    if (!signModal.driverName.trim()) {
      addToast('Driver Name is mandatory to validate legal signature!', 'error');
      return;
    }
    setBolData(bolData.map(bol => 
      bol.id === signModal.data.id ? { ...bol, status: 'Signed & Dispatched', driver: signModal.driverName } : bol
    ));
    addToast(`DIGITAL HAND-SHAKE SUCCESS: BOL ${signModal.data.id} legally signed by ${signModal.driverName}. Responsibility transferred.`, 'success');
    setSignModal({ isOpen: false, data: null, driverName: '' });
  };

  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 animate-fade-in">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>📑 Documents</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Legal & Compliance</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide">
            {bahasa === 'en' ? 'Document Control Center' : 'Pusat Kendali Dokumen & Legal'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">Generate logistics paperwork, enforce legal compliances, and capture e-signatures.</p>
        </div>
        
        {/* TABS (SYNCED WITH NAVBAR) */}
        <div className="bg-gray-100 p-1 rounded-sm shadow-inner flex overflow-x-auto border border-gray-300 w-full md:w-auto">
          <button onClick={() => handleTabClick('BOL', 'doc_bol')} className={`px-4 py-2 text-xs font-bold uppercase transition-all rounded-sm whitespace-nowrap ${activeTab === 'BOL' ? 'bg-[#415a77] text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}>
            Bill of Lading
          </button>
          <button onClick={() => handleTabClick('PACKING', 'doc_packing')} className={`px-4 py-2 text-xs font-bold uppercase transition-all rounded-sm whitespace-nowrap ${activeTab === 'PACKING' ? 'bg-[#415a77] text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}>
            Packing Slips
          </button>
          <button onClick={() => handleTabClick('INVOICE', 'doc_invoice')} className={`px-4 py-2 text-xs font-bold uppercase transition-all rounded-sm whitespace-nowrap ${activeTab === 'INVOICE' ? 'bg-[#415a77] text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}>
            Commercial Invoices
          </button>
          <button onClick={() => handleTabClick('COMPLIANCE', 'doc_compliance')} className={`px-4 py-2 text-xs font-bold uppercase transition-all rounded-sm whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'COMPLIANCE' ? 'bg-red-700 text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}>
            Compliance Config {lockedCategories.length > 0 && <span className="bg-white text-red-700 px-1.5 rounded animate-pulse shadow-sm">!</span>}
          </button>
        </div>
      </div>

      {/* ── TAB 1: BILL OF LADING ── */}
      {activeTab === 'BOL' && (
        <div className="bg-white border border-gray-300 shadow-sm rounded-sm flex flex-col overflow-hidden">
          <div className="bg-slate-50 border-b border-gray-200 px-5 py-4 flex justify-between items-center">
            <h3 className="font-bold text-xs uppercase text-gray-700 tracking-wider">Carrier Bill of Lading (BOL)</h3>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
              <thead className="bg-[#f8f9fa] text-[#64748b] text-[10px] uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-5 border-b w-40">BOL Document</th>
                  <th className="py-3 px-5 border-b">Carrier & Destination</th>
                  <th className="py-3 px-5 border-b text-center w-36">Legal Status</th>
                  <th className="py-3 px-5 border-b text-center w-48">Driver Signature (POD)</th>
                </tr>
              </thead>
              <tbody className="text-[12px] text-gray-700">
                {bolData.map((doc, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-5">
                      <div 
                        onClick={() => setViewerModal({ isOpen: true, data: doc, type: 'BOL' })}
                        className="font-black font-mono text-[#125ab2] cursor-pointer hover:underline hover:text-[#0e4487] underline-offset-2 w-max text-[13px]"
                        title="View Full Document Details"
                      >
                        {doc.id}
                      </div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">{doc.date} | {doc.pallets} Pallets</div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="font-bold text-gray-900 text-[13px]">{doc.carrier}</div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">To: <span className="text-gray-700">{doc.destination}</span></div>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className={`px-2 py-1 rounded-sm text-[9px] font-black uppercase tracking-wider shadow-sm border ${
                        doc.status.includes('Signed') ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                      }`}>{doc.status}</span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      {doc.status.includes('Signed') ? (
                        <div className="text-[10px] font-black text-emerald-700 uppercase tracking-widest bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-sm inline-block">✓ Signed: {doc.driver}</div>
                      ) : (
                        <button 
                          onClick={() => setSignModal({ isOpen: true, data: doc, driverName: '' })} 
                          className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-4 py-2 rounded-sm text-[10px] font-bold transition-colors uppercase shadow-sm flex items-center justify-center gap-2 w-full tracking-wider"
                        >
                          <span>✍️</span> Capture E-Signature
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: PACKING SLIPS (DENGAN INTERLOCK HAZMAT) ── */}
      {activeTab === 'PACKING' && (
        <div className="bg-white border border-gray-300 shadow-sm rounded-sm flex flex-col overflow-hidden">
          
          <div className="bg-slate-50 border-b border-gray-200 px-5 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h3 className="font-bold text-xs uppercase text-gray-700 tracking-wider">Outbound Packing Slips</h3>
            {selectedSlips.length > 0 && (
              <div className="bg-[#125ab2] text-white px-4 py-1.5 rounded-sm flex items-center gap-4 animate-fade-in shadow-sm w-full sm:w-auto">
                <span className="text-[10px] font-bold uppercase">{selectedSlips.length} Selected</span>
                <button onClick={executeBatchPrint} className="bg-white text-[#125ab2] px-3 py-1.5 rounded text-[10px] font-black uppercase hover:bg-gray-100 shadow-sm transition-colors w-full sm:w-auto">
                  🖨️ Batch Print Selected
                </button>
              </div>
            )}
          </div>
          
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
              <thead className="bg-[#f8f9fa] text-[#64748b] text-[10px] uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-5 border-b w-12 text-center">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAllPrintable} 
                      className="cursor-pointer w-4 h-4 accent-[#125ab2]" 
                      title="Select all compliant documents"
                    />
                  </th>
                  <th className="py-3 px-5 font-bold border-b">Document ID</th>
                  <th className="py-3 px-5 font-bold border-b">Client & Order Ref</th>
                  <th className="py-3 px-5 font-bold border-b text-center">Compliance Check</th>
                  <th className="py-3 px-5 font-bold border-b text-center w-36">Print Status</th>
                  <th className="py-3 px-5 font-bold border-b text-center w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[12px] text-gray-700">
                {packingSlips.map((doc, i) => {
                  const isLocked = lockedCategories.includes(doc.category);
                  const isSelected = selectedSlips.includes(doc.id);
                  return (
                    <tr 
                      key={i} 
                      onClick={() => { if (!isLocked) toggleSelectSlip(doc.id) }}
                      className={`border-b border-gray-100 transition-colors ${
                        isLocked ? 'bg-red-50/40' : isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50 cursor-pointer'
                      }`}
                    >
                      <td className="py-4 px-5 text-center">
                        <input 
                          type="checkbox" 
                          checked={isSelected} 
                          onChange={(e) => { e.stopPropagation(); toggleSelectSlip(doc.id); }}
                          disabled={isLocked}
                          className={`w-4 h-4 accent-[#125ab2] ${isLocked ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                        />
                      </td>
                      <td className="py-4 px-5">
                        <div 
                          onClick={(e) => { e.stopPropagation(); if (!isLocked) setViewerModal({ isOpen: true, data: doc, type: 'PACKING' }); }}
                          className={`font-black font-mono uppercase tracking-wider w-max text-[13px] ${
                            isLocked 
                            ? 'text-gray-400 line-through cursor-not-allowed' 
                            : 'text-[#125ab2] cursor-pointer hover:underline hover:text-[#0e4487] underline-offset-2'
                          }`}
                          title={isLocked ? 'Document Locked due to Compliance' : 'View Document Details'}
                        >
                          {doc.id}
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className={`font-bold text-[13px] ${isLocked ? 'text-gray-500' : 'text-gray-900'}`}>{doc.client}</div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Ref: <span className="font-mono text-gray-700">{doc.orderRef}</span> | {doc.items} Units</div>
                      </td>
                      <td className="py-4 px-5 text-center">
                        <span className={`px-2 py-1 rounded-sm text-[9px] font-black uppercase tracking-wider border shadow-sm ${isLocked ? 'bg-red-100 text-red-800 border-red-300' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>
                          {doc.category}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-center">
                        {isLocked ? (
                          <div className="flex flex-col items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded-sm text-[9px] font-black uppercase bg-red-600 text-white shadow-sm flex items-center gap-1.5 tracking-wider border border-red-700">
                              <span>🔒</span> INTERLOCKED
                            </span>
                            <span className="text-[8px] text-red-600 font-bold uppercase tracking-widest">Missing Legal Cert</span>
                          </div>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-sm text-[9px] font-black uppercase tracking-wider border shadow-sm ${doc.status === 'Printed' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>
                            {doc.status}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-center">
                        <button 
                          disabled={isLocked}
                          onClick={(e) => { e.stopPropagation(); executeSinglePrint(doc.id); }} 
                          className={`w-full py-2 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors border ${
                            isLocked ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white hover:bg-gray-100 text-gray-800 border-gray-300 shadow-sm flex items-center justify-center gap-2'
                          }`}
                        >
                          {!isLocked && <span>🖨️</span>} Print
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: COMMERCIAL INVOICES ── */}
      {activeTab === 'INVOICE' && (
        <div className="bg-white border border-gray-300 shadow-sm rounded-sm flex flex-col overflow-hidden">
          <div className="bg-slate-50 border-b border-gray-200 px-5 py-4">
            <h3 className="font-bold text-xs uppercase text-gray-700 tracking-wider">Commercial Invoices (B2B Billing)</h3>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
              <thead className="bg-[#f8f9fa] text-[#64748b] text-[10px] uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-5 font-bold border-b w-40">Invoice Number</th>
                  <th className="py-3 px-5 font-bold border-b">Bill To (Entity)</th>
                  <th className="py-3 px-5 font-bold border-b text-right w-48">Amount (USD)</th>
                  <th className="py-3 px-5 font-bold border-b text-center w-36">Finance Status</th>
                  <th className="py-3 px-5 font-bold border-b text-center w-40">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[12px] text-gray-700">
                {invoices.map((doc, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-5 font-black text-[#125ab2] font-mono text-[13px]">{doc.id}</td>
                    <td className="py-4 px-5">
                      <div className="font-bold text-gray-900 text-[13px]">{doc.client}</div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Due Date: <span className={doc.status !== 'Paid' ? 'text-red-500' : 'text-gray-500'}>{doc.dueDate}</span></div>
                    </td>
                    <td className="py-4 px-5 text-right font-mono font-black text-emerald-700 text-sm">
                      ${doc.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className={`px-2.5 py-1 rounded-sm text-[9px] font-black uppercase tracking-wider border shadow-sm ${
                        doc.status === 'Paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-red-100 text-red-800 border-red-300'
                      }`}>{doc.status}</span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <button 
                        onClick={() => handleDownloadInvoice(doc)} 
                        className="w-full bg-gray-800 hover:bg-black text-white px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-2"
                      >
                        <span>⭳</span> Download PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: COMPLIANCE DOCS (DENGAN HAZMAT INTERLOCK INDICATOR) ── */}
      {activeTab === 'COMPLIANCE' && (
        <div className="bg-white border border-red-300 shadow-sm rounded-sm flex flex-col overflow-hidden">
          <div className="bg-red-700 border-b border-red-800 px-5 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="font-black text-sm uppercase text-white tracking-wider">Regulatory Compliance Interlock Engine</h3>
              <p className="text-[10px] text-red-200 mt-1 font-semibold leading-relaxed">Expired permits will automatically hard-lock outbound fulfillment and packing slip generation for the affected category to prevent legal penalties.</p>
            </div>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
              <thead className="bg-red-50 text-red-900 text-[10px] uppercase tracking-wider border-b border-red-200">
                <tr>
                  <th className="py-3 px-5 font-bold border-b w-72">Document Title / Type</th>
                  <th className="py-3 px-5 font-bold border-b">Protected Asset Class</th>
                  <th className="py-3 px-5 font-bold border-b text-center w-40">Valid Until</th>
                  <th className="py-3 px-5 font-bold border-b text-center w-36">System Status</th>
                </tr>
              </thead>
              <tbody className="text-[12px] text-gray-700">
                {complianceDocs.map((doc, i) => (
                  <tr key={i} className={`border-b border-gray-100 transition-colors ${doc.status === 'EXPIRED' ? 'bg-red-50/40 hover:bg-red-50' : 'hover:bg-slate-50'}`}>
                    <td className="py-4 px-5">
                      <div className="font-bold text-gray-900 text-[13px]">{doc.type}</div>
                      <div className="text-[10px] text-gray-500 font-mono mt-1 font-bold">{doc.id}</div>
                    </td>
                    <td className="py-4 px-5">
                      <span className="font-black text-gray-700 uppercase text-[10px] tracking-wider bg-white border border-gray-300 px-2 py-0.5 rounded shadow-sm">
                        {doc.relatedCategory}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center font-mono font-bold text-gray-800">{doc.expiry}</td>
                    <td className="py-4 px-5 text-center">
                      <span className={`px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-wider border shadow-sm block ${
                        doc.status === 'Valid' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-red-600 text-white border-red-700 animate-pulse'
                      }`}>
                        {doc.status}
                      </span>
                      {doc.status === 'EXPIRED' && <p className="text-[8px] font-bold text-red-600 uppercase mt-1.5 tracking-widest">Outbound Locked</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ DYNAMIC MODAL: DOCUMENT VIEWER (PACKING / BOL)                         */}
      {/* ========================================================================= */}
      {viewerModal.isOpen && viewerModal.data && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[650px] shadow-2xl overflow-hidden flex flex-col relative animate-fade-in border-t-4 border-t-[#415a77]" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            <div className="px-6 py-4 flex justify-between items-center text-white bg-[#415a77] shrink-0 z-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 opacity-80">Digital Manifest Viewer</p>
                <h3 className="font-black text-sm uppercase tracking-wider">
                  {viewerModal.type === 'PACKING' ? 'Outbound Packing Slip' : 'Carrier Bill of Lading'}
                </h3>
              </div>
              <button onClick={() => setViewerModal({ isOpen: false, data: null, type: '' })} className="text-white opacity-70 hover:opacity-100 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <div className="p-0 flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto flex-1 custom-scrollbar z-0">
                
                <div className="bg-gray-50 border-b border-gray-200 p-6 flex flex-col sm:flex-row justify-between gap-4">
                  {viewerModal.type === 'PACKING' ? (
                    <>
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Consignee / Client</p>
                        <p className="font-black text-gray-900 text-base leading-tight mb-1">{viewerModal.data.client}</p>
                        <p className="text-[10px] font-mono font-bold text-[#125ab2]">Ref: {viewerModal.data.orderRef}</p>
                      </div>
                      <div className="sm:text-right">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">System Status & Classification</p>
                        <p className="font-black text-gray-900 text-sm mb-1">{viewerModal.data.status}</p>
                        <span className="text-[9px] font-black text-gray-600 uppercase tracking-wider bg-white border border-gray-300 px-2 py-0.5 rounded shadow-sm inline-block">{viewerModal.data.category}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Carrier Details</p>
                        <p className="font-black text-gray-900 text-base leading-tight">{viewerModal.data.carrier}</p>
                        <p className="text-[10px] font-mono font-bold text-gray-600 bg-white border px-1.5 py-0.5 rounded inline-block w-max border-gray-300">Plat: {viewerModal.data.vehiclePlate}</p>
                        <p className="text-[10px] font-mono font-black text-[#125ab2] bg-blue-50 border px-1.5 py-0.5 rounded inline-block w-max border-blue-200 ml-1">Seal: {viewerModal.data.sealNumber}</p>
                      </div>
                      <div className="sm:text-right space-y-1 mt-3 sm:mt-0">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Routing Summary</p>
                        <p className="font-black text-gray-900 text-sm">Dest: {viewerModal.data.destination}</p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{viewerModal.data.pallets} Pallets | {viewerModal.data.totalWeight}</p>
                      </div>
                    </>
                  )}
                </div>

                {viewerModal.type === 'PACKING' && viewerModal.data.lineItems && (
                  <div className="p-6">
                    <p className="text-[10px] font-black text-[#125ab2] uppercase tracking-wider mb-3">Line Items Manifest ({viewerModal.data.items} Units Total)</p>
                    <table className="w-full text-left border border-gray-200 text-xs shadow-sm">
                      <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-[9px] tracking-wider">
                        <tr>
                          <th className="py-2.5 px-4 border-b">SKU / Component</th>
                          <th className="py-2.5 px-4 border-b">Item Description</th>
                          <th className="py-2.5 px-4 border-b text-right">Qty</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-800">
                        {viewerModal.data.lineItems.map((item, idx) => (
                          <tr key={idx} className="border-b border-gray-100 bg-white">
                            <td className="py-3 px-4 font-mono font-bold text-gray-600">{item.sku}</td>
                            <td className="py-3 px-4 font-bold">{item.name}</td>
                            <td className="py-3 px-4 text-right font-black text-sm">{item.qty} <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{item.uom}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {viewerModal.type === 'BOL' && (
                  <div className="p-6">
                    <p className="text-[10px] font-black text-[#125ab2] uppercase tracking-wider mb-2 border-b border-gray-200 pb-2">Handling & Routing Instructions</p>
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-sm text-xs text-gray-800 font-semibold leading-relaxed shadow-inner">
                      {viewerModal.data.cargoDetails}
                    </div>
                    <div className="mt-8 flex justify-between items-end border-t-2 border-dashed border-gray-300 pt-5">
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Proof of Delivery (POD)</p>
                        <p className={`text-sm font-black uppercase tracking-wider ${viewerModal.data.driver === 'Waiting...' ? 'text-amber-500 italic' : 'text-emerald-700'}`}>
                          Signature: {viewerModal.data.driver}
                        </p>
                      </div>
                      <div className="text-right opacity-40">
                        <div className="h-10 w-48 bg-[repeating-linear-gradient(90deg,#000,#000_2px,transparent_2px,transparent_5px,#000_5px,#000_6px,transparent_6px,transparent_10px)]"></div>
                        <p className="font-mono text-[9px] font-bold tracking-[0.2em] mt-1">{viewerModal.data.id}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 shrink-0 z-10">
                <button onClick={() => setViewerModal({ isOpen: false, data: null, type: '' })} className="px-5 py-2.5 bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm w-full sm:w-auto">
                  Close Document
                </button>
                {viewerModal.type === 'PACKING' && (
                  <button 
                    onClick={() => { executeSinglePrint(viewerModal.data.id); setViewerModal({ isOpen: false, data: null, type: '' }); }} 
                    className="px-6 py-2.5 bg-[#125ab2] hover:bg-[#0e4487] text-white rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    <span>🖨️</span> Send to Printer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ DYNAMIC MODAL: E-SIGNATURE PAD FOR DRIVERS                             */}
      {/* ========================================================================= */}
      {signModal.isOpen && signModal.data && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[500px] shadow-2xl overflow-hidden flex flex-col relative animate-fade-in border-4 border-gray-900" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            <div className="px-6 py-4 flex justify-between items-start text-white bg-gray-900 shrink-0 z-10">
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider text-emerald-400">Digital Hand-Shake (POD)</h3>
                <p className="text-[10px] font-mono font-bold opacity-80 mt-1">{signModal.data.id} - {signModal.data.carrier}</p>
              </div>
              <button onClick={() => setSignModal({ isOpen: false, data: null, driverName: '' })} className="text-gray-400 hover:text-white font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 flex flex-col gap-5">
              
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-sm shadow-inner">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Legal Liability Declaration</p>
                <p className="text-xs text-gray-800 font-medium italic leading-relaxed">
                  "I acknowledge receipt of <strong className="text-gray-900 font-black">{signModal.data.pallets} pallets</strong> in good condition. I assume legal responsibility and liability for the transport of these automotive goods to <strong className="text-gray-900 font-black">{signModal.data.destination}</strong>."
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-700 tracking-wider mb-1.5">Driver Name (Print) <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={signModal.driverName}
                  onChange={(e) => setSignModal({...signModal, driverName: e.target.value})}
                  placeholder="Enter driver's full legal name..."
                  className="w-full border border-gray-300 p-3 text-sm font-bold text-gray-900 rounded-sm outline-none focus:border-[#125ab2] focus:ring-1 focus:ring-[#125ab2] transition-all"
                  autoFocus
                />
              </div>

              <div>
                <div className="flex justify-between items-end mb-1.5">
                  <label className="block text-[10px] font-bold uppercase text-gray-700 tracking-wider">Touch / Stylus Signature Pad</label>
                  <button className="text-[9px] text-gray-400 font-bold uppercase hover:text-red-600 transition-colors tracking-widest">Clear Pad</button>
                </div>
                <div className="w-full h-48 border-2 border-dashed border-gray-300 bg-gray-50 rounded-sm flex items-center justify-center cursor-crosshair">
                  <p className="text-gray-300 text-2xl font-black rotate-[-10deg] opacity-50 tracking-widest">SIGN HERE</p>
                </div>
              </div>

            </div>

            <div className="bg-gray-100 border-t border-gray-300 px-6 py-4 shrink-0 z-10">
              <button onClick={submitSignature} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-sm text-xs font-black uppercase tracking-widest shadow-md transition-colors">
                Accept Liability & Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
};

export default DocumentCenter;