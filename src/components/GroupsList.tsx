import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Layers, 
  Trash2, 
  Plus, 
  UserPlus, 
  Users, 
  Phone, 
  Hash, 
  Clock, 
  BookOpen,
  Search,
  Download,
  Printer
} from 'lucide-react';
import { Group, Teacher, Student } from '../types';
import { exportToExcel, exportToPDF } from '../utils/exportHelper';

interface GroupsListProps {
  groups: Group[];
  teachers: Teacher[];
  students: Student[];
  onSaveGroup: (group: Group) => void;
  onDeleteGroup: (id: string) => void;
  onSaveTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (id: string) => void;
  showConfirm?: (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }) => void;
}

const WEEK_DAYS = ["السبت", "الأحد", "الأثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

export default function GroupsList({ 
  groups, 
  teachers, 
  students, 
  onSaveGroup, 
  onDeleteGroup, 
  onSaveTeacher, 
  onDeleteTeacher,
  showConfirm 
}: GroupsListProps) {
  // Tabs: groups vs teachers
  const [activeSubTab, setActiveSubTab] = useState<'groups' | 'teachers'>('groups');

  // Form states - Teacher
  const [teacherName, setTeacherName] = useState('');
  const [teacherSubject, setTeacherSubject] = useState('');
  const [teacherPhone, setTeacherPhone] = useState('');
  const [teacherCommission, setTeacherCommission] = useState(80);
  const [teacherError, setTeacherError] = useState('');
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [teacherGender, setTeacherGender] = useState<'male' | 'female'>('male');
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
  const [teacherSelectedGender, setTeacherSelectedGender] = useState<'all' | 'male' | 'female'>('all');

  // Form states - Group
  const [groupName, setGroupName] = useState('');
  const [groupSubject, setGroupSubject] = useState('');
  const [linkedTeacherId, setLinkedTeacherId] = useState('');
  const [groupPrice, setGroupPrice] = useState(150);
  const [schedules, setSchedules] = useState<{ day: string; time: string }[]>([
    { day: "السبت", time: "16:00" }
  ]);
  const [groupError, setGroupError] = useState('');

  const handleAddScheduleRow = () => {
    setSchedules([...schedules, { day: "السبت", time: "16:00" }]);
  };

  const handleRemoveScheduleRow = (index: number) => {
    if (schedules.length > 1) {
      setSchedules(schedules.filter((_, i) => i !== index));
    }
  };

  const handleScheduleChange = (index: number, field: 'day' | 'time', value: string) => {
    const updated = [...schedules];
    updated[index][field] = value;
    setSchedules(updated);
  };

  // Submit Teacher
  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName || !teacherSubject || !teacherPhone) {
      setTeacherError("⚠️ الرجاء ملء جميع حقول المعلم.");
      return;
    }

    setTeacherError('');
    const newTeacher: Teacher = {
      id: editingTeacherId || `tch-${Date.now()}`,
      name: teacherName,
      subject: teacherSubject,
      phone: teacherPhone,
      commissionRate: Number(teacherCommission),
      gender: teacherGender,
      createdAt: editingTeacherId ? (teachers.find(t => t.id === editingTeacherId)?.createdAt || new Date().toISOString()) : new Date().toISOString()
    };

    onSaveTeacher(newTeacher);
    
    // Reset
    setTeacherName('');
    setTeacherSubject('');
    setTeacherPhone('');
    setTeacherCommission(80);
    setTeacherGender('male');
    setEditingTeacherId(null);
  };

  // Submit Group
  const handleGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName || !groupSubject || !linkedTeacherId) {
      setGroupError("⚠️ الرجاء ملء جميع حقول المجموعة واختيار معلم.");
      return;
    }

    setGroupError('');
    const newGroup: Group = {
      id: `grp-${Date.now()}`,
      name: groupName,
      subject: groupSubject,
      teacherId: linkedTeacherId,
      price: Number(groupPrice),
      schedules: schedules,
      createdAt: new Date().toISOString()
    };

    onSaveGroup(newGroup);

    // Reset
    setGroupName('');
    setGroupSubject('');
    setLinkedTeacherId('');
    setGroupPrice(150);
    setSchedules([{ day: "السبت", time: "16:00" }]);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">إدارة القاعات والمجموعات الدراسيّة</h1>
          <p className="text-slate-500 text-sm mt-1">إنشاء المجموعات وتحديد مواعيدها المتعددة، وتخصيص نسب المعلمين.</p>
        </div>
        
        {/* Toggle navigation */}
        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
          <button 
            type="button"
            onClick={() => setActiveSubTab('groups')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeSubTab === 'groups' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            📋 مجموعات التدريس
          </button>
          <button 
            type="button"
            onClick={() => setActiveSubTab('teachers')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeSubTab === 'teachers' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            👨‍🏫 الكادر التعليمي (المعلمون)
          </button>
        </div>
      </div>

      {activeSubTab === 'teachers' ? (
        (() => {
          // Calculate filtered teachers list
          const filteredTeachers = teachers.filter(t => {
            const matchesSearch = t.name.toLowerCase().includes(teacherSearchTerm.toLowerCase()) || 
                                  t.subject.toLowerCase().includes(teacherSearchTerm.toLowerCase()) ||
                                  t.phone.includes(teacherSearchTerm);
            const matchesGender = teacherSelectedGender === 'all' || t.gender === teacherSelectedGender;
            return matchesSearch && matchesGender;
          });

          const handleTeacherExportExcel = () => {
            const headers = ["الاسم بالكامل", "النوع", "المادة الدراسية", "رقم التليفون", "نسبة العمولة (%)", "المجموعات الحالية"];
            const rows = filteredTeachers.map(t => [
              t.name,
              t.gender === 'female' ? 'أنثى' : 'ذكر',
              t.subject,
              t.phone,
              `${t.commissionRate}%`,
              groups.filter(g => g.teacherId === t.id).map(g => g.name).join(' | ')
            ]);
            exportToExcel("كشف تفصيلي بالكادر التعليمي (المعلمون)", headers, rows, "كشف_معلمي_السنتر");
          };

          const handleTeacherExportPDF = () => {
            const headers = ["الاسم بالكامل", "النوع", "المادة", "الهاتف", "العمولة", "المجموعات"];
            const rows = filteredTeachers.map(t => [
              t.name,
              t.gender === 'female' ? 'أنثى' : 'ذكر',
              t.subject,
              t.phone,
              `${t.commissionRate}%`,
              groups.filter(g => g.teacherId === t.id).map(g => g.name).join(' ، ')
            ]);
            const summary = [
              { label: "إجمالي عدد المدرسين المصفى", value: String(filteredTeachers.length) },
              { label: "مدرسين للذكور", value: String(filteredTeachers.filter(t => t.gender !== 'female').length) },
              { label: "مدرسات للإناث", value: String(filteredTeachers.filter(t => t.gender === 'female').length) }
            ];
            exportToPDF("كشف تفصيلي بالكادر التعليمي ببياناتهم ونسبهم", headers, rows, undefined, summary);
          };

          const startEditTeacher = (t: Teacher) => {
            setEditingTeacherId(t.id);
            setTeacherName(t.name);
            setTeacherPhone(t.phone);
            setTeacherSubject(t.subject);
            setTeacherCommission(t.commissionRate);
            setTeacherGender(t.gender || 'male');
          };

          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left panel: Add Teacher Form */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs h-fit">
                <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-indigo-600" />
                  <span>{editingTeacherId ? 'تعديل بيانات المعلم' : 'إضافة معلم جديد'}</span>
                </h3>

                <form onSubmit={handleTeacherSubmit} className="space-y-4">
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1.5">الاسم ثلاثي للمعلم</label>
                    <input 
                      type="text" 
                      value={teacherName} 
                      onChange={(e) => setTeacherName(e.target.value)} 
                      placeholder="مثال: أ. محمود السعدني"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 text-sm focus:outline-hidden focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1.5">المادة الدراسية الأساسية</label>
                    <input 
                      type="text" 
                      value={teacherSubject} 
                      onChange={(e) => setTeacherSubject(e.target.value)} 
                      placeholder="الفيزياء، الكيمياء، إلخ..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 text-sm focus:outline-hidden focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1.5">النوع (الجنس)</label>
                    <div className="flex gap-4 bg-slate-50 p-3 rounded-xl border border-slate-150">
                      <label className="flex items-center gap-1.5 cursor-pointer text-sm text-slate-700 font-bold">
                        <input 
                          type="radio" 
                          name="teacherGenderForm" 
                          value="male"
                          checked={teacherGender === 'male'}
                          onChange={() => setTeacherGender('male')}
                          className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                        />
                        <span>ذكر ♂</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-sm text-slate-700 font-bold">
                        <input 
                          type="radio" 
                          name="teacherGenderForm" 
                          value="female"
                          checked={teacherGender === 'female'}
                          onChange={() => setTeacherGender('female')}
                          className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                        />
                        <span>أنثى ♀</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1.5">رقم تليفون المعلم</label>
                    <input 
                      type="tel" 
                      value={teacherPhone} 
                      onChange={(e) => setTeacherPhone(e.target.value)} 
                      placeholder="مثال: 01023456789"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 text-sm focus:outline-hidden focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1.5">نسبة المعلم (من رسوم الحصة/الاشتراك %)</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        min="0" 
                        max="100"
                        value={teacherCommission} 
                        onChange={(e) => setTeacherCommission(Number(e.target.value))} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 text-sm focus:outline-hidden focus:border-indigo-500 transition-colors"
                      />
                      <span className="text-slate-500 text-sm font-bold">%</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">يأخذ السنتر النسبة المتبقية تلقائياً عند الإيداع.</p>
                  </div>

                  {teacherError && (
                    <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold leading-relaxed">
                      {teacherError}
                    </div>
                  )}

                  <button 
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-sm shadow-indigo-100 flex items-center justify-center gap-2 mt-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{editingTeacherId ? 'تعديل وحفظ التغييرات' : 'حفظ بيانات المعلم'}</span>
                  </button>

                  {editingTeacherId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTeacherId(null);
                        setTeacherName('');
                        setTeacherSubject('');
                        setTeacherPhone('');
                        setTeacherCommission(80);
                        setTeacherGender('male');
                      }}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2 rounded-xl text-xs transition-colors mt-1"
                    >
                      إلغاء التعديل والعودة للإضافة
                    </button>
                  )}
                </form>
              </div>

              {/* Right panel: Teachers Card list */}
              <div className="lg:col-span-2 space-y-4">
                
                {/* Search & Filters & Exports for Teachers */}
                <div className="flex flex-col sm:flex-row gap-3 items-center bg-white p-4 rounded-xl border border-slate-100 shadow-2xs">
                  <div className="relative w-full sm:flex-1">
                    <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="ابحث باسم المعلم، التليفون أو المادة الأساسية..."
                      value={teacherSearchTerm}
                      onChange={(e) => setTeacherSearchTerm(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-4 py-2 text-xs text-slate-700 focus:outline-hidden"
                    />
                  </div>

                  <select 
                    value={teacherSelectedGender}
                    onChange={(e) => setTeacherSelectedGender(e.target.value as any)}
                    className="w-full sm:w-32 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-600 text-xs focus:outline-hidden font-bold"
                  >
                    <option value="all">النوع (الكل)</option>
                    <option value="male">ذكور ♂</option>
                    <option value="female">إناث ♀</option>
                  </select>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      type="button"
                      onClick={handleTeacherExportExcel}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2 px-3 rounded-xl text-xs flex items-center gap-1 transition-all flex-1 justify-center cursor-pointer"
                      title="تصدير Excel"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Excel</span>
                    </button>

                    <button 
                      type="button"
                      onClick={handleTeacherExportPDF}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold p-2 px-3 rounded-xl text-xs flex items-center gap-1 transition-all flex-1 justify-center cursor-pointer"
                      title="تصدير PDF للطباعة"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>

                {filteredTeachers.length === 0 ? (
                  <div className="bg-white p-12 text-center text-slate-400 rounded-2xl border border-slate-100 shadow-xs">
                    لم نجد معلمين يطابقون خيارات التصفية المدخلة.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredTeachers.map((t) => {
                      const teacherGroups = groups.filter(g => g.teacherId === t.id);
                      return (
                        <motion.div 
                          layout
                          key={t.id} 
                          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:border-slate-200 transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex justify-between items-start">
                              <div className="flex gap-1.5 items-center">
                                <div className="bg-indigo-50 text-indigo-700 w-8 h-8 rounded-xl flex items-center justify-center font-bold text-lg">
                                  🎓
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                  t.gender === 'female' ? 'bg-purple-50 text-purple-700 border border-purple-100/50' : 'bg-sky-50 text-sky-700 border border-sky-100/50'
                                }`}>
                                  {t.gender === 'female' ? 'أنثى ♀' : 'ذكر ♂'}
                                </span>
                              </div>
                              
                              <div className="flex gap-1">
                                <button 
                                  type="button" 
                                  onClick={() => startEditTeacher(t)}
                                  className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg transition-all text-xs"
                                  title="تعديل ملف المعلم"
                                >
                                  📝 تعديل
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    if (showConfirm) {
                                      showConfirm({
                                        title: "حذف ملف المعلم ببياناته",
                                        message: `⚠️ هل تريد بالتأكيد حذف المعلم (${t.name})؟ سيؤدي هذا الإجراء لفك ارتباط وحذف كافة المجموعات التعليمية المرتبطة به.`,
                                        confirmText: "نعم، احذف المعلم",
                                        cancelText: "تراجع",
                                        type: "danger",
                                        onConfirm: () => onDeleteTeacher(t.id)
                                      });
                                    } else if (confirm(`هل تريد بالتأكيد حذف المعلم ${t.name}؟ سيؤدي ذلك لفك ارتباط المجموعات.`)) {
                                      onDeleteTeacher(t.id);
                                    }
                                  }}
                                  className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-slate-50 transition-all"
                                  title="حذف المعلم"
                                >
                                  <Trash2 className="w-4.5 h-4.5" />
                                </button>
                              </div>
                            </div>

                        <div className="mt-4">
                          <h4 className="font-bold text-slate-800 text-base">{t.name}</h4>
                          <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-0.5 rounded-md mt-1.5 inline-block">
                            مادة: {t.subject}
                          </span>
                        </div>

                        <div className="mt-4 space-y-2 text-slate-500 text-xs border-t border-slate-50 pt-3">
                          <p className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>موبايل: {t.phone}</span>
                          </p>
                          <p className="flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5 text-slate-400" />
                            <span>المجموعات الحالية: {teacherGroups.length} مجموعات</span>
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center bg-slate-50 -mx-5 -mb-5 p-3 rounded-b-2xl">
                        <span className="text-slate-500 text-xs font-semibold">نسبة العمولة:</span>
                        <span className="text-emerald-700 font-extrabold text-sm bg-emerald-50 px-2 rounded-sm border border-emerald-100">{t.commissionRate}%</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
          );
        })()
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: Add Group Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs h-fit">
            <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <span>إنشاء مجموعة جديدة</span>
            </h3>

            <form onSubmit={handleGroupSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-600 text-xs font-semibold mb-1.5">اسم المجموعة التعليمية</label>
                <input 
                  type="text" 
                  value={groupName} 
                  onChange={(e) => setGroupName(e.target.value)} 
                  placeholder="مثال: مجموعة الفيزياء - ثانية ثانوي أ"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 text-sm focus:outline-hidden focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 text-xs font-semibold mb-1.5">المادة العلمية</label>
                  <input 
                    type="text" 
                    value={groupSubject} 
                    onChange={(e) => setGroupSubject(e.target.value)} 
                    placeholder="مثال: الفيزياء"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-xs font-semibold mb-1.5">قيمة الاشتراك (بالجنيه)</label>
                  <input 
                    type="number" 
                    value={groupPrice} 
                    onChange={(e) => setGroupPrice(Number(e.target.value))} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 text-xs font-semibold mb-1.5">المعلم المدرس للجروب</label>
                <select 
                  value={linkedTeacherId} 
                  onChange={(e) => {
                    setLinkedTeacherId(e.target.value);
                    const selected = teachers.find(t => t.id === e.target.value);
                    if (selected) setGroupSubject(selected.subject);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 text-sm focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="">-- اختر المعلم --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>
                  ))}
                </select>
                {teachers.length === 0 && (
                  <p className="text-[10px] text-rose-500 mt-1">يجب إضافة معلم واحد على الأقل أولاً!</p>
                )}
              </div>

              {/* Flex Multiple Schedules */}
              <div className="space-y-2 border-t border-slate-50 pt-3">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-700 text-xs font-bold">مواعيد المحاضرات الأسبوعية</label>
                  <button 
                    type="button" 
                    onClick={handleAddScheduleRow}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-sm flex items-center gap-1 font-bold transition-all"
                  >
                    <Plus className="w-3 h-3" />
                    <span>إضافة موعد</span>
                  </button>
                </div>

                {schedules.map((sched, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded-lg">
                    <select 
                      value={sched.day} 
                      onChange={(e) => handleScheduleChange(idx, 'day', e.target.value)}
                      className="bg-white border border-slate-200 rounded-sm p-1.5 text-xs text-slate-600 flex-1 focus:outline-hidden"
                    >
                      {WEEK_DAYS.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                    
                    <input 
                      type="time" 
                      value={sched.time} 
                      onChange={(e) => handleScheduleChange(idx, 'time', e.target.value)}
                      className="bg-white border border-slate-200 rounded-sm p-1 text-xs text-slate-600 w-24 text-center focus:outline-hidden"
                    />

                    {schedules.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveScheduleRow(idx)}
                        className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {groupError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold leading-relaxed">
                  {groupError}
                </div>
              )}

              <button 
                type="submit"
                disabled={teachers.length === 0}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>حفظ وإنشاء المجموعة</span>
              </button>
            </form>
          </div>

          {/* Right panel: Groups grid list */}
          <div className="lg:col-span-2 space-y-4 animate-fade-in">
            {groups.length === 0 ? (
              <div className="bg-white p-12 text-center text-slate-400 rounded-2xl border border-slate-100 shadow-xs">
                لا توجد مجموعات دراسية نشطة حالياً. ابدأ بإنشاء أول مجموعة لتسجيل الطلاب وتوزيع الحصص.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.map((g) => {
                  const trainer = teachers.find(t => t.id === g.teacherId);
                  const enrolledCount = students.filter(s => s.groupIds && s.groupIds.includes(g.id)).length;
                  return (
                    <motion.div 
                      layout
                      key={g.id} 
                      className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:border-slate-200 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="bg-indigo-50 text-indigo-700 font-extrabold text-xs px-3 py-1 rounded-full">
                            {g.subject}
                          </span>
                          
                          <button 
                            type="button"
                            onClick={() => {
                              if (showConfirm) {
                                showConfirm({
                                  title: "حذف المجموعة التعليمية",
                                  message: `⚠️ هل أنت متأكد من حذف المجموعة (${g.name})؟ سيتم فك ارتباط الطلاب بهذه المجموعة تلقائياً.`,
                                  confirmText: "نعم، احذف المجموعة",
                                  cancelText: "تراجع",
                                  type: "danger",
                                  onConfirm: () => onDeleteGroup(g.id)
                                });
                              } else if (confirm(`هل أنت متأكد من حذف المجموعة ${g.name}؟ هذا سيفك ارتباط الطلاب.`)) {
                                onDeleteGroup(g.id);
                              }
                            }}
                            className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-slate-50 transition-all"
                            title="حذف المجموعة"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>

                        <div className="mt-3">
                          <h4 className="font-bold text-slate-800 text-sm">{g.name}</h4>
                          <span className="text-slate-500 text-xs block mt-1">
                            المعلم: <strong className="text-indigo-600">{trainer ? trainer.name : 'غير محدد'}</strong>
                          </span>
                        </div>

                        {/* Schedules tags */}
                        <div className="mt-4 pt-3 border-t border-slate-50 space-y-1.5">
                          <p className="text-[10px] text-slate-400 font-bold mb-1">المواعيد الأسبوعية الحالية:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {g.schedules ? g.schedules.map((s, idx) => (
                              <span key={idx} className="bg-slate-50 text-slate-600 text-[11px] px-2 py-0.5 rounded-md border border-slate-100 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>{s.day} @ {s.time}</span>
                              </span>
                            )) : (
                              <span className="text-slate-400 text-xs">لا توجد مواعيد مخصصة</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-100 flex justify-between items-center bg-slate-50 -mx-5 -mb-5 p-3 rounded-b-2xl text-xs">
                        <div className="flex items-center gap-1 text-slate-500">
                          <Users className="w-3.5 h-3.5" />
                          <span>الطلاب المسجلين: <strong>{enrolledCount} طالباً</strong></span>
                        </div>
                        <span className="bg-indigo-100 text-indigo-700 font-extrabold px-2 py-0.5 rounded-md">{g.price} جنيه/شهر</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
