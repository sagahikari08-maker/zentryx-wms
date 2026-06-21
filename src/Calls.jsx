import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppContext } from './AppContext';

//-TOAST COMPONENT (Aman & Interaktif)
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
    {toasts.map(({ id, message, type }) => (
      <div key={id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-sm shadow-xl text-white text-xs font-semibold min-w-[280px] border-l-4 ${
        type === 'success' ? 'bg-emerald-600 border-emerald-800' :
        type === 'error' ? 'bg-red-600 border-red-800' :
        type === 'warning' ? 'bg-amber-500 border-amber-800' : 'bg-[#125ab2] border-blue-800'
      }`}>
        <span className="text-base">{type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ'}</span>
        <span className="flex-1">{message}</span>
        <button onClick={() => removeToast(id)} className="opacity-70 hover:opacity-100 text-lg leading-none">×</button>
      </div>
    ))}
  </div>
);

const Calls = () => {
  const { bahasa, teks } = useContext(AppContext);
  const [toasts, setToasts] = useState([]);

  //-HELPER DATES
  const getDynamicDate = (daysOffset) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().slice(0, 10);
  };
  const todayStr = getDynamicDate(0);

  //-ARUS MOTORS DUMMY DATA-
  const initialCalls = [
    { id: 'CAL-ARS-901', category: 'Vendor Escalation', contact: 'Bpk. Hendra (PT Voltara Baterai)', subject: 'Q3 LFP Battery Fulfillment Delay', date: todayStr, time: '10:00', status: 'Completed', notes: 'Agreed to expedite 500 packs by next Monday. Added penalty waiver.' },
    { id: 'CAL-ARS-902', category: 'Customs Clearance', contact: 'Bea Cukai Tanjung Priok', subject: 'Tax Document Verification for MCU Gen 3', date: getDynamicDate(1), time: '14:30', status: 'Scheduled', notes: 'Prepare Form PIB and Commercial Invoice before the call.' },
    { id: 'CAL-ARS-903', category: '3PL Logistics', contact: 'Maersk Operations Desk', subject: 'Container Bay 4 Routing Status', date: getDynamicDate(-1), time: '16:00', status: 'Missed', notes: 'They did not pick up. Need to follow up immediately via email.' },
    { id: 'CAL-ARS-904', category: 'Internal Sync', contact: 'Engineering Dept (Pak Joko)', subject: 'MRO Parts Shortage for Robot Arm', date: todayStr, time: '13:00', status: 'Scheduled', notes: 'Review pending Purchase Requisition #10041.' },
  ];

  const [calls, setCalls] = useState(() => {
    try {
      const saved = window.localStorage.getItem('callsData_ARUS');
      return saved ? JSON.parse(saved) : initialCalls;
    } catch {
      return initialCalls;
    }
  });

  useEffect(() => {
    window.localStorage.setItem('callsData_ARUS', JSON.stringify(calls));
  }, [calls]);

  //-STATE MANAGEMENT
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const modalRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const defaultForm = {
    id: '', category: 'Vendor Escalation', contact: '', subject: '', date: todayStr, time: '09:00', status: 'Scheduled', notes: ''
  };
  const [form, setForm] = useState(defaultForm);

  const options = {
    statuses: ['Scheduled', 'Completed', 'Missed', 'Cancelled'],
    categories: ['Vendor Escalation', '3PL Logistics', 'Customs Clearance', 'Internal Sync', 'General Inquiry']
  };

  //-TOAST FUNCS
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // MODAL CONTROLS
  const openNewCall = () => { setForm(defaultForm); setEditingId(null); setIsModalOpen(true); };
  const openEditCall = (call) => { setForm(call); setEditingId(call.id); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setForm(defaultForm); };

  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // CRUD ACTIONS
  const handleSave = (e) => {
    e.preventDefault();
    if (!form.contact.trim() || !form.subject.trim() || !form.date) {
      return addToast('Contact entity, subject, and date are strictly required.', 'error');
    }

    if (editingId) {
      setCalls(calls.map(c => (c.id === editingId ? { ...form } : c)));
      addToast(`Communication Log ${editingId} updated.`, 'success');
    } else {
      const nextNum = calls.length > 0 ? Math.max(...calls.map(i => parseInt(i.id.split('-')[2]) || 0)) + 1 : 1;
      const newId = `CAL-ARS-${nextNum.toString().padStart(3, '0')}`;
      setCalls([{ ...form, id: newId }, ...calls]);
      addToast(`New interaction logged: ${newId}.`, 'success');
    }
    closeModal();
  };

  const handleDelete = (id) => {
    if (!window.confirm('Erase this communication record? This cannot be undone.')) return;
    setCalls(calls.filter(c => c.id !== id));
    addToast(`Record ${id} permanently deleted.`, 'info');
  };

  const toggleStatusDirect = (id) => {
    setCalls(calls.map(c => {
      if (c.id !== id) return c;
      const nextStatus = c.status === 'Scheduled' ? 'Completed' : c.status === 'Completed' ? 'Missed' : 'Scheduled';
      if (nextStatus === 'Completed') addToast(`Call ${id} marked as Completed.`, 'success');
      return { ...c, status: nextStatus };
    }));
  };

  //-INTEGRATIONS (EMAIL & ICS)
  const generateEmailLink = (call) => {
    const subject = encodeURIComponent(`Follow-up/Inquiry: ${call.subject}`);
    const body = encodeURIComponent(
      `Hello ${call.contact},\n\nI am writing to follow up regarding our topic: "${call.subject}".\n\n` +
      `Our scheduled time is/was: ${call.date} at ${call.time}.\n\n` +
      `[Add your message here]\n\nBest regards,\nSupply Chain Command Center\nARUS Motors`
    );
    return `mailto:?subject=${subject}&body=${body}`;
  };

  const downloadIcs = (call) => {
    if (!call.date || !call.time) return addToast('Date and time required to generate calendar invite.', 'error');
    const start = new Date(`${call.date}T${call.time}`);
    const end = new Date(start.getTime() + 30 * 60000);
    const pad = (n) => String(n).padStart(2, '0');
    const formatIcsDate = (date) => `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
    const uid = `${call.id}@zentryx.arus`;

    const lines = [
      'BEGIN:VCALENDAR', 'PRODID:-//Zentryx ERP//EN', 'VERSION:2.0', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VEVENT', `UID:${uid}`, `DTSTAMP:${formatIcsDate(new Date())}`, `DTSTART:${formatIcsDate(start)}`, `DTEND:${formatIcsDate(end)}`,
      `SUMMARY:${call.subject} (${call.category})`, `DESCRIPTION: Contact: ${call.contact}\\nNotes: ${call.notes}`,
      'STATUS:CONFIRMED', 'END:VEVENT', 'END:VCALENDAR'
    ];
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${call.id}_Invite.ics`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Calendar (.ics) file generated!', 'success');
  };

  //-FILTERING
  const filteredCalls = useMemo(() => {
    const searchLow = searchQuery.toLowerCase();
    return calls
      .filter(c => {
        const matchesSearch = [c.id, c.contact, c.subject, c.notes].join(' ').toLowerCase().includes(searchLow);
        const matchesStatus = statusFilter === 'All' ? true : c.status === statusFilter;
        const matchesCategory = categoryFilter === 'All' ? true : c.category === categoryFilter;
        return matchesSearch && matchesStatus && matchesCategory;
      })
      .sort((a, b) => new Date(`${b.date}T${b.time}`) - new Date(`${a.date}T${a.time}`)); // Descending by date
  }, [calls, searchQuery, statusFilter, categoryFilter]);

  //-KPIS
  const scheduledCount = calls.filter(c => c.status === 'Scheduled').length;
  const completedCount = calls.filter(c => c.status === 'Completed').length;
  const missedCount = calls.filter(c => c.status === 'Missed').length;

  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 animate-fade-in">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/*-HEADER & KPI DASHBOARD-*/}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>Communications</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Log</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide">
            {teks?.callTitle || 'External & Escalation Comm Log'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">Track meetings, vendor escalations, customs verifications, and operational calls.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={openNewCall} className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-5 py-2.5 rounded-sm text-[10px] font-bold shadow-sm uppercase tracking-wider flex items-center justify-center gap-1.5 w-full md:w-auto transition-colors">
            <span>+</span> Log New Call / Meeting
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 border-l-4 border-l-[#125ab2] border border-y-gray-200 border-r-gray-200 shadow-sm rounded-sm">
          <p className="text-[9px] uppercase font-bold text-[#125ab2] tracking-wider">Upcoming/Scheduled</p>
          <p className="text-3xl font-black text-gray-900 mt-1 font-mono">{scheduledCount}</p>
          <p className="text-[9px] font-bold text-gray-400 mt-2 uppercase tracking-wider">Pending execution</p>
        </div>
        <div className="bg-white p-4 border-l-4 border-l-emerald-500 border border-y-gray-200 border-r-gray-200 shadow-sm rounded-sm">
          <p className="text-[9px] uppercase font-bold text-emerald-600 tracking-wider">Completed Logs</p>
          <p className="text-3xl font-black text-emerald-700 mt-1 font-mono">{completedCount}</p>
          <p className="text-[9px] font-bold text-gray-400 mt-2 uppercase tracking-wider">Successfully engaged</p>
        </div>
        <div className="bg-white p-4 border-l-4 border-l-red-500 border border-y-gray-200 border-r-gray-200 shadow-sm rounded-sm">
          <p className="text-[9px] uppercase font-bold text-red-600 tracking-wider">Missed/Ignored</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-3xl font-black text-red-700 font-mono">{missedCount}</p>
            {missedCount > 0 && <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-red-200 animate-pulse">REQ FOLLOW UP</span>}
          </div>
          <p className="text-[9px] font-bold text-gray-400 mt-2 uppercase tracking-wider">Requires rescheduling</p>
        </div>
        <div className="hidden md:block bg-gray-50 p-4 border border-gray-200 shadow-inner rounded-sm text-center flex flex-col justify-center">
          <span className="text-2xl mb-1 opacity-60">📞</span>
          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Total Records: {calls.length}</p>
        </div>
      </div>

      {/*-TOOLBAR (FILTER & SEARCH)-*/}
      <div className="bg-white p-3 border border-gray-300 shadow-sm rounded-sm mb-4 flex flex-col lg:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700 outline-none rounded-sm cursor-pointer shadow-sm">
            <option value="All">All Categories</option>
            {options.categories.map(c => <option key={c} value={c}>{c}</option>)}
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
            placeholder={teks?.callSearch || 'Search entity, subject, notes...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-gray-300 pl-9 pr-4 py-2 rounded-sm text-xs font-semibold outline-none focus:border-[#125ab2] transition-colors shadow-sm"
          />
        </div>
      </div>

      {/*-DATA TABLE-*/}
      <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
            <thead className="bg-[#f8f9fa] text-[#64748b] text-[9px] uppercase tracking-widest border-b border-gray-200">
              <tr>
                <th className="py-3 px-6 font-bold border-b w-40">LOG ID & CATEGORY</th>
                <th className="py-3 px-6 font-bold border-b w-64">TARGET ENTITY/CONTACT</th>
                <th className="py-3 px-6 font-bold border-b">SUBJECT & OUTCOME NOTES</th>
                <th className="py-3 px-6 font-bold border-b text-center w-36">SCHEDULE</th>
                <th className="py-3 px-6 font-bold border-b text-center w-32">STATUS</th>
                <th className="py-3 px-6 font-bold border-b text-right w-48">QUICK ACTIONS</th>
              </tr>
            </thead>
            <tbody className="text-[12px] text-gray-700">
              {filteredCalls.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-500 font-bold italic">
                    <span className="text-3xl block mb-2 opacity-50">📭</span>
                    No communication logs found for these criteria.
                  </td>
                </tr>
              ) : (
                filteredCalls.map((call) => {
                  const isMissed = call.status === 'Missed';
                  const isCompleted = call.status === 'Completed';
                  return (
                    <tr key={call.id} className={`border-b border-gray-100 transition-colors ${isCompleted ? 'bg-gray-50 opacity-80' : isMissed ? 'bg-red-50/40 hover:bg-red-50' : 'hover:bg-blue-50/40'}`}>
                      <td className="py-4 px-6">
                        <div className="font-mono font-black text-[#125ab2] text-[13px]">{call.id}</div>
                        <span className={`inline-block mt-1.5 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-sm border ${
                          call.category === 'Vendor Escalation' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                          call.category === '3PL Logistics' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                          call.category === 'Customs Clearance' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                          'bg-gray-100 text-gray-600 border-gray-200'
                        }`}>{call.category}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-gray-900 leading-tight text-[13px] whitespace-normal max-w-[200px]">{call.contact}</div>
                      </td>
                      <td className="py-4 px-6 max-w-[280px] whitespace-normal">
                        <div className="font-bold text-gray-800 text-[12px]">{call.subject}</div>
                        {call.notes ? (
                          <div className="text-[10px] text-gray-500 mt-1 italic leading-snug truncate border-l-2 border-gray-300 pl-2" title={call.notes}>"{call.notes}"</div>
                        ) : (
                          <div className="text-[9px] text-gray-400 mt-1 uppercase tracking-wider">No outcome notes recorded.</div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="font-bold text-gray-900">{call.date}</div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">{call.time}</div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-2 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest border shadow-sm cursor-pointer hover:opacity-80 transition-opacity ${
                          call.status === 'Scheduled' ? 'bg-blue-50 text-[#125ab2] border-blue-200' :
                          call.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                          call.status === 'Cancelled' ? 'bg-gray-100 text-gray-500 border-gray-300' :
                          'bg-red-100 text-red-800 border-red-300'
                        }`} onClick={() => toggleStatusDirect(call.id)} title="Click to toggle status">
                          {call.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <a href={generateEmailLink(call)} className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-600 px-2 py-1 rounded-sm text-[10px] font-bold uppercase shadow-sm transition-colors" title="Draft Email">✉</a>
                          <button onClick={() => downloadIcs(call)} className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-600 px-2 py-1 rounded-sm text-[10px] font-bold uppercase shadow-sm transition-colors" title="Download ICS">📅</button>
                          <button onClick={() => openEditCall(call)} className="bg-white border border-gray-300 hover:bg-gray-100 text-[#125ab2] px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors">Edit</button>
                          <button onClick={() => handleDelete(call.id)} className="bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors">Void</button>
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

      {/*-MODAL: CREATE / EDIT CALL FORM-*/}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 sm:p-6 overflow-hidden">
          <div ref={modalRef} className="bg-white rounded-sm w-full max-w-[650px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-[#125ab2]" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            <div className="bg-blue-50 border-b border-blue-100 px-6 py-4 flex justify-between items-center shrink-0 z-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-[#125ab2]">Comms Log Ledger</p>
                <h3 className="font-black text-sm uppercase tracking-wider text-gray-900">{editingId ? `Update Log: ${editingId}` : 'Register New Contact'}</h3>
              </div>
              <button onClick={closeModal} className="text-blue-400 hover:text-blue-800 font-bold text-xl leading-none px-2">✕</button>
            </div>
            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar z-0 text-sm flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Communication Category <span className="text-red-500">*</span></label>
                    <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] font-black text-gray-700 bg-white rounded-sm shadow-sm cursor-pointer text-xs">
                      {options.categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Target Entity / Contact Person <span className="text-red-500">*</span></label>
                    <input type="text" value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} placeholder="e.g. Bpk. Hendra (PT Voltara)..." className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] font-semibold text-gray-800 rounded-sm shadow-sm text-xs" required autoFocus/>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Subject / Topic of Discussion <span className="text-red-500">*</span></label>
                    <input type="text" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="e.g. Q3 LFP Battery Fulfillment Delay..." className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] font-black text-gray-900 rounded-sm shadow-sm text-sm" required/>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Scheduled Date <span className="text-red-500">*</span></label>
                    <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] font-mono text-xs font-bold text-gray-800 rounded-sm shadow-sm cursor-pointer" required/>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Scheduled Time <span className="text-red-500">*</span></label>
                    <input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] font-mono text-xs font-bold text-gray-800 rounded-sm shadow-sm cursor-pointer" required/>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-4 border-t border-gray-100 pt-4 mt-2">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Outcome Notes / Resolution</label>
                    <textarea rows="3" placeholder="Log the result of the call here..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] rounded-sm resize-none text-xs font-medium shadow-sm"></textarea>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Current Status <span className="text-red-500">*</span></label>
                    <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-[#125ab2] font-black text-gray-700 bg-white rounded-sm shadow-sm cursor-pointer text-xs">
                      {options.statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 shrink-0 z-10">
                <button type="button" onClick={closeModal} className="w-full sm:w-auto px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm rounded-sm">Cancel</button>
                <button type="submit" className="w-full sm:w-auto px-6 py-2.5 bg-[#125ab2] hover:bg-[#0e4487] text-white text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors rounded-sm flex items-center justify-center gap-2">
                  {editingId ? 'Update Log Entry' : 'Save Communication Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Calls;