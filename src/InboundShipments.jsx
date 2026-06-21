import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from './AppContext';

// ─── COMPONENT UTAMA ──────────────────────────────────────────────────────────
const InboundShipments = () => {
  const { bahasa } = useContext(AppContext);

  // 1. DATA SIMULASI (Dengan Persistence Engine / Local Storage)
  const defaultShipments = [
    { 
      id: 'ASN-ARS-2608-01', vendor: 'PT Voltara Daya Nusantara', poRef: 'PO-ARS-260801',
      eta: '2026-09-15', carrier: 'ARUS Internal Logistics', status: 'In Transit',
      items: [
        { sku: 'SKU-ARS-LFP01', name: 'Blade Battery Cell 3.2V 150Ah', qty: 10000 },
      ]
    },
    { 
      id: 'ASN-ARS-2608-02', vendor: 'ElectroTech Indo', poRef: 'PO-ARS-260802',
      eta: '2026-08-12', carrier: 'JNE Trucking Freight', status: 'Received',
      items: [
        { sku: 'SKU-ARS-MCU03', name: 'Motor Control Unit (MCU) Gen 3', qty: 210 },
      ]
    },
    { 
      id: 'ASN-ARS-2608-03', vendor: 'Kabelindo EV Solutions', poRef: 'PO-ARS-260803',
      eta: '2026-08-20', carrier: 'PT Pelindo Cargo', status: 'Pending',
      items: [
        { sku: 'SKU-ARS-CBL12', name: 'High Voltage Harness Cable 50mm2', qty: 5000 },
      ]
    },
    { 
      id: 'ASN-ARS-2607-99', vendor: 'PT Surya Logistik', poRef: 'PO-ARS-260804',
      eta: '2026-07-28', carrier: 'Self Pickup', status: 'Received',
      items: [
        { sku: 'SKU-ARS-CHZ04', name: 'Underbody Steel Chassis Frame', qty: 90 },
      ]
    },
  ];

  const [shipments, setShipments] = useState(() => {
    try {
      const saved = window.localStorage.getItem('zentryx_inboundShipments');
      return saved ? JSON.parse(saved) : defaultShipments;
    } catch {
      return defaultShipments;
    }
  });

  // 🚀 PENYIMPANAN OTOMATIS: Menyimpan perubahan ke Local Storage setiap ada update
  useEffect(() => {
    window.localStorage.setItem('zentryx_inboundShipments', JSON.stringify(shipments));
  }, [shipments]);

  // 2. STATE UNTUK UI (Filter & Modal)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedASN, setSelectedASN] = useState(null);

  // ─── 🚀 FITUR: FUNGSI TERIMA BARANG LANGSUNG ───
  const handleReceive = (id) => {
    setShipments(prev => prev.map(ship => 
      ship.id === id ? { ...ship, status: 'Received' } : ship
    ));
  };

  // 3. LOGIKA FILTERING & SORTING
  const filteredShipments = useMemo(() => {
    return shipments
      .filter(s => 
        s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.poRef.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => new Date(a.eta) - new Date(b.eta));
  }, [shipments, searchQuery]);

  // 4. LOGIKA STATISTIK (Dashboard Cards)
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);

    return {
      total: shipments.length,
      inTransit: shipments.filter(s => s.status === 'In Transit').length,
      received: shipments.filter(s => s.status === 'Received').length,
      overdue: shipments.filter(s => {
        const etaDate = new Date(s.eta);
        return s.status === 'In Transit' && etaDate < today;
      }).length
    };
  }, [shipments]);

  // 5. HELPER: CEK OVERDUE UNTUK STYLING BARIS
  const getRowClass = (eta, status) => {
    if (status !== 'In Transit' && status !== 'Pending') return '';
    const today = new Date();
    today.setHours(0,0,0,0);
    const etaDate = new Date(eta);
    if (etaDate < today) return 'bg-red-50 hover:bg-red-100'; 
    if (etaDate.getTime() === today.getTime()) return 'bg-yellow-50 hover:bg-yellow-100'; 
    return 'hover:bg-blue-50';
  };

  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 animate-fade-in">
      
      {/* ── HEADER ── */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>🛡️ Receiving</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Inbound</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide">
            {bahasa === 'en' ? 'Inbound Shipments (ASN)' : 'Logistik Masuk (ASN Supplier)'}
          </h2>
          <p className="text-gray-500 text-xs mt-1">
            {bahasa === 'en' ? 'Track, monitor, and prepare EV manufacturing labor for incoming supplier shipments.' : 'Pantau, monitor, dan siapkan SDM perakitan EV untuk menerima pengiriman komponen masuk.'}
          </p>
        </div>
        <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors shadow-sm">
          ↓ Download Manifest
        </button>
      </div>

      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total Shipments', value: stats.total, color: 'border-l-[#4d5f79]', textColor: 'text-[#4d5f79]' },
          { label: 'In Transit', value: stats.inTransit, color: 'border-l-blue-500', textColor: 'text-blue-600' },
          { label: 'Received (Past 30 Days)', value: stats.received, color: 'border-l-emerald-500', textColor: 'text-emerald-600' },
          { label: 'Overdue (Action Needed!)', value: stats.overdue, color: 'border-l-red-500', textColor: 'text-red-600' },
        ].map((stat, i) => (
          <div key={i} className={`bg-white border border-gray-200 ${stat.color} border-l-4 rounded-sm shadow-sm p-4`}>
            <div className="text-[11px] uppercase text-gray-500 font-bold tracking-wider">{stat.label}</div>
            <div className={`text-3xl font-black ${stat.textColor} mt-1`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* ── SEARCH & FILTER BAR ── */}
      <div className="bg-white border border-gray-300 shadow-sm p-3 mb-0 flex gap-2">
        <input 
          type="text"
          placeholder={bahasa === 'en' ? 'Search ASN ID, Vendor, or PO Reference...' : 'Cari No ASN, Vendor, atau Referensi PO...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 border border-gray-300 px-3 py-1.5 text-xs outline-none focus:border-[#125ab2] transition-colors"
        />
        <select className="border border-gray-300 px-3 py-1.5 text-xs outline-none bg-gray-50 text-gray-600 font-bold">
          <option>All Status</option>
          <option>In Transit</option>
          <option>Pending</option>
          <option>Received</option>
        </select>
      </div>

      {/* ── TABLE AREA ── */}
      <div className="bg-white border border-gray-300 shadow-sm overflow-hidden">
        
        <div className="bg-blue-50 px-4 py-2.5 border-b border-blue-100 flex items-center gap-2 text-xs text-[#125ab2]">
          <span>ℹ️</span>
          <span className="font-semibold">
            {bahasa === 'en' ? `Showing ${filteredShipments.length} incoming shipments for ARUS Motors. Click ASN ID to view components.` : `Menampilkan ${filteredShipments.length} pengiriman masuk ARUS Motors. Klik No ASN untuk detail komponen.`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-[#e5e5e5] text-[#666666] text-[11px] border-b border-gray-300">
                <th className="py-2.5 px-4 font-bold w-32">ASN ID</th>
                <th className="py-2.5 px-4 font-bold">VENDOR</th>
                <th className="py-2.5 px-4 font-bold w-28">PO REF</th>
                <th className="py-2.5 px-4 font-bold w-32">ETA</th>
                <th className="py-2.5 px-4 font-bold w-32">CARRIER</th>
                <th className="py-2.5 px-4 font-bold w-24 text-center">STATUS</th>
                <th className="py-2.5 px-4 font-bold text-center w-32">ACTION</th>
              </tr>
            </thead>
            <tbody className="text-[12px] text-[#333333]">
              {filteredShipments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-gray-400 font-bold italic">No shipments found matching criteria.</td>
                </tr>
              ) : (
                filteredShipments.map((ship) => {
                  const isOverdue = getRowClass(ship.eta, ship.status).includes('red');
                  return (
                    <tr key={ship.id} className={`border-b border-gray-100 transition-colors ${getRowClass(ship.eta, ship.status)}`}>
                      <td className="py-3 px-4">
                        <button 
                          onClick={() => setSelectedASN(ship)}
                          className="font-black text-[#125ab2] hover:underline flex items-center gap-1.5"
                        >
                          📦 {ship.id}
                        </button>
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-800">{ship.vendor}</td>
                      <td className="py-3 px-4 font-mono font-bold text-gray-600">{ship.poRef}</td>
                      <td className="py-3 px-4 font-semibold text-gray-700 relative">
                        {ship.eta}
                        {isOverdue && <span className="absolute right-2 top-3.5 text-xs animate-pulse" title="Overdue Shipment">⚠️</span>}
                      </td>
                      <td className="py-3 px-4 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">{ship.carrier}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded-sm font-black text-[9px] uppercase tracking-wider border ${
                          ship.status === 'Received' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                          ship.status === 'In Transit' ? 'bg-blue-100 text-blue-700 border-blue-200' : 
                          'bg-amber-100 text-amber-700 border-amber-200'
                        }`}>
                          {ship.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {ship.status === 'In Transit' || ship.status === 'Pending' ? (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReceive(ship.id); 
                            }}
                            className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-4 py-1.5 rounded-sm text-[10px] font-bold uppercase transition-colors shadow-sm"
                            title="Mark as Received"
                          >
                            {bahasa === 'en' ? 'Start Receive' : 'Mulai Terima'}
                          </button>
                        ) : ship.status === 'Received' ? (
                          <span className="text-gray-400 text-[10px] font-bold italic uppercase tracking-wider">Doc Filed</span>
                        ) : (
                          <span className="text-gray-400 text-[10px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 font-bold flex justify-between items-center">
            <div>Showing {filteredShipments.length} ASN(s)</div>
            <div className="flex gap-1">
                <button className="px-3 py-1 border border-gray-300 bg-white hover:bg-gray-100 uppercase tracking-wider transition-colors">Prev</button>
                <button className="px-3 py-1 border border-gray-300 bg-white hover:bg-gray-100 uppercase tracking-wider transition-colors">Next</button>
            </div>
        </div>
      </div>

      {/* ── MODAL DETAIL ASN ── */}
      {selectedASN && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-sm w-full max-w-[600px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
            
            {/* Modal Header */}
            <div className="bg-[#415a77] text-white px-5 py-4 flex justify-between items-center shrink-0">
              <h3 className="font-black text-sm uppercase tracking-wider">Shipment Details: {selectedASN.id}</h3>
              <button 
                onClick={() => setSelectedASN(null)}
                className="text-gray-300 hover:text-white font-bold text-xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* Modal Content (Scrollable) */}
            <div className="p-6 overflow-y-auto">
              {/* Info Utama */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-6 pb-4 border-b border-gray-100 text-sm">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Vendor</p>
                  <p className="font-black text-[#125ab2]">{selectedASN.vendor}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">PO Reference</p>
                  <p className="font-mono font-bold text-gray-800">{selectedASN.poRef}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Carrier</p>
                  <p className="font-bold text-gray-800">{selectedASN.carrier}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Expected Arrival (ETA)</p>
                  <p className="font-black text-emerald-600">{selectedASN.eta}</p>
                </div>
              </div>

              {/* Daftar Barang (The real drill-down) */}
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Expected EV Components / SKU List</p>
              <div className="border border-gray-200 rounded-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-[10px] text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4 border-b">SKU</th>
                      <th className="py-2.5 px-4 border-b">Component Name</th>
                      <th className="py-2.5 px-4 border-b text-right">Qty Expected</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {selectedASN.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#125ab2]">{item.sku}</td>
                        <td className="py-3 px-4 font-semibold text-gray-800">{item.name}</td>
                        <td className="py-3 px-4 text-right font-black text-lg text-gray-800">{item.qty.toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 shrink-0 flex justify-end">
              <button 
                onClick={() => setSelectedASN(null)}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-black uppercase tracking-wider rounded-sm transition-colors shadow-sm"
              >
                {bahasa === 'en' ? 'Close Detail' : 'Tutup Detail'}
              </button>
            </div>

          </div>
        </div>
      )}

    </main>
  );
};

export default InboundShipments;