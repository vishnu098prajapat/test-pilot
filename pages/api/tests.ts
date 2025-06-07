
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import type { Test } from '@/lib/types'; // Assuming Test type is correctly defined

const DB_FILE_PATH = path.join(process.cwd(), 'local_test_db.json');

// Initial data if DB file doesn't exist - this was previously in store.ts
const initialMockTests: Test[] = [
  {
    id: 'test1',
    title: 'Basic Algebra Quiz',
    subject: 'Mathematics',
    duration: 30,
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
    attemptsAllowed: 0,
    randomizeQuestions: true,
    enableTabSwitchDetection: true,
    enableCopyPasteDisable: false,
    enforceFullScreen: true,
  },
];

function readDb(): Test[] {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const fileContent = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const data = JSON.parse(fileContent);
      return data.map((test: any) => ({ // Parse dates from string
        ...test,
        createdAt: new Date(test.createdAt),
        updatedAt: new Date(test.updatedAt),
      }));
    }
  } catch (error) {
    console.error('[API-DB] Error reading or parsing DB file:', error);
  }
  console.log('[API-DB] DB file not found or error reading. Initializing with mock data and creating file.');
  fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initialMockTests, null, 2), 'utf-8');
  return initialMockTests;
}

function writeDb(data: Test[]): void {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`[API-DB] Data successfully written to ${DB_FILE_PATH}. Total tests: ${data.length}`);
  } catch (error) {
    console.error('[API-DB] Error writing to DB file:', error);
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const data = readDb();
      res.status(200).json(data);
    } catch (error) {
      console.error('[API-DB] Failed to read data on GET:', error);
      res.status(500).json({ error: 'Failed to read data' });
    }
  } else if (req.method === 'POST') {
    try {
      const newData: Test[] = req.body;
      if (!Array.isArray(newData)) {
        return res.status(400).json({ error: 'Invalid data format. Expected an array of tests.' });
      }
      writeDb(newData);
      res.status(201).json({ message: 'Data written successfully' });
    } catch (error) {
      console.error('[API-DB] Failed to write data on POST:', error);
      res.status(500).json({ error: 'Failed to write data' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
