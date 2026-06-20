import React, { useContext } from 'react';
import { AppContext } from './AppContext';

const NavBar = () => {
  const { teks, halaman, setHalaman } = useContext(AppContext);

  // ─── 🚀 PINTAR: KOMPONEN LINK UNTUK MENDUKUNG "NEW TAB" ───
  const NavLink = ({ to, className, children, title }) => (
    <a 
      href={`#${to}`}
      title={title}
      className={className || "px-4 py-2 block hover:bg-[#415a77] hover:text-white transition-colors"}
      onClick={(e) => {
        // Biarkan browser mengeksekusi jika user klik tengah (scroll wheel) atau Ctrl+Click
        if (e.ctrlKey || e.metaKey || e.button === 1) return;
        // Jika klik kiri biasa, ubah state tanpa reload layar
        e.preventDefault();
        setHalaman?.(to);
      }}
    >
      {children}
    </a>
  );

  return (
    <nav className="bg-[#415a77] text-white flex flex-wrap items-center px-4 shadow-md relative z-50">
      
      <NavLink 
        to="dashboard" 
        className={`px-4 py-2 transition-colors ${halaman === 'dashboard' ? 'bg-[#2d425b]' : 'hover:bg-[#2d425b]'}`}
        title="Back to Dashboard"
      >
        🏠
      </NavLink>
      
      {/* --- MENU ACTIVITIES --- */}
      <div className="relative group/activities">
        <div className="px-3 py-2 text-[13px] font-semibold cursor-default whitespace-nowrap hover:bg-[#2d425b] transition-colors">
          {teks?.menuActivities || 'Activities'}
        </div>
        <div className="absolute left-0 top-full w-[200px] bg-[#f3f6f9] border border-gray-300 shadow-xl hidden group-hover/activities:block text-gray-700 text-[13px] py-1 z-50">
          <NavLink to="tasks">{teks?.dropTasks || 'Tasks'}</NavLink>
          <NavLink to="events">{teks?.dropEvents || 'Events'}</NavLink>
          <NavLink to="calls">{teks?.dropCalls || 'Calls'}</NavLink>
          <NavLink to="calendar">{teks?.dropCalendar || 'Calendar'}</NavLink>
        </div>
      </div>

      {/* --- MENU SHIPPING --- */}
      <div className="relative group/shipping">
        <div className="px-3 py-2 text-[13px] font-semibold cursor-default whitespace-nowrap hover:bg-[#2d425b] transition-colors">
          {teks?.menuShipping || 'Shipping'}
        </div>
        <div className="absolute left-0 top-full w-[220px] bg-[#f3f6f9] border border-gray-300 shadow-xl hidden group-hover/shipping:block text-gray-700 text-[13px] py-1 z-50">
          <NavLink to="fulfillOrders">{teks?.dropFulfill || 'Fulfill Orders'}</NavLink>
          <NavLink to="pickpack">{teks?.dropPickPack || 'Pick, Pack, & Ship'}</NavLink>
          <NavLink to="manifests">{teks?.dropManifests || 'Shipping Manifests'}</NavLink>
        </div>
      </div>

      {/* --- MENU RECEIVING --- */}
      <div className="relative group/receiving">
        <div className="px-3 py-2 text-[13px] font-semibold cursor-default whitespace-nowrap hover:bg-[#2d425b] transition-colors">
          {teks?.menuReceiving || 'Receiving'}
        </div>
        <div className="absolute left-0 top-full w-[220px] bg-[#f3f6f9] border border-gray-300 shadow-xl hidden group-hover/receiving:block text-gray-700 text-[13px] py-1 z-50">
          <NavLink to="receivePO">{teks?.dropReceivePO || 'Receive Purchase Orders'}</NavLink>
          <NavLink to="inbound">{teks?.dropInbound || 'Inbound Shipments'}</NavLink>
          <NavLink to="qc">{teks?.dropQC || 'Quality Control'}</NavLink>
          <NavLink to="putaway">{teks?.dropPutaway || 'Putaway'}</NavLink>
        </div>
      </div>

      {/* --- MENU INVENTORY --- */}
      <div className="relative group/inventory">
        <div className={`px-3 py-2 text-[13px] font-semibold cursor-default whitespace-nowrap transition-colors ${['invOverview', 'adjustments', 'transfers', 'cycleCounts', 'bom', 'workOrders', 'assemblyBuilds', 'newItem', 'itemSearch', 'uom', 'bins', 'shippingItems', 'locations', 'landedCost'].includes(halaman) ? 'bg-[#2d425b]' : 'hover:bg-[#2d425b]'}`}>
          {teks?.menuInventory || 'Inventory'}
        </div>
        
        <div className="absolute left-0 top-full w-[260px] bg-[#f3f6f9] border border-gray-300 shadow-xl hidden group-hover/inventory:block text-gray-700 text-[13px] py-1 z-50">
          
          <NavLink to="invOverview">{teks?.dropInvOverview || 'Inventory Overview'}</NavLink>
          <div className="border-t border-gray-200 my-1"></div>
          
          <div className="px-4 py-1.5 font-bold text-[10px] text-[#125ab2] uppercase tracking-wider">Transactions</div>
          <NavLink to="adjustments">Inventory Adjustments</NavLink>
          <NavLink to="transfers">Bin Transfers</NavLink>
          <NavLink to="cycleCounts">Cycle Counts (Opname)</NavLink>

          <div className="border-t border-gray-200 my-1"></div>

          <div className="relative" onMouseEnter={(e) => e.currentTarget.lastElementChild.style.display = 'block'} onMouseLeave={(e) => e.currentTarget.lastElementChild.style.display = 'none'}>
            <div className="px-4 py-2 hover:bg-blue-100 hover:text-[#125ab2] cursor-default flex justify-between items-center transition-colors font-semibold">
              {teks?.dropMfg || 'Manufacturing'} <span className="text-gray-400 font-bold">›</span>
            </div>
            <div className="absolute left-[100%] top-[-50px] w-[240px] bg-[#f3f6f9] border border-gray-300 shadow-xl py-1 z-[99]" style={{ display: 'none' }}>
              <NavLink to="bom">Bill of Materials (BOM)</NavLink>
              <NavLink to="workOrders">Work Orders</NavLink>
              <NavLink to="assemblyBuilds">Assembly Builds</NavLink>
            </div>
          </div>

          <div className="relative" onMouseEnter={(e) => e.currentTarget.lastElementChild.style.display = 'block'} onMouseLeave={(e) => e.currentTarget.lastElementChild.style.display = 'none'}>
            <div className="px-4 py-2 hover:bg-blue-100 hover:text-[#125ab2] cursor-default flex justify-between items-center transition-colors font-semibold">
              {teks?.dropLists || 'Lists & Master Data'} <span className="text-gray-400 font-bold">›</span>
            </div>
            <div className="absolute left-[100%] top-[-100px] w-[260px] bg-[#f3f6f9] border border-gray-300 shadow-xl py-1 z-[99]" style={{ display: 'none' }}>
              <div className="px-4 py-1.5 font-bold text-[10px] text-[#125ab2] uppercase tracking-wider">Item Management</div>
              <NavLink to="newItem">{teks?.dropNew || 'Create New Item'}</NavLink>
              <NavLink to="itemSearch">{teks?.dropSearch || 'Item Search'}</NavLink>
              <NavLink to="uom">Units of Measure (UOM)</NavLink>
              <NavLink to="landedCost">Landed Cost Templates</NavLink>
              
              <div className="border-t border-gray-200 my-1"></div>
              <div className="px-4 py-1.5 font-bold text-[10px] text-[#125ab2] uppercase tracking-wider">Logistics & Infrastructure</div>
              <NavLink to="locations">Warehouse Locations</NavLink>
              <NavLink to="bins">Bin Coordinates Directory</NavLink>
              <NavLink to="shippingItems">Shipping & Carriers</NavLink>
            </div>
          </div>
        </div>
      </div>

      {/* --- MENU REPORTS --- */}
      <div className="relative group/reports">
        <div className={`px-3 py-2 text-[13px] font-semibold cursor-default whitespace-nowrap transition-colors ${['dailyLogistics', 'valuation', 'shippingReceivingLogs', 'carrierPerformance', 'workforceProductivity', 'capacityUtilization', 'inventoryReports', 'aging'].includes(halaman) ? 'bg-[#2d425b]' : 'hover:bg-[#2d425b]'}`}>
          {teks?.menuReports || 'Reports'}
        </div>
        <div className="absolute left-0 top-full w-[260px] bg-[#f3f6f9] border border-gray-300 shadow-xl hidden group-hover/reports:block text-gray-700 text-[13px] py-1 z-50">
          
          <div className="px-4 py-1.5 font-bold text-[10px] text-[#125ab2] uppercase tracking-wider mt-1">Inventory & Stock</div>
          <NavLink to="inventoryReports">Inventory Performance</NavLink>
          <NavLink to="aging">Stock Shelf-Life / Expiry</NavLink>
          
          <div className="border-t border-gray-200 my-1"></div>
          
          <div className="px-4 py-1.5 font-bold text-[10px] text-[#125ab2] uppercase tracking-wider">Operational Reports</div>
          <NavLink to="dailyLogistics">Daily Logistics Report</NavLink>
          <NavLink to="shippingReceivingLogs">Shipping & Receiving Logs</NavLink>
          
          <div className="border-t border-gray-200 my-1"></div>
          
          <div className="px-4 py-1.5 font-bold text-[10px] text-[#125ab2] uppercase tracking-wider">Financial & Metrics</div>
          <NavLink to="valuation">Inventory Valuation</NavLink>
          <NavLink to="carrierPerformance">Carrier Performance Matrix</NavLink>
          <NavLink to="workforceProductivity">Workforce Productivity KPI</NavLink>
          <NavLink to="capacityUtilization">Space & Capacity Utilization</NavLink>
        </div>
      </div>

      {/* --- MENU ANALYTICS --- */}
      <div className="relative group/analytics">
        <div className={`px-3 py-2 text-[13px] font-semibold cursor-default whitespace-nowrap transition-colors ${['supplyChainDashboard', 'fillRateAnalysis', 'costAnalysis'].includes(halaman) ? 'bg-[#2d425b]' : 'hover:bg-[#2d425b]'}`}>
          {teks?.menuAnalytics || 'Analytics'}
        </div>
        <div className="absolute left-0 top-full w-[240px] bg-[#f3f6f9] border border-gray-300 shadow-xl hidden group-hover/analytics:block text-gray-700 text-[13px] py-1 z-50">
          <NavLink to="supplyChainDashboard">Supply Chain Command Center</NavLink>
          <NavLink to="fillRateAnalysis">Fill Rate & Shortage Diagnostics</NavLink>
          <NavLink to="costAnalysis">Micro-Costing & Yield Forensics</NavLink>
        </div>
      </div>

      {/* --- MENU OPERATIONS & DOCS --- */}
      <div className="relative group/operations">
        <div className={`px-3 py-2 text-[13px] font-semibold cursor-default whitespace-nowrap transition-colors ${['doc_bol', 'doc_packing', 'doc_invoice', 'doc_compliance', 'dockSchedule', 'dockScheduling', 'shiftRoster', 'maintenance', 'engineeringMRO', 'returnsRma', 'safetyIncidents', 'scanner'].includes(halaman) ? 'bg-[#2d425b]' : 'hover:bg-[#2d425b]'}`}>
          Operations & Docs
        </div>
        <div className="absolute left-0 top-full w-[260px] bg-[#f3f6f9] border border-gray-300 shadow-xl hidden group-hover/operations:block text-gray-700 text-[13px] py-1 z-50">
          
          <div className="px-4 py-1.5 font-bold text-[10px] text-gray-400 uppercase tracking-wider">Schedule & Workforce</div>
          <NavLink to="dockScheduling">Dock Scheduling & Yard</NavLink>
          <NavLink to="shiftRoster">Workforce Shift Roster</NavLink>
          
          <div className="border-t border-gray-200 my-1"></div>
          <div className="px-4 py-1.5 font-bold text-[10px] text-gray-400 uppercase tracking-wider">Reverse & Safety</div>
          <NavLink to="returnsRma">Reverse Logistics & RMAs</NavLink>
          <NavLink to="safetyIncidents">HSE & Safety Incidents</NavLink>
          
          <div className="border-t border-gray-200 my-1"></div>
          <div className="px-4 py-1.5 font-bold text-[10px] text-gray-400 uppercase tracking-wider">Engineering & MRO</div>
          <NavLink to="maintenance">MRO Predictive Maintenance</NavLink>
          <NavLink to="engineeringMRO">Engineering MRO Inventory</NavLink>

          <div className="relative" onMouseEnter={(e) => e.currentTarget.lastElementChild.style.display = 'block'} onMouseLeave={(e) => e.currentTarget.lastElementChild.style.display = 'none'}>
            <div className="border-t border-gray-200 my-1"></div>
            <div className="px-4 py-2 hover:bg-blue-100 hover:text-[#125ab2] cursor-default flex justify-between items-center transition-colors font-semibold">
              Document Center <span className="text-gray-400 font-bold">›</span>
            </div>
            <div className="absolute left-[100%] bottom-0 w-[240px] bg-[#f3f6f9] border border-gray-300 shadow-xl py-1 z-[99]" style={{ display: 'none' }}>
              <NavLink to="doc_bol">Bill of Lading (BOL)</NavLink>
              <NavLink to="doc_packing">Packing Slips</NavLink>
              <NavLink to="doc_invoice">Commercial Invoices</NavLink>
              <NavLink to="doc_compliance">Compliance Config</NavLink>
            </div>
          </div>
        </div>
      </div>

      {/* --- DIRECT LINKS --- */}
      <NavLink to="procRequisitions" className={`px-3 py-2 text-[13px] font-semibold whitespace-nowrap transition-colors ${halaman?.startsWith?.('proc') ? 'bg-[#2d425b]' : 'hover:bg-[#2d425b]'}`}>
        {teks?.menuProcurement || 'Procurement'}
      </NavLink>

      <NavLink to="demandPlans" className={`px-3 py-2 text-[13px] font-semibold whitespace-nowrap transition-colors ${halaman?.startsWith?.('demand') ? 'bg-[#2d425b]' : 'hover:bg-[#2d425b]'}`}>
        {teks?.menuDemand || 'Demand Planning'}
      </NavLink>  

      <NavLink to="setupCompany" className={`px-3 py-2 text-[13px] font-semibold whitespace-nowrap transition-colors ${halaman?.startsWith?.('setup') || halaman?.startsWith?.('apps') ? 'bg-[#2d425b]' : 'hover:bg-[#2d425b]'}`}>
        Setup & Integrations
      </NavLink>

      <NavLink to="scanner" className={`px-3 py-2 text-[13px] font-black whitespace-nowrap text-emerald-400 transition-colors ${halaman === 'scanner' ? 'bg-[#2d425b]' : 'hover:bg-[#2d425b]'}`} title="Buka Simulasi Scanner Lapangan">
        📱 SCANNER UI
      </NavLink>

      <NavLink to="helpCenter" className={`px-3 py-2 text-[13px] font-semibold whitespace-nowrap transition-colors ${['helpCenter', 'supportTicket', 'systemStatus'].includes(halaman) ? 'bg-[#2d425b]' : 'hover:bg-[#2d425b]'}`}>
        {teks?.menuSupport || 'Support'}
      </NavLink>
      
    </nav>
  );
};

export default NavBar;