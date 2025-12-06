
import React from 'react';
import { ExamData, ExamHeader, QuestionType, Question, BubbleSheetDesign, EssayLayoutMode } from '../types';

interface Props {
  data: ExamData;
  header: ExamHeader;
  design: BubbleSheetDesign;
  essayMode: EssayLayoutMode;
  language?: 'ar' | 'en'; // Independent language for bubble sheet
}

interface RenderRow {
  id: string | number;
  label: string;
  isSubItem?: boolean;
  qType: QuestionType;
}

const BubbleSheet: React.FC<Props> = ({ data, header, design, essayMode, language = 'en' }) => {
  const isAr = language === 'ar';
  
  // 1. Prepare Rows (Flatten Matching questions)
  const renderRows: RenderRow[] = [];
  
  data.questions.forEach(q => {
    if (q.type === QuestionType.MCQ || q.type === QuestionType.TRUE_FALSE) {
      renderRows.push({ id: q.id, label: q.id.toString(), qType: q.type });
    } else if (q.type === QuestionType.MATCHING && q.matchingPairs) {
      q.matchingPairs.forEach((_, idx) => {
        renderRows.push({ 
          id: `${q.id}-${idx}`, 
          label: `${q.id}.${idx + 1}`, 
          isSubItem: true,
          qType: QuestionType.MATCHING 
        });
      });
    }
  });

  const essayQuestions = data.questions.filter(q => q.type === QuestionType.ESSAY);

  // Split Logic: Ensure even columns based on RENDERABLE rows, not just questions
  const COLUMNS = 2; 
  const total = renderRows.length;
  const mid = Math.ceil(total / COLUMNS);
  const col1 = renderRows.slice(0, mid);
  const col2 = renderRows.slice(mid);

  // QR Code points to verification URL
  const qrCodeData = `https://maad.app/verify/${data.id}?ver=${data.version}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrCodeData)}`;

  // Design Configs
  const isGrid = design === 'grid';
  const isModern = design === 'modern';
  
  // Scantron Colors & Styles
  let containerClass = "";
  let headerClass = "";
  
  // Responsive bubble base class
  let bubbleBaseClass = "flex items-center justify-center border transition-all print:border-black shrink-0";
  
  if (isModern) {
      containerClass = "font-sans text-slate-800";
      headerClass = "bg-teal-50 border-teal-200 text-teal-900";
      bubbleBaseClass += " w-6 h-6 md:w-7 md:h-7 rounded-full text-[9px] md:text-[10px] border-teal-300 text-teal-800 font-bold bg-white print:w-7 print:h-7 print:text-[10px]";
  } else if (isGrid) {
      containerClass = "font-mono text-black";
      headerClass = "bg-transparent border-black";
      bubbleBaseClass += " w-5 h-5 md:w-6 md:h-6 rounded-none text-[9px] md:text-[10px] border-black text-black font-bold print:w-6 print:h-6 print:text-[10px]";
  } else {
      // Standard / Scantron
      containerClass = "font-sans text-rose-900";
      headerClass = "bg-rose-50 border-rose-200 text-rose-900";
      bubbleBaseClass += " w-6 h-6 md:w-7 md:h-7 rounded-full text-[9px] md:text-[10px] border-rose-300 text-rose-800 font-bold bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] print:w-7 print:h-7 print:text-[10px]";
  }

  return (
    <div className={`w-full md:w-[210mm] min-h-auto md:min-h-[297mm] mx-auto bg-white relative p-4 md:p-10 print:p-10 print:w-[210mm] print:min-h-[297mm] overflow-hidden ${containerClass}`} dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* SCAN MARKS (FIDUCIALS) - Crucial for Auto Grading */}
      <div className="hidden md:block print:block absolute top-8 left-8 w-5 h-5 bg-black z-50"></div>
      <div className="hidden md:block print:block absolute top-8 right-8 w-5 h-5 bg-black z-50"></div>
      <div className="hidden md:block print:block absolute bottom-8 left-8 w-5 h-5 bg-black z-50"></div>
      <div className="hidden md:block print:block absolute bottom-8 right-8 w-5 h-5 bg-black z-50"></div>

      {/* TIMING MARKS */}
      <div className={`absolute top-0 ${isAr ? 'right-2 md:right-3' : 'left-2 md:left-3'} bottom-0 w-2 md:w-3 flex flex-col justify-between py-12 z-0 opacity-80 print:right-3`}>
          {Array.from({length: 45}).map((_, i) => (
             <div key={i} className="h-1 md:h-1.5 w-full bg-black mb-1.5"></div>
          ))}
      </div>
      
      {/* HEADER SECTION */}
      <div className={`relative z-10 border-b-2 pb-4 md:pb-6 mb-4 md:mb-6 ${headerClass} p-4 md:p-6 rounded-xl mx-2 md:mx-4`}>
         <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-4 print:grid-cols-12">
             {/* Left: QR & Title */}
             <div className="col-span-1 md:col-span-4 print:col-span-4 flex gap-4 items-start">
                 <div className="bg-white p-2 border shadow-sm rounded-lg print:border-black shrink-0 hidden sm:block">
                    <img src={qrCodeUrl} className="w-16 h-16 md:w-20 md:h-20 mix-blend-multiply" alt="QR" />
                 </div>
                 <div>
                    <h1 className="text-lg md:text-xl font-black uppercase tracking-widest mb-1 leading-none">
                        {isAr ? 'ورقة إجابة' : 'ANSWER SHEET'}
                    </h1>
                    <h2 className="text-xs md:text-sm font-bold opacity-90 mb-2">{header.schoolName}</h2>
                    <div className="text-[9px] font-bold flex flex-col gap-1 opacity-70 bg-white/50 p-1.5 rounded border border-current print:border-black w-fit">
                        <span>ID: {data.id}</span>
                        <span>VER: {data.version}</span>
                    </div>
                 </div>
             </div>

             {/* Middle: Student ID Grid */}
             <div className="col-span-1 md:col-span-3 print:col-span-3 flex justify-center">
                 <div className="flex flex-col items-center">
                     <span className="text-[9px] font-bold mb-1 uppercase tracking-widest">{isAr ? 'رقم الطالب' : 'Student ID'}</span>
                     <div className={`border-2 p-1 flex gap-1 bg-white print:border-black ${isModern ? 'border-teal-200 rounded-lg' : 'border-black'}`}>
                        {[0,1,2,3,4].map(col => (
                            <div key={col} className="flex flex-col gap-0.5">
                                <div className="w-3 h-4 md:w-4 md:h-5 border-2 border-gray-300 mb-1 bg-gray-50 print:border-black print:bg-transparent print:w-4 print:h-5"></div>
                                {[0,1,2,3,4,5,6,7,8,9].map(num => (
                                    <div key={num} className={`w-3 h-3 md:w-4 md:h-3.5 rounded-full border border-gray-300 flex items-center justify-center text-[6px] text-gray-400 print:border-black print:text-black print:w-4 print:h-3.5`}>{num}</div>
                                ))}
                            </div>
                        ))}
                     </div>
                 </div>
             </div>

             {/* Right: Personal Fields */}
             <div className="col-span-1 md:col-span-5 print:col-span-5 flex flex-col justify-end gap-3 pl-0 md:pl-2">
                 <div className="border-b-2 border-current h-6 md:h-8 flex items-end pb-1 px-1">
                     <span className="text-[9px] opacity-50 font-bold uppercase">{isAr ? 'اسم الطالب' : 'Student Name'}</span>
                 </div>
                 <div className="border-b-2 border-current h-6 md:h-8 flex items-end pb-1 px-1">
                     <span className="text-[9px] opacity-50 font-bold uppercase">{isAr ? 'المادة الدراسية' : 'Subject'}</span>
                 </div>
                 <div className="flex gap-4">
                    <div className="border-b-2 border-current h-6 md:h-8 flex items-end pb-1 px-1 w-2/3">
                        <span className="text-[9px] opacity-50 font-bold uppercase">{isAr ? 'الصف / الشعبة' : 'Class / Section'}</span>
                    </div>
                    <div className="border-b-2 border-current h-6 md:h-8 flex items-end pb-1 px-1 w-1/3">
                        <span className="text-[9px] opacity-50 font-bold uppercase">{isAr ? 'التاريخ' : 'Date'}</span>
                    </div>
                 </div>
             </div>
         </div>
      </div>

      {/* BUBBLE GRID SECTION */}
      <div className={`relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 px-2 md:px-8 print:grid-cols-2 print:gap-16 print:px-8 ${isGrid ? 'gap-0 md:gap-0 border-t border-l border-black mx-0 md:mx-4' : ''}`}>
         {/* Column 1 */}
         <div className={`flex flex-col ${isGrid ? 'border-r border-b border-black' : ''}`}>
            {col1.length > 0 && <HeaderRow isGrid={isGrid} />}
            {col1.map((row, i) => (
                <BubbleRow key={row.id} row={row} isGrid={isGrid} bubbleBaseClass={bubbleBaseClass} index={i} isAr={isAr} />
            ))}
         </div>

         {/* Column 2 */}
         <div className={`flex flex-col ${isGrid ? 'border-r border-b border-black' : ''}`}>
            {col2.length > 0 && <HeaderRow isGrid={isGrid} />}
            {col2.map((row, i) => (
                <BubbleRow key={row.id} row={row} isGrid={isGrid} bubbleBaseClass={bubbleBaseClass} index={i} isAr={isAr} />
            ))}
         </div>
      </div>

      {/* ESSAY SECTION */}
      {essayQuestions.length > 0 && essayMode !== 'none' && (
         <div className="relative z-10 mt-8 mx-2 md:mx-4 border-t-4 border-double border-gray-300 pt-4 break-inside-avoid">
            <div className="flex justify-between items-center mb-6 bg-gray-100 p-2 rounded">
                 <h3 className="font-black text-sm uppercase tracking-wide">
                    {isAr ? 'الأسئلة المقالية' : 'Essay Questions'}
                </h3>
                <span className="text-[10px] font-bold bg-black text-white px-2 py-1 rounded">
                    {isAr ? 'يصحح من قبل المعلم' : 'TEACHER GRADED'}
                </span>
            </div>
           
            <div className="grid grid-cols-1 gap-6">
               {essayQuestions.map(q => (
                  <div key={q.id} className="w-full">
                      <div className="flex gap-3 items-center mb-2">
                          <span className="w-8 h-8 bg-black text-white rounded flex items-center justify-center font-black text-lg">{q.id}</span>
                          <span className="font-bold text-sm">{q.text} <span className="font-normal opacity-50 ml-2">({q.points} {isAr ? 'درجات' : 'Marks'})</span></span>
                      </div>
                      
                      {essayMode === 'box' && <div className="w-full h-24 border-2 border-gray-300 rounded-lg bg-gray-50/30 print:border-black"></div>}
                      
                      {essayMode === 'lines' && (
                          <div className="space-y-6 px-1 pt-2">
                              <div className="border-b border-gray-400 h-2"></div>
                              <div className="border-b border-gray-400 h-2"></div>
                              <div className="border-b border-gray-400 h-2"></div>
                          </div>
                      )}
                      
                      {/* Teacher Score Box */}
                      <div className="flex justify-end mt-2">
                           <div className="border border-black w-24 h-10 rounded flex items-center justify-between px-2">
                               <span className="text-[8px] font-bold opacity-50">{isAr ? 'الدرجة' : 'Score'}</span>
                               <span className="text-xl font-bold">/ {q.points}</span>
                           </div>
                      </div>
                  </div>
               ))}
            </div>
         </div>
      )}

      {/* FOOTER */}
      <div className="hidden md:block absolute bottom-3 left-0 right-0 text-center text-[8px] font-mono opacity-40">
          SYSTEM: MAAD-AI-OMR-V3 • DO NOT FOLD • MARK COMPLETELY
      </div>
    </div>
  );
};

const HeaderRow: React.FC<{ isGrid: boolean }> = ({ isGrid }) => (
    <div className={`flex items-center mb-2 text-[10px] font-black uppercase text-center ${isGrid ? 'bg-black text-white py-1 mb-0' : 'text-gray-400 px-2'}`}>
        <span className="w-8 md:w-10 print:w-10">#</span>
        <div className="flex-grow flex justify-between px-2 md:px-4 print:px-4">
            <span className="w-6 md:w-7 print:w-7">A</span>
            <span className="w-6 md:w-7 print:w-7">B</span>
            <span className="w-6 md:w-7 print:w-7">C</span>
            <span className="w-6 md:w-7 print:w-7">D</span>
        </div>
    </div>
);

const BubbleRow: React.FC<{ row: RenderRow, isGrid: boolean, bubbleBaseClass: string, index: number, isAr: boolean }> = ({ row, isGrid, bubbleBaseClass, index, isAr }) => {
    const isTF = row.qType === QuestionType.TRUE_FALSE;
    const rowClass = isGrid 
        ? `border-b border-black py-1 px-2 ${index % 2 === 0 ? 'bg-gray-100 print:bg-transparent' : ''}` 
        : `py-1.5 px-2 mb-1 rounded-lg ${index % 2 === 0 ? 'bg-gray-50/80' : ''}`;

    return (
        <div className={`flex items-center justify-between ${rowClass}`}>
            <span className={`w-8 md:w-10 print:w-10 font-black text-center font-mono text-xs md:text-sm print:text-sm ${row.isSubItem ? 'text-[10px] md:text-xs text-slate-500' : ''}`}>
                {row.label}
            </span>
            
            <div className="flex-grow flex justify-between px-2 relative">
                {/* Connecting Line for Scantron feel */}
                {!isGrid && <div className="absolute top-1/2 left-4 right-4 h-px bg-gray-200 -z-10"></div>}

                {isTF ? (
                    <div className="flex justify-start gap-4 md:gap-8 print:gap-8 w-full pl-2">
                        <div className={`${bubbleBaseClass} border-2`}><span className="mt-[1px]">{isAr ? 'ص' : 'T'}</span></div>
                        <div className={`${bubbleBaseClass} border-2`}><span className="mt-[1px]">{isAr ? 'خ' : 'F'}</span></div>
                    </div>
                ) : (
                    <>
                        <div className={bubbleBaseClass}><span className="mt-[1px]">{isAr ? 'أ' : 'A'}</span></div>
                        <div className={bubbleBaseClass}><span className="mt-[1px]">{isAr ? 'ب' : 'B'}</span></div>
                        <div className={bubbleBaseClass}><span className="mt-[1px]">{isAr ? 'ج' : 'C'}</span></div>
                        <div className={bubbleBaseClass}><span className="mt-[1px]">{isAr ? 'د' : 'D'}</span></div>
                    </>
                )}
            </div>
        </div>
    );
};

export default BubbleSheet;
