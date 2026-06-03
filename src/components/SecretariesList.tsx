import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  UserPlus, 
  Trash2, 
  Plus, 
  Phone, 
  Search, 
  Download, 
  Printer, 
  Key, 
  Eye, 
  EyeOff, 
  MapPin, 
  User, 
  ShieldAlert,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Secretary, Teacher } from '../types';
import { exportToExcel, exportToPDF } from '../utils/exportHelper';

interface SecretariesListProps {
  secretaries: Secretary[];
  teachers: Teacher[];
  onSaveSecretary: (sec: Secretary) => void;
  onDeleteSecretary: (id: string) => void;
  showConfirm?: (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }) => void;
}

export default function SecretariesList({
  secretaries = [],
  teachers = [],
  onSaveSecretary,
  onDeleteSecretary,
  showConfirm
}: SecretariesListProps) {
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [workspaceType, setWorkspaceType] = useState<'teacher' | 'hall'>('hall');
  const [linkedTeacherId, setLinkedTeacherId] = useState('');
  const [hallName, setHallName] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Permission Checks (Defaulting all true for ease)
  const [permStudents, setPermStudents] = useState(true);
  const [permGroups, setPermGroups] = useState(true);
  const [permAttendance, setPermAttendance] = useState(true);
  const [permPayments, setPermPayments] = useState(true);
  const [permLogs, setPermLogs] = useState(false);

  // Search/Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState<'all' | 'male' | 'female'>('all');

  // Handlers
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('⚠️ يرجى إدخال اسم السكرتير.');
      return;
    }
    if (!phone.replace(/\D/g, '')) {
      setErrorMsg('⚠️ يرجى إدخال رقم هاتف مناسب.');
      return;
    }
    if (passcode.length < 4) {
      setErrorMsg('⚠️ كود المرور يجب أن يتكون من 4 أقام على الأقل لضمان الحماية.');
      return;
    }

    // Check duplicate passcode
    const hasDuplicate = secretaries.some(s => s.passcode === passcode && s.id !== editingId);
    if (hasDuplicate) {
      setErrorMsg('⚠️ كود المرور هذا مستخدم بالفعل لسكرتير آخر! يرجى اختيار كود فريد.');
      return;
    }

    setErrorMsg('');

    const secretaryObj: Secretary = {
      id: editingId || `sec-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      gender,
      workspaceType,
      teacherId: workspaceType === 'teacher' ? linkedTeacherId : undefined,
      hallName: workspaceType === 'hall' ? (hallName.trim() || 'القاعة الرئيسية') : undefined,
      passcode: passcode.trim(),
      createdAt: editingId ? (secretaries.find(s => s.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      permissions: {
        students: permStudents,
        groups: permGroups,
        attendance: permAttendance,
        payments: permPayments,
        logs: permLogs
      }
    };

    onSaveSecretary(secretaryObj);

    // Reset Form
    setEditingId(null);
    setName('');
    setPhone('');
    setGender('male');
    setWorkspaceType('hall');
    setLinkedTeacherId('');
    setHallName('');
    setPasscode('');
    setPermStudents(true);
    setPermGroups(true);
    setPermAttendance(true);
    setPermPayments(true);
    setPermLogs(false);
  };

  const startEdit = (s: Secretary) => {
    setEditingId(s.id);
    setName(s.name);
    setPhone(s.phone);
    setGender(s.gender || 'male');
    setWorkspaceType(s.workspaceType || 'hall');
    setLinkedTeacherId(s.teacherId || '');
    setHallName(s.hallName || '');
    setPasscode(s.passcode);
    setPermStudents(s.permissions?.students ?? true);
    setPermGroups(s.permissions?.groups ?? true);
    setPermAttendance(s.permissions?.attendance ?? true);
    setPermPayments(s.permissions?.payments ?? true);
    setPermLogs(s.permissions?.logs ?? false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName('');
    setPhone('');
    setGender('male');
    setWorkspaceType('hall');
    setLinkedTeacherId('');
    setHallName('');
    setPasscode('');
    setPermStudents(true);
    setPermGroups(true);
    setPermAttendance(true);
    setPermPayments(true);
    setPermLogs(false);
    setErrorMsg('');
  };

  // Filter Logic
  const filteredSecs = secretaries.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.phone.includes(searchTerm);
    const matchesGender = filterGender === 'all' || s.gender === filterGender;
    return matchesSearch && matchesGender;
  });

  // Report Engines
  const handleExportExcel = () => {
    const headers = ["الاسم بالكامل", "النوع", "الهاتف", "مكان/طبيعة العمل", "حساب السكرتارية الملحق به", "كود الدخول المروري (PIN)"];
    const rows = filteredSecs.map(s => {
      let workspace = '';
      if (s.workspaceType === 'teacher') {
        const t = teachers.find(x => x.id === s.teacherId);
        workspace = `معلم ملحق (${t ? t.name : 'مجهول'})`;
      } else {
        workspace = `قاعة تدريسية (${s.hallName || 'غير محددة'})`;
      }

      return [
        s.name,
        s.gender === 'female' ? 'أنثى' : 'ذكر',
        s.phone,
        workspace,
        `PIN: ${s.passcode}`,
        `الطلاب (${s.permissions?.students ? 'نعم':'لا'}) | المجموعات (${s.permissions?.groups ? 'نعم':'لا'}) | الحضور (${s.permissions?.attendance ? 'نعم':'لا'}) | الحسابات (${s.permissions?.payments ? 'نعم':'لا'}) | سجل النظام (${s.permissions?.logs ? 'نعم':'لا'})`
      ];
    });

    exportToExcel("تقرير المساعدين السكرتارية المسجلين", headers, rows, "كشف_عناوين_السكرتارية");
  };

  const handleExportPDF = () => {
    const headers = ["الاسم بالكامل", "النوع", "رقم الهاتف", "طبيعة العمل", "كود الدخول", "الصلاحيات المتاحة"];
    const rows = filteredSecs.map(s => {
      let workspace = '';
      if (s.workspaceType === 'teacher') {
        const t = teachers.find(x => x.id === s.teacherId);
        workspace = `${t ? t.name : 'معلم ملحق'}`;
      } else {
        workspace = `قاعة: ${s.hallName || 'الرئيسية'}`;
      }

      const activePerms: string[] = [];
      if (s.permissions?.students) activePerms.push("الطلاب");
      if (s.permissions?.groups) activePerms.push("المجموعات");
      if (s.permissions?.attendance) activePerms.push("الحضور");
      if (s.permissions?.payments) activePerms.push("الماليات");
      if (s.permissions?.logs) activePerms.push("السجلات");

      return [
        s.name,
        s.gender === 'female' ? 'أنثى' : 'ذكر',
        s.phone,
        workspace,
        s.passcode,
        activePerms.join(' ، ') || 'بدون صلاحيات'
      ];
    });

    const summary = [
      { label: "إجمالي مساعدي السكرتارية المصفين", value: String(filteredSecs.length) },
      { label: "ذكور ♂", value: String(filteredSecs.filter(s => s.gender !== 'female').length) },
      { label: "إناث ♀", value: String(filteredSecs.filter(s => s.gender === 'female').length) }
    ];

    exportToPDF("كشف كامل بمساعدي السكرتارية وجدول الصلاحيات الأمنية", headers, rows, undefined, summary);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Overview Head */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">إدارة السكرتارية والمساعدين</h1>
          <p className="text-slate-500 text-sm mt-1">
            تسجيل حسابات السكيرتارية والمساعدين بالسنتر كأفراد تشغيل، وضبط تصاريح المرور وحظر الوصول حسب رغبة المدير.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Add / Edit form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs h-fit">
          <h3 className="font-extrabold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-600" />
            <span>{editingId ? 'تعديل سكرتير ومساعد' : 'إضافة سكرتير ومساعد جديد'}</span>
          </h3>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            
            <div>
              <label className="block text-slate-600 text-xs font-bold mb-1.5">الاسم الكامل للسكرتير</label>
              <input 
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="أكتب الاسم الثلاثي هنا..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 text-xs font-bold mb-1.5">الهاتف</label>
                <input 
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="01234567890"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-slate-600 text-xs font-bold mb-1.5">النوع (الجنس)</label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden text-slate-700 font-bold"
                >
                  <option value="male">ذكر ♂</option>
                  <option value="female">أنثى ♀</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-600 text-xs font-bold mb-1.5">طبيعة وموقع العمل</label>
              <div className="flex gap-4 p-2.5 bg-slate-50 rounded-xl border border-slate-150">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700 font-semibold">
                  <input 
                    type="radio"
                    name="workspace"
                    checked={workspaceType === 'hall'}
                    onChange={() => setWorkspaceType('hall')}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <span>قاعة بالسنتر ملحقة</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700 font-semibold">
                  <input 
                    type="radio"
                    name="workspace"
                    checked={workspaceType === 'teacher'}
                    onChange={() => setWorkspaceType('teacher')}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <span>مساعد لمعلم محدد</span>
                </label>
              </div>
            </div>

            {workspaceType === 'teacher' ? (
              <div>
                <label className="block text-slate-600 text-xs font-bold mb-1.5">اربط هذا السكرتير بالمعلم</label>
                <select
                  value={linkedTeacherId}
                  onChange={e => setLinkedTeacherId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden text-slate-700 font-bold"
                >
                  <option value="">-- اختر المعلم المرتبط --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-slate-600 text-xs font-bold mb-1.5">اسم القاعة أو القسم المكلف بتعيينه فيها</label>
                <input 
                  type="text"
                  value={hallName}
                  onChange={e => setHallName(e.target.value)}
                  placeholder="مثال: القاعة الكبرى (أ)، الصالة الأولى، إلخ"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            )}

            <div>
              <label className="block text-slate-600 text-xs font-bold mb-1.5">كود المرور التناظري الفردي (4 أرقام أو أكثر)</label>
              <div className="relative">
                <input 
                  type={showPasscode ? 'text' : 'password'}
                  maxLength={6}
                  value={passcode}
                  onChange={e => setPasscode(e.target.value.replace(/\D/g, ''))}
                  placeholder="0000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-3 pl-10 py-2 text-center text-xs font-mono font-bold tracking-widest focus:outline-hidden focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">كود PIN هذا سيستخدمه السكرتير لتسجيل دخوله وتطبيق صلاحياته الشخصية.</p>
            </div>

            {/* Permissions Toggles Area */}
            <div className="pt-3 border-t border-slate-100">
              <label className="block text-slate-700 text-xs font-extrabold mb-2 flex items-center gap-1 text-indigo-700">
                <ShieldCheck className="w-4 h-4" />
                <span>التحكم في صلاحيات الوصول للغرف:</span>
              </label>

              <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2.5 text-xs text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input 
                    type="checkbox"
                    checked={permStudents}
                    onChange={e => setPermStudents(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded-sm"
                  />
                  <span>صلاحية الطلاب (ملفات وتسجيل تظلمات)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input 
                    type="checkbox"
                    checked={permGroups}
                    onChange={e => setPermGroups(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded-sm"
                  />
                  <span>صلاحية المجموعات وإدارة القاعات</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input 
                    type="checkbox"
                    checked={permAttendance}
                    onChange={e => setPermAttendance(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded-sm"
                  />
                  <span>صلاحية كشوف الحضور والغياب وكارت QR</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input 
                    type="checkbox"
                    checked={permPayments}
                    onChange={e => setPermPayments(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded-sm"
                  />
                  <span>صلاحية الحسابات والفوترة والمقبوضات المالية</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold block text-indigo-800">
                  <input 
                    type="checkbox"
                    checked={permLogs}
                    onChange={e => setPermLogs(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded-sm"
                  />
                  <span>صلاحية السجل وحركات النظام بالكامل</span>
                </label>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold leading-relaxed">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-sm shadow-indigo-100 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{editingId ? 'حفظ تعديلات الحساب' : 'إضافة حساب المساعد'}</span>
            </button>

            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2 rounded-xl text-xs transition-colors"
              >
                إلغاء التعديل والعودة للجديد
              </button>
            )}
          </form>
        </div>

        {/* Right Panel: Showcase List */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Quick Filter actions bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center bg-white p-4 rounded-xl border border-slate-100 shadow-2xs">
            <div className="relative w-full sm:flex-1">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="ابحث باسم السكرتير أو رقم الهاتف..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-4 py-2 text-xs text-slate-700 focus:outline-hidden"
              />
            </div>

            <select
              value={filterGender}
              onChange={e => setFilterGender(e.target.value as any)}
              className="w-full sm:w-32 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-600 text-xs focus:outline-hidden font-bold"
            >
              <option value="all">النوع (الكل)</option>
              <option value="male">ذكور ♂</option>
              <option value="female">إناث ♀</option>
            </select>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleExportExcel}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2 px-3 rounded-xl text-xs flex items-center gap-1 transition-all flex-1 justify-center cursor-pointer"
                title="تصدير كود Excel"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تصدير Excel</span>
              </button>

              <button
                type="button"
                onClick={handleExportPDF}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold p-2 px-3 rounded-xl text-xs flex items-center gap-1 transition-all flex-1 justify-center cursor-pointer"
                title="تصدير PDF للطباعة"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>تصدير PDF</span>
              </button>
            </div>
          </div>

          {/* Cards collection */}
          {filteredSecs.length === 0 ? (
            <div className="bg-white p-12 text-center text-slate-400 rounded-2xl border border-slate-100 shadow-xs">
              لم يتم العثور على أي حسابات سكرتارية مطابقة لخيارات التصفية حالياً.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSecs.map(s => {
                const totalPerms = (s.permissions?.students ? 1 : 0) +
                                   (s.permissions?.groups ? 1 : 0) +
                                   (s.permissions?.attendance ? 1 : 0) +
                                   (s.permissions?.payments ? 1 : 0) +
                                   (s.permissions?.logs ? 1 : 0);

                return (
                  <motion.div 
                    layout
                    key={s.id}
                    className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:border-slate-200 hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <span className="bg-slate-100 text-slate-600 font-extrabold text-[10px] uppercase font-mono px-2 py-0.5 rounded-sm">
                            PIN: {s.passcode}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            s.gender === 'female' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                          }`}>
                            {s.gender === 'female' ? 'أنثى ♀' : 'ذكر ♂'}
                          </span>
                        </div>

                        <div className="flex gap-1.5">
                          <button 
                            type="button"
                            onClick={() => startEdit(s)}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 p-1 rounded-lg text-xs"
                            title="تعديل حساب السكرتير"
                          >
                            📝 تعديل
                          </button>
                          <button 
                            type="button"
                            onClick={() => {
                              if (showConfirm) {
                                showConfirm({
                                  title: "حظر وإزالة ملف السكرتير",
                                  message: `🛡️ هل أنت متأكد من حذف حساب (${s.name}) نهائياً؟ سيؤدي ذلك لإلغاء كود المرور الملحق وحذف بيانات الوصول تماماً.`,
                                  confirmText: "نعم، احذف الحساب",
                                  cancelText: "تراجع",
                                  type: "danger",
                                  onConfirm: () => onDeleteSecretary(s.id)
                                });
                              } else if (confirm(`هل أنت متأكد من حذف حساب ${s.name}؟`)) {
                                onDeleteSecretary(s.id);
                              }
                            }}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-1.5 rounded-lg transition-all"
                            title="حذف حساب المساعد"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4">
                        <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                          <User className="w-4.5 h-4.5 text-slate-400" />
                          <span>{s.name}</span>
                        </h4>
                        
                        <div className="mt-3.5 space-y-1.5 text-slate-500 text-xs">
                          <p className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>موبايل السكرتير: <strong>{s.phone}</strong></span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                            <span>موقع التكليف: <strong>
                              {s.workspaceType === 'teacher' ? (
                                `مساعد الأستاذ: ${teachers.find(t => t.id === s.teacherId)?.name || 'السنتر العام'}`
                              ) : (
                                `قاعة: ${s.hallName || 'الرئيسية'}`
                              )}
                            </strong></span>
                          </p>
                        </div>
                      </div>

                      {/* Displaying brief permissions summary */}
                      <div className="mt-4 pt-3 border-t border-slate-50">
                        <span className="text-[10px] text-slate-400 font-extrabold block mb-1.5">
                          الصلاحيات الممنوحة لهذه الهوية ({totalPerms}/5):
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {s.permissions?.students && (
                            <span className="bg-emerald-50 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" /> الطلاب
                            </span>
                          )}
                          {s.permissions?.groups && (
                            <span className="bg-emerald-50 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" /> المجموعات
                            </span>
                          )}
                          {s.permissions?.attendance && (
                            <span className="bg-emerald-50 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" /> الحضور والـ QR
                            </span>
                          )}
                          {s.permissions?.payments && (
                            <span className="bg-emerald-50 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" /> فواتير وحسابات
                            </span>
                          )}
                          {s.permissions?.logs && (
                            <span className="bg-indigo-50 text-indigo-700 text-[9px] px-1.5 py-0.5 rounded-md font-extrabold flex items-center gap-0.5 border border-indigo-100">
                              <Check className="w-2.5 h-2.5" /> سجل السنتر
                            </span>
                          )}
                          {totalPerms === 0 && (
                            <span className="text-slate-400 italic text-[11px]">لا يوجد صلاحيات وصول منشطة حالياً.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
