
export interface User {
  id: string;
  email?: string; // Email is now optional
  displayName: string; // Used as "Name" for login
  dob: string; // Date of Birth, e.g., "YYYY-MM-DD"
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
}

export interface ShortAnswerQuestion extends BaseQuestion {
  type: 'short-answer';
  correctAnswer: string; 
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
  teacherId: string; 
  createdAt: Date;
  updatedAt: Date;
  published: boolean;
  // Settings
  attemptsAllowed: number; // 0 for unlimited
  randomizeQuestions: boolean;
  // Anti-cheat
  enableTabSwitchDetection: boolean;
  enableCopyPasteDisable: boolean;
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
  startTime: string; // ISO string
  endTime: string; // ISO string
  answers: StudentAnswer[];
  score: number; 
  maxPossiblePoints: number;
  scorePercentage: number;
  activityLog?: string; 
  isSuspicious?: boolean;
  suspiciousReason?: string;
  submittedAt: string; // ISO string for when the attempt was recorded
  ipAddress?: string; // Added IP address
}
