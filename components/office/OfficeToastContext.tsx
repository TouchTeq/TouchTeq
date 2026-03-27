'use client';

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { useOfficeTheme } from '@/components/office/OfficeThemeContext';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

type Toast = {
  id: string;
  title: string;
  message?: string;
  variant: ToastVariant;
};

type ToastInput = {
  title: string;
  message?: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type OfficeToastContextValue = {
  pushToast: (toast: ToastInput) => void;
  success: (toast: Omit<ToastInput, 'variant'>) => void;
  error: (toast: Omit<ToastInput, 'variant'>) => void;
  info: (toast: Omit<ToastInput, 'variant'>) => void;
  warning: (toast: Omit<ToastInput, 'variant'>) => void;
};

const OfficeToastContext = createContext<OfficeToastContextValue | undefined>(undefined);

function variantClasses(variant: ToastVariant, isLight: boolean) {
  switch (variant) {
    case 'success':
      return isLight
        ? 'border-green-500/20 bg-green-500/10 text-green-900'
        : 'border-green-500/20 bg-green-500/10 text-green-200';
    case 'error':
      return isLight
        ? 'border-red-500/20 bg-red-500/10 text-red-900'
        : 'border-red-500/20 bg-red-500/10 text-red-200';
    case 'warning':
      return isLight
        ? 'border-orange-500/20 bg-orange-500/10 text-orange-900'
        : 'border-orange-500/20 bg-orange-500/10 text-orange-200';
    default:
      return isLight
        ? 'border-slate-400/30 bg-white/90 text-slate-900'
        : 'border-slate-500/20 bg-slate-500/10 text-slate-200';
  }
}

export function OfficeToastProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useOfficeTheme();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, number>>({});

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current[id];
    if (timer) window.clearTimeout(timer);
    delete timers.current[id];
  }, []);

  const pushToast = useCallback(
    ({ title, message, variant = 'info', durationMs = 4000 }: ToastInput) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const toast: Toast = { id, title, message, variant };

      setToasts((prev) => [toast, ...prev].slice(0, 4));

      timers.current[id] = window.setTimeout(() => {
        removeToast(id);
      }, durationMs);
    },
    [removeToast]
  );

  const value = useMemo<OfficeToastContextValue>(
    () => ({
      pushToast,
      success: (t) => pushToast({ ...t, variant: 'success' }),
      error: (t) => pushToast({ ...t, variant: 'error' }),
      info: (t) => pushToast({ ...t, variant: 'info' }),
      warning: (t) => pushToast({ ...t, variant: 'warning' }),
    }),
    [pushToast]
  );

  return (
    <OfficeToastContext.Provider value={value}>
      {children}

      <div className="fixed top-20 right-6 z-[300] w-[360px] max-w-[calc(100vw-3rem)] space-y-3 pointer-events-none">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className={`pointer-events-auto border rounded-xl shadow-2xl backdrop-blur-md ${variantClasses(t.variant, theme === 'light')}`}
            >
              <div className="p-4 flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className={`text-[10px] font-black uppercase tracking-[0.25em] ${theme === 'light' ? 'text-slate-900' : 'text-white/90'}`}>
                    {t.title}
                  </p>
                  {t.message && (
                    <p className={`mt-1 text-xs font-medium leading-relaxed ${theme === 'light' ? 'text-slate-700' : 'text-white/80'}`}>
                      {t.message}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(t.id)}
                  className={`p-1 rounded-lg transition-colors ${theme === 'light' ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/80' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                  aria-label="Close notification"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </OfficeToastContext.Provider>
  );
}

export function useOfficeToast() {
  const ctx = useContext(OfficeToastContext);
  if (!ctx) throw new Error('useOfficeToast must be used within OfficeToastProvider');
  return ctx;
}
