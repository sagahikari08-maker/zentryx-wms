import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';

// ─── INISIALISASI CONTEXT ────────────────────────────────────────────────────
export const AppContext = createContext();

// ─── KAMUS BAHASA (MENGEMBALIKAN FITUR MULTI-BAHASA) ─────────────────────────
const translations = {
  en: { title: 'ZENTRYX', subtitle: 'WMS Gigafactory', login: 'Login' },
  id: { title: 'ZENTRYX', subtitle: 'WMS Gigafactory', login: 'Masuk' }
};

export const AppProvider = ({ children }) => {
  // ─── 1. ROUTING & PREFERENCES (UI STATES) ───
  const [halaman, setHalaman] = useState('dashboard');
  const [bahasa, setBahasa] = useState('en');
  
  // Mengambil kamus aktif
  const teks = translations[bahasa] || translations.en;

  // ─── 2. STATE OTENTIKASI RBAC (BARU UNTUK FASE 10) ───
  const [user, setUser] = useState(() => {
    try {
      const saved = window.localStorage.getItem('zentryx_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  // ─── 3. LAZY INITIALIZATION GLOBAL STATES (DENGAN DUMMY DATA LENGKAP) ───
  const [inventoryData, setInventoryData] = useState(() => {
    try {
      const saved = window.localStorage.getItem('zentryx_inventory');
      return saved ? JSON.parse(saved) : [
        // REVISI: Menambahkan BATT-LFP-75K dengan stok 0 agar dikenali oleh sistem BOM
        { sku: 'BATT-LFP-75K', name: 'LFP Battery Cell 3.2V', category: 'Energy Storage', qty: 0, price: 120, location: 'ZONE-B-02' },
        
        { sku: 'SKU-ARS-LFP01', name: 'Blade Battery Cell 3.2V 150Ah', category: 'Energy Storage', qty: 4500, price: 250, location: 'ZONE-B-01' },
        { sku: 'SKU-ARS-MCU03', name: 'Motor Control Unit (MCU) Gen 3', category: 'Powertrain', qty: 210, price: 850, location: 'ZONE-A-05' },
        { sku: 'SKU-ARS-CBL12', name: 'High Voltage Harness Cable 50mm2', category: 'Electrical', qty: 12500, price: 12, location: 'ZONE-A-01' },
        { sku: 'SKU-ARS-CHZ04', name: 'Underbody Steel Chassis Frame', category: 'Structural', qty: 90, price: 1200, location: 'ZONE-C-01' },
        { sku: 'SKU-ARS-SNT01', name: 'ADAS Telemetry Sensor Kit', category: 'Electronics', qty: 320, price: 450, location: 'ZONE-C-02' }
      ];
    } catch { return []; }
  });

  const [poData, setPoData] = useState(() => {
    try {
      const saved = window.localStorage.getItem('zentryx_poData');
      return saved ? JSON.parse(saved) : [
        { id: 'PO-ARS-260801', vendor: 'PT Voltara Daya Nusantara', items: 'Blade Battery Cell 3.2V 150Ah - 10,000 Pcs', amount: 3500000000, date: '01 Aug 2026', status: 'Pending', eta: '15 Sep 2026', discrepancy: null },
        { id: 'PO-ARS-260802', vendor: 'ElectroTech Indo', items: 'Motor Control Unit (MCU) Gen 3 - 210 Units', amount: 2625000000, date: '05 Aug 2026', status: 'Discrepancy Hold', eta: '12 Aug 2026', discrepancy: 'Failed QC Diagnostic Test.' }
      ];
    } catch { return []; }
  });

  const [soData, setSoData] = useState(() => {
    try {
      const saved = window.localStorage.getItem('zentryx_soData');
      return saved ? JSON.parse(saved) : [
        { id: 'OUT-ARS-0001', customer: 'Dealership Jakarta', date: '2026-06-19', address: 'Jl. Sudirman No 1', weight: 1500, type: 'Heavy Chassis', status: 'Shipped', trackingNumber: 'AWB-8991238', courier: 'Zentryx Flatbed Fleet' },
        { id: 'OUT-ARS-0002', customer: 'Export Hub Tj. Priok', date: '2026-06-20', address: 'Pelabuhan Gate 3', weight: 450, type: 'Hazmat (LFP Battery)', status: 'Ready to Pick' }
      ];
    } catch { return []; }
  });

  const [taskData, setTaskData] = useState(() => {
    try {
      const saved = window.localStorage.getItem('zentryx_taskData');
      return saved ? JSON.parse(saved) : [
        { id: 'TSK-ARS-1001', type: 'Picking', desc: 'Pick 210 units of MCU Gen 3', zone: 'Zone A', assignee: 'Alex Wibowo', priority: 'High', status: 'Not Started', refId: 'OUT-ARS-0002', isLocked: false }
      ];
    } catch { return []; }
  });

  const [globalBOMs, setGlobalBOMs] = useState(() => {
    try {
      const saved = window.localStorage.getItem('zentryx_globalBOMs');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  // ─── 4. PERSISTENCE ENGINE (MENYIMPAN PERUBAHAN KE LOCAL STORAGE) ───
  useEffect(() => {
    if (user) window.localStorage.setItem('zentryx_user', JSON.stringify(user));
    else window.localStorage.removeItem('zentryx_user');
  }, [user]);

  useEffect(() => { window.localStorage.setItem('zentryx_inventory', JSON.stringify(inventoryData)); }, [inventoryData]);
  useEffect(() => { window.localStorage.setItem('zentryx_poData', JSON.stringify(poData)); }, [poData]);
  useEffect(() => { window.localStorage.setItem('zentryx_soData', JSON.stringify(soData)); }, [soData]);
  useEffect(() => { window.localStorage.setItem('zentryx_taskData', JSON.stringify(taskData)); }, [taskData]);
  useEffect(() => { if (globalBOMs) window.localStorage.setItem('zentryx_globalBOMs', JSON.stringify(globalBOMs)); }, [globalBOMs]);

  // ─── 5. GLOBAL INTERLOCK FUNCTIONS (FUNGSI PENGHUBUNG ANTAR MODUL) ───
  /**
   * Mengirim tugas otomatis ke Scanner UI Operator Gudang.
   * DIKUNCI dengan useCallback dan "Functional Updates (prevTasks)" agar terhindar dari Infinite Loop.
   */
  const dispatchAutoTask = useCallback((newTaskConfig) => {
    setTaskData(prevTasks => {
      // Mencegah duplikasi tugas jika refId dan tipe tugas yang sama sudah ada dan belum selesai
      const isDuplicate = prevTasks.some(t => 
        t.refId === newTaskConfig.refId && 
        t.type === newTaskConfig.type && 
        t.status !== 'Completed'
      );
      
      if (isDuplicate) return prevTasks;

      const newTask = {
        id: `TSK-ARS-${Date.now().toString().slice(-6)}`,
        status: 'Not Started',
        currentStage: 'Awaiting Operator',
        createdAt: new Date().toISOString(),
        ...newTaskConfig
      };

      return [newTask, ...prevTasks];
    });
  }, []);

  /**
   * Menyelesaikan tugas fisik dan mensinkronisasikan stok secara real-time ke DB Inventory.
   */
  const completeTaskAndSync = useCallback((taskId) => {
    setTaskData(prevTasks => {
      const taskIndex = prevTasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) return prevTasks;
      
      const task = prevTasks[taskIndex];

      // JIKA INI TUGAS PUTAWAY: Tambahkan barang fisik ke Inventory Global
      if (task.type === 'Putaway') {
        setInventoryData(prevInv => {
          const newInv = [...prevInv];
          const existingItemIndex = newInv.findIndex(i => i.sku === task.sku);

          if (existingItemIndex >= 0) {
            newInv[existingItemIndex] = {
              ...newInv[existingItemIndex],
              qty: newInv[existingItemIndex].qty + (Number(task.qty) || 0)
            };
          } else {
            // Jika ini SKU baru yang belum pernah ada di gudang
            newInv.push({
              sku: task.sku || 'SKU-UNKNOWN',
              name: task.desc || 'Newly Received Item',
              qty: Number(task.qty) || 0,
              category: 'Inbound Receivals',
              location: task.targetBin || task.zone || 'Zone A (Staging)',
              price: 0
            });
          }
          return newInv;
        });
      }

      // Tandai tugas di Scanner UI sebagai selesai
      const updatedTasks = [...prevTasks];
      updatedTasks[taskIndex] = { 
        ...task, 
        status: 'Completed', 
        isLocked: false,
        deliveredAt: new Date().toISOString()
      };
      
      return updatedTasks;
    });
  }, []);

  // ─── 6. MEMOIZATION ENGINE (OPTIMASI RENDER REACT & ANTI MEMORY LEAK) ───
  // Memastikan Context Value memiliki referensi memori yang stabil
  const contextValue = useMemo(() => ({
    // RBAC Auth
    user, setUser,

    // UI Routing & Config
    halaman, setHalaman,
    bahasa, setBahasa,
    teks,
    
    // Core Databases
    inventoryData, setInventoryData,
    poData, setPoData,
    soData, setSoData,
    taskData, setTaskData,
    globalBOMs, setGlobalBOMs,
    
    // Interlock APIs
    dispatchAutoTask,
    completeTaskAndSync
  }), [
    user, halaman, bahasa, teks, 
    inventoryData, poData, soData, taskData, globalBOMs, 
    dispatchAutoTask, completeTaskAndSync
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};