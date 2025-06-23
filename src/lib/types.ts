
import { z } from 'zod';

export interface User {
  id: string;
  email?: string; 
  displayName: string; 
  dob: string; 
  role: 'teacher' | 'student';
  profileImageUrl?: string; 
  signupIp?: string;
  signupTimestamp?: string;
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


// --- Schemas for Test Builder Form ---

export const optionSchema = z.object({
  id: z.string(),
  text: z.string().min(1, "Option text cannot be empty"),
});

export const baseQuestionSchema = z.object({
  id: z.string(), 
  text: z.string().min(1, "Question text is required"),
  points: z.number().min(0, "Points must be non-negative"),
});

export const mcqQuestionSchema = baseQuestionSchema.extend({
  type: z.literal("mcq"),
  options: z.array(optionSchema).min(2, "MCQ must have at least 2 options").max(4, "MCQ can have at most 4 options"),
  correctOptionId: z.string().nullable().refine(val => val !== null, "Correct option must be selected for MCQ"),
  correctAnswer: z.string().optional(), 
  isAiPreselected: z.boolean().optional(),
});

export const shortAnswerQuestionSchema = baseQuestionSchema.extend({
  type: z.literal("short-answer"),
  correctAnswer: z.string().min(1, "Correct answer is required for short answer"),
  options: z.array(optionSchema).optional().nullable(),
});

export const trueFalseQuestionSchema = baseQuestionSchema.extend({
  type: z.literal("true-false"),
  correctAnswer: z.boolean({ required_error: "Correct answer must be selected for True/False" }),
  options: z.array(optionSchema).optional().nullable(),
});

export const questionSchema = z.discriminatedUnion("type", [
  mcqQuestionSchema,
  shortAnswerQuestionSchema,
  trueFalseQuestionSchema,
]);

export const testBuilderSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  subject: z.string().min(1, "Subject is required"),
  duration: z.number().min(5, "Duration must be at least 5 minutes").max(180, "Duration cannot exceed 3 hours"),
  questions: z.array(questionSchema).min(1, "Test must have at least one question"),
  attemptsAllowed: z.number().min(0, "Attempts must be non-negative (0 for unlimited)"), 
  randomizeQuestions: z.boolean(),
  enableTabSwitchDetection: z.boolean(),
  enableCopyPasteDisable: z.boolean(),
  published: z.boolean(),
  isAiGenerated: z.boolean().optional(),
});

export type TestBuilderFormValues = z.infer<typeof testBuilderSchema>;
