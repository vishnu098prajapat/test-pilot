
export interface User {
  id: string;
  email?: string; // Email is now optional
  displayName: string; // Used as "Name" for login
  dob: string; // Date of Birth, e.g., "YYYY-MM-DD"
  role: 'teacher' | 'student';
  profileImageUrl?: string; // Optional: For future image functionality
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
}

export interface StudentAnswer {
  questionId: string;
  answer: any; // string for short answer, optionId for MCQ, boolean for T/F
  isCorrect?: boolean; // Optional: can be calculated or stored
  pointsScored?: number; // Optional: points for this specific answer
}

export interface TestAttempt {
  id: string; // Unique ID for this attempt
  testId: string;
  testTitle: string; // Denormalized for easier leaderboard display
  studentIdentifier: string; // Student's name or other ID
  startTime: string; // ISO string
  endTime: string; // ISO string
  answers: StudentAnswer[];
  score: number; // Total points scored
  maxPossiblePoints: number;
  scorePercentage: number;
  activityLog?: string; // For AI proctoring
  isSuspicious?: boolean;
  suspiciousReason?: string;
  submittedAt: string; // ISO string for when the attempt was recorded
}
