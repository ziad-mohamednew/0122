import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Users, 
  User, 
  FileText, 
  Plus, 
  Trash2, 
  Search, 
  Printer, 
  Download, 
  Copy, 
  Check, 
  Percent,
  Calculator,
  UserCheck
} from 'lucide-react';
import { Payment, Teacher, Student, Secretary, Expense, CenterSettings } from '../types';
import { exportToExcel, exportToPDF } from './utils/exportHelper';

interface FinancialReportsProps {
  payments: Payment[];
  teachers: Teacher[];
  students: Student[];
  secretaries: Secretary[];
  expenses: Expense[];
  centerSettings?: CenterSettings;
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  showConfirm?: (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }) => void;
}

export default function FinancialReports({
  payments = [],
  teachers = [],
  students = [],
  secretaries = [],
  expenses = [],
  centerSettings,
  onAddExpense,
  onDeleteExpense,
  showConfirm
}: FinancialReportsProps) {
  // Tabs: 'reports' | 'manage_expenses'
  const [subTab, setSubTab] = useState<'reports' | 'expenses'>('reports');

  // Timeframe type: 'day' | 'range' | 'month' | 'custom'
  const [timeframeType, setTimeframeType] = useState<'day' | 'range' | 'month' | 'custom'>('month');
  
  // Timeframe values
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM
  const [selectedDay, setSelectedDay] = useState(todayStr);
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);

  // Report type: 'center' | 'teacher' | 'secretary' | 'student'
  const [reportType, setReportType] = useState<'center' | 'teacher' | 'secretary' | 'student'>('center');
  
  // Specific Entity ID
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedSecretaryId, setSelectedSecretaryId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // Search filter for students selector in dropdown
  const [studentSearch, setStudentSearch] = useState('');

  // Expense form state
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(todayStr);
  const [expenseCategory, setExpenseCategory] = useState('utilities');
  const [expenseNotes, setExpenseNotes] = useState('');
  const [expenseTeacherId, setExpenseTeacherId] = useState('');
  const [expenseError, setExpenseError] = useState('');

  // Toast / Copy feedback
  const [copied, setCopied] = useState(false);

  // Add General Expense handler
  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim()) {
      setExpenseError('⚠️ الرجاء إدخال بيان أو اسم المصروف.');
      return;
    }
    const amountVal = Number(expenseAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      setExpenseError('⚠️ الرجاء تحديد قيمة مالية صالحة أكبر من الصفر.');
      return;
    }
    setExpenseError('');

    const newExp: Expense = {
      id: `exp-${Date.now()}`,
      title: expenseTitle.trim(),
      amount: amountVal,
      date: expenseDate,
      category: expenseCategory,
      notes: expenseNotes.trim() || undefined,
      teacherId: expenseTeacherId || undefined,
      timestamp: new Date().toISOString()
    };

    onAddExpense(newExp);

    // Reset Form
    setExpenseTitle('');
    setExpenseAmount('');
    setExpenseDate(todayStr);
    setExpenseCategory('utilities');
    setExpenseNotes('');
    setExpenseTeacherId('');
  };

  // Helper date utility to verify if transaction falls in chosen timeframe
  const isDateInTimeframe = (dateInput: string) => {
    const d = dateInput.substring(0, 10); // YYYY-MM-DD
    switch (timeframeType) {
      case 'day':
        return d === selectedDay;
      case 'range':
      case 'custom':
        return d >= startDate && d <= endDate;
      case 'month':
        return d.substring(0, 7) === selectedMonth;
      default:
        return true;
    }
  };

  // Filter students by code or name for selector list
  const filteredStudentsForDropdown = useMemo(() => {
    if (!studentSearch.trim()) return students.slice(0, 50); // limit to 50 for speed
    return students.filter(s => 
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
      s.code.includes(studentSearch)
    );
  }, [students, studentSearch]);

  // CORE COMPUTATION: Ledger Rows based on Filters
  const ledgerResult = useMemo(() => {
    let rows: any[] = [];
    let totRevenue = 0;
    let totExpense = 0;

    // Time-filtered raw data
    const filteredPayments = payments.filter(p => isDateInTimeframe(p.date));
    const filteredExpenses = expenses.filter(e => isDateInTimeframe(e.date));

    if (reportType === 'center') {
      // 1. INCOMES: student payments
      filteredPayments.forEach(p => {
        totRevenue += p.amount;
        rows.push({
          id: p.id,
          date: p.date,
          type: 'إيراد تحصيل',
          typeName: 'إيراد للسنتر',
          description: `دفعة مخصصة للطالب: ${p.studentName} - ${p.notes}`,
          amountIncome: p.amount,
          amountExpense: 0,
          operator: p.operatorName || 'المدير العام',
          rawTimestamp: p.timestamp
        });
      });

      // 2. EXPENSES A: General logged center expenses
      filteredExpenses.forEach(e => {
        totExpense += e.amount;
        let catLabel = 'مصروف تشغيل';
        if (e.category === 'rent') catLabel = 'إيجار القاعة';
        if (e.category === 'salary') catLabel = 'مرتبات سكرتارية';
        if (e.category === 'utilities') catLabel = 'فواتير ومرافق العامة';
        
        rows.push({
          id: e.id,
          date: e.date,
          type: 'مصروف عام',
          typeName: catLabel,
          description: `${e.title} ${e.notes ? `(${e.notes})` : ''}`,
          amountIncome: 0,
          amountExpense: e.amount,
          operator: e.operatorName || 'المدير العام',
          rawTimestamp: e.timestamp
        });
      });

      // 3. EXPENSES B: Teachers commission/share payouts represent center costs
      filteredPayments.forEach(p => {
        if (p.teacherIds && p.teacherIds.length > 0) {
          const splitBase = p.amount / p.teacherIds.length;
          p.teacherIds.forEach(tId => {
            const tr = teachers.find(t => t.id === tId);
            if (tr) {
              const commission = (splitBase * tr.commissionRate) / 100;
              totExpense += commission;
              rows.push({
                id: `${p.id}-${tId}`,
                date: p.date,
                type: 'حصة معلم',
                typeName: 'مصاريف حصص تدريس',
                description: `مستحقات المعلم (${tr.name}) من دفعة الطالب ${p.studentName}`,
                amountIncome: 0,
                amountExpense: commission,
                operator: p.operatorName || 'المدير العام',
                rawTimestamp: p.timestamp
              });
            }
          });
        }
      });
    }

    else if (reportType === 'teacher') {
      const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);
      if (selectedTeacher) {
        // Teacher Ledger: Students payments share
        filteredPayments.forEach(p => {
          if (p.teacherIds && p.teacherIds.includes(selectedTeacherId)) {
            const splitBase = p.amount / p.teacherIds.length;
            const teacherCommission = (splitBase * selectedTeacher.commissionRate) / 100;
            const centerShare = splitBase - teacherCommission;

            totRevenue += splitBase;
            totExpense += centerShare;

            rows.push({
              id: p.id,
              date: p.date,
              type: 'حصة تدريسية',
              typeName: `اشتراك ${p.months.join(', ')}`,
              description: `تحصيل من الطالب: ${p.studentName} - المقسم بالتساوي`,
              amountIncome: splitBase, // Total split share of payment
              amountExpense: centerShare, // Expense is what the center retained (Platform cut)
              netTeacherShare: teacherCommission, // Net profit for teacher
              operator: p.operatorName || 'المدير العام',
              rawTimestamp: p.timestamp
            });
          }
        });
      }
    }

    else if (reportType === 'secretary') {
      const selectedSecObj = secretaries.find(s => s.id === selectedSecretaryId);
      const targetSecName = selectedSecObj ? selectedSecObj.name : '';
      
      if (targetSecName) {
        // Secretary cash register: Payments handled by this secretary
        filteredPayments.forEach(p => {
          if (p.operatorName === targetSecName) {
            totRevenue += p.amount;
            rows.push({
              id: p.id,
              date: p.date,
              type: 'تحصيل نقدي',
              typeName: 'إيصال مالي',
              description: `مقبوضات من الطالب: ${p.studentName} - ببيان ${p.notes}`,
              amountIncome: p.amount,
              amountExpense: 0,
              operator: targetSecName,
              rawTimestamp: p.timestamp
            });
          }
        });

        // Also if any expenses were logged specifically by this secretary?
        filteredExpenses.forEach(e => {
          if (e.operatorName === targetSecName) {
            totExpense += e.amount;
            rows.push({
              id: e.id,
              date: e.date,
              type: 'صرف خارجي',
              typeName: 'مصروف مسجل',
              description: `${e.title} - ${e.notes || 'بدون تفاصيل'}`,
              amountIncome: 0,
              amountExpense: e.amount,
              operator: targetSecName,
              rawTimestamp: e.timestamp
            });
          }
        });
      }
    }

    else if (reportType === 'student') {
      const selectedStudent = students.find(s => s.id === selectedStudentId);
      if (selectedStudent) {
        // Student's transaction records: Payments made
        filteredPayments.forEach(p => {
          if (p.studentId === selectedStudentId) {
            totRevenue += p.amount;
            rows.push({
              id: p.id,
              date: p.date,
              type: 'تحصيل سداد',
              typeName: `اشتراك شهري`,
              description: `سداد قيمة التدريس - ${p.notes}`,
              amountIncome: p.amount,
              amountExpense: 0,
              operator: p.operatorName || 'المدير العام',
              rawTimestamp: p.timestamp
            });
          }
        });
      }
    }

    // Sort chronologically (oldest to newest or vice versa)
    // Let's sort oldest first for ledger cumulative balance, or newest first. Let's do oldest first!
    rows.sort((a, b) => {
      const diffDate = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (diffDate !== 0) return diffDate;
      return new Date(a.rawTimestamp).getTime() - new Date(b.rawTimestamp).getTime();
    });

    // Compute cumulative balance
    let cumulative = 0;
    const finalRows = rows.map(r => {
      if (reportType === 'teacher') {
        // For teacher, net is they received netTeacherShare
        cumulative += r.netTeacherShare;
        return { ...r, cumulativeBalance: cumulative };
      } else {
        cumulative += (r.amountIncome - r.amountExpense);
        return { ...r, cumulativeBalance: cumulative };
      }
    });

    return {
      rows: finalRows,
      totalRevenue: reportType === 'teacher' ? totRevenue : totRevenue,
      totalExpense: reportType === 'teacher' ? totExpense : totExpense,
      netProfit: reportType === 'teacher' ? cumulative : (totRevenue - totExpense)
    };
  }, [payments, expenses, teachers, secretaries, students, timeframeType, selectedDay, startDate, endDate, selectedMonth, reportType, selectedTeacherId, selectedSecretaryId, selectedStudentId]);

  // Filter timeframe text helper for printing
  const getTimeframeTextLabel = () => {
    switch (timeframeType) {
      case 'day':
        return `ليوم: ${selectedDay}`;
      case 'range':
      case 'custom':
        return `من تاريخ: ${startDate} إلى تاريخ: ${endDate}`;
      case 'month':
        return `لشهر: ${selectedMonth}`;
      default:
        return 'لكل الفترات المسجلة';
    }
  };

  // Filter report target text helper for printing
  const getReportTargetTextLabel = () => {
    switch (reportType) {
      case 'center':
        return 'كشف الحساب الكلي والشامل للسنتر';
      case 'teacher':
        const tr = teachers.find(t => t.id === selectedTeacherId);
        return `كشف حساب المعلم: ${tr ? tr.name : 'مجهول'}`;
      case 'secretary':
        const sec = secretaries.find(s => s.id === selectedSecretaryId);
        return `كشف حركة الخزينة للسكرتير: ${sec ? sec.name : 'مجهول'}`;
      case 'student':
        const std = students.find(s => s.id === selectedStudentId);
        return `كشف كشف الحساب المالي للطالب: ${std ? `${std.name} (${std.code})` : 'مجهول'}`;
      default:
        return '';
    }
  };

  // Action: Export Excel
  const handleExportExcelClick = () => {
    const headers = ["التاريخ", "الحركة", "البيان", "المسؤول الأول", "إيراد (+)", "مصروف (-)", "الصافي التراكمي"];
    const rowsConverted = ledgerResult.rows.map(r => [
      r.date,
      r.type + " - " + r.typeName,
      r.description,
      r.operator,
      r.amountIncome || 0,
      r.amountExpense || 0,
      r.cumulativeBalance
    ]);

    exportToExcel(
      `${getReportTargetTextLabel()} - ${getTimeframeTextLabel()}`,
      headers,
      rowsConverted,
      "كشف_حساب_مالي"
    );
  };

  // Action: Print / Export PDF
  const handlePrintPDFClick = () => {
    const headers = ["اليوم والتاريخ", "التأثير المعتمد", "البيان والملحق التوضيحي", "القائم بالعمل", "الإيراد/المقبوض (+)", "المصروف/المنصرف (-)", "الرصيد الجاري"];
    const rowsConverted = ledgerResult.rows.map(r => {
      const inc = reportType === 'teacher' ? (r.amountIncome === r.netTeacherShare ? r.amountIncome : `${r.amountIncome} (حصة)`) : r.amountIncome;
      const exp = reportType === 'teacher' ? r.amountExpense : r.amountExpense;
      return [
        r.date,
        r.type,
        r.description,
        r.operator,
        inc ? `+${inc} ج.م` : '0 ج.م',
        exp ? `-${exp} ج.م` : '0 ج.م',
        `${r.cumulativeBalance} ج.م`
      ];
    });

    const summary = [
      { label: "إجمالي إيرادات تحصيل المجموعات (+)", value: `${ledgerResult.totalRevenue} حنيه مصري` },
      { label: "إجمالي المصروفات وحصص التشغيل (-)", value: `${ledgerResult.totalExpense} جنيه مصري` },
      { label: "صافي الرصيد الجاري بالخزينة (=)", value: `${ledgerResult.netProfit} جنيه مصري` }
    ];

    exportToPDF(
      `${getReportTargetTextLabel()} (${getTimeframeTextLabel()})`,
      headers,
      rowsConverted,
      centerSettings,
      summary
    );
  };

  // Action: Copy table to clipboard in text format
  const handleCopyTable = () => {
    let text = `${getReportTargetTextLabel()} - ${getTimeframeTextLabel()}\n`;
    text += `التاريخ\tالحركة\tالبيان\tالمسؤول\tالإيراد\tالمصروف\tالرصيد\n`;
    ledgerResult.rows.forEach(r => {
      text += `${r.date}\t${r.type}\t${r.description}\t${r.operator}\t${r.amountIncome}\t${r.amountExpense}\t${r.cumulativeBalance}\n`;
    });
    text += `--------------------------------------------------\n`;
    text += `إجمالي الإيرادات: ${ledgerResult.totalRevenue} جنيه | إجمالي المصروفات: ${ledgerResult.totalExpense} جنيه | صافي الرصيد: ${ledgerResult.netProfit} جنيه`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Header Tabs switcher */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">الحسابات والتقارير والتدقيق المالي</h1>
          <p className="text-slate-500 text-sm mt-1">
            إعداد كشوف حسابات تفصيلية احترافية لغايات تدقيق الإيرادات والمصروفات وصافي الأرباح.
          </p>
        </div>

        {/* Sub-tabs buttons */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto self-stretch md:self-auto shrink-0 font-Cairo">
          <button
            type="button"
            onClick={() => setSubTab('reports')}
            className={`flex-1 md:flex-none px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              subTab === 'reports' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>كشوف الحسابات والتقارير</span>
          </button>
          
          <button
            type="button"
            onClick={() => setSubTab('expenses')}
            className={`flex-1 md:flex-none px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              subTab === 'expenses' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4 text-rose-500" />
            <span>تسجيل المصروفات العامة</span>
          </button>
        </div>
      </div>

      {subTab === 'expenses' ? (
        /* ==================== SCREEN: MANAGE GENERAL EXPENSES ==================== */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs h-fit">
            <h3 className="font-extrabold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-rose-600" />
              <span>تسجيل مصروف مالي جديد</span>
            </h3>

            <form onSubmit={handleAddExpenseSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-600 text-xs font-bold mb-1.5">بيان المصروف (الاسم)</label>
                <input 
                  type="text"
                  value={expenseTitle}
                  onChange={e => setExpenseTitle(e.target.value)}
                  placeholder="مثال: فاتورة كهرباء القاعة، إيجار السنتر، إلخ"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 text-xs font-bold mb-1.5">المبلغ المدفوع (جنيه)</label>
                  <input 
                    type="number"
                    value={expenseAmount}
                    onChange={e => setExpenseAmount(e.target.value)}
                    placeholder="250"
                    min="1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-slate-600 text-xs font-bold mb-1.5">نوع المصنف</label>
                  <select
                    value={expenseCategory}
                    onChange={e => setExpenseCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden text-slate-700 font-bold"
                  >
                    <option value="utilities">مرافق وفواتير</option>
                    <option value="rent">إيجارات قاعات</option>
                    <option value="salary">مرتبات ومكافآت</option>
                    <option value="other">مصاريف أخرى عامة</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 text-xs font-bold mb-1.5">تاريخ الصرف</label>
                <input 
                  type="date"
                  value={expenseDate}
                  onChange={e => setExpenseDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 text-xs font-bold mb-1.5">ملاحظات توضيحية إضافية</label>
                <textarea 
                  rows={2}
                  value={expenseNotes}
                  onChange={e => setExpenseNotes(e.target.value)}
                  placeholder="أكتب ملاحظات أو أرقام المستندات الورقية هنا..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 text-xs font-bold mb-1.5">ربط بالمدرس (اختياري)</label>
                <select
                  value={expenseTeacherId}
                  onChange={e => setExpenseTeacherId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden text-slate-700 font-bold"
                >
                  <option value="">-- مصروف عام للسنتر --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>
                  ))}
                </select>
              </div>

              {expenseError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold">
                  {expenseError}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة المصروف الآن</span>
              </button>
            </form>
          </div>

          {/* Expenses List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
              <h3 className="font-extrabold text-slate-800 pb-3 mb-4 border-b border-slate-50">المصروفات السابقة المسجلة</h3>

              {expenses.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  لا توجد أي مصروفات مسجلة في قاعدة البيانات حالياً.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-slate-600 text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-100">
                        <th className="py-3 px-3 text-right">التاريخ</th>
                        <th className="py-3 px-3 text-right">المصروف</th>
                        <th className="py-3 px-3 text-right">التصنيف</th>
                        <th className="py-3 px-3 text-right">ملاحظات</th>
                        <th className="py-3 px-3 text-left">القيمة</th>
                        <th className="py-3 px-2 text-center">حذف</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map(e => (
                        <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-mono text-slate-500">{e.date}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-800">
                            {e.title}
                            {e.teacherId && (
                              <span className="block text-[10px] text-indigo-500 font-normal mt-0.5">
                                مرتبطة بـ: {teachers.find(t => t.id === e.teacherId)?.name || 'مدرس غير موجود'}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                              e.category === 'rent' ? 'bg-orange-50 text-orange-600' :
                              e.category === 'salary' ? 'bg-indigo-50 text-indigo-600' :
                              e.category === 'utilities' ? 'bg-blue-50 text-blue-600' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {e.category === 'rent' ? 'إيجار' :
                               e.category === 'salary' ? 'مرتبات' :
                               e.category === 'utilities' ? 'مرافق' :
                               'أخرى عامة'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 max-w-xs truncate text-slate-400" title={e.notes}>{e.notes || '-'}</td>
                          <td className="py-2.5 px-3 font-mono font-extrabold text-left text-rose-600">{e.amount} ج.م</td>
                          <td className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                if (showConfirm) {
                                  showConfirm({
                                    title: 'حذف المصروف المالي',
                                    message: `⚠️ هل أنت متأكد من حذف مستند صرف (${e.title}) بقيمة ${e.amount} جنيه من السجلات؟`,
                                    confirmText: 'نعم، احذف',
                                    type: 'danger',
                                    onConfirm: () => onDeleteExpense(e.id)
                                  });
                                } else if (confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
                                  onDeleteExpense(e.id);
                                }
                              }}
                              className="text-slate-300 hover:text-rose-600 p-1 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ==================== SCREEN: FINANCIAL STATEMENTS REPORTS ==================== */
        <div className="space-y-6">
          {/* Controls Panel */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <span>إعدادات ومعايير التصفية والبحث</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* Report Type */}
              <div>
                <label className="block text-slate-600 text-xs font-bold mb-1.5">نوع كشف الحساب المطلوب</label>
                <select
                  value={reportType}
                  onChange={e => {
                    setReportType(e.target.value as any);
                    // Reset dropdown states
                    setSelectedTeacherId('');
                    setSelectedSecretaryId('');
                    setSelectedStudentId('');
                    setStudentSearch('');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 px-2.5 text-xs focus:outline-hidden font-bold text-slate-700"
                >
                  <option value="center">كشف حساب السنتر بالكامل 🏢</option>
                  <option value="teacher">كشف حساب معلم 👨‍🏫</option>
                  <option value="secretary">كشف حساب سكرتير 👤</option>
                  <option value="student">كشف حساب طالب 🎓</option>
                </select>
              </div>

              {/* Timeframe selector */}
              <div>
                <label className="block text-slate-600 text-xs font-bold mb-1.5">المدة الزمنية للتقرير</label>
                <select
                  value={timeframeType}
                  onChange={e => setTimeframeType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 px-2.5 text-xs focus:outline-hidden font-bold text-slate-700"
                >
                  <option value="month">شهر كامل 🗓️</option>
                  <option value="day">يوم محدد 📆</option>
                  <option value="range">عدة أيام (فترة محددة)</option>
                  <option value="custom">فترة مخصصة ممتدة</option>
                </select>
              </div>

              {/* Conditional Inputs based on report type */}
              <div className="md:col-span-2">
                {reportType === 'teacher' && (
                  <div>
                    <label className="block text-slate-600 text-xs font-bold mb-1.5">اختر المعلم من القائمة</label>
                    <select
                      value={selectedTeacherId}
                      onChange={e => setSelectedTeacherId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden text-slate-700 font-bold"
                    >
                      <option value="">-- اختر المعلم لطلب التقرير --</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>
                      ))}
                    </select>
                  </div>
                )}

                {reportType === 'secretary' && (
                  <div>
                    <label className="block text-slate-600 text-xs font-bold mb-1.5">اختر السكرتير أو المساعد</label>
                    <select
                      value={selectedSecretaryId}
                      onChange={e => setSelectedSecretaryId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden text-slate-700 font-bold"
                    >
                      <option value="">-- اختر السكرتير لتدقيق خزينته --</option>
                      {secretaries.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.workspaceType === 'teacher' ? 'مساعد مدرس' : 'قاعة سنتر'})</option>
                      ))}
                    </select>
                  </div>
                )}

                {reportType === 'student' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-600 text-xs font-bold mb-1.5">اكتب اسم أو كود الطالب للبحث</label>
                      <input 
                        type="text"
                        value={studentSearch}
                        onChange={e => setStudentSearch(e.target.value)}
                        placeholder="ابحث بالاسم أو الرقم..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 text-xs font-bold mb-1.5">اختر الطالب المطابق</label>
                      <select
                        value={selectedStudentId}
                        onChange={e => setSelectedStudentId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-hidden text-slate-700 font-bold"
                      >
                        <option value="">-- اختر الطالب --</option>
                        {filteredStudentsForDropdown.map(s => (
                          <option key={s.id} value={s.id}>{s.name} (كود: {s.code})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {reportType === 'center' && (
                  <div className="p-2 py-3 bg-indigo-50/50 rounded-xl border border-indigo-150 text-indigo-700 text-xs font-semibold leading-relaxed">
                    ℹ️ سيقوم هذا التقرير بتحليل شامل لمدخولات السنتر (المقبوضات) مقابل رواتب ومرتبات السكرتارية ومرتكزات حصص المعلمين وكافة المصاريف التشغيلية.
                  </div>
                )}
              </div>

            </div>

            {/* Timeframe input pickers according to timeframeType */}
            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 flex flex-wrap gap-4 items-center">
              <span className="text-slate-600 text-xs font-bold">حدد معيار التاريخ:</span>

              {timeframeType === 'day' && (
                <div className="flex items-center gap-2">
                  <input 
                    type="date"
                    value={selectedDay}
                    onChange={e => setSelectedDay(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                  />
                </div>
              )}

              {timeframeType === 'month' && (
                <div className="flex items-center gap-2">
                  <input 
                    type="month"
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                  />
                </div>
              )}

              {(timeframeType === 'range' || timeframeType === 'custom') && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">من تاريخ</span>
                  <input 
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold"
                  />
                  <span className="text-xs text-slate-400">إلى تاريخ</span>
                  <input 
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Verification / Alert if selection missing */}
          {((reportType === 'teacher' && !selectedTeacherId) || 
            (reportType === 'secretary' && !selectedSecretaryId) || 
            (reportType === 'student' && !selectedStudentId)) ? (
            <div className="bg-amber-50 border border-amber-100 text-amber-800 p-8 text-center rounded-2xl font-bold text-sm">
              🔑 يرجى تحديد الاسم المطلوب لإكمال كشف الحساب وعرض تقارير الحركة المالية.
            </div>
          ) : (
            <>
              {/* Financial Dashboard Widget */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Incomes Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex justify-between items-center relative overflow-hidden">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-400 block">إجمالي المقبوضات والإيرادات (المدين)</span>
                    <span className="text-2xl font-black text-emerald-600 block">{ledgerResult.totalRevenue} <span className="text-xs">ج.م</span></span>
                    <span className="text-[10px] text-slate-400 block">خلال الفترة الزمنية المصممة</span>
                  </div>
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div className="absolute right-0 bottom-0 bg-emerald-600 h-1 w-full" />
                </div>

                {/* 2. Expenses Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex justify-between items-center relative overflow-hidden">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-400 block">
                      {reportType === 'teacher' ? 'حصة المنصة المحجوبة بالسنتر' : 'إجمالي المصروفات وهامش التشغيل (الدائن)'}
                    </span>
                    <span className="text-2xl font-black text-rose-500 block">{ledgerResult.totalExpense} <span className="text-xs">ج.م</span></span>
                    <span className="text-[10px] text-slate-400 block">المسجلة في هذه المدة المحددة</span>
                  </div>
                  <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center">
                    <TrendingDown className="w-6 h-6" />
                  </div>
                  <div className="absolute right-0 bottom-0 bg-rose-500 h-1 w-full" />
                </div>

                {/* 3. Net Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex justify-between items-center relative overflow-hidden">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-400 block">
                      {reportType === 'teacher' ? 'صافي أرباح المعلم المستحقة' : 'صافي الرصيد المالي المتبقي (الصافي)'}
                    </span>
                    <span className={`text-2xl font-black block ${
                      ledgerResult.netProfit >= 0 ? 'text-indigo-600' : 'text-rose-600'
                    }`}>
                      {ledgerResult.netProfit} <span className="text-xs">ج.م</span>
                    </span>
                    <span className="text-[10px] text-slate-400 block">يرحل للحسابات اللاحقة</span>
                  </div>
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div className="absolute right-0 bottom-0 bg-indigo-600 h-1 w-full" />
                </div>

              </div>

              {/* Showcase Ledger table */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
                
                {/* Table Control header */}
                <div className="bg-slate-50 border-b border-slate-100 p-4 px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm">{getReportTargetTextLabel()}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{getTimeframeTextLabel()} • عدد الحركات: <strong>{ledgerResult.rows.length}</strong> حركة</p>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    
                    <button
                      type="button"
                      onClick={handleCopyTable}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold p-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      title="نسخ جدول العمليات"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'تم النسخ!' : 'نسخ'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportExcelClick}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      title="تصدير كشيت Excel"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تصدير Excel</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePrintPDFClick}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      title="طباعة كشف مالي مباشر"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>طباعة وتصدير PDF</span>
                    </button>

                  </div>
                </div>

                {ledgerResult.rows.length === 0 ? (
                  <div className="p-16 text-center text-slate-400">
                    لا يحتوي كشف الحساب على أي بيانات مالية مسجلة خلال الفترة والتصفيات المعينة.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-slate-600 text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-150 text-slate-700 font-bold font-Cairo">
                          <th className="py-3 px-4 text-right">#</th>
                          <th className="py-3 px-4 text-right">اليوم والتاريخ</th>
                          <th className="py-3 px-4 text-right">نوع التأثير</th>
                          <th className="py-3 px-4 text-right max-w-sm">البيان المالي للحركة</th>
                          <th className="py-3 px-4 text-right">المسؤول</th>
                          <th className="py-3 px-4 text-left">التأثير الإيجابي (+)</th>
                          <th className="py-3 px-4 text-left">التأثير السلبي (-)</th>
                          <th className="py-3 px-4 text-left font-extrabold text-slate-800">الرصيد التراكمي (الصافي)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ledgerResult.rows.map((r, index) => {
                          const isExpense = r.amountExpense > 0;
                          const isTeacher = reportType === 'teacher';
                          
                          // Custom style per row type for aesthetics
                          let rowClass = "border-b border-slate-100 hover:bg-slate-50/40";
                          if (r.type === 'مصروف عام') rowClass += " bg-rose-50/10";
                          if (r.type === 'حصة معلم') rowClass += " bg-orange-50/5";

                          return (
                            <tr key={index} className={rowClass}>
                              <td className="py-3.5 px-4 font-mono font-bold text-slate-400">{index + 1}</td>
                              <td className="py-3.5 px-4 font-mono font-bold text-slate-500 whitespace-nowrap">{r.date}</td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  r.type.includes('إيراد') || r.type.includes('تحصيل')
                                    ? 'bg-emerald-50 text-emerald-700' 
                                    : 'bg-rose-50 text-rose-700'
                                }`}>
                                  {r.type}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-slate-700 leading-relaxed max-w-md break-words font-semibold">{r.description}</td>
                              <td className="py-3.5 px-4">{r.operator}</td>
                              
                              {/* Income cell */}
                              <td className="py-3.5 px-4 font-mono font-bold text-left text-emerald-600 whitespace-nowrap">
                                {isTeacher ? (
                                  r.amountIncome ? `+${r.amountIncome} ج.م` : '-'
                                ) : (
                                  r.amountIncome > 0 ? `+${r.amountIncome} ج.م` : '-'
                                )}
                              </td>

                              {/* Expense cell */}
                              <td className="py-3.5 px-4 font-mono font-bold text-left text-rose-500 whitespace-nowrap">
                                {r.amountExpense > 0 ? `-${r.amountExpense} ج.م` : '-'}
                              </td>

                              {/* Cumulative balance cell */}
                              <td className="py-3.5 px-4 font-mono font-black text-left text-slate-800 whitespace-nowrap bg-slate-50/20">
                                {r.cumulativeBalance} ج.م
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

    </div>
  );
}
