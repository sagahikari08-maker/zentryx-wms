import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AppContext } from './AppContext';

// ─── TOAST COMPONENT ─────────────────────────────────────────────────────────
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
    {toasts.map(({ id, message, type }) => (
      <div key={id} className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl text-white text-xs font-semibold min-w-[280px] backdrop-blur-md bg-opacity-95 ${
        type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-rose-600' : type === 'warning' ? 'bg-amber-500' : 'bg-[#125ab2]'
      }`}>
        <span className="text-base">{type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠️' : '📡'}</span>
        <span className="flex-1">{message}</span>
        <button onClick={() => removeToast(id)} className="opacity-70 hover:opacity-100 text-lg leading-none transition-opacity">×</button>
      </div>
    ))}
  </div>
);

const InventoryOverview = () => {
  // ─── 🚀 INJEKSI: Mengambil inventoryData riil dari AppContext ───
  const { setHalaman, inventoryData } = useContext(AppContext);

  // ─── STATE MANAGEMENT ───
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // Data & Network States
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState('Disconnected');
  const [scannerStatus, setScannerStatus] = useState('Listening...');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  
  // Modals
  const [modalBOM, setModalBOM] = useState({ isOpen: false, data: null });
  const [modalSerial, setModalSerial] = useState({ isOpen: false, data: null });

  // ─── 1. 🚀 ENGINE INTERLOCK: FETCH DARI INVENTORY DATA (SSOT) ───
  const fetchFromZentryxCore = useCallback(async (query = '') => {
    setIsLoading(true);
    setApiStatus('Querying Zentryx Core DB...');
    
    return new Promise((resolve) => {
      // Mensimulasikan tarikan data ke database (Tapi kali ini datanya asli dari Context!)
      setTimeout(() => {
        // Ambil data dasar dari Context
        const baseData = inventoryData || [];
        
        // Memperkaya data Context dengan properti UI tambahan agar tabel tidak error
        const enrichedData = baseData.map(item => ({
          sku: item.sku,
          name: item.name || item.sku,
          category: item.category || (item.sku?.includes('LFP') ? 'Energy Storage' : item.sku?.includes('MCU') ? 'Powertrain' : 'Consumables'),
          isDG: item.sku?.includes('LFP') || false,
          isSerialized: true,
          batch: `BTH-${new Date().toISOString().slice(2,7).replace('-','')}-X${Math.floor(Math.random()*9)}`, // Auto-generate batch label
          qty: item.qty || 0,
          uom: 'Units',
          location: item.location || 'Zone A (Ambient)',
          status: 'Available',
          cost: item.price || 0
        }));

        const filteredData = query 
          ? enrichedData.filter(item => item.sku.toLowerCase().includes(query.toLowerCase()) || item.name.toLowerCase().includes(query.toLowerCase()))
          : enrichedData;

        setInventory(filteredData);
        setIsLoading(false);
        setApiStatus('Connected to Zentryx Core');
        resolve();
      }, 800);
    });
  }, [inventoryData]);

  useEffect(() => {
    fetchFromZentryxCore();
  }, [fetchFromZentryxCore]);


  // ─── 2. HARDWARE INTEGRATION ENGINE (ZEBRA SCANNER LISTENER) ───
  useEffect(() => {
    let barcodeBuffer = '';
    let lastKeyTime = Date.now();

    const handleHardwareScan = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const currentTime = Date.now();
      
      if (currentTime - lastKeyTime > 50) {
        barcodeBuffer = ''; 
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter' && barcodeBuffer.length > 3) {
        e.preventDefault();
        const scannedCode = barcodeBuffer.toUpperCase();
        setScannerStatus(`Scanned: ${scannedCode}`);
        addToast(`Zebra Hardware Detected Scan: ${scannedCode}`, 'info');
        
        setInventory(prevInv => {
          const itemExists = prevInv.find(item => item.sku === scannedCode);
          if (itemExists) {
            addToast(`Match Found in Zentryx DB! Opening registry...`, 'success');
            setTimeout(() => setModalSerial({ isOpen: true, data: itemExists }), 500);
          } else {
            addToast(`SKU ${scannedCode} not recognized in current bin location!`, 'error');
          }
          return prevInv;
        });
        
        barcodeBuffer = ''; 
        setTimeout(() => setScannerStatus('Listening...'), 3000);
      } else if (e.key.length === 1) { 
        barcodeBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleHardwareScan);
    return () => window.removeEventListener('keydown', handleHardwareScan);
  }, [addToast]);


  // ─── LOCAL ACTION HANDLERS ───
  const triggerApiSearch = (e) => {
    e.preventDefault();
    addToast(`Pushing query to Zentryx Core Database: "${searchQuery}"`, 'info');
    fetchFromZentryxCore(searchQuery);
  };

  const handleViewBOM = (item) => {
    if (item.category === 'Energy Storage' || item.category === 'Powertrain') {
      setModalBOM({ isOpen: true, data: item });
    } else {
      addToast(`Item ${item.sku} does not have a complex assembly BOM.`, 'warning');
    }
  };

  const handleViewSerials = (item) => {
    if (item.isSerialized) {
      setModalSerial({ isOpen: true, data: item });
    } else {
      addToast(`Item ${item.sku} is lot-controlled only, not individually serialized.`, 'warning');
    }
  };

  const displayData = filterCategory === 'All' ? inventory : inventory.filter(item => item.category === filterCategory);

  return (
    <div className="bg-[#f3f6f9] min-h-screen px-4 py-6 md:px-8 font-sans text-slate-800">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER & TELEMETRY STATUS ── */}
      <div className="max-w-[1500px] mx-auto mb-6 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 pb-3 gap-4 animate-fade-in">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>📦 Inventory</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Master Data</span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Traceability & Item Master</h1>
        </div>
        
        {/* Hardware & Network Telemetry */}
        <div className="flex gap-3">
          <div className="flex flex-col items-end bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Zebra RF Scanner</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${scannerStatus.includes('Scanned') ? 'bg-blue-500 animate-ping' : 'bg-emerald-500'}`}></span>
              <span className="text-[10px] font-black text-slate-700">{scannerStatus}</span>
            </div>
          </div>
          <div className="flex flex-col items-end bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Zentryx Core Engine</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${apiStatus.includes('Querying') ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
              <span className="text-[10px] font-black text-slate-700">{apiStatus}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-[1500px] mx-auto flex flex-col gap-5 animate-fade-in">
        
        {/* Controls & Filters */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center justify-between">
          <form onSubmit={triggerApiSearch} className="flex items-center gap-3 flex-1 min-w-[300px]">
            <span className="text-slate-400">🔍</span>
            <input 
              type="text" 
              placeholder="Search ARUS Motors Components by SKU or Name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border-none bg-slate-50 px-4 py-2 rounded-lg text-sm font-semibold outline-none focus:ring-1 focus:ring-blue-500 transition-all"
            />
            <button type="submit" disabled={isLoading} className={`px-4 py-2 rounded-lg text-xs font-bold text-white transition-all shadow-sm ${isLoading ? 'bg-slate-400 cursor-wait' : 'bg-[#125ab2] hover:bg-[#0e4487]'}`}>
              {isLoading ? 'Querying DB...' : 'Run Query'}
            </button>
          </form>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filter Category:</span>
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-slate-200 bg-white px-4 py-2 rounded-lg text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Energy Storage">Energy Storage</option>
              <option value="Powertrain">Powertrain</option>
              <option value="Structural">Structural (Chassis)</option>
              <option value="Electrical">Electrical Harness</option>
              <option value="Consumables">Consumables / Misc</option>
            </select>
          </div>
        </div>

        {/* Data Grid / Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden relative min-h-[300px]">
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center z-10">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-[#125ab2] rounded-full animate-spin mb-3"></div>
              <p className="text-xs font-bold text-[#125ab2] uppercase tracking-widest animate-pulse">Syncing with Zentryx Core DB...</p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6">SKU / Component</th>
                  <th className="py-4 px-6">Traceability (Batch)</th>
                  <th className="py-4 px-6 text-right">Physical Stock</th>
                  <th className="py-4 px-6">Location</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-center">Action Controls</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {displayData.map((item, index) => (
                  <tr key={index} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-black text-[#125ab2] text-sm">{item.sku}</span>
                        {item.isDG && <span className="bg-rose-100 text-rose-700 text-[8px] font-black px-1.5 py-0.5 rounded uppercase" title="Dangerous Goods">DG</span>}
                      </div>
                      <div className="font-semibold text-slate-600 truncate max-w-[250px]" title={item.name}>{item.name}</div>
                      <div className="text-[9px] text-slate-400 mt-1 uppercase font-bold">{item.category}</div>
                    </td>
                    
                    <td className="py-4 px-6">
                      <div className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded inline-block mb-1">{item.batch}</div>
                      <div>
                        {item.isSerialized ? (
                          <span onClick={() => handleViewSerials(item)} className="text-[9px] text-emerald-600 font-bold uppercase cursor-pointer hover:underline flex items-center gap-1">
                            <span>#️⃣</span> Serialized (Click to View)
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-400 font-bold uppercase">Lot Controlled Only</span>
                        )}
                      </div>
                    </td>
                    
                    <td className="py-4 px-6 text-right">
                      <div className="text-lg font-black text-slate-800">{item.qty.toLocaleString()}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">{item.uom}</div>
                    </td>
                    
                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-700">{item.location}</span>
                    </td>
                    
                    <td className="py-4 px-6 text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        item.status === 'Available' ? 'bg-emerald-100 text-emerald-700' :
                        item.status === 'QC Hold' ? 'bg-amber-100 text-amber-700 animate-pulse' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {item.qty === 0 ? 'Out of Stock' : item.status}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleViewBOM(item)} className="bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all shadow-sm">
                          View BOM
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoading && displayData.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400 font-bold">No components found matching your criteria.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          DYNAMIC MODALS (BOM & SERIAL TRACKING)
      ═══════════════════════════════════════════════════ */}

      {/* Modal 1: Bill of Materials (BOM) Explorer */}
      {modalBOM.isOpen && modalBOM.data && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-[600px] shadow-2xl flex flex-col border-t-4 border-[#125ab2] overflow-hidden">
            <div className="px-6 py-4 flex justify-between items-center bg-slate-50 border-b border-slate-100">
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider text-slate-800">Assembly Hierarchy (BOM)</h3>
                <p className="text-[10px] font-mono text-slate-500 mt-0.5">Target: {modalBOM.data.sku}</p>
              </div>
              <button onClick={() => setModalBOM({ isOpen: false, data: null })} className="text-slate-400 hover:text-slate-800 font-bold text-xl leading-none transition-colors">✕</button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Parent Component</p>
                <p className="font-black text-slate-800 text-lg leading-tight">{modalBOM.data.name}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Required Sub-Components (1 Unit Build)</p>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-4 font-bold text-slate-500">Component</th>
                        <th className="py-2 px-4 font-bold text-slate-500 text-right">Required Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-50">
                        <td className="py-3 px-4 font-semibold text-slate-700">Internal Housing Aluminum</td>
                        <td className="py-3 px-4 text-right font-mono font-bold">1 Pcs</td>
                      </tr>
                      <tr className="border-b border-slate-50">
                        <td className="py-3 px-4 font-semibold text-slate-700">Thermal Interface Material (TIM)</td>
                        <td className="py-3 px-4 text-right font-mono font-bold">0.5 Liters</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-semibold text-slate-700">High Voltage Contactors</td>
                        <td className="py-3 px-4 text-right font-mono font-bold">4 Pcs</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button onClick={() => setModalBOM({ isOpen: false, data: null })} className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 text-xs font-bold uppercase rounded-lg shadow-sm transition-colors">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Serial Number Tracking */}
      {modalSerial.isOpen && modalSerial.data && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-[500px] shadow-2xl flex flex-col border-t-4 border-emerald-500 overflow-hidden">
            <div className="px-6 py-4 flex justify-between items-center bg-slate-50 border-b border-slate-100">
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider text-slate-800">Serial Number Registry</h3>
                <p className="text-[10px] font-mono text-slate-500 mt-0.5">Batch: {modalSerial.data.batch}</p>
              </div>
              <button onClick={() => setModalSerial({ isOpen: false, data: null })} className="text-slate-400 hover:text-slate-800 font-bold text-xl leading-none transition-colors">✕</button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                <p className="font-bold text-slate-700 text-sm">{modalSerial.data.name}</p>
                <p className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">{modalSerial.data.qty} Scanned</p>
              </div>

              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {/* Simulated Serials */}
                {[...Array(Math.min(5, modalSerial.data.qty))].map((_, i) => {
                  const serial = `SN-${modalSerial.data.sku.split('-').pop()}-X90${i+1}`;
                  return (
                    <div key={i} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-lg hover:border-blue-300 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 text-lg">🏷️</span>
                        <span className="font-mono font-bold text-slate-800 text-sm">{serial}</span>
                      </div>
                      <button onClick={() => addToast(`Printing barcode label for ${serial}`, 'success')} className="text-[10px] font-bold text-blue-600 hover:underline uppercase">Print Label</button>
                    </div>
                  );
                })}
                {modalSerial.data.qty > 5 && (
                  <div className="p-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    ... And {(modalSerial.data.qty - 5).toLocaleString()} more serials.
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button onClick={() => setModalSerial({ isOpen: false, data: null })} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-5 py-2 text-xs font-bold uppercase rounded-lg shadow-sm transition-colors">Done</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default InventoryOverview;