'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus } from 'lucide-react';

type Faq = { q: string; a: string };

export default function IndustriesFaqAccordion({ faqs }: { faqs: Faq[] }) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.05 }}
          className="border border-slate-100 rounded-2xl overflow-hidden"
        >
          <button
            onClick={() => setOpenFaq(openFaq === index ? null : index)}
            className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors"
          >
            <span className={`font-black text-sm md:text-base uppercase tracking-normal transition-colors ${openFaq === index ? 'text-orange-500' : 'text-[#1A2B4C] hover:text-orange-500'}`}>
              {faq.q}
            </span>
            {openFaq === index ? <Minus className="text-orange-500 shrink-0" /> : <Plus className="text-orange-500 shrink-0" />}
          </button>
          <AnimatePresence>
            {openFaq === index && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-6 pt-0 text-slate-500 text-sm md:text-base leading-relaxed font-medium border-t border-slate-50">
                  {faq.a}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}
