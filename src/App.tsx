/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Users, 
  Layers, 
  DollarSign, 
  UserCheck, 
  ShieldAlert, 
  Menu, 
  X, 
  CloudRain, 
  Database, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle,
  Settings,
  Lock,
  Unlock,
  LogOut,
  Loader2,
  UserCog,
  Calculator,
  MessageSquare
} from 'lucide-react';

// Import Types
import { Student, Teacher, Group, Payment, AttendanceRecord, AuditLog, AppData, CenterSettings, Secretary, Expense, WhatsAppLog } from './types';

// Import Firebase API Synchronizer
import { getLocalData, saveAppData, setupFirebaseListener, isFirebaseSyncing, testFirebaseConnection } from './firebase';

// Import Tabs Components
import Dashboard from './components/Dashboard';
import StudentsList from './components/StudentsList';
import GroupsList from './components/GroupsList';
import PaymentsList from './components/PaymentsList';
import AttendanceSheet from './components/AttendanceSheet';
import AuditTrails from './components/AuditTrails';
import OnboardingScreen from './components/OnboardingScreen';
import ConfirmationModal from './components/ConfirmationModal';
import SecretariesList from './components/SecretariesList';
import FinancialReports from './components/FinancialReports';
import WhatsAppLogs from './components/WhatsAppLogs';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Current logged-in secretary state
  const [currentSecretary, setCurrentSecretary] = useState<Secretary | null>(null);

  // Login PIN switcher overlay state
  const [isPinLoginModalOpen, setIsPinLoginModalOpen] = useState(false);
  const [loginPinText, setLoginPinText] = useState('');
  const [loginPinError, setLoginPinError] = useState('');

  // Custom confirmation modal helper state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  const showConfirm = (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }) => {
    setConfirmState({
      isOpen: true,
      title: options.title,
      message: options.message,
      confirmText: options.confirmText,
      cancelText: options.cancelText,
      type: options.type || 'warning',
      onConfirm: () => {
        options.onConfirm();
        setConfirmState(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // App global state
  const [state, setState] = useState<AppData>({
    students: [],
    teachers: [],
    groups: [],
    payments: [],
    attendance: [],
    auditLogs: []
  });

  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const [firebaseStatus, setFirebaseStatus] = useState<'connected' | 'connecting' | 'permission-denied' | 'error' | 'offline'>('connecting');
  const [firebaseError, setFirebaseError] = useState('');
  const [showFirebaseHelp, setShowFirebaseHelp] = useState(false);

  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latency?: number } | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const triggerFirebaseTest = async () => {
    setIsTestingConnection(true);
    setTestResult(null);
    try {
      const res = await testFirebaseConnection();
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "عذراً، فشل اختبار الاتصال بقاعدة بيانات Firebase."
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const openFirebaseHelp = () => {
    setTestResult(null);
    setShowFirebaseHelp(true);
  };

  // Load Initial state and setup Firebase realtime synchronization listener
  useEffect(() => {
    // 1. Get initial data from local cache first for sub-millisecond draw
    const localData = getLocalData();
    setState(localData);

    // 2. Setup Firebase synchronous updates (if database URL allows connectivity)
    const unsubscribe = setupFirebaseListener((updatedData) => {
      setState(updatedData);
    }, (status, errorMsg) => {
      setFirebaseStatus(status);
      setFirebaseError(errorMsg || '');
      setIsFirebaseConnected(status === 'connected');
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Safety redirect for unprivileged tabs in secretary mode
  useEffect(() => {
    if (currentSecretary) {
      const allowed = 
        activeTab === 'dashboard' ||
        (activeTab === 'students' && currentSecretary.permissions?.students) ||
        (activeTab === 'groups' && currentSecretary.permissions?.groups) ||
        (activeTab === 'payments' && currentSecretary.permissions?.payments) ||
        (activeTab === 'attendance' && currentSecretary.permissions?.attendance) ||
        (activeTab === 'whatsapp_logs' && currentSecretary.permissions?.attendance) ||
        (activeTab === 'audit' && currentSecretary.permissions?.logs);
      
      if (!allowed) {
        setActiveTab('dashboard');
      }
    }
  }, [currentSecretary, activeTab]);

  // Save changes locally and sync sementically with RTDB
  const handleStateChange = async (updatedData: AppData, logMsg?: string, category?: AuditLog['category']) => {
    setState({ ...updatedData });
    const operatorName = currentSecretary ? `${currentSecretary.name} (سكرتير)` : "المدير العام";
    await saveAppData(updatedData, logMsg, category, operatorName);
  };

  // Daily Closing & Automatic Backup state managers
  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const [isCloseSystemModalOpen, setIsCloseSystemModalOpen] = useState(false);
  const [isSystemLocked, setIsSystemLocked] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);

  // System lock & Password configurations (Tied securely to Firebase database settings)
  const [unlockedPassword, setUnlockedPassword] = useState<string>(() => {
    try {
      return sessionStorage.getItem('educenter_unlocked_password') || '';
    } catch {
      return '';
    }
  });
  const [typedPassword, setTypedPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Dynamically determine lock state based on active Firebase configuration
  const isAppPasswordLocked = Boolean(
    state.centerSettings?.password && 
    state.centerSettings.password.trim() !== '' && 
    unlockedPassword !== state.centerSettings.password.trim()
  );

  // Core execution daily backup and export JSON
  const executeBackupDaily = async (showUINotifications = true) => {
    setIsBackupLoading(true);
    let written = false;
    
    // 1. Attempt writing directly via the File System Access API if visual directory handle is cached
    try {
      const handle = (window as any).selectedBackupDirectoryHandle;
      if (handle) {
        const opts = { mode: 'readwrite' as const };
        if (await handle.queryPermission(opts) !== 'granted') {
          await handle.requestPermission(opts);
        }
        
        const now = new Date();
        const dateStr = now.toLocaleDateString('ar-EG').replace(/\//g, '-');
        const timeStr = `${now.getHours()}-${now.getMinutes()}`;
        const fileName = `نسخة_احتياطية_سنتر_${state.centerSettings?.name || "يومية"}_${dateStr}_الساعة_${timeStr}.json`;
        
        const fileHandle = await handle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(state, null, 2));
        await writable.close();
        written = true;
        console.log("Successfully auto-archived directly to system folder:", fileName);
      }
    } catch (e) {
      console.warn("FileSystemAccess DirectWrite error, falling back to download utility:", e);
    }

    // 2. Browser standard downloads fallback
    if (!written) {
      try {
        const now = new Date();
        const dateStr = now.toLocaleDateString('ar-EG').replace(/\//g, '-');
        const timeStr = `${now.getHours()}-${now.getMinutes()}`;
        const jsonStr = JSON.stringify(state, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `نسخة_احتياطية_${state.centerSettings?.name || "يومية"}_${dateStr}_الساعة_${timeStr}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        written = true;
      } catch (err) {
        console.error("Backup fallback download failed:", err);
      }
    }

    setIsBackupLoading(false);
    if (written) {
      const nowStr = new Date().toLocaleString('ar-EG', { hour12: true });
      setLastBackupTime(nowStr);
      
      // Push system audit trail log node
      const newAuditLog: AuditLog = {
        id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
        timestamp: new Date().toISOString(),
        action: "تم تصدير نسخة احتياطية يومية",
        category: 'system',
        details: `تصدير ذكي لقاعدة السنتر لتاريخ اليوم بنجاح ${state.centerSettings?.backupDirectoryName ? `إلى المجلد: ${state.centerSettings.backupDirectoryName}` : 'عبر التحميل التلقائي بالجهاز'}`,
        operator: "المدير العام (نظام الحفظ)"
      };

      handleStateChange({
        ...state,
        auditLogs: [newAuditLog, ...state.auditLogs]
      }, "إنشاء نسخة احتياطية يومية مؤمنة بنجاح", "system");
    }
    return written;
  };

  // Warn on custom browser closes/unloads
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.centerSettings?.autoBackupEnabled) {
        e.preventDefault();
        e.returnValue = 'تنبيه: نوصي بإجراء تأمين وضغط زر "إغلاق اليوم وتأمين النظام" لحفظ البيانات اليومية!';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.centerSettings?.autoBackupEnabled, state]);

  // Daily automated auto backup on boot/startup once a day
  useEffect(() => {
    if (!state.centerSettings || !state.centerSettings.initialized || !state.centerSettings.autoBackupEnabled) return;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const lastBackupDate = localStorage.getItem('last_auto_backup_date');
    
    if (lastBackupDate !== todayStr && state.students.length > 0) {
      // Trigger daily silent auto backup after app is fully loaded (5 seconds)
      const timer = setTimeout(() => {
        executeBackupDaily(false).then((success) => {
          if (success) {
            localStorage.setItem('last_auto_backup_date', todayStr);
          }
        });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.centerSettings?.initialized, state.students.length]);

  // ----- TAB OPERATIONS COMMANDS -----

  // Students Ops
  const handleSaveStudent = (student: Student) => {
    const exists = state.students.some(s => s.id === student.id);
    let updatedList: Student[];
    let logDetail = "";

    if (exists) {
      updatedList = state.students.map(s => s.id === student.id ? student : s);
      logDetail = `تم تحديث بيانات الطالب: ${student.name}`;
    } else {
      updatedList = [...state.students, student];
      logDetail = `تسجيل طالب جديد: ${student.name} (كود: ${student.code})`;
    }

    handleStateChange({
      ...state,
      students: updatedList
    }, logDetail, 'students');
  };

  const handleDeleteStudent = (studentId: string) => {
    const student = state.students.find(s => s.id === studentId);
    if (!student) return;

    handleStateChange({
      ...state,
      students: state.students.filter(s => s.id !== studentId)
    }, `حذف ملف الطالب: ${student.name}`, 'students');
  };

  const handleUpdateStudentBalance = (studentId: string, newBalance: number) => {
    handleStateChange({
      ...state,
      students: state.students.map(s => s.id === studentId ? { ...s, balance: newBalance } : s)
    }, `تعديل رصيد الطالب كود: ${studentId} إلى ${newBalance}`, 'students');
  };

  // Group Ops
  const handleSaveGroup = (group: Group) => {
    handleStateChange({
      ...state,
      groups: [...state.groups, group]
    }, `إنشاء مجموعة جديدة: ${group.name}`, 'groups');
  };

  const handleDeleteGroup = (groupId: string) => {
    const grp = state.groups.find(g => g.id === groupId);
    if (!grp) return;

    // Filter group id out of student links
    const updatedStudents = state.students.map(s => {
      if (s.groupIds && s.groupIds.includes(groupId)) {
        return { ...s, groupIds: s.groupIds.filter(gId => gId !== groupId) };
      }
      return s;
    });

    handleStateChange({
      ...state,
      groups: state.groups.filter(g => g.id !== groupId),
      students: updatedStudents
    }, `حذف المجموعة التعليمية: ${grp.name}`, 'groups');
  };

  // Teacher Ops
  const handleSaveTeacher = (teacher: Teacher) => {
    const exists = state.teachers.some(t => t.id === teacher.id);
    const updatedTeachers = exists
      ? state.teachers.map(t => t.id === teacher.id ? teacher : t)
      : [...state.teachers, teacher];
    handleStateChange({
      ...state,
      teachers: updatedTeachers
    }, exists ? `تعديل بيانات المعلم: ${teacher.name}` : `إضافة معلم جديد: ${teacher.name} لمادة ${teacher.subject}`, 'teachers');
  };

  const handleDeleteTeacher = (teacherId: string) => {
    const trainer = state.teachers.find(t => t.id === teacherId);
    if (!trainer) return;

    handleStateChange({
      ...state,
      teachers: state.teachers.filter(t => t.id !== teacherId),
      // Unlink from groups
      groups: state.groups.filter(g => g.teacherId !== teacherId)
    }, `حذف ملف المعلم: ${trainer.name}`, 'teachers');
  };

  // Secretary Operations
  const handleSaveSecretary = (sec: Secretary) => {
    const exists = (state.secretaries || []).some(s => s.id === sec.id);
    const updatedSecs = exists
      ? (state.secretaries || []).map(s => s.id === sec.id ? sec : s)
      : [...(state.secretaries || []), sec];
    
    handleStateChange({
      ...state,
      secretaries: updatedSecs
    }, exists ? `تعديل حساب سكرتارية: ${sec.name}` : `تسجيل حساب سكرتارية جديد لـ: ${sec.name}`, 'system');
  };

  const handleDeleteSecretary = (secId: string) => {
    const target = (state.secretaries || []).find(s => s.id === secId);
    if (!target) return;

    handleStateChange({
      ...state,
      secretaries: (state.secretaries || []).filter(s => s.id !== secId)
    }, `حظر وحذف حساب السكرتير ومساعد السنتر: ${target.name}`, 'system');
  };

  // Record Payment receipt
  const handleAddPayment = (payment: Payment) => {
    const operatorName = currentSecretary ? `${currentSecretary.name}` : "المدير العام";
    const paymentWithOperator = {
      ...payment,
      operatorName
    };

    // 1. Update Student's internal positive financial balance or reduce negative dues balance.
    const updatedStudents = state.students.map(s => {
      if (s.id === payment.studentId) {
        return {
          ...s,
          balance: Number(s.balance) + Number(payment.amount)
        };
      }
      return s;
    });

    // 2. Add payment node
    handleStateChange({
      ...state,
      payments: [paymentWithOperator, ...state.payments],
      students: updatedStudents
    }, `إصدار إيصال تحصيل مالي ورقي بقيمة ${payment.amount} جنيه للطالب: ${payment.studentName}`, 'payments');
  };

  // Record General Expense
  const handleAddExpense = (expense: Expense) => {
    const operatorName = currentSecretary ? `${currentSecretary.name}` : "المدير العام";
    const expenseWithOperator = {
      ...expense,
      operatorName
    };
    const updatedExpenses = [...(state.expenses || []), expenseWithOperator];
    handleStateChange({
      ...state,
      expenses: updatedExpenses
    }, `تسجيل مستند صرف مالي بقيمة ${expense.amount} جنيه لبيان: ${expense.title}`, 'payments');
  };

  // Delete General Expense
  const handleDeleteExpense = (id: string) => {
    const updatedExpenses = (state.expenses || []).filter(e => e.id !== id);
    handleStateChange({
      ...state,
      expenses: updatedExpenses
    }, `حذف وإلغاء مستند صرف مالي من السجلات`, 'system');
  };

  // Record/Update session attendance check list
  const handleSaveAttendance = async (record: AttendanceRecord) => {
    const existsIdx = state.attendance.findIndex(a => a.id === record.id);
    let updatedList = [...state.attendance];
    
    if (existsIdx > -1) {
      updatedList[existsIdx] = record;
    } else {
      updatedList = [record, ...updatedList];
    }

    const group = state.groups.find(g => g.id === record.groupId);
    const groupName = group ? group.name : 'مجموعة عامة';
    const teacher = group ? state.teachers.find(t => t.id === group.teacherId) : null;
    const teacherName = teacher ? teacher.name : 'مدرس المادة';
    const centerName = state.centerSettings?.name || 'السنتر التعليمي';

    let nextState = {
      ...state,
      attendance: updatedList
    };

    // Auto WhatsApp notifications for student absences logic: discover who's newly absent and hasn't been logged yet
    const currentLogs = state.whatsAppLogs || [];
    const absentStudentIds = Object.keys(record.records || {}).filter(
      studentId => record.records[studentId] === 'absent'
    );

    const newLogsToInculcate: WhatsAppLog[] = [];

    for (const studentId of absentStudentIds) {
      const attendanceRecordId = `${studentId}_${record.groupId}_${record.date}`;
      const alreadySent = currentLogs.some(log => log.attendanceRecordId === attendanceRecordId);
      
      if (!alreadySent) {
        const student = state.students.find(s => s.id === studentId);
        if (student) {
          const uniqueId = `wa-log-${Date.now()}-${studentId}`;
          try {
            const response = await fetch("/api/whatsapp/send-absence", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                studentName: student.name,
                gradeName: groupName,
                absenceDate: record.date,
                parentPhone: student.parentPhone,
                centerName,
                teacherName
              })
            });

            const resData = await response.json();

            const newLog: WhatsAppLog = {
              id: uniqueId,
              studentId: student.id,
              studentName: student.name,
              parentPhone: student.parentPhone,
              message: resData.messageText || `السلام عليكم ورحمة الله وبركاته...`,
              timestamp: new Date().toISOString(),
              status: resData.sent ? 'success' : 'failed',
              errorReason: resData.sent ? undefined : (resData.error || "فشل غير معروف من الخادم"),
              attendanceRecordId: attendanceRecordId
            };
            newLogsToInculcate.push(newLog);

          } catch (err: any) {
            console.error("Auto WhatsApp dispatch failed for student", student.name, err);
            const errorLog: WhatsAppLog = {
              id: uniqueId,
              studentId: student.id,
              studentName: student.name,
              parentPhone: student.parentPhone,
              message: `نحيط سيادتكم علماً بأن الطالب: ${student.name} غائب اليوم ${record.date}...`,
              timestamp: new Date().toISOString(),
              status: 'failed',
              errorReason: err.message || "فشل الاتصال بالخادم الرئيسي",
              attendanceRecordId: attendanceRecordId
            };
            newLogsToInculcate.push(errorLog);
          }
        }
      }
    }

    if (newLogsToInculcate.length > 0) {
      nextState = {
        ...nextState,
        whatsAppLogs: [...newLogsToInculcate, ...currentLogs]
      };
    }

    await handleStateChange(
      nextState,
      `تحديث دفتر الحضور والغياب ليوم ${record.date} لمجموعة: ${groupName}${newLogsToInculcate.length > 0 ? ` (وإرسال تلقائي لـ ${newLogsToInculcate.length} إشعار غياب عبر واتساب)` : ''}`,
      'attendance'
    );
  };

  // Re-send WhatsApp message manually from administration logs panel
  const handleResendWhatsAppMessage = async (log: WhatsAppLog) => {
    const student = state.students.find(s => s.id === log.studentId);
    let groupName = "مجموعة السنتر";
    let teacherName = "مدرس المادة";
    if (student && student.groupIds && student.groupIds.length > 0) {
      const group = state.groups.find(g => g.id === student.groupIds[0]);
      if (group) {
        groupName = group.name;
        const teacher = state.teachers.find(t => t.id === group.teacherId);
        if (teacher) {
          teacherName = teacher.name;
        }
      }
    }
    const centerName = state.centerSettings?.name || 'السنتر التعليمي';

    try {
      const response = await fetch("/api/whatsapp/send-absence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          studentName: log.studentName,
          gradeName: groupName,
          absenceDate: new Date().toISOString().split('T')[0],
          parentPhone: log.parentPhone,
          centerName,
          teacherName
        })
      });

      const resData = await response.json();

      const newLog: WhatsAppLog = {
        id: `wa-log-${Date.now()}-${log.studentId}`,
        studentId: log.studentId,
        studentName: log.studentName,
        parentPhone: log.parentPhone,
        message: resData.messageText || log.message,
        timestamp: new Date().toISOString(),
        status: resData.sent ? 'success' : 'failed',
        errorReason: resData.sent ? undefined : (resData.error || "فشل غير معروف من الخادم"),
        attendanceRecordId: log.attendanceRecordId
      };

      const refreshed = [newLog, ...(state.whatsAppLogs || [])];
      await handleStateChange({
        ...state,
        whatsAppLogs: refreshed
      }, `إعادة إرسال رسالة غياب الطالب: ${log.studentName} يدوياً عبر واتساب`, 'attendance');

    } catch (err: any) {
      console.error("Manual resend failed", err);
      const errorLog: WhatsAppLog = {
        id: `wa-log-${Date.now()}-${log.studentId}`,
        studentId: log.studentId,
        studentName: log.studentName,
        parentPhone: log.parentPhone,
        message: log.message,
        timestamp: new Date().toISOString(),
        status: 'failed',
        errorReason: err.message || "عطل في الاتصال بخدمة الإرسال",
        attendanceRecordId: log.attendanceRecordId
      };

      const refreshed = [errorLog, ...(state.whatsAppLogs || [])];
      await handleStateChange({
        ...state,
        whatsAppLogs: refreshed
      }, `فشل إعادة إرسال رسالة غياب الطالب: ${log.studentName} يدوياً عبر واتساب`, 'attendance');
    }
  };

  // Run Auto-billing monthly subscription charge algorithm
  const handleRunAutoBilling = (monthMonth: string) => {
    let auditMessageDetails = `تطبيق الفوترة والاشتراك التلقائي لكل المجموعات لشهر ${monthMonth}`;
    
    const updatedStudents = state.students.map(student => {
      // Find all groups registered for this student
      const studentGroups = state.groups.filter(g => student.groupIds && student.groupIds.includes(g.id));
      
      // Accumulate charges of this student groups
      const totalMonthlyCharge = studentGroups.reduce((acc, g) => acc + g.price, 0);
      
      if (totalMonthlyCharge > 0) {
        return {
          ...student,
          balance: Number(student.balance) - Number(totalMonthlyCharge)
        };
      }
      return student;
    });

    handleStateChange({
      ...state,
      students: updatedStudents
    }, auditMessageDetails, 'system');
  };

  // Restore and import external json backup
  const handleImportBackup = (backup: AppData) => {
    handleStateChange(backup, "استرجاع كامل لقاعدة بيانات السنتر من ملف خارجي", 'system');
  };

  const handleUpdateStudentGroups = (studentId: string, groupIds: string[]) => {
    handleStateChange({
      ...state,
      students: state.students.map(s => s.id === studentId ? { ...s, groupIds } : s)
    }, `تحديث المجموعات المرتبطة بالطالب كود: ${studentId}`, 'students');
  };

  const handleSaveCenterSettings = (settings: CenterSettings) => {
    if (settings.password && settings.password.trim() !== '') {
      const activePass = settings.password.trim();
      setUnlockedPassword(activePass);
      try {
        sessionStorage.setItem('educenter_unlocked_password', activePass);
      } catch (err) {
        console.warn("sessionStorage error:", err);
      }
    }
    handleStateChange({
      ...state,
      centerSettings: settings
    }, `تهيئة وتحديث هوية السنتر: ${settings.name}`, 'system');
    setIsSettingsOpen(false);
  };

  // Purge database state completely
  const handleClearDatabase = () => {
    const resetState: AppData = {
      students: [],
      teachers: [],
      groups: [],
      payments: [],
      attendance: [],
      centerSettings: state.centerSettings, // Preserve existing center identification details!
      auditLogs: [
        {
          id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          timestamp: new Date().toISOString(),
          action: "تصفير قاعدة البيانات بالكامل",
          category: "system",
          details: "تم تنفيذ تصفير النظام كلياً وبدء قاعدة بيانات نظيفة مع الحفاظ على هوية السنتر.",
          operator: "المدير العام"
        }
      ]
    };
    handleStateChange(resetState);
  };

  const handleSyncForceReload = () => {
    window.location.reload();
  };

  // Navigation Links menu RTL sidebar
  const navigationItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    (!currentSecretary || currentSecretary.permissions?.students) && { id: 'students', label: 'ملفات الطلاب', icon: Users },
    (!currentSecretary || currentSecretary.permissions?.groups) && { id: 'groups', label: 'المجموعات والمعلمين', icon: Layers },
    (!currentSecretary || currentSecretary.permissions?.payments) && { id: 'payments', label: 'الحسابات والفوترة', icon: DollarSign },
    (!currentSecretary || currentSecretary.permissions?.payments) && { id: 'financials', label: 'كشف الحسابات', icon: Calculator },
    (!currentSecretary || currentSecretary.permissions?.attendance) && { id: 'attendance', label: 'الحضور والغياب (QR)', icon: UserCheck },
    (!currentSecretary || currentSecretary.permissions?.attendance) && { id: 'whatsapp_logs', label: 'سجل رسائل واتساب', icon: MessageSquare },
    (!currentSecretary) && { id: 'secretaries', label: 'إدارة السكرتارية', icon: UserCog },
    (!currentSecretary || currentSecretary.permissions?.logs) && { id: 'audit', label: 'النسخ والأمن', icon: ShieldAlert },
  ].filter(Boolean) as { id: string; label: string; icon: any }[];

  const handleNavigate = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  if (!state.centerSettings || !state.centerSettings.initialized) {
    return <OnboardingScreen onSave={handleSaveCenterSettings} initialSettings={state.centerSettings} />;
  }

  if (isAppPasswordLocked && state.centerSettings?.password) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-right text-white" dir="rtl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))] select-none pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl text-center z-10 overflow-hidden"
        >
          {/* Custom logo or decorative lock */}
          <div className="flex flex-col items-center">
            {state.centerSettings?.logoUrl ? (
              <div className="w-20 h-20 border border-slate-800 rounded-3xl overflow-hidden bg-white mb-5 shadow-xl flex items-center justify-center p-1 font-sans">
                <img src={state.centerSettings.logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-indigo-650 rounded-2xl flex items-center justify-center text-white text-2xl font-extrabold shadow-lg shadow-indigo-600/20 mb-5">
                🔒
              </div>
            )}

            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-bold px-3 py-1 rounded-full border border-indigo-500/25 mb-2">
              نظام السنتر مغلق ومُؤمّن
            </span>

            <h2 className="text-xl font-extrabold text-white tracking-tight leading-snug">
              {state.centerSettings?.name || "EduCenter Pro"}
            </h2>
            <p className="text-slate-400 text-xs mt-1.5 font-semibold leading-relaxed">
              يرجى إدخال كلمة المرور السليمة لإلغاء القفل والبدء بإدارة السنتر والعمليات المالية.
            </p>
          </div>

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const targetPassword = state.centerSettings?.password?.trim() || '';
              if (typedPassword.trim() === targetPassword) {
                setUnlockedPassword(targetPassword);
                try {
                  sessionStorage.setItem('educenter_unlocked_password', targetPassword);
                } catch (err) {
                  console.warn("sessionStorage error:", err);
                }
                setPasswordError('');
              } else {
                setPasswordError('❌ الرقم السري للسنتر غير صحيح، يرجى المحاولة مجدداً!');
              }
            }}
            className="mt-6 space-y-4 text-right"
          >
            <div>
              <label className="block text-slate-300 text-xs font-bold mb-2">كلمة المرور المقررة</label>
              <input
                type="password"
                required
                placeholder="أدخل كلمة المرور هنا..."
                value={typedPassword}
                onChange={(e) => setTypedPassword(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 text-white rounded-xl px-4 py-3 text-xs font-bold placeholder-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition text-center"
              />
            </div>

            {passwordError && (
              <p className="text-rose-400 text-xs font-bold text-center">{passwordError}</p>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/15 cursor-pointer"
            >
              <span>🔓 إلغاء قفل النظام للبدء</span>
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (isSystemLocked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-right text-white" dir="rtl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))] select-none pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-8 sm:p-10 shadow-2xl text-center z-10 overflow-hidden"
        >
          {/* Decorative glows */}
          <div className="absolute -top-12 -left-12 w-24 h-24 bg-indigo-500/20 rounded-full blur-xl" />
          <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-rose-500/10 rounded-full blur-xl" />

          <div className="flex flex-col items-center">
            {/* Pulsing Lock Icon */}
            <div className="w-20 h-20 bg-indigo-600/10 border border-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400 text-3xl shadow-xl shadow-indigo-600/5 mb-6 animate-pulse">
              🔒
            </div>

            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-bold px-3 py-1 rounded-full border border-indigo-500/25 mb-3">
              تم تأمين وحفظ السنتر بنجاح اليوم
            </span>

            <h2 className="text-2xl font-extrabold text-[#F8FAFC] tracking-tight leading-snug">
              السنتر التعليمي مغلق الآن ومُؤمن
            </h2>
            
            <p className="text-slate-400 text-xs sm:text-sm mt-3 leading-relaxed max-w-sm font-semibold mx-auto">
              نجحت عملية إغلاق اليوم الدراسي بالكامل وتطبيق ميزة التصدير لملف النسخ الاحتياطي بالتاريخ والوقت لحماية وتأمين البيانات الكلية.
            </p>
          </div>

          <div className="mt-8 space-y-3 bg-slate-950/80 border border-slate-800 p-5 rounded-2xl text-right text-xs">
            {lastBackupTime && (
              <p className="flex justify-between items-center text-slate-300">
                <span className="text-slate-500">توقيت الحفظ:</span>
                <span className="font-bold text-slate-200">{lastBackupTime}</span>
              </p>
            )}
            <p className="flex justify-between items-center text-slate-300">
              <span className="text-slate-500">مجلد التخزين:</span>
              <span className="font-bold text-indigo-455 max-w-[200px] truncate" title={state.centerSettings?.backupDirectoryName}>
                {state.centerSettings?.backupDirectoryName || "التنزيلات التلقائية بالجهاز"}
              </span>
            </p>
            <p className="flex justify-between items-center text-slate-300">
              <span className="text-slate-500">قاعدة البيانات:</span>
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping"></span>
                <span>سليمة ومأمونة تماماً للغد</span>
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsSystemLocked(false);
            }}
            className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/15 cursor-pointer"
          >
            <span>🔓 إلغاء التأمين والولوج مجدداً للنظام</span>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans" dir="rtl">
      
      {/* SIDEBAR ON RIGHT - RTL layout */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white shrink-0 border-l border-slate-800 shadow-xl relative z-10">
        
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
              {state.centerSettings?.logoUrl ? (
                <img src={state.centerSettings.logoUrl} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-indigo-600 flex items-center justify-center font-extrabold text-white text-base">
                  {state.centerSettings?.name ? state.centerSettings.name.slice(0, 2).toUpperCase() : 'ED'}
                </div>
              )}
            </div>
            <div className="truncate">
              <h2 className="font-bold text-xs text-white leading-tight truncate" title={state.centerSettings?.name || "EduCenter Pro"}>
                {state.centerSettings?.name || "EduCenter Pro"}
              </h2>
              <span className="text-[9px] text-slate-400 block mt-0.5 truncate">نظام إدارة السنتر الذكي</span>
            </div>
          </div>
          
          {/* Quick Edit Center Info Button */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
            title="تعديل بيانات وهوية السنتر"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation panel Links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
                  isActive 
                    ? 'bg-slate-800 text-white border border-slate-700 shadow-xs' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Daily Closing Session Trigger Button */}
          <div className="pt-4 border-t border-slate-800/60 mt-3">
            <button
              type="button"
              onClick={() => setIsCloseSystemModalOpen(true)}
              className="w-full flex items-center justify-between text-rose-400 hover:bg-rose-950/10 border border-slate-800 hover:border-rose-900/40 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
                <span>إغلاق اليوم وتأمين النظام</span>
              </div>
              <span className="text-[9px] bg-rose-500/10 text-rose-400 font-extrabold px-2 py-0.5 rounded-full border border-rose-550/10 shrink-0">آمن</span>
            </button>
          </div>

          {/* Active Profile Status switch widget */}
          <div className="mt-4 pt-4 border-t border-slate-800/60">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex flex-col gap-2">
              <span className="text-[9px] text-slate-500 font-extrabold block">المستفيد الحالي من النظام:</span>
              <div className="flex items-center justify-between gap-1.5 overflow-hidden">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                    currentSecretary ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20' : 'bg-indigo-650/10 text-indigo-400 border border-indigo-505/20'
                  }`}>
                    {currentSecretary ? '👤' : '👑'}
                  </div>
                  <div className="truncate text-right">
                    <p className="font-extrabold text-[10px] text-white truncate" title={currentSecretary ? currentSecretary.name : 'المدير العام (Admin)'}>
                      {currentSecretary ? currentSecretary.name : 'المدير العام (Admin)'}
                    </p>
                    <p className="text-[8px] text-slate-400 mt-0.5 truncate">
                      {currentSecretary ? `مساعد: ${currentSecretary.workspaceType === 'teacher' ? 'مدرس' : 'قاعة'}` : 'صلاحيات كاملة'}
                    </p>
                  </div>
                </div>

                {currentSecretary ? (
                  <button
                    type="button"
                    onClick={() => {
                      const adminPassword = state.centerSettings?.password;
                      if (adminPassword) {
                        const confirmPin = prompt("🔑 يرجى كتابة الرقم السري للمدير (الـ Admin) لتأكيد هويتك والعودة لحساب المسؤول الأول:");
                        if (confirmPin === null) return; // user cancelled
                        if (confirmPin !== adminPassword) {
                          alert("❌ الرقم السري للمسؤول غير صحيحة! يرجى المحاولة مرة أخرى.");
                          return;
                        }
                      }
                      setCurrentSecretary(null);
                      setActiveTab('dashboard');
                    }}
                    className="text-[9px] bg-slate-800 hover:bg-slate-705 border border-slate-700 hover:text-white text-slate-300 px-2 py-1 rounded-md font-bold transition-all shrink-0 cursor-pointer"
                    title="الخروج لحساب المسؤول العام"
                  >
                    خروج كمسؤول
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setLoginPinText('');
                      setLoginPinError('');
                      setIsPinLoginModalOpen(true);
                    }}
                    className="text-[9px] bg-indigo-600 hover:bg-indigo-700 border border-indigo-550 text-white px-2 py-1 rounded-md font-bold transition-all shrink-0 cursor-pointer"
                    title="تسجيل دخول سكرتارية"
                  >
                    تبديل سكرتير
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Sticky footer user profile info / Live Status */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              {firebaseStatus === 'connected' && (
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400">مُتصل وسحابي لحظي</span>
                </div>
              )}
              {firebaseStatus === 'connecting' && (
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <span className="text-[10px] font-bold text-amber-400">جاري الاتصال بالسحاب...</span>
                </div>
              )}
              {firebaseStatus === 'permission-denied' && (
                <button
                  type="button"
                  onClick={openFirebaseHelp}
                  className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded-lg text-rose-400 text-[10px] font-bold animate-pulse cursor-pointer hover:bg-rose-500/20 text-right"
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                  <span>خطأ قواعد (اضغط للحل) ⚠️</span>
                </button>
              )}
              {firebaseStatus === 'error' && (
                <button
                  type="button"
                  onClick={openFirebaseHelp}
                  className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-550/20 px-2 py-1 rounded-lg text-rose-400 text-[10px] font-bold cursor-pointer hover:bg-rose-500/20 text-right"
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                  <span>فشل الاتصال (دليل الحل)</span>
                </button>
              )}
              {firebaseStatus === 'offline' && (
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2 border border-slate-700 rounded-full">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-500"></span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">تعمل محلياً (أوفلاين)</span>
                </div>
              )}
              <span className="text-[9px] font-mono text-slate-500">v1.2.0</span>
            </div>
            
            {(firebaseStatus === 'permission-denied' || firebaseStatus === 'error') && (
              <p className="text-[9px] text-rose-400/80 leading-relaxed select-none">
                برجاء تعديل القواعد في Firebase Console إلى Rules: read/write = true لتمكين حفظ بياناتك تلقائياً وسحابياً.
              </p>
            )}
          </div>
        </div>
      </aside>

      {/* MOBILE HEADER BAR */}
      <header className="md:hidden bg-[#0F172A] text-slate-150 p-4 flex justify-between items-center border-b border-slate-800 shadow-md">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
            {state.centerSettings?.logoUrl ? (
              <img src={state.centerSettings.logoUrl} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold font-sans">
                🏫
              </div>
            )}
          </div>
          <span className="font-extrabold text-[#F8FAFC] text-sm truncate max-w-[185px]">
            {state.centerSettings?.name || "بوابة السنتر الذكي"}
          </span>
        </div>
        
        <button 
          type="button" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-slate-300 hover:text-white p-1 rounded-sm focus:outline-hidden"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* MOBILE DRAWER SIDEBAR NAVIGATION */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-40 bg-[#0F172A] text-slate-200 mt-[61px] flex flex-col p-6 space-y-4 shadow-inner"
          >
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
                      isActive 
                        ? 'bg-indigo-600 text-white' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              {/* Mobile Close Day Option */}
              <div className="pt-4 border-t border-slate-800/60 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsCloseSystemModalOpen(true);
                  }}
                  className="w-full flex items-center justify-between text-rose-400 bg-rose-950/10 border border-rose-950/40 px-4 py-3.5 rounded-xl text-sm font-bold transition-all mr-0 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <LogOut className="w-5 h-5 text-rose-500 shrink-0" />
                    <span>إغلاق اليوم وتأمين النظام</span>
                  </div>
                  <span className="text-xs bg-rose-500/10 text-rose-400 font-extrabold px-3 py-1 rounded-full">آمن</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* COMPONENT BODY VIEW - LEFT IN DESKTOP (RTL RIGHT IS THE SIDEBAR) */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
        
        {/* State Indicators Banner */}
        <div className="flex justify-between items-center bg-white border border-slate-100 rounded-xl px-4 py-3 text-xs w-full shadow-2xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-650">بيانات السنتر التعليمي: </span>
            <span className="text-[#4F46E5] font-extrabold">مُحدثة بالكامل ولحظية</span>
          </div>
          
          <div className="text-slate-400 font-semibold flex items-center gap-1.5 font-sans">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span>قاعدة البيانات: مشفرة ومؤمنة تلقائياً</span>
          </div>
        </div>

        {/* Tab rendering */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'dashboard' && (
              <Dashboard 
                students={state.students}
                groups={state.groups}
                teachers={state.teachers}
                payments={state.payments}
                onNavigate={handleNavigate}
                currentSecretary={currentSecretary}
              />
            )}

            {activeTab === 'students' && (
              <StudentsList 
                students={state.students}
                groups={state.groups}
                teachers={state.teachers}
                centerSettings={state.centerSettings}
                onSaveStudent={handleSaveStudent}
                onDeleteStudent={handleDeleteStudent}
                onUpdateStudentBalance={handleUpdateStudentBalance}
                showConfirm={showConfirm}
              />
            )}

            {activeTab === 'groups' && (
              <GroupsList 
                groups={state.groups}
                teachers={state.teachers}
                students={state.students}
                onSaveGroup={handleSaveGroup}
                onDeleteGroup={handleDeleteGroup}
                onSaveTeacher={handleSaveTeacher}
                onDeleteTeacher={handleDeleteTeacher}
                showConfirm={showConfirm}
              />
            )}

            {activeTab === 'payments' && (
              <PaymentsList 
                payments={state.payments}
                students={state.students}
                teachers={state.teachers}
                groups={state.groups}
                centerSettings={state.centerSettings}
                onAddPayment={handleAddPayment}
                onRunAutoBilling={handleRunAutoBilling}
                showConfirm={showConfirm}
              />
            )}

            {activeTab === 'attendance' && (
              <AttendanceSheet 
                students={state.students}
                groups={state.groups}
                teachers={state.teachers}
                attendance={state.attendance}
                onSaveAttendance={handleSaveAttendance}
                onUpdateStudentGroups={handleUpdateStudentGroups}
                showConfirm={showConfirm}
              />
            )}

            {activeTab === 'financials' && (
              <FinancialReports 
                payments={state.payments}
                teachers={state.teachers}
                students={state.students}
                secretaries={state.secretaries || []}
                expenses={state.expenses || []}
                centerSettings={state.centerSettings}
                onAddExpense={handleAddExpense}
                onDeleteExpense={handleDeleteExpense}
                showConfirm={showConfirm}
              />
            )}

            {activeTab === 'secretaries' && (
              <SecretariesList 
                secretaries={state.secretaries || []}
                teachers={state.teachers}
                onSaveSecretary={handleSaveSecretary}
                onDeleteSecretary={handleDeleteSecretary}
                showConfirm={showConfirm}
              />
            )}

            {activeTab === 'whatsapp_logs' && (
              <WhatsAppLogs 
                logs={state.whatsAppLogs || []}
                onResendMessage={handleResendWhatsAppMessage}
              />
            )}

            {activeTab === 'audit' && (
              <AuditTrails 
                auditLogs={state.auditLogs}
                onImportBackup={handleImportBackup}
                onClearDatabase={handleClearDatabase}
                isFirebaseSync={isFirebaseConnected}
                onSyncForceReload={handleSyncForceReload}
                showConfirm={showConfirm}
              />
            )}
          </motion.div>
        </AnimatePresence>

      </main>

      {/* Settings Edit Overlay Modal */}
      {isSettingsOpen && (
        <OnboardingScreen 
          onSave={handleSaveCenterSettings} 
          initialSettings={state.centerSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* Interactive Close & Secure System Modal */}
      {isCloseSystemModalOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-sans text-right text-slate-100" dir="rtl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-6 relative overflow-hidden"
          >
            {/* Top Warning graphics */}
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl flex items-center justify-center text-lg shrink-0">
                🚪
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">تأمين وإغلاق اليوم الدراسي للسنتر</h3>
                <p className="text-[10px] text-slate-400">حفظ البيانات الكلية وتصدير نسخة احتياطية آمنة</p>
              </div>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed font-semibold">
              هل أنت متأكد من رغبتك في إغلاق الوردية وتأمين النظام الآن؟ نوصي بشدة بتصدير نسخة احتياطية كاملة (.json) تحوي كافة الحركات المالية، الحضور، والطلاب بالتاريخ والساعة لتفادي أي عطل بجهاز الكمبيوتر.
            </p>

            {state.centerSettings?.backupDirectoryName && (
              <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80 text-xs flex justify-between items-center text-right">
                <span className="text-slate-400">مجلد التصدير المفضل:</span>
                <span className="font-extrabold text-indigo-400 max-w-[170px] truncate block" title={state.centerSettings.backupDirectoryName}>
                  {state.centerSettings.backupDirectoryName}
                </span>
              </div>
            )}

            {isBackupLoading ? (
              <div className="flex flex-col items-center justify-center p-4 space-y-3 bg-slate-950/30 rounded-xl border border-slate-800/40">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                <span className="text-xs text-indigo-300 font-bold">جاري تصدير النسخة وتأمين البيانات اليومية...</span>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row-reverse gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await executeBackupDaily(true);
                    if (ok) {
                      setIsCloseSystemModalOpen(false);
                      setIsSystemLocked(true);
                    }
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition flex-1 cursor-pointer"
                >
                  <span>💾 نعم، تصدير آمن وقفل</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsCloseSystemModalOpen(false);
                    setIsSystemLocked(true);
                  }}
                  className="bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition flex-1 cursor-pointer"
                >
                  <span>⏭️ تخطي وتأمين كلي</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCloseSystemModalOpen(false)}
                  className="bg-slate-950 border border-slate-850 text-slate-400 hover:text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center transition cursor-pointer"
                >
                  <span>تراجع</span>
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Global Confirmation Dialog wrapper */}
      <ConfirmationModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        type={confirmState.type}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Firebase Rules Help Modal */}
      {showFirebaseHelp && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs font-sans text-right text-slate-100" dir="rtl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 relative overflow-hidden"
          >
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4 justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center text-lg shrink-0">
                  ☁️
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">حل مشكلة عدم الحفظ السحابي في Firebase</h3>
                  <p className="text-[10px] text-indigo-400">تفعيل واستقبال البيانات في قاعدة بيانات السنتر</p>
                </div>
              </div>
              <button 
                onClick={() => setShowFirebaseHelp(false)}
                className="text-slate-400 hover:text-white text-xs bg-slate-850 px-2.5 py-1.5 rounded-lg border border-slate-800 cursor-pointer"
              >
                إغلاق
              </button>
            </div>

            <div className="text-xs space-y-3 leading-relaxed text-slate-300">
              <p className="font-bold text-amber-400">
                ⚠️ سبب المشكلة: قواعد الحماية (Rules) في حساب الـ Firebase تمنع القراءة أو الكتابة بدون تسجيل دخول.
              </p>
              
              <p>لتفعيل الحفظ والمزامنة التلقائية واللحظية فوراً، يرجى اتباع الخطوات التالية البسيطة في دقيقة واحدة:</p>
              
              <ol className="list-decimal list-inside space-y-2 text-slate-400 mr-2">
                <li>افتح موقع <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 font-bold underline">مجلد تحكم Firebase Console</a>.</li>
                <li>اختر مشروعك <span className="text-slate-200 font-bold">center-management-legislator</span>.</li>
                <li>من القائمة الجانبية، اذهب إلى <span className="text-slate-200 font-bold">Build</span> ثم اضغط على <span className="text-indigo-400 font-bold">Realtime Database</span>.</li>
                <li>اضغط على التبويب العلوي المسمى <span className="text-amber-400 font-bold">Rules</span> (القواعد).</li>
                <li>قم باستبدال القواعد الموجودة هناك بـ المجموع التالي حرفياً:</li>
              </ol>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-left text-[11.5px] font-mono text-emerald-400 overflow-x-auto select-all">
{`{
  "rules": {
    ".read": "true",
    ".write": "true"
  }
}`}
              </div>

              <div className="bg-slate-950/40 p-3 rounded-2xl border border-indigo-500/10 text-right mt-2 space-y-1">
                <p className="font-bold text-indigo-400 flex items-center gap-1.5">
                  <span>ℹ️ حالة الخطأ الحالية المستلمة من Firebase:</span>
                </p>
                <div className="text-[11px] font-mono text-rose-400 bg-rose-500/5 p-2 rounded-lg border border-rose-500/10 truncate" title={firebaseError}>
                  {firebaseError || "PERMISSION_DENIED: Client does not have permission to perform this operation."}
                </div>
              </div>

              {/* Dynamic Connection Test Module */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 mt-4 text-center">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400">أداة فحص الاتصال التلقائي بالأقمار</span>
                  <button
                    type="button"
                    onClick={triggerFirebaseTest}
                    disabled={isTestingConnection}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg transition disabled:bg-slate-800 disabled:text-slate-500 cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    {isTestingConnection ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>جاري الفحص...</span>
                      </>
                    ) : (
                      <span>⚡ فحص الاتصال وقواعد الـ Rules</span>
                    )}
                  </button>
                </div>

                {testResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-xl text-xs font-bold text-right leading-relaxed ${
                      testResult.success
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                        : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                    }`}
                  >
                    <p className="flex items-start gap-1.5 font-sans">
                      <span className="shrink-0">{testResult.success ? "🟢" : "🔴"}</span>
                      <span>{testResult.message}</span>
                    </p>
                    {testResult.latency !== undefined && (
                      <p className="text-[10px] text-emerald-500/70 font-mono mt-1 text-left" dir="ltr">
                        Latency: {testResult.latency}ms
                      </p>
                    )}
                  </motion.div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
              <span className="text-[10px] text-slate-500 font-medium">EduCenter Cloud Utility</span>
              <button
                type="button"
                onClick={() => setShowFirebaseHelp(false)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition cursor-pointer"
              >
                حسناً، قمت بالتعديل
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Secretary Passcode PIN Authentication modal */}
      {isPinLoginModalOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs font-sans text-right text-slate-100 font-sans" dir="rtl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-4 relative overflow-hidden text-right"
          >
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3 justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg flex items-center justify-center font-bold">
                  🔑
                </div>
                <div>
                  <h3 className="font-bold text-white text-xs">تسجيل دخول مساعد سكرتارية</h3>
                  <p className="text-[9px] text-purple-400">يرجى كتابة كود المرور لتنشيط الحساب</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setIsPinLoginModalOpen(false);
                  setLoginPinError('');
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (!loginPinText) {
                setLoginPinError("يرجى كتابة الكود المروري الخاص بملفك أولاً.");
                return;
              }
              const matched = (state.secretaries || []).find(s => s.passcode === loginPinText);
              if (!matched) {
                setLoginPinError("⚠️ عذراً كود PIN المروري غير صحيح أو تم إلغاؤه!");
                return;
              }
              setCurrentSecretary(matched);
              setIsPinLoginModalOpen(false);
              setLoginPinText('');
              setLoginPinError('');
              setActiveTab('dashboard');
            }} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-bold mb-2 text-center">أدخل كود المرور PIN الفردي الخاص بك</label>
                <input 
                  type="password"
                  maxLength={6}
                  autoFocus
                  placeholder="••••"
                  value={loginPinText}
                  onChange={(e) => {
                    setLoginPinText(e.target.value.replace(/\D/g, ''));
                    setLoginPinError('');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 text-center text-lg text-indigo-400 font-mono font-bold tracking-widest focus:outline-hidden focus:border-purple-500"
                />
              </div>

              {loginPinError && (
                <div className="p-3 bg-rose-955/20 border border-rose-900/30 text-rose-450 rounded-xl text-center text-xs font-bold leading-relaxed">
                  {loginPinError}
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 flex justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsPinLoginModalOpen(false);
                    setLoginPinError('');
                  }}
                  className="flex-1 bg-slate-950 border border-slate-850 hover:bg-slate-850 hover:text-white text-slate-400 font-bold py-2 px-4 rounded-xl text-xs transition cursor-pointer"
                >
                  إلغاء التراجع
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition cursor-pointer"
                >
                  تنشيط وربط الدخول
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
