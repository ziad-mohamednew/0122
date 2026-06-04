import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Building2, MapPin, Phone, Check, FolderOpen, Image, Lock, X } from 'lucide-react';
import { CenterSettings } from '../types';

interface OnboardingScreenProps {
  onSave: (settings: CenterSettings) => void;
  initialSettings?: CenterSettings;
  onClose?: () => void;
}

export default function OnboardingScreen({ onSave, initialSettings, onClose }: OnboardingScreenProps) {
  const [name, setName] = useState(initialSettings?.name || '');
  const [address, setAddress] = useState(initialSettings?.address || '');
  const [phone, setPhone] = useState(initialSettings?.phone || '');
  const [backupDirectoryName, setBackupDirectoryName] = useState(initialSettings?.backupDirectoryName || '');
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(initialSettings?.autoBackupEnabled ?? true);
  const [logoUrl, setLogoUrl] = useState(initialSettings?.logoUrl || '');
  const [password, setPassword] = useState(initialSettings?.password || '');
  const [whatsappInstanceId, setWhatsappInstanceId] = useState(initialSettings?.whatsappInstanceId || '');
  const [whatsappToken, setWhatsappToken] = useState(initialSettings?.whatsappToken || '');
  const [error, setError] = useState('');

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setLogoUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePickDirectory = async () => {
    try {
      if ('showDirectoryPicker' in window) {
        const handle = await (window as any).showDirectoryPicker();
        setBackupDirectoryName(`📁 ${handle.name}`);
        (window as any).selectedBackupDirectoryHandle = handle;
      } else {
        setBackupDirectoryName("📁 مجلد التنزيلات التلقائي للسنتر (تحميل تلقائي)");
      }
    } catch (e: any) {
      console.warn("Directory Picker rejected or not allowed:", e);
      setBackupDirectoryName("📁 مجلد التنزيلات التلقائي للسنتر (تحميل تلقائي)");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim() || !phone.trim()) {
      setError('⚠️ يرجى ملء جميع الحقول المطلوبة للمتابعة.');
      return;
    }
    setError('');
    onSave({
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim(),
      initialized: true,
      backupDirectoryName: backupDirectoryName || "📁 مجلد التنزيلات التلقائي للسنتر (تحميل تلقائي)",
      autoBackupEnabled,
      logoUrl,
      password: password.trim(),
      whatsappInstanceId: whatsappInstanceId.trim(),
      whatsappToken: whatsappToken.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md font-sans overflow-y-auto" dir="rtl">
      {/* Background visual graphics */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))] select-none pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 sm:p-8 shadow-2xl text-center my-8 z-10 overflow-hidden"
      >
        {/* Optional Close Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 left-4 bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-xl transition cursor-pointer z-50"
            title="إغلاق التفضيلات"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Decorative corner lights */}
        <div className="absolute -top-12 -left-12 w-24 h-24 bg-indigo-500/20 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />

        <div className="flex flex-col items-center">
          {/* Logo badge */}
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-extrabold shadow-lg shadow-indigo-600/20 mb-4 overflow-hidden font-sans">
            {logoUrl ? (
              <img src={logoUrl} alt="Center Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span>ED</span>
            )}
          </div>

          <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-bold px-3 py-1 rounded-full border border-indigo-500/25 mb-2">
            {initialSettings?.initialized ? "تعديل تفضيلات وبيانات السنتر" : "مرحباً بك في EduCenter Pro"}
          </span>

          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
            {initialSettings?.initialized ? "إعدادات وهوية السنتر التعليمي" : "إعداد الهوية للسنتر التعليمي"}
          </h2>
          <p className="text-slate-400 text-xs mt-1.5 max-w-sm font-semibold mx-auto leading-relaxed">
            {initialSettings?.initialized 
              ? "قم بتحديث الهوية، اللوجو السنوي، ورقم المرور السري لحماية وتأمين النظام بالكامل ومزامنته سحابياً." 
              : "أهلاً بك! يرجى تهيئة معلومات السنتر التعليمي الخاص بك لتخصيص كشوفات حضور الطلاب، إيصالات الدفع، وطباعة الأكواد فوراً."
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 text-right space-y-4">
          {/* Center Name */}
          <div>
            <label className="block text-slate-300 text-xs font-bold mb-2">
              اسم السنتر التعليمي <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Building2 className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                placeholder="مثال: سنتر الأوائل التعليمي، أكاديمية المتفوقين"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 text-white rounded-xl pr-10 pl-4 py-3 text-xs font-bold placeholder-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
              />
            </div>
          </div>

          {/* Center Address */}
          <div>
            <label className="block text-slate-300 text-xs font-bold mb-2">
              عنوان السنتر بالكامل <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <MapPin className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                placeholder="مثال: القاهرة، مدينة نصر، شارع الطيران بجوار مسجد رابعة"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 text-white rounded-xl pr-10 pl-4 py-3 text-xs font-bold placeholder-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
              />
            </div>
          </div>

          {/* Center Phone */}
          <div>
            <label className="block text-slate-300 text-xs font-bold mb-2">
              رقم تليفون السنتر / الواتساب <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Phone className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                placeholder="مثال: 01012345678 أو 0224012345"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 text-white rounded-xl pr-10 pl-4 py-3 text-xs font-bold placeholder-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition text-right"
              />
            </div>
          </div>

          {/* Logo upload (Optional) & Password Input (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 text-xs font-bold mb-2 flex items-center gap-1.5">
                <Image className="w-4 h-4 text-indigo-400" />
                <span>لوجو السنتر التعليمي (اختياري)</span>
              </label>
              <div className="flex items-center gap-3">
                <label className="bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 font-bold px-3 py-2.5 rounded-xl text-[11px] text-center cursor-pointer transition border border-indigo-500/30 block flex-1">
                  <span>اختر صورة اللوجو المعبرة</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                {logoUrl && (
                  <div className="w-10 h-10 border border-slate-700 rounded-xl overflow-hidden bg-white shrink-0 flex items-center justify-center p-0.5 relative">
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    <button 
                      type="button" 
                      onClick={() => setLogoUrl('')} 
                      className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full w-4.5 h-4.5 flex items-center justify-center text-[10px] font-bold hover:bg-rose-600"
                      title="حذف اللوجو"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-bold mb-2 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-indigo-400" />
                <span>رقم المرور لحماية النظام (اختياري)</span>
              </label>
              <div className="relative">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-450">
                  <Lock className="w-4 h-4 text-slate-500" />
                </span>
                <input
                  type="password"
                  placeholder="اتركه فارغاً للدخول التلقائي بدون قفل"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 text-white rounded-xl pr-10 pl-4 py-3 text-xs font-bold placeholder-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition text-right"
                />
              </div>
            </div>
          </div>

          {/* WhatsApp Gateway Integration (UltraMsg) */}
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-indigo-455 border-b border-slate-800 pb-2 flex items-center gap-1.5">
              <span>💬 إعدادات بوابة واتساب (UltraMsg) - خاص بالإدارة فقط</span>
            </h4>
            <p className="text-[10px] text-slate-450 leading-relaxed">
              تقوم هذه البوابة بإرسال إشعارات غياب وحضور الطلاب لأولياء الأمور تلقائياً في الخلفية. يتم تشفير الأكواد وحفظها محلياً سحابياً بشكل كامل.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 text-[10px] font-bold mb-1">
                  معرف المثيل (Instance ID)
                </label>
                <input
                  type="text"
                  placeholder="مثال: instance1234"
                  value={whatsappInstanceId}
                  onChange={(e) => setWhatsappInstanceId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg px-3 py-2 text-[11px] font-mono font-bold focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] font-bold mb-1">
                  مفتاح المرور الشخصي (Token)
                </label>
                <input
                  type="password"
                  placeholder="أدخل الـ Token السري للخدمة"
                  value={whatsappToken}
                  onChange={(e) => setWhatsappToken(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg px-3 py-2 text-[11px] font-mono focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Backup Configurations Settings */}
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-indigo-400 border-b border-slate-800 pb-2 flex items-center gap-1.5">
              <span>💾 إرشادات الحفظ الاحتياطي التلقائي (الأمان السنوي)</span>
            </h4>

            {/* Auto backup checkbox */}
            <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-slate-300">
              <input 
                type="checkbox" 
                checked={autoBackupEnabled}
                onChange={(e) => setAutoBackupEnabled(e.target.checked)}
                className="w-4.5 h-4.5 text-indigo-600 rounded-md border-slate-800 bg-slate-900 focus:ring-indigo-500 cursor-pointer"
              />
              <span>تفعيل الحفظ التلقائي عند مغادرة وتأمين النظام يومياً</span>
            </label>

            {/* Folder select button */}
            <div className="space-y-2">
              <label className="block text-slate-400 text-[10px] sm:text-xs">
                مجلد النسخ الاحتياطية المفضل على جهازك:
              </label>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handlePickDirectory}
                  className="bg-indigo-600/10 hover:bg-indigo-600/25 border border-indigo-500/20 text-indigo-400 font-bold px-3 py-2 rounded-lg text-xs flex items-center justify-center gap-1 transition"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>تحديد مجلد على جهازك</span>
                </button>

                <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg text-[10px] sm:text-xs font-bold text-slate-300 truncate flex-1 text-center flex items-center justify-center">
                  {backupDirectoryName || "⚠️ لم يتم تحديد مجلد (سيتم الحفظ في التنزيلات)"}
                </div>
              </div>
              <p className="text-[9px] text-slate-500 leading-relaxed text-right">
                💡 في حال تحديد مجلد؛ سيقوم النظام بالكتابة إليه مباشرة، وإلا سيستعين بالتنزيلات التلقائية لملفات الـ JSON الآمنة بالتاريخ والوقت.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs font-bold">
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            className="w-full mt-6 bg-indigo-650 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/15 cursor-pointer"
          >
            <span>{initialSettings?.initialized ? "حفظ التغييرات الجديدة وتحديث الهوية" : "بدء استخدام النظام السحابي بنجاح"}</span>
            <Check className="w-4 h-4" />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
