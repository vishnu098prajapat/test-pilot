export interface User {
  id: string;
  email: string;
  role: 'teacher' | 'student'; // For mock purposes, students might not have accounts
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
}

export interface ShortAnswerQuestion extends BaseQuestion {
  type: 'short-answer';
  correctAnswer: string; // Could be an array for multiple accepted answers
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: 'true-false';
  correctAnswer: boolean;
}

export type Question = MCQQuestion | ShortAnswerQuestion | TrueFalseQuestion;

export interface Test {
  id: string;
  title: string;
  subject: string;
  duration: number; // in minutes
  questions: Question[];
  teacherId: string; // ID of the teacher who created the test
  createdAt: Date;
  updatedAt: Date;
  published: boolean;
  // Settings
  attemptsAllowed: number; // 0 for unlimited
  randomizeQuestions: boolean;
  // Anti-cheat
  enableTabSwitchDetection: boolean;
  enableCopyPasteDisable: boolean;
  enforceFullScreen: boolean;
}

export interface StudentAnswer {
  questionId: string;
  answer: any; // string for short answer, optionId for MCQ, boolean for T/F
}

export interface TestAttempt {
  id:string;
  testId: string;
  studentIdentifier: string; // Could be name, email, or unique ID if students log in
  startTime: Date;
  endTime?: Date;
  answers: StudentAnswer[];
  score?: number;
  activityLog?: string; // For AI proctoring
  isSuspicious?: boolean;
  suspiciousReason?: string;
}
