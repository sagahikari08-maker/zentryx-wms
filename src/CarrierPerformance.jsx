import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from './AppContext';

// ─── TOAST COMPONENT (Aman dari Bug Klik/Pointer Events) ─────────────────────
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
    {toasts.map(({ id, message, type }) => (
      <div key={id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-sm shadow-xl text-white text-xs font-semibold min-w-[280px] border-l-4 ${
        type === 'success' ? 'bg-emerald-600 border-emerald-800' : type === 'error' ? 'bg-red-600 border-red-800' : 'bg-[#125ab2] border-blue-800'
      }`}>
        <span className="text-base">{type === 'success' ? '✓' : type === 'error' ? '🚨' : 'ℹ'}</span>
        <span className="flex-1">{message}</span>
        <button onClick={() => removeToast(id)} className="opacity-70 hover:opacity-100 text-lg leading-none">×</button>
      </div>
    ))}
  </div>
);

const CarrierPerformance = () => {
  const { bahasa } = useContext(AppContext);

  // 1. DYNAMIC CONFIGURATION STATE (SLA CONFIGURATOR)
  const [slaTargets, setSlaTargets] = useState({ otif: 95.0, damage: 1.0 });

  // 2. DATA MASTER CARRIERS (ARUS MOTORS EV LOGISTICS)
  const initialCarriers = [
    { id: 'CAR-ARS-001', name: 'ARUS Internal Fleet', type: 'In-House', totalTrips: 450, onTime: 440, delayed: 8, damaged: 2, freightCost: 150000, suspended: false },
    { id: 'CAR-ARS-002', name: 'Maersk Global Logistics', type: '3PL Vendor', totalTrips: 320, onTime: 310, delayed: 9, damaged: 1, freightCost: 210000, suspended: false },
    { id: 'CAR-ARS-003', name: 'FedEx Heavy Freight', type: '3PL Vendor', totalTrips: 850, onTime: 780, delayed: 55, damaged: 15, freightCost: 340000, suspended: false },
    { id: 'CAR-ARS-004', name: 'CEVA Automotive Logistics', type: '3PL Vendor', totalTrips: 120, onTime: 115, delayed: 4, damaged: 1, freightCost: 95000, suspended: false },
    { id: 'CAR-ARS-005', name: 'DHL Supply Chain', type: '3PL Vendor', totalTrips: 210, onTime: 208, delayed: 2, damaged: 0, freightCost: 185000, suspended: false },
  ];

  const [carriers, setCarriers] = useState(() => {
    try {
      const saved = window.localStorage.getItem('carrierData_ARUS');
      return saved ? JSON.parse(saved) : initialCarriers;
    } catch {
      return initialCarriers;
    }
  });

  // SIMULASI DATA LEDGER DETIL KERUSAKAN (EV COMPONENTS)
  const [damageLedger] = useState({
    'CAR-ARS-001': [{ ref: 'SHP-2605-012', desc: 'Minor scratch on exterior body panel during offloading.' }, { ref: 'RCV-2606-002', desc: 'Coolant drum leaked due to forklift mishandling.' }],
    'CAR-ARS-002': [{ ref: 'SHP-2606-110', desc: 'Pallet tilted, 1 box of ADAS sensors crushed.' }],
    'CAR-ARS-003': [
      { ref: 'SHP-2604-090', desc: 'LFP Battery thermal limits exceeded (cooling unit failed).' },
      { ref: 'SHP-2605-221', desc: '10 MCU units dented by falling heavy chassis parts.' },
      { ref: 'RCV-2606-045', desc: 'Container seal broken, high-voltage cables exposed to rain.' }
    ],
    'CAR-ARS-004': [{ ref: 'SHP-2606-004', desc: 'Payload shifted during transit, minor abrasion to structural frames.' }],
    'CAR-ARS-005': []
  });

  // ─── ALGORITMA PEMBERSIH DATA LAMA (PIZZA) ───
  useEffect(() => {
    const hasOldData = carriers.some(car => car.name.includes('JNE') || car.id.includes('CAR-001'));
    if (hasOldData) setCarriers(initialCarriers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('carrierData_ARUS', JSON.stringify(carriers));
    } catch (error) {
      console.error('Failed to save carrier data:', error);
    }
  }, [carriers]);

  // 3. STATE INTERAKTIF MODAL & TOOLS
  const [searchTerm, setSearchTerm] = useState('');
  const [toasts, setToasts] = useState([]);
  
  // Modals Controller
  const [profileModal, setProfileModal] = useState({ isOpen: false, data: null });
  const [claimModal, setClaimModal] = useState({ isOpen: false, data: null });
  const [onboardModal, setOnboardModal] = useState(false);
  const [slaModal, setSlaModal] = useState(false);
  const [incidentModal, setIncidentModal] = useState({ isOpen: false, data: null });

  // Form States
  const [claimForm, setClaimForm] = useState({ amount: '', reason: '' });
  const [slaForm, setSlaForm] = useState({ otif: '95.0', damage: '1.0' });
  const [onboardForm, setOnboardForm] = useState({ name: '', type: '3PL Vendor', totalTrips: 10, onTime: 10, delayed: 0, damaged: 0, freightCost: 5000 });

  // 4. FUNGSI TOAST NOTIFIKASI
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // 5. ENGINE PERHITUNGAN KPI DENGAN THRESHOLD DINAMIS
  const processedCarriers = useMemo(() => {
    return carriers.map(car => {
      const otifRate = car.totalTrips > 0 ? ((car.onTime / car.totalTrips) * 100).toFixed(1) : 100;
      const damageRate = car.totalTrips > 0 ? ((car.damaged / car.totalTrips) * 100).toFixed(1) : 0;
      
      let status = 'Excellent';
      if (car.suspended) status = 'Suspended';
      else if (parseFloat(otifRate) < slaTargets.otif - 5 || parseFloat(damageRate) > slaTargets.damage * 2) status = 'Critical';
      else if (parseFloat(otifRate) < slaTargets.otif || parseFloat(damageRate) > slaTargets.damage) status = 'Warning';
      else if (parseFloat(otifRate) >= slaTargets.otif && parseFloat(otifRate) < slaTargets.otif + 3) status = 'Good';

      return { ...car, otifRate: parseFloat(otifRate), damageRate: parseFloat(damageRate), status };
    });
  }, [carriers, slaTargets]);

  const totalSpend = processedCarriers.reduce((sum, car) => sum + car.freightCost, 0);
  const avgOTIF = processedCarriers.length > 0 ? (processedCarriers.reduce((sum, car) => sum + car.otifRate, 0) / processedCarriers.length).toFixed(1) : 0;
  const activeVendorsCount = processedCarriers.filter(c => c.status !== 'Suspended').length;
  const criticalSlaCount = processedCarriers.filter(c => c.status === 'Critical').length;

  // 6. ACTION OPERASIONAL NYATA
  const handleOnboardCarrier = (e) => {
    e.preventDefault();
    if (!onboardForm.name.trim()) {
      addToast('Carrier Corporate Name is required.', 'error'); return;
    }
    const nextNum = carriers.length > 0 ? Math.max(...carriers.map(c => parseInt(c.id.split('-')[2]) || 0)) + 1 : 1;
    const newId = `CAR-ARS-${nextNum.toString().padStart(3, '0')}`;
    
    const newCarrier = {
      id: newId,
      name: onboardForm.name,
      type: onboardForm.type,
      totalTrips: Number(onboardForm.totalTrips),
      onTime: Number(onboardForm.onTime),
      delayed: Number(onboardForm.delayed),
      damaged: Number(onboardForm.damaged),
      freightCost: Number(onboardForm.freightCost),
      suspended: false
    };

    setCarriers([...carriers, newCarrier]);
    setOnboardModal(false);
    setOnboardForm({ name: '', type: '3PL Vendor', totalTrips: 10, onTime: 10, delayed: 0, damaged: 0, freightCost: 5000 });
    addToast(`Vendor ${newCarrier.name} successfully onboarded into system.`, 'success');
  };

  const handleToggleSuspend = (id, name, isCurrentlySuspended) => {
    setCarriers(carriers.map(c => c.id === id ? { ...c, suspended: !c.suspended } : c));
    setProfileModal({ isOpen: false, data: null });
    
    if (!isCurrentlySuspended) {
      addToast(`SLA SANCTION: Allocation frozen for ${name}. Logistics team blocked from selecting this fleet.`, 'error');
    } else {
      addToast(`SLA RESTORED: Volume allocation re-activated for ${name}.`, 'success');
    }
  };

  const handleSaveSlaConfig = (e) => {
    e.preventDefault();
    setSlaTargets({ otif: parseFloat(slaForm.otif), damage: parseFloat(slaForm.damage) });
    setSlaModal(false);
    addToast(`Global SLA parameters updated. System audit re-graded automatically.`, 'info');
  };

  const openClaimModal = (data) => {
    // Automated Penalty Assessor (5% of freight cost for critical violation)
    const suggestedPenalty = (data.freightCost * 0.05).toFixed(2);
    setClaimForm({ amount: suggestedPenalty, reason: `Automatic SLA penalty due to Critical Status. Damage Rate: ${data.damageRate}%, OTIF: ${data.otifRate}%` });
    setClaimModal({ isOpen: true, data });
    setProfileModal({ isOpen: false, data: null });
  };

  const handleSubmitClaim = (e) => {
    e.preventDefault();
    addToast(`Penalty Claim of $${Number(claimForm.amount).toLocaleString('en-US')} filed against ${claimModal.data.name} to Finance.`, 'success');
    setClaimModal({ isOpen: false, data: null });
    setClaimForm({ amount: '', reason: '' });
  };

  // 7. EXPORT DATA (CSV)
  const handleExportCSV = () => {
    addToast('Exporting Carrier Matrix...', 'info');
    const headers = ['Carrier ID', 'Carrier Name', 'Type', 'Total Trips', 'OTIF Rate (%)', 'Damage Rate (%)', 'Freight Spend (USD)', 'Performance Status'];
    const csvRows = [headers.join(',')];
    processedCarriers.forEach(c => {
      csvRows.push([c.id, `"${c.name}"`, c.type, c.totalTrips, c.otifRate, c.damageRate, c.freightCost.toFixed(2), c.status].join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `ARUS_Carrier_Performance_Matrix.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => addToast('Matrix exported successfully!', 'success'), 500);
  };

  // 8. PRINT OFFICIAL PRINT WINDOW UNTUK DI-SAVE SEBAGAI PDF
  const handleDownloadQBR = (car) => {
    addToast(`Preparing Formal QBR Document for ${car.name}...`, 'info');
    const printWindow = window.open('', '', 'width=850,height=900');
    
    const htmlContent = `
      <html>
        <head>
          <title>QBR Report - ${car.name}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #333; padding: 40px; }
            .header { border-bottom: 3px solid #125ab2; padding-bottom: 15px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
            .logo { font-size: 26px; font-weight: bold; color: #125ab2; }
            h1 { font-size: 20px; color: #2c3e50; margin: 0; text-transform: uppercase; }
            .meta-box { background: #f4f7f9; border: 1px solid #e2e8f0; padding: 15px; margin-bottom: 30px; border-radius: 4px; }
            .meta-box p { margin: 5px 0; font-size: 14px; }
            h2 { font-size: 14px; color: #125ab2; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 30px; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; font-size: 13px; }
            th { background-color: #f8fafc; color: #475569; width: 40%; }
            .status-badge { font-weight: bold; padding: 6px 12px; border-radius: 4px; display: inline-block; font-size: 13px; text-transform: uppercase; }
            .status-excellent { background-color: #dcfce7; color: #065f46; }
            .status-good { background-color: #e0f2fe; color: #075985; }
            .status-warning { background-color: #fef9c3; color: #92400e; }
            .status-critical { background-color: #fee2e2; color: #991b1b; }
            .status-suspended { background-color: #f1f5f9; color: #334155; border: 1px dashed #64748b; }
            .highlight { font-size: 16px; font-weight: bold; color: #0f172a; }
            .note-box { border-left: 4px solid #125ab2; background: #f8fafc; padding: 15px; font-style: italic; font-size: 13px; margin-top: 15px; }
            .signatures { display: flex; justify-content: space-between; margin-top: 60px; }
            .sign-box { width: 40%; text-align: center; font-size: 13px; }
            .sign-line { border-bottom: 1px solid #000; margin-top: 65px; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">ARUS MOTORS</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 3px;">Enterprise Logistics Network</div>
            </div>
            <h1>Quarterly Business Review</h1>
          </div>

          <div class="meta-box">
            <p><strong>Carrier Partner:</strong> ${car.name.toUpperCase()}</p>
            <p><strong>Vendor ID:</strong> ${car.id} | <strong>Fleet Class:</strong> ${car.type}</p>
            <p><strong>Audit Target Parameters:</strong> Min OTIF: ${slaTargets.otif}% | Max Damages: ${slaTargets.damage}%</p>
            <p><strong>Evaluation Generated:</strong> ${new Date().toLocaleDateString('en-US')}</p>
          </div>

          <h2>1. Logistics Volume & Cost Metrics</h2>
          <table>
            <tr><th>Total Dispatched Trips</th><td>${car.totalTrips} Allocated Routes</td></tr>
            <tr><th>Total Freight Investment</th><td class="highlight">$${car.freightCost.toLocaleString('en-US', {minimumFractionDigits: 2})}</td></tr>
            <tr><th>Average Financial Cost Per Trip</th><td>$${(car.freightCost / car.totalTrips).toLocaleString('en-US', {maximumFractionDigits:2})}</td></tr>
          </table>

          <h2>2. Service Level Agreement (SLA) Matrix</h2>
          <table>
            <tr><th>On-Time Deliveries</th><td>${car.onTime} Shipments</td></tr>
            <tr><th>Delayed Shipments</th><td>${car.delayed} Shipments</td></tr>
            <tr><th>Damaged / Claimed Incidents</th><td>${car.damaged} Cases</td></tr>
            <tr><th>OTIF Score Achievement</th><td class="highlight">${car.otifRate}% <span style="font-weight:normal; font-size:11px; color:#64748b">(SLA Target: >${slaTargets.otif}%)</span></td></tr>
            <tr><th>Cargo Damage Score Rate</th><td class="highlight">${car.damageRate}% <span style="font-weight:normal; font-size:11px; color:#64748b">(SLA Threshold: <${slaTargets.damage}%)</span></td></tr>
          </table>

          <h2>3. Operational Decision Summary</h2>
          <div style="margin-top: 10px;">
            <span class="status-badge status-${car.status.toLowerCase()}">SLA SYSTEM GRADING: ${car.status}</span>
          </div>
          <div class="note-box">
            <strong>Actionable Recommendation:</strong><br/>
            ${car.status === 'Excellent' ? 'Maintain active priority volume allocation. Strategic asset.' : 
              car.status === 'Good' ? 'Performance meets default contract requirements.' :
              car.status === 'Warning' ? 'Requires formal correction action plan from vendor management.' :
              car.status === 'Suspended' ? 'CRITICAL SANCTION: Allocation currently frozen due to systemic SLA failure or management decision.' :
              'URGENT CRITICAL WARNING: Immediate volume deduction. Initiation of financial indemnity and claims process.'}
          </div>

          <div class="signatures">
            <div class="sign-box"><p>Authorized By,</p><div class="sign-line"></div><p><strong>Chief Logistics Officer</strong><br/>ARUS Motors</p></div>
            <div class="sign-box"><p>Acknowledged By,</p><div class="sign-line"></div><p><strong>Vendor Account Manager</strong><br/>${car.name}</p></div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const filteredData = processedCarriers.filter(car => 
    car.name.toLowerCase().includes(searchTerm.toLowerCase()) || car.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 animate-fade-in">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>📊 Analytics</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Logistics Performance</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide">
            {bahasa === 'en' ? 'Carrier Performance & SLA Audits' : 'Performa Ekspedisi & Audit SLA'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">Enforce logistics standard operations, freeze poor-performing fleets, and manage claims.</p>
        </div>
        
        {/* OPERATIONAL BUTTONS HUB */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button onClick={() => setSlaModal(true)} className="bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-sm text-xs font-bold uppercase hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-1.5">
            <span>⚙️</span> SLA Bounds
          </button>
          <button onClick={() => setOnboardModal(true)} className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-5 py-2.5 rounded-sm text-xs font-bold uppercase shadow-sm transition-colors flex items-center gap-1.5">
            <span>+</span> Onboard Vendor
          </button>
          <button onClick={handleExportCSV} className="bg-gray-800 hover:bg-black text-white px-5 py-2.5 rounded-sm text-xs font-bold uppercase shadow-sm transition-colors flex items-center gap-1.5">
            <span>⭳</span> Export Data
          </button>
        </div>
      </div>

      {/* ── METRICS DASHBOARD (USD SCALE) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
        <div className="bg-[#125ab2] p-5 rounded-sm text-white relative overflow-hidden shadow-sm">
          <p className="text-[10px] uppercase font-bold text-blue-200 tracking-wider mb-1">Global Freight Spend</p>
          <p className="text-3xl font-black mt-1 font-mono">${(totalSpend).toLocaleString('en-US')}</p>
          <p className="text-[9px] text-blue-200 mt-2 font-semibold uppercase tracking-wider">Accumulated across {carriers.length} vendors</p>
        </div>
        
        <div className="bg-white p-5 border border-gray-200 shadow-sm rounded-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1">Avg. Global OTIF</p>
          <div className="flex items-end gap-2 mt-1">
            <p className={`text-4xl font-black ${avgOTIF >= slaTargets.otif ? 'text-emerald-600' : 'text-amber-500'}`}>{avgOTIF}%</p>
          </div>
          <span className="text-[10px] font-bold text-gray-400 mt-2 block border-t border-gray-100 pt-2">Target Min: &gt;{slaTargets.otif}%</span>
        </div>

        <div className="bg-white p-5 border-l-4 border-l-emerald-500 border border-gray-200 shadow-sm rounded-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider mb-1">Active Fleets In Routing</p>
          <p className="text-3xl font-black text-gray-800 mt-1">{activeVendorsCount} <span className="text-sm font-bold text-gray-400 uppercase">Fleets</span></p>
          <p className="text-[9px] text-gray-500 mt-3 pt-2 border-t border-gray-100 font-bold uppercase tracking-wider">{carriers.filter(c => c.suspended).length} Suspended by Mgt</p>
        </div>

        <div className="bg-white p-5 border-l-4 border-l-red-600 border border-gray-200 shadow-sm rounded-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-red-600 tracking-wider mb-1">SLA Default Breach</p>
          <div className="flex items-end gap-2 mt-1">
            <p className="text-3xl font-black text-red-700">{criticalSlaCount} <span className="text-sm font-bold text-gray-400 uppercase">Vendors</span></p>
            {criticalSlaCount > 0 && <span className="text-xl animate-pulse pb-1">🚨</span>}
          </div>
          <p className="text-[9px] text-gray-400 mt-3 pt-2 border-t border-gray-100 uppercase font-bold tracking-wider">Below standard bounds</p>
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="bg-white p-3 border border-gray-300 shadow-sm rounded-sm mb-4 flex justify-end">
        <input 
          type="text" 
          placeholder="Search Carrier Corporate Name or Vendor ID..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 px-4 py-1.5 rounded-sm text-xs font-semibold outline-none focus:border-[#125ab2] w-full sm:w-80 transition-colors"
        />
      </div>

      {/* ── TABEL MATRIX PERFORMA VENDOR ── */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
        <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex items-center gap-3 text-sm text-[#125ab2]">
          <span className="text-lg leading-none">ℹ️</span>
          <p className="font-semibold text-xs">
            {bahasa === 'en' ? 'Click Vendor Name to manage sanctions, or click Damage Rate to view incident ledger.' : 'Klik Nama Vendor untuk manajemen sanksi, atau klik Tingkat Kerusakan untuk melihat log insiden.'}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-[#e5e5e5] text-[#666666] text-[10px] uppercase tracking-wider border-b border-gray-300">
                <th className="py-3 px-4 font-bold border-b w-64">VENDOR / VEHICLE FLEET</th>
                <th className="py-3 px-4 font-bold border-b text-center w-28">TOTAL TRIPS</th>
                <th className="py-3 px-4 font-bold border-b text-center w-36">OTIF ACHIEVEMENT</th>
                <th className="py-3 px-4 font-bold border-b text-center w-36">CARGO DAMAGE %</th>
                <th className="py-3 px-4 font-bold border-b text-right w-40">FREIGHT SPEND (USD)</th>
                <th className="py-3 px-4 font-bold border-b text-center w-32">SLA STATUS</th>
                <th className="py-3 px-4 font-bold border-b text-center w-32">DOCUMENT</th>
              </tr>
            </thead>
            <tbody className="text-[12px] text-gray-700">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-400 font-bold italic">
                    <span className="text-3xl block mb-2 opacity-50">📭</span>
                    No registered carriers found matching your query.
                  </td>
                </tr>
              ) : (
                filteredData.map((car, idx) => (
                  <tr key={idx} className={`border-b border-gray-100 transition-colors ${car.status === 'Critical' ? 'bg-red-50/50 hover:bg-red-50' : car.status === 'Suspended' ? 'bg-slate-100 opacity-60' : 'hover:bg-blue-50'}`}>
                    <td className="py-3 px-4">
                      <div 
                        className="font-bold text-[13px] text-[#125ab2] cursor-pointer hover:underline flex items-center gap-1.5"
                        onClick={() => setProfileModal({ isOpen: true, data: car })}
                        title="Manage Vendor Profile & Sanctions"
                      >
                        <span className="text-base">🏢</span> {car.name}
                      </div>
                      <div className="text-[9px] text-gray-500 font-mono mt-1 font-bold uppercase tracking-wider bg-white border border-gray-200 px-1.5 py-0.5 rounded w-max">
                        {car.id} | {car.type}
                      </div>
                    </td>
                    
                    <td className="py-3 px-4 text-center font-black text-gray-800">{car.totalTrips}</td>
                    
                    <td className="py-3 px-4 text-center">
                      <div className={`font-black text-sm ${car.otifRate >= slaTargets.otif ? 'text-emerald-600' : car.otifRate >= slaTargets.otif - 5 ? 'text-amber-500' : 'text-red-600'}`}>
                        {car.otifRate}%
                      </div>
                    </td>
                    
                    <td className="py-3 px-4 text-center">
                      <div 
                        className={`font-black underline cursor-pointer text-sm ${car.damaged > 0 ? 'text-red-600 hover:text-red-800' : 'text-gray-600 hover:text-gray-900'}`}
                        onClick={() => car.damaged > 0 && setIncidentModal({ isOpen: true, data: car })}
                        title={car.damaged > 0 ? "View Damage Incident Ledger" : "No damages reported"}
                      >
                        {car.damageRate}%
                      </div>
                      <div className="text-[9px] text-gray-400 uppercase mt-0.5 font-bold">({car.damaged} cases)</div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-[#125ab2] font-black">
                      ${car.freightCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider border ${
                        car.status === 'Excellent' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                        car.status === 'Good' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        car.status === 'Warning' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                        car.status === 'Suspended' ? 'bg-gray-800 text-white border-black' :
                        'bg-red-600 text-white border-red-700 shadow-sm'
                      }`}>
                        {car.status}
                      </span>
                    </td>
                    
                    <td className="py-3 px-4 text-center">
                      <button 
                        onClick={() => handleDownloadQBR(car)} 
                        className="bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 px-3 py-1.5 rounded-sm font-bold text-[9px] uppercase tracking-wider shadow-sm w-full transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>🖨️</span> QBR PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🛡️ MODAL 1: GLOBAL SLA CONFIGURATOR (BULLETPROOF FLEXBOX)                 */}
      {/* ========================================================================= */}
      {slaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[450px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-gray-800" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            <div className="bg-gray-50 border-b border-gray-200 text-gray-800 px-6 py-4 flex justify-between items-center shrink-0 z-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-gray-500">System Parameters</p>
                <h3 className="font-black text-sm uppercase tracking-wider">Global SLA Targets</h3>
              </div>
              <button onClick={() => setSlaModal(false)} className="text-gray-400 hover:text-gray-800 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <form onSubmit={handleSaveSlaConfig} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 flex flex-col gap-5">
                <div className="bg-blue-50 border border-blue-200 text-blue-800 text-[10px] p-3 rounded-sm flex items-start gap-3">
                  <span className="text-xl leading-none">💡</span>
                  <div className="leading-tight">
                    <strong className="text-[#125ab2]">Automated Auditing:</strong> Semua metrik performa vendor akan dievaluasi ulang secara real-time berdasarkan dua parameter ini. Vendor yang tidak memenuhi batas akan otomatis masuk status <strong>Warning</strong> atau <strong>Critical</strong>.
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Minimum Acceptable OTIF (%) <span className="text-red-500">*</span></label>
                  <input type="number" step="0.1" max="100" value={slaForm.otif} onChange={e => setSlaForm({...slaForm, otif: e.target.value})} className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] font-black text-lg text-[#125ab2] rounded-sm" required/>
                  <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">On-Time In-Full Delivery Target</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Maximum Damage Allowance (%) <span className="text-red-500">*</span></label>
                  <input type="number" step="0.1" value={slaForm.damage} onChange={e => setSlaForm({...slaForm, damage: e.target.value})} className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-red-500 font-black text-lg text-red-600 rounded-sm" required/>
                  <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Tolerance limit for cargo damages</p>
                </div>
              </div>
              
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 shrink-0 z-10">
                <button type="button" onClick={() => setSlaModal(false)} className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm rounded-sm">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-gray-800 hover:bg-black text-white text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors rounded-sm">Recalculate Bounds</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ MODAL 2: ONBOARD CARRIER VENDOR BARU (BULLETPROOF FLEXBOX)             */}
      {/* ========================================================================= */}
      {onboardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[550px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-[#125ab2]" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            <div className="bg-blue-50 text-gray-800 px-6 py-4 flex justify-between items-center border-b border-blue-100 shrink-0 z-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-gray-500">Logistics Network</p>
                <h3 className="font-black text-sm uppercase tracking-wider text-[#125ab2]">Onboard New 3PL / Carrier</h3>
              </div>
              <button onClick={() => setOnboardModal(false)} className="text-gray-400 hover:text-gray-800 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <form onSubmit={handleOnboardCarrier} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 text-sm flex flex-col gap-4">
                
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Carrier Corporate Name <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="e.g. UPS Global Automotive" value={onboardForm.name} onChange={e => setOnboardForm({...onboardForm, name: e.target.value})} className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] font-bold text-gray-800 rounded-sm transition-colors" required/>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Fleet Classification <span className="text-red-500">*</span></label>
                    <select value={onboardForm.type} onChange={e => setOnboardForm({...onboardForm, type: e.target.value})} className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] font-semibold text-gray-700 bg-white rounded-sm">
                      <option>3PL Vendor</option>
                      <option>In-House Dedicated</option>
                      <option>Contract Dedicated</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Historical Freight Spend ($) <span className="text-red-500">*</span></label>
                    <input type="number" min="0" value={onboardForm.freightCost} onChange={e => setOnboardForm({...onboardForm, freightCost: e.target.value})} className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] font-mono font-bold text-[#125ab2] rounded-sm" required/>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 border border-gray-200 rounded-sm mt-2">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Historical Performance Data Setup</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Trips</label>
                      <input type="number" min="1" value={onboardForm.totalTrips} onChange={e => setOnboardForm({...onboardForm, totalTrips: e.target.value})} className="w-full border border-gray-300 p-2 text-center font-black rounded-sm" required/>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">On-Time</label>
                      <input type="number" min="0" value={onboardForm.onTime} onChange={e => setOnboardForm({...onboardForm, onTime: e.target.value})} className="w-full border border-green-200 p-2 text-center font-black text-emerald-700 bg-green-50 focus:border-green-400 outline-none rounded-sm" required/>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Damaged</label>
                      <input type="number" min="0" value={onboardForm.damaged} onChange={e => setOnboardForm({...onboardForm, damaged: e.target.value})} className="w-full border border-red-200 p-2 text-center font-black text-red-600 bg-red-50 focus:border-red-400 outline-none rounded-sm" required/>
                    </div>
                  </div>
                  <p className="text-[9px] text-gray-400 font-bold mt-2 uppercase tracking-wider">*Note: The delayed counter will be automatically derived.</p>
                </div>
              </div>
              
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 shrink-0 z-10">
                <button type="button" onClick={() => setOnboardModal(false)} className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm rounded-sm">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-[#125ab2] hover:bg-[#0e4487] text-white text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors rounded-sm">Authorize & Onboard</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ MODAL 3: PROFILE MANAGEMENT & OPERATIONAL TOGGLE FREEZE                */}
      {/* ========================================================================= */}
      {profileModal.isOpen && profileModal.data && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[500px] shadow-2xl flex flex-col relative animate-fade-in" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            <div className={`px-6 py-4 flex justify-between items-center text-white shrink-0 z-10 ${profileModal.data.suspended ? 'bg-gray-800' : 'bg-[#125ab2]'}`}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 opacity-80">Carrier Management Profile</p>
                <h3 className="font-black text-lg tracking-wide leading-tight">{profileModal.data.name}</h3>
                <p className="text-[10px] font-mono opacity-90 mt-0.5 bg-white/20 inline-block px-1.5 py-0.5 rounded">ID: {profileModal.data.id}</p>
              </div>
              <button onClick={() => setProfileModal({ isOpen: false, data: null })} className="text-white opacity-70 hover:opacity-100 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 space-y-5">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 border border-gray-200 p-3 rounded-sm">
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Total Trips Managed</p>
                  <p className="font-black text-gray-800 text-base">{profileModal.data.totalTrips} <span className="text-xs font-bold text-gray-400 uppercase">Routes</span></p>
                </div>
                <div className="bg-gray-50 border border-gray-200 p-3 rounded-sm">
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">On-Time Drops</p>
                  <p className="font-black text-emerald-600 text-base">{profileModal.data.onTime} <span className="text-xs font-bold text-gray-400 uppercase">Success</span></p>
                </div>
                <div className="bg-gray-50 border border-gray-200 p-3 rounded-sm">
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Delayed Counts</p>
                  <p className="font-black text-amber-600 text-base">{profileModal.data.delayed} <span className="text-xs font-bold text-gray-400 uppercase">Instances</span></p>
                </div>
                <div className="bg-red-50 border border-red-200 p-3 rounded-sm">
                  <p className="text-[9px] font-bold text-red-600 uppercase tracking-wider mb-1">Damages Incurred</p>
                  <p className="font-black text-red-700 text-base">{profileModal.data.damaged} <span className="text-xs font-bold text-red-400 uppercase">Packages</span></p>
                </div>
              </div>

              {profileModal.data.status === 'Critical' && !profileModal.data.suspended && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-sm flex items-start gap-3">
                  <span className="text-2xl animate-pulse">🚨</span>
                  <div>
                    <p className="text-[10px] font-black text-red-700 uppercase tracking-wider mb-1">Critical SLA Breach Detected</p>
                    <p className="text-xs text-red-600 font-semibold leading-relaxed">This vendor has fallen below acceptable parameters. You are authorized to issue a financial penalty claim.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between gap-3 shrink-0 z-10">
              <button 
                onClick={() => handleToggleSuspend(profileModal.data.id, profileModal.data.name, profileModal.data.suspended)}
                className={`flex-1 py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm ${profileModal.data.suspended ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-gray-800 hover:bg-black text-white'}`}
              >
                {profileModal.data.suspended ? '✓ Activate Allocation' : '⛔ Freeze Operations'}
              </button>
              
              {profileModal.data.status === 'Critical' && (
                <button 
                  onClick={() => openClaimModal(profileModal.data)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors"
                >
                  ⚠ Issue Claim Penalty
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ MODAL 4: DETIL DRILL-DOWN KERUSAKAN BARANG (LEDGER PROOF)              */}
      {/* ========================================================================= */}
      {incidentModal.isOpen && incidentModal.data && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[500px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-red-600" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            <div className="bg-red-50 px-6 py-4 flex justify-between items-center border-b border-red-100 shrink-0 z-10">
              <div>
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-0.5">Damage Audit Trail</p>
                <h3 className="font-black text-base text-red-800 leading-tight">{incidentModal.data.name}</h3>
              </div>
              <button onClick={() => setIncidentModal({ isOpen: false, data: null })} className="text-red-300 hover:text-red-800 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 space-y-3">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 pb-2 mb-2">Logged Manifest Failures</p>
              {damageLedger[incidentModal.data.id]?.map((log, i) => (
                <div key={i} className="bg-white border border-red-200 p-3 rounded-sm flex flex-col gap-1.5 shadow-sm border-l-4 border-l-red-500">
                  <span className="font-mono text-[11px] font-black text-[#125ab2] bg-blue-50 w-max px-1.5 py-0.5 rounded">{log.ref}</span>
                  <p className="text-xs text-gray-800 font-medium">"{log.desc}"</p>
                </div>
              ))}
              {(!damageLedger[incidentModal.data.id] || damageLedger[incidentModal.data.id].length === 0) && (
                <p className="text-sm text-gray-500 italic text-center py-4">No detailed ledgers available for this vendor.</p>
              )}
            </div>

            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end shrink-0 z-10">
              <button onClick={() => setIncidentModal({ isOpen: false, data: null })} className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-[10px] font-bold uppercase tracking-wider transition-colors rounded-sm shadow-sm">
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ MODAL 5: LODGE VENDOR CLAIM FINANCIALS DENGAN SMART PENALTY ASSESSOR   */}
      {/* ========================================================================= */}
      {claimModal.isOpen && claimModal.data && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[500px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-red-700" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            <div className="bg-red-700 text-white px-6 py-4 flex justify-between items-center shrink-0 z-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 opacity-80">Finance Integration</p>
                <h3 className="font-black text-sm uppercase tracking-wider">Lodge Financial Penalty</h3>
              </div>
              <button onClick={() => setClaimModal({ isOpen: false, data: null })} className="text-white opacity-70 hover:opacity-100 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <form onSubmit={handleSubmitClaim} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 flex flex-col gap-4">
                
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-sm flex justify-between items-center mb-2">
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">Targeting Vendor</span>
                    <span className="text-sm font-black text-[#125ab2]">{claimModal.data.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">Freight Paid</span>
                    <span className="text-sm font-mono font-black text-gray-800">${claimModal.data.freightCost.toLocaleString('en-US')}</span>
                  </div>
                </div>

                {/* ── FITUR 1: AUTOMATED PENALTY SUGGESTION ── */}
                <div className="bg-red-50 border border-red-200 p-4 rounded-sm mb-2 shadow-inner">
                  <label className="block text-[10px] font-bold text-red-800 uppercase tracking-wider mb-1.5">Penalty Claim Amount (USD) <span className="text-red-500">*</span></label>
                  <div className="flex items-center border border-red-300 bg-white rounded-sm focus-within:ring-1 focus-within:ring-red-500 transition-all overflow-hidden">
                    <span className="px-3 font-black text-red-700 bg-red-100 border-r border-red-200 py-2.5">$</span>
                    <input 
                      type="number" step="0.01" min="1"
                      value={claimForm.amount} 
                      onChange={e => setClaimForm({...claimForm, amount: e.target.value})} 
                      className="w-full px-3 py-2.5 outline-none font-mono font-black text-lg text-red-700 bg-transparent" 
                      required autoFocus
                    />
                  </div>
                  <p className="text-[9px] text-red-600 font-bold uppercase tracking-wider mt-2 flex items-center gap-1">
                    <span>💡</span> Zentryx suggested a 5% contract penalty based on SLA failure.
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Indemnity Grounds / Reason <span className="text-red-500">*</span></label>
                  <textarea 
                    rows="3" 
                    value={claimForm.reason} 
                    onChange={e => setClaimForm({...claimForm, reason: e.target.value})} 
                    className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-red-500 rounded-sm font-semibold text-gray-700 text-xs resize-none" 
                    required
                  ></textarea>
                </div>
              </div>
              
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 shrink-0 z-10">
                <button type="button" onClick={() => setClaimModal({ isOpen: false, data: null })} className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm rounded-sm">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors rounded-sm flex items-center gap-2">
                  <span>⚖️</span> Submit to Finance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
};

export default CarrierPerformance;