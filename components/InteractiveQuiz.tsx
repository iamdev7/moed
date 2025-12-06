import React, { useState } from 'react';
import { ExamData, QuestionType } from '../types';
import { CheckCircle, XCircle, RefreshCw, Trophy, ArrowRight, ShieldCheck } from 'lucide-react';

interface Props {
  data: ExamData;
  onExit: () => void;
}

const InteractiveQuiz: React.FC<Props> = ({ data, onExit }) => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const handleAnswer = (qId: number, value: string) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const calculateScore = () => {
    let earnedPoints = 0;
    data.questions.forEach(q => {
      const userAns = answers[q.id];
      if (!userAns) return;

      if (q.type === QuestionType.MCQ || q.type === QuestionType.TRUE_FALSE) {
        if (userAns === q.correctAnswer) earnedPoints += q.points;
      }
    });
    setScore(earnedPoints);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const percentage = Math.round((score / data.totalPoints) * 100);

  return (
    <div className="max-w-3xl mx-auto mb-12 animate-fadeIn">
      
      {/* Score Card */}
      {submitted && (
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 text-center border border-slate-100 transform transition-all animate-slideDown">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${percentage >= 50 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            <Trophy size={40} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-2">
            {percentage >= 90 ? 'ممتاز!' : percentage >= 50 ? 'أحسنت!' : 'حاول مرة أخرى'}
          </h2>
          <p className="text-slate-500 mb-6">لقد حصلت على</p>
          <div className="text-5xl font-black text-teal-600 mb-2">{score} <span className="text-2xl text-slate-400">/ {data.totalPoints}</span></div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden max-w-sm mx-auto">
            <div 
              className={`h-full transition-all duration-1000 ${percentage >= 50 ? 'bg-green-500' : 'bg-red-500'}`} 
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Header */}
      {!submitted && (
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl p-8 text-white shadow-lg mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold mb-1">الاختبار التفاعلي</h2>
            <p className="text-teal-100 text-sm">أجب على الأسئلة التالية بدقة</p>
          </div>
          <ShieldCheck size={48} className="text-teal-200 opacity-50" />
        </div>
      )}

      {/* Questions */}
      <div className="space-y-6">
        {data.questions.map((q, idx) => (
          <div key={q.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-50 bg-slate-50/50">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-slate-800 leading-relaxed">
                  <span className="ml-3 text-teal-600">#{idx + 1}</span>
                  {q.text}
                </h3>
                <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                  {q.points} نقاط
                </span>
              </div>
            </div>

            <div className="p-6">
               {/* Feedback */}
              {submitted && (answers[q.id] || q.type === QuestionType.MCQ || q.type === QuestionType.TRUE_FALSE) && (
                <div className={`mb-4 p-4 rounded-xl flex items-center gap-3 ${
                  answers[q.id] === q.correctAnswer ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {answers[q.id] === q.correctAnswer ? <CheckCircle size={24} /> : <XCircle size={24} />}
                  <span className="font-bold">
                    {answers[q.id] === q.correctAnswer ? 'إجابة صحيحة!' : `للأسف إجابة خاطئة.`}
                  </span>
                </div>
              )}

              {/* Options */}
              <div className="space-y-3">
                {q.type === QuestionType.MCQ && q.options?.map((opt, i) => (
                  <label 
                    key={i} 
                    className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      answers[q.id] === opt 
                        ? 'bg-teal-50 border-teal-500' 
                        : 'hover:bg-slate-50 border-transparent bg-slate-50'
                    } ${submitted ? 'pointer-events-none opacity-100' : ''}`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                       answers[q.id] === opt ? 'border-teal-600' : 'border-slate-400'
                    }`}>
                      {answers[q.id] === opt && <div className="w-2.5 h-2.5 bg-teal-600 rounded-full" />}
                    </div>
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      value={opt}
                      checked={answers[q.id] === opt}
                      onChange={() => handleAnswer(q.id, opt)}
                      disabled={submitted}
                      className="hidden"
                    />
                    <span className="text-slate-700 font-medium">{opt}</span>
                    {submitted && opt === q.correctAnswer && <span className="mr-auto text-green-600 font-bold text-sm">الإجابة الصحيحة</span>}
                  </label>
                ))}

                {q.type === QuestionType.TRUE_FALSE && (
                  <div className="flex gap-4">
                    {['صح', 'خطأ'].map((opt) => (
                      <label 
                        key={opt}
                        className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                           answers[q.id] === opt 
                             ? 'bg-teal-50 border-teal-500' 
                             : 'hover:bg-slate-50 border-transparent bg-slate-50'
                        } ${submitted ? 'pointer-events-none' : ''}`}
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          value={opt}
                          checked={answers[q.id] === opt}
                          onChange={() => handleAnswer(q.id, opt)}
                          disabled={submitted}
                          className="hidden"
                        />
                        <span className="font-bold text-lg text-slate-800">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}
                
                {(q.type === QuestionType.MATCHING || q.type === QuestionType.ESSAY) && (
                   <div className="text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                     <p className="text-slate-500 text-sm">هذا النوع من الأسئلة يتطلب تقييم المعلم في النسخة المطبوعة.</p>
                     {submitted && (
                       <div className="mt-4 pt-4 border-t border-slate-200">
                         <p className="font-bold text-teal-700">الإجابة النموذجية:</p>
                         <p className="text-slate-700 mt-1">{q.correctAnswer}</p>
                       </div>
                     )}
                   </div>
                )}
              </div>
              
              {submitted && q.explanation && (
                  <div className="mt-4 text-sm text-blue-800 bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-2">
                      <div className="shrink-0 pt-1">💡</div>
                      <div>
                        <strong>توضيح:</strong>
                        <p>{q.explanation}</p>
                      </div>
                  </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 flex justify-end gap-4 pb-20">
        {!submitted ? (
          <button
            onClick={calculateScore}
            className="bg-teal-600 text-white px-10 py-4 rounded-xl font-bold hover:bg-teal-700 transition shadow-xl shadow-teal-200 w-full md:w-auto"
          >
            اعتماد الإجابة
          </button>
        ) : (
          <div className="flex gap-4 w-full md:w-auto">
             <button
              onClick={() => {
                  setSubmitted(false);
                  setAnswers({});
                  setScore(0);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex-1 bg-white border border-slate-300 text-slate-700 px-6 py-3 rounded-xl hover:bg-slate-50 font-bold transition flex items-center justify-center gap-2"
            >
              <RefreshCw size={20} />
              إعادة المحاولة
            </button>
            <button
              onClick={onExit}
              className="flex-1 bg-slate-800 text-white px-8 py-3 rounded-xl hover:bg-slate-900 transition font-bold flex items-center justify-center gap-2"
            >
              العودة
              <ArrowRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveQuiz;