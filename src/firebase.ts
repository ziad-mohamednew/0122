import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, get } from 'firebase/database';
import { Student, Teacher, Group, Payment, AttendanceRecord, AuditLog, AppData, CenterSettings } from './types';

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

let db: any = null;
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
  auditLogs: [
    {
      id: "audit-1",
      timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      action: "تهيئة النظام",
      category: "system",
      details: "تم تشغيل نظام إدارة السنتر التعليمي للمرة الأولى بنجاح.",
      operator: "المدير العام"
    }
  ]
};

// Local storage key
const STORAGE_KEY = "educational_center_dashboard_data";

// Helper to sanitize arrays (converting sparse objects to arrays, and removing nulls)
function sanitizeArray<T>(arr: any): T[] {
  if (!arr) return [];
  const rawList = Array.isArray(arr) ? arr : Object.values(arr);
  return rawList.filter((item: any) => item !== null && typeof item === 'object') as T[];
}

export function sanitizeData(data: any): AppData {
  if (!data || typeof data !== 'object') {
    return initialMockData;
  }
  return {
    students: sanitizeArray<Student>(data.students),
    teachers: sanitizeArray<Teacher>(data.teachers),
    groups: sanitizeArray<Group>(data.groups),
    payments: sanitizeArray<Payment>(data.payments),
    attendance: sanitizeArray<AttendanceRecord>(data.attendance),
    auditLogs: sanitizeArray<AuditLog>(data.auditLogs),
    centerSettings: data.centerSettings ? {
      name: String(data.centerSettings.name || ''),
      address: String(data.centerSettings.address || ''),
      phone: String(data.centerSettings.phone || ''),
      initialized: Boolean(data.centerSettings.initialized),
      backupDirectoryName: data.centerSettings.backupDirectoryName ? String(data.centerSettings.backupDirectoryName) : undefined,
      autoBackupEnabled: data.centerSettings.autoBackupEnabled !== undefined ? Boolean(data.centerSettings.autoBackupEnabled) : undefined,
      logoUrl: data.centerSettings.logoUrl ? String(data.centerSettings.logoUrl) : undefined,
      password: data.centerSettings.password ? String(data.centerSettings.password) : undefined
    } : undefined
  };
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
export async function saveAppData(data: AppData, actionDescription?: string, category: AuditLog['category'] = 'system') {
  // Sanitize before saving
  const cleanData = sanitizeData(data);

  // Always update local storage first (instant sub-millisecond save)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanData));

  // Add audit log for this save if action is provided
  if (actionDescription) {
    const newLog: AuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: actionDescription,
      category,
      details: `تمت عملية تحديث: ${actionDescription}`,
      operator: "لوحة التحكم"
    };
    cleanData.auditLogs = [newLog, ...cleanData.auditLogs].slice(0, 500); // Limit logs to 500
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanData));
  }

  // Push to Firebase RTDB in background
  if (isFirebaseConnected && db) {
    try {
      const dbRef = ref(db, 'center_management_data');
      await set(dbRef, cleanData);
    } catch (e) {
      console.warn("Could not sync with Firebase database. Operating offline.", e);
    }
  }
}

// Real-time synchronization wrapper
export function setupFirebaseListener(onDataUpdated: (data: AppData) => void): () => void {
  if (isFirebaseConnected && db) {
    const dbRef = ref(db, 'center_management_data');
    return onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const sanitized = sanitizeData(data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
        onDataUpdated(sanitized);
      } else {
        // Realtime DB has no data yet, initialize it
        const localData = getLocalData();
        set(dbRef, localData).catch(err => console.error("Error setting initial Firebase structure:", err));
      }
    }, (error) => {
      console.error("Firebase listener error:", error);
    });
  }
  
  // Return dummy unsubscribe if Firebase runs offline
  return () => {};
}

export function isFirebaseSyncing(): boolean {
  return isFirebaseConnected;
}
