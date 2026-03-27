'use client';

import { useState } from 'react';
import { Plus, Upload } from 'lucide-react';
import Link from 'next/link';
import ClientImportModal from '@/components/office/ClientImportModal';

export default function ClientActions() {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleImportComplete = (summary: {
    imported: number;
    skippedDuplicates: number;
    skippedInvalid: number;
    missingEmail: number;
    totalBalance: number;
    clientsWithBalance: Array<{ name: string; balance: number }>;
  }) => {
    // Store the banner data in sessionStorage so the client list page can display it
    sessionStorage.setItem(
      'importBanner',
      JSON.stringify({
        imported: summary.imported,
        missingEmail: summary.missingEmail,
        totalBalance: summary.totalBalance,
        balanceCount: summary.clientsWithBalance.length,
      })
    );
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <button
          onClick={() => setIsImportModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#151B28] hover:bg-slate-800 border border-slate-800 transition-all font-black text-xs uppercase tracking-widest text-slate-300 hover:text-white px-6 py-3 rounded-sm shadow-xl w-full md:w-fit"
        >
          <Upload size={16} />
          Import Clients
        </button>
        <Link
          href="/office/clients/new"
          className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 transition-all font-black text-xs uppercase tracking-widest text-white px-6 py-3 rounded-sm shadow-xl shadow-orange-500/20 w-full md:w-fit"
        >
          <Plus size={16} />
          New Client
        </Link>
      </div>

      <ClientImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={handleImportComplete}
      />
    </>
  );
}
