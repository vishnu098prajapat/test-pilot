

export interface User {
  id: string;
  email?: string; 
  displayName: string; 
  dob: string; 
  role: 'teacher' | 'student' | 'instituteAdmin'; // Added instituteAdmin
  profileImageUrl?: string; 
  instituteId?: string; // Added instituteId
}

export type QuestionType = 'mcq' | 'short-answer' | 'true-false' | 'drag-and-drop';

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
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: 'true-false';
  correctAnswer: boolean;
}

export interface DraggableItem {
  id: string;
  text: string; 
}

export interface DropTarget {
  id: string;
  label: string; 
}

export interface CorrectMapping {
  draggableItemId: string; 
  dropTargetId: string;   
}

export interface DragDropQuestion extends BaseQuestion {
  type: 'drag-and-drop';
  instruction?: string; 
  draggableItems: DraggableItem[];
  dropTargets: DropTarget[];
  correctMappings: CorrectMapping[]; 
}

export type Question = MCQQuestion | ShortAnswerQuestion | TrueFalseQuestion | DragDropQuestion;


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
  instituteId?: string; // Added
  batchId?: string;     // Added
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
export interface Institute {
  id: string;
  name: string;
  adminIds: string[]; // Array of User IDs who are admins of this institute
}

export interface Batch {
  id: string;
  name: string; // e.g., "JEE 2025 Physics", "Class 10 - Section A"
  instituteId: string; // Links to an Institute
  teacherIds: string[]; // Array of User IDs who teach this batch
  studentIdentifiers: string[]; // Using array of student display names for simplicity with current auth
}
