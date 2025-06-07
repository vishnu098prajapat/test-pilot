
import type { Test } from './types';

// Augment the Global interface to include our custom store
declare global {
  // eslint-disable-next-line no-var
  var __PRIMARY_APP_STORE_INSTANCE__: Test[] | undefined;
}

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
    teacherId: 'teacher1',
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

// Initialize the store ONCE using a standard check for the global variable.
if (typeof globalThis.__PRIMARY_APP_STORE_INSTANCE__ === 'undefined') {
  console.log('[STORE-INIT] globalThis.__PRIMARY_APP_STORE_INSTANCE__ is UNDEFINED. Initializing with a deep copy of mock data.');
  // Deep copy to prevent accidental mutation of initialMockTests if it were used elsewhere.
  globalThis.__PRIMARY_APP_STORE_INSTANCE__ = JSON.parse(JSON.stringify(initialMockTests));
} else {
  console.log(`[STORE-INIT] globalThis.__PRIMARY_APP_STORE_INSTANCE__ already exists. Current count: ${globalThis.__PRIMARY_APP_STORE_INSTANCE__.length}. Re-using existing store instance.`);
}

function getStore(): Test[] {
  // This function now primarily serves as an accessor and a last-resort initializer
  // if the global variable somehow gets wiped to undefined (though the goal is it shouldn't after first init).
  if (typeof globalThis.__PRIMARY_APP_STORE_INSTANCE__ === 'undefined' || !Array.isArray(globalThis.__PRIMARY_APP_STORE_INSTANCE__)) {
      console.error('[STORE-CRITICAL] globalThis.__PRIMARY_APP_STORE_INSTANCE__ is UNDEFINED or not an array in getStore()! This indicates a severe HMR or environment issue. Re-initializing.');
      globalThis.__PRIMARY_APP_STORE_INSTANCE__ = JSON.parse(JSON.stringify(initialMockTests));
  }
  return globalThis.__PRIMARY_APP_STORE_INSTANCE__;
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
    console.warn(`[STORE] getTestById: Test with ID "${testId}" NOT FOUND in current store state during getTestById.`);
  } else {
    console.log(`[STORE] getTestById: Test with ID "${testId}" FOUND.`);
  }
  return foundTest;
}

export async function addTest(newTestData: Omit<Test, 'id' | 'createdAt' | 'updatedAt'>): Promise<Test> {
  const store = getStore(); // Get the direct reference to the global array
  
  const newTest: Test = {
    ...newTestData,
    id: `test-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  console.log(`[STORE] addTest: Attempting to add test ID: ${newTest.id}`);
  console.log(`[STORE] addTest: Store size BEFORE push: ${store.length}`);
  console.log(`[STORE] addTest: Store IDs BEFORE push: ${store.map(t => t.id).join(', ')}`);

  store.push(newTest); // Directly mutate the global array

  console.log(`[STORE] addTest: Store size AFTER push: ${store.length}`);
  console.log(`[STORE] addTest: Store IDs AFTER push (from mutated 'store' var): ${store.map(t => t.id).join(', ')}`);
  
  // Verify it's in the actual global store instance by fetching it again (or checking the same reference)
  const verificationStore = getStore(); // Should be the same array instance
  if (verificationStore.find(t => t.id === newTest.id)) {
    console.log(`[STORE] SUCCESS: Test ID ${newTest.id} VERIFIED in global store (via getStore()) after addTest. Verification store count: ${verificationStore.length}`);
  } else {
    // This case should be less likely now if 'store' is truly the global reference and 'push' worked.
    console.error(`[STORE] CRITICAL FAILURE: Test ID ${newTest.id} NOT VERIFIED in global store (via getStore()) after addTest. Verification store count: ${verificationStore.length}, IDs: ${verificationStore.map(t=>t.id).join(', ')}`);
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
    ...store[testIndex], // Existing test data
    ...updatedTestData, // Overwrite with new data
    updatedAt: new Date(), // Always update timestamp
  };
  
  store[testIndex] = updatedTest; // Update in place

  console.log(`[STORE] updateTest: Test updated. Test ID: ${updatedTest.id}. Store count: ${store.length}`);
  return updatedTest;
}

export async function deleteTest(testId: string): Promise<boolean> {
  const store = getStore();
  const initialLength = store.length;
  // Filter out the test to delete, creating a new array
  const newStore = store.filter(test => test.id !== testId);

  if (newStore.length < initialLength) {
    // If a test was removed, update the global store reference to this new array.
    // This is a key change: instead of splice, we replace the array.
    globalThis.__PRIMARY_APP_STORE_INSTANCE__ = newStore;
    console.log(`[STORE] deleteTest: Test with ID "${testId}" deleted. Store count: ${newStore.length}`);
    return true;
  } else {
    console.warn(`[STORE] deleteTest: Test with ID "${testId}" NOT FOUND for deletion. Store count: ${initialLength}`);
    return false;
  }
}
