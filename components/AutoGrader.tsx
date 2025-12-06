
import React, { useState, useRef } from 'react';
import { ExamData, GradingResult } from '../types';
import { gradeStudentSheet } from '../services/geminiService';
import { Upload, Camera, Loader, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Props {
  examData: ExamData;
  onClose: () => void;
}

const AutoGrader: React.FC<Props> = ({ examData, onClose }) => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GradingResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImage(reader.result);
          processGrading(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const processGrading = async (imgBase64: string) => {
    setLoading(true);
    try {
      const data = await gradeStudentSheet(imgBase64, examData);
      setResult(data);
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء التصحيح. يرجى محاولة صورة أوضح.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Side: Upload / Image Preview */}
        <div className="w-full md:w-1/2 bg-slate-900 p-6 flex flex-col items-center justify-center relative min-h-[400px]">
          {loading && (
             <div className="absolute inset-0 z-10 bg-black/70 flex flex-col items-center justify-center text-white">
               <Loader className="animate-spin mb-4 text-teal-400" size={48} />
               <p className="font-bold">جاري تحليل ورقة الطالب...</p>
             </div>
          )}

          {!image ? (
            <div className="text-center space-y-6">
               <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
                 <Camera size={40} />
               </div>
               <div className="text-white">
                 <h3 className="text-xl font-bold mb-2">رفع ورقة الإجابة</h3>
                 <p className="text-slate-400 text-sm max-w-xs mx-auto">قم بتصوير ورقة التظليل الخاصة بالطالب وارفعها هنا للتصحيح الفوري</p>
               </div>
               <button 
                 onClick={() => fileInputRef.current?.click()}
                 className="bg-teal-500 hover:bg-teal-400 text-slate-900 px-8 py-3 rounded-xl font-bold transition flex items-center gap-2 mx-auto"
               >
                 <Upload size={20} /> اختيار صورة
               </button>
               <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </div>
          ) : (
            <div className="relative w-full h-full flex flex-col">
              <img src={image} alt="Student Sheet" className="w-full h-auto rounded-lg object-contain max-h-[500px]" />
              <button onClick={reset} className="absolute top-2 right-2 bg-slate-800/80 text-white p-2 rounded-full hover:bg-red-500 transition">
                <XCircle size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Results */}
        <div className="w-full md:w-1/2 p-8 bg-slate-50 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-slate-800">نتيجة التصحيح</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">إغلاق</button>
          </div>

          {!result ? (
            <div className="flex-grow flex items-center justify-center text-slate-400 text-center p-8 border-2 border-dashed border-slate-200 rounded-xl">
              <p>بانتظار رفع الورقة لعرض النتائج...</p>
            </div>
          ) : (
            <div className="space-y-6 animate-fadeIn">
              {/* Summary Card */}
              <div className={`p-6 rounded-xl border ${result.score >= result.totalScore / 2 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                 <div className="flex justify-between items-start mb-2">
                   <div>
                     <p className="text-sm font-bold text-slate-500 mb-1">اسم الطالب (المقروء)</p>
                     <p className="text-xl font-black text-slate-800">{result.studentName}</p>
                   </div>
                   <div className="text-center bg-white p-3 rounded-lg shadow-sm min-w-[80px]">
                     <p className="text-xs text-slate-400 font-bold mb-1">الدرجة</p>
                     <p className={`text-2xl font-black ${result.score >= result.totalScore / 2 ? 'text-green-600' : 'text-red-600'}`}>
                       {result.score}/{result.totalScore}
                     </p>
                   </div>
                 </div>
              </div>

              <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-xs font-bold flex items-center gap-2 border border-amber-200">
                <AlertCircle size={16} />
                تنبيه: الدرجة المحسوبة للأسئلة الموضوعية فقط. المقالي يتطلب تصحيح يدوي.
              </div>

              {/* Details List */}
              <div className="flex-grow overflow-y-auto max-h-[350px] pr-2 space-y-3">
                 <h3 className="font-bold text-slate-700 mb-2">تفاصيل الأسئلة</h3>
                 {result.corrections.map((corr, idx) => (
                   <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                     <span className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                       {corr.questionId}
                     </span>
                     <div className="flex-grow">
                        {corr.isCorrect ? (
                          <p className="text-green-600 font-bold text-sm">إجابة صحيحة</p>
                        ) : (
                          <div className="flex gap-2 text-sm">
                             <span className="text-red-500 font-bold">إجابة الطالب: {corr.studentAnswer || 'لا يوجد'}</span>
                             <span className="text-slate-400">|</span>
                             <span className="text-green-600 font-bold">الصحيح: {corr.correctAnswer}</span>
                          </div>
                        )}
                     </div>
                     {corr.isCorrect ? <CheckCircle className="text-green-500" size={20} /> : <XCircle className="text-red-500" size={20} />}
                   </div>
                 ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AutoGrader;
