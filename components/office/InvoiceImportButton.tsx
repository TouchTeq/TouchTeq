'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import InvoiceImportModal from '@/components/office/InvoiceImportModal';

export default function InvoiceImportButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 border border-slate-800/50 bg-[#151B28] hover:bg-slate-800/60 transition-all font-black text-xs uppercase tracking-widest text-slate-200 px-5 py-3 rounded-sm"
      >
        <Upload size={16} />
        Import Invoices
      </button>

      <InvoiceImportModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
}
