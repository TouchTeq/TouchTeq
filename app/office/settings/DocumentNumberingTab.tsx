'use client';

import { useState, useEffect, useMemo } from 'react';
import { FileText, Hash, Calendar, Save, AlertCircle, Loader2 } from 'lucide-react';
import { updateBusinessProfile, getDocumentCounts } from '@/lib/settings/actions';
import { motion } from 'motion/react';

interface DocumentNumberingTabProps {
  profile: any;
  setProfile: (profile: any) => void;
}

interface DocumentCount {
  invoices: number;
  quotes: number;
  credit_notes: number;
  purchase_orders: number;
  certificates: number;
}

export default function DocumentNumberingTab({ profile, setProfile }: DocumentNumberingTabProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [counts, setCounts] = useState<DocumentCount | null>(null);
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const documentFields = useMemo(() => [
    {
      key: 'invoice',
      label: 'Invoices',
      prefixKey: 'invoice_prefix',
      startingNumberKey: 'invoice_starting_number',
      includeYearKey: 'invoice_include_year',
      defaultPrefix: 'INV',
      defaultStartingNumber: 1,
      defaultIncludeYear: false,
    },
    {
      key: 'quote',
      label: 'Quotes',
      prefixKey: 'quote_prefix',
      startingNumberKey: 'quote_starting_number',
      includeYearKey: 'quote_include_year',
      defaultPrefix: 'QT',
      defaultStartingNumber: 1,
      defaultIncludeYear: false,
    },
    {
      key: 'credit_note',
      label: 'Credit Notes',
      prefixKey: 'credit_note_prefix',
      startingNumberKey: 'credit_note_starting_number',
      includeYearKey: 'credit_note_include_year',
      defaultPrefix: 'CN',
      defaultStartingNumber: 1,
      defaultIncludeYear: true,
    },
    {
      key: 'purchase_order',
      label: 'Purchase Orders',
      prefixKey: 'po_prefix',
      startingNumberKey: 'po_starting_number',
      includeYearKey: 'po_include_year',
      defaultPrefix: 'PO',
      defaultStartingNumber: 1,
      defaultIncludeYear: true,
    },
    {
      key: 'cert',
      label: 'Certificates',
      prefixKey: 'cert_prefix',
      startingNumberKey: 'cert_starting_number',
      includeYearKey: 'cert_include_year',
      defaultPrefix: 'CERT',
      defaultStartingNumber: 1,
      defaultIncludeYear: true,
    },
  ], []);

  useEffect(() => {
    async function loadCounts() {
      try {
        const data = await getDocumentCounts();
        setCounts(data);
      } catch (error) {
        console.error('Failed to load document counts:', error);
      } finally {
        setLoadingCounts(false);
      }
    }
    loadCounts();
  }, []);

  const getFieldValue = (key: string, defaultValue: any) => {
    return profile?.document_settings?.[key] ?? profile?.[key] ?? defaultValue;
  };

  const handleUpdate = async () => {
    setLoading(true);
    setError(null);
    const res = await updateBusinessProfile(profile);
    if (res.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(res.error || 'Failed to save changes');
    }
    setLoading(false);
  };

  const handleFieldChange = (key: string, value: any) => {
    setProfile({
      ...profile,
      document_settings: {
        ...(profile.document_settings || {}),
        [key]: value
      }
    });
  };

  const generatePreview = (doc: typeof documentFields[0]): string => {
    const prefix = getFieldValue(doc.prefixKey, doc.defaultPrefix);
    const startingNumberRaw = getFieldValue(doc.startingNumberKey, doc.defaultStartingNumber);
    const startingNumber = typeof startingNumberRaw === 'number' ? startingNumberRaw : doc.defaultStartingNumber;
    const includeYear = getFieldValue(doc.includeYearKey, doc.defaultIncludeYear);
    
    const year = new Date().getFullYear();
    
    if (includeYear) {
      return `${prefix}-${year}-${String(startingNumber).padStart(4, '0')}`;
    }
    return `${prefix}-${String(startingNumber).padStart(4, '0')}`;
  };

  const getExistingCount = (doc: typeof documentFields[0]): number => {
    if (!counts) return 0;
    switch (doc.key) {
      case 'invoice': return counts.invoices;
      case 'quote': return counts.quotes;
      case 'credit_note': return counts.credit_notes;
      case 'purchase_order': return counts.purchase_orders;
      case 'cert': return counts.certificates;
      default: return 0;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
          <FileText className="text-orange-500" size={28} />
          Document Numbering
        </h2>
        <p className="text-slate-400 text-sm mt-2">
          Configure how document numbers are generated for your invoices, quotes, and other documents.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      {/* Document Settings */}
      <div className="space-y-6">
        {documentFields.map((doc) => {
          const existingCount = getExistingCount(doc);
          const hasExisting = existingCount > 0;

          return (
            <motion.div
              key={doc.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0B0F19] border border-slate-800 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-black uppercase text-sm tracking-wide">{doc.label}</h3>
                {hasExisting && (
                  <div className="flex items-center gap-2 text-amber-500 text-xs">
                    <AlertCircle size={14} />
                    <span className="font-medium">
                      Numbering is continuing — starting number setting only applies to new installations
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                {/* Prefix */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">
                    Prefix
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                    <input
                      type="text"
                      value={getFieldValue(doc.prefixKey, doc.defaultPrefix)}
                      onChange={(e) => handleFieldChange(doc.prefixKey, e.target.value.toUpperCase())}
                      className="w-full bg-[#151B28] border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm font-medium outline-none focus:border-orange-500 transition-colors"
                      placeholder={doc.defaultPrefix}
                    />
                  </div>
                </div>

                {/* Starting Number */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">
                    Starting Number
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={7}
                    value={getFieldValue(doc.startingNumberKey, doc.defaultStartingNumber) ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        handleFieldChange(doc.startingNumberKey, '');
                      } else {
                        const digits = val.replace(/\D/g, '').slice(0, 7);
                        const num = parseInt(digits, 10);
                        if (!isNaN(num) && num <= 9999999) {
                          handleFieldChange(doc.startingNumberKey, num);
                        }
                      }
                    }}
                    onBlur={(e) => {
                      const val = e.target.value;
                      if (val === '' || isNaN(parseInt(val, 10))) {
                        handleFieldChange(doc.startingNumberKey, doc.defaultStartingNumber);
                      }
                    }}
                    className="w-full bg-[#151B28] border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm font-medium outline-none focus:border-orange-500 transition-colors"
                    placeholder={String(doc.defaultStartingNumber)}
                  />
                </div>

                {/* Include Year Toggle */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">
                    Include Year
                  </label>
                  <button
                    type="button"
                    onClick={() => handleFieldChange(doc.includeYearKey, !getFieldValue(doc.includeYearKey, doc.defaultIncludeYear))}
                    className={`w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                      getFieldValue(doc.includeYearKey, doc.defaultIncludeYear)
                        ? 'bg-orange-500 text-white'
                        : 'bg-[#151B28] border border-slate-800 text-slate-400'
                    }`}
                  >
                    <Calendar size={14} />
                    {getFieldValue(doc.includeYearKey, doc.defaultIncludeYear) ? 'Yes' : 'No'}
                  </button>
                </div>

                {/* Preview */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">
                    Preview
                  </label>
                  <div className="w-full bg-[#151B28] border border-slate-800 rounded-lg px-4 py-2.5 text-orange-500 text-sm font-black text-center">
                    {loadingCounts ? (
                      <Loader2 size={14} className="animate-spin mx-auto" />
                    ) : (
                      generatePreview(doc)
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleUpdate}
          disabled={loading}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm uppercase tracking-wider px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : success ? (
            <>
              <Save size={16} />
              Saved!
            </>
          ) : (
            <>
              <Save size={16} />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}
