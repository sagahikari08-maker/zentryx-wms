import React, { useContext, useState } from 'react';
import { AppContext } from './AppContext';

const Sidebar = () => {
  const { halaman, setHalaman, user } = useContext(AppContext);
  
  // State untuk mengontrol akordion menu yang terbuka
  const [openMenus, setOpenMenus] = useState({
    dashboard: false,
    receiving: false,
    inventory: false,
    manufacturing: false,
    shipping: false,
    procurement: false,
    activities: false,
    reports: false,
    operations: false,
    setup: false,
    support: false
  });

  const toggleMenu = (menu) => {
    setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  // Komponen Helper untuk Link Navigasi Tunggal
  const NavItem = ({ to, label, icon }) => {
    // Menghapus spasi untuk pencocokan route (mengantisipasi salah ketik/OCR pada App.jsx)
    const activeRoute = halaman?.replace(/\s+/g, '') || '';
    const targetRoute = to.replace(/\s+/g, '');
    const isActive = activeRoute === targetRoute;
    
    return (
      <a
        href={`#${to}`}
        onClick={(e) => {
          e.preventDefault();
          if (setHalaman) setHalaman(to);
        }}
        className={`flex items-center gap-3 px-6 py-2.5 text-xs transition-colors ${
          isActive 
            ? 'bg-[#125ab2] text-white border-l-4 border-white font-bold' 
            : 'text-gray-300 hover:bg-[#2d425b] hover:text-white border-l-4 border-transparent font-medium'
        }`}
      >
        <span className="text-sm w-5 text-center">{icon || '▪'}</span>
        <span>{label}</span>
      </a>
    );
  };

  // Komponen Helper untuk Grup Akordion Navigasi
  const NavGroup = ({ id, title, icon, children }) => {
    const isOpen = openMenus[id];
    return (
      <div className="mb-1">
        <button
          onClick={() => toggleMenu(id)}
          className={`w-full flex items-center justify-between px-5 py-3 text-xs text-gray-200 hover:bg-[#2d425b] hover:text-white transition-colors ${isOpen ? 'bg-[#1a2838]' : ''}`}
        >
          <div className="flex items-center gap-3">
            <span className="text-base w-5 text-center">{icon || '❖'}</span>
            <span className="font-bold uppercase tracking-wider text-[11px]">{title}</span>
          </div>
          <span className="text-[10px] opacity-70">{isOpen ? '▼' : '▶'}</span>
        </button>
        {isOpen && <div className="bg-[#15202b] py-1">{children}</div>}
      </div>
    );
  };

  return (
    <aside className="w-[280px] h-screen bg-[#213346] text-white flex flex-col shadow-xl overflow-hidden shrink-0 z-50 transition-all duration-300">
      {/* --- HEADER SIDEBAR --- */}
      <div className="p-6 bg-[#1a2838] border-b border-[#2d425b] flex flex-col gap-1 shrink-0">
        <h1 className="text-2xl font-black tracking-widest text-white flex items-center gap-2">
          <span className="text-[#3b82f6]">⚡</span> ZENTRYX
        </h1>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest ml-9">WMS Gigafactory</p>
      </div>

      {/* --- LIST MODUL NAVIGASI --- */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-2 flex flex-col">
        <div className="mb-2">
          <NavItem to="dashboard" label="Dashboard Utama" icon="📊" />
        </div>
        
        <NavGroup id="receiving" title="Receiving & Inbound" icon="📥">
          <NavItem to="receivePO" label="Receive PO" />
          <NavItem to="inbound" label="Inbound Shipments" />
          <NavItem to="qc" label="Quality Inspection" />
          <NavItem to="putaway" label="Putaway" />
        </NavGroup>

        <NavGroup id="inventory" title="Inventory & Stock" icon="📦">
          <NavItem to="invOverview" label="Inventory Overview" />
          <NavItem to="newitem" label="New Item Master" />
          <NavItem to="itemSearch" label="Item Search" />
          <NavItem to="adjustments" label="Inventory Adjustments" />
          <NavItem to="transfers" label="Bin Transfers" />
          <NavItem to="cycleCounts" label="Cycle Counts" />
          <NavItem to="uom" label="Units of Measure" />
          <NavItem to="bins" label="Bins Directory" />
          <NavItem to="shippingItems" label="Shipping Items" />
          <NavItem to="locations" label="Locations" />
          <NavItem to="landedCost" label="Landed Cost" />
        </NavGroup>

        <NavGroup id="manufacturing" title="Manufacturing" icon="⚙️">
          <NavItem to="bom" label="Bill of Materials (BOM)" />
          <NavItem to="workOrders" label="Work Orders" />
          <NavItem to="assemblyBuilds" label="Assembly Builds" />
        </NavGroup>

        <NavGroup id="shipping" title="Fulfillment & Shipping" icon="📤">
          <NavItem to="fulfillOrders" label="Fulfill Orders" />
          <NavItem to="pickpack" label="Pick, Pack & Ship" />
          <NavItem to="manifests" label="Shipping Manifests" />
        </NavGroup>

        <NavGroup id="procurement" title="Procurement & Demand" icon="🛒">
          <NavItem to="procRequisitions" label="Purchase Requisitions" />
          <NavItem to="procPO" label="Purchase Orders" />
          <NavItem to="procVendors" label="Vendor Management" />
          <NavItem to="procRFQ" label="Request for Quote (RFQ)" />
          <NavItem to="demandPlans" label="Demand Plans" />
          <NavItem to="demandSupply" label="Supply Plans" />
          <NavItem to="demandSafety" label="Safety Stock" />
        </NavGroup>

        <NavGroup id="activities" title="Activities & Tasks" icon="📅">
          <NavItem to="events" label="Events" />
          <NavItem to="calls" label="Calls" />
          <NavItem to="calendar" label="Calendar View" />
          <NavItem to="tasks" label="Tasks Management" />
          <NavItem to="dockScheduling" label="Dock Scheduling" />
          <NavItem to="shiftRoster" label="Shift Roster" />
        </NavGroup>

        <NavGroup id="reports" title="Reports & Analytics" icon="📈">
          <NavItem to="inventoryReports" label="Inventory Reports" />
          <NavItem to="valuation" label="Inventory Valuation" />
          <NavItem to="aging" label="Stock Aging" />
          <NavItem to="carrierPerformance" label="Carrier Performance" />
          <NavItem to="workforceProductivity" label="Workforce Productivity" />
          <NavItem to="capacityUtilization" label="Capacity Utilization" />
          <NavItem to="supplyChainDashboard" label="Supply Chain Dashboard" />
          <NavItem to="fillRateAnalysis" label="Fill Rate Analysis" />
          <NavItem to="demandTrends" label="Demand Trends" />
          <NavItem to="costAnalysis" label="Cost Analysis" />
          <NavItem to="dailyLogistics" label="Daily Logistics" />
          <NavItem to="shippingReceivingLogs" label="Shipping & Receiving Logs" />
          <NavItem to="logisticsReports" label="Logistics Reports" />
        </NavGroup>

        <NavGroup id="operations" title="Operations & Docs" icon="🛠️">
          <NavItem to="maintenance" label="Equipment Maintenance" />
          <NavItem to="engineeringMRO" label="Engineering & MRO" />
          <NavItem to="returnsRma" label="Returns & RMA" />
          <NavItem to="safetyIncidents" label="Safety & Incidents" />
          <NavItem to="doc_bol" label="Bill of Lading" />
          <NavItem to="doc_packing" label="Packing Slips" />
          <NavItem to="doc_invoice" label="Commercial Invoices" />
          <NavItem to="doc_compliance" label="Compliance Docs" />
          <NavItem to="scanner" label="Scanner Device UI" />
        </NavGroup>

        <NavGroup id="setup" title="Setup & Integrations" icon="🔧">
          <NavItem to="setupCompany" label="Company Settings" />
          <NavItem to="setupRoles" label="Access Roles" />
          <NavItem to="setupLayout" label="Warehouse Layout" />
          <NavItem to="setupPrint" label="Print Settings" />
          <NavItem to="appsMarketplace" label="App Marketplace" />
          <NavItem to="appsERP" label="ERP Integrations" />
          <NavItem to="appsScanner" label="Hardware Scanners" />
        </NavGroup>
        
        <NavGroup id="support" title="System & Support" icon="❓">
          <NavItem to="helpCenter" label="Knowledge Base" />
          <NavItem to="supportTicket" label="Support Tickets" />
          <NavItem to="systemStatus" label="System Status" />
        </NavGroup>
      </div>

      {/* --- PROFIL USER & LOGOUT --- */}
      {user && (
        <div className="p-5 bg-[#15202b] border-t border-[#2d425b] shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-md bg-[#3b82f6] flex items-center justify-center font-black text-white text-lg uppercase shadow-lg">
              {user.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-[#94a3b8] truncate uppercase tracking-widest">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={() => {
              window.localStorage.removeItem('zentryx_user');
              window.location.reload();
            }}
            className="w-full py-2.5 border border-[#ef4444] text-[#ef4444] hover:bg-[#ef4444] hover:text-white text-[10px] font-black uppercase tracking-widest rounded-sm transition-colors shadow-sm"
          >
            Sign Out
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;