'use client';

import { useState } from 'react';
import { ChevronDown, Plus, ToggleLeft, ToggleRight, Trash2, Users } from 'lucide-react';

export const CONTACT_TYPES = ['Technical', 'Finance', 'General'] as const;
export type ContactType = (typeof CONTACT_TYPES)[number];

export type ClientContactDraft = {
  id?: string;
  localId: string;
  contact_type: ContactType;
  full_name: string;
  job_title: string;
  email: string;
  cell_number: string;
  landline_number: string;
  extension: string;
  notes: string;
  is_primary: boolean;
};

function makeLocalId(prefix: string) {
  try {
    return `${prefix}_${crypto.randomUUID()}`;
  } catch {
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
}

export function createDefaultContacts(): ClientContactDraft[] {
  return [
    {
      localId: makeLocalId('contact'),
      contact_type: 'Technical',
      full_name: '',
      job_title: '',
      email: '',
      cell_number: '',
      landline_number: '',
      extension: '',
      notes: '',
      is_primary: true,
    },
    {
      localId: makeLocalId('contact'),
      contact_type: 'Finance',
      full_name: '',
      job_title: '',
      email: '',
      cell_number: '',
      landline_number: '',
      extension: '',
      notes: '',
      is_primary: false,
    },
  ];
}

function normalizePrimary(next: ClientContactDraft[]) {
  const firstPrimary = next.findIndex((c) => c.is_primary);
  if (firstPrimary === -1) return next;
  return next.map((c, idx) => ({ ...c, is_primary: idx === firstPrimary }));
}

export default function ClientContactsEditor({
  value,
  onChange,
}: {
  value: ClientContactDraft[];
  onChange: (next: ClientContactDraft[]) => void;
}) {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const addContact = () => {
    const next: ClientContactDraft[] = [
      ...value,
      {
        localId: makeLocalId('contact'),
        contact_type: 'General',
        full_name: '',
        job_title: '',
        email: '',
        cell_number: '',
        landline_number: '',
        extension: '',
        notes: '',
        is_primary: value.every((c) => !c.is_primary),
      },
    ];
    onChange(normalizePrimary(next));
  };

  const removeContact = (localId: string) => {
    const next = value.filter((c) => c.localId !== localId);
    onChange(next);
  };

  const update = (localId: string, patch: Partial<ClientContactDraft>) => {
    const next = value.map((c) => (c.localId === localId ? { ...c, ...patch } : c));
    onChange(normalizePrimary(next));
  };

  const setPrimary = (localId: string, nextPrimary: boolean) => {
    if (!nextPrimary) {
      onChange(value.map((c) => (c.localId === localId ? { ...c, is_primary: false } : c)));
      return;
    }
    onChange(value.map((c) => ({ ...c, is_primary: c.localId === localId })));
  };

  return (
    <div className="bg-[#151B28] border border-slate-800/50 rounded-xl shadow-2xl p-8">
      {openDropdownId && (
        <div className="fixed inset-0 z-[99]" onClick={() => setOpenDropdownId(null)} onWheel={(e) => e.stopPropagation()} />
      )}
      <div className="flex items-center justify-between gap-4 mb-8 border-b border-slate-800/50 pb-4">
        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white">Contacts</h2>
        <button
          type="button"
          onClick={addContact}
          className="flex items-center gap-2 text-orange-500 hover:text-white font-black uppercase tracking-widest text-[10px] transition-colors"
        >
          <Plus size={14} /> Add Contact
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {value.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-slate-600 font-black uppercase tracking-widest text-[10px] mb-6">
              No contacts added yet
            </p>
            <button
              type="button"
              onClick={addContact}
              className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-500 hover:bg-orange-500/20 px-6 py-3 rounded-sm font-black uppercase tracking-widest text-[10px] transition-colors"
            >
              <Plus size={14} /> Add Contact
            </button>
          </div>
        )}
        {value.map((c, idx) => (
          <div key={c.localId} className="bg-[#0B0F19]/60 border border-slate-800 rounded-xl p-6 relative">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 rounded bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase tracking-widest">
                  {c.contact_type}
                </span>
                {c.is_primary && (
                  <span className="px-2 py-1 rounded bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest">
                    Primary
                  </span>
                )}
                <span className="text-slate-600 text-[10px] font-black uppercase tracking-widest">
                  Contact {idx + 1}
                </span>
              </div>

              <button
                type="button"
                onClick={() => removeContact(c.localId)}
                className="flex items-center gap-2 text-red-500 hover:text-white hover:bg-red-500/10 px-3 py-2 rounded-lg transition-all text-[10px] font-black uppercase tracking-widest"
                title="Remove Contact"
              >
                <Trash2 size={14} />
                Remove
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                  Contact Type *
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenDropdownId(openDropdownId === c.localId ? null : c.localId)}
                    className={`w-full flex items-center justify-between px-4 py-3 border rounded-lg transition-all font-bold text-sm bg-[#151B28] ${
                      openDropdownId === c.localId ? 'border-orange-500' : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-slate-500" />
                      <span className="text-white">{c.contact_type}</span>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`text-slate-500 transition-transform ${openDropdownId === c.localId ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {openDropdownId === c.localId && (
                    <div 
                      className="absolute top-full left-0 w-full mt-2 bg-[#151B28] border border-slate-800 rounded-xl shadow-2xl z-[100] p-1"
                      onWheel={(e) => e.stopPropagation()}
                    >
                      {CONTACT_TYPES.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            update(c.localId, { contact_type: t });
                            setOpenDropdownId(null);
                          }}
                          className={`w-full px-4 py-2.5 text-left hover:bg-slate-800 transition-colors font-bold text-sm ${
                            c.contact_type === t
                              ? 'text-orange-500 bg-[#0B0F19]'
                              : 'text-slate-300'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                  Full Name *
                </label>
                <input
                  value={c.full_name}
                  onChange={(e) => update(c.localId, { full_name: e.target.value })}
                  className="w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none p-4 text-white transition-all font-medium rounded-sm"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                  Job Title
                </label>
                <input
                  value={c.job_title}
                  onChange={(e) => update(c.localId, { job_title: e.target.value })}
                  className="w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none p-4 text-white transition-all font-medium rounded-sm"
                  placeholder="Engineering Manager"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={c.email}
                  onChange={(e) => update(c.localId, { email: e.target.value })}
                  className="w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none p-4 text-white transition-all font-medium rounded-sm"
                  placeholder="john@client.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                  Cell Number
                </label>
                <input
                  value={c.cell_number}
                  onChange={(e) => update(c.localId, { cell_number: e.target.value })}
                  className="w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none p-4 text-white transition-all font-medium rounded-sm"
                  placeholder="+27 82 123 4567"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                    Landline Number
                  </label>
                  <input
                    value={c.landline_number}
                    onChange={(e) => update(c.localId, { landline_number: e.target.value })}
                    className="w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none p-4 text-white transition-all font-medium rounded-sm"
                    placeholder="011 123 4567"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                    Ext.
                  </label>
                  <input
                    value={c.extension}
                    onChange={(e) => update(c.localId, { extension: e.target.value })}
                    disabled={!c.landline_number}
                    className="w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none p-4 text-white transition-all font-medium rounded-sm disabled:opacity-50"
                    placeholder="123"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6 items-start">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={c.notes}
                  onChange={(e) => update(c.localId, { notes: e.target.value })}
                  className="w-full bg-[#0B0F19] border border-slate-800 focus:border-orange-500 outline-none p-4 text-white transition-all font-medium rounded-sm resize-none"
                  placeholder="Preferred contact hours, escalation notes…"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                  Primary Contact
                </label>
                <button
                  type="button"
                  onClick={() => setPrimary(c.localId, !c.is_primary)}
                  className="w-full bg-[#0B0F19] border border-slate-800 hover:border-orange-500/40 rounded-sm px-4 py-4 flex items-center justify-between transition-all"
                >
                  <span className="text-white font-black uppercase tracking-widest text-[10px]">
                    {c.is_primary ? 'Primary' : 'Not Primary'}
                  </span>
                  {c.is_primary ? (
                    <ToggleRight size={22} className="text-orange-500" />
                  ) : (
                    <ToggleLeft size={22} className="text-slate-600" />
                  )}
                </button>
                <p className="text-[10px] text-slate-500 font-medium">
                  Only one contact can be primary at a time.
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
