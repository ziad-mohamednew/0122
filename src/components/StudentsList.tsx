import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Download, 
  Trash2, 
  User, 
  Phone, 
  CreditCard, 
  Users, 
  Sparkles,
  QrCode,
  Printer,
  CheckCircle,
  XCircle,
  MoreVertical,
  X
} from 'lucide-react';
import QRCode from 'qrcode';
import { Student, Group, Teacher, CenterSettings } from '../types';
import { exportToExcel, exportToPDF } from '../utils/exportHelper';

interface StudentsListProps {
  students: Student[];
  groups: Group[];
  teachers: Teacher[];
  centerSettings?: CenterSettings;
  onSaveStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  onUpdateStudentBalance: (id: string, newBalance: number) => void;
  showConfirm?: (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }) => void;
}

const formatTime12 = (time24: string) => {
  if (!time24) return '';
  const [hour, minute] = time24.split(':');
  if (!hour || !minute) return time24;
  let h = parseInt(hour, 10);
  const ampm = h >= 12 ? 'م' : 'ص';
  h = h % 12;
  h = h ? h : 12; // 0 becomes 12
  return `${h}:${minute} ${ampm}`;
};

export default function StudentsList({ 
  students, 
  groups, 
  teachers, 
  centerSettings,
  onSaveStudent, 
  onDeleteStudent,
  onUpdateStudentBalance,
  showConfirm
}: StudentsListProps) {
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedGender, setSelectedGender] = useState<'all' | 'male' | 'female'>('all');

  // New Student Form States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [studentGender, setStudentGender] = useState<'male' | 'female'>('male');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [studentGroupSchedules, setStudentGroupSchedules] = useState<{ [groupId: string]: string }>({});
  const [studentBalance, setStudentBalance] = useState(0);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  // Student Card Modal
  const [activeCardStudent, setActiveCardStudent] = useState<Student | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Handle Generating student QR Code when Card Modal is opened
  useEffect(() => {
    if (activeCardStudent) {
      QRCode.toDataURL(activeCardStudent.code, {
        width: 160,
        margin: 2,
        color: {
          dark: '#1e293b', // slate-800
          light: '#ffffff'
        }
      })
      .then(url => {
        setQrCodeDataUrl(url);
      })
      .catch(err => {
        console.error("QR Code Generation Error:", err);
      });
    } else {
      setQrCodeDataUrl('');
    }
  }, [activeCardStudent]);

  // Handle Form Submission (Create or Edit)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !studentPhone || !parentPhone) {
      setFormError("⚠️ الرجاء إدخال الحقول الأساسية: الاسم ورقم تليفون الطالب والوالد.");
      return;
    }

    setFormError('');

    // Determine trainers of these groups
    const studentTeachers = Array.from(new Set(
      selectedGroups.map(gId => groups.find(g => g.id === gId)?.teacherId).filter(Boolean) as string[]
    ));

    const newStudent: Student = {
      id: editingStudentId || `std-${Date.now()}`,
      code: editingStudentId ? (students.find(s => s.id === editingStudentId)?.code || String(1000 + students.length + 1)) : String(1000 + students.length + 1),
      name: studentName,
      phone: studentPhone,
      parentPhone: parentPhone,
      groupIds: selectedGroups,
      groupSchedules: studentGroupSchedules,
      teacherIds: studentTeachers,
      balance: editingStudentId ? (students.find(s => s.id === editingStudentId)?.balance || 0) : Number(studentBalance),
      status: 'active',
      createdAt: editingStudentId ? (students.find(s => s.id === editingStudentId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      gender: studentGender,
    };

    onSaveStudent(newStudent);
    
    // Close & Reset
    setIsFormOpen(false);
    setEditingStudentId(null);
    setStudentName('');
    setStudentPhone('');
    setParentPhone('');
    setStudentGender('male');
    setSelectedGroups([]);
    setStudentGroupSchedules({});
    setStudentBalance(0);
    setFormError('');
  };

  const startEdit = (student: Student) => {
    setEditingStudentId(student.id);
    setStudentName(student.name);
    setStudentPhone(student.phone);
    setParentPhone(student.parentPhone);
    setStudentGender(student.gender || 'male');
    setSelectedGroups(student.groupIds || []);
    setStudentGroupSchedules(student.groupSchedules || {});
    setFormError('');
    setIsFormOpen(true);
  };

  const handleGroupCheckboxChange = (groupId: string) => {
    if (selectedGroups.includes(groupId)) {
      setSelectedGroups(selectedGroups.filter(id => id !== groupId));
      setStudentGroupSchedules(prev => {
        const newData = { ...prev };
        delete newData[groupId];
        return newData;
      });
    } else {
      setSelectedGroups([...selectedGroups, groupId]);
      // Attempt to assign the first schedule by default if it exists
      const groupInfo = groups.find(g => g.id === groupId);
      if (groupInfo?.schedules && groupInfo.schedules.length > 0) {
        const firstSchedule = `${groupInfo.schedules[0].day} ${formatTime12(groupInfo.schedules[0].time)}`;
        setStudentGroupSchedules(prev => ({ ...prev, [groupId]: firstSchedule }));
      }
    }
  };

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            student.code.includes(searchTerm) || 
                            student.phone.includes(searchTerm) ||
                            student.parentPhone.includes(searchTerm);
      
      const matchesGroup = selectedGroupId === '' || (student.groupIds && student.groupIds.includes(selectedGroupId));
      
      const matchesStatus = selectedStatus === 'all' || student.status === selectedStatus;

      const matchesGender = selectedGender === 'all' || student.gender === selectedGender;

      return matchesSearch && matchesGroup && matchesStatus && matchesGender;
    });
  }, [students, searchTerm, selectedGroupId, selectedStatus, selectedGender]);

  // Export to Excel 
  const handleExportExcel = () => {
    const headers = ["الكود/الرمز", "اسم الطالب بالكامل", "النوع (الجنس)", "تليفون الطالب", "تليفون ولي الأمر", "المجموعات المسجلة ومواعيدها", "الرصيد المالي", "الحالة"];
    const rows = filteredStudents.map(s => {
      const linkedGroupNames = s.groupIds ? s.groupIds.map(gId => {
        const group = groups.find(g => g.id === gId);
        const schedule = s.groupSchedules?.[gId] ? ` (${s.groupSchedules[gId]})` : '';
        return group ? `${group.name}${schedule}` : '';
      }).filter(Boolean).join(' | ') : '';
      return [
        s.code,
        s.name,
        s.gender === 'female' ? 'أنثى' : 'ذكر',
        s.phone,
        s.parentPhone,
        linkedGroupNames,
        `${s.balance} جنيه`,
        s.status === 'active' ? 'نشط' : 'موقف'
      ];
    });
    exportToExcel("تقرير بيانات طلاب السنتر التعليمي تفصيلي", headers, rows, "كشف_طلاب_السنتر");
  };

  // Export to PDF
  const handleExportPDF = () => {
    const headers = ["الكود", "اسم الطالب بالكامل", "النوع", "تليفون الطالب", "تليفون ولي الأمر", "المجموعات المسجلة ومواعيدها", "الرصيد المالي", "الحالة"];
    const rows = filteredStudents.map(s => {
      const linkedGroupNames = s.groupIds ? s.groupIds.map(gId => {
        const group = groups.find(g => g.id === gId);
        const schedule = s.groupSchedules?.[gId] ? ` (${s.groupSchedules[gId]})` : '';
        return group ? `${group.name}${schedule}` : '';
      }).filter(Boolean).join(' ، ') : '';
      return [
        s.code,
        s.name,
        s.gender === 'female' ? 'أنثى' : 'ذكر',
        s.phone,
        s.parentPhone,
        linkedGroupNames,
        `${s.balance} ج.م`,
        s.status === 'active' ? 'نشط' : 'موقف'
      ];
    });
    
    const summary = [
      { label: "إجمالي عدد الطلاب المصفى", value: String(filteredStudents.length) },
      { label: "إجمالي الطلاب الذكور", value: String(filteredStudents.filter(s => s.gender !== 'female').length) },
      { label: "إجمالي الطالبات الإناث", value: String(filteredStudents.filter(s => s.gender === 'female').length) },
      { label: "إجمالي المطالبات المستحقة للمدرج الحالي", value: `${filteredStudents.reduce((acc, curr) => curr.balance < 0 ? acc + curr.balance : acc, 0)} ج.م` }
    ];

    exportToPDF("كشف تفصيلي ببيانات طلاب السنتر ومستحقاتهم", headers, rows, centerSettings, summary);
  };

  // HTML print trigger for student visual card
  const handlePrintCard = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html dir="rtl">
          <head>
            <title>بطاقة تعريف الطالب</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f1f5f9; }
              .card { width: 340px; background: white; border-radius: 16px; border: 2px solid #e2e8f0; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); overflow: hidden; position: relative; padding: 24px; text-align: center; }
              .header { background: #4f46e5; color: white; margin: -24px -24px 20px -24px; padding: 16px; font-weight: bold; font-size: 18px; }
              .name { font-size: 20px; font-weight: bold; color: #1e293b; margin-bottom: 8px; }
              .code { background: #f1f5f9; color: #4f46e5; font-size: 14px; font-weight: bold; padding: 4px 12px; border-radius: 9999px; display: inline-block; margin-bottom: 15px; letter-spacing: 2px; }
              .qr-container { display: flex; justify-content: center; margin: 15px 0; }
              .qr-container img { width: 150px; height: 150px; }
              .footer { font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 12px; margin-top: 15px; }
              .info-row { display: flex; justify-content: space-between; font-size: 12px; color: #475569; margin: 5px 0; }
              @media print {
                body { background: white; }
                .card { box-shadow: none; border: 1px solid #000; }
              }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="header">${centerSettings?.name || 'بطاقة الهوية التعليمية'}</div>
              <div class="name">${activeCardStudent?.name}</div>
              <div class="code">CODE: ${activeCardStudent?.code}</div>
              <div class="qr-container">
                <img src="${qrCodeDataUrl}" alt="Student QR Code" />
              </div>
              <div class="info-row">
                <span>تليفون الطالب:</span>
                <strong>${activeCardStudent?.phone}</strong>
              </div>
              <div class="info-row">
                <span>تليفون ولي الأمر:</span>
                <strong>${activeCardStudent?.parentPhone}</strong>
              </div>
              <div class="footer" style="font-size: 10px; line-height: 1.4; color: #64748b; margin-top: 15px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
                ${centerSettings?.name || 'بوابة السنتر التعليمي'}<br/>
                هاتف: ${centerSettings?.phone || ''} • العنوان: ${centerSettings?.address || ''}
              </div>
            </div>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Top Controls / Details */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs transition-colors">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">شؤون الطلاب وملفات التعارف</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">إضافة وتعديل الطلاب، وطباعة بطاقات الهوية المشفّرة بـ QR، والتحميل المباشر للتقارير.</p>
        </div>
        
        {/* Buttons */}
        <div className="flex flex-wrap gap-2">
          <button 
            type="button"
            onClick={handleExportExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>تصدير Excel</span>
          </button>

          <button 
            type="button"
            onClick={handleExportPDF}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>تصدير PDF</span>
          </button>

          <button 
            type="button"
            onClick={() => {
              setEditingStudentId(null);
              setStudentName('');
              setStudentPhone('');
              setParentPhone('');
              setStudentGender('male');
              setSelectedGroups([]);
              setStudentBalance(0);
              setFormError('');
              setIsFormOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all flex items-center gap-1.5 shadow-sm shadow-indigo-100"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>تسجيل طالب جديد</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row gap-3 items-center transition-colors">
        
        {/* Input Search */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="ابحث باسم الطالب، الكود الرقمي، أو تليفون ولي الأمر..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-sm text-slate-705 dark:text-slate-300 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        {/* Group Filter */}
        <select 
          value={selectedGroupId}
          onChange={(e) => setSelectedGroupId(e.target.value)}
          className="w-full md:w-56 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-600 dark:text-slate-300 text-sm focus:outline-hidden"
        >
          <option value="">جميع المجموعات</option>
          {groups.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>

        {/* Gender Filter */}
        <select 
          value={selectedGender}
          onChange={(e) => setSelectedGender(e.target.value as any)}
          className="w-full md:w-36 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-600 dark:text-slate-300 text-sm focus:outline-hidden"
        >
          <option value="all">النوع (الكل)</option>
          <option value="male">ذكور ♂</option>
          <option value="female">إناث ♀</option>
        </select>

        {/* Status Filter */}
        <select 
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as any)}
          className="w-full md:w-36 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-600 dark:text-slate-300 text-sm focus:outline-hidden"
        >
          <option value="all">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="inactive">موقوف</option>
        </select>
      </div>

      {/* Student List View Grid */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-16 text-center text-slate-400 dark:text-slate-500 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs transition-colors">
          لم يتم العثور على أي طلاب يطابقون خيارات البحث والتصفية للسنتر.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStudents.map((s) => {
            // Find registered groups of this student
            const studentGroupsObj = groups.filter(g => s.groupIds && s.groupIds.includes(g.id));
            
            return (
              <motion.div 
                layout
                key={s.id} 
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs p-5 hover:border-slate-205 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div className="flex gap-2 items-center">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 font-extrabold text-[11px] font-mono px-2 py-0.5 rounded-md">
                        #{s.code}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        s.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-955/40 text-rose-700 dark:text-rose-400'
                      }`}>
                        {s.status === 'active' ? 'نشط' : 'موقف'}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        s.gender === 'female' ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40' : 'bg-sky-50 dark:bg-sky-955/40 text-sky-700 dark:text-sky-450 border border-sky-100 dark:border-sky-900/40'
                      }`}>
                        {s.gender === 'female' ? 'أنثى ♀' : 'ذكر ♂'}
                      </span>
                    </div>

                    {/* Actions and Print ID */}
                    <div className="flex gap-1">
                      <button 
                        type="button" 
                        onClick={() => setActiveCardStudent(s)}
                        className="bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-400 p-1.5 rounded-lg transition-all"
                        title="إنشاء كارت الهوية بـ QR"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => startEdit(s)}
                        className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 p-1.5 rounded-lg transition-all"
                        title="تعديل البيانات"
                      >
                        📝
                      </button>
                      <button 
                        type="button" 
                        onClick={() => {
                          if (showConfirm) {
                            showConfirm({
                              title: "حذْف ملف الطالب نهائياً",
                              message: `🛡️ هل أنت متأكد من حذف الطالب (${s.name}) بالكامل؟ سيؤدي ذلك لإزالة بياناته وحضور الحصص كلياً.`,
                              confirmText: "نعم، احذف ملف الطالب",
                              cancelText: "تراجع",
                              type: "danger",
                              onConfirm: () => onDeleteStudent(s.id)
                            });
                          } else {
                            onDeleteStudent(s.id);
                          }
                        }}
                        className="bg-rose-50 dark:bg-rose-955/40 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 p-1.5 rounded-lg transition-all"
                        title="حذف الطالب"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h3 className="font-bold text-slate-805 dark:text-slate-105 text-base">{s.name}</h3>
                    
                    <div className="mt-3 space-y-1.5 text-slate-500 dark:text-slate-400 text-xs">
                      <p className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-550" />
                        <span>رقم تليفون الطالب: <strong>{s.phone}</strong></span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-500" />
                        <span>رقم تليفون ولي الأمر: <strong>{s.parentPhone}</strong></span>
                      </p>
                    </div>

                    {/* Enrolled groups names */}
                    <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block mb-1">المجموعات الدراسية المسجلة:</span>
                      {studentGroupsObj.length === 0 ? (
                        <span className="text-slate-400 dark:text-slate-500 text-xs italic">غير ملحق بمجموعات حالياً</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {studentGroupsObj.map(g => (
                            <div key={g.id} className="bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-400 text-[10px] px-2 py-1 rounded-md flex flex-col">
                              <span className="font-bold">{g.name}</span>
                              {s.groupSchedules?.[g.id] && (
                                <span className="text-[9px] opacity-80 mt-0.5">{s.groupSchedules[g.id]}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Balance & Financial liability details */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50 -mx-5 -mb-5 p-3 rounded-b-2xl">
                  <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    <span>الرصيد/الحساب الفردي</span>
                  </div>
                  <span className={`text-sm font-extrabold px-3 py-0.5 rounded-md ${
                    s.balance < 0 
                      ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400' 
                      : s.balance > 0 
                        ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' 
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-350'
                  }`}>
                    {s.balance === 0 ? 'مستوفي' : s.balance > 0 ? `+${s.balance} جنيه` : `${s.balance} جنيه`}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Dialog / Registration overlay Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <motion.div 
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.95, opacity: 0 }}
               className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-205 dark:border-slate-800 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-xl transition-colors"
            >
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-slate-805 dark:text-slate-100">
                  {editingStudentId ? 'تعديل ملف الطالب' : 'تسجيل نموذج طالب جديد'}
                </h3>
                <button 
                  type="button" 
                  onClick={() => setIsFormOpen(false)}
                  className="bg-slate-150 dark:bg-slate-800 p-1.5 rounded-lg text-slate-400 hover:text-slate-705 dark:hover:text-slate-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-slate-700 dark:text-slate-300">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-xs font-semibold mb-1.5">اسم الطالب بالكامل</label>
                  <input 
                    type="text" 
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="مثال: أحمد عبد الله محمد"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 text-xs font-semibold mb-1.5">رقم تليفون الطالب</label>
                    <input 
                      type="tel" 
                      value={studentPhone}
                      onChange={(e) => setStudentPhone(e.target.value)}
                      placeholder="01012345678"
                      className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 text-xs font-semibold mb-1.5">رقم تليفون ولي الأمر</label>
                    <input 
                      type="tel" 
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      placeholder="01112223344"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-xs font-semibold mb-1.5">النوع (الجنْس)</label>
                  <div className="flex gap-4 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-slate-800">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300 font-bold">
                      <input 
                        type="radio" 
                        name="studentGender" 
                        value="male"
                        checked={studentGender === 'male'}
                        onChange={() => setStudentGender('male')}
                        className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-505"
                      />
                      <span>ذكر ♂</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300 font-bold">
                      <input 
                        type="radio" 
                        name="studentGender" 
                        value="female"
                        checked={studentGender === 'female'}
                        onChange={() => setStudentGender('female')}
                        className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-505"
                      />
                      <span>أنثى ♀</span>
                    </label>
                  </div>
                </div>

                {/* Linking groups checkboxes */}
                <div>
                  <label className="block text-slate-600 text-xs font-semibold mb-1.5">ربط المجموعات الدراسية واختيار الميعاد</label>
                  {groups.length === 0 ? (
                    <p className="text-xs text-amber-600 dark:text-amber-400">لا تتوفر مجموعات بالسنتر لربطها. يرجى إنشاء مجموعات أولاً.</p>
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 max-h-[300px] overflow-y-auto space-y-3 selection:bg-indigo-500/30">
                      {groups.map(g => (
                        <div key={g.id} className="flex flex-col gap-2">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-650 dark:text-slate-300">
                            <input 
                              type="checkbox" 
                              checked={selectedGroups.includes(g.id)}
                              onChange={() => handleGroupCheckboxChange(g.id)}
                              className="w-4 h-4 rounded-sm border-slate-350 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>{g.name} - (قيمة: {g.price} جنيه)</span>
                          </label>
                          {selectedGroups.includes(g.id) && g.schedules && g.schedules.length > 0 && (
                            <div className="mr-6">
                              <select 
                                value={studentGroupSchedules[g.id] || ''} 
                                onChange={(e) => setStudentGroupSchedules(prev => ({ ...prev, [g.id]: e.target.value }))}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
                              >
                                {g.schedules.map((sch, i) => (
                                  <option key={i} value={`${sch.day} ${formatTime12(sch.time)}`}>
                                    {sch.day} - {formatTime12(sch.time)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {!editingStudentId && (
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 text-xs font-semibold mb-1.5">الرصيد المالي المبدئي (اختياري)</label>
                    <input 
                      type="number" 
                      value={studentBalance}
                      onChange={(e) => setStudentBalance(Number(e.target.value))}
                      placeholder="استخدم قيمة سلبية مثل (150-) لترسيم مديونية أولية"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-800 dark:text-slate-200"
                    />
                    <p className="text-[10px] text-slate-400 dark:text-slate-550 mt-1">القيمة الإيجابية تعني مدفوع مقدماً، والقيمة السلبية تعني مديونية متأخرة.</p>
                  </div>
                )}

                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold leading-relaxed">
                    {formError}
                  </div>
                )}

                <button 
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-sm"
                >
                  الحفظ ومزامنة البيانات الكلية
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Student ID ID Card View Modal */}
      <AnimatePresence>
        {activeCardStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-sm w-full p-6 space-y-6 shadow-2xl relative transition-colors"
            >
              <button 
                type="button" 
                onClick={() => setActiveCardStudent(null)}
                className="absolute top-4 left-4 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center pt-2">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">بِطاقة هُوية التعارف الحية</h3>
                <p className="text-slate-400 dark:text-slate-500 text-xs">مسح الكارت ضوئياً لتحضير الطالب تلقائياً.</p>
              </div>

              {/* ID CARD LAYOUT PREVIEW */}
              <div className="bg-gradient-to-tr from-indigo-900 to-indigo-700 text-white rounded-xl p-5 shadow-lg space-y-4 text-right overflow-hidden relative border border-indigo-950">
                <div className="absolute right-[-20px] top-[-20px] w-24 h-24 bg-white/5 rounded-full" />
                
                <div className="flex justify-between items-center border-b border-white/20 pb-2">
                  <span className="font-extrabold text-[11px] tracking-widest text-[#bfdbfe] truncate max-w-[155px]">
                    {centerSettings?.name.toUpperCase() || 'STUDENT ID CARD'}
                  </span>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>

                <div>
                  <h4 className="text-lg font-bold tracking-tight">{activeCardStudent.name}</h4>
                  <div className="bg-indigo-600/60 inline-block px-3 py-0.5 rounded-full text-xs font-mono font-bold mt-1 tracking-wider">
                    ID: {activeCardStudent.code}
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg flex justify-center items-center shadow-inner">
                  {qrCodeDataUrl ? (
                    <img src={qrCodeDataUrl} className="w-36 h-36" alt="QR code" />
                  ) : (
                    <span className="text-slate-400 text-xs">جاري توليد الكود المشفر...</span>
                  )}
                </div>

                <div className="text-[10px] text-indigo-200 space-y-1">
                  <p>تليفون الطالب: <span className="font-bold text-white">{activeCardStudent.phone}</span></p>
                  <p>ولي الأمر: <span className="font-bold text-white">{activeCardStudent.parentPhone}</span></p>
                  {centerSettings && (
                    <p className="pt-2 border-t border-white/10 text-[9px] text-[#bfdbfe]">
                      📍 {centerSettings.address} | 📞 {centerSettings.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Printable Button */}
              <button 
                type="button"
                onClick={handlePrintCard}
                className="w-full bg-[#4F46E5] hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition shadow flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة بطاقة الهوية</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
