

export interface User {
  id: string;
  email?: string; 
  displayName: string; 
  dob: string; 
  role: 'teacher' | 'student';
  profileImageUrl?: string; 
}

export type QuestionType = 'mcq' | 'short-answer' | 'true-false';

export interface Option {
  id: string;
  text: string;
}

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  text: string; 
  points: number;
}

export interface MCQQuestion extends BaseQuestion {
  type: 'mcq';
  options: Option[];
  correctOptionId: string | null; 
  correctAnswer?: string; 
  isAiPreselected?: boolean; 
}

export interface ShortAnswerQuestion extends BaseQuestion {
  type: 'short-answer';
  correctAnswer: string; 
  options?: never; 
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: 'true-false';
  correctAnswer: boolean;
  options?: never;
}

export type Question = MCQQuestion | ShortAnswerQuestion | TrueFalseQuestion;


export interface Test {
  id: string;
  title: string;
  subject: string;
  duration: number; 
  questions: Question[];
  teacherId: string; 
  createdAt: Date;
  updatedAt: Date;
  published: boolean;
  attemptsAllowed: number; 
  randomizeQuestions: boolean;
  enableTabSwitchDetection: boolean;
  enableCopyPasteDisable: boolean;
  batchId?: string;
  isAiGenerated?: boolean;     
}

export interface StudentAnswer {
  questionId: string;
  answer: any; 
  isCorrect?: boolean; 
  pointsScored?: number; 
}

export interface TestAttempt {
  id: string; 
  testId: string;
  testTitle: string; 
  studentIdentifier: string; 
  startTime: string; 
  endTime: string; 
  answers: StudentAnswer[];
  score: number; 
  maxPossiblePoints: number;
  scorePercentage: number;
  activityLog?: string; 
  isSuspicious?: boolean;
  suspiciousReason?: string;
  submittedAt: string; 
  ipAddress?: string; 
}

// New types for Institute and Batch
export interface Batch {
  id: string;
  name: string; // e.g., "JEE 2025 Physics", "Class 10 - Section A"
  teacherId: string;
  groupCode: string; // Added group code
  studentIdentifiers: string[]; // Using array of student display names for simplicity with current auth
  createdAt: string;
}
