import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Enable body parsing with an adequate limit
app.use(express.json({ limit: "15mb" }));

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
