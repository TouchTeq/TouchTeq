'use client';

import { useEffect, useState, useCallback } from 'react';
import { Brain, Trash2, Loader2, RefreshCcw, Edit2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createClient } from '@/lib/supabase/client';

type MemoryRecord = {
  id: string;
  category: string;
  key: string;
  value: string;
  confidence: number;
  last_updated: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  client_preference: 'Client Preference',
  pricing_pattern: 'Pricing Pattern',
  supplier_preference: 'Supplier Preference',
  communication_style: 'Communication Style',
  business_rule: 'Business Rule',
  reminder: 'Reminder',
};

const CATEGORY_COLORS: Record<string, string> = {
  client_preference: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  pricing_pattern: 'bg-green-500/10 text-green-300 border-green-500/20',
  supplier_preference: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
  communication_style: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
  business_rule: 'bg-orange-500/10 text-orange-300 border-orange-500/20',
  reminder: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
};

export default function AiMemoryTab() {
  const supabase = createClient();
  const [records, setRecords] = useState<MemoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('ai_memory')
      .select('id, category, key, value, confidence, last_updated')
      .order('category')
      .order('last_updated', { ascending: false });
    setRecords(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  const startEdit = (r: MemoryRecord) => {
    setEditingId(r.id);
    setEditValue(r.value);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveEdit = async (r: MemoryRecord) => {
    if (!editValue.trim()) return;
    setSavingId(r.id);
    await supabase
      .from('ai_memory')
      .update({ value: editValue.trim(), last_updated: new Date().toISOString() })
      .eq('id', r.id);
    setRecords(prev => prev.map(m => m.id === r.id ? { ...m, value: editValue.trim() } : m));
    setSavingId(null);
    setEditingId(null);
  };

  const deleteRecord = async (id: string) => {
    setDeletingId(id);
    await supabase.from('ai_memory').delete().eq('id', id);
    setRecords(prev => prev.filter(m => m.id !== id));
    setDeletingId(null);
  };

  const grouped = records.reduce<Record<string, MemoryRecord[]>>((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {});

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <section className="bg-[#0B0F19] rounded-2xl border border-slate-800/50 p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Brain size={18} className="text-orange-500" />
            <h3 className="text-white font-black uppercase tracking-[0.15em] text-sm">AI Memory</h3>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
          >
            <RefreshCcw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <p className="text-[11px] text-slate-500 font-medium mb-6 leading-relaxed">
          These are facts and preferences the AI has learned through your conversations. You can edit or delete any entry. Changes take effect immediately in the next session.
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-12 gap-3 text-slate-600">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm font-medium">Loading memory...</span>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Brain size={32} className="text-slate-700 mx-auto" />
            <p className="text-slate-500 text-sm font-medium">No memories stored yet.</p>
            <p className="text-slate-600 text-[11px] font-medium">
              Tell the AI to remember something — e.g. "Remember that my standard day rate is R2,500"
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${CATEGORY_COLORS[category] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                    {CATEGORY_LABELS[category] || category}
                  </span>
                  <span className="text-[10px] text-slate-600 font-bold">{items.length} entr{items.length === 1 ? 'y' : 'ies'}</span>
                </div>

                <div className="space-y-2">
                  <AnimatePresence>
                    {items.map((r) => (
                      <motion.div
                        key={r.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex items-start gap-3 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{r.key}</p>
                          {editingId === r.id ? (
                            <textarea
                              rows={2}
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              className="w-full bg-slate-800 border border-orange-500/50 rounded-lg px-3 py-2 text-sm text-white font-medium outline-none resize-none focus:border-orange-500"
                              autoFocus
                            />
                          ) : (
                            <p className="text-sm text-white font-medium leading-relaxed">{r.value}</p>
                          )}
                          <p className="text-[10px] text-slate-700 mt-1.5">
                            Updated {new Date(r.last_updated).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {editingId === r.id ? (
                            <>
                              <button
                                type="button"
                                onClick={() => saveEdit(r)}
                                disabled={savingId === r.id}
                                className="p-2 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 transition-all disabled:opacity-50"
                              >
                                {savingId === r.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-all"
                              >
                                <X size={12} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => startEdit(r)}
                                className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-slate-800 text-slate-500 hover:text-white transition-all"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteRecord(r.id)}
                                disabled={deletingId === r.id}
                                className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all disabled:opacity-50"
                              >
                                {deletingId === r.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                              </button>
                            </>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </motion.div>
  );
}
