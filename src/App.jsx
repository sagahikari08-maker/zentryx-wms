import React, { useContext, useEffect } from 'react';
import { AppProvider, AppContext } from './AppContext';
import Login from './Login';
import Sidebar from './Sidebar'; 
import Header from './Header';

// IMPORT SEMUA MODUL
import Dashboard from './Dashboard';
import ReceivePO from './ReceivePO';
import FulfillOrders from './FulfillOrders';
import NewItem from './NewItem';
import ItemSearch from './ItemSearch';
import PickPackShip from './PickPackShip';
import ShippingManifests from './ShippingManifests';
import InboundShipments from './InboundShipments';
import QualityInspection from './QualityInspection';
import Putaway from './Putaway';
import InventoryOverview from './InventoryOverview';
import InventoryAdjustments from './InventoryAdjustments';
import BinTransfers from './BinTransfers';
import CycleCounts from './CycleCounts';
import BOM from './BOM';
import WorkOrders from './WorkOrders';
import AssemblyBuilds from './AssemblyBuilds';
import Tasks from './Tasks';
import UnitsOfMeasure from './UnitsOfMeasure';
import Bins from './Bins';
import InventoryReports from './InventoryReports';
import InventoryValuation from './InventoryValuation';
import StockAging from './StockAging';
import DockScheduling from './DockScheduling';
import ShiftRoster from './ShiftRoster';
import Maintenance from './Maintenance';
import ReturnsRMA from './ReturnsRMA';
import SafetyIncidents from './SafetyIncidents';
import EngineeringMRO from './EngineeringMRO';
import DailyLogistics from './DailyLogistics';
import ShippingReceivingLogs from './ShippingReceivingLogs';
import CarrierPerformance from './CarrierPerformance';
import WorkforceProductivity from './WorkforceProductivity';
import SpaceCapacity from './SpaceCapacity';
import SupplyChainDashboard from './SupplyChainDashboard';
import FillRateAnalysis from './FillRateAnalysis';
import DemandTrends from './DemandTrends';
import CostAnalysis from './CostAnalysis';
import DocumentCenter from './DocumentCenter';
import SetupManager from './SetupManager';
import Procurement from './Procurement';
import DemandPlanning from './DemandPlanning';
import ZentryxApps from './ZentryxApps';
import SupportMenu from './SupportMenu';
import ShippingItems from './ShippingItems';
import Locations from './Locations';
import LandedCost from './LandedCost';
import Events from './Events';
import Calls from './Calls';
import CalendarView from './CalendarView';
import ScannerUI from './ScannerUI';

function AppContent() {
  const { halaman, setHalaman, user } = useContext(AppContext);

  // GATEKEEPER: Jika tidak ada sesi user aktif, render Login
  if (!user) {
    return <Login />;
  }

  // MASTER ROUTE CONFIG
  const pages = {
    dashboard: {component: Dashboard, title: 'Dashboard', breadcrumb: ['Home', 'Dashboard'] },
    receivePO: {component: ReceivePO, title: 'Receive Purchase Orders', breadcrumb: ['Receiving', 'Receive PO'] },
    inbound: {component: InboundShipments, title: 'Inbound Shipments', breadcrumb: ['Receiving', 'Inbound'] },
    qc: {component: QualityInspection, title: 'Quality Inspection', breadcrumb: ['Receiving', 'Quality Control'] },
    putaway: {component: Putaway, title: 'Putaway', breadcrumb: ['Receiving', 'Putaway'] },
    invOverview: {component: InventoryOverview, title: 'Inventory Overview', breadcrumb: ['Inventory', 'Overview'] },
    adjustments: {component: InventoryAdjustments, title: 'Inventory Adjustments', breadcrumb: ['Inventory', 'Adjustments'] },
    newitem: {component: NewItem, title: 'New Item', breadcrumb: ['Inventory', 'Lists', 'Items', 'New Item'] },
    itemSearch: { component: ItemSearch, title: 'Item Search', breadcrumb: ['Inventory', 'Lists', 'Items', 'Search'] },
    transfers: { component: BinTransfers, title: 'Bin Transfers', breadcrumb: ['Inventory', 'Bin Transfers'] },
    cycleCounts: { component: CycleCounts, title: 'Cycle Counts', breadcrumb: ['Inventory', 'Cycle Counts'] },
    uom: { component: UnitsOfMeasure, title: 'Units of Measure', breadcrumb: ['Inventory', 'Lists', 'Units of Measure'] },
    bins: { component: Bins, title: 'Bins Directory', breadcrumb: ['Inventory', 'Lists', 'Bins'] },
    shippingItems: { component: ShippingItems, title: 'Shipping Items', breadcrumb: ['Inventory', 'Lists', 'Shipping Items'] },
    locations: { component: Locations, title: 'Locations', breadcrumb: ['Inventory', 'Lists', 'Locations'] },
    landedCost: { component: LandedCost, title: 'Landed Cost Template', breadcrumb: ['Inventory', 'Lists', 'Landed Cost'] },
    bom: { component: BOM, title: 'Bill of Materials', breadcrumb: ['Manufacturing', 'BOM'] },
    workOrders: {component: WorkOrders, title: 'Work Orders', breadcrumb: ['Manufacturing', 'Work Orders']},
    assemblyBuilds: { component: AssemblyBuilds, title: 'Assembly Builds', breadcrumb: ['Manufacturing', 'Assembly Builds'] },
    fulfillOrders: {component: FulfillOrders, title: 'Fulfill Orders', breadcrumb: ['Shipping', 'Fulfill Orders'] },
    pickpack: { component: PickPackShip, title: 'Pick, Pack, & Ship', breadcrumb: ['Shipping', 'Pick Pack Ship'] },
    manifests: {component: ShippingManifests, title: 'Shipping Manifests', breadcrumb: ['Shipping', 'Manifests'] },
    
    // RUTE ACTIVITIES & TASKS TERDAFTAR DI SINI
    events: { component: Events, title: 'Events', breadcrumb: ['Activities', 'Events'] },
    calls: { component: Calls, title: 'Calls', breadcrumb: ['Activities', 'Calls'] },
    calendar: { component: CalendarView, title: 'Calendar', breadcrumb: ['Activities', 'Calendar'] },
    tasks: { component: Tasks, title: 'Tasks', breadcrumb: ['Activities', 'Tasks'] },
    dockScheduling: {component: DockScheduling, title: 'Dock Scheduling', breadcrumb: ['Schedule', 'Dock Scheduling'] },
    shiftRoster: { component: ShiftRoster, title: 'Shift Roster', breadcrumb: ['Schedule', 'Shift Roster'] },
    
    inventoryReports: {component: InventoryReports, title: 'Inventory Performance Report', breadcrumb: ['Reports', 'Inventory'] },
    valuation: {component: InventoryValuation, title: 'Inventory Valuation', breadcrumb: ['Reports', 'Valuation'] },
    aging: {component: StockAging, title: 'Stock Aging', breadcrumb: ['Reports', 'Stock Aging'] },
    carrierPerformance: { component: CarrierPerformance, title: 'Carrier Performance', breadcrumb: ['Reports', 'Carrier Performance']},
    workforceProductivity: { component: WorkforceProductivity, title: 'Workforce Productivity KPI', breadcrumb: ['Reports', 'Workforce Productivity']},
    capacityUtilization: {component: SpaceCapacity, title: 'Space & Capacity Utilization', breadcrumb: ['Reports', 'Space & Capacity Utilization'] },
    supplyChainDashboard: { component: SupplyChainDashboard, title: 'Supply Chain Dashboard', breadcrumb: ['Analytics', 'Supply Chain Dashboard'] },
    fillRateAnalysis: { component: FillRateAnalysis, title: 'Fill Rate Analysis', breadcrumb: ['Analytics', 'Fill Rate Analysis'] },
    demandTrends: { component: DemandTrends, title: 'Demand Trends', breadcrumb: ['Analytics', 'Demand Trends'] },
    costAnalysis: {component: CostAnalysis, title: 'Cost Analysis', breadcrumb: ['Analytics', 'Cost Analysis'] },
    dailyLogistics: { component: DailyLogistics, title: 'Daily Logistics', breadcrumb: ['Reports', 'Daily Logistics'] },
    shippingReceivingLogs: { component: ShippingReceivingLogs, title: 'Shipping & Receiving Logs', breadcrumb: ['Reports', 'Shipping & Receiving Logs'] },
    maintenance: { component: Maintenance, title: 'Equipment Maintenance', breadcrumb: ['Engineering', 'Maintenance'] },
    engineeringMRO: {component: EngineeringMRO, title: 'Engineering & MRO', breadcrumb: ['Engineering', 'Engineering & MRO'] },
    returnsRma: {component: ReturnsRMA, title: 'Returns & RMA', breadcrumb: ['Operations', 'Returns & RMA'] },
    safetyIncidents: { component: SafetyIncidents, title: 'Safety & Incidents', breadcrumb: ['Operations', 'Safety & Incidents'] },
    doc_bol: { component: DocumentCenter, title: 'Bill of Lading', breadcrumb: ['Documents', 'BOL'] },
    doc_packing: { component: DocumentCenter, title: 'Packing Slips', breadcrumb: ['Documents', 'Packing Slips'] },
    doc_invoice: { component: DocumentCenter, title: 'Commercial Invoices', breadcrumb: ['Documents', 'Invoices'] },
    doc_compliance: {component: DocumentCenter, title: 'Compliance', breadcrumb: ['Documents', 'Compliance Docs'] },
    setupCompany: { component: SetupManager, title: 'Company Settings', breadcrumb: ['Setup', 'Company Info'] },
    setupRoles: { component: SetupManager, title: 'Access Roles', breadcrumb: ['Setup', 'Roles & Permissions']},
    setupLayout: { component: SetupManager, title: 'Warehouse Layout', breadcrumb: ['Setup', 'Layout'] },
    setupPrint: { component: SetupManager, title: 'Print Settings', breadcrumb: ['Setup', 'Hardware']},
    procRequisitions: { component: Procurement, title: 'Purchase Requisitions', breadcrumb: ['Procurement', 'Requisitions'] },
    procPO: {component: Procurement, title: 'Purchase Orders', breadcrumb: ['Procurement', 'Purchase Orders'] },
    procVendors: { component: Procurement, title: 'Vendor Management', breadcrumb: ['Procurement', 'Vendors'] },
    procRFQ: {component: Procurement, title: 'Request for Quote', breadcrumb: ['Procurement', 'RFQ'] },
    demandPlans: {component: DemandPlanning, title: 'Item Demand Plans', breadcrumb: ['Demand Planning', 'Demand Plans']},
    demandSupply: {component: DemandPlanning, title: 'Item Supply Plans', breadcrumb: ['Demand Planning', 'Supply Plans']},
    demandSafety: { component: DemandPlanning, title: 'Safety Stock', breadcrumb: ['Demand Planning', 'Safety Stock']},
    appsMarketplace: { component: ZentryxApps, title: 'Marketplace Integrations', breadcrumb: ['Apps', 'Marketplaces'] },
    appsERP: {component: ZentryxApps, title: 'ERP Integrations', breadcrumb: ['Apps', 'ERP Systems']},
    appsScanner: {component: ZentryxApps, title: 'Scanner Setup', breadcrumb: ['Apps', 'Hardware Scanners']},
    helpCenter: {component: SupportMenu, title: 'Knowledge Base', breadcrumb: ['Support', 'Help Center'] },
    supportTicket: { component: SupportMenu, title: 'Support Tickets', breadcrumb: ['Support', 'Ticketing']},
    systemStatus: { component: SupportMenu, title: 'System Status', breadcrumb: ['Support', 'Server Health'] },
    scanner: { component: ScannerUI, title: 'Scanner Device UI', breadcrumb: ['Operations', 'Scanner Interface'] },
  };

  // HASH ROUTING ENGINE (MULTI-TAB SUPPORT)
  useEffect(() => {
    const initHash = window.location.hash.replace('#', '');
    if (initHash && initHash !== halaman && pages[initHash]) {
      setHalaman(initHash);
    }

    const onHashChange = () => {
      const currentHash = window.location.hash.replace('#', '');
      if (currentHash && pages[currentHash]) {
        setHalaman(currentHash);
      }
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (halaman && window.location.hash.replace('#', '') !== halaman) {
      window.history.pushState(null, '', `#${halaman}`);
    }
  }, [halaman]);

  const pageConfig = pages[halaman];
  const ActivePage = pageConfig?.component;
  const pageTitle = pageConfig?.title || 'Page not found';
  const pageBreadcrumb = pageConfig?.breadcrumb || ['Home'];

  return (
    <div className="flex h-screen bg-[#f3f6f9] font-sans overflow-hidden text-sm">
      {/* INJEKSI: SIDEBAR KIRI (PENGGANTI NAVBAR) */}
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto pb-10">
          {halaman !== 'dashboard' && halaman !== 'scanner' && (
            <section className="p-4 w-full max-w-[1400px] mx-auto pb-2">
              <div className="mb-2">
                <div className="text-[11px] uppercase tracking-[0.3em] text-slate-500 mb-2 font-bold">
                  {pageBreadcrumb.join(' > ')}
                </div>
                <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">{pageTitle}</h1>
              </div>
            </section>
          )}

          {/* RENDER HALAMAN AKTIF */}
          {ActivePage ? <ActivePage /> : (
            <div className="p-4 w-full max-w-[1400px] mx-auto">
              <div className="bg-white border border-gray-300 shadow-sm rounded-sm p-12 flex flex-col items-center justify-center">
                <span className="text-6xl mb-4 opacity-50">⚠️</span>
                <h2 className="text-xl font-bold text-[#4d5f79] mb-2">Module Not Initialized</h2>
                <p className="text-sm text-gray-500 text-center max-w-md">
                  The requested module route (<strong>{halaman}</strong>) is currently disconnected from the main router. Please navigate back to Dashboard or use a valid menu link.
                </p>
                <button
                  onClick={() => {window.location.hash = 'dashboard'; window.location.reload(); }}
                  className="mt-6 bg-[#125ab2] hover:bg-[#0e4487] text-white px-6 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Reload System
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}