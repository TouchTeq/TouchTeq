'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Edit2, FileText } from 'lucide-react';
import { GenerateStatementModal } from '@/components/office/GenerateStatementModal';

interface HeaderActionsProps {
  id: string;
  companyName: string;
  clientEmail?: string;
}

export function ClientDetailPageHeader({ id, companyName, clientEmail }: HeaderActionsProps) {
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <Link 
            href="/office/clients"
            className="flex items-center gap-2 text-slate-500 hover:text-orange-500 font-bold uppercase tracking-widest text-[10px] transition-colors"
          >
            <ArrowLeft size={14} /> Back to Clients
          </Link>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">{companyName}</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsStatementModalOpen(true)}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 transition-all font-black text-xs uppercase tracking-widest text-white px-6 py-3 rounded-sm shadow-lg shadow-orange-900/20"
          >
            <FileText size={16} />
            Generate Statement
          </button>
          
          <Link 
            href={`/office/clients/${id}/edit`}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 transition-all font-black text-xs uppercase tracking-widest text-white px-6 py-3 rounded-sm border border-slate-700"
          >
            <Edit2 size={16} />
            Edit Profile
          </Link>
        </div>
      </div>

      <GenerateStatementModal 
        clientId={id} 
        clientName={companyName}
        clientEmail={clientEmail}
        isOpen={isStatementModalOpen} 
        onClose={() => setIsStatementModalOpen(false)} 
      />
    </>
  );
}
