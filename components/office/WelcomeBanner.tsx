'use client';

import { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';

export default function WelcomeBanner({ profile }: { profile: any }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if onboarding is needed: phone is null or banking_details is empty/null
    const needsOnboarding = !profile?.phone || !profile?.banking_details?.account_number;
    const dismissed = localStorage.getItem('onboarding_dismissed');
    
    if (needsOnboarding && !dismissed) {
      setIsVisible(true);
    }
  }, [profile]);

  const dismiss = () => {
    setIsVisible(false);
    localStorage.setItem('onboarding_dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="bg-gradient-to-r from-orange-600 to-orange-400 p-1 rounded-2xl mb-10 shadow-2xl shadow-orange-500/20">
            <div className="bg-[#0B0F19] rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative">
               <div className="flex items-center gap-6 text-center md:text-left">
                  <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg animate-bounce duration-[2000ms]">
                     <Sparkles size={28} />
                  </div>
                  <div>
                     <h2 className="text-xl font-black text-white uppercase tracking-tight">Welcome to Touch Teq Office</h2>
                     <p className="text-slate-400 text-sm font-medium mt-1">
                        To get started, complete your <Link href="/office/settings?tab=profile" className="text-white font-bold hover:text-orange-400">Business Profile</Link> and add your <Link href="/office/settings?tab=banking" className="text-white font-bold hover:text-orange-400">Banking Details</Link> in Settings so your quotes and invoices are ready to send.
                     </p>
                  </div>
               </div>

               <div className="flex items-center gap-4">
                  <Link 
                    href="/office/settings"
                    className="flex items-center gap-3 bg-white text-black px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all shadow-xl shadow-white/5 whitespace-nowrap"
                  >
                     Go to Settings <ArrowRight size={14} />
                  </Link>
                  <button 
                    onClick={dismiss}
                    className="p-3 text-slate-500 hover:text-white transition-colors"
                  >
                     <X size={20} />
                  </button>
               </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
