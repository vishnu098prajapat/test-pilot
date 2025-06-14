
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import type { User } from '@/lib/types';

const MOCK_USERS_DB_FILE_PATH = path.join(process.cwd(), 'mock_users.json');

function generateDisplayNameFromEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const namePart = email.split('@')[0];
  return namePart
    .replace(/[._-]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      if (fs.existsSync(MOCK_USERS_DB_FILE_PATH)) {
        const fileContent = fs.readFileSync(MOCK_USERS_DB_FILE_PATH, 'utf-8');
        if (fileContent.trim() === "") {
          return res.status(200).json([]);
        }
        const users: User[] = JSON.parse(fileContent);
        const usersWithDisplayNames = users.map(user => ({
          ...user,
          displayName: user.displayName || generateDisplayNameFromEmail(user.email)
        }));
        return res.status(200).json(usersWithDisplayNames);
      } else {
        return res.status(200).json([]); // No users file, return empty
      }
    } catch (error) {
      console.error('[API-MOCK-USERS] Error reading or parsing users DB file:', error);
      return res.status(500).json({ error: 'Failed to read user data' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
