import React, { useState, useContext, useEffect, useMemo } from 'react';
import { AppContext } from './AppContext';

const defaultExportFields = {
  bomId: true,
  fgItemId: true,
  fgName: true,
  revision: true,
  cost: true,
  status: true,
  components: true,
  createdDate: true,
};

// ─── TOAST COMPONENT ───
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
    {toasts.map(({ id, message, type }) => (
      <div 
        key={id} 
        className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-sm shadow-xl text-white text-xs font-semibold min-w-[280px] border-l-4 ${
          type === 'success' ? 'bg-green-600 border-green-800' : 
          type === 'error' ? 'bg-red-600 border-red-800' : 'bg-orange-500 border-orange-700'
        }`}
      >
        <span className="text-base">{type === 'success' ? '✓' : type === 'error' ? '🚨' : '⚠'}</span>
        <span className="flex-1">{message}</span>
        <button onClick={() => removeToast(id)} className="opacity-70 hover:opacity-100 text-lg leading-none">×</button>
      </div>
    ))}
  </div>
);

const BOM = () => {
  // ─── 🚀 INJEKSI: AppContext Integration ───
  const { bahasa, inventoryData, globalBOMs, setGlobalBOMs } = useContext(AppContext);

  // ─── 🚀 ENGINE INTERLOCK: DYNAMIC MASTER COMPONENTS FROM INVENTORY ───
  // Mengubah master statis menjadi dinamis yang membaca langsung dari inventaris fisik
  const masterComponentsDB = useMemo(() => {
    const db = {};
    (inventoryData || []).forEach(item => {
      // Hanya masukkan komponen dasar (bukan barang jadi)
      if (item.category !== 'Finished Goods') {
        db[item.sku] = {
          name: item.name,
          uom: item.sku?.includes('CBL') ? 'Meters' : item.sku?.includes('CLT') ? 'Drums' : 'Units',
          cost: item.price || (Math.random() * 500 + 10) // Fallback cost jika kosong
        };
      }
    });
    return db;
  }, [inventoryData]);

  // ─── MASTER DICTIONARY ───
  const productMaster = {
    'SKU-ARS-EVPLATFORM': {
      fgItemId: 'SKU-ARS-EVPLATFORM',
      name: 'ARUS EV Skateboard Platform (Series 1)',
      description: 'Integrated rolling chassis platform including battery, motors, and core structural frame.',
      uom: 'Units',
      stockLevel: 12,
      specifications: { 
        wheelbase: '2900 mm', 
        total_weight: '850 kg', 
        drive_type: 'AWD Dual Motor', 
        voltage_arch: '800V Architecture' 
      }
    },
    'SKU-ARS-BATPAC': {
      fgItemId: 'SKU-ARS-BATPAC',
      name: 'ARUS Modular Battery Pack 75kWh',
      description: 'Fully assembled modular battery pack ready for EV integration.',
      uom: 'Packs',
      stockLevel: 45,
      specifications: { 
        capacity: '75 kWh', 
        chemistry: 'Lithium Iron Phosphate (LFP)', 
        cooling: 'Active Liquid Cooling', 
        weight: '420 kg' 
      }
    }
  };

  const initialBOMs = [
    { 
      bomId: 'BOM-ARS-P01', 
      fgItemId: 'SKU-ARS-EVPLATFORM', 
      fgName: 'ARUS EV Skateboard Platform (Series 1)', 
      revision: 'Rev. 2.1',
      status: 'Active',
      cost: '$33,530.00',
      attachments: [
        { name: 'Chassis_Blueprint_v2.pdf', size: '4.2 MB' }, 
        { name: 'Wiring_Diagram.cad', size: '12.8 MB' }
      ],
      components: [
        { itemId: 'SKU-ARS-CHZ04', name: 'Underbody Steel Chassis Frame', qty: 1, uom: 'Units' },
        { itemId: 'SKU-ARS-MCU03', name: 'Motor Control Unit (MCU) Gen 3', qty: 2, uom: 'Units' },
        { itemId: 'BATT-LFP-75K', name: 'Blade Battery Cell 3.2V 150Ah', qty: 120, uom: 'Pcs' },
        { itemId: 'SKU-ARS-CBL12', name: 'High Voltage Harness Cable 50mm2', qty: 15, uom: 'Meters' },
        { itemId: 'SKU-ARS-SNT01', name: 'ADAS Telemetry Sensor Kit', qty: 1, uom: 'Sets' }
      ],
      createdDate: '2026-08-01'
    },
    { 
      bomId: 'BOM-ARS-B01', 
      fgItemId: 'SKU-ARS-BATPAC', 
      fgName: 'ARUS Modular Battery Pack 75kWh', 
      revision: 'Rev. 1.5',
      status: 'Active',
      cost: '$25,126.00',
      attachments: [
        { name: 'Battery_Assembly_SOP.pdf', size: '1.5 MB' }
      ],
      components: [
        { itemId: 'BATT-LFP-75K', name: 'Blade Battery Cell 3.2V 150Ah', qty: 100, uom: 'Pcs' },
        { itemId: 'SKU-ARS-CLT99', name: 'Thermal Management Coolant 20L', qty: 2, uom: 'Drums' },
        { itemId: 'SKU-ARS-CBL12', name: 'High Voltage Harness Cable 50mm2', qty: 3, uom: 'Meters' }
      ],
      createdDate: '2026-07-15'
    }
  ];

  // ─── 🚀 ENGINE INTERLOCK: LOCAL STATE TO GLOBAL OVERRIDE ───
  // Kita hubungkan state boms dengan setGlobalBOMs jika tersedia, jika tidak pakai local state
  const [localBoms, setLocalBoms] = useState(() => {
    try {
      const saved = window.localStorage.getItem('bomData_ARUS_Motors');
      return saved ? JSON.parse(saved) : initialBOMs;
    } catch {
      return initialBOMs;
    }
  });

  const boms = globalBOMs || localBoms;
  const setBoms = setGlobalBOMs || setLocalBoms;

  // Pembersih Data Lama
  useEffect(() => {
    const hasPizzaData = boms.some(bom => 
      bom.bomId?.includes('-PZ-') || 
      bom.fgItemId?.includes('-PZ-') || 
      bom.fgName?.toLowerCase().includes('pizza')
    );

    if (hasPizzaData) {
      setBoms(initialBOMs); 
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Modals & States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBOM, setSelectedBOM] = useState(null); 
  const [selectedItem, setSelectedItem] = useState(null); 
  const [editingBOM, setEditingBOM] = useState(null); 
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
  // Export Settings & Filter
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportFields, setExportFields] = useState(defaultExportFields);
  const [exportStatusFilter, setExportStatusFilter] = useState('all');
  const [exportDateFrom, setExportDateFrom] = useState('');
  const [exportDateTo, setExportDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Notifications, Dialogs & Forms
  const [notification, setNotification] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [newBOM, setNewBOM] = useState({ 
    bomId: '', 
    fgItemId: '', 
    fgName: '', 
    revision: '', 
    cost: '', 
    attachments: [], 
    components: [], 
    createdDate: '' 
  });
  const [toasts, setToasts] = useState([]);

  // Dynamic Cost Calculation
  const calculatedTotalCost = useMemo(() => {
    const total = newBOM.components.reduce((sum, comp) => {
      const unitCost = masterComponentsDB[comp.itemId]?.cost || 0;
      const qty = parseFloat(comp.qty) || 0;
      return sum + (unitCost * qty);
    }, 0);
    return total;
  }, [newBOM.components, masterComponentsDB]);

  useEffect(() => {
    try {
      window.localStorage.setItem('bomData_ARUS_Motors', JSON.stringify(boms));
    } catch (error) {
      console.error('Failed to save BOM data:', error);
    }
  }, [boms]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };
  
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  
  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const showConfirmation = (title, message, onConfirm, onCancel) => {
    setConfirmDialog({ title, message, onConfirm, onCancel });
  };

  const resetNewBOM = () => {
    setNewBOM({ 
      bomId: '', 
      fgItemId: '', 
      fgName: '', 
      revision: '', 
      cost: '', 
      attachments: [], 
      components: [], 
      createdDate: '' 
    });
    setEditingBOM(null);
    setFormErrors({});
  };

  const openNewBOMModal = () => {
    const autoGenId = `BOM-ARS-${Math.floor(1000 + Math.random() * 9000)}`;
    setNewBOM({ 
      bomId: autoGenId, 
      fgItemId: '', 
      fgName: '', 
      revision: 'Rev. 1.0', 
      cost: '', 
      attachments: [], 
      components: [], 
      createdDate: '' 
    });
    setEditingBOM(null);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateBOMForm = () => {
    const errors = {};
    if (!newBOM.fgItemId?.trim()) errors.fgItemId = 'Required';
    if (!newBOM.fgName?.trim()) errors.fgName = 'Required';
    if (!newBOM.revision?.trim()) errors.revision = 'Required';
    if (newBOM.components.length === 0) errors.components = 'Add at least one component';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getProductDetails = (fgItemId) => {
    return productMaster[fgItemId] || null;
  };

  const getFilteredBOMs = () => {
    return boms.filter((bom) => {
      const matchesSearch = 
        bom.bomId.toLowerCase().includes(searchQuery.toLowerCase()) || 
        bom.fgItemId.toLowerCase().includes(searchQuery.toLowerCase()) || 
        bom.fgName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || bom.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  };

  const handleFgItemSelect = (sku) => {
    const product = productMaster[sku];
    if (product) {
      setNewBOM({ ...newBOM, fgItemId: sku, fgName: product.name });
    } else {
      setNewBOM({ ...newBOM, fgItemId: sku, fgName: '' });
    }
  };

  const handleComponentSelect = (index, sku) => {
    const updatedComponents = [...newBOM.components];
    updatedComponents[index].itemId = sku;
    if (masterComponentsDB[sku]) {
      updatedComponents[index].name = masterComponentsDB[sku].name;
      updatedComponents[index].uom = masterComponentsDB[sku].uom;
    } else {
      updatedComponents[index].name = '';
      updatedComponents[index].uom = '';
    }
    setNewBOM({ ...newBOM, components: updatedComponents });
  };

  const handleSimulateFileUpload = () => {
    const randomDocs = ['Thermal_Routing_v3.pdf', 'Structural_CAD_X1.cad', 'Assembly_SOP_Final.pdf'];
    const randomSize = (Math.random() * 5 + 1).toFixed(1) + ' MB';
    const randomName = randomDocs[Math.floor(Math.random() * randomDocs.length)];
    setNewBOM(prev => ({ 
      ...prev, 
      attachments: [...(prev.attachments || []), { name: randomName, size: randomSize }] 
    }));
    addToast('Engineering document attached.', 'success');
  };

  const removeAttachment = (index) => {
    const updatedAttachments = newBOM.attachments.filter((_, i) => i !== index);
    setNewBOM({ ...newBOM, attachments: updatedAttachments });
  };

  // Export functions
  const resetExportSettings = () => { setExportFormat('csv'); setExportFields(defaultExportFields); setExportStatusFilter('all'); setExportDateFrom(''); setExportDateTo(''); };
  const toggleExportField = (field) => setExportFields({ ...exportFields, [field]: !exportFields[field] });
  const getFilteredExports = () => boms.filter((bom) => { if (exportStatusFilter !== 'all' && bom.status !== exportStatusFilter) return false; if (exportDateFrom && bom.createdDate && new Date(bom.createdDate) < new Date(exportDateFrom)) return false; if (exportDateTo && bom.createdDate && new Date(bom.createdDate) > new Date(exportDateTo)) return false; return true; });
  const getExportColumns = () => { const columns = [ { key: 'bomId', label: 'BOM ID' }, { key: 'fgItemId', label: 'FG Item ID' }, { key: 'fgName', label: 'Assembly Name' }, { key: 'revision', label: 'Revision' }, { key: 'cost', label: 'Estimated Cost' }, { key: 'status', label: 'Status' }, { key: 'createdDate', label: 'Created Date' }, { key: 'components', label: 'Components' }, ]; return columns.filter((col) => exportFields[col.key]); };
  const formatExportValue = (bom, key) => { switch (key) { case 'components': return bom.components.map((comp) => `${comp.itemId}:${comp.qty}${comp.uom}`).join(' | '); case 'createdDate': return bom.createdDate || ''; default: return bom[key] ?? ''; } };
  const doExportCSV = () => { const columns = getExportColumns(); const header = columns.map((col) => col.label); const rows = getFilteredExports().map((bom) => columns.map((col) => formatExportValue(bom, col.key))); const csvContent = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n'); const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.setAttribute('download', 'ARUS_BOM_Export.csv'); link.click(); URL.revokeObjectURL(link.href); };
  const doExportPDF = () => { const columns = getExportColumns(); const rows = getFilteredExports().map((bom) => `<tr>${columns.map((col) => `<td>${formatExportValue(bom, col.key)}</td>`).join('')}</tr>`).join(''); const tableHeader = columns.map((col) => `<th>${col.label}</th>`).join(''); const html = `<!DOCTYPE html><html><head><title>ARUS Motors BOM Export</title><style>body { font-family: Arial, sans-serif; padding: 20px; color: #2d3748; }h1 { font-size: 20px; margin-bottom: 10px; color: #125ab2; }table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }th, td { border: 1px solid #d1d5db; padding: 8px 10px; text-align: left; }th { background: #f3f4f6; text-transform: uppercase; }.note { margin-top: 16px; font-size: 10px; color: #4b5563; }</style></head><body><h1>ARUS Motors BOM Export</h1><p style="font-size: 12px;">Export generated for Manufacturing / Engineering Department.</p><table><thead><tr>${tableHeader}</tr></thead><tbody>${rows}</tbody></table><p class="note">Generated by Zentryx WMS Core Engine.</p></body></html>`; const printWindow = window.open('', '_blank', 'width=1000,height=700'); if (printWindow) { printWindow.document.write(html); printWindow.document.close(); printWindow.focus(); setTimeout(() => printWindow.print(), 500); } };
  const handleExport = () => { setIsExportModalOpen(false); if (exportFormat === 'pdf') doExportPDF(); else doExportCSV(); };

  const openEditBOM = (bom) => {
    setNewBOM({ 
      ...bom, 
      components: bom.components.map((comp) => ({ ...comp })), 
      attachments: bom.attachments ? [...bom.attachments] : [] 
    });
    setEditingBOM(bom);
    setSelectedBOM(null);
    setIsModalOpen(true);
  };

  const handleSaveBOM = () => {
    if (!validateBOMForm()) {
      addToast(bahasa === 'en' ? 'Please fill all required fields' : 'Harap isi semua field wajib', 'error');
      return;
    }

    const hasEmptyComp = newBOM.components.some(c => !c.itemId || !c.qty || c.qty <= 0);
    if (hasEmptyComp) {
      addToast('Component lines must have valid SKU and Quantity > 0.', 'error');
      return;
    }

    const formattedFinalCost = `$${calculatedTotalCost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

    if (editingBOM) {
      setBoms(boms.map((bom) => 
        bom.bomId === editingBOM.bomId 
        ? { ...newBOM, cost: formattedFinalCost, createdDate: bom.createdDate } 
        : bom
      ));
      addToast(bahasa === 'en' ? 'BOM updated successfully' : 'BOM berhasil diperbarui', 'success');
    } else {
      const newBomWithDate = { 
        ...newBOM, 
        cost: formattedFinalCost, 
        components: newBOM.components.map((comp) => ({ ...comp })), 
        createdDate: newBOM.createdDate || new Date().toISOString().split('T')[0], 
        status: 'Active' 
      };
      setBoms([...boms, newBomWithDate]);
      addToast(bahasa === 'en' ? 'BOM created successfully' : 'BOM berhasil dibuat', 'success');
    }

    resetNewBOM();
    setIsModalOpen(false);
  };

  const archiveBOM = (bomId) => {
    const bomName = boms.find(b => b.bomId === bomId)?.fgName || bomId;
    showConfirmation(
      bahasa === 'en' ? 'Archive BOM?' : 'Arsipkan BOM?',
      `${bahasa === 'en' ? 'Are you sure you want to archive' : 'Apakah Anda yakin ingin mengarsipkan'} "${bomName}"?`,
      () => {
        setBoms(boms.map((bom) => bom.bomId === bomId ? { ...bom, status: 'Archived' } : bom));
        setSelectedBOM(null);
        setConfirmDialog(null);
        addToast(bahasa === 'en' ? 'BOM archived successfully' : 'BOM berhasil diarsipkan', 'success');
      },
      () => setConfirmDialog(null)
    );
  };

  const cloneBOM = (bom) => {
    let newId = `${bom.bomId}-COPY`;
    let index = 1;
    while (boms.some((b) => b.bomId === newId)) { 
      newId = `${bom.bomId}-COPY-${index}`; 
      index += 1; 
    }
    
    showConfirmation(
      bahasa === 'en' ? 'Clone BOM?' : 'Duplikat BOM?',
      `${bahasa === 'en' ? 'Create a copy of' : 'Buat salinan dari'} "${bom.fgName}" ${bahasa === 'en' ? 'as' : 'sebagai'} ${newId}?`,
      () => {
        const clone = { 
          ...bom, 
          bomId: newId, 
          components: bom.components.map((comp) => ({ ...comp })), 
          attachments: bom.attachments ? [...bom.attachments] : [], 
          createdDate: new Date().toISOString().split('T')[0], 
          status: 'Draft' 
        };
        setNewBOM(clone);
        setSelectedBOM(null);
        setConfirmDialog(null);
        setIsModalOpen(true);
        addToast(bahasa === 'en' ? 'BOM cloned successfully' : 'BOM berhasil diduplikat', 'success');
      },
      () => setConfirmDialog(null)
    );
  };

  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 animate-fade-in">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* NOTIFICATION TOAST LAMA (DIUBAH KE POINTER-EVENTS-NONE) */}
      {notification && (
        <div className="fixed top-4 right-4 z-[9999] pointer-events-none w-full max-w-sm p-4">
          <div className={`pointer-events-auto px-4 py-3 rounded-sm shadow-xl text-white text-sm font-bold transition-all border-l-4 ${
            notification.type === 'success' ? 'bg-emerald-600 border-emerald-800' : 
            notification.type === 'error' ? 'bg-red-600 border-red-800' : 'bg-blue-600 border-blue-800'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{notification.type === 'success' ? '✓' : notification.type === 'error' ? '🛡️' : 'ℹ'}</span>
              <span>{notification.message}</span>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG (TERKUNCI DI Z-200) */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[200] p-4 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[400px] shadow-2xl flex flex-col max-h-[80vh] animate-fade-in">
            <div className="p-5 overflow-y-auto flex-1">
              <h3 className="font-black text-lg text-gray-800 mb-2 uppercase tracking-wider">{confirmDialog.title}</h3>
              <p className="text-gray-600 text-sm mb-2 leading-relaxed font-semibold">{confirmDialog.message}</p>
            </div>
            <div className="bg-gray-50 border-t border-gray-200 px-5 py-3 flex justify-end gap-3 shrink-0">
              <button onClick={confirmDialog.onCancel} className="px-5 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 font-bold text-xs uppercase tracking-wider rounded-sm transition-colors shadow-sm">
                {bahasa === 'en' ? 'Cancel' : 'Batal'}
              </button>
              <button onClick={confirmDialog.onConfirm} className="px-5 py-2 bg-[#125ab2] hover:bg-[#0e4487] text-white font-bold text-xs uppercase tracking-wider rounded-sm transition-colors shadow-sm">
                {bahasa === 'en' ? 'Confirm Action' : 'Konfirmasi'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>⚙️ Manufacturing</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Engineering</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide">
            {bahasa === 'en' ? 'Bill of Materials (BOM)' : 'Bill of Materials (Resep Produksi)'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {bahasa === 'en' ? 'Manage EV component recipes, cost roll-ups, and engineering blueprints.' : 'Kelola resep komponen EV, kalkulasi HPP otomatis, dan blueprint perakitan.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <button onClick={() => { setExportFormat('csv'); setIsExportModalOpen(true); }} className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 px-4 py-2 rounded-sm shadow-sm text-xs font-bold transition-colors">
            {bahasa === 'en' ? '↓ Export CSV' : '↓ Ekspor CSV'}
          </button>
          <button onClick={() => { setExportFormat('pdf'); setIsExportModalOpen(true); }} className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 px-4 py-2 rounded-sm shadow-sm text-xs font-bold transition-colors">
            {bahasa === 'en' ? '🖨 Export PDF' : '🖨 Ekspor PDF'}
          </button>
          <button onClick={openNewBOMModal} className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-5 py-2 rounded-sm shadow-sm text-sm font-bold transition-colors">
            + {bahasa === 'en' ? 'Create New BOM' : 'Buat BOM Baru'}
          </button>
        </div>
      </div>

      {/* TABEL DAFTAR BOM */}
      <div className="bg-white border border-gray-300 shadow-sm w-full overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input 
              type="text" 
              placeholder={bahasa === 'en' ? 'Search BOM ID, Assembly Name, FG Item ID...' : 'Cari BOM ID, Nama Perakitan, ID Barang Jadi...'} 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs outline-none focus:border-[#125ab2] transition-colors" 
            />
          </div>
          <div className="sm:w-48">
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)} 
              className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs font-bold outline-none bg-white text-gray-700 cursor-pointer"
            >
              <option value="all">{bahasa === 'en' ? 'All Status' : 'Semua Status'}</option>
              <option value="Active">{bahasa === 'en' ? 'Active Only' : 'Hanya Aktif'}</option>
              <option value="Archived">{bahasa === 'en' ? 'Archived Only' : 'Hanya Diarsipkan'}</option>
            </select>
          </div>
        </div>

        <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex items-center gap-3 text-sm text-[#125ab2]">
          <span className="text-lg">ℹ️</span>
          <p className="font-semibold text-xs">
            {bahasa === 'en' ? 'Click BOM ID to view engineering recipe details, or Component SKU for Where-Used Analysis.' : 'Klik BOM ID untuk melihat rincian resep teknik, atau Komponen SKU untuk Analisis Dampak (Where-Used).'}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-[#e5e5e5] text-[#666666] text-[11px] border-b border-gray-300 uppercase tracking-wider">
                <th className="py-3 px-4 font-bold w-32">BOM ID</th>
                <th className="py-3 px-4 font-bold w-40">FG ITEM SKU</th>
                <th className="py-3 px-4 font-bold">ASSEMBLY NAME (FINISHED GOOD)</th>
                <th className="py-3 px-4 font-bold w-24 text-center">REVISION</th>
                <th className="py-3 px-4 font-bold w-32 text-right">EST. COST</th>
                <th className="py-3 px-4 font-bold w-32 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody className="text-[12px] text-[#333333]">
              {getFilteredBOMs().length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <span className="text-4xl opacity-50">📭</span>
                      <p className="text-gray-500 font-bold italic">{bahasa === 'en' ? 'No BOMs found' : 'Tidak ada BOM yang ditemukan'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                getFilteredBOMs().map((bom) => (
                  <tr key={bom.bomId} className={`border-b border-gray-100 transition-colors ${bom.status === 'Archived' ? 'bg-gray-50 opacity-60' : 'hover:bg-blue-50'}`}>
                    <td className="py-3 px-4">
                      <span onClick={() => setSelectedBOM(bom)} className="text-[#125ab2] font-black cursor-pointer hover:underline" title="View Full Recipe">{bom.bomId}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span onClick={() => setSelectedItem(bom.fgItemId)} className="text-purple-700 font-mono font-bold cursor-pointer hover:underline text-[13px]" title="View Product Snapshot">{bom.fgItemId}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-800 text-sm">{bom.fgName}</td>
                    <td className="py-3 px-4 text-center font-bold text-gray-500">{bom.revision}</td>
                    <td className="py-3 px-4 text-right font-mono font-black text-emerald-700">{bom.cost}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-sm font-bold text-[10px] uppercase tracking-wider ${bom.status === 'Archived' ? 'bg-gray-200 text-gray-700' : bom.status === 'Draft' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {bom.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🛡️ MODAL 1: FORM CREATE / EDIT BOM (BULLETPROOF COMPACT LAYOUT)           */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-sm w-full max-w-[600px] shadow-2xl flex flex-col overflow-hidden max-h-[80vh] animate-fade-in">
            
            {/* --- HEADER --- */}
            <div className="bg-[#415a77] text-white px-5 py-3 flex justify-between items-center shrink-0">
              <h3 className="font-black text-sm uppercase tracking-wider">
                {editingBOM ? (bahasa === 'en' ? `Edit Revision: ${editingBOM.bomId}` : 'Ubah Revisi BOM') : (bahasa === 'en' ? 'Create New BOM' : 'Buat BOM Baru')}
              </h3>
              <button onClick={() => { resetNewBOM(); setIsModalOpen(false); }} className="text-gray-300 hover:text-white font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            {/* --- BODY FORM --- */}
            <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
              
              <div className="bg-blue-50 border border-blue-200 text-blue-800 text-[10px] p-2.5 rounded-sm flex items-start gap-2 mb-4">
                <span className="text-sm leading-none">💡</span>
                <div className="leading-tight">
                  <strong className="text-[#125ab2]">Smart-Fill & Auto-Cost:</strong> Pilih FG dan Komponen untuk memuat nama, mengunci satuan UOM, dan kalkulasi HPP otomatis (Terhubung ke Inventory Database).
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4 border-b border-gray-100 pb-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">BOM Document ID</label>
                  <input type="text" className="w-full border border-gray-300 bg-gray-100 rounded-sm px-3 py-1.5 text-xs font-mono font-bold uppercase outline-none text-gray-500 cursor-not-allowed" value={newBOM.bomId} readOnly />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">Target FG SKU <span className="text-red-500">*</span></label>
                  <select className={`w-full border rounded-sm px-3 py-1.5 text-xs font-mono font-bold uppercase outline-none cursor-pointer ${formErrors.fgItemId ? 'border-red-500 bg-red-50 text-red-800' : 'border-gray-300 focus:border-[#125ab2] bg-white'}`} value={newBOM.fgItemId} onChange={(e) => handleFgItemSelect(e.target.value)}>
                    <option value="" disabled>Select FG Item...</option>
                    {Object.keys(productMaster).map(sku => <option key={sku} value={sku}>{sku}</option>)}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">Finished Good Name</label>
                  <input type="text" className="w-full border border-gray-300 bg-gray-100 rounded-sm px-3 py-1.5 text-xs font-semibold outline-none text-gray-600" value={newBOM.fgName} readOnly />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">Revision Code <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="e.g. Rev. 1.0" className={`w-full border rounded-sm px-3 py-1.5 text-xs font-bold outline-none focus:border-[#125ab2] ${formErrors.revision ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} value={newBOM.revision} onChange={(e) => setNewBOM({ ...newBOM, revision: e.target.value })} />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">Est. Total Cost</label>
                  <input type="text" className="w-full border border-emerald-300 bg-emerald-50 rounded-sm px-3 py-1.5 text-xs font-mono font-black text-emerald-800 outline-none cursor-not-allowed" value={`$${calculatedTotalCost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} readOnly />
                </div>
              </div>

              <div className="mb-4 border-b border-gray-100 pb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-black text-gray-700 text-[10px] uppercase tracking-wider">Engineering Attachments</h4>
                  <button onClick={handleSimulateFileUpload} className="text-gray-600 bg-gray-100 border border-gray-300 hover:bg-gray-200 px-2 py-1 rounded-sm text-[9px] font-bold uppercase tracking-wider transition-colors">+ Upload File</button>
                </div>
                <div className="flex gap-2 flex-wrap mt-1">
                  {newBOM.attachments && newBOM.attachments.length > 0 ? (
                    newBOM.attachments.map((doc, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-2 py-1.5 rounded-sm">
                        <span className="text-[9px] font-bold text-blue-800 truncate max-w-[120px]">{doc.name}</span>
                        <button onClick={() => removeAttachment(idx)} className="text-red-500 hover:text-red-700 font-bold ml-1 text-xs">✕</button>
                      </div>
                    ))
                  ) : <span className="text-[10px] text-gray-400 italic">No files attached yet.</span>}
                </div>
              </div>

              <div className="mb-2">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-black text-gray-700 text-[10px] uppercase tracking-wider">Components <span className="text-red-500">*</span></h4>
                  <button onClick={() => setNewBOM({ ...newBOM, components: [...newBOM.components, { itemId: '', name: '', qty: '', uom: '' }] })} className="text-[#125ab2] text-[9px] font-black uppercase tracking-wider hover:underline flex items-center gap-1 bg-blue-50 border border-blue-200 px-2 py-1 rounded-sm transition-colors">
                    <span>+</span> Add Row
                  </button>
                </div>
                
                {newBOM.components.length === 0 && (
                  <div className="bg-gray-50 border border-dashed border-gray-300 rounded-sm p-4 text-center text-[10px] text-gray-500 font-semibold mb-2">
                    No components added yet. Click '+ Add Row'.
                  </div>
                )}

                {newBOM.components.map((comp, index) => (
                  <div key={index} className="flex gap-2 mb-2 bg-gray-50 p-2 border border-gray-200 rounded-sm items-start hover:border-blue-300 transition-colors">
                    <div className="flex-1">
                      <select className="w-full border border-gray-300 bg-white rounded-sm px-2 py-1.5 text-[10px] font-mono font-bold uppercase outline-none focus:border-[#125ab2] mb-1 cursor-pointer" value={comp.itemId} onChange={(e) => handleComponentSelect(index, e.target.value)}>
                        <option value="" disabled>Select Component SKU...</option>
                        {Object.entries(masterComponentsDB).map(([sku, data]) => <option key={sku} value={sku}>{sku}</option>)}
                      </select>
                      <input type="text" placeholder="Description" className="w-full border border-transparent bg-transparent px-1 text-[9px] text-gray-600 font-semibold outline-none" value={comp.name} readOnly tabIndex="-1" />
                    </div>
                    <div className="w-16 shrink-0">
                      <input type="number" min="1" placeholder="Qty" className="w-full border border-gray-300 rounded-sm px-2 py-1.5 text-[11px] font-black text-center outline-none focus:border-[#125ab2]" value={comp.qty} onChange={(e) => { const updated = [...newBOM.components]; updated[index].qty = e.target.value; setNewBOM({ ...newBOM, components: updated }); }} />
                    </div>
                    <div className="w-14 shrink-0">
                      <input type="text" placeholder="UOM" className="w-full border border-gray-300 rounded-sm px-2 py-1.5 text-[9px] font-bold text-center uppercase tracking-wider bg-gray-200 text-gray-600 outline-none cursor-not-allowed" value={comp.uom} readOnly tabIndex="-1" />
                    </div>
                    <button onClick={() => { const updated = newBOM.components.filter((_, i) => i !== index); setNewBOM({ ...newBOM, components: updated }); }} className="w-6 h-6 mt-0.5 shrink-0 flex items-center justify-center text-red-400 hover:text-red-700 hover:bg-red-50 rounded transition-colors text-sm">✕</button>
                  </div>
                ))}
              </div>
            </div>

            {/* --- FOOTER --- */}
            <div className="bg-gray-50 border-t border-gray-200 px-5 py-3 flex justify-end gap-2 shrink-0">
              <button onClick={() => { resetNewBOM(); setIsModalOpen(false); }} className="px-5 py-2 bg-white border border-gray-300 hover:bg-gray-100 font-bold text-[10px] text-gray-700 uppercase tracking-wider shadow-sm rounded-sm transition-colors">
                {bahasa === 'en' ? 'Cancel' : 'Batal'}
              </button>
              <button onClick={handleSaveBOM} className="px-5 py-2 bg-[#125ab2] hover:bg-[#0e4487] text-white font-bold text-[10px] uppercase tracking-wider shadow-sm rounded-sm transition-colors">
                {editingBOM ? (bahasa === 'en' ? 'Update Revision' : 'Simpan Revisi') : (bahasa === 'en' ? 'Create BOM' : 'Simpan BOM')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ MODAL 2: DETAIL BOM (RESEP / DRILL-DOWN)                               */}
      {/* ========================================================================= */}
      {selectedBOM && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-sm w-full max-w-[650px] shadow-2xl flex flex-col overflow-hidden max-h-[80vh] animate-fade-in">
            
            <div className="bg-[#415a77] text-white px-5 py-3 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-sm uppercase tracking-wider">BOM Document: {selectedBOM.bomId}</h3>
              <button onClick={() => setSelectedBOM(null)} className="text-gray-300 hover:text-white font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
              <div className="flex flex-wrap justify-between items-start mb-5 border-b border-gray-200 pb-4">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Target Assembly</p>
                  <h4 className="font-black text-lg text-[#125ab2] mb-1">{selectedBOM.fgName}</h4>
                  <p className="font-mono font-bold text-purple-700 cursor-pointer hover:underline text-xs bg-purple-50 inline-block px-2 py-0.5 rounded border border-purple-100" onClick={() => setSelectedItem(selectedBOM.fgItemId)}>
                    {selectedBOM.fgItemId}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-sm font-black text-[10px] uppercase tracking-wider mb-2 inline-block ${selectedBOM.status === 'Archived' ? 'bg-gray-200 text-gray-700' : 'bg-blue-100 text-blue-700'}`}>
                    {selectedBOM.status}
                  </span>
                  <p className="text-xs font-bold text-gray-500 uppercase">Rev: <span className="text-gray-800">{selectedBOM.revision}</span></p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Est. Cost: <span className="font-mono font-black text-base text-emerald-700 block">{selectedBOM.cost}</span></p>
                </div>
              </div>

              <div className="mb-5">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Engineering Blueprints & SOP</p>
                {selectedBOM.attachments && selectedBOM.attachments.length > 0 ? (
                  <div className="flex gap-2 flex-wrap">
                    {selectedBOM.attachments.map((doc, i) => (
                      <div key={i} className="flex items-center gap-2 bg-gray-50 border border-gray-200 p-2 rounded-sm w-max pr-3 hover:border-[#125ab2] cursor-pointer transition-colors" onClick={() => showNotification(`Downloading ${doc.name}...`, 'info')}>
                        <div className="bg-red-100 text-red-600 p-1.5 rounded text-sm leading-none">📄</div>
                        <div>
                          <p className="text-[11px] font-bold text-gray-800">{doc.name}</p>
                          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{doc.size}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-gray-400 italic">No engineering documents attached.</p>}
              </div>

              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Required Components</p>
                <div className="border border-gray-200 rounded-sm overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-600 text-[10px] uppercase tracking-wider">
                        <th className="py-2 px-3 border-b border-gray-200 w-32">COMPONENT SKU</th>
                        <th className="py-2 px-3 border-b border-gray-200">DESCRIPTION</th>
                        <th className="py-2 px-3 border-b border-gray-200 w-20 text-right">QTY</th>
                        <th className="py-2 px-3 border-b border-gray-200 w-16 text-center">UOM</th>
                      </tr>
                    </thead>
                    <tbody className="text-[11px]">
                      {selectedBOM.components.map((comp, idx) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                          <td className="py-2 px-3 font-mono font-bold text-[#125ab2]">
                            <span className="cursor-pointer hover:underline" onClick={() => setSelectedItem(comp.itemId)} title="Click for Where-Used Analysis">{comp.itemId}</span>
                          </td>
                          <td className="py-2 px-3 font-semibold text-gray-700">{comp.name}</td>
                          <td className="py-2 px-3 text-right font-black text-gray-800 text-sm">{comp.qty}</td>
                          <td className="py-2 px-3 text-center text-gray-500 text-[9px] uppercase font-bold bg-gray-50 border-l border-gray-100">{comp.uom}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border-t border-gray-200 px-5 py-3 flex flex-col sm:flex-row justify-between gap-2 shrink-0">
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button onClick={() => openEditBOM(selectedBOM)} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm rounded-sm transition-colors" disabled={selectedBOM.status === 'Archived'}>
                  Edit / Revise
                </button>
                <button onClick={() => cloneBOM(selectedBOM)} className="px-4 py-2 bg-[#2a9d8f] hover:bg-[#1e7065] text-white text-[10px] font-bold uppercase tracking-wider shadow-sm rounded-sm transition-colors">
                  Clone Recipe
                </button>
                {selectedBOM.status !== 'Archived' && (
                  <button onClick={() => archiveBOM(selectedBOM.bomId)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm rounded-sm transition-colors">
                    Archive BOM
                  </button>
                )}
              </div>
              <button onClick={() => setSelectedBOM(null)} className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-[10px] font-bold uppercase tracking-wider shadow-sm rounded-sm transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* EXPORT SETTINGS MODAL                     */}
      {/* ========================================= */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-sm w-full max-w-[500px] shadow-2xl flex flex-col max-h-[80vh] animate-fade-in border-t-4 border-[#125ab2]">
            <div className="p-5 flex items-center justify-between border-b border-gray-200 shrink-0">
              <h3 className="font-black text-sm text-gray-800 uppercase tracking-wider">{bahasa === 'en' ? 'Export BOM Documents' : 'Ekspor Dokumen BOM'}</h3>
              <button onClick={() => setIsExportModalOpen(false)} className="text-gray-400 hover:text-gray-800 font-bold text-xl leading-none">✕</button>
            </div>

            <div className="p-5 grid grid-cols-1 gap-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">Format</label>
                  <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)} className="w-full border border-gray-300 rounded-sm px-2 py-1.5 text-xs font-bold outline-none cursor-pointer">
                    <option value="csv">CSV (Data Sheet)</option>
                    <option value="pdf">PDF (Printable Report)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">Filter Status</label>
                  <select value={exportStatusFilter} onChange={(e) => setExportStatusFilter(e.target.value)} className="w-full border border-gray-300 rounded-sm px-2 py-1.5 text-xs font-bold outline-none cursor-pointer">
                    <option value="all">All Records</option>
                    <option value="Active">Active Only</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="bg-gray-50 p-3 border border-gray-200 rounded-sm">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-2">Select Fields to Export</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'bomId', label: 'BOM ID' }, { key: 'fgItemId', label: 'Target Item SKU' }, { key: 'fgName', label: 'Assembly Name' }, { key: 'revision', label: 'Revision Number' },
                    { key: 'cost', label: 'Estimated Cost' }, { key: 'status', label: 'Lifecycle Status' }, { key: 'createdDate', label: 'Date Created' }, { key: 'components', label: 'Component List' },
                  ].map((field) => (
                    <label key={field.key} className="inline-flex items-center gap-2 text-[11px] font-semibold text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={exportFields[field.key]} onChange={() => toggleExportField(field.key)} className="rounded-sm border-gray-300 w-3.5 h-3.5 text-[#125ab2] cursor-pointer" />
                      {field.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-between gap-2 shrink-0">
              <button onClick={resetExportSettings} className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-600 font-bold text-[10px] uppercase tracking-wider rounded-sm transition-colors shadow-sm">Reset</button>
              <div className="flex gap-2">
                <button onClick={() => setIsExportModalOpen(false)} className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold text-[10px] uppercase tracking-wider rounded-sm transition-colors shadow-sm">Cancel</button>
                <button onClick={handleExport} className="px-5 py-2 bg-[#125ab2] hover:bg-[#0e4487] text-white font-bold text-[10px] uppercase tracking-wider rounded-sm transition-colors shadow-sm">
                  {exportFormat === 'pdf' ? 'Generate PDF' : 'Download CSV'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ MODAL 3: ITEM SNAPSHOT / PRODUCT DETAILS (BULLETPROOF FLEXBOX)         */}
      {/* ========================================================================= */}
      {selectedItem && (() => {
        const isFinishedGood = !!productMaster[selectedItem];
        const productData = isFinishedGood ? productMaster[selectedItem] : masterComponentsDB[selectedItem];
        const impactedBOMs = boms.filter(b => b.components.some(c => c.itemId === selectedItem));

        return (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-sm w-full max-w-[500px] shadow-2xl border-t-4 border-t-purple-600 flex flex-col overflow-hidden max-h-[80vh] animate-fade-in">
              
              <div className="bg-purple-50 px-5 py-3 border-b border-purple-100 flex items-center justify-between shrink-0">
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">
                    {isFinishedGood ? 'Finished Good Record' : 'Component Master Record'}
                  </p>
                  <h3 className="font-black font-mono text-lg text-purple-700 leading-tight">{selectedItem}</h3>
                </div>
                <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-gray-800 font-bold text-xl leading-none px-2">✕</button>
              </div>

              <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
                {productData ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Nama Produk / Komponen</p>
                      <p className="text-base font-black text-gray-800 leading-tight">{productData.name}</p>
                      {isFinishedGood && <p className="text-[11px] text-gray-600 mt-1 font-medium bg-gray-50 p-2 border border-gray-100 rounded-sm">"{productData.description}"</p>}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-blue-50 p-2.5 rounded-sm border border-blue-100 text-center">
                        <p className="text-[9px] font-bold text-blue-800 uppercase tracking-wider">Satuan</p>
                        <p className="text-lg font-black text-blue-700 mt-0.5">{productData.uom}</p>
                      </div>
                      <div className="bg-green-50 p-2.5 rounded-sm border border-green-100 text-center">
                        <p className="text-[9px] font-bold text-green-800 uppercase tracking-wider">Harga</p>
                        <p className="text-lg font-black text-green-700 mt-0.5 font-mono">${isFinishedGood ? '---' : productData.cost.toFixed(2)}</p>
                      </div>
                      <div className="bg-amber-50 p-2.5 rounded-sm border border-amber-100 text-center">
                        <p className="text-[9px] font-bold text-amber-800 uppercase tracking-wider">Kategori</p>
                        <p className="text-[9px] font-black text-amber-700 mt-1 uppercase">{isFinishedGood ? 'Vehicle FG' : 'Component'}</p>
                      </div>
                    </div>

                    {isFinishedGood && (
                      <div className="border-t border-gray-100 pt-3">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Spesifikasi Teknik</p>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          {Object.entries(productData.specifications).map(([key, value]) => (
                            <div key={key} className="bg-white border border-gray-200 p-2 rounded-sm">
                              <p className="font-bold text-gray-400 text-[9px] uppercase tracking-wider mb-0.5">{key.replace('_', ' ')}</p>
                              <p className="text-gray-800 font-bold">{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* WHERE-USED ANALYSIS */}
                    {!isFinishedGood && impactedBOMs.length > 0 && (
                      <div className="border-t border-red-200 pt-3 mt-3">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-base">🚨</span>
                          <p className="text-[10px] font-black text-red-600 uppercase tracking-wider">Where-Used Analysis (Impact)</p>
                        </div>
                        <p className="text-[11px] text-gray-600 mb-2 font-semibold">Component depletion will halt the production of the following Active BOMs:</p>
                        <div className="space-y-1.5">
                          {impactedBOMs.map(bom => (
                            <div key={bom.bomId} className="bg-red-50 border border-red-100 p-2 rounded-sm flex justify-between items-center cursor-pointer hover:border-red-300 transition-colors" onClick={() => { setSelectedItem(null); setSelectedBOM(bom); }}>
                              <div>
                                <span className="font-mono font-black text-red-700 mr-2 text-xs">{bom.bomId}</span>
                                <span className="text-[11px] font-bold text-gray-800">{bom.fgName}</span>
                              </div>
                              <span className="text-red-500 text-[10px] font-bold">❯</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-sm p-4 text-center py-6">
                    <span className="text-2xl mb-2 block">🤷</span>
                    <p className="text-xs text-yellow-800 font-bold">Data tidak ditemukan di database master</p>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 border-t border-gray-200 px-5 py-3 flex justify-end shrink-0">
                <button onClick={() => setSelectedItem(null)} className="px-5 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold text-[10px] uppercase tracking-wider rounded-sm transition-colors shadow-sm">
                  Tutup Info
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </main>
  );
};

export default BOM;