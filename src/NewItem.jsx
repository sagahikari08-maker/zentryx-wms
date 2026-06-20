import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from './AppContext';

// ─── TOAST COMPONENT (Notifikasi Sistem yang Aman dari Klik) ─────────────────
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
    {toasts.map(({ id, message, type }) => (
      <div
        key={id}
        className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-sm shadow-xl text-white text-xs font-semibold min-w-[280px] border-l-4 ${
          type === 'success' ? 'bg-emerald-600 border-emerald-800' :
          type === 'error'   ? 'bg-red-600 border-red-800' : 'bg-amber-500 border-amber-700'
        }`}
      >
        <span className="text-base">{type === 'success' ? '✓' : type === 'error' ? '🛡️' : '⚠'}</span>
        <span className="flex-1">{message}</span>
        <button onClick={() => removeToast(id)} className="opacity-70 hover:opacity-100 text-lg leading-none">×</button>
      </div>
    ))}
  </div>
);

// ─── MASTER LOCATION DIRECTORY (ARUS MOTORS) ─────────────────────────────────
const facilityLocations = [
  { value: 'ZONE-A-01', label: 'ZONE-A-01 (Ambient - Powertrain)' },
  { value: 'ZONE-A-05', label: 'ZONE-A-05 (Ambient - Electrical)' },
  { value: 'ZONE-B-01', label: 'ZONE-B-01 (Cold Storage - Batteries)' },
  { value: 'ZONE-B-02', label: 'ZONE-B-02 (Cold Storage - Chemicals)' },
  { value: 'ZONE-C-01', label: 'ZONE-C-01 (Heavy Rack - Chassis)' },
  { value: 'ZONE-C-02', label: 'ZONE-C-02 (Heavy Rack - Body Panels)' },
];

// ─── KATEGORI KOMPONEN EV & PREFIX GENERATOR ─────────────────────────────────
const evCategories = [
  { label: 'Energy Storage (Batteries)', prefix: 'BAT' },
  { label: 'Powertrain & Motors', prefix: 'MOT' },
  { label: 'Electrical & Harness', prefix: 'CBL' },
  { label: 'Structural Chassis', prefix: 'CHZ' },
  { label: 'Consumables & Liquids', prefix: 'CLT' },
  { label: 'Finished Good (Vehicle/Platform)', prefix: 'EV' },
];

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const NewItem = () => {
  const { bahasa, inventoryData = [], setInventoryData } = useContext(AppContext);

  // 1. STATE FORMULIR 
  const [form, setForm] = useState({
    name: '',
    category: 'Energy Storage (Batteries)', 
    uom: 'Pcs',
    qty: '',
    price: '',
    reorderPoint: '',
    bin: ''
  });

  const [toasts, setToasts] = useState([]);
  
  // Real-time valuation preview state
  const [valuationPreview, setValuationPreview] = useState(0);

  // ─── ALGORITMA AUTO-PURGE (MEMBUNUH DATA JABRA / THINKPAD) ───
  useEffect(() => {
    // Cek apakah ada data usang (ITM, Jabra, Thinkpad, Pizza) di Global Context
    const hasObsoleteData = inventoryData.some(item => 
      item.sku?.startsWith('ITM-') || 
      item.name?.toLowerCase().includes('jabra') || 
      item.name?.toLowerCase().includes('thinkpad') ||
      item.name?.toLowerCase().includes('pizza')
    );

    // Jika terdeteksi data nyasar, atau kosong sama sekali, paksa timpa dengan Data ARUS Motors!
    if (hasObsoleteData || inventoryData.length === 0) {
      const defaultArusData = [
        {
          sku: 'SKU-ARS-BAT001',
          id: 'SKU-ARS-BAT001',
          name: 'Blade Battery Cell 3.2V 150Ah',
          category: 'Energy Storage (Batteries)',
          uom: 'Pcs',
          onHand: 4500,
          qty: 4500,
          available: 4500,
          allocated: 0,
          reorderPoint: 1000,
          bin: 'ZONE-B-01',
          price: 250.00
        },
        {
          sku: 'SKU-ARS-MOT002',
          id: 'SKU-ARS-MOT002',
          name: 'Motor Control Unit (MCU) Gen 3',
          category: 'Powertrain & Motors',
          uom: 'Units',
          onHand: 210,
          qty: 210,
          available: 210,
          allocated: 0,
          reorderPoint: 50,
          bin: 'ZONE-A-05',
          price: 850.00
        }
      ];
      setInventoryData(defaultArusData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update Valuation secara real-time
  useEffect(() => {
    const q = parseFloat(form.qty) || 0;
    const p = parseFloat(form.price) || 0;
    setValuationPreview(q * p);
  }, [form.qty, form.price]);

  // 2. TOAST HELPERS
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500); 
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // 3. FUNGSI SIMPAN BARANG DENGAN ZENTRYX SAFEGUARD
  const handleSimpan = (e) => {
    e.preventDefault();
    
    // VALIDASI DASAR
    if (!form.name || !form.qty || !form.price || !form.bin) {
      addToast(bahasa === 'en' ? "Please fill all required fields, including Bin Location!" : "Harap isi semua kolom wajib termasuk Lokasi Rak!", 'error');
      return;
    }

    // ══════════════════════════════════════════════════════════════
    // ZENTRYX SAFEGUARD SYSTEM (ZONE COMPATIBILITY INTERLOCK)
    // ══════════════════════════════════════════════════════════════
    const isBattery = form.category.includes('Batteries');
    const isChemical = form.category.includes('Consumables');
    const isChassis = form.category.includes('Chassis');
    
    // Safeguard Suhu Baterai/Kimia
    if ((isBattery || isChemical) && !form.bin.includes('ZONE-B')) {
      addToast('SAFEGUARD TRIGGERED: Pelanggaran Keamanan! Baterai dan Kimia Cair HANYA diizinkan disimpan di Cold Storage (ZONE-B).', 'error');
      return;
    }

    // Safeguard Kapasitas Beban Sasis
    if (isChassis && !form.bin.includes('ZONE-C')) {
      addToast('SAFEGUARD TRIGGERED: Risiko Ambruk! Komponen struktural sasis sangat berat dan WAJIB disimpan di Heavy Rack (ZONE-C).', 'error');
      return;
    }

    // ══════════════════════════════════════════════════════════════
    // LOLOS SAFEGUARD -> BUAT SKU & SIMPAN
    // ══════════════════════════════════════════════════════════════
    
    // Cari prefix berdasarkan kategori yang dipilih
    const selectedCat = evCategories.find(c => c.label === form.category);
    const prefix = selectedCat ? selectedCat.prefix : 'GEN';

    // Generate SKU: SKU-ARS-[PREFIX][Random3Digit]
    const newSku = `SKU-ARS-${prefix}${Math.floor(100 + Math.random() * 900)}`;

    const newItem = {
      sku: newSku,
      id: newSku, 
      name: form.name,
      category: form.category,
      uom: form.uom,
      onHand: parseInt(form.qty, 10), 
      qty: parseInt(form.qty, 10),
      allocated: 0,
      available: parseInt(form.qty, 10),
      reorderPoint: parseInt(form.reorderPoint, 10) || 0,
      bin: form.bin,
      price: parseFloat(form.price)
    };

    setInventoryData([newItem, ...inventoryData]);
    addToast(`Berhasil! Master Item baru [${newSku}] telah teregistrasi dan divalidasi keamanannya.`, 'success');
    
    // Reset Form ke kondisi awal
    setForm({
      name: '',
      category: 'Energy Storage (Batteries)',
      uom: 'Pcs',
      qty: '',
      price: '',
      reorderPoint: '',
      bin: ''
    });
  };

  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 animate-fade-in">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>⚙️ System</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Master Data</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide">
            {bahasa === 'en' ? 'Create Master Component' : 'Pendaftaran Komponen Master (Baru)'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {bahasa === 'en' ? 'Register new EV components into the core Zentryx database.' : 'Daftarkan komponen EV baru ke dalam database inti Zentryx.'}
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* ── KIRI: FORMULIR INPUT DENGAN SAFEGUARDS ── */}
        <div className="w-full lg:w-5/12 bg-white border border-gray-300 shadow-sm p-6 rounded-sm h-fit">
          <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-5">
            <h3 className="font-black text-gray-700 uppercase tracking-wider text-xs">
              {bahasa === 'en' ? 'Component Specifications' : 'Spesifikasi Komponen'}
            </h3>
            <span className="text-[10px] font-bold bg-blue-50 text-[#125ab2] border border-blue-200 px-2 py-0.5 rounded-sm">Zentryx Auto-SKU Active</span>
          </div>
          
          <form onSubmit={handleSimpan} className="flex flex-col gap-4 text-sm">
            
            {/* Nama Barang */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                {bahasa === 'en' ? 'Component Name / Description' : 'Nama / Deskripsi Komponen'} <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})} 
                className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] transition-colors font-semibold text-gray-800" 
                placeholder="e.g. Lithium Ion Pack Gen 4" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Kategori */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">{bahasa === 'en' ? 'EV Category' : 'Kategori EV'}</label>
                <select
                  value={form.category}
                  onChange={e => setForm({...form, category: e.target.value})}
                  className="w-full border border-gray-300 px-3 py-2 bg-white outline-none focus:border-[#125ab2] font-semibold text-gray-700 cursor-pointer text-xs"
                >
                  {evCategories.map(cat => (
                    <option key={cat.prefix} value={cat.label}>{cat.label}</option>
                  ))}
                </select>
              </div>
              
              {/* Satuan UOM */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">{bahasa === 'en' ? 'Unit of Measure' : 'Satuan (UOM)'}</label>
                <select
                  value={form.uom}
                  onChange={e => setForm({...form, uom: e.target.value})}
                  className="w-full border border-gray-300 px-3 py-2 bg-white outline-none focus:border-[#125ab2] font-semibold text-gray-700 cursor-pointer text-xs"
                >
                  <option value="Pcs">Pcs (Pieces)</option>
                  <option value="Units">Units (Assemblies)</option>
                  <option value="Meters">Meters (Cables/Wiring)</option>
                  <option value="Drums">Drums (Liquids)</option>
                  <option value="Sets">Sets (Kits)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Stok Awal */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  {bahasa === 'en' ? 'Initial Stock' : 'Stok Awal'} <span className="text-red-500">*</span>
                </label>
                <input 
                  type="number" min="0"
                  value={form.qty} 
                  onChange={e => setForm({...form, qty: e.target.value})} 
                  className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] font-black text-lg text-[#125ab2]" 
                  placeholder="0" 
                />
              </div>
              
              {/* Harga Modal */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  {bahasa === 'en' ? 'Standard Cost (USD)' : 'Harga Standar ($)'} <span className="text-red-500">*</span>
                </label>
                <input 
                  type="number" step="0.01" min="0"
                  value={form.price} 
                  onChange={e => setForm({...form, price: e.target.value})} 
                  className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] font-black text-lg text-emerald-700" 
                  placeholder="0.00" 
                />
              </div>
            </div>

            {/* LIVE VALUATION PREVIEW */}
            {valuationPreview > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-sm flex justify-between items-center">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Est. Initial Asset Valuation:</span>
                <span className="font-mono font-black text-emerald-700 text-sm">${valuationPreview.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
              {/* ZENTRYX SAFEGUARD BIN SELECTOR */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  {bahasa === 'en' ? 'Assigned Bin' : 'Lokasi Rak Utama'} <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.bin}
                  onChange={e => setForm({...form, bin: e.target.value})}
                  className="w-full border border-gray-300 px-3 py-2 bg-white outline-none focus:border-[#125ab2] font-mono font-bold text-xs text-gray-700 cursor-pointer"
                >
                  <option value="" disabled>Select Bin Zone...</option>
                  {facilityLocations.map(loc => (
                    <option key={loc.value} value={loc.value}>{loc.label}</option>
                  ))}
                </select>
                <p className="text-[9px] text-red-500 font-bold mt-1 uppercase">Note: Storage rules apply!</p>
              </div>

              {/* ROP */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  {bahasa === 'en' ? 'Reorder Point (ROP)' : 'Batas Restock (ROP)'}
                </label>
                <input 
                  type="number" min="0"
                  value={form.reorderPoint} 
                  onChange={e => setForm({...form, reorderPoint: e.target.value})} 
                  className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] font-bold text-gray-700 text-xs" 
                  placeholder="Min Alert Qty" 
                />
              </div>
            </div>

            <button type="submit" className="mt-4 bg-[#125ab2] hover:bg-[#0e4487] text-white py-3 rounded-sm font-black transition-colors shadow-sm uppercase tracking-widest text-xs flex items-center justify-center gap-2">
              <span>+</span> {bahasa === 'en' ? 'Register Component to Database' : 'Daftarkan Komponen ke Database'}
            </button>
          </form>
        </div>

        {/* ── KANAN: TABEL PREVIEW REGISTRY ── */}
        <div className="w-full lg:w-7/12 bg-white border border-gray-300 shadow-sm p-6 rounded-sm">
          <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-5">
            <h3 className="font-black text-gray-700 uppercase tracking-wider text-xs">
              {bahasa === 'en' ? 'Component Master Registry' : 'Daftar Induk Komponen EV'}
            </h3>
            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-sm">Total: {inventoryData.length} Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-[#e5e5e5] text-[#666666] text-[10px] uppercase tracking-wider border-b border-gray-300">
                  <th className="py-2.5 px-4 font-bold w-24">SYSTEM SKU</th>
                  <th className="py-2.5 px-4 font-bold">COMPONENT NAME & CATEGORY</th>
                  <th className="py-2.5 px-4 font-bold text-center w-20">UOM</th>
                  <th className="py-2.5 px-4 font-bold text-center w-28">BIN LOC</th>
                  <th className="py-2.5 px-4 font-bold w-24 text-right">ON HAND</th>
                  <th className="py-2.5 px-4 font-bold w-28 text-right">VALUATION</th>
                </tr>
              </thead>
              <tbody className="text-[12px] text-[#333333]">
                {inventoryData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-gray-400 font-bold italic">
                      <span className="text-3xl block mb-2 opacity-50">📭</span>
                      No EV components registered in the master database yet.
                    </td>
                  </tr>
                ) : (
                  inventoryData.map((item, index) => {
                    const stockValue = (item.onHand || item.qty || 0) * (item.price || 0);
                    return (
                      <tr key={index} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-black text-[#125ab2]">{item.sku}</td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-gray-800 text-sm truncate max-w-[200px]" title={item.name}>{item.name}</p>
                          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">{item.category || 'Raw Material'}</p>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-gray-500 text-[10px] uppercase">{item.uom || 'Pcs'}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded-sm font-mono font-bold text-[9px] uppercase tracking-widest border ${
                            item.bin?.includes('ZONE-B') ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            item.bin?.includes('ZONE-C') ? 'bg-amber-100 text-amber-800 border-amber-200' :
                            'bg-gray-100 text-gray-700 border-gray-300'
                          }`}>
                            {item.bin || 'UNASSIGNED'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-black text-gray-800 text-sm">{(item.onHand || item.qty || 0).toLocaleString('id-ID')}</td>
                        <td className="py-3 px-4 text-right font-mono font-black text-emerald-700 text-sm">${stockValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
};

export default NewItem;