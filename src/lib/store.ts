
import type { Test, Question } from './types';

// Augment the Global interface to include our custom store
declare global {
  var __DEV_TEST_APP_STORE__: Test[] | undefined;
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

// Initialize the store on globalThis if it doesn't exist.
// This block should only run once per server lifecycle in development.
if (process.env.NODE_ENV !== 'production') {
  if (!globalThis.__DEV_TEST_APP_STORE__) {
    console.log('[STORE-INIT] Initializing globalThis.__DEV_TEST_APP_STORE__ with initial mock data.');
    globalThis.__DEV_TEST_APP_STORE__ = [...initialMockTests]; // Store a copy
  }
}

function getStore(): Test[] {
  if (process.env.NODE_ENV === 'production') {
    // In production, you'd ideally use a real database.
    // For this mock, we'll simulate a separate prod store if needed,
    // but it won't persist across deployments.
    if (!globalThis.__PROD_TEST_APP_STORE__) {
        (globalThis as any).__PROD_TEST_APP_STORE__ = [...initialMockTests];
    }
    return (globalThis as any).__PROD_TEST_APP_STORE__;
  } else {
    // Development: use the dev-specific global store
    if (!globalThis.__DEV_TEST_APP_STORE__) {
      console.warn('[STORE-WARN] globalThis.__DEV_TEST_APP_STORE__ was not found in getStore (dev). Re-initializing.');
      globalThis.__DEV_TEST_APP_STORE__ = [...initialMockTests];
    }
    return globalThis.__DEV_TEST_APP_STORE__;
  }
}


export async function getTestsByTeacher(teacherId: string): Promise<Test[]> {
  const store = getStore();
  console.log(`[STORE] getTestsByTeacher called for teacherId: "${teacherId}". Store count: ${store.length}`);
  return store.filter(test => test.teacherId === teacherId);
}

export async function getTestById(testId: string): Promise<Test | undefined> {
  const store = getStore();
  console.log(`[STORE] getTestById: Called for ID: "${testId}"`);
  console.log(`[STORE] getTestById: Current store size from getStore(): ${store.length}`);
  console.log(`[STORE] getTestById: Current store IDs from getStore(): ${store.map(t => t.id).join(', ')}`);
  
  const foundTest = store.find(test => test.id === testId);
  if (!foundTest) {
    console.warn(`[STORE] getTestById: Test with ID "${testId}" NOT FOUND.`);
  } else {
    console.log(`[STORE] getTestById: Test with ID "${testId}" FOUND.`);
  }
  return foundTest;
}

export async function addTest(newTestData: Omit<Test, 'id' | 'createdAt' | 'updatedAt'>): Promise<Test> {
  const store = getStore(); // Get the reference to the global array
  
  const newTest: Test = {
    ...newTestData,
    id: `test-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  console.log(`[STORE] addTest: Attempting to add test ID: ${newTest.id}`);
  console.log(`[STORE] addTest: Store size BEFORE push: ${store.length}`);
  console.log(`[STORE] addTest: Store IDs BEFORE push: ${store.map(t => t.id).join(', ')}`);

  store.push(newTest); // Directly modify the global array referenced by 'store'

  console.log(`[STORE] addTest: Store size AFTER push: ${store.length}`);
  console.log(`[STORE] addTest: Store IDs AFTER push (from mutated 'store' var): ${store.map(t => t.id).join(', ')}`);
  
  // Verify it's in the actual global store instance
  const verificationStore = getStore(); // Fetch global store again
  if (verificationStore.find(t => t.id === newTest.id)) {
    console.log(`[STORE] SUCCESS: Test ID ${newTest.id} VERIFIED in global store (via getStore()) after addTest.`);
  } else {
    console.error(`[STORE] CRITICAL FAILURE: Test ID ${newTest.id} NOT VERIFIED in global store (via getStore()) after addTest. Verification store length: ${verificationStore.length}, IDs: ${verificationStore.map(t=>t.id).join(', ')}`);
  }
  return newTest;
}

export async function updateTest(testId: string, updatedTestData: Partial<Omit<Test, 'id' | 'teacherId' | 'createdAt'>>): Promise<Test | undefined> {
  const store = getStore();
  const testIndex = store.findIndex(test => test.id === testId);

  if (testIndex === -1) {
    console.warn(`[STORE] updateTest: Test with ID "${testId}" NOT FOUND for update.`);
    return undefined;
  }
  
  const updatedTest = {
    ...store[testIndex],
    ...updatedTestData,
    updatedAt: new Date(),
  };
  
  store[testIndex] = updatedTest; // Update in place

  console.log('[STORE] Test updated. Test ID:', updatedTest.id);
  return updatedTest;
}

export async function deleteTest(testId: string): Promise<boolean> {
  const store = getStore();
  const initialLength = store.length;
  const testIndex = store.findIndex(test => test.id === testId);

  if (testIndex > -1) {
    store.splice(testIndex, 1); // Remove the test from the array
    console.log(`[STORE] Test with ID "${testId}" deleted.`);
    console.log('[STORE] Total tests in store after delete:', store.length);
    return true;
  } else {
    console.warn(`[STORE] deleteTest: Test with ID "${testId}" NOT FOUND for deletion.`);
    console.log('[STORE] Total tests in store after failed delete attempt:', store.length);
    return false;
  }
}
