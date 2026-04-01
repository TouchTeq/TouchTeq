'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Phone,
  Briefcase,
  Bell,
  Car,
  FileText,
  X,
  Edit2,
  Trash2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  createCalendarEvent,
  getCalendarEvents,
  updateCalendarEvent,
  deleteCalendarEvent,
  updateEventStatus,
  getUpcomingEvents,
} from '@/lib/calendar/actions';

const EVENT_TYPES = [
  { value: 'appointment', label: 'Appointment', icon: CalendarIcon, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  { value: 'meeting', label: 'Meeting', icon: Users, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  { value: 'site_visit', label: 'Site Visit', icon: MapPin, color: 'text-green-400', bgColor: 'bg-green-500/20' },
  { value: 'deadline', label: 'Deadline', icon: FileText, color: 'text-red-400', bgColor: 'bg-red-500/20' },
  { value: 'reminder', label: 'Reminder', icon: Bell, color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  { value: 'travel', label: 'Travel', icon: Car, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
  { value: 'other', label: 'Other', icon: Briefcase, color: 'text-slate-400', bgColor: 'bg-slate-500/20' },
] as const;

const EVENT_STATUSES = [
  { value: 'scheduled', label: 'Scheduled', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500/20 text-green-400' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500/20 text-red-400' },
  { value: 'rescheduled', label: 'Rescheduled', color: 'bg-amber-500/20 text-amber-400' },
];

const COLOURS = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4', '#64748B'
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatTime(time: string | null) {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  
  // View mode
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  
  // Current date
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();
  
  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formEventType, setFormEventType] = useState('appointment');
  const [formStartDate, setFormStartDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formEndTime, setFormEndTime] = useState('');
  const [formAllDay, setFormAllDay] = useState(false);
  const [formLocation, setFormLocation] = useState('');
  const [formClientId, setFormClientId] = useState('');
  const [formStatus, setFormStatus] = useState('scheduled');
  const [formColour, setFormColour] = useState('#3B82F6');
  const [formNotes, setFormNotes] = useState('');
  
  // Expanded day
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  
  const supabase = createClient();

  const loadEvents = useCallback(async () => {
    setLoading(true);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
    
    const { data } = await getCalendarEvents(startDate, endDate);
    if (data) setEvents(data);
    
    const { data: upcoming } = await getUpcomingEvents(5);
    if (upcoming) setUpcomingEvents(upcoming);
    
    setLoading(false);
  }, [currentDate]);

  const loadClients = async () => {
    const { data } = await supabase.from('profiles').select('id, full_name, company_name').limit(50);
    if (data) setClients(data);
  };

  useEffect(() => {
    loadEvents();
    loadClients();
  }, [loadEvents]);

  const getEventsForDay = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => e.start_date === dateStr);
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const openNewEventModal = (date?: string) => {
    const dateStr = date || new Date().toISOString().split('T')[0];
    setSelectedDate(dateStr);
    setFormTitle('');
    setFormDescription('');
    setFormEventType('appointment');
    setFormStartDate(dateStr);
    setFormStartTime('');
    setFormEndDate(dateStr);
    setFormEndTime('');
    setFormAllDay(false);
    setFormLocation('');
    setFormClientId('');
    setFormStatus('scheduled');
    setFormColour('#3B82F6');
    setFormNotes('');
    setEditingEvent(null);
    setShowModal(true);
  };

  const openEditModal = (event: CalendarEvent) => {
    setEditingEvent(event);
    setFormTitle(event.title);
    setFormDescription(event.description || '');
    setFormEventType(event.event_type);
    setFormStartDate(event.start_date);
    setFormStartTime(event.start_time || '');
    setFormEndDate(event.end_date || event.start_date);
    setFormEndTime(event.end_time || '');
    setFormAllDay(event.all_day || false);
    setFormLocation(event.location || '');
    setFormClientId(event.client_id || '');
    setFormStatus(event.status);
    setFormColour(event.colour || '#3B82F6');
    setFormNotes(event.notes || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('title', formTitle);
    formData.append('description', formDescription);
    formData.append('event_type', formEventType);
    formData.append('start_date', formStartDate);
    formData.append('start_time', formStartTime);
    formData.append('end_date', formEndDate);
    formData.append('end_time', formEndTime);
    formData.append('all_day', formAllDay.toString());
    formData.append('location', formLocation);
    formData.append('client_id', formClientId);
    formData.append('status', formStatus);
    formData.append('colour', formColour);
    formData.append('notes', formNotes);

    let result;
    if (editingEvent) {
      result = await updateCalendarEvent(editingEvent.id, formData);
    } else {
      result = await createCalendarEvent(formData);
    }

    if (!result.error) {
      setShowModal(false);
      loadEvents();
    }
  };

  const handleDelete = async () => {
    if (!editingEvent) return;
    if (confirm('Delete this event?')) {
      const result = await deleteCalendarEvent(editingEvent.id);
      if (!result.error) {
        setShowModal(false);
        loadEvents();
      }
    }
  };

  const handleStatusChange = async (eventId: string, status: string) => {
    await updateEventStatus(eventId, status);
    loadEvents();
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const monthDays = [];
  for (let i = 0; i < firstDay; i++) {
    monthDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    monthDays.push(i);
  }

  const getEventTypeConfig = (type: string) => {
    return EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[EVENT_TYPES.length - 1];
  };

  return (
    <div className="min-h-screen bg-[#151B28] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-white">Calendar</h1>
            <p className="text-slate-400 text-sm mt-1">Manage your schedule and events</p>
          </div>
          <button
            onClick={() => openNewEventModal()}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            <Plus size={18} />
            <span>New Event</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="bg-[#1a2235] rounded-xl border border-slate-700/50 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigateMonth(-1)}
                    className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <h2 className="text-lg font-medium text-white min-w-[180px] text-center">
                    {monthNames[month]} {year}
                  </h2>
                  <button
                    onClick={() => navigateMonth(1)}
                    className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="px-3 py-1.5 text-sm text-orange-400 hover:bg-orange-500/10 rounded-lg transition-colors"
                  >
                    Today
                  </button>
                  {(['monthly', 'weekly', 'daily'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        viewMode === mode
                          ? 'bg-orange-500 text-white'
                          : 'text-slate-400 hover:bg-slate-700/50'
                      }`}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-7 gap-px bg-slate-700/30 rounded-lg overflow-hidden">
                {dayNames.map((day) => (
                  <div key={day} className="bg-[#1a2235] p-2 text-center text-sm font-medium text-slate-400">
                    {day}
                  </div>
                ))}
                {monthDays.map((day, index) => {
                  if (!day) {
                    return <div key={`empty-${index}`} className="bg-[#1a2235] min-h-[100px]" />;
                  }
                  
                  const dayEvents = getEventsForDay(day);
                  const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                  const isExpanded = expandedDay === day;
                  
                  return (
                    <div
                      key={day}
                      className={`bg-[#1a2235] min-h-[100px] p-1 ${
                        isToday ? 'ring-1 ring-orange-500 ring-inset' : ''
                      }`}
                    >
                      <button
                        onClick={() => openNewEventModal(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)}
                        className={`w-full text-left p-1 rounded text-sm hover:bg-slate-700/50 transition-colors ${
                          isToday ? 'text-orange-400 font-medium' : 'text-slate-300'
                        }`}
                      >
                        {day}
                      </button>
                      <div className="space-y-0.5 mt-0.5">
                        {dayEvents.slice(0, isExpanded ? undefined : 2).map((event) => {
                          const typeConfig = getEventTypeConfig(event.event_type);
                          return (
                            <button
                              key={event.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(event);
                              }}
                              className={`w-full text-left px-1.5 py-0.5 rounded text-xs truncate ${typeConfig.bgColor} ${typeConfig.color}`}
                            >
                              {event.all_day ? event.title : `${formatTime(event.start_time)} ${event.title}`}
                            </button>
                          );
                        })}
                        {dayEvents.length > 2 && !isExpanded && (
                          <button
                            onClick={() => setExpandedDay(expandedDay === day ? null : day)}
                            className="w-full text-left px-1.5 py-0.5 text-xs text-slate-500 hover:text-slate-400"
                          >
                            +{dayEvents.length - 2} more
                          </button>
                        )}
                        {isExpanded && dayEvents.length > 2 && (
                          <button
                            onClick={() => setExpandedDay(null)}
                            className="w-full text-left px-1.5 py-0.5 text-xs text-slate-500 hover:text-slate-400"
                          >
                            Show less
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-[#1a2235] rounded-xl border border-slate-700/50 p-4">
              <h3 className="text-sm font-medium text-slate-400 mb-3">Upcoming Events</h3>
              {upcomingEvents.length === 0 ? (
                <p className="text-slate-500 text-sm">No upcoming events</p>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => {
                    const typeConfig = getEventTypeConfig(event.event_type);
                    const eventDate = new Date(event.start_date);
                    const isToday = eventDate.toDateString() === today.toDateString();
                    
                    return (
                      <button
                        key={event.id}
                        onClick={() => openEditModal(event)}
                        className="w-full text-left p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 rounded-full mt-1.5" style={{ backgroundColor: event.colour }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{event.title}</p>
                            <p className="text-slate-500 text-xs mt-0.5">
                              {isToday ? 'Today' : eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                              {event.start_time && ` at ${formatTime(event.start_time)}`}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-[#1a2235] rounded-xl border border-slate-700/50 p-4">
              <h3 className="text-sm font-medium text-slate-400 mb-3">Event Types</h3>
              <div className="space-y-2">
                {EVENT_TYPES.map((type) => (
                  <div key={type.value} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded ${type.bgColor}`} />
                    <span className="text-slate-300 text-sm">{type.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

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
                  {editingEvent ? 'Edit Event' : 'New Event'}
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
                    placeholder="Event title"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Event Type</label>
                  <select
                    value={formEventType}
                    onChange={(e) => setFormEventType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  >
                    {EVENT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">Start Date *</label>
                    <input
                      type="date"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    />
                  </div>
                  {!formAllDay && (
                    <div>
                      <label className="block text-sm text-slate-400 mb-1.5">Start Time</label>
                      <input
                        type="time"
                        value={formStartTime}
                        onChange={(e) => setFormStartTime(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="allDay"
                    checked={formAllDay}
                    onChange={(e) => setFormAllDay(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 text-orange-500 focus:ring-orange-500/50"
                  />
                  <label htmlFor="allDay" className="text-sm text-slate-300">All day event</label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">End Date</label>
                    <input
                      type="date"
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    />
                  </div>
                  {!formAllDay && (
                    <div>
                      <label className="block text-sm text-slate-400 mb-1.5">End Time</label>
                      <input
                        type="time"
                        value={formEndTime}
                        onChange={(e) => setFormEndTime(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Location</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    placeholder="Event location"
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

                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  >
                    {EVENT_STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Colour</label>
                  <div className="flex gap-2">
                    {COLOURS.map((colour) => (
                      <button
                        key={colour}
                        type="button"
                        onClick={() => setFormColour(colour)}
                        className={`w-8 h-8 rounded-full transition-transform ${
                          formColour === colour ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1a2235] scale-110' : ''
                        }`}
                        style={{ backgroundColor: colour }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Description</label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none"
                    placeholder="Event description"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Internal Notes</label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none"
                    placeholder="Private notes"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  {editingEvent && (
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
                    {editingEvent ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_date: string;
  start_time: string | null;
  end_date: string | null;
  end_time: string | null;
  all_day: boolean;
  location: string | null;
  client_id: string | null;
  task_id: string | null;
  is_recurring: boolean;
  recurring_frequency: string | null;
  recurring_until: string | null;
  status: string;
  colour: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}