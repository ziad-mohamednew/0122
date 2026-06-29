import React, { useState } from 'react';
import { Announcement, TargetAudience, Secretary } from '../types';
import { Plus, Trash2, Link as LinkIcon, Send, Megaphone, CheckCircle2, Image as ImageIcon } from 'lucide-react';

interface AnnouncementsListProps {
  announcements: Announcement[];
  onAddAnnouncement: (announcement: Announcement) => void;
  onDeleteAnnouncement: (id: string) => void;
  currentOperator: Secretary | null;
}

export default function AnnouncementsList({
  announcements,
  onAddAnnouncement,
  onDeleteAnnouncement,
  currentOperator
}: AnnouncementsListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [actionText, setActionText] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [targetAudience, setTargetAudience] = useState<TargetAudience>('all');

  const [notificationState, setNotificationState] = useState<{show: boolean, text: string}>({ show: false, text: '' });

  const notify = (text: string) => {
    setNotificationState({ show: true, text });
    setTimeout(() => setNotificationState({ show: false, text: '' }), 3000);
  };

  const handleSave = () => {
    if (!title.trim() && !imageUrl.trim() && !content.trim()) {
      notify('يجب أن يحتوي الإعلان على نص أو صورة أو عنوان');
      return;
    }

    const newAnnouncement: Announcement = {
      id: "ann-" + Date.now().toString(),
      title: title.trim() || 'إعلان جديد',
      content: content.trim(),
      imageUrl: imageUrl.trim(),
      actionText: actionText.trim(),
      actionUrl: actionUrl.trim(),
      targetAudience,
      date: new Date().toISOString(),
      active: true,
      createdBy: currentOperator ? currentOperator.name : 'المدير العام'
    };

    onAddAnnouncement(newAnnouncement);
    setIsModalOpen(false);
    resetForm();
    notify('تم إضافة الإعلان بنجاح ونشره للجمهور المستهدف');
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setImageUrl('');
    setActionText('');
    setActionUrl('');
    setTargetAudience('all');
  };

  const getTargetText = (target: TargetAudience) => {
    switch(target) {
      case 'all': return 'الجميع';
      case 'students': return 'الطلاب فقط';
      case 'teachers': return 'المعلمين فقط';
      case 'parents': return 'أولياء الأمور';
      case 'secretaries': return 'فريق النظام (سكرتارية)';
      default: return 'الجميع';
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notificationState.show && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-50 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <p className="font-bold text-sm">{notificationState.text}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute left-0 top-0 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2"></div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
            <Megaphone className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white">منصة الإعلانات</h1>
            <p className="text-sm font-semibold text-slate-500 mt-1">تواصل مع الطلاب، المعلمين وأولياء الأمور</p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="relative z-10 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/30"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة إعلان جديد</span>
        </button>
      </div>

      {/* Grid of Announcements */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {announcements.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
              <Megaphone className="w-10 h-10 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-bold mb-2">لا توجد إعلانات حالياً</p>
            <p className="text-sm text-slate-400 dark:text-slate-500">قم بإنشاء إعلانك الأول ليصل للجمهور</p>
          </div>
        ) : (
          announcements.map((ann, idx) => (
            <div key={ann.id || idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden hover:shadow-xl transition-all flex flex-col">
              
              {/* Image Preview */}
              {ann.imageUrl && (
                <div className="w-full h-48 bg-slate-100 dark:bg-slate-800 relative">
                  <img src={ann.imageUrl} alt={ann.title} className="w-full h-full object-cover" />
                  <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${ann.active ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                    {getTargetText(ann.targetAudience)}
                  </div>
                </div>
              )}

              <div className="p-5 flex-1 flex flex-col">
                {!ann.imageUrl && (
                  <div className="mb-3 inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 w-fit">
                    <span className={`w-2 h-2 rounded-full ${ann.active ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                    {getTargetText(ann.targetAudience)}
                  </div>
                )}
                
                <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2">{ann.title}</h3>
                
                {ann.content && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 font-medium mb-4 whitespace-pre-wrap flex-1">{ann.content}</p>
                )}

                <div className="mt-auto space-y-4">
                  {ann.actionUrl && ann.actionText && (
                    <a href={ann.actionUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors w-fit">
                      <LinkIcon className="w-3.5 h-3.5" />
                      {ann.actionText}
                    </a>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400 font-semibold">بواسطة: {ann.createdBy}<br/>{new Date(ann.date).toLocaleDateString('ar-EG')}</p>
                    <button 
                      onClick={() => onDeleteAnnouncement(ann.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="حذف الإعلان"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto hidden-scrollbar">
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center">
                <Send className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white">نشر إعلان جديد</h3>
                <p className="text-xs font-semibold text-slate-500">اختر المحتوى والجمهور المستهدف بدقة</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 focus:text-indigo-500">عنوان الإعلان *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-semibold text-slate-800 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  placeholder="مثال: خصم خاص 20% على باقات التأسيس"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">محتوى الإعلان (نص اختياري)</label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-semibold text-slate-800 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all min-h-[120px]"
                  placeholder="اكتب تفاصيل الإعلان هنا..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 focus:text-indigo-500">
                  <div className="flex items-center gap-1 mb-1">
                    <ImageIcon className="w-4 h-4 text-slate-400" />
                    <span>رابط صورة (اختياري)</span>
                  </div>
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-semibold text-slate-800 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  placeholder="https://example.com/image.jpg"
                />
                {imageUrl && (
                  <div className="mt-3 p-1 border border-slate-200 dark:border-slate-700 rounded-xl w-32 h-24 overflow-hidden relative">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover rounded-lg" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">نص زر الإجراء (اختياري)</label>
                  <input
                    type="text"
                    value={actionText}
                    onChange={e => setActionText(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-semibold text-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-all"
                    placeholder="مثال: سجل الآن"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">رابط زر الإجراء (اختياري)</label>
                  <input
                    type="url"
                    value={actionUrl}
                    onChange={e => setActionUrl(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-semibold text-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-all"
                    placeholder="https://example.com/register"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الجمهور المستهدف *</label>
                <div className="flex flex-wrap gap-2">
                  {(['all', 'students', 'parents', 'teachers', 'secretaries'] as TargetAudience[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTargetAudience(t)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        targetAudience === t 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20' 
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                      }`}
                    >
                      {getTargetText(t)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={handleSave}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20"
              >
                نشر الإعلان الآن
              </button>
              <button
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="px-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold transition-all"
              >
                إلغاء
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
