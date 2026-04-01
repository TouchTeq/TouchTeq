'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Search,
  CheckSquare,
  Square,
  Trash2,
  Edit2,
  X,
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
  Flag,
  ChevronDown,
  Filter,
  Tag,
  User,
  FileText,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  getTasks,
  updateTask,
  deleteTask,
  createTask,
  getTaskStats,
  type Task,
} from '@/lib/tasks/actions';

const CATEGORIES = [
  'Admin',
  'Site Visit',
  'Follow-up',
  'Procurement',
  'Documentation',
  'Maintenance',
  'Client Communication',
  'Other',
];

const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
const STATUSES = ['todo', 'in_progress', 'done', 'cancelled'] as const;

const PRIORITY_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  urgent: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/40', label: 'Urgent' },
  high: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/40', label: 'High' },
  medium: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/40', label: 'Medium' },
  low: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/40', label: 'Low' },
};

const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  todo: 'bg-slate-600/30 text-slate-300',
  in_progress: 'bg-blue-500/20 text-blue-400',
  done: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/10 text-red-400/70',
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, todo: 0, inProgress: 0, done: 0, overdue: 0, dueToday: 0, dueThisWeek: 0 });
  const [clients, setClients] = useState<any[]>([]);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState('medium');
  const [formStatus, setFormStatus] = useState('todo');
  const [formDueDate, setFormDueDate] = useState('');
  const [formDueTime, setFormDueTime] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formClientId, setFormClientId] = useState('');
  const [formTags, setFormTags] = useState<string[]>([]);
  const [formNotes, setFormNotes] = useState('');
  const [formTagInput, setFormTagInput] = useState('');
  
  // Client search
  const [clientSearch, setClientSearch] = useState('');
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const clientRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  // Load tasks and stats
  const loadTasks = useCallback(async () => {
    setLoading(true);
    const filters: any = {};
    if (statusFilter !== 'all') filters.status = statusFilter;
    if (priorityFilter !== 'all') filters.priority = priorityFilter;
    if (searchQuery) filters.search = searchQuery;

    const [tasksData, statsData] = await Promise.all([
      getTasks(filters),
      getTaskStats(),
    ]);

    setTasks(tasksData);
    setStats(statsData);
    setLoading(false);
  }, [statusFilter, priorityFilter, searchQuery]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Load clients
  useEffect(() => {
    async function loadClients() {
      const { data } = await supabase
        .from('clients')
        .select('id, company_name, contact_person, email')
        .eq('is_active', true)
        .order('company_name');
      setClients(data || []);
    }
    loadClients();
  }, [supabase]);

  // Click outside to close client dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clientRef.current && !clientRef.current.contains(event.target as Node)) {
        setClientDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Quick complete
  const handleQuickComplete = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'todo' : 'done';
    const result = await updateTask(taskId, { status: newStatus });
    if (result.success) {
      loadTasks();
    }
  };

  // Delete task
  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    const result = await deleteTask(taskId);
    if (result.success) {
      loadTasks();
    }
  };

  // Open create modal
  const openCreateModal = () => {
    setEditingTask(null);
    setFormTitle('');
    setFormDescription('');
    setFormPriority('medium');
    setFormStatus('todo');
    setFormDueDate('');
    setFormDueTime('');
    setFormCategory('');
    setFormClientId('');
    setFormTags([]);
    setFormNotes('');
    setFormTagInput('');
    setClientSearch('');
    setShowModal(true);
  };

  // Open edit modal
  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDescription(task.description || '');
    setFormPriority(task.priority);
    setFormStatus(task.status);
    setFormDueDate(task.due_date || '');
    setFormDueTime(task.due_time || '');
    setFormCategory(task.category || '');
    setFormClientId(task.client_id || '');
    setFormTags(task.tags || []);
    setFormNotes(task.notes || '');
    setFormTagInput('');
    setClientSearch('');
    setShowModal(true);
  };

  // Save task
  const handleSave = async () => {
    if (!formTitle.trim()) return;

    if (editingTask) {
      const result = await updateTask(editingTask.id, {
        title: formTitle,
        description: formDescription || undefined,
        priority: formPriority,
        status: formStatus,
        due_date: formDueDate || undefined,
        due_time: formDueTime || undefined,
        category: formCategory || undefined,
        client_id: formClientId || undefined,
        tags: formTags,
        notes: formNotes || undefined,
      });
      if (result.success) {
        setShowModal(false);
        loadTasks();
      }
    } else {
      const result = await createTask({
        title: formTitle,
        description: formDescription || undefined,
        priority: formPriority,
        due_date: formDueDate || undefined,
        due_time: formDueTime || undefined,
        category: formCategory || undefined,
        client_id: formClientId || undefined,
        tags: formTags,
        notes: formNotes || undefined,
      });
      if (result.success) {
        setShowModal(false);
        loadTasks();
      }
    }
  };

  // Tag management
  const addTag = () => {
    const tag = formTagInput.trim();
    if (tag && !formTags.includes(tag)) {
      setFormTags([...formTags, tag]);
      setFormTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormTags(formTags.filter(t => t !== tag));
  };

  // Filtered clients
  const filteredClients = clients.filter(c =>
    (c.company_name || '').toLowerCase().includes(clientSearch.toLowerCase()) ||
    (c.contact_person || '').toLowerCase().includes(clientSearch.toLowerCase())
  );

  const selectedClient = clients.find(c => c.id === formClientId);

  // Check if task is overdue
  const isOverdue = (task: Task) => {
    if (!task.due_date || task.status === 'done' || task.status === 'cancelled') return false;
    const today = new Date().toISOString().split('T')[0];
    return task.due_date < today;
  };

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#151B28] border border-slate-800/50 p-4 rounded-xl">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Open Tasks</p>
          <p className="text-3xl font-black text-orange-500 mt-1">{stats.todo + stats.inProgress}</p>
        </div>
        <div className="bg-[#151B28] border border-red-500/20 p-4 rounded-xl">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400">Overdue</p>
          <p className="text-3xl font-black text-red-500 mt-1">{stats.overdue}</p>
        </div>
        <div className="bg-[#151B28] border border-slate-800/50 p-4 rounded-xl">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Due Today</p>
          <p className="text-3xl font-black text-blue-400 mt-1">{stats.dueToday}</p>
        </div>
        <div className="bg-[#151B28] border border-slate-800/50 p-4 rounded-xl">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Due This Week</p>
          <p className="text-3xl font-black text-cyan-400 mt-1">{stats.dueThisWeek}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#151B28] border border-slate-800/50 p-4 rounded-xl">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-600"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none rounded-lg py-2.5 pl-4 pr-10 text-sm text-white cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
          </div>

          {/* Priority Filter */}
          <div className="relative">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="appearance-none bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none rounded-lg py-2.5 pl-4 pr-10 text-sm text-white cursor-pointer"
            >
              <option value="all">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
          </div>

          {/* New Task Button */}
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus size={16} />
            New Task
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-[#151B28] border border-slate-800/50 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 text-sm mt-4">Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center">
            <CheckSquare size={48} className="mx-auto text-slate-700 mb-4" />
            <p className="text-slate-400 font-bold text-lg">No tasks found</p>
            <p className="text-slate-600 text-sm mt-1">Create a new task to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            <AnimatePresence>
              {tasks.map((task) => {
                const priorityStyle = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
                const statusStyle = STATUS_COLORS[task.status] || STATUS_COLORS.todo;
                const overdue = isOverdue(task);

                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="group flex items-center gap-4 p-4 hover:bg-slate-800/30 transition-colors"
                  >
                    {/* Quick Complete */}
                    <button
                      onClick={() => handleQuickComplete(task.id, task.status)}
                      className="flex-shrink-0"
                      title={task.status === 'done' ? 'Mark as To Do' : 'Mark as Done'}
                    >
                      {task.status === 'done' ? (
                        <CheckSquare size={20} className="text-green-500" />
                      ) : (
                        <Square size={20} className="text-slate-600 hover:text-orange-500 transition-colors" />
                      )}
                    </button>

                    {/* Priority */}
                    <div className={`flex-shrink-0 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border} border`}>
                      {priorityStyle.label}
                    </div>

                    {/* Title & Description */}
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => openEditModal(task)}
                        className={`text-left font-bold text-sm truncate hover:text-orange-500 transition-colors ${
                          task.status === 'done' ? 'line-through text-slate-500' : 'text-white'
                        }`}
                      >
                        {task.title}
                      </button>
                      {task.description && (
                        <p className="text-slate-500 text-xs truncate mt-0.5">{task.description}</p>
                      )}
                    </div>

                    {/* Status */}
                    <div className={`flex-shrink-0 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${statusStyle}`}>
                      {STATUS_LABELS[task.status]}
                    </div>

                    {/* Due Date */}
                    <div className={`flex-shrink-0 flex items-center gap-1.5 text-xs ${
                      overdue ? 'text-red-400' : task.due_date ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      <CalendarIcon size={14} />
                      <span className="font-bold text-[11px] uppercase tracking-wide">
                        {task.due_date ? formatDate(task.due_date) : 'No date'}
                      </span>
                      {overdue && <AlertCircle size={14} className="text-red-500" />}
                    </div>

                    {/* Client */}
                    {task.client && (
                      <div className="flex-shrink-0 flex items-center gap-1.5 text-slate-500">
                        <User size={14} />
                        <span className="text-[11px] font-bold truncate max-w-[120px]">
                          {task.client.company_name}
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(task)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#151B28] border border-slate-800/50 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-800/50">
                <h2 className="text-lg font-black uppercase tracking-tight text-white">
                  {editingTask ? 'Edit Task' : 'New Task'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    className="w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none rounded-lg py-3 px-4 text-sm text-white placeholder:text-slate-600"
                    autoFocus
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Add details..."
                    rows={3}
                    className="w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none rounded-lg py-3 px-4 text-sm text-white placeholder:text-slate-600 resize-none"
                  />
                </div>

                {/* Priority & Status Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                      Priority
                    </label>
                    <div className="relative">
                      <select
                        value={formPriority}
                        onChange={(e) => setFormPriority(e.target.value)}
                        className="w-full appearance-none bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none rounded-lg py-3 px-4 text-sm text-white cursor-pointer"
                      >
                        {PRIORITIES.map(p => (
                          <option key={p} value={p}>{PRIORITY_COLORS[p].label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                      Status
                    </label>
                    <div className="relative">
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value)}
                        className="w-full appearance-none bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none rounded-lg py-3 px-4 text-sm text-white cursor-pointer"
                      >
                        {STATUSES.map(s => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                    </div>
                  </div>
                </div>

                {/* Due Date & Time Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={formDueDate}
                      onChange={(e) => setFormDueDate(e.target.value)}
                      className="w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none rounded-lg py-3 px-4 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                      Due Time (optional)
                    </label>
                    <input
                      type="time"
                      value={formDueTime}
                      onChange={(e) => setFormDueTime(e.target.value)}
                      className="w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none rounded-lg py-3 px-4 text-sm text-white"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                    Category
                  </label>
                  <div className="relative">
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full appearance-none bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none rounded-lg py-3 px-4 text-sm text-white cursor-pointer"
                    >
                      <option value="">Select category...</option>
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                  </div>
                </div>

                {/* Client Selection */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                    Link to Client
                  </label>
                  <div ref={clientRef} className="relative">
                    {selectedClient ? (
                      <div className="flex items-center justify-between bg-[#0B0F19] border border-slate-800 rounded-lg p-3">
                        <div>
                          <p className="text-sm font-bold text-white">{selectedClient.company_name}</p>
                          <p className="text-[10px] text-slate-500">{selectedClient.contact_person} • {selectedClient.email}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setFormClientId(''); setClientSearch(''); }}
                          className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                          <input
                            type="text"
                            placeholder="Search clients..."
                            value={clientSearch}
                            onChange={(e) => { setClientSearch(e.target.value); setClientDropdownOpen(true); }}
                            onFocus={() => setClientDropdownOpen(true)}
                            className="w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none rounded-lg py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-600"
                          />
                        </div>
                        {clientDropdownOpen && clientSearch && filteredClients.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-[#151B28] border border-slate-700 shadow-2xl rounded-lg z-50 max-h-48 overflow-y-auto">
                            {filteredClients.map(client => (
                              <button
                                key={client.id}
                                type="button"
                                onClick={() => {
                                  setFormClientId(client.id);
                                  setClientSearch('');
                                  setClientDropdownOpen(false);
                                }}
                                className="w-full text-left p-3 hover:bg-slate-800 transition-colors border-b border-slate-800/50 last:border-b-0"
                              >
                                <p className="font-bold text-white text-xs">{client.company_name}</p>
                                <p className="text-slate-500 text-[10px]">{client.contact_person} • {client.email}</p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formTags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 bg-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-md">
                        <Tag size={12} />
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="text-slate-500 hover:text-red-400 ml-1">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formTagInput}
                      onChange={(e) => setFormTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                      placeholder="Add a tag..."
                      className="flex-1 bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none rounded-lg py-2.5 px-3 text-sm text-white placeholder:text-slate-600"
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="px-3 py-2.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Additional notes..."
                    rows={3}
                    className="w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none rounded-lg py-3 px-4 text-sm text-white placeholder:text-slate-600 resize-none"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-800/50">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 bg-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formTitle.trim()}
                  className="px-5 py-2.5 bg-orange-500 text-white font-black text-xs uppercase tracking-wider rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
