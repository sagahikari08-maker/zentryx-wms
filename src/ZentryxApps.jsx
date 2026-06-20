import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from './AppContext';

// ─── TOAST COMPONENT ─────────────────────────────────────────────────────────
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
    {toasts.map(({ id, message, type }) => (
      <div key={id} className={`flex items-center gap-3 px-4 py-3 rounded-sm shadow-lg text-white text-xs font-semibold min-w-[280px] ${
        type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : type === 'warning' ? 'bg-amber-500' : 'bg-[#125ab2]'
      }`}>
        <span>{type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠️' : 'ℹ'}</span>
        <span className="flex-1">{message}</span>
        <button onClick={() => removeToast(id)} className="opacity-70 hover:opacity-100 text-lg leading-none">×</button>
      </div>
    ))}
  </div>
);

const ZentryxApps = () => {
  const { bahasa, halaman, setHalaman } = useContext(AppContext);

  // ─── TABS STATE ───
  const [activeTab, setActiveTab] = useState(() => {
    if (halaman === 'appsERP') return 'ERP';
    if (halaman === 'appsScanner') return 'SCANNER';
    return 'MARKETPLACE'; 
  });

  useEffect(() => {
    if (halaman === 'appsMarketplace') setActiveTab('MARKETPLACE');
    else if (halaman === 'appsERP') setActiveTab('ERP');
    else if (halaman === 'appsScanner') setActiveTab('SCANNER');
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

  // ─── DATA STATE ───
  const [marketplaces, setMarketplaces] = useState([
    { id: 'MK-01', name: 'Tokopedia', type: 'B2C E-Commerce', status: 'Active', lastSync: '10 mins ago', ordersToday: 145, icon: '🦉' },
    { id: 'MK-02', name: 'Shopee', type: 'B2C E-Commerce', status: 'Sync Error', lastSync: '2 hours ago', ordersToday: 89, icon: '🛍️', errorLog: '[ERR-401] Access Token Expired or Revoked by User.' },
    { id: 'MK-03', name: 'Shopify', type: 'B2B/D2C Storefront', status: 'Active', lastSync: 'Just now', ordersToday: 42, icon: '🛒' },
  ]);

  const [erps, setErps] = useState([
    { id: 'ERP-01', name: 'SAP S/4HANA', module: 'Finance & Master Data', status: 'Active', connection: 'REST API (OAuth 2.0)', lastPing: 'OK (12ms)' },
    { id: 'ERP-02', name: 'Xero Accounting', module: 'Invoicing Only', status: 'Active', connection: 'Webhooks', lastPing: 'OK (45ms)' },
    { id: 'ERP-03', name: 'Oracle NetSuite', module: 'Procurement Sync', status: 'Pending Setup', connection: 'SOAP/XML', lastPing: 'Untested' },
  ]);

  const [scanners, setScanners] = useState([
    { id: 'HW-TC52-01', model: 'Zebra TC52x', assignee: 'Arief R.', zone: 'Zone B (Cold)', battery: 85, status: 'Online' },
    { id: 'HW-TC52-02', model: 'Zebra TC52x', assignee: 'Budi S.', zone: 'Zone A (Ambient)', battery: 12, status: 'Low Battery' },
    { id: 'MOB-APP-01', model: 'Android App (BYOD)', assignee: 'Joko W.', zone: 'Zone STAGE', battery: 64, status: 'Online' },
  ]);

  // ─── MODALS STATE ───
  const [modalConfig, setModalConfig] = useState({ isOpen: false, data: null, type: '' });
  const [modalSync, setModalSync] = useState({ isOpen: false, platform: '', progress: 0 });
  const [modalQR, setModalQR] = useState({ isOpen: false, data: null });
  const [modalAppDir, setModalAppDir] = useState({ isOpen: false, type: '' });
  const [modalErrorLog, setModalErrorLog] = useState({ isOpen: false, data: null });
  const [modalEnroll, setModalEnroll] = useState(false);
  const [modalDeviceDetail, setModalDeviceDetail] = useState({ isOpen: false, data: null }); // NEW: Scanner Edit Modal
  const [enrollForm, setEnrollForm] = useState({ id: `HW-${Math.floor(1000 + Math.random() * 9000)}`, model: 'Zebra TC52x', assignee: 'Unassigned', zone: 'Unassigned' });

  // ─── APP DIRECTORY CATALOG ───
  const availableApps = {
    'Marketplace': [
      { name: 'TikTok Shop', icon: '🎵', type: 'Social Commerce' },
      { name: 'Lazada', icon: '💙', type: 'B2C E-Commerce' },
      { name: 'Magento', icon: 'Ⓜ️', type: 'B2B Webstore' }
    ],
    'ERP': [
      { name: 'Microsoft Dynamics 365', module: 'Full Suite Sync', connection: 'REST API' },
      { name: 'Odoo ERP', module: 'Inventory & Accounting', connection: 'XML-RPC' },
      { name: 'Accurate Online', module: 'Finance Sync', connection: 'REST API' }
    ]
  };

  // ─── ACTION HANDLERS ───

  // 1. Sync Execution
  const handleSimulateSync = (platformName) => {
    setModalSync({ isOpen: true, platform: platformName, progress: 0 });
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 25);
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setTimeout(() => {
          setModalSync({ isOpen: false, platform: '', progress: 0 });
          addToast(`Sync with ${platformName} completed. Inventory and Orders updated!`, 'success');
          setMarketplaces(prev => prev.map(m => m.name === platformName ? { ...m, status: 'Active', lastSync: 'Just now', errorLog: null } : m));
        }, 800);
      }
      setModalSync(prev => ({ ...prev, progress: currentProgress }));
    }, 400);
  };

  // 2. Configuration & App Installation
  const handleSaveConfig = () => {
    addToast(`${modalConfig.data.name} API Configuration saved securely.`, 'success');
    if (modalConfig.type === 'ERP') {
      setErps(prev => prev.map(e => e.id === modalConfig.data.id ? { ...e, status: 'Active', lastPing: 'OK (18ms)' } : e));
    } else {
      setMarketplaces(prev => prev.map(m => m.id === modalConfig.data.id ? { ...m, status: 'Active' } : m));
    }
    setModalConfig({ isOpen: false, data: null, type: '' });
  };

  const handleDisconnect = (id, type) => {
    addToast('Integration disconnected. API keys revoked.', 'warning');
    if (type === 'ERP') {
      setErps(prev => prev.map(e => e.id === id ? { ...e, status: 'Disconnected', lastPing: 'Offline' } : e));
    } else {
      setMarketplaces(prev => prev.map(m => m.id === id ? { ...m, status: 'Disconnected', lastSync: 'Offline' } : m));
    }
    setModalConfig({ isOpen: false, data: null, type: '' });
  };

  const handleInstallApp = (app, type) => {
    if (type === 'Marketplace') {
      const newApp = { id: `MK-NEW-${Date.now()}`, name: app.name, type: app.type, status: 'Pending Setup', lastSync: '-', ordersToday: 0, icon: app.icon };
      setMarketplaces([...marketplaces, newApp]);
    } else {
      const newERP = { id: `ERP-NEW-${Date.now()}`, name: app.name, module: app.module, status: 'Pending Setup', connection: app.connection, lastPing: 'Untested' };
      setErps([...erps, newERP]);
    }
    addToast(`${app.name} connector installed! Please configure the API keys.`, 'success');
    setModalAppDir({ isOpen: false, type: '' });
  };

  // 3. Hardware Management
  const handleEnrollDevice = () => {
    const newDevice = { ...enrollForm, battery: 100, status: 'Idle' };
    setScanners([...scanners, newDevice]);
    setModalEnroll(false);
    addToast('Device registered in MDM. Generating provisioning QR...', 'success');
    setTimeout(() => {
      setModalQR({ isOpen: true, data: newDevice });
    }, 500);
  };

  const handleRevokeScanner = (id) => {
    setScanners(prev => prev.map(s => s.id === id ? { ...s, assignee: 'WIPED', status: 'Locked', zone: 'None' } : s));
    addToast(`Device ${id} remotely wiped and locked via MDM.`, 'error');
  };

  const handleSaveDeviceDetail = () => {
    setScanners(prev => prev.map(s => s.id === modalDeviceDetail.data.id ? modalDeviceDetail.data : s));
    addToast(`Configuration for Device ${modalDeviceDetail.data.id} updated successfully.`, 'success');
    setModalDeviceDetail({ isOpen: false, data: null });
  };

  // 4. ERP Pinging
  const handlePingERP = (id) => {
    setErps(prev => prev.map(e => e.id === id ? { ...e, lastPing: 'Pinging...' } : e));
    setTimeout(() => {
      const latency = Math.floor(Math.random() * 50) + 10; 
      setErps(prev => prev.map(e => e.id === id ? { ...e, lastPing: `OK (${latency}ms)` } : e));
      addToast(`Ping to ERP successful. Latency: ${latency}ms`, 'success');
    }, 1200);
  };


  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide flex items-center gap-2">
            <span>🔌</span> {bahasa === 'en' ? 'App Ecosystem & Integrations' : 'Integrasi Aplikasi & Ekosistem'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">Connect Zentryx WMS to external marketplaces, enterprise ERPs, and field hardware.</p>
        </div>
        
        {/* TABS */}
        <div className="bg-gray-100 p-1 rounded-sm shadow-inner flex overflow-x-auto border border-gray-300">
          <button onClick={() => handleTabClick('MARKETPLACE', 'appsMarketplace')} className={`px-4 py-2 text-xs font-bold uppercase transition-all rounded-sm whitespace-nowrap ${activeTab === 'MARKETPLACE' ? 'bg-[#415a77] text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}>
            Marketplaces
          </button>
          <button onClick={() => handleTabClick('ERP', 'appsERP')} className={`px-4 py-2 text-xs font-bold uppercase transition-all rounded-sm whitespace-nowrap ${activeTab === 'ERP' ? 'bg-[#415a77] text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}>
            ERP Systems
          </button>
          <button onClick={() => handleTabClick('SCANNER', 'appsScanner')} className={`px-4 py-2 text-xs font-bold uppercase transition-all rounded-sm whitespace-nowrap ${activeTab === 'SCANNER' ? 'bg-[#415a77] text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}>
            Hardware Scanners
          </button>
        </div>
      </div>

      {/* ── TAB 1: MARKETPLACE INTEGRATIONS ── */}
      {activeTab === 'MARKETPLACE' && (
        <div className="animate-fade-in space-y-6">
          <div className="bg-white border border-gray-300 shadow-sm rounded-sm p-6 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm uppercase text-gray-800 tracking-wider">E-Commerce & Sales Channels</h3>
              <p className="text-[10px] text-gray-500 font-semibold mt-1">Orders sync automatically every 5 minutes. Stock levels are pushed to channels in real-time.</p>
            </div>
            <button onClick={() => setModalAppDir({ isOpen: true, type: 'Marketplace' })} className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-5 py-2 rounded-sm text-xs font-bold uppercase shadow-sm transition-colors">
              + Connect New Store
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {marketplaces.map((mk, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-sm shadow-sm flex flex-col overflow-hidden group hover:border-[#125ab2] transition-colors relative">
                
                <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10 bg-white px-2 py-1 rounded shadow-sm border border-gray-100">
                  <div className={`w-2 h-2 rounded-full ${mk.status === 'Active' ? 'bg-green-500 animate-pulse' : mk.status === 'Sync Error' ? 'bg-red-500' : 'bg-gray-400'}`}></div>
                  <span className={`text-[9px] font-bold uppercase ${mk.status === 'Sync Error' ? 'text-red-600' : 'text-gray-500'}`}>{mk.status}</span>
                </div>

                <div className="p-5 pt-8 flex flex-col items-center text-center border-b border-gray-100">
                  <div className="text-4xl mb-3 bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center border border-gray-200 shadow-inner group-hover:scale-110 transition-transform">{mk.icon}</div>
                  <h4 className="font-black text-gray-800 text-lg">{mk.name}</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">{mk.type}</p>
                </div>
                
                <div className="p-4 bg-gray-50/50 space-y-3 flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Last Sync</span>
                    <span className={`text-[10px] font-black ${mk.status === 'Sync Error' ? 'text-red-600' : 'text-gray-800'}`}>{mk.lastSync}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Orders Today</span>
                    <span className="text-sm font-black text-[#125ab2]">{mk.ordersToday}</span>
                  </div>
                </div>

                <div className="p-3 border-t border-gray-200 flex gap-2">
                  <button onClick={() => setModalConfig({ isOpen: true, data: mk, type: 'Marketplace' })} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-2 rounded-sm text-[10px] font-bold uppercase transition-colors">
                    API Config
                  </button>
                  
                  {mk.status === 'Sync Error' ? (
                    <button onClick={() => setModalErrorLog({ isOpen: true, data: mk })} className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 px-2 py-2 rounded-sm text-[10px] font-bold uppercase transition-colors shadow-sm">
                      View Logs
                    </button>
                  ) : (
                    <button 
                      disabled={mk.status === 'Disconnected'}
                      onClick={() => handleSimulateSync(mk.name)} 
                      className={`flex-1 px-2 py-2 rounded-sm text-[10px] font-bold uppercase transition-colors shadow-sm ${mk.status === 'Disconnected' ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#125ab2] hover:bg-[#0e4487] text-white'}`}
                    >
                      Force Sync
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 2: ERP INTEGRATIONS ── */}
      {activeTab === 'ERP' && (
        <div className="bg-white border border-gray-300 shadow-sm rounded-sm animate-fade-in flex flex-col overflow-hidden">
          <div className="bg-slate-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-xs uppercase text-gray-700 tracking-wider">Enterprise ERP Data Bridges</h3>
              <p className="text-[10px] text-gray-500 font-semibold mt-0.5">Bi-directional bridges for Master Data, Purchase Orders, and Financial Valuation.</p>
            </div>
            <button onClick={() => setModalAppDir({ isOpen: true, type: 'ERP' })} className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-4 py-1.5 rounded-sm text-[10px] font-bold uppercase shadow-sm transition-colors">
              + Setup New Bridge
            </button>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-[#f8fafc] text-[#64748b] text-[10px] uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-6">System / ERP Name</th>
                  <th className="py-3 px-6">Data Modules Synced</th>
                  <th className="py-3 px-6 text-center">Connection Protocol</th>
                  <th className="py-3 px-6 text-center">API Telemetry</th>
                  <th className="py-3 px-6 text-center">Action Control</th>
                </tr>
              </thead>
              <tbody className="text-[12px] text-gray-700">
                {erps.map((erp, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-slate-50">
                    <td className="py-4 px-6">
                      {/* FITUR BARU: KLIK ERP NAME UNTUK BUKA MODAL */}
                      <div onClick={() => setModalConfig({ isOpen: true, data: erp, type: 'ERP' })} className="font-black text-[#125ab2] text-[14px] cursor-pointer hover:underline w-max">
                        {erp.name}
                      </div>
                      <div className="text-[10px] font-mono text-gray-400 mt-0.5">{erp.id}</div>
                    </td>
                    <td className="py-4 px-6 font-bold text-[#125ab2]">{erp.module}</td>
                    <td className="py-4 px-6 text-center">
                      <span className="bg-gray-100 border border-gray-200 text-gray-600 px-2 py-1 rounded-sm text-[9px] font-mono uppercase">{erp.connection}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border shadow-sm ${
                          erp.status === 'Active' ? 'bg-green-100 text-green-700 border-green-200' :
                          erp.status === 'Pending Setup' ? 'bg-amber-100 text-amber-700 border-amber-300' :
                          'bg-red-100 text-red-600 border-red-200'
                        }`}>
                          {erp.status}
                        </span>
                        <span className={`text-[9px] font-bold mt-1 ${erp.lastPing.includes('Ping') ? 'text-amber-500 animate-pulse' : 'text-gray-400'}`}>Ping: {erp.lastPing}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handlePingERP(erp.id)} className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase transition-colors">
                          Test Ping
                        </button>
                        <button onClick={() => setModalConfig({ isOpen: true, data: erp, type: 'ERP' })} className="bg-gray-800 hover:bg-black text-white px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase transition-colors shadow-sm">
                          API Config
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: BARCODE SCANNERS (HARDWARE) ── */}
      {activeTab === 'SCANNER' && (
        <div className="bg-white border border-gray-300 shadow-sm rounded-sm animate-fade-in flex flex-col overflow-hidden">
          <div className="bg-slate-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-xs uppercase text-gray-700 tracking-wider">Device Fleet Management</h3>
              <p className="text-[10px] text-gray-500 font-semibold mt-0.5">Provision and monitor physical Handheld RF Scanners and Android BYOD devices.</p>
            </div>
            <button onClick={() => setModalEnroll(true)} className="bg-gray-800 hover:bg-black text-white px-4 py-1.5 rounded-sm text-[10px] font-bold uppercase shadow-sm transition-colors flex items-center gap-2">
              <span>📱</span> Enroll New Device
            </button>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-[#f8fafc] text-[#64748b] text-[10px] uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-6">Device ID / Model</th>
                  <th className="py-3 px-6">Assigned User</th>
                  <th className="py-3 px-6">Current Zone</th>
                  <th className="py-3 px-6">Battery / Power</th>
                  <th className="py-3 px-6 text-center">Status</th>
                  <th className="py-3 px-6 text-center">Controls</th>
                </tr>
              </thead>
              <tbody className="text-[12px] text-gray-700">
                {scanners.map((scan, i) => (
                  <tr key={i} className={`border-b border-gray-100 hover:bg-slate-50 ${scan.status === 'Locked' ? 'bg-red-50/20' : ''}`}>
                    <td className="py-4 px-6">
                      {/* FITUR BARU: KLIK SCANNER ID UNTUK BUKA MODAL CONFIG */}
                      <div onClick={() => setModalDeviceDetail({ isOpen: true, data: scan })} className="font-mono font-black text-[#125ab2] text-[13px] cursor-pointer hover:underline w-max">
                        {scan.id}
                      </div>
                      <div className="text-[10px] font-bold text-gray-500 mt-0.5">{scan.model}</div>
                    </td>
                    <td className="py-4 px-6 font-bold text-gray-800">{scan.assignee}</td>
                    <td className="py-4 px-6 font-semibold text-gray-600">{scan.zone}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-3 bg-gray-200 rounded-sm overflow-hidden border border-gray-300 relative">
                          <div className={`h-full ${scan.battery > 50 ? 'bg-green-500' : scan.battery > 20 ? 'bg-amber-500' : 'bg-red-600 animate-pulse'}`} style={{ width: `${scan.battery}%` }}></div>
                        </div>
                        <span className={`text-[10px] font-black ${scan.battery <= 20 ? 'text-red-600' : 'text-gray-600'}`}>{scan.battery}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                        scan.status === 'Online' ? 'bg-green-100 text-green-700 border-green-200' :
                        scan.status === 'Idle' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                        'bg-red-50 text-red-600 border-red-200'
                      }`}>
                        {scan.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center gap-2">
                        <button disabled={scan.status === 'Locked'} onClick={() => setModalQR({ isOpen: true, data: scan })} className={`border px-3 py-1 rounded-sm text-[10px] font-bold uppercase transition-colors ${scan.status === 'Locked' ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700'}`} title="Generate Login QR">
                          QR Login
                        </button>
                        <button disabled={scan.status === 'Locked'} onClick={() => handleRevokeScanner(scan.id)} className={`px-2 py-1 rounded-sm text-[10px] font-bold uppercase transition-colors border ${scan.status === 'Locked' ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200'}`} title="Remote Wipe/Lock">
                          Lock
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* ═══════════════════════════════════════════════════
          DYNAMIC MODALS SECTION (FULLY INTERACTIVE)
      ═══════════════════════════════════════════════════ */}

      {/* 1. App Directory Modal (Install new integration) */}
      {modalAppDir.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-sm w-[600px] shadow-2xl flex flex-col">
            <div className="px-6 py-4 flex justify-between items-center text-white bg-[#415a77]">
              <h3 className="font-black text-sm uppercase tracking-wider">Connector Hub: {modalAppDir.type}s</h3>
              <button onClick={() => setModalAppDir({ isOpen: false, type: '' })} className="text-white opacity-70 hover:opacity-100 font-bold text-xl leading-none">✕</button>
            </div>
            <div className="p-6">
              <p className="text-xs text-gray-500 mb-4">Select an official verified connector to install into your Zentryx instance.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                {availableApps[modalAppDir.type].map((app, i) => (
                  <div key={i} className="border border-gray-200 p-4 rounded-sm flex flex-col justify-between hover:border-[#125ab2] hover:shadow-md transition-all group">
                    <div className="flex items-start gap-3 mb-4">
                      {modalAppDir.type === 'Marketplace' ? (
                        <div className="text-3xl bg-gray-50 w-12 h-12 flex items-center justify-center rounded border border-gray-200 shrink-0">{app.icon}</div>
                      ) : (
                        <div className="text-2xl bg-purple-50 w-12 h-12 flex items-center justify-center rounded border border-purple-200 shrink-0">🏢</div>
                      )}
                      <div>
                        <h4 className="font-black text-gray-800 text-sm leading-tight">{app.name}</h4>
                        <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">{app.type || app.module}</p>
                      </div>
                    </div>
                    <button onClick={() => handleInstallApp(app, modalAppDir.type)} className="w-full bg-gray-100 hover:bg-[#125ab2] text-gray-700 hover:text-white px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase transition-colors">
                      Install Connector
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Error Log Modal (Troubleshoot Sync) */}
      {modalErrorLog.isOpen && modalErrorLog.data && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-sm w-[500px] shadow-2xl flex flex-col border-t-4 border-red-600">
            <div className="px-6 py-4 flex justify-between items-center bg-gray-50 border-b border-gray-200">
              <h3 className="font-black text-sm uppercase tracking-wider text-red-700 flex items-center gap-2"><span>🚨</span> Sync Diagnostics</h3>
              <button onClick={() => setModalErrorLog({ isOpen: false, data: null })} className="text-gray-400 hover:text-gray-800 font-bold text-xl leading-none">✕</button>
            </div>
            <div className="p-6">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Target Integration</p>
              <h4 className="font-black text-lg text-gray-800 mb-4">{modalErrorLog.data.name}</h4>
              
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Last API Response Payload</p>
              <div className="bg-gray-900 text-red-400 p-4 rounded-sm font-mono text-[11px] leading-relaxed mb-6 whitespace-pre-wrap">
                {`{
  "timestamp": "${new Date().toISOString()}",
  "endpoint": "/api/v2/orders/sync",
  "status_code": 401,
  "error_message": "${modalErrorLog.data.errorLog}",
  "resolution": "Update API Keys in WMS Configuration."
}`}
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={() => setModalErrorLog({ isOpen: false, data: null })} className="px-4 py-2 text-xs font-bold bg-gray-200 text-gray-700 uppercase rounded-sm hover:bg-gray-300">Close</button>
                <button onClick={() => {
                  setModalErrorLog({ isOpen: false, data: null });
                  setModalConfig({ isOpen: true, data: modalErrorLog.data, type: 'Marketplace' });
                }} className="bg-[#125ab2] text-white px-4 py-2 text-xs font-bold uppercase rounded-sm shadow-sm hover:bg-[#0e4487]">
                  Open API Config
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Progress Sync Simulation Modal */}
      {modalSync.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-sm w-[400px] shadow-2xl flex flex-col border-t-4 border-[#125ab2] p-6 text-center">
            <h3 className="font-black text-lg text-gray-800 mb-1">Syncing {modalSync.platform}...</h3>
            <p className="text-xs text-gray-500 font-semibold mb-6">Pulling latest orders and pushing stock adjustments.</p>
            
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2 overflow-hidden border border-gray-300 shadow-inner">
              <div className="bg-[#125ab2] h-4 rounded-full transition-all duration-300 ease-out flex items-center justify-end pr-2" style={{ width: `${modalSync.progress}%` }}>
                {modalSync.progress > 10 && <span className="text-[8px] text-white font-black">{modalSync.progress}%</span>}
              </div>
            </div>
            <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest animate-pulse">Establishing Secure Connection...</p>
          </div>
        </div>
      )}

      {/* 4. API Configuration Modal (Marketplace / ERP) */}
      {modalConfig.isOpen && modalConfig.data && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-sm w-[550px] shadow-2xl flex flex-col">
            <div className={`px-6 py-4 flex justify-between items-center text-white ${modalConfig.type === 'ERP' ? 'bg-purple-800' : 'bg-[#415a77]'}`}>
              <h3 className="font-black text-sm uppercase tracking-wider">{modalConfig.type} Settings: {modalConfig.data.name}</h3>
              <button onClick={() => setModalConfig({ isOpen: false, data: null, type: '' })} className="text-white opacity-70 hover:opacity-100 font-bold text-xl leading-none">✕</button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-sm flex items-center gap-4 mb-2">
                <div className="text-4xl bg-white w-12 h-12 flex items-center justify-center rounded border shadow-sm">
                  {modalConfig.type === 'ERP' ? '🏢' : modalConfig.data.icon}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Connection Target</p>
                  <p className="font-black text-gray-800 text-lg">{modalConfig.data.name}</p>
                  <p className="text-[10px] text-gray-500 font-mono">{modalConfig.data.id} | Status: {modalConfig.data.status}</p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">API Endpoint URL</label>
                <input type="text" defaultValue={`https://api.${modalConfig.data.name.toLowerCase().replace(/\s/g, '')}.com/v2/sync`} className="w-full border border-gray-300 p-2 text-sm font-mono text-[#125ab2] rounded-sm outline-none focus:border-[#125ab2]" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Client ID / Public Key</label>
                  <input type="text" placeholder="Enter Client ID" className="w-full border border-gray-300 p-2 text-sm font-mono rounded-sm outline-none focus:border-[#125ab2]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Client Secret (Hidden)</label>
                  <input type="password" placeholder="••••••••••••••••" className="w-full border border-gray-300 p-2 text-sm font-mono rounded-sm outline-none focus:border-[#125ab2]" />
                </div>
              </div>

              {modalConfig.type === 'Marketplace' && (
                <div className="pt-2">
                  <label className="flex items-center gap-3 cursor-pointer p-3 border border-blue-200 bg-blue-50 rounded-sm">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-[#125ab2]" />
                    <div>
                      <p className="text-xs font-bold text-gray-800">Enable Bi-Directional Inventory Sync</p>
                      <p className="text-[9px] text-gray-500 mt-0.5">Push stock updates from WMS back to store automatically.</p>
                    </div>
                  </label>
                </div>
              )}

              <div className="pt-4 flex justify-between gap-2 border-t border-gray-100">
                <button onClick={() => handleDisconnect(modalConfig.data.id, modalConfig.type)} className="px-4 py-2 text-xs font-bold bg-red-50 text-red-600 border border-red-200 uppercase rounded-sm hover:bg-red-100 transition-colors">
                  Disconnect API
                </button>
                <div className="flex gap-2">
                  <button onClick={() => setModalConfig({ isOpen: false, data: null, type: '' })} className="px-4 py-2 text-xs font-bold bg-gray-200 text-gray-700 uppercase rounded-sm hover:bg-gray-300 transition-colors">Cancel</button>
                  <button onClick={handleSaveConfig} className={`text-white px-5 py-2 text-xs font-bold uppercase rounded-sm shadow-sm transition-colors ${modalConfig.type === 'ERP' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-[#125ab2] hover:bg-[#0e4487]'}`}>
                    Save & Authenticate
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Enroll Scanner Modal Form */}
      {modalEnroll && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-sm w-[450px] shadow-2xl flex flex-col border-t-4 border-gray-800">
            <div className="px-6 py-4 flex justify-between items-center bg-gray-50 border-b border-gray-200">
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider text-gray-800">MDM Device Enrollment</h3>
                <p className="text-[10px] text-gray-500 font-semibold mt-0.5">Register new physical hardware to WMS network.</p>
              </div>
              <button onClick={() => setModalEnroll(false)} className="text-gray-400 hover:text-gray-800 font-bold text-xl leading-none">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Generated Device ID (MDM)</label>
                <input type="text" value={enrollForm.id} disabled className="w-full border border-gray-300 bg-gray-100 p-2 text-sm font-mono font-bold text-gray-500 rounded-sm" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Hardware Model</label>
                <select value={enrollForm.model} onChange={(e) => setEnrollForm({...enrollForm, model: e.target.value})} className="w-full border border-gray-300 p-2 text-sm font-bold rounded-sm outline-none focus:border-[#125ab2]">
                  <option value="Zebra TC52x">Zebra TC52x (Rugged)</option>
                  <option value="Honeywell EDA51">Honeywell EDA51</option>
                  <option value="Android App (BYOD)">Android App (BYOD - Personal Phone)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Assign to Staff</label>
                  <select value={enrollForm.assignee} onChange={(e) => setEnrollForm({...enrollForm, assignee: e.target.value})} className="w-full border border-gray-300 p-2 text-sm rounded-sm outline-none focus:border-[#125ab2]">
                    <option value="Unassigned">Unassigned (Pool)</option>
                    <option value="Siti Aminah">Siti Aminah</option>
                    <option value="Doni T.">Doni T.</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Default Zone</label>
                  <select value={enrollForm.zone} onChange={(e) => setEnrollForm({...enrollForm, zone: e.target.value})} className="w-full border border-gray-300 p-2 text-sm rounded-sm outline-none focus:border-[#125ab2]">
                    <option value="Unassigned">Unassigned</option>
                    <option value="Zone A (Ambient)">Zone A (Ambient)</option>
                    <option value="Zone C (Frozen)">Zone C (Frozen)</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                <button onClick={() => setModalEnroll(false)} className="px-4 py-2 text-xs font-bold bg-gray-200 text-gray-700 uppercase rounded-sm hover:bg-gray-300">Cancel</button>
                <button onClick={handleEnrollDevice} className="bg-gray-800 hover:bg-black text-white px-5 py-2 text-xs font-bold uppercase rounded-sm shadow-sm transition-colors">Register Device</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Scanner Device Edit/Config Modal (NEW) */}
      {modalDeviceDetail.isOpen && modalDeviceDetail.data && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-sm w-[450px] shadow-2xl flex flex-col border-t-4 border-[#125ab2]">
            <div className="px-6 py-4 flex justify-between items-center bg-gray-50 border-b border-gray-200">
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider text-gray-800">Device Configuration</h3>
                <p className="text-[10px] text-gray-500 font-mono mt-0.5">{modalDeviceDetail.data.id}</p>
              </div>
              <button onClick={() => setModalDeviceDetail({ isOpen: false, data: null })} className="text-gray-400 hover:text-gray-800 font-bold text-xl leading-none">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 border border-blue-200 rounded-sm">
                <div>
                  <p className="text-[10px] font-bold text-blue-700 uppercase mb-1">Hardware Model</p>
                  <p className="font-black text-gray-800 text-sm">{modalDeviceDetail.data.model}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-blue-700 uppercase mb-1">Battery Level</p>
                  <p className={`font-black text-sm ${modalDeviceDetail.data.battery < 20 ? 'text-red-600' : 'text-green-600'}`}>{modalDeviceDetail.data.battery}%</p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Assigned Staff</label>
                <select 
                  value={modalDeviceDetail.data.assignee} 
                  onChange={(e) => setModalDeviceDetail({ ...modalDeviceDetail, data: { ...modalDeviceDetail.data, assignee: e.target.value }})} 
                  className="w-full border border-gray-300 p-2 text-sm font-bold rounded-sm outline-none focus:border-[#125ab2]"
                >
                  <option value="Unassigned">Unassigned (Pool)</option>
                  <option value="Arief R.">Arief R.</option>
                  <option value="Budi S.">Budi S.</option>
                  <option value="Joko W.">Joko W.</option>
                  <option value="Siti Aminah">Siti Aminah</option>
                  <option value="WIPED">WIPED (Locked)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Operational Zone Target</label>
                <select 
                  value={modalDeviceDetail.data.zone} 
                  onChange={(e) => setModalDeviceDetail({ ...modalDeviceDetail, data: { ...modalDeviceDetail.data, zone: e.target.value }})} 
                  className="w-full border border-gray-300 p-2 text-sm font-bold rounded-sm outline-none focus:border-[#125ab2]"
                >
                  <option value="None">None</option>
                  <option value="Zone A (Ambient)">Zone A (Ambient)</option>
                  <option value="Zone B (Cold)">Zone B (Cold)</option>
                  <option value="Zone STAGE">Zone STAGE</option>
                  <option value="Charging Dock">Charging Dock</option>
                </select>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                <button onClick={() => setModalDeviceDetail({ isOpen: false, data: null })} className="px-4 py-2 text-xs font-bold bg-gray-200 text-gray-700 uppercase rounded-sm hover:bg-gray-300">Cancel</button>
                <button onClick={handleSaveDeviceDetail} className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-5 py-2 text-xs font-bold uppercase rounded-sm shadow-sm transition-colors">Apply Config</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Scanner QR Login Modal */}
      {modalQR.isOpen && modalQR.data && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-sm w-[450px] shadow-2xl flex flex-col">
            <div className="px-6 py-4 flex justify-between items-center text-white bg-gray-900">
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider text-green-400">Device Provisioning Auth</h3>
                <p className="text-[10px] font-mono mt-0.5">ID: {modalQR.data.id}</p>
              </div>
              <button onClick={() => setModalQR({ isOpen: false, data: null })} className="text-white opacity-70 hover:opacity-100 font-bold text-xl leading-none">✕</button>
            </div>
            
            <div className="p-8 flex flex-col items-center text-center">
              <p className="text-xs font-bold text-gray-600 uppercase mb-4 tracking-widest">Scan QR from Handheld App to Login</p>
              
              <div className="bg-white border-8 border-gray-900 p-2 inline-block shadow-lg">
                <div className="w-48 h-48 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/QR_code_for_mobile_English_Wikipedia.svg/330px-QR_code_for_mobile_English_Wikipedia.svg.png')] bg-contain bg-center opacity-80 mix-blend-multiply"></div>
              </div>
              
              <div className="mt-6 w-full bg-gray-50 border border-gray-200 p-4 text-left rounded-sm">
                <div className="flex justify-between border-b border-gray-200 pb-2 mb-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Hardware Model</span>
                  <span className="text-[11px] font-black text-gray-800">{modalQR.data.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Network Endpoint</span>
                  <span className="text-[11px] font-mono font-bold text-[#125ab2]">wss://wms.zentryx.io/rf</span>
                </div>
              </div>

              <button onClick={() => setModalQR({ isOpen: false, data: null })} className="mt-6 w-full bg-gray-800 hover:bg-black text-white px-4 py-3 text-xs font-black uppercase rounded-sm shadow-sm transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
};

export default ZentryxApps;