
import type { Test, Question } from './types';

const API_BASE_URL = '/api'; // Assuming your app runs at the root

// Helper function to fetch all tests from the API
async function _fetchAllTests(): Promise<Test[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/tests?cb=${new Date().getTime()}`, { cache: 'no-store' });
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
      deletedAt: test.deletedAt ? new Date(test.deletedAt) : undefined,
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

export async function getTestsByTeacher(teacherId: string, includeDeleted = false): Promise<Test[]> {
  console.log(`[STORE-CLIENT] getTestsByTeacher called for teacherId: "${teacherId}", includeDeleted: ${includeDeleted}`);
  const allTests = await _fetchAllTests();
  const teacherTests = allTests.filter(test => {
    const isOwner = test.teacherId === teacherId;
    if (includeDeleted) {
      return isOwner;
    }
    return isOwner && !test.deletedAt;
  });
  console.log(`[STORE-CLIENT] Found ${teacherTests.length} tests for teacherId "${teacherId}".`);
  return teacherTests;
}


export async function getTestById(testId: string): Promise<Test | undefined> {
  console.log(`[STORE-CLIENT] getTestById called for ID: "${testId}"`);
  const allTests = await _fetchAllTests();
  const foundTest = allTests.find(test => test.id === testId && !test.deletedAt);
  if (foundTest) {
    console.log(`[STORE-CLIENT] Test with ID "${testId}" FOUND.`);
  } else {
    console.warn(`[STORE-CLIENT] Test with ID "${testId}" NOT FOUND or is deleted.`);
  }
  return foundTest;
}

export async function addTest(newTestData: Omit<Test, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<Test | null> {
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
  console.log(`[STORE-CLIENT] deleteTest: Attempting to soft-delete test ID: "${testId}"`);
  let allTests = await _fetchAllTests();
  const testIndex = allTests.findIndex(test => test.id === testId);

  if (testIndex !== -1) {
    // Soft delete by adding a 'deletedAt' timestamp
    allTests[testIndex] = {
      ...allTests[testIndex],
      deletedAt: new Date(),
    };
    
    const success = await _saveAllTests(allTests);
    if (success) {
      console.log(`[STORE-CLIENT] Test with ID "${testId}" soft-deleted and saved successfully via API.`);
      return true;
    } else {
      console.error(`[STORE-CLIENT] FAILURE: Could not save DB after soft-deleting test ID "${testId}".`);
      return false;
    }
  } else {
    console.warn(`[STORE-CLIENT] deleteTest: Test with ID "${testId}" NOT FOUND for deletion.`);
    return false;
  }
}
