import React, { useState, useContext } from 'react';
import { AppContext } from './AppContext';

const InventoryReports = () => {
  const { bahasa } = useContext(AppContext);

  // Simulasi data inventaris untuk laporan
  const [reportData] = useState([
    { sku: 'PIZ-001', name: 'Pizza Dough Base', stock: 120, minStock: 200, unit: 'pcs', unitPrice: 15000, supplier: 'DoughPro Inc' },
    { sku: 'SAU-005', name: 'Tomato Sauce', stock: 45, minStock: 50, unit: 'kg', unitPrice: 45000, supplier: 'Italiano' },
    { sku: 'CHE-002', name: 'Mozzarella Cheese', stock: 300, minStock: 100, unit: 'kg', unitPrice: 85000, supplier: 'DairyFarm' },
  ]);

  const totalValue = reportData.reduce((acc, item) => acc + (item.stock * item.unitPrice), 0);

  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto">
      {/* ── HEADER ── */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide">
            {bahasa === 'en' ? 'Inventory Performance Report' : 'Laporan Performa Inventaris'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">Real-time stock valuation and replenishment analysis.</p>
        </div>
        <button className="bg-[#415a77] hover:bg-[#2d425b] text-white px-4 py-2 rounded-sm text-xs font-bold transition-colors">
          ⭳ {bahasa === 'en' ? 'Export CSV' : 'Ekspor Laporan'}
        </button>
      </div>

      {/* ── METRICS SUMMARY (Lampu Merah Operasional) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-4 border border-gray-300 shadow-sm rounded-sm">
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total SKUs Active</p>
          <p className="text-2xl font-black text-gray-800">{reportData.length}</p>
        </div>
        <div className="bg-white p-4 border border-gray-300 shadow-sm rounded-sm">
          <p className="text-[10px] uppercase font-bold text-red-500 tracking-wider">Need Replenishment</p>
          <p className="text-2xl font-black text-red-600">
            {reportData.filter(i => i.stock < i.minStock).length}
          </p>
        </div>
        <div className="bg-white p-4 border border-gray-300 shadow-sm rounded-sm">
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Inventory Value (IDR)</p>
          <p className="text-2xl font-black text-[#125ab2]">Rp {totalValue.toLocaleString('id-ID')}</p>
        </div>
      </div>

      {/* ── TABEL LAPORAN ── */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
        <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
          <thead className="bg-[#e5e5e5] text-[#666666] text-[11px]">
            <tr>
              <th className="py-3 px-4 font-bold border-b">SKU ID</th>
              <th className="py-3 px-4 font-bold border-b">ITEM NAME</th>
              <th className="py-3 px-4 font-bold border-b text-center">CURRENT STOCK</th>
              <th className="py-3 px-4 font-bold border-b text-center">MIN LEVEL</th>
              <th className="py-3 px-4 font-bold border-b text-right">UNIT PRICE</th>
              <th className="py-3 px-4 font-bold border-b text-right">TOTAL VALUE</th>
              <th className="py-3 px-4 font-bold border-b text-center">ACTION</th>
            </tr>
          </thead>
          <tbody className="text-[12px] text-gray-700">
            {reportData.map((item, idx) => (
              <tr key={idx} className={`border-b ${item.stock < item.minStock ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                <td className="py-3 px-4 font-mono font-bold">{item.sku}</td>
                <td className="py-3 px-4 font-semibold">{item.name}</td>
                <td className="py-3 px-4 text-center">
                  <span className={`font-bold ${item.stock < item.minStock ? 'text-red-600' : 'text-green-600'}`}>
                    {item.stock} {item.unit}
                  </span>
                </td>
                <td className="py-3 px-4 text-center font-semibold">{item.minStock} {item.unit}</td>
                <td className="py-3 px-4 text-right">Rp {item.unitPrice.toLocaleString('id-ID')}</td>
                <td className="py-3 px-4 text-right font-bold">Rp {(item.stock * item.unitPrice).toLocaleString('id-ID')}</td>
                <td className="py-3 px-4 text-center">
                  {item.stock < item.minStock && (
                    <button className="bg-red-600 text-white px-3 py-1 rounded-sm text-[10px] font-bold uppercase hover:bg-red-700">
                      Reorder
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
};

export default InventoryReports;