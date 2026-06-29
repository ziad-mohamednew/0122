import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { KeyRound, ShieldCheck, Eye, EyeOff, Search, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { Teacher, Student, Secretary, CenterSettings } from '../types';

interface PasswordManagerProps {
  teachers: Teacher[];
  students: Student[];
  secretaries: Secretary[];
  centerSettings?: CenterSettings;
}

export default function PasswordManager({
    teachers,
    students,
    secretaries,
    centerSettings
}: PasswordManagerProps) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authInput, setAuthInput] = useState('');
  const [authError, setAuthError] = useState('');
  
  const [activeTab, setActiveTab] = useState<'teachers' | 'secretaries' | 'students' | 'parents'>('teachers');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [revealedIds, setRevealedIds] = useState<{ id: string, type: 'teacher' | 'secretary' | 'student' | 'parent' }[]>([]);
  const [verifyModalTarget, setVerifyModalTarget] = useState<{ id: string, type: 'teacher' | 'secretary' | 'student' | 'parent' } | null>(null);
  const [verifyInput, setVerifyInput] = useState('');
  const [verifyError, setVerifyError] = useState('');

  const adminPassword = centerSettings?.password || '';

  const handleInitialAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword) {
      setIsAuthorized(true);
      return;
    }
    if (authInput === adminPassword) {
      setIsAuthorized(true);
      setAuthError('');
    } else {
      setAuthError('كلمة المرور غير صحيحة');
    }
  };

  const handleRevealAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword || verifyInput === adminPassword) {
      if (verifyModalTarget) {
        setRevealedIds(prev => [...prev, verifyModalTarget]);
      }
      setVerifyModalTarget(null);
      setVerifyInput('');
      setVerifyError('');
    } else {
      setVerifyError('كلمة المرور غير صحيحة');
    }
  };

  const isRevealed = (id: string, type: 'teacher' | 'secretary' | 'student' | 'parent') => {
    return revealedIds.some(r => r.id === id && r.type === type);
  };

  const handleHide = (id: string, type: 'teacher' | 'secretary' | 'student' | 'parent') => {
    setRevealedIds(prev => prev.filter(r => !(r.id === id && r.type === type)));
  };

  const handleRequestReveal = (id: string, type: 'teacher' | 'secretary' | 'student' | 'parent') => {
    if (!adminPassword) {
      setRevealedIds(prev => [...prev, { id, type }]);
    } else {
      setVerifyModalTarget({ id, type });
    }
  };

  const renderPasswordRow = (id: string, name: string, codeOrPhone: string, passcode: string | undefined, type: 'teacher' | 'secretary' | 'student' | 'parent') => (
    <div key={`${type}-${id}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-850 transition">
      <div>
        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{name}</h4>
        <p className={`text-xs font-mono mt-1 pt-0.5 inline-block rounded transition-all ${
          !isRevealed(id, type)
            ? 'blur-sm bg-slate-200 dark:bg-slate-800 text-transparent select-none'
            : 'text-slate-600 dark:text-slate-400 select-all'
        }`}>
          {codeOrPhone}
        </p>
      </div>
      <div className="flex items-center gap-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 rounded-lg min-w-[150px] justify-between shadow-sm">
         <span className="text-slate-600 dark:text-slate-350 font-bold text-xs select-none">
           PIN: {isRevealed(id, type) ? (
             <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold font-mono text-sm tracking-widest select-text">{passcode || '----'}</strong>
           ) : (
             <span className="tracking-widest">••••</span>
           )}
         </span>
         {isRevealed(id, type) ? (
           <button
             type="button"
             onClick={() => handleHide(id, type)}
             className="text-slate-400 hover:text-slate-600 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-md transition"
             title="إخفاء"
           >
             <EyeOff className="w-4 h-4" />
           </button>
         ) : (
           <button
             type="button"
             onClick={() => handleRequestReveal(id, type)}
             className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 dark:bg-indigo-900/30 p-1.5 rounded-md transition"
             title="إظهار"
           >
             <Eye className="w-4 h-4" />
           </button>
         )}
      </div>
    </div>
  );

  const filteredItems = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (activeTab === 'teachers') {
      return teachers.filter(t => t.name.toLowerCase().includes(term) || t.phone.includes(term));
    }
    if (activeTab === 'secretaries') {
      return secretaries.filter(s => s.name.toLowerCase().includes(term) || s.phone.includes(term));
    }
    if (activeTab === 'students') {
      return students.filter(s => s.name.toLowerCase().includes(term) || s.code.toLowerCase().includes(term));
    }
    if (activeTab === 'parents') {
      const parentGroups: Record<string, { id: string, studentNames: string[], parentPhone: string, passcode: string }> = {};
      students.forEach(s => {
        const phone = s.parentPhone || s.code; // fallback
        if (!parentGroups[phone]) {
          parentGroups[phone] = {
            id: s.id, // using first student's id as row key
            studentNames: [s.name],
            parentPhone: phone,
            passcode: s.parentPasscode || '----'
          };
        } else {
          if (!parentGroups[phone].studentNames.includes(s.name)) {
            parentGroups[phone].studentNames.push(s.name);
          }
        }
      });
      return Object.values(parentGroups).filter(p => p.parentPhone.includes(term) || p.studentNames.some(n => n.toLowerCase().includes(term)));
    }
    return [];
  }, [activeTab, searchTerm, teachers, secretaries, students]);

  if (!isAuthorized) {
    return (
        <div className="flex items-center justify-center min-h-[400px] p-4 font-sans text-right" dir="rtl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 w-full max-w-sm p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl"
          >
            <div className="flex flex-col items-center gap-3 mb-6">
              <div className="bg-indigo-100 dark:bg-indigo-900/50 p-4 rounded-full text-indigo-600 dark:text-indigo-400">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">بوابة كلمات المرور</h2>
              <p className="text-xs text-slate-500 text-center">
                هذا القسم محمي بخاصية الأمان. يرجى إدخال كلمة مرور السنتر الرئيسية للدخول.
              </p>
            </div>
            
            <form onSubmit={handleInitialAuth}>
              {!adminPassword && (
                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-400 text-xs font-bold text-center">
                  ⚠️ لم يتم تعيين كلمة مرور للسنتر، يمكنك الدخول مباشرة، ولكن ينصح بتعيين كلمة مرور من التفضيلات.
                </div>
              )}
              {adminPassword && (
                <input
                  type="password"
                  autoFocus
                  placeholder="أدخل كلمة مرور السنتر..."
                  value={authInput}
                  onChange={e => setAuthInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 mb-3 text-center text-sm font-bold tracking-widest focus:outline-none focus:border-indigo-500"
                />
              )}
              {authError && <p className="text-rose-500 text-xs text-center mb-3 font-bold">{authError}</p>}
              <button 
                 type="submit"
                 className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors cursor-pointer text-sm flex justify-center items-center gap-2 shadow-md shadow-indigo-600/20"
              >
                 <KeyRound className="w-4 h-4" />
                 <span>دخول آمن</span>
              </button>
            </form>
          </motion.div>
        </div>
    );
  }

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
             <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <KeyRound className="w-6 h-6 text-indigo-500" />
                <span>إدارة كلمات المرور والأرقام السرية</span>
             </h2>
             <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-semibold">
                استعرض وتتبع كلمات المرور التلقائية للدخول لجميع مستخدمي السنتر (المدرسين، الطلاب، السكرتارية).
             </p>
          </div>
          
          {/* Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
             {[
               { id: 'teachers', label: 'المدرسين' },
               { id: 'secretaries', label: 'المساعدين' },
               { id: 'students', label: 'الطلاب' },
               { id: 'parents', label: 'أولياء الأمور' }
             ].map(tab => (
               <button
                 key={tab.id}
                 onClick={() => { setActiveTab(tab.id as any); setSearchTerm(''); }}
                 className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                   activeTab === tab.id
                     ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                     : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750'
                 }`}
               >
                 {tab.label}
               </button>
             ))}
          </div>
        </div>

        <div className="relative mb-6">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
               <Search className="w-5 h-5" />
            </span>
            <input
               type="text"
               placeholder="ابحث بالاسم، أو الكود، أو رقم الجوال..."
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pr-10 pl-4 py-3 text-sm font-bold placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
            />
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
           {filteredItems.length === 0 ? (
             <div className="py-12 text-center flex flex-col items-center justify-center text-slate-400">
                <User className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-700" />
                <p className="text-sm font-bold text-slate-500">لا يوجد بيانات لعرضها هنا.</p>
             </div>
           ) : (
             filteredItems.map(item => {
               if (activeTab === 'teachers') {
                 const t = item as Teacher;
                 return renderPasswordRow(t.id, t.name, t.phone, t.passcode, 'teacher');
               }
               if (activeTab === 'secretaries') {
                 const s = item as Secretary;
                 return renderPasswordRow(s.id, s.name, s.phone, s.passcode, 'secretary');
               }
               if (activeTab === 'students') {
                 const st = item as Student;
                 return renderPasswordRow(st.id, st.name, `الكود: ${st.code} | الهاتف: ${st.phone}`, st.passcode, 'student');
               }
               if (activeTab === 'parents') {
                 // item is now the group object
                 const p = item as any;
                 const title = `ولي أمر: ${p.studentNames.join('، ')}`;
                 return renderPasswordRow(p.id, title, p.parentPhone, p.passcode, 'parent');
               }
               return null;
             })
           )}
        </div>
      </div>

      {/* Verify Modal */}
      {verifyModalTarget && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs text-right" dir="rtl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 w-full max-w-md p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div className="bg-amber-100 dark:bg-amber-950 p-2 rounded-xl text-amber-750 dark:text-amber-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="text-right">
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">تحقق أمني مطلوب</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">يرجى كتابة كلمة مرور السنتر لإظهار الرمز</p>
              </div>
            </div>

            <form onSubmit={handleRevealAuth} className="space-y-4">
              <input 
                 type="password"
                 autoFocus
                 required
                 placeholder="كلمة المرور الرئيسية..."
                 value={verifyInput}
                 onChange={e => {
                   setVerifyInput(e.target.value);
                   setVerifyError('');
                 }}
                 className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-center text-sm tracking-widest font-mono font-bold focus:outline-hidden focus:border-amber-500"
              />
              
              {verifyError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900 text-rose-600 dark:text-rose-400 rounded-xl text-center text-xs font-bold">
                  {verifyError}
                </div>
              )}

              <div className="flex gap-3 pt-3 border-t border-slate-150 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setVerifyModalTarget(null);
                    setVerifyInput('');
                    setVerifyError('');
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-755 text-slate-650 dark:text-slate-300 py-2 rounded-xl text-xs font-bold transition-colors"
                >
                  إلغاء التراجع
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-xl text-xs font-bold transition flex items-center justify-center shadow-sm cursor-pointer"
                >
                  تأكيد وعرض
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
