import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, set, push, onValue, get } from 'firebase/database';
import { Student, Teacher, Group, Payment, AttendanceRecord, AuditLog, AppData, CenterSettings, Secretary, Expense, WhatsAppLog, AppNotification } from './types';

// Realtime Database URL provided by the user
const DATABASE_URL = "https://center-management-legislator-default-rtdb.europe-west1.firebasedatabase.app/";

// Simple configuration - Web SDK will initialize correctly with just databaseURL
// We add default values to prevent SDK warnings if it expects typical keys
const firebaseConfig = {
  apiKey: "AIzaSyDummyKeyForEducationalCenterDbSync",
  authDomain: "center-management-legislator.firebaseapp.com",
  databaseURL: DATABASE_URL,
  projectId: "center-management-legislator",
  storageBucket: "center-management-legislator.appspot.com",
};

export let db: any = null;
let isFirebaseConnected = false;

try {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  db = getDatabase(app);
  isFirebaseConnected = true;
} catch (error) {
  console.error("Firebase Initialization Error, falling back to local storage:", error);
}

// Initial mockup data to populate on very first load if both Firebase and LocalStorage are empty
const initialMockData: AppData = {
  students: [
    {
      id: "std-1",
      code: "1001",
      name: "أحمد محمد علي",
      phone: "01012345678",
      parentPhone: "01234567890",
      groupIds: ["grp-1"],
      teacherIds: ["tch-1"],
      balance: -150, // owes 150
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      status: "active"
    },
    {
      id: "std-2",
      code: "1002",
      name: "سارة محمود أحمد",
      phone: "01122233344",
      parentPhone: "01511122233",
      groupIds: ["grp-1", "grp-2"],
      teacherIds: ["tch-1", "tch-2"],
      balance: 0, // fully paid
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      status: "active"
    },
    {
      id: "std-3",
      code: "1003",
      name: "يوسف كريم حسن",
      phone: "01233344455",
      parentPhone: "01099988877",
      groupIds: ["grp-2"],
      teacherIds: ["tch-2"],
      balance: -200, // owes 200
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: "active"
    }
  ],
  teachers: [
    {
      id: "tch-1",
      name: "أ. محمد عبد الرحمن",
      subject: "الرياضيات",
      phone: "01099988811",
      commissionRate: 80, // 80% to teacher
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "tch-2",
      name: "أ. مها مصطفى",
      subject: "الفيزياء",
      phone: "01188877722",
      commissionRate: 75, // 75% to teacher
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  groups: [
    {
      id: "grp-1",
      name: "مجموعة الرياضيات - الصف الأول الثانوي",
      subject: "الرياضيات",
      teacherId: "tch-1",
      price: 150,
      schedules: [
        { day: "الأحد", time: "16:00" },
        { day: "الثلاثاء", time: "16:00" }
      ],
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "grp-2",
      name: "مجموعة الفيزياء - الصف الثاني الثانوي",
      subject: "الفيزياء",
      teacherId: "tch-2",
      price: 200,
      schedules: [
        { day: "الأثنين", time: "18:00" },
        { day: "الخميس", time: "18:00" }
      ],
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  payments: [
    {
      id: "pay-1",
      studentId: "std-2",
      studentName: "سارة محمود أحمد",
      amount: 350,
      currency: "EGP",
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      months: ["2026-06"],
      teacherIds: ["tch-1", "tch-2"],
      notes: "سداد اشتراك الرياضيات والفيزياء لشهر يونيو",
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  attendance: [
    {
      id: "grp-1_2026-06-01",
      groupId: "grp-1",
      date: "2026-06-01",
      records: {
        "std-1": "present",
        "std-2": "present"
      },
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  secretaries: [],
  expenses: [],
  whatsAppLogs: [],
  auditLogs: [
    {
      id: "audit-1",
      timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      action: "تهيئة النظام",
      category: "system",
      details: "تم تشغيل نظام إدارة السنتر التعليمي للمرة الأولى بنجاح.",
      operator: "المدير العام"
    }
  ],
  notifications: []
};

// Local storage key
const STORAGE_KEY = "educational_center_dashboard_data";

// Helper to sanitize arrays (converting sparse objects to arrays, and removing nulls)
function sanitizeArray<T extends { id?: string }>(arr: any): T[] {
  if (!arr) return [];
  const rawList = Array.isArray(arr) ? arr : Object.values(arr);
  const filtered = rawList.filter((item: any) => item !== null && typeof item === 'object') as T[];
  
  // Deduplicate by id if present
  const seenIds = new Set<string>();
  const uniqueList: T[] = [];
  
  for (const item of filtered) {
    if (item.id) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        uniqueList.push(item);
      }
    } else {
      uniqueList.push(item);
    }
  }
  
  return uniqueList;
}

function removeUndefinedRecursive(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedRecursive(item));
  } else if (obj !== null && typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      if (value !== undefined) {
        cleaned[key] = removeUndefinedRecursive(value);
      }
    }
    return cleaned;
  }
  return obj;
}

export function sanitizeData(data: any): AppData {
  if (!data || typeof data !== 'object') {
    return initialMockData;
  }
  const raw = {
    students: sanitizeArray<Student>(data.students),
    teachers: sanitizeArray<Teacher>(data.teachers),
    groups: sanitizeArray<Group>(data.groups),
    payments: sanitizeArray<Payment>(data.payments),
    attendance: sanitizeArray<AttendanceRecord>(data.attendance),
    secretaries: sanitizeArray<Secretary>(data.secretaries),
    auditLogs: sanitizeArray<AuditLog>(data.auditLogs),
    expenses: sanitizeArray<Expense>(data.expenses),
    whatsAppLogs: sanitizeArray<WhatsAppLog>(data.whatsAppLogs),
    notifications: sanitizeArray<AppNotification>(data.notifications),
    centerSettings: data.centerSettings ? {
      name: String(data.centerSettings.name || ''),
      address: String(data.centerSettings.address || ''),
      phone: String(data.centerSettings.phone || ''),
      initialized: Boolean(data.centerSettings.initialized),
      backupDirectoryName: data.centerSettings.backupDirectoryName ? String(data.centerSettings.backupDirectoryName) : undefined,
      autoBackupEnabled: data.centerSettings.autoBackupEnabled !== undefined ? Boolean(data.centerSettings.autoBackupEnabled) : undefined,
      logoUrl: data.centerSettings.logoUrl ? String(data.centerSettings.logoUrl) : undefined,
      password: data.centerSettings.password ? String(data.centerSettings.password) : undefined,
      whatsappInstanceId: data.centerSettings.whatsappInstanceId ? String(data.centerSettings.whatsappInstanceId) : undefined,
      whatsappToken: data.centerSettings.whatsappToken ? String(data.centerSettings.whatsappToken) : undefined
    } : undefined
  };

  return removeUndefinedRecursive(raw);
}

// Load from local storage
export function getLocalData(): AppData {
  const local = localStorage.getItem(STORAGE_KEY);
  if (local) {
    try {
      const parsed = JSON.parse(local);
      return sanitizeData(parsed);
    } catch {
      return initialMockData;
    }
  }
  // Store initial defaults if empty
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialMockData));
  return initialMockData;
}

// Save directly to LocalStorage + Sync with Firebase RTDB
let activeStatusCallback: ((status: 'connected' | 'connecting' | 'permission-denied' | 'error' | 'offline', errorMsg?: string) => void) | null = null;

function updateStatus(status: 'connected' | 'connecting' | 'permission-denied' | 'error' | 'offline', msg?: string) {
  if (activeStatusCallback) {
    activeStatusCallback(status, msg);
  }
}

/**
 * Test the live read/write connection to Firebase Realtime Database
 * by writing to a test node and reading it back.
 */
export async function testFirebaseConnection(): Promise<{ success: boolean; message: string; latency?: number }> {
  if (!isFirebaseConnected || !db) {
    return { 
      success: false, 
      message: "لم يتم تهيئة الـ SDK الخاص بـ Firebase بشكل سليم أو السحابة معطلة محلياً." 
    };
  }

  const startTime = Date.now();
  try {
    // 1. Try to write a tiny test ping
    const testPingRef = ref(db, 'firebase_connection_pings/' + Date.now());
    await set(testPingRef, {
      timestamp: new Date().toISOString(),
      clientTime: startTime,
      operator: "فحص الاتصال التلقائي"
    });

    // 2. Try to read it back to confirm full read-write loop works
    const snapshot = await get(testPingRef);
    const latency = Date.now() - startTime;

    if (snapshot.exists()) {
      updateStatus('connected');
      return {
        success: true,
        message: `تم الاتصال بنجاح! السحابة تعمل بكل طاقتها وزمن الاستجابة هو ${latency}ms والمزامنة نشطة ولحظية.`,
        latency
      };
    } else {
      return {
        success: false,
        message: "تم حفظ بيانات الفحص ولكن لم نتمكن من قراءتها مجدداً! يرجى فحص صلاحيات وقواعد القراءة والقسم الخاص بالـ Rules."
      };
    }
  } catch (err: any) {
    console.error("Firebase connection test error details:", err);
    let arabicMsg = "فشل الاتصال: خطأ غير معروف أثناء الاتصال بالسيرفر.";
    
    if (err.message) {
      if (err.message.includes("PERMISSION_DENIED") || err.message.toLowerCase().includes("permission") || err.name === 'Error') {
        arabicMsg = "فشل الاتصال بسبب قواعد الحماية (Permission Denied): يرجى مراجعة الـ Rules في كونسول الـ Firebase وتفعيل '.read: true' و '.write: true'.";
        updateStatus('permission-denied', arabicMsg);
      } else if (err.message.includes("network") || err.message.toLowerCase().includes("network")) {
        arabicMsg = "فشل الاتصال: يرجى التحقق من اتصال الإنترنت بجهازك.";
        updateStatus('offline', arabicMsg);
      } else {
        arabicMsg = `فشل الاتصال بالسيرفر: ${err.message}`;
        updateStatus('error', arabicMsg);
      }
    }
    
    return {
      success: false,
      message: arabicMsg
    };
  }
}

export async function saveAppData(data: AppData, actionDescription?: string, category: AuditLog['category'] = 'system', operatorUsername: string = "المسؤول العام") {
  // Sanitize before saving
  const cleanData = sanitizeData(data);

  // Always update local storage first (instant sub-millisecond local resilience)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanData));

  // Add audit log for this save if action is provided
  if (actionDescription) {
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      timestamp: new Date().toISOString(),
      action: actionDescription,
      category,
      details: `تمت عملية تحديث: ${actionDescription}`,
      operator: operatorUsername
    };
    cleanData.auditLogs = [newLog, ...cleanData.auditLogs].slice(0, 500); // Limit logs to 500
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanData));
  }

  // Push to Firebase RTDB instantly using set to guarantee real-time server-side synchronization
  if (isFirebaseConnected && db) {
    try {
      // Modern separate modular nodes for notifications engine & apps
      const promises = [
        set(ref(db, 'students'), cleanData.students),
        set(ref(db, 'teachers'), cleanData.teachers),
        set(ref(db, 'groups'), cleanData.groups), // Equivalent to subjects
        set(ref(db, 'attendance'), cleanData.attendance),
        set(ref(db, 'payments'), cleanData.payments),
        set(ref(db, 'secretaries'), cleanData.secretaries || []),
        set(ref(db, 'settings'), cleanData.centerSettings || {}),
        set(ref(db, 'logs'), cleanData.auditLogs),
        set(ref(db, 'notifications'), cleanData.notifications || []),
        
        // Push legacy chunk as well not to break anything immediately during transition
        set(ref(db, 'center_management_data'), cleanData)
      ];

      await Promise.all(promises);
      updateStatus('connected');
    } catch (err: any) {
      console.warn("Could not sync with Firebase database. Operating offline.", err);
      if (err.message && (err.message.includes('PERMISSION_DENIED') || err.message.toLowerCase().includes('permission') || err.name === 'Error')) {
        updateStatus('permission-denied', 'فشلت عملية الحفظ: قواعد البيانات (Rules) تمنع الكتابة العامة. يرجى تعديلها في كونسول Firebase إلى true.');
      } else {
        updateStatus('error', err.message || 'خطأ أثناء مزامنة البيانات السحابية');
      }
    }
  }
}

// Real-time synchronization wrapper
export function setupFirebaseListener(
  onDataUpdated: (data: AppData) => void,
  onStatusUpdated?: (status: 'connected' | 'connecting' | 'permission-denied' | 'error' | 'offline', errorMsg?: string) => void
): () => void {
  if (onStatusUpdated) {
    activeStatusCallback = onStatusUpdated;
    activeStatusCallback('connecting');
  }

  if (isFirebaseConnected && db) {
    const dbRef = ref(db, 'center_management_data');
    
    // Listen to /.info/connected
    const connectedRef = ref(db, '.info/connected');
    const unsubscribeConnected = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        updateStatus('connected');
      } else {
        updateStatus('offline', 'أنت تعمل في وضع عدم الاتصال بالإنترنت حالياً');
      }
    });

    const unsubscribeData = onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      updateStatus('connected');
      if (data) {
        const sanitized = sanitizeData(data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
        onDataUpdated(sanitized);
      } else {
        // Realtime DB has no data yet, initialize it
        const localData = getLocalData();
        set(dbRef, localData)
          .then(() => {
            updateStatus('connected');
          })
          .catch((err: any) => {
            console.error("Error setting initial Firebase structure:", err);
            if (err.message && (err.message.includes('PERMISSION_DENIED') || err.message.toLowerCase().includes('permission'))) {
              updateStatus('permission-denied', 'فشل الإعداد الأولي: يرجى فتح الصلاحيات (Rules) بالقراءة والكتابة في كونسول Firebase.');
            } else {
              updateStatus('error', err.message || 'خطأ غير معروف في مزامنة قاعدة البيانات');
            }
          });
      }
    }, (error) => {
      console.error("Firebase listener error:", error);
      if (error.message && (error.message.includes('PERMISSION_DENIED') || error.message.toLowerCase().includes('permission') || error.message.toLowerCase().includes('denied'))) {
        updateStatus('permission-denied', 'خطأ في قواعد الحماية (Permission Denied): يرجى تعديل Rules في Firebase Console إلى "read: true, write: true" للعمل سحابياً.');
      } else {
        updateStatus('error', error.message || 'فشلت المزامنة السحابية مع السيرفر');
      }
    });

    return () => {
      unsubscribeConnected();
      unsubscribeData();
      activeStatusCallback = null;
    };
  }
  
  updateStatus('offline', 'تم تعطيل السحابة أو أنها غير مهيأة بشكل صحيح');
  return () => {};
}

export function isFirebaseSyncing(): boolean {
  return isFirebaseConnected;
}
