'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  MapPin, 
  Users, 
  Plus, 
  Search, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  FileText,
  AlertCircle,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Filter
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { 
  getClientCommunications, 
  logCommunication, 
  updateManualNote, 
  deleteManualNote 
} from '@/lib/clients/commsActions';
import { useOfficeToast } from '@/components/office/OfficeToastContext';

interface ClientCommunicationsLogProps {
  clientId: string;
}

export function ClientCommunicationsLog({ clientId }: ClientCommunicationsLogProps) {
  const toast = useOfficeToast();
  const [communications, setCommunications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [noteForm, setNoteForm] = useState({
    note_type: 'Phone Call',
    content: ''
  });

  const fetchComms = async () => {
    setLoading(true);
    try {
      const data = await getClientCommunications(clientId);
      setCommunications(data);
    } catch (error) {
      console.error('Failed to fetch communications:', error);
      toast.error({ title: 'Communication Error', message: 'Failed to load communication history' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComms();
  }, [clientId]);

  const handleSaveNote = async () => {
    if (!noteForm.content.trim()) {
      toast.warning({ title: 'Note Required', message: 'Please enter note content' });
      return;
    }

    try {
      if (editingNote) {
        await updateManualNote(editingNote.id, noteForm.content, noteForm.note_type);
        toast.success({ title: 'Note Updated', message: 'Note updated successfully' });
      } else {
        await logCommunication({
          client_id: clientId,
          type: 'General',
          content: noteForm.content,
          note_type: noteForm.note_type,
          is_manual: true,
          status: 'Recorded',
          subject: `Manual Note: ${noteForm.note_type}`
        });
        toast.success({ title: 'Interaction Logged', message: 'Note recorded successfully' });
      }
      setIsNoteModalOpen(false);
      setEditingNote(null);
      setNoteForm({ note_type: 'Phone Call', content: '' });
      fetchComms();
    } catch (error) {
      toast.error({ title: 'Storage Error', message: 'Failed to save note' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      await deleteManualNote(id);
      toast.success({ title: 'Note Removed', message: 'The manual note has been deleted' });
      fetchComms();
    } catch (error) {
      toast.error({ title: 'Deletion Failed', message: 'Failed to delete note' });
    }
  };

  const filteredComms = communications.filter(comm => {
    const matchesSearch = 
      (comm.subject?.toLowerCase().includes(searchQuery.toLowerCase()) || 
       comm.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       comm.type?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (filterType === 'All') return matchesSearch;
    if (filterType === 'Emails') return matchesSearch && !comm.is_manual;
    if (filterType === 'Manual') return matchesSearch && comm.is_manual;
    return matchesSearch;
  });

  const getIcon = (comm: any) => {
    if (comm.is_manual) {
      switch (comm.note_type) {
        case 'Phone Call': return <Phone className="w-4 h-4 text-emerald-400" />;
        case 'Site Visit': return <MapPin className="w-4 h-4 text-amber-400" />;
        case 'Meeting': return <Users className="w-4 h-4 text-purple-400" />;
        default: return <Edit2 className="w-4 h-4 text-slate-400" />;
      }
    }
    return <Mail className="w-4 h-4 text-sky-400" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0F172A] border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#0F172A] border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none"
          >
            <option>All</option>
            <option>Emails</option>
            <option>Manual</option>
          </select>
        </div>
        <button
          onClick={() => {
            setEditingNote(null);
            setNoteForm({ note_type: 'Phone Call', content: '' });
            setIsNoteModalOpen(true);
          }}
          className="bg-sky-600 hover:bg-sky-500 transition-colors text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Manual Interaction
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
          <p className="text-slate-400 text-sm">Loading history...</p>
        </div>
      ) : filteredComms.length === 0 ? (
        <div className="bg-[#0F172A]/50 border border-slate-800 rounded-xl p-12 text-center">
          <MessageSquare className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <h3 className="text-slate-200 font-medium mb-1">No communication history</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            Interactions like emails, phone calls, and site visits will appear here once recorded.
          </p>
        </div>
      ) : (
        <div className="relative border-l-2 border-slate-800 ml-4 pl-8 space-y-8 py-4">
          {filteredComms.map((comm) => (
            <div key={comm.id} className="relative group">
              {/* Timeline Dot */}
              <div className="absolute -left-[41px] top-1 bg-[#151B28] p-1.5 rounded-full border-2 border-slate-800 group-hover:border-sky-500/50 transition-colors">
                {getIcon(comm)}
              </div>

              <div className="bg-[#151B28] border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors">
                <div className="p-4 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-slate-100 uppercase tracking-tight">
                        {comm.is_manual ? comm.note_type : comm.type}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        {format(parseISO(comm.timestamp), 'MMM dd, yyyy • HH:mm')}
                      </span>
                    </div>
                    <h4 className="text-slate-300 font-medium">{comm.subject || 'No Subject'}</h4>
                    {!comm.is_manual && comm.sent_from && (
                       <p className="text-xs text-slate-500">From: {comm.sent_from}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {comm.status === 'Delivered' && (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400/80 bg-emerald-400/10 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3" /> Delivered
                      </span>
                    )}
                    {comm.status === 'Failed' && (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-400/80 bg-rose-400/10 px-2 py-0.5 rounded">
                        <XCircle className="w-3 h-3" /> Failed
                      </span>
                    )}
                    
                    {comm.is_manual && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <button 
                          onClick={() => {
                            setEditingNote(comm);
                            setNoteForm({ note_type: comm.note_type, content: comm.content || '' });
                            setIsNoteModalOpen(true);
                          }}
                          className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-sky-400 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(comm.id)}
                          className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => setExpandedId(expandedId === comm.id ? null : comm.id)}
                      className="p-1.5 hover:bg-slate-800 rounded text-slate-400 transition-colors"
                    >
                      {expandedId === comm.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {expandedId === comm.id && (
                  <div className="px-4 pb-4 border-t border-slate-800/50 bg-[#0F172A]/30">
                    <div className="mt-4 text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">
                      {comm.content || 'No content recorded.'}
                    </div>
                    {comm.metadata && Object.keys(comm.metadata).length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-800/30 grid grid-cols-2 gap-4">
                        {Object.entries(comm.metadata).map(([key, value]: [string, any]) => (
                          <div key={key}>
                            <p className="text-[10px] uppercase tracking-wider text-slate-600 font-bold mb-0.5">{key.replace(/_/g, ' ')}</p>
                            <p className="text-xs text-slate-300">{String(value)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manual Note Modal */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#151B28] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-100">
                {editingNote ? 'Edit Interaction' : 'Record Interaction'}
              </h2>
              <button onClick={() => setIsNoteModalOpen(false)} className="text-slate-500 hover:text-slate-300">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Interaction Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Phone Call', 'Site Visit', 'Meeting', 'WhatsApp', 'Other'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setNoteForm({ ...noteForm, note_type: type })}
                      className={`py-2 px-3 rounded-lg text-xs font-medium transition-all border ${
                        noteForm.note_type === type 
                          ? 'bg-sky-500/10 border-sky-500/50 text-sky-400' 
                          : 'bg-[#0F172A] border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Internal Notes / Minutes</label>
                <textarea
                  value={noteForm.content}
                  onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                  rows={6}
                  placeholder="Summarize the interaction, topics discussed, or requirements..."
                  className="w-full bg-[#0F172A] border border-slate-800 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all resize-none"
                />
              </div>
            </div>

            <div className="p-6 bg-[#0F172A]/50 border-t border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => setIsNoteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                className="px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-sky-900/20"
              >
                {editingNote ? 'Update Note' : 'Save Interaction'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
