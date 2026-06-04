import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, HelpCircle, Trash2, ShieldAlert } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = "تأكيد الإجراء",
  cancelText = "تراجع",
  type = 'warning',
  onConfirm,
  onCancel
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        {/* Modal Card wrapper */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 transition-colors"
          dir="rtl"
        >
          {/* Header Banner color coded */}
          <div className={`p-5 flex items-center gap-3.5 border-b border-slate-100 dark:border-slate-800 ${
            type === 'danger' 
              ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400' 
              : type === 'warning' 
                ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400' 
                : 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400'
          }`}>
            <div className={`p-2.5 rounded-xl ${
              type === 'danger' 
                ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-600' 
                : type === 'warning' 
                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600' 
                  : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600'
            }`}>
              {type === 'danger' && <Trash2 className="w-5 h-5" />}
              {type === 'warning' && <AlertTriangle className="w-5 h-5" />}
              {type === 'info' && <HelpCircle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight">{title}</h3>
            </div>
          </div>

          {/* Message Content */}
          <div className="p-6">
            <p className="text-slate-600 dark:text-slate-300 text-xs font-semibold leading-relaxed whitespace-pre-line">
              {message}
            </p>
          </div>

          {/* Action buttons */}
          <div className="px-6 py-4.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-150 dark:border-slate-800 flex items-center justify-end gap-3 rounded-b-2xl">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`px-4 py-2 rounded-lg text-xs font-bold text-white shadow-xs transition ${
                type === 'danger'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : type === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
