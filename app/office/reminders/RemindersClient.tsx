'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  BellRing,
  Search,
  Clock,
  X,
  Edit2,
  Trash2,
  Check,
  AlertCircle,
  Calendar,
  Phone,
  Users,
  FileText,
  ChevronDown,
  RotateCcw,
  Plus,
  TrendingUp,
  Mail,
  History,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { useOfficeToast } from '@/components/office/OfficeToastContext';
import { createClient } from '@/lib/supabase/client';
import {
  createReminder,
  getReminders,
  updateReminder,
  deleteReminder,
  completeReminder,
  snoozeReminder,
  getReminderStats,
  type Reminder,
} from '@/lib/reminders/actions';

const REMINDER_TYPES = [
  { value: 'task', label: 'Task Reminder', icon: Check },
  { value: 'follow_up', label: 'Follow-up', icon: Bell },
  { value: 'meeting', label: 'Meeting', icon: Calendar },
  { value: 'call', label: 'Call Reminder', icon: Phone },
  { value: 'custom', label: 'Custom', icon: Bell },
] as const;

const REMINDER_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-amber-500/20 text-amber-400' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500/20 text-green-400' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-slate-500/20 text-slate-400' },
  { value: 'missed', label: 'Missed', color: 'bg-red-500/20 text-red-400' },
];

const SNOOZE_OPTIONS = [
  { value: 5, label: '5 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 1440, label: '1 day' },
];

interface RemindersClientProps {
  reminders?: Reminder[];
  stats?: { total: number; pending: number; overdue: number; completed: number };
  overdueInvoices?: any[];
  history?: any[];
}

export default function RemindersClient({ 
  reminders: initialReminders = [], 
  stats: initialStats = { total: 0, pending: 0, overdue: 0, completed: 0 },
  overdueInvoices = [],
  history = []
}: RemindersClientProps) {
  const router = useRouter();
  const toast = useOfficeToast();
  const supabase = createClient();
  
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders);
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState<'personal' | 'invoices'>('personal');
  
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formReminderType, setFormReminderType] = useState('custom');
  const [formReminderAt, setFormReminderAt] = useState('');
  const [formClientId, setFormClientId] = useState('');
  const [formIsRecurring, setFormIsRecurring] = useState(false);
  const [formRecurringFrequency, setFormRecurringFrequency] = useState('');
  
  const [showSnoozeModal, setShowSnoozeModal] = useState(false);
  const [snoozingReminder, setSnoozingReminder] = useState<Reminder | null>(null);

  const loadReminders = useCallback(async () => {
    setLoading(true);
    const filters: any = {};
    if (statusFilter !== 'all') filters.status = statusFilter;
    if (typeFilter !== 'all') filters.reminderType = typeFilter;
    
    const { data } = await getReminders(
      filters.status,
      undefined,
      undefined,
      filters.reminderType
    );
    if (data) setReminders(data);
    
    const statsData = await getReminderStats();
    if (!statsData.error && statsData.total !== undefined) {
      setStats({ total: statsData.total, pending: statsData.pending, overdue: statsData.overdue, completed: statsData.completed });
    }
    
    setLoading(false);
  }, [statusFilter, typeFilter]);

  const loadClients = async () => {
    const { data } = await supabase.from('profiles').select('id, full_name, company_name').limit(50);
    if (data) setClients(data);
  };

  useEffect(() => {
    loadClients();
  }, []);

  const openNewReminderModal = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 15);
    setFormTitle('');
    setFormDescription('');
    setFormReminderType('custom');
    setFormReminderAt(now.toISOString().slice(0, 16));
    setFormClientId('');
    setFormIsRecurring(false);
    setFormRecurringFrequency('');
    setEditingReminder(null);
    setShowModal(true);
  };

  const openEditModal = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setFormTitle(reminder.title);
    setFormDescription(reminder.description || '');
    setFormReminderType(reminder.reminder_type);
    setFormReminderAt(reminder.reminder_at.slice(0, 16));
    setFormClientId(reminder.client_id || '');
    setFormIsRecurring(reminder.is_recurring || false);
    setFormRecurringFrequency(reminder.recurring_frequency || '');
    setShowModal(true);
  };

  const openSnoozeModal = (reminder: Reminder) => {
    setSnoozingReminder(reminder);
    setShowSnoozeModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('title', formTitle);
    formData.append('description', formDescription);
    formData.append('reminder_type', formReminderType);
    formData.append('reminder_at', new Date(formReminderAt).toISOString());
    formData.append('client_id', formClientId);
    formData.append('is_recurring', formIsRecurring.toString());
    if (formIsRecurring && formRecurringFrequency) {
      formData.append('recurring_frequency', formRecurringFrequency);
    }

    let result;
    if (editingReminder) {
      result = await updateReminder(editingReminder.id, formData);
    } else {
      result = await createReminder(formData);
    }

    if (!result.error) {
      setShowModal(false);
      loadReminders();
      toast.success({ title: 'Reminder saved' });
    } else {
      toast.error({ title: result.error });
    }
  };

  const handleDelete = async () => {
    if (!editingReminder) return;
    if (confirm('Delete this reminder?')) {
      const result = await deleteReminder(editingReminder.id);
      if (!result.error) {
        setShowModal(false);
        loadReminders();
        toast.success({ title: 'Reminder deleted' });
      }
    }
  };

  const handleComplete = async (id: string) => {
    await completeReminder(id);
    loadReminders();
    toast.success({ title: 'Reminder completed' });
  };

  const handleSnooze = async (minutes: number) => {
    if (!snoozingReminder) return;
    await snoozeReminder(snoozingReminder.id, minutes);
    setShowSnoozeModal(false);
    loadReminders();
    toast.success({ title: 'Reminder snoozed' });
  };

  const filteredReminders = reminders.filter(r => {
    if (searchQuery && !r.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const getTypeConfig = (type: string) => {
    return REMINDER_TYPES.find(t => t.value === type) || REMINDER_TYPES[REMINDER_TYPES.length - 1];
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const isOverdue = (reminderAt: string, status: string) => {
    if (status !== 'pending') return false;
    return new Date(reminderAt) < new Date();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(val).replace('ZAR', 'R');
  };

  const getSeverityColor = (days: number) => {
    if (days >= 15) return 'text-red-500 bg-red-500/10 border-red-500/20';
    if (days >= 8) return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
    return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
  };

  return (
    <div className="min-h-screen bg-[#151B28] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-white">Reminders</h1>
            <p className="text-slate-400 text-sm mt-1">Manage your follow-ups, tasks, and payment reminders</p>
          </div>
          <button
            onClick={openNewReminderModal}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            <Plus size={18} />
            <span>New Reminder</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('personal')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'personal'
                ? 'bg-orange-500 text-white'
                : 'bg-[#1a2235] text-slate-400 hover:text-white'
            }`}
          >
            <Bell className="inline mr-2" size={16} />
            Personal Reminders
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'invoices'
                ? 'bg-orange-500 text-white'
                : 'bg-[#1a2235] text-slate-400 hover:text-white'
            }`}
          >
            <BellRing className="inline mr-2" size={16} />
            Payment Reminders
          </button>
        </div>

        {activeTab === 'personal' ? (
          <>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-[#1a2235] rounded-xl border border-slate-700/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center">
                    <Bell size={20} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-white">{stats.total}</p>
                    <p className="text-sm text-slate-400">Total</p>
                  </div>
                </div>
              </div>
              <div className="bg-[#1a2235] rounded-xl border border-slate-700/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <Clock size={20} className="text-amber-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-white">{stats.pending}</p>
                    <p className="text-sm text-slate-400">Pending</p>
                  </div>
                </div>
              </div>
              <div className="bg-[#1a2235] rounded-xl border border-slate-700/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <AlertCircle size={20} className="text-red-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-white">{stats.overdue}</p>
                    <p className="text-sm text-slate-400">Overdue</p>
                  </div>
                </div>
              </div>
              <div className="bg-[#1a2235] rounded-xl border border-slate-700/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Check size={20} className="text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-white">{stats.completed}</p>
                    <p className="text-sm text-slate-400">Completed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search reminders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#1a2235] border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-[#1a2235] border border-slate-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 bg-[#1a2235] border border-slate-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              >
                <option value="all">All Types</option>
                {REMINDER_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Reminders List */}
            <div className="bg-[#1a2235] rounded-xl border border-slate-700/50 overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-slate-400">Loading...</div>
              ) : filteredReminders.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Bell size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No personal reminders found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/30">
                  {filteredReminders.map((reminder) => {
                    const typeConfig = getTypeConfig(reminder.reminder_type);
                    const statusConfig = REMINDER_STATUSES.find(s => s.value === reminder.status);
                    const overdue = isOverdue(reminder.reminder_at, reminder.status);
                    
                    return (
                      <div
                        key={reminder.id}
                        className="p-4 hover:bg-slate-800/30 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <button
                            onClick={() => handleComplete(reminder.id)}
                            disabled={reminder.status !== 'pending'}
                            className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                              reminder.status === 'completed'
                                ? 'bg-green-500 border-green-500'
                                : 'border-slate-500 hover:border-orange-500'
                            }`}
                          >
                            {reminder.status === 'completed' && <Check size={12} className="text-white" />}
                          </button>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`font-medium ${reminder.status === 'completed' ? 'text-slate-500 line-through' : 'text-white'}`}>
                                {reminder.title}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-xs ${statusConfig?.color}`}>
                                {statusConfig?.label}
                              </span>
                              {overdue && (
                                <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400">
                                  Overdue
                                </span>
                              )}
                            </div>
                            
                            {reminder.description && (
                              <p className="text-sm text-slate-400 mb-2 line-clamp-2">{reminder.description}</p>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <div className="flex items-center gap-1">
                                <typeConfig.icon size={14} />
                                <span>{typeConfig.label}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock size={14} />
                                <span className={overdue ? 'text-red-400' : ''}>
                                  {formatDateTime(reminder.reminder_at)}
                                </span>
                              </div>
                              {reminder.client && (
                                <div className="flex items-center gap-1">
                                  <Users size={14} />
                                  <span>{reminder.client.company_name}</span>
                                </div>
                              )}
                              {reminder.is_recurring && (
                                <div className="flex items-center gap-1">
                                  <RotateCcw size={14} />
                                  <span>{reminder.recurring_frequency}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {reminder.status === 'pending' && (
                              <button
                                onClick={() => openSnoozeModal(reminder)}
                                className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                                title="Snooze"
                              >
                                <RotateCcw size={18} />
                              </button>
                            )}
                            <button
                              onClick={() => openEditModal(reminder)}
                              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                            >
                              <Edit2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Invoice Reminders Tab */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-[#1a2235] rounded-xl border border-slate-700/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <AlertCircle size={20} className="text-red-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-white">{overdueInvoices.length}</p>
                    <p className="text-sm text-slate-400">Overdue Invoices</p>
                  </div>
                </div>
              </div>
              <div className="bg-[#1a2235] rounded-xl border border-slate-700/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <TrendingUp size={20} className="text-amber-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-white">
                      {formatCurrency(overdueInvoices.reduce((sum, inv) => sum + Number(inv.balance_due || 0), 0))}
                    </p>
                    <p className="text-sm text-slate-400">Total Overdue Value</p>
                  </div>
                </div>
              </div>
              <div className="bg-[#1a2235] rounded-xl border border-slate-700/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Mail size={20} className="text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-white">{history.filter(h => h.status === 'Sent').length}</p>
                    <p className="text-sm text-slate-400">Reminders This Month</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Overdue Invoices */}
            <div className="bg-[#1a2235] rounded-xl border border-slate-700/50 overflow-hidden">
              <div className="p-4 border-b border-slate-700/50">
                <h2 className="text-lg font-medium text-white">Overdue Invoices</h2>
              </div>
              {overdueInvoices.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <CheckCircle2 size={48} className="mx-auto mb-4 text-green-500" />
                  <p>No overdue invoices - all payments up to date!</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/30">
                  {overdueInvoices.map((invoice: any) => {
                    const daysOverdue = differenceInDays(new Date(), new Date(invoice.due_date));
                    return (
                      <div key={invoice.id} className="p-4 hover:bg-slate-800/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium">{invoice.invoice_number}</p>
                            <p className="text-sm text-slate-400">{invoice.clients?.company_name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-medium">{formatCurrency(invoice.balance_due)}</p>
                            <p className={`text-sm ${getSeverityColor(daysOverdue)}`}>
                              {daysOverdue} days overdue
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="mt-6 bg-[#1a2235] rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="p-4 border-b border-slate-700/50">
                  <h2 className="text-lg font-medium text-white flex items-center gap-2">
                    <History size={20} />
                    Recent Reminder History
                  </h2>
                </div>
                <div className="divide-y divide-slate-700/30">
                  {history.slice(0, 10).map((item: any) => (
                    <div key={item.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white">{item.invoices?.invoice_number}</p>
                          <p className="text-sm text-slate-400">{item.invoices?.clients?.company_name}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm ${item.status === 'Sent' ? 'text-green-400' : 'text-slate-400'}`}>
                            {item.status}
                          </p>
                          <p className="text-xs text-slate-500">
                            {item.sent_at ? new Date(item.sent_at).toLocaleString() : '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a2235] rounded-xl border border-slate-700/50 w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                <h2 className="text-lg font-medium text-white">
                  {editingReminder ? 'Edit Reminder' : 'New Reminder'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Title *</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    placeholder="Reminder title"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Description</label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none"
                    placeholder="Additional details"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Type</label>
                  <select
                    value={formReminderType}
                    onChange={(e) => setFormReminderType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  >
                    {REMINDER_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Remind me at *</label>
                  <input
                    type="datetime-local"
                    value={formReminderAt}
                    onChange={(e) => setFormReminderAt(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Client</label>
                  <select
                    value={formClientId}
                    onChange={(e) => setFormClientId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  >
                    <option value="">No client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.company_name || client.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    checked={formIsRecurring}
                    onChange={(e) => setFormIsRecurring(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 text-orange-500 focus:ring-orange-500/50"
                  />
                  <label htmlFor="isRecurring" className="text-sm text-slate-300">Recurring reminder</label>
                </div>

                {formIsRecurring && (
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">Frequency</label>
                    <select
                      value={formRecurringFrequency}
                      onChange={(e) => setFormRecurringFrequency(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    >
                      <option value="">Select frequency</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  {editingReminder && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  )}
                  <div className="flex-1" />
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                  >
                    {editingReminder ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Snooze Modal */}
      <AnimatePresence>
        {showSnoozeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
            onClick={() => setShowSnoozeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a2235] rounded-xl border border-slate-700/50 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                <h2 className="text-lg font-medium text-white">Snooze Reminder</h2>
                <button
                  onClick={() => setShowSnoozeModal(false)}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 space-y-2">
                {SNOOZE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSnooze(option.value)}
                    className="w-full px-4 py-3 text-left bg-slate-800/50 hover:bg-slate-800 rounded-lg text-white transition-colors"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}