
export enum QuestionType {
  MCQ = 'mcq',
  TRUE_FALSE = 'true_false',
  ESSAY = 'essay',
  MATCHING = 'matching'
}

export type ExamTheme = 'classic' | 'modern' | 'formal' | 'creative' | 'minimal';
export type BubbleSheetDesign = 'standard' | 'modern' | 'grid' | 'compact' | 'circle';
export type EssayLayoutMode = 'none' | 'lines' | 'box';
export type BloomLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';

export interface ExamHeader {
  teacherName: string;
  schoolName: string;
  schoolLogo?: string; // Base64 string
  ministryLogo?: string; // Base64 string
  examType: 'final' | 'midterm1' | 'midterm2' | 'quiz';
  subject: string;
  gradeLevel: string;
  term: string; // "الفصل الدراسي الأول" etc.
  year: string;
}

export interface Question {
  id: number;
  type: QuestionType;
  text: string;
  options?: string[]; // For MCQ
  correctAnswer: string; // The correct answer text or key
  explanation: string; // For review mode
  matchingPairs?: { left: string; right: string }[]; // For matching questions
  points: number;
  bloomLevel?: BloomLevel; // New field
}

export interface ExamData {
  id: string; // Unique ID for QR code
  version: string; // 'A', 'B', 'C'
  timestamp: number; // For history sorting
  questions: Question[];
  totalPoints: number;
  language: 'ar' | 'en';
  header?: ExamHeader; // Optional copy of header for history
}

export interface GenerateConfig {
  header: ExamHeader;
  sourceText: string;
  sourceImages: string[]; // Base64 strings
  sourcePdf?: string; // Base64 string
  pdfPageRange?: { start: number; end: number }; // New: Specific pages
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  totalMarks: number; // New field
  includeTypes: QuestionType[];
}

export interface GradingResult {
  studentName: string;
  score: number;
  totalScore: number;
  corrections: {
    questionId: number;
    studentAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }[];
}

export interface ExamSettings {
  showWatermark: boolean;
  isDyslexic: boolean;
  showBloom: boolean;
  language: 'ar' | 'en';
}

export type AppStep = 'dashboard' | 'setup' | 'content' | 'generating' | 'preview' | 'taking';
