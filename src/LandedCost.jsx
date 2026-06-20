import React, { useState, useContext, useEffect, useMemo } from 'react';
import { AppContext } from './AppContext';

// ─── TOAST COMPONENT (Aman dari Bug Klik/Pointer Events) ─────────────────────
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
    {toasts.map(({ id, message, type }) => (
      <div key={id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-sm shadow-xl text-white text-xs font-semibold min-w-[280px] border-l-4 ${
        type === 'success' ? 'bg-emerald-600 border-emerald-800' : type === 'error' ? 'bg-red-600 border-red-800' : 'bg-[#125ab2] border-blue-800'
      }`}>
        <span className="text-base">{type === 'success' ? '✓' : type === 'error' ? '🛡️' : 'ℹ'}</span>
        <span className="flex-1">{message}</span>
        <button onClick={() => removeToast(id)} className="opacity-70 hover:opacity-100 text-lg leading-none">×</button>
      </div>
    ))}
  </div>
);

const LandedCost = () => {
  const { bahasa } = useContext(AppContext);

  // 1. DATA MASTER LANDED COST (PABRIK EV - ARUS MOTORS)
  const initialRules = [
    { id: 'LCT-ARS-001', name: 'Battery Import Duty Tax (15%)', category: 'Customs / Duty', allocation: 'By Value (USD)', trigger: 'PO RECEIPT', description: 'Applies a flat 15% import tax addition based on the total PO Value for LFP Battery procurement.', status: 'Active' },
    { id: 'LCT-ARS-002', name: 'Ocean Freight Distribution', category: 'Freight', allocation: 'By Weight (Kg)', trigger: 'INVOICE MATCHING', description: 'Distributes overseas container shipping costs proportionally across chassis items based on physical weight.', status: 'Active' },
    { id: 'LCT-ARS-003', name: 'High-Value Transit Insurance', category: 'Insurance', allocation: 'By Value (USD)', trigger: 'BILL CREATION', description: 'Allocates comprehensive transit insurance premiums based on the invoice value of MCUs and Electronics.', status: 'Active' },
    { id: 'LCT-ARS-004', name: 'Port Handling & Staging Fee', category: 'Handling Fee', allocation: 'By Quantity (Pcs)', trigger: 'ITEM RECEIPT', description: 'Charges a fixed Tanjung Priok port handling fee divided by the total number of palletized items received.', status: 'Inactive' }
  ];

  const [rules, setRules] = useState(() => {
    try {
      const saved = window.localStorage.getItem('landedCostData_ARUS_Motors');
      return saved ? JSON.parse(saved) : initialRules;
    } catch {
      return initialRules;
    }
  });

  // ─── ALGORITMA PEMBERSIH DATA LAMA ───
  useEffect(() => {
    const hasOldData = rules.some(r => 
      r.id.startsWith('LCT-00') || 
      !r.id.includes('-ARS-')
    );
    if (hasOldData) {
      setRules(initialRules);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simpan setiap ada perubahan
  useEffect(() => {
    try {
      window.localStorage.setItem('landedCostData_ARUS_Motors', JSON.stringify(rules));
    } catch (error) {
      console.error('Failed to save Landed Cost data:', error);
    }
  }, [rules]);

  // 2. STATE FORM, MODAL, PENCARIAN & DETAIL
  const [form, setForm] = useState({ name: '', category: '', allocation: '', trigger: '', description: '' });
  const [formErrors, setFormErrors] = useState({});
  const [toasts, setToasts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 3. DAFTAR OPSI DROPDOWN (STANDARD ENTERPRISE AKUNTANSI)
  const categoryOptions = ['Freight', 'Customs / Duty', 'Insurance', 'Handling Fee', 'Storage Surcharge', 'Other Logistical Penalty'];
  const allocationOptions = ['By Value (USD)', 'By Weight (Kg)', 'By Quantity (Pcs)', 'Flat Rate / Manual Spread'];
  const triggerOptions = ['PO RECEIPT', 'ITEM RECEIPT', 'BILL CREATION', 'INVOICE MATCHING'];

  // 4. FUNGSI TOAST
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // 5. FUNGSI AKSI (Toggle Status & Delete)
  const toggleStatus = (id, e) => {
    if(e) e.stopPropagation(); 
    setRules(rules.map(rule => {
      if (rule.id === id) {
        const newStatus = rule.status === 'Active' ? 'Inactive' : 'Active';
        if (selectedRule && selectedRule.id === id) setSelectedRule({ ...rule, status: newStatus });
        return { ...rule, status: newStatus };
      }
      return rule;
    }));
    addToast(`Template ${id} operational status updated.`, 'success');
  };

  const deleteRule = (id, e) => {
    if(e) e.stopPropagation();
    if(window.confirm(`WARNING: Are you sure you want to permanently delete accounting template ${id}? This may disrupt future COGS calculations.`)) {
      setRules(rules.filter(rule => rule.id !== id));
      setSelectedRule(null);
      addToast(`Landed cost rule ${id} purged from accounting registry.`, 'success');
    }
  };

  // 6. FUNGSI SIMPAN DATA DENGAN SAFEGUARD
  const handleSave = (e) => {
    e.preventDefault();
    const errors = {};
    if (!form.name.trim()) errors.name = 'Template Name required';
    if (!form.category) errors.category = 'Cost Category required';
    if (!form.allocation) errors.allocation = 'Allocation Method required';
    if (!form.trigger) errors.trigger = 'System Trigger required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      addToast(bahasa === 'en' ? 'Please complete all required fields!' : 'Harap isi semua kolom wajib!', 'error');
      return;
    }
    
    // Auto-generate ID: LCT-ARS-00X
    const nextNum = rules.length > 0 ? Math.max(...rules.map(r => parseInt(r.id.split('-')[2]) || 0)) + 1 : 1;
    const newId = `LCT-ARS-${nextNum.toString().padStart(3, '0')}`;

    const newRule = {
      id: newId,
      name: form.name.trim(),
      category: form.category,
      allocation: form.allocation,
      trigger: form.trigger,
      description: form.description.trim() || 'No operational description provided.',
      status: 'Active'
    };
    
    setRules([newRule, ...rules]);
    setIsModalOpen(false);
    setForm({ name: '', category: '', allocation: '', trigger: '', description: '' });
    setFormErrors({});
    addToast(bahasa === 'en' ? `Cost template ${newId} deployed to accounting engine!` : `Template biaya ${newId} berhasil didaftarkan ke sistem!`, 'success');
  };

  // 7. FILTER PENCARIAN
  const filteredRules = useMemo(() => {
    return rules.filter(rule => 
      rule.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      rule.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rules, searchTerm]);

  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 animate-fade-in">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER & SEARCH BAR ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>⚙️ System</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Accounting Engine</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide">
            {bahasa === 'en' ? 'Landed Cost Templates' : 'Template Biaya Masuk (Landed Cost)'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {bahasa === 'en' ? 'Rules to automatically allocate import tax, freight, and insurance to component COGS.' : 'Aturan untuk mengalokasikan pajak impor, ongkir, dan asuransi ke COGS komponen.'}
          </p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <input 
            type="text" 
            placeholder={bahasa === 'en' ? 'Search Template ID, Name, or Category...' : 'Cari ID Template, Nama, atau Kategori...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 px-4 py-2 rounded-sm text-xs outline-none focus:border-[#125ab2] w-full md:w-64 transition-colors"
          />
          <button 
            onClick={() => {
              setForm({ name: '', category: '', allocation: '', trigger: '', description: '' });
              setFormErrors({});
              setIsModalOpen(true);
            }}
            className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-5 py-2 rounded-sm text-xs font-bold transition-colors shadow-sm uppercase tracking-wider whitespace-nowrap flex items-center gap-2"
          >
            <span>+</span> {bahasa === 'en' ? 'New Cost Rule' : 'Tambah Aturan'}
          </button>
        </div>
      </div>

      {/* ── GRID CARD VIEW ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRules.length === 0 ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center border border-dashed border-gray-300 bg-gray-50 rounded-sm">
            <span className="text-4xl opacity-30 mb-3">🧮</span>
            <p className="text-gray-500 font-bold italic">{bahasa === 'en' ? 'No landed cost templates found in accounting registry.' : 'Tidak ada template landed cost ditemukan.'}</p>
          </div>
        ) : (
          filteredRules.map((rule) => (
            <div 
              key={rule.id} 
              onClick={() => setSelectedRule(rule)}
              className={`bg-white border border-gray-200 shadow-sm p-5 rounded-sm hover:border-[#125ab2] cursor-pointer transition-colors flex flex-col justify-between ${rule.status === 'Inactive' ? 'bg-gray-50 opacity-60' : ''}`}
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[11px] text-[#125ab2] font-mono font-black tracking-widest bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{rule.id}</span>
                  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-sm border ${rule.status === 'Active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                    {rule.status}
                  </span>
                </div>
                <p className="font-black text-gray-800 text-base leading-tight mb-2 pr-2">{rule.name}</p>
                <div className="flex gap-2 mb-3 flex-wrap">
                  <span className="bg-gray-100 text-gray-600 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm border border-gray-200">{rule.category}</span>
                  
                  {/* VISUAL ALLOCATION BADGE */}
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm border ${
                    rule.allocation.includes('Value') ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    rule.allocation.includes('Weight') ? 'bg-purple-50 text-purple-700 border-purple-200' :
                    rule.allocation.includes('Quantity') ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                    'bg-slate-100 text-slate-700 border-slate-300'
                  }`}>
                    Alloc: {rule.allocation}
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-medium line-clamp-2 leading-relaxed mb-4">{rule.description}</p>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                <div className="flex gap-2 items-center">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Trigger Event:</span>
                  <span className="text-[10px] font-mono font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-sm border border-gray-200">{rule.trigger}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ========================================================================= */}
      {/* 🛡️ MODAL 1: FORM CREATE NEW RULE (BULLETPROOF FLEXBOX)                    */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[550px] shadow-2xl flex flex-col relative animate-fade-in" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            {/* --- HEADER --- */}
            <div className="bg-[#415a77] text-white px-5 py-4 flex justify-between items-center shrink-0 z-10">
              <h3 className="font-black text-sm uppercase tracking-wider">Configure New Cost Template</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-300 hover:text-white font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            {/* --- BODY FORM --- */}
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0">
              <div className="bg-blue-50 border border-blue-200 text-blue-800 text-[10px] p-3 rounded-sm flex items-start gap-3 mb-5">
                <span className="text-xl leading-none">💡</span>
                <div className="leading-tight">
                  <strong className="text-[#125ab2]">Accounting Safeguard:</strong> Aturan ini akan menentukan bagaimana biaya didistribusikan ke Harga Pokok Penjualan (HPP) komponen secara otomatis. Pilih <em>System Trigger</em> dengan hati-hati.
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Rule Name / Title <span className="text-red-500">*</span></label>
                  <input 
                    type="text" placeholder="e.g. Overseas Sea Freight Insurance" 
                    value={form.name} onChange={e => setForm({...form, name: e.target.value})} 
                    className={`w-full border px-3 py-2 outline-none text-xs font-semibold rounded-sm transition-colors ${formErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-[#125ab2]'}`} 
                  />
                  {formErrors.name && <p className="text-red-500 text-[9px] font-bold mt-1 uppercase tracking-wider">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Cost Category <span className="text-red-500">*</span></label>
                  <select 
                    value={form.category} onChange={e => setForm({...form, category: e.target.value})} 
                    className={`w-full border px-3 py-2 outline-none text-xs font-bold cursor-pointer rounded-sm bg-white ${formErrors.category ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-[#125ab2]'}`}
                  >
                    <option value="" disabled>-- Select Category --</option>
                    {categoryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Allocation Spread Method <span className="text-red-500">*</span></label>
                  <select 
                    value={form.allocation} onChange={e => setForm({...form, allocation: e.target.value})} 
                    className={`w-full border px-3 py-2 outline-none text-xs font-bold cursor-pointer rounded-sm bg-white ${formErrors.allocation ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-[#125ab2]'}`}
                  >
                    <option value="" disabled>-- Select Allocation --</option>
                    {allocationOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">System Interlock Trigger Event <span className="text-red-500">*</span></label>
                  <select 
                    value={form.trigger} onChange={e => setForm({...form, trigger: e.target.value})} 
                    className={`w-full border px-3 py-2 outline-none text-xs font-mono font-black cursor-pointer rounded-sm bg-white ${formErrors.trigger ? 'border-red-500 bg-red-50 text-red-800' : 'border-gray-300 focus:border-[#125ab2] text-[#125ab2]'}`}
                  >
                    <option value="" disabled>-- Select Accounting Trigger Entry Point --</option>
                    {triggerOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Operational Rule Description</label>
                  <textarea 
                    placeholder="Explain how this cost applies to the shipment COGS..." 
                    rows="3" 
                    value={form.description} onChange={e => setForm({...form, description: e.target.value})} 
                    className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs outline-none focus:border-[#125ab2] resize-none"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* --- FOOTER --- */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 shrink-0 z-10">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm rounded-sm">Cancel</button>
              <button onClick={handleSave} className="px-6 py-2.5 bg-[#125ab2] hover:bg-[#0e4487] text-white text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors rounded-sm">Deploy Template</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ MODAL 2: POP-UP DETAIL LANDED COST (BULLETPROOF FLEXBOX)               */}
      {/* ========================================================================= */}
      {selectedRule && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[550px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-[#125ab2]" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            <div className="bg-blue-50 border-b border-blue-100 px-6 py-4 flex justify-between items-center shrink-0 z-10">
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Finance Engine Node</p>
                <h3 className="font-black font-mono text-xl text-[#125ab2] leading-none">{selectedRule.id}</h3>
              </div>
              <button onClick={() => setSelectedRule(null)} className="text-gray-400 hover:text-gray-800 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 text-gray-800">
              <div className="border-b border-gray-200 pb-5 mb-5">
                <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider mb-1">Rule / Template Definition</span>
                <span className="text-xl font-black text-gray-900 leading-tight block pr-2">{selectedRule.name}</span>
                <p className="text-xs text-gray-600 mt-2 font-medium bg-gray-50 p-3 border border-gray-100 rounded-sm italic leading-relaxed">"{selectedRule.description}"</p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-5 mb-5">
                <div className="bg-gray-50 border border-gray-200 p-3 rounded-sm">
                  <span className="text-[9px] font-bold uppercase text-gray-500 block tracking-wider mb-1">Cost Category</span>
                  <span className="text-xs font-black text-gray-800 uppercase tracking-wider">{selectedRule.category}</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-sm">
                  <span className="text-[9px] font-bold uppercase text-emerald-800 block tracking-wider mb-1">Allocation Method</span>
                  <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">{selectedRule.allocation}</span>
                </div>
                <div className="col-span-2 bg-blue-50 border border-blue-100 p-3 rounded-sm">
                  <span className="text-[9px] font-bold uppercase text-blue-800 block tracking-wider mb-1">System Interlock Trigger</span>
                  <span className="text-sm font-black font-mono text-[#125ab2] bg-white border border-blue-200 px-2 py-0.5 rounded-sm inline-block mt-0.5">{selectedRule.trigger}</span>
                </div>
              </div>

              <div className="flex justify-between items-center bg-amber-50 border border-amber-200 p-4 rounded-sm">
                <div>
                  <span className="text-[10px] font-bold uppercase text-amber-800 block tracking-wider mb-1">Operational Status</span>
                  <span className={`inline-block px-3 py-1 text-[10px] font-black uppercase rounded-sm tracking-widest border ${selectedRule.status === 'Active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                    {selectedRule.status}
                  </span>
                </div>
                <button 
                  onClick={(e) => toggleStatus(selectedRule.id, e)} 
                  className="px-4 py-2 bg-white border border-amber-300 hover:bg-amber-100 text-amber-800 text-[9px] font-black uppercase tracking-wider rounded-sm cursor-pointer shadow-sm transition-colors"
                >
                  Change Status
                </button>
              </div>
            </div>

            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between items-center shrink-0 z-10">
              <button 
                onClick={(e) => deleteRule(selectedRule.id, e)} 
                className="bg-white border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-sm shadow-sm transition-colors"
              >
                Delete Rule
              </button>
              <button 
                onClick={() => setSelectedRule(null)} 
                className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-6 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-sm shadow-sm transition-colors"
              >
                Close Engine
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default LandedCost;