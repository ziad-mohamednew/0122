import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Search, 
  ArrowRight,
  BookOpen,
  Download,
  Printer
} from 'lucide-react';
import { Teacher, Group, Student, CenterSettings } from '../types';
import { exportToExcel, exportToPDF } from './utils/exportHelper';

interface TeachersListProps {
  teachers: Teacher[];
  groups: Group[];
  students: Student[];
  settings: CenterSettings;
}

export default function TeachersList({ 
  teachers, 
  groups, 
  students,
  settings 
}: TeachersListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  const filteredTeachers = useMemo(() => {
    if (!searchTerm) return teachers;
    const lowerSearch = searchTerm.toLowerCase();
    return teachers.filter(t => 
      t.name.toLowerCase().includes(lowerSearch) || 
      t.subject.toLowerCase().includes(lowerSearch) ||
      (t.phone && t.phone.includes(lowerSearch))
    );
  }, [teachers, searchTerm]);

  // When a teacher is selected, calculate their report data
  const teacherReportData = useMemo(() => {
    if (!selectedTeacher) return null;

    const teacherGroups = groups.filter(g => g.teacherId === selectedTeacher.id);
    const groupsWithStudentsCount = teacherGroups.map(group => {
      // Find students who have this group's ID in their groupIds array
      const enrolledStudents = students.filter(s => s.groupIds && s.groupIds.includes(group.id));
      return {
        ...group,
        studentsCount: enrolledStudents.length
      };
    });

    const totalStudentsCount = groupsWithStudentsCount.reduce((sum, g) => sum + g.studentsCount, 0);

    return {
      groups: groupsWithStudentsCount,
      totalGroups: teacherGroups.length,
      totalStudents: totalStudentsCount
    };
  }, [selectedTeacher, groups, students]);

  const handleExportPDF = () => {
    if (!selectedTeacher || !teacherReportData) return;

    const headers = ["اسم المجموعة", "المادة", "تكلفة الحصة", "عدد الطلاب المسجلين"];
    const rows = teacherReportData.groups.map(g => [
      g.name,
      g.subject || selectedTeacher.subject,
      `${g.price} جنيه`,
      String(g.studentsCount)
    ]);

    exportToPDF(
      `تقرير تفصيلي للمعلم: ${selectedTeacher.name} - مادة: ${selectedTeacher.subject}`,
      headers,
      rows,
      settings,
      [
        { label: "إجمالي المجموعات", value: String(teacherReportData.totalGroups) },
        { label: "إجمالي الطلاب", value: String(teacherReportData.totalStudents) },
        { label: "نسبة المعلم", value: `${selectedTeacher.commissionRate || 80}%` }
      ]
    );
  };

  const handleExportExcel = () => {
    if (!selectedTeacher || !teacherReportData) return;

    const headers = ["اسم المجموعة", "المادة", "تكلفة الحصة", "عدد الطلاب المسجلين"];
    const rows = teacherReportData.groups.map(g => [
      g.name,
      g.subject || selectedTeacher.subject,
      g.price,
      g.studentsCount
    ]);

    exportToExcel(
      `تقرير تفصيلي للمعلم: ${selectedTeacher.name}`,
      headers,
      rows,
      `تقرير_المعلم_${selectedTeacher.name}_${new Date().toISOString().split('T')[0]}`
    );
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
              <Users className="w-6 h-6" />
            </div>
            ملفات المعلمين وتقاريرهم
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            استعرض المعلمين المسجلين وتقارير أعداد مجموعاتهم وطلابهم
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!selectedTeacher ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Search */}
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center relative">
              <Search className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث عن معلم بالاسم، المادة، أو التليفون..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-12 pl-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Grid of Teachers */}
            {filteredTeachers.length === 0 ? (
              <div className="bg-white p-12 text-center text-slate-400 rounded-2xl border border-slate-100 shadow-sm">
                لم نجد أي معلمين يطابقون بحثك.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTeachers.map(teacher => (
                  <div 
                    key={teacher.id}
                    onClick={() => setSelectedTeacher(teacher)}
                    className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="bg-indigo-50 text-indigo-700 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-2xl">
                          {teacher.gender === 'female' ? '👩‍🏫' : '👨‍🏫'}
                        </div>
                        <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-lg">
                          نسبة {teacher.commissionRate || 80}%
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                        {teacher.name}
                      </h3>
                      <p className="text-slate-500 text-sm mt-1">{teacher.subject}</p>
                      {teacher.phone && (
                        <p className="text-slate-400 text-xs mt-2 font-mono" dir="ltr">
                          {teacher.phone}
                        </p>
                      )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center text-indigo-600 text-sm font-bold">
                      <span>عرض التقرير التفصيلي</span>
                      <ArrowRight className="w-4 h-4 rtl:-scale-x-100 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedTeacher(null)}
                className="bg-white p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
              >
                <ArrowRight className="w-5 h-5 rtl:-scale-x-100" />
              </button>
              <h2 className="text-xl font-bold text-slate-800">
                تقرير المعلم: <span className="text-indigo-600">{selectedTeacher.name}</span>
              </h2>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="bg-purple-100 text-purple-600 p-3 rounded-xl">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">إجمالي المجموعات</p>
                  <p className="text-2xl font-black text-slate-800">{teacherReportData?.totalGroups || 0}</p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="bg-sky-100 text-sky-600 p-3 rounded-xl">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">إجمالي الطلاب المسجلين</p>
                  <p className="text-2xl font-black text-slate-800">{teacherReportData?.totalStudents || 0}</p>
                </div>
              </div>
            </div>

            {/* Report Actions */}
            <div className="flex gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <button
                onClick={handleExportExcel}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                تصدير إكسيل
              </button>
              <button
                onClick={handleExportPDF}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Printer className="w-4 h-4" />
                تصدير PDF
              </button>
            </div>

            {/* Groups Detail Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-800">تفاصيل المجموعات وأعداد الطلاب</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-600">
                    <tr>
                      <th className="px-5 py-4 font-bold">اسم المجموعة</th>
                      <th className="px-5 py-4 font-bold">المادة</th>
                      <th className="px-5 py-4 font-bold">تكلفة الحصة</th>
                      <th className="px-5 py-4 font-bold text-center">أعداد الطلاب المسجلين</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {teacherReportData?.groups.map(group => (
                      <tr key={group.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4 font-medium text-slate-800">{group.name}</td>
                        <td className="px-5 py-4 text-slate-600">{group.subject || selectedTeacher.subject}</td>
                        <td className="px-5 py-4 text-slate-600 font-bold">{group.price} ج.م</td>
                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs">
                            {group.studentsCount} طالب
                          </span>
                        </td>
                      </tr>
                    ))}
                    {teacherReportData?.groups.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                          لا توجد مجموعات مسجلة لهذا المعلم.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
