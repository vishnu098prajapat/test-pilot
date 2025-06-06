import type { Test, Question } from './types';

// Mock in-memory store for tests
let tests: Test[] = [
  {
    id: 'test1',
    title: 'Basic Algebra Quiz',
    subject: 'Mathematics',
    duration: 30, // minutes
    questions: [
      {
        id: 'q1',
        type: 'mcq',
        text: 'What is 2 + 2?',
        points: 10,
        options: [
          { id: 'opt1', text: '3' },
          { id: 'opt2', text: '4' },
          { id: 'opt3', text: '5' },
          { id: 'opt4', text: '6' },
        ],
        correctOptionId: 'opt2',
      },
      {
        id: 'q2',
        type: 'true-false',
        text: 'The Earth is flat.',
        points: 5,
        correctAnswer: false,
      },
       {
        id: 'q3',
        type: 'short-answer',
        text: 'What is the capital of France?',
        points: 10,
        correctAnswer: 'Paris',
      },
    ],
    teacherId: 'teacher1', // Corresponds to mock user
    createdAt: new Date('2023-10-01T10:00:00Z'),
    updatedAt: new Date('2023-10-01T10:00:00Z'),
    published: true,
    attemptsAllowed: 1,
    randomizeQuestions: false,
    enableTabSwitchDetection: true,
    enableCopyPasteDisable: true,
    enforceFullScreen: false,
  },
  {
    id: 'test2',
    title: 'Introduction to JavaScript',
    subject: 'Programming',
    duration: 60,
    questions: [
        {
        id: 'q2-1',
        type: 'mcq',
        text: 'Which keyword is used to declare a variable in JavaScript?',
        points: 10,
        options: [
          { id: 'opt2-1-1', text: 'var' },
          { id: 'opt2-1-2', text: 'let' },
          { id: 'opt2-1-3', text: 'const' },
          { id: 'opt2-1-4', text: 'All of the above' },
        ],
        correctOptionId: 'opt2-1-4',
      },
    ],
    teacherId: 'teacher1',
    createdAt: new Date('2023-10-15T14:30:00Z'),
    updatedAt: new Date('2023-10-15T14:30:00Z'),
    published: false,
    attemptsAllowed: 0, // Unlimited
    randomizeQuestions: true,
    enableTabSwitchDetection: true,
    enableCopyPasteDisable: false,
    enforceFullScreen: true,
  },
];

// Simulate server-side logic with a delay
const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getTestsByTeacher(teacherId: string): Promise<Test[]> {
  await simulateDelay(300);
  return tests.filter(test => test.teacherId === teacherId);
}

export async function getTestById(testId: string): Promise<Test | undefined> {
  await simulateDelay(200);
  return tests.find(test => test.id === testId);
}

export async function addTest(newTestData: Omit<Test, 'id' | 'createdAt' | 'updatedAt'>): Promise<Test> {
  await simulateDelay(500);
  const newTest: Test = {
    ...newTestData,
    id: `test-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  tests.push(newTest);
  return newTest;
}

export async function updateTest(testId: string, updatedTestData: Partial<Omit<Test, 'id' | 'teacherId' | 'createdAt'>>): Promise<Test | undefined> {
  await simulateDelay(400);
  const testIndex = tests.findIndex(test => test.id === testId);
  if (testIndex === -1) {
    return undefined;
  }
  tests[testIndex] = {
    ...tests[testIndex],
    ...updatedTestData,
    updatedAt: new Date(),
  };
  return tests[testIndex];
}

export async function deleteTest(testId: string): Promise<boolean> {
  await simulateDelay(300);
  const initialLength = tests.length;
  tests = tests.filter(test => test.id !== testId);
  return tests.length < initialLength;
}
