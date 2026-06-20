import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppContext } from './AppContext';

// ─── TOAST COMPONENT (Aman & Interaktif) ─────────────────────────────────────
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
    {toasts.map(({ id, message, type }) => (
      <div key={id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-sm shadow-xl text-white text-xs font-semibold min-w-[280px] border-l-4 ${
        type === 'success' ? 'bg-emerald-600 border-emerald-800' : 
        type === 'error' ? 'bg-red-600 border-red-800' : 
        type === 'warning' ? 'bg-amber-500 border-amber-800' : 'bg-[#125ab2] border-blue-800'
      }`}>
        <span className="text-base">{type === 'success' ? '✓' : type === 'error' ? '🚨' : type === 'warning' ? '⚠️' : 'ℹ'}</span>
        <span className="flex-1">{message}</span>
        <button onClick={() => removeToast(id)} className="opacity-70 hover:opacity-100 text-lg leading-none">×</button>
      </div>
    ))}
  </div>
);

const Events = () => {
  const { bahasa } = useContext(AppContext);
  const [toasts, setToasts] = useState([]);

  // ─── HELPER DATES ───
  const getDynamicDate = (daysOffset) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().slice(0, 10);
  };
  const todayStr = getDynamicDate(0);

  // ─── ARUS MOTORS GIGAFACTORY DATA ───
  const initialEvents = [
    { id: 'EVT-ARS-801', title: 'ISO 45001 Safety & HSE Audit', type: 'Audit / Inspection', date: getDynamicDate(1), time: '09:00', location: 'All Storage Zones', pic: 'Siti (HSE Chief)', impact: 'Partial Downtime', status: 'Scheduled', notes: 'External auditors arriving. Ensure all aisles are clear of pallet debris.' },
    { id: 'EVT-ARS-802', title: 'KUKA AGV Fleet Firmware Patch', type: 'IT / Maintenance', date: getDynamicDate(0), time: '22:00', location: 'Zone C (Chassis Line)', pic: 'Budi (IT Infra)', impact: 'Line-Stop (Critical)', status: 'In Progress', notes: 'Night shift halted. All AGVs must return to charging docks for OTA updates.' },
    { id: 'EVT-ARS-803', title: 'CATL Battery Mass Inbound Delivery', type: 'Mass Inbound', date: getDynamicDate(2), time: '06:30', location: 'Inbound Dock 1 & 2', pic: 'Arief (Dock Master)', impact: 'High Traffic', status: 'Scheduled', notes: '15 containers expected. Double forklift deployment required.' },
    { id: 'EVT-ARS-804', title: 'Morning Toolbox Talk: Hazard Handling', type: 'Safety Briefing', date: getDynamicDate(0), time: '07:30', location: 'Main Briefing Hall', pic: 'Rini (Floor Spv)', impact: 'No Impact', status: 'Completed', notes: 'Discussing recent near-miss in the Clean Room. All morning staff attended.' },
  ];

  const [events, setEvents] = useState(() => {
    try {
      const saved = window.localStorage.getItem('eventsData_ARUS');
      return saved ? JSON.parse(saved) : initialEvents;
    } catch {
      return initialEvents;
    }
  });

  useEffect(() => {
    window.localStorage.setItem('eventsData_ARUS', JSON.stringify(events));
  }, [events]);

  // ─── STATE MANAGEMENT ───
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const modalRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const defaultForm = {
    id: '', title: '', type: 'Audit / Inspection', date: todayStr, time: '08:00', 
    location: 'Zone A (Ambient)', pic: '', impact: 'No Impact', status: 'Scheduled', notes: ''
  };
  const [form, setForm] = useState(defaultForm);

  const options = {
    types: ['Audit / Inspection', 'IT / Maintenance', 'Mass Inbound', 'Safety Briefing', 'Executive Visit', 'General'],
    impacts: ['No Impact', 'High Traffic', 'Partial Downtime', 'Line-Stop (Critical)'],
    statuses: ['Scheduled', 'In Progress', 'Completed', 'Cancelled']
  };

  // ─── TOAST FUNCS ───
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // ─── MODAL CONTROLS ───
  const openNewEvent = () => { setForm(defaultForm); setEditingId(null); setIsModalOpen(true); };
  const openEditEvent = (evt) => { setForm(evt); setEditingId(evt.id); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setForm(defaultForm); };

  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // ─── CRUD ACTIONS ───
  const handleSave = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date || !form.pic.trim()) {
      return addToast('Event title, date, and PIC are strictly required.', 'error');
    }

    if (editingId) {
      setEvents(events.map(ev => (ev.id === editingId ? { ...form } : ev)));
      addToast(`Operational Event ${editingId} updated successfully.`, 'success');
    } else {
      const nextNum = events.length > 0 ? Math.max(...events.map(i => parseInt(i.id.split('-')[2]) || 0)) + 1 : 1;
      const newId = `EVT-ARS-${nextNum.toString().padStart(3, '0')}`;
      setEvents([{ ...form, id: newId }, ...events]);
      addToast(`New Event ${newId} scheduled and broadcasted.`, 'success');
    }
    closeModal();
  };

  const handleCancelEvent = (id) => {
    if (!window.confirm('Are you sure you want to cancel/void this scheduled event?')) return;
    setEvents(events.map(ev => ev.id === id ? { ...ev, status: 'Cancelled' } : ev));
    addToast(`Event ${id} has been voided/cancelled.`, 'info');
  };

  const toggleStatusDirect = (id) => {
    setEvents(events.map(ev => {
      if (ev.id !== id) return ev;
      const nextStatus = ev.status === 'Scheduled' ? 'In Progress' : ev.status === 'In Progress' ? 'Completed' : 'Scheduled';
      if (nextStatus === 'Completed') addToast(`Event ${id} marked as Completed.`, 'success');
      return { ...ev, status: nextStatus };
    }));
  };

  // ─── CSV EXPORT ───
  const exportToCSV = () => {
    addToast('Compiling Operations Schedule...', 'info');
    const headers = ['Event_ID', 'Date', 'Time', 'Title', 'Type', 'Location', 'PIC', 'Impact', 'Status', 'Notes'];
    const csvRows = [headers.join(',')];
    
    filteredEvents.forEach(ev => {
      const row = [ev.id, ev.date, ev.time, `"${ev.title}"`, ev.type, `"${ev.location}"`, `"${ev.pic}"`, ev.impact, ev.status, `"${ev.notes}"`];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `ARUS_OpSchedules_${todayStr}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // ─── FILTERING ───
  const filteredEvents = useMemo(() => {
    const searchLow = searchQuery.toLowerCase();
    return events
      .filter(ev => {
        const matchesSearch = [ev.id, ev.title, ev.location, ev.pic].join(' ').toLowerCase().includes(searchLow);
        const matchesStatus = statusFilter === 'All' ? true : ev.status === statusFilter;
        const matchesType = typeFilter === 'All' ? true : ev.type === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
      })
      .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
  }, [events, searchQuery, statusFilter, typeFilter]);

  // ─── KPIS ───
  const upcomingCount = events.filter(e => e.status === 'Scheduled' && e.date >= todayStr).length;
  const criticalCount = events.filter(e => e.impact === 'Line-Stop (Critical)' && e.status !== 'Completed' && e.status !== 'Cancelled').length;
  const todayCount = events.filter(e => e.date === todayStr && e.status !== 'Cancelled').length;

  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 animate-fade-in">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER & KPI DASHBOARD ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>📅 Scheduling</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Operations</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide">
            {bahasa === 'en' ? 'Factory Events & Downtime Scheduler' : 'Jadwal Acara & Operasional Pabrik'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">Manage ISO audits, AGV maintenance windows, safety briefings, and mass inbound deliveries.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={exportToCSV} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-sm text-[10px] font-bold shadow-sm uppercase tracking-wider flex items-center justify-center gap-2 w-full md:w-auto transition-colors">
            <span>⭳</span> Export Roster
          </button>
          <button onClick={openNewEvent} className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-5 py-2.5 rounded-sm text-[10px] font-bold shadow-sm uppercase tracking-wider flex items-center justify-center gap-1.5 w-full md:w-auto transition-colors">
            <span>+</span> Schedule Event
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 border border-gray-200 shadow-sm rounded-sm">
          <p className="text-[9px] uppercase font-bold text-[#125ab2] tracking-wider">Scheduled Today</p>
          <p className="text-3xl font-black text-gray-900 mt-1 font-mono">{todayCount}</p>
          <p className="text-[9px] font-bold text-gray-400 mt-2 uppercase tracking-wider">Active schedules for today</p>
        </div>
        
        <div className="bg-white p-4 border-l-4 border-l-emerald-500 border border-y-gray-200 border-r-gray-200 shadow-sm rounded-sm">
          <p className="text-[9px] uppercase font-bold text-emerald-600 tracking-wider">Upcoming Roster</p>
          <p className="text-3xl font-black text-emerald-700 mt-1 font-mono">{upcomingCount}</p>
          <p className="text-[9px] font-bold text-gray-400 mt-2 uppercase tracking-wider">Future planned events</p>
        </div>
        
        <div className="bg-white p-4 border-l-4 border-l-red-600 border border-y-gray-200 border-r-gray-200 shadow-sm rounded-sm">
          <p className="text-[9px] uppercase font-bold text-red-600 tracking-wider">Line-Stop Risks</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-3xl font-black text-red-700 font-mono">{criticalCount}</p>
            {criticalCount > 0 && <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-red-200 animate-pulse">CRITICAL</span>}
          </div>
          <p className="text-[9px] font-bold text-gray-400 mt-2 uppercase tracking-wider">Halt factory operations</p>
        </div>

        <div className="bg-white p-4 border border-gray-200 shadow-sm rounded-sm">
          <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">All Records</p>
          <p className="text-3xl font-black text-gray-700 mt-1 font-mono">{events.length}</p>
          <p className="text-[9px] font-bold text-gray-400 mt-2 uppercase tracking-wider">Historical & Future</p>
        </div>
      </div>

      {/* ── TOOLBAR (FILTER & SEARCH) ── */}
      <div className="bg-white p-3 border border-gray-300 shadow-sm rounded-sm mb-4 flex flex-col lg:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700 outline-none rounded-sm cursor-pointer shadow-sm">
            <option value="All">All Event Types</option>
            {options.types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700 outline-none rounded-sm cursor-pointer shadow-sm">
            <option value="All">All Statuses</option>
            {options.statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="relative w-full lg:w-80">
          <span className="absolute left-3 top-2 opacity-40">🔍</span>
          <input 
            type="text" 
            placeholder="Search Event, Location, PIC..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-gray-300 pl-9 pr-4 py-2 rounded-sm text-xs font-semibold outline-none focus:border-[#125ab2] transition-colors shadow-sm"
          />
        </div>
      </div>

      {/* ── DATA TABLE ── */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
            <thead className="bg-[#f8f9fa] text-[#64748b] text-[9px] uppercase tracking-widest border-b border-gray-200">
              <tr>
                <th className="py-3 px-6 font-bold border-b w-40">DATE & TIME</th>
                <th className="py-3 px-6 font-bold border-b w-72">EVENT TITLE & CLASSIFICATION</th>
                <th className="py-3 px-6 font-bold border-b">LOCATION & PIC</th>
                <th className="py-3 px-6 font-bold border-b text-center">OPERATIONAL IMPACT</th>
                <th className="py-3 px-6 font-bold border-b text-center w-36">STATUS</th>
                <th className="py-3 px-6 font-bold border-b text-right w-36">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="text-[12px] text-gray-700">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-500 font-bold italic">
                    <span className="text-3xl block mb-2 opacity-50">📭</span>
                    No operational events scheduled for these criteria.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => {
                  const isCompletedOrCancelled = ev.status === 'Completed' || ev.status === 'Cancelled';
                  
                  return (
                    <tr key={ev.id} className={`border-b border-gray-100 transition-colors ${
                      isCompletedOrCancelled ? 'bg-gray-50 opacity-70 grayscale' : 'hover:bg-blue-50/40'
                    }`}>
                      <td className="py-4 px-6">
                        <div className={`font-mono font-black text-[13px] ${ev.date === todayStr && !isCompletedOrCancelled ? 'text-red-600' : 'text-gray-900'}`}>{ev.date}</div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">⏱️ {ev.time}</div>
                      </td>
                      <td className="py-4 px-6 max-w-[300px] whitespace-normal">
                        <div className={`font-bold text-gray-900 leading-tight text-[13px] ${ev.status === 'Cancelled' ? 'line-through text-gray-400' : ''}`}>{ev.title}</div>
                        <span className={`inline-block mt-1.5 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-sm border ${
                          ev.type === 'Audit / Inspection' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                          ev.type === 'IT / Maintenance' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                          ev.type === 'Mass Inbound' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                          'bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}>{ev.type}</span>
                        {ev.notes && <div className="text-[10px] text-gray-500 mt-1 italic leading-snug truncate" title={ev.notes}>{ev.notes}</div>}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-gray-800 text-[11px] uppercase tracking-wider">📍 {ev.location}</div>
                        <div className="text-[11px] text-[#125ab2] mt-1 font-semibold">👤 {ev.pic}</div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-2 py-0.5 rounded-sm border text-[9px] font-black uppercase tracking-wider shadow-sm ${
                          ev.impact === 'Line-Stop (Critical)' ? 'bg-red-600 text-white border-red-700 animate-pulse' :
                          ev.impact === 'Partial Downtime' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                          ev.impact === 'High Traffic' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                          'bg-gray-100 text-gray-600 border-gray-300'
                        }`}>
                          {ev.impact}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-2 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest border shadow-sm cursor-pointer hover:opacity-80 transition-opacity ${
                          ev.status === 'Scheduled' ? 'bg-gray-100 text-gray-700 border-gray-300' :
                          ev.status === 'In Progress' ? 'bg-amber-500 text-white border-amber-600' :
                          ev.status === 'Cancelled' ? 'bg-red-50 text-red-600 border-red-200' :
                          'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`} onClick={() => toggleStatusDirect(ev.id)} title="Click to toggle status">
                          {ev.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => openEditEvent(ev)} className="bg-white border border-gray-300 hover:bg-gray-100 text-[#125ab2] px-3 py-1.5 rounded-sm text-[9px] font-bold uppercase tracking-wider shadow-sm transition-colors">Edit</button>
                          {ev.status !== 'Cancelled' && (
                            <button onClick={() => handleCancelEvent(ev.id)} className="bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-sm text-[9px] font-bold uppercase tracking-wider shadow-sm transition-colors">Void</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🛡️ MODAL: CREATE / EDIT EVENT FORM (ENTERPRISE GRADE)                     */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 sm:p-6 overflow-hidden">
          <div ref={modalRef} className="bg-white rounded-sm w-full max-w-[650px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-[#125ab2]" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            <div className="bg-blue-50 border-b border-blue-100 px-6 py-4 flex justify-between items-center shrink-0 z-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-[#125ab2]">Operations Control</p>
                <h3 className="font-black text-sm uppercase tracking-wider text-gray-900">{editingId ? `Update Roster: ${editingId}` : 'Schedule Factory Event'}</h3>
              </div>
              <button onClick={closeModal} className="text-blue-400 hover:text-blue-800 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 text-sm flex flex-col gap-5">
                
                {/* ROW 1: Event Title */}
                <div>
                  <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Event / Audit Title <span className="text-red-500">*</span></label>
                  <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Clean Room ESD Calibration..." className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] font-black text-gray-900 rounded-sm shadow-sm text-sm" required autoFocus/>
                </div>

                {/* ROW 2: Class & Impact */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Event Classification <span className="text-red-500">*</span></label>
                    <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] font-bold text-gray-700 bg-white rounded-sm shadow-sm cursor-pointer text-xs">
                      {options.types.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Operational Impact <span className="text-red-500">*</span></label>
                    <select value={form.impact} onChange={e => setForm({...form, impact: e.target.value})} className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] font-black text-gray-700 bg-white rounded-sm shadow-sm cursor-pointer text-xs">
                      {options.impacts.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                </div>

                {/* ROW 3: Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Scheduled Date <span className="text-red-500">*</span></label>
                    <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] font-mono text-xs font-bold text-gray-800 rounded-sm shadow-sm cursor-pointer" required/>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Start Time <span className="text-red-500">*</span></label>
                    <input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] font-mono text-xs font-bold text-gray-800 rounded-sm shadow-sm cursor-pointer" required/>
                  </div>
                </div>

                {/* ROW 4: Location & PIC */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Target Zone / Area <span className="text-red-500">*</span></label>
                    <input type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="e.g. Inbound Dock Bay 2" className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] font-semibold text-gray-800 rounded-sm shadow-sm text-xs" required/>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Person In Charge (PIC) <span className="text-red-500">*</span></label>
                    <input type="text" value={form.pic} onChange={e => setForm({...form, pic: e.target.value})} placeholder="Name (Role)" className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] font-semibold text-gray-800 rounded-sm shadow-sm text-xs" required/>
                  </div>
                </div>

                {/* ROW 5: Notes & Status */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-4 border-t border-gray-100 pt-4">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Operational Brief / Notes</label>
                    <textarea rows="2" placeholder="Required preparations, LOTO warnings, etc..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] rounded-sm resize-none text-xs font-medium shadow-sm"></textarea>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Execution Status <span className="text-red-500">*</span></label>
                    <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] font-black text-gray-700 bg-white rounded-sm shadow-sm cursor-pointer text-xs">
                      {options.statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

              </div>
              
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 shrink-0 z-10">
                <button type="button" onClick={closeModal} className="w-full sm:w-auto px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm rounded-sm">Cancel</button>
                <button type="submit" className="w-full sm:w-auto px-6 py-2.5 bg-[#125ab2] hover:bg-[#0e4487] text-white text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors rounded-sm flex items-center justify-center gap-2">
                  {editingId ? 'Update Event Ledger' : 'Confirm Broadcast Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
};

export default Events;