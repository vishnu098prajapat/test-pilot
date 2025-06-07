
import type { Test, Question } from './types';

// Augment the Global interface to include our custom 'tests_store'
declare global {
  var tests_store: Test[] | undefined;
  var tests_store_prod: Test[] | undefined; // Using a different name for safety
}

// Initial mock data
const initialMockTests: Test[] = [
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


function getStore(): Test[] {
  if (process.env.NODE_ENV === 'production') {
     if (!globalThis.tests_store_prod) {
        (globalThis as any).tests_store_prod = [...initialMockTests];
     }
     return (globalThis as any).tests_store_prod;
  } else {
    // Development environment
    if (!globalThis.tests_store) {
      console.log('[STORE-INIT] Initializing globalThis.tests_store for development with a copy of mock data.');
      globalThis.tests_store = [...initialMockTests]; // Use a copy
    }
    return globalThis.tests_store;
  }
}

function setStore(newStore: Test[]): void {
  if (process.env.NODE_ENV === 'production') {
     (globalThis as any).tests_store_prod = newStore;
  } else {
    globalThis.tests_store = newStore;
  }
}


export async function getTestsByTeacher(teacherId: string): Promise<Test[]> {
  const currentTests = getStore();
  console.log(`[STORE] getTestsByTeacher called for teacherId: "${teacherId}". Store count: ${currentTests.length}`);
  return currentTests.filter(test => test.teacherId === teacherId);
}

export async function getTestById(testId: string): Promise<Test | undefined> {
  const currentTests = getStore();
  console.log(`[STORE] getTestById called for ID: "${testId}"`);
  console.log(`[STORE] Current test count in store variable: ${currentTests.length}`);
  console.log(`[STORE] Current test IDs in store variable: ${currentTests.map(t => t.id).join(', ')}`);
  const foundTest = currentTests.find(test => test.id === testId);
  if (!foundTest) {
    console.warn(`[STORE] Test with ID "${testId}" NOT FOUND in current store state during getTestById.`);
  } else {
    console.log(`[STORE] Test with ID "${testId}" FOUND in store.`);
  }
  return foundTest;
}

export async function addTest(newTestData: Omit<Test, 'id' | 'createdAt' | 'updatedAt'>): Promise<Test> {
  const currentTests = getStore(); // Get current state
  const newTest: Test = {
    ...newTestData,
    id: `test-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  // Create a new array with the new test and assign it back
  const updatedTests = [...currentTests, newTest];
  setStore(updatedTests); // This updates globalThis.tests_store

  console.log('[STORE] addTest: New test to be added:', JSON.stringify(newTest.id));
  console.log('[STORE] addTest: Store state BEFORE add attempt (IDs):', currentTests.map(t => t.id).join(', ') || 'empty');
  
  const finalStore = getStore(); // Re-fetch to confirm it was set
  console.log('[STORE] addTest: Total tests in store AFTER add:', finalStore.length);
  console.log(`[STORE] addTest: All test IDs in store AFTER add: ${finalStore.map(t => t.id).join(', ')}`);
  
  if (!finalStore.find(t => t.id === newTest.id)) {
    console.error(`[STORE] CRITICAL: Test ID ${newTest.id} was NOT FOUND in store immediately after addTest!`);
  } else {
    console.log(`[STORE] SUCCESS: Test ID ${newTest.id} was found in store after addTest.`);
  }
  return newTest;
}

export async function updateTest(testId: string, updatedTestData: Partial<Omit<Test, 'id' | 'teacherId' | 'createdAt'>>): Promise<Test | undefined> {
  let currentTests = getStore();
  const testIndex = currentTests.findIndex(test => test.id === testId);

  if (testIndex === -1) {
    console.warn(`[STORE] updateTest: Test with ID "${testId}" NOT FOUND for update.`);
    return undefined;
  }
  
  const updatedTest = {
    ...currentTests[testIndex],
    ...updatedTestData,
    updatedAt: new Date(),
  };
  
  const newStoreState = currentTests.map((test, index) => index === testIndex ? updatedTest : test);
  setStore(newStoreState);

  console.log('[STORE] Test updated. Test ID:', updatedTest.id);
  return updatedTest;
}

export async function deleteTest(testId: string): Promise<boolean> {
  let currentTests = getStore();
  const initialLength = currentTests.length;
  const newTestsArray = currentTests.filter(test => test.id !== testId);
  const success = newTestsArray.length < initialLength;

  if (success) {
    setStore(newTestsArray);
    console.log(`[STORE] Test with ID "${testId}" deleted.`);
  } else {
    console.warn(`[STORE] deleteTest: Test with ID "${testId}" NOT FOUND for deletion.`);
  }
  console.log('[STORE] Total tests in store after delete attempt:', getStore().length);
  return success;
}
