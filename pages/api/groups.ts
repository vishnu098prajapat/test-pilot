
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import type { Group } from '@/lib/types';

const GROUPS_DB_FILE_PATH = path.join(process.cwd(), 'groups_db.json');

function readGroupsDb(): Group[] {
  try {
    if (fs.existsSync(GROUPS_DB_FILE_PATH)) {
      const fileContent = fs.readFileSync(GROUPS_DB_FILE_PATH, 'utf-8');
      if (fileContent.trim() === "") {
        fs.writeFileSync(GROUPS_DB_FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
        return [];
      }
      const data = JSON.parse(fileContent);
      // Ensure dates are parsed correctly
      return (Array.isArray(data) ? data : []).map((group: any) => ({
        ...group,
        createdAt: new Date(group.createdAt),
      }));
    }
  } catch (error) {
    console.error('[API-GROUPS-DB] Error reading or parsing DB file:', error);
  }
  // If file doesn't exist or error, initialize with empty array
  fs.writeFileSync(GROUPS_DB_FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
  return [];
}

function writeGroupsDb(data: Group[]): boolean {
  try {
    fs.writeFileSync(GROUPS_DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`[API-GROUPS-DB] Group data successfully written. Total groups: ${data.length}`);
    return true;
  } catch (error) {
    console.error('[API-GROUPS-DB] Error writing to DB file:', error);
    return false;
  }
}

// Placeholder for generating a unique group code
function generateGroupCode(length: number = 6): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  // In a real app, you'd check for uniqueness against existing codes here
  return result;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // TODO: Implement API logic for GET, POST, PUT, DELETE for groups
  // Example: Create group, join group, get teacher's groups, etc.

  if (req.method === 'GET') {
    // Example: Fetch groups (could be filtered by teacherId or studentIdentifier later)
    try {
      const allGroups = readGroupsDb();
      // Add filtering logic based on query params if needed
      // For example: if (req.query.teacherId) { ... }
      res.status(200).json(allGroups);
    } catch (error) {
      console.error('[API-GROUPS-DB] Failed to read data on GET:', error);
      res.status(500).json({ error: 'Failed to read groups data' });
    }
  } else if (req.method === 'POST') {
    // Example: Create a new group (this is a simplified example)
    try {
      const { name, teacherId } = req.body;
      if (!name || !teacherId) {
        return res.status(400).json({ error: 'Group name and teacherId are required.' });
      }

      const allGroups = readGroupsDb();
      let newGroupCode = generateGroupCode();
      // Ensure group code is unique (simple retry mechanism)
      while (allGroups.some(group => group.groupCode === newGroupCode)) {
        newGroupCode = generateGroupCode();
      }
      
      const newGroup: Group = {
        id: `group-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name,
        teacherId,
        groupCode: newGroupCode,
        studentIdentifiers: [],
        createdAt: new Date(),
      };

      allGroups.push(newGroup);
      const success = writeGroupsDb(allGroups);

      if (success) {
        res.status(201).json({ message: 'Group created successfully', group: newGroup });
      } else {
        res.status(500).json({ error: 'Failed to write group to database' });
      }
    } catch (error) {
      console.error('[API-GROUPS-DB] Failed to process POST request:', error);
      res.status(500).json({ error: 'Internal server error while creating group' });
    }
  }
  
  else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']); // Adjust as you add more methods
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
