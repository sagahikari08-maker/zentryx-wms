import React, { useContext, useMemo } from 'react';
import { AppContext } from './AppContext';

const Dashboard = () => {
  const { inventoryData, soData, poData, bahasa } = useContext(AppContext);

  // ─── ENGINE INTERLOCK: KALKULASI DATA DINAMIS ───

  // 1. Low Stock Alerts (Membaca dari Global Inventory)
  const lowStockAlerts = useMemo(() => {
    return (inventoryData || [])
      .filter(item => item.qty < 500 && item.qty > 0) // Ambang batas low stock
      .sort((a, b) => a.qty - b.qty)
      .slice(0, 4);
  }, [inventoryData]);

  // 2. Late Shipments / Pending Fulfillment (Membaca dari Global SO)
  const lateShipments = useMemo(() => {
    return (soData || [])
      .filter(so => so.status !== 'Shipped' && so.status !== 'Delivered')
      .slice(0, 4);
  }, [soData]);

  // 3. Dock-to-Stock Time (Mock logic based on PO)
  const avgDockToStock = useMemo(() => {
    const receivedPOs = (poData || []).filter(po => po.status === 'Received');
    // Jika banyak PO selesai, waktu dock-to-stock turun (efisien)
    const baseTimeHours = 24; 
    const time = Math.max(4, baseTimeHours - (receivedPOs.length * 2)); 
    return time;
  }, [poData]);

  // 4. KPI Calculations
  const kpis = useMemo(() => {
    const totalSO = (soData || []).length || 1;
    const completedSO = (soData || []).filter(s => s.status === 'Shipped' || s.status === 'Delivered').length;
    
    return {
      inventoryAccuracy: 98.7, // Biasa didapat dari Cycle Count variance
      onTimeDelivery: ((completedSO / totalSO) * 100).toFixed(1),
      orderFillRate: 94.2,
      inventoryTurns: 8.5,
      backorderRate: (((totalSO - completedSO) / totalSO) * 100).toFixed(1)
    };
  }, [soData]);

  // ─── SVG CHART HELPERS ───
  // Membuat garis grafik dinamis menggunakan SVG Polygon murni
  const generateLineChart = (dataArray, color, fillOpacity) => {
    const max = Math.max(...dataArray) * 1.1; // 10% padding atas
    const min = Math.min(...dataArray) * 0.9;
    const range = max - min || 1;
    
    const points = dataArray.map((val, i) => {
      const x = (i / (dataArray.length - 1)) * 100;
      const y = 100 - (((val - min) / range) * 100);
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg viewBox="0 -10 100 120" className="w-full h-full overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={fillOpacity} />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`0,100 ${points} 100,100`} fill={`url(#grad-${color.replace('#', '')})`} />
        <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Render dots */}
        {dataArray.map((val, i) => {
          const x = (i / (dataArray.length - 1)) * 100;
          const y = 100 - (((val - min) / range) * 100);
          return (
            <g key={i} className="group cursor-pointer">
              <circle cx={x} cy={y} r="2.5" fill="white" stroke={color} strokeWidth="1.5" className="transition-all duration-300 group-hover:r-4" />
              <text x={x} y={y - 8} fontSize="4" fill="#64748b" textAnchor="middle" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-bold">{val}</text>
            </g>
          );
        })}
      </svg>
    );
  };

  // Dummy Chart Data for Trends
  const fillRateData = [88, 89, 90, 89, 91, 93, 92, 94, 94, 95, 94.2, 96]; // 12 weeks
  const otifData = [91, 92, 90, 94, 95, 96.5]; // 6 months
  const invLevelData = [4.2, 4.5, 4.3, 4.8, 5.1, 5.0, 4.9, 5.2, 5.5, 5.4, 5.8, 6.1]; // 12 months (in Millions $)
  
  // Bar Chart Data (Current Week Backorders)
  const backorderSkus = [
    { sku: 'MCU03', qty: 120 },
    { sku: 'LFP01', qty: 85 },
    { sku: 'CHZ04', qty: 40 },
    { sku: 'SNT01', qty: 30 },
    { sku: 'CBL12', qty: 15 }
  ];
  const maxBackorder = Math.max(...backorderSkus.map(b => b.qty));

  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 animate-fade-in font-sans">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>📈 Analytics</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Executive View</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide">
            {bahasa === 'en' ? 'Supply Chain & Fulfillment Command' : 'Pusat Komando Rantai Pasok'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">Real-time macro telemetry of factory fulfillment, accuracy, and supply chain health.</p>
        </div>
        <div className="flex gap-2">
           <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-sm text-[11px] font-bold shadow-sm uppercase tracking-wider hover:bg-gray-50 transition-colors">
            Export Executive Report
          </button>
        </div>
      </div>
    
      {/* ── SUBGRAPH: KPI TILES (5 Metrics) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-5 border-t-4 border-t-[#125ab2] shadow-sm rounded-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Inventory Accuracy</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-black text-gray-900">{kpis.inventoryAccuracy}</span>
            <span className="text-sm font-bold text-gray-500">%</span>
          </div>
          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-sm w-max mt-2 border border-emerald-100">+0.2% vs Last Month</span>
        </div>

        <div className="bg-white p-5 border-t-4 border-t-emerald-500 shadow-sm rounded-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">On-Time Delivery</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-black text-gray-900">{kpis.onTimeDelivery}</span>
            <span className="text-sm font-bold text-gray-500">%</span>
          </div>
          <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-sm w-max mt-2 border border-gray-200">Target: &gt;95.0%</span>
        </div>

        <div className="bg-white p-5 border-t-4 border-t-blue-400 shadow-sm rounded-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Order Fill Rate</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-black text-gray-900">{kpis.orderFillRate}</span>
            <span className="text-sm font-bold text-gray-500">%</span>
          </div>
          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-sm w-max mt-2 border border-emerald-100">+1.5% vs Last Week</span>
        </div>

        <div className="bg-white p-5 border-t-4 border-t-purple-500 shadow-sm rounded-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Inventory Turns</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-black text-gray-900">{kpis.inventoryTurns}</span>
            <span className="text-sm font-bold text-gray-500">x</span>
          </div>
          <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-sm w-max mt-2 border border-purple-200">Annualized Velocity</span>
        </div>

        <div className="bg-white p-5 border-t-4 border-t-red-500 shadow-sm rounded-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Backorder Rate</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-black text-red-600">{kpis.backorderRate}</span>
            <span className="text-sm font-bold text-red-400">%</span>
          </div>
          <span className="text-[9px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-sm w-max mt-2 border border-red-200 animate-pulse">Action Required</span>
        </div>
      </div>

      {/* ── SUBGRAPH: TREND CHARTS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        
        {/* T1: Line Chart: Fill Rate */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-sm p-5 flex flex-col h-64 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[11px] font-black text-gray-700 uppercase tracking-wider">Fill Rate Trend</h3>
            <span className="text-[9px] text-gray-400 font-bold uppercase">12 Weeks</span>
          </div>
          <div className="flex-1 relative w-full px-2">
            {generateLineChart(fillRateData, '#10b981', '0.15')}
          </div>
          <div className="flex justify-between text-[9px] font-bold text-gray-400 mt-4 border-t border-gray-100 pt-2">
            <span>Wk 1</span><span>Wk 6</span><span>Wk 12</span>
          </div>
        </div>

        {/* T2: Line Chart: OTIF */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-sm p-5 flex flex-col h-64 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[11px] font-black text-gray-700 uppercase tracking-wider">OTIF Performance</h3>
            <span className="text-[9px] text-gray-400 font-bold uppercase">6 Months</span>
          </div>
          <div className="flex-1 relative w-full px-2">
            {generateLineChart(otifData, '#125ab2', '0.15')}
          </div>
          <div className="flex justify-between text-[9px] font-bold text-gray-400 mt-4 border-t border-gray-100 pt-2">
            <span>M1</span><span>M3</span><span>Current</span>
          </div>
        </div>

        {/* T3: Line Chart: Inventory Level */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-sm p-5 flex flex-col h-64 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[11px] font-black text-gray-700 uppercase tracking-wider">Inventory Level</h3>
            <span className="text-[9px] text-gray-400 font-bold uppercase">$ Millions</span>
          </div>
          <div className="flex-1 relative w-full px-2">
            {generateLineChart(invLevelData, '#8b5cf6', '0.15')}
          </div>
          <div className="flex justify-between text-[9px] font-bold text-gray-400 mt-4 border-t border-gray-100 pt-2">
            <span>Q1</span><span>Q2</span><span>Q3</span><span>Q4</span>
          </div>
        </div>

        {/* T4: Bar Chart: Backorders by SKU */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-sm p-5 flex flex-col h-64 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[11px] font-black text-gray-700 uppercase tracking-wider">Backorders by SKU</h3>
            <span className="text-[9px] text-gray-400 font-bold uppercase">Units (WTD)</span>
          </div>
          <div className="flex-1 flex items-end justify-around gap-2 pt-2 border-b border-gray-100 pb-2">
            {backorderSkus.map((item, idx) => {
              const heightPct = (item.qty / maxBackorder) * 100;
              return (
                <div key={idx} className="flex flex-col items-center w-full group h-full justify-end">
                  <span className="text-[9px] font-black text-red-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">{item.qty}</span>
                  <div 
                    className="w-full max-w-[20px] bg-red-400 rounded-t-sm transition-all duration-500 ease-out group-hover:bg-red-500 shadow-sm" 
                    style={{ height: `${heightPct}%`, minHeight: '5%' }}
                  ></div>
                </div>
              )
            })}
          </div>
          <div className="flex justify-around text-[8px] font-bold text-gray-500 mt-2">
             {backorderSkus.map((item, idx) => (
                <span key={idx} className="truncate w-full text-center" title={item.sku}>{item.sku}</span>
             ))}
          </div>
        </div>

      </div>

      {/* ── SUBGRAPH: ALERTS / EXCEPTIONS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* A1: Late Shipments List */}
        <div className="bg-white border border-red-200 shadow-sm rounded-sm flex flex-col overflow-hidden hover:shadow-md transition-shadow">
          <div className="bg-red-50 border-b border-red-100 px-5 py-3.5 flex justify-between items-center">
            <h3 className="text-[11px] font-black text-red-800 uppercase tracking-wider flex items-center gap-2">
              <span className="text-sm">🚨</span> Late Shipments (&gt; SLA)
            </h3>
            <span className="text-[9px] font-black bg-red-200 text-red-800 px-2 py-0.5 rounded-sm">{lateShipments.length} Active</span>
          </div>
          <div className="p-0 flex-1 overflow-y-auto">
            {lateShipments.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {lateShipments.map((so, i) => (
                  <li key={i} className="p-3.5 flex justify-between items-center hover:bg-red-50/50 transition-colors">
                    <div>
                      <p className="text-xs font-bold text-[#125ab2] cursor-pointer hover:underline">{so.id || `SO-ARS-ERR0${i}`}</p>
                      <p className="text-[10px] text-gray-500 font-semibold truncate w-40 mt-0.5">{so.customer || 'Priority Dealership'}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] font-black uppercase bg-red-100 text-red-700 px-2 py-0.5 rounded-sm border border-red-200">{so.status}</span>
                      <p className="text-[9px] text-red-600 font-bold mt-1.5 flex items-center justify-end gap-1"><span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span> SLA Breached</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-gray-400 text-xs font-bold flex flex-col items-center">
                <span className="text-3xl mb-2 opacity-30">✅</span>
                No late shipments detected. All SLAs met.
              </div>
            )}
          </div>
        </div>

        {/* A2: Low Stock Alerts */}
        <div className="bg-white border border-amber-200 shadow-sm rounded-sm flex flex-col overflow-hidden hover:shadow-md transition-shadow">
          <div className="bg-amber-50 border-b border-amber-100 px-5 py-3.5 flex justify-between items-center">
            <h3 className="text-[11px] font-black text-amber-800 uppercase tracking-wider flex items-center gap-2">
              <span className="text-sm">⚠️</span> Low Stock Alerts
            </h3>
            <span className="text-[9px] font-black bg-amber-200 text-amber-800 px-2 py-0.5 rounded-sm">{lowStockAlerts.length} SKUs</span>
          </div>
          <div className="p-0 flex-1 overflow-y-auto">
            {lowStockAlerts.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {lowStockAlerts.map((item, idx) => (
                  <li key={idx} className="p-3.5 flex justify-between items-center hover:bg-amber-50/50 transition-colors">
                    <div>
                      <p className="text-xs font-bold text-gray-800 cursor-pointer hover:text-[#125ab2]">{item.sku}</p>
                      <p className="text-[10px] text-gray-500 font-semibold truncate w-40 mt-0.5">{item.name}</p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                       <span className="text-xs font-black text-amber-600">{item.qty} <span className="text-[8px] text-gray-400 uppercase tracking-widest">Units</span></span>
                       <div className="w-16 h-1.5 bg-gray-200 rounded-full mt-1.5 overflow-hidden shadow-inner">
                         <div className="h-full bg-amber-500" style={{ width: `${(item.qty / 500) * 100}%` }}></div>
                       </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-gray-400 text-xs font-bold flex flex-col items-center">
                <span className="text-3xl mb-2 opacity-30">📦</span>
                Inventory levels optimal. No shortages.
              </div>
            )}
          </div>
        </div>

        {/* A3: Gauge: Avg Dock-to-Stock Time */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-sm p-6 flex flex-col items-center justify-center hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#125ab2]"></div>
          <div className="w-full flex justify-between items-center mb-8">
            <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-wider">Avg Dock-to-Stock</h3>
            <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded border border-gray-200 font-bold uppercase tracking-widest">Hours</span>
          </div>
          
          {/* Half-Circle Gauge SVG */}
          <div className="relative w-56 h-28 overflow-hidden mb-4">
            <svg viewBox="0 0 100 50" className="w-full h-full drop-shadow-sm">
              {/* Background Arc */}
              <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#f1f5f9" strokeWidth="12" strokeLinecap="round" />
              {/* Value Arc (Color depends on speed. < 12 hrs = green, < 24 = amber, > 24 = red) */}
              <path 
                d="M 10 50 A 40 40 0 0 1 90 50" 
                fill="none" 
                stroke={avgDockToStock <= 12 ? '#10b981' : avgDockToStock <= 24 ? '#f59e0b' : '#ef4444'} 
                strokeWidth="12" 
                strokeLinecap="round" 
                strokeDasharray="125.6" 
                strokeDashoffset={125.6 - (125.6 * (Math.min(avgDockToStock, 48) / 48))} 
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
              <span className="text-4xl font-black text-gray-800 leading-none">{avgDockToStock}</span>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Hours Avg</span>
            </div>
          </div>
          
          <div className="bg-gray-50 border border-gray-100 p-3 rounded-sm w-full text-center mt-2">
             <p className="text-[10px] text-gray-500 font-semibold leading-relaxed">
               Target SLA is <strong className="text-gray-800">&lt; 12 Hours</strong>.<br/>
               Performance: {avgDockToStock <= 12 ? <span className="text-emerald-600 font-black uppercase tracking-wider">Optimal</span> : <span className="text-amber-600 font-black uppercase tracking-wider">Below Target</span>}
             </p>
          </div>
        </div>

      </div>

    </main>
  );
};

export default Dashboard;