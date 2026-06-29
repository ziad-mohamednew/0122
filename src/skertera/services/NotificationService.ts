import { AppNotification } from '../../types';
import { getLocalData, saveAppData } from '../../firebase';

/**
 * Ensures a single source of truth for sending notifications within the Center Management app.
 * Adheres to:
 * 1. Store in local state/cache (for legacy & quick rendering)
 * 2. Push to Firebase via saveAppData
 * 3. Log errors if any
 * 4. Actually dispatch Push Notification (FCM) using backend API
 */
export const NotificationService = {
  
  async sendNotification(params: {
    title: string;
    body: string;
    receiverId: string | 'all'; // can be 'all', 'studentId', or 'parentPhone'
    receiverRole: 'parent' | 'student' | 'teacher' | 'all';
    notificationType: 'attendance' | 'announcement' | 'message' | 'system';
    eventId?: string; // used for idempotency
  }) {
    // 1. Load context
    const currentData = getLocalData();
    const notificationsList = currentData.notifications || [];
    
    // Check for idempotency to avoid double sends
    if (params.eventId && notificationsList.find(n => n.eventId === params.eventId)) {
      console.log(`Notification for event ${params.eventId} already sent. Skipping.`);
      return;
    }

    // 2. Create record
    const newRecord: AppNotification = {
      notificationId: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      title: params.title,
      body: params.body,
      receiverId: params.receiverId,
      receiverRole: params.receiverRole,
      createdAt: new Date().toISOString(),
      readStatus: false,
      notificationType: params.notificationType,
      eventId: params.eventId,
    };

    // 3. Update memory & save it
    currentData.notifications = [newRecord, ...notificationsList].slice(0, 1000); // keep history bounded
    
    // The save process will synchronize across all new structured nodes natively + legacy node
    await saveAppData(currentData, `إرسال إشعار (${params.notificationType}): ${params.title}`);

    // 4. Trigger actual Push Notification (Dispatching through central HTTP route to handle keys securely)
    try {
      if (typeof window !== 'undefined') {
        fetch('/api/fcm/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newRecord)
        }).catch(e => {
          console.warn("FCM Gateway is unreachable or failed:", e);
          // Logging to error system could be done here
        });
      }
    } catch (e) {
      console.error("Failed to dispatch push notification", e);
    }
    
    return newRecord;
  },

  async notifyAttendance(studentName: string, gradeName: string, parentPhone: string, date: string, status: string, attendanceRecordId: string) {
    if (status !== 'absent') return;
    
    await this.sendNotification({
      title: 'تسجيل غياب',
      body: `نحيطكم علماً بأن الطالب/الطالبة ${studentName} (${gradeName}) قد تم تسجيل غيابه عن حضور حصة اليوم ${date}.`,
      receiverId: parentPhone,
      receiverRole: 'parent',
      notificationType: 'attendance',
      eventId: attendanceRecordId // helps block duplicates
    });
  },
  
  async notifyAnnouncement(title: string, body: string, targetId: string | 'all', targetRole: 'parent'|'student'|'all' = 'all') {
    await this.sendNotification({
      title,
      body,
      receiverId: targetId,
      receiverRole: targetRole,
      notificationType: 'announcement'
    });
  }
};

