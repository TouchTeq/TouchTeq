'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Briefcase,
  Bell,
  Car,
  FileText,
  X,
  Search,
} from 'lucide-react';
import { DatePicker } from '@/components/ui/DatePicker';
import { TimePicker } from '@/components/ui/TimePicker';
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
  { value: 'appointment', label: 'Appointment', icon: CalendarIcon, color: 'text-blue-400', bgColor: 'bg-blue-500/20', hex: '#3B82F6' },
  { value: 'meeting', label: 'Meeting', icon: Users, color: 'text-purple-400', bgColor: 'bg-purple-500/20', hex: '#8B5CF6' },
  { value: 'site_visit', label: 'Site Visit', icon: MapPin, color: 'text-green-400', bgColor: 'bg-green-500/20', hex: '#22C55E' },
  { value: 'deadline', label: 'Deadline', icon: FileText, color: 'text-red-400', bgColor: 'bg-red-500/20', hex: '#EF4444' },
  { value: 'reminder', label: 'Reminder', icon: Bell, color: 'text-amber-400', bgColor: 'bg-amber-500/20', hex: '#F97316' },
  { value: 'travel', label: 'Travel', icon: Car, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20', hex: '#06B6D4' },
  { value: 'other', label: 'Other', icon: Briefcase, color: 'text-slate-400', bgColor: 'bg-slate-500/20', hex: '#64748B' },
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

const HOUR_HEIGHT = 60;
const START_HOUR = 6;
const END_HOUR = 22;
const TOTAL_HOURS = END_HOUR - START_HOUR;

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

function formatDateStr(date: Date) {
  return date.toISOString().split('T')[0];
}

function getWeekStart(date: Date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function getWeekDays(date: Date) {
  const start = getWeekStart(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function timeToMinutes(time: string) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function getEventTop(time: string | null) {
  if (!time) return 0;
  const mins = timeToMinutes(time);
  return (mins - START_HOUR * 60) * (HOUR_HEIGHT / 60);
}

function getEventHeight(startTime: string | null, endTime: string | null) {
  if (!startTime) return HOUR_HEIGHT;
  const startMins = timeToMinutes(startTime);
  const endMins = endTime ? timeToMinutes(endTime) : startMins + 60;
  const duration = Math.max(endMins - startMins, 15);
  return duration * (HOUR_HEIGHT / 60);
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);

  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [now, setNow] = useState(new Date());

  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const [clientSearch, setClientSearch] = useState('');
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const clientRef = useRef<HTMLDivElement>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

  const supabase = createClient();

  const getVisibleRange = useCallback(() => {
    if (viewMode === 'monthly') {
      const y = currentDate.getFullYear();
      const m = currentDate.getMonth();
      return {
        start: new Date(y, m, 1),
        end: new Date(y, m + 1, 0),
      };
    } else if (viewMode === 'weekly') {
      const weekStart = getWeekStart(currentDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return { start: weekStart, end: weekEnd };
    } else {
      return { start: currentDate, end: currentDate };
    }
  }, [currentDate, viewMode]);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    const { start, end } = getVisibleRange();
    const startDate = formatDateStr(start);
    const endDate = formatDateStr(end);

    const { data } = await getCalendarEvents(startDate, endDate);
    if (data) setEvents(data);

    const { data: upcoming } = await getUpcomingEvents(5);
    if (upcoming) setUpcomingEvents(upcoming);

    setLoading(false);
  }, [getVisibleRange]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    async function loadClients() {
      const { data } = await supabase
        .from('clients')
        .select('id, company_name, contact_person, email')
        .eq('status', 'active')
        .order('company_name');
      setClients(data || []);
    }
    loadClients();
  }, [supabase]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clientRef.current && !clientRef.current.contains(event.target as Node)) {
        setClientDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredClients = clients.filter(c =>
    (c.company_name || '').toLowerCase().includes(clientSearch.toLowerCase()) ||
    (c.contact_person || '').toLowerCase().includes(clientSearch.toLowerCase())
  );

  const selectedClient = clients.find(c => c.id === formClientId);

  const getEventsForDateStr = (dateStr: string) => {
    return events.filter(e => e.start_date === dateStr);
  };

  const getEventsForDay = (day: number) => {
    const dateStr = formatDateStr(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    return getEventsForDateStr(dateStr);
  };

  const navigateMonth = (direction: number) => {
    if (viewMode === 'monthly') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
    } else if (viewMode === 'weekly') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + direction * 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + direction);
      setCurrentDate(d);
    }
  };

  const openNewEventModal = (date?: string, time?: string) => {
    const dateStr = date || formatDateStr(new Date());
    setSelectedDate(dateStr);
    setFormTitle('');
    setFormDescription('');
    setFormEventType('appointment');
    setFormStartDate(dateStr);
    setFormStartTime(time || '09:00');
    setFormEndDate(dateStr);
    setFormEndTime(time ? `${String(Math.min(parseInt(time.split(':')[0]) + 1, 23)).padStart(2, '0')}:00` : '10:00');
    setFormAllDay(false);
    setFormLocation('');
    setFormClientId('');
    setClientSearch('');
    setClientDropdownOpen(false);
    setFormStatus('scheduled');
    setFormColour('#3B82F6');
    setFormNotes('');
    setFormError('');
    setFormLoading(false);
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
    setClientSearch('');
    setClientDropdownOpen(false);
    setFormStatus(event.status);
    setFormColour(event.colour || '#3B82F6');
    setFormNotes(event.notes || '');
    setFormError('');
    setFormLoading(false);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    if (!formTitle.trim()) {
      setFormError('Title is required');
      setFormLoading(false);
      return;
    }

    if (!formAllDay && formStartTime && formEndTime) {
      if (formStartDate === formEndDate && formEndTime <= formStartTime) {
        setFormError('End time must be after start time for the same date');
        setFormLoading(false);
        return;
      }
      if (formEndDate < formStartDate) {
        setFormError('End date cannot be before start date');
        setFormLoading(false);
        return;
      }
    }

    const formData = new FormData();
    formData.append('title', formTitle.trim());
    formData.append('description', formDescription);
    formData.append('event_type', formEventType);
    formData.append('start_date', formStartDate);
    formData.append('start_time', formStartTime || '');
    formData.append('end_date', formEndDate || formStartDate);
    formData.append('end_time', formEndTime || '');
    formData.append('all_day', formAllDay.toString());
    formData.append('location', formLocation);
    formData.append('client_id', formClientId || '');
    formData.append('status', formStatus);
    formData.append('colour', formColour);
    formData.append('notes', formNotes);

    let result;
    if (editingEvent) {
      result = await updateCalendarEvent(editingEvent.id, formData);
    } else {
      result = await createCalendarEvent(formData);
    }

    setFormLoading(false);

    if (!result.error) {
      setShowModal(false);
      loadEvents();
    } else {
      setFormError(result.error);
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

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayNamesFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) monthDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) monthDays.push(i);

  const getEventTypeConfig = (type: string) => {
    return EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[EVENT_TYPES.length - 1];
  };

  const getHeaderLabel = () => {
    if (viewMode === 'monthly') {
      return `${monthNames[month]} ${year}`;
    } else if (viewMode === 'weekly') {
      const weekDays = getWeekDays(currentDate);
      const s = weekDays[0];
      const e = weekDays[6];
      if (s.getMonth() === e.getMonth()) {
        return `${monthNames[s.getMonth()]} ${s.getDate()} - ${e.getDate()}, ${s.getFullYear()}`;
      }
      return `${monthNames[s.getMonth()].slice(0, 3)} ${s.getDate()} - ${monthNames[e.getMonth()].slice(0, 3)} ${e.getDate()}, ${e.getFullYear()}`;
    } else {
      return `${dayNamesFull[currentDate.getDay()]}, ${monthNames[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
    }
  };

  const renderCurrentTimeIndicator = () => {
    const todayStr = formatDateStr(now);
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    if (currentHour < START_HOUR || currentHour >= END_HOUR) return null;
    const top = (currentHour - START_HOUR) * HOUR_HEIGHT + (currentMinute / 60) * HOUR_HEIGHT;
    return (
      <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top }}>
        <div className="flex items-center">
          <div className="w-2.5 h-2.5 rounded-full bg-orange-500 -ml-1" />
          <div className="flex-1 h-[2px] bg-orange-500" />
        </div>
      </div>
    );
  };

  const renderWeeklyView = () => {
    const weekDays = getWeekDays(currentDate);
    const todayStr = formatDateStr(now);

    return (
      <div className="flex flex-col">
        <div className="flex border-b border-slate-700/50">
          <div className="w-16 flex-shrink-0" />
          {weekDays.map((day, i) => {
            const dateStr = formatDateStr(day);
            const isToday = dateStr === todayStr;
            return (
              <div key={i} className={`flex-1 text-center py-2 border-l border-slate-700/30 ${isToday ? 'bg-orange-500/5' : ''}`}>
                <div className={`text-[10px] font-semibold uppercase tracking-wider ${isToday ? 'text-orange-400' : 'text-slate-500'}`}>
                  {dayNames[day.getDay()]}
                </div>
                <div className={`text-lg font-bold ${isToday ? 'text-orange-400' : 'text-slate-300'}`}>
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          <div className="w-16 flex-shrink-0">
            {Array.from({ length: TOTAL_HOURS }, (_, i) => {
              const hour = START_HOUR + i;
              const ampm = hour >= 12 ? 'PM' : 'AM';
              const h12 = hour % 12 || 12;
              return (
                <div key={hour} className="text-[10px] text-slate-600 pr-2 text-right -mt-2" style={{ height: HOUR_HEIGHT }}>
                  {h12} {ampm}
                </div>
              );
            })}
          </div>

          <div className="flex-1 relative">
            {renderCurrentTimeIndicator()}

            {Array.from({ length: TOTAL_HOURS }, (_, i) => (
              <div key={i} className="flex border-t border-slate-800/50" style={{ height: HOUR_HEIGHT }}>
                {weekDays.map((day, di) => {
                  const hour = START_HOUR + i;
                  const slotKey = `${formatDateStr(day)}-${hour}`;
                  const isHovered = hoveredSlot === slotKey;
                  return (
                    <div
                      key={di}
                      className={`flex-1 border-l border-slate-800/30 relative cursor-pointer transition-colors ${isHovered ? 'bg-orange-500/5' : 'hover:bg-orange-500/5'
                        }`}
                      onMouseEnter={() => setHoveredSlot(slotKey)}
                      onMouseLeave={() => setHoveredSlot(null)}
                      onClick={() => {
                        const timeStr = `${String(hour).padStart(2, '0')}:00`;
                        openNewEventModal(formatDateStr(day), timeStr);
                      }}
                    >
                      {isHovered && (
                        <div className="absolute left-1 top-1/2 -translate-y-1/2 z-10">
                          <Plus size={14} className="text-orange-400" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {weekDays.map((day, di) => {
              const dateStr = formatDateStr(day);
              const dayEvents = getEventsForDateStr(dateStr).filter(e => !e.all_day && e.start_time);
              const isToday = dateStr === todayStr;
              return (
                <div key={`events-${di}`} className="absolute top-0 bottom-0" style={{ left: `${(di / 7) * 100}%`, width: `${(1 / 7) * 100}%` }}>
                  {dayEvents.map(event => {
                    const top = getEventTop(event.start_time);
                    const height = getEventHeight(event.start_time, event.end_time);
                    const colour = event.colour || getEventTypeConfig(event.event_type).hex;
                    const isHidden = top < 0 || top + height < 0;
                    if (isHidden) return null;
                    return (
                      <button
                        key={event.id}
                        onClick={() => openEditModal(event)}
                        className="absolute left-0.5 right-0.5 rounded-md px-1.5 py-0.5 text-left overflow-hidden z-10 hover:opacity-90 transition-opacity"
                        style={{
                          top: Math.max(0, top),
                          height: Math.max(20, height),
                          backgroundColor: `${colour}22`,
                          borderLeft: `3px solid ${colour}`,
                        }}
                      >
                        <div className="text-[11px] font-semibold truncate" style={{ color: colour }}>
                          {event.title}
                        </div>
                        {height > 30 && (
                          <div className="text-[9px] text-slate-500 truncate">
                            {formatTime(event.start_time)} - {formatTime(event.end_time)}
                          </div>
                        )}
                      </button>
                    );
                  })}
                  {isToday && renderCurrentTimeIndicator()}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderDailyView = () => {
    const dateStr = formatDateStr(currentDate);
    const todayStr = formatDateStr(now);
    const isToday = dateStr === todayStr;
    const dayEvents = getEventsForDateStr(dateStr).filter(e => !e.all_day && e.start_time);
    const allDayEvents = getEventsForDateStr(dateStr).filter(e => e.all_day);

    return (
      <div className="flex flex-col">
        {allDayEvents.length > 0 && (
          <div className="flex border-b border-slate-700/50 pb-2 mb-2">
            <div className="w-16 flex-shrink-0 text-[10px] text-slate-600 pr-2 text-right pt-1">All day</div>
            <div className="flex-1 flex flex-wrap gap-1">
              {allDayEvents.map(event => {
                const colour = event.colour || getEventTypeConfig(event.event_type).hex;
                return (
                  <button
                    key={event.id}
                    onClick={() => openEditModal(event)}
                    className="px-2 py-1 rounded text-xs font-medium hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: `${colour}22`, color: colour, borderLeft: `3px solid ${colour}` }}
                  >
                    {event.title}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex overflow-y-auto" style={{ maxHeight: 'calc(100vh - 320px)' }}>
          <div className="w-16 flex-shrink-0">
            {Array.from({ length: TOTAL_HOURS }, (_, i) => {
              const hour = START_HOUR + i;
              const ampm = hour >= 12 ? 'PM' : 'AM';
              const h12 = hour % 12 || 12;
              return (
                <div key={hour} className="text-[10px] text-slate-600 pr-2 text-right -mt-2" style={{ height: HOUR_HEIGHT }}>
                  {h12} {ampm}
                </div>
              );
            })}
          </div>

          <div className="flex-1 relative">
            {isToday && (
              <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{
                top: (now.getHours() - START_HOUR) * HOUR_HEIGHT + (now.getMinutes() / 60) * HOUR_HEIGHT
              }}>
                <div className="flex items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-500 -ml-1" />
                  <div className="flex-1 h-[2px] bg-orange-500" />
                </div>
              </div>
            )}

            {Array.from({ length: TOTAL_HOURS }, (_, i) => {
              const hour = START_HOUR + i;
              const slotKey = `${dateStr}-${hour}`;
              const isHovered = hoveredSlot === slotKey;
              return (
                <div
                  key={i}
                  className={`flex border-t border-slate-800/50 relative cursor-pointer transition-colors ${isHovered ? 'bg-orange-500/5' : 'hover:bg-orange-500/5'
                    }`}
                  style={{ height: HOUR_HEIGHT }}
                  onMouseEnter={() => setHoveredSlot(slotKey)}
                  onMouseLeave={() => setHoveredSlot(null)}
                  onClick={() => openNewEventModal(dateStr, `${String(hour).padStart(2, '0')}:00`)}
                >
                  {isHovered && (
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
                      <Plus size={14} className="text-orange-400" />
                    </div>
                  )}
                </div>
              );
            })}

            {dayEvents.map(event => {
              const top = getEventTop(event.start_time);
              const height = getEventHeight(event.start_time, event.end_time);
              const colour = event.colour || getEventTypeConfig(event.event_type).hex;
              if (top + height < 0) return null;
              return (
                <button
                  key={event.id}
                  onClick={() => openEditModal(event)}
                  className="absolute left-2 right-2 rounded-lg px-3 py-2 text-left overflow-hidden z-10 hover:opacity-90 transition-opacity"
                  style={{
                    top: Math.max(0, top),
                    height: Math.max(24, height),
                    backgroundColor: `${colour}22`,
                    borderLeft: `4px solid ${colour}`,
                  }}
                >
                  <div className="text-sm font-semibold truncate" style={{ color: colour }}>
                    {event.title}
                  </div>
                  {height > 35 && (
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {formatTime(event.start_time)} - {formatTime(event.end_time)}
                    </div>
                  )}
                  {height > 60 && event.location && (
                    <div className="text-[10px] text-slate-500 mt-0.5 truncate">{event.location}</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-6">
      <div className="w-full">
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
                  <h2 className="text-lg font-medium text-white min-w-[240px] text-center">
                    {getHeaderLabel()}
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
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${viewMode === mode
                        ? 'bg-orange-500 text-white'
                        : 'text-slate-400 hover:bg-slate-700/50'
                        }`}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {viewMode === 'monthly' && (
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

                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const dayEvents = getEventsForDay(day);
                    const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
                    const isExpanded = expandedDay === day;

                    return (
                      <div
                        key={day}
                        className={`group bg-[#1a2235] min-h-[100px] p-1 relative cursor-pointer transition-colors hover:bg-orange-500/5 ${isToday ? 'ring-1 ring-orange-500 ring-inset' : ''
                          }`}
                        onClick={() => openNewEventModal(dateStr)}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`p-1 rounded text-sm ${isToday ? 'text-orange-400 font-medium' : 'text-slate-300'
                            }`}>
                            {day}
                          </span>
                          <button
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-orange-400 hover:bg-orange-500/20 rounded"
                            onClick={(e) => {
                              e.stopPropagation();
                              openNewEventModal(dateStr);
                            }}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
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
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedDay(expandedDay === day ? null : day);
                              }}
                              className="w-full text-left px-1.5 py-0.5 text-xs text-slate-500 hover:text-slate-400"
                            >
                              +{dayEvents.length - 2} more
                            </button>
                          )}
                          {isExpanded && dayEvents.length > 2 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedDay(null);
                              }}
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
              )}

              {viewMode === 'weekly' && renderWeeklyView()}
              {viewMode === 'daily' && renderDailyView()}
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
                    const eventDate = new Date(event.start_date);
                    const isToday = eventDate.toDateString() === now.toDateString();

                    return (
                      <button
                        key={event.id}
                        onClick={() => openEditModal(event)}
                        className="w-full text-left p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: event.colour || getEventTypeConfig(event.event_type).hex }} />
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
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: `${type.hex}33`, border: `2px solid ${type.hex}` }} />
                    <span className="text-slate-300 text-sm">{type.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {(showModal || statusOpen) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => { setShowModal(false); setStatusOpen(false); }}
            onWheel={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              onWheel={(e) => e.stopPropagation()}
              className="bg-[#151B28] border border-slate-800/50 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-800/50 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-black uppercase tracking-tight text-white">
                    {editingEvent ? 'Edit Event' : 'New Event'}
                  </h2>
                  {formEventType && (
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-md ${getEventTypeConfig(formEventType).bgColor} ${getEventTypeConfig(formEventType).color}`}>
                      {getEventTypeConfig(formEventType).label}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-5 flex-1 overflow-y-auto" style={{ scrollbarGutter: 'stable', touchAction: 'pan-y', maxHeight: 'calc(90vh - 130px)', overscrollBehavior: 'contain' }} onWheel={(e) => {
                e.stopPropagation();
                const container = e.currentTarget;
                const { scrollTop, scrollHeight, clientHeight } = container;
                const deltaY = e.deltaY;

                if ((scrollTop === 0 && deltaY < 0) || (scrollTop + clientHeight === scrollHeight && deltaY > 0)) {
                  e.preventDefault();
                }
              }}>
                {formError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                    placeholder="Event title"
                    className="w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none rounded-lg py-3 px-4 text-sm text-white placeholder:text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                    Event Type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {EVENT_TYPES.map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setFormEventType(type.value)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${formEventType === type.value
                            ? `${type.bgColor} ${type.color} border border-current`
                            : 'bg-[#0B0F19] text-slate-500 border border-slate-800 hover:text-slate-300'
                            }`}
                        >
                          <Icon size={14} />
                          {type.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <DatePicker
                      value={formStartDate}
                      onChange={setFormStartDate}
                      placeholder="Select date"
                    />
                  </div>
                  {!formAllDay && (
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                        Start Time
                      </label>
                      <TimePicker
                        value={formStartTime}
                        onChange={(val) => {
                          setFormStartTime(val);
                          if (formStartDate === formEndDate && formEndTime && val && formEndTime <= val) {
                            setFormEndTime('');
                          }
                        }}
                        placeholder="Select time"
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
                    className="w-4 h-4 rounded border-slate-600 bg-[#0B0F19] text-orange-500 focus:ring-orange-500/50"
                  />
                  <label htmlFor="allDay" className="text-sm text-slate-300">All day event</label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                      End Date
                    </label>
                    <DatePicker
                      value={formEndDate}
                      onChange={setFormEndDate}
                      placeholder="Select date"
                    />
                  </div>
                  {!formAllDay && (
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                        End Time
                      </label>
                      <TimePicker
                        value={formEndTime}
                        onChange={setFormEndTime}
                        placeholder="Select time"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="Event location"
                    className="w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none rounded-lg py-3 px-4 text-sm text-white placeholder:text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                    Link to Client
                  </label>
                  <div ref={clientRef} className="relative">
                    {selectedClient ? (
                      <div className="flex items-center justify-between bg-[#0B0F19] border border-slate-800 rounded-lg p-3">
                        <div>
                          <p className="text-sm font-bold text-white">{selectedClient.company_name}</p>
                          <p className="text-[10px] text-slate-500">{selectedClient.contact_person} {selectedClient.email && `• ${selectedClient.email}`}</p>
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
                            className="w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-600"
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
                                <p className="text-slate-500 text-[10px]">{client.contact_person} {client.email && `• ${client.email}`}</p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                    Status
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setStatusOpen(!statusOpen)}
                      className={`w-full flex items-center justify-between px-4 py-3 border rounded-lg transition-all font-bold text-sm bg-[#151B28] ${
                        statusOpen ? 'border-orange-500' : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-white">
                        {EVENT_STATUSES.find(s => s.value === formStatus)?.label || 'Select...'}
                      </span>
                      <ChevronDown
                        size={14}
                        className={`text-slate-500 transition-transform ${statusOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {statusOpen && (
                      <div 
                        className="absolute top-full left-0 w-full mt-2 bg-[#151B28] border border-slate-800 rounded-xl shadow-2xl z-[100] p-1"
                        onWheel={(e) => e.stopPropagation()}
                      >
                        {EVENT_STATUSES.map((status) => (
                          <button
                            key={status.value}
                            type="button"
                            onClick={() => {
                              setFormStatus(status.value);
                              setStatusOpen(false);
                            }}
                            className={`w-full px-4 py-2.5 text-left hover:bg-slate-800 transition-colors font-bold text-sm ${
                              formStatus === status.value
                                ? 'text-orange-500 bg-[#0B0F19]'
                                : 'text-slate-300'
                            }`}
                          >
                            {status.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                    Colour
                  </label>
                  <div className="flex gap-2">
                    {COLOURS.map((colour) => (
                      <button
                        key={colour}
                        type="button"
                        onClick={() => setFormColour(colour)}
                        className={`w-8 h-8 rounded-full transition-transform ${formColour === colour ? 'ring-2 ring-white ring-offset-2 ring-offset-[#151B28] scale-110' : ''
                          }`}
                        style={{ backgroundColor: colour }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={3}
                    placeholder="Event description"
                    className="w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none rounded-lg py-3 px-4 text-sm text-white placeholder:text-slate-600 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                    Internal Notes
                  </label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    rows={2}
                    placeholder="Private notes"
                    className="w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none rounded-lg py-3 px-4 text-sm text-white placeholder:text-slate-600 resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-6 border-t border-slate-800/50 flex-shrink-0 bg-[#151B28]">
                <div>
                  {editingEvent && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-5 py-2.5 bg-red-500/10 text-red-400 font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-red-500/20 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 bg-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={formLoading || !formTitle.trim()}
                    className="px-5 py-2.5 bg-orange-500 text-white font-black text-xs uppercase tracking-wider rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {formLoading ? 'Saving...' : (editingEvent ? 'Save Changes' : 'Create Event')}
                  </button>
                </div>
              </div>
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
