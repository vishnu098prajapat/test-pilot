
import type { Test } from './types';
import fs from 'fs';
import path from 'path';

// Define the path to the JSON file that will act as our database
const DB_FILE_PATH = path.join(process.cwd(), 'local_test_db.json');

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
    // Store dates as ISO strings for JSON compatibility
    createdAt: new Date('2023-10-01T10:00:00Z').toISOString() as any,
    updatedAt: new Date('2023-10-01T10:00:00Z').toISOString() as any,
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
    createdAt: new Date('2023-10-15T14:30:00Z').toISOString() as any,
    updatedAt: new Date('2023-10-15T14:30:00Z').toISOString() as any,
    published: false,
    attemptsAllowed: 0, // Unlimited
    randomizeQuestions: true,
    enableTabSwitchDetection: true,
    enableCopyPasteDisable: false,
    enforceFullScreen: true,
  },
];

// Function to read data from the JSON file
function readDb(): Test[] {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const fileContent = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const data = JSON.parse(fileContent);
      // Ensure dates are parsed back into Date objects if needed, or handle as strings
      return data.map((test: Test) => ({
        ...test,
        createdAt: new Date(test.createdAt),
        updatedAt: new Date(test.updatedAt),
      }));
    }
  } catch (error) {
    console.error('[STORE-DB] Error reading or parsing DB file:', error);
    // Fallback or re-initialization logic if file is corrupt
  }
  // If file doesn't exist or error, initialize with mock data and write to file
  console.log('[STORE-DB] DB file not found or error reading. Initializing with mock data and creating file.');
  fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initialMockTests, null, 2), 'utf-8');
  return initialMockTests.map(test => ({
    ...test,
    createdAt: new Date(test.createdAt),
    updatedAt: new Date(test.updatedAt),
  }));
}

// Function to write data to the JSON file
function writeDb(data: Test[]): void {
  try {
    // Convert Date objects to ISO strings before writing
    const dataToWrite = data.map(test => ({
        ...test,
        createdAt: (test.createdAt as Date).toISOString(),
        updatedAt: (test.updatedAt as Date).toISOString(),
    }));
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(dataToWrite, null, 2), 'utf-8');
    console.log(`[STORE-DB] Data successfully written to ${DB_FILE_PATH}. Total tests: ${data.length}`);
  } catch (error) {
    console.error('[STORE-DB] Error writing to DB file:', error);
  }
}

// Initialize the store by ensuring the DB file exists
// This top-level call will ensure the DB is ready when the module loads.
// The readDb function handles creation if it doesn't exist.
readDb(); 


export async function getTestsByTeacher(teacherId: string): Promise<Test[]> {
  const store = readDb();
  console.log(`[STORE-DB] getTestsByTeacher called for teacherId: "${teacherId}". Store count: ${store.length}`);
  return store.filter(test => test.teacherId === teacherId);
}

export async function getTestById(testId: string): Promise<Test | undefined> {
  const store = readDb();
  console.log(`[STORE-DB] getTestById called for ID: "${testId}". Current store count from DB: ${store.length}`);
  const foundTest = store.find(test => test.id === testId);
  if (!foundTest) {
    console.warn(`[STORE-DB] Test with ID "${testId}" NOT FOUND in DB.`);
  } else {
    console.log(`[STORE-DB] Test with ID "${testId}" FOUND in DB.`);
  }
  return foundTest;
}

export async function addTest(newTestData: Omit<Test, 'id' | 'createdAt' | 'updatedAt'>): Promise<Test> {
  const store = readDb();
  
  const newTest: Test = {
    ...newTestData,
    id: `test-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  console.log(`[STORE-DB] addTest: Attempting to add test ID: ${newTest.id}`);
  store.push(newTest);
  writeDb(store); // Write the updated store back to the file
  
  // Verify it was written by reading again (optional, good for debugging)
  const verificationStore = readDb();
  if (verificationStore.find(t => t.id === newTest.id)) {
    console.log(`[STORE-DB] SUCCESS: Test ID ${newTest.id} VERIFIED in DB file after addTest.`);
  } else {
    console.error(`[STORE-DB] CRITICAL FAILURE: Test ID ${newTest.id} NOT VERIFIED in DB file after addTest.`);
  }
  return newTest;
}

export async function updateTest(testId: string, updatedTestData: Partial<Omit<Test, 'id' | 'teacherId' | 'createdAt'>>): Promise<Test | undefined> {
  const store = readDb();
  const testIndex = store.findIndex(test => test.id === testId);

  if (testIndex === -1) {
    console.warn(`[STORE-DB] updateTest: Test with ID "${testId}" NOT FOUND for update.`);
    return undefined;
  }
  
  const updatedTest: Test = {
    ...store[testIndex],
    ...updatedTestData,
    updatedAt: new Date(),
  };
  
  store[testIndex] = updatedTest;
  writeDb(store);

  console.log(`[STORE-DB] updateTest: Test updated. Test ID: ${updatedTest.id}. Store count: ${store.length}`);
  return updatedTest;
}

export async function deleteTest(testId: string): Promise<boolean> {
  let store = readDb();
  const initialLength = store.length;
  
  store = store.filter(test => test.id !== testId);

  if (store.length < initialLength) {
    writeDb(store);
    console.log(`[STORE-DB] deleteTest: Test with ID "${testId}" deleted. New store count: ${store.length}`);
    return true;
  } else {
    console.warn(`[STORE-DB] deleteTest: Test with ID "${testId}" NOT FOUND for deletion. Store count: ${initialLength}`);
    return false;
  }
}
