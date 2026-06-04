import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Send, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Phone, 
  User, 
  RotateCw, 
  MessageSquare,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { WhatsAppLog } from '../types';

interface WhatsAppLogsProps {
  logs: WhatsAppLog[];
  onResendMessage: (log: WhatsAppLog) => void;
}

export default function WhatsAppLogs({ logs, onResendMessage }: WhatsAppLogsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [reSendingIds, setReSendingIds] = useState<{ [id: string]: boolean }>({});

  const handleResend = async (log: WhatsAppLog) => {
    setReSendingIds(prev => ({ ...prev, [log.id]: true }));
    try {
      await onResendMessage(log);
    } catch (e) {
      console.error(e);
    } finally {
      setReSendingIds(prev => ({ ...prev, [log.id]: false }));
    }
  };

  // Filter logs
  const filteredLogs = (logs || []).filter(log => {
    const matchesSearch = 
      log.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      log.parentPhone.includes(searchTerm) || 
      (log.message && log.message.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && log.status === statusFilter;
  });

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-emerald-600" />
            <span>سجل رسائل واتساب (WhatsApp logs)</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">تتبع كافة الإشعارات ورسائل الغياب التلقائية المرسلة لأولياء الأمور عبر بوابة UltraMsg.</p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 text-xs font-bold px-4 py-2.5 rounded-xl border border-emerald-100">
          <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span>تكامل نشط مع بوابة UltraMsg API</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Sent */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-bold block">إجمالي محاولات الإرسال</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">{(logs || []).length}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Send className="w-6 h-6" />
          </div>
        </div>

        {/* Success count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-bold block">نجح الإرسال</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">
              {(logs || []).filter(l => l.status === 'success').length}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Failed count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-bold block">فشل الإرسال</span>
            <span className="text-2xl font-black text-rose-600 mt-1 block">
              {(logs || []).filter(l => l.status === 'failed').length}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
          <input 
            type="text"
            placeholder="البحث باسم الطالب أو رقم الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-slate-700 text-sm focus:outline-hidden"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`flex-1 md:flex-initial py-1.5 px-4 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'all' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            الكل
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('success')}
            className={`flex-1 md:flex-initial py-1.5 px-4 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'success' ? 'bg-emerald-500 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            نجح
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('failed')}
            className={`flex-1 md:flex-initial py-1.5 px-4 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'failed' ? 'bg-rose-550 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            فشل
          </button>
        </div>
      </div>

      {/* Logs Table Area */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white p-16 text-center text-slate-400 rounded-2xl border border-slate-100 shadow-xs">
          {logs.length === 0 
            ? "لا تتوفر أي رسائل واتساب مسجلة في النظام بعد. سيتم ملء هذا السجل تلقائياً فور غياب أي طالب."
            : "لم يتم العثور على أي كشوفات مطابقة لمعايير البحث الحالية."}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-150 text-slate-600 font-bold text-xs">
                  <th className="p-4">الطالب</th>
                  <th className="p-4">رقم ولي الأمر</th>
                  <th className="p-4 w-96">نص الرسالة المرسلة</th>
                  <th className="p-4">وقت الإرسال</th>
                  <th className="p-4">حالة الإرسال</th>
                  <th className="p-4">التحكم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {filteredLogs.map((log) => {
                  const isReSending = !!reSendingIds[log.id];
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Name */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block text-xs sm:text-sm">{log.studentName}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">ID: {log.studentId}</span>
                          </div>
                        </div>
                      </td>

                      {/* Parent Phone */}
                      <td className="p-4 text-xs font-semibold text-slate-500 font-mono">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{log.parentPhone}</span>
                        </div>
                      </td>

                      {/* Message Body */}
                      <td className="p-4">
                        <div className="bg-slate-50 hover:bg-slate-100 border border-slate-200/60 p-2.5 rounded-lg text-xs text-slate-700 whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto w-80 font-medium">
                          {log.message}
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-slate-500 text-xs font-semibold">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {new Date(log.timestamp).toLocaleDateString('ar-EG', {
                              month: 'short',
                              day: 'numeric'
                            })} - {new Date(log.timestamp).toLocaleTimeString('ar-EG', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        {log.status === 'success' ? (
                          <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] font-bold py-1 px-2.5 rounded-full">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>نجح الإرسال</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-100 text-[11px] font-bold py-1 px-2.5 rounded-full">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>فشل الإرسال</span>
                            </div>
                            {log.errorReason && (
                              <div className="text-[10px] text-rose-600 font-medium max-w-44 leading-normal bg-rose-50/50 p-1.5 rounded-md border border-rose-100/20">
                                <AlertTriangle className="w-3 h-3 inline ml-1 align-text-bottom" />
                                {log.errorReason}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Action */}
                      <td className="p-4">
                        <button
                          type="button"
                          disabled={isReSending}
                          onClick={() => handleResend(log)}
                          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-all flex items-center gap-1 shadow-xs cursor-pointer disabled:cursor-not-allowed"
                        >
                          <RotateCw className={`w-3.5 h-3.5 ${isReSending ? 'animate-spin' : ''}`} />
                          <span>إعادة الإرسال</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="bg-slate-50 p-4 border-t border-slate-100 text-xs text-slate-500 font-bold text-left">
            مستلمة ومحدثة لحظياً • متصل ببوابة UltraMsg للاتصالات المباشرة
          </div>
        </div>
      )}

    </div>
  );
}
