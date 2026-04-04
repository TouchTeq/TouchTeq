'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Search,
  Pin,
  PinOff,
  Trash2,
  Edit2,
  X,
  Phone,
  Users,
  MapPin,
  FileText,
  StickyNote,
  Calendar,
  AlertCircle,
  Tag,
  User,
  ChevronDown,
  ArrowLeft,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  getNotes,
  updateNote,
  deleteNote,
  createNote,
  type Note,
} from '@/lib/notes/actions';

const NOTE_TYPES = [
  { value: 'all', label: 'All', icon: FileText },
  { value: 'general', label: 'General', icon: FileText },
  { value: 'call', label: 'Call Notes', icon: Phone },
  { value: 'meeting', label: 'Meetings', icon: Users },
  { value: 'site_visit', label: 'Site Visits', icon: MapPin },
  { value: 'quick', label: 'Quick Notes', icon: StickyNote },
] as const;

const NOTE_TYPE_CONFIG: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  general: { label: 'General', icon: FileText, color: 'text-slate-400', bgColor: 'bg-slate-500/20' },
  call: { label: 'Call', icon: Phone, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  meeting: { label: 'Meeting', icon: Users, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  site_visit: { label: 'Site Visit', icon: MapPin, color: 'text-green-400', bgColor: 'bg-green-500/20' },
  quick: { label: 'Quick', icon: StickyNote, color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
};

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  
  // Filters
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [defaultType, setDefaultType] = useState('general');
  
  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formNoteType, setFormNoteType] = useState('general');
  const [formContactName, setFormContactName] = useState('');
  const [formContactPhone, setFormContactPhone] = useState('');
  const [formContactEmail, setFormContactEmail] = useState('');
  const [formCallDirection, setFormCallDirection] = useState('');
  const [formMeetingAttendees, setFormMeetingAttendees] = useState<string[]>([]);
  const [formAttendeeInput, setFormAttendeeInput] = useState('');
  const [formSiteName, setFormSiteName] = useState('');
  const [formFollowUpRequired, setFormFollowUpRequired] = useState(false);
  const [formFollowUpDate, setFormFollowUpDate] = useState('');
  const [formFollowUpNotes, setFormFollowUpNotes] = useState('');
  const [formClientId, setFormClientId] = useState('');
  const [formTags, setFormTags] = useState<string[]>([]);
  const [formTagInput, setFormTagInput] = useState('');
  const [formIsPinned, setFormIsPinned] = useState(false);
  
  // Expanded note
  const [expandedNote, setExpandedNote] = useState<Note | null>(null);
  
  // Client search
  const [clientSearch, setClientSearch] = useState('');
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const clientRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  // Load notes
  const loadNotes = useCallback(async () => {
    setLoading(true);
    const filters: any = {};
    if (typeFilter !== 'all') filters.noteType = typeFilter;
    if (searchQuery) filters.search = searchQuery;

    const notesData = await getNotes(filters);
    setNotes(notesData);
    setLoading(false);
  }, [typeFilter, searchQuery]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

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

  // Open create modal
  const openCreateModal = (type: string = 'general') => {
    setEditingNote(null);
    setDefaultType(type);
    setFormTitle('');
    setFormContent('');
    setFormNoteType(type);
    setFormContactName('');
    setFormContactPhone('');
    setFormContactEmail('');
    setFormCallDirection('');
    setFormMeetingAttendees([]);
    setFormAttendeeInput('');
    setFormSiteName('');
    setFormFollowUpRequired(false);
    setFormFollowUpDate('');
    setFormFollowUpNotes('');
    setFormClientId('');
    setFormTags([]);
    setFormTagInput('');
    setFormIsPinned(false);
    setClientSearch('');
    setShowModal(true);
  };

  // Open edit modal
  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setFormTitle(note.title || '');
    setFormContent(note.content);
    setFormNoteType(note.note_type);
    setFormContactName(note.contact_name || '');
    setFormContactPhone(note.contact_phone || '');
    setFormContactEmail(note.contact_email || '');
    setFormCallDirection(note.call_direction || '');
    setFormMeetingAttendees(note.meeting_attendees || []);
    setFormAttendeeInput('');
    setFormSiteName(note.site_name || '');
    setFormFollowUpRequired(note.follow_up_required);
    setFormFollowUpDate(note.follow_up_date || '');
    setFormFollowUpNotes(note.follow_up_notes || '');
    setFormClientId(note.client_id || '');
    setFormTags(note.tags || []);
    setFormTagInput('');
    setFormIsPinned(note.is_pinned);
    setClientSearch('');
    setShowModal(true);
  };

  // Save note
  const handleSave = async () => {
    if (!formContent.trim()) return;

    if (editingNote) {
      const result = await updateNote(editingNote.id, {
        title: formTitle || undefined,
        content: formContent,
        note_type: formNoteType,
        follow_up_required: formFollowUpRequired,
        follow_up_date: formFollowUpDate || undefined,
        follow_up_notes: formFollowUpNotes || undefined,
        tags: formTags,
        is_pinned: formIsPinned,
      });
      if (result.success) {
        setShowModal(false);
        loadNotes();
      }
    } else {
      const result = await createNote({
        title: formTitle || undefined,
        content: formContent,
        note_type: formNoteType,
        contact_name: formContactName || undefined,
        contact_phone: formContactPhone || undefined,
        contact_email: formContactEmail || undefined,
        call_direction: formCallDirection || undefined,
        meeting_attendees: formMeetingAttendees.length > 0 ? formMeetingAttendees : undefined,
        site_name: formSiteName || undefined,
        follow_up_required: formFollowUpRequired,
        follow_up_date: formFollowUpDate || undefined,
        follow_up_notes: formFollowUpNotes || undefined,
        client_id: formClientId || undefined,
        tags: formTags,
        is_pinned: formIsPinned,
      });
      if (result.success) {
        setShowModal(false);
        loadNotes();
      }
    }
  };

  // Toggle pin
  const handleTogglePin = async (noteId: string, currentPinned: boolean) => {
    const result = await updateNote(noteId, { is_pinned: !currentPinned });
    if (result.success) {
      loadNotes();
    }
  };

  // Toggle follow-up completed
  const handleToggleFollowUp = async (noteId: string, currentCompleted: boolean) => {
    const result = await updateNote(noteId, { follow_up_completed: !currentCompleted });
    if (result.success) {
      loadNotes();
    }
  };

  // Delete note
  const handleDelete = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    const result = await deleteNote(noteId);
    if (result.success) {
      loadNotes();
      if (expandedNote?.id === noteId) setExpandedNote(null);
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

  // Attendee management
  const addAttendee = () => {
    const attendee = formAttendeeInput.trim();
    if (attendee && !formMeetingAttendees.includes(attendee)) {
      setFormMeetingAttendees([...formMeetingAttendees, attendee]);
      setFormAttendeeInput('');
    }
  };

  const removeAttendee = (attendee: string) => {
    setFormMeetingAttendees(formMeetingAttendees.filter(a => a !== attendee));
  };

  // Filtered clients
  const filteredClients = clients.filter(c =>
    (c.company_name || '').toLowerCase().includes(clientSearch.toLowerCase()) ||
    (c.contact_person || '').toLowerCase().includes(clientSearch.toLowerCase())
  );

  const selectedClient = clients.find(c => c.id === formClientId);

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  };

  // Pinned notes
  const pinnedNotes = notes.filter(n => n.is_pinned);
  const unpinnedNotes = notes.filter(n => !n.is_pinned);

  // Get content preview
  const getContentPreview = (content: string, lines: number = 2) => {
    const lines_arr = content.split('\n').filter(l => l.trim());
    return lines_arr.slice(0, lines).join('\n');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => openCreateModal('general')}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus size={16} />
            New Note
          </button>
          <button
            onClick={() => openCreateModal('call')}
            className="flex items-center gap-2 bg-[#151B28] border border-slate-800 hover:border-blue-500/50 text-slate-300 hover:text-blue-400 font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg transition-colors"
          >
            <Phone size={14} />
            Call Note
          </button>
          <button
            onClick={() => openCreateModal('meeting')}
            className="flex items-center gap-2 bg-[#151B28] border border-slate-800 hover:border-purple-500/50 text-slate-300 hover:text-purple-400 font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg transition-colors"
          >
            <Users size={14} />
            Meeting Note
          </button>
          <button
            onClick={() => openCreateModal('site_visit')}
            className="flex items-center gap-2 bg-[#151B28] border border-slate-800 hover:border-green-500/50 text-slate-300 hover:text-green-400 font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg transition-colors"
          >
            <MapPin size={14} />
            Site Visit
          </button>
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
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-600"
            />
          </div>

          {/* Type Filter Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {NOTE_TYPES.map(type => {
              const Icon = type.icon;
              const isActive = typeFilter === type.value;
              return (
                <button
                  key={type.value}
                  onClick={() => setTypeFilter(type.value)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon size={12} />
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pinned Notes */}
      {pinnedNotes.length > 0 && (
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 mb-3 flex items-center gap-2">
            <Pin size={12} />
            Pinned Notes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pinnedNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={openEditModal}
                onDelete={handleDelete}
                onTogglePin={handleTogglePin}
                onToggleFollowUp={handleToggleFollowUp}
                onExpand={setExpandedNote}
                formatDate={formatDate}
                formatTime={formatTime}
                getContentPreview={getContentPreview}
                isPinned={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Notes List */}
      <div>
        {pinnedNotes.length > 0 && (
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">
            All Notes
          </h3>
        )}
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 text-sm mt-4">Loading notes...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="bg-[#151B28] border border-slate-800/50 rounded-xl p-12 text-center">
            <FileText size={48} className="mx-auto text-slate-700 mb-4" />
            <p className="text-slate-400 font-bold text-lg">No notes found</p>
            <p className="text-slate-600 text-sm mt-1">Create a new note to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {unpinnedNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={openEditModal}
                onDelete={handleDelete}
                onTogglePin={handleTogglePin}
                onToggleFollowUp={handleToggleFollowUp}
                onExpand={setExpandedNote}
                formatDate={formatDate}
                formatTime={formatTime}
                getContentPreview={getContentPreview}
                isPinned={false}
              />
            ))}
          </div>
        )}
      </div>

      {/* Expanded Note View */}
      <AnimatePresence>
        {expandedNote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setExpandedNote(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#151B28] border border-slate-800/50 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-800/50 sticky top-0 bg-[#151B28] z-10">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setExpandedNote(null)}
                    className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const config = NOTE_TYPE_CONFIG[expandedNote.note_type] || NOTE_TYPE_CONFIG.general;
                      const Icon = config.icon;
                      return <Icon size={18} className={config.color} />;
                    })()}
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                      {NOTE_TYPE_CONFIG[expandedNote.note_type]?.label || 'Note'}
                    </span>
                    {expandedNote.is_pinned && <Pin size={14} className="text-amber-400" />}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { openEditModal(expandedNote); setExpandedNote(null); }}
                    className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => { handleDelete(expandedNote.id); }}
                    className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Title */}
                {expandedNote.title && (
                  <h2 className="text-xl font-black text-white">{expandedNote.title}</h2>
                )}

                {/* Meta info */}
                <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} />
                    <span>{formatDate(expandedNote.created_at)} at {formatTime(expandedNote.created_at)}</span>
                  </div>
                  {expandedNote.client && (
                    <div className="flex items-center gap-1.5">
                      <User size={14} />
                      <span>{expandedNote.client.company_name}</span>
                    </div>
                  )}
                </div>

                {/* Type-specific fields */}
                {expandedNote.note_type === 'call' && (
                  <div className="bg-[#0B0F19] border border-slate-800/50 rounded-lg p-4 space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Call Details</h4>
                    {expandedNote.contact_name && (
                      <p className="text-sm text-white"><span className="text-slate-500">Contact:</span> {expandedNote.contact_name}</p>
                    )}
                    {expandedNote.contact_phone && (
                      <p className="text-sm text-white"><span className="text-slate-500">Phone:</span> {expandedNote.contact_phone}</p>
                    )}
                    {expandedNote.contact_email && (
                      <p className="text-sm text-white"><span className="text-slate-500">Email:</span> {expandedNote.contact_email}</p>
                    )}
                    {expandedNote.call_direction && (
                      <div className="flex items-center gap-2">
                        {expandedNote.call_direction === 'inbound' ? (
                          <ArrowDownLeft size={14} className="text-green-400" />
                        ) : (
                          <ArrowUpRight size={14} className="text-blue-400" />
                        )}
                        <span className="text-sm text-white capitalize">{expandedNote.call_direction}</span>
                      </div>
                    )}
                  </div>
                )}

                {expandedNote.note_type === 'meeting' && expandedNote.meeting_attendees && expandedNote.meeting_attendees.length > 0 && (
                  <div className="bg-[#0B0F19] border border-slate-800/50 rounded-lg p-4 space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">Attendees</h4>
                    <div className="flex flex-wrap gap-2">
                      {expandedNote.meeting_attendees.map((attendee, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 bg-purple-500/10 text-purple-300 text-xs px-3 py-1.5 rounded-md">
                          <Users size={12} />
                          {attendee}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {expandedNote.note_type === 'site_visit' && expandedNote.site_name && (
                  <div className="bg-[#0B0F19] border border-slate-800/50 rounded-lg p-4 space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-green-400">Site Details</h4>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-green-400" />
                      <span className="text-sm text-white">{expandedNote.site_name}</span>
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="prose prose-invert max-w-none">
                  <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {expandedNote.content}
                  </div>
                </div>

                {/* Follow-up */}
                {expandedNote.follow_up_required && (
                  <div className={`border rounded-lg p-4 space-y-3 ${
                    expandedNote.follow_up_completed
                      ? 'border-green-500/20 bg-green-500/5'
                      : 'border-amber-500/20 bg-amber-500/5'
                  }`}>
                    <div className="flex items-center justify-between">
                      <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                        expandedNote.follow_up_completed ? 'text-green-400' : 'text-amber-400'
                      }`}>
                        Follow-up {expandedNote.follow_up_completed ? '(Completed)' : '(Pending)'}
                      </h4>
                      <button
                        onClick={() => {
                          handleToggleFollowUp(expandedNote.id, expandedNote.follow_up_completed);
                          setExpandedNote({ ...expandedNote, follow_up_completed: !expandedNote.follow_up_completed });
                        }}
                        className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-md transition-colors ${
                          expandedNote.follow_up_completed
                            ? 'text-green-400 hover:text-green-300 hover:bg-green-500/10'
                            : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
                        }`}
                      >
                        {expandedNote.follow_up_completed ? 'Reopen' : 'Mark Complete'}
                      </button>
                    </div>
                    {expandedNote.follow_up_date && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar size={14} />
                        <span className={expandedNote.follow_up_completed ? 'text-slate-500' : 'text-amber-300'}>
                          Due: {formatDate(expandedNote.follow_up_date)}
                        </span>
                      </div>
                    )}
                    {expandedNote.follow_up_notes && (
                      <p className="text-sm text-slate-400">{expandedNote.follow_up_notes}</p>
                    )}
                  </div>
                )}

                {/* Tags */}
                {expandedNote.tags && expandedNote.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {expandedNote.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 bg-slate-800 text-slate-400 text-xs px-2.5 py-1 rounded-md">
                        <Tag size={12} />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
            onWheel={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#151B28] border border-slate-800/50 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-800/50 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-black uppercase tracking-tight text-white">
                    {editingNote ? 'Edit Note' : 'New Note'}
                  </h2>
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-md ${NOTE_TYPE_CONFIG[formNoteType]?.bgColor} ${NOTE_TYPE_CONFIG[formNoteType]?.color}`}>
                    {NOTE_TYPE_CONFIG[formNoteType]?.label || 'Note'}
                  </span>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5 flex-1 overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
                {/* Note Type Selector */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                    Note Type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(NOTE_TYPE_CONFIG).map(([key, config]) => {
                      const Icon = config.icon;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setFormNoteType(key)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                            formNoteType === key
                              ? `${config.bgColor} ${config.color} border border-current`
                              : 'bg-[#0B0F19] text-slate-500 border border-slate-800 hover:text-slate-300'
                          }`}
                        >
                          <Icon size={14} />
                          {config.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                    Title (optional)
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Give this note a title..."
                    className="w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none rounded-lg py-3 px-4 text-sm text-white placeholder:text-slate-600"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="Write your note here..."
                    rows={6}
                    className="w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none rounded-lg py-3 px-4 text-sm text-white placeholder:text-slate-600 resize-none"
                    autoFocus
                  />
                </div>

                {/* Call Note Fields */}
                {formNoteType === 'call' && (
                  <div className="space-y-4 bg-[#0B0F19] border border-slate-800/50 rounded-lg p-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Call Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                          Contact Name
                        </label>
                        <input
                          type="text"
                          value={formContactName}
                          onChange={(e) => setFormContactName(e.target.value)}
                          placeholder="Who did you speak to?"
                          className="w-full bg-[#151B28] border border-slate-800 focus:border-blue-500 outline-none rounded-lg py-2.5 px-3 text-sm text-white placeholder:text-slate-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                          Call Direction
                        </label>
                        <div className="relative">
                          <select
                            value={formCallDirection}
                            onChange={(e) => setFormCallDirection(e.target.value)}
                            className="w-full appearance-none bg-[#151B28] border border-slate-800 focus:border-blue-500 outline-none rounded-lg py-2.5 px-3 text-sm text-white cursor-pointer"
                          >
                            <option value="">Select direction...</option>
                            <option value="inbound">Inbound</option>
                            <option value="outbound">Outbound</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                          Phone
                        </label>
                        <input
                          type="text"
                          value={formContactPhone}
                          onChange={(e) => setFormContactPhone(e.target.value)}
                          placeholder="Phone number"
                          className="w-full bg-[#151B28] border border-slate-800 focus:border-blue-500 outline-none rounded-lg py-2.5 px-3 text-sm text-white placeholder:text-slate-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={formContactEmail}
                          onChange={(e) => setFormContactEmail(e.target.value)}
                          placeholder="Email address"
                          className="w-full bg-[#151B28] border border-slate-800 focus:border-blue-500 outline-none rounded-lg py-2.5 px-3 text-sm text-white placeholder:text-slate-600"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Meeting Note Fields */}
                {formNoteType === 'meeting' && (
                  <div className="space-y-4 bg-[#0B0F19] border border-slate-800/50 rounded-lg p-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">Meeting Details</h4>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                        Attendees
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {formMeetingAttendees.map(attendee => (
                          <span key={attendee} className="inline-flex items-center gap-1 bg-purple-500/20 text-purple-300 text-xs px-2.5 py-1 rounded-md">
                            <Users size={12} />
                            {attendee}
                            <button type="button" onClick={() => removeAttendee(attendee)} className="text-purple-500 hover:text-purple-300 ml-1">
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formAttendeeInput}
                          onChange={(e) => setFormAttendeeInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAttendee(); } }}
                          placeholder="Add attendee..."
                          className="flex-1 bg-[#151B28] border border-slate-800 focus:border-purple-500 outline-none rounded-lg py-2.5 px-3 text-sm text-white placeholder:text-slate-600"
                        />
                        <button
                          type="button"
                          onClick={addAttendee}
                          className="px-3 py-2.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Site Visit Fields */}
                {formNoteType === 'site_visit' && (
                  <div className="space-y-4 bg-[#0B0F19] border border-slate-800/50 rounded-lg p-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-green-400">Site Details</h4>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                        Site Name
                      </label>
                      <input
                        type="text"
                        value={formSiteName}
                        onChange={(e) => setFormSiteName(e.target.value)}
                        placeholder="Where did you visit?"
                        className="w-full bg-[#151B28] border border-slate-800 focus:border-green-500 outline-none rounded-lg py-2.5 px-3 text-sm text-white placeholder:text-slate-600"
                      />
                    </div>
                  </div>
                )}

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

                {/* Pin & Follow-up */}
                <div className="flex flex-col gap-4">
                  {/* Pin toggle */}
                  <button
                    type="button"
                    onClick={() => setFormIsPinned(!formIsPinned)}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      formIsPinned
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-[#0B0F19] border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {formIsPinned ? <Pin size={16} /> : <PinOff size={16} />}
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {formIsPinned ? 'Pinned' : 'Pin this note'}
                    </span>
                  </button>

                  {/* Follow-up toggle */}
                  <button
                    type="button"
                    onClick={() => setFormFollowUpRequired(!formFollowUpRequired)}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      formFollowUpRequired
                        ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                        : 'bg-[#0B0F19] border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <AlertCircle size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {formFollowUpRequired ? 'Follow-up Required' : 'Add Follow-up'}
                    </span>
                  </button>

                  {/* Follow-up fields */}
                  {formFollowUpRequired && (
                    <div className="space-y-3 bg-[#0B0F19] border border-slate-800/50 rounded-lg p-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                          Follow-up Date
                        </label>
                        <input
                          type="date"
                          value={formFollowUpDate}
                          onChange={(e) => setFormFollowUpDate(e.target.value)}
                          className="w-full bg-[#151B28] border border-slate-800 focus:border-orange-500 outline-none rounded-lg py-2.5 px-3 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                          Follow-up Notes
                        </label>
                        <textarea
                          value={formFollowUpNotes}
                          onChange={(e) => setFormFollowUpNotes(e.target.value)}
                          placeholder="What needs to be followed up?"
                          rows={2}
                          className="w-full bg-[#151B28] border border-slate-800 focus:border-orange-500 outline-none rounded-lg py-2.5 px-3 text-sm text-white placeholder:text-slate-600 resize-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-800/50 flex-shrink-0 bg-[#151B28]">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 bg-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formContent.trim()}
                  className="px-5 py-2.5 bg-orange-500 text-white font-black text-xs uppercase tracking-wider rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingNote ? 'Save Changes' : 'Create Note'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Note Card Component
function NoteCard({
  note,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleFollowUp,
  onExpand,
  formatDate,
  formatTime,
  getContentPreview,
  isPinned,
}: {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
  onTogglePin: (noteId: string, currentPinned: boolean) => void;
  onToggleFollowUp: (noteId: string, currentCompleted: boolean) => void;
  onExpand: (note: Note) => void;
  formatDate: (date: string) => string;
  formatTime: (date: string) => string;
  getContentPreview: (content: string, lines?: number) => string;
  isPinned: boolean;
}) {
  const config = NOTE_TYPE_CONFIG[note.note_type] || NOTE_TYPE_CONFIG.general;
  const Icon = config.icon;
  const hasPendingFollowUp = note.follow_up_required && !note.follow_up_completed;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group bg-[#151B28] border rounded-xl overflow-hidden transition-all hover:border-slate-700/50 ${
        isPinned ? 'border-amber-500/30' : 'border-slate-800/50'
      }`}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between p-4 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`p-1.5 rounded-md ${config.bgColor}`}>
            <Icon size={14} className={config.color} />
          </div>
          <div className="min-w-0">
            <button
              onClick={() => onExpand(note)}
              className="text-left font-bold text-sm text-white truncate hover:text-orange-500 transition-colors"
            >
              {note.title || getContentPreview(note.content, 1).slice(0, 50)}
            </button>
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <span>{formatDate(note.created_at)} at {formatTime(note.created_at)}</span>
              {note.client && (
                <>
                  <span>•</span>
                  <span className="truncate max-w-[100px]">{note.client.company_name}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onTogglePin(note.id, note.is_pinned)}
            className={`p-1.5 rounded-lg transition-colors ${
              note.is_pinned
                ? 'text-amber-400 hover:bg-amber-500/10'
                : 'text-slate-600 hover:text-amber-400 hover:bg-slate-800'
            }`}
            title={note.is_pinned ? 'Unpin' : 'Pin'}
          >
            {note.is_pinned ? <Pin size={14} /> : <PinOff size={14} />}
          </button>
          <button
            onClick={() => onEdit(note)}
            className="p-1.5 rounded-lg text-slate-600 hover:text-white hover:bg-slate-800 transition-colors"
            title="Edit"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => onDelete(note.id)}
            className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Content Preview */}
      <button
        onClick={() => onExpand(note)}
        className="w-full text-left px-4 pb-3"
      >
        <p className="text-xs text-slate-400 line-clamp-3 whitespace-pre-wrap">
          {getContentPreview(note.content, 3)}
        </p>
      </button>

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {note.tags.slice(0, 3).map(tag => (
            <span key={tag} className="inline-flex items-center gap-1 bg-slate-800/50 text-slate-500 text-[10px] px-2 py-0.5 rounded">
              <Tag size={10} />
              {tag}
            </span>
          ))}
          {note.tags.length > 3 && (
            <span className="text-[10px] text-slate-600">+{note.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Follow-up indicator */}
      {hasPendingFollowUp && (
        <div className="px-4 pb-3">
          <button
            onClick={() => onToggleFollowUp(note.id, note.follow_up_completed)}
            className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 w-full hover:bg-amber-500/20 transition-colors"
          >
            <AlertCircle size={14} className="text-amber-400 flex-shrink-0" />
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              Follow-up due: {note.follow_up_date ? formatDate(note.follow_up_date) : 'No date set'}
            </span>
          </button>
        </div>
      )}
    </motion.div>
  );
}
