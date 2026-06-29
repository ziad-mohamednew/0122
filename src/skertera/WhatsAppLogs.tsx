import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Send, 
  CheckCircle2, 
  XCircle, 
  Search, 
  RefreshCw, 
  Plus, 
  Trash2, 
  MessageSquare, 
  Server, 
  ShieldCheck, 
  AlertCircle, 
  Clock, 
  ExternalLink,
  Eye,
  EyeOff
} from 'lucide-react';
import { WhatsAppLog, CenterSettings } from '../types';

interface WhatsAppLogsProps {
  whatsAppLogs: WhatsAppLog[];
  centerSettings?: CenterSettings;
  onResendMessage: (log: WhatsAppLog) => Promise<{ success: boolean; error?: string }>;
  onClearLogs: () => void;
  onSendDirectTest: (phone: string, text: string) => Promise<{ success: boolean; error?: string; id?: string; messageText?: string }>;
}

export default function WhatsAppLogs({
  whatsAppLogs = [],
  centerSettings,
  onResendMessage,
  onClearLogs,
  onSendDirectTest
}: WhatsAppLogsProps) {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');

  // Test form state
  const [testPhone, setTestPhone] = useState('');
  const [testText, setTestText] = useState('السلام عليكم.. هذه رسالة تجريبية لتأكيد عمل بوابة واتساب لـ Manara بنجاح 🎲');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; id?: string } | null>(null);

  // Re-sending loader states per log id
  const [resendingIds, setResendingIds] = useState<string[]>([]);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Hidden/Visible secret key state
  const [showSecrets, setShowSecrets] = useState(false);

  // Expended message log ID state
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Handlers
  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim() || !testText.trim()) {
      setTestResult({ success: false, message: '⚠️ يرجى إدخال رقم الهاتف ونص الرسالة التجارية أولاً.' });
      return;
    }

    setIsSendingTest(true);
    setTestResult(null);

    try {
      const result = await onSendDirectTest(testPhone, testText);
      if (result.success) {
        setTestResult({
          success: true,
          message: '✅ تم إرسال رسالة الاختبار بنجاح ووصلت لبوابة UltraMsg!',
          id: result.id
        });
      } else {
        setTestResult({
          success: false,
          message: `❌ فشل الإرسال: ${result.error || 'خطأ مجهول من البوابة'}`
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `❌ فشل الاتصال بالشبكة: ${err.message || err}`
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleResendClick = async (log: WhatsAppLog) => {
    setResendingIds(prev => [...prev, log.id]);
    setActionFeedback(null);
    try {
      const res = await onResendMessage(log);
      if (res.success) {
        setActionFeedback(`✅ تم إعادة إرسال الرسالة بنجاح إلى (${log.studentName})`);
      } else {
        setActionFeedback(`❌ فشل إعادة الإرسال: ${res.error}`);
      }
    } catch (err: any) {
      setActionFeedback(`❌ فشل الاتصال: ${err.message || err}`);
    } finally {
      setResendingIds(prev => prev.filter(id => id !== log.id));
    }
  };

  // Pre-process logs
  const filteredLogs = whatsAppLogs.filter(log => {
    const matchesSearch = 
      log.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.parentPhone.includes(searchTerm) ||
      log.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' ||
      log.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const successCount = whatsAppLogs.filter(l => l.status === 'success').length;
  const failedCount = whatsAppLogs.filter(l => l.status === 'failed').length;

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl" id="whatsapp-logs-tab">
      {/* Top Welcome Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-indigo-400" />
            <span>بوابة وتتبع رسائل واتساب الذكية</span>
          </h2>
          <p className="text-slate-400 text-xs mt-1 font-semibold">
            تابع حالة الإشعارات التلقائية الفورية المرسلة لأولياء الأمور فور تسجيل الغياب أو الحضور اليومي للطلاب.
          </p>
        </div>

        {/* Sync configuration status indicator */}
        <div className="flex items-center gap-3">
          {centerSettings?.whatsappInstanceId && centerSettings?.whatsappToken ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>البوابة مهيأة ونشطة (UltraMsg Connected)</span>
            </div>
          ) : (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>البوابة غير مهيأة! يرجى إدخال الإعدادات</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid Dashboard Configuration & Direct Test */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* API Credentials Details Column */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2 mb-3 flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-500" />
              <span>🔒 معلومات الربط والتشفير الحالية</span>
            </h3>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block mb-1">معرّف بوابة السنتر المساعد (Instance ID):</span>
                <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-150 dark:border-slate-800 text-xs font-mono font-bold select-text text-indigo-600 dark:text-indigo-400 tracking-wider">
                  {centerSettings?.whatsappInstanceId ? (
                    showSecrets ? centerSettings.whatsappInstanceId : '••••••••••••'
                  ) : (
                    <span className="text-rose-500 text-[10px] sm:text-xs">⚠️ لم يتم التعيين بعد في لوحة التفضيلات</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block mb-1">الرقم السري للبث (WhatsApp Token):</span>
                <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-150 dark:border-slate-800 text-xs font-mono font-bold select-text text-indigo-600 dark:text-indigo-400 tracking-wider">
                  {centerSettings?.whatsappToken ? (
                    showSecrets ? centerSettings.whatsappToken : '••••••••••••••••••••'
                  ) : (
                    <span className="text-rose-500 text-[10px] sm:text-xs">⚠️ لم يتم التعيين بعد في لوحة التفضيلات</span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSecrets(!showSecrets)}
                className="text-[10px] text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold underline cursor-pointer flex items-center gap-1"
                disabled={!centerSettings?.whatsappInstanceId}
              >
                {showSecrets ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>إخفاء الرموز السرية للبوابة</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>عرض الأكواد المشفرة للمدير</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-4 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
            💡 يتم قراءة وحفظ وتمرير أكواد البث محلياً من قاعدة البيانات المؤمنة سحابياً، مما يضمن وصولها الفوري لنسخ التطبيق (العادية و EXE) بدون أي عوائق في الشبكة.
          </p>
        </div>

        {/* WhatsApp Test Form Module */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-xs lg:col-span-2">
          <h3 className="text-xs font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2 mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>🎯 فحص واختبار بوابة الإرسال يدوياً (WhatsApp Diagnostics)</span>
          </h3>

          <form onSubmit={handleTestSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-slate-600 dark:text-slate-350 text-[10px] font-bold mb-1">
                  رقم هاتف المستلم (لتجربة الرسالة)
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: 01012345678"
                  value={testPhone}
                  onChange={e => setTestPhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold focus:outline-hidden text-right"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-600 dark:text-slate-350 text-[10px] font-bold mb-1">
                  نص الرسالة الاختبارية
                </label>
                <input
                  type="text"
                  required
                  value={testText}
                  onChange={e => setTestText(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="submit"
                disabled={isSendingTest}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-5 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isSendingTest ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري الإرسال التجريبي...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>إرسال فحص واتساب اختبار ⚡</span>
                  </>
                )}
              </button>

              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold text-left">
                * يرجى إدخال رقم واتساب نشط وصالح لاستقبال النتيجة فوراً ببلد الموبايل.
              </span>
            </div>
          </form>

          {testResult && (
            <div className={`mt-3 p-3 rounded-xl border text-xs font-bold flex flex-col gap-1 ${
              testResult.success 
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900 text-emerald-750 dark:text-emerald-400' 
                : 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900 text-rose-600 dark:text-rose-400'
            }`}>
              <div className="flex items-center gap-2">
                {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                <span>{testResult.message}</span>
              </div>
              {testResult.id && (
                <span className="text-[10px] text-slate-400 font-mono pr-6">معرّف الرسالة بنظام البوابة: {testResult.id}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {actionFeedback && (
        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-150 dark:border-indigo-900 text-indigo-700 dark:text-indigo-400 rounded-xl text-xs font-bold text-center">
          {actionFeedback}
        </div>
      )}

      {/* Database logs section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-xs overflow-hidden">
        {/* Logs List Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">🗂️ سجل ومراقبة كافة الرسائل والإشعارات</h3>
            <div className="flex items-center gap-1.5">
              <span className="bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                ناجح: {successCount}
              </span>
              <span className="bg-rose-50 dark:bg-rose-950 text-rose-650 dark:text-rose-450 text-[10px] font-bold px-2 py-0.5 rounded-full">
                فشل: {failedCount}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search filter input */}
            <div className="relative">
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                placeholder="ابحث باسم الطالب أو رقم الهاتف..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-lg pr-8 pl-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-hidden focus:border-indigo-400 w-52"
              />
            </div>

            {/* Filter select */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="all">كل الحالات 📋</option>
              <option value="success">إرسال ناجح ✅</option>
              <option value="failed font-bold">فشل الإرسال ❌</option>
            </select>

            {/* Clear logs button */}
            {whatsAppLogs.length > 0 && (
              <button
                type="button"
                onClick={onClearLogs}
                className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-700 dark:text-rose-400 p-2 rounded-lg transition"
                title="تفريغ وسجل إشعارات واتساب بالكامل"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Logs Table / List Container */}
        <div className="overflow-x-auto min-h-[300px]">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 dark:text-slate-500">
              <MessageSquare className="w-12 h-12 stroke-1 mb-2 text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-bold">لا يوجد أي سجلات مطابقة للفحص الحالي.</p>
              <p className="text-[10px] mt-1">سيتم ملء السجلات بمجرد تسجيل حضور وغياب الطلاب تلقائياً بالحصص الدراسية.</p>
            </div>
          ) : (
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-850">
                <tr>
                  <th className="px-5 py-3">اسم الطالب الكريم</th>
                  <th className="px-5 py-3">رقم هاتف ولي الأمر</th>
                  <th className="px-5 py-3">نص الرسالة المرسلة</th>
                  <th className="px-5 py-3 text-center">أرسل في</th>
                  <th className="px-5 py-3 text-center">حالة التسليم</th>
                  <th className="px-5 py-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {filteredLogs.map(log => {
                  const dateObj = new Date(log.timestamp);
                  const displayTime = dateObj.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) + ' ' + dateObj.toLocaleDateString('ar-EG', { month: 'numeric', day: 'numeric' });
                  const isExpanded = expandedLogId === log.id;

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-200">
                        {log.studentName}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-600 dark:text-slate-400 select-all">
                        {log.parentPhone}
                      </td>
                      <td className="px-5 py-3.5 max-w-sm">
                        <div className="flex flex-col gap-1">
                          <p onClick={() => setExpandedLogId(isExpanded ? null : log.id)} className={`text-slate-600 dark:text-slate-400 leading-relaxed cursor-pointer hover:text-indigo-500 transition-colors ${isExpanded ? '' : 'truncate max-w-[280px]'}`}>
                            {log.message}
                          </p>
                          {log.errorReason && (
                            <div className="bg-rose-500/10 border border-rose-500/15 text-rose-500 text-[10px] p-2 rounded-lg mt-1 flex items-center gap-1 leading-snug font-semibold select-text">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>السبب: {log.errorReason}</span>
                            </div>
                          )}
                          {!isExpanded && (
                            <button
                              type="button"
                              onClick={() => setExpandedLogId(log.id)}
                              className="text-[9px] text-indigo-500 text-right font-bold hover:underline"
                            >
                              عرض الرسالة كاملة 🔽
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1 font-mono text-[11px] select-all">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{displayTime}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          log.status === 'success' 
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-450 border border-emerald-200/20' 
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-455 border border-rose-220/20'
                        }`}>
                          {log.status === 'success' ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>تم التسليم</span>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              <span>فشل الاتصال</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleResendClick(log)}
                          disabled={resendingIds.includes(log.id)}
                          className="bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 border border-slate-200 dark:border-slate-800 text-indigo-700 dark:text-indigo-400 px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 mx-auto cursor-pointer"
                        >
                          {resendingIds.includes(log.id) ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
                          )}
                          <span>إعادة الإرسال</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
