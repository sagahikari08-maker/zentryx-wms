import React, { useContext } from 'react';
import { AppContext } from './AppContext';

const Sidebar = () => {
  const { setHalaman, halaman, user } = useContext(AppContext);

  // Jika user belum ada, jangan render sidebar
  if (!user) return null;

  // RBAC Config: Daftar menu dan role yang diizinkan melihatnya
  const menuConfig = [
    {
      kategori: 'EXECUTIVE ANALYTICS',
      roles: ['ADMIN', 'EXECUTIVE'],
      items: [
        { id: 'dashboard', label: 'Gigafactory Dashboard', icon: '📊' },
        { id: 'supplyChainDashboard', label: 'Supply Chain Command', icon: '🌍' },
        { id: 'costAnalysis', label: 'Cost & Yield Forensics', icon: '💰' }
      ]
    },
    {
      kategori: 'PLANNING & PROCUREMENT',
      roles: ['ADMIN', 'MANAGER', 'EXECUTIVE'],
      items: [
        { id: 'demandPlans', label: 'MRP & Demand Planning', icon: '📈' },
        { id: 'procPO', label: 'Procurement (PO/RFQ)', icon: '🤝' },
        { id: 'dockScheduling', label: 'Yard & Dock Scheduling', icon: '🚛' }
      ]
    },
    {
      kategori: 'WAREHOUSE OPERATIONS',
      roles: ['ADMIN', 'MANAGER', 'OPERATOR'],
      items: [
        { id: 'invOverview', label: 'Inventory Master', icon: '📦' },
        { id: 'workOrders', label: 'Assembly Work Orders', icon: '🏭' },
        { id: 'receivePO', label: 'Inbound Receiving', icon: '📥' },
        { id: 'putaway', label: 'Putaway / Staging', icon: '🏗️' },
        { id: 'fulfillOrders', label: 'Outbound Fulfillment', icon: '📤' },
        { id: 'shippingItems', label: 'Shipping Manifests', icon: '🚚' },
        { id: 'scanner', label: 'Scanner Device UI', icon: '📱' }
      ]
    },
    {
      kategori: 'QUALITY & MAINTENANCE',
      roles: ['ADMIN', 'MANAGER', 'OPERATOR'],
      items: [
        { id: 'qc', label: 'QA / QC Inspections', icon: '🔍' }, // <-- DIPERBAIKI (sebelumnya: qualityInspection)
        { id: 'maintenance', label: 'MRO & Predictive Maint.', icon: '⚙️' },
        { id: 'engineeringMRO', label: 'MRO Parts Ledger', icon: '🔧' },
        { id: 'returnsRma', label: 'Returns & RMA', icon: '🔄' },
      ]
    },
    {
      kategori: 'AUDIT & CONTROL',
      roles: ['ADMIN', 'MANAGER'],
      items: [
        { id: 'cycleCounts', label: 'Cycle Counts (Opname)', icon: '📋' },
        { id: 'adjustments', label: 'Stock Adjustments', icon: '⚖️' }, // <-- DIPERBAIKI (sebelumnya: invAdjustments)
        { id: 'bom', label: 'Bill of Materials (BOM)', icon: '🧾' },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-[#2b3a4a] text-slate-300 flex flex-col h-screen shrink-0 overflow-y-auto custom-scrollbar">
      <div className="p-4 border-b border-[#3a4f66] sticky top-0 bg-[#2b3a4a] z-10">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#8a9fb5]">Security Level</p>
        <p className="text-sm font-bold text-white mt-0.5">{user.role} CLEARANCE</p>
      </div>

      <div className="flex-1 py-4">
        {menuConfig.map((group, index) => {
          // Hanya render kategori jika role user ada di array roles
          if (!group.roles.includes(user.role)) return null;

          return (
            <div key={index} className="mb-6">
              <h3 className="px-5 text-[10px] font-black uppercase tracking-widest text-[#6c87a3] mb-2">
                {group.kategori}
              </h3>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = halaman === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => setHalaman(item.id)}
                        className={`w-full text-left px-5 py-2.5 text-xs font-bold transition-colors flex items-center gap-3 ${
                          isActive 
                            ? 'bg-[#125ab2] text-white border-l-4 border-emerald-400' 
                            : 'hover:bg-[#36485c] hover:text-white border-l-4 border-transparent'
                        }`}
                      >
                        <span className="text-sm opacity-80">{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;