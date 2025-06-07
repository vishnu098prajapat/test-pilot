
import type { Test } from './types';

// Augment the Global interface to include our custom store
declare global {
  // eslint-disable-next-line no-var
  var __PRIMARY_APP_STORE_INSTANCE__: Test[];
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

// Initialize the store ONCE using a more robust check.
// This code runs when the module is first loaded by the Node.js process.
if (globalThis.__PRIMARY_APP_STORE_INSTANCE__ === undefined) {
  console.log('[STORE-INIT] globalThis.__PRIMARY_APP_STORE_INSTANCE__ is UNDEFINED. Initializing with a deep copy of mock data.');
  globalThis.__PRIMARY_APP_STORE_INSTANCE__ = JSON.parse(JSON.stringify(initialMockTests));
} else {
  console.log('[STORE-INIT] globalThis.__PRIMARY_APP_STORE_INSTANCE__ already exists. Re-using existing store instance.');
}


function getStore(): Test[] {
  // Always return the single global instance.
  // If it's somehow undefined here, something is very wrong with the server environment
  // or module lifecycle, beyond simple HMR.
  if (globalThis.__PRIMARY_APP_STORE_INSTANCE__ === undefined) {
      console.error('[STORE-CRITICAL] globalThis.__PRIMARY_APP_STORE_INSTANCE__ is UNDEFINED in getStore()! This should not happen after initial load. Falling back to re-initializing. This indicates a severe HMR or environment issue.');
      globalThis.__PRIMARY_APP_STORE_INSTANCE__ = JSON.parse(JSON.stringify(initialMockTests));
  }
  return globalThis.__PRIMARY_APP_STORE_INSTANCE__;
}

export async function getTestsByTeacher(teacherId: string): Promise<Test[]> {
  const store = getStore();
  console.log(`[STORE] getTestsByTeacher called for teacherId: "${teacherId}". Current store count: ${store.length}. IDs: ${store.map(t => t.id).join(', ')}`);
  return store.filter(test => test.teacherId === teacherId);
}

export async function getTestById(testId: string): Promise<Test | undefined> {
  const currentStore = getStore(); // Get the current state of the store
  console.log(`[STORE] getTestById: Called for ID: "${testId}"`);
  console.log(`[STORE] getTestById: Current store size from getStore(): ${currentStore.length}`);
  console.log(`[STORE] getTestById: Current store IDs from getStore(): ${currentStore.map(t => t.id).join(', ')}`);
  
  const foundTest = currentStore.find(test => test.id === testId);
  if (!foundTest) {
    console.warn(`[STORE] getTestById: Test with ID "${testId}" NOT FOUND in current store state during getTestById.`);
  } else {
    console.log(`[STORE] getTestById: Test with ID "${testId}" FOUND.`);
  }
  return foundTest;
}

export async function addTest(newTestData: Omit<Test, 'id' | 'createdAt' | 'updatedAt'>): Promise<Test> {
  // IMPORTANT: Ensure we are getting the reference to the *actual* global array
  const storeInstance = getStore(); 
  
  const newTest: Test = {
    ...newTestData,
    id: `test-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  console.log(`[STORE] addTest: Attempting to add test ID: ${newTest.id}`);
  console.log(`[STORE] addTest: Store instance size BEFORE push: ${storeInstance.length}`);
  console.log(`[STORE] addTest: Store instance IDs BEFORE push: ${storeInstance.map(t => t.id).join(', ')}`);

  storeInstance.push(newTest); // Directly modify the global array referenced by 'storeInstance'

  console.log(`[STORE] addTest: Store instance size AFTER push: ${storeInstance.length}`);
  console.log(`[STORE] addTest: Store instance IDs AFTER push: ${storeInstance.map(t => t.id).join(', ')}`);
  
  // Verify it's in the actual global store instance by fetching it again
  const verificationStore = getStore(); 
  if (verificationStore.find(t => t.id === newTest.id)) {
    console.log(`[STORE] SUCCESS: Test ID ${newTest.id} VERIFIED in global store (via getStore()) after addTest. Verification store count: ${verificationStore.length}`);
  } else {
    console.error(`[STORE] CRITICAL FAILURE: Test ID ${newTest.id} NOT VERIFIED in global store (via getStore()) after addTest. Verification store count: ${verificationStore.length}, IDs: ${verificationStore.map(t=>t.id).join(', ')}`);
  }
  return newTest;
}

export async function updateTest(testId: string, updatedTestData: Partial<Omit<Test, 'id' | 'teacherId' | 'createdAt'>>): Promise<Test | undefined> {
  const storeInstance = getStore();
  const testIndex = storeInstance.findIndex(test => test.id === testId);

  if (testIndex === -1) {
    console.warn(`[STORE] updateTest: Test with ID "${testId}" NOT FOUND for update.`);
    return undefined;
  }
  
  const updatedTest = {
    ...storeInstance[testIndex],
    ...updatedTestData,
    updatedAt: new Date(),
  };
  
  storeInstance[testIndex] = updatedTest; // Update in place

  console.log(`[STORE] Test updated. Test ID: ${updatedTest.id}. Store count: ${storeInstance.length}`);
  return updatedTest;
}

export async function deleteTest(testId: string): Promise<boolean> {
  const storeInstance = getStore();
  const testIndex = storeInstance.findIndex(test => test.id === testId);

  if (testIndex > -1) {
    storeInstance.splice(testIndex, 1); // Remove the test from the array
    console.log(`[STORE] Test with ID "${testId}" deleted. Store count: ${storeInstance.length}`);
    return true;
  } else {
    console.warn(`[STORE] deleteTest: Test with ID "${testId}" NOT FOUND for deletion. Store count: ${storeInstance.length}`);
    return false;
  }
}
