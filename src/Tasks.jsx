import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppContext } from './AppContext';

// ─── TOAST COMPONENT ─────────────────────────────────────────────────────────
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
        <button onClick={() => removeToast(id)} className="opacity-70 hover:opacity-100 text-lg leading-none transition-opacity">×</button>
      </div>
    ))}
  </div>
);

const PriorityBadge = ({ priority }) => {
  const map = {
    High:     'bg-red-100 text-red-700 border-red-300',
    Critical: 'bg-red-600 text-white border-red-800 animate-pulse',
    Normal:   'bg-gray-100 text-gray-600 border-gray-300',
    Medium:   'bg-amber-100 text-amber-700 border-amber-300',
    Low:      'bg-blue-50 text-blue-500 border-blue-200',
  };
  return (
    <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-widest border shadow-sm ${map[priority] || map.Normal}`}>
      {priority || 'Normal'}
    </span>
  );
};

const LiveHandlingTime = ({ startTime, endTime, status }) => {
  const [elapsed, setElapsed] = useState('00m : 00s');

  useEffect(() => {
    if (!startTime) {
      setElapsed('--m : --s');
      return;
    }

    const calculateTime = () => {
      const start = new Date(startTime).getTime();
      const end = (status === 'Completed' && endTime) ? new Date(endTime).getTime() : new Date().getTime();
      const diffInSeconds = Math.floor((end - start) / 1000);
      
      if (diffInSeconds < 0) return setElapsed('00m : 00s');
      
      const m = Math.floor(diffInSeconds / 60).toString().padStart(2, '0');
      const s = (diffInSeconds % 60).toString().padStart(2, '0');
      
      if (diffInSeconds >= 3600) {
         const h = Math.floor(diffInSeconds / 3600).toString().padStart(2, '0');
         const remM = Math.floor((diffInSeconds % 3600) / 60).toString().padStart(2, '0');
         setElapsed(`${h}h : ${remM}m : ${s}s`);
      } else {
         setElapsed(`${m}m : ${s}s`);
      }
    };

    calculateTime();
    
    if (status === 'In Progress') {
      const interval = setInterval(calculateTime, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime, endTime, status]);

  return <span className={`font-mono font-bold ${status === 'In Progress' ? 'text-amber-400' : 'text-emerald-400'}`}>{elapsed}</span>;
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const Tasks = () => {
  const { taskData, setTaskData, dispatchAutoTask, completeTaskAndSync } = useContext(AppContext);
  const [toasts, setToasts] = useState([]);

  const getDynamicDate = (daysOffset) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().slice(0, 10);
  };
  const todayStr = getDynamicDate(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailTaskId, setDetailTaskId] = useState(null); 
  const [editingId, setEditingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const modalRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sortBy, setSortBy] = useState('dueDate');
  const [sortDir, setSortDir] = useState('asc');

  const defaultForm = {
    id: '', desc: '', notes: '', type: 'Picking', zone: 'Zone A (Ambient)', assignee: '', sku: 'SKU-ARS-EVPLATFORM',
    priority: 'Medium', status: 'Not Started', currentStage: 'Awaiting Activation', isLocked: false, dependency: 'None', dueDate: todayStr, createdAt: todayStr,
  };
  const [form, setForm] = useState(defaultForm);

  const options = {
    status: ['Not Started', 'In Progress', 'Completed'],
    priority: ['Low', 'Medium', 'High', 'Critical'],
    types: ['Picking', 'Putaway', 'Cycle Count', 'MRO', 'HSE', 'Housekeeping', 'General'],
    zones: ['Zone A (Ambient)', 'Zone B (Cold Storage)', 'Zone C (Chassis)', 'Clean Room A', 'Inbound Dock', 'Outbound Dispatch', 'Safe Room (Vault B)'],
    dependencies: ['None', 'QA Clearance Required', 'Safety LOTO Sign-off', 'Supervisor Override']
  };

  const getStatusColor = (status) => {
    return status === 'Not Started' ? 'bg-gray-100 text-gray-700 border-gray-300' :
           status === 'In Progress' ? 'bg-amber-100 text-amber-800 border-amber-300' :
           'bg-emerald-100 text-emerald-800 border-emerald-300';
  };

  const liveDetailTask = useMemo(() => {
    return (taskData || []).find(t => t.id === detailTaskId);
  }, [taskData, detailTaskId]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const openNewTask = () => { setForm(defaultForm); setEditingId(null); setIsModalOpen(true); };
  const openEditTask = (task) => { setForm(task); setEditingId(task.id); setDetailTaskId(null); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setForm(defaultForm); setDetailTaskId(null); };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.desc.trim() || !form.assignee.trim()) {
      return addToast('Description and Assignee are strictly required.', 'error');
    }
    const currentTasks = taskData || [];
    const isLocked = form.dependency !== 'None';
    const finalStage = isLocked ? 'Awaiting Authorization' : 'Awaiting Activation';

    if (editingId) {
      setTaskData(currentTasks.map(t => (t.id === editingId ? { ...form, isLocked, currentStage: finalStage } : t)));
      addToast(`Task ${editingId} updated successfully.`, 'success');
    } else {
      // 🚀 MENGGUNAKAN GLOBAL ENGINE DARI APPCONTEXT
      dispatchAutoTask({
        ...form,
        sku: form.type === 'Picking' ? 'BATT-LFP-75K' : form.type === 'Putaway' ? 'MCU-GEN3-00' : 'N/A',
        isLocked,
      });
      addToast(`Task dispatched. Locked with: ${form.dependency}`, 'success');
    }
    closeModal();
  };

  const handleDelete = (id) => {
    if(!window.confirm(`Are you sure you want to permanently VOID task ${id}?`)) return;
    setTaskData((taskData || []).filter(t => t.id !== id));
    setSelectedIds(prev => prev.filter(sId => sId !== id));
    setDetailTaskId(null);
    addToast(`Task ${id} has been voided.`, 'info');
  };

  const toggleStatusDirect = (id) => {
    const task = (taskData || []).find(t => t.id === id);
    if (!task) return;
    
    if (task.isLocked) {
      return addToast(`Cannot change status. Task is locked by ${task.dependency}.`, 'error');
    }
    
    const nextStatus = task.status === 'Not Started' ? 'In Progress' : task.status === 'In Progress' ? 'Completed' : 'Not Started';
    
    if (nextStatus === 'Completed') {
      // 🚀 MENGGUNAKAN GLOBAL ENGINE JIKA TASK SELESAI
      completeTaskAndSync(id);
      addToast(`Task ${id} marked as Completed. Modules Synced.`, 'success');
    } else {
      const nextStage = nextStatus === 'In Progress' ? 'Scanning Location' : 'Awaiting Activation';
      setTaskData(prev => prev.map(t => t.id === id ? { 
        ...t, 
        status: nextStatus, 
        currentStage: nextStage,
        pickingStartAt: nextStatus === 'In Progress' && !t.pickingStartAt ? new Date().toISOString() : t.pickingStartAt
      } : t));
    }
  };

  // ─── KUNCI OVERRIDE MANAGER ───
  const toggleInterlock = (id, dependencyName) => {
    setTaskData((taskData || []).map(t => {
      if (t.id !== id) return t;
      const willUnlock = t.isLocked; 
      
      if (willUnlock) {
        addToast(`[OVERRIDE ACCEPTED] ${dependencyName} clearance granted. Scanner UNLOCKED.`, 'success');
      } else {
        addToast(`[SECURITY] Task manually locked. Operator access revoked.`, 'warning');
      }

      return { 
        ...t, 
        isLocked: !willUnlock, 
        currentStage: willUnlock ? 'Awaiting Activation' : 'Awaiting Authorization',
        notes: willUnlock && !t.notes?.includes('[OVERRIDE VERIFIED]') ? `${t.notes} | [OVERRIDE VERIFIED]` : t.notes
      };
    }));
  };

  const toggleSelection = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredTasks.length && filteredTasks.length > 0) setSelectedIds([]);
    else setSelectedIds(filteredTasks.map(t => t.id));
  };

  const bulkCompleteSelected = () => {
    selectedIds.forEach(id => completeTaskAndSync(id));
    addToast(`${selectedIds.length} tasks batch-completed & synced.`, 'success');
    setSelectedIds([]);
  };

  const exportToCSV = () => {
    addToast('Compiling Dispatch Manifest...', 'info');
    const headers = ['Task_ID', 'Type', 'Description', 'Zone', 'Assignee', 'Priority', 'Status', 'Interlock_Dependency', 'Due_Date', 'Handling_Time_Sec'];
    const csvRows = [headers.join(',')];
    
    filteredTasks.forEach(t => {
      let handlingSec = '';
      if (t.pickingStartAt && t.deliveredAt) {
        handlingSec = Math.floor((new Date(t.deliveredAt) - new Date(t.pickingStartAt)) / 1000);
      }
      const row = [t.id, t.type, `"${t.desc}"`, `"${t.zone}"`, `"${t.assignee}"`, t.priority, t.status, `"${t.dependency}"`, t.dueDate, handlingSec];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `ARUS_Dispatch_Manifest_${todayStr}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filteredTasks = useMemo(() => {
    const searchLow = searchQuery.toLowerCase();
    return (taskData || [])
      .filter(t => {
        const matchesSearch = [t.id, t.desc, t.assignee, t.zone].join(' ').toLowerCase().includes(searchLow);
        const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
        const matchesType = typeFilter === 'All' || t.type === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
      })
      .sort((a, b) => {
        if (sortBy === 'priority') {
          const priorityWeight = (p) => ({ 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 }[p] || 0);
          return sortDir === 'asc' ? priorityWeight(a.priority) - priorityWeight(b.priority) : priorityWeight(b.priority) - priorityWeight(a.priority);
        }
        if (sortBy === 'status') {
          return sortDir === 'asc' ? a.status.localeCompare(b.status) : b.status.localeCompare(a.status);
        }
        return sortDir === 'asc' ? new Date(a.dueDate) - new Date(b.dueDate) : new Date(b.dueDate) - new Date(a.dueDate);
      });
  }, [taskData, searchQuery, statusFilter, typeFilter, sortBy, sortDir]);

  const totalCount = (taskData || []).length;
  const completedCount = (taskData || []).filter(t => t.status === 'Completed').length;
  const overdueCount = (taskData || []).filter(t => t.status !== 'Completed' && t.dueDate < todayStr).length;
  const progressPct = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <main className="p-4 w-full max-w-[1400px] mx-auto relative z-0 animate-fade-in">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER & KPI DASHBOARD ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span>⚡ Floor Execution</span> <span className="text-slate-300">/</span> <span className="text-[#125ab2]">Dispatch</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#4d5f79] tracking-wide">Warehouse Task Control Center</h2>
          <p className="text-sm text-gray-500 mt-1">Assign, monitor, and evaluate SLA handling time across all Gigafactory zones.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={exportToCSV} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-sm text-[10px] font-bold shadow-sm uppercase tracking-wider flex items-center justify-center gap-2 w-full md:w-auto transition-colors">
            <span>⭳</span> Export Manifest
          </button>
          <button onClick={openNewTask} className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-5 py-2.5 rounded-sm text-[10px] font-bold shadow-sm uppercase tracking-wider flex items-center justify-center gap-1.5 w-full md:w-auto transition-colors">
            <span>+</span> Dispatch Task
          </button>
        </div>
      </div>

      {/* ── KPI DASHBOARD ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 border border-gray-200 shadow-sm rounded-sm">
          <p className="text-[9px] uppercase tracking-wider font-bold text-gray-500">Total Workload</p>
          <p className="text-3xl font-black text-gray-800 mt-1 font-mono">{totalCount}</p>
          <div className="w-full bg-gray-200 rounded-full h-1 mt-3">
            <div className="bg-[#125ab2] h-full rounded-full" style={{ width: `${progressPct}%` }}></div>
          </div>
          <p className="text-[9px] font-bold text-[#125ab2] mt-1 text-right">{progressPct}% Selesai</p>
        </div>
        <div className="bg-white p-4 border-l-4 border-l-emerald-500 border border-y-gray-200 border-r-gray-200 shadow-sm rounded-sm">
          <p className="text-[9px] uppercase tracking-wider font-bold text-emerald-600">Completed Ops</p>
          <p className="text-3xl font-black text-emerald-700 mt-1 font-mono">{completedCount}</p>
        </div>
        <div className="bg-white p-4 border-l-4 border-l-amber-500 border border-y-gray-200 border-r-gray-200 shadow-sm rounded-sm">
          <p className="text-[9px] uppercase tracking-wider font-bold text-amber-600">In Progress / Queue</p>
          <p className="text-3xl font-black text-amber-700 mt-1 font-mono">{totalCount - completedCount}</p>
        </div>
        <div className="bg-white p-4 border-l-4 border-l-red-600 border border-y-gray-200 border-r-gray-200 shadow-sm rounded-sm">
          <p className="text-[9px] uppercase tracking-wider font-bold text-red-600">SLA Overdue</p>
          <p className="text-3xl font-black text-red-700 font-mono">{overdueCount}</p>
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="bg-white p-3 border border-gray-300 shadow-sm rounded-sm mb-4 flex flex-col lg:flex-row gap-3 items-center justify-between">
        {selectedIds.length > 0 ? (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 px-4 py-2 rounded-sm w-full lg:w-auto">
            <span className="text-xs font-black text-[#125ab2]">{selectedIds.length} Selected</span>
            <button onClick={bulkCompleteSelected} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-sm text-[9px] font-bold uppercase transition-colors">Bulk Complete</button>
            <button onClick={() => setSelectedIds([])} className="bg-white border border-gray-300 text-gray-600 px-3 py-1.5 rounded-sm text-[9px] font-bold uppercase transition-colors">Deselect</button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700 rounded-sm cursor-pointer shadow-sm">
              <option value="All">All Categories</option>
              {options.types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700 rounded-sm cursor-pointer shadow-sm">
              <option value="All">All Statuses</option>
              {options.status.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
        <input 
          type="text" 
          placeholder="Search ID, Zone, Assignee..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border border-gray-300 px-4 py-2 rounded-sm text-xs font-semibold outline-none focus:border-[#125ab2] w-full lg:w-80 transition-colors shadow-sm"
        />
      </div>

      {/* ── DATA TABLE ── */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
            <thead className="bg-[#f8f9fa] text-[#64748b] text-[9px] uppercase tracking-widest border-b border-gray-200">
              <tr>
                <th className="py-3 px-4 w-10 text-center">
                  <input type="checkbox" checked={selectedIds.length === filteredTasks.length && filteredTasks.length > 0} onChange={toggleSelectAll} className="cursor-pointer" />
                </th>
                <th className="py-3 px-4 font-bold border-b w-40">TASK ID & TYPE</th>
                <th className="py-3 px-4 font-bold border-b w-72">DESCRIPTION</th>
                <th className="py-3 px-4 font-bold border-b">LOCATION & PIC</th>
                <th className="py-3 px-4 font-bold border-b text-center">INTERLOCK STATUS</th>
                <th className="py-3 px-4 font-bold border-b text-center">STATUS & SLA</th>
                <th className="py-3 px-4 font-bold border-b text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="text-[12px] text-gray-700">
              {filteredTasks.map((task) => {
                const isCompleted = task.status === 'Completed';
                const isOverdue = !isCompleted && task.dueDate < todayStr;
                const isSelected = selectedIds.includes(task.id);
                
                return (
                  <tr key={task.id} className={`border-b border-gray-100 transition-colors ${isSelected ? 'bg-blue-50/50' : isCompleted ? 'bg-gray-50 opacity-70' : isOverdue ? 'bg-red-50/40' : 'hover:bg-blue-50/40'}`}>
                    <td className="py-4 px-4 text-center">
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelection(task.id)} className="cursor-pointer" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-mono font-black text-[#125ab2] text-[13px] hover:underline cursor-pointer" onClick={() => setDetailTaskId(task.id)}>
                        {task.id}
                      </div>
                      <span className="inline-block mt-1 px-1.5 py-0.5 text-[8px] bg-slate-100 border rounded-sm font-bold uppercase">{task.type}</span>
                    </td>
                    <td className="py-4 px-4 max-w-[300px] whitespace-normal">
                      <div className={`font-bold text-gray-900 leading-tight ${isCompleted ? 'line-through' : ''}`}>{task.desc}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-gray-800 text-[11px]">📍 {task.zone}</div>
                      <div className="text-[11px] text-gray-600 mt-1">👤 {task.assignee}</div>
                    </td>
                    
                    {/* SYSTEM INTERLOCK COLUMN */}
                    <td className="py-4 px-4 text-center">
                      {task.isLocked ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] bg-red-100 text-red-700 border border-red-300 px-2 py-0.5 rounded font-black uppercase tracking-widest flex items-center gap-1 shadow-sm">
                            🔒 BLOCKED
                          </span>
                          <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wider">{task.dependency}</span>
                        </div>
                      ) : task.dependency !== 'None' ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded font-black uppercase tracking-widest shadow-sm">
                          🔓 RELEASED
                        </span>
                      ) : (
                        <span className="text-gray-300 font-bold">—</span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span 
                        onClick={() => toggleStatusDirect(task.id)}
                        className={`px-2 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest border shadow-sm cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(task.status)}`}
                        title={task.isLocked ? "Cannot toggle. Task is locked." : "Click to toggle status"}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        {!isCompleted && task.dependency !== 'None' && (
                          <button 
                            onClick={() => toggleInterlock(task.id, task.dependency)} 
                            className={`border px-2.5 py-1.5 text-[10px] font-bold rounded-sm shadow-sm transition-colors ${
                              task.isLocked 
                                ? task.dependency === 'Supervisor Override'
                                  ? 'bg-[#125ab2] border-blue-800 text-white hover:bg-[#0e4487] animate-pulse'
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                            }`} 
                            title={task.isLocked ? `Execute ${task.dependency} Clearance` : 'Lock Task Again'}
                          >
                            {task.isLocked ? (task.dependency === 'Supervisor Override' ? '🔓 AUTHORIZE' : '🔓 RELEASE') : '🔒 LOCK'}
                          </button>
                        )}
                        <button onClick={() => openEditTask(task)} className="bg-white border text-[#125ab2] px-2.5 py-1.5 text-[10px] font-bold rounded-sm">✎</button>
                        <button onClick={() => handleDelete(task.id)} className="bg-red-50 border text-red-600 px-2.5 py-1.5 text-[10px] font-bold rounded-sm">✕</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🛡️ MODAL: CREATE / EDIT TASK FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 sm:p-6 overflow-hidden">
          <div ref={modalRef} className="bg-white rounded-sm w-full max-w-[650px] shadow-2xl flex flex-col border-t-4 border-t-[#125ab2]" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            <div className="bg-blue-50 border-b border-blue-100 px-6 py-4 flex justify-between items-center shrink-0">
              <h3 className="font-black text-sm uppercase tracking-wider text-gray-900">{editingId ? 'Update Task' : 'Generate New Task Order'}</h3>
              <button onClick={closeModal} className="text-blue-400 font-bold text-xl leading-none px-2">✕</button>
            </div>
            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 text-sm flex flex-col gap-4 custom-scrollbar">
                
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-sm mb-2">
                  <label className="block text-[9px] font-black text-[#125ab2] uppercase tracking-widest mb-2 flex items-center gap-1">
                    <span>🔗</span> Cross-Module Interlock (Dependency)
                  </label>
                  <select value={form.dependency} onChange={e => setForm({...form, dependency: e.target.value})} className="w-full border border-gray-300 p-2.5 text-xs font-bold bg-white rounded-sm outline-none focus:border-[#125ab2]">
                    {options.dependencies.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <p className="text-[9px] text-gray-500 mt-1">If assigned, the operator cannot execute this task until the prerequisite is cleared by the respective department.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Task Category *</label>
                    <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full border border-gray-300 p-2.5 text-xs font-black bg-white rounded-sm">
                      {options.types.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Priority Level *</label>
                    <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="w-full border border-gray-300 p-2.5 text-xs font-black bg-white rounded-sm">
                      {options.priority.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Instruction / Description *</label>
                  <input type="text" value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} className="w-full border border-gray-300 p-2.5 text-sm font-bold text-gray-900 rounded-sm outline-none focus:border-[#125ab2]" required/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Target Zone / Location *</label>
                    <select value={form.zone} onChange={e => setForm({...form, zone: e.target.value})} className="w-full border border-gray-300 p-2.5 text-xs font-semibold bg-white rounded-sm outline-none focus:border-[#125ab2]">
                      {options.zones.map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Operator Assignee *</label>
                    <input type="text" value={form.assignee} onChange={e => setForm({...form, assignee: e.target.value})} className="w-full border border-gray-300 p-2.5 text-xs font-semibold rounded-sm outline-none focus:border-[#125ab2]" required/>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">SLA Due Date *</label>
                    <input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} className="w-full border border-gray-300 p-2.5 font-mono text-xs font-bold rounded-sm outline-none focus:border-[#125ab2]" required/>
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Additional Handling Notes</label>
                  <textarea rows="2" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full border border-gray-300 p-2.5 text-xs rounded-sm resize-none shadow-sm outline-none focus:border-[#125ab2]"></textarea>
                </div>
              </div>
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 shrink-0">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase rounded-sm">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-[#125ab2] hover:bg-[#0e4487] text-white text-[10px] font-bold uppercase rounded-sm">Dispatch Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🛡️ MODAL: INTERACTIVE LIVE OPERATOR LEDGER */}
      {liveDetailTask && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-sm w-full max-w-[580px] shadow-2xl flex flex-col relative animate-fade-in border-t-4 border-t-[#415a77]" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            <div className="bg-[#415a77] text-white px-6 py-4 flex justify-between items-start shrink-0">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Operational Task Ledger</p>
                <h3 className="font-black text-lg font-mono tracking-wide">{liveDetailTask.id}</h3>
              </div>
              <div className="text-right flex flex-col items-end">
                <button onClick={() => setDetailTaskId(null)} className="text-white opacity-70 hover:opacity-100 font-bold text-xl leading-none px-2 mb-2">✕</button>
                <span className={`px-2.5 py-1 rounded-sm font-black text-[9px] uppercase tracking-widest border border-white/20 shadow-sm ${getStatusColor(liveDetailTask.status)}`}>
                  {liveDetailTask.status}
                </span>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm text-gray-800 bg-slate-50 custom-scrollbar">
              
              {/* JIKA TERKUNCI OLEH DEPENDENCY */}
              {liveDetailTask.isLocked ? (
                 <div className="bg-red-50 border-2 border-red-200 p-6 rounded-lg text-center shadow-sm relative overflow-hidden">
                    <span className="text-4xl block mb-2 opacity-80">🔒</span>
                    <h3 className="text-red-700 font-black text-lg uppercase tracking-widest mb-1">SYSTEM INTERLOCK ACTIVE</h3>
                    <p className="text-sm font-bold text-red-900 mb-3">Operator cannot execute this task.</p>
                    <div className="inline-block bg-white px-4 py-2 border border-red-200 rounded text-xs font-bold text-gray-600 mb-4 shadow-inner">
                      Awaiting Prerequisite: <span className="text-red-600 font-black uppercase tracking-wider ml-1">{liveDetailTask.dependency}</span>
                    </div>

                    {liveDetailTask.dependency === 'Supervisor Override' && (
                      <div className="mt-2 pt-5 border-t border-red-200">
                        <p className="text-[9px] font-bold text-red-600 uppercase tracking-widest mb-3">Manager Action Required</p>
                        <button 
                          onClick={() => {
                            toggleInterlock(liveDetailTask.id, liveDetailTask.dependency);
                            setDetailTaskId(null); // Tutup otomatis modalnya
                          }}
                          className="bg-[#125ab2] hover:bg-[#0e4487] text-white px-8 py-3.5 rounded text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(18,90,178,0.4)] animate-pulse transition-all active:scale-95 flex items-center justify-center gap-2 mx-auto"
                        >
                          <span className="text-lg">🔓</span> AUTHORIZE SYSTEM OVERRIDE
                        </button>
                      </div>
                    )}
                 </div>
              ) : (
                /* LIVE OPERATOR FLOOR TELEMETRY STEPPER */
                <div className="bg-slate-900 text-white p-4 rounded border border-slate-800 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#125ab2]/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

                  <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
                    <div className="flex items-center gap-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                        LIVE OPERATOR TELEMETRY
                      </p>
                      
                      {liveDetailTask.status !== 'Not Started' && (
                         <div className="bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/50 flex items-center gap-2 shadow-inner">
                           <span className="text-[8px] text-slate-400 uppercase tracking-wider font-bold">⏱️ Handing Time:</span>
                           <LiveHandlingTime 
                              startTime={liveDetailTask.pickingStartAt} 
                              endTime={liveDetailTask.deliveredAt} 
                              status={liveDetailTask.status} 
                           />
                         </div>
                      )}
                    </div>
                    <span className="text-[9px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-400 border border-slate-700 shadow-inner">Node: Zebra_TC52</span>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-1 relative text-center text-[9px] font-black uppercase tracking-wider z-10">
                    <div className="absolute top-3 left-[12.5%] right-[12.5%] h-[2px] bg-slate-700 -z-10"></div>
                    
                    {[
                      { label: 'Activated', match: ['In Progress', 'Completed'] },
                      { label: 'Scan Bin', match: liveDetailTask.type === 'Housekeeping' || liveDetailTask.type === 'HSE' ? ['In Progress', 'Completed'] : ['Scan SKU', 'Evidence Cap', 'Completed'] },
                      { label: 'Scan SKU', match: liveDetailTask.type === 'Housekeeping' || liveDetailTask.type === 'HSE' ? ['In Progress', 'Completed'] : ['Evidence Cap', 'Completed'] },
                      { label: 'Evidence/Done', match: ['Completed'] }
                    ].map((step, i) => {
                      const isPassed = step.match.includes(liveDetailTask.currentStage) || liveDetailTask.status === 'Completed';
                      const isCurrent = liveDetailTask.currentStage?.includes(step.label.split(' ')[0]) || (i === 0 && liveDetailTask.status === 'In Progress' && liveDetailTask.currentStage === 'Scanning Location');
                      
                      return (
                        <div key={i} className="flex flex-col items-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 font-mono text-[10px] transition-all duration-300 shadow-lg ${
                            isPassed ? 'bg-emerald-500 border-emerald-400 text-slate-900 font-black scale-110' :
                            isCurrent ? 'bg-amber-500 border-amber-400 text-slate-950 font-black animate-bounce' :
                            'bg-slate-800 border-slate-600 text-slate-500'
                          }`}>
                            {isPassed ? '✓' : i + 1}
                          </div>
                          <p className={`mt-2 font-sans truncate w-full ${isPassed ? 'text-emerald-400' : isCurrent ? 'text-amber-400 font-black' : 'text-slate-500'}`}>
                            {step.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* INFO DATA MANIFEST CONTAINER */}
              <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded border border-gray-200 shadow-sm">
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Task Category</p>
                  <p className="font-black text-[#125ab2] text-sm">{liveDetailTask.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Priority Level</p>
                  <PriorityBadge priority={liveDetailTask.priority} />
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-4 rounded shadow-sm">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Primary Instruction</p>
                <p className="text-base font-black text-gray-900 leading-tight">{liveDetailTask.desc}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded border border-gray-200 shadow-sm">
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Target Location</p>
                  <p className="font-black text-gray-900">📍 {liveDetailTask.zone}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Operator Assignee</p>
                  <p className="font-bold text-gray-800">👤 {liveDetailTask.assignee}</p>
                </div>
              </div>

              {liveDetailTask.notes && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded shadow-sm">
                  <p className="text-[9px] font-black text-amber-800 uppercase tracking-wider mb-1">⚠️ Handling Precautions / Notes</p>
                  <p className="text-xs text-amber-900 font-semibold italic">"{liveDetailTask.notes}"</p>
                </div>
              )}

            </div>
            
            <div className="bg-gray-100 px-6 py-4 border-t border-gray-200 flex justify-end shrink-0">
              <button onClick={() => setDetailTaskId(null)} className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-200 text-gray-800 text-[10px] font-bold uppercase tracking-wider rounded-sm shadow-sm transition-colors">Close Profile</button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
};

export default Tasks;