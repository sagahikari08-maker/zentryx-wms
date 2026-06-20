import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from './AppContext';

// ─── TOAST COMPONENT (Notifikasi) ────────────────────────────────────────────
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
    {toasts.map(({ id, message, type }) => (
      <div key={id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-sm shadow-lg text-white text-xs font-semibold min-w-[240px] ${
        type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-orange-500'
      }`}>
        <span>{type === 'success' ? '✓' : '⚠'}</span>
        <span className="flex-1">{message}</span>
        <button onClick={() => removeToast(id)} className="opacity-70 hover:opacity-100 text-lg leading-none">×</button>
      </div>
    ))}
  </div>
);

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const InventoryAdjustments = () => {
  // ─── 🚀 INJEKSI: Memanggil inventoryData dan setInventoryData dari Engine Global ───
  const { bahasa, inventoryData, setInventoryData } = useContext(AppContext);

  // ─── 🚀 ENGINE INTERLOCK: DYNAMIC MASTER DATA DARI INVENTORY GLOBAL ───
  const masterItemsDB = useMemo(() => {
    const db = {};
    (inventoryData || []).forEach(item => {
      db[item.sku] = {
        name: item.name,
        cost: item.price || 0
      };
    });
    return db;
  }, [inventoryData]);

  // 1. DATA SIMULASI (Diperkaya dengan Nilai Finansial & Lokasi ARUS Motors)
  const [adjustments, setAdjustments] = useState([
    { id: 'ADJ-ARS-1001', date: '2026-09-18', itemId: 'SKU-ARS-LFP01', itemName: 'Blade Battery Cell 3.2V 150Ah', bin: 'ZONE-B-02', type: 'Decrease', qty: 2, unitCost: 250.00, totalValue: 500.00, reason: 'Damaged', user: 'QA Inspector', notes: 'Casing penyok akibat insiden forklift di area cold storage.' },
    { id: 'ADJ-ARS-1002', date: '2026-09-19', itemId: 'SKU-ARS-CBL12', itemName: 'High Voltage Harness Cable 50mm2', bin: 'ZONE-A-01', type: 'Increase', qty: 15, unitCost: 12.00, totalValue: 180.00, reason: 'Found', user: 'Stock Controller', notes: 'Ditemukan sisa potongan kabel valid yang belum tercatat di sistem.' },
    { id: 'ADJ-ARS-1003', date: '2026-09-20', itemId: 'SKU-ARS-MCU03', itemName: 'Motor Control Unit (MCU) Gen 3', bin: 'ZONE-A-05', type: 'Decrease', qty: 1, unitCost: 850.00, totalValue: 850.00, reason: 'Failed Diagnostic', user: 'Engineering', notes: 'Gagal tes diagnostik kelistrikan (Short circuit). Dialokasikan untuk R&D.' },
  ]);

  // 2. STATE UI & MODAL
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAdj, setSelectedAdj] = useState(null);
  const [selectedItemDetail, setSelectedItemDetail] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [toasts, setToasts] = useState([]);

  // State Form dengan fitur Auto-fill
  const [form, setForm] = useState({ 
    itemId: '', itemName: '', bin: '', type: 'Decrease', qty: '', unitCost: 0, reason: 'Damaged', notes: '' 
  });

  // 3. TOAST LOGIC
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // 4. STATS & FILTERING LOGIC
  const filteredAdj = useMemo(() => {
    let data = adjustments.filter(adj => 
      adj.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      adj.itemId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      adj.itemName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (typeFilter !== 'All') data = data.filter(adj => adj.type === typeFilter);
    return data;
  }, [adjustments, searchQuery, typeFilter]);

  const stats = useMemo(() => {
    const writeOff = adjustments.filter(a => a.type === 'Decrease').reduce((sum, a) => sum + a.totalValue, 0);
    const writeOn = adjustments.filter(a => a.type === 'Increase').reduce((sum, a) => sum + a.totalValue, 0);
    return {
      totalCount: adjustments.length,
      writeOffValue: writeOff,
      writeOnValue: writeOn,
      netImpact: writeOn - writeOff
    };
  }, [adjustments]);

  // 5. ACTION HANDLERS
  const handleItemLookup = (id) => {
    const item = masterItemsDB[id.toUpperCase()];
    if (item) {
      setForm({ ...form, itemId: id.toUpperCase(), itemName: item.name, unitCost: item.cost });
    } else {
      setForm({ ...form, itemId: id.toUpperCase(), itemName: 'Unknown Item', unitCost: 0 });
    }
  };

  const handleSave = () => {
    if (!form.itemId || !form.qty || !form.bin) {
      addToast('Item ID, Target Zone/Bin, and Qty are required!', 'error');
      return;
    }

    const q = parseInt(form.qty, 10);
    const totalVal = q * form.unitCost;

    const newAdj = {
      id: `ADJ-ARS-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      itemId: form.itemId,
      itemName: form.itemName || 'Manual Item Entry',
      bin: form.bin.toUpperCase(),
      type: form.type,
      qty: q,
      unitCost: form.unitCost,
      totalValue: totalVal,
      reason: form.reason,
      user: 'Current User', 
      notes: form.notes || '-'
    };

    setAdjustments([newAdj, ...adjustments]); 

    // ─── 🚀 ENGINE INTERLOCK: SYNC KE INVENTORY GLOBAL ───
    if (setInventoryData) {
      setInventoryData(prevInv => {
        let newInv = [...prevInv];
        const existingItemIndex = newInv.findIndex(i => i.sku === form.itemId);
        
        if (existingItemIndex >= 0) {
          if (form.type === 'Increase') {
            newInv[existingItemIndex].qty += q;
          } else {
            newInv[existingItemIndex].qty = Math.max(0, newInv[existingItemIndex].qty - q);
          }
        } else if (form.type === 'Increase') {
          // Jika item baru direkam melalui Adjustment Increase
          newInv.push({
            sku: form.itemId,
            name: form.itemName,
            qty: q,
            price: form.unitCost,
            category: 'Misc Adjustments',
            location: form.bin.toUpperCase()
          });
        }
        return newInv;
      });
    }

    setIsModalOpen(false);
    addToast('Inventory adjusted and posted to ARUS financial & physical ledger.', 'success');
    setForm({ itemId: '', itemName: '', bin: '', type: 'Decrease', qty: '', unitCost: 0, reason: 'Damaged', notes: '' });
  };

  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 animate-fade-in">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>📦 Inventory</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Control</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide">
            {bahasa === 'en' ? 'Inventory Adjustments' : 'Penyesuaian Stok (Write-off)'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {bahasa === 'en' ? 'Record manual changes and track the financial impact of EV component shrink/gain.' : 'Catat perubahan manual dan lacak dampak finansial dari penyusutan/penemuan komponen EV.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 px-4 py-2 rounded-sm shadow-sm text-xs font-bold transition-colors">
            ↓ Export Ledger
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-4 py-2 rounded-sm shadow-sm text-sm font-bold transition-colors"
          >
            + {bahasa === 'en' ? 'New Adjustment' : 'Buat Penyesuaian'}
          </button>
        </div>
      </div>

      {/* ── DASHBOARD STATS (Financial Impact) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <div className="bg-white border border-gray-200 p-4 shadow-sm border-l-4 border-l-[#415a77]">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Total Records</p>
          <h3 className="text-2xl font-black text-[#333]">{stats.totalCount}</h3>
        </div>
        <div className="bg-white border border-gray-200 p-4 shadow-sm border-l-4 border-l-red-500">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Total Write-Off (Loss)</p>
          <h3 className="text-2xl font-black text-red-600">-${stats.writeOffValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
        </div>
        <div className="bg-white border border-gray-200 p-4 shadow-sm border-l-4 border-l-green-500">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Total Write-On (Gain)</p>
          <h3 className="text-2xl font-black text-green-600">+${stats.writeOnValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
        </div>
        <div className="bg-white border border-gray-200 p-4 shadow-sm border-l-4 border-l-amber-500">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Net Financial Impact</p>
          <h3 className={`text-2xl font-black ${stats.netImpact < 0 ? 'text-red-600' : 'text-green-600'}`}>
            {stats.netImpact < 0 ? '-' : '+'}${Math.abs(stats.netImpact).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </h3>
        </div>
      </div>

      {/* ── SEARCH & FILTER ── */}
      <div className="bg-white border border-gray-300 shadow-sm p-3 mb-0 flex gap-2">
        <input 
          type="text"
          placeholder="Search ADJ ID, SKU, or Component Name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 border border-gray-300 px-3 py-1.5 text-xs outline-none focus:border-[#125ab2] transition-colors"
        />
        <select 
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border border-gray-300 px-3 py-1.5 text-xs outline-none bg-gray-50 text-gray-600 font-bold"
        >
          <option value="All">All Types</option>
          <option value="Decrease">Shrinkage / Decrease (-)</option>
          <option value="Increase">Found / Increase (+)</option>
        </select>
      </div>

      {/* ── TABLE AREA ── */}
      <div className="bg-white border border-gray-300 shadow-sm w-full overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-[#e5e5e5] text-[#666666] text-[11px] border-b border-gray-300">
                <th className="py-3 px-4 font-bold w-24">ADJ ID</th>
                <th className="py-3 px-4 font-bold w-28">DATE</th>
                <th className="py-3 px-4 font-bold w-48">COMPONENT DETAIL</th>
                <th className="py-3 px-4 font-bold text-center w-24">LOCATION</th>
                <th className="py-3 px-4 font-bold text-center w-20">QTY</th>
                <th className="py-3 px-4 font-bold text-right w-28">VALUE IMPACT</th>
                <th className="py-3 px-4 font-bold w-32">REASON</th>
                <th className="py-3 px-4 font-bold">USER</th>
              </tr>
            </thead>
            <tbody className="text-[12px] text-[#333333]">
              {filteredAdj.length === 0 ? (
                <tr><td colSpan="8" className="py-10 text-center text-gray-400 italic font-bold">No adjustment records found.</td></tr>
              ) : (
                filteredAdj.map((adj) => (
                  <tr key={adj.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                    <td className="py-3 px-4">
                      <span 
                        onClick={() => setSelectedAdj(adj)}
                        className="text-[#125ab2] font-black cursor-pointer hover:underline"
                        title="View Document"
                      >
                        {adj.id}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 font-mono font-bold text-[11px]">{adj.date}</td>
                    <td className="py-3 px-4">
                      <span 
                        onClick={() => setSelectedItemDetail(adj)}
                        className="text-[#125ab2] font-mono font-bold cursor-pointer hover:underline text-[12px]"
                      >
                        {adj.itemId}
                      </span>
                      <p className="text-[10px] font-semibold text-gray-600 mt-0.5">{adj.itemName}</p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-gray-100 border border-gray-300 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold">
                        {adj.bin}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-sm font-black text-[12px] ${adj.type === 'Increase' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {adj.type === 'Increase' ? '+' : '-'}{adj.qty}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-right font-black font-mono ${adj.type === 'Increase' ? 'text-green-600' : 'text-red-600'}`}>
                      {adj.type === 'Increase' ? '+' : '-'}${adj.totalValue.toLocaleString('en-US', {minimumFractionDigits: 2})}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider bg-gray-100 px-2 py-1 rounded-sm">{adj.reason}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-[11px] font-semibold">{adj.user}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ MODAL 1: FORM INPUT PENYESUAIAN ═══ */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-sm w-full max-w-[500px] shadow-2xl overflow-hidden animate-fade-in">
            <div className="bg-[#415a77] text-white px-5 py-3 flex justify-between items-center">
              <h3 className="font-bold text-sm uppercase tracking-wider">Post Stock Adjustment</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-300 hover:text-white font-bold text-xl leading-none">✕</button>
            </div>
            
            <div className="p-6 text-sm">
              {/* Info Banner */}
              <div className="bg-blue-50 border border-blue-200 text-blue-800 text-[10px] p-3 rounded-sm mb-5">
                <strong>💡 Quick Data Entry:</strong> Ketik SKU komponen (e.g. <code>SKU-ARS-CBL12</code>) untuk auto-fill nama & standar harga (Cost) barang dari Global Inventory.
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Component SKU <span className="text-red-500">*</span></label>
                  <input 
                    type="text" placeholder="e.g. SKU-ARS-LFP01" value={form.itemId} 
                    onChange={e => handleItemLookup(e.target.value)} 
                    className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] font-mono text-sm uppercase font-bold" 
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Zone / Bin Location <span className="text-red-500">*</span></label>
                  <input 
                    type="text" placeholder="e.g. ZONE-A-01" value={form.bin} 
                    onChange={e => setForm({...form, bin: e.target.value})} 
                    className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] font-mono text-sm uppercase font-bold" 
                  />
                </div>
                
                <div className="col-span-2 bg-gray-50 border border-gray-200 p-3 rounded-sm text-xs">
                  <span className="font-bold text-gray-500 uppercase text-[9px] tracking-wider">Item Name:</span> <span className="text-[#125ab2] font-bold ml-1">{form.itemName || '---'}</span><br/>
                  <div className="mt-1"><span className="font-bold text-gray-500 uppercase text-[9px] tracking-wider">Standard Unit Cost:</span> <span className="text-green-700 font-black font-mono ml-1">${form.unitCost.toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Adj Type</label>
                  <select 
                    value={form.type} 
                    onChange={e => setForm({...form, type: e.target.value})}
                    className={`w-full border px-3 py-2 outline-none font-bold cursor-pointer ${form.type === 'Increase' ? 'bg-green-50 text-green-800 border-green-300' : 'bg-red-50 text-red-800 border-red-300'}`}
                  >
                    <option value="Decrease">Decrease (-)</option>
                    <option value="Increase">Increase (+)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Quantity <span className="text-red-500">*</span></label>
                  <input 
                    type="number" min="1" placeholder="Qty" value={form.qty} 
                    onChange={e => setForm({...form, qty: e.target.value})} 
                    className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] font-black text-lg font-mono text-[#125ab2]" 
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Reason Code <span className="text-red-500">*</span></label>
                <select 
                  value={form.reason} 
                  onChange={e => setForm({...form, reason: e.target.value})}
                  className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] bg-white cursor-pointer font-semibold text-gray-700"
                >
                  <option value="Damaged">Damaged / Broken (Rusak Fisik)</option>
                  <option value="Failed Diagnostic">Failed Diagnostic / Short Circuit (Gagal Tes)</option>
                  <option value="Lost">Lost / Missing (Hilang)</option>
                  <option value="Found">Found / Count Correction (Koreksi Stock Opname)</option>
                  <option value="Data Entry Error">Data Entry Error (Salah Input)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Audit Notes</label>
                <textarea 
                  rows="2" placeholder="Provide context for finance audit..." value={form.notes}
                  onChange={e => setForm({...form, notes: e.target.value})}
                  className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] resize-none"
                ></textarea>
              </div>
            </div>

            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-bold transition-colors uppercase tracking-wider shadow-sm rounded-sm">Cancel</button>
              <button onClick={handleSave} className="px-6 py-2 bg-[#125ab2] hover:bg-[#0e4487] text-white text-xs font-bold shadow-sm transition-colors uppercase tracking-wider rounded-sm">Post Adjustment</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL 2: DETAIL DOKUMEN ADJ (READ-ONLY) ═══ */}
      {selectedAdj && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-sm w-[500px] shadow-2xl overflow-hidden animate-fade-in">
            <div className="bg-gray-100 border-b border-gray-300 px-5 py-4 flex justify-between items-center">
              <h3 className="font-bold text-[#4d5f79] text-sm uppercase tracking-wider">Adjustment Ledger: {selectedAdj.id}</h3>
              <button onClick={() => setSelectedAdj(null)} className="text-gray-400 hover:text-gray-700 font-bold text-xl leading-none">✕</button>
            </div>
            
            <div className="p-6 text-sm text-gray-700">
              <div className="mb-5 flex justify-between items-center pb-4 border-b border-gray-100">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Posting Date</p>
                  <p className="font-mono font-bold text-[#125ab2]">{selectedAdj.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Ledger Status</p>
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-sm font-black text-[10px] uppercase tracking-wider border border-green-200">Posted & Locked</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-sm mb-5 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-black font-mono text-[#125ab2] text-lg">{selectedAdj.itemId}</p>
                  <span className="bg-white border border-blue-300 text-blue-800 px-2 py-0.5 font-bold text-[10px] uppercase tracking-wider rounded">{selectedAdj.bin}</span>
                </div>
                <p className="font-bold text-gray-800">{selectedAdj.itemName}</p>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-5 text-center">
                <div className="border border-gray-200 p-2 rounded-sm bg-gray-50 shadow-sm">
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-1">Quantity</p>
                  <p className={`font-black font-mono text-xl ${selectedAdj.type === 'Increase' ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedAdj.type === 'Increase' ? '+' : '-'}{selectedAdj.qty}
                  </p>
                </div>
                <div className="border border-gray-200 p-2 rounded-sm bg-gray-50 shadow-sm">
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-1">Unit Cost</p>
                  <p className="font-black font-mono text-lg text-gray-700">${selectedAdj.unitCost.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                </div>
                <div className="border border-gray-200 p-2 rounded-sm bg-gray-50 shadow-sm">
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-1">Total Impact</p>
                  <p className={`font-black font-mono text-xl ${selectedAdj.type === 'Increase' ? 'text-green-600' : 'text-red-600'}`}>
                    ${selectedAdj.totalValue.toLocaleString('en-US', {minimumFractionDigits: 2})}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Reason Code</p>
                <p className="font-bold text-gray-800 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-sm inline-block">{selectedAdj.reason}</p>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Audit Notes & User Origin</p>
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-sm">
                  <p className="italic text-gray-700 text-xs font-medium">"{selectedAdj.notes}"</p>
                  <p className="text-[10px] text-gray-500 mt-3 border-t border-amber-200 pt-2 uppercase tracking-wider">Posted by: <strong className="text-gray-800">{selectedAdj.user}</strong></p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button onClick={() => setSelectedAdj(null)} className="w-full px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-black transition-colors uppercase tracking-wider rounded-sm shadow-sm">
                  Close Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL 3: ITEM MASTER SNAPSHOT ═══ */}
      {selectedItemDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-sm w-[350px] shadow-2xl p-6 text-sm text-center border-t-4 border-[#125ab2] animate-fade-in">
            <h3 className="font-bold text-gray-400 mb-1 uppercase tracking-widest text-[10px]">Component Master Record</h3>
            <p className="font-black font-mono text-2xl text-[#125ab2] mb-1">{selectedItemDetail.itemId}</p>
            <p className="font-bold text-gray-800 mb-4">{selectedItemDetail.itemName}</p>
            
            <div className="bg-blue-50 p-4 rounded-sm border border-blue-100 mb-6 text-left">
              <p className="text-[#125ab2] text-xs font-semibold leading-relaxed text-center">
                Snapshot API active.<br/>Connected to Zentryx Core.
              </p>
            </div>
            
            <button onClick={() => setSelectedItemDetail(null)} className="w-full bg-gray-200 hover:bg-gray-300 transition-colors py-2.5 font-black text-[10px] text-gray-700 rounded-sm uppercase tracking-widest shadow-sm">
              Tutup Profil
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default InventoryAdjustments;