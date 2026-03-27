'use client';

import { useEffect, useState } from 'react';
import { X, Upload, MailX, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BannerData {
  imported:    number;
  missingEmail:number;
  totalBalance:number;
  balanceCount:number;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 2 })
    .format(amount)
    .replace('ZAR', 'R');

export default function ImportBanner() {
  const [data, setData] = useState<BannerData | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('importBanner');
    if (raw) {
      try {
        setData(JSON.parse(raw));
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  const dismiss = () => {
    sessionStorage.removeItem('importBanner');
    setData(null);
  };

  return (
    <AnimatePresence>
      {data && (
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0,   scale: 1     }}
          exit={{    opacity: 0, y: -8,   scale: 0.98  }}
          transition={{ duration: 0.25 }}
          className="bg-[#151B28] border border-orange-500/30 rounded-xl p-5 flex flex-col md:flex-row md:items-center gap-4 shadow-xl shadow-orange-500/5"
        >
          {/* Icon */}
          <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-500 shrink-0">
            <Upload size={20} />
          </div>

          {/* Text */}
          <div className="flex-1 space-y-1.5">
            <p className="text-white font-black text-sm uppercase tracking-tight">
              {data.imported} client{data.imported !== 1 ? 's' : ''} imported from Sage
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              {data.balanceCount > 0 && (
                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-400">
                  <Wallet size={11} />
                  {data.balanceCount} record{data.balanceCount !== 1 ? 's' : ''} with outstanding balances totalling{' '}
                  <span className={data.totalBalance < 0 ? 'text-red-400' : 'text-amber-400'}>
                    {formatCurrency(data.totalBalance)}
                  </span>
                </span>
              )}
              {data.missingEmail > 0 && (
                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-500">
                  <MailX size={11} />
                  {data.missingEmail} record{data.missingEmail !== 1 ? 's' : ''} missing email address
                </span>
              )}
            </div>
          </div>

          {/* Dismiss */}
          <button
            onClick={dismiss}
            className="self-start md:self-center p-1.5 text-slate-500 hover:text-white transition-colors rounded"
            title="Dismiss"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
