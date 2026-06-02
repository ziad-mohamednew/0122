export interface Student {
  id: string;
  code: string; // Unique student code
  name: string;
  phone: string;
  parentPhone: string;
  groupIds: string[]; // Linked groups
  teacherIds: string[]; // Associated teachers
  balance: number; // Student positive or negative balance (dues)
  createdAt: string;
  status: 'active' | 'inactive';
}

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  phone: string;
  commissionRate: number; // Percentage e.g. 80%
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  subject: string;
  teacherId: string;
  price: number; // Price per month or session
  schedules: { day: string; time: string }[]; // Flex schedules
  createdAt: string;
}

export interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  currency: string;
  date: string;
  months: string[]; // Automated monthly subscriptions bills it clears
  teacherIds: string[]; // One or more trainers gets split
  notes: string;
  timestamp: string;
}

export interface AttendanceRecord {
  id: string; // compound: groupId_date
  groupId: string;
  date: string; // YYYY-MM-DD
  records: {
    [studentId: string]: 'present' | 'absent' | 'excused';
  };
  timestamp: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  category: 'students' | 'groups' | 'payments' | 'attendance' | 'teachers' | 'system';
  details: string;
  operator: string;
}

export interface CenterSettings {
  name: string;
  address: string;
  phone: string;
  initialized: boolean;
  backupDirectoryName?: string; // Visual name of chosen backup folder
  autoBackupEnabled?: boolean; // Toggle auto backup
  logoUrl?: string; // Base64 data URL for optional center logo
  password?: string; // Optional login/PIN lock password
}

export interface AppData {
  students: Student[];
  teachers: Teacher[];
  groups: Group[];
  payments: Payment[];
  attendance: AttendanceRecord[];
  auditLogs: AuditLog[];
  centerSettings?: CenterSettings;
}
