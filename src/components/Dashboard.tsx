import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Layers, 
  TrendingUp, 
  AlertCircle, 
  DollarSign, 
  Award, 
  ArrowUpRight, 
  Calendar,
  Clock
} from 'lucide-react';
import { Student, Group, Teacher, Payment } from '../types';

interface DashboardProps {
  students: Student[];
  groups: Group[];
  teachers: Teacher[];
  payments: Payment[];
  onNavigate: (tab: string) => void;
  currentSecretary?: any;
}

export default function Dashboard({ students, groups, teachers, payments, onNavigate, currentSecretary }: DashboardProps) {
  const hasStudentsAccess = !currentSecretary || currentSecretary.permissions?.students;
  const hasGroupsAccess = !currentSecretary || currentSecretary.permissions?.groups;
  const hasPaymentsAccess = !currentSecretary || currentSecretary.permissions?.payments;

  // Metric Calculators
  const totalStudents = hasStudentsAccess ? students.filter(s => s.status === 'active').length : 0;
  const activeGroups = hasGroupsAccess ? groups.length : 0;
  const totalTeachers = hasGroupsAccess ? teachers.length : 0;

  const totalRevenue = useMemo(() => {
    if (!hasPaymentsAccess) return 0;
    return payments.reduce((acc, pay) => acc + pay.amount, 0);
  }, [payments, hasPaymentsAccess]);

  const totalDuesAndLates = useMemo(() => {
    if (!hasStudentsAccess || !hasPaymentsAccess) return { count: 0, amount: 0 };
    const defaultStudents = students.filter(s => s.balance < 0);
    const totalDues = defaultStudents.reduce((acc, s) => acc + s.balance, 0);
    return {
      count: defaultStudents.length,
      amount: Math.abs(totalDues)
    };
  }, [students, hasStudentsAccess, hasPaymentsAccess]);

  // Statistics for subject distribution
  const subjectDistribution = useMemo(() => {
    if (!hasGroupsAccess) return [];
    const subjectsMap: { [key: string]: number } = {};
    groups.forEach(g => {
      subjectsMap[g.subject] = (subjectsMap[g.subject] || 0) + 1;
    });
    return Object.entries(subjectsMap).map(([subject, count]) => ({
      subject,
      count
    }));
  }, [groups, hasGroupsAccess]);

  // Calculate teacher share (using teacher commission rate)
  const teacherStats = useMemo(() => {
    if (!hasGroupsAccess || !hasPaymentsAccess) return [];
    const earningsByTeacher: { [id: string]: { name: string; earned: number; subject: string } } = {};
    
    // Initialize teachers
    teachers.forEach(t => {
      earningsByTeacher[t.id] = { name: t.name, earned: 0, subject: t.subject };
    });

    // Accumulate from payments
    payments.forEach(p => {
      if (p.teacherIds && p.teacherIds.length > 0) {
        const splitAmount = p.amount / p.teacherIds.length;
        p.teacherIds.forEach(tId => {
          if (earningsByTeacher[tId]) {
            const commission = (splitAmount * (teachers.find(t => t.id === tId)?.commissionRate || 100)) / 100;
            earningsByTeacher[tId].earned += commission;
          }
        });
      }
    });

    return Object.values(earningsByTeacher).sort((a, b) => b.earned - a.earned);
  }, [payments, teachers, hasGroupsAccess, hasPaymentsAccess]);

  const recentPayments = useMemo(() => {
    if (!hasPaymentsAccess) return [];
    return [...payments]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  }, [payments, hasPaymentsAccess]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <motion.div 
      className="space-y-6 text-right"
      variants={containerVariants}
      initial="hidden"
      animate="show"
      dir="rtl"
    >
      {/* Title & Date */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">نظرة عامة والتحليلات الحية</h1>
          <p className="text-slate-500 text-sm mt-1">متابعة الأداء المالي، حضور الطلاب، وإحصائيات المجموعات لحظة بلحظة.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl text-slate-600 text-sm font-medium border border-slate-100">
          <Calendar className="w-4 h-4 text-emerald-500" />
          <span>تاريخ اليوم: {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Grid Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Revenue Card */}
        <motion.div 
          variants={itemVariants}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs relative overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <span className="text-slate-500 text-xs font-semibold">إجمالي الإيرادات المحصلة</span>
            <div className="bg-emerald-50 text-emerald-700 p-1.5 rounded-lg border border-emerald-250">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {totalRevenue.toLocaleString('ar-EG')}
            </span>
            <span className="text-slate-400 font-medium text-[10px]">جنيه مصري</span>
          </div>
          <p className="mt-2 text-[10px] text-emerald-600 font-medium flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>مزامنة تلقائية سحابية</span>
          </p>
        </motion.div>

        {/* Students Card */}
        <motion.div 
          variants={itemVariants}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs relative overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <span className="text-slate-500 text-xs font-semibold">الطلاب النشطين بالسنتر</span>
            <div className="bg-indigo-50 text-indigo-700 p-1.5 rounded-lg border border-indigo-200">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">{totalStudents}</span>
            <span className="text-slate-400 font-medium text-[10px]">طالب مسجل</span>
          </div>
          <p className="mt-2 text-[10px] text-slate-500 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>بكامل القوة الاستيعابية</span>
          </p>
        </motion.div>

        {/* Active Groups Card */}
        <motion.div 
          variants={itemVariants}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs relative overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <span className="text-slate-500 text-xs font-semibold">المجموعات التعليمية</span>
            <div className="bg-amber-50 text-amber-700 p-1.5 rounded-lg border border-amber-200">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">{activeGroups}</span>
            <span className="text-slate-400 font-medium text-[10px]">مجموعة نشطة</span>
          </div>
          <p className="mt-2 text-[10px] text-amber-600 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>مواعيد أسبوعية متعددة</span>
          </p>
        </motion.div>

        {/* Payments Defaults Card */}
        <motion.div 
          variants={itemVariants}
          className={`p-4 rounded-xl border shadow-2xs relative overflow-hidden transition-colors ${
            totalDuesAndLates.count > 0 
              ? 'bg-rose-50 border-rose-300' 
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-slate-500 text-xs font-semibold">الاشتراكات المتأخرة</span>
            <div className={`p-1.5 rounded-lg border ${totalDuesAndLates.count > 0 ? 'bg-rose-100 text-rose-700 border-rose-300' : 'bg-slate-50 text-slate-550 border-slate-205'}`}>
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1">
            <span className={`text-2xl font-bold tracking-tight ${totalDuesAndLates.count > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
              {totalDuesAndLates.amount.toLocaleString('ar-EG')}
            </span>
            <span className="text-slate-400 font-medium text-[10px]">جنيه مديونية</span>
          </div>
          <p className="mt-2 text-[10px] text-rose-700 flex items-center gap-1 font-semibold">
            <span>{totalDuesAndLates.count} طلاب متأخرين</span>
          </p>
        </motion.div>

      </div>

      {/* Primary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Teachers stats and Subject Distributions */}
        <motion.div variants={itemVariants} className="lg:col-span-4 space-y-6">
          
          {/* Subjects stats */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
            <h3 className="font-bold text-slate-800 text-base mb-4">كثافة المجموعات حسب المادة</h3>
            {subjectDistribution.length === 0 ? (
              <p className="text-slate-400 text-center py-6 text-sm">لا توجد مجموعات مسجلة بعد</p>
            ) : (
              <div className="space-y-4">
                {subjectDistribution.map(({ subject, count }) => {
                  const percent = Math.min(100, Math.round((count / activeGroups) * 100));
                  return (
                    <div key={subject} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-600">
                        <span>{subject}</span>
                        <span>{count} مجموعة ({percent}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Leaders board / Teachers Financial balances */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 text-base">مستحقات المدرسين (من الحصص الشغالة)</h3>
              <Award className="w-5 h-5 text-amber-500" />
            </div>
            {teacherStats.length === 0 ? (
              <p className="text-slate-400 text-center py-6 text-sm">لا يتوفر معلمون مسجلون بعد</p>
            ) : (
              <div className="space-y-3">
                {teacherStats.map((teacher, index) => (
                  <div key={teacher.name} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        index === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{teacher.name}</p>
                        <span className="text-slate-400 text-xs">{teacher.subject}</span>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-700 text-sm">
                        {Math.round(teacher.earned).toLocaleString('ar-EG')} جنيه
                      </p>
                      <span className="text-slate-400 text-[10px]">مستحق معلم</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </motion.div>

        {/* Right: Recent transaction list & Late payers panel */}
        <motion.div variants={itemVariants} className="lg:col-span-8 space-y-6">
          
          {/* Recent Operations log */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-linear-to-l from-indigo-50/15">
              <div>
                <h3 className="font-bold text-slate-800 text-base">آخر عمليات التحصيل المالي</h3>
                <p className="text-slate-500 text-xs mt-1">عرض الإيصالات والدفعات الأخيرة المدخلة إلى السنتر.</p>
              </div>
              <button 
                onClick={() => onNavigate('payments')}
                className="text-[#4F46E5] hover:text-indigo-800 text-xs font-bold transition-colors"
              >
                دفتر الحسابات ←
              </button>
            </div>
            
            {recentPayments.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                لا توجد مدفوعات مسجلة اليوم. ابدأ بتسجيل السداد لتحديث الإحصاءات.
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {recentPayments.map((p) => (
                  <div key={p.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-extrabold text-sm">
                        💵
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{p.studentName}</p>
                        <div className="flex items-center gap-2 text-slate-400 text-xs mt-1">
                          <span>{p.notes || "دفع اشتراك شهري"}</span>
                          <span>•</span>
                          <span>{new Date(p.timestamp).toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">
                        +{p.amount} جنيه
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Late payments alerts list */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-linear-to-l from-rose-50/15">
              <div>
                <h3 className="font-bold text-slate-800 text-base text-rose-700">الطلاب المتأخرين عن الدفع (مطلوب مراجعتهم)</h3>
                <p className="text-slate-500 text-xs mt-1">الطلاب ذوي الأرصدة السلبية الذين بحاجة إلى تذكير بالدفع.</p>
              </div>
              <button 
                onClick={() => onNavigate('students')}
                className="text-rose-600 hover:text-rose-800 text-xs font-bold transition-colors"
              >
                إدارة ملفات الطلاب ←
              </button>
            </div>

            {students.filter(s => s.balance < 0).length === 0 ? (
              <div className="p-8 text-center text-emerald-600 text-sm font-semibold">
                🎉 جميع الطلاب المسجلين قاموا بسداد مستحقاتهم بالكامل!
              </div>
            ) : (
              <div className="divide-y divide-slate-50 max-h-[300px] overflow-y-auto">
                {students.filter(s => s.balance < 0).map((s) => (
                  <div key={s.id} className="p-4 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{s.name}</p>
                      <div className="flex gap-4 text-xs text-slate-400 mt-1">
                        <span>كود الطالب: {s.code}</span>
                        <span>•</span>
                        <span>هاتف ولي الأمر: {s.parentPhone}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="bg-rose-100/70 text-rose-700 font-bold px-2.5 py-1 rounded-lg text-sm">
                        {s.balance} جنيه
                      </span>
                      <a 
                        href={`https://wa.me/2${s.parentPhone}?text=${encodeURIComponent(
                          `السلام عليكم ورحمة الله وبركاته، نود تذكيركم بأن الطالب(ة) ${s.name} لديه متأخرات سداد في السنتر التعليمي بقيمة ${Math.abs(s.balance)} جنيه مصري. يرجى التكرم بالسداد في أقرب وقت. شكراً لكم.`
                        )}`}
                        target="_blank"
                        rel="referrer"
                        className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                        title="إرسال تذكير عبر واتساب"
                      >
                        📞 تذكير
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </motion.div>

      </div>
    </motion.div>
  );
}
