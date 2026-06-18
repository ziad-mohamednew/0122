import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import * as admin from "firebase-admin";

dotenv.config();

const app = express();
const PORT = 3000;

// Enable body parsing with an adequate limit
app.use(express.json({ limit: "15mb" }));

// Initialize Firebase Admin SDK
let isFirebaseAdminInitialized = false;

try {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
      databaseURL: "https://center-management-legislator-default-rtdb.europe-west1.firebasedatabase.app"
    });
    console.log("[Firebase Admin] Service Account credentials loaded and initialized successfully.");
    isFirebaseAdminInitialized = true;
  } else {
    // Attempt application default credentials if running in a Google Cloud environment
    admin.initializeApp();
    console.log("[Firebase Admin] Initialized with Application Default Credentials.");
    isFirebaseAdminInitialized = true;
  }
} catch (error: any) {
  console.warn("[Firebase Admin] Could not initialize (it might be already initialized or keys are missing).", error.message);
}

// Phone number normalization for Egypt
function formatEgyptianPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[\s\-\+\(\)]/g, "");
  if (cleaned.startsWith("01")) {
    cleaned = "2" + cleaned; // convert 01234567890 to 201234567890
  } else if (cleaned.startsWith("1")) {
    cleaned = "20" + cleaned;
  }
  return cleaned;
}

app.post("/api/fcm/send", async (req, res) => {
  try {
    const { notificationId, title, body, receiverId, receiverRole, notificationType } = req.body;

    if (!title || !body) {
      return res.status(400).json({ success: false, error: "Missing title or body" });
    }

    if (!isFirebaseAdminInitialized && !admin.apps.length) {
      console.warn("Simulating FCM Send: Firebase Admin SDK is not initialized. Notification would be sent to:", receiverId, "Role:", receiverRole);
      return res.json({ success: true, simulated: true, message: "Simulated send since Firebase Admin SDK is not initialized." });
    }

    // In a real scenario, this would query Firebase for the user's FCM Token from `users/.../fcmToken`
    // using the receiverId (phone number or student code)
    // For this implementation, we will check if we can resolve the token.
    let targetTokens: string[] = [];

    try {
      const db = admin.database();
      
      if (receiverId === "all") {
        // Broadcast to all users
        const usersSnapshot = await db.ref('users').once('value');
        if (usersSnapshot.exists()) {
          usersSnapshot.forEach(child => {
            const userData = child.val();
            if (userData && userData.fcmToken && userData.active !== false) {
              // Target only specific roles if needed
              if (receiverRole === 'all' || userData.role === receiverRole) {
                 targetTokens.push(userData.fcmToken);
              }
            }
          });
        }
      } else {
        // Specific user - searching by receiverId (could be phone code or student code)
        // Usually, receiverId maps to UID, but assuming we lookup by phone for parents
        const usersSnapshot = await db.ref('users').orderByChild('phone').equalTo(receiverId).once('value');
        if (usersSnapshot.exists()) {
          usersSnapshot.forEach(child => {
            const userData = child.val();
             if (userData && userData.fcmToken && userData.active !== false) {
                 targetTokens.push(userData.fcmToken);
             }
          });
        }
      }
    } catch (e: any) {
      console.error("[FCM Engine] Error fetching tokens from Realtime Database:", e.message);
    }
    
    // Fallback topic messaging or log if no tokens found
    if (targetTokens.length === 0) {
      console.log(`[FCM Engine] No registered devices found for receiver: ${receiverId} (${receiverRole}). Simulated send.`);
      // If we want to use Topic messaging as fallback for 'all'
      if (receiverId === "all") {
         targetTokens = []; // You could send to topic here using admin.messaging().send({topic: 'all', notification: ...})
      } else {
         return res.json({
           success: true,
           simulated: true, 
           messageId: `simulated-fcm-${Date.now()}`,
           message: "No registered tokens found. Logged notification."
         });
      }
    }

    // Real FCM Multicast Dispatch using HTTP v1 (firebase-admin handles this under the hood)
    if (targetTokens.length > 0) {
      console.log(`[FCM Engine] Dispaching to ${targetTokens.length} devices.`);
      const fcmPayload = {
        notification: {
          title: title,
          body: body,
        },
        data: {
          notificationId: notificationId || "",
          type: notificationType || "system",
          click_action: "FLUTTER_NOTIFICATION_CLICK" // Common for cross-platform apps
        },
        tokens: targetTokens
      };

      const response = await admin.messaging().sendEachForMulticast(fcmPayload);
      console.log(`[FCM Engine] Sent! Success count: ${response.successCount}, Failure count: ${response.failureCount}`);
      
      return res.json({
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        messageId: `sent-fcm-${Date.now()}`
      });
    }

    return res.json({
      success: true,
      messageId: `simulated-fcm-${Date.now()}`
    });

  } catch (error: any) {
    console.error("FCM API Backend Error:", error);
    return res.status(500).json({ success: false, error: error.message || "Internal server error" });
  }
});

// WhatsApp send absence endpoint
app.post("/api/whatsapp/send-absence", async (req, res) => {
  try {
    const { studentName, gradeName, absenceDate, parentPhone, centerName, teacherName } = req.body;


    if (!studentName || !gradeName || !absenceDate || !parentPhone) {
      return res.status(400).json({
        success: false,
        error: "بيانات الطالب أو الصف أو رقم الهاتف غير مكتملة."
      });
    }

    const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
    const token = process.env.ULTRAMSG_TOKEN;

    if (!instanceId || !token) {
      return res.status(500).json({
        success: false,
        error: "بيانات بوابة واتساب غير مكتملة. يرجى إدخال مفاتيح ULTRAMSG_INSTANCE_ID و ULTRAMSG_TOKEN في لوحة الإعدادات (Settings -> Secrets) قبل البدء."
      });
    }

    const formattedPhone = formatEgyptianPhoneNumber(parentPhone);
    const isPhoneValid = /^\d{10,15}$/.test(formattedPhone);

    if (!isPhoneValid) {
      return res.status(400).json({
        success: false,
        error: `رقم الهاتف المستهدف غير مطابق للصيغة الدولية الصحيحة: ${parentPhone}`
      });
    }

    // Format current local Cairo time for precise educational logging
    const recordingTime = new Date().toLocaleTimeString('ar-EG', {
      timeZone: 'Africa/Cairo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const cName = centerName || "السنتر التعليمي";
    const tName = teacherName ? `\nالمدرس: ${teacherName}` : "";

    // Prepare message template exactly as instructed
    const messageText = `السلام عليكم ورحمة الله وبركاته

نحيط سيادتكم علماً بأن الطالب:
${studentName}

قد تم تسجيل غيابه اليوم:
${absenceDate} (في تمام الساعة: ${recordingTime})

الصف:
${gradeName}${tName}

يرجى التواصل مع إدارة سنتر ${cName} لمعرفة التفاصيل.

مع تحيات إدارة سنتر ${cName}.`;

    const url = `https://api.ultramsg.com/${instanceId}/messages/chat`;
    const payload = {
      token: token,
      to: formattedPhone,
      body: messageText
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const bodyText = await response.text();

    if (!response.ok) {
      return res.json({
        success: false,
        sent: false,
        error: `فشل استجابة بوابة الرسائل UltraMsg: ${bodyText}`,
        messageText
      });
    }

    let result;
    try {
      result = JSON.parse(bodyText);
    } catch {
      result = { raw: bodyText };
    }

    // UltraMsg typically returns { sent: 'true', id: ... } or { error: ... }
    if (result.sent === "true" || result.id || (result.success && result.success !== false)) {
      return res.json({
        success: true,
        sent: true,
        id: result.id,
        messageText
      });
    } else {
      return res.json({
        success: false,
        sent: false,
        error: result.error || "فشل غير معروف من سرفرات الإرسال.",
        messageText
      });
    }

  } catch (error: any) {
    console.error("WhatsApp API Error in backend:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "حدث خطأ غير متوقع في خادم السنتر أثناء محاولة الإرسال."
    });
  }
});

// Serve static assets files in release, mount vite in development
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Center Management Server] running securely on http://localhost:${PORT}`);
  });
};

startServer();
