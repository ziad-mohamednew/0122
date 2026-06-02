import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldAlert, 
  Download, 
  Upload, 
  Trash2, 
  CheckCircle, 
  Database,
  Search,
  CloudLightning,
  RefreshCw,
  Clock
} from 'lucide-react';
import { AuditLog, AppData } from '../types';

interface AuditTrailsProps {
  auditLogs: AuditLog[];
  onImportBackup: (backupData: AppData) => void;
  onClearDatabase: () => void;
  isFirebaseSync: boolean;
  onSyncForceReload: () => void;
  showConfirm?: (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }) => void;
}

export default function AuditTrails({ 
  auditLogs, 
  onImportBackup, 
  onClearDatabase,
  isFirebaseSync,
  onSyncForceReload,
  showConfirm
}: AuditTrailsProps) {
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [auditError, setAuditError] = useState('');

  // Filter logs list
  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || log.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Action download automated local database backup
  const handleDownloadBackup = () => {
    setAuditError('');
    const storageKey = "educational_center_dashboard_data";
    const localDataStr = localStorage.getItem(storageKey);
    if (!localDataStr) {
      setAuditError("⚠️ لا يتوفر أي بيانات محليّة للنسخ الاحتياطي حالياً!");
      return;
    }

    try {
      const data = JSON.parse(localDataStr);
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `نسخة_احتياطية_سنتر_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
      setAuditError("⚠️ فشل توليد ملف النسخ الاحتياطي السليم.");
    }
  };

  // Upload restore file helper
  const handleUploadBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAuditError('');
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        // Basic validations
        if (json.students && json.groups && json.teachers && json.payments) {
          onImportBackup(json);
          setRestoreSuccess(true);
          setAuditError('');
          setTimeout(() => setRestoreSuccess(false), 5000);
          e.target.value = ''; // clear input selection
        } else {
          setAuditError("❌ خطأ: بنية ملف النسخ الاحتياطي المرفوع غير صالحة ولا تحتوي على هياكل السنتر الأساسية!");
        }
      } catch (err) {
        setAuditError("❌ فشل قراءة الملف، يرجى التأكد من رفع ملف JSON صحيح للسنتر.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Top Title Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">الأمان، المزامنة، والنسخ الاحتياطي</h1>
          <p className="text-slate-500 text-sm mt-1">سجل مراجعة النظام لتتبع تعديلات الكادر، مع أدوات الاسترجاع والنسخ السحابية.</p>
        </div>
        
        {/* Security badge status */}
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-4 py-2 rounded-xl text-xs font-bold border border-emerald-100">
          <span>✓ النظام مأمون ومُشفر بالكامل ضد انقطاع الكهرباء والإنترنت</span>
        </div>
      </div>

      {/* Database control cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Backup configuration panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-800 border-b border-slate-50 pb-3 mb-2 flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            <span>لوحة النسخ الاحتياطي التلقائي والاسترداد</span>
          </h3>
          
          <p className="text-slate-500 text-xs leading-relaxed">
            يمكنك حفظ وتصدير قاعدة البيانات بالكامل شاملة الطلاب، المدرسين، الدفعات المالية والحضور كملف خارجي آمن في أي وقت، وبالمثل استردادها في غضون ثوانٍ.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            
            {/* Export local State */}
            <button 
              type="button"
              onClick={handleDownloadBackup}
              className="bg-indigo-50 hover:bg-indigo-100 text-[#4F46E5] font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition"
            >
              <Download className="w-4 h-4" />
              <span>تحميل نسخة احتياطية (JSON)</span>
            </button>

            {/* Import layout selector */}
            <label className="bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition">
              <Upload className="w-4 h-4 text-slate-500" />
              <span>استرداد قاعدة من ملف</span>
              <input 
                type="file" 
                accept=".json" 
                onChange={handleUploadBackupFile}
                className="hidden" 
              />
            </label>

          </div>

          {restoreSuccess && (
            <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-xl text-xs font-bold border border-emerald-100 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>تهانينا! تم تحميل واستيراد ملف البيانات الكلية بنجاح وتحديث النظام بالكامل.</span>
            </div>
          )}

          {auditError && (
            <div className="bg-rose-50 text-rose-800 p-3.5 rounded-xl text-xs font-bold border border-rose-100 flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <span>{auditError}</span>
            </div>
          )}
        </div>

        {/* Purge and system reset controller */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-800 border-b border-slate-50 pb-3 mb-2 flex items-center gap-2 text-rose-700">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <span>منطقة الخطر وإعادة التعيين الكلي</span>
          </h3>

          <p className="text-slate-500 text-xs leading-relaxed">
            العمليات هنا لا يمكن التراجع عنها. إعادة التعيين ستقوم بحذف جميع البيانات الحالية واستبدالها بالبيانات الافتراضية الأولية للسنتر التعليمي مجدداً.
          </p>

          <div className="flex gap-3 pt-2">
            <button 
              type="button"
              onClick={() => {
                if (showConfirm) {
                  showConfirm({
                    title: "تصفير وهيكلة قاعدة بيانات السنتر",
                    message: `🚨 تحذير أمني هام!\n\nهل أنت متأكد تماماً من رغبتك في حذف وتصفير قاعدة البيانات بالكامل؟\n\nسيقوم الإجراء بمسح جميع الطلاب، الحضور والغياب اليومي، المجموعات والمدرسين، والمعاملات المالية المسجلة نهائياً وبلا رجعة.`,
                    confirmText: "نعم، تصفير النظام كلياً",
                    cancelText: "تراجع وإلغاء",
                    type: "danger",
                    onConfirm: onClearDatabase
                  });
                } else {
                  onClearDatabase();
                }
              }}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-2.5 px-5 rounded-xl text-xs flex items-center justify-center gap-2 transition"
            >
              <Trash2 className="w-4.5 h-4.5" />
              <span>تصفير النظام وبدء قاعدة فارغة</span>
            </button>

            <button 
              type="button"
              onClick={onSyncForceReload}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition"
              title="إعادة بناء البينات السحابية"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
              <span>تحميل قسري ومزامنة من السحابة</span>
            </button>
          </div>
        </div>

      </div>

      {/* Audit Trails log section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        
        {/* Logger toolbar filters */}
        <div className="p-5 border-b border-slate-50 bg-linear-to-l from-slate-50 to-transparent flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="font-bold text-slate-800 text-base">سجل تعديلات وأنشطة السنتر (Audit Log)</h3>
            <p className="text-slate-500 text-xs mt-0.5">سجل مفصل بأدق تفاصيل العمليات المحفوظة لضمان أمان النفقات والغياب الفردي.</p>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="ابحث بالحركة أو الموظف المسؤول..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-700 focus:outline-hidden"
              />
            </div>

            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600 focus:outline-hidden"
            >
              <option value="all">كل الفئات</option>
              <option value="students">قسم الطلاب</option>
              <option value="groups">المجموعات</option>
              <option value="payments">المدفوعات</option>
              <option value="attendance">حضور وغياب</option>
              <option value="teachers">المعلمين</option>
              <option value="system">النظام الأساسي</option>
            </select>
          </div>
        </div>

        {/* Change list stream */}
        {filteredLogs.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            لا توجد حركات مسجلة تطابق شروط الفرز الحالية لحساب المسؤول.
          </div>
        ) : (
          <div className="divide-y divide-slate-150 max-h-[400px] overflow-y-auto">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-4 p-x-6 flex justify-between items-center hover:bg-slate-50/50 transition duration-150">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    log.category === 'payments' 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : log.category === 'attendance'
                        ? 'bg-blue-50 text-blue-700'
                        : log.category === 'students'
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'bg-slate-50 text-slate-700'
                  }`}>
                    {log.category === 'payments' ? '💰' : log.category === 'attendance' ? '📝' : log.category === 'students' ? '👤' : '⚙️'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-xs md:text-sm">{log.action}</p>
                    <p className="text-[11px] text-slate-400 mt-1">البيانات: {log.details}</p>
                  </div>
                </div>
                
                <div className="text-left">
                  <p className="text-slate-500 font-bold text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{new Date(log.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">بواسطة: {log.operator}</p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
}
