
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import type { TestAttempt } from '@/lib/types';

const ATTEMPTS_DB_FILE_PATH = path.join(process.cwd(), 'test_attempts.json');

function readAttemptsDb(): TestAttempt[] {
  try {
    if (fs.existsSync(ATTEMPTS_DB_FILE_PATH)) {
      const fileContent = fs.readFileSync(ATTEMPTS_DB_FILE_PATH, 'utf-8');
      if (fileContent.trim() === "") {
        return [];
      }
      const data = JSON.parse(fileContent);
      return Array.isArray(data) ? data : [];
    }
  } catch (error) {
    console.error('[API-ATTEMPTS-DB] Error reading or parsing DB file:', error);
  }
  fs.writeFileSync(ATTEMPTS_DB_FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
  return [];
}

function writeAttemptsDb(data: TestAttempt[]): boolean {
  try {
    fs.writeFileSync(ATTEMPTS_DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`[API-ATTEMPTS-DB] Data successfully written. Total attempts: ${data.length}`);
    return true;
  } catch (error) {
    console.error('[API-ATTEMPTS-DB] Error writing to DB file:', error);
    return false;
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const newAttemptData: Omit<TestAttempt, 'id' | 'submittedAt'> = req.body;

      if (!newAttemptData.testId || !newAttemptData.studentIdentifier || !newAttemptData.answers) {
        return res.status(400).json({ error: 'Invalid attempt data. Missing required fields.' });
      }

      const attemptWithDetails: TestAttempt = {
        ...newAttemptData,
        id: `attempt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        submittedAt: new Date().toISOString(),
        ipAddress: newAttemptData.ipAddress, // Ensure ipAddress is included
      };

      const allAttempts = readAttemptsDb();
      allAttempts.push(attemptWithDetails);
      const success = writeAttemptsDb(allAttempts);

      if (success) {
        res.status(201).json({ message: 'Attempt recorded successfully', attemptId: attemptWithDetails.id });
      } else {
        res.status(500).json({ error: 'Failed to write attempt to database' });
      }
    } catch (error) {
      console.error('[API-ATTEMPTS-DB] Failed to process POST request:', error);
      res.status(500).json({ error: 'Internal server error while processing attempt' });
    }
  } else if (req.method === 'GET') {
    try {
      const { testId, ipAddress } = req.query;
      let allAttempts = readAttemptsDb();

      if (testId && typeof testId === 'string') {
        allAttempts = allAttempts.filter(attempt => attempt.testId === testId);
      }
      
      // New filter for specific IP check if provided
      if (ipAddress && typeof ipAddress === 'string') {
        allAttempts = allAttempts.filter(attempt => attempt.ipAddress === ipAddress);
      }

      res.status(200).json(allAttempts);
    } catch (error) {
      console.error('[API-ATTEMPTS-DB] Failed to read data on GET:', error);
      res.status(500).json({ error: 'Failed to read attempts data' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
