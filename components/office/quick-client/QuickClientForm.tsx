'use client';

import React from 'react';
import { Building2, User, Mail, MapPin, Hash, Save } from 'lucide-react';

export interface QuickClientData {
  company_name: string;
  contact_person: string;
  email: string;
  physical_address: string;
  vat_number: string;
  save_to_database: boolean;
}

export const EMPTY_QUICK_CLIENT: QuickClientData = {
  company_name: '',
  contact_person: '',
  email: '',
  physical_address: '',
  vat_number: '',
  save_to_database: false,
};

interface QuickClientFormProps {
  /** Controlled form data */
  value: QuickClientData;
  /** Callback when any field changes */
  onChange: (data: QuickClientData) => void;
  /** Label for the company/name field */
  nameLabel?: string;
  /** Placeholder for the company/name field */
  namePlaceholder?: string;
  /** Context type — adjusts labels and shown fields */
  type?: 'client' | 'supplier';
  /** Additional CSS class on the outer wrapper */
  className?: string;
}

export default function QuickClientForm({
  value,
  onChange,
  nameLabel = 'Client / Company Name',
  namePlaceholder = 'Enter client or company name',
  type = 'client',
  className = '',
}: QuickClientFormProps) {
  const handleChange = (field: keyof QuickClientData, raw: string | boolean) => {
    onChange({ ...value, [field]: raw });
  };

  const inputClass =
    'w-full bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm font-medium outline-none focus:border-orange-500 transition-colors';

  const labelClass =
    'text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 flex items-center gap-1.5';

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Company Name — required */}
      <div>
        <label className={labelClass}>
          <Building2 size={10} className="text-slate-600" />
          {nameLabel} <span className="text-orange-500">*</span>
        </label>
        <input
          type="text"
          value={value.company_name}
          onChange={(e) => handleChange('company_name', e.target.value)}
          placeholder={namePlaceholder}
          className={inputClass}
          autoFocus
        />
      </div>

      {/* Contact Person */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>
            <User size={10} className="text-slate-600" />
            Contact Person
          </label>
          <input
            type="text"
            value={value.contact_person}
            onChange={(e) => handleChange('contact_person', e.target.value)}
            placeholder="Optional"
            className={inputClass}
          />
        </div>

        {/* Email */}
        <div>
          <label className={labelClass}>
            <Mail size={10} className="text-slate-600" />
            Email Address
          </label>
          <input
            type="email"
            value={value.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="Optional"
            className={inputClass}
          />
        </div>
      </div>

      {/* Physical Address & VAT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>
            <MapPin size={10} className="text-slate-600" />
            Physical Address
          </label>
          <input
            type="text"
            value={value.physical_address}
            onChange={(e) => handleChange('physical_address', e.target.value)}
            placeholder="Optional"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            <Hash size={10} className="text-slate-600" />
            VAT Number
          </label>
          <input
            type="text"
            value={value.vat_number}
            onChange={(e) => handleChange('vat_number', e.target.value)}
            placeholder="Optional"
            className={inputClass}
          />
        </div>
      </div>

      {/* Save to database checkbox */}
      <div className="pt-3 border-t border-slate-800/50">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={value.save_to_database}
            onChange={(e) => handleChange('save_to_database', e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-[#0B0F19] text-orange-500 accent-orange-500 focus:ring-orange-500 focus:ring-offset-0"
          />
          <div>
            <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors flex items-center gap-1.5">
              <Save size={10} className="text-slate-500" />
              Save this {type === 'supplier' ? 'supplier' : 'client'} to my database
            </span>
            <span className="text-[10px] text-slate-600 block mt-0.5">
              {value.save_to_database
                ? `A new ${type === 'supplier' ? 'supplier' : 'client'} record will be created when you save this document.`
                : `Details will be used for this document only — no database record created.`}
            </span>
          </div>
        </label>
      </div>
    </div>
  );
}

/**
 * A small toggle-bar that switches between "Existing" and "Quick Add" modes.
 * Drop this above the client/supplier section to let users pick a mode.
 */
export function ClientModeToggle({
  mode,
  onModeChange,
  existingLabel = 'Existing Client',
  quickLabel = 'Quick Add Client',
}: {
  mode: 'existing' | 'quick';
  onModeChange: (mode: 'existing' | 'quick') => void;
  existingLabel?: string;
  quickLabel?: string;
}) {
  return (
    <div className="flex items-center gap-1 bg-[#0B0F19] rounded-lg p-1 border border-slate-800/50">
      <button
        type="button"
        onClick={() => onModeChange('existing')}
        className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${
          mode === 'existing'
            ? 'bg-slate-800 text-white shadow-sm'
            : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        {existingLabel}
      </button>
      <button
        type="button"
        onClick={() => onModeChange('quick')}
        className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${
          mode === 'quick'
            ? 'bg-orange-500/10 text-orange-500 shadow-sm border border-orange-500/30'
            : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        + {quickLabel}
      </button>
    </div>
  );
}
