import React, { useState, useContext, useEffect, useMemo } from 'react';
import { AppContext } from './AppContext';

// ─── TOAST COMPONENT (Aman dari Bug Klik/Pointer Events) ─────────────────────
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
    {toasts.map(({ id, message, type }) => (
      <div 
        key={id} 
        className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-sm shadow-xl text-white text-xs font-semibold min-w-[280px] border-l-4 ${
          type === 'success' ? 'bg-emerald-600 border-emerald-800' : 
          type === 'error' ? 'bg-red-600 border-red-800' : 'bg-blue-600 border-blue-800'
        }`}
      >
        <span className="text-base">{type === 'success' ? '✓' : type === 'error' ? '🛡️' : 'ℹ'}</span>
        <span className="flex-1">{message}</span>
        <button onClick={() => removeToast(id)} className="opacity-70 hover:opacity-100 text-lg leading-none">×</button>
      </div>
    ))}
  </div>
);

// ─── ZENTRYX TAXONOMY DIRECTORY (STANDARISASI UOM ENTERPRISE) ────────────────
const uomTaxonomy = {
  'Mass / Weight (Metric)': [
    { unit: 'Kilogram', abbr: 'Kg' },
    { unit: 'Gram', abbr: 'gr' },
    { unit: 'Ton (Metric)', abbr: 'T' }
  ],
  'Length / Dimension': [
    { unit: 'Meter', abbr: 'm' },
    { unit: 'Centimeter', abbr: 'cm' },
    { unit: 'Millimeter', abbr: 'mm' }
  ],
  'Volume / Capacity': [
    { unit: 'Liter', abbr: 'L' },
    { unit: 'Milliliter', abbr: 'ml' }
  ],
  'Quantity / Count': [
    { unit: 'Piece', abbr: 'Pcs' },
    { unit: 'Unit (Assembly)', abbr: 'Units' },
    { unit: 'Set (Kit)', abbr: 'Sets' }
  ]
};

const UnitsOfMeasure = () => {
  const { bahasa } = useContext(AppContext);

  // 1. DATA SIMULASI UOM CLASSES (PABRIK EV - ARUS MOTORS)
  const initialUOMs = [
    {
      id: 'UOM-ARS-001', name: 'Mass / Weight (Metric)', baseUnit: 'Kilogram', baseAbbr: 'Kg', status: 'Active',
      conversions: [
        { unitName: 'Ton', abbr: 'T', rate: 1000 },
        { unitName: 'Gram', abbr: 'gr', rate: 0.001 }
      ]
    },
    {
      id: 'UOM-ARS-002', name: 'Length / Dimension', baseUnit: 'Meter', baseAbbr: 'm', status: 'Active',
      conversions: [
        { unitName: 'Centimeter', abbr: 'cm', rate: 0.01 },
        { unitName: 'Roll (Standard Cable)', abbr: 'Roll', rate: 500 }
      ]
    },
    {
      id: 'UOM-ARS-003', name: 'Volume / Capacity', baseUnit: 'Liter', baseAbbr: 'L', status: 'Active',
      conversions: [
        { unitName: 'Milliliter', abbr: 'ml', rate: 0.001 },
        { unitName: 'Standard Drum', abbr: 'Drums', rate: 200 }
      ]
    },
    {
      id: 'UOM-ARS-004', name: 'Quantity / Count', baseUnit: 'Piece', baseAbbr: 'Pcs', status: 'Active',
      conversions: [
        { unitName: 'Box', abbr: 'Bx', rate: 50 },
        { unitName: 'Pallet', abbr: 'Plt', rate: 2000 }
      ]
    }
  ];

  // Load from LocalStorage
  const [uomClasses, setUomClasses] = useState(() => {
    try {
      const saved = window.localStorage.getItem('uomData_ARUS_Motors');
      return saved ? JSON.parse(saved) : initialUOMs;
    } catch {
      return initialUOMs;
    }
  });

  // ─── ALGORITMA PEMBERSIH PIZZA / DATA LAMA ───
  useEffect(() => {
    const hasOldData = uomClasses.some(u => 
      u.id.includes('-C-') || 
      u.conversions.some(c => c.unitName.includes('Dozen')) ||
      !u.name.includes('/') // Cek format nama taxonomy baru
    );
    if (hasOldData) {
      setUomClasses(initialUOMs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simpan setiap ada perubahan
  useEffect(() => {
    try {
      window.localStorage.setItem('uomData_ARUS_Motors', JSON.stringify(uomClasses));
    } catch (error) {
      console.error('Failed to save UOM data:', error);
    }
  }, [uomClasses]);

  // 2. STATE UI & MODAL
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUom, setSelectedUom] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [formErrors, setFormErrors] = useState({});

  // Form State untuk UOM Class Baru (Default ke Index Pertama Taxonomy)
  const defaultClass = Object.keys(uomTaxonomy)[0];
  const defaultBaseUnit = uomTaxonomy[defaultClass][0].unit;
  const defaultBaseAbbr = uomTaxonomy[defaultClass][0].abbr;

  const [form, setForm] = useState({
    name: defaultClass, 
    baseUnit: defaultBaseUnit, 
    baseAbbr: defaultBaseAbbr,
    conversions: [{ unitName: '', abbr: '', rate: '' }]
  });

  // 3. TOAST LOGIC
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // 4. FILTER DATA
  const filteredUom = useMemo(() => {
    return uomClasses.filter(u => 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.baseUnit.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [uomClasses, searchQuery]);

  // 5. ACTION HANDLERS

  // Handle Perubahan Kategori (Otomatis Reset Base Unit ke yang valid)
  const handleClassChange = (e) => {
    const newClass = e.target.value;
    const firstValidUnit = uomTaxonomy[newClass][0];
    setForm({
      ...form,
      name: newClass,
      baseUnit: firstValidUnit.unit,
      baseAbbr: firstValidUnit.abbr
    });
  };

  // Handle Perubahan Base Unit (Otomatis ganti Singkatan)
  const handleBaseUnitChange = (e) => {
    const newUnit = e.target.value;
    const selectedUnitData = uomTaxonomy[form.name].find(u => u.unit === newUnit);
    setForm({
      ...form,
      baseUnit: newUnit,
      baseAbbr: selectedUnitData.abbr
    });
  };

  const handleAddConversionRow = () => {
    setForm({ ...form, conversions: [...form.conversions, { unitName: '', abbr: '', rate: '' }] });
  };

  const handleConversionChange = (index, field, value) => {
    const updatedConversions = [...form.conversions];
    updatedConversions[index][field] = value;
    setForm({ ...form, conversions: updatedConversions });
  };

  const handleRemoveConversionRow = (index) => {
    const updatedConversions = form.conversions.filter((_, i) => i !== index);
    setForm({ ...form, conversions: updatedConversions });
  };

  const resetForm = () => {
    setForm({ 
      name: defaultClass, 
      baseUnit: defaultBaseUnit, 
      baseAbbr: defaultBaseAbbr, 
      conversions: [{ unitName: '', abbr: '', rate: '' }] 
    });
    setFormErrors({});
  };

  const handleSaveUom = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Class Name required';
    if (!form.baseUnit.trim()) errors.baseUnit = 'Base Unit required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      addToast(bahasa === 'en' ? 'Please complete all base fields!' : 'Harap isi semua kolom unit dasar!', 'error');
      return;
    }

    // Mencegah duplikasi UOM Class yang sudah ada di database utama
    const isClassExist = uomClasses.some(u => u.name === form.name && u.baseUnit === form.baseUnit);
    if (isClassExist) {
      addToast(`System Block: UOM Class untuk "${form.name}" dengan Base Unit "${form.baseUnit}" sudah eksis. Silakan edit yang sudah ada.`, 'error');
      return;
    }

    // SAFEGUARD: Validasi Konversi
    const validConversions = [];
    const usedAbbrs = [form.baseAbbr.toLowerCase()]; // Simpan base abbr untuk cegah duplikat

    for (let i = 0; i < form.conversions.length; i++) {
      const c = form.conversions[i];
      if (c.unitName || c.abbr || c.rate) {
        if (!c.unitName || !c.abbr || !c.rate) {
          addToast(`Row ${i + 1}: Please complete all fields for this conversion, or remove it.`, 'error');
          return;
        }
        
        const rateVal = parseFloat(c.rate);
        if (isNaN(rateVal) || rateVal <= 0) {
          addToast(`Row ${i + 1}: Conversion rate must be greater than 0.`, 'error');
          return;
        }

        if (usedAbbrs.includes(c.abbr.toLowerCase())) {
          addToast(`Row ${i + 1}: Abbreviation "${c.abbr}" is already used! Abbreviations must be unique.`, 'error');
          return;
        }

        usedAbbrs.push(c.abbr.toLowerCase());
        validConversions.push({ unitName: c.unitName, abbr: c.abbr, rate: rateVal });
      }
    }

    const newUom = {
      id: `UOM-ARS-${Math.floor(100 + Math.random() * 900)}`,
      name: form.name,
      baseUnit: form.baseUnit,
      baseAbbr: form.baseAbbr,
      status: 'Active',
      conversions: validConversions
    };

    setUomClasses([newUom, ...uomClasses]);
    setIsModalOpen(false);
    addToast('New Unit of Measure class securely added to Master Database.', 'success');
    resetForm();
  };

  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 animate-fade-in">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>⚙️ System</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Configurations</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide">
            {bahasa === 'en' ? 'Units of Measure (UOM)' : 'Satuan Ukur (UOM)'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {bahasa === 'en' ? 'Manage standardized measurement classes and conversion algorithms.' : 'Kelola standarisasi kelas ukuran dan algoritma konversi komponen.'}
          </p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-5 py-2 rounded-sm shadow-sm text-sm font-bold transition-colors"
        >
          + {bahasa === 'en' ? 'New UOM Class' : 'Buat Kelas UOM Baru'}
        </button>
      </div>

      {/* ── INFO BANNER ── */}
      <div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded-sm flex items-start gap-3 text-xs text-[#125ab2] mb-5 shadow-sm">
        <span className="text-lg leading-none mt-0.5">⚖️</span>
        <p className="leading-relaxed">
          <strong>Enterprise Standardization Protocol:</strong> Define a <em>Base Unit</em> first (e.g., Meter), then establish <em>Conversion Ratios</em> (e.g., 1 Roll = 500 Meters). The system will automatically calculate bidirectional rates for Procurement and Production.
        </p>
      </div>

      {/* ── SEARCH BAR ── */}
      <div className="bg-white border border-gray-300 shadow-sm p-3 mb-0 flex gap-2">
        <input 
          type="text"
          placeholder={bahasa === 'en' ? 'Search by Class Name or Base Unit...' : 'Cari berdasarkan Nama Kelas atau Satuan Dasar...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 border border-gray-300 px-3 py-1.5 text-xs outline-none focus:border-[#125ab2] transition-colors"
        />
      </div>

      {/* ── TABLE AREA ── */}
      <div className="bg-white border border-gray-300 shadow-sm w-full overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-[#e5e5e5] text-[#666666] text-[10px] uppercase tracking-wider border-b border-gray-300">
                <th className="py-3 px-4 font-bold w-32">CLASS ID</th>
                <th className="py-3 px-4 font-bold w-64">CLASS NAME / DIMENSION</th>
                <th className="py-3 px-4 font-bold w-48 bg-blue-50/50">BASE UNIT (1x)</th>
                <th className="py-3 px-4 font-bold">CONFIGURED CONVERSIONS</th>
                <th className="py-3 px-4 font-bold w-24 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody className="text-[12px] text-[#333333]">
              {filteredUom.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-400 font-bold italic">
                    <span className="text-3xl block mb-2 opacity-50">📭</span>
                    No measurement classes configured.
                  </td>
                </tr>
              ) : (
                filteredUom.map((uom) => (
                  <tr key={uom.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                    <td className="py-3 px-4">
                      <span onClick={() => setSelectedUom(uom)} className="text-[#125ab2] font-black cursor-pointer hover:underline" title="View Full Matrix">
                        {uom.id}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-800">{uom.name}</td>
                    
                    {/* BASE UNIT */}
                    <td className="py-3 px-4 bg-blue-50/30">
                      <span className="font-bold text-[#125ab2]">{uom.baseUnit}</span> 
                      <span className="text-gray-500 text-[10px] ml-1 uppercase font-black tracking-wider bg-white px-1.5 py-0.5 rounded border border-blue-100">[{uom.baseAbbr}]</span>
                    </td>

                    {/* CONVERSIONS PREVIEW */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-2">
                        {uom.conversions.length === 0 ? <span className="text-gray-400 italic text-[10px] font-semibold">Base unit only</span> : null}
                        {uom.conversions.map((conv, idx) => (
                          <span key={idx} className="bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-sm text-[10px] text-gray-700 font-mono font-bold hover:border-gray-300 transition-colors">
                            1 {conv.abbr} = {conv.rate} {uom.baseAbbr}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-sm font-bold text-[9px] uppercase tracking-wider border ${
                        uom.status === 'Active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gray-200 text-gray-600 border-gray-300'
                      }`}>
                        {uom.status}
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
      {/* 🛡️ MODAL 1: CREATE NEW UOM CLASS (BULLETPROOF FLEXBOX & DROPDOWNS)        */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[600px] shadow-2xl flex flex-col relative animate-fade-in" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            {/* --- HEADER --- */}
            <div className="bg-[#415a77] text-white px-5 py-4 flex justify-between items-center shrink-0 z-10">
              <h3 className="font-black text-sm uppercase tracking-wider">Configure New Measurement Class</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-300 hover:text-white font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            {/* --- BODY FORM --- */}
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0">
              
              <div className="bg-blue-50 border border-blue-200 text-blue-800 text-[10px] p-2.5 rounded-sm flex items-start gap-2 mb-4">
                <span className="text-sm leading-none">💡</span>
                <div className="leading-tight">
                  <strong className="text-[#125ab2]">Taxonomy Interlock:</strong> Pilih Dimensi Fisik, lalu pilih Satuan Dasar. Sistem akan mengunci struktur ini agar sesuai dengan standar industri.
                </div>
              </div>

              <h4 className="font-black text-gray-400 border-b border-gray-200 pb-2 mb-4 uppercase tracking-wider text-[10px]">Step 1: Define Base Unit</h4>
              
              {/* ── PERBAIKAN 1: DROPDOWN CLASS NAME ── */}
              <div className="mb-4">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Physical Dimension (Class) <span className="text-red-500">*</span>
                </label>
                <select 
                  value={form.name} 
                  onChange={handleClassChange} 
                  className={`w-full border px-3 py-2 outline-none text-xs font-bold cursor-pointer transition-colors ${formErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-[#125ab2]'}`} 
                >
                  {Object.keys(uomTaxonomy).map(className => (
                    <option key={className} value={className}>{className}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 bg-blue-50 p-4 border border-blue-100 rounded-sm shadow-inner">
                {/* ── PERBAIKAN 2: DROPDOWN BASE UNIT NAME (DYNAMIS) ── */}
                <div>
                  <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-1">Base Unit Name <span className="text-red-500">*</span></label>
                  <select 
                    value={form.baseUnit} 
                    onChange={handleBaseUnitChange} 
                    className={`w-full border px-3 py-2 outline-none text-xs font-bold cursor-pointer ${formErrors.baseUnit ? 'border-red-500 bg-red-50' : 'border-blue-200 focus:border-[#125ab2]'}`} 
                  >
                    {uomTaxonomy[form.name].map(unitObj => (
                      <option key={unitObj.unit} value={unitObj.unit}>{unitObj.unit}</option>
                    ))}
                  </select>
                </div>
                
                {/* ── PERBAIKAN 3: AUTO-FILL ABBREVIATION (READ-ONLY) ── */}
                <div>
                  <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-1">Abbreviation (Locked) <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={form.baseAbbr} 
                    className="w-full border border-blue-200 bg-gray-100 px-3 py-2 outline-none font-mono font-bold text-xs text-gray-600 cursor-not-allowed" 
                    readOnly
                    title="Abbreviation is locked by system taxonomy"
                  />
                </div>
                <div className="col-span-2 text-[10px] text-blue-600 font-semibold leading-tight mt-1">
                  The Base Unit is the absolute foundation. All related items in this class will use this unit for internal stock ledger calculations.
                </div>
              </div>

              <h4 className="font-black text-gray-400 border-b border-gray-200 pb-2 mb-4 uppercase tracking-wider text-[10px]">Step 2: Conversion Matrix (Optional)</h4>
              
              <div className="space-y-3 mb-4">
                {form.conversions.length === 0 && (
                  <div className="text-[10px] text-gray-400 italic">No alternative units configured. Items will only use the Base Unit.</div>
                )}
                {form.conversions.map((conv, idx) => (
                  <div key={idx} className="flex gap-2 items-end bg-gray-50 p-2 border border-gray-200 rounded-sm hover:border-gray-300 transition-colors">
                    <div className="flex-1">
                      <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Related Unit</label>
                      <input 
                        type="text" placeholder="e.g. Pallet" value={conv.unitName}
                        onChange={e => handleConversionChange(idx, 'unitName', e.target.value)}
                        className="w-full border border-gray-300 rounded-sm px-2 py-1.5 text-xs font-semibold outline-none focus:border-[#125ab2]" 
                      />
                    </div>
                    <div className="w-16 shrink-0">
                      <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Abbr.</label>
                      <input 
                        type="text" placeholder="e.g. Plt" value={conv.abbr}
                        onChange={e => handleConversionChange(idx, 'abbr', e.target.value)}
                        className="w-full border border-gray-300 rounded-sm px-2 py-1.5 text-xs font-mono font-bold outline-none focus:border-[#125ab2]" 
                      />
                    </div>
                    <div className="flex items-center pb-1.5 text-gray-400 font-black text-sm">=</div>
                    <div className="w-24 shrink-0">
                      <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Rate (Ratio)</label>
                      <input 
                        type="number" step="any" placeholder="e.g. 50" value={conv.rate}
                        onChange={e => handleConversionChange(idx, 'rate', e.target.value)}
                        className="w-full border border-gray-300 rounded-sm px-2 py-1.5 text-xs font-black text-[#125ab2] outline-none focus:border-[#125ab2]" 
                      />
                    </div>
                    <div className="flex items-center pb-2 text-[10px] font-black text-gray-500 uppercase w-12 truncate bg-transparent">
                      {form.baseAbbr || 'BASE'}
                    </div>
                    <button 
                      onClick={() => handleRemoveConversionRow(idx)}
                      className="w-7 h-7 shrink-0 flex items-center justify-center text-red-400 hover:text-red-700 hover:bg-red-50 rounded transition-colors text-lg mb-0.5"
                      title="Remove conversion"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <button 
                onClick={handleAddConversionRow}
                className="text-[10px] font-black text-[#125ab2] uppercase tracking-wider hover:underline flex items-center gap-1 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-sm transition-colors"
              >
                <span>+</span> Add Conversion Ratio
              </button>
            </div>

            {/* --- FOOTER --- */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 shrink-0 z-10">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors rounded-sm">
                Cancel
              </button>
              <button onClick={handleSaveUom} className="px-6 py-2.5 bg-[#125ab2] hover:bg-[#0e4487] text-white text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors rounded-sm">
                Commit to Database
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ MODAL 2: UOM DRILL-DOWN DETAILS (WITH BIDIRECTIONAL AUTO-CALC)       */}
      {/* ========================================================================= */}
      {selectedUom && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[500px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-purple-600" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            <div className="bg-purple-50 border-b border-purple-100 px-5 py-4 flex justify-between items-center shrink-0 z-10">
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">UOM Master Profile</p>
                <h3 className="font-black text-lg text-purple-700 leading-none">{selectedUom.id}</h3>
              </div>
              <button onClick={() => setSelectedUom(null)} className="text-gray-400 hover:text-gray-800 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0">
              <h4 className="font-black text-xl text-gray-800 leading-tight mb-5">{selectedUom.name}</h4>
              
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-sm text-center mb-6 shadow-inner">
                <p className="text-[10px] text-blue-800 font-bold uppercase tracking-wider mb-1">Absolute Base Unit</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <p className="font-black text-2xl text-[#125ab2]">{selectedUom.baseUnit}</p>
                  <span className="bg-white border border-blue-200 text-blue-700 font-mono font-bold px-2 py-1 rounded text-sm shadow-sm">{selectedUom.baseAbbr}</span>
                </div>
              </div>

              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-200 pb-2 mb-3">Bidirectional Conversion Matrix</p>
              
              <div className="space-y-3">
                {selectedUom.conversions.length === 0 ? (
                  <div className="text-center text-gray-400 font-bold italic text-xs py-4 bg-gray-50 rounded border border-gray-100">
                    No alternative conversions configured.
                  </div>
                ) : (
                  selectedUom.conversions.map((conv, idx) => {
                    const reverseRate = 1 / conv.rate;
                    const displayReverse = reverseRate % 1 === 0 ? reverseRate : reverseRate.toFixed(4).replace(/\.?0+$/, '');
                    
                    return (
                      <div key={idx} className="bg-gray-50 border border-gray-200 rounded-sm p-3 hover:border-[#125ab2] transition-colors">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-200 pb-1">{conv.unitName}</p>
                        <div className="grid grid-cols-1 gap-2">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="font-bold text-gray-800">1 {conv.abbr}</span>
                            <span className="text-gray-400">⟶</span>
                            <span className="font-black text-[#125ab2]">{conv.rate.toLocaleString('en-US')} {selectedUom.baseAbbr}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs font-mono opacity-60">
                            <span className="font-bold text-gray-600">1 {selectedUom.baseAbbr}</span>
                            <span className="text-gray-400">⟵</span>
                            <span className="font-bold text-gray-600">{displayReverse} {conv.abbr}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end shrink-0 z-10">
              <button onClick={() => setSelectedUom(null)} className="w-full sm:w-auto px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm rounded-sm">
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
};

export default UnitsOfMeasure;