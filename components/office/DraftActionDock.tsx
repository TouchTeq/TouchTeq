'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';

type Props = {
  backHref: string;
  backLabel: string;
  primaryLabel: string;
  onSave: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export default function DraftActionDock({
  backHref,
  backLabel,
  primaryLabel,
  onSave,
  disabled = false,
  loading = false,
}: Props) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isS = e.key.toLowerCase() === 's';
      if ((e.ctrlKey || e.metaKey) && isS) {
        e.preventDefault();
        if (!disabled && !loading) onSave();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onSave, disabled, loading]);

  return (
    <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-[#151B28]/90 backdrop-blur-md border-t border-slate-800/60">
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <Link
          href={backHref}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-black uppercase tracking-widest text-[10px]"
        >
          <ArrowLeft size={14} />
          {backLabel}
        </Link>

        <button
          type="button"
          onClick={onSave}
          disabled={disabled || loading}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 transition-all font-black text-[10px] uppercase tracking-widest text-white px-4 py-2.5 rounded-sm shadow-lg shadow-orange-500/20 disabled:opacity-50"
        >
          <Save size={14} />
          {loading ? 'Saving…' : primaryLabel}
          <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-white/70 hidden sm:inline">
            Ctrl S
          </span>
        </button>
      </div>
    </div>
  );
}

