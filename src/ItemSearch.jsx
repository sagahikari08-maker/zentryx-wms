import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from './AppContext';

// ─── TOAST COMPONENT ─────────────────────────────────────────────────────────
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
    {toasts.map(({ id, message, type }) => (
      <div key={id} className={`flex items-center gap-3 px-4 py-3 rounded-sm shadow-lg text-white text-xs font-semibold min-w-[240px] ${
        type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-orange-500'
      }`}>
        <span>{type === 'success' ? '✓' : '⚠'}</span>
        <span className="flex-1">{message}</span>
        <button onClick={() => removeToast(id)} className="opacity-70 hover:opacity-100 text-lg leading-none">×</button>
      </div>
    ))}
  </div>
);

const ItemSearch = () => {
  const { bahasa, inventoryData, setInventoryData } = useContext(AppContext);

  // Jika inventoryData dari AppContext kosong, kita pakai mock data sebagai fallback
  const fallbackData = [
    { sku: 'RM-DGH-01', name: 'Pizza Dough Base (L)', category: 'Raw Material', uom: 'Pcs', cost: 1.50, price: 0, bin: 'COLD-A-01', reorderPoint: 500, status: 'Active' },
    { sku: 'RM-SAU-02', name: 'Signature Tomato Sauce', category: 'Raw Material', uom: 'Ltr', cost: 4.00, price: 0, bin: 'DRY-B-12', reorderPoint: 200, status: 'Active' },
    { sku: 'PKG-BX-01', name: 'Large Pizza Box', category: 'Packaging', uom: 'Pcs', cost: 0.50, price: 0, bin: 'RACK-C-05', reorderPoint: 2000, status: 'Active' },
    { sku: 'FG-PZ-ML', name: 'Pizza MeatLover (Large)', category: 'Finished Good', uom: 'Box', cost: 12.00, price: 25.00, bin: 'FREEZER-1', reorderPoint: 50, status: 'Active' },
  ];

  // Gunakan data asli dari context jika ada, jika tidak pakai fallback
  const activeData = inventoryData && inventoryData.length > 0 ? inventoryData : fallbackData;

  // 1. STATE UI & FILTER
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [editItem, setEditItem] = useState(null); // State untuk Modal Edit
  const [toasts, setToasts] = useState([]);

  // 2. TOAST LOGIC
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // 3. FILTERING LOGIC
  const filteredItems = useMemo(() => {
    return activeData.filter(item => {
      const matchSearch = item.sku.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = categoryFilter === 'All' || item.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [activeData, searchQuery, categoryFilter]);

  // 4. ACTION HANDLER (SIMULASI UPDATE MASTER DATA)
  const handleSaveChanges = () => {
    // Di aplikasi nyata, ini akan nge-update inventoryData di AppContext atau Database
    // Karena kita tidak mendefinisikan update kompleks di AppContext sebelumnya,
    // kita simulasikan notifikasi suksesnya saja.
    addToast(`Master data for ${editItem.sku} has been updated successfully!`, 'success');
    setEditItem(null);
  };

  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide">
            {bahasa === 'en' ? 'Item Master Search & Directory' : 'Pencarian Induk Barang'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {bahasa === 'en' ? 'Search, filter, and manage your complete item registry.' : 'Cari, saring, dan kelola seluruh daftar induk barang Anda.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 px-4 py-2 rounded-sm shadow-sm text-xs font-bold transition-colors">
            ↓ Export List (CSV)
          </button>
        </div>
      </div>

      {/* ── SEARCH & FILTER BAR ── */}
      <div className="bg-white border border-gray-300 shadow-sm p-4 mb-4 flex flex-col md:flex-row gap-3 rounded-sm">
        <div className="flex-1">
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Search Keyword</label>
          <input 
            type="text"
            placeholder={bahasa === 'en' ? 'Scan or type SKU, Item Name...' : 'Scan atau ketik SKU, Nama Barang...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#125ab2] transition-colors"
          />
        </div>
        <div className="w-full md:w-64">
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Filter by Category</label>
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 text-sm outline-none bg-white focus:border-[#125ab2]"
          >
            <option value="All">All Categories</option>
            <option value="Raw Material">Raw Material</option>
            <option value="Packaging">Packaging</option>
            <option value="Finished Good">Finished Good</option>
          </select>
        </div>
      </div>

      {/* ── TABLE AREA ── */}
      <div className="bg-white border border-gray-300 shadow-sm w-full overflow-hidden rounded-sm">
        <div className="bg-blue-50 px-4 py-2.5 border-b border-blue-100 flex items-center gap-2 text-xs text-[#125ab2]">
          <span>ℹ️</span>
          <span>Showing <strong>{filteredItems.length}</strong> master item records.</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-[#e5e5e5] text-[#666666] text-[11px] border-b border-gray-300">
                <th className="py-3 px-4 font-bold w-24">SKU</th>
                <th className="py-3 px-4 font-bold">ITEM NAME</th>
                <th className="py-3 px-4 font-bold w-32 text-center">CATEGORY</th>
                <th className="py-3 px-4 font-bold w-20 text-center">UOM</th>
                <th className="py-3 px-4 font-bold w-28 text-center">PRIMARY BIN</th>
                <th className="py-3 px-4 font-bold w-24 text-right">COST ($)</th>
                <th className="py-3 px-4 font-bold w-24 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="text-[12px] text-[#333333]">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-400 italic">
                    No items match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-black text-[#125ab2]">{item.sku}</td>
                    <td className="py-3 px-4 font-semibold text-gray-800">{item.name}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded">
                        {item.category || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-gray-500">{item.uom || 'PCS'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono font-bold text-[11px] bg-yellow-50 text-yellow-800 border border-yellow-200 px-2 py-1 rounded">
                        {item.bin || 'UNASSIGNED'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-red-600">
                      {(item.cost || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button 
                        onClick={() => setEditItem(item)}
                        className="text-[#2a9d8f] hover:text-[#1e7166] font-bold text-[11px] underline"
                      >
                        Edit / View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ MODAL: EDIT MASTER ITEM ═══ */}
      {editItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-sm w-full max-w-[600px] shadow-2xl overflow-hidden">
            <div className="bg-[#415a77] text-white px-5 py-3 flex justify-between items-center">
              <h3 className="font-bold text-sm">Update Item Master</h3>
              <button onClick={() => setEditItem(null)} className="text-gray-300 hover:text-white font-bold text-xl leading-none">✕</button>
            </div>
            
            <div className="p-6 text-sm">
              <div className="flex gap-4 items-center mb-6 pb-4 border-b border-gray-100">
                <div className="w-14 h-14 bg-gray-100 rounded flex items-center justify-center text-2xl">📦</div>
                <div>
                  <h4 className="font-black text-xl text-[#125ab2] leading-tight">{editItem.sku}</h4>
                  <p className="font-semibold text-gray-800">{editItem.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Item Category</label>
                  <select 
                    defaultValue={editItem.category} 
                    className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] bg-white"
                  >
                    <option value="Raw Material">Raw Material</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Finished Good">Finished Good</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Base UOM</label>
                  <input type="text" defaultValue={editItem.uom} className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] bg-gray-50 cursor-not-allowed" disabled title="UOM cannot be changed once transactions exist" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Primary Bin (Lokasi Rak)</label>
                  <input type="text" defaultValue={editItem.bin} className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2] font-mono uppercase" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Reorder Point</label>
                  <input type="number" defaultValue={editItem.reorderPoint || 0} className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-[#125ab2]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 border border-gray-200 rounded-sm">
                <div>
                  <label className="block text-[10px] font-bold text-red-700 uppercase tracking-wider mb-1">Cost Price ($)</label>
                  <input type="number" step="0.01" defaultValue={editItem.cost} className="w-full border border-red-200 px-3 py-2 outline-none focus:border-red-500 font-bold text-red-700 bg-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-green-700 uppercase tracking-wider mb-1">Sale Price ($)</label>
                  <input type="number" step="0.01" defaultValue={editItem.price || 0} className="w-full border border-green-200 px-3 py-2 outline-none focus:border-green-500 font-bold text-green-700 bg-white" />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-2">
              <button onClick={() => setEditItem(null)} className="px-5 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-bold transition-colors shadow-sm">Cancel</button>
              <button onClick={handleSaveChanges} className="px-6 py-2 bg-[#2a9d8f] hover:bg-[#1e7166] text-white text-xs font-bold shadow-sm transition-colors">Update Master Data</button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
};

export default ItemSearch;