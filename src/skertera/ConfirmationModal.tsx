import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';

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
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  type = 'warning',
  onConfirm,
  onCancel
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <Trash2 className="w-6 h-6 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-6 h-6 text-amber-500" />;
      case 'info':
        return <CheckCircle2 className="w-6 h-6 text-blue-500" />;
      default:
        return <AlertCircle className="w-6 h-6 text-amber-500" />;
    }
  };

  const getConfirmColor = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-500 hover:bg-red-600 text-white border-red-500';
      case 'warning':
        return 'bg-amber-500 hover:bg-amber-600 text-slate-900 border-amber-500';
      case 'info':
        return 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500';
      default:
        return 'bg-amber-500 hover:bg-amber-600 text-slate-900 border-amber-500';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs font-sans text-right" dir="rtl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={`p-3 rounded-full ${type === 'danger' ? 'bg-red-500/10' : type === 'info' ? 'bg-blue-500/10' : 'bg-amber-500/10'}`}>
                {getIcon()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-slate-400">{message}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={onCancel}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 rounded-xl text-sm transition"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onCancel();
                }}
                className={`flex-1 font-medium py-2.5 rounded-xl text-sm border transition ${getConfirmColor()}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
