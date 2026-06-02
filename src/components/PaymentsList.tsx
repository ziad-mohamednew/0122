import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Download, 
  Trash2, 
  CreditCard, 
  Calendar, 
  Printer, 
  BookOpen, 
  AlertCircle,
  Clock,
  Sparkles,
  DollarSign,
  Layers,
  ArrowDownLeft,
  X,
  Smartphone
} from 'lucide-react';
import { Payment, Student, Teacher, Group, CenterSettings } from '../types';

interface PaymentsListProps {
  payments: Payment[];
  students: Student[];
  teachers: Teacher[];
  groups: Group[];
  centerSettings?: CenterSettings;
  onAddPayment: (payment: Payment) => void;
  onRunAutoBilling: (month: string, priceMultiplier: number) => void;
  showConfirm?: (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }) => void;
}

export default function PaymentsList({ 
  payments, 
  students, 
  teachers, 
  groups, 
  centerSettings,
  onAddPayment, 
  onRunAutoBilling,
  showConfirm
}: PaymentsListProps) {
  
  // Tabs: payment ledger vs auto billing
  const [activeSubTab, setActiveSubTab] = useState<'history' | 'autobilling'>('history');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(150);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNote, setPaymentNote] = useState('');
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [paymentMonth, setPaymentMonth] = useState('2026-06');
  const [paymentError, setPaymentError] = useState('');

  // Print Invoice Modal State
  const [activeInvoice, setActiveInvoice] = useState<Payment | null>(null);

  // Auto-Billing States
  const [billingMonth, setBillingMonth] = useState('2026-06');
  const [billingCompleted, setBillingCompleted] = useState(false);

  // Filtered payments list
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const matchesSearch = p.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.notes.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTeacher = selectedTeacherId === '' || (p.teacherIds && p.teacherIds.includes(selectedTeacherId));
      return matchesSearch && matchesTeacher;
    });
  }, [payments, searchTerm, selectedTeacherId]);

  // Handle Recording Payment
  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || paymentAmount <= 0) {
      setPaymentError("⚠️ الرجاء اختيار الطالب وتحديد قيمة سداد أكبر من الصفر.");
      return;
    }

    setPaymentError('');
    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return;

    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      studentId: selectedStudentId,
      studentName: student.name,
      amount: Number(paymentAmount),
      currency: "EGP",
      date: paymentDate,
      months: [paymentMonth],
      teacherIds: selectedTeacherIds,
      notes: paymentNote || `سداد اشتراك شهر ${paymentMonth}`,
      timestamp: new Date().toISOString()
    };

    onAddPayment(newPayment);

    // Reset Form
    setIsFormOpen(false);
    setSelectedStudentId('');
    setPaymentAmount(150);
    setPaymentNote('');
    setSelectedTeacherIds([]);
    setPaymentError('');
  };

  // Auto handle selecting a student to prefill groups/teachers & average billing price
  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentId(studentId);
    const student = students.find(s => s.id === studentId);
    if (student && student.groupIds) {
      // Find teachers connected with student groups
      const studentGroups = groups.filter(g => student.groupIds.includes(g.id));
      const trainerIds = studentGroups.map(g => g.teacherId);
      setSelectedTeacherIds(Array.from(new Set(trainerIds)));

      // Set average pricing dues or basic sum of groups
      const totalPrice = studentGroups.reduce((acc, g) => acc + g.price, 0);
      setPaymentAmount(totalPrice || 150);
    }
  };

  // handle toggling teacher checkmarks
  const handleTeacherCheck = (teacherId: string) => {
    if (selectedTeacherIds.includes(teacherId)) {
      setSelectedTeacherIds(selectedTeacherIds.filter(id => id !== teacherId));
    } else {
      setSelectedTeacherIds([...selectedTeacherIds, teacherId]);
    }
  };

  const handleExportCSV = () => {
    const headers = ["المعرف", "اسم الطالب", "القيمة (جنيه)", "التاريخ", "المعلمين المستفيدين", "بيانات الإيصال"];
    const rows = filteredPayments.map(p => {
      const teachersName = p.teacherIds ? p.teacherIds.map(tId => teachers.find(t => t.id === tId)?.name || '').filter(Boolean).join(' - ') : '';
      return [
        p.id,
        p.studentName,
        p.amount,
        p.date,
        teachersName,
        p.notes
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `دفتر_الإيصالات_المالية_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Execute Monthly Billing Engine
  const triggerAutoBilling = () => {
    if (!billingMonth) return;
    if (showConfirm) {
      showConfirm({
        title: "تفعيل الفوترة التلقائية الشهرية",
        message: `🚨 هل أنت متأكد من تفعيل الفوترة لشهر ${billingMonth}؟\n\nسيقوم النظام تلقائياً بمسح مديونيات الطلاب النشطين وإعادة قيد تكلفة كافة المجموعات المرتبطة بكل طالب كمديونية مستحقة.`,
        confirmText: "تفعيل الفوترة وقيد المستحقات",
        cancelText: "تراجع",
        type: "warning",
        onConfirm: () => {
          onRunAutoBilling(billingMonth, 1);
          setBillingCompleted(true);
          setTimeout(() => setBillingCompleted(false), 5000);
        }
      });
    } else if (confirm(`هل أنت متأكد من تفعيل الفوترة التلقائية لشهر ${billingMonth}؟ سيقوم النظام بحساب اشتراكات المجموعات وقيدها كمديونيات لكل الطلاب النشطين.`)) {
      onRunAutoBilling(billingMonth, 1);
      setBillingCompleted(true);
      setTimeout(() => setBillingCompleted(false), 5000);
    }
  };

  // Trigger HTML printing beautifully
  const handlePrintReceipt = (payment: Payment) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const receiptTeachers = payment.teacherIds ? payment.teacherIds.map(tId => teachers.find(t => t.id === tId)?.name || '').filter(Boolean).join(' - ') : 'السنتر العام';

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>إيصال سداد مالي - ${payment.studentName}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f8fafc; }
            .receipt { width: 380px; background: white; border: 1px solid #cbd5e1; border-radius: 16px; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); text-align: center; }
            .brand { color: #4f46e5; font-size: 24px; font-weight: bold; margin-bottom: 5px; }
            .subtitle { font-size: 11px; color: #64748b; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 25px; }
            .receipt-id { font-size: 11px; color: #94a3b8; background: #f1f5f9; padding: 4px 10px; border-radius: 9999px; display: inline-block; margin-bottom: 25px; }
            .amount-section { background: #ecfdf5; border: 1px dashed #10b981; padding: 15px; border-radius: 12px; margin-bottom: 25px; }
            .amount { font-size: 32px; font-weight: 800; color: #065f46; }
            .currency { font-size: 14px; color: #047857; margin-right: 5px; }
            .details-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; text-align: right; }
            .details-table tr { border-b: 1px solid #f1f5f9; }
            .details-table td { padding: 12px 0; font-size: 13px; color: #334155; }
            .details-table td.label { color: #64748b; font-weight: 500; }
            .details-table td.value { font-weight: bold; text-align: left; }
            .footer { font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 15px; margin-top: 20px; }
            @media print {
              body { background: white; }
              .receipt { border: 1px solid #000; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="brand">${centerSettings?.name || 'إيصال تحصيل نقدية'}</div>
            <div class="subtitle">${centerSettings?.initialized ? ('هاتف: ' + centerSettings.phone + ' • ' + centerSettings.address) : 'سداد الرسوم والاشتراكات الدراسية'}</div>
            <div class="receipt-id">رقم الإيصال: ${payment.id}</div>
            
            <div class="amount-section">
              <span class="amount">${payment.amount}</span>
              <span class="currency">جنيه مصري</span>
            </div>

            <table class="details-table">
              <tr>
                <td class="label">اسم الطالب:</td>
                <td class="value">${payment.studentName}</td>
              </tr>
              <tr>
                <td class="label">تاريخ الدفع:</td>
                <td class="value">${payment.date}</td>
              </tr>
              <tr>
                <td class="label">الاشتراكات المستهدفة:</td>
                <td class="value">${payment.months && payment.months.length > 0 ? payment.months.map(m => m.replace('-', '/')).join(' | ') : 'شحن رصيد حساب'}</td>
              </tr>
              <tr>
                <td class="label font-bold text-indigo-700">توزيع المعلمين:</td>
                <td class="value">${receiptTeachers}</td>
              </tr>
              <tr>
                <td class="label">ملاحظات:</td>
                <td class="value">${payment.notes || 'سداد الرسوم والمستحقات الدراسية'}</td>
              </tr>
            </table>

            <div class="footer font-semibold" style="font-size: 10px; line-height: 1.4; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 12px; margin-top: 15px;">
              نشكركم لثقتكم بنا • تم قيد النقدية سحابياً بنجاح<br/>
              <b>${centerSettings?.name || 'مركزنا التعليمي'}</b>
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
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">الحسابات والاشتراكات والفوترة</h1>
          <p className="text-slate-500 text-sm mt-1">تسجيل تحصيل الأموال، الموازنة التلقائية للطلاب ومستحقات المدرسين.</p>
        </div>
        
        {/* Sub Navigation */}
        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
          <button 
            type="button"
            onClick={() => setActiveSubTab('history')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeSubTab === 'history' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            💵 تحصيل مالي (دفتر الإيصالات)
          </button>
          <button 
            type="button"
            onClick={() => setActiveSubTab('autobilling')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeSubTab === 'autobilling' ? 'bg-white text-[#4F46E5] shadow-xs' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            ⚡ الفوترة التلقائية (Auto-Billing)
          </button>
        </div>
      </div>

      {activeSubTab === 'autobilling' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          
          {/* Left panel: Auto billing Setup */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs h-fit space-y-4">
            <h3 className="font-bold text-slate-800 border-b border-slate-50 pb-3 mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span>محرك الفوترة التلقائية والاشتراك</span>
            </h3>

            <p className="text-slate-500 text-xs leading-relaxed">
              يقوم محرك الاشتراك التلقائي بفحص جميع الطلاب النشطين ومراجعة كل المجموعات المسجلة لديهم، ومن ثم خصم سعر المجموعة الكلية من أرصدتهم في بداية الشهر لتصنف كـ "مديونية متأخرة" لحين سداد الطلاب لها.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-slate-600 text-xs font-semibold mb-1.5">الشهر المالي المستهدف</label>
                <input 
                  type="month" 
                  value={billingMonth}
                  onChange={(e) => setBillingMonth(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-700 text-sm focus:outline-hidden"
                />
              </div>

              <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 text-indigo-800 text-[11px] leading-relaxed flex gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>يرجى تشغيل الفوترة مرة واحدة فقط عند حلول الشهر لتجنب تكديس الديون المكررة على الطلاب.</span>
              </div>

              {billingCompleted && (
                <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl text-xs font-bold border border-emerald-100">
                  🎉 تم تشغيل الفوترة التلقائية بنجاح وتحديث حسابات الطلاب المسجلين!
                </div>
              )}

              <button 
                type="button"
                onClick={triggerAutoBilling}
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-850 text-white font-bold py-2.5 rounded-xl transition shadow flex items-center justify-center gap-2 mt-2"
              >
                <span>🚀 تشغيل الفوترة وحساب الرسوم تلقائياً</span>
              </button>
            </div>
          </div>

          {/* Right panel: Debtors lists and instant WhatsApp reminders */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base">متابعة مديونيات الطلاب النشطين للتحصيل</h3>
                <p className="text-slate-500 text-xs mt-0.5">الطلاب المطالبين بالسداد لشهر يونيو مع إتاحة تذكيرهم بنقرة واحدة.</p>
              </div>
            </div>

            {students.filter(s => s.balance < 0).length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                🎉 رائع! لا توجد متأخرات مالية مطلوبة للتحصيل حالياً بالسنتر.
              </div>
            ) : (
              <div className="space-y-3 h-[420px] overflow-y-auto">
                {students.filter(s => s.balance < 0).map((s) => {
                  const studentGroups = groups.filter(g => s.groupIds && s.groupIds.includes(g.id));
                  const totalLinkedPrice = studentGroups.reduce((acc, g) => acc + g.price, 0);

                  return (
                    <div key={s.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3.5 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100/50 transition gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-800 text-sm">{s.name}</h4>
                          <span className="bg-rose-50 text-rose-700 font-extrabold text-[10px] px-1.5 py-0.5 rounded-sm">
                            متأخر
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                          <span>كود: {s.code}</span>
                          <span>•</span>
                          <span>الرسوم الكلية: {totalLinkedPrice} جنيه/شهر</span>
                          <span>•</span>
                          <span>ولي الأمر: {s.parentPhone}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-4">
                        <span className="font-extrabold text-rose-600 text-base">
                          {s.balance} جنيه
                        </span>

                        <a 
                          href={`https://wa.me/2${s.parentPhone}?text=${encodeURIComponent(
                            `أولياء الأمور الأفاضل بخصوص الطالب(ة): ${s.name} ( كود: ${s.code} ). نود تذكيركم بلطف من إدارة السنتر التعليمي بضرورة سداد الرسوم المتأخرة للمجموعات بقيمة ${Math.abs(s.balance)} جنيه مصري. شاكرين جداً تفهمكم ودعمكم الدائم لنا.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1 shadow-sm transition"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>تذكير واتساب</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          
          {/* Left panel: Record receipt Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs h-fit">
            <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600" />
              <span>تسجيل سداد إيصال مالي</span>
            </h3>

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div>
                <label className="block text-slate-600 text-xs font-semibold mb-1.5">اختر الطالب السادد</label>
                <select 
                  value={selectedStudentId}
                  onChange={(e) => handleStudentSelect(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 text-sm focus:outline-hidden"
                >
                  <option value="">-- اضغط لتحديد الطالب --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (كود: {s.code} | رصيد: {s.balance})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 text-xs font-semibold mb-1.5">المبلغ المدفوع (جنيه)</label>
                  <input 
                    type="number" 
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-xs font-semibold mb-1.5">تاريخ المعاملة</label>
                  <input 
                    type="date" 
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-400 text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 text-xs font-semibold mb-1.5">عن أي شهر سداد؟</label>
                <input 
                  type="month" 
                  value={paymentMonth}
                  onChange={(e) => setPaymentMonth(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-700 text-sm focus:outline-hidden"
                />
              </div>

              {/* Linking trainers to split commission */}
              <div>
                <label className="block text-slate-600 text-xs font-semibold mb-1.5">ربط المعلمين المستفيدين والنسبة</label>
                <p className="text-[10px] text-slate-400 mb-2">سيتم تقسيم مستحقات الإيصال وتغذية رصيد المعلمين المختارين طبقاً لعمولاتهم.</p>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 max-h-32 overflow-y-auto space-y-1.5">
                  {teachers.map(t => (
                    <label key={t.id} className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600">
                      <input 
                        type="checkbox" 
                        checked={selectedTeacherIds.includes(t.id)}
                        onChange={() => handleTeacherCheck(t.id)}
                        className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300"
                      />
                      <span>{t.name} (مادة: {t.subject})</span>
                    </label>
                  ))}
                  {teachers.length === 0 && (
                    <p className="text-rose-500 text-[10px]">لا يوجد معلمون مسجلون لتسجيل الدفعات لحسابهم.</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-600 text-xs font-semibold mb-1.5">ملاحظات إضافية</label>
                <input 
                  type="text" 
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="مثال: سداد كلي لاشتراك الفيزياء والرياضيات"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-700 text-xs focus:outline-hidden"
                />
              </div>

              {paymentError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold leading-relaxed">
                  {paymentError}
                </div>
              )}

              <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition shadow flex items-center justify-center gap-2 mt-2"
              >
                <ArrowDownLeft className="w-4.5 h-4.5" />
                <span>تسجيل وطباعة الإيصال الكلي</span>
              </button>
            </form>
          </div>

          {/* Right panel: Receipts history list */}
          <div className="lg:col-span-2 space-y-4">
            
            <div className="bg-white p-4 rounded-xl border border-slate-50 shadow-2xs flex flex-wrap sm:flex-nowrap gap-3 items-center">
              
              <div className="relative flex-1 min-w-44">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="ابحث باسم الطالب المودع..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-4 py-2 text-xs focus:outline-hidden"
                />
              </div>

              <select 
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-600 text-xs focus:outline-hidden"
              >
                <option value="">كل المعلمين</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>

              <button 
                type="button" 
                onClick={handleExportCSV}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center gap-1 shadow-sm transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>إكسل</span>
              </button>
            </div>

            {filteredPayments.length === 0 ? (
              <div className="bg-white p-12 text-center text-slate-400 rounded-2xl border border-slate-100 shadow-xs">
                لا تتوفر إيصالات سداد تطابق شروط التصفية والفرز.
              </div>
            ) : (
              <div className="space-y-3 max-h-[480px] overflow-y-auto">
                {filteredPayments.map((p) => {
                  const receiptTeachers = p.teacherIds && p.teacherIds.length > 0
                    ? p.teacherIds.map(tId => teachers.find(t => t.id === tId)?.name || '').filter(Boolean).join(' - ')
                    : 'السنتر العام';
                  return (
                    <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:border-slate-200 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-800 text-sm">{p.studentName}</h4>
                          <span className="text-[10px] bg-slate-100 text-slate-500 font-mono px-1.5 py-0.5 rounded-sm">
                            {p.date}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">البيان: <strong className="text-slate-600">{p.notes}</strong></p>
                        <p className="text-[10px] text-slate-400 mt-1">المعلمون: <strong className="text-slate-500">{receiptTeachers}</strong></p>
                      </div>

                      <div className="flex items-center gap-2.5 self-end sm:self-center">
                        <span className="text-emerald-700 font-extrabold text-sm bg-emerald-50 px-2.5 py-1 rounded-lg">
                          +{p.amount} جنيه
                        </span>
                        
                        <button 
                          type="button"
                          onClick={() => handlePrintReceipt(p)}
                          className="bg-indigo-50 hover:bg-indigo-150 p-2 rounded-lg text-indigo-700 transition"
                          title="طباعة نسخة ورقية للفاتورة"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
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
