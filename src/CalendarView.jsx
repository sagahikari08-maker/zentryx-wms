import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppContext } from './AppContext';

// ─── TOAST COMPONENT (Aman dari Bug Klik/Pointer Events) ─────────────────────
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

const CalendarView = () => {
  const { bahasa, teks, eventsData, setEventsData } = useContext(AppContext);
  const [toasts, setToasts] = useState([]);

  // ─── HELPER DATES & TIMEZONE (Jakarta GMT+7) ───
  const now = new Date();
  const jakartaOffset = 7 * 60;
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const jakartaTime = new Date(utc + (jakartaOffset * 60000));
  
  const todayDate = jakartaTime.getDate();
  const todayMonth = jakartaTime.getMonth();
  const todayYear = jakartaTime.getFullYear();
  
  const getDynamicDateStr = () => {
    return `${todayYear}-${String(todayMonth + 1).padStart(2, '0')}-${String(todayDate).padStart(2, '0')}`;
  };

  // ─── STATE MANAGEMENT ───
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(todayMonth);
  const [currentYear, setCurrentYear] = useState(todayYear);
  const [searchQuery, setSearchQuery] = useState('');
  const modalRef = useRef(null);

  // Form State yang Tersinkronisasi dengan Struktur Data Events Enterprise
  const defaultForm = {
    id: '', title: '', type: 'Audit / Inspection', date: getDynamicDateStr(), time: '08:00', 
    location: 'Zone A (Ambient)', pic: '', impact: 'No Impact', status: 'Scheduled', notes: ''
  };
  const [form, setForm] = useState(defaultForm);

  // ─── OPTIONS DIRECTORY ───
  const options = {
    types: ['Audit / Inspection', 'IT / Maintenance', 'Mass Inbound', 'Safety Briefing', 'Executive Visit', 'General'],
    impacts: ['No Impact', 'High Traffic', 'Partial Downtime', 'Line-Stop (Critical)'],
    statuses: ['Scheduled', 'In Progress', 'Completed', 'Cancelled']
  };

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthName = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // ─── CALENDAR LOGIC ───
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => null);

  const handlePrevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); } 
    else { setCurrentMonth(currentMonth - 1); }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); } 
    else { setCurrentMonth(currentMonth + 1); }
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
  
  const openEditEvent = (evt) => { 
    // Fallback jika data lama belum punya field baru
    setForm({
      id: evt.id,
      title: evt.title,
      type: evt.type || 'General',
      date: evt.date || '',
      time: evt.time || '',
      location: evt.location || '',
      pic: evt.pic || 'TBD',
      impact: evt.impact || 'No Impact',
      status: evt.status || 'Scheduled',
      notes: evt.notes || ''
    }); 
    setEditingId(evt.id); 
    setIsModalOpen(true); 
  };
  
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
      return addToast('Title, Date, and PIC are strictly required.', 'error');
    }

    const payload = {
      ...form,
      id: editingId || `EVT-ARS-${Math.floor(100 + Math.random() * 900)}`,
    };

    if (editingId) {
      setEventsData(eventsData.map((item) => (item.id === editingId ? payload : item)));
      addToast(`Schedule ${payload.id} updated successfully.`, 'success');
    } else {
      setEventsData([payload, ...eventsData]);
      addToast(`New operational schedule locked for ${payload.date}.`, 'success');
    }
    closeModal();
  };

  const handleDelete = (id) => {
    if (!window.confirm('Void this operational schedule from the calendar?')) return;
    setEventsData(eventsData.filter((item) => item.id !== id));
    addToast('Schedule successfully voided.', 'info');
  };

  // ─── EXPORT & INTEGRATIONS ───
  const formatIcsDate = (value) => {
    const date = new Date(value);
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
  };

  const downloadIcs = (event) => {
    if (!event.date) return addToast('Missing date for ICS generation.', 'error');
    const start = new Date(`${event.date}T${event.time || '09:00'}`);
    const end = new Date(start.getTime() + 60 * 60000);
    const uid = `${event.id}@zentryx.arus`;

    const lines = [
      'BEGIN:VCALENDAR', 'PRODID:-//Zentryx WMS//EN', 'VERSION:2.0', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      `X-WR-CALNAME:${event.title}`, 'BEGIN:VEVENT', `UID:${uid}`,
      `DTSTAMP:${formatIcsDate(new Date().toISOString())}`,
      `DTSTART:${formatIcsDate(start.toISOString())}`,
      `DTEND:${formatIcsDate(end.toISOString())}`,
      `SUMMARY:[${event.impact === 'Line-Stop (Critical)' ? 'CRITICAL' : event.type}] ${event.title}`,
      `DESCRIPTION:PIC: ${event.pic || 'TBD'}\\nImpact: ${event.impact}\\nNotes: ${event.notes || 'N/A'}`,
      `LOCATION:${event.location || 'Gigafactory Floor'}`,
      'STATUS:CONFIRMED', 'END:VEVENT', 'END:VCALENDAR',
    ];

    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `${event.id}_Schedule.ics`;
    document.body.appendChild(anchor); anchor.click(); document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    addToast('Calendar Invite (.ics) generated successfully.', 'success');
  };

  const generateEmailInvite = (event) => {
    const subject = encodeURIComponent(`Factory Operation Notice: ${event.title}`);
    const body = encodeURIComponent(
      `Attention Team,\n\nPlease note the following scheduled operational event:\n\n` +
      `📌 Event: ${event.title}\n` +
      `📅 Date: ${event.date} | ⏰ Time: ${event.time || 'TBD'}\n` +
      `📍 Location: ${event.location || 'TBD'}\n` +
      `👤 PIC: ${event.pic || 'TBD'}\n` +
      `⚠️ Impact Level: ${event.impact || 'Normal'}\n\n` +
      `Notes: ${event.notes || 'None'}\n\n` +
      `Please adjust your floor activities accordingly.\n\nRegards,\nZentryx Command Center`
    );
    return `mailto:?subject=${subject}&body=${body}`;
  };

  // ─── FILTERING ───
  const filteredEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return eventsData.filter((event) => {
      const searchText = [event.id, event.title, event.location, event.pic, event.date].filter(Boolean).join(' ').toLowerCase();
      return searchText.includes(query);
    });
  }, [eventsData, searchQuery]);

  const getEventsForDate = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filteredEvents.filter((evt) => evt.date === dateStr).sort((a, b) => a.time.localeCompare(b.time));
  };

  // ─── COLOR CODING ENGINE ───
  const getEventStyle = (impact, status) => {
    if (status === 'Cancelled') return 'bg-gray-100 text-gray-500 border-gray-300 line-through';
    if (status === 'Completed') return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    
    switch (impact) {
      case 'Line-Stop (Critical)': return 'bg-red-600 text-white border-red-800 animate-pulse shadow-md';
      case 'Partial Downtime': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'High Traffic': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-[#125ab2] text-white border-blue-800 shadow-sm';
    }
  };

  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 animate-fade-in">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER ── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>📅 Scheduling</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Master Calendar</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide">Factory Operations Calendar</h2>
          <p className="text-sm text-gray-500 mt-1">Visual tracking for ISO audits, maintenance downtime, and mass inbound timelines.</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={openNewEvent} className="inline-flex items-center justify-center gap-2 rounded-sm bg-[#125ab2] px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-[#0e4487] w-full md:w-auto">
            <span>+</span> Schedule Event
          </button>
        </div>
      </div>

      {/* ── TOOLBAR (NAV & SEARCH) ── */}
      <div className="bg-white p-3 border border-gray-300 shadow-sm rounded-sm mb-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 p-1 rounded-sm shadow-inner w-full md:w-auto justify-center">
          <button onClick={handlePrevMonth} className="px-4 py-1.5 hover:bg-white rounded-sm text-sm font-black text-gray-600 transition-colors shadow-sm border border-transparent hover:border-gray-300">
            &#9664;
          </button>
          <span className="px-6 py-1.5 text-sm font-black text-[#125ab2] uppercase tracking-widest min-w-[160px] text-center">
            {monthName[currentMonth]} {currentYear}
          </span>
          <button onClick={handleNextMonth} className="px-4 py-1.5 hover:bg-white rounded-sm text-sm font-black text-gray-600 transition-colors shadow-sm border border-transparent hover:border-gray-300">
            &#9654;
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <span className="absolute left-3 top-2 opacity-40">🔍</span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search date, PIC, or location..."
            className="w-full rounded-sm border border-gray-300 bg-white pl-9 pr-4 py-2 text-xs font-semibold outline-none shadow-sm focus:border-[#125ab2] transition-colors"
          />
        </div>
      </div>

      {/* ── CALENDAR GRID ── */}
      <div className="bg-white border border-gray-300 shadow-sm w-full rounded-sm">
        <div className="grid grid-cols-7 bg-[#415a77] text-white text-center font-bold py-3 text-[10px] uppercase tracking-widest">
          {days.map((d) => <div key={d}>{d}</div>)}
        </div>

        <div className="grid grid-cols-7 bg-gray-200 gap-px border-t border-gray-200">
          {emptyDays.map((_, i) => (
            <div key={`empty-${i}`} className="bg-gray-50 h-32 opacity-40"></div>
          ))}

          {dates.map((d) => {
            const isToday = d === todayDate && currentMonth === todayMonth && currentYear === todayYear;
            const dayEvents = getEventsForDate(d);

            return (
              <div key={d} className={`h-40 p-2 relative transition-all ${isToday ? 'bg-blue-50 border-2 border-[#125ab2] shadow-inner z-10' : 'bg-white hover:bg-slate-50'}`}>
                
                <div className="flex items-center justify-between mb-2 border-b border-gray-100 pb-1">
                  <div>
                    {isToday && <span className="bg-[#125ab2] text-white text-[8px] px-1.5 py-0.5 rounded-sm font-black uppercase tracking-widest shadow-sm">TODAY</span>}
                  </div>
                  <span className={`font-black text-sm ${isToday ? 'text-[#125ab2]' : 'text-gray-400'}`}>{d}</span>
                </div>

                <div className="flex flex-col gap-1.5 overflow-y-auto custom-scrollbar h-[calc(100%-2rem)] pr-1">
                  {dayEvents.map((evt) => (
                    <div key={evt.id} className={`text-[9px] p-1.5 rounded-sm border font-semibold flex flex-col gap-1 group hover:shadow-md transition-all ${getEventStyle(evt.impact, evt.status)}`}>
                      
                      <div className="text-left font-bold tracking-wide truncate leading-tight" title={`${evt.time} - ${evt.title}`}>
                        <span className="opacity-80 font-mono mr-1">{evt.time}</span>
                        {evt.title}
                      </div>

                      {/* Hover Action Panel */}
                      <div className="hidden group-hover:flex justify-between gap-1 mt-1 pt-1 border-t border-white/20">
                        <a href={generateEmailInvite(evt)} className="flex-1 bg-white/90 text-gray-800 text-center py-0.5 rounded-sm hover:bg-white transition-colors" title="Email Alert">📧</a>
                        <button onClick={() => downloadIcs(evt)} className="flex-1 bg-white/90 text-gray-800 text-center py-0.5 rounded-sm hover:bg-white transition-colors" title="Download ICS">📅</button>
                        <button onClick={() => openEditEvent(evt)} className="flex-1 bg-white/90 text-[#125ab2] text-center py-0.5 rounded-sm hover:bg-white font-black transition-colors" title="Edit">✎</button>
                        <button onClick={() => handleDelete(evt.id)} className="flex-1 bg-white/90 text-red-600 text-center py-0.5 rounded-sm hover:bg-white font-black transition-colors" title="Void">🗑</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── MODAL: CREATE / EDIT EVENT FORM (ENTERPRISE GRADE) ── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 sm:p-6 overflow-hidden">
          <div ref={modalRef} className="bg-white rounded-sm w-full max-w-[650px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-[#125ab2]" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            <div className="bg-blue-50 border-b border-blue-100 px-6 py-4 flex justify-between items-center shrink-0 z-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-[#125ab2]">Master Calendar</p>
                <h3 className="font-black text-sm uppercase tracking-wider text-gray-900">{editingId ? `Update Schedule: ${editingId}` : 'Lock New Factory Schedule'}</h3>
              </div>
              <button onClick={closeModal} className="text-blue-400 hover:text-blue-800 font-bold text-xl leading-none px-2">✕</button>
            </div>
            
            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 text-sm flex flex-col gap-5">
                
                {/* ROW 1: Event Title */}
                <div>
                  <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Event / Notice Title <span className="text-red-500">*</span></label>
                  <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Q3 Floor Inspection..." className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] font-black text-gray-900 rounded-sm shadow-sm text-sm" required autoFocus/>
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
                    <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Operational Impact Risk <span className="text-red-500">*</span></label>
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
                    <input type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="e.g. Zone B (Cold Storage)" className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] font-semibold text-gray-800 rounded-sm shadow-sm text-xs" required/>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Person In Charge (PIC) <span className="text-red-500">*</span></label>
                    <input type="text" value={form.pic} onChange={e => setForm({...form, pic: e.target.value})} placeholder="Name (Role)" className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] font-semibold text-gray-800 rounded-sm shadow-sm text-xs" required/>
                  </div>
                </div>

                {/* ROW 5: Notes & Status */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-4 border-t border-gray-100 pt-4">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Briefing / Special Instructions</label>
                    <textarea rows="2" placeholder="Required preparations, LOTO warnings, visitors..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] rounded-sm resize-none text-xs font-medium shadow-sm"></textarea>
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
                  {editingId ? 'Update Master Calendar' : 'Lock Schedule to Calendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
};

export default CalendarView;