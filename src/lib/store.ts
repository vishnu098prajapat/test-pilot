
import type { Test, Question } from './types';

const API_BASE_URL = '/api'; // Assuming your app runs at the root

// Helper function to fetch all tests from the API
async function _fetchAllTests(): Promise<Test[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/tests`);
    if (!response.ok) {
      console.error(`[STORE-CLIENT] Error fetching tests: ${response.status} ${response.statusText}`);
      const errorBody = await response.text();
      console.error(`[STORE-CLIENT] Error body: ${errorBody}`);
      return []; // Return empty or throw, depending on desired error handling
    }
    const tests: Test[] = await response.json();
    // Convert date strings from JSON to Date objects
    return tests.map(test => ({
      ...test,
      createdAt: new Date(test.createdAt),
      updatedAt: new Date(test.updatedAt),
    }));
  } catch (error) {
    console.error('[STORE-CLIENT] Network or parsing error fetching tests:', error);
    return []; // Return empty or throw
  }
}

// Helper function to save all tests via the API
async function _saveAllTests(tests: Test[]): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/tests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tests),
    });
    if (!response.ok) {
      console.error(`[STORE-CLIENT] Error saving tests: ${response.status} ${response.statusText}`);
      const errorBody = await response.text();
      console.error(`[STORE-CLIENT] Error body: ${errorBody}`);
      return false;
    }
    console.log('[STORE-CLIENT] Tests saved successfully via API.');
    return true;
  } catch (error) {
    console.error('[STORE-CLIENT] Network error saving tests:', error);
    return false;
  }
}

export async function getTestsByTeacher(teacherId: string): Promise<Test[]> {
  console.log(`[STORE-CLIENT] getTestsByTeacher called for teacherId: "${teacherId}"`);
  const allTests = await _fetchAllTests();
  const teacherTests = allTests.filter(test => test.teacherId === teacherId);
  console.log(`[STORE-CLIENT] Found ${teacherTests.length} tests for teacherId "${teacherId}".`);
  return teacherTests;
}

export async function getTestById(testId: string): Promise<Test | undefined> {
  console.log(`[STORE-CLIENT] getTestById called for ID: "${testId}"`);
  const allTests = await _fetchAllTests();
  const foundTest = allTests.find(test => test.id === testId);
  if (foundTest) {
    console.log(`[STORE-CLIENT] Test with ID "${testId}" FOUND.`);
  } else {
    console.warn(`[STORE-CLIENT] Test with ID "${testId}" NOT FOUND.`);
  }
  return foundTest;
}

export async function addTest(newTestData: Omit<Test, 'id' | 'createdAt' | 'updatedAt'>): Promise<Test | null> {
  console.log(`[STORE-CLIENT] addTest: Attempting to add test titled: "${newTestData.title}"`);
  const allTests = await _fetchAllTests();
  
  const newTest: Test = {
    ...newTestData,
    id: `test-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const updatedTests = [...allTests, newTest];
  const success = await _saveAllTests(updatedTests);

  if (success) {
    console.log(`[STORE-CLIENT] SUCCESS: Test ID ${newTest.id} added and saved via API.`);
    return newTest;
  } else {
    console.error(`[STORE-CLIENT] FAILURE: Test ID ${newTest.id} could not be saved via API.`);
    return null;
  }
}

export async function updateTest(testId: string, updatedTestPartialData: Partial<Omit<Test, 'id' | 'teacherId' | 'createdAt'>>): Promise<Test | undefined> {
  console.log(`[STORE-CLIENT] updateTest: Attempting to update test ID: "${testId}"`);
  const allTests = await _fetchAllTests();
  const testIndex = allTests.findIndex(test => test.id === testId);

  if (testIndex === -1) {
    console.warn(`[STORE-CLIENT] updateTest: Test with ID "${testId}" NOT FOUND for update.`);
    return undefined;
  }
  
  const updatedTest: Test = {
    ...allTests[testIndex],
    ...updatedTestPartialData,
    updatedAt: new Date(),
  };
  
  allTests[testIndex] = updatedTest;
  const success = await _saveAllTests(allTests);

  if (success) {
    console.log(`[STORE-CLIENT] Test ID "${updatedTest.id}" updated and saved successfully via API.`);
    return updatedTest;
  } else {
    console.error(`[STORE-CLIENT] FAILURE: Test ID ${updatedTest.id} could not be updated via API.`);
    return undefined; // Or return the old test data if partial update is not desired on failure
  }
}

export async function deleteTest(testId: string): Promise<boolean> {
  console.log(`[STORE-CLIENT] deleteTest: Attempting to delete test ID: "${testId}"`);
  let allTests = await _fetchAllTests();
  const initialLength = allTests.length;
  
  allTests = allTests.filter(test => test.id !== testId);

  if (allTests.length < initialLength) {
    const success = await _saveAllTests(allTests);
    if (success) {
      console.log(`[STORE-CLIENT] Test with ID "${testId}" deleted and saved successfully via API.`);
      return true;
    } else {
      console.error(`[STORE-CLIENT] FAILURE: Could not save DB after deleting test ID "${testId}".`);
      return false;
    }
  } else {
    console.warn(`[STORE-CLIENT] deleteTest: Test with ID "${testId}" NOT FOUND for deletion.`);
    return false;
  }
}
