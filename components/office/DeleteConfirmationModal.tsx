'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X, Check, Loader2 } from 'lucide-react';

const NATO_PHONETIC = [
  'ALPHA', 'BRAVO', 'CHARLIE', 'DELTA', 'ECHO', 'FOXTROT', 
  'GOLF', 'HOTEL', 'INDIA', 'JULIET', 'KILO', 'LIMA', 
  'MIKE', 'NOVEMBER', 'OSCAR', 'PAPA', 'QUEBEC', 'ROMEO', 
  'SIERRA', 'TANGO', 'UNIFORM', 'VICTOR', 'WHISKEY', 'XRAY', 'YANKEE', 'ZULU'
];

const ACTIONS = ['DELETE', 'CONFIRM', 'REMOVE', 'PURGE', 'ERASE'];

function generateConfirmationCode(): string {
  const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
  const nato = NATO_PHONETIC[Math.floor(Math.random() * NATO_PHONETIC.length)];
  const digit = Math.floor(Math.random() * 10);
  return `${action}-${nato}-${digit}`;
}

export interface DeletableItem {
  id: string;
  name: string;
  hasLinkedRecords?: boolean;
}

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  items: DeletableItem[];
  itemType: 'client' | 'invoice' | 'quotation' | 'expense' | 'travel' | 'fuel' | 'purchase_order' | 'credit_note';
  isLoading?: boolean;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  items,
  itemType,
  isLoading = false
}: DeleteConfirmationModalProps) {
  const [step, setStep] = useState<'impact' | 'confirm'>('impact');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [userInput, setUserInput] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const itemsWithLinkedRecords = items.filter(item => item.hasLinkedRecords);
  const displayItems = items.slice(0, 5);
  const extraCount = items.length - 5;

  const resetModal = useCallback(() => {
    setStep('impact');
    setConfirmationCode(generateConfirmationCode());
    setUserInput('');
    setCountdown(30);
    setIsDeleting(false);
    setDeleteError(null);
  }, []);

  useEffect(() => {
    if (isOpen) {
      resetModal();
    }
  }, [isOpen, resetModal]);

  useEffect(() => {
    if (step === 'confirm' && countdown > 0 && !isDeleting) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (step === 'confirm' && countdown === 0 && !isDeleting) {
      onClose();
    }
  }, [step, countdown, isDeleting, onClose]);

  const handleConfirm = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await onConfirm();
      resetModal();
      onClose();
    } catch (err: any) {
      setDeleteError(err.message || 'Delete failed. Please try again.');
      setIsDeleting(false);
    }
  };

  const canConfirm = userInput.toUpperCase() === confirmationCode && !isDeleting;

  const itemTypeLabels = {
    client: 'Client',
    invoice: 'Invoice',
    quotation: 'Quotation',
    expense: 'Expense',
    travel: 'Travel Entry',
    fuel: 'Fuel Log',
    purchase_order: 'Purchase Order',
    credit_note: 'Credit Note'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-lg bg-[#151B28] border border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <AlertTriangle className="text-red-500" size={20} />
                </div>
                <h2 className="text-lg font-black uppercase tracking-tight text-white">
                  Delete {itemTypeLabels[itemType]}{items.length > 1 ? 's' : ''}
                </h2>
              </div>
              <button
                onClick={onClose}
                disabled={isDeleting}
                className="p-2 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {step === 'impact' ? (
                <div className="space-y-6">
                  {/* Items to delete */}
                  <div>
                    <p className="text-slate-400 text-sm mb-3">
                      You are about to permanently delete {items.length} {itemTypeLabels[itemType]}{items.length > 1 ? 's' : ''}:
                    </p>
                    <ul className="space-y-2">
                      {displayItems.map((item) => (
                        <li key={item.id} className="flex items-center gap-2 text-white font-medium">
                          <span className="w-2 h-2 bg-red-500 rounded-full" />
                          {item.name}
                        </li>
                      ))}
                      {extraCount > 0 && (
                        <li className="text-slate-400 text-sm italic">
                          and {extraCount} more...
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Linked records warning */}
                  {itemsWithLinkedRecords.length > 0 && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <p className="text-amber-500 text-sm font-bold">
                        Warning: {itemsWithLinkedRecords.length} of these {itemTypeLabels[itemType].toLowerCase()}{itemsWithLinkedRecords.length > 1 ? 's' : ''} {itemsWithLinkedRecords.length > 1 ? 'have' : 'has'} linked records. 
                        Deleting {itemsWithLinkedRecords.length > 1 ? 'them' : 'it'} will permanently remove all associated data.
                      </p>
                    </div>
                  )}

                  {deleteError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-red-500 text-sm">{deleteError}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-slate-400 text-sm mb-4">
                      To confirm deletion, type the following exactly:
                    </p>
                    <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-6 mb-4">
                      <code className="text-2xl font-mono font-black text-orange-500 tracking-[0.2em]">
                        {confirmationCode}
                      </code>
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value.toUpperCase())}
                      placeholder="Type confirmation code"
                      disabled={isDeleting}
                      className="w-full px-4 py-3 bg-[#0B0F19] border border-slate-800 rounded-lg text-white font-mono text-center tracking-[0.2em] focus:border-orange-500 focus:outline-none transition-colors disabled:opacity-50"
                    />
                  </div>

                  <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
                    <span>Confirmation expires in</span>
                    <span className={`font-bold ${countdown <= 10 ? 'text-red-500' : ''}`}>
                      {countdown}s
                    </span>
                  </div>

                  {deleteError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-red-500 text-sm">{deleteError}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-800/50 bg-[#0B0F19]/50">
              {step === 'impact' ? (
                <>
                  <button
                    onClick={onClose}
                    disabled={isDeleting}
                    className="px-6 py-3 rounded-lg bg-slate-800 text-slate-300 font-bold text-sm uppercase tracking-wider hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setStep('confirm')}
                    className="px-6 py-3 rounded-lg bg-red-500 text-white font-bold text-sm uppercase tracking-wider hover:bg-red-600 transition-colors"
                  >
                    Continue to Delete
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setStep('impact')}
                    disabled={isDeleting}
                    className="px-6 py-3 rounded-lg bg-slate-800 text-slate-300 font-bold text-sm uppercase tracking-wider hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={!canConfirm}
                    className={`px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-colors flex items-center gap-2 ${
                      canConfirm 
                        ? 'bg-red-500 text-white hover:bg-red-600' 
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Confirm Delete'
                    )}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
