import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Calendar, 
  Search, 
  QrCode, 
  Users, 
  Clock, 
  UserCheck, 
  Layers,
  Sparkles,
  Camera,
  X,
  Compass
} from 'lucide-react';
import { Student, Group, Teacher, AttendanceRecord } from '../types';

interface AttendanceSheetProps {
  students: Student[];
  groups: Group[];
  teachers: Teacher[];
  attendance: AttendanceRecord[];
  onSaveAttendance: (record: AttendanceRecord) => void;
  onUpdateStudentGroups?: (studentId: string, groupIds: string[]) => void;
  showConfirm?: (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }) => void;
}

export default function AttendanceSheet({ 
  students, 
  groups, 
  teachers, 
  attendance, 
  onSaveAttendance,
  onUpdateStudentGroups,
  showConfirm
}: AttendanceSheetProps) {
  
  // Selection states
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [studentSearch, setStudentSearch] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const handleDateChange = (val: string) => {
    if (val > todayStr) {
      if (showConfirm) {
        showConfirm({
          title: "تنبيه هام",
          message: "عذراً، لا يمكنك تسجيل الحضور في تاريخ مستقبلي! يرجى اختيار تاريخ اليوم أو الأيام السابقة فقط.",
          confirmText: "حسناً",
          type: "warning",
          onConfirm: () => {}
        });
      }
      setAttendanceDate(todayStr);
    } else {
      setAttendanceDate(val);
    }
  };

  // Active records holding dynamic attendance state for current date & group
  const [currentRecords, setCurrentRecords] = useState<{ [studentId: string]: 'present' | 'absent' | 'excused' }>({});

  // Fast QR Scanner State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerInputVal, setScannerInputVal] = useState('');
  const [scannerSuccessMessage, setScannerSuccessMessage] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load existing attendance if already saved for this group & date
  useEffect(() => {
    if (selectedGroupId && attendanceDate) {
      const compositeId = `${selectedGroupId}_${attendanceDate}`;
      const existing = attendance.find(a => a.id === compositeId);
      
      const groupStudents = students.filter(s => s.groupIds && s.groupIds.includes(selectedGroupId));
      
      const initialMap: { [studentId: string]: 'present' | 'absent' | 'excused' } = {};
      
      groupStudents.forEach(s => {
        if (existing && existing.records[s.id]) {
          initialMap[s.id] = existing.records[s.id];
        } else {
          // Default to absent until marked present or excused
          initialMap[s.id] = 'absent';
        }
      });
      
      setCurrentRecords(initialMap);
    } else {
      setCurrentRecords({});
    }
  }, [selectedGroupId, attendanceDate, attendance, students]);

  // Handle individual status toggle
  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'excused') => {
    const updated = { ...currentRecords, [studentId]: status };
    setCurrentRecords(updated);
    
    // Auto-save on every individual tap for fluid real-time experience!
    onSaveAttendance({
      id: `${selectedGroupId}_${attendanceDate}`,
      groupId: selectedGroupId,
      date: attendanceDate,
      records: updated,
      timestamp: new Date().toISOString()
    });
  };

  // Mass Check-All
  const handleMarkAllPresent = () => {
    const updated = { ...currentRecords };
    Object.keys(updated).forEach(id => {
      updated[id] = 'present';
    });
    setCurrentRecords(updated);
    
    onSaveAttendance({
      id: `${selectedGroupId}_${attendanceDate}`,
      groupId: selectedGroupId,
      date: attendanceDate,
      records: updated,
      timestamp: new Date().toISOString()
    });
  };

  // Mass Uncheck-All
  const handleMarkAllAbsent = () => {
    const updated = { ...currentRecords };
    Object.keys(updated).forEach(id => {
      updated[id] = 'absent';
    });
    setCurrentRecords(updated);

    onSaveAttendance({
      id: `${selectedGroupId}_${attendanceDate}`,
      groupId: selectedGroupId,
      date: attendanceDate,
      records: updated,
      timestamp: new Date().toISOString()
    });
  };

  // Filter students showing in list of selected group
  const groupStudents = useMemo(() => {
    if (!selectedGroupId) return [];
    return students
      .filter(s => s.groupIds && s.groupIds.includes(selectedGroupId) && s.status === 'active')
      .filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.code.includes(studentSearch));
  }, [students, selectedGroupId, studentSearch]);

  // QR Simulator/Hardware input scanner form submit
  const handleQRScannerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannerInputVal.trim()) return;

    // Search for student with matched code
    const matchedStudent = students.find(s => s.code === scannerInputVal.trim() && s.status === 'active');
    
    if (matchedStudent) {
      // Is this student registered in the currently selected group?
      const isRegisteredInGroup = selectedGroupId && matchedStudent.groupIds && matchedStudent.groupIds.includes(selectedGroupId);

      if (isRegisteredInGroup) {
        // Yes, perfect! Update status to present
        handleStatusChange(matchedStudent.id, 'present');
        setScannerSuccessMessage(`🎉 تم تحضير الطالب: ${matchedStudent.name} بنجاح!`);
      } else {
        // Student is active but NOT in this group, let's alert but still allow instant registration or showing info
        setScannerSuccessMessage(`⚠️ الطالب ${matchedStudent.name} مسجل بالسنتر، لكن قد لا يكون مرتبطاً بهذه المجموعة!`);
        
        // Auto-link to group option! To make it extremely smart:
        if (showConfirm) {
          showConfirm({
            title: "ربط الطالب بالمجموعة فوراً",
            message: `⚠️ الطالب (${matchedStudent.name}) مسجل بنظام السنتر، ولكنه غير مضاف إلى المجموعة الحالية.\n\nهل تفضل موازنة حسابه وإلحاقه بها في قاعدة البيانات وتحضيره تلقائياً؟`,
            confirmText: "نعم، ربط وتحضير الطالب",
            cancelText: "إلغاء",
            type: "info",
            onConfirm: () => {
              const updatedGroupIds = [...(matchedStudent.groupIds || []), selectedGroupId];
              if (onUpdateStudentGroups) {
                onUpdateStudentGroups(matchedStudent.id, updatedGroupIds);
              } else {
                matchedStudent.groupIds = updatedGroupIds;
              }
              handleStatusChange(matchedStudent.id, 'present');
              setScannerSuccessMessage(`🎉 تم ربط وتحضير الطالب: ${matchedStudent.name} بالمجموعة!`);
            }
          });
        } else if (confirm(`الطالب ${matchedStudent.name} غيّر مسجل بهذه المجموعة. هل تود إلحاقه وتحضيره فوراً؟`)) {
          matchedStudent.groupIds = [...(matchedStudent.groupIds || []), selectedGroupId];
          handleStatusChange(matchedStudent.id, 'present');
          setScannerSuccessMessage(`🎉 تم ربط وتحضير الطالب: ${matchedStudent.name} بالمجموعة!`);
        }
      }
    } else {
      setScannerSuccessMessage(`❌ خطأ: كود الطالب (${scannerInputVal}) غير مضاف بقاعدة البيانات!`);
    }

    setScannerInputVal('');
    // Clear status alerts after 3 seconds
    setTimeout(() => setScannerSuccessMessage(''), 4000);
  };

  // Start real web-camera stream
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const constraints = { video: { facingMode: 'environment' } };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Camera permission denied or camera not found.", err);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Listen to scanner toggling
  useEffect(() => {
    if (isScannerOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isScannerOpen]);

  // Simulate scanning a test card instantly
  const handleSimulateScan = (code: string) => {
    setScannerInputVal(code);
    // Push the simulate click
    setTimeout(() => {
      const matched = students.find(s => s.code === code);
      if (matched) {
        handleStatusChange(matched.id, 'present');
        setScannerSuccessMessage(`📸 مسح ذكي ناجح! تم تحضير ${matched.name}.`);
      }
    }, 150);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">تحضير الحصص اليومي والغياب الغيابي</h1>
          <p className="text-slate-500 text-sm mt-1">اختيار المجموعة لإجراء الحصر، مع دعم التحضير الذكي ببطاقات QR.</p>
        </div>
        
        {/* QR Scanner Trigger */}
        <button 
          type="button"
          onClick={() => {
            if (!selectedGroupId) {
              if (showConfirm) {
                showConfirm({
                  title: "تنبيه هام",
                  message: "برجاء اختيار المجموعة المستهدفة أولاً للتحضير بـ QR!",
                  confirmText: "حسناً، اختيار الآن",
                  type: "info",
                  onConfirm: () => {}
                });
              }
              return;
            }
            setIsScannerOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all flex items-center gap-1.5 shadow-sm shadow-indigo-100"
        >
          <QrCode className="w-5 h-5" />
          <span>المسح الضوئي الذكي (QR Attendance)</span>
        </button>
      </div>

      {/* Selector Panels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Select group */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-2xs space-y-2">
          <label className="block text-slate-700 text-xs font-bold">المجموعة التعليمية المستهدفة</label>
          <select 
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 text-sm focus:outline-hidden"
          >
            <option value="">-- اختر المجموعة --</option>
            {groups.map(g => {
              const trainer = teachers.find(t => t.id === g.teacherId);
              return (
                <option key={g.id} value={g.id}>{g.name} ({trainer ? trainer.name : 'بدون معلم'})</option>
              );
            })}
          </select>
        </div>

        {/* Select date */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-2xs space-y-2">
          <label className="block text-slate-700 text-xs font-bold">تاريخ الحصة</label>
          <div className="relative">
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input 
              type="date" 
              value={attendanceDate}
              onChange={(e) => handleDateChange(e.target.value)}
              max={todayStr}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-slate-700 text-sm focus:outline-hidden"
            />
          </div>
        </div>

      </div>

      {/* Main Attendance Sheet Section */}
      {!selectedGroupId ? (
        <div className="bg-white p-20 text-center text-slate-400 rounded-2xl border border-slate-100 shadow-xs">
          يرجى اختيار المجموعة التعليمية والمادة الدراسية لعرض قائمة حضور الطلاب وكشوفات التحضير.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          
          {/* Controls toolbar */}
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 gap-4">
            
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={handleMarkAllPresent}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold px-4 py-2 rounded-lg transition"
              >
                ✓ تحضير الكل حاضر
              </button>
              <button 
                type="button"
                onClick={handleMarkAllAbsent}
                className="bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold px-4 py-2 rounded-lg transition"
              >
                ✕ تغييب كافة الطلاب
              </button>
            </div>

            {/* In-list filter search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="تصفية بقائمة الحضور الحالية..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-700 focus:outline-hidden"
              />
            </div>

          </div>

          {/* Table list of students */}
          {groupStudents.length === 0 ? (
            <div className="p-16 text-center text-slate-400">
              لا يتوفر أي طلاب مسجلين بهذه المجموعة التعليمية حالياً لمراجعتهم.
            </div>
          ) : (
            <div className="overflow-x-auto text-slate-700">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-slate-600 text-xs font-bold">
                    <th className="p-4 w-20">كود الطالب</th>
                    <th className="p-4">اسم الطالب</th>
                    <th className="p-4">رقم الهاتف</th>
                    <th className="p-4 text-center w-80">حالة حضور الحصة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {groupStudents.map((student) => {
                    const status = currentRecords[student.id] || 'absent';
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="p-4 font-mono font-bold text-xs text-slate-500">#{student.code}</td>
                        <td className="p-4">
                          <p className="font-bold text-slate-800 text-sm">{student.name}</p>
                          <span className="text-[10px] text-slate-400 block mt-0.5">مسجل منذ {new Date(student.createdAt).toLocaleDateString('ar-EG')}</span>
                        </td>
                        <td className="p-4 text-xs text-slate-500">{student.phone}</td>
                        <td className="p-4">
                          <div className="flex justify-center items-center gap-2">
                            
                            {/* Present tag */}
                            <button 
                              type="button"
                              onClick={() => handleStatusChange(student.id, 'present')}
                              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                status === 'present' 
                                  ? 'bg-emerald-500 text-white shadow-xs' 
                                  : 'bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                              }`}
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>حاضر</span>
                            </button>

                            {/* Absent tag */}
                            <button 
                              type="button"
                              onClick={() => handleStatusChange(student.id, 'absent')}
                              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                status === 'absent' 
                                  ? 'bg-rose-500 text-white shadow-xs' 
                                  : 'bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                              }`}
                            >
                              <XCircle className="w-4 h-4" />
                              <span>غائب</span>
                            </button>

                            {/* Excused tag */}
                            <button 
                              type="button"
                              onClick={() => handleStatusChange(student.id, 'excused')}
                              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                status === 'excused' 
                                  ? 'bg-amber-500 text-white shadow-xs' 
                                  : 'bg-slate-50 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                              }`}
                            >
                              <AlertCircle className="w-4 h-4" />
                              <span>إذن اعتذار</span>
                            </button>

                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer of attendance sheet */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between text-xs text-slate-500 font-bold">
            <div className="flex gap-4">
              <span>إجمالي المسجلين بالجروب: <strong>{groupStudents.length} طلاب</strong></span>
              <span>•</span>
              <span className="text-emerald-700">عدد الحضور: <strong>{Object.values(currentRecords).filter(v => v === 'present').length}</strong></span>
              <span>•</span>
              <span className="text-rose-600">عدد الغياب: <strong>{Object.values(currentRecords).filter(v => v === 'absent').length}</strong></span>
            </div>
            <span className="text-slate-400">تحفظ التعديلات لحظياً في السحابة</span>
          </div>

        </div>
      )}

      {/* QR Code fast scanning overlay screen Modal */}
      <AnimatePresence>
        {isScannerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-6 shadow-2xl relative"
            >
              <button 
                type="button" 
                onClick={() => setIsScannerOpen(false)}
                className="absolute top-4 left-4 bg-slate-100 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center pt-2">
                <h3 className="font-bold text-slate-800 text-lg flex items-center justify-center gap-2">
                  <QrCode className="w-6 h-6 text-indigo-600" />
                  <span>محطة تسجيل حضور الطلاب بـ QR</span>
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">توجيه كرت الطالب للكاميرا، أو إدخال الكود يدوياً للتحضير الفوري.</p>
              </div>

              {/* CAMERA RENDERING STREAM CONTAINER */}
              <div className="bg-slate-950 aspect-video rounded-xl relative overflow-hidden flex flex-col justify-center items-center text-white border border-slate-800">
                {isCameraActive ? (
                  <>
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      className="absolute inset-0 w-full h-full object-cover" 
                    />
                    {/* Glowing scanning radar line effect */}
                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-emerald-500 shadow-md shadow-emerald-400 animate-pulse bg-linear-to-r from-emerald-400 via-teal-300 to-emerald-400" />
                    <div className="absolute top-4 right-4 bg-slate-900/80 px-2.5 py-1 rounded-sm text-[10px] font-mono tracking-wider flex items-center gap-1 border border-slate-700">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                      <span>الكاميرا تعمل بنشاط</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6 space-y-3">
                    <Camera className="w-12 h-12 mx-auto text-slate-500 animate-bounce" />
                    <p className="text-slate-400 text-xs font-semibold">بوابة بث الفيديو الكاميرا غير مفعلة</p>
                    <p className="text-[10px] text-slate-500 max-w-xs mx-auto">سيتم استخدام حقل الكود الرقمي أو المحاكاة السريعة للتحضير بدلاً منها.</p>
                  </div>
                )}
              </div>

              {/* Fast manual / scanner submit form */}
              <form onSubmit={handleQRScannerSubmit} className="space-y-3">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="امسح الباركود، أو اكتب الكود (مثال: 1001)..."
                    value={scannerInputVal}
                    onChange={(e) => setScannerInputVal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm text-center font-mono tracking-widest focus:outline-hidden"
                    autoFocus
                  />
                  <button 
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-xl text-sm transition"
                  >
                    أدخل الحضور
                  </button>
                </div>
              </form>

              {/* Simulated Students fast click chips list for testing in iframe easily! */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[11px] text-zinc-500 font-bold block mb-2">محاكي اختبار التحضير بـ QR بنقرة زر (للاختبار السريع):</span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {students.filter(s => s.groupIds && s.groupIds.includes(selectedGroupId)).map(s => (
                    <button 
                      key={s.id}
                      type="button"
                      onClick={() => handleSimulateScan(s.code)}
                      className="bg-white hover:bg-indigo-50 hover:border-indigo-300 border border-slate-200 text-slate-700 text-[10px] py-1 px-2.5 rounded-lg flex items-center gap-1 transition font-semibold"
                    >
                      <span>🪪 {s.name} ({s.code})</span>
                    </button>
                  ))}
                  {students.filter(s => s.groupIds && s.groupIds.includes(selectedGroupId)).length === 0 && (
                    <span className="text-slate-400 text-[10px] italic">لا يوجد طلاب مسجلون بهذا الجروب لمحاكاتهم.</span>
                  )}
                </div>
              </div>

              {/* Status Banner updates */}
              {scannerSuccessMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3.5 rounded-xl border text-center text-xs font-bold leading-relaxed ${
                    scannerSuccessMessage.includes('❌') 
                      ? 'bg-rose-50 border-rose-100 text-rose-800' 
                      : scannerSuccessMessage.includes('⚠️') 
                        ? 'bg-amber-50 border-amber-100 text-amber-800' 
                        : 'bg-emerald-50 border-emerald-100 text-emerald-800'
                  }`}
                >
                  {scannerSuccessMessage}
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
