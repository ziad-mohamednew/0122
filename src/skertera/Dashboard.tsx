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

  const dynamicLateStudents = useMemo(() => {
    if (!hasStudentsAccess || !hasPaymentsAccess) return [];
    
    const today = new Date();
    // Only check if after 15th of month
    if (today.getDate() <= 15) return [];

    const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    const lateList: { student: Student; unPaidGroups: Group[], missingAmount: number }[] = [];

    students.filter(s => s.status === 'active' && s.groupIds && s.groupIds.length > 0).forEach(student => {
      // Find payments made by this student for this month
      const currentMonthPayments = payments.filter(p => p.studentId === student.id && p.months && p.months.includes(currentYearMonth));
      
      if (currentMonthPayments.length === 0) {
        const unPaidGroups = groups.filter(g => student.groupIds.includes(g.id));
        if (unPaidGroups.length > 0) {
          const missingAmount = unPaidGroups.reduce((acc, g) => acc + g.price, 0);
          lateList.push({ student, unPaidGroups, missingAmount });
        }
      }
    });

    return lateList;
  }, [students, payments, groups, hasStudentsAccess, hasPaymentsAccess]);

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs transition-colors">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">نظرة عامة والتحليلات الحية</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">متابعة الأداء المالي، حضور الطلاب، وإحصائيات المجموعات لحظة بلحظة.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-xl text-slate-600 dark:text-slate-350 text-sm font-medium border border-slate-100 dark:border-slate-850 transition-colors">
          <Calendar className="w-4 h-4 text-emerald-500" />
          <span>تاريخ اليوم: {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Grid Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue Card */}
        <motion.div 
          variants={itemVariants}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs relative overflow-hidden transition-colors"
        >
          <div className="flex justify-between items-start">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">إجمالي الإيرادات المحصلة</span>
            <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 p-1.5 rounded-lg border border-emerald-250 dark:border-emerald-900/50">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {totalRevenue.toLocaleString('ar-EG')}
            </span>
            <span className="text-slate-400 dark:text-slate-500 font-medium text-[10px]">جنيه مصري</span>
          </div>
          <p className="mt-2 text-[10px] text-emerald-600 dark:text-emerald-450 font-medium flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>مزامنة تلقائية سحابية</span>
          </p>
        </motion.div>

        {/* Students Card */}
        <motion.div 
          variants={itemVariants}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs relative overflow-hidden transition-colors"
        >
          <div className="flex justify-between items-start">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">الطلاب النشطين بالسنتر</span>
            <div className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 p-1.5 rounded-lg border border-indigo-200 dark:border-indigo-900/50">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{totalStudents}</span>
            <span className="text-slate-400 dark:text-slate-500 font-medium text-[10px]">طالب مسجل</span>
          </div>
          <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>بكامل القوة الاستيعابية</span>
          </p>
        </motion.div>

        {/* Active Groups Card */}
        <motion.div 
          variants={itemVariants}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs relative overflow-hidden transition-colors"
        >
          <div className="flex justify-between items-start">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">المجموعات التعليمية</span>
            <div className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 p-1.5 rounded-lg border border-amber-200 dark:border-amber-900/50">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{activeGroups}</span>
            <span className="text-slate-400 dark:text-slate-500 font-medium text-[10px]">مجموعة نشطة</span>
          </div>
          <p className="mt-2 text-[10px] text-amber-600 dark:text-amber-450 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>مواعيد أسبوعية متعددة</span>
          </p>
        </motion.div>

        {/* Payments Defaults Card */}
        <motion.div 
          variants={itemVariants}
          className={`p-4 rounded-xl border shadow-2xs relative overflow-hidden transition-colors ${
            totalDuesAndLates.count > 0 
              ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/40' 
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">الاشتراكات المتأخرة</span>
            <div className={`p-1.5 rounded-lg border ${totalDuesAndLates.count > 0 ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-350 border-rose-300 dark:border-rose-800' : 'bg-slate-50 dark:bg-slate-800 text-slate-550 dark:text-slate-400 border-slate-205 dark:border-slate-700'}`}>
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1">
            <span className={`text-2xl font-bold tracking-tight ${totalDuesAndLates.count > 0 ? 'text-rose-700 dark:text-rose-450' : 'text-slate-900 dark:text-white'}`}>
              {totalDuesAndLates.amount.toLocaleString('ar-EG')}
            </span>
            <span className="text-slate-400 dark:text-slate-350 font-medium text-[10px]">جنيه مديونية</span>
          </div>
          <p className="mt-2 text-[10px] text-rose-700 dark:text-rose-400 flex items-center gap-1 font-semibold">
            <span>{totalDuesAndLates.count} طلاب متأخرين</span>
          </p>
        </motion.div>

      </div>

      {/* Primary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Teachers stats and Subject Distributions */}
        <motion.div variants={itemVariants} className="lg:col-span-4 space-y-6">
          
          {/* Subjects stats */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs transition-colors">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base mb-4">كثافة المجموعات حسب المادة</h3>
            {subjectDistribution.length === 0 ? (
              <p className="text-slate-400 dark:text-slate-500 text-center py-6 text-sm">لا توجد مجموعات مسجلة بعد</p>
            ) : (
              <div className="space-y-4">
                {subjectDistribution.map(({ subject, count }) => {
                  const percent = Math.min(100, Math.round((count / activeGroups) * 100));
                  return (
                    <div key={subject} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <span>{subject}</span>
                        <span>{count} مجموعة ({percent}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-500" 
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
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs transition-colors">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">مستحقات المدرسين (من الحصص الشغالة)</h3>
              <Award className="w-5 h-5 text-amber-500" />
            </div>
            {teacherStats.length === 0 ? (
              <p className="text-slate-400 dark:text-slate-500 text-center py-6 text-sm">لا يتوفر معلمون مسجلون بعد</p>
            ) : (
              <div className="space-y-3">
                {teacherStats.map((teacher, index) => (
                  <div key={teacher.name} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-550/5 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        index === 0 
                          ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{teacher.name}</p>
                        <span className="text-slate-400 dark:text-slate-550 text-xs">{teacher.subject}</span>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                        {Math.round(teacher.earned).toLocaleString('ar-EG')} جنيه
                      </p>
                      <span className="text-slate-400 dark:text-slate-500 text-[10px]">مستحق معلم</span>
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
            <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-linear-to-l from-indigo-50/15 dark:from-indigo-950/20">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">آخر عمليات التحصيل المالي</h3>
                <p className="text-slate-500 dark:text-slate-450 text-xs mt-1">عرض الإيصالات والدفعات الأخيرة المدخلة إلى السنتر.</p>
              </div>
              <button 
                onClick={() => onNavigate('payments')}
                className="text-[#4F46E5] dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-xs font-bold transition-colors"
              >
                دفتر الحسابات ←
              </button>
            </div>
            
            {recentPayments.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                لا توجد مدفوعات مسجلة اليوم. ابدأ بتسجيل السداد لتحديث الإحصاءات.
              </div>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {recentPayments.map((p) => (
                  <div key={p.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-extrabold text-sm border border-emerald-200 dark:border-emerald-900/40">
                        💵
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{p.studentName}</p>
                        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs mt-1">
                          <span>{p.notes || "دفع اشتراك شهري"}</span>
                          <span>•</span>
                          <span>{new Date(p.timestamp).toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-450 text-xs font-bold px-3 py-1 rounded-full border border-emerald-250/30">
                        +{p.amount} جنيه
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Late payments alerts list */}
          <div className={`rounded-2xl border shadow-xs overflow-hidden transition-colors ${dynamicLateStudents.length > 0 ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
            <div className={`p-6 border-b flex justify-between items-center ${dynamicLateStudents.length > 0 ? 'border-rose-100 dark:border-rose-900/50 bg-linear-to-l from-rose-100/50 dark:from-rose-900/30' : 'border-slate-50 dark:border-slate-800 bg-linear-to-l from-rose-50/15 dark:from-rose-950/20'}`}>
              <div>
                <h3 className={`font-bold text-base ${dynamicLateStudents.length > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-805 dark:text-rose-400'}`}>
                  المتأخرين عن الدفع للشهر الحالي (رصد تلقائي)
                </h3>
                <p className={`text-xs mt-1 ${dynamicLateStudents.length > 0 ? 'text-rose-600 dark:text-rose-400/80 font-semibold' : 'text-slate-500 dark:text-slate-455'}`}>
                  {dynamicLateStudents.length > 0 
                    ? `تنبيه: لقد تجاوزنا يوم 15 من الشهر الحالي وهناك ${dynamicLateStudents.length} طلاب مسجلين بمجموعات لم يسددوا اشتراكاتهم!`
                    : 'الطلاب المتأخرين عن الدفع يتم رصدهم تلقائياً بعد يوم 15 من كل شهر.'}
                </p>
              </div>
              <button 
                onClick={() => onNavigate('payments')}
                className="text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 text-xs font-bold transition-colors"
              >
                إدارة المدفوعات ←
              </button>
            </div>

            {dynamicLateStudents.length === 0 ? (
              <div className="p-8 text-center text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
                🎉 لا توجد متأخرات للشهر الحالي حتى الآن!
              </div>
            ) : (
              <div className="divide-y divide-rose-100 dark:divide-rose-900/30 max-h-[300px] overflow-y-auto">
                {dynamicLateStudents.map(({ student, unPaidGroups, missingAmount }) => (
                  <div key={student.id} className="p-4 flex justify-between items-center hover:bg-rose-100/50 dark:hover:bg-rose-900/20 transition-colors">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{student.name}</p>
                      <div className="flex gap-4 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        <span>مجموعات غير مسددة: {unPaidGroups.map(g => g.name).join('، ')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 font-bold px-2.5 py-1 rounded-lg text-xs border border-rose-200/50">
                        {missingAmount} جنيه مستحق
                      </span>
                      <a 
                        href={`https://wa.me/2${student.parentPhone}?text=${encodeURIComponent(
                          `السلام عليكم ورحمة الله وبركاته، نود تنبيهكم بأن الطالب(ة) ${student.name} لم يقم بسداد قيمة اشتراك الشهر الحالي للمجموعات (${unPaidGroups.map(g => g.name).join('، ')}) بقيمة ${missingAmount} جنيه مصري. يرجى التكرم بالسداد في أقرب وقت. شكراً لتعاونكم.`
                        )}`}
                        target="_blank"
                        rel="referrer"
                        className="bg-rose-600 hover:bg-rose-700 text-white p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                        title="إرسال تذكير عبر واتساب"
                      >
                         تنبيه ولي الأمر
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Legacy Negative Balance alert */}
          {students.filter(s => s.balance < 0).length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
              <div className="p-4 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-linear-to-l from-amber-50/15 dark:from-amber-950/20">
                <h3 className="font-bold text-amber-700 dark:text-amber-500 text-sm">أرصدة سلبية أخرى (مرحلة سابقة)</h3>
              </div>
              <div className="divide-y divide-slate-50 dark:divide-slate-800 max-h-[200px] overflow-y-auto">
                {students.filter(s => s.balance < 0).map((s) => (
                  <div key={s.id} className="p-3 flex justify-between items-center hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{s.name}</p>
                    </div>
                    <span className="bg-amber-100/70 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-bold px-2 py-0.5 rounded text-xs border border-amber-200/40">
                      {s.balance} جنيه
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}


        </motion.div>

      </div>
    </motion.div>
  );
}
