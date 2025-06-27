
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import type { Test, TestAttempt } from '@/lib/types';

const TESTS_DB_PATH = path.join(process.cwd(), 'local_test_db.json');
const ATTEMPTS_DB_PATH = path.join(process.cwd(), 'test_attempts.json');

// Helper to read a JSON file and return its content or a default value
function readJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      if (fileContent.trim() === "") return defaultValue;
      return JSON.parse(fileContent) as T;
    }
  } catch (error) {
    console.error(`[API-CLEAR-DATA] Error reading file ${filePath}:`, error);
  }
  return defaultValue;
}

// Helper to write data to a JSON file
function writeJsonFile(filePath: string, data: any): boolean {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error(`[API-CLEAR-DATA] Error writing to file ${filePath}:`, error);
    return false;
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const { teacherId } = req.body;

  if (!teacherId || typeof teacherId !== 'string') {
    return res.status(400).json({ message: 'Teacher ID is required.' });
  }

  try {
    // Read current databases
    const allTests: Test[] = readJsonFile<Test[]>(TESTS_DB_PATH, []);
    const allAttempts: TestAttempt[] = readJsonFile<TestAttempt[]>(ATTEMPTS_DB_PATH, []);

    // Identify tests created by the specified teacher
    const testIdsToDelete = new Set(
      allTests.filter(test => test.teacherId === teacherId).map(test => test.id)
    );

    if (testIdsToDelete.size === 0) {
      return res.status(200).json({ message: 'No tests found for this teacher to delete.' });
    }

    // Filter out the tests belonging to the teacher
    const updatedTests = allTests.filter(test => test.teacherId !== teacherId);

    // Filter out the attempts related to the deleted tests
    const updatedAttempts = allAttempts.filter(attempt => !testIdsToDelete.has(attempt.testId));

    // Write the updated data back to the files
    const testsWritten = writeJsonFile(TESTS_DB_PATH, updatedTests);
    const attemptsWritten = writeJsonFile(ATTEMPTS_DB_PATH, updatedAttempts);

    if (testsWritten && attemptsWritten) {
      res.status(200).json({ message: `Successfully cleared ${testIdsToDelete.size} tests and their associated attempts.` });
    } else {
      // This case indicates a server-side file writing issue.
      throw new Error('Failed to write updated data to the database files.');
    }
  } catch (error: any) {
    console.error('[API-CLEAR-DATA] Critical error during data clearing process:', error);
    res.status(500).json({ message: 'An internal server error occurred while clearing data.', error: error.message });
  }
}
