
import React, { useState, useRef, useEffect } from 'react';
import { AppStep, GenerateConfig, QuestionType, ExamData, ExamHeader, ExamTheme, BubbleSheetDesign, EssayLayoutMode, ExamSettings } from './types';
import Layout from './components/Layout';
import StepIndicator from './components/StepIndicator';
import { generateExamContent, translateExam } from './services/geminiService';
import ExamPaper from './components/ExamPaper';
import InteractiveQuiz from './components/InteractiveQuiz';
import BubbleSheet from './components/BubbleSheet';
import AutoGrader from './components/AutoGrader';
import { 
  FileText, Check, Printer, RotateCcw, BookOpenCheck, ChevronLeft, Upload,
  User, School, Sparkles, ArrowLeft, FileIcon, Grid, ScanLine, Palette,
  Layout as LayoutIcon, PenTool, BrainCircuit, Languages, Copy, BarChart,
  Eye, EyeOff, Stamp, Save, Minimize2, ListOrdered, GraduationCap, ChevronRight,
  History, Clock, Edit3, CheckSquare, Plus, Trash2, Home, Download, ChevronDown
} from 'lucide-react';

declare var html2pdf: any;

const initialHeader: ExamHeader = {
  teacherName: '',
  schoolName: '',
  subject: '',
  gradeLevel: '',
  term: 'الفصل الدراسي الأول',
  year: '1446',
  examType: 'quiz'
};

const themes: { id: ExamTheme; label: string }[] = [
  { id: 'classic', label: 'كلاسيكي' },
  { id: 'modern', label: 'عصري' },
  { id: 'formal', label: 'رسمي' },
  { id: 'creative', label: 'إبداعي' },
  { id: 'minimal', label: 'بسيط' }
];

const bubbleDesigns: { id: BubbleSheetDesign; label: string }[] = [
  { id: 'standard', label: 'قياسي' },
  { id: 'modern', label: 'عصري' },
  { id: 'grid', label: 'شبكي' },
  { id: 'compact', label: 'مضغوط' },
  { id: 'circle', label: 'دائري' }
];

const App: React.FC = () => {
  // Navigation State
  const [view, setView] = useState<'landing' | 'login' | 'app'>('landing');
  
  // App State
  const [step, setStep] = useState<AppStep>('dashboard');
  const [header, setHeader] = useState<ExamHeader>(initialHeader);
  const [sourceText, setSourceText] = useState('');
  const [sourceImages, setSourceImages] = useState<string[]>([]);
  const [sourcePdf, setSourcePdf] = useState<string | null>(null);
  const [sourcePdfName, setSourcePdfName] = useState<string>('');
  
  // PDF Pages State
  const [pdfPageFrom, setPdfPageFrom] = useState<string>('');
  const [pdfPageTo, setPdfPageTo] = useState<string>('');
  
  const [examSettings, setExamSettings] = useState({
    difficulty: 'medium' as const,
    count: 5,
    totalMarks: 20, 
    types: [QuestionType.MCQ, QuestionType.TRUE_FALSE, QuestionType.MATCHING, QuestionType.ESSAY]
  });
  
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [examHistory, setExamHistory] = useState<ExamData[]>([]);
  
  // Advanced Features State
  const [featuresSettings, setFeaturesSettings] = useState<ExamSettings>({
    showWatermark: false,
    isDyslexic: false,
    showBloom: false,
    language: 'ar'
  });
  const [focusMode, setFocusMode] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  
  const [viewMode, setViewMode] = useState<'student' | 'teacher_key' | 'review' | 'bubble_sheet'>('student');
  const [theme, setTheme] = useState<ExamTheme>('classic');
  const [bubbleDesign, setBubbleDesign] = useState<BubbleSheetDesign>('standard');
  const [essayMode, setEssayMode] = useState<EssayLayoutMode>('lines');
  const [bubbleLang, setBubbleLang] = useState<'ar'|'en'>('en');
  
  const [showAutoGrader, setShowAutoGrader] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const schoolLogoRef = useRef<HTMLInputElement>(null);
  const ministryLogoRef = useRef<HTMLInputElement>(null);

  // Load history from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('maad_exam_history');
    if (saved) {
      try {
        setExamHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
    const savedUser = localStorage.getItem('maad_teacher_name');
    if (savedUser) {
        setHeader(prev => ({...prev, teacherName: savedUser}));
    }
  }, []);

  // Save history to local storage
  useEffect(() => {
    localStorage.setItem('maad_exam_history', JSON.stringify(examHistory));
  }, [examHistory]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (header.teacherName.trim()) {
      localStorage.setItem('maad_teacher_name', header.teacherName);
      setView('app');
      setStep('dashboard');
    }
  };

  const handleLogout = () => {
      localStorage.removeItem('maad_teacher_name');
      setView('landing');
      setHeader(initialHeader);
  };

  const deleteFromHistory = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if(confirm('هل أنت متأكد من حذف هذا الاختبار من الأرشيف؟')) {
          setExamHistory(prev => prev.filter(h => h.id !== id));
      }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      (Array.from(files) as File[]).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setSourceImages(prev => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSourcePdfName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setSourcePdf(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'school' | 'ministry') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          if (type === 'school') {
            setHeader(prev => ({ ...prev, schoolLogo: reader.result as string }));
          } else {
            setHeader(prev => ({ ...prev, ministryLogo: reader.result as string }));
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateQuestion = (qId: number, field: string, value: any) => {
      if (!examData) return;
      const updatedQuestions = examData.questions.map(q => {
          if (q.id === qId) {
              if (field === 'options') {
                  return { ...q, options: value };
              } else if (field === 'matchingPairs') {
                  return { ...q, matchingPairs: value };
              } else {
                  return { ...q, [field]: value };
              }
          }
          return q;
      });
      const updatedExam = { ...examData, questions: updatedQuestions };
      setExamData(updatedExam);
      setExamHistory(prev => prev.map(h => h.id === updatedExam.id ? updatedExam : h));
  };

  const handleExportWord = () => {
    const element = document.getElementById('printable-paper');
    if (!element) return;
    const headerHtml = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Exam</title></head><body style='font-family: Arial, sans-serif;'>";
    const footerHtml = "</body></html>";
    const sourceHTML = headerHtml + element.innerHTML + footerHtml;
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `${header.subject}_exam.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  const handleExportJSON = () => {
      if (!examData) return;
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(examData, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `${header.subject}_lms_export.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  }

  const handleDownloadSpecific = async (mode: 'student' | 'teacher_key' | 'review' | 'bubble_sheet') => {
      setShowDownloadMenu(false);
      setViewMode(mode);
      // Slight delay to allow React to re-render the view
      setTimeout(async () => {
        await handleDownloadPDF(mode);
      }, 500);
  };

  const handleDownloadPDF = async (mode = viewMode) => {
    const element = document.getElementById('printable-paper');
    if (!element) return;
    
    setGeneratingPdf(true);
    
    const suffix = mode === 'student' ? 'Exam' : mode === 'teacher_key' ? 'AnswerKey' : mode === 'review' ? 'Review' : 'BubbleSheet';
    
    const opt = {
      margin: [10, 10, 15, 10], 
      filename: `${header.subject}_${suffix}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 3, useCORS: true, letterRendering: true, scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error("PDF generation failed:", err);
      window.print();
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleGenerate = async () => {
    if (!sourceText && sourceImages.length === 0 && !sourcePdf) {
      alert("الرجاء إضافة محتوى (نص، ملف PDF، أو صور) لتوليد الاختبار");
      return;
    }
    setLoading(true);
    setStep('generating');
    try {
      const config: GenerateConfig = {
        header,
        sourceText,
        sourceImages,
        sourcePdf: sourcePdf || undefined,
        difficulty: examSettings.difficulty,
        questionCount: examSettings.count,
        totalMarks: examSettings.totalMarks,
        includeTypes: examSettings.types
      };

      if (pdfPageFrom && pdfPageTo) {
        config.pdfPageRange = {
            start: parseInt(pdfPageFrom),
            end: parseInt(pdfPageTo)
        };
      }
      
      const data = await generateExamContent(config);
      const dataWithTime = { 
          ...data, 
          timestamp: Date.now(),
          header: header 
      };
      setExamData(dataWithTime);
      setExamHistory(prev => [dataWithTime, ...prev]);
      setStep('preview');
      setViewMode('student');
    } catch (error) {
      console.error(error);
      const message = error instanceof Error
        ? error.message
        : "حدث خطأ أثناء توليد الاختبار. يرجى التأكد من المصادر والمحاولة مرة أخرى.";
      alert(message);
      setStep('content');
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (!examData) return;
    if (featuresSettings.language === 'en') {
        alert('سيتم ترجمة الاختبار للإنجليزية...');
    }
    setLoading(true);
    try {
        const translated = await translateExam(examData);
        setExamData(translated);
        setFeaturesSettings({...featuresSettings, language: 'en'});
    } catch(e) {
        console.error(e);
        alert('فشلت الترجمة');
    } finally {
        setLoading(false);
    }
  };

  const toggleQuestionType = (type: QuestionType) => {
    setExamSettings(prev => {
      const exists = prev.types.includes(type);
      if (exists) {
        return { ...prev, types: prev.types.filter(t => t !== type) };
      } else {
        return { ...prev, types: [...prev.types, type] };
      }
    });
  };

  const handleRestoreHistory = (h: ExamData) => {
      setExamData(h);
      if (h.header) setHeader(h.header);
      if (h.language === 'en') {
          setFeaturesSettings(prev => ({ ...prev, language: 'en' }));
      } else {
          setFeaturesSettings(prev => ({ ...prev, language: 'ar' }));
      }
      setStep('preview');
  };

  // --- RENDERING CODE OMITTED FOR BREVITY, ONLY SHOWING CHANGED PREVIEW STEP ---
  
  if (view === 'landing') {
      // ... (Landing code same as before)
      return (
      <Layout showNav={false}>
        <div className="min-h-screen gradient-bg flex flex-col items-center justify-center relative overflow-hidden text-white">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1.5s'}}></div>

          <div className="relative z-10 text-center max-w-4xl mx-auto px-6 animate-slideUp">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-5 py-2 mb-8 shadow-glass">
              <Sparkles size={16} className="text-brand-300" />
              <span className="text-brand-100 text-sm font-bold tracking-wide">الجيل الثالث من الذكاء الاصطناعي</span>
            </div>
            
            <h1 className="text-7xl md:text-9xl font-black mb-8 tracking-tighter leading-tight drop-shadow-2xl">
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">مُعِـد</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-300 mb-12 leading-relaxed max-w-2xl mx-auto font-light">
              المنصة الأكثر تطوراً لإعداد الاختبارات المدرسية وتصحيحها آلياً.
              <span className="block mt-2 font-medium text-brand-300">أداة احترافية لكل معلم طموح.</span>
            </p>
            
            <button 
              onClick={() => {
                  const saved = localStorage.getItem('maad_teacher_name');
                  if (saved) {
                      setView('app');
                      setStep('dashboard');
                      setHeader(prev => ({...prev, teacherName: saved}));
                  } else {
                      setView('login');
                  }
              }}
              className="group relative bg-brand-500 hover:bg-brand-400 text-slate-900 text-xl font-bold px-12 py-5 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-[0_0_50px_-10px_rgba(20,184,166,0.5)] flex items-center gap-4 mx-auto overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
              <span className="relative">ابدأ التجربة مجاناً</span>
              <ArrowLeft className="group-hover:-translate-x-2 transition-transform relative" strokeWidth={3} />
            </button>
            
            <div className="mt-20 grid grid-cols-3 gap-12 text-center border-t border-white/10 pt-10">
              <div className="hover:transform hover:-translate-y-2 transition-transform duration-300">
                <h3 className="text-white font-black text-3xl mb-2">Word/PDF</h3>
                <p className="text-slate-400 text-sm font-medium">تصدير احترافي</p>
              </div>
              <div className="hover:transform hover:-translate-y-2 transition-transform duration-300">
                <h3 className="text-brand-400 font-black text-3xl mb-2">OMR</h3>
                <p className="text-slate-400 text-sm font-medium">تصحيح آلي فوري</p>
              </div>
              <div className="hover:transform hover:-translate-y-2 transition-transform duration-300">
                <h3 className="text-white font-black text-3xl mb-2">AI 3.0</h3>
                <p className="text-slate-400 text-sm font-medium">توليد أسئلة ذكي</p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (view === 'login') {
    // ... (Login code same as before)
    return (
      <Layout showNav={false}>
        <div className="min-h-screen gradient-bg flex flex-col items-center justify-center p-4">
           <div className="bg-white/5 backdrop-blur-xl p-10 rounded-[2rem] shadow-2xl w-full max-w-md border border-white/10 animate-fadeIn relative overflow-hidden">
             <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-500/20 rounded-full blur-2xl"></div>
             <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl"></div>

             <div className="relative z-10">
               <div className="text-center mb-10">
                 <div className="bg-gradient-to-tr from-brand-400 to-brand-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow transform rotate-3 hover:rotate-6 transition-transform">
                   <User size={40} className="text-white" strokeWidth={2.5} />
                 </div>
                 <h2 className="text-3xl font-bold text-white mb-2">مرحباً بك يا معلم</h2>
                 <p className="text-slate-400">سجل دخولك للوصول إلى أدوات الذكاء الاصطناعي</p>
               </div>
               
               <form onSubmit={handleLogin} className="space-y-6">
                 <div className="group">
                   <label className="block text-sm font-bold text-brand-300 mb-2 group-focus-within:text-brand-200 transition-colors">اسم المعلم</label>
                   <div className="relative">
                      <input 
                        required
                        type="text" 
                        value={header.teacherName}
                        onChange={e => setHeader({...header, teacherName: e.target.value})}
                        className="w-full pl-4 pr-4 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition text-white placeholder-slate-600 font-medium"
                        placeholder="الاسم الثلاثي"
                      />
                   </div>
                 </div>
                 
                 <div className="group">
                   <label className="block text-sm font-bold text-brand-300 mb-2 group-focus-within:text-brand-200 transition-colors">المدرسة</label>
                   <div className="relative">
                      <input 
                        type="text" 
                        value={header.schoolName}
                        onChange={e => setHeader({...header, schoolName: e.target.value})}
                        className="w-full pl-4 pr-4 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition text-white placeholder-slate-600 font-medium"
                        placeholder="اسم المدرسة (اختياري)"
                      />
                   </div>
                 </div>
                 
                 <button 
                   type="submit"
                   className="w-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-brand-900/50 mt-4 flex justify-center items-center gap-2 group"
                 >
                   دخول للنظام
                   <ChevronLeft className="group-hover:-translate-x-1 transition-transform" />
                 </button>

                 <button 
                   type="button"
                   onClick={() => setView('landing')}
                   className="w-full text-slate-500 text-sm hover:text-white transition-colors pt-2"
                 >
                   العودة للرئيسية
                 </button>
               </form>
             </div>
           </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={header.teacherName} onLogout={handleLogout} showNav={!focusMode}>
      
      {!focusMode && step !== 'dashboard' && <StepIndicator currentStep={step} />}

      {step === 'dashboard' && (
         <div className="max-w-6xl mx-auto animate-fadeIn pb-12">
            <div className="mb-10 text-center">
                <h2 className="text-3xl font-black text-slate-800 mb-2">لوحة التحكم</h2>
                <p className="text-slate-500">أهلاً بك، {header.teacherName}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div 
                   onClick={() => setStep('setup')}
                   className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-3xl p-8 flex flex-col justify-between text-white cursor-pointer hover:scale-[1.02] hover:shadow-2xl transition-all group min-h-[250px] shadow-lg shadow-brand-500/20"
                >
                    <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-sm group-hover:bg-white/30 transition">
                        <Plus size={32} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black mb-2">إنشاء اختبار جديد</h3>
                        <p className="text-brand-100 text-sm">استخدم الذكاء الاصطناعي لتوليد أسئلة من النص أو PDF أو الصور.</p>
                    </div>
                    <div className="flex items-center gap-2 font-bold text-sm bg-white/10 w-fit px-4 py-2 rounded-xl mt-4">
                        ابدأ الآن <ChevronLeft size={16} />
                    </div>
                </div>
                {examHistory.map((hist, idx) => (
                    <div 
                        key={hist.id}
                        onClick={() => handleRestoreHistory(hist)}
                        className="bg-white rounded-3xl p-6 border border-slate-100 hover:border-brand-200 hover:shadow-xl cursor-pointer transition-all flex flex-col min-h-[250px] group relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-slate-200 to-slate-300 group-hover:from-brand-400 group-hover:to-brand-500 transition-all"></div>
                        <div className="flex justify-between items-start mb-6">
                            <span className="bg-slate-50 text-slate-500 text-xs font-bold px-3 py-1 rounded-full border border-slate-100">
                                {new Date(hist.timestamp).toLocaleDateString('ar-SA')}
                            </span>
                            <button 
                                onClick={(e) => deleteFromHistory(e, hist.id)}
                                className="text-slate-300 hover:text-red-500 transition bg-slate-50 p-2 rounded-full hover:bg-red-50"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                        <div className="flex-grow">
                             <h4 className="font-black text-lg text-slate-800 mb-1 line-clamp-2">
                                 {hist.header?.subject || 'مادة غير محددة'}
                             </h4>
                             <p className="text-slate-500 text-sm mb-4">
                                 {hist.header?.gradeLevel || 'صف غير محدد'}
                             </p>
                             <div className="flex gap-2 flex-wrap">
                                 <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">
                                     {hist.questions.length} سؤال
                                 </span>
                                 <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded border border-indigo-100">
                                     {hist.totalPoints} درجة
                                 </span>
                             </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center text-slate-400 text-sm group-hover:text-brand-600 transition-colors font-bold">
                            <span>عرض الاختبار</span>
                            <ChevronLeft size={18} />
                        </div>
                    </div>
                ))}
            </div>
         </div>
      )}

      {/* SETUP & CONTENT STEPS REMAINED UNCHANGED FOR BREVITY */}
      {step === 'setup' && (
        // ... (Same Setup Code)
         <div className="max-w-4xl mx-auto animate-slideUp">
           <button onClick={() => setStep('dashboard')} className="mb-4 text-slate-500 hover:text-brand-600 font-bold text-sm flex items-center gap-1 transition"><Home size={16} /> العودة للرئيسية</button>
          <div className="bg-white rounded-3xl shadow-xl border border-white/50 overflow-hidden relative">
            <div className="h-2 bg-gradient-to-r from-brand-400 to-indigo-500 w-full absolute top-0"></div>
            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div><h2 className="text-2xl font-black text-slate-800 mb-1">بيانات الاختبار</h2><p className="text-slate-500 text-sm">قم بتعبئة البيانات الأساسية لترويسة الاختبار</p></div>
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-100"><School size={24} /></div>
            </div>
            <div className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-2"><label className="text-sm font-bold text-slate-700">اسم المدرسة</label><input type="text" value={header.schoolName} onChange={e => setHeader({...header, schoolName: e.target.value})} className="w-full border border-slate-200 bg-slate-50 rounded-xl p-4 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition text-slate-800 font-medium"/></div>
                <div className="space-y-2"><label className="text-sm font-bold text-slate-700">المادة الدراسية</label><input type="text" value={header.subject} onChange={e => setHeader({...header, subject: e.target.value})} className="w-full border border-slate-200 bg-slate-50 rounded-xl p-4 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition text-slate-800 font-medium" placeholder="مثال: الرياضيات"/></div>
                 <div className="space-y-2"><label className="text-sm font-bold text-slate-700">الصف الدراسي</label><input type="text" value={header.gradeLevel} onChange={e => setHeader({...header, gradeLevel: e.target.value})} className="w-full border border-slate-200 bg-slate-50 rounded-xl p-4 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition text-slate-800 font-medium" placeholder="مثال: الثاني الثانوي"/></div>
                <div className="space-y-2"><label className="text-sm font-bold text-slate-700">نوع الاختبار</label><select value={header.examType} onChange={(e: any) => setHeader({...header, examType: e.target.value})} className="w-full border border-slate-200 bg-slate-50 rounded-xl p-4 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition text-slate-800 font-medium appearance-none cursor-pointer"><option value="quiz">اختبار قصير (Quiz)</option><option value="midterm1">اختبار فتري أول</option><option value="midterm2">اختبار فتري ثاني</option><option value="final">اختبار نهائي</option></select></div>
                <div className="space-y-2 md:col-span-2"><label className="text-sm font-bold text-slate-700">الفصل الدراسي</label><div className="grid grid-cols-3 gap-4">{['الفصل الدراسي الأول', 'الفصل الدراسي الثاني', 'الفصل الدراسي الثالث'].map((term) => (<button key={term} onClick={() => setHeader({...header, term})} className={`p-3 rounded-xl border text-sm font-bold transition-all ${header.term === term ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>{term}</button>))}</div></div>
              </div>
              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200"><h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><Sparkles size={18} className="text-amber-500 fill-amber-500" />الهوية البصرية (اختياري)</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div onClick={() => schoolLogoRef.current?.click()} className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${header.schoolLogo ? 'border-brand-500 bg-brand-50' : 'border-slate-300 hover:border-brand-400 hover:bg-white'}`}>{header.schoolLogo ? (<div className="flex flex-col items-center gap-2 text-brand-700"><Check size={24} /> <span className="font-bold">تم رفع شعار المدرسة</span></div>) : (<div className="flex flex-col items-center gap-2 text-slate-400"><Upload size={24} /><span className="text-sm font-medium">رفع شعار المدرسة</span></div>)}<input ref={schoolLogoRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, 'school')}/></div><div onClick={() => ministryLogoRef.current?.click()} className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${header.ministryLogo ? 'border-brand-500 bg-brand-50' : 'border-slate-300 hover:border-brand-400 hover:bg-white'}`}>{header.ministryLogo ? (<div className="flex flex-col items-center gap-2 text-brand-700"><Check size={24} /> <span className="font-bold">تم رفع شعار الوزارة</span></div>) : (<div className="flex flex-col items-center gap-2 text-slate-400"><Upload size={24} /><span className="text-sm font-medium">رفع شعار الوزارة</span></div>)}<input ref={ministryLogoRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, 'ministry')}/></div></div></div>
              <div className="flex justify-end pt-4"><button onClick={() => setStep('content')} className="bg-brand-600 text-white px-10 py-4 rounded-xl hover:bg-brand-700 transition-all flex items-center gap-3 font-bold shadow-lg shadow-brand-500/20 hover:scale-[1.02]">التالي: المحتوى <ChevronLeft size={22} /></button></div>
            </div>
          </div>
        </div>
      )}

      {step === 'content' && (
         // ... (Same Content Code)
         <div className="max-w-[1200px] mx-auto animate-slideUp">
           <button onClick={() => setStep('dashboard')} className="mb-4 text-slate-500 hover:text-brand-600 font-bold text-sm flex items-center gap-1 transition"><Home size={16} /> العودة للرئيسية</button>
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
             <div className="lg:col-span-4 space-y-6">
                <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100">
                  <h3 className="font-black text-slate-800 text-lg mb-6 flex items-center gap-3"><div className="bg-brand-100 p-2 rounded-lg text-brand-600"><ScanLine size={20} /></div>خصائص الأسئلة</h3>
                  <div className="space-y-8">
                    <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">مستوى الصعوبة</label><div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">{['easy', 'medium', 'hard'].map(d => (<button key={d} onClick={() => setExamSettings({...examSettings, difficulty: d as any})} className={`py-2 text-xs font-bold rounded-lg transition-all ${examSettings.difficulty === d ? 'bg-white text-brand-600 shadow-md transform scale-105' : 'text-slate-500 hover:text-slate-700'}`}>{d === 'easy' ? 'سهل' : d === 'medium' ? 'متوسط' : 'صعب'}</button>))}</div></div>
                    <div><div className="flex justify-between mb-3"><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">عدد الأسئلة</label><span className="text-brand-600 font-bold bg-brand-50 px-3 py-0.5 rounded-lg text-sm">{examSettings.count}</span></div><input type="range" min="3" max="50" value={examSettings.count} onChange={e => setExamSettings({...examSettings, count: parseInt(e.target.value)})} className="w-full accent-brand-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"/></div>
                    <div><div className="flex justify-between mb-3"><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">الدرجة الكلية</label><span className="text-brand-600 font-bold bg-brand-50 px-3 py-0.5 rounded-lg text-sm">{examSettings.totalMarks}</span></div><div className="relative"><input type="number" value={examSettings.totalMarks} onChange={e => setExamSettings({...examSettings, totalMarks: parseInt(e.target.value)})} className="w-full border border-slate-200 p-3 rounded-xl font-bold text-slate-700 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none" min="5" max="100"/><span className="absolute left-4 top-3.5 text-xs font-bold text-slate-400">درجة</span></div></div>
                    <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">أنواع الأسئلة</label><div className="space-y-3">{[{ id: QuestionType.MCQ, label: 'اختيارات متعددة' }, { id: QuestionType.TRUE_FALSE, label: 'صح وخطأ' }, { id: QuestionType.MATCHING, label: 'مزاوجة (صل)' }, { id: QuestionType.ESSAY, label: 'مقالي' }].map(type => (<label key={type.id} className={`flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer transition-all ${examSettings.types.includes(type.id) ? 'border-brand-500 bg-brand-50/50 shadow-sm' : 'border-slate-200 hover:bg-slate-50'}`}><div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${examSettings.types.includes(type.id) ? 'bg-brand-500 border-brand-500' : 'border-slate-300 bg-white'}`}>{examSettings.types.includes(type.id) && <Check size={14} className="text-white" />}</div><input type="checkbox" checked={examSettings.types.includes(type.id)} onChange={() => toggleQuestionType(type.id)} className="hidden"/><span className={`text-sm ${examSettings.types.includes(type.id) ? 'font-bold text-brand-800' : 'text-slate-600 font-medium'}`}>{type.label}</span></label>))}</div></div>
                  </div>
                </div>
             </div>
             <div className="lg:col-span-8 flex flex-col h-full">
                <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-6"><h3 className="font-black text-slate-800 text-lg flex items-center gap-3"><div className="bg-indigo-100 p-2 rounded-lg text-indigo-600"><FileText size={20} /></div>المصدر والمحتوى</h3><span className="text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-medium">الذكاء الاصطناعي 3.0</span></div>
                  <div className="flex-grow space-y-8">
                     <div className="relative group"><textarea value={sourceText} onChange={e => setSourceText(e.target.value)} className="w-full h-40 border border-slate-200 rounded-2xl p-5 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-slate-800 leading-relaxed resize-none shadow-inner bg-slate-50 focus:bg-white transition-all" placeholder="الصق نص الدرس، المقال، أو ملخص الوحدة هنا..."></textarea><div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur text-xs font-bold text-slate-400 px-2 py-1 rounded-md border border-slate-200">نصوص</div></div>
                     <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div><div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-slate-400 font-bold tracking-wider">أو قم برفع الملفات</span></div></div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={`group relative overflow-hidden border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${sourcePdf ? 'bg-brand-50 border-brand-500' : 'border-slate-300 hover:bg-slate-50 hover:border-brand-400'}`}><input ref={pdfInputRef} type="file" accept="application/pdf" className="hidden" onChange={handlePdfUpload}/><div onClick={() => pdfInputRef.current?.click()} className="cursor-pointer relative z-10"><div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all transform group-hover:scale-110 shadow-lg ${sourcePdf ? 'bg-brand-500 text-white' : 'bg-white text-slate-400 group-hover:text-brand-500'}`}><FileIcon size={28} /></div><p className="font-bold text-slate-800 text-sm mb-1">{sourcePdf ? sourcePdfName : "كتاب / مذكرة (PDF)"}</p>{!sourcePdf && <p className="text-xs text-slate-400">تحليل ذكي للمنهج الدراسي</p>}</div>{sourcePdf && (<div className="mt-6 pt-4 border-t border-brand-200 flex items-center justify-center gap-3 animate-fadeIn"><div className="flex flex-col items-center"><span className="text-[10px] text-brand-800 font-bold mb-1">من ص</span><input type="number" min="1" placeholder="1" value={pdfPageFrom} onChange={(e) => setPdfPageFrom(e.target.value)} className="w-14 p-1.5 text-center text-sm font-bold bg-white border border-brand-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"/></div><span className="mt-5 text-brand-400 font-bold">إلى</span><div className="flex flex-col items-center"><span className="text-[10px] text-brand-800 font-bold mb-1">إلى ص</span><input type="number" min="1" placeholder="الكل" value={pdfPageTo} onChange={(e) => setPdfPageTo(e.target.value)} className="w-14 p-1.5 text-center text-sm font-bold bg-white border border-brand-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"/></div></div>)}</div>
                        <div onClick={() => fileInputRef.current?.click()} className="group border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center cursor-pointer hover:bg-slate-50 hover:border-brand-400 transition-all duration-300"><input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload}/><div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all transform group-hover:scale-110 shadow-sm group-hover:shadow-md"><Upload size={28} className="text-slate-400 group-hover:text-brand-500" /></div><p className="font-bold text-slate-800 text-sm mb-1">صور من الكتاب</p><p className="text-xs text-slate-400">JPG, PNG عالية الدقة</p></div>
                     </div>
                     {sourceImages.length > 0 && (<div className="flex gap-4 mt-4 overflow-x-auto pb-4 scrollbar-hide">{sourceImages.map((src, idx) => (<div key={idx} className="relative w-20 h-20 shrink-0 group"><img src={src} className="w-full h-full object-cover rounded-xl border border-slate-200 shadow-sm transition-transform group-hover:scale-105" alt="" /><button onClick={() => setSourceImages(prev => prev.filter((_, i) => i !== idx))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md opacity-0 group-hover:opacity-100 transition-opacity transform scale-0 group-hover:scale-100">×</button></div>))}</div>)}
                  </div>
                  <div className="flex justify-between items-center mt-10 pt-6 border-t border-slate-100"><button onClick={() => setStep('setup')} className="text-slate-400 hover:text-slate-600 font-bold transition flex items-center gap-2"><ChevronRight size={18} /> العودة</button><button onClick={handleGenerate} disabled={examSettings.types.length === 0} className="bg-brand-600 text-white px-10 py-4 rounded-xl hover:bg-brand-700 flex items-center gap-3 font-bold shadow-lg shadow-brand-500/30 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"><Sparkles size={20} className="animate-pulse" /> توليد الاختبار</button></div>
                </div>
             </div>
           </div>
         </div>
      )}

      {step === 'generating' && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-fadeIn">
           <div className="bg-white p-12 rounded-[2.5rem] shadow-2xl border border-white/50 text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-400 via-indigo-500 to-brand-400 animate-[pulse_2s_infinite]"></div>
             <div className="w-24 h-24 relative mb-8 mx-auto">
               <div className="absolute inset-0 border-[6px] border-slate-100 rounded-full"></div>
               <div className="absolute inset-0 border-[6px] border-brand-500 rounded-full border-t-transparent animate-spin"></div>
               <div className="absolute inset-0 flex items-center justify-center"><BrainCircuit className="text-brand-600 animate-pulse" size={32} /></div>
             </div>
             <h3 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">جاري صناعة الاختبار</h3>
             <p className="text-slate-500 font-medium max-w-xs mx-auto leading-relaxed">يقوم الذكاء الاصطناعي الآن بتحليل المحتوى واستخراج الأسئلة وتوزيع الدرجات...</p>
           </div>
        </div>
      )}

      {/* PREVIEW STEP */}
      {step === 'preview' && examData && (
        <div className={`flex flex-col md:flex-row gap-6 max-w-[1400px] mx-auto pb-20 px-4 animate-fadeIn ${focusMode ? 'justify-center' : ''}`}>
          
          {/* SIDEBAR TOOLS */}
          {!focusMode && (
            <div className="w-full md:w-20 lg:w-24 shrink-0 flex flex-col gap-4 no-print sticky top-28 h-fit">
               <button onClick={() => setStep('dashboard')} className="bg-brand-500 text-white p-2.5 rounded-xl shadow-lg hover:bg-brand-600 transition flex flex-col items-center justify-center gap-1" title="الرئيسية"><Home size={22} /></button>
               <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 flex flex-col gap-2 items-center">
                  <ToolButton icon={BrainCircuit} label="تحليل بلوم" onClick={() => setFeaturesSettings({...featuresSettings, showBloom: !featuresSettings.showBloom})} active={featuresSettings.showBloom} />
                  <ToolButton icon={Eye} label="عسر القراءة" onClick={() => setFeaturesSettings({...featuresSettings, isDyslexic: !featuresSettings.isDyslexic})} active={featuresSettings.isDyslexic} />
                  <ToolButton icon={Languages} label="ترجمة EN" onClick={handleTranslate} active={featuresSettings.language === 'en'}/>
                  <ToolButton icon={Copy} label="تصدير LMS" onClick={handleExportJSON} />
                  <ToolButton icon={BarChart} label="تحليل التوازن" onClick={() => setShowAnalytics(!showAnalytics)} active={showAnalytics}/>
                  <ToolButton icon={Stamp} label="علامة مائية" onClick={() => setFeaturesSettings({...featuresSettings, showWatermark: !featuresSettings.showWatermark})} active={featuresSettings.showWatermark}/>
                  <ToolButton icon={Minimize2} label="وضع التركيز" onClick={() => setFocusMode(true)} />
               </div>
            </div>
          )}

          <div className="flex-grow max-w-[210mm] mx-auto">
            {showAnalytics && (
                <div className="mb-6 bg-white p-6 rounded-2xl shadow-lg border border-slate-200 animate-slideDown glass-panel">
                    <div className="flex justify-between items-center mb-4"><h3 className="font-bold flex items-center gap-2"><BarChart size={20} className="text-brand-600"/> تحليل توازن الاختبار</h3><button onClick={() => setShowAnalytics(false)} className="text-slate-400 hover:text-red-500"><EyeOff size={18}/></button></div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100"><p className="text-xs text-emerald-600 font-bold mb-1">سهل</p><div className="h-2 bg-emerald-100 rounded-full mb-1 overflow-hidden"><div className="h-full bg-emerald-500 w-[30%] rounded-full"></div></div><span className="text-xl font-black text-emerald-700">30%</span></div>
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100"><p className="text-xs text-amber-600 font-bold mb-1">متوسط</p><div className="h-2 bg-amber-100 rounded-full mb-1 overflow-hidden"><div className="h-full bg-amber-500 w-[50%] rounded-full"></div></div><span className="text-xl font-black text-amber-700">50%</span></div>
                        <div className="bg-rose-50 p-4 rounded-xl border border-rose-100"><p className="text-xs text-rose-600 font-bold mb-1">صعب</p><div className="h-2 bg-rose-100 rounded-full mb-1 overflow-hidden"><div className="h-full bg-rose-500 w-[20%] rounded-full"></div></div><span className="text-xl font-black text-rose-700">20%</span></div>
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div className={`bg-slate-900 text-white p-4 rounded-2xl shadow-2xl mb-8 flex flex-col gap-4 no-print sticky top-4 z-40 border border-slate-800 transition-all duration-500 ${focusMode ? 'opacity-0 hover:opacity-100' : ''}`}>
               {focusMode && (
                   <button onClick={() => setFocusMode(false)} className="absolute top-2 right-2 bg-white text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg transform hover:scale-105 transition">إلغاء التركيز</button>
               )}
               <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                 <div className="flex bg-slate-800 p-1.5 rounded-xl overflow-x-auto max-w-full border border-slate-700">
                   {[
                      { id: 'student', label: 'ورقة الطالب' },
                      { id: 'teacher_key', label: 'نموذج الإجابة' },
                      { id: 'review', label: 'مراجعة شاملة' },
                      { id: 'bubble_sheet', label: 'ورقة التظليل' }
                    ].map((m) => (
                     <button key={m.id} onClick={() => setViewMode(m.id as any)} className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${viewMode === m.id ? 'bg-white text-slate-900 shadow-md transform scale-105' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>
                       {m.label}
                     </button>
                   ))}
                 </div>

                 <div className="flex gap-2 flex-wrap justify-center items-center">
                     {viewMode !== 'bubble_sheet' && (
                       <button onClick={() => setIsEditing(!isEditing)} className={`px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold shadow-lg transition hover:-translate-y-0.5 ${isEditing ? 'bg-amber-500 text-white shadow-amber-900/40' : 'bg-slate-700 text-white hover:bg-slate-600'}`}>
                        {isEditing ? <CheckSquare size={16} /> : <Edit3 size={16} />} {isEditing ? 'حفظ التعديلات' : 'تعديل يدوي'}
                      </button>
                     )}

                     <button onClick={() => setShowAutoGrader(true)} className="bg-purple-600 text-white px-4 py-2.5 rounded-xl hover:bg-purple-500 flex items-center gap-2 text-xs font-bold shadow-lg shadow-purple-900/40 transition hover:-translate-y-0.5">
                      <ScanLine size={16} /> المصحح الآلي
                    </button>

                    <div className="h-8 w-px bg-slate-700 mx-1 hidden md:block"></div>

                    <button onClick={() => setStep('taking')} className="bg-brand-600 text-white px-4 py-2.5 rounded-xl hover:bg-brand-500 flex items-center gap-2 text-xs font-bold shadow-lg shadow-brand-900/40 transition hover:-translate-y-0.5">
                      <BookOpenCheck size={16} /> اختبار تفاعلي
                    </button>
                    
                    <button onClick={handleExportWord} className="bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-500 flex items-center gap-2 text-xs font-bold shadow-lg shadow-blue-900/40 transition hover:-translate-y-0.5">
                      <FileIcon size={16} /> Word
                    </button>

                    {/* NEW DOWNLOAD DROPDOWN */}
                    <div className="relative">
                      <button 
                        onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                        disabled={generatingPdf}
                        className="bg-white text-slate-900 px-4 py-2.5 rounded-xl hover:bg-slate-100 flex items-center gap-2 text-xs font-bold shadow-lg transition hover:-translate-y-0.5"
                      >
                         {generatingPdf ? <span className="animate-spin">⌛</span> : <Download size={16} />}
                         تنزيل PDF
                         <ChevronDown size={14} className={`transition ${showDownloadMenu ? 'rotate-180' : ''}`}/>
                      </button>
                      
                      {showDownloadMenu && (
                          <div className="absolute top-full left-0 mt-2 w-48 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-slideDown flex flex-col">
                             <button onClick={() => handleDownloadSpecific('student')} className="px-4 py-3 text-right hover:bg-slate-50 border-b border-slate-100 text-sm font-bold flex items-center justify-between">ورقة الاختبار <FileText size={14} className="text-slate-400"/></button>
                             <button onClick={() => handleDownloadSpecific('teacher_key')} className="px-4 py-3 text-right hover:bg-slate-50 border-b border-slate-100 text-sm font-bold flex items-center justify-between">نموذج الإجابة <CheckSquare size={14} className="text-green-500"/></button>
                             <button onClick={() => handleDownloadSpecific('review')} className="px-4 py-3 text-right hover:bg-slate-50 border-b border-slate-100 text-sm font-bold flex items-center justify-between">ورقة مراجعة <BookOpenCheck size={14} className="text-blue-500"/></button>
                             <button onClick={() => handleDownloadSpecific('bubble_sheet')} className="px-4 py-3 text-right hover:bg-slate-50 text-sm font-bold flex items-center justify-between">ورقة التظليل <Grid size={14} className="text-red-500"/></button>
                          </div>
                      )}
                    </div>
                    
                    <button onClick={() => { setStep('content'); setExamData(null); }} className="bg-slate-700 text-slate-300 px-3 py-2.5 rounded-xl hover:bg-slate-600 transition" title="إنشاء جديد"><RotateCcw size={16} /></button>
                 </div>
               </div>
               
               {viewMode !== 'bubble_sheet' && (
                 <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                   <div className="flex items-center gap-2 text-slate-400"><Palette size={16} /><span className="text-xs font-medium">الثيم:</span></div>
                   <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">{themes.map(t => (<button key={t.id} onClick={() => setTheme(t.id)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${theme === t.id ? 'bg-brand-600 border-brand-500 text-white shadow-glow' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}>{t.label}</button>))}</div>
                 </div>
               )}

               {viewMode === 'bubble_sheet' && (
                 <div className="flex flex-col md:flex-row items-center gap-4 pt-4 border-t border-slate-800">
                   <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700">
                     <div className="px-2 text-slate-400"><LayoutIcon size={16} /></div>
                     <select value={bubbleDesign} onChange={(e) => setBubbleDesign(e.target.value as any)} className="bg-transparent text-white text-xs py-1 pr-2 pl-8 outline-none font-bold cursor-pointer">
                       {bubbleDesigns.map(d => (<option key={d.id} value={d.id} className="text-black">{d.label}</option>))}
                     </select>
                   </div>
                   <div className="h-4 w-px bg-slate-700 hidden md:block"></div>
                   <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700">
                      <button onClick={() => setBubbleLang('ar')} className={`px-3 py-1 text-[10px] rounded-md transition font-bold ${bubbleLang === 'ar' ? 'bg-white text-slate-900' : 'text-slate-400'}`}>عربي</button>
                      <button onClick={() => setBubbleLang('en')} className={`px-3 py-1 text-[10px] rounded-md transition font-bold ${bubbleLang === 'en' ? 'bg-white text-slate-900' : 'text-slate-400'}`}>English</button>
                   </div>
                   <div className="h-4 w-px bg-slate-700 hidden md:block"></div>
                   <div className="flex items-center gap-3">
                     <span className="text-xs text-slate-400 flex items-center gap-2"><PenTool size={14} /> المقالي:</span>
                     <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                       <button onClick={() => setEssayMode('none')} className={`px-3 py-1 text-[10px] rounded-md transition ${essayMode === 'none' ? 'bg-white text-slate-900 font-bold shadow-sm' : 'text-slate-400 hover:text-white'}`}>إخفاء</button>
                       <button onClick={() => setEssayMode('lines')} className={`px-3 py-1 text-[10px] rounded-md transition ${essayMode === 'lines' ? 'bg-white text-slate-900 font-bold shadow-sm' : 'text-slate-400 hover:text-white'}`}>أسطر</button>
                       <button onClick={() => setEssayMode('box')} className={`px-3 py-1 text-[10px] rounded-md transition ${essayMode === 'box' ? 'bg-white text-slate-900 font-bold shadow-sm' : 'text-slate-400 hover:text-white'}`}>مربع</button>
                     </div>
                   </div>
                 </div>
               )}
            </div>

            <div id="printable-paper" className="bg-white shadow-2xl print:shadow-none min-h-[297mm] transition-all duration-500">
               {viewMode === 'bubble_sheet' ? (
                  <BubbleSheet data={examData} header={header} design={bubbleDesign} essayMode={essayMode} language={bubbleLang} />
               ) : (
                  <ExamPaper data={examData} header={header} mode={viewMode as any} theme={theme} settings={featuresSettings} isEditing={isEditing} onUpdateQuestion={handleUpdateQuestion} />
               )}
            </div>
          </div>
        </div>
      )}

      {/* AUTO GRADER */}
      {showAutoGrader && examData && (<AutoGrader examData={examData} onClose={() => setShowAutoGrader(false)} />)}

      {/* INTERACTIVE QUIZ */}
      {step === 'taking' && examData && (<InteractiveQuiz data={examData} onExit={() => setStep('preview')} />)}

    </Layout>
  );
};

const ToolButton: React.FC<{ icon: any, label: string, onClick: () => void, active?: boolean }> = ({ icon: Icon, label, onClick, active }) => (
    <button onClick={onClick} className={`w-full flex flex-col items-center justify-center p-2.5 rounded-xl transition-all duration-300 ${active ? 'bg-brand-50 text-brand-700 ring-2 ring-brand-500 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 hover:shadow-sm'}`}>
        <Icon size={22} strokeWidth={active ? 2.5 : 2} className="mb-1.5" />
        <span className="text-[10px] font-bold text-center leading-tight">{label}</span>
    </button>
);

export default App;
