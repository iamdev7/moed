
import React from 'react';
import { ExamData, ExamHeader, Question, QuestionType, ExamTheme, ExamSettings } from '../types';

interface Props {
  data: ExamData;
  header: ExamHeader;
  mode: 'student' | 'teacher_key' | 'review';
  theme: ExamTheme;
  settings: ExamSettings;
  isEditing?: boolean;
  onUpdateQuestion?: (qId: number, field: keyof Question, value: any) => void;
}

const ExamPaper: React.FC<Props> = ({ data, header, mode, theme, settings, isEditing, onUpdateQuestion }) => {
  
  // QR Code now points to a verification URL
  const qrCodeData = `https://maad.app/verify/${data.id}?ver=${data.version}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrCodeData)}`;

  const getThemeStyles = () => {
    switch (theme) {
      case 'modern':
        return {
          container: "bg-white text-slate-800 font-sans",
          headerBorder: "border-b-4 border-teal-500",
          titleBox: "bg-teal-50 text-teal-900 rounded-xl",
          questionNumber: "bg-teal-600 text-white rounded-lg shadow-sm print:shadow-none print:border print:border-teal-700",
          questionText: "text-slate-800 font-bold",
          optionBox: "border border-slate-200 rounded-lg bg-slate-50 print:bg-transparent print:border-slate-300",
          footerBorder: "border-t-2 border-teal-100",
        };
      case 'formal':
        return {
          container: "bg-white text-black font-serif",
          headerBorder: "border-b border-black",
          titleBox: "border border-black",
          questionNumber: "border border-black bg-white text-black rounded-full",
          questionText: "text-black font-bold",
          optionBox: "border border-transparent",
          footerBorder: "border-t border-black",
        };
      case 'creative':
        return {
          container: "bg-white text-indigo-900 font-sans",
          headerBorder: "border-b-4 border-dashed border-indigo-300",
          titleBox: "bg-indigo-100 text-indigo-800 rounded-full px-6 print:bg-transparent print:border print:border-indigo-800",
          questionNumber: "bg-indigo-500 text-white rounded-full shadow-indigo-200 shadow-lg print:shadow-none print:bg-indigo-700",
          questionText: "text-indigo-900 font-bold print:text-indigo-950",
          optionBox: "border-2 border-indigo-50 rounded-2xl bg-white print:border-indigo-200",
          footerBorder: "border-t-4 border-dotted border-indigo-200",
        };
      case 'minimal':
        return {
          container: "bg-white text-gray-900 font-sans",
          headerBorder: "border-b border-gray-200",
          titleBox: "",
          questionNumber: "text-gray-900 font-black text-xl bg-transparent",
          questionText: "text-gray-900 font-medium text-lg",
          optionBox: "",
          footerBorder: "border-t border-gray-100",
        };
      default: // Classic
        return {
          container: "bg-white text-slate-900 font-sans border-4 border-double border-slate-800 m-2 p-6 rounded-none",
          headerBorder: "border-b-2 border-slate-900",
          titleBox: "border-2 border-slate-900 rounded-full",
          questionNumber: "bg-slate-900 text-white rounded-md print:bg-black",
          questionText: "text-slate-900 font-bold print:text-black",
          optionBox: "border border-transparent",
          footerBorder: "border-t-2 border-slate-900",
        };
    }
  };

  const styles = getThemeStyles();
  const fontClass = settings.isDyslexic ? 'font-dyslexic tracking-wide leading-loose' : '';

  // Helper for Bloom translation
  const getBloomLabel = (level: string) => {
    const map: any = { remember: 'تذكر', understand: 'فهم', apply: 'تطبيق', analyze: 'تحليل', evaluate: 'تقييم', create: 'ابتكار' };
    return map[level] || level;
  };

  const getQuestionContent = (q: Question, index: number) => {
    return (
      <div key={q.id} className="mb-6 break-inside-avoid page-break-inside-avoid relative group/q w-full">
        <div className="flex items-start gap-3">
          <span className={`w-8 h-8 flex items-center justify-center shrink-0 text-sm font-bold ${styles.questionNumber} ${theme === 'minimal' ? 'w-auto mr-0' : ''}`}>
            {theme === 'minimal' ? `${index + 1}.` : index + 1}
          </span>
          <div className="flex-grow min-w-0">
            <div className="flex justify-between items-start mb-3">
              <div className="flex flex-col gap-1 w-full">
                {settings.showBloom && q.bloomLevel && (
                  <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded w-fit mb-1 border border-purple-200 print:border-black print:text-black">
                     مهارة: {getBloomLabel(q.bloomLevel)}
                  </span>
                )}
                
                {isEditing ? (
                  <textarea 
                    className="w-full border border-blue-300 p-2 rounded bg-blue-50 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    value={q.text}
                    rows={2}
                    onChange={(e) => onUpdateQuestion && onUpdateQuestion(q.id, 'text', e.target.value)}
                  />
                ) : (
                  <p className={`text-lg leading-relaxed text-justify ${styles.questionText}`}>{q.text}</p>
                )}
              </div>
              
              {isEditing ? (
                 <div className="flex items-center gap-1 shrink-0 ml-2">
                   <input 
                     type="number" 
                     className="w-12 p-1 border border-blue-300 rounded text-center text-xs bg-blue-50"
                     value={q.points}
                     onChange={(e) => onUpdateQuestion && onUpdateQuestion(q.id, 'points', Number(e.target.value))}
                   />
                   <span className="text-xs">درجات</span>
                 </div>
              ) : (
                <span className={`text-xs font-bold px-2 py-1 whitespace-nowrap shrink-0 ml-2 ${theme === 'modern' ? 'bg-teal-50 text-teal-700 rounded print:border print:border-teal-500' : 'text-slate-500 print:text-black'}`}>
                  ({q.points} {settings.language === 'en' ? 'Points' : 'درجات'})
                </span>
              )}
            </div>

            {/* MCQ Options */}
            {q.type === QuestionType.MCQ && q.options && (
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 mr-1 print:grid-cols-2`}>
                {q.options.map((opt, i) => {
                  const isCorrect = mode !== 'student' && opt === q.correctAnswer;
                  return (
                    <div 
                      key={i} 
                      className={`flex items-center p-2 ${styles.optionBox} ${
                        isCorrect 
                        ? 'bg-green-100/50 print:bg-transparent font-bold print:border-black' 
                        : ''
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 mr-3 shrink-0 ${theme === 'formal' ? 'border-black' : 'border-slate-400 print:border-slate-600'}`} />
                      
                      {isEditing ? (
                        <input 
                          type="text"
                          className="flex-grow bg-blue-50 border-b border-blue-300 outline-none px-1 w-full"
                          value={opt}
                          onChange={(e) => {
                              const newOptions = [...(q.options || [])];
                              newOptions[i] = e.target.value;
                              onUpdateQuestion && onUpdateQuestion(q.id, 'options', newOptions);
                          }}
                        />
                      ) : (
                        <span className={`break-words ${isCorrect ? 'text-green-900 print:text-black' : ''}`}>{opt}</span>
                      )}

                      {isCorrect && <span className="mr-auto text-green-700 text-sm font-bold print:text-black font-sans">✓</span>}
                    </div>
                  );
                })}
              </div>
            )}

            {/* True/False */}
            {q.type === QuestionType.TRUE_FALSE && (
              <div className="flex gap-8 mr-4 mt-2">
                {[settings.language === 'en' ? 'True' : 'صح', settings.language === 'en' ? 'False' : 'خطأ'].map((opt) => {
                  const isCorrect = mode !== 'student' && opt === q.correctAnswer;
                  return (
                    <div key={opt} className={`flex items-center gap-3 ${isCorrect ? 'font-bold text-green-700 print:text-black' : ''}`}>
                       <div className={`w-6 h-6 rounded border-2 ${theme === 'formal' ? 'border-black' : 'border-slate-400 print:border-slate-600'}`} />
                       <span>{opt}</span>
                       {isCorrect && <span className="text-sm">✓</span>}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Matching */}
            {q.type === QuestionType.MATCHING && q.matchingPairs && (
              <div className={`grid grid-cols-2 gap-0 mt-4 overflow-hidden ${theme === 'modern' || theme === 'creative' ? 'rounded-lg border border-slate-200 print:border-slate-400' : 'border border-black'}`}>
                <div className={`border-l ${theme === 'formal' ? 'border-black' : 'border-slate-300 print:border-slate-400'}`}>
                  <div className={`p-2 font-bold text-center border-b ${theme === 'modern' ? 'bg-slate-50 print:bg-gray-100' : 'bg-slate-100 print:bg-gray-200'} ${theme === 'formal' ? 'border-black' : 'border-slate-300 print:border-slate-400'}`}>{settings.language === 'en' ? 'Column A' : 'العمود (أ)'}</div>
                  <div className={`divide-y ${theme === 'formal' ? 'divide-black' : 'divide-slate-200 print:divide-slate-400'}`}>
                    {q.matchingPairs.map((pair, i) => (
                      <div key={`l-${i}`} className="p-3 flex justify-between items-center h-auto min-h-[4rem]">
                        {isEditing ? (
                           <input 
                            className="w-full bg-blue-50 border-b border-blue-300 outline-none"
                            value={pair.left}
                            onChange={(e) => {
                                const newPairs = [...(q.matchingPairs || [])];
                                newPairs[i].left = e.target.value;
                                onUpdateQuestion && onUpdateQuestion(q.id, 'matchingPairs', newPairs);
                            }}
                           />
                        ) : (
                           <span className="font-medium text-sm">{pair.left}</span>
                        )}
                        <span className={`w-6 h-6 border rounded bg-white ml-2 shrink-0 ${theme === 'formal' ? 'border-black' : 'border-slate-300 print:border-slate-500'}`}></span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                   <div className={`p-2 font-bold text-center border-b ${theme === 'modern' ? 'bg-slate-50 print:bg-gray-100' : 'bg-slate-100 print:bg-gray-200'} ${theme === 'formal' ? 'border-black' : 'border-slate-300 print:border-slate-400'}`}>{settings.language === 'en' ? 'Column B' : 'العمود (ب)'}</div>
                   <div className={`divide-y ${theme === 'formal' ? 'divide-black' : 'divide-slate-200 print:divide-slate-400'}`}>
                    {mode === 'student' && !isEditing
                      ? [...q.matchingPairs].sort(() => Math.random() - 0.5).map((pair, i) => (
                        <div key={`r-${i}`} className="p-3 flex items-center gap-3 h-auto min-h-[4rem]">
                          <span className="font-bold text-slate-400">.</span>
                          <span className="text-sm">{pair.right}</span>
                        </div>
                      ))
                      : q.matchingPairs.map((pair, i) => (
                         <div key={`r-${i}`} className="p-3 flex items-center gap-2 h-auto min-h-[4rem] bg-green-50/50 print:bg-transparent">
                          <span className="font-bold text-green-700 print:text-black shrink-0">←</span>
                          {isEditing ? (
                           <input 
                            className="w-full bg-blue-50 border-b border-blue-300 outline-none"
                            value={pair.right}
                            onChange={(e) => {
                                const newPairs = [...(q.matchingPairs || [])];
                                newPairs[i].right = e.target.value;
                                onUpdateQuestion && onUpdateQuestion(q.id, 'matchingPairs', newPairs);
                            }}
                           />
                          ) : (
                             <span className="font-bold text-sm">{pair.right}</span>
                          )}
                        </div>
                      ))
                    }
                   </div>
                </div>
              </div>
            )}

            {/* Essay Space */}
            {q.type === QuestionType.ESSAY && (
              <div className="mt-4 mr-1">
                 {mode !== 'student' || isEditing ? (
                   <div className="p-4 bg-green-50 border border-green-200 rounded text-green-900 mt-2 print:border-black print:bg-transparent print:text-black">
                     <strong>الإجابة النموذجية:</strong> 
                     {isEditing ? (
                         <textarea 
                           className="w-full mt-2 border border-blue-300 p-2 rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                           value={q.correctAnswer}
                           onChange={(e) => onUpdateQuestion && onUpdateQuestion(q.id, 'correctAnswer', e.target.value)}
                         />
                     ) : (
                         <span> {q.correctAnswer}</span>
                     )}
                   </div>
                 ) : (
                   <div className="space-y-6 mt-6">
                     {[1,2,3].map(i => <div key={i} className={`border-b ${theme === 'creative' ? 'border-indigo-200 border-dashed' : 'border-dotted border-slate-400'} h-6`}></div>)}
                   </div>
                 )}
              </div>
            )}

            {/* Review Explanation */}
            {mode === 'review' && (
              <div className="mt-4 mr-1 p-4 bg-blue-50 border-r-4 border-blue-500 rounded-lg text-sm text-blue-900 print:bg-transparent print:text-black print:border-black">
                <strong className="block mb-1 text-blue-700 print:text-black">💡 شرح وتوضيح:</strong>
                {q.explanation}
              </div>
            )}
            
            {/* Answer Key simple text */}
            {mode === 'teacher_key' && q.type !== QuestionType.MCQ && q.type !== QuestionType.MATCHING && q.type !== QuestionType.ESSAY && q.type !== QuestionType.TRUE_FALSE && (
                <div className="mt-2 mr-4 text-green-700 font-bold print:text-black">
                    الإجابة: {q.correctAnswer}
                </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const getTitle = () => {
    switch (mode) {
      case 'student': return settings.language === 'en' ? 'Exam' : 'اختبار';
      case 'teacher_key': return settings.language === 'en' ? 'Answer Key' : 'نموذج الإجابة';
      case 'review': return settings.language === 'en' ? 'Review' : 'مراجعة شاملة';
    }
  };

  return (
    <div className={`w-full max-w-[210mm] mx-auto bg-white p-8 relative ${styles.container} ${fontClass} print:p-0 print:border-0 print:shadow-none print:max-w-none print:w-full`} dir={settings.language === 'en' ? 'ltr' : 'rtl'}>
      
      {/* Watermark */}
      {settings.showWatermark && (
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-[0.03] overflow-hidden">
            <div className="rotate-[-45deg] text-8xl font-black text-slate-900 whitespace-nowrap">
                {header.schoolName} {header.schoolName} {header.schoolName}
            </div>
        </div>
      )}

      {/* Header Section */}
      <div className={`pb-6 mb-8 pt-4 ${styles.headerBorder} relative`}>
        {/* Decorative corner for Creative theme */}
        {theme === 'creative' && (
          <>
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -z-10 opacity-50 print:bg-indigo-100"></div>
            <div className="absolute top-0 left-0 w-16 h-16 bg-teal-50 rounded-br-full -z-10 opacity-50 print:bg-teal-100"></div>
          </>
        )}

        <div className="flex justify-between items-center">
          <div className="text-center w-1/4">
             <p className="font-bold text-sm mb-1">{settings.language === 'en' ? 'Kingdom of Saudi Arabia' : 'المملكة العربية السعودية'}</p>
             <p className="font-bold text-sm mb-2">{settings.language === 'en' ? 'Ministry of Education' : 'وزارة التعليم'}</p>
             {header.ministryLogo ? (
                <img src={header.ministryLogo} alt="وزارة التعليم" className="h-16 mx-auto object-contain grayscale brightness-0" />
            ) : (
                <div className={`text-xs text-slate-500 border rounded p-1 inline-block ${theme === 'formal' ? 'border-black text-black' : 'border-slate-300'}`}>شعار الوزارة</div>
            )}
          </div>

          <div className="text-center w-2/4">
             <h2 className={`text-xl font-black mb-2 ${theme === 'creative' ? 'text-indigo-900' : ''}`}>{header.schoolName}</h2>
             <div className={`inline-block px-8 py-2 mb-3 ${styles.titleBox}`}>
               <h3 className="text-xl font-bold">
                 {header.examType === 'final' && (settings.language === 'en' ? 'Final Exam' : 'اختبار نهاية الفصل الدراسي')}
                 {header.examType === 'midterm1' && (settings.language === 'en' ? 'Midterm 1' : 'اختبار الفترة الأولى')}
                 {header.examType === 'midterm2' && (settings.language === 'en' ? 'Midterm 2' : 'اختبار الفترة الثانية')}
                 {header.examType === 'quiz' && (settings.language === 'en' ? 'Quiz' : 'اختبار قصير')}
                 {' '}{mode !== 'student' && `- ${getTitle()}`}
               </h3>
             </div>
             <div className="flex justify-center gap-3 text-sm font-bold opacity-80">
               <span>{header.year}</span>
               <span>|</span>
               <span>{header.term}</span>
               {/* Version Tag */}
               <span className="bg-black text-white px-2 rounded-full text-xs flex items-center print:border print:border-black">{settings.language === 'en' ? 'Ver' : 'نموذج'} {data.version}</span>
             </div>
          </div>

          <div className="text-center w-1/4 relative">
             <div className="absolute top-0 left-0 w-full flex justify-center -mt-2 opacity-100 print:opacity-100">
                {/* QR Code for Smart Grading */}
                <img src={qrCodeUrl} className="w-16 h-16 mix-blend-multiply" alt="Smart Code" />
             </div>
             <div className="mt-16">
                 <p className="font-bold text-sm mb-2">{settings.language === 'en' ? 'Subject' : 'المادة'}: {header.subject}</p>
                 <p className="font-bold text-sm mb-2">{settings.language === 'en' ? 'Grade' : 'الصف'}: {header.gradeLevel}</p>
             </div>
          </div>
        </div>
        
        {mode === 'student' && (
            <div className="mt-8 flex gap-4 text-sm font-bold">
                <div className={`flex-grow border p-2 rounded flex gap-2 items-center ${theme === 'formal' ? 'border-black' : 'border-slate-300'}`}>
                    <span>{settings.language === 'en' ? 'Name:' : 'اسم الطالب:'}</span>
                    <div className={`border-b ${theme === 'creative' ? 'border-indigo-200 border-dashed' : 'border-dotted border-slate-400'} flex-grow h-6`}></div>
                </div>
                <div className={`w-1/4 border p-2 rounded flex gap-2 items-center ${theme === 'formal' ? 'border-black' : 'border-slate-300'}`}>
                    <span>{settings.language === 'en' ? 'ID:' : 'رقم الجلوس:'}</span>
                    <div className={`border-b ${theme === 'creative' ? 'border-indigo-200 border-dashed' : 'border-dotted border-slate-400'} flex-grow h-6`}></div>
                </div>
            </div>
        )}
      </div>

      {/* Questions Section */}
      <div className={`space-y-6 relative z-10 w-full`}>
        {data.questions.map((q, index) => getQuestionContent(q, index))}
      </div>

      {/* Footer / Total Score */}
      <div className={`mt-12 pt-6 flex justify-between items-end break-inside-avoid page-break-inside-avoid relative z-10 ${styles.footerBorder}`}>
        <div className="text-center">
            <p className="font-bold mb-2">{settings.language === 'en' ? 'Teacher' : 'معلم المادة'}</p>
            <p className="text-lg font-script opacity-80">{header.teacherName}</p>
        </div>
        <div className="font-bold text-center">
          <p className="mb-2 text-sm opacity-60">{settings.language === 'en' ? 'End of Questions' : 'انتهت الأسئلة'}</p>
          <p className="text-xs opacity-50">{settings.language === 'en' ? 'Good Luck' : 'تمنياتي لكم بالتوفيق والنجاح'}</p>
        </div>
        <div className={`border-2 p-2 rounded min-w-[120px] text-center ${theme === 'formal' ? 'border-black' : theme === 'creative' ? 'border-indigo-200 bg-indigo-50' : theme === 'modern' ? 'border-teal-100 bg-teal-50' : 'border-slate-800'}`}>
            <p className="text-xs font-bold mb-1 border-b border-current pb-1 opacity-70">{settings.language === 'en' ? 'Total Marks' : 'الدرجة الكلية'}</p>
            <p className="text-3xl font-black">/ {data.totalPoints}</p>
        </div>
      </div>
    </div>
  );
};

export default ExamPaper;
