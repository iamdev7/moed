
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GenerateConfig, QuestionType, ExamData, GradingResult, Question } from "../types";

const mapDifficulty = (d: string) => {
  switch (d) {
    case 'easy': return 'سهل';
    case 'medium': return 'متوسط';
    case 'hard': return 'صعب';
    default: return 'متوسط';
  }
};

const mapExamType = (t: string) => {
  switch (t) {
    case 'final': return 'اختبار نهائي';
    case 'midterm1': return 'اختبار فتري أول';
    case 'midterm2': return 'اختبار فتري ثاني';
    case 'quiz': return 'اختبار قصير';
    default: return 'اختبار';
  }
};

// Order logic: MCQ -> TRUE_FALSE -> MATCHING -> ESSAY
const getQuestionTypePriority = (type: QuestionType): number => {
  switch (type) {
    case QuestionType.MCQ: return 1;
    case QuestionType.TRUE_FALSE: return 2;
    case QuestionType.MATCHING: return 3;
    case QuestionType.ESSAY: return 4;
    default: return 5;
  }
};

export const generateExamContent = async (config: GenerateConfig): Promise<ExamData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let pageInstruction = "";
  if (config.sourcePdf && config.pdfPageRange) {
    pageInstruction = `
    تنبيه هام جداً: الملف المرفق هو كتاب كامل. 
    يجب عليك الالتزام واستخراج الأسئلة حصرياً من المحتوى الموجود بين الصفحة رقم ${config.pdfPageRange.start} والصفحة رقم ${config.pdfPageRange.end} فقط.
    تجاهل أي محتوى خارج هذا النطاق من الصفحات.
    `;
  }

  const prompt = `
    أنت خبير تربوي ومدرس محترف. قم بإنشاء اختبار ${mapExamType(config.header.examType)} لمادة ${config.header.subject}.
    
    ${pageInstruction}

    المحتوى المطلوب للاختبار يجب أن يعتمد على النص، ملف PDF، أو الصور المرفقة.
    مستوى الصعوبة: ${mapDifficulty(config.difficulty)}.
    عدد الأسئلة المطلوبة: ${config.questionCount} تقريباً.
    الدرجة الكلية للاختبار يجب أن تكون: ${config.totalMarks}.
    
    أنواع الأسئلة المطلوبة: ${config.includeTypes.map(t => {
      if(t === QuestionType.MCQ) return 'اختيارات متعددة (4 خيارات)';
      if(t === QuestionType.TRUE_FALSE) return 'صح وخطأ';
      if(t === QuestionType.ESSAY) return 'مقالي';
      if(t === QuestionType.MATCHING) return 'مزاوجة (صل العمود الأول بالثاني)';
      return '';
    }).join(', ')}.

    مهم جداً:
    1. قم بتوزيع الدرجات (${config.totalMarks}) على الأسئلة بناءً على صعوبتها ونوعها.
    2. لكل سؤال، حدد "تصنيف بلوم" (Bloom's Taxonomy) المناسب (تذكر، فهم، تطبيق، تحليل، تقييم، ابتكار).
    3. لكل سؤال، يجب توفير الإجابة الصحيحة وتفسير للإجابة.
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      totalPoints: { type: Type.NUMBER },
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.INTEGER },
            type: { 
              type: Type.STRING, 
              enum: [
                QuestionType.MCQ, 
                QuestionType.TRUE_FALSE, 
                QuestionType.ESSAY, 
                QuestionType.MATCHING
              ] 
            },
            text: { type: Type.STRING, description: "نص السؤال" },
            points: { type: Type.NUMBER },
            bloomLevel: { 
                type: Type.STRING, 
                enum: ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'],
                description: "مستوى بلوم المعرفي"
            },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "خيارات السؤال إذا كان اختيارات متعددة"
            },
            correctAnswer: { type: Type.STRING, description: "الإجابة الصحيحة نصاً" },
            explanation: { type: Type.STRING, description: "شرح الإجابة للطلاب" },
            matchingPairs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  left: { type: Type.STRING },
                  right: { type: Type.STRING }
                }
              },
              description: "أزواج المزاوجة الصحيحة"
            }
          },
          required: ["id", "type", "text", "correctAnswer", "points", "explanation", "bloomLevel"]
        }
      }
    },
    required: ["questions", "totalPoints"]
  };

  const parts: any[] = [{ text: prompt }];

  if (config.sourceText) {
    parts.push({ text: `نص المحتوى المصدري:\n${config.sourceText}` });
  }

  if (config.sourcePdf) {
    const cleanBase64 = config.sourcePdf.split(',')[1] || config.sourcePdf;
    parts.push({
      inlineData: {
        mimeType: "application/pdf",
        data: cleanBase64
      }
    });
  }

  config.sourceImages.forEach((base64) => {
    const cleanBase64 = base64.split(',')[1] || base64;
    parts.push({
      inlineData: {
        mimeType: "image/jpeg", 
        data: cleanBase64
      }
    });
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.4, 
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No data returned");
    
    const parsedData = JSON.parse(jsonText);
    
    // Auto-sort questions by type
    parsedData.questions.sort((a: Question, b: Question) => {
      const priorityA = getQuestionTypePriority(a.type);
      const priorityB = getQuestionTypePriority(b.type);
      return priorityA - priorityB;
    });

    // Re-index IDs
    parsedData.questions.forEach((q: Question, index: number) => {
      q.id = index + 1;
    });
    
    // Add Metadata
    const finalData: ExamData = {
        ...parsedData,
        id: Math.random().toString(36).substr(2, 9).toUpperCase(),
        version: 'A',
        language: 'ar'
    };

    return finalData;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("فشل في توليد الاختبار. يرجى التأكد من المصادر والمحاولة مرة أخرى.");
  }
};

export const translateExam = async (examData: ExamData): Promise<ExamData> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // This is a simplified implementation. Real-world would check each field.
    const prompt = `
      Translate the following exam JSON object from Arabic to English. 
      Keep the structure exactly the same. Translate question text, options, answers, and explanations.
      Do NOT translate 'type' or 'id' values.
      
      JSON:
      ${JSON.stringify(examData)}
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [{ text: prompt }] },
        config: { responseMimeType: "application/json" }
    });

    const translated = JSON.parse(response.text);
    translated.language = 'en';
    return translated;
};


export const gradeStudentSheet = async (
  sheetImageBase64: string, 
  examData: ExamData
): Promise<GradingResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Prepare answer key summary for the model
  const answerKey = examData.questions.map(q => ({
    id: q.id,
    type: q.type,
    correctAnswer: q.correctAnswer,
    points: q.points
  }));

  const prompt = `
    أنت نظام تصحيح آلي (OMR) ذكي.
    لديك صورة لورقة إجابة طالب (تظليل) ونموذج الإجابة الصحيحة بصيغة JSON.
    
    المهام المطلوبة:
    1. ابحث عن الباركود (QR Code) في الورقة للتحقق من أن الورقة تتبع النموذج رقم ${examData.id} الإصدار ${examData.version}. (تجاوز هذا التحقق إذا لم يكن واضحاً).
    2. حاول قراءة اسم الطالب المكتوب بخط اليد.
    3. قارن إجابة الطالب بالإجابة الصحيحة.
    4. احسب الدرجة المكتسبة.
    
    نموذج الإجابة الصحيحة:
    ${JSON.stringify(answerKey)}
  `;

  const cleanBase64 = sheetImageBase64.split(',')[1] || sheetImageBase64;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      studentName: { type: Type.STRING, description: "اسم الطالب المقروء من الورقة أو 'غير معروف'" },
      score: { type: Type.NUMBER, description: "مجموع درجات الطالب" },
      totalScore: { type: Type.NUMBER, description: "الدرجة الكلية للاختبار" },
      corrections: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            questionId: { type: Type.INTEGER },
            studentAnswer: { type: Type.STRING, description: "الإجابة التي قام الطالب بتظليلها" },
            correctAnswer: { type: Type.STRING },
            isCorrect: { type: Type.BOOLEAN }
          }
        }
      }
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    return JSON.parse(response.text) as GradingResult;
  } catch (error) {
    console.error("Grading Error:", error);
    throw new Error("فشل في تصحيح الورقة. يرجى التأكد من وضوح الصورة.");
  }
}
