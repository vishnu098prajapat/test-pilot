
export interface User {
  id: string;
  email?: string; // Email is now optional
  displayName: string; // Used as "Name" for login
  dob: string; // Date of Birth, e.g., "YYYY-MM-DD"
  role: 'teacher' | 'student';
  profileImageUrl?: string; 
}

export type QuestionType = 'mcq' | 'short-answer' | 'true-false' | 'drag-and-drop';

export interface Option {
  id: string;
  text: string;
}

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  text: string; // This will serve as the main instruction/question for drag-and-drop
  points: number;
}

export interface MCQQuestion extends BaseQuestion {
  type: 'mcq';
  options: Option[];
  correctOptionId: string | null; // Store the ID of the correct option
  correctAnswer?: string; // To hold AI's original text answer for initial matching
}

export interface ShortAnswerQuestion extends BaseQuestion {
  type: 'short-answer';
  correctAnswer: string; 
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: 'true-false';
  correctAnswer: boolean;
}

// Types for Drag & Drop Question
export interface DraggableItem {
  id: string;
  text: string; // For now, draggable items are text-based
}

export interface DropTarget {
  id: string;
  label: string; // This is the text/label for the drop zone
}

export interface CorrectMapping {
  draggableItemId: string; // In the Test object, this will be the ID of the DraggableItem
  dropTargetId: string;   // In the Test object, this will be the ID of the DropTarget
}

export interface DragDropQuestion extends BaseQuestion {
  type: 'drag-and-drop';
  instruction?: string; // Optional: Specific instruction for the drag and drop task if `text` is a general title
  draggableItems: DraggableItem[];
  dropTargets: DropTarget[];
  correctMappings: CorrectMapping[]; // Array defining which draggable item goes to which drop target
}

export type Question = MCQQuestion | ShortAnswerQuestion | TrueFalseQuestion | DragDropQuestion;

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
  ipAddress?: string; 
}
