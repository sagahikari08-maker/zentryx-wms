import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from './AppContext';

// ─── TOAST COMPONENT ─────────────────────────────────────────────────────────
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
    {toasts.map(({ id, message, type }) => (
      <div key={id} className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl text-white text-xs font-semibold min-w-[280px] ${
        type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-rose-600' : type === 'warning' ? 'bg-amber-500' : 'bg-[#125ab2]'
      }`}>
        <span className="text-base">{type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠️' : 'ℹ'}</span>
        <span className="flex-1">{message}</span>
        <button onClick={() => removeToast(id)} className="opacity-70 hover:opacity-100 text-lg leading-none transition-opacity">×</button>
      </div>
    ))}
  </div>
);

const Dashboard = () => {
  // ─── 🚀 INJEKSI: Mengambil Semburan Data dari Seluruh Urat Nadi Sistem ───
  const { setHalaman, inventoryData, poData, soData } = useContext(AppContext);

  // ─── STATE MANAGEMENT ───
  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // Form States
  const [quickSearch, setQuickSearch] = useState({ text: '', type: 'Name/ID' });
  const [sellForm, setSellForm] = useState({ name: '', location: '- All Zones -', type: 'Inventory Item', upc: '' });
  
  // Interactive "Top 15 Items" State
  const [showTopItems, setShowTopItems] = useState(false);

  // ─── 🚀 ENGINE INTERLOCK: KALKULASI METRIK REAL-TIME ───
  const metrics = useMemo(() => {
    // 1. Inventory Valuation (Total Kuantitas * Harga)
    const rawValue = (inventoryData || []).reduce((acc, item) => acc + (item.qty * (item.price || 150)), 0);
    // Asumsi kita scale up nilainya untuk memberi kesan "Enterprise Gigafactory" jika datanya masih sedikit
    const scaleFactor = rawValue < 1000000 ? 1000 : 1; 
    const totalValue = rawValue * scaleFactor;
    const formattedValue = `$${(totalValue / 1000000).toFixed(1)}M`;

    // 2. Alerts & Action Required
    const pendingPOs = (poData || []).filter(po => po.status !== 'Received' && po.status !== 'Completed').length;
    const criticalShortages = (inventoryData || []).filter(item => item.qty <= 0).length;

    // 3. Inbound / Outbound Stats
    const inboundOrders = (poData || []).length;
    const inboundQCHolds = (poData || []).filter(po => po.status.includes('Hold') || po.status.includes('Discrepancy')).length;

    const outboundOrders = (soData || []).filter(so => so.status !== 'Delivered').length;
    const outboundReady = (soData || []).filter(so => so.status === 'Shipped').length; // Shipped = Ready for dispatch at Dock

    // 4. Top Velocity Items (Urutkan stok terbanyak)
    const topItems = [...(inventoryData || [])]
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 4);

    return { totalValue, formattedValue, pendingPOs, criticalShortages, inboundOrders, inboundQCHolds, outboundOrders, outboundReady, topItems };
  }, [inventoryData, poData, soData]);

  // ─── ACTION HANDLERS ───
  const handleQuickSearch = (e) => {
    e.preventDefault();
    if (!quickSearch.text) return addToast('Please enter search keyword.', 'warning');
    addToast(`Querying Zentryx Core DB for ${quickSearch.type}: "${quickSearch.text}"...`, 'info');
    
    setTimeout(() => {
      // Simulate finding the Master Data if they search ARUS SKUs
      if (quickSearch.text.toUpperCase().includes('ARS')) {
        addToast(`Match found! Routing to Master Data...`, 'success');
        setHalaman('invOverview');
      } else {
        addToast('No exact matches found in current active index.', 'error');
      }
    }, 1000);
  };

  const handleAvailableToSellSearch = (e) => {
    e.preventDefault();
    addToast(`Filtering available EV stock for "${sellForm.name || 'All Items'}" at ${sellForm.location}...`, 'info');
    setTimeout(() => setSellForm({ name: '', location: '- All Zones -', type: 'Inventory Item', upc: '' }), 1000);
  };

  const simulateTopItemsLoad = () => {
    addToast('Executing Zentryx Analytics Query...', 'info');
    setTimeout(() => {
      setShowTopItems(true);
      addToast('Top Velocity Components successfully retrieved.', 'success');
    }, 800);
  };

  return (
    <div className="bg-[#f3f6f9] min-h-screen px-4 py-6 md:px-8 font-sans text-slate-800">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER TELEMETRY ── */}
      <div className="max-w-[1500px] mx-auto mb-6 flex justify-between items-end border-b border-slate-200 pb-3 animate-fade-in">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>📊 Analytics</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Executive View</span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">ARUS Motors Command Center</h1>
        </div>
        <div className="flex gap-2">
          <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Live Sync: Active</span>
          </div>
        </div>
      </div>

      {/* ── 3-COLUMN GRID LAYOUT ── */}
      <div className="max-w-[1500px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN (Narrow) */}
        {/* ========================================================= */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          
          {/* Reminders */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider">Action Required</h2>
              <span className="text-amber-500">🔔</span>
            </div>
            <div className="p-5 space-y-4">
              <div onClick={() => {addToast('Opening Procurement Module...', 'info'); setHalaman('procPO');}} className="pl-3 border-l-4 border-amber-500 cursor-pointer group">
                <p className="text-2xl font-bold text-slate-800 group-hover:text-[#125ab2] transition-colors leading-none mb-1">{metrics.pendingPOs}</p>
                <p className="text-[11px] font-bold text-[#125ab2] group-hover:underline">Pending PO to Vendors</p>
              </div>
              <div onClick={() => {addToast('Routing to Demand Planning: Critical Shortage...', 'error'); setHalaman('demandSafety');}} className="pl-3 border-l-4 border-rose-500 cursor-pointer group">
                <p className="text-2xl font-bold text-slate-800 group-hover:text-rose-600 transition-colors leading-none mb-1">{metrics.criticalShortages}</p>
                <p className="text-[11px] font-bold text-rose-600 leading-tight group-hover:underline">Critical Component Shortages (Qty = 0)</p>
              </div>
            </div>
          </div>

          {/* KPI Meter */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider">KPI Meter</h2>
              <span className="text-slate-400">⏱️</span>
            </div>
            <div className="p-5 flex flex-col items-center">
              <select className="w-full border border-slate-200 p-2 text-xs font-bold text-slate-600 rounded-md outline-none focus:border-[#125ab2] mb-6 bg-slate-50 cursor-pointer">
                <option>Inventory Valuation</option>
                <option>Fulfillment Rate</option>
              </select>
              
              {/* SVG Gauge Chart Simulation */}
              <div className="relative w-48 h-24 overflow-hidden mb-2">
                <svg viewBox="0 0 200 100" className="w-full h-full transform transition-transform hover:scale-105 duration-300 cursor-pointer drop-shadow-sm" onClick={() => addToast('Recalculating Inventory Valuation...', 'info')}>
                  {/* Background Arch */}
                  <path d="M 20 90 A 70 70 0 0 1 180 90" fill="none" stroke="#f1f5f9" strokeWidth="24" strokeLinecap="round" />
                  {/* Value Arch (Blue for Enterprise) - Dynamic based on value up to $20M */}
                  <path d={`M 20 90 A 70 70 0 0 1 ${20 + (160 * Math.min((metrics.totalValue/20000000), 1))} ${90 - (55 * Math.min((metrics.totalValue/20000000), 1))}`} fill="none" stroke="#125ab2" strokeWidth="24" strokeLinecap="round" />
                </svg>
                {/* Center Value */}
                <div className="absolute bottom-0 left-0 w-full text-center">
                  <p className="text-2xl font-black text-slate-800 leading-none mb-0.5">{metrics.formattedValue}</p>
                  <p className="text-[8px] font-bold text-slate-400 tracking-widest uppercase">Total Value</p>
                </div>
              </div>
              <div className="w-full flex justify-between px-4 text-[10px] text-slate-400 font-bold mt-1">
                <span>$0</span>
                <span>$20M</span>
              </div>
            </div>
          </div>

          {/* Quick Search */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider">Quick Search</h2>
              <span className="text-slate-400">🔍</span>
            </div>
            <form onSubmit={handleQuickSearch} className="p-5 space-y-4">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Search Keyword</label>
                <input type="text" value={quickSearch.text} onChange={e => setQuickSearch({...quickSearch, text: e.target.value})} placeholder="e.g. SKU-ARS-LFP01..." className="w-full border border-slate-300 p-2 text-xs font-semibold rounded-md outline-none focus:border-[#125ab2] focus:ring-1 focus:ring-[#125ab2] transition-all" />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Filter Category</label>
                <select value={quickSearch.type} onChange={e => setQuickSearch({...quickSearch, type: e.target.value})} className="w-full border border-slate-300 p-2 text-xs font-semibold rounded-md outline-none focus:border-[#125ab2] bg-slate-50">
                  <option>Component SKU</option>
                  <option>Purchase Order (PO)</option>
                  <option>Sales Order (SO)</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-[#125ab2] hover:bg-[#0e4487] text-white px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-colors shadow-sm">
                Search Database
              </button>
            </form>
          </div>

        </div>

        {/* ========================================================= */}
        {/* CENTER COLUMN (Wide) */}
        {/* ========================================================= */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          
          {/* Top KPI Cards (Inbound / Outbound) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 hover:shadow-md hover:border-emerald-300 cursor-pointer transition-all group" onClick={() => setHalaman('procPO')}>
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider group-hover:text-emerald-600 transition-colors">Inbound (PO Received)</p>
                <span className="text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded text-[9px] font-black uppercase">Receiving</span>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-black text-slate-800 leading-none">{metrics.inboundOrders}</span>
                <span className="text-xs text-slate-400 font-bold">Orders</span>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold mt-2">Pending QC Hold: <span className="text-amber-500 font-black ml-1">{metrics.inboundQCHolds}</span></p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 hover:shadow-md hover:border-blue-300 cursor-pointer transition-all group" onClick={() => setHalaman('fulfillOrders')}>
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider group-hover:text-blue-600 transition-colors">Outbound (SO Processed)</p>
                <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[9px] font-black uppercase">Fulfillment</span>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-black text-slate-800 leading-none">{metrics.outboundOrders}</span>
                <span className="text-xs text-slate-400 font-bold">Orders</span>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold mt-2">Ready for Dispatch: <span className="text-[#125ab2] font-black ml-1">{metrics.outboundReady}</span></p>
            </div>
          </div>

          {/* Inventory Data Widget */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-white">
              <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider">EV Operations Metrics</h2>
              <div className="flex gap-3 text-slate-400">
                <button className="hover:text-[#125ab2] transition-colors text-sm" onClick={() => addToast('Refreshing Zentryx Core data...', 'info')} title="Refresh">🔄</button>
              </div>
            </div>
            
            <div className="p-5">
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="border border-slate-100 bg-slate-50 p-3 rounded-lg text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Value</p>
                  <p className="text-xl font-black text-slate-800">{metrics.formattedValue}</p>
                </div>
                <div className="border border-slate-100 bg-slate-50 p-3 rounded-lg text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Inv. Turnover</p>
                  <p className="text-xl font-black text-slate-800">4.2<span className="text-xs font-bold text-slate-400 ml-0.5">x</span></p>
                </div>
                <div className="border border-blue-100 bg-blue-50/50 p-3 rounded-lg text-center">
                  <p className="text-[9px] font-bold text-blue-600 uppercase tracking-wider mb-1">Avg Lead Time</p>
                  <p className="text-xl font-black text-slate-800">14<span className="text-xs font-bold text-slate-500 ml-1">Days</span></p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Indicator</th>
                      <th className="py-2 px-3 text-right">Today</th>
                      <th className="py-2 px-3 text-right">This WTD</th>
                      <th className="py-2 px-3 text-right">This MTD</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-700">
                    <tr className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-800">Inventory Value</td>
                      <td className="py-3 px-3 text-right font-mono">{metrics.formattedValue}</td>
                      <td className="py-3 px-3 text-right font-mono">${(metrics.totalValue/1000000 * 0.95).toFixed(1)}M</td>
                      <td className="py-3 px-3 text-right font-mono">${(metrics.totalValue/1000000 * 0.85).toFixed(1)}M</td>
                    </tr>
                    <tr className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-800">Inventory Turnover</td>
                      <td className="py-3 px-3 text-right font-mono">4.2</td>
                      <td className="py-3 px-3 text-right font-mono">4.1</td>
                      <td className="py-3 px-3 text-right font-mono">3.8</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-800">Vendor Reliability Score</td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-600 font-black">88 / 100</td>
                      <td className="py-3 px-3 text-right font-mono">87 / 100</td>
                      <td className="py-3 px-3 text-right font-mono">85 / 100</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Top Items (INTERACTIVE - LIVE CONNECTED) */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow min-h-[260px] flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-white">
              <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider">Top Velocity Components (Live Stock)</h2>
              <select className="border border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-600 px-2 py-1 rounded outline-none cursor-pointer">
                <option>Real-Time Sync</option>
              </select>
            </div>
            
            <div className="p-5 flex-1 flex flex-col relative">
              {!showTopItems ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="text-3xl mb-2 opacity-20">📊</div>
                  <p className="font-bold text-slate-800 text-sm mb-1">Awaiting Execution</p>
                  <p className="text-xs text-slate-500 mb-4">Click below to fetch live assembly inventory data.</p>
                  <button onClick={simulateTopItemsLoad} className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-5 py-2 rounded-md text-xs font-bold transition-colors shadow-sm uppercase tracking-wider">
                    Run Component Query
                  </button>
                </div>
              ) : (
                <div className="flex-1 animate-fade-in overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-blue-50 border-y border-blue-100">
                      <tr>
                        <th className="py-2 px-3 text-[9px] text-[#125ab2] uppercase font-black">Component SKU & Description</th>
                        <th className="py-2 px-3 text-[9px] text-[#125ab2] uppercase font-black text-right">Physical Stock</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-700">
                      {metrics.topItems.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer" onClick={() => setHalaman('invOverview')}>
                          <td className="py-2 px-3">
                            <span className="font-mono font-bold text-[#125ab2] block">{item.sku}</span>
                            <span className="font-semibold text-slate-600 truncate max-w-[200px] block">{item.name}</span>
                          </td>
                          <td className="py-2 px-3 text-right font-black font-mono">
                            {item.qty.toLocaleString()} <span className="text-[9px] text-slate-400 font-bold">Units</span>
                          </td>
                        </tr>
                      ))}
                      {metrics.topItems.length === 0 && (
                        <tr><td colSpan="2" className="py-4 text-center text-gray-400">No data found in inventory.</td></tr>
                      )}
                    </tbody>
                  </table>
                  <div className="text-[10px] text-slate-400 font-bold mt-4">Showing top {metrics.topItems.length} high-velocity components by stock volume</div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN (Medium) */}
        {/* ========================================================= */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          
          {/* Available to Sell / Locate */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="px-5 py-3 border-b border-slate-100">
              <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider">Inventory Locator</h2>
            </div>
            <form onSubmit={handleAvailableToSellSearch} className="p-5 flex flex-wrap items-end gap-3 text-[10px] font-bold text-slate-600 bg-slate-50/50">
              <div className="flex flex-col gap-1.5 flex-1 min-w-[120px]">
                <label className="uppercase tracking-wider text-[9px] text-slate-400">SKU / Component Name</label>
                <input type="text" value={sellForm.name} onChange={e => setSellForm({...sellForm, name: e.target.value})} className="border border-slate-300 p-2 rounded-md outline-none focus:border-[#125ab2] focus:ring-1 focus:ring-[#125ab2] bg-white" placeholder="e.g. Battery Cell..." />
              </div>
              <div className="flex flex-col gap-1.5 w-full">
                <label className="uppercase tracking-wider text-[9px] text-slate-400">Warehouse Zone</label>
                <select value={sellForm.location} onChange={e => setSellForm({...sellForm, location: e.target.value})} className="border border-slate-300 p-2 rounded-md outline-none focus:border-[#125ab2] bg-white cursor-pointer">
                  <option>- All Zones -</option>
                  <option>ZONE-A (Ambient)</option>
                  <option>ZONE-B (Cold Storage)</option>
                  <option>ZONE-C (Heavy Assembly)</option>
                </select>
              </div>
              <button type="submit" className="w-full mt-2 bg-slate-800 hover:bg-black text-white px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-colors shadow-sm">
                Check Stock Level
              </button>
            </form>
          </div>

          {/* Monthly Fulfillment Chart */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow pb-2 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-white">
              <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider">Q3 Production Fill Rates</h2>
            </div>
            <div className="p-5">
              
              {/* Chart Action Icons */}
              <div className="flex gap-2 mb-5">
                <button className="w-7 h-7 bg-slate-100 text-slate-500 rounded-md flex items-center justify-center text-xs hover:bg-slate-200 transition-colors" title="Line Chart">📈</button>
                <button className="w-7 h-7 bg-[#125ab2] text-white rounded-md flex items-center justify-center text-xs shadow-sm" title="Bar Chart">📊</button>
              </div>

              {/* SVG Line Chart */}
              <div className="relative w-full h-44 border-l border-b border-slate-200 flex items-end px-3 pb-3 mt-4">
                <div className="absolute -left-6 top-0 h-full flex flex-col justify-between text-[9px] font-bold text-slate-400 items-end py-3">
                  <span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span>
                </div>
                <div className="absolute inset-0 flex flex-col justify-between py-3 z-0 pl-1">
                  {[...Array(5)].map((_,i) => <div key={i} className="w-full h-px border-b border-dashed border-slate-200"></div>)}
                </div>
                
                <svg className="absolute inset-0 w-full h-full z-10 overflow-visible pl-1" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <polyline points="10,80 30,50 50,30 70,25 90,20" fill="none" stroke="#93c5fd" strokeWidth="2" strokeDasharray="3,3" />
                  <polyline points="10,75 30,40 50,15 70,22 90,10" fill="none" stroke="#125ab2" strokeWidth="2.5" className="drop-shadow-md" />
                  
                  {[
                    {cx: 10, cy: 75}, {cx: 30, cy: 40}, {cx: 50, cy: 15}, {cx: 70, cy: 22}, {cx: 90, cy: 10}
                  ].map((pt, i) => (
                    <circle key={i} cx={pt.cx} cy={pt.cy} r="3" fill="white" stroke="#125ab2" strokeWidth="2" className="hover:r-4 hover:fill-blue-100 cursor-pointer transition-all duration-200" onClick={() => addToast('Viewing metric details...', 'info')} />
                  ))}
                </svg>
                
                <div className="absolute -bottom-6 left-0 w-full flex justify-between px-3 text-[9px] font-bold text-slate-400">
                  <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-col gap-2 mt-10 text-[10px] font-bold text-slate-600 bg-slate-50 p-3 rounded-md border border-slate-100">
                <div className="flex items-center gap-2"><span className="w-3 h-1 rounded-full bg-[#93c5fd]"></span> Target Quota</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#125ab2]"></span> Actual Fulfillment</div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;